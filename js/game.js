(() => {
  const canvas=document.getElementById("game-canvas"),ctx=canvas.getContext("2d");
  const overlay=document.getElementById("game-overlay"),result=document.getElementById("result-panel");
  const floorEl=document.getElementById("floor-count"),bestEl=document.getElementById("game-best"),perfectEl=document.getElementById("perfect-count"),liveEl=document.getElementById("live-score");
  const W=900,H=620,baseY=560,blockH=23,initialW=220,speedBase=3.1;
  let blocks=[],moving=null,score=0,perfect=0,best=Number(localStorage.getItem("stackTowerBest")||0),state="ready",raf=0,runToken="",finalScore=0,frame=0;
  bestEl.textContent=best;
  const palette=["#7c9cff","#67d8ee","#9aabff","#8de0c1","#f5c86b","#b59cff"];
  function reset(){
    cancelAnimationFrame(raf);blocks=[{x:(W-initialW)/2,y:baseY,w:initialW,color:"#526bc8"}];
    moving=null;score=0;perfect=0;frame=0;finalScore=0;state="ready";runToken=crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random();
    floorEl.textContent="0";liveEl.textContent="0";perfectEl.textContent="0";bestEl.textContent=best;
    result.classList.add("hidden");overlay.classList.remove("hidden");
    overlay.querySelector("h3").innerHTML="첫 블록을<br>쌓아 보세요.";
    overlay.querySelector("p").textContent="클릭 또는 스페이스바를 눌러 시작!";
    draw();
  }
  function startNew(){reset();state="playing";overlay.classList.add("hidden");spawn();loop();}
  function spawn(){
    const top=blocks[blocks.length-1],dir=blocks.length%2?1:-1;
    const speed=Math.min(speedBase+blocks.length*.12,9.2);
    moving={x:dir===1?0:W-top.w,y:top.y-blockH,w:top.w,h:blockH,dir,speed,color:palette[blocks.length%palette.length]};
  }
  function place(){
    if(state!=="playing"||!moving)return;
    const top=blocks[blocks.length-1],left=Math.max(moving.x,top.x),right=Math.min(moving.x+moving.w,top.x+top.w),overlap=right-left;
    if(overlap<=0){gameOver();return;}
    const diff=Math.abs(moving.x-top.x);
    if(diff<=4){perfect++;perfectEl.textContent=perfect;}
    blocks.push({x:left,y:moving.y,w:overlap,color:moving.color});
    score++;floorEl.textContent=score;liveEl.textContent=score;
    if(overlap<top.w*.22){gameOver();return;}
    moving=null;
    if(blocks.length>17){blocks.forEach(b=>b.y+=blockH);blocks[0].y=baseY;}
    spawn();
  }
  function gameOver(){
    state="over";moving=null;finalScore=score;cancelAnimationFrame(raf);
    if(score>best){best=score;localStorage.setItem("stackTowerBest",String(best));}
    bestEl.textContent=best;document.getElementById("final-score").textContent=score;
    overlay.classList.add("hidden");result.classList.remove("hidden");
    document.getElementById("submit-message").textContent="닉네임을 입력하고 기록을 등록하세요.";
    window.StackApp.updateHomeStats();draw();
  }
  function draw(){
    ctx.clearRect(0,0,W,H);
    ctx.strokeStyle="#ffffff0b";ctx.lineWidth=1;
    for(let x=0;x<W;x+=45){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let y=0;y<H;y+=45){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
    ctx.fillStyle="#ffffff10";ctx.fillRect(0,baseY+blockH,W,2);
    const visible=blocks.slice(-18);
    visible.forEach((b,i)=>drawBlock(b.x,b.y,b.w,blockH,b.color));
    if(moving)drawBlock(moving.x,moving.y,moving.w,moving.h,moving.color);
    ctx.fillStyle="#91a0ba";ctx.font="14px monospace";ctx.textAlign="left";ctx.fillText("FLOOR "+score,24,30);
    if(state==="over"){ctx.fillStyle="#ffffff55";ctx.font="12px monospace";ctx.textAlign="right";ctx.fillText("RUN FINISHED",W-24,30);}
  }
  function drawBlock(x,y,w,h,color){
    ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=12;ctx.fillRect(x,y,w,h);ctx.shadowBlur=0;
    ctx.fillStyle="#ffffff35";ctx.fillRect(x,y,w,3);ctx.fillStyle="#00000018";ctx.fillRect(x,y+h-3,w,3);
  }
  function loop(){
    if(state!=="playing")return;
    if(moving){moving.x+=moving.dir*moving.speed;if(moving.x+moving.w>=W){moving.x=W-moving.w;moving.dir=-1;}else if(moving.x<=0){moving.x=0;moving.dir=1;}}
    draw();raf=requestAnimationFrame(loop);
  }
  function action(){if(state==="ready"){startNew();return;}place();}
  canvas.addEventListener("pointerdown",e=>{e.preventDefault();action();});
  document.addEventListener("keydown",e=>{if(e.code==="Space"&&document.getElementById("game-view").classList.contains("active")){e.preventDefault();action();}});
  function startNewPublic(){startNew();}
  window.StackGame={startNew:startNewPublic,getFinalScore:()=>finalScore,getRunToken:()=>runToken};
  reset();
})();
