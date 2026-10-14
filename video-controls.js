import {createVideoFullscreen} from './video-fullscreen.js?v=1';
const PHONE_QUERY='(pointer: coarse) and (max-width: 600px), (pointer: coarse) and (max-height: 600px)';
const timeLabel=value=>{const seconds=Number.isFinite(value)?Math.max(0,Math.floor(value)):0;return Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');};

// Keep mobile controls outside the picture, including when the player is fullscreen.
export function bindVideoControls(video,ui,{doc=document,phone=matchMedia(PHONE_QUERY),prepareSource=()=>{},forceCustom=false}={}){
 const {player,controls,play,seek,time,mute,full,status}=ui;
 const originalControls=video.controls,listeners=[];
 let disposed=false,fullscreen;
 const on=(target,event,handler)=>{target.addEventListener(event,handler);listeners.push(()=>target.removeEventListener(event,handler));};
 const duration=()=>Number.isFinite(video.duration)&&video.duration>0?video.duration:0;
 function updateProgress(){
  if(disposed)return;
  time.textContent=timeLabel(video.currentTime)+' / '+timeLabel(duration());
  seek.disabled=!duration();seek.value=duration()?String(Math.round(video.currentTime/duration()*1000)):'0';
  seek.setAttribute('aria-valuetext',timeLabel(video.currentTime)+'，共 '+timeLabel(duration()));
 }
 function sync(){
  if(disposed)return;
  const custom=(forceCustom||phone.matches||fullscreen.active)&&!fullscreen.native;
  const nativeControls=custom?false:originalControls;
  if(video.controls!==nativeControls)video.controls=nativeControls;
  player.classList.toggle('custom-video-controls',custom);controls.hidden=!custom;
  play.setAttribute('data-state',video.paused||video.ended?'play':'pause');
  play.setAttribute('aria-label',video.ended?'重新播放视频':video.paused?'播放视频':'暂停视频');
  mute.setAttribute('aria-label',video.muted?'开启视频声音':'静音视频');
  mute.setAttribute('aria-pressed',String(video.muted));
  full.hidden=false;
  full.setAttribute('aria-label',fullscreen.active?'退出视频全屏':'视频全屏');
  full.setAttribute('aria-pressed',String(fullscreen.active));
  updateProgress();
 }
 fullscreen=createVideoFullscreen(player,video,{doc,change:sync});
 async function togglePlay(){
  status.textContent='';
  try{
   if(video.paused||video.ended){prepareSource();if(video.ended)video.currentTime=0;await video.play();}
   else video.pause();
  }catch{if(!disposed)status.textContent='视频暂时无法播放，请重试。';}
  sync();
 }
 on(play,'click',togglePlay);
 on(seek,'input',()=>{if(duration()){video.currentTime=Math.max(0,Math.min(1000,Number(seek.value)||0))/1000*duration();sync();}});
 on(mute,'click',()=>{video.muted=!video.muted;sync();});
 on(full,'click',()=>{status.textContent='';fullscreen.toggle();});
 for(const event of ['play','playing','pause','ended','loadedmetadata','durationchange','volumechange','emptied'])on(video,event,sync);
 on(video,'error',()=>{status.textContent='视频加载失败，请刷新后重试。';sync();});
 on(video,'timeupdate',updateProgress);on(phone,'change',sync);sync();
 return ()=>{disposed=true;fullscreen.dispose();listeners.forEach(remove=>remove());if(video.controls!==originalControls)video.controls=originalControls;};
}

export function setupVideoControls(video,options={}){
 const player=document.createElement('div');player.className='tutorial-player';
 video.replaceWith(player);player.append(video);
 const controls=document.createElement('div');controls.className='tutorial-player-controls';controls.hidden=true;
 controls.setAttribute('role','group');controls.setAttribute('aria-label','视频播放控制');
 controls.innerHTML='<button type="button" class="video-play" aria-label="播放视频" data-state="play"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path class="play-symbol" d="M7 4v16l14-8Z"/><path class="pause-symbol" d="M6 4h4v16H6zm8 0h4v16h-4z"/></svg></button><input class="video-seek" type="range" min="0" max="1000" step="1" value="0" aria-label="视频进度"><output class="video-time" aria-live="off">0:00 / 0:00</output><button type="button" class="video-mute" aria-label="静音视频" aria-pressed="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path class="sound-waves" d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/><path class="sound-off" d="m16 9 6 6m0-6-6 6"/></svg></button><button type="button" class="video-fullscreen" aria-label="视频全屏"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M9 4H4v5m11-5h5v5M4 15v5h5m6 0h5v-5"/></svg></button>';
 const status=document.createElement('p');status.className='video-player-status';status.setAttribute('role','status');
 player.append(controls,status);
 const dispose=bindVideoControls(video,{player,controls,status,play:controls.querySelector('.video-play'),seek:controls.querySelector('.video-seek'),time:controls.querySelector('.video-time'),mute:controls.querySelector('.video-mute'),full:controls.querySelector('.video-fullscreen')},options);
 return ()=>{dispose();player.replaceWith(video);};
}
