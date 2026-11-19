
(() => {
  const cfg = window.STACK_TOWER_CONFIG || {};

  const configured =
    cfg.SUPABASE_URL &&
    !cfg.SUPABASE_URL.includes("YOUR-PROJECT") &&
    cfg.SUPABASE_ANON_KEY &&
    !cfg.SUPABASE_ANON_KEY.includes("YOUR_");

  const client = configured && window.supabase
    ? window.supabase.createClient(
        cfg.SUPABASE_URL,
        cfg.SUPABASE_ANON_KEY
      )
    : null;

  const SESSION_KEY = "stackTowerSession";

  function getSession() {
    try {
      const session = JSON.parse(
        localStorage.getItem(SESSION_KEY) || "null"
      );

      if (
        !session ||
        typeof session.token !== "string" ||
        !/^[a-f0-9]{64}$/.test(session.token) ||
        Date.now() >= session.expiresAt
      ) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }

      return session;
    } catch {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  }

  function saveSession(nickname, token) {
    const session = {
      nickname,
      token,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000
    };

    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify(session)
    );

    return session;
  }

  async function invoke(name, body) {
    if (!client) {
      throw new Error("랭킹 서버가 연결되지 않았습니다.");
    }

    const { data, error } = await client.functions.invoke(name, {
      body
    });

    if (error) {
      const response = error.context;

      if (response && typeof response.json === "function") {
        try {
          const details = await response.json();

          if (details?.message) {
            throw new Error(details.message);
          }
        } catch (parseError) {
          if (parseError instanceof Error &&
              parseError.message !== "Unexpected end of JSON input" &&
              !(parseError instanceof SyntaxError)) {
            throw parseError;
          }
        }
      }

      throw new Error(
        "서버 요청에 실패했습니다. Edge Function 설정을 확인해 주세요."
      );
    }

    if (!data?.ok) {
      throw new Error(
        data?.message || "요청 처리에 실패했습니다."
      );
    }

    return data;
  }

  window.StackAPI = {
    isConfigured: !!client,

    getSession,

    logout() {
      localStorage.removeItem(SESSION_KEY);
    },

    async registerPlayer(nickname, pin) {
      return invoke("register-player", { nickname, pin });
    },

    async loginPlayer(nickname, pin) {
      const data = await invoke("login-player", {
        nickname,
        pin
      });

      saveSession(data.nickname, data.token);
      return data;
    },

    async submitScore(nickname, score, runToken) {
      const session = getSession();

      if (!session) {
        throw new Error(
          "로그인이 필요합니다. 닉네임과 PIN을 입력해 주세요."
        );
      }

      return invoke("submit-score", {
        token: session.token,
        score,
        runToken
      });
    },

    async getTopScores() {
      if (!client) {
        throw new Error("랭킹 서버가 연결되지 않았습니다.");
      }

      const { data, error } = await client
        .from("scores")
        .select("nickname, score, created_at")
        .order("score", { ascending: false })
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) throw error;

      const best = new Map();

      for (const row of data || []) {
        const key = row.nickname.toLocaleLowerCase("ko-KR");

        if (
          !best.has(key) ||
          row.score > best.get(key).score
        ) {
          best.set(key, row);
        }
      }

      return [...best.values()]
        .sort(
          (a, b) =>
            b.score - a.score ||
            new Date(a.created_at) -
              new Date(b.created_at)
        )
        .slice(0, 10);
    }
  };
})();

