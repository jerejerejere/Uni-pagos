type ReminderContact={name:string;phone:string;amount:number;due_day:number};
export function whatsappReminderHref(contact:ReminderContact,period:string){
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(period))throw Error('Período inválido.');
  const phone=contact.phone.replace(/[\s()+-]/g,'');
  if(!/^[1-9]\d{7,14}$/.test(phone))throw Error('Número de WhatsApp inválido.');
  const [year,month]=period.split('-').map(Number);
  const day=Math.min(contact.due_day,new Date(Date.UTC(year,month,0)).getUTCDate());
  const due=String(day).padStart(2,'0')+'/'+String(month).padStart(2,'0')+'/'+year;
  const amount=new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(contact.amount);
  const text=`Hola ${contact.name}, te escribimos de Universitario Vóley Club.\n\nTe recordamos tu mensualidad de ${amount}, correspondiente al período ${String(month).padStart(2,'0')}/${year}, con fecha de vencimiento ${due}.\n\nSi ya realizaste el pago, por favor envíanos tu comprobante. ¡Muchas gracias!`;
  return 'https://wa.me/'+phone+'?text='+encodeURIComponent(text);
}
