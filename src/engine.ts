import { BOOKS, CATEGORIES, TASKS, TASKS_BY_BOOK, TASKS_BY_CATEGORY, TASK_BY_ID, diffDays, dayOfWeek, localDay } from './catalog.ts'
import type { AppState, CategoryId, Task, Reflection } from './types.ts'

export function isCompleted(s:AppState,id:string){return Boolean(s.records[id])}
export function countDone(s:AppState, tasks:Task[]){return tasks.reduce((n,t)=>n+(isCompleted(s,t.id)?1:0),0)}
export function groupStats(s:AppState,cat:CategoryId){const tasks=TASKS_BY_CATEGORY.get(cat)??[];const done=countDone(s,tasks);return {done,total:tasks.length,remaining:tasks.length-done,percent:Math.round(done/tasks.length*100)||0}}
export function bookStats(s:AppState,bookId:string){const tasks=TASKS_BY_BOOK.get(bookId)??[];const done=countDone(s,tasks);return {done,total:tasks.length,remaining:tasks.length-done,percent:Math.round(done/tasks.length*100)||0}}
export function totalStats(s:AppState){const done=countDone(s,TASKS);return {done,total:TASKS.length,remaining:TASKS.length-done,percent:Math.round(done/TASKS.length*100)||0}}
export function nextTask(s:AppState,cat:CategoryId){return (TASKS_BY_CATEGORY.get(cat)??[]).find(t=>!isCompleted(s,t.id))}
export function nextTasks(s:AppState,cat:CategoryId,limit:number){return (TASKS_BY_CATEGORY.get(cat)??[]).filter(t=>!isCompleted(s,t.id)).slice(0,Math.max(0,limit))}
function recordDay(at:string){return at==='baseline'?'baseline':localDay(new Date(at))}
export function doneOnDay(s:AppState,cat:CategoryId,date:string){return (TASKS_BY_CATEGORY.get(cat)??[]).reduce((n,t)=>n + (s.records[t.id] && recordDay(s.records[t.id].at)===date?1:0),0)}
export function totalOnDay(s:AppState,date:string){return TASKS.reduce((n,t)=>n+(s.records[t.id] && recordDay(s.records[t.id].at)===date?1:0),0)}
function alreadyBefore(s:AppState, task:Task, day:string){const rec=s.records[task.id];return !!rec && (rec.seeded || recordDay(rec.at)<day)}
export function remainingAtDayStart(s:AppState,category:CategoryId,date:string){return (TASKS_BY_CATEGORY.get(category)??[]).filter(t=>!alreadyBefore(s,t,date)).length}
export function targetOnDay(s:AppState,category:CategoryId,date:string){
 const plan=s.settings.plans[category];
 if (!plan?.enabled||!plan.days.includes(dayOfWeek(date))||date<s.settings.startDate) return 0
 let pending=remainingAtDayStart(s,category,date)
 if(!pending)return 0
 if(category==='grammar'){
  const basicTasks=TASKS_BY_BOOK.get('g-basic')??[]
  const basicRemaining=basicTasks.filter(t=>!alreadyBefore(s,t,date)).length
  return Math.min(pending,basicRemaining>0?Math.min(basicRemaining,s.settings.basicPerDay):s.settings.intermediatePerDay)
 }
 return Math.min(pending,plan.perDay)
}
export function statusOnDay(s:AppState,date:string){
 const requirements=CATEGORIES.map(c=>({category:c.id,target:targetOnDay(s,c.id,date),done:doneOnDay(s,c.id,date)})).filter(x=>x.target>0)
 const totalDone=requirements.reduce((n,x)=>n+Math.min(x.done,x.target),0)
 const totalGoal=requirements.reduce((n,x)=>n+x.target,0)
 const full=totalGoal>0 && requirements.every(x=>x.done>=x.target)
 return {requirements,totalDone,totalGoal,full,hasActivity:totalOnDay(s,date)>0,rest:totalGoal===0}
}
export function completedDays(s:AppState,end=localDay()){
 const days=Math.max(0,Math.min(diffDays(s.settings.startDate,end),800))
 let full=0,active=0
 for(let n=0;n<=days;n++){
  const dt=addDays(s.settings.startDate,n)
  const stat=statusOnDay(s,dt)
  if(stat.full)full++
  if(stat.hasActivity)active++
 }
 return {full,active}
}
export function addDays(day:string,days:number){const [y,m,d]=day.split('-').map(Number); const date=new Date(y,m-1,d+days,12);return localDay(date)}
export function recentDays(s:AppState,limit=14){const today=localDay();return Array.from({length:limit},(_,i)=>{const day=addDays(today,-limit+i+1);return {...statusOnDay(s,day),date:day,count:totalOnDay(s,day)}})}
export function currentPace(s:AppState,cat:CategoryId,days=14){const today=localDay();let count=0;for(let i=0;i<days;i++) count+=doneOnDay(s,cat,addDays(today,-i));return count/days*7}
export function forecast(s:AppState,cat:CategoryId){
 const remaining=groupStats(s,cat).remaining
 if(!remaining)return {weeks:0,method:'done' as const}
 const last=currentPace(s,cat)
 if(last>=1)return {weeks:Math.ceil(remaining/last),method:'actual' as const}
 const plan=s.settings.plans[cat]
 if(cat==='grammar'){
  const b=(TASKS_BY_BOOK.get('g-basic')??[]).filter(t=>!s.records[t.id]).length
  const i=(TASKS_BY_BOOK.get('g-int')??[]).filter(t=>!s.records[t.id]).length
  const weeklyDays=plan.enabled?plan.days.length:0
  const weeks=weeklyDays>0?Math.ceil(b/(weeklyDays*s.settings.basicPerDay)+i/(weeklyDays*s.settings.intermediatePerDay)):null
  return {weeks,method:'planned' as const}
 }
 const weekly=plan.enabled?plan.days.length*plan.perDay:0
 return {weeks:weekly?Math.ceil(remaining/weekly):null,method:'planned' as const}
}
export function complete(s:AppState,taskId:string,at=new Date().toISOString()):AppState{
 if(!TASK_BY_ID.has(taskId)||s.records[taskId])return s
 return {...s,revision:s.revision+1,records:{...s.records,[taskId]:{at}},activity:[...s.activity,{at,action:'complete' as const,taskId}].slice(-4000)}
}
export function undo(s:AppState,taskId:string,at=new Date().toISOString()):AppState{
 if(!TASK_BY_ID.has(taskId)||!s.records[taskId])return s
 const records={...s.records};delete records[taskId]
 return {...s,revision:s.revision+1,records,activity:[...s.activity,{at,action:'undo' as const,taskId}].slice(-4000)}
}
export function editSettings(s:AppState,changes:Partial<AppState['settings']>):AppState{
 return {...s,revision:s.revision+1,settings:{...s.settings,...changes}}
}
export function saveReflection(s:AppState,item:Reflection):AppState{
 return {...s,revision:s.revision+1,reflections:[...s.reflections.filter(r=>r.date!==item.date),item].sort((a,b)=>a.date.localeCompare(b.date))}
}
export function readBackup(value:unknown):AppState{
 const root=(value && typeof value==='object' && 'state' in value)?(value as {state:unknown}).state:value
 if(!root||typeof root!=='object')throw Error('ساختار فایل معتبر نیست.')
 const raw=root as Partial<AppState>
 if(raw.schema!==1||typeof raw.records!=='object'||!raw.records||!raw.settings||typeof raw.settings!=='object')throw Error('نسخه پشتیبان پشتیبانی نمی‌شود.')
 const settings=raw.settings as AppState['settings']
 if(!/^\d{4}-\d{2}-\d{2}$/.test(settings.startDate||'')||!/^\d{4}-\d{2}-\d{2}$/.test(settings.deadline||''))throw Error('تاریخ‌های فایل نامعتبر است.')
 const plans={} as AppState['settings']['plans']
 for(const c of CATEGORIES){
   const p=settings.plans?.[c.id]
   if(!p||!Array.isArray(p.days)||!p.days.every(x=>Number.isInteger(x)&&x>=0&&x<=6)||!Number.isInteger(p.perDay)||p.perDay<1||p.perDay>20)throw Error('برنامه روزانه نامعتبر است.')
   plans[c.id]={enabled:!!p.enabled,days:[...new Set(p.days)],perDay:p.perDay}
 }
 const records:AppState['records']={}
 for(const [id,v] of Object.entries(raw.records)){
   if(!TASK_BY_ID.has(id)||!v||typeof v.at!=='string'||(v.at!=='baseline'&&Number.isNaN(Date.parse(v.at))))throw Error(`وضعیت درس نامعتبر: ${id}`)
   records[id]={at:v.at,seeded:!!v.seeded}
 }
 const basicPerDay=Number(settings.basicPerDay), intermediatePerDay=Number(settings.intermediatePerDay)
 if(!Number.isInteger(basicPerDay)||basicPerDay<1||basicPerDay>20||!Number.isInteger(intermediatePerDay)||intermediatePerDay<1||intermediatePerDay>20)throw Error('سرعت گرامر نامعتبر است.')
 const activity=(Array.isArray(raw.activity)?raw.activity:[]).filter(a=>a&&TASK_BY_ID.has(a.taskId)&&['complete','undo'].includes(a.action)&&typeof a.at==='string').slice(-4000)
 const reflections=(Array.isArray(raw.reflections)?raw.reflections:[]).filter(r=>r&&/^\d{4}-\d{2}-\d{2}$/.test(r.date)&&['listening','reading','speaking','writing'].every(k=>Number.isInteger(r[k as keyof Reflection])&&Number(r[k as keyof Reflection])>=1&&Number(r[k as keyof Reflection])<=5)).map(r=>({date:r.date,listening:r.listening,reading:r.reading,writing:r.writing,speaking:r.speaking,note:String(r.note??'').slice(0,2000)})).slice(-1000)
 return {schema:1,revision:Math.max(0,Number(raw.revision)||0)+1,records,activity,reflections,settings:{startDate:settings.startDate,deadline:settings.deadline,plans,basicPerDay,intermediatePerDay,theme:settings.theme==='light'?'light':'dark',language:settings.language==='en'?'en':'fa',lastExportAt:typeof settings.lastExportAt==='string'?settings.lastExportAt:undefined}}
}
export function getBookOrder(){return BOOKS}
