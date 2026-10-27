import { getDb } from '../../../db';
import { worlds } from '../../../db/schema';
import { validWorld } from '../../../lib/world';
import { eq } from 'drizzle-orm';
export async function POST(req:Request){try{if(Number(req.headers.get('content-length')||0)>2500000)return Response.json({error:'이미지 용량을 줄여주세요.'},{status:413});const raw=await req.text();if(raw.length>2500000)return Response.json({error:'세계가 너무 큽니다.'},{status:413});const data=JSON.parse(raw);if(!validWorld(data))return Response.json({error:'세계 설정을 확인해주세요. 캐릭터는 2~6명이 필요해요.'},{status:400});const id=crypto.randomUUID();await getDb().insert(worlds).values({id,data:JSON.stringify(data),created:Date.now()});return Response.json({id});}catch{return Response.json({error:'저장하지 못했어요. 잠시 후 다시 시도해주세요.'},{status:500})}}
export async function GET(req:Request){const id=new URL(req.url).searchParams.get('id');if(!id)return Response.json({error:'ID가 필요해요.'},{status:400});const rows=await getDb().select().from(worlds).where(eq(worlds.id,id)).limit(1);return rows[0]?Response.json(JSON.parse(rows[0].data)):Response.json({error:'세계를 찾을 수 없어요.'},{status:404})}
