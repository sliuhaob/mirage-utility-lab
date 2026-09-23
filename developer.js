import {currentSpawnLabel} from './mirage-spawn-numbers.js?v=1';
import {chooseSpawn,spawnLabel} from './spawn-picker.js?v=4';
import {confirmPointMerges} from './point-merge-dialog.js?v=1';
import {loadCommunity} from './community.js?v=4';
import {createStorageMonitor} from './storage-monitor.js';
import {setupPasswordChange} from './password.js';
import {listLocalLineups,saveLocalLineup,readLocalVideo,deleteLocalLineup,localError} from './local-lineups.js?v=3';
import {getMap} from './maps.js?v=8';
import {createRadarEditor} from './radar-editor.js?v=1';
import {api,uploadVideo} from './community.js?v=4';
import {validateSubmission,MAX_VIDEO_BYTES} from './submission-schema.js?v=3';

const $=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)];
const localMode=document.body.dataset.mode==='local';
let localVideo,passwordSaving=false,spawnPicking=false;
const fragment=new URLSearchParams(location.hash.slice(1));
let accessToken=fragment.get('invite')||fragment.get('setup'),authMode=fragment.has('invite')?'register':fragment.has('setup')?'setup':'login';
if(accessToken)history.replaceState(null,'',location.pathname+location.search);
let user,map,mapAbort,mapGeneration=0,editorView='radar',points={},saved=null,videoId=null,videoUrl=null,objectUrl=null,uploadAbort=null,dirty=false,saving=false,libraryItems=[];
const message=(id,text,error=false)=>{const e=$(id);e.textContent=text;e.classList.toggle('danger-message',error);};
const storageMonitor=localMode?null:createStorageMonitor({onManageVideo:async id=>{try{await showTab('library');$('#library-search').value=id;renderLibrary();}catch(e){message('#dev-message',errorText(e),true);}}});
const errorText=e=>localMode?localError(e):e instanceof TypeError?'无法连接服务，请检查网络后重试':e.message;
function authLabels(){
 const setup=authMode==='setup',invite=authMode==='register';
 $('#auth-title').textContent=setup?'创建管理员账户':invite?'接受开发者邀请':'登录开发者通道';
 $('#auth-description').textContent=setup?'设置你的用户名和密码，之后可邀请其他开发者。':invite?'创建你的账户后，可以上传和管理自己的教程。':'仅管理员与受邀开发者可以上传和发布教程。';
 $('#auth-submit').textContent=setup?'创建管理员':invite?'创建账户并加入':'登录';
 $('#auth-password').autocomplete=setup||invite?'new-password':'current-password';
}
function setBusy(){for(const id of ['#save-draft','#publish-lineup','#edit-video'])$(id).disabled=!!uploadAbort||saving;$('#lineup-form').inert=saving;}
function preview(url){const v=$('#video-preview');v.pause();v.hidden=!url;if(url){if(localMode)v.removeAttribute('crossorigin');else v.crossOrigin='use-credentials';v.src=url;}else v.removeAttribute('src');v.load();}
function releasePreview(){if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=null;}}
function clearSpawnDescription(){if(/^(?:T|CT) 出生点 · \d+ 号（本站）$/.test($('#edit-from').value))$('#edit-from').value='';}
function updatePoints(){
 for(const kind of ['origin','target']){$('#'+kind+'-value').textContent=points[kind]?`X ${points[kind][0].toFixed(2)} · Y ${points[kind][2].toFixed(2)} · 高度 ${points[kind][1].toFixed(2)}`:'尚未选择';$('#pick-'+kind).classList.remove('active');}
 map?.setEditorPoints(points);map?.select(null);$('#editor-preview').disabled=!points.origin||!points.target;
}
function zoneOptions(){const config=getMap($('#edit-map').value);$('#edit-zone').replaceChildren(...Object.entries(config.zones).map(([id,name])=>new Option(name,id)));$('#edit-level-row').hidden=config.id!=='nuke';}
function cutControls(){const config=getMap($('#edit-map').value),lower=config.id==='nuke'&&$('#edit-level').value==='lower',cut=$('#editor-cut');cut.min=lower?-7:config.cut.min;cut.max=lower?-.2:config.cut.max;cut.value=lower?config.lowerCut:config.cut.default;map?.setCutHeight(Number(cut.value));}
async function loadMap(view='radar'){
 const generation=++mapGeneration;mapAbort?.abort();map?.dispose();map=null;const controller=new AbortController();mapAbort=controller;editorView=view;
 const config=getMap($('#edit-map').value),radar=view==='radar';
 $('#map-loading').hidden=false;$('#map-loading span').textContent='正在加载'+config.name+(radar?'地图…':'模型…');$('#editor-map-error').hidden=true;message('#pick-status',radar?'正在加载二维地图…':'正在加载三维模型…');
 $('#editor-cut-control').hidden=radar;$('#editor-top').hidden=radar;
 for(const v of ['radar','3d','top']){$('#editor-'+v).classList.toggle('active',v===view);$('#editor-'+v).setAttribute('aria-pressed',String(v===view));}
 for(const id of ['#pick-target','#pick-origin'])$(id).disabled=true;
 const editor={
  onPick:(kind,point)=>{if(kind==='origin')clearSpawnDescription();points[kind]=point;if(kind==='target'&&config.id==='nuke')$('#edit-zone').value=point[1]<config.levelBoundary?'B':$('#edit-zone').value==='B'?'A':$('#edit-zone').value;dirty=true;updatePoints();message('#pick-status',kind==='target'?'落点已标记，请继续选择投掷位置':'站位已标记，可预览路线或继续填写教程');},
  onMiss:()=>message('#pick-status',radar?'这里没有可选地面，请点击地图通道或切换立体视图确认':'这里没有可选的地面，请旋转地图或调节剖切高度后重试',true)
 };
 try{
  let next;
  if(radar)next=await createRadarEditor($('#map-canvas'),config,controller.signal,editor);
  else {const {createMap}=await import('./map.js?v=7');if(generation!==mapGeneration)return;next=await createMap($('#map-canvas'),$('#map-labels'),[],()=>{},()=>'',config,controller.signal,editor);}
  if(generation!==mapGeneration){next.dispose();return;}map=next;map.setLevel($('#edit-level').value);if(!radar)map.setView(view);cutControls();updatePoints();$('#map-loading').hidden=true;
  for(const id of ['#pick-target','#pick-origin'])$(id).disabled=false;
  message('#pick-status',radar?'选择落点或站位后点击地图 · 拖动平移，滚轮缩放':'选择落点或站位后，点击地图地面');
 }catch(e){if(generation!==mapGeneration)return;$('#map-loading').hidden=true;$('#editor-map-error').hidden=false;message('#pick-status','地图未载入，请重试',true);}
}

function collect(){
 const data={};for(const key of ['map','zone','team','type','level','name','from','method','description','tip'])data[key]=$('#edit-'+key).value;
 for(const kind of ['origin','target']){const p=points[kind];data[kind]=p?[p[0],p[2]]:null;data[kind+'Height']=p?.[1];}
 if(data.map==='nuke')data.level=data.targetHeight<getMap('nuke').levelBoundary?'lower':'upper';
 data.steps=$('#edit-steps').value.split('\n').map(s=>s.trim()).filter(Boolean).map(s=>s.replace(/^\d+[.、)]\s*/,''));data.keys=all('.key-options input:checked').map(e=>e.value);
 return validateSubmission(data);
}
function canLeave(){if(uploadAbort||saving||passwordSaving||spawnPicking){message('#dev-message','请先等待保存完成，或取消视频上传',true);return false;}return !dirty||confirm('当前修改尚未保存，确定放弃这些修改吗？');}
function resetEditor(item=null){
 releasePreview();localVideo=undefined;saved=item;videoId=item?.videoId||null;videoUrl=item?.video||null;points=item?{origin:[item.origin[0],item.originHeight,item.origin[1]],target:[item.target[0],item.targetHeight,item.target[1]]}:{};
 if(localMode)$('#view-local-map').hidden=true;
 $('#lineup-form').reset();$('#lineup-form').scrollTop=0;$('#edit-map').value=item?.map||getMap(new URLSearchParams(location.search).get('map')).id;zoneOptions();
 if(item){for(const key of ['zone','team','type','level','name','from','method','description','tip'])$('#edit-'+key).value=item[key];$('#edit-steps').value=item.steps.join('\n');all('.key-options input').forEach(e=>e.checked=item.keys.includes(e.value));}
 $('#editor-title').textContent=item?'编辑教程':'把你的投掷分享出来';$('#save-draft').textContent=item?.status==='published'?'撤为草稿':'保存草稿';message('#save-status','');message('#upload-status',videoId?'已载入保存的视频':'');preview(videoUrl);$('#video-help').textContent=item?.builtinId?'原有图文教程可以直接保存或发布，教学视频可稍后补充。单个 MP4 / WebM 不超过 40 MB。':'MP4 / WebM，单个不超过 40 MB。发布前需要视频，草稿可暂不上传。';$('#publish-lineup').textContent=item?.status==='published'?'更新发布':'发布教程';if(localMode){
  $('#editor-title').textContent=item?'编辑本地道具':'添加本地道具';$('#publish-lineup').textContent='保存到本地';
  $('#video-help').textContent='可选 MP4 / WebM，单个不超过 40 MB。视频保存在当前浏览器，不会上传。';
  $('#remove-local-video').hidden=!item?.hasVideo;
  if(item?.hasVideo)readLocalVideo(item.id).then(blob=>{if(saved!==item||localVideo!==undefined)return;if(blob){objectUrl=URL.createObjectURL(blob);preview(objectUrl);message('#upload-status','已载入本地视频');}}).catch(e=>message('#upload-status',errorText(e),true));
 }
 dirty=false;loadMap();
}
async function showTab(name){
 message('#dev-message','');
 if(name!=='compose'){++mapGeneration;mapAbort?.abort();map?.dispose();map=null;}
 for(const tab of (localMode?['compose','library','team']:['compose','library','team','storage'])){$('#'+tab+'-panel').hidden=tab!==name;$('#tab-'+tab).setAttribute('aria-pressed',String(tab===name));}
 if(name==='storage')storageMonitor?.activate();else storageMonitor?.deactivate();
 if(name==='library')await loadLibrary();if(name==='team')await loadTeam();
}
async function enter(account){
 user=account;$('#auth-panel').hidden=true;$('#creator').hidden=false;$('#dev-account').hidden=false;$('#dev-username').textContent=user.username+(user.role==='admin'?' · 管理员':'');$('#tab-team').hidden=user.role!=='admin';if(!localMode)$('#tab-storage').hidden=user.role!=='admin';$('#tab-library').textContent=localMode?'本地道具库':user.role==='admin'?'全部教程':'我的教程与原有教程';if(localMode)$('#dev-account').hidden=true;
 await showTab('compose');resetEditor();
}
$('#auth-form').onsubmit=async e=>{e.preventDefault();$('#auth-submit').disabled=true;message('#auth-message','正在验证…');try{const result=await api('/auth/'+authMode,{method:'POST',data:{username:$('#auth-username').value,password:$('#auth-password').value,token:accessToken}});$('#auth-password').value='';accessToken=null;authMode='login';authLabels();message('#auth-message','');await enter(result.user);}catch(err){message('#auth-message',errorText(err),true);}finally{$('#auth-submit').disabled=false;}};
$('#dev-logout').onclick=async()=>{if(!canLeave())return;try{await api('/auth/logout',{method:'POST'});mapAbort?.abort();map?.dispose();map=null;dirty=false;releasePreview();preview(null);storageMonitor?.clear();user=null;$('#creator').hidden=true;$('#dev-account').hidden=true;$('#auth-panel').hidden=false;authLabels();}catch(e){message('#dev-message',errorText(e),true);}};
$('#tab-compose').onclick=()=>{if(canLeave()){showTab('compose');resetEditor();}};
for(const tab of (localMode?['library','team']:['library','team','storage']))$('#tab-'+tab).onclick=()=>{if(uploadAbort||saving){message('#dev-message','请先等待保存完成，或取消视频上传',true);return;}showTab(tab).catch(e=>message('#dev-message',errorText(e),true));};
$('#lineup-form').addEventListener('input',()=>{dirty=true;});
$('#edit-map').onchange=()=>{clearSpawnDescription();points={};$('#edit-level').value='upper';zoneOptions();updatePoints();loadMap();};
$('#edit-level').onchange=()=>{map?.setLevel($('#edit-level').value);map?.setPicking(null);cutControls();updatePoints();};
$('#edit-zone').onchange=()=>{if($('#edit-map').value==='nuke'){const next=$('#edit-zone').value==='B'?'lower':'upper';if($('#edit-level').value!==next){$('#edit-level').value=next;map?.setLevel(next);map?.setPicking(null);cutControls();updatePoints();}}};
$('#pick-spawn').onclick=async()=>{
 if(spawnPicking||saving)return;spawnPicking=true;
 const config=getMap($('#edit-map').value);map?.setPicking(null);
 try{const point=await chooseSpawn(config,$('#edit-team').value,points.origin);if(!point)return;
 points.origin=[...point.position];$('#edit-team').value=point.team;$('#edit-from').value=spawnLabel(point);dirty=true;updatePoints();message('#pick-status','已选择 '+spawnLabel(point)+'，可继续选择落点或填写教程。');
 }finally{spawnPicking=false;}
};
for(const kind of ['origin','target'])$('#pick-'+kind).onclick=()=>{map?.setPicking(kind);if(innerWidth<=640) $('.editor-map').scrollIntoView({behavior:'smooth',block:'start'});for(const k of ['origin','target'])$('#pick-'+k).classList.toggle('active',k===kind);message('#pick-status',kind==='target'?'点击地图地面，标记道具落点':'点击地图地面，标记投掷站位');};
$('#editor-cut').oninput=e=>map?.setCutHeight(Number(e.target.value));
$('#editor-reset').onclick=()=>map?.reset();$('#editor-retry').onclick=()=>loadMap(editorView);
$('#editor-zoom-in').onclick=()=>map?.zoom(.8);$('#editor-zoom-out').onclick=()=>map?.zoom(1.25);
for(const view of ['radar','3d','top'])$('#editor-'+view).onclick=()=>{
 if(view===editorView&&map)return;
 if(view!=='radar'&&editorView!=='radar'&&map){editorView=view;map.setView(view);for(const v of ['radar','3d','top']){$('#editor-'+v).classList.toggle('active',v===view);$('#editor-'+v).setAttribute('aria-pressed',String(v===view));}}
 else loadMap(view);
};
$('#editor-preview').onclick=()=>{if(!points.target||!points.origin)return;map?.select({id:'preview',type:$('#edit-type').value,origin:[points.origin[0],points.origin[2]],originHeight:points.origin[1],target:[points.target[0],points.target[2]],targetHeight:points.target[1],targetOffset:$('#edit-type').value==='flash'?2:0});map?.play();message('#pick-status','路线仅为起终点示意，实际投掷请以视频为准');};
$('#edit-video').onchange=async()=>{
 const file=$('#edit-video').files[0];if(!file)return;
 if(!['video/mp4','video/webm'].includes(file.type)||file.size>MAX_VIDEO_BYTES||!file.size){message('#upload-status','请选择不超过 40 MB 的 MP4 或 WebM 视频',true);$('#edit-video').value='';return;}
 if(localMode){releasePreview();localVideo=file;objectUrl=URL.createObjectURL(file);preview(objectUrl);dirty=true;$('#remove-local-video').hidden=false;message('#upload-status','视频已选择，点击“保存到本地”后保存。');$('#edit-video').value='';return;}
 releasePreview();objectUrl=URL.createObjectURL(file);preview(objectUrl);uploadAbort=new AbortController();setBusy();$('#upload-progress').hidden=false;$('#upload-progress').value=0;$('#upload-cancel').hidden=false;message('#upload-status','正在上传，请保持此页面打开…');
 try{const result=await uploadVideo(file,p=>{$('#upload-progress').value=p;message('#upload-status',p===100?'正在保存视频…':`正在上传 ${p}%`);},uploadAbort.signal);videoId=result.id;videoUrl=result.url;dirty=true;message('#upload-status','视频已上传；保存草稿或发布后与教程关联。');}
 catch(e){message('#upload-status',errorText(e),true);releasePreview();preview(videoUrl);}
 finally{uploadAbort=null;$('#edit-video').value='';$('#upload-progress').hidden=true;$('#upload-cancel').hidden=true;setBusy();}
};
$('#upload-cancel').onclick=()=>uploadAbort?.abort();
$('#video-preview').onerror=()=>message('#upload-status','此视频无法播放。建议使用 H.264 编码的 MP4 或 VP8/VP9 编码的 WebM 后重新上传。',true);
async function save(status){
 if(uploadAbort||saving)return;
 try{const data=collect();if(!localMode&&status==='published'&&!videoId&&!saved?.builtinId)throw Error('发布前请上传教学视频');if(status==='published'&&$('#video-preview').error)throw Error('视频无法播放，请重新上传兼容的视频');saving=true;setBusy();message('#save-status','正在保存…');
  message('#save-status','正在检查附近落点和站位…');
  let candidates,notice='';
  if(localMode){
   const [local,publicRows]=await Promise.all([listLocalLineups(data.map),loadCommunity(data.map,AbortSignal.timeout(5000)).catch(()=>{notice='公开教程暂时无法读取，本次只检查本地道具。';return [];})]);candidates=[...local,...publicRows];
  }else{
   candidates=[];let after='';const seen=new Set();
   do{const page=await api('/dev/points?map='+data.map+(after?'&after='+encodeURIComponent(after):''),{signal:AbortSignal.timeout(15000)});candidates.push(...page.items);after=page.next;if(after){if(seen.has(after))throw Error('点位分页异常，请重试');seen.add(after);}}while(after);
  }
  const groups=await confirmPointMerges(data,candidates.map(currentSpawnLabel),saved,{notice});
  if(!groups){message('#save-status','已取消保存，修改仍保留在编辑器中。');return;}
  data.pointGroups=groups;message('#save-status','正在保存…');
  const result=localMode?{item:await saveLocalLineup({...data,id:saved?.id,revision:saved?.revision},localVideo)}:await api('/dev/lineups',{method:'POST',data:{...data,id:saved?.id,revision:saved?.revision,status,videoId}});saved=result.item;dirty=false;message('#save-status',status==='published'?'已发布。访客刷新地图后即可看到这条教程。':status==='draft'?'草稿已保存，仅你和管理员可见。':'已保存');$('#editor-title').textContent='编辑教程';$('#save-draft').textContent=status==='published'?'撤为草稿':'保存草稿';
  if(localMode){localVideo=undefined;message('#save-status','已保存到当前浏览器，可返回地图查看。'+notice);$('#editor-title').textContent='编辑本地道具';$('#view-local-map').hidden=false;$('#view-local-map').href='./?map='+saved.map+'&team='+(saved.team==='ct'?'ct':'t')+'&lineup='+saved.id;navigator.storage?.persist?.().catch(()=>{});}

 }catch(e){message('#save-status',errorText(e),true);}finally{saving=false;setBusy();}
}
$('#lineup-form').onsubmit=e=>{e.preventDefault();save('published');};$('#save-draft').onclick=()=>save('draft');
function el(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
function action(label,fn){const b=el('button',label);b.type='button';b.onclick=async()=>{b.disabled=true;try{await fn();}catch(e){message('#dev-message',errorText(e),true);}finally{b.disabled=false;}};return b;}
const statusName={draft:'草稿',published:'已发布',archived:'已撤下'},teamName={t:'匪方 T',ct:'警方 CT',any:'双方通用'};
async function loadLibrary(){
 message('#dev-message','正在读取教程…');const {items}=localMode?{items:await listLocalLineups()}:await api('/dev/lineups');libraryItems=items.map(currentSpawnLabel);renderLibrary();message('#dev-message','');
}
function renderLibrary(){
 const mapId=$('#library-map').value,status=$('#library-status').value,search=$('#library-search').value.trim().toLowerCase();
 const items=libraryItems.filter(item=>(!mapId||item.map===mapId)&&(!status||item.status===status)&&(!search||[item.name,item.from,item.author,item.videoId].some(t=>String(t).toLowerCase().includes(search))));
 $('#library-count').textContent=`${items.length} / ${libraryItems.length} 条教程`;$('#lineup-library').replaceChildren();
 for(const item of items){
  const row=el('article',undefined,'library-row'),info=el('div');info.append(el('strong',item.name),el('small',`${getMap(item.map).name} · ${teamName[item.team]} · ${localMode?'仅本地':statusName[item.status]} · ${item.builtinId?'原有教程':item.author}`));row.append(info);
  if(localMode){
   const confirmation=el('div',undefined,'local-delete-confirm');confirmation.hidden=true;
   confirmation.append(el('span','删除道具及其视频？无法撤销。'),action('确认删除',async()=>{await deleteLocalLineup(item.id);if(saved?.id===item.id){saved=null;dirty=false;preview(null);releasePreview();}await loadLibrary();}),action('取消',()=>{confirmation.hidden=true;}));
   row.append(action('编辑',async()=>{if(canLeave()){await showTab('compose');resetEditor(item);}}),action('删除',()=>{confirmation.hidden=false;}),confirmation);
  }
  else if(item.canEdit){
   row.append(action('编辑',async()=>{if(canLeave()){await showTab('compose');resetEditor(item);}}),action(item.status==='published'?'撤下':'发布',async()=>{await api('/dev/lineups',{method:'POST',data:{...item,status:item.status==='published'?'archived':'published'}});await loadLibrary();}));
   const confirmation=el('div',undefined,'local-delete-confirm');confirmation.hidden=true;
   const confirmButton=action('确认永久删除',async()=>{
    if(saving||uploadAbort)return;saving=true;setBusy();row.inert=true;message('#dev-message','正在删除教程…');
    try{
     const result=await api('/dev/lineups/delete',{method:'POST',data:{id:item.id,revision:item.revision}});
     if(saved?.id===item.id){saved=null;dirty=false;videoId=null;videoUrl=null;preview(null);releasePreview();}
     libraryItems=libraryItems.filter(entry=>entry.id!==item.id);renderLibrary();
     message('#dev-message',result.cleanupPending?'教程已永久删除；视频清理暂未完成，下次打开教程库时会自动重试。':'教程已永久删除，未被其他教程使用的视频已清理。');
    }finally{saving=false;setBusy();row.inert=false;}
   });confirmButton.className='danger-action';
   confirmation.append(el('span','永久删除“'+item.name+'”？此操作无法撤销，同时清理未被其他教程使用的视频。'),confirmButton,action('取消',()=>{confirmation.hidden=true;}));
   const remove=action('永久删除',()=>{confirmation.hidden=false;});remove.className='danger-action';row.append(remove,confirmation);
  }
  row.append(action('基于此新建',async()=>{if(canLeave()){await showTab('compose');resetEditor({...item,id:undefined,revision:undefined,builtinId:null,video:null,videoId:null,hasVideo:false,status:'draft',name:item.name.slice(0,72)+' · 新投法'});saved=null;$('#editor-title').textContent='添加一种新投法';dirty=true;}}));
  $('#lineup-library').append(row);
 }
 if(!items.length)$('#lineup-library').append(el('p',libraryItems.length?'没有符合筛选条件的教程。':(localMode?'还没有本地道具。点击“添加本地道具”开始。':'还没有教程。点击“新建教程”开始上传。')));
}
for(const id of ['#library-map','#library-status'])$(id).onchange=renderLibrary;
$('#library-search').oninput=renderLibrary;

async function loadTeam(){
 const [members,invites]=await Promise.all([api('/admin/users'),api('/admin/invites')]);$('#member-list').replaceChildren();$('#invite-list').replaceChildren();
 for(const member of members.users){const row=el('div',undefined,'member-row');row.append(el('strong',member.username),el('span',member.role==='admin'?'管理员':member.active?'开发者':'已停用'));if(member.role!=='admin')row.append(action(member.active?'停用':'启用',async()=>{await api('/admin/users',{method:'POST',data:{id:member.id,active:!member.active}});await loadTeam();}));$('#member-list').append(row);}
 for(const invite of invites.items){const usable=!invite.used_by&&!invite.revoked&&invite.expires>Date.now()/1000,row=el('div',undefined,'invite-row');row.append(el('span',invite.label),el('span',invite.used_by?'已接受':invite.revoked?'已撤销':usable?'等待接受':'已过期'));if(usable)row.append(action('撤销邀请',async()=>{await api('/admin/invites/revoke',{method:'POST',data:{hash:invite.hash}});await loadTeam();}));$('#invite-list').append(row);}
 if(!invites.items.length)$('#invite-list').append(el('p','暂未发出邀请。'));
}
$('#invite-form').onsubmit=async e=>{e.preventDefault();const b=e.submitter;b.disabled=true;try{const result=await api('/admin/invites',{method:'POST',data:{label:$('#invite-label').value}});$('#invite-result').hidden=false;$('#invite-link').value=result.link;await loadTeam();message('#dev-message','邀请链接已生成，请复制后发给受邀者。');}catch(err){message('#dev-message',errorText(err),true);}finally{b.disabled=false;}};
$('#copy-invite').onclick=async()=>{try{await navigator.clipboard.writeText($('#invite-link').value);message('#dev-message','邀请链接已复制');}catch{$('#invite-link').select();message('#dev-message','请复制已选中的邀请链接');}};
addEventListener('beforeunload',e=>{if(dirty||uploadAbort||passwordSaving){e.preventDefault();e.returnValue='';}});
if(!localMode)setupPasswordChange({getUser:()=>user,canOpen:()=>{if(uploadAbort||saving){message('#dev-message','请等待教程保存完成，或取消视频上传',true);return false;}return true;},onBusy:value=>{passwordSaving=value;}});
if(localMode){
 $('#remove-local-video').onclick=()=>{localVideo=null;releasePreview();preview(null);dirty=true;$('#remove-local-video').hidden=true;message('#upload-status','保存后将移除此教程的视频。');};
 await enter({username:'本地',role:'local'});
 const editId=new URLSearchParams(location.search).get('edit');
 if(editId)try{const item=(await listLocalLineups()).find(item=>item.id===editId);if(item)resetEditor(item);else message('#dev-message','这条本地道具已删除或不在此浏览器中',true);}catch(e){message('#dev-message',errorText(e),true);}
}else{
 authLabels();
 if(!accessToken)api('/auth/me').then(({user:account})=>account&&enter(account)).catch(e=>message('#auth-message',errorText(e),true));

}

addEventListener('pagehide',()=>{storageMonitor?.deactivate();++mapGeneration;mapAbort?.abort();map?.dispose();preview(null);releasePreview();});

// Recreate disposed renderers when returning through the browser's back/forward cache.
addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
