window.STACK_TOWER_CONFIG = {
  SUPABASE_URL: "https://mxhyvhgmjbdrdpoziikf.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_NXvIIwof-hDkDyRv1KtBDw_poptAkfs"
};
(() => {
  const cfg = window.STACK_TOWER_CONFIG || {};
  const configured = Boolean(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && !cfg.SUPABASE_URL.includes('YOUR-') && !cfg.SUPABASE_ANON_KEY.includes('YOUR_'));
  const client = configured && window.supabase ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;
  const cleanNick = s => String(s || '').trim();
  const validNick = n => n.length >= 1 && n.length <= 12 && /^[가-힣a-zA-Z0-9 _-]+$/.test(n);
  let currentUser = null;
  let currentNickname = '';
  async function syncUser() {
    if (!client) return null;
    const { data, error } = await client.auth.getUser();
    if (error) { currentUser = null; currentNickname = ''; return null; }
    currentUser = data.user || null;
    currentNickname = cleanNick(currentUser?.user_metadata?.nickname);
    return currentUser;
  }
  window.StackAPI = {
    isConfigured: !!client,
    get user() { return currentUser; },
    get nickname() { return currentNickname; },
    async initialize() {
      await syncUser();
      if (client) client.auth.onAuthStateChange((_event, session) => {
        currentUser = session?.user || null;
        currentNickname = cleanNick(currentUser?.user_metadata?.nickname);
        window.dispatchEvent(new Event('stack-auth-changed'));
      });
      return currentUser;
    },
    async signUp(email, password, nickname) {
      if (!client) throw new Error('Supabase 설정을 확인해 주세요.');
      if (!validNick(cleanNick(nickname))) throw new Error('닉네임은 1~12자의 한글·영문·숫자·공백·_·-만 가능합니다.');
      if (password.length < 8) throw new Error('비밀번호는 8자 이상으로 설정해 주세요.');
      const { data, error } = await client.auth.signUp({email: email.trim(), password, options: {data: {nickname: cleanNick(nickname)}}});
      if (error) throw error;
      await syncUser();
      return { needsConfirmation: !data.session };
    },
    async signIn(email, password) {
      if (!client) throw new Error('Supabase 설정을 확인해 주세요.');
      const { error } = await client.auth.signInWithPassword({email: email.trim(), password});
      if (error) throw error;
      await syncUser();
    },
    async signOut() {
      if (!client) return;
      const { error } = await client.auth.signOut();
      if (error) throw error;
      currentUser = null; currentNickname = '';
    },
    async getTopScores() {
      if (!client) throw new Error('Supabase 설정을 확인해 주세요.');
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
      if (!client) throw new Error('Supabase 설정을 확인해 주세요.');
      await syncUser();
      if (!currentUser) throw new Error('로그인 후 등록할 수 있습니다.');
      if (!validNick(currentNickname)) throw new Error('계정 닉네임이 올바르지 않습니다. 다시 회원가입해 주세요.');
      if (!Number.isSafeInteger(score) || score < 1 || score > 10000) throw new Error('등록할 점수가 올바르지 않습니다.');
      if (!runToken || typeof runToken !== 'string') throw new Error('게임 실행 기록이 없습니다. 새 게임을 시작해 주세요.');
      const {error} = await client.from('scores').insert({player_id: currentUser.id, nickname: currentNickname, score, run_token: runToken});
      if (error) throw error;
      return {ok:true};
    }
  };
})();
