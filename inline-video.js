// Some Android WebViews stop invalidating inline video surfaces on otherwise
// idle pages. Keep only the visible, playing video repainting, not the 3D map.
// Related upstream report: https://issues.chromium.org/issues/40884226
export function setupInlineVideo(video,{android=/Android/i.test(navigator.userAgent),doc=document,Observer=globalThis.IntersectionObserver}={}){
 video.playsInline=true;
 video.setAttribute('playsinline','');
 video.setAttribute('webkit-playsinline','');
 video.setAttribute('x5-video-player-type','h5-page');
 let visible=!Observer,nativeFullscreen=false,disposed=false,waiting=false;
 const sync=()=>{
  const fullscreen=doc.fullscreenElement===video||nativeFullscreen;
  video.classList.toggle('inline-video-refresh',android&&!disposed&&!waiting&&visible&&!doc.hidden&&!fullscreen&&!video.paused&&!video.ended&&video.readyState>=2);
 };
 const events=['playing','pause','ended','waiting','emptied','error','seeked'];
 const stop=()=>video.classList.remove('inline-video-refresh');
 const onMedia=e=>{if(['waiting','emptied','error'].includes(e.type))waiting=true;else if(e.type==='playing')waiting=false;sync();};
 for(const event of events)video.addEventListener(event,onMedia);
 const begin=()=>{nativeFullscreen=true;sync();},end=()=>{nativeFullscreen=false;sync();};
 video.addEventListener('webkitbeginfullscreen',begin);video.addEventListener('webkitendfullscreen',end);
 doc.addEventListener('visibilitychange',sync);doc.addEventListener('fullscreenchange',sync);
 const observer=Observer?new Observer(entries=>{visible=entries.some(entry=>entry.target===video&&entry.isIntersecting);sync();}):null;
 observer?.observe(video);sync();
 return ()=>{
  disposed=true;stop();observer?.disconnect();
  for(const event of events)video.removeEventListener(event,onMedia);
  video.removeEventListener('webkitbeginfullscreen',begin);video.removeEventListener('webkitendfullscreen',end);
  doc.removeEventListener('visibilitychange',sync);doc.removeEventListener('fullscreenchange',sync);
 };
}
