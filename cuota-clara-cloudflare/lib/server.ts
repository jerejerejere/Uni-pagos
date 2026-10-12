import {env} from 'cloudflare:workers';
import {assertSameOrigin,authorizeOwnerIdentity,type AuthConfig} from './session';
export function authConfig():AuthConfig{return {projectId:env.FIREBASE_PROJECT_ID||'',apiKey:env.FIREBASE_API_KEY||'',adminUid:env.ADMIN_UID||''};}
export async function auth(req:Request){
  if(!['GET','HEAD'].includes(req.method))assertSameOrigin(req);
  return authorizeOwnerIdentity(req.headers,authConfig());
}
export function db(){if(!env.DB)throw Error('Base de datos no disponible.');return env.DB;}
export function config(){return {token:env.WHATSAPP_ACCESS_TOKEN,phoneId:env.WHATSAPP_PHONE_NUMBER_ID,version:env.WHATSAPP_API_VERSION};}
export function connected(){const c=config();return env.AUTO_SEND_ENABLED==='true'&&!!(c.token&&/^\d+$/.test(c.phoneId||'')&&/^v\d+\.\d+$/.test(c.version||''));}
export function json(data:unknown,status=200,extra?:Headers){const headers=extra||new Headers();headers.set('Cache-Control','no-store');return Response.json(data,{status,headers});}
export async function getSettings(){return await db().prepare('SELECT * FROM settings WHERE id=1').first<any>()||{enabled:0,template:'recordatorio_mensualidad',language:'es_CL'};}
