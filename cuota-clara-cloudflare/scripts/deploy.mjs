import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const config=JSON.parse(readFileSync(new URL('../wrangler.jsonc',import.meta.url),'utf8'));
const missing=['FIREBASE_PROJECT_ID','FIREBASE_API_KEY','ADMIN_UID'].filter(key=>!config.vars?.[key]);
if(!config.d1_databases?.[0]?.database_id||config.d1_databases[0].database_id.startsWith('00000000-'))missing.push('D1 database_id');
if(missing.length){console.error('Publicación bloqueada. Completa la configuración: '+missing.join(', '));process.exit(1);}
if(config.vars.AUTO_SEND_ENABLED!=='false'){console.error('La edición $0 requiere AUTO_SEND_ENABLED=false.');process.exit(1);}
function run(args){const result=spawnSync(process.execPath,args,{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);}
run(['node_modules/typescript/bin/tsc','--noEmit']);
run(['node_modules/vinext/dist/cli.js','build']);
run(['node_modules/wrangler/bin/wrangler.js','deploy','--config','dist/server/wrangler.json']);
