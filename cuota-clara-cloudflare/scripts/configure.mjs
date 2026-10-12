import {readFileSync,writeFileSync} from 'node:fs';
import {createInterface} from 'node:readline/promises';
const io=createInterface({input:process.stdin,output:process.stdout});
const file=new URL('../wrangler.jsonc',import.meta.url);
const config=JSON.parse(readFileSync(file,'utf8'));
console.log('Configura solo identificadores públicos. Nunca pegues contraseñas ni tokens privados.');
try{
 const project=(await io.question('ID del proyecto Firebase: ')).trim();
 const apiKey=(await io.question('Clave API web pública Firebase: ')).trim();
 const uid=(await io.question('UID Firebase de tu usuario administrador: ')).trim();
 const database=(await io.question('ID de la base D1 cuota-clara: ')).trim();
 if(!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(project)||!apiKey||!uid||uid.length>128||!/^[a-f0-9-]{36}$/.test(database)||database.startsWith('00000000-'))throw Error('Revisa los identificadores. No se guardaron cambios.');
 Object.assign(config.vars,{FIREBASE_PROJECT_ID:project,FIREBASE_API_KEY:apiKey,ADMIN_UID:uid,AUTO_SEND_ENABLED:'false'});
 config.d1_databases[0].database_id=database;
 writeFileSync(file,JSON.stringify(config,null,2)+'\n');
 console.log('Configuración guardada. No se publicó ni se activó facturación.');
}finally{io.close();}
