(() => {
  const cfg = window.STACK_TOWER_CONFIG || {};
  const configured = cfg.SUPABASE_URL && !cfg.SUPABASE_URL.includes("YOUR-PROJECT")
    && cfg.SUPABASE_ANON_KEY && !cfg.SUPABASE_ANON_KEY.includes("YOUR_");
  let client = null;
  if (configured && window.supabase) {
    client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  }
  window.StackAPI = {
    isConfigured: !!client,
    async getTopScores() {
      if (!client) throw new Error("랭킹 서버 설정이 아직 완료되지 않았습니다.");
      const { data, error } = await client.from("scores")
        .select("nickname, score, created_at")
        .order("score", { ascending: false })
        .order("created_at", { ascending: true })
        .limit(100);
      if (error) throw error;
      const best = new Map();
      for (const row of data || []) {
        const key = row.nickname.toLocaleLowerCase("ko-KR");
        if (!best.has(key) || row.score > best.get(key).score) best.set(key, row);
      }
      return [...best.values()].sort((a,b) => b.score-a.score || new Date(a.created_at)-new Date(b.created_at)).slice(0,10);
    },
    async submitScore(nickname, score, runToken) {
      if (!client) throw new Error("랭킹 서버 설정이 아직 완료되지 않았습니다.");
      const { data, error } = await client.functions.invoke("submit-score", {
        body: { nickname, score, runToken }
      });
      if (error) throw error;
      if (!data || !data.ok) throw new Error(data?.message || "기록 등록에 실패했습니다.");
      return data;
    }
  };
})();
