import {useCallback,useEffect,useState} from 'react';
import {Plus,Trash2,Edit3,BookOpen} from 'lucide-react';
import {toast} from 'sonner';
import {api,message} from '../lib/api';
import {Action,PageHeading,Loading,Empty} from '../components/Common';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '../components/ui/dialog';

export default function Materials(){
 const [texts,setTexts]=useState([]),[loading,setLoading]=useState(true),[modal,setModal]=useState(false),[editing,setEditing]=useState(null),[busy,setBusy]=useState(false),[deleting,setDeleting]=useState(null);
 const load=useCallback(()=>api.get('/texts').then(r=>setTexts(r.data)).catch(e=>toast.error(message(e))).finally(()=>setLoading(false)),[]);
 useEffect(()=>{load();},[load]);
 const openCreate=()=>{setEditing(null);setModal(true);};
 const openEdit=t=>{setEditing(t);setModal(true);};
 const submit=async e=>{
  e.preventDefault();setBusy(true);
  const d=Object.fromEntries(new FormData(e.target));
  const payload={...d,level:+d.level};
  try{
   if(editing)await api.patch(`/texts/${editing.id}`,payload);else await api.post('/texts',payload);
   setModal(false);setEditing(null);await load();toast.success(editing?'Materi berhasil diperbarui.':'Materi berhasil ditambahkan.');
  }catch(e){toast.error(message(e));}finally{setBusy(false);}
 };
 const remove=async()=>{
  setBusy(true);
  try{await api.delete(`/texts/${deleting.id}`);setDeleting(null);await load();toast.success('Materi berhasil dihapus.');}catch(e){toast.error(message(e));}finally{setBusy(false);}
 };
 if(loading)return <Loading/>;
 return <div className="page teacher-dashboard-page"><PageHeading eyebrow="PENGELOLAAN PEMBELAJARAN" title="Materi Bacaan" description="Kelola cerita dan bacaan yang dapat dipilih siswa."><Action data-testid="add-text" kind="small" onClick={openCreate}><Plus size={16}/>Tambah bacaan</Action></PageHeading>{texts.length?<div className="table-wrap"><table className="data-table"><thead><tr><th>Judul bacaan</th><th>Level</th><th>Jumlah kata</th><th>Sumber</th><th/></tr></thead><tbody>{texts.map(t=><tr key={t.id} data-testid={`text-row-${t.id}`}><td><strong>{t.title}</strong></td><td>Kelas {t.level}</td><td>{t.word_count}</td><td>{t.source}</td><td>{t.owner_id!=='shared'&&<div className="button-row"><button className="icon-button" title="Edit materi" data-testid={`edit-text-${t.id}`} onClick={()=>openEdit(t)}><Edit3 size={15}/></button><button className="icon-button" title="Hapus materi" data-testid={`delete-text-${t.id}`} onClick={()=>setDeleting(t)}><Trash2 size={15}/></button></div>}</td></tr>)}</tbody></table></div>:<Empty icon={BookOpen} title="Belum ada materi">Tambahkan bacaan pertama untuk pembelajaran siswa.</Empty>}<Dialog open={modal} onOpenChange={setModal}><DialogContent data-testid="text-modal"><DialogTitle>{editing?'Edit materi bacaan':'Tambah materi bacaan'}</DialogTitle><DialogDescription>Materi akan tersedia untuk semua siswa yang diawasi guru ini.</DialogDescription><form className="form-stack" onSubmit={submit}><label>Judul<input data-testid="text-title" name="title" required minLength={3} maxLength={120} defaultValue={editing?.title||''}/></label><label>Level<select data-testid="text-level" name="level" defaultValue={editing?.level||1}>{[1,2,3,4,5,6].map(n=><option key={n} value={n}>Kelas {n}</option>)}</select></label><label>Isi bacaan<textarea data-testid="text-content" name="content" required minLength={5} maxLength={8000} defaultValue={editing?.content||''}/></label><Action data-testid="save-text" busy={busy} type="submit">Simpan</Action></form></DialogContent></Dialog><Dialog open={!!deleting} onOpenChange={()=>setDeleting(null)}><DialogContent data-testid="delete-text-modal"><DialogTitle>Hapus materi bacaan?</DialogTitle><DialogDescription>{deleting?.title} akan dihapus permanen.</DialogDescription><div className="button-row"><Action kind="ghost" onClick={()=>setDeleting(null)}>Batal</Action><Action kind="danger" busy={busy} onClick={remove}>Ya, hapus</Action></div></DialogContent></Dialog></div>;
}
