import {SessionError,requireConfig,type AuthConfig} from './session';
export async function firebaseCall(config:AuthConfig,operation:string,body:unknown){
  requireConfig(config);
  let response:Response;
  try{response=await fetch('https://identitytoolkit.googleapis.com/v1/accounts:'+operation+'?key='+encodeURIComponent(config.apiKey),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(12000)});}
  catch{throw new SessionError('No se pudo conectar con el servicio de acceso. Intenta nuevamente.',503);}
  const result=await response.json() as any;
  if(!response.ok){
    if(result.error?.message==='TOO_MANY_ATTEMPTS_TRY_LATER')throw new SessionError('Demasiados intentos. Espera unos minutos.',429);
    throw new SessionError('No se pudo iniciar sesión. Revisa tu correo y contraseña.',401);
  }
  return result;
}
export async function refreshFirebase(config:AuthConfig,refreshToken:string){
  requireConfig(config);
  let response:Response;
  try{response=await fetch('https://securetoken.googleapis.com/v1/token?key='+encodeURIComponent(config.apiKey),{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'refresh_token',refresh_token:refreshToken}),signal:AbortSignal.timeout(12000)});}
  catch{throw new SessionError('No se pudo renovar la sesión. Intenta nuevamente.',503);}
  if(!response.ok)throw new SessionError('Vuelve a iniciar sesión.',401);
  return await response.json() as {id_token:string;refresh_token:string;expires_in:string};
}
