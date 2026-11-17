(function(){
"use strict";
var $=function(i){return document.getElementById(i)||document.createElement("div")},Q=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
$("yr").textContent=new Date().getFullYear();

var stops={};
function info(){
 var d=window.devicePixelRatio||1,w=Math.round(screen.width*d),h=Math.round(screen.height*d);
 function g(a,b){return b?g(b,a%b):a}var c=g(screen.width,screen.height);
 $("sRes").textContent=w+"\u00d7"+h;$("sVp").textContent=innerWidth+"\u00d7"+innerHeight;
 $("sAr").textContent=(screen.width/c)+":"+(screen.height/c);$("sCd").textContent=screen.colorDepth+"-bit / "+d+"x";
}
addEventListener("resize",info);

/* 1. Screen test */
var BG=["#f00","#0f0","#00f","#fff","#000","#ff0","#0ff","#f0f","linear-gradient(90deg,#000,#fff)","linear-gradient(90deg,#000,#f00)","linear-gradient(90deg,#000,#0f0)","linear-gradient(90deg,#000,#00f)"],ci=0,fs=$("fs");
function paint(){fs.style.background=BG[ci]}
function openFs(i){ci=i;paint();fs.classList.add("on");var el=fs.firstChild;el.style.animation="none";void el.offsetWidth;el.style.animation="";if(fs.requestFullscreen)fs.requestFullscreen().catch(function(){})}
function closeFs(){fs.classList.remove("on");if(document.fullscreenElement)document.exitFullscreen()}
function step(n){ci=(ci+n+BG.length)%BG.length;paint()}
$("bCol").onclick=function(){openFs(0)};$("bGrad").onclick=function(){openFs(8)};
fs.onclick=function(){step(1)};
document.addEventListener("fullscreenchange",function(){if(!document.fullscreenElement)fs.classList.remove("on")});
addEventListener("keydown",function(e){
 if(!fs.classList.contains("on"))return;
 if(e.key==="ArrowRight"||e.key==="ArrowDown"||e.key===" "){step(1);e.preventDefault()}
 else if(e.key==="ArrowLeft"||e.key==="ArrowUp"){step(-1);e.preventDefault()}
 else if(e.key==="Escape")closeFs();
},true);

/* 2. Hz test */
var raf=0,last=0,dl=[],lanes=Q(".lane u"),lt=[0,0,0];
function hzTick(t){
 if(last){dl.push(t-last);if(dl.length>120)dl.shift();
  if(dl.length>10){var s=dl.slice().sort(function(a,b){return a-b}),m=s[s.length>>1];
   $("hHz").textContent=Math.round(1000/m);$("hMs").textContent=m.toFixed(2);$("hMm").textContent=s[0].toFixed(1)+" / "+s[s.length-1].toFixed(1)}}
 last=t;
 var W=lanes[0].parentNode.clientWidth-44,x=(t*0.45)%(2*W);x=x>W?2*W-x:x;
 lanes.forEach(function(u,i){var f=+u.dataset.fps,iv=f?1000/f:0;
  if(!f||t-lt[i]>=iv){lt[i]=t;u.style.transform="translateX("+x+"px)"}});
 raf=requestAnimationFrame(hzTick);
}
function hzStart(){if(!raf){last=0;dl=[];raf=requestAnimationFrame(hzTick)}}
function hzStop(){cancelAnimationFrame(raf);raf=0}

/* 3. Microphone */
var mS,mC,mAn,mRaf=0,mPk=-Infinity,mRecd,cv=$("mCv"),cx=cv.getContext("2d");
function db(v){return v>0?20*Math.log10(v):-Infinity}
function fmt(v){return isFinite(v)?v.toFixed(1):"-\u221e"}
function mDraw(){
 var f=new Uint8Array(mAn.frequencyBinCount),t=new Float32Array(mAn.fftSize);
 mAn.getByteFrequencyData(f);mAn.getFloatTimeDomainData(t);
 var p=0;for(var i=0;i<t.length;i++){var a=Math.abs(t[i]);if(a>p)p=a}
 var d=db(p);if(d>mPk)mPk=d;$("mDb").textContent=fmt(d);$("mPk").textContent=fmt(mPk);
 cx.clearRect(0,0,cv.width,cv.height);var n=64,bw=cv.width/n;
 for(var j=0;j<n;j++){var h=f[j*2]/255*cv.height;cx.fillStyle="hsl("+(190-f[j*2]/3)+",80%,55%)";cx.fillRect(j*bw+1,cv.height-h,bw-2,h)}
 mRaf=requestAnimationFrame(mDraw);
}
$("mStart").onclick=function(){
 if(mS)return;$("mMsg").textContent="";
 navigator.mediaDevices.getUserMedia({audio:true}).then(function(s){
  mS=s;mC=new (window.AudioContext||window.webkitAudioContext)();mAn=mC.createAnalyser();mAn.fftSize=2048;
  mC.createMediaStreamSource(s).connect(mAn);mPk=-Infinity;mDraw();
  $("mRec").disabled=$("mStop").disabled=false;
 }).catch(function(e){$("mMsg").textContent="Microphone unavailable: "+e.name+". Allow access in your browser settings."});
};
function mStop(){cancelAnimationFrame(mRaf);if(mS){mS.getTracks().forEach(function(t){t.stop()});mS=null}if(mC){mC.close();mC=null}$("mRec").disabled=$("mStop").disabled=true}
$("mStop").onclick=mStop;stops.mic=mStop;
$("mRec").onclick=function(){
 if(!mS||!window.MediaRecorder){$("mMsg").textContent="Recording is not supported in this browser.";return}
 var ch=[],r=new MediaRecorder(mS),b=$("mRec"),n=5;b.disabled=true;
 r.ondataavailable=function(e){ch.push(e.data)};
 r.onstop=function(){var a=$("mAud");a.src=URL.createObjectURL(new Blob(ch,{type:r.mimeType}));a.hidden=false;a.play().catch(function(){});b.disabled=false;b.textContent="Record & Playback 5s"};
 r.start();var iv=setInterval(function(){b.textContent="Recording... "+n--;if(n<0){clearInterval(iv);if(r.state!=="inactive")r.stop()}},1000);b.textContent="Recording... 5";
};

/* 4. Speaker */
var aC,aO,aG,aP,aIv,aTo;
function aStop(){
 clearInterval(aIv);clearTimeout(aTo);
 if(aO){try{aG.gain.setTargetAtTime(0,aC.currentTime,.02);aO.stop(aC.currentTime+.1)}catch(e){}aO=null}
 $("aInfo").textContent="Ready.";
}
function aPlay(m){
 aStop();aC=aC||new (window.AudioContext||window.webkitAudioContext)();if(aC.state==="suspended")aC.resume();
 aO=aC.createOscillator();aG=aC.createGain();aO.type="sine";aO.frequency.value=m==="W"?165:440;
 var vol=m==="W"?.8:.25,pan=m==="L"?-1:m==="R"?1:0;
 aG.gain.setValueAtTime(0,aC.currentTime);aG.gain.linearRampToValueAtTime(vol,aC.currentTime+.05);
 aO.connect(aG);
 if(aC.createStereoPanner){aP=aC.createStereoPanner();aP.pan.value=pan;aG.connect(aP);aP.connect(aC.destination)}else aG.connect(aC.destination);
 if(m==="S"&&aP){var t0=performance.now();aIv=setInterval(function(){aP.pan.value=Math.sin((performance.now()-t0)/700)},30)}
 aO.start();
 $("aInfo").textContent={L:"Playing 440 Hz on the left channel.",R:"Playing 440 Hz on the right channel.",S:"Sweeping sound from left to right.",W:"Playing 165 Hz. Auto-stops in 30 seconds."}[m];
 aTo=setTimeout(aStop,m==="W"?30000:8000);
}
Q("[data-a]").forEach(function(b){b.onclick=function(){aPlay(b.dataset.a)}});
$("aStop").onclick=aStop;stops.spk=aStop;

/* 5. Keyboard & mouse */
var rows=[
 [["Escape","Esc"],"F1","F2","F3","F4","F5","F6","F7","F8","F9","F10","F11","F12",["Delete","Del"]],
 [["Backquote","`"],"1","2","3","4","5","6","7","8","9","0",["Minus","-"],["Equal","="],["Backspace","Bksp",2]],
 [["Tab","Tab",1.5]].concat("QWERTYUIOP".split("")).concat([["BracketLeft","["],["BracketRight","]"],["Backslash","\\",1.5]]),
 [["CapsLock","Caps",1.8]].concat("ASDFGHJKL".split("")).concat([["Semicolon",";"],["Quote","'"],["Enter","Enter",2.2]]),
 [["ShiftLeft","Shift",2.3]].concat("ZXCVBNM".split("")).concat([["Comma",","],["Period","."],["Slash","/"],["ShiftRight","Shift",2.7]]),
 [["ControlLeft","Ctrl",1.3],["MetaLeft","Win",1.3],["AltLeft","Alt",1.3],["Space","Space",6],["AltRight","Alt"],["ControlRight","Ctrl",1.3],["ArrowLeft","\u2190"],["ArrowUp","\u2191"],["ArrowDown","\u2193"],["ArrowRight","\u2192"]]
],kbEl=$("kb"),keys={},used={},held={};
rows.forEach(function(r){var d=document.createElement("div");d.className="kr";
 r.forEach(function(k){var c,l,w=1;if(typeof k==="string"){l=k;c=/^\d+$/.test(k)?"Digit"+k:/^F\d/.test(k)?k:"Key"+k}else{c=k[0];l=k[1];w=k[2]||1}
  var e=document.createElement("div");e.className="k";e.textContent=l;e.style.flexGrow=w;keys[c]=e;d.appendChild(e)});kbEl.appendChild(d)});
function kStat(){$("kCnt").textContent=Object.keys(used).length;$("kHold").textContent=Object.keys(held).length}
addEventListener("keydown",function(e){
 if(fs.classList.contains("on")||!kbEl.isConnected)return;
 e.preventDefault();var el=keys[e.code];held[e.code]=1;used[e.code]=1;
 if(el){el.classList.add("d");el.classList.add("u")}
 $("kLast").textContent=(e.key===" "?"Space":e.key)+" / "+e.code;kStat();
});
addEventListener("keyup",function(e){if(!kbEl.isConnected)return;delete held[e.code];if(keys[e.code])keys[e.code].classList.remove("d");kStat()});
addEventListener("blur",function(){held={};Q(".k.d").forEach(function(k){k.classList.remove("d")});kStat()});
$("kReset").onclick=function(){used={};held={};Q(".k").forEach(function(k){k.className="k"});$("kLast").textContent="-";kStat()};
var pad=$("pad"),wh=0,cnt=0,pt=performance.now(),raw="onpointerrawupdate" in window;
pad.addEventListener("contextmenu",function(e){e.preventDefault()});
pad.addEventListener("mousedown",function(e){e.preventDefault();var b=pad.querySelector('[data-b="'+e.button+'"]');if(b){b.classList.add("d");b.classList.add("u")}});
addEventListener("mouseup",function(e){var b=pad.querySelector('[data-b="'+e.button+'"]');if(b)b.classList.remove("d")});
pad.addEventListener("auxclick",function(e){e.preventDefault()});
pad.addEventListener("wheel",function(e){e.preventDefault();wh+=e.deltaY>0?1:-1;$("pWh").textContent=(e.deltaY>0?"\u2193 ":"\u2191 ")+Math.abs(wh)},{passive:false});
pad.addEventListener(raw?"pointerrawupdate":"pointermove",function(e){
 cnt++;var n=performance.now();
 $("pXY").textContent=Math.round(e.offsetX)+", "+Math.round(e.offsetY);
 if(n-pt>=1000){$("pHz").textContent=Math.round(cnt*1000/(n-pt));cnt=0;pt=n}
});

/* 6. Webcam */
var cS,mir=true,v=$("cV");
v.style.transform="scaleX(-1)";
$("cStart").onclick=function(){
 if(cS)return;$("cMsg").textContent="";
 navigator.mediaDevices.getUserMedia({video:{width:{ideal:1920},height:{ideal:1080}}}).then(function(s){
  cS=s;v.srcObject=s;$("cSnap").disabled=$("cStop").disabled=false;
  v.onloadedmetadata=function(){var w=v.videoWidth,h=v.videoHeight,st=s.getVideoTracks()[0].getSettings();
   $("cRes").textContent=w+"\u00d7"+h;$("cQ").textContent=h>=2160?"4K":h>=1440?"1440p":h>=1080?"1080p Full HD":h>=720?"720p HD":h>=480?"480p SD":"Low";
   $("cFps").textContent=st.frameRate?Math.round(st.frameRate)+" fps":"-"};
 }).catch(function(e){$("cMsg").textContent="Camera unavailable: "+e.name+". Allow access in your browser settings."});
};
function cStop(){if(cS){cS.getTracks().forEach(function(t){t.stop()});cS=null;v.srcObject=null}$("cSnap").disabled=$("cStop").disabled=true}
$("cStop").onclick=cStop;stops.cam=cStop;
$("cMir").onclick=function(){mir=!mir;v.style.transform=mir?"scaleX(-1)":"";this.textContent="Mirror: "+(mir?"on":"off")};
$("cSnap").onclick=function(){
 var c=document.createElement("canvas");c.width=v.videoWidth;c.height=v.videoHeight;var x=c.getContext("2d");
 if(mir){x.translate(c.width,0);x.scale(-1,1)}x.drawImage(v,0,0);
 c.toBlob(function(b){var a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="snapshot-"+Date.now()+".png";a.click();setTimeout(function(){URL.revokeObjectURL(a.href)},1000)});
};

info();if($("hHz").isConnected)hzStart();
})();