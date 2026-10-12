import {readFileSync,writeFileSync} from 'node:fs';
const [source,destination]=process.argv.slice(2);
if(!source||!destination){console.error('Uso: node scripts/backup-to-sql.mjs respaldo.json importacion.sql');process.exit(1);}
const backup=JSON.parse(readFileSync(source,'utf8'));
if(backup.format!=='cuota-clara-backup'||backup.version!==1||!backup.data)throw Error('Formato de respaldo inválido.');
const columns={contacts:['id','name','phone','amount','due_day','reminder_day','active','consent','created_at'],payments:['contact_id','period','paid_at'],sends:['id','contact_id','name','period','status','detail','created_at'],settings:['id','enabled','template','language']};
function value(input){if(input===null)return 'NULL';if(typeof input==='number'&&Number.isFinite(input))return String(input);if(typeof input==='string'&&!input.includes('\0'))return "'"+input.replaceAll("'","''")+"'";throw Error('Valor inválido en el respaldo.');}
const statements=['-- Solo importar en una base nueva y vacía. No reemplaza registros existentes.','-- Automatización deshabilitada deliberadamente.'];
const counts={};
for(const [table,fields] of Object.entries(columns)){
 const rows=backup.data[table];if(!Array.isArray(rows))throw Error('Falta la tabla '+table);
 counts[table]=rows.length;
 for(const row of rows){const record={...row};if(table==='settings')record.enabled=0;for(const field of fields)if(!Object.hasOwn(record,field))throw Error('Falta columna '+table+'.'+field);statements.push('INSERT INTO '+table+' ('+fields.join(',')+') VALUES ('+fields.map(field=>value(record[field])).join(',')+');');}
}
writeFileSync(destination,statements.join('\n')+'\n',{mode:0o600});
console.log('Archivo de importación creado. Recuentos:',counts);
