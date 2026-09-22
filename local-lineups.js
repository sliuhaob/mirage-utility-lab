import {validateSubmission,MAX_VIDEO_BYTES} from './submission-schema.js';

// Keep metadata separate: opening a map must not load every saved video into memory.
const DB_NAME='roxy-cs2-local',ID=/^local-[a-f0-9-]{36}$/;
let database;
function open(){
 if(!database)database=new Promise((resolve,reject)=>{
  const request=indexedDB.open(DB_NAME,1);
  request.onupgradeneeded=()=>{const db=request.result;db.createObjectStore('lineups',{keyPath:'id'});db.createObjectStore('videos');};
  request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>{db.close();database=null;};resolve(db);};
  request.onerror=()=>reject(request.error);
  request.onblocked=()=>reject(Error('请关闭其他旧版地图页面后重试'));
 }).catch(error=>{database=null;throw error;});
 return database;
}
async function transaction(stores,mode,run){
 const db=await open();return new Promise((resolve,reject)=>{
  const tx=db.transaction(stores,mode);let result;
  tx.oncomplete=()=>resolve(result?.result);
  tx.onabort=()=>reject(tx.error||Error('本地保存失败'));
  try{result=run(tx);}catch(error){tx.abort();reject(error);}
 });
}
export function localError(error){return error?.name==='QuotaExceededError'?'浏览器存储空间不足，请删除不需要的视频后重试':error?.name==='SecurityError'||error?.name==='InvalidStateError'?'当前浏览器无法使用本地存储，请使用普通浏览模式并允许网站存储':error?.message||'无法读取本地道具，请重试';}
export async function listLocalLineups(map){
 const rows=await transaction(['lineups'],'readonly',tx=>tx.objectStore('lineups').getAll());
 return rows.flatMap(row=>{try{if(!ID.test(row.id)||map&&row.map!==map)return [];return [{...validateSubmission(row),id:row.id,revision:row.revision,hasVideo:!!row.hasVideo,updated:row.updated,status:'published',local:true,custom:true,canEdit:true,author:'本地',sourceName:'本地道具 · 仅当前浏览器',en:'LOCAL LINEUP',video:null}];}catch{return [];}}).sort((a,b)=>b.updated-a.updated);
}
export async function saveLocalLineup(value,video){
 const data=validateSubmission(value),id=value.id||'local-'+crypto.randomUUID();
 if(!ID.test(id))throw Error('无效的本地道具');
 if(video!==undefined&&video!==null&&(!(video instanceof Blob)||!['video/mp4','video/webm'].includes(video.type)||!video.size||video.size>MAX_VIDEO_BYTES))throw Error('请选择不超过 40 MB 的 MP4 或 WebM 视频');
 const db=await open();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(['lineups','videos'],'readwrite'),items=tx.objectStore('lineups'),videos=tx.objectStore('videos');let item,failure;
  tx.oncomplete=()=>resolve(item);
  tx.onabort=()=>reject(failure||tx.error||Error('本地保存失败'));
  const request=items.get(id);
  request.onsuccess=()=>{
   const previous=request.result;
   if(value.id&&(!previous||previous.revision!==value.revision)){failure=Error('此道具已在其他页面修改或删除，请从“本地道具库”重新打开');tx.abort();return;}
   item={...data,id,revision:(previous?.revision||0)+1,updated:Date.now(),hasVideo:video===undefined?!!previous?.hasVideo:!!video,status:'published'};
   items.put(item);if(video===null)videos.delete(id);else if(video!==undefined)videos.put(video,id);
  };
 });
}
export async function readLocalVideo(id){if(!ID.test(id))throw Error('无效的本地道具');return transaction(['videos'],'readonly',tx=>tx.objectStore('videos').get(id));}
export async function deleteLocalLineup(id){if(!ID.test(id))throw Error('无效的本地道具');await transaction(['lineups','videos'],'readwrite',tx=>{tx.objectStore('lineups').delete(id);tx.objectStore('videos').delete(id);});}
