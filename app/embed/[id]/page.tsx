import Simulator from '../../Simulator';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <Simulator worldId={id} embed/>}
