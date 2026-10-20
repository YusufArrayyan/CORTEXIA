import {useState,useEffect,useRef,useMemo} from 'react';
import {Play,Pause,RotateCcw} from 'lucide-react';
import {ResponsiveContainer,LineChart,Line,XAxis,YAxis,Tooltip,CartesianGrid} from 'recharts';
import {Heatmap} from './Heatmap';

const views=[['words','Peta kata'],['path','Jalur tatapan'],['raw','Titik mentah']];
const heat=v=>`rgba(250,112,46,${(.08+v*.62).toFixed(3)})`;

export function GazeReplay({session}){
 const m=session.metrics,g=m.gaze||{},layout=(session.layouts||[]).slice(-1)[0];
 const [view,setView]=useState(layout?'words':'raw'),[time,setTime]=useState(null),[playing,setPlaying]=useState(false);
 const scan=useMemo(()=>g.scanpath||[],[g.scanpath]);
 const end=scan.length?scan[scan.length-1].t+.5:0;
 const raf=useRef(),stage=useRef(),[stageWidth,setStageWidth]=useState(800);
 useEffect(()=>{const el=stage.current;if(!el)return;const ro=new ResizeObserver(([e])=>setStageWidth(e.contentRect.width));ro.observe(el);return()=>ro.disconnect();},[view]);
 useEffect(()=>{if(!playing)return;let last=performance.now();const tick=now=>{setTime(t=>{const next=(t??0)+(now-last)/1000*1.5;if(next>=end){setPlaying(false);return end;}return next;});last=now;raf.current=requestAnimationFrame(tick);};raf.current=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf.current);},[playing,end]);
 const shown=time===null?scan:scan.filter(f=>f.t<=time);
 const dwell=useMemo(()=>{const d={};(time===null?scan:shown).forEach(f=>{if(f.word!=null)d[f.word]=(d[f.word]||0)+f.d;});return d;},[scan,shown,time]);
 const maxDwell=Math.max(1,...Object.values(dwell));
 const ratio=layout?layout.height/layout.width:.5;
 const current=shown[shown.length-1];
 return <div className="gaze-replay">
  <div className="section-toolbar"><div className="segmented" role="tablist">{views.filter(([id])=>id==='raw'||layout||id==='path').map(([id,label])=><button key={id} role="tab" aria-selected={view===id} className={view===id?'active':''} data-testid={`gaze-view-${id}`} onClick={()=>setView(id)}>{label}</button>)}</div>
  {view!=='raw'&&scan.length>0&&<div className="replay-controls"><button className="icon-button" data-testid="gaze-play" aria-label={playing?'Jeda':'Putar ulang'} onClick={()=>{if(!playing&&(time===null||time>=end))setTime(0);setPlaying(!playing);}}>{playing?<Pause size={15}/>:<Play size={15}/>}</button><input type="range" aria-label="Waktu putar ulang" min={0} max={end||1} step={.05} value={time??end} onChange={e=>{setPlaying(false);setTime(+e.target.value);}}/><span className="muted">{(time??end).toFixed(1)} / {end.toFixed(1)} dtk</span><button className="icon-button" aria-label="Tampilkan semua" onClick={()=>{setPlaying(false);setTime(null);}}><RotateCcw size={14}/></button></div>}</div>
  {view==='raw'?<Heatmap points={session.gaze_points}/>:
  <div ref={stage} className="gaze-stage" style={{paddingTop:`${Math.min(ratio,.7)*100}%`}} data-testid="gaze-stage">
   <div className="gaze-stage-inner">
    {layout&&layout.words.map(w=>{const d=dwell[w.i]||0;return <span key={w.i} className={`gaze-word ${view==='words'&&d?'hot':''} ${current?.word===w.i?'current':''}`} title={d?`${w.text}: ${Math.round(d)} ms`:`${w.text}: tidak tertatap`} style={{left:`${w.x*100}%`,top:`${w.y*100}%`,width:`${w.w*100}%`,height:`${w.h*100}%`,background:view==='words'&&d?heat(d/maxDwell):undefined,fontSize:Math.max(8,Math.min(30,w.h*stageWidth*ratio*.6))}}>{w.text}</span>;})}
    {view==='path'&&<svg className="gaze-path" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-label="Jalur fiksasi">
     <polyline points={shown.map(f=>`${f.x*1000},${f.y*1000}`).join(' ')} fill="none" stroke="#5965be" strokeOpacity=".45" strokeWidth="3" vectorEffect="non-scaling-stroke"/>
     {shown.map((f,i)=>{const back=i>0&&f.line!=null&&shown[i-1].line===f.line&&f.word!=null&&shown[i-1].word!=null&&f.word<shown[i-1].word;return <ellipse key={i} cx={f.x*1000} cy={f.y*1000} rx={Math.min(30,6+f.d/40)} ry={Math.min(30,6+f.d/40)/Math.min(ratio,.7)} fill={back?'#e56f65':'#fa702e'} fillOpacity={i===shown.length-1?.9:.45} vectorEffect="non-scaling-stroke"/>;})}
    </svg>}
   </div>
  </div>}
  {view==='path'&&<div className="legend"><span><i style={{background:'#fa702e'}}/>Fiksasi (besar = lebih lama)</span><span><i style={{background:'#e56f65'}}/>Regresi (kembali ke kata sebelumnya)</span><span><i style={{background:'#5965be'}}/>Perpindahan pandangan</span></div>}
  {view==='words'&&<div className="legend"><span><i style={{background:heat(.15)}}/>Sebentar</span><span><i style={{background:heat(1)}}/>Lama ditatap</span><span><i style={{background:'#fff',border:'1px solid #ddd'}}/>Tidak tertatap</span></div>}
  {g.line_timeline?.length>1&&<section className="panel mt-20"><h3 className="section-title" style={{marginTop:0}}>Alur baris dari waktu ke waktu</h3><p className="muted">Garis naik-turun yang rapi berarti pembaca menyelesaikan satu baris lalu pindah ke baris berikutnya. Lonjakan ke atas menandakan kembali ke baris sebelumnya.</p><div className="progress-chart" data-testid="gaze-line-chart"><ResponsiveContainer width="100%" height="100%" initialDimension={{width:600,height:230}}><LineChart data={g.line_timeline} margin={{top:10,right:12,left:-18,bottom:0}}><CartesianGrid stroke="#f0ecf6" vertical={false}/><XAxis dataKey="t" type="number" domain={[0,'dataMax']} tickFormatter={v=>`${Math.round(v)}s`} fontSize={10}/><YAxis dataKey="line" reversed allowDecimals={false} domain={[1,'dataMax']} fontSize={10} tickFormatter={v=>`B${v}`}/><Tooltip formatter={v=>[`Baris ${v}`,'Posisi']} labelFormatter={v=>`${v} detik`}/><Line type="stepAfter" dataKey="line" stroke="#fa702e" strokeWidth={2} dot={false} isAnimationActive={false}/></LineChart></ResponsiveContainer></div></section>}
 </div>;
}
