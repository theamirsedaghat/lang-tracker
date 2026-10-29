import type { Book, CategoryId, Task, AppState, Plan } from './types.ts'

export const CATEGORIES: { id: CategoryId; name: string; en: string; icon: string; gradient: string; description: string }[] = [
 { id:'aef', name:'American English File', en:'Core English', icon:'book', gradient:'#5b8bfc', description:'مکالمه، واژگان و دانش عمومی زبان' },
 { id:'listening', name:'Tactics for Listening', en:'Listening', icon:'headphones', gradient:'#8d79f7', description:'Basic → Developing → Expanding' },
 { id:'grammar', name:'Grammar in Use', en:'Grammar', icon:'layers', gradient:'#eea65b', description:'Basic → Intermediate (American)' },
 { id:'reading', name:'Active Skills for Reading', en:'Reading', icon:'bookOpen', gradient:'#41b4ae', description:'Levels 1 → 4' },
 { id:'writing', name:'Great Writing', en:'Writing', icon:'pen', gradient:'#f4779d', description:'Levels 1 → 4' },
 { id:'busuu', name:'Busuu', en:'App learning', icon:'sparkles', gradient:'#69c28b', description:'A2 → B1 → B2 → C1' }
]

export const BOOKS: Book[] = [
 {id:'aef2',category:'aef',title:'American English File 2',subtitle:'12 units · 3 lessons each',units:12,lessonsPerUnit:['A','B','C'],color:'#5b8bfc'},
 {id:'aef3',category:'aef',title:'American English File 3',subtitle:'10 units · A/B',units:10,lessonsPerUnit:['A','B'],color:'#5b8bfc'},
 {id:'aef4',category:'aef',title:'American English File 4',subtitle:'10 units · A/B',units:10,lessonsPerUnit:['A','B'],color:'#5b8bfc'},
 {id:'aef5',category:'aef',title:'American English File 5',subtitle:'10 units · A/B',units:10,lessonsPerUnit:['A','B'],color:'#5b8bfc'},
 {id:'t-basic',category:'listening',title:'Tactics: Basic',subtitle:'24 units',units:24,color:'#8d79f7'},
 {id:'t-dev',category:'listening',title:'Tactics: Developing',subtitle:'24 units',units:24,color:'#8d79f7'},
 {id:'t-expand',category:'listening',title:'Tactics: Expanding',subtitle:'24 units',units:24,color:'#8d79f7'},
 {id:'g-basic',category:'grammar',title:'Basic Grammar in Use (4th)',subtitle:'113 units',units:113,color:'#eea65b'},
 {id:'g-int',category:'grammar',title:'Grammar in Use Intermediate (US 4th)',subtitle:'142 units',units:142,color:'#eea65b'},
 ...[1,2,3,4].map(i=>({id:`r${i}`,category:'reading' as CategoryId,title:`Active Skills for Reading ${i}`,subtitle:'12 units · 2 lessons each',units:12,lessonsPerUnit:['1','2'],color:'#41b4ae'})),
 ...[8,10,7,6].map((units,i)=>({id:`w${i+1}`,category:'writing' as CategoryId,title:`Great Writing ${i+1}`,subtitle:`${units} units`,units,color:'#f4779d'})),
 ...[31,29,26,16].map((units,i)=>({id:`b${i}`,category:'busuu' as CategoryId,title:`Busuu ${['A2','B1','B2','C1'][i]}`,subtitle:`${units} chapters · chapters, not lessons`,units,color:'#69c28b'}))
]

export const TASKS: Task[] = BOOKS.flatMap(book=>{
 const items: Task[]=[]
 for (let n=1; n<=book.units; n++) {
   for (const part of book.lessonsPerUnit ?? ['']) {
     items.push({id:`${book.id}-${n}${part}`,bookId:book.id,category:book.category,ordinal:items.length,unit:n,lesson:part||undefined,label: book.category==='aef'?`${n}${part}`: book.category==='reading'?`${n}.${part}`: book.category==='busuu'?`Chapter ${n}`:`Unit ${n}`})
   }
 }
 return items
})
export const TASK_BY_ID = new Map(TASKS.map(t=>[t.id,t]))
export const BOOK_BY_ID = new Map(BOOKS.map(b=>[b.id,b]))
export const TASKS_BY_BOOK = new Map(BOOKS.map(b=>[b.id,TASKS.filter(t=>t.bookId===b.id)]))
export const TASKS_BY_CATEGORY = new Map(CATEGORIES.map(c=>[c.id,TASKS.filter(t=>t.category===c.id)]))

export function localDay(d: Date = new Date()) { const yyyy=d.getFullYear(), mm=String(d.getMonth()+1).padStart(2,'0'),dd=String(d.getDate()).padStart(2,'0');return `${yyyy}-${mm}-${dd}` }
export function shiftDate(day:string, offset:number){ const [y,m,d]=day.split('-').map(Number); const date=new Date(y,m-1,d+offset,12); return localDay(date) }
export function diffDays(from:string,to:string){const [y1,m1,d1]=from.split('-').map(Number),[y2,m2,d2]=to.split('-').map(Number);return Math.round((Date.UTC(y2,m2-1,d2)-Date.UTC(y1,m1-1,d1))/86400000)}
export function dayOfWeek(day:string){const [y,m,d]=day.split('-').map(Number);return new Date(y,m-1,d,12).getDay()}

const schedule=(days:number[],perDay:number):Plan=>({enabled:true,days,perDay})
export function initialState(today=localDay()):AppState{
 const records:AppState['records']={}
 // Baseline units were completed before the tracker started; no invented historical dates.
 for (const [bookId,count] of [['t-basic',18],['g-basic',9],['r1',14]] as const) {
   for(const t of (TASKS_BY_BOOK.get(bookId)??[]).slice(0,count)) records[t.id]={at:'baseline',seeded:true}
 }
 return {
  schema:1, revision:0, records, activity:[], reflections:[],
  settings:{
   startDate:today,deadline:shiftDate(today,145),language:'fa',theme:'dark',basicPerDay:2,intermediatePerDay:1,
   plans:{
    aef:schedule([1,2,3,4,5,6],1),
    listening:schedule([1,2,3,4,5,6],1),
    grammar:schedule([1,2,3,4,5,6],2),
    reading:schedule([1,2,3,4,5],1),
    writing:schedule([2,5],1),
    busuu:schedule([1,2,3,4,5],1)
   }
  }
 }
}
