import test from 'node:test';
import assert from 'node:assert/strict';
import {initialWorld,pair,fallback,dialogueContext} from '../lib/world.ts';
test('next turn goes to the listener in the same place',()=>{const w=initialWorld();w.logs.push({day:1,time:480,speaker:'A',text:'밥 더 있어?',mode:'기본 대사'});assert.equal(pair(w)[0].id,'b');w.characters[1].home='away';assert.equal(pair(w),undefined)});
test('fallback answers immediate questions instead of restarting a topic',()=>{const [a,b]=initialWorld().characters;const text=fallback(a,b,undefined,[],{action:'저녁 식사',placeType:'집',last:'밥 더 먹을래?'});assert.ok(['조금만 더 줘.','아니, 난 배불러.','응. 이만큼만.'].includes(text))});
test('school fallback uses school-specific conversation',()=>{const [a,b]=initialWorld().characters;const text=fallback(a,b,undefined,[],{action:'등교 · 공부',placeType:'학교'});assert.ok(['지금 몇 쪽이야?','필기 좀 보여 줘.','아, 펜 안 나온다.','여기까지 적었어?','쉬는 시간 아직 멀었나.'].includes(text))});
test('AI context includes named place, type and both activities',()=>{const w=initialWorld();w.minute=600;const ctx=dialogueContext(w,...w.characters);assert.equal(ctx.place.type,'직장');assert.equal(ctx.listenerActivity.action,'출근 · 업무')});
