'use client';
import {useEffect,useRef,useState} from 'react';
import {CalendarDays,Check,Clock,FileClock,Pencil,ShieldCheck,Wallet,X} from 'lucide-react';

type Payment={period:string;paid_at:string};
type Contact={id:string;name:string;phone:string;amount:number;active:number;due_day:number};
const monthLabel=(period:string)=>new Date(period+'-02T12:00:00Z').toLocaleDateString('es-CL',{month:'long',year:'numeric',timeZone:'America/Santiago'});
const dateLabel=(value:string)=>new Date(value).toLocaleString('es-CL',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'America/Santiago'});
const money=(value:number)=>new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(value);

export default function PaymentHistory({contact,period,onClose,onEdit}:{contact:Contact;period:string;onClose:()=>void;onEdit:()=>void}){
  const [payments,setPayments]=useState<Payment[]|null>(null);
  const [error,setError]=useState('');
  const [authError,setAuthError]=useState(false);
  const [attempt,setAttempt]=useState(0);
  const ref=useRef<HTMLElement>(null);
  const closeRef=useRef(onClose);
  closeRef.current=onClose;
  useEffect(()=>{
    const previousFocus=document.activeElement as HTMLElement|null;
    const overflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
    ref.current?.querySelector<HTMLButtonElement>('button')?.focus();
    function handleKey(event:KeyboardEvent){
      if(event.key==='Escape'){event.preventDefault();closeRef.current();return;}
      if(event.key!=='Tab')return;
      const fields=Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href]')||[]);
      const first=fields[0],last=fields[fields.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
    }
    document.addEventListener('keydown',handleKey);
    return ()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',handleKey);if(previousFocus?.isConnected)previousFocus.focus();};
  },[]);
  useEffect(()=>{
    const controller=new AbortController();
    setPayments(null);setError('');setAuthError(false);
    async function load(){
      try{
        const response=await fetch('/api/payment-history?id='+encodeURIComponent(contact.id),{signal:controller.signal});
        const result=await response.json() as {payments:Payment[];error?:string};
        if(!response.ok){setAuthError(response.status===401||response.status===403);throw Error(result.error||'No se pudo cargar el historial.');}
        if(!controller.signal.aborted)setPayments(result.payments);
      }catch(error){if(!controller.signal.aborted)setError((error as Error).message);}
    }
    load();
    return ()=>controller.abort();
  },[contact.id,attempt]);
  const paid=payments?.some(payment=>payment.period===period);
  return <div className="modal-backdrop"><section ref={ref} className="modal payment-history-modal" role="dialog" aria-modal="true" aria-labelledby="person-history-title">
    <div className="modal-head"><div className="section-kicker">FICHA DE LA PERSONA</div><button type="button" className="icon-button" onClick={onClose} aria-label="Cerrar historial"><X size={21}/></button></div>
    <div className="history-person"><span className="person-avatar">{contact.name.split(' ').slice(0,2).map(name=>name[0]).join('').toUpperCase()}</span><div><h2 id="person-history-title">{contact.name}</h2><p>+{contact.phone}<span className={'badge '+(contact.active?'green':'inactive-badge')}>{contact.active?'Activa':'Inactiva'}</span></p></div></div>
    <div className="history-overview"><div><span><Wallet size={16}/> Mensualidad actual</span><strong>{money(contact.amount)}</strong><small>Vencimiento: día {contact.due_day}</small></div><div><span><CalendarDays size={16}/> Período consultado</span><strong className="history-period">{monthLabel(period)}</strong><small>{payments?(paid?'Pago registrado':contact.active?'Pago pendiente':'Sin pago registrado'):'Consultando estado…'}</small></div></div>
    <div className="history-heading"><div><h3>Historial de pagos</h3><p>Todos los meses registrados, del más reciente al más antiguo.</p></div>{payments&&<span className="history-count">{payments.length} {payments.length===1?'pago':'pagos'}</span>}</div>
    {error?<div className="history-error" role="alert"><p>{error}</p>{authError?<a href="/login" target="_top" className="secondary">Iniciar sesión</a>:<button className="secondary" onClick={()=>setAttempt(value=>value+1)}>Volver a intentar</button>}</div>:payments===null?<div className="history-empty" role="status"><Clock size={25}/><p>Cargando el historial…</p></div>:payments.length===0?<div className="history-empty"><FileClock size={30}/><h3>Aún no hay pagos registrados</h3><p>Cuando marques una mensualidad como pagada, aparecerá aquí con su mes y fecha de registro.</p></div>:<div className="table-scroll"><table className="history-payments"><thead><tr><th>PERÍODO</th><th>REGISTRADO EL</th><th>ESTADO</th></tr></thead><tbody>{payments.map(payment=><tr key={payment.period}><td className="history-period">{monthLabel(payment.period)}</td><td><time dateTime={payment.paid_at}>{dateLabel(payment.paid_at)}</time></td><td><span className="badge green"><Check size={11}/> Pagado</span></td></tr>)}</tbody></table></div>}
    <p className="history-footnote"><ShieldCheck size={14}/> Pagos registrados manualmente · Fechas en horario de Chile.</p>
    <div className="modal-actions history-actions"><button type="button" className="secondary" onClick={onEdit}><Pencil size={15}/> Editar persona</button><button type="button" className="primary" onClick={onClose}>Cerrar historial</button></div>
  </section></div>;
}
