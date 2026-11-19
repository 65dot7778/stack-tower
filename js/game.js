(() => {
  const canvas=document.getElementById("game-canvas"),ctx=canvas.getContext("2d");
  const overlay=document.getElementById("game-overlay"),result=document.getElementById("result-panel");
  const floorEl=document.getElementById("floor-count"),bestEl=document.getElementById("game-best"),perfectEl=document.getElementById("perfect-count"),liveEl=document.getElementById("live-score");
  const W=900,H=620,baseY=560,blockH=23,initialW=220,speedBase=3.1;
  let blocks=[],moving=null,score=0,perfect=0,best=Number(localStorage.getItem("stackTowerBest")||0),state="ready",raf=0,runToken="",finalScore=0,frame=0;
  bestEl.textContent=best;
  const armorColor="#242225";
  function reset(){
    cancelAnimationFrame(raf);blocks=[{x:(W-initialW)/2,y:baseY,w:initialW,color:armorColor}];
    moving=null;score=0;perfect=0;frame=0;finalScore=0;state="ready";runToken=crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random();
    floorEl.textContent="0";liveEl.textContent="0";perfectEl.textContent="0";bestEl.textContent=best;
    result.classList.add("hidden");overlay.classList.remove("hidden");
    overlay.querySelector("h3").innerHTML="PROTOCOL<br>READY.";
    overlay.querySelector("p").textContent="클릭 또는 스페이스바로 작전을 시작하세요.";
    draw();
  }
  function startNew(){reset();state="playing";overlay.classList.add("hidden");spawn();loop();}
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
    if(blocks.length>17){blocks.forEach(b=>b.y+=blockH);blocks[0].y=baseY;}
    spawn();
  }
  function gameOver(){
    state="over";moving=null;finalScore=score;cancelAnimationFrame(raf);
    if(score>best){best=score;localStorage.setItem("stackTowerBest",String(best));}
    bestEl.textContent=best;document.getElementById("final-score").textContent=score;
    overlay.classList.add("hidden");result.classList.remove("hidden");
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
     const visible=blocks.slice(-18);
     visible.forEach(b=>drawBlock(b.x,b.y,b.w,blockH,false));
     if(moving)drawBlock(moving.x,moving.y,moving.w,moving.h,true);
     ctx.fillStyle="#b9aeb0";ctx.font="13px monospace";ctx.textAlign="left";ctx.fillText("FAULT//01   /   FLOOR "+String(score).padStart(3,"0"),24,30);
     ctx.fillStyle="#d33943";ctx.fillRect(W-84,20,6,6);ctx.fillStyle="#b9aeb0";ctx.textAlign="right";ctx.fillText(state==="over"?"CASE CLOSED":"REC",W-24,30);
   }
   function armorPath(x,y,w,h){
     const cut=Math.min(9,w*.13,h*.32);
     ctx.beginPath();ctx.moveTo(x+cut,y);ctx.lineTo(x+w-cut,y);ctx.lineTo(x+w,y+cut);ctx.lineTo(x+w,y+h-cut);ctx.lineTo(x+w-cut,y+h);ctx.lineTo(x+cut,y+h);ctx.lineTo(x,y+h-cut);ctx.lineTo(x,y+cut);ctx.closePath();
   }
   function drawBlock(x,y,w,h,isMoving){
     if(w<=0)return;
     ctx.save();armorPath(x,y,w,h);ctx.clip();
     const metal=ctx.createLinearGradient(x,y,x,y+h);metal.addColorStop(0,isMoving?"#575052":"#474346");metal.addColorStop(.18,"#2b292c");metal.addColorStop(.75,"#161517");metal.addColorStop(1,"#09090a");ctx.fillStyle=metal;ctx.fillRect(x,y,w,h);
     ctx.fillStyle="#b8a6a733";ctx.fillRect(x+4,y+2,Math.max(0,w-8),2);
     ctx.fillStyle="#0b0a0c";ctx.fillRect(x,y+h-4,w,4);
     // diagonal armored seam
     if(w>30){ctx.strokeStyle="#67606588";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+w*.6,y+2);ctx.lineTo(x+w*.6-12,y+h-3);ctx.stroke();}
     // red hazard chevrons and signal bar; clipped for narrow trimmed blocks
     if(w>42){
       const sw=Math.min(58,w*.38);ctx.save();ctx.beginPath();ctx.rect(x+12,y+7,sw,Math.max(2,h-14));ctx.clip();ctx.fillStyle="#a92732";ctx.fillRect(x+12,y+7,sw,h-14);ctx.strokeStyle="#150d0f";ctx.lineWidth=5;
       for(let i=-h;i<sw+h;i+=13){ctx.beginPath();ctx.moveTo(x+12+i,y+h);ctx.lineTo(x+12+i+h*.65,y);ctx.stroke();}ctx.restore();
     }
     if(w>24){const ledW=Math.min(36,w*.22);ctx.fillStyle=isMoving?"#f04955":"#c62c38";ctx.shadowColor="#ed2e3d";ctx.shadowBlur=isMoving?17:8;ctx.fillRect(x+w-ledW-9,y+h-7,ledW,3);ctx.shadowBlur=0;}
     if(w>92){ctx.fillStyle="#777073";ctx.fillRect(x+w-10,y+5,2,2);ctx.fillRect(x+6,y+h-7,2,2);}
     ctx.restore();ctx.save();armorPath(x,y,w,h);ctx.strokeStyle=isMoving?"#d14b54":"#6d6467";ctx.lineWidth=1.2;ctx.stroke();ctx.restore();
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
