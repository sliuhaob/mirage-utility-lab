import {API_BASE} from './community.js?v=5';

export function setupVisitTracking(){
 let sent=false;
 function track(){
  if(sent||document.visibilityState!=='visible')return;
  sent=true;document.removeEventListener('visibilitychange',track);
  try{
   const day=new Date(Date.now()+8*3600000).toISOString().slice(0,10),key='roxy-cs2-visit-day';
   let saved;try{saved=JSON.parse(localStorage.getItem(key));}catch{}
   const visitor=saved?.day===day&&typeof saved.id==='string'?saved.id:crypto.randomUUID();
   try{localStorage.setItem(key,JSON.stringify({day,id:visitor}));}catch{}
   // No retry loop: analytics must never delay the map or generate background traffic.
   fetch(API_BASE+'/analytics/visit',{method:'POST',credentials:'include',keepalive:true,headers:{'Content-Type':'application/json','X-CS2-Request':'1'},body:JSON.stringify({day,visitor})}).catch(()=>{});
  }catch{}
 }
 document.addEventListener('visibilitychange',track);track();
}
