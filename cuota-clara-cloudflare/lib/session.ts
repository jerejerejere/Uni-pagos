import {decodeProtectedHeader,importX509,jwtVerify,type JWTVerifyGetKey} from 'jose';
export class SessionError extends Error {
  status:number;
  constructor(message:string,status:number){super(message);this.status=status;}
}
export type AuthConfig={projectId:string;apiKey:string;adminUid:string};
export const SESSION_COOKIE='__Host-cuota_session';
export const REFRESH_COOKIE='__Host-cuota_refresh';
const certURL='https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
let certs:{expires:number;values:Record<string,string>}|undefined;
export const googleKey:JWTVerifyGetKey=async header=>{
  if(header.alg!=='RS256'||!header.kid)throw new SessionError('Sesión inválida.',401);
  if(!certs||certs.expires<=Date.now()){
    const response=await fetch(certURL,{signal:AbortSignal.timeout(10000)});
    if(!response.ok)throw new SessionError('No se pudo verificar la sesión. Intenta nuevamente.',503);
    const values=await response.json() as Record<string,string>;
    const seconds=Math.min(Number(response.headers.get('cache-control')?.match(/max-age=(\d+)/)?.[1]||300),3600);
    certs={values,expires:Date.now()+seconds*1000};
  }
  const certificate=certs.values[header.kid];
  if(!certificate)throw new SessionError('Sesión inválida. Vuelve a iniciar sesión.',401);
  return importX509(certificate,'RS256');
};
export function requireConfig(config:AuthConfig){
  if(!config.projectId||!config.apiKey||!config.adminUid)throw new SessionError('El acceso aún no está configurado. Contacta al administrador.',503);
}
export async function verifyAdminToken(token:string,config:AuthConfig,key:JWTVerifyGetKey=googleKey){
  requireConfig(config);
  try{
    if(!token||token.length>16000||decodeProtectedHeader(token).alg!=='RS256')throw Error();
    const {payload}=await jwtVerify(token,key,{algorithms:['RS256'],issuer:'https://securetoken.google.com/'+config.projectId,audience:config.projectId,requiredClaims:['sub','exp','iat','auth_time']});
    const now=Math.floor(Date.now()/1000);
    if(typeof payload.sub!=='string'||!payload.sub||payload.sub.length>128||typeof payload.iat!=='number'||payload.iat>now||typeof payload.auth_time!=='number'||payload.auth_time>now)throw Error();
    if(payload.sub!==config.adminUid)throw new SessionError('Esta cuenta no tiene acceso al club.',403);
    return payload;
  }catch(error){if(error instanceof SessionError)throw error;throw new SessionError('Tu sesión venció o no es válida. Vuelve a iniciar sesión.',401);}
}
export function cookieValue(headers:Pick<Headers,'get'>,name:string){
  const matches=(headers.get('cookie')||'').split(';').map(value=>value.trim()).filter(value=>value.startsWith(name+'='));
  if(matches.length!==1)return '';
  try{return decodeURIComponent(matches[0].slice(name.length+1));}catch{return '';}
}
export function assertSameOrigin(req:Request){
  if(req.headers.get('origin')!==new URL(req.url).origin||req.headers.get('sec-fetch-site')==='cross-site')throw new SessionError('Origen no autorizado.',403);
}
export async function authorizeOwnerIdentity(headers:Pick<Headers,'get'>,config:AuthConfig,key:JWTVerifyGetKey=googleKey){
  // No trust in caller-supplied email, UID or oai-authenticated-* headers.
  return verifyAdminToken(cookieValue(headers,SESSION_COOKIE),config,key);
}
export async function readJSON(req:Request){
  if(!req.headers.get('content-type')?.startsWith('application/json'))throw new SessionError('Formato inválido.',415);
  const reader=req.body?.getReader();if(!reader)throw new SessionError('Solicitud vacía.',400);
  const chunks:Uint8Array[]=[];let length=0;
  for(;;){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>16384){await reader.cancel();throw new SessionError('Solicitud demasiado grande.',413);}chunks.push(value);}
  const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  try{return JSON.parse(new TextDecoder().decode(bytes));}catch{throw new SessionError('Solicitud inválida.',400);}
}
export function setSessionCookies(headers:Headers,idToken:string,refreshToken:string,expiresIn:number){
  const flags='; Path=/; HttpOnly; Secure; SameSite=Strict';
  headers.append('Set-Cookie',SESSION_COOKIE+'='+encodeURIComponent(idToken)+'; Max-Age='+Math.max(0,Math.min(3600,Math.floor(expiresIn)))+flags);
  // Browser-session cookie: closed browser removes the refresh credential.
  headers.append('Set-Cookie',REFRESH_COOKIE+'='+encodeURIComponent(refreshToken)+flags);
}
export function clearSessionCookies(headers:Headers){for(const name of [SESSION_COOKIE,REFRESH_COOKIE])headers.append('Set-Cookie',name+'=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0');}
