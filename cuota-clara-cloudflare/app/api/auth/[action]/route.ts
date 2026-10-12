import {authConfig,json} from '@/lib/server';
import {assertSameOrigin,readJSON,verifyAdminToken,SessionError,setSessionCookies,clearSessionCookies,cookieValue,REFRESH_COOKIE,requireConfig} from '@/lib/session';
import {firebaseCall,refreshFirebase} from '@/lib/firebase-rest';
import {limitAuth} from '@/lib/rate-limit';
export async function POST(req:Request){
  const action=new URL(req.url).pathname.split('/').pop();
  try{
    assertSameOrigin(req);
    const config=authConfig();
    if(action==='logout'){const headers=new Headers();clearSessionCookies(headers);return json({ok:true},200,headers);}
    requireConfig(config);
    if(action==='refresh'){
      const token=cookieValue(req.headers,REFRESH_COOKIE);
      if(!token)throw new SessionError('Inicia sesión para continuar.',401);
      await limitAuth(req,'refresh',60);
      const result=await refreshFirebase(config,token);
      await verifyAdminToken(result.id_token,config);
      const headers=new Headers();setSessionCookies(headers,result.id_token,result.refresh_token,Number(result.expires_in));
      return json({ok:true},200,headers);
    }
    if(action!=='login'&&action!=='reset')return json({error:'Acción desconocida.'},404);
    await limitAuth(req,action,action==='reset'?3:10);
    const body=await readJSON(req);
    if(typeof body.email!=='string'||body.email.length>254||!/^\S+@\S+\.\S+$/.test(body.email))throw new SessionError('Ingresa un correo válido.',400);
    const email=body.email.trim();
    if(action==='reset'){
      try{await firebaseCall(config,'sendOobCode',{requestType:'PASSWORD_RESET',email});}
      catch(error){if(error instanceof SessionError&&[429,503].includes(error.status))throw error;}
      return json({ok:true,message:'Si el correo tiene una cuenta, recibirás instrucciones para recuperar tu contraseña.'});
    }
    if(typeof body.password!=='string'||!body.password||body.password.length>4096)throw new SessionError('Ingresa tu contraseña.',400);
    const result=await firebaseCall(config,'signInWithPassword',{email,password:body.password,returnSecureToken:true});
    await verifyAdminToken(result.idToken,config);
    const headers=new Headers();setSessionCookies(headers,result.idToken,result.refreshToken,Number(result.expiresIn));
    return json({ok:true},200,headers);
  }catch(error){
    const status=error instanceof SessionError?error.status:500;
    const headers=new Headers();if(action==='refresh'&&[401,403].includes(status))clearSessionCookies(headers);
    return json({error:error instanceof SessionError?error.message:'No se pudo completar la solicitud.'},status,headers);
  }
}
