(() => {
  const views = [...document.querySelectorAll(".view")];
  const showView = id => {
    views.forEach(v => v.classList.toggle("active", v.id === id));
    if (id === "ranking-view") loadRanking();
    if (id === "home-view") updateHomeStats();
    window.scrollTo({top:0,behavior:"smooth"});
  };
  document.querySelectorAll("[data-view]").forEach(el => el.addEventListener("click", () => showView(el.dataset.view)));
  document.getElementById("start-button").addEventListener("click", () => { showView("game-view"); window.StackGame.startNew(); });
  document.getElementById("tutorial-start").addEventListener("click", () => { showView("game-view"); window.StackGame.startNew(); });
  document.getElementById("retry-button").addEventListener("click", () => window.StackGame.startNew());
  document.getElementById("refresh-ranking").addEventListener("click", loadRanking);
  document.getElementById("submit-score").addEventListener("click", submitScore);
  document.getElementById("nickname").addEventListener("keydown", e => { if(e.key==="Enter") submitScore(); });
  const status = document.getElementById("connection-status");
  status.textContent = window.StackAPI.isConfigured ? "● 랭킹 서버 연결 설정 완료" : "○ 랭킹 서버 설정 전 — 게임은 로컬에서 플레이할 수 있어요.";
  const localBest = () => Number(localStorage.getItem("stackTowerBest") || 0);
  function updateHomeStats() {
    document.getElementById("home-best").textContent = localBest() || "—";
    loadLeader();
  }
  async function loadLeader() {
    const el=document.getElementById("home-leader");
    if(!window.StackAPI.isConfigured){el.textContent="—";return;}
    try { const rows=await window.StackAPI.getTopScores(); el.textContent=rows[0]?.score ?? "—"; }
    catch { el.textContent="—"; }
  }
  async function loadRanking() {
    const list=document.getElementById("ranking-list");
    if(!window.StackAPI.isConfigured) {
      list.innerHTML='<div class="empty-state">아직 랭킹 서버가 연결되지 않았습니다.<br>README의 Supabase 설정을 완료해 주세요.</div>'; return;
    }
    list.innerHTML='<div class="empty-state">랭킹을 불러오는 중...</div>';
    try {
      const rows=await window.StackAPI.getTopScores();
      if(!rows.length){list.innerHTML='<div class="empty-state">아직 등록된 기록이 없습니다. 첫 번째 기록의 주인공이 되어 보세요!</div>';return;}
      list.innerHTML=rows.map((r,i)=>`<div class="rank-row"><span class="rank-number">${String(i+1).padStart(2,"0")}</span><span class="rank-name">${escapeHTML(r.nickname)}</span><span class="rank-score">${Number(r.score).toLocaleString()} P</span></div>`).join("");
    } catch(e) { list.innerHTML=`<div class="empty-state">랭킹을 불러오지 못했습니다.<br>${escapeHTML(e.message)}</div>`; }
  }
  function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  async function submitScore() {
    const input=document.getElementById("nickname"), msg=document.getElementById("submit-message"), btn=document.getElementById("submit-score");
    const nickname=input.value.trim(), score=window.StackGame.getFinalScore(), token=window.StackGame.getRunToken();
    if(!nickname){msg.textContent="닉네임을 입력해 주세요.";input.focus();return;}
    if(nickname.length>12){msg.textContent="닉네임은 12자 이내로 입력해 주세요.";return;}
    if(!/^[가-힣a-zA-Z0-9 _-]+$/.test(nickname)){msg.textContent="한글, 영문, 숫자, 공백, _ - 만 사용할 수 있어요.";return;}
    if(!score){msg.textContent="등록할 점수가 없습니다.";return;}
    if(!window.StackAPI.isConfigured){msg.textContent="서버 설정이 완료되지 않았어요. README를 확인해 주세요.";return;}
    btn.disabled=true;msg.textContent="기록을 등록하고 있어요...";
    try {
      await window.StackAPI.submitScore(nickname,score,token);
      msg.textContent="기록 등록 완료! 랭킹에서 확인해 보세요.";
      localStorage.setItem("stackTowerNickname",nickname);
      loadLeader();
    } catch(e){msg.textContent="등록 실패: "+e.message;}
    finally{btn.disabled=false;}
  }
  window.StackApp={showView,updateHomeStats};
  updateHomeStats();
  const saved=localStorage.getItem("stackTowerNickname");
  if(saved)document.getElementById("nickname").value=saved;
})();
