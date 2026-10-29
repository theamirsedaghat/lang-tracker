import test from 'node:test'
import assert from 'node:assert/strict'
import { initialState, TASKS, BOOKS, localDay, shiftDate } from '../src/catalog.ts'
import { totalStats, groupStats, statusOnDay, complete, undo, readBackup, targetOnDay, bookStats, saveReflection, forecast } from '../src/engine.ts'

const today='2026-10-29'
const fresh=()=>initialState(today)
test('exact catalog totals and seeded baseline',()=>{
 const s=fresh();assert.equal(TASKS.length,652);assert.equal(totalStats(s).done,41);assert.equal(totalStats(s).remaining,611)
 assert.equal(groupStats(s,'aef').total,96);assert.equal(groupStats(s,'listening').remaining,54)
 assert.equal(groupStats(s,'grammar').remaining,246);assert.equal(groupStats(s,'reading').remaining,82)
 assert.equal(groupStats(s,'writing').remaining,31);assert.equal(groupStats(s,'busuu').remaining,102)
 assert.equal(bookStats(s,'g-basic').remaining,104);assert.equal(bookStats(s,'g-int').total,142)
 assert.equal(bookStats(s,'aef2').total,36)
 assert.equal(bookStats(s,'aef3').total,20)
 assert.equal(bookStats(s,'r1').remaining,10)
 assert.equal(s.settings.deadline,shiftDate(today,145))
})
test('today only complete after all scheduled goals',()=>{
 let s=fresh()
 const first=statusOnDay(s,today)
 assert.equal(first.totalGoal,6);assert.equal(first.full,false)
 const ids=['aef2-1A','t-basic-19','g-basic-10','g-basic-11','r1-8'+'1','b0-1']
 assert.equal(ids.length,6)
 const at='2026-10-29T09:15:00.000Z'
 for (const id of ids) s=complete(s,id,at)
 const done=statusOnDay(s,today)
 assert.equal(done.totalGoal,6);assert.equal(done.full,true)
 s=undo(s,'aef2-1A',at)
 assert.equal(statusOnDay(s,today).full,false)
})
test('calendar schedules and grammar switch work',()=>{
 let s=fresh()
 assert.equal(targetOnDay(s,'grammar',today),2)
 assert.equal(targetOnDay(s,'writing',today),0)
 assert.equal(statusOnDay(s,'2026-11-01').rest,true) // Sunday
 for(let n=10;n<=113;n++)s=complete(s,`g-basic-${n}`,'2026-10-29T09:00:00Z')
 assert.equal(targetOnDay(s,'grammar','2026-10-30'),1)
 assert.equal(groupStats(s,'grammar').remaining,142)
})
test('import/export roundtrip validates known tasks',()=>{
 let s=complete(fresh(),'aef2-1A','2026-10-29T10:00:00Z')
 const parsed=readBackup(JSON.parse(JSON.stringify({state:s})))
 assert.equal(parsed.records['aef2-1A'].at,'2026-10-29T10:00:00Z')
 assert.ok(parsed.revision>s.revision)
 assert.throws(()=>readBackup({...s,records:{'unrecognized-1':{at:'baseline',seeded:true}}}))
})
test('self assessment records a single entry per date',()=>{
 const r={date:today,listening:3,reading:3,writing:2,speaking:2,note:'review'}
 let s=saveReflection(fresh(),r)
 s=saveReflection(s,{...r,writing:4})
 assert.equal(s.reflections.length,1);assert.equal(s.reflections[0].writing,4)
})
test('planned grammar forecast accounts for double basic pace',()=>{
 const fc=forecast(fresh(),'grammar')
 assert.equal(fc.method,'planned');assert.equal(fc.weeks,33)
})
