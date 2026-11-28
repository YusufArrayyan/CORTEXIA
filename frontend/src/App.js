import {BrowserRouter,Routes,Route} from 'react-router-dom';
import {Toaster} from './components/ui/sonner';
import {AuthProvider,RequireAuth,RequireTeacher} from './components/Auth';
import {Layout} from './components/Layout';
import Home from './pages/Home';
import Reading from './pages/Reading';
import Pronunciation from './pages/Pronunciation';
import Results from './pages/Results';
import Dashboard from './pages/Dashboard';
import Research from './pages/Research';
import Games from './pages/Games';
import GazeGame from './pages/GazeGame';
import Materials from './pages/Materials';
import {Splash} from './components/Splash';
import './App.css';
import './compact.css';
import './features.css';
export default function App(){return <BrowserRouter basename={process.env.PUBLIC_URL}><AuthProvider><Layout><Routes><Route path="/" element={<Home/>}/><Route path="/reading" element={<RequireAuth><Reading/></RequireAuth>}/><Route path="/pronunciation" element={<RequireAuth><Pronunciation/></RequireAuth>}/><Route path="/results/:id" element={<RequireAuth><Results/></RequireAuth>}/><Route path="/teacher" element={<RequireTeacher><Dashboard teacher/></RequireTeacher>}/><Route path="/materials" element={<RequireTeacher><Materials/></RequireTeacher>}/><Route path="/progress" element={<RequireAuth><Dashboard/></RequireAuth>}/><Route path="/research" element={<RequireTeacher><Research/></RequireTeacher>}/><Route path="/games" element={<Games/>}/><Route path="/games/ikuti-kata" element={<RequireAuth><GazeGame/></RequireAuth>}/><Route path="*" element={<div className="empty"><h1>Halaman tidak ditemukan</h1><a href="/" data-testid="not-found-home">Kembali ke beranda</a></div>}/></Routes></Layout><Toaster position="top-center" richColors/><Splash/></AuthProvider></BrowserRouter>;}