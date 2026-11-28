import {useEffect,useState,useCallback} from 'react';
import {Link} from 'react-router-dom';
import {Users,BookOpen,Clock,Target,Plus,Trash2,ArrowRight,History,Mic,Eye,Volume2,Edit3} from 'lucide-react';
import {LineChart,Line,XAxis,YAxis,Tooltip,ResponsiveContainer,CartesianGrid} from 'recharts';
import {toast} from 'sonner';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '../components/ui/dialog';
import {useAuth} from '../components/Auth';
import {api,message,dateLabel} from '../lib/api';
import {Action,PageHeading,Loading,Empty,Notice} from '../components/Common';

export default function Dashboard({teacher=false}){
 const {user,refreshUser}=useAuth();
 const isTeacher=user?.role==='teacher';
 const [data,setData]=useState(null),[students,setStudents]=useState([]),[texts,setTexts]=useState([]),[accounts,setAccounts]=useState([]);
 const [tab,setTab]=useState('sessions'),[modal,setModal]=useState(''),[editingStudent,setEditingStudent]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [filter,setFilter]=useState(''),[search,setSearch]=useState(''),[deleting,setDeleting]=useState(null),[audit,setAudit]=useState([]);
 const [invitationCode,setInvitationCode]=useState(''),[studentCode,setStudentCode]=useState('');

 const load=useCallback(async()=>{
  try{
   const requests=[api.get('/dashboard'),api.get('/students'),api.get('/texts')];
   if(isTeacher)requests.push(api.get('/students/accounts'));
   const results=await Promise.all(requests);
   setData(results[0].data);setStudents(results[1].data);setTexts(results[2].data);
   setAccounts(isTeacher?results[3].data:[]);setError('');
  }catch(e){setError(message(e));}
 },[isTeacher]);
 useEffect(()=>{load();},[load]);

 const submit=async e=>{
  e.preventDefault();setBusy(true);
  const d=Object.fromEntries(new FormData(e.target));
  try{
   if(modal==='student'||modal==='student-edit'){
    const body={...d,grade:+d.grade};
    if(modal==='student-edit')await api.patch(`/students/${editingStudent.id}`,body);
    else await api.post('/students',body);
   }else await api.post('/texts',{...d,level:+d.level});
   setModal('');setEditingStudent(null);await load();toast.success('Data berhasil disimpan.');
  }catch(e){toast.error(message(e));}
  finally{setBusy(false);}
 };
 const remove=async()=>{
  setBusy(true);
  try{await api.delete(`/${deleting.type}/${deleting.id}`);setDeleting(null);await load();toast.success('Data berhasil dihapus.');}
  catch(e){toast.error(message(e));}
  finally{setBusy(false);}
 };
 const pickTab=async v=>{setTab(v);if(v==='audit')try{setAudit((await api.get('/audit')).data);}catch(e){toast.error(message(e));}};
 const createInvitation=async()=>{
  setBusy(true);
  try{const response=await api.post('/auth/invitations');setInvitationCode(response.data.code);toast.success('Kode undangan berhasil dibuat.');}
  catch(e){toast.error(message(e));}
  finally{setBusy(false);}
 };
 const connectTeacher=async e=>{
  e.preventDefault();setBusy(true);
  try{await api.post('/auth/connect-teacher',{code:studentCode});setStudentCode('');await refreshUser();await load();toast.success('Akun berhasil terhubung dengan guru.');}
  catch(e){toast.error(message(e));}
  finally{setBusy(false);}
 };
 const openStudentModal=student=>{
  setEditingStudent(student||null);setModal(student?'student-edit':'student');
 };

 if(error&&!data)return <div className="page"><p className="error" data-testid="dashboard-error">{error}</p><Action data-testid="dashboard-retry" onClick={load}>Coba lagi</Action></div>;
 if(!data)return <Loading/>;

 const sessions=data.sessions.filter(s=>(!filter||s.student_id===filter)&&(`${s.student_alias} ${s.text_title}`.toLowerCase().includes(search.toLowerCase())));
 const trends=sessions.filter(s=>s.metrics.accuracy!==null&&s.metrics.speech_reliable!==false).slice(0,20).reverse().map((s,i)=>({session:i+1,accuracy:s.metrics.accuracy,date:dateLabel(s.created_at)}));
 const groupedProfileIds=new Set(accounts.flatMap(account=>account.profiles.map(profile=>profile.id)));
 const standaloneStudents=isTeacher?students.filter(s=>!groupedProfileIds.has(s.id)):students;

 return <div className={teacher?'page teacher-dashboard':'page'}>
  <PageHeading eyebrow={teacher?'RUANG GURU':'SETIAP LANGKAH BERARTI'} title={teacher?'Analitik Pembelajaran':'Perjalanan belajarmu.'} description={teacher?'Pantau aktivitas, riwayat, dan kemajuan kemampuan membaca siswa.':'Cerita, latihan, dan keberanianmu tersimpan di sini.'}>
   <div className="button-row"><Link data-testid="dashboard-start-session" to="/reading" className="action"><Plus size={16} style={{display:'inline',marginRight:5}}/>Sesi baru</Link></div>
  </PageHeading>
  <div className="stats-grid">{[{label:'Profil pembaca',value:data.students,icon:Users},{label:'Sesi membaca',value:data.session_count,icon:BookOpen},{label:'Ketepatan rata-rata',value:data.average_accuracy===null?'—':`${data.average_accuracy}%`,icon:Target},{label:'Menit membaca',value:data.reading_minutes,icon:Clock}].map((s,i)=><div className="stat" key={s.label}><span className="stat-icon"><s.icon size={21}/></span><div><strong data-testid={`dashboard-stat-${i}`}>{s.value}</strong><small>{s.label}</small></div></div>)}</div>
  <div className="tab-row">{[['sessions','Riwayat Sesi'],['practices','Riwayat Latihan'],['students','Profil Pembaca'],['trends','Perkembangan'],...(isTeacher?[['audit','Jejak Aktivitas']]:[])].map(([id,label])=><button key={id} data-testid={`dashboard-tab-${id}`} className={tab===id?'active':''} onClick={()=>pickTab(id)}>{label}</button>)}</div>

  {tab==='sessions'&&<><div className="section-toolbar"><h2>Sesi membaca</h2><div className="button-row"><select className="field" data-testid="filter-student" value={filter} onChange={e=>setFilter(e.target.value)}><option value="">Semua pembaca</option>{students.map(s=><option key={s.id} value={s.id}>{s.alias}</option>)}</select><input className="field" data-testid="session-search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari sesi…" aria-label="Cari sesi"/></div></div>
   {sessions.length?<div className="table-wrap"><table className="data-table"><thead><tr><th>Pembaca / materi</th><th>Tanggal</th><th>Profil sesi</th><th>Kualitas</th><th/></tr></thead><tbody>{sessions.map(s=><tr key={s.id} data-testid={`session-row-${s.id}`}><td><strong>{s.student_alias}</strong><p>{s.text_title}</p></td><td>{dateLabel(s.created_at)}</td><td>{s.profile}</td><td><span className={`badge ${s.quality}`}>{s.quality==='layak'?'Layak':s.quality==='parsial'?'Parsial':'Belum cukup'}</span></td><td><div className="button-row"><Link data-testid={`view-session-${s.id}`} to={`/results/${s.id}`} title="Lihat hasil"><ArrowRight size={17}/></Link><button className="icon-button" data-testid={`delete-session-${s.id}`} title="Hapus sesi" onClick={()=>setDeleting({type:'sessions',id:s.id,name:'sesi ini'})}><Trash2 size={14}/></button></div></td></tr>)}</tbody></table></div>:<Empty icon={BookOpen} title={search||filter?'Tidak ada sesi yang cocok':'Cerita pertamamu belum dimulai'}>Hasil akan muncul setelah sesi membaca diselesaikan. Tidak ada data contoh.</Empty>}</>}

  {tab==='practices'&&<><div className="section-toolbar"><h2>Latihan pelafalan & permainan</h2><Link className="text-button" to="/games">Buka Game Center</Link></div>
   {data.practices?.length?<div className="table-wrap"><table className="data-table" data-testid="practice-table"><thead><tr><th>Jenis</th><th>Detail</th><th>Hasil</th><th>Tanggal</th></tr></thead><tbody>{data.practices.map(p=>{const kind={pronunciation:['Pelafalan',Mic],gaze_game:['Ikuti Kata',Eye],sound_game:['Cocokkan Bunyi',Volume2]}[p.kind]||[p.kind,History];const Icon=kind[1];const a=p.assessment;return <tr key={p.id} data-testid={`practice-row-${p.id}`}><td><strong style={{display:'flex',gap:7,alignItems:'center'}}><Icon size={15}/>{kind[0]}</strong></td><td>{p.kind==='pronunciation'?<><strong>{p.word}</strong><p>Terdengar: {p.transcript||'—'}</p></>:p.kind==='gaze_game'?<>Level {p.level} · {p.words_hit}/{p.words_total} kata ditemukan{p.mean_time_ms?<p>rata-rata {(p.mean_time_ms/1000).toFixed(1)} detik/kata</p>:null}</>:<>{p.score} dari 5 bunyi cocok</>}</td><td>{p.kind==='pronunciation'?(p.metrics?.accuracy!=null?<span className={`badge ${a?.verdict==='tepat'?'layak':a?.verdict==='hampir'?'parsial':'tidak_cukup'}`}>{Math.round(p.metrics.accuracy)} · {a?.verdict==='tepat'?'Tepat':a?.verdict==='hampir'?'Hampir':a?'Perlu latihan':'Cocok'}</span>:'Tidak terdengar'):p.kind==='gaze_game'?`${p.score} poin`:`${p.stars} bintang`}</td><td>{dateLabel(p.created_at)}</td></tr>;})}</tbody></table></div>:<Empty icon={Mic} title="Belum ada latihan">Hasil latihan Pelafalan, Ikuti Kata, dan Cocokkan Bunyi akan muncul di sini.</Empty>}</>}

  {tab==='students'&&<>
   {isTeacher?<section className="panel mb-20"><div className="section-toolbar"><div><h2>Akun siswa terhubung</h2><p className="muted">Setiap akun dan profilnya hanya dapat dilihat oleh guru penghubung.</p></div><Action kind="small" data-testid="create-invitation" busy={busy} onClick={createInvitation}><Plus size={16}/>Buat kode undangan</Action></div>{invitationCode&&<div className="notice" data-testid="invitation-code"><strong>Kode undangan: {invitationCode}</strong><p>Berikan kode ini kepada siswa. Kode hanya dapat digunakan satu kali.</p></div>}
    {accounts.length?accounts.map(account=><div className="panel mb-20" key={account.id} data-testid={`linked-account-${account.id}`}><div className="section-toolbar"><div><h3>{account.name}</h3><p className="muted">{account.email}</p></div><span className="badge layak">{account.profiles.length} profil</span></div>
     {account.profiles.length?<div className="table-wrap"><table className="data-table"><thead><tr><th>Profil membaca</th><th>Kelas</th><th>Sesi</th><th>Aksi</th></tr></thead><tbody>{account.profiles.map(profile=><tr key={profile.id} data-testid={`account-profile-${profile.id}`}><td><strong>{profile.alias}</strong></td><td>{profile.grade}</td><td>{data.sessions.filter(session=>session.student_id===profile.id).length}</td><td><div className="button-row"><button className="text-button" onClick={()=>{setFilter(profile.id);setTab('sessions');}}>Riwayat</button><button className="text-button" onClick={()=>{setFilter(profile.id);setTab('trends');}}>Perkembangan</button><button className="icon-button" title="Ubah profil" onClick={()=>openStudentModal(profile)}><Edit3 size={15}/></button><button className="icon-button" title="Hapus profil dan seluruh sesinya" onClick={()=>setDeleting({type:'students',id:profile.id,name:`profil ${profile.alias} dan seluruh sesinya`})}><Trash2 size={15}/></button></div></td></tr>)}</tbody></table></div>:<p className="muted">Akun ini belum memiliki profil membaca.</p>}
    </div>):<Empty icon={Users} title="Belum ada akun siswa terhubung">Buat kode undangan untuk menghubungkan akun siswa.</Empty>}
   </section>:<section className="panel mb-20"><h2>Hubungkan akun dengan guru</h2>{user.teacher_id?<Notice>Akun ini sudah terhubung dengan guru. Profil membaca akun ini akan otomatis tersedia di dashboard guru.</Notice>:<><p className="muted">Masukkan kode undangan dari dashboard guru satu kali untuk menghubungkan akun dan seluruh profil membacamu.</p><form className="form-inline" onSubmit={connectTeacher}><label>Kode undangan<input data-testid="student-invitation-code" value={studentCode} onChange={e=>setStudentCode(e.target.value)} required minLength={8} maxLength={64} autoComplete="off"/></label><Action data-testid="connect-teacher" busy={busy} type="submit">Hubungkan akun</Action></form></>}</section>}
   <div className="section-toolbar"><h2>{isTeacher?'Profil yang belum dikelompokkan':'Profil pembaca'}</h2><Action kind="small" data-testid="add-student" onClick={()=>openStudentModal(null)}><Plus size={16}/>Tambah pembaca</Action></div>
   {standaloneStudents.length?<div className="table-wrap"><table className="data-table"><thead><tr><th>Nama panggilan / alias</th><th>Kelas</th><th>Sesi</th><th>Aksi</th></tr></thead><tbody>{standaloneStudents.map(s=><tr key={s.id} data-testid={`student-row-${s.id}`}><td><strong>{s.alias}</strong></td><td>{s.grade}</td><td>{data.sessions.filter(r=>r.student_id===s.id).length}</td><td><div className="button-row"><button className="icon-button" title="Ubah profil" onClick={()=>openStudentModal(s)}><Edit3 size={15}/></button><button title="Hapus profil dan seluruh sesinya" className="icon-button" data-testid={`delete-student-${s.id}`} onClick={()=>setDeleting({type:'students',id:s.id,name:`profil ${s.alias} dan seluruh sesinya`})}><Trash2 size={15}/></button></div></td></tr>)}</tbody></table></div>:<Empty icon={Users} title="Setiap pembaca punya cerita">Tambahkan nama panggilan dan kelas. Profil siswa terhubung ditampilkan pada kelompok akun di atas.</Empty>}
  </>}

  {tab==='trends'&&<section><div className="section-toolbar"><h2>Ketepatan dari waktu ke waktu</h2><select data-testid="trends-filter" className="field" style={{maxWidth:230}} value={filter} onChange={e=>setFilter(e.target.value)}><option value="">Semua pembaca</option>{students.map(s=><option key={s.id} value={s.id}>{s.alias}</option>)}</select></div>{trends.length?<div className="progress-chart" data-testid="progress-chart"><ResponsiveContainer width="100%" height="100%" initialDimension={{width:600,height:230}}><LineChart data={trends}><CartesianGrid strokeDasharray="3 3" stroke="#eee7f4"/><XAxis dataKey="session" tick={{fontSize:11}}/><YAxis domain={[0,100]} tick={{fontSize:11}}/><Tooltip labelFormatter={v=>`Sesi ${v}`} formatter={v=>[`${v}%`,'Ketepatan']}/><Line type="monotone" dataKey="accuracy" stroke="#e7995e" strokeWidth={3} dot={{fill:'#e7995e',r:4}}/></LineChart></ResponsiveContainer></div>:<Empty icon={Target} title="Kemajuan tumbuh dari latihan">Grafik tersedia setelah ada sesi dengan transkripsi andal atau sudah ditinjau pendamping.</Empty>}<Notice>Perubahan metrik antarbacaan tidak selalu menunjukkan perubahan kemampuan. Pertimbangkan level teks dan kualitas rekaman.</Notice></section>}

  {tab==='audit'&&<div className="table-wrap"><table className="data-table"><thead><tr><th>Waktu</th><th>Aktivitas</th><th>Referensi</th></tr></thead><tbody>{audit.map(a=><tr key={a.id} data-testid={`audit-${a.id}`}><td>{dateLabel(a.created_at)}</td><td>{a.action}</td><td>{a.target||'—'}</td></tr>)}</tbody></table></div>}

  <Dialog open={!!modal} onOpenChange={open=>{if(!open){setModal('');setEditingStudent(null);}}}><DialogContent data-testid="create-modal"><DialogTitle>{modal==='student-edit'?'Ubah profil pembaca':modal==='student'?'Kenalan dengan pembaca baru':'Tambah cerita baru'}</DialogTitle><DialogDescription>{modal==='student'||modal==='student-edit'?'Nama panggilan dan kelas profil membaca.':'Materi bacaan untuk sesi bersama pendamping.'}</DialogDescription><form className="form-stack" onSubmit={submit}>{modal==='student'||modal==='student-edit'?<><label>Nama panggilan / alias<input data-testid="student-alias" name="alias" required minLength={2} maxLength={50} defaultValue={editingStudent?.alias||''}/></label><label>Kelas<select data-testid="student-grade" name="grade" defaultValue={editingStudent?.grade||1}>{[1,2,3,4,5,6].map(n=><option key={n}>{n}</option>)}</select></label></>:<><label>Judul<input data-testid="text-title" name="title" required minLength={3} maxLength={120}/></label><label>Level<select data-testid="text-level" name="level">{[1,2,3,4,5,6].map(n=><option key={n}>{n}</option>)}</select></label><label>Isi bacaan<textarea data-testid="text-content" name="content" minLength={5} maxLength={8000} required/></label></>}<Action data-testid="save-create" busy={busy} type="submit">Simpan</Action></form></DialogContent></Dialog>
  <Dialog open={!!deleting} onOpenChange={()=>setDeleting(null)}><DialogContent data-testid="delete-modal"><DialogTitle>Hapus data ini?</DialogTitle><DialogDescription>{deleting?.name} akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.</DialogDescription><div className="button-row"><Action kind="ghost" data-testid="cancel-delete" onClick={()=>setDeleting(null)}>Batal</Action><Action kind="danger" data-testid="confirm-delete" busy={busy} onClick={remove}>Ya, hapus</Action></div></DialogContent></Dialog>
 </div>;
}
