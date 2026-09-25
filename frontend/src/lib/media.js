import {api} from './api';
let activeAudio=null;
export async function speak(text){
 if(activeAudio){activeAudio.pause();URL.revokeObjectURL(activeAudio.src);}
 const r=await api.get('/speech/synthesize',{params:{text},responseType:'blob'});const url=URL.createObjectURL(r.data);activeAudio=new Audio(url);activeAudio.onended=()=>URL.revokeObjectURL(url);await activeAudio.play();
}
export const stopSpeech=()=>{if(activeAudio){activeAudio.pause();URL.revokeObjectURL(activeAudio.src);activeAudio=null;}};
export function recorderFor(stream){const type=['audio/webm;codecs=opus','audio/webm','audio/mp4'].find(t=>MediaRecorder.isTypeSupported(t));const rec=new MediaRecorder(stream,type?{mimeType:type}:undefined);const chunks=[];rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};return {rec,start:()=>rec.start(250),stop:()=>new Promise(resolve=>{if(rec.state==='inactive'){resolve(new Blob(chunks,{type:rec.mimeType}));return;}rec.onstop=()=>resolve(new Blob(chunks,{type:rec.mimeType}));rec.stop();})};}
export const mediaError=e=>e.name==='NotAllowedError'?'Izin perangkat ditolak. Izinkan kamera/mikrofon melalui pengaturan browser.':e.name==='NotFoundError'?'Perangkat tidak ditemukan. Sambungkan kamera atau mikrofon.':e.name==='NotReadableError'?'Perangkat sedang dipakai aplikasi lain. Tutup aplikasi tersebut dan coba lagi.':'Perangkat belum bisa digunakan. Periksa koneksi dan izin browser.';
export async function loadGaze(){
 if(window.webgazer)return window.webgazer;
 await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='/webgazer.js';script.onload=resolve;script.onerror=()=>reject(new Error('Pelacak mata gagal dimuat.'));document.body.appendChild(script);});return window.webgazer;
}
export const stopGaze=()=>{const w=window.webgazer;if(w){try{w.pause();w.clearGazeListener();w.removeMouseEventListeners();document.querySelector('#webgazerVideoFeed')?.srcObject?.getTracks().forEach(t=>t.stop());w.end();}catch{}['webgazerVideoContainer','webgazerGazeDot'].forEach(id=>document.getElementById(id)?.remove());}};