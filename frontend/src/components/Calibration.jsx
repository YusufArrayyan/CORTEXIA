import {useState,useEffect,useRef} from 'react';
import {Camera,CheckCircle2,AlertCircle,RotateCcw} from 'lucide-react';
import {Action} from './Common';
import {startGaze,stopGaze,gazePreview,faceStatus,mediaError,recordGazeSample,resetGazeData,headPose,headDrift,gazeRunning,sfx} from '../lib/media';
/* Alur ringkas 4 tahap:
 1. Persiapan: mulai sendiri setelah wajah pas selama 1 detik. Kalibrasi lulus < 15 menit dengan layar dan posisi kepala yang sama dipakai ulang (langsung ke tahap 3).
 2. Kalibrasi inti: 5 titik (tengah + 4 sudut), direkam otomatis tanpa klik.
 3. Validasi pada titik yang tidak dilatih. Early stop setelah 2 titik bila galat median sudah jauh di bawah batas.
 4. Perbaikan terarah, maksimal sekali: titik tambahan hanya di sekitar area yang meleset, data lama tidak dihapus. */
// Baris atas sedikit turun agar tidak tertutup preview kamera kecil di tengah atas.
const core=[[.5,.52],[.08,.22],[.92,.22],[.92,.85],[.08,.85]];
const validation=[[.3,.38],[.7,.68],[.7,.38]];
// Titik tambahan (tepi tengah) untuk tiap titik validasi yang meleset. Sengaja tidak menimpa titik validasi agar uji ulang tetap jujur.
const extraFor=[[[.08,.52],[.5,.22]],[[.92,.52],[.5,.85]],[[.92,.52],[.5,.22]]];
const MEMORY_MS=15*60e3,REUSE_DRIFT=.2,FACE_OK_MS=1000;
const AUTO_MS=600,RETRY_MS=1200,CAPTURE_SETTLE_MS=300,LOST_MS=1500,SAMPLES=15;
const SETTLE_MS=700,HOLD_MS=1500,PASS=.16,EARLY_PASS=.10,MIN_SAMPLES=15,EARLY_SAMPLES=10;
const median=v=>{if(!v.length)return null;const s=[...v].sort((a,b)=>a-b);return s[Math.floor(s.length/2)];};
// Kalibrasi lulus terakhir di halaman ini. Model WebGazer tetap di memori selama pelacak tidak dihentikan.
let lastPassed=null;
const reusable=()=>!!lastPassed&&gazeRunning()&&performance.now()-lastPassed.at<MEMORY_MS&&lastPassed.width===window.innerWidth&&lastPassed.height===window.innerHeight;
export const Calibration=({onComplete,onCancel,keepRunning=true})=>{
 const [status,setStatus]=useState('loading'),[points,setPoints]=useState(core),[checks,setChecks]=useState([0,1,2]),[index,setIndex]=useState(0),[retry,setRetry]=useState(0),[progress,setProgress]=useState(0),[capturing,setCapturing]=useState(false),[notice,setNotice]=useState(''),[error,setError]=useState(''),[face,setFace]=useState({detected:false,size:null,advice:'Menyalakan kamera…'}),[canReuse]=useState(reusable);
 const gaze=useRef(null),lastSeen=useRef(0),errors=useRef([]),checkList=useRef([0,1,2]),stage=useRef('loading'),mode=useRef('core'),target=useRef(0),targetStart=useRef(0),okSince=useRef(0),startedAt=useRef(0),head=useRef(null),act=useRef({});
 useEffect(()=>{let canceled=false;(async()=>{try{const w=await startGaze({fresh:!canReuse});if(canceled)return;w.setGazeListener(d=>{if(!d)return;lastSeen.current=performance.now();if(stage.current==='validation'&&performance.now()-targetStart.current>SETTLE_MS){const t=validation[checkList.current[target.current]];errors.current[target.current]?.push(Math.hypot(d.x/window.innerWidth-t[0],d.y/window.innerHeight-t[1]));}});gaze.current=w;stage.current='face';setStatus('face');gazePreview('large');}catch(e){if(!canceled)setError(['NotAllowedError','NotFoundError','NotReadableError','OverconstrainedError'].includes(e?.name)?mediaError(e):'Model pelacak mata gagal dimuat. Muat ulang halaman lalu coba lagi.'+(e?.message?` (${e.message})`:''));}})();
  const poll=setInterval(()=>setFace(faceStatus(lastSeen.current)),300);
  return()=>{canceled=true;clearInterval(poll);if(!keepRunning)stopGaze();else gazePreview('hidden');};},[keepRunning,canReuse]);
 const beginTraining=async(list,refine=false)=>{
  setCapturing(false);
  stage.current='train';mode.current=refine?'refine':'core';lastPassed=null;
  if(!refine)await resetGazeData();
  setPoints(list);setIndex(0);setRetry(0);setProgress(0);setNotice('');setStatus('train');gazePreview('small');sfx('start');
 };
 const startValidation=(order,next)=>{
  mode.current=next;checkList.current=order;errors.current=order.map(()=>[]);target.current=0;
  setChecks(order);setIndex(0);setProgress(0);stage.current='validation';setStatus('validation');
 };
 // Tahap 1 → 2 (atau langsung 3 bila kalibrasi lama masih cocok dengan posisi kepala sekarang).
 const proceed=()=>{
  if(stage.current!=='face')return;startedAt.current=performance.now();
  if(canReuse&&reusable()&&headDrift(lastPassed.head)<REUSE_DRIFT){stage.current='validation';head.current=lastPassed.head;gazePreview('small');sfx('start');startValidation([0,1,2],'reuse');}
  else beginTraining(core);
 };
 const advance=()=>{
  if(index<points.length-1){setIndex(index+1);setRetry(0);setProgress(0);sfx('whoosh');return;}
  if(mode.current==='refine')startValidation(checkList.current,'refine');
  else{head.current=headPose();startValidation([0,1,2],'core');}
 };
 const finish=passed=>{
  const values=errors.current.flat(),m=median(values);
  stage.current='done';gaze.current?.clearGazeListener();gazePreview('hidden');sfx(passed?'win':'done');
  if(passed)lastPassed={at:performance.now(),width:window.innerWidth,height:window.innerHeight,head:head.current};
  onComplete({median_error:m,validation_samples:values.length,passed,head:head.current,reused:mode.current==='reuse',refined:mode.current==='refine',duration_s:+((performance.now()-startedAt.current)/1000).toFixed(1)});
 };
 // Dipanggil tiap kali satu titik validasi selesai: early stop, lulus, atau tentukan tahap berikutnya.
 const checkpoint=()=>{
  const done=index+1,total=checkList.current.length,values=errors.current.slice(0,done).flat(),m=median(values);
  if(total===3&&done===2&&m!==null&&m<=EARLY_PASS&&values.length>=EARLY_SAMPLES)return finish(true);
  if(done<total){target.current=done;setIndex(done);return;}
  if(m!==null&&m<=PASS&&values.length>=(total===3?MIN_SAMPLES:EARLY_SAMPLES))return finish(true);
  if(mode.current==='reuse')return beginTraining(core);// model lama tidak lagi cocok, latih dari awal
  if(mode.current==='refine')return finish(false);
  // Tahap 4: urutkan titik validasi dari yang paling meleset, tambah titik di sekitarnya, lalu uji ulang 2 titik terburuk.
  const ranked=checkList.current.map((v,i)=>({v,e:median(errors.current[i])??1})).sort((a,b)=>b.e-a.e),failed=ranked.filter(r=>r.e>PASS);
  const extras=[...new Map((failed.length?failed:ranked.slice(0,1)).flatMap(r=>extraFor[r.v]).map(p=>[p.join(),p])).values()];
  checkList.current=ranked.slice(0,2).map(r=>r.v);beginTraining(extras,true);
 };
 act.current={advance,proceed,checkpoint};
 useEffect(()=>{if(status!=='face'||error)return;if(!(face.detected&&face.advice.startsWith('Posisi'))){okSince.current=0;return;}if(!okSince.current)okSince.current=performance.now();else if(performance.now()-okSince.current>=FACE_OK_MS)act.current.proceed();},[status,face,error]);
 // Rekam otomatis: titik diam sebentar (mata sempat berpindah), lalu sampel diambil per frame kamera selama mata tetap menatap.
 useEffect(()=>{if(status!=='train')return;const [px,py]=points[index];let capture=null;
  const wait=setTimeout(()=>{const begun=performance.now();let count=0,lastSample=begun;setNotice('');setCapturing(true);sfx('pop');
   capture=setInterval(()=>{const now=performance.now();if(now-begun<CAPTURE_SETTLE_MS)return;
    if(recordGazeSample(px*window.innerWidth,py*window.innerHeight)){count+=1;lastSample=now;setProgress(count/SAMPLES);if(count%5===0)sfx('fill',{pitch:count/SAMPLES});}
    if(count>=SAMPLES){clearInterval(capture);setCapturing(false);sfx('done');act.current.advance();}
    else if(now-lastSample>LOST_MS){clearInterval(capture);setCapturing(false);setProgress(0);setNotice('Matamu belum terlihat jelas. Buka mata lebar-lebar, titik ini diulang sebentar lagi.');sfx('wrong');setRetry(r=>r+1);}
   },30);},retry?RETRY_MS:AUTO_MS);
  return()=>{clearTimeout(wait);clearInterval(capture);};},[status,points,index,retry]);
 useEffect(()=>{if(status!=='validation')return;targetStart.current=performance.now();sfx('tick');const timer=setTimeout(()=>act.current.checkpoint(),HOLD_MS);return()=>clearTimeout(timer);},[status,index]);
 const cancel=()=>{stage.current='done';setCapturing(false);if(!keepRunning)stopGaze();else gazePreview('hidden');onCancel();};
 if(status==='face'||status==='loading'){const ready=face.detected&&face.advice.startsWith('Posisi');return <div className="calibration-overlay face-stage" data-testid="calibration-screen"><div className="face-stage-copy"><h1>Ayo atur posisi wajah!</h1><p>Duduk tegak sekitar satu lengan dari layar. Wajah berada di dalam kotak dan cahaya menerangi wajah dari depan. {canReuse?'Kalibrasi sebelumnya masih bisa dipakai, jadi cukup cek ketepatan sebentar.':'Kalibrasi mulai sendiri begitu posisi wajah pas.'}</p></div><div className="face-frame-space" aria-hidden="true"/><div className={`face-check ${ready?'ok':''}`} data-testid="calibration-face-status">{error?<><AlertCircle size={18}/>{error}</>:status==='loading'?<><Camera size={18}/>Menyalakan kamera dan memuat model wajah…</>:<>{face.detected?<CheckCircle2 size={18}/>:<AlertCircle size={18}/>}{ready?'Posisi wajah sudah pas. Tahan sebentar, kalibrasi segera dimulai…':face.advice}</>}</div><div className="button-row face-actions"><Action data-testid="calibration-start" disabled={status!=='face'||!face.detected} onClick={()=>act.current.proceed()}>Mulai sekarang</Action><Action kind="secondary" data-testid="calibration-cancel" onClick={cancel}>Batalkan</Action></div></div>;}
 const validating=status==='validation',point=validating?validation[checks[index]]:points[index],total=validating?checks.length:points.length;
 const instruction=validating?`${mode.current==='reuse'?'Memeriksa kalibrasi sebelumnya':'Tatap titik ungu'} · Mengukur ketepatan ${index+1}/${total}`:`${mode.current==='refine'?'Hampir selesai! ':''}Titik ${index+1} dari ${total} · ${capturing?'Terus tatap titiknya sampai lingkaran penuh…':'Tatap titik oranye, rekaman mulai sendiri'}`;
 return <div className="calibration-overlay" data-testid="calibration-screen"><div className="calibration-top"><strong data-testid="calibration-status">{instruction}</strong><div className="calibration-dots">{Array.from({length:total},(_,i)=><i key={i} className={i<index?'done':i===index?'active':''}/>)}</div><p className={notice||!face.detected?'warn':''}>{notice||(face.detected?'Kepala tetap tenang, hanya mata yang bergerak.':face.advice)}</p></div><div data-testid="calibration-target" role="img" className={`calibration-target ${validating?'validating':''} ${capturing?'capturing':''}`} style={{left:`${point[0]*100}%`,top:`${point[1]*100}%`,'--p':progress}} aria-label="Titik kalibrasi"><span className="calibration-core"/></div><div className="calibration-exit button-row">{status==='train'&&<Action kind="secondary" data-testid="calibration-restart" onClick={()=>beginTraining(core)}><RotateCcw size={15}/>Ulang dari awal</Action>}<Action kind="secondary" data-testid="calibration-cancel" onClick={cancel}>Batalkan kalibrasi</Action></div></div>;
};
