import {validateSubmission} from './submission-schema.js';
export const API_BASE=location.hostname==='127.0.0.1'||location.hostname==='localhost'?'http://127.0.0.1:8787':'https://cs2-api.roxy-design.com';
export async function api(path,{method='GET',data,signal}={}){
 const response=await fetch(API_BASE+path,{method,credentials:'include',signal,headers:method==='GET'?{}:{'Content-Type':'application/json','X-CS2-Request':'1'},body:data===undefined?undefined:JSON.stringify(data)});
 const result=await response.json();if(!response.ok)throw Object.assign(Error(result.error||'请求失败'),{status:response.status});return result;
}
export function publicItem(value){
 const data=validateSubmission(value);
 if(!/^[a-f0-9-]{36}$/.test(value.id)||value.status!=='published')throw Error('无效教程');
 if(typeof value.video!=='string'||!value.video.startsWith(API_BASE+'/media/')||!/^\/media\/[a-f0-9-]{36}$/.test(new URL(value.video).pathname))throw Error('无效视频');
 return {...data,id:'custom-'+value.id,video:value.video,source:'',sourceName:'开发者 · '+String(value.author||'').slice(0,32),custom:true};
}
export async function loadCommunity(map,signal){
 const response=await fetch(API_BASE+'/lineups?map='+encodeURIComponent(map),{signal});if(!response.ok)throw Error('社区教程加载失败');
 const result=await response.json();if(!Array.isArray(result.items))throw Error('社区教程格式无效');
 return result.items.flatMap(value=>{try{const item=publicItem(value);return item.map===map?[item]:[];}catch{return [];}});
}
export function uploadVideo(file,onProgress,signal){
 return new Promise((resolve,reject)=>{
  const xhr=new XMLHttpRequest();xhr.open('POST',API_BASE+'/dev/videos');xhr.withCredentials=true;xhr.setRequestHeader('Content-Type',file.type);xhr.setRequestHeader('X-CS2-Request','1');
  const cancel=()=>xhr.abort();signal?.addEventListener('abort',cancel,{once:true});
  const finish=()=>signal?.removeEventListener('abort',cancel);
  xhr.upload.onprogress=e=>{if(e.lengthComputable)onProgress(Math.round(e.loaded/e.total*100));};
  xhr.onload=()=>{finish();let result;try{result=JSON.parse(xhr.responseText);}catch{reject(Error('上传服务响应无效'));return;}xhr.status>=200&&xhr.status<300?resolve(result):reject(Error(result.error||'上传失败'));};
  xhr.onerror=()=>{finish();reject(Error('网络中断，视频未上传，请重试'));};xhr.onabort=()=>{finish();reject(Error('已取消上传'));};xhr.send(file);
 });
}
