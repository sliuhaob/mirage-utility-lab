const MAPS=['mirage','nuke','ancient','dust2','inferno','anubis','cache'];
export const tacticKey=item=>(item.local?'local:':'public:')+(item.recordId||item.id);
export const tacticEntry=item=>({key:tacticKey(item),name:item.name,from:item.from,type:item.type,team:item.team});
export function tacticItems(tactic,items){
 const keys=new Set(tactic.entries.map(e=>e.key));
 return items.filter(item=>item.map===tactic.map&&keys.has(tacticKey(item)));
}
export function validateTactic(value){
 if(!value||!MAPS.includes(value.map)||typeof value.name!=='string'||!value.name.trim()||value.name.trim().length>60)throw Error('请填写 1～60 字的战术名称');
 if(!Array.isArray(value.entries)||!value.entries.length||value.entries.length>200)throw Error('请选择 1～200 条道具教程');
 const entries=value.entries.map(e=>{
  if(!e||typeof e.key!=='string'||!/^(local|public):[a-zA-Z0-9-]{1,100}$/.test(e.key)||!['smoke','flash','he','molotov'].includes(e.type)||!['t','ct','any'].includes(e.team))throw Error('战术道具记录无效');
  if(typeof e.name!=='string'||e.name.length>80||typeof e.from!=='string'||e.from.length>120)throw Error('战术道具说明无效');
  return {key:e.key,name:e.name,from:e.from,type:e.type,team:e.team};
 });
 return {name:value.name.trim(),map:value.map,entries:[...new Map(entries.map(e=>[e.key,e])).values()]};
}
let database;
function open(){
 if(!database)database=new Promise((resolve,reject)=>{
  const request=indexedDB.open('roxy-cs2-tactics',1);
  request.onupgradeneeded=()=>request.result.createObjectStore('tactics',{keyPath:'id'});
  request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>{db.close();database=null;};resolve(db);};
  request.onerror=()=>reject(request.error);
  request.onblocked=()=>reject(Error('请关闭其他旧版地图页面后重试'));
 }).catch(error=>{database=null;throw error;});
 return database;
}
export async function listTactics(){
 const db=await open();return new Promise((resolve,reject)=>{
  const tx=db.transaction('tactics'),request=tx.objectStore('tactics').getAll();
  tx.oncomplete=()=>resolve(request.result.sort((a,b)=>b.updated-a.updated));tx.onabort=()=>reject(tx.error);
 });
}
async function write(value,remove=false){
 const data=remove?null:validateTactic(value),id=value.id||crypto.randomUUID();
 if(!/^[a-f0-9-]{36}$/.test(id))throw Error('战术编号无效');
 const db=await open();return new Promise((resolve,reject)=>{
  const tx=db.transaction('tactics','readwrite'),store=tx.objectStore('tactics');let result,failure;
  tx.oncomplete=()=>resolve(result);tx.onabort=()=>reject(failure||tx.error||Error('战术保存失败'));
  const read=store.get(id);read.onsuccess=()=>{
   const old=read.result;
   if(value.id&&(!old||old.revision!==value.revision)){failure=Error('这个战术已在其他页面修改或删除，请重新打开战术本');tx.abort();return;}
   if(remove){store.delete(id);return;}
   result={...data,id,revision:(old?.revision||0)+1,updated:Date.now()};store.put(result);
  };
 });
}
export const saveTactic=value=>write(value);
export const deleteTactic=value=>write(value,true);
