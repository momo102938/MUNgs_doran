import test from 'node:test';
import assert from 'node:assert/strict';
import {initialWorld,activity,tick,pair,validWorld,MAX_CHARACTERS} from '../lib/world.ts';
test('midnight advances day and bounds needs',()=>{const w=initialWorld();w.minute=1435;const n=tick(w);assert.equal(n.day,2);assert.equal(n.minute,0);assert.ok(n.characters.every(c=>c.fatigue>=0&&c.fatigue<=100))});
test('work, home, sleep and weekend use scheduled locations',()=>{const c=initialWorld().characters[0];assert.equal(activity(c,540,1).place,'work');assert.equal(activity(c,1080,1).place,'home');assert.equal(activity(c,0,1).action,'취침');assert.equal(activity(c,540,6).place,'home')});
test('children study and do homework',()=>{const c={...initialWorld().characters[0],age:10,destination:'school',homework:true};assert.equal(activity(c,600,1).action,'등교 · 공부');assert.equal(activity(c,1180,1).action,'숙제')});
test('dialogue excludes sleeping and separate locations',()=>{const w=initialWorld();assert.equal(pair(w).length,2);w.characters[1].home='other';assert.equal(pair(w),undefined);w.minute=0;assert.equal(pair(w),undefined)});
test('import validation rejects malformed and oversized worlds',()=>{const w=initialWorld();assert.ok(validWorld(w));assert.ok(!validWorld({...w,characters:[]}));assert.ok(!validWorld({...w,minute:2000}));assert.ok(!validWorld({...w,characters:Array.from({length:MAX_CHARACTERS+1},(_,i)=>({...w.characters[0],id:String(i)}))}));assert.ok(!validWorld({...w,characters:w.characters.map(c=>({...c,image:'javascript:alert(1)'}))}))});
