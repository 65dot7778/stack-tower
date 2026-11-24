(() => {
  const canvas=document.getElementById("game-canvas"),ctx=canvas.getContext("2d");
  const overlay=document.getElementById("game-overlay"),result=document.getElementById("result-panel");
  const floorEl=document.getElementById("floor-count"),bestEl=document.getElementById("game-best"),perfectEl=document.getElementById("perfect-count"),liveEl=document.getElementById("live-score");
  const W=900,H=620,baseY=548,blockH=43,initialW=370,speedBase=3.1;
  let blocks=[],moving=null,score=0,perfect=0,best=Number(localStorage.getItem("stackTowerBest")||0),state="ready",raf=0,runToken="",finalScore=0,frame=0;
  // Scares do not alter the score, block placement, or leaderboard.
  const scareScreen=document.getElementById('scare-screen');
  const scareImage=scareScreen.querySelector('img');
  const gameplayFaces=['assets/ghost-play-a.webp','assets/ghost-play-b.webp'];
  const endingFace='assets/ghost-ending.webp';
  [...gameplayFaces,endingFace].forEach(src=>{const img=new Image();img.src=src;});
  let scareTimer=null, endTimer=null, scareActive=false, scareUsed=false, scareAt=0, pauseUntil=0;
  function clearScareTimers(){
    clearTimeout(scareTimer);clearTimeout(endTimer);scareTimer=null;endTimer=null;
    scareActive=false;pauseUntil=0;scareScreen.classList.remove('active');scareScreen.removeAttribute('data-variant');
  }
  function showScare(duration=620,kind="play"){
    if(scareActive)return false;
    scareActive=true;
    const selected=kind==='ending'?endingFace:gameplayFaces[Math.floor(Math.random()*gameplayFaces.length)];
    scareImage.src=selected;
    scareScreen.dataset.variant=kind==='ending'?'ending':selected===gameplayFaces[1]?'side':'front';
    scareScreen.classList.add('active');
    if(state==='playing')pauseUntil=performance.now()+duration;
    scareTimer=setTimeout(()=>{scareScreen.classList.remove('active');scareActive=false;scareTimer=null;},duration);
    return true;
  }
  bestEl.textContent=best;
  const armorColor="#242225";
  const filmTexture=new Image();filmTexture.src="assets/film-horror.webp";
  filmTexture.addEventListener("load",()=>{if(state!=="playing")draw();});
  let lastFrameTime=null;
  function reset(){
    lastFrameTime=null;
    clearScareTimers();scareUsed=false;scareAt=0;cancelAnimationFrame(raf);blocks=[{x:(W-initialW)/2,y:baseY,w:initialW,color:armorColor}];
    moving=null;score=0;perfect=0;frame=0;finalScore=0;state="ready";runToken=(window.crypto && typeof window.crypto.randomUUID === "function") ? window.crypto.randomUUID() : String(Date.now())+Math.random();
    floorEl.textContent="0";liveEl.textContent="0";perfectEl.textContent="0";bestEl.textContent=best;
    result.classList.add("hidden");overlay.classList.remove("hidden");
    overlay.querySelector("h3").innerHTML="PROTOCOL<br>READY.";
    overlay.querySelector("p").textContent="클릭 또는 스페이스바로 작전을 시작하세요.";
    draw();
  }
  function startNew(){reset();state="playing";scareAt=performance.now()+5000+Math.random()*7000;overlay.classList.add("hidden");spawn();loop();}
  function spawn(){
    const top=blocks[blocks.length-1],dir=blocks.length%2?1:-1;
    const speed=Math.min(speedBase+blocks.length*.12,9.2);
    moving={x:dir===1?0:W-top.w,y:top.y-blockH,w:top.w,h:blockH,dir,speed,color:armorColor};
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
    if(blocks.length>10){blocks.forEach(b=>b.y+=blockH);blocks[0].y=baseY;}
    spawn();
  }
  function gameOver(){
    state="over";moving=null;finalScore=score;cancelAnimationFrame(raf);
    if(score>best){best=score;localStorage.setItem("stackTowerBest",String(best));}
    bestEl.textContent=best;document.getElementById("final-score").textContent=score;
    overlay.classList.add("hidden");result.classList.add("hidden");
    showScare(620,'ending');endTimer=setTimeout(()=>{if(state==="over")result.classList.remove("hidden");endTimer=null;},700);
    document.getElementById("submit-message").textContent="로그인 후 기록을 등록할 수 있습니다.";
    window.StackApp.updateHomeStats();draw();
  }
   function draw(){
     ctx.clearRect(0,0,W,H);
     const grad=ctx.createLinearGradient(0,0,0,H);grad.addColorStop(0,"#151013");grad.addColorStop(1,"#09090b");ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
     ctx.strokeStyle="#ffffff0a";ctx.lineWidth=1;
     for(let x=0;x<W;x+=45){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
     for(let y=0;y<H;y+=45){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
     ctx.strokeStyle="#8e242c66";ctx.beginPath();ctx.moveTo(W/2,0);ctx.lineTo(W/2,H);ctx.stroke();
     ctx.fillStyle="#ad2b35";ctx.fillRect(0,baseY+blockH,W,2);
     ctx.fillStyle="#a51a2b1c";ctx.fillRect(0,0,70,H);ctx.fillRect(W-70,0,70,H);
     const visible=blocks.slice(-12);
     visible.forEach(b=>drawBlock(b.x,b.y,b.w,blockH,false));
     if(moving)drawBlock(moving.x,moving.y,moving.w,moving.h,true);
     ctx.fillStyle="#b9aeb0";ctx.font="13px monospace";ctx.textAlign="left";ctx.fillText("FAULT//01  /  CAM 01  /  FLOOR "+String(score).padStart(3,"0"),24,30);
     ctx.fillStyle="#d33943";ctx.fillRect(W-84,20,6,6);ctx.fillStyle="#b9aeb0";ctx.textAlign="right";ctx.fillText(state==="over"?"CASE CLOSED":"REC",W-24,30);
   }
   // Every layer is the same damaged surveillance-film design.
   // The clipped artwork scales safely when the stack gets narrower.
   function filmPath(x,y,w,h){
     const cut=Math.min(5,w*.12);
     ctx.beginPath();ctx.moveTo(x+cut,y);ctx.lineTo(x+w-cut,y);
     ctx.lineTo(x+w,y+3);ctx.lineTo(x+w,y+h-3);
     ctx.lineTo(x+w-cut,y+h);ctx.lineTo(x+cut,y+h);
     ctx.lineTo(x,y+h-3);ctx.lineTo(x,y+3);ctx.closePath();
   }
   function drawBlock(x,y,w,h,isMoving){
     if(w<=0)return;
     ctx.save();
     ctx.shadowColor=isMoving?'#f0253b':'#ae1b2c';ctx.shadowBlur=isMoving?24:10;
     filmPath(x,y,w,h);ctx.fillStyle='#120d10';ctx.fill();ctx.shadowBlur=0;
     filmPath(x,y,w,h);ctx.clip();
     const bg=ctx.createLinearGradient(0,y,0,y+h);
     bg.addColorStop(0,'#49343a');bg.addColorStop(.2,'#120e13');bg.addColorStop(.75,'#25141b');bg.addColorStop(1,'#090709');
     ctx.fillStyle=bg;ctx.fillRect(x,y,w,h);
     if(filmTexture.complete && filmTexture.naturalWidth){
       // Repeat a detailed high-resolution film texture, clipped as the block narrows.
       ctx.globalAlpha=.94;
       const tile=350;
       for(let dx=0;dx<w;dx+=tile){ctx.drawImage(filmTexture,x+dx,y,tile,h);}
       ctx.globalAlpha=1;
     } else {
       ctx.fillStyle='#060506';for(let dx=6;dx<w-4;dx+=16){ctx.fillRect(x+dx,y+2,8,5);ctx.fillRect(x+dx,y+h-7,8,5);}
     }
     // Red recording lamp and edge illumination, identical on every block.
     ctx.fillStyle='#ff334a';ctx.shadowColor='#ed1731';ctx.shadowBlur=isMoving?19:10;
     ctx.fillRect(x+Math.max(5,w-38),y+h-7,Math.min(28,Math.max(0,w-8)),3);
     if(w>85){ctx.beginPath();ctx.arc(x+21,y+h*.52,3,0,Math.PI*2);ctx.fill();}
     ctx.shadowBlur=0;
     ctx.restore();
     ctx.save();filmPath(x,y,w,h);ctx.strokeStyle=isMoving?'#f05061':'#9d6570';ctx.lineWidth=1.6;ctx.stroke();ctx.restore();
   }
  function loop(){
    if(state!=="playing")return;
    const now=performance.now();
    const delta=lastFrameTime===null ? 0 : Math.min(Math.max(now-lastFrameTime,0),50)/(1000/60);
    lastFrameTime=now;
    if(!scareUsed && now>=scareAt && document.getElementById("game-view").classList.contains("active")){scareUsed=true;showScare(620,"play");}
    if(now<pauseUntil){draw();raf=requestAnimationFrame(loop);return;}
    if(moving){moving.x+=moving.dir*moving.speed*delta;if(moving.x+moving.w>=W){moving.x=W-moving.w;moving.dir=-1;}else if(moving.x<=0){moving.x=0;moving.dir=1;}}
    draw();raf=requestAnimationFrame(loop);
  }
  function action(){if(scareActive || performance.now()<pauseUntil)return;if(state==="ready"){startNew();return;}place();}
  // Start button is bound here, where startNew() is defined.
  // It no longer depends on app.js having initialized successfully.
  const overlayStart = document.getElementById("overlay-start");
  if (overlayStart) overlayStart.addEventListener("click", e => {
    e.preventDefault();
    e.stopPropagation();
    startNew();
  });
  canvas.addEventListener("pointerdown",e=>{e.preventDefault();action();});
  document.addEventListener("keydown",e=>{if(e.code==="Space"&&document.getElementById("game-view").classList.contains("active")){e.preventDefault();action();}});
  function startNewPublic(){startNew();}
  window.StackGame={startNew:startNewPublic,getFinalScore:()=>finalScore,getRunToken:()=>runToken};
  reset();
})();
