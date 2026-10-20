import {api} from './api';

/* ---------- Suara (TTS) ----------
 Urutan: Piper lokal di server -> suara Bahasa Indonesia bawaan browser -> suara browser apa pun dengan lang id-ID.
 Mengembalikan Promise yang selesai setelah ucapan berakhir agar game bisa menunggu. */
let activeAudio=null;
const audioCache=new Map();
const idVoice=()=>{const voices=window.speechSynthesis?.getVoices()||[];return voices.find(v=>/^id([-_]|$)/i.test(v.lang)&&/natural|online|google/i.test(v.name))||voices.find(v=>/^id([-_]|$)/i.test(v.lang))||null;};
if(window.speechSynthesis)window.speechSynthesis.onvoiceschanged=()=>idVoice();
function browserSpeak(text,rate=.85){return new Promise((resolve,reject)=>{const synth=window.speechSynthesis;if(!synth){reject(new Error('Browser tidak mendukung suara.'));return;}synth.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='id-ID';u.rate=rate;const v=idVoice();if(v)u.voice=v;u.onend=()=>resolve();u.onerror=e=>e.error==='interrupted'||e.error==='canceled'?resolve():reject(new Error('Suara browser gagal diputar.'));synth.speak(u);});}
function playUrl(url){return new Promise((resolve,reject)=>{const audio=new Audio(url);activeAudio=audio;audio.onended=()=>{if(activeAudio===audio)activeAudio=null;resolve();};audio.onerror=()=>reject(new Error('Audio gagal diputar.'));audio.play().catch(reject);});}
export async function speak(text){
 stopSpeech();const key=text.trim().toLowerCase();
 try{let url=audioCache.get(key);if(!url){const r=await api.get('/speech/synthesize',{params:{text},responseType:'blob'});url=URL.createObjectURL(r.data);audioCache.set(key,url);}await playUrl(url);return;}
 catch(e){if(e?.name==='NotAllowedError')throw new Error('Browser memblokir suara. Klik tombol sekali lagi.');}
 await browserSpeak(text);
}
export const stopSpeech=()=>{if(activeAudio){activeAudio.pause();activeAudio=null;}window.speechSynthesis?.cancel();};

/* ---------- Efek suara game (WebAudio, tanpa berkas) ---------- */
let sfxContext=null,sfxMuted=localStorage.getItem('cortexia-sfx-muted')==='1';
export const sfxIsMuted=()=>sfxMuted;
export const setSfxMuted=muted=>{sfxMuted=muted;localStorage.setItem('cortexia-sfx-muted',muted?'1':'0');};
const TONES={correct:[[660,0],[880,.09],[1175,.18]],wrong:[[300,0],[220,.14]],tick:[[900,0]],star:[[784,0],[988,.08],[1319,.16],[1568,.26]],start:[[523,0],[659,.1],[784,.2]],pop:[[620,0],[930,.05]],done:[[784,0],[1175,.1]],hint:[[880,0],[1175,.14]],win:[[523,0],[659,.1],[784,.2],[1047,.32],[1319,.46]]};
const SHORT=new Set(['tick','fill','pop']);
/* kind 'fill' memakai pitch 0–1 (nada naik saat lingkaran terisi); 'whoosh' meluncur naik saat titik berpindah. */
export function sfx(kind,{pitch=0}={}){
 if(sfxMuted)return;
 try{sfxContext=sfxContext||new (window.AudioContext||window.webkitAudioContext)();const ctx=sfxContext;if(ctx.state==='suspended')ctx.resume();
  if(kind==='whoosh'){const osc=ctx.createOscillator(),gain=ctx.createGain(),t=ctx.currentTime;osc.type='triangle';osc.frequency.setValueAtTime(260,t);osc.frequency.exponentialRampToValueAtTime(720,t+.2);gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.08,t+.04);gain.gain.exponentialRampToValueAtTime(.001,t+.24);osc.connect(gain).connect(ctx.destination);osc.start(t);osc.stop(t+.26);return;}
  const notes=kind==='fill'?[[520+pitch*520,0]]:TONES[kind]||[[600,0]];
  notes.forEach(([freq,at],i)=>{const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type=kind==='wrong'?'triangle':'sine';osc.frequency.value=freq;const t=ctx.currentTime+at,length=SHORT.has(kind)?.08:kind==='win'&&i===notes.length-1?.6:.22;gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(kind==='fill'?.12:.22,t+.015);gain.gain.exponentialRampToValueAtTime(.001,t+length);osc.connect(gain).connect(ctx.destination);osc.start(t);osc.stop(t+length+.03);});
 }catch{}
}

/* ---------- Perekaman & galat perangkat ---------- */
export function recorderFor(stream){const type=['audio/webm;codecs=opus','audio/webm','audio/mp4'].find(t=>MediaRecorder.isTypeSupported(t));const rec=new MediaRecorder(stream,type?{mimeType:type}:undefined);const chunks=[];rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};return {rec,start:()=>rec.start(250),stop:()=>new Promise(resolve=>{if(rec.state==='inactive'){resolve(new Blob(chunks,{type:rec.mimeType}));return;}rec.onstop=()=>resolve(new Blob(chunks,{type:rec.mimeType}));rec.stop();})};}
export const mediaError=e=>e.name==='NotAllowedError'?'Izin perangkat ditolak. Izinkan kamera/mikrofon melalui pengaturan browser.':e.name==='NotFoundError'?'Perangkat tidak ditemukan. Sambungkan kamera atau mikrofon.':e.name==='NotReadableError'?'Perangkat sedang dipakai aplikasi lain. Tutup aplikasi tersebut dan coba lagi.':'Perangkat belum bisa digunakan. Periksa koneksi dan izin browser.';

/* ---------- Pelacak mata (WebGazer + MediaPipe FaceMesh WASM dari /mediapipe) ----------
 WASM MediaPipe hanya boleh diinisialisasi SEKALI per halaman. Effect React (StrictMode di dev)
 bisa memanggil start dua kali bersamaan, jadi pemuatan skrip dan begin() dibuat singleton. */
let gazeStarted=false,gazeLoading=null,gazeStarting=null,gazeGeneration=0;
export function loadGaze(){
 if(window.webgazer)return Promise.resolve(window.webgazer);
 if(!gazeLoading)gazeLoading=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='/webgazer.js';script.onload=()=>resolve(window.webgazer);script.onerror=()=>{gazeLoading=null;script.remove();reject(new Error('Pelacak mata gagal dimuat.'));};document.body.appendChild(script);});
 return gazeLoading;
}
export async function startGaze({fresh=true}={}){
 const w=await loadGaze();
 if(!gazeStarted){
  if(!gazeStarting){
   const generation=gazeGeneration;
   gazeStarting=(async()=>{
    w.params.faceMeshSolutionPath='/mediapipe/face_mesh';
    // Resolusi lebih tinggi = patch mata lebih besar = prediksi lebih stabil.
    w.params.camConstraints={video:{width:{min:320,ideal:1280,max:1920},height:{min:240,ideal:720,max:1080},facingMode:'user'}};
    w.saveDataAcrossSessions(false);w.setRegression('ridge').showPredictionPoints(false);w.applyKalmanFilter(true);
    watchFace(w.getTracker());
    await w.begin();w.removeMouseEventListeners();gazeStarted=true;
    if(generation!==gazeGeneration)stopGaze();// dihentikan saat masih menyala
   })().finally(()=>{gazeStarting=null;});
  }
  await gazeStarting;
  if(!gazeStarted)throw new Error('Pelacak mata dihentikan.');
 }else await w.resume();
 if(fresh)await w.clearData();
 enlargeGazeMemory(w);
 return w;
}
/* Regresi WebGazer hanya menyimpan 50 sampel terakhir, sehingga titik kalibrasi awal terbuang begitu sampel ditambah.
 Jendelanya diperbesar setiap kali regresi dibuat ulang (begin/clearData). Lebih besar dari ini membuat ridge per frame terlalu berat. */
const GAZE_MEMORY=320;
function enlargeGazeMemory(w){for(const reg of w.getRegression()||[])for(const key of ['screenXClicksArray','screenYClicksArray','eyeFeaturesClicks','dataClicks']){const win=reg[key];if(win&&win.windowSize<GAZE_MEMORY)reg[key]=new win.constructor(GAZE_MEMORY);}}
export async function resetGazeData(){const w=window.webgazer;if(!w)return;await w.clearData();enlargeGazeMemory(w);}
/* Kelopak mata (indeks FaceMesh) dibanding lebar mata. Frame saat berkedip tidak boleh dipelajari. */
function eyesOpen(){
 try{const p=window.webgazer.getTracker().getPositions();if(!p||p.length<400)return true;
  const ratio=(top,bottom,left,right)=>Math.hypot(p[top][0]-p[bottom][0],p[top][1]-p[bottom][1])/Math.max(1,Math.hypot(p[left][0]-p[right][0],p[left][1]-p[right][1]));
  return (ratio(159,145,33,133)+ratio(386,374,362,263))/2>.16;}catch{return true;}
}
/* Satu sampel latih per frame kamera baru, hanya bila wajah terlihat dan mata terbuka. Mengembalikan true bila tersimpan. */
let recordedFrame=-1;
export function recordGazeSample(x,y){
 const w=window.webgazer;
 if(!w||!gazeStarted||patchFrame===recordedFrame||performance.now()-faceSeenAt>200||!eyesOpen())return false;
 recordedFrame=patchFrame;w.recordScreenPosition(x,y,'click');return true;
}
/* Posisi kepala relatif video. Prediksi WebGazer melenceng bila kepala bergeser dari posisi saat kalibrasi. */
export function headPose(){
 try{const p=window.webgazer?.getTracker()?.getPositions(),video=document.getElementById('webgazerVideoFeed');if(!p?.length||!video?.videoWidth)return null;
  const xs=p.map(q=>q[0]),ys=p.map(q=>q[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  return {x:(minX+maxX)/2/video.videoWidth,y:(minY+maxY)/2/video.videoHeight,size:(maxX-minX)/video.videoWidth};}catch{return null;}
}
/* Pergeseran dalam satuan lebar wajah; maju/mundur dihitung dari perubahan ukuran wajah. */
export function headDrift(reference,current=headPose()){if(!reference||!current)return 0;return Math.max(Math.hypot(current.x-reference.x,current.y-reference.y)/reference.size,Math.abs(current.size/reference.size-1)*2);}
/* Filter One Euro: diam = halus, mata melompat = cepat mengikuti. Satuan piksel per detik. */
export function gazeFilter({minCutoff=.6,beta=.006,dCutoff=1}={}){
 let prev=null,dx=0,dy=0,last=0;const alpha=(cutoff,dt)=>1/(1+1/(2*Math.PI*cutoff*dt));
 return (x,y,t=performance.now())=>{
  if(!prev){prev={x,y};last=t;return prev;}
  const dt=Math.max(.001,(t-last)/1000),ad=alpha(dCutoff,dt);last=t;
  dx+=ad*((x-prev.x)/dt-dx);dy+=ad*((y-prev.y)/dt-dy);
  const a=alpha(minCutoff+beta*Math.hypot(dx,dy),dt);prev={x:prev.x+a*(x-prev.x),y:prev.y+a*(y-prev.y)};return prev;
 };
}
export const gazeRunning=()=>gazeStarted;
/* mode: 'large' (penempatan wajah), 'small' (tengah atas, saat kalibrasi/membaca), 'corner' (pojok kanan bawah, saat game), 'hidden' */
export function gazePreview(mode){
 const w=window.webgazer;if(!w||!gazeStarted)return;document.body.dataset.gazePreview=mode;
 if(mode==='hidden'){w.showVideoPreview(false);return;}
 const width=mode==='large'?Math.round(Math.min(1000,window.innerWidth*.9,(window.innerHeight-230)*4/3)):mode==='corner'?152:176;
 w.setVideoViewerSize(width,Math.round(width*3/4));w.params.showVideo=true;w.params.showFaceOverlay=mode==='large';w.params.showFaceFeedbackBox=true;w.showVideoPreview(true);
}
/* Prediksi tatapan baru ada setelah klik kalibrasi, dan positionsArray menyimpan posisi lama saat wajah hilang.
 Karena itu kapan wajah terakhir benar-benar ditemukan dicatat langsung dari getEyePatches (dipanggil tiap frame). */
let faceSeenAt=0,patchFrame=0;
function watchFace(tracker){
 if(!tracker||tracker.__cortexiaWatched)return;
 const original=tracker.getEyePatches.bind(tracker);
 tracker.getEyePatches=async(...args)=>{const patches=await original(...args);if(patches){faceSeenAt=performance.now();patchFrame+=1;}return patches;};
 tracker.__cortexiaWatched=true;
}
/* Status wajah: terdeteksi bila wajah ditemukan dalam 800 ms terakhir; ukuran wajah relatif lebar video. */
export function faceStatus(lastSeen=0){
 const w=window.webgazer,video=document.getElementById('webgazerVideoFeed');let size=null;
 const detected=performance.now()-Math.max(faceSeenAt,lastSeen)<800;
 try{const p=detected&&w?.getTracker()?.getPositions();if(p&&p.length&&video?.videoWidth){const xs=p.map(q=>q[0]);size=(Math.max(...xs)-Math.min(...xs))/video.videoWidth;}}catch{}
 return {detected,size,advice:!detected?'Wajah belum terlihat. Hadapkan wajah ke kamera dan pastikan ruangan terang.':size!==null&&size<.2?'Wajah terlalu jauh. Mendekatlah sedikit ke layar.':size!==null&&size>.65?'Wajah terlalu dekat. Mundur sedikit.':'Posisi wajah sudah pas. Kepala tetap tenang.'};
}
export const stopGaze=()=>{gazeGeneration+=1;const w=window.webgazer;if(w){try{w.pause();w.clearGazeListener();w.removeMouseEventListeners();document.querySelector('#webgazerVideoFeed')?.srcObject?.getTracks().forEach(t=>t.stop());w.end();}catch{}['webgazerVideoContainer','webgazerGazeDot'].forEach(id=>document.getElementById(id)?.remove());}gazeStarted=false;delete document.body.dataset.gazePreview;};
