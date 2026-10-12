'use client';
import {useEffect,useState} from 'react';
import {ArrowRight,Eye,EyeOff} from 'lucide-react';
export default function LoginForm({configured}:{configured:boolean}){
  const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[show,setShow]=useState(false),[reset,setReset]=useState(false),[busy,setBusy]=useState(false),[checking,setChecking]=useState(configured),[error,setError]=useState(''),[message,setMessage]=useState('');
  useEffect(()=>{if(!configured)return;let alive=true;fetch('/api/auth/refresh',{method:'POST'}).then(response=>{if(alive&&response.ok)window.location.replace('/panel');}).catch(()=>{}).finally(()=>{if(alive)setChecking(false);});return ()=>{alive=false;};},[configured]);
  async function submit(event:React.FormEvent){
    event.preventDefault();setBusy(true);setError('');setMessage('');
    try{
      const response=await fetch('/api/auth/'+(reset?'reset':'login'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(reset?{email}:{email,password})});
      const result=await response.json() as {error?:string;message?:string};
      if(!response.ok)throw Error(result.error||'No se pudo completar la solicitud.');
      setPassword('');if(reset)setMessage(result.message||'Revisa tu correo.');else window.location.assign('/panel');
    }catch(error){setError((error as Error).message);}finally{setBusy(false);}
  }
  return <form className="email-login-form" onSubmit={submit}>
    {!configured&&<p className="login-denied" role="status">El acceso está pendiente de configuración. Tus datos permanecen protegidos.</p>}
    {checking?<p role="status" className="login-description">Comprobando tu sesión…</p>:<><label htmlFor="email">Correo electrónico<input id="email" type="email" autoComplete="username" required maxLength={254} value={email} onChange={event=>setEmail(event.target.value)} placeholder="tu@correo.cl" disabled={!configured||busy}/></label>
    {!reset&&<label htmlFor="password">Contraseña<div className="password-field"><input id="password" type={show?'text':'password'} autoComplete="current-password" required maxLength={4096} value={password} onChange={event=>setPassword(event.target.value)} disabled={!configured||busy}/><button type="button" onClick={()=>setShow(!show)} aria-label={show?'Ocultar contraseña':'Mostrar contraseña'}>{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>}
    {error&&<p className="login-denied" role="alert">{error}</p>}{message&&<p className="login-success" role="status">{message}</p>}
    <button className="login-button" disabled={!configured||busy} type="submit">{busy?'Un momento…':reset?'Recuperar contraseña':'Iniciar sesión'}<ArrowRight size={18}/></button>
    <button type="button" className="login-switch" disabled={busy} onClick={()=>{setReset(!reset);setError('');setMessage('');setPassword('');}}>{reset?'Volver al inicio de sesión':'Olvidé mi contraseña'}</button></>}
  </form>;
}
