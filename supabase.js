window.STACK_TOWER_CONFIG = {
  SUPABASE_URL: "https://mxhyvhgmjbdrdpoziikf.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_NXvIIwof-hDkDyRv1KtBDw_poptAkfs"
};
(() => {
  const cfg = window.STACK_TOWER_CONFIG || {};
  const configured = Boolean(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && !cfg.SUPABASE_URL.includes('YOUR-') && !cfg.SUPABASE_ANON_KEY.includes('YOUR_'));
  const client = configured && window.supabase ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;
  const SESSION_KEY = 'fault01_pin_session_v1';
  const validNick = n => n.length >= 1 && n.length <= 12 && /^[가-힣a-zA-Z0-9 _-]+$/.test(n);
  let currentUser = null;
  let currentNickname = '';
  async function rpc(name, params) {
    if (!client) throw new Error('Supabase 연결 설정을 확인해 주세요.');
    const { data, error } = await client.rpc(name, params);
    if (error) throw new Error(error.message);
    if (data && data.error) throw new Error(data.error);
    return data;
  }
  function setSession(result) {
    if (!result || !result.token || !result.player_id || !result.nickname) throw new Error('서버 응답이 올바르지 않습니다.');
    localStorage.setItem(SESSION_KEY, result.token);
    currentUser = { id: result.player_id };
    currentNickname = result.nickname;
    window.dispatchEvent(new Event('stack-auth-changed'));
  }
  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
    currentUser = null;
    currentNickname = '';
    window.dispatchEvent(new Event('stack-auth-changed'));
  }
  window.StackAPI = {
    isConfigured: !!client,
    get user() { return currentUser; },
    get nickname() { return currentNickname; },
    async initialize() {
      const token = localStorage.getItem(SESSION_KEY);
      if (!token || !client) return null;
      try {
        const user = await rpc('fault_pin_session', { p_token: token });
        if (user && user.player_id && user.nickname) {
          currentUser = { id: user.player_id };
          currentNickname = user.nickname;
        } else clearSession();
      } catch (e) { clearSession(); throw e; }
      window.dispatchEvent(new Event('stack-auth-changed'));
      return currentUser;
    },
    async signUp(nickname, pin) {
      nickname = String(nickname || '').trim();
      if (!validNick(nickname)) throw new Error('닉네임은 1~12자의 한글·영문·숫자·공백·_·-만 가능합니다.');
      if (!/^[0-9]{6}$/.test(pin)) throw new Error('PIN은 숫자 6자리여야 합니다.');
      setSession(await rpc('fault_pin_register', { p_nickname: nickname, p_pin: pin }));
      return { needsConfirmation: false };
    },
    async signIn(nickname, pin) {
      nickname = String(nickname || '').trim();
      if (!validNick(nickname) || !/^[0-9]{6}$/.test(pin)) throw new Error('닉네임 또는 PIN 형식이 올바르지 않습니다.');
      setSession(await rpc('fault_pin_login', { p_nickname: nickname, p_pin: pin }));
    },
    async signOut() {
      const token = localStorage.getItem(SESSION_KEY);
      if (token && client) await rpc('fault_pin_logout', { p_token: token });
      clearSession();
    },
    async getTopScores() {
      if (!client) throw new Error('Supabase 연결 설정을 확인해 주세요.');
      const {data,error} = await client.from('scores').select('nickname,score,created_at').order('score',{ascending:false}).order('created_at',{ascending:true}).limit(100);
      if (error) throw error;
      const best = new Map();
      for (const row of data || []) {
        const key = row.nickname.toLocaleLowerCase('ko-KR');
        if (!best.has(key) || row.score > best.get(key).score) best.set(key,row);
      }
      return [...best.values()].sort((a,b)=>b.score-a.score || new Date(a.created_at)-new Date(b.created_at)).slice(0,10);
    },
    async submitScore(_nickname, score, runToken) {
      const token = localStorage.getItem(SESSION_KEY);
      if (!token || !currentUser) throw new Error('로그인 후 등록할 수 있습니다.');
      if (!Number.isSafeInteger(score) || score < 1 || score > 10000) throw new Error('점수가 올바르지 않습니다.');
      if (!runToken || typeof runToken !== 'string') throw new Error('게임 실행 기록이 없습니다.');
      return await rpc('fault_pin_submit_score', { p_token: token, p_score: score, p_run_token: runToken });
    }
  };
})();
