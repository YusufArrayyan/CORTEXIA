import {useState,useEffect,useRef} from 'react';
import {Camera,CheckCircle2,AlertCircle,RotateCcw} from 'lucide-react';
import {Action} from './Common';
import {startGaze,stopGaze,gazePreview,faceStatus,mediaError,recordGazeSample,resetGazeData,headPose,sfx} from '../lib/media';
// Mulai dari tengah lalu memutar searah jarum jam. Baris atas sedikit turun agar tidak tertutup preview kamera kecil di tengah atas.
const grid=[[.5,.52],[.08,.22],[.5,.22],[.92,.22],[.92,.52],[.92,.85],[.5,.85],[.08,.85],[.08,.52]];
const fullTargets=[...grid,[.3,.37],[.7,.37],[.7,.7],[.3,.7]];
const quickTargets=grid;
const validation=[[.3,.38],[.7,.68],[.5,.52]];
// Tiap titik: klik sekali, lalu sampel direkam per frame kamera selama mata tetap menatap.
const CAPTURE_SETTLE_MS=300,LOST_MS=1500,SETTLE_MS=700,HOLD_MS=2200;
export const Calibration=({onComplete,onCancel,quick=false,keepRunning=true})=>{
 const targets=quick?quickTargets:fullTargets,samplesNeeded=quick?18:20;
 const [status,setStatus]=useState('loading'),[index,setIndex]=useState(0),[progress,setProgress]=useState(0),[capturing,setCapturing]=useState(false),[notice,setNotice]=useState(''),[error,setError]=useState(''),[face,setFace]=useState({detected:false,size:null,advice:'Menyalakan kamera…'});
 const gaze=useRef(null),lastSeen=useRef(0),errors=useRef([]),stage=useRef('loading'),target=useRef(0),targetStart=useRef(0),capture=useRef(null),head=useRef(null);
 const stopCapture=()=>{clearInterval(capture.current);capture.current=null;setCapturing(false);};
 useEffect(()=>{let canceled=false;(async()=>{try{const w=await startGaze();if(canceled)return;w.setGazeListener(d=>{if(!d)return;lastSeen.current=performance.now();if(stage.current==='validation'&&performance.now()-targetStart.current>SETTLE_MS){const t=validation[target.current];errors.current.push(Math.hypot(d.x/window.innerWidth-t[0],d.y/window.innerHeight-t[1]));}});gaze.current=w;stage.current='face';setStatus('face');gazePreview('large');}catch(e){if(!canceled)setError(['NotAllowedError','NotFoundError','NotReadableError','OverconstrainedError'].includes(e?.name)?mediaError(e):'Model pelacak mata gagal dimuat. Muat ulang halaman lalu coba lagi.'+(e?.message?` (${e.message})`:''));}})();
  const poll=setInterval(()=>setFace(faceStatus(lastSeen.current)),300);
  return()=>{canceled=true;clearInterval(poll);clearInterval(capture.current);if(!keepRunning)stopGaze();else gazePreview('hidden');};},[keepRunning]);
 useEffect(()=>{if(status!=='validation')return;targetStart.current=performance.now();sfx('tick');const timer=setTimeout(()=>{if(index<validation.length-1){target.current=index+1;setIndex(index+1);}else{const values=[...errors.current].sort((a,b)=>a-b);const median=values.length?values[Math.floor(values.length/2)]:null;const passed=median!==null&&median<=.16&&values.length>=15;stage.current='done';gaze.current?.clearGazeListener();gazePreview('hidden');sfx(passed?'win':'done');onComplete({median_error:median,validation_samples:values.length,passed,quick,head:head.current});}},HOLD_MS);return()=>clearTimeout(timer);},[status,index,onComplete,quick]);
 const beginTraining=()=>{stage.current='train';setIndex(0);setProgress(0);setNotice('');setStatus('train');gazePreview('small');sfx('start');};
 const restart=async()=>{stopCapture();await resetGazeData();errors.current=[];target.current=0;beginTraining();};
 const advance=()=>{
  if(index<targets.length-1){setIndex(index+1);setProgress(0);sfx('whoosh');return;}
  head.current=headPose();setIndex(0);setProgress(0);target.current=0;errors.current=[];stage.current='validation';setStatus('validation');
 };
 const click=()=>{
  if(!gaze.current||status!=='train'||capture.current)return;
  const [px,py]=targets[index],startedAt=performance.now();let count=0,lastSample=startedAt;
  sfx('pop');setNotice('');setCapturing(true);
  capture.current=setInterval(()=>{
   const now=performance.now();if(now-startedAt<CAPTURE_SETTLE_MS)return;
   if(recordGazeSample(px*window.innerWidth,py*window.innerHeight)){count+=1;lastSample=now;setProgress(count/samplesNeeded);if(count%5===0)sfx('fill',{pitch:count/samplesNeeded});}
   if(count>=samplesNeeded){stopCapture();sfx('done');advance();}
   else if(now-lastSample>LOST_MS){stopCapture();setProgress(0);setNotice('Matamu belum terlihat jelas. Buka mata lebar-lebar, lalu klik titiknya lagi.');sfx('wrong');}
  },30);
 };
 const cancel=()=>{stopCapture();if(!keepRunning)stopGaze();else gazePreview('hidden');onCancel();};
 if(status==='face'||status==='loading')return <div className="calibration-overlay face-stage" data-testid="calibration-screen"><div className="face-stage-copy"><h1>Ayo atur posisi wajah!</h1><p>Duduk tegak sekitar satu lengan dari layar. Wajah berada di dalam kotak dan cahaya menerangi wajah dari depan.</p></div><div className="face-frame-space" aria-hidden="true"/><div className={`face-check ${face.detected&&face.advice.startsWith('Posisi')?'ok':''}`} data-testid="calibration-face-status">{error?<><AlertCircle size={18}/>{error}</>:status==='loading'?<><Camera size={18}/>Menyalakan kamera dan memuat model wajah…</>:<>{face.detected?<CheckCircle2 size={18}/>:<AlertCircle size={18}/>}{face.advice}</>}</div><div className="button-row face-actions"><Action data-testid="calibration-start" disabled={status!=='face'||!face.detected} onClick={beginTraining}>Wajah sudah pas, mulai kalibrasi</Action><Action kind="secondary" data-testid="calibration-cancel" onClick={cancel}>Batalkan</Action></div></div>;
 const point=status==='validation'?validation[index]:targets[index];
 const total=targets.length;
 const instruction=status==='validation'?`Tatap titik ungu tanpa mengklik · Mengukur ketepatan ${index+1}/${validation.length}`:capturing?`Titik ${index+1} dari ${total} · Terus tatap titiknya sampai lingkaran penuh…`:`Titik ${index+1} dari ${total} · Tatap titik tengahnya, lalu klik sekali`;
 return <div className="calibration-overlay" data-testid="calibration-screen"><div className="calibration-top"><strong data-testid="calibration-status">{instruction}</strong><div className="calibration-dots">{(status==='validation'?validation:targets).map((_,i)=><i key={i} className={i<index?'done':i===index?'active':''}/>)}</div><p className={notice||!face.detected?'warn':''}>{notice||(face.detected?'Kepala tetap tenang, hanya mata yang bergerak.':face.advice)}</p></div><button data-testid="calibration-target" disabled={status==='validation'} className={`calibration-target ${status==='validation'?'validating':''} ${capturing?'capturing':''}`} style={{left:`${point[0]*100}%`,top:`${point[1]*100}%`,'--p':progress}} onClick={click} aria-label="Titik kalibrasi"><span className="calibration-core"/></button><div className="calibration-exit button-row">{status==='train'&&<Action kind="secondary" data-testid="calibration-restart" onClick={restart}><RotateCcw size={15}/>Ulang dari awal</Action>}<Action kind="secondary" data-testid="calibration-cancel" onClick={cancel}>Batalkan kalibrasi</Action></div></div>;
};
