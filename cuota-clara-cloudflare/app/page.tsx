import {headers} from 'next/headers';
import {ArrowRight,CalendarDays,Check,LockKeyhole,MessageCircle,ShieldCheck,Users} from 'lucide-react';
import {authorizeOwnerIdentity,SessionError} from '@/lib/session';
import {authConfig} from '@/lib/server';
import LoginForm from './login-form';
import {LogoutButton} from './panel/session-controls';

export const dynamic='force-dynamic';
export default async function Login(){
  const config=authConfig();
  const configured=!!(config.projectId&&config.apiKey&&config.adminUid);
  let signedIn=false;
  let denied=false;
  try{await authorizeOwnerIdentity(await headers(),config);signedIn=true;}
  catch(error){if(!(error instanceof SessionError))throw error;denied=error.status===403;}
  return <main className="login-page">
    <section className="login-story" aria-label="Universitario Vóley Club">
      <a className="login-brand" href="/" aria-label="Universitario Vóley Club, inicio"><span className="club-logo" role="img" aria-label="Escudo del club"/><span>UNIVERSITARIO<small>VÓLEY CLUB</small></span></a>
      <div className="login-story-content"><span className="login-eyebrow">UN EQUIPO. TODO EN ORDEN.</span><h1>Más tiempo<br/>para la <em>cancha.</em></h1><p>Las mensualidades de tu club, organizadas.<br/>Para que tú te concentres en el juego.</p><div className="login-features"><span><Users size={17}/> Tu equipo</span><span><CalendarDays size={17}/> Tus mensualidades</span><span><MessageCircle size={17}/> Tus recordatorios</span></div></div>
      <div className="login-court" aria-hidden="true"><div/><span/></div>
      <p className="login-story-footer">JUNTOS, DENTRO Y FUERA DE LA CANCHA.</p>
    </section>
    <section className="login-access" aria-labelledby="login-title">
      <span className="login-private"><LockKeyhole size={13}/> ESPACIO PRIVADO DEL CLUB</span>
      <div className="login-card"><div className="login-lock"><ShieldCheck size={25}/></div><p className="section-kicker">ADMINISTRACIÓN DEL CLUB</p><h2 id="login-title">{signedIn?'Qué bueno verte.':'Bienvenido al equipo.'}</h2><p className="login-description">{signedIn?'Tu sesión está activa. Entra para gestionar las personas, los pagos y los recordatorios del club.':'Inicia sesión para administrar las mensualidades y mantener todo al día.'}</p>
        {denied&&<p className="login-denied" role="alert">Esta cuenta no tiene acceso al club. Usa la cuenta administradora para continuar.</p>}
        {signedIn?<><div className="login-session"><span className="avatar">JB</span><div><strong>Jeremy</strong><small>Administrador del club</small></div><Check size={18}/></div><a className="login-button" href="/panel">Entrar al panel <ArrowRight size={18}/></a><LogoutButton/></>:<LoginForm configured={configured}/>}
        <div className="login-security"><ShieldCheck size={17}/><p>Acceso reservado a la administración.<br/>Los contactos y pagos se mantienen privados.</p></div>
      </div>
      <p className="login-footnote">UNIVERSITARIO VÓLEY CLUB <span>·</span> Gestión de mensualidades</p>
    </section>
  </main>;
}
