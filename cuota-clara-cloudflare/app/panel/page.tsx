import {headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {authorizeOwnerIdentity,SessionError} from '@/lib/session';
import {authConfig} from '@/lib/server';
import Dashboard from './dashboard';

export const dynamic='force-dynamic';
export default async function Panel(){
  let allowed=false;
  try{await authorizeOwnerIdentity(await headers(),authConfig());allowed=true;}
  catch(error){if(!(error instanceof SessionError))throw error;}
  if(!allowed)redirect('/');
  return <Dashboard/>;
}
