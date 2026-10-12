import {auth,db,json} from '@/lib/server';
import {SessionError} from '@/lib/session';
export async function GET(req:Request){
  try{
    await auth(req);
    const tables=['contacts','payments','sends','settings'] as const;
    const results=await db().batch(tables.map(table=>db().prepare('SELECT * FROM '+table)));
    const data=Object.fromEntries(tables.map((table,index)=>[table,results[index].results]));
    return json({format:'cuota-clara-backup',version:1,exportedAt:new Date().toISOString(),data},200,new Headers({'Content-Disposition':'attachment; filename="cuota-clara-backup-'+new Date().toISOString().slice(0,10)+'.json"'}));
  }catch(error){return json({error:error instanceof SessionError?error.message:'No se pudo crear el respaldo.'},error instanceof SessionError?error.status:500);}
}
