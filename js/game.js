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
     ctx.shadowColor=isMoving?'#ec2539':'#8e1724';ctx.shadowBlur=isMoving?18:7;
     filmPath(x,y,w,h);ctx.fillStyle='#0b080a';ctx.fill();ctx.shadowBlur=0;
     filmPath(x,y,w,h);ctx.clip();
     const grad=ctx.createLinearGradient(x,y,x,y+h);
     grad.addColorStop(0,'#2c2025');grad.addColorStop(.19,'#100d10');grad.addColorStop(.51,'#3c292d');grad.addColorStop(.83,'#10090d');grad.addColorStop(1,'#090609');
     ctx.fillStyle=grad;ctx.fillRect(x,y,w,h);
     // Old analog film frames, repeated rather than stretched.
     ctx.strokeStyle='#9b7e8066';ctx.lineWidth=.7;
     for(let i=0;i<w;i+=31){ctx.strokeRect(x+i+2,y+5,28,h-10);}
     // Film perforations along both edges.
     ctx.fillStyle='#040305';
     for(let i=7;i<w-2;i+=11){ctx.fillRect(x+i,y+1,5,3);ctx.fillRect(x+i,y+h-4,5,3);}
     ctx.fillStyle='#bd969655';
     for(let i=7;i<w-2;i+=11){ctx.fillRect(x+i,y+1,5,.6);}
     // A repeating ghostly surveillance shadow in each frame.
     for(let i=0;i<w;i+=31){
       const cx=x+i+17,cy=y+h*.51;
       ctx.fillStyle='#a59c9c24';ctx.beginPath();ctx.ellipse(cx,cy-2,3,4,0,0,Math.PI*2);ctx.fill();
       ctx.beginPath();ctx.ellipse(cx,cy+5,6,5,0,Math.PI,Math.PI*2);ctx.fill();
     }
     // Fractured-glass scratches, repeatable across cropped block widths.
     ctx.strokeStyle='#d4b4b477';ctx.lineWidth=.7;
     for(let i=23;i<w;i+=66){
       const sx=x+i,sy=y+Math.round(h*.47);
       ctx.beginPath();ctx.moveTo(sx-13,y+2);ctx.lineTo(sx,sy);ctx.lineTo(sx+12,y+h-2);ctx.stroke();
       ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx+14,y+3);ctx.moveTo(sx,sy);ctx.lineTo(sx-9,y+h-3);ctx.stroke();
     }
     // Dark crimson stains; no random flicker, so the texture stays stable.
     ctx.fillStyle='#84162180';
     for(let i=10;i<w;i+=53){
       ctx.beginPath();ctx.ellipse(x+i,y+8,8,3.1,-.3,0,Math.PI*2);ctx.fill();
       ctx.fillRect(x+i+2,y+9,1.8,Math.min(7,h-11));
     }
     // REC signal and light strip.
     if(w>38){
       ctx.fillStyle='#ed3545';ctx.shadowColor='#e51e35';ctx.shadowBlur=isMoving?12:5;
       ctx.fillRect(x+w-25,y+h-7,17,2);ctx.shadowBlur=0;
       ctx.beginPath();ctx.arc(x+12,y+h*.5,2,0,Math.PI*2);ctx.fill();
     }
     if(w>85){ctx.font='7px monospace';ctx.fillStyle='#e1aeb0';ctx.textAlign='left';ctx.fillText('REC 01',x+19,y+Math.min(14,h-7));}
     ctx.restore();
     ctx.save();filmPath(x,y,w,h);ctx.strokeStyle=isMoving?'#ed4756':'#806266';ctx.lineWidth=1.1;ctx.stroke();ctx.restore();
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
