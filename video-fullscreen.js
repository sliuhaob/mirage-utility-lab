export const fullscreenElement=doc=>doc.fullscreenElement||doc.webkitFullscreenElement||null;

// Expand in place before requesting device fullscreen. A missing, rejected or
// silently ignored browser API still leaves a usable viewport-sized player.
// Do not reparent a playing video: some Android players restart it on DOM moves.
export function createVideoFullscreen(player,video,{doc=document,change=()=>{}}={}){
 let expanded=false,native=false,ownedDevice=false,disposed=false,scrollTop=0,generation=0;
 const removers=[];
 const on=(target,event,handler)=>{target.addEventListener(event,handler);removers.push(()=>target.removeEventListener(event,handler));};
 const panel=doc.querySelector('#tutorial-panel');
 const notify=()=>{if(!disposed)change();};
 function layout(value){
  if(value===expanded)return;
  if(value)scrollTop=panel?.scrollTop||0;
  expanded=value;player.classList.toggle('video-expanded-player',value);doc.body.classList.toggle('video-expanded',value);
  if(!value&&panel)panel.scrollTop=scrollTop;
  doc.dispatchEvent(new Event('video-layout-change'));
 }
 function exit(){
  generation++;
  const current=fullscreenElement(doc);
  if(current===player){try{const result=(doc.exitFullscreen||doc.webkitExitFullscreen||doc.webkitCancelFullScreen)?.call(doc);result?.catch?.(()=>{});}catch{}}
  if(native){try{(video.webkitExitFullscreen||video.webkitExitFullScreen)?.call(video);}catch{}}
  native=false;ownedDevice=false;layout(false);notify();
 }
 function enter(){
  if(disposed)return;
  const requestGeneration=++generation;
  layout(true);notify();
  const request=player.requestFullscreen||player.webkitRequestFullscreen||player.webkitRequestFullScreen;
  const enterNative=video.webkitEnterFullscreen||video.webkitEnterFullScreen;
  try{
   if(request){
    const result=request.call(player);
    result?.then?.(()=>{if(disposed||generation!==requestGeneration){if(fullscreenElement(doc)===player)exit();return;}if(fullscreenElement(doc)===player)ownedDevice=true;notify();},()=>notify());
   }else if(enterNative){enterNative.call(video);}
  }catch{notify();}
 }
 function deviceChanged(){
  if(fullscreenElement(doc)===player&&!expanded){exit();return;}
  if(fullscreenElement(doc)===player){ownedDevice=true;layout(true);}
  else if(ownedDevice){ownedDevice=false;layout(false);}
  notify();
 }
 on(doc,'fullscreenchange',deviceChanged);on(doc,'webkitfullscreenchange',deviceChanged);
 on(video,'webkitbeginfullscreen',()=>{native=true;layout(true);notify();});
 on(video,'webkitendfullscreen',()=>{native=false;layout(false);notify();});
 on(doc,'keydown',event=>{if(expanded&&event.key==='Escape'){event.preventDefault();exit();}});
 return {get active(){return expanded;},get native(){return native;},toggle(){if(expanded)exit();else enter();},dispose(){exit();disposed=true;removers.forEach(remove=>remove());}};
}
