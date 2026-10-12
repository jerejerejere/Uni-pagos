import {db} from './server';
import {SessionError} from './session';
export async function limitAuth(req:Request,scope:string,limit=10,seconds=900){
  const ip=req.headers.get('CF-Connecting-IP')||'local';
  const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(scope+':'+ip));
  const key=Array.from(new Uint8Array(hash),n=>n.toString(16).padStart(2,'0')).join('');
  const now=Math.floor(Date.now()/1000);
  const row=await db().prepare('INSERT INTO auth_limits (id,attempts,expires_at) VALUES (?,1,?) ON CONFLICT(id) DO UPDATE SET attempts=CASE WHEN auth_limits.expires_at<=? THEN 1 ELSE auth_limits.attempts+1 END, expires_at=CASE WHEN auth_limits.expires_at<=? THEN excluded.expires_at ELSE auth_limits.expires_at END RETURNING attempts').bind(key,now+seconds,now,now).first<{attempts:number}>();
  await db().prepare('DELETE FROM auth_limits WHERE expires_at<?').bind(now-3600).run();
  if(!row||row.attempts>limit)throw new SessionError('Demasiados intentos. Espera unos minutos.',429);
}
