'use client';
import {useEffect,useState} from 'react';
import {LogOut} from 'lucide-react';
export function SessionHeartbeat(){
  useEffect(()=>{
    async function refresh(){try{const response=await fetch('/api/auth/refresh',{method:'POST'});if(response.status===401||response.status===403)window.location.replace('/');}catch{/* Show the ordinary load error if the network is temporarily unavailable. */}}
    const timer=setInterval(refresh,40*60*1000);
    function visible(){if(document.visibilityState==='visible')refresh();}
    document.addEventListener('visibilitychange',visible);
    return ()=>{clearInterval(timer);document.removeEventListener('visibilitychange',visible);};
  },[]);
  return null;
}
export function LogoutButton(){
  const [busy,setBusy]=useState(false),[error,setError]=useState(false);
  async function logout(){setBusy(true);setError(false);try{const response=await fetch('/api/auth/logout',{method:'POST'});if(!response.ok)throw Error();window.location.replace('/');}catch{setError(true);setBusy(false);}}
  return <span><button type="button" className="signout-link" disabled={busy} onClick={logout}><LogOut size={15}/>{busy?'Cerrando…':'Cerrar sesión'}</button>{error&&<small role="alert">No se pudo cerrar. Intenta nuevamente.</small>}</span>;
}
