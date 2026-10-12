import {auth,db,json} from '@/lib/server';
import {SessionError} from '@/lib/session';

export async function GET(req:Request){
  try{
    await auth(req);
    const id=new URL(req.url).searchParams.get('id');
    if(!id||id.length>100)return json({error:'Persona inválida.'},400);
    const contact=await db().prepare('SELECT id FROM contacts WHERE id=?').bind(id).first();
    if(!contact)return json({error:'La persona ya no existe.'},404);
    const payments=await db().prepare('SELECT period,paid_at FROM payments WHERE contact_id=? ORDER BY period DESC').bind(id).all();
    return json({payments:payments.results});
  }catch(error){
    return json({error:error instanceof SessionError?error.message:'No se pudo cargar el historial de pagos.'},error instanceof SessionError?error.status:500);
  }
}
