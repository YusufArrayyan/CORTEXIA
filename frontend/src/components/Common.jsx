import { Link } from 'react-router-dom';
import { ArrowLeft, LoaderCircle, ShieldCheck } from 'lucide-react';
import { Button } from './ui/button';
export const Action=({children,kind='',className='',busy=false,disabled=false,...props})=><Button className={`action ${kind} ${className}`} disabled={busy||disabled} {...props}>{busy&&<LoaderCircle className="spin" size={18}/>} {children}</Button>;
export const Back=({to='/',text='Kembali ke menu'})=><Link className="back" data-testid="back-link" to={to}><ArrowLeft size={18}/>{text}</Link>;
export const Empty=({icon:Icon,title,children})=><div className="empty" data-testid="empty-state">{Icon&&<Icon size={36}/>}<h3 data-testid="empty-title">{title}</h3>{children&&<p data-testid="empty-description">{children}</p>}</div>;
export const Loading=()=> <div className="loading" data-testid="loading-state"><LoaderCircle className="spin"/> Sedang menyiapkan…</div>;
export const Notice=({children,warning=false})=><div className={`notice ${warning?'warning':''}`} data-testid="notice"><ShieldCheck size={18}/><span>{children}</span></div>;
export const PageHeading=({eyebrow,title,description,children})=><div className="page-heading"><div>{eyebrow&&<span className="eyebrow" data-testid="page-eyebrow">{eyebrow}</span>}<h1 data-testid="page-title">{title}</h1>{description&&<p data-testid="page-description">{description}</p>}</div>{children}</div>;