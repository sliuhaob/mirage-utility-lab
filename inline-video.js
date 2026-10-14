// Some Android WebViews stop invalidating inline video surfaces on otherwise
// idle pages. Keep only the visible, playing video repainting, not the 3D map.
// Related upstream report: https://issues.chromium.org/issues/40884226
export const isQuarkBrowser=(ua=globalThis.navigator?.userAgent||'')=>/Quark|UCBrowser|UCWEB/i.test(ua);

// UC/Quark can hand a newly discovered source to their native player. Keep the
// URL out of the element until the user presses the actual playback control.
export function createVideoSource(video,source,{defer=isQuarkBrowser()}={}){
 let loaded=false,disposed=false;
 video.autoplay=false;video.preload=defer?'none':'metadata';
 return {deferred:defer,prepare(){if(!disposed&&!loaded){loaded=true;video.src=source;}},dispose(){disposed=true;video.pause();video.removeAttribute('src');if(loaded)video.load();}};
}

export function setupInlineVideo(video,{android=/Android/i.test(navigator.userAgent),quark=isQuarkBrowser(),doc=document,Observer=globalThis.IntersectionObserver}={}){
 video.playsInline=true;
 video.setAttribute('playsinline','');
 video.setAttribute('webkit-playsinline','');
 if(!quark)video.setAttribute('x5-video-player-type','h5-page');
 video.classList.toggle('video-conservative',quark);
 let visible=!Observer,nativeFullscreen=false,disposed=false,waiting=false;
 const sync=()=>{
  const fullscreen=(doc.fullscreenElement||doc.webkitFullscreenElement)===video||nativeFullscreen;
  video.classList.toggle('inline-video-refresh',android&&!quark&&!disposed&&!waiting&&visible&&!doc.hidden&&!fullscreen&&!video.paused&&!video.ended&&video.readyState>=2);
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
