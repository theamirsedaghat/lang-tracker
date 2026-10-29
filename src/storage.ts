import { localDay } from './catalog.ts'
import type { AppState, Archive } from './types.ts'

const DB_NAME='english-mastery-os-db'
const DB_VERSION=1
let dbPromise:Promise<IDBDatabase>|null=null
function openDB():Promise<IDBDatabase>{
 if(!('indexedDB' in window))return Promise.reject(new Error('مرورگر از IndexedDB پشتیبانی نمی‌کند.'))
 if(dbPromise)return dbPromise
 const promise = new Promise<IDBDatabase>((resolve,reject)=>{
  const request=indexedDB.open(DB_NAME,DB_VERSION)
  request.onupgradeneeded=()=>{
   const db=request.result
   if(!db.objectStoreNames.contains('data'))db.createObjectStore('data')
   if(!db.objectStoreNames.contains('archives'))db.createObjectStore('archives',{keyPath:'id'})
  }
  request.onsuccess=()=>resolve(request.result)
  request.onerror=()=>reject(request.error)
  request.onblocked=()=>reject(new Error('لطفاً تب‌های دیگر برنامه را ببند و دوباره امتحان کن.'))
 })
 dbPromise = promise.catch((e: unknown)=>{dbPromise=null;throw e})
 return dbPromise
}
function txDone(tx:IDBTransaction):Promise<void>{return new Promise((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)})}
export async function loadState():Promise<AppState|null>{
 const db=await openDB()
 return new Promise((resolve,reject)=>{
  const r=db.transaction('data','readonly').objectStore('data').get('state')
  r.onsuccess=()=>resolve((r.result as AppState)||null)
  r.onerror=()=>reject(r.error)
 })
}
let queue:Promise<void>=Promise.resolve()
export function saveState(s:AppState,forceArchive=false):Promise<void>{
 // Queue writes so two fast taps cannot save out of order.
 queue=queue.catch(()=>{}).then(()=>writeState(s,forceArchive))
 return queue
}
async function writeState(s:AppState,forceArchive:boolean):Promise<void>{
 const db=await openDB()
 const tx=db.transaction(['data','archives'],'readwrite')
 tx.objectStore('data').put(s,'state')
 const now=new Date().toISOString()
 const day=localDay()
 tx.objectStore('archives').put({id:`daily:${day}`,at:now,reason:'آخرین نسخه امروز',state:s} satisfies Archive)
 if(forceArchive||s.revision>0&&s.revision%15===0)tx.objectStore('archives').put({id:`revision:${String(s.revision).padStart(7,'0')}`,at:now,reason:forceArchive?'پیش از بازیابی':'بازیابی دوره‌ای',state:s} satisfies Archive)
 const store=tx.objectStore('archives')
 const getKeys=store.getAllKeys()
 getKeys.onsuccess=()=>{
  const keys=getKeys.result.map(String)
  const rev=keys.filter(k=>k.startsWith('revision:')).sort()
  const daily=keys.filter(k=>k.startsWith('daily:')).sort()
  for(const key of [...rev.slice(0,-20),...daily.slice(0,-30)])store.delete(key)
 }
 await txDone(tx)
}
export async function getArchives():Promise<Archive[]>{
 await queue.catch(()=>{})
 const db=await openDB()
 return new Promise((resolve,reject)=>{
  const req=db.transaction('archives','readonly').objectStore('archives').getAll()
  req.onsuccess=()=>resolve((req.result as Archive[]).sort((a,b)=>b.at.localeCompare(a.at)))
  req.onerror=()=>reject(req.error)
 })
}
export async function restoreArchive(id:string):Promise<AppState>{
 const list=await getArchives()
 const arc=list.find(a=>a.id===id)
 if(!arc)throw Error('نسخه انتخاب‌شده پیدا نشد.')
 return structuredClone(arc.state)
}
export async function requestDurableStorage():Promise<boolean>{
 if(!navigator.storage?.persist)return false
 return navigator.storage.persist()
}
export function exportJson(s:AppState):void{
 const payload={format:'English Mastery OS Backup',createdAt:new Date().toISOString(),state:s}
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'})
 const url=URL.createObjectURL(blob)
 const a=document.createElement('a');a.href=url;a.download=`english-mastery-backup-${localDay()}.json`;document.body.append(a);a.click();a.remove()
 window.setTimeout(()=>URL.revokeObjectURL(url),1500)
}
