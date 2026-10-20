import {useState,useEffect,useRef,useCallback} from 'react';
import {Link} from 'react-router-dom';
import {ArrowLeft,Star,Volume2,VolumeX,ArrowRight,Eye,Camera,MousePointer2,BookOpen,Sun,RotateCcw,CheckCircle2,AlertCircle} from 'lucide-react';
import {toast} from 'sonner';
import {api,message} from '../lib/api';
import {speak,stopSpeech,sfx,sfxIsMuted,setSfxMuted,stopGaze,gazePreview,faceStatus,gazeFilter,recordGazeSample,headDrift} from '../lib/media';
import {Action,Loading} from '../components/Common';
import {Calibration} from '../components/Calibration';

const DWELL_MS=700,HINT_MS=7000,MISS_MS=12000;
// Saat anak berhasil menatap kata, pusat kata dipakai sebagai sampel latih tambahan agar model ikut menyesuaikan diri (drift).
const ADAPT_SAMPLES=4,HEAD_DRIFT_WARN=.35;
const wordsOf=sentence=>sentence.split(' ').filter(Boolean);

export default function GazeGame(){
 const [levels,setLevels]=useState(null),[level,setLevel]=useState(1),[phase,setPhase]=useState('intro'),[input,setInput]=useState('camera'),[calibration,setCalibration]=useState(null);
 const [round,setRound]=useState(0),[target,setTarget]=useState(0),[done,setDone]=useState([]),[points,setPoints]=useState(0),[dwell,setDwell]=useState(0),[hint,setHint]=useState(false),[showDot,setShowDot]=useState(true),[face,setFace]=useState({detected:true,advice:'',drift:0}),[muted,setMuted]=useState(sfxIsMuted()),[summary,setSummary]=useState(null),[error,setError]=useState('');
 const wordRefs=useRef([]),dot=useRef(),stageRef=useRef(),state=useRef({}),results=useRef([]),startedAt=useRef(0),lastSeen=useRef(performance.now()),filter=useRef(null),mouseHandler=useRef(null);
 const sentences=levels?.find(l=>l.level===level)?.sentences||[];
 const words=sentences[round]?wordsOf(sentences[round]):[];
 useEffect(()=>{api.get('/games/gaze/levels').then(r=>setLevels(r.data)).catch(e=>setError(message(e)));return()=>{stopSpeech();stopGaze();if(mouseHandler.current)window.removeEventListener('mousemove',mouseHandler.current);};},[]);

 // Sinkronkan state yang dibaca listener tatapan (dipanggil puluhan kali per detik) tanpa memicu render ulang.
 Object.assign(state.current,{phase,target,words,round});
 const say=useCallback(text=>{speak(text.replace(/[^\p{L}\p{N}\s-]/gu,'')).catch(()=>{});},[]);

 const nextTarget=useCallback(hit=>{
  const s=state.current;const elapsed=performance.now()-s.targetStart;
  results.current.push({word:s.words[s.target],hit,dwell_ms:Math.round(s.dwell||0),time_ms:Math.round(Math.min(elapsed,120000))});
  if(hit){const bonus=elapsed<2500?5:0;setPoints(p=>p+10+bonus);setDone(d=>[...d,s.target]);sfx('correct');}else sfx('wrong');
  s.dwell=0;setDwell(0);setHint(false);
  const nextIndex=s.target+1;
  if(nextIndex<s.words.length){s.locked=true;setTimeout(()=>{setTarget(nextIndex);s.locked=false;},hit?350:150);}
  else{s.locked=true;setTimeout(()=>{if(s.round+1<sentences.length){setRound(r=>r+1);setTarget(0);setDone([]);sfx('star');}else finish();s.locked=false;},700);}
 },[sentences.length]);// eslint-disable-line react-hooks/exhaustive-deps

 // Setiap target baru: ucapkan kata, reset timer.
 useEffect(()=>{if(phase!=='play'||!words[target])return;const s=state.current;s.targetStart=performance.now();s.dwell=0;s.lastT=null;s.dwellStep=0;s.adapted=0;say(words[target]);const h=setTimeout(()=>{setHint(true);sfx('hint');},HINT_MS);const m=setTimeout(()=>{if(state.current.target===target&&state.current.round===round&&state.current.phase==='play')nextTarget(false);},MISS_MS);return()=>{clearTimeout(h);clearTimeout(m);};},[phase,target,round]);// eslint-disable-line react-hooks/exhaustive-deps

 const onGaze=useCallback((x,y)=>{
  const now=performance.now();lastSeen.current=now;
  const p=filter.current?filter.current(x,y,now):{x,y};
  if(dot.current)dot.current.style.transform=`translate(${p.x}px,${p.y}px)`;
  const s=state.current;if(s.phase!=='play'||s.locked)return;
  const el=wordRefs.current[s.target];if(!el)return;const r=el.getBoundingClientRect();
  const tol=Math.max(55,window.innerWidth*.045);// galat webcam ~ 1–2 cm di layar: beri toleransi
  const inside=p.x>=r.left-tol&&p.x<=r.right+tol&&p.y>=r.top-tol*1.1&&p.y<=r.bottom+tol*1.1;
  const dt=s.lastT?Math.min(now-s.lastT,120):0;s.lastT=now;
  s.dwell=inside?(s.dwell||0)+dt:Math.max(0,(s.dwell||0)-dt*.5);
  const fill=Math.min(1,s.dwell/DWELL_MS);setDwell(fill);
  const step=Math.floor(fill*3);if(step>s.dwellStep&&step<3){s.dwellStep=step;sfx('fill',{pitch:fill});}
  if(filter.current&&inside&&fill>=.5&&s.adapted<ADAPT_SAMPLES&&recordGazeSample(r.left+r.width/2,r.top+r.height/2))s.adapted+=1;
  if(s.dwell>=DWELL_MS)nextTarget(true);
 },[nextTarget]);

 const startPlay=useCallback(()=>{
  results.current=[];startedAt.current=performance.now();setRound(0);setTarget(0);setDone([]);setPoints(0);setSummary(null);setPhase('play');sfx('start');
  if(input==='camera'){const w=window.webgazer;filter.current=gazeFilter();w?.applyKalmanFilter(false);w?.setGazeListener(d=>{if(d)onGaze(d.x,d.y);});gazePreview('corner');}
  else{filter.current=null;mouseHandler.current=e=>onGaze(e.clientX,e.clientY);window.addEventListener('mousemove',mouseHandler.current);}
 },[input,onGaze]);

 useEffect(()=>{if(phase!=='play'||input!=='camera')return;const t=setInterval(()=>setFace({...faceStatus(lastSeen.current),drift:headDrift(calibration?.head)}),400);return()=>clearInterval(t);},[phase,input,calibration]);

 const finish=async()=>{
  const s=state.current;s.phase='done';setPhase('done');stopSpeech();window.webgazer?.clearGazeListener();gazePreview('hidden');
  if(mouseHandler.current){window.removeEventListener('mousemove',mouseHandler.current);mouseHandler.current=null;}
  sfx('win');
  try{const r=await api.post('/games/gaze/finish',{level,score:Math.min(10000,results.current.reduce((a,w)=>a+(w.hit?10+(w.time_ms<2500?5:0):0),0)),words:results.current.slice(0,500),calibration_error:calibration?.median_error??null,duration:Math.min(3600,(performance.now()-startedAt.current)/1000)});setSummary(r.data);}
  catch(e){setSummary({words_hit:results.current.filter(w=>w.hit).length,words_total:results.current.length,score:null});toast.error(message(e));}
 };

 const onCalibrated=useCallback(value=>{setCalibration(value);if(!value.passed)toast.warning('Kalibrasi kurang akurat. Game tetap bisa dimainkan; area kata dibuat lebih longgar.');setPhase('ready');},[]);

 if(!levels&&!error)return <Loading/>;
 if(phase==='calibrate')return <Calibration quick onComplete={onCalibrated} onCancel={()=>{stopGaze();setPhase('intro');}}/>;

 const centers=done.map(i=>{const el=wordRefs.current[i],box=stageRef.current?.getBoundingClientRect();if(!el||!box)return null;const r=el.getBoundingClientRect();return [r.left+r.width/2-box.left,r.bottom-box.top+6];}).filter(Boolean);

 return <div className="page gaze-game" data-testid="gaze-game">
  <div className="game-topbar"><Link to="/games" className="pill-link" data-testid="gaze-back" onClick={()=>{stopGaze();stopSpeech();}}><ArrowLeft size={18}/>Ke Game Center</Link><div className="game-title-pill"><span aria-hidden="true">👀</span> Game: Ikuti Kata!</div><div className="game-meta"><span className="points-pill" data-testid="gaze-points"><Star size={16} fill="currentColor"/>{points} Poin</span><button className="icon-button" data-testid="gaze-sound-toggle" aria-label={muted?'Nyalakan efek suara':'Matikan efek suara'} title={muted?'Nyalakan efek suara':'Matikan efek suara'} onClick={()=>{setSfxMuted(!muted);setMuted(!muted);if(muted)sfx('pop');}}>{muted?<VolumeX size={18}/>:<Volume2 size={18}/>}</button><span className="level-pill" data-testid="gaze-level">Level {level} • Tantangan {Math.min(round+1,3)} dari {sentences.length||3}</span></div></div>

  {phase==='intro'&&<div className="gaze-intro panel"><img src="/assets/game-eye.webp" alt="Ilustrasi mata mengikuti kata"/><div><h1>Ikuti kata yang menyala!</h1><p className="muted">CORTI akan membacakan satu kata. Tatap kata yang menyala sampai lingkarannya penuh. Semakin cepat matamu menemukan kata, semakin banyak bintang.</p><div className="level-choice">{levels?.map(l=><button key={l.level} className={level===l.level?'active':''} data-testid={`gaze-level-${l.level}`} onClick={()=>setLevel(l.level)}><b>Level {l.level}</b><small>{l.title}</small></button>)}</div><div className="input-choice"><label className={input==='camera'?'active':''}><input type="radio" name="input" checked={input==='camera'} onChange={()=>setInput('camera')}/><Camera size={18}/>Pakai kamera (pelacak mata)</label><label className={input==='mouse'?'active':''}><input type="radio" name="input" checked={input==='mouse'} onChange={()=>setInput('mouse')}/><MousePointer2 size={18}/>Pakai mouse (tanpa kamera)</label></div>{error&&<p className="error mb-20">{error}</p>}<Action data-testid="gaze-start" onClick={()=>{if(input==='camera')setPhase('calibrate');else setPhase('ready');}}>{input==='camera'?'Nyalakan kamera & kalibrasi':'Mulai bermain'}<ArrowRight size={18}/></Action><p className="readable-note">Video diproses di browser dan tidak dikirim ke server. Hanya skor dan waktu tiap kata yang disimpan.</p></div></div>}

  {phase==='ready'&&<div className="gaze-intro panel ready"><div><h1>Siap?</h1><p className="muted">{input==='camera'?(calibration?.passed?'Kalibrasi layak. Kepala tetap tenang, gerakkan mata saja.':'Kalibrasi kurang akurat, area kata dibuat lebih longgar. Kamu bisa kalibrasi ulang kapan saja.'):'Gerakkan mouse ke kata yang menyala dan tahan sebentar.'}</p><div className="button-row"><Action data-testid="gaze-play" onClick={startPlay}>Ayo mulai!<ArrowRight size={18}/></Action>{input==='camera'&&<Action kind="secondary" onClick={()=>setPhase('calibrate')}><RotateCcw size={16}/>Kalibrasi ulang</Action>}</div></div></div>}

  {phase==='play'&&<><div className="gaze-stage-card" ref={stageRef}>
   <span className="cloud c1"/><span className="cloud c2"/><span className="sun-badge"><Sun size={30}/></span>
   <div className="stage-hint"><Volume2 size={14}/>{hint?'Cari kata yang berwarna oranye, lalu tatap sampai lingkaran penuh!':'Dengarkan suara & ikuti jejak kata di layar!'}</div>
   <div className="word-board" data-testid="gaze-board">{words.map((w,i)=><span key={`${round}-${i}`} ref={el=>wordRefs.current[i]=el} className={`board-word ${i===target?'target':''} ${done.includes(i)?'done':''} ${i>target?'upcoming':''}`} data-testid={`gaze-word-${i}`}>{w}{i===target&&<i className="dwell-ring" style={{'--dwell':dwell}}/>}</span>)}</div>
   {centers.length>0&&<svg className="trail" aria-hidden="true"><polyline points={centers.map(c=>c.join(',')).join(' ')}/>{centers.map((c,i)=><circle key={i} cx={c[0]} cy={c[1]} r="6"/>)}</svg>}
   <div className="stage-controls"><button className="round-sound" data-testid="gaze-say" aria-label="Dengarkan lagi" onClick={()=>say(words[target]||'')}><Volume2 size={22}/></button><Action data-testid="gaze-next" onClick={()=>nextTarget(false)}>Kata Berikutnya</Action></div>
   {input==='camera'&&(()=>{const moved=face.detected&&face.drift>HEAD_DRIFT_WARN;return <div className={`face-pill ${face.detected&&!moved?'ok':''} ${moved?'warn':''}`} data-testid="gaze-face">{face.detected&&!moved?<CheckCircle2 size={14}/>:<AlertCircle size={14}/>}{!face.detected?face.advice:moved?'Kepalamu bergeser. Kembali ke posisi awal, ya.':'Mata terlacak'}</div>;})()}
  </div>
  <label className="reader-tool mt-20"><input type="checkbox" checked={showDot} onChange={e=>setShowDot(e.target.checked)}/>Tampilkan titik mata</label></>}

  {phase==='done'&&<div className="game-stage" data-testid="gaze-done"><Star size={50} color="#f2ad3e" fill="#f2ad3e" style={{margin:'auto'}}/><h2 className="section-title">Hebat! Matamu sudah berpetualang.</h2>{summary?<p className="muted" data-testid="gaze-summary">{summary.words_hit} dari {summary.words_total} kata ditemukan{summary.score!=null?` · ${summary.score} poin`:''}{summary.mean_time_ms?` · rata-rata ${(summary.mean_time_ms/1000).toFixed(1)} detik per kata`:''}</p>:<p className="muted">Menyimpan hasil…</p>}<div className="button-row mt-20" style={{justifyContent:'center'}}><Action onClick={()=>setPhase(input==='camera'&&window.webgazer?'ready':'intro')}><RotateCcw size={16}/>Main lagi</Action>{level<3&&<Action kind="secondary" onClick={()=>{setLevel(level+1);setPhase(input==='camera'?'ready':'intro');}}>Level berikutnya<ArrowRight size={16}/></Action>}<Link to="/games" className="text-button" onClick={()=>stopGaze()}>Kembali ke taman bermain</Link></div></div>}

  <div className="game-info-cards"><div><span className="info-icon"><Eye size={18}/></span><div><small>Latihan Fokus</small><b>Visual Tracking Kiri ke Kanan</b></div></div><div><span className="info-icon warm"><img src="/assets/corti.png" alt=""/></span><div><small>Karakter Pendamping</small><b>Corti si Rubah Cilik</b></div></div><div><span className="info-icon"><BookOpen size={18}/></span><div><small>Buku Terkait</small><b>Petualangan di Taman</b></div></div></div>
  {phase==='play'&&showDot&&<div ref={dot} className="gaze-dot" aria-hidden="true"/>}
 </div>;
}
