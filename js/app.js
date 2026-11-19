
(() => {
  const views = [...document.querySelectorAll(".view")];

  const $ = id => document.getElementById(id);

  let accountMode = "login";

  const showView = id => {
    views.forEach(v =>
      v.classList.toggle("active", v.id === id)
    );

    if (id === "ranking-view") loadRanking();
    if (id === "home-view") updateHomeStats();

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  document.querySelectorAll("[data-view]").forEach(el =>
    el.addEventListener("click", () =>
      showView(el.dataset.view)
    )
  );

  $("start-button").addEventListener("click", () => {
    showView("game-view");
    window.StackGame.startNew();
  });

  $("tutorial-start").addEventListener("click", () => {
    showView("game-view");
    window.StackGame.startNew();
  });

  $("overlay-start").addEventListener(
    "click",
    () => window.StackGame.startNew()
  );

  $("retry-button").addEventListener(
    "click",
    () => window.StackGame.startNew()
  );

  $("refresh-ranking").addEventListener(
    "click",
    loadRanking
  );

  $("submit-score").addEventListener(
    "click",
    submitScore
  );

  $("login-tab").addEventListener(
    "click",
    () => setAccountMode("login")
  );

  $("register-tab").addEventListener(
    "click",
    () => setAccountMode("register")
  );

  $("account-submit").addEventListener(
    "click",
    submitAccount
  );

  $("logout-button").addEventListener(
    "click",
    logout
  );

  $("nickname").addEventListener("keydown", e => {
    if (e.key === "Enter") submitAccount();
  });

  $("player-pin").addEventListener("keydown", e => {
    if (e.key === "Enter") submitAccount();
  });

  const status = $("connection-status");

  status.textContent = window.StackAPI.isConfigured
    ? "● 랭킹 서버 연결 설정 완료"
    : "○ 랭킹 서버 설정 전 — 게임은 로컬에서 플레이할 수 있어요.";

  const localBest = () =>
    Number(localStorage.getItem("stackTowerBest") || 0);

  function escapeHTML(s) {
    return String(s).replace(
      /[&<>"']/g,
      c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[c]
    );
  }

  function updateHomeStats() {
    $("home-best").textContent = localBest() || "—";
    loadLeader();
  }

  async function loadLeader() {
    const el = $("home-leader");

    if (!window.StackAPI.isConfigured) {
      el.textContent = "—";
      return;
    }

    try {
      const rows = await window.StackAPI.getTopScores();
      el.textContent = rows[0]?.score ?? "—";
    } catch {
      el.textContent = "—";
    }
  }

  async function loadRanking() {
    const list = $("ranking-list");

    if (!window.StackAPI.isConfigured) {
      list.innerHTML =
        '<div class="empty-state">랭킹 서버가 연결되지 않았습니다.</div>';
      return;
    }

    list.innerHTML =
      '<div class="empty-state">랭킹을 불러오는 중...</div>';

    try {
      const rows = await window.StackAPI.getTopScores();

      if (!rows.length) {
        list.innerHTML =
          '<div class="empty-state">아직 등록된 기록이 없습니다.</div>';
        return;
      }

      list.innerHTML = rows.map((r, i) => `
        <div class="rank-row">
          <span class="rank-number">
            ${String(i + 1).padStart(2, "0")}
          </span>
          <span class="rank-name">
            ${escapeHTML(r.nickname)}
          </span>
          <span class="rank-score">
            ${Number(r.score).toLocaleString()} P
          </span>
        </div>
      `).join("");

    } catch (e) {
      list.innerHTML = `
        <div class="empty-state">
          랭킹을 불러오지 못했습니다.
          ${escapeHTML(e.message)}
        </div>
      `;
    }
  }

  function setAccountMode(mode) {
    accountMode = mode;

    $("login-tab").classList.toggle(
      "active",
      mode === "login"
    );

    $("register-tab").classList.toggle(
      "active",
      mode === "register"
    );

    $("account-submit").textContent =
      mode === "login" ? "로그인" : "닉네임 등록";

    $("account-status").textContent =
      mode === "login"
        ? "이미 등록한 닉네임과 PIN을 입력하세요."
        : "새 닉네임과 숫자 6자리 PIN을 등록하세요.";
  }

  function updateAccountUI() {
    const session = window.StackAPI.getSession();

    $("account-form").classList.toggle(
      "hidden",
      !!session
    );

    $("logged-in-panel").classList.toggle(
      "hidden",
      !session
    );

    $("submit-score").disabled = !session;

    if (session) {
      $("logged-in-nickname").textContent =
        session.nickname;

      $("account-status").textContent =
        "로그인 상태입니다. 기록을 등록할 수 있어요.";
    } else {
      $("account-status").textContent =
        "닉네임을 등록하거나 로그인해 주세요.";
    }
  }

  async function submitAccount() {
    const nickname = $("nickname").value.trim();
    const pin = $("player-pin").value;
    const btn = $("account-submit");
    const msg = $("account-status");

    if (!/^[가-힣a-zA-Z0-9 _-]{1,12}$/.test(nickname)) {
      msg.textContent =
        "닉네임은 1~12자의 한글, 영문, 숫자, 공백, _ - 만 사용할 수 있어요.";
      return;
    }

    if (!/^\d{6}$/.test(pin)) {
      msg.textContent =
        "PIN은 숫자 6자리로 입력해 주세요.";
      return;
    }

    btn.disabled = true;
    msg.textContent = "서버에 요청하는 중...";

    try {
      if (accountMode === "register") {
        await window.StackAPI.registerPlayer(
          nickname,
          pin
        );

        await window.StackAPI.loginPlayer(
          nickname,
          pin
        );
      } else {
        await window.StackAPI.loginPlayer(
          nickname,
          pin
        );
      }

      localStorage.setItem(
        "stackTowerNickname",
        nickname
      );

      $("player-pin").value = "";
      updateAccountUI();

      $("submit-message").textContent =
        "로그인 완료! 이제 점수를 등록할 수 있어요.";

    } catch (e) {
      msg.textContent = e.message;
    } finally {
      btn.disabled = false;
    }
  }

  function logout() {
    window.StackAPI.logout();

    $("player-pin").value = "";
    $("submit-message").textContent =
      "로그아웃되었습니다. 다시 로그인해 주세요.";

    setAccountMode("login");
    updateAccountUI();
  }

  async function submitScore() {
    const msg = $("submit-message");
    const btn = $("submit-score");

    const session = window.StackAPI.getSession();

    if (!session) {
      msg.textContent =
        "먼저 닉네임과 PIN으로 로그인해 주세요.";
      updateAccountUI();
      return;
    }

    const score = window.StackGame.getFinalScore();
    const token = window.StackGame.getRunToken();

    if (!score) {
      msg.textContent =
        "등록할 점수가 없습니다.";
      return;
    }

    if (!window.StackAPI.isConfigured) {
      msg.textContent =
        "랭킹 서버가 연결되지 않았습니다.";
      return;
    }

    btn.disabled = true;
    msg.textContent = "기록을 등록하는 중...";

    try {
      await window.StackAPI.submitScore(
        session.nickname,
        score,
        token
      );

      msg.textContent =
        "기록 등록 완료! 랭킹에서 확인해 보세요.";

      loadLeader();

    } catch (e) {
      msg.textContent = "등록 실패: " + e.message;
    } finally {
      updateAccountUI();
    }
  }

  window.StackApp = {
    showView,
    updateHomeStats,
    updateAccountUI
  };

  const saved = localStorage.getItem(
    "stackTowerNickname"
  );

  if (saved) $("nickname").value = saved;

  setAccountMode("login");
  updateAccountUI();
  updateHomeStats();
})();
