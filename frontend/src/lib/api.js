import axios from 'axios';
const backendUrl=process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
export const api=axios.create({baseURL:`${backendUrl.replace(/\/+$/, '')}/api`});
api.interceptors.request.use(config=>{const token=sessionStorage.getItem('cortexia-token');if(token) config.headers.Authorization=`Bearer ${token}`;return config;});
export const message=e=>{const d=e.response?.data?.detail;return typeof d==='string'?d:Array.isArray(d)?'Periksa kembali isian formulir.':e.message||'Terjadi kesalahan. Silakan coba lagi.';};
export const dateLabel=v=>new Date(v).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'});