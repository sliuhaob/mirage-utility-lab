// Fullscreen/orientation support varies. A rejected request must never prevent
// the user from rotating the phone manually and using the map normally.
export async function enterLandscape(doc=document,orientation=globalThis.screen?.orientation){
 if(!doc.fullscreenElement){
  if(!doc.documentElement.requestFullscreen)return false;
  try{await doc.documentElement.requestFullscreen();}catch{return false;}
 }
 if(!orientation?.lock)return false;
 try{await orientation.lock('landscape');return true;}catch{return false;}
}

export function setupMobileLayout(){
 const phone=matchMedia('(pointer: coarse) and (max-width: 600px), (pointer: coarse) and (max-height: 600px)');
 const portrait=matchMedia('(orientation: portrait)');
 const body=document.body;
 const listButton=document.querySelector('#mobile-points');
 const detailButton=document.querySelector('#mobile-guide');
 const fullButton=document.querySelector('#mobile-fullscreen');
 const rotateButton=document.querySelector('#rotate-fullscreen');
 const rotatePrompt=document.querySelector('#rotate-prompt');
 const rotateHint=document.querySelector('#rotate-hint');
 let wasPortrait=false;
 const isLandscape=()=>phone.matches&&!portrait.matches;
 function setPanel(panel,focus=false){
  const previous=body.dataset.mobilePanel;
  if(panel&&isLandscape())body.dataset.mobilePanel=panel;else delete body.dataset.mobilePanel;
  listButton.setAttribute('aria-expanded',String(body.dataset.mobilePanel==='points'));
  detailButton.setAttribute('aria-expanded',String(body.dataset.mobilePanel==='guide'));
  if(focus){
   if(panel&&isLandscape())document.querySelector(panel==='points'?'#point-sidebar .mobile-dismiss':'#tutorial-panel .mobile-dismiss').focus({preventScroll:true});
   else if(previous)(previous==='points'?listButton:detailButton).focus({preventScroll:true});
  }
 }
 listButton.onclick=()=>setPanel(body.dataset.mobilePanel==='points'?null:'points',true);
 detailButton.onclick=()=>setPanel(body.dataset.mobilePanel==='guide'?null:'guide',true);
 document.querySelectorAll('.mobile-dismiss').forEach(b=>b.onclick=()=>setPanel(null,true));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&body.dataset.mobilePanel)setPanel(null,true);});
 function refresh(){
  const nowPortrait=phone.matches&&portrait.matches;
  rotatePrompt.setAttribute('aria-hidden',String(!nowPortrait));
  if(!isLandscape())setPanel(null);
  if(nowPortrait&&!wasPortrait)rotatePrompt.focus({preventScroll:true});
  if(!nowPortrait&&wasPortrait)document.querySelector('#map-canvas').focus({preventScroll:true});
  wasPortrait=nowPortrait;
  fullButton.textContent=document.fullscreenElement?'退出全屏':'全屏';
 }
 async function requestLandscape(){
  rotateButton.disabled=fullButton.disabled=true;
  try{
   if(!(await enterLandscape())&&phone.matches&&portrait.matches)rotateHint.textContent='请横过手机；如果画面没有转动，请关闭系统的竖屏锁定。';
  }finally{rotateButton.disabled=fullButton.disabled=false;refresh();}
 }
 const supportsFullscreen=!!(document.fullscreenEnabled&&document.documentElement.requestFullscreen);
 fullButton.hidden=rotateButton.hidden=!supportsFullscreen;
 rotateButton.onclick=requestLandscape;
 fullButton.onclick=async()=>{
  if(document.fullscreenElement){
   try{globalThis.screen?.orientation?.unlock?.();await document.exitFullscreen();}catch{/* The browser may already have exited. */}
   refresh();
  }else await requestLandscape();
 };
 phone.addEventListener('change',refresh);portrait.addEventListener('change',refresh);
 document.addEventListener('fullscreenchange',refresh);
 refresh();
 return {showDetails(){if(isLandscape())setPanel('guide',true);}};
}
