import { redirect } from 'next/navigation';
import { getLocalUser } from './local-auth';
import Workspace from './workspace';
export const dynamic='force-dynamic';
export default async function Home(){
  const user = await getLocalUser();
  if (!user) redirect('/login');
  return <Workspace name={user.displayName} role={user.role}/>;
}
