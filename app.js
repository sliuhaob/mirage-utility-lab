import {currentSpawnLabel} from './mirage-spawn-numbers.js?v=4';
import {maps,getMap,mapUtilities} from './maps.js?v=8';
import {utilityTypes} from './utility-types.js';
import {createMap} from './map.js?v=8';
import {downloadModel} from './model-download.js';
import {loadCommunity} from './community.js?v=4';
import {listLocalLineups,readLocalVideo,localError} from './local-lineups.js?v=3';
import {groupLineups} from './lineup-groups.js?v=2';
import {escapeHtml} from './submission-schema.js?v=3';
import {setupMobileLayout} from './mobile-layout.js?v=2';

const mobileUI=setupMobileLayout();

let config=getMap(new URLSearchParams(location.search).get('map'));
let team=new URLSearchParams(location.search).get('team')==='ct'?'ct':'t';
let utilities=[],type='smoke',filter='all',level='upper',current=null,map,loadController,loadGeneration=0;
let pointMode='target';
let view=mobileUI.initialView,sourceFilter='all',localVideoUrl=null,detailGeneration=0;
const zoneName=z=>z==='all'?'全部区域':config.zones[z]||z;
const $=selector=>document.querySelector(selector);
const visible=()=>mapUtilities(config,type,filter,level,team).filter(item=>sourceFilter==='all'||(sourceFilter==='local'?item.local:!item.local));
const teamName=value=>({t:'匪方',ct:'警方',any:'双方通用'}[value]);
function syncUrl(){const url=new URL(location.href);url.searchParams.set('map',config.id);url.searchParams.set('team',team);history.replaceState(null,'',url);}
function ensureTeamType(){
 if(!visible().length)type=Object.keys(utilityTypes).find(t=>mapUtilities(config,t,filter,level,team).some(item=>sourceFilter==='all'||(sourceFilter==='local'?item.local:!item.local)))||type;
}
function changeTeam(next){
 team=next;filter='all';ensureTeamType();syncUrl();
 const items=visible();current=items.find(s=>s.id===current?.id)||items[0]||null;
 syncFilters();map?.select(current);renderList();renderDetail();
}
const icon=s=>utilityTypes[s.type].icon;
const pad=n=>String(n).padStart(2,'0');

function renderList(){
 const items=visible(),groups=groupLineups(items,pointMode);
 $('#library-heading').textContent=pointMode==='origin'?'投掷站位':utilityTypes[type].targetLabel;
 $('#point-count').textContent=pad(groups.length);
 $('#point-count').title=groups.length+(pointMode==='origin'?' 个站位 · ':' 个落点 · ')+items.length+' 条教程';
 $('#point-list').innerHTML=items.length?groups.map(g=>{const s=g.items.find(s=>s.id===current?.id)||g.items[0],active=g.items.some(s=>s.id===current?.id);return '<button class="point-item '+(active?'active':'')+'" data-id="'+s.id+'" aria-pressed="'+active+'"><span class="smoke-icon">'+icon(s)+'</span><span><strong>'+escapeHtml(pointMode==='origin'?s.from:s.name)+'</strong><small>'+escapeHtml(g.items.length>1?g.items.length+' 种投掷方法':pointMode==='origin'?s.name:s.en)+'</small></span><span class="zone-tag">'+(g.items.length>1?'×'+g.items.length:({mid:'M',outside:'Y',ramp:'R',banana:'蕉',water:'水'}[s.zone]||s.zone))+'</span></button>';}).join(''):'<p class="empty-points">'+teamName(team)+' · '+zoneName(filter)+'暂无'+utilityTypes[type].label+'点位。<br>可切换道具、区域或阵营查看已有教程。</p>';
 document.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>select(b.dataset.id));
}
function renderDetail(){
 const detailVersion=++detailGeneration;
 if(localVideoUrl){URL.revokeObjectURL(localVideoUrl);localVideoUrl=null;}

 const items=visible(),raw=current,s=raw?{...raw,...Object.fromEntries(['name','en','description','from','method','tip','sourceName'].map(k=>[k,escapeHtml(raw[k])])),steps:raw.steps.map(escapeHtml)}:null;

 if(!s){$('#detail-content').innerHTML='<div class="empty-detail"><span>'+utilityTypes[type].icon+'</span><h2>暂无对应点位</h2><p>当前阵营暂无这类点位，可切换道具、区域或阵营。</p></div>';return;}
 const group=groupLineups(items,pointMode).find(g=>g.items.some(item=>item.id===s.id));
 const methods=group?.items.length>1?'<section class="landing-methods"><h3>'+(pointMode==='origin'?'此站位':'此落点')+' · '+group.items.length+' 种投掷方法</h3><p>'+(pointMode==='origin'?'选择落点查看对应教程':'选择站位查看对应教程')+'</p>'+group.items.map(item=>'<button data-method-id="'+item.id+'" aria-pressed="'+(item.id===s.id)+'"><strong>'+escapeHtml(item.name)+'</strong><span>'+escapeHtml(item.from)+' · '+escapeHtml(item.method)+'</span></button>').join('')+'</section>':'';
 $('#detail-content').innerHTML=methods+'<span class="detail-zone">'+teamName(s.team)+' · '+zoneName(s.zone)+' · '+utilityTypes[type].label+'</span><h2 class="detail-heading">'+s.name+'</h2><div class="detail-en">'+s.en+'</div><p class="detail-description">'+s.description+'</p>'+(s.video?'<video class="tutorial-video" controls playsinline preload="metadata" src="'+escapeHtml(s.video)+'" aria-label="投掷教学视频"></video>':'<div class="video-placeholder" role="img" aria-label="视频教学暂未加入"><span class="video-format">LINEUP / VIDEO</span><span class="play">▷</span><strong>教学视频，待加入</strong><small>先通过下方步骤了解投掷方法</small></div>')+'<div class="route-info"><div class="route-row"><span>投掷位置</span><span>'+s.from+'</span></div><div class="route-row"><span>投掷方式</span><span>'+s.method+'</span></div></div><h3 class="steps-title">投掷步骤</h3><ol class="steps">'+s.steps.map(t=>'<li>'+t+'</li>').join('')+'</ol><button class="trajectory-button" id="play-route">⌁ <span>演示投掷路线</span></button><p class="tip"><strong>实战提示 / </strong>'+s.tip+'</p>'+(s.custom?'<p class="source-link">'+s.sourceName+'</p>':'');
 document.querySelectorAll('[data-method-id]').forEach(b=>b.onclick=()=>select(b.dataset.methodId));
 if(raw.local){
  const link=document.createElement('a');link.className='source-link';link.href='./local.html?edit='+raw.id;link.textContent='编辑本地道具 ↗';$('#detail-content').append(link);
  if(raw.hasVideo){
   const placeholder=$('.video-placeholder');placeholder.textContent='正在读取本地视频…';
   readLocalVideo(raw.id).then(blob=>{if(detailVersion!==detailGeneration)return;if(!blob)throw Error('本地视频未找到，请重新添加');localVideoUrl=URL.createObjectURL(blob);const video=document.createElement('video');video.className='tutorial-video';video.controls=true;video.playsInline=true;video.preload='metadata';video.src=localVideoUrl;video.setAttribute('aria-label','本地投掷教学视频');placeholder.replaceWith(video);}).catch(error=>{if(detailVersion===detailGeneration)placeholder.textContent=localError(error);});
  }
 }
 const b=$('#play-route');
 b.disabled=!map;
 if(!map)b.querySelector('span').textContent=$('#map-error').hidden?'地图加载中…':'3D 地图不可用';
 b.onclick=async()=>{
  if(!map)return;
  b.disabled=true;b.querySelector('span').textContent='正在演示…';
  await map.play();
  if(b.isConnected){b.disabled=false;b.querySelector('span').textContent='再次演示投掷路线';}
 };
}
function syncFilters(){
 const info=utilityTypes[type];
 document.documentElement.style.setProperty('--utility-color',info.color);
 document.querySelectorAll('[data-type]').forEach(b=>{const active=b.dataset.type===type;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
 document.querySelectorAll('[data-filter]').forEach(b=>{const active=b.dataset.filter===filter;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
 $('#legend-target').textContent=pointMode==='origin'?'可选站位':info.targetLabel;
 $('.sidebar-hint').textContent=pointMode==='origin'?'选择站位，查看可投落点':type==='flash'?'选择你想投闪的位置':'选择你想投掷到的位置';
 document.querySelectorAll('[data-team]').forEach(b=>{const active=b.dataset.team===team;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
 map?.filter(visible(),pointMode);
}
function select(id){
 const next=utilities.find(s=>s.id===id);
 if(next&&(sourceFilter==='local'&&!next.local||sourceFilter==='public'&&next.local)){sourceFilter='all';$('#lineup-source').value='all';}
 if(next){if(next.team!=='any'&&next.team!==team){team=next.team;syncUrl();}type=next.type;if(config.levelBoundary&&next.level!==level){level=next.level;map?.setLevel(level);syncLevelControls();resetCutControl();}if(filter!=='all'&&filter!==next.zone)filter='all';}
 current=next||null;
 syncFilters();map?.select(current);renderList();renderDetail();mobileUI.showDetails();
}
function changeFilters(nextType,nextZone){
 if(config.levelBoundary&&nextZone!=='all'){
  const targetLevel=nextZone==='B'?'lower':'upper';
  if(targetLevel!==level){level=targetLevel;map?.setLevel(level);syncLevelControls();resetCutControl();}
 }
 type=nextType;filter=nextZone;
 const items=visible();
 current=items.find(s=>s.id===current?.id)||items[0]||null;
 syncFilters();map?.select(current);renderList();renderDetail();
}
$('#point-mode').onchange=()=>{pointMode=$('#point-mode').value;syncFilters();map?.select(current);renderList();renderDetail();};
$('#utility-switch').innerHTML=Object.entries(utilityTypes).map(([id,t])=>'<button data-type="'+id+'" aria-label="'+t.label+'" title="'+t.label+'" aria-pressed="'+(id===type)+'" class="'+(id===type?'active':'')+'" style="--type-color:'+t.color+'">'+t.icon+'<span>'+t.short+'</span></button>').join('');
document.querySelectorAll('[data-type]').forEach(b=>b.onclick=()=>changeFilters(b.dataset.type,filter));
document.querySelectorAll('[data-team]').forEach(b=>b.onclick=()=>changeTeam(b.dataset.team));
function bindZones(){document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>changeFilters(type,b.dataset.filter));}
$('#zoom-in').onclick=()=>map?.zoom(.83);$('#zoom-out').onclick=()=>map?.zoom(1.2);$('#reset-view').onclick=()=>map?.reset();
function setView(nextView){view=nextView;map?.setView(view);$('.touch-gesture').textContent=view==='3d'?'单指旋转 · 双指平移与缩放':'单指平移 · 双指平移与缩放';for(const v of ['3d','top','radar']){const b=$('#view-'+v);b.classList.toggle('active',v===view);b.setAttribute('aria-pressed',String(v===view));}}
for(const nextView of ['3d','top','radar'])$('#view-'+nextView).onclick=()=>setView(nextView);
setView(view);
const pointNamesButton=$('#toggle-point-names');
let pointNamesVisible=true;try{pointNamesVisible=localStorage.getItem('roxy-cs2-point-names')!=='hidden';}catch{}
function syncPointNames(){
 $('#map-labels').classList.toggle('point-names-hidden',!pointNamesVisible);
 pointNamesButton.classList.toggle('active',pointNamesVisible);pointNamesButton.setAttribute('aria-pressed',String(pointNamesVisible));
}
pointNamesButton.onclick=()=>{pointNamesVisible=!pointNamesVisible;syncPointNames();try{localStorage.setItem('roxy-cs2-point-names',pointNamesVisible?'visible':'hidden');}catch{}};
syncPointNames();
$('#cut-height').oninput=e=>map?.setCutHeight(Number(e.target.value));
function syncLevelControls(){
 $('#level-switch').hidden=!config.levelBoundary;
 document.querySelectorAll('[data-level]').forEach(b=>{b.classList.toggle('active',b.dataset.level===level);b.setAttribute('aria-pressed',String(b.dataset.level===level));});
 $('#cut-height').disabled=false;
 $('#level-note').textContent=level==='lower'?'下层 / B 区与地下通道':'上层 / A 区、外场与铁板';
}
function chooseLevel(next){
 level=next;filter='all';map?.setLevel(level);syncLevelControls();
 resetCutControl();
 const items=visible();current=items[0]||null;syncFilters();map?.select(current);renderList();renderDetail();
}
function resetCutControl(){const cut=$('#cut-height');cut.min=level==='lower'?-4.8:config.cut.min;cut.max=level==='lower'?-1.2:config.cut.max;cut.value=level==='lower'?config.lowerCut:config.cut.default;map?.setCutHeight(Number(cut.value));}
document.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>chooseLevel(b.dataset.level));
async function switchMap(id,updateUrl=true){
 const generation=++loadGeneration;loadController?.abort();map?.dispose();map=undefined;
 loadController=new AbortController();config={...getMap(id),utilities:[]};utilities=[];filter='all';level='upper';
 const modelDownload=downloadModel(config.model,loadController.signal);
 const localItems=listLocalLineups(config.id).then(items=>({items}),error=>({items:[],error}));
 $('#local-entry').href='./local.html?map='+config.id;
 $('#community-status').textContent='正在读取教程…';
 ensureTeamType();
 current=visible()[0]||null;
 if(updateUrl)syncUrl();
 $('#map-picker').value=config.id;document.title='CS2 道具地图 · '+config.name;
 $('.map-card h1').innerHTML=config.name+'<span>'+config.en+'</span>';
 $('.map-card .eyebrow').textContent='ACTIVE MAP / '+String(Object.keys(maps).indexOf(config.id)+1).padStart(2,'0');
 $('.filters').innerHTML=Object.entries({all:'全部',...config.zones}).map(([zone,name])=>'<button data-filter="'+zone+'" aria-pressed="false">'+name+'</button>').join('');bindZones();
 $('.map-stage').setAttribute('aria-label',config.name+'三维互动地图');
 $('#map-loading').hidden=false;$('#map-loading span').textContent='正在加载'+config.name+'…';$('#map-error').hidden=true;
 const cut=$('#cut-height');cut.min=config.cut.min;cut.max=config.cut.max;cut.value=config.cut.default;
 $('.map-disclaimer').textContent=config.en+' / 游戏几何 · 简化材质 · 示意弹道';
 syncLevelControls();syncFilters();renderList();renderDetail();
 const [communityResult,localResult]=await Promise.all([
  loadCommunity(config.id,AbortSignal.any([loadController.signal,AbortSignal.timeout(5000)])).then(items=>({items}),error=>({items:[],error})),localItems
 ]);
 if(generation!==loadGeneration)return;
 config={...config,utilities:[...communityResult.items,...localResult.items].map(currentSpawnLabel)};utilities=config.utilities;ensureTeamType();current=visible()[0]||null;
 $('#community-status').textContent=(communityResult.error?'公开教程暂时无法加载；':`公开教程 ${communityResult.items.length} 条；`)+(localResult.error?localError(localResult.error):`本地 ${localResult.items.length} 条，点位仅在确认后合并`);
 const selectedId=new URLSearchParams(location.search).get('lineup');
 if(utilities.some(item=>item.id===selectedId))select(selectedId);
 syncFilters();renderList();renderDetail();
 try{
  const loaded=await createMap($('#map-canvas'),$('#map-labels'),utilities,select,icon,config,loadController.signal,{modelDownload});
  if(generation!==loadGeneration){loaded.dispose();return;}
  map=loaded;map.setLevel(level);map.setRoofs(false);map.setCutHeight(Number(cut.value));map.setView(view);syncFilters();map.select(current);
 }catch(error){if(generation!==loadGeneration||error.name==='AbortError')return;console.error('3D map initialization failed',error);$('#map-error').hidden=false;$('#map-loading').hidden=true;}
 renderDetail();
}
$('#lineup-source').onchange=e=>{sourceFilter=e.target.value;ensureTeamType();changeFilters(type,filter);};
$('#map-picker').onchange=e=>switchMap(e.target.value);
$('#retry-map').onclick=()=>switchMap(config.id,false);
addEventListener('pagehide',()=>{loadController?.abort();map?.dispose();++detailGeneration;if(localVideoUrl)URL.revokeObjectURL(localVideoUrl);});
await switchMap(config.id,false);

// Preserve existing map integrations and expose one utility tool per new map.
if(document.modelContext?.registerTool){
 const lifecycle=new AbortController();addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
 for(const [name,mapId,smokeOnly] of [['show_mirage_smoke','mirage',true],['show_mirage_utility','mirage',false],['show_nuke_utility','nuke',false],['show_ancient_utility','ancient',false],['show_dust2_utility','dust2',false],['show_inferno_utility','inferno',false],['show_anubis_utility','anubis',false],['show_cache_utility','cache',false]]){
  const target=maps[mapId],items=target.utilities.filter(s=>!smokeOnly||s.type==='smoke');
  try{Promise.resolve(document.modelContext.registerTool({name,title:'查看'+target.name+'道具教程',description:'切换地图并显示道具落点、站位与投掷方法。',inputSchema:{type:'object',properties:{id:{type:'string',enum:items.map(s=>s.id)}},required:['id'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},async execute(input){if(!input||typeof input!=='object'||Object.keys(input).some(k=>k!=='id')||!items.some(s=>s.id===input.id))throw new Error('请选择有效的道具点位');if(config.id!==mapId)await switchMap(mapId);if(!utilities.some(s=>s.id===input.id))throw Error('教程已撤下或暂时无法加载');filter='all';select(input.id);return {id:current.id,map:config.id,team:current.team,type:current.type,name:current.name,from:current.from,method:current.method,steps:current.steps,videoAvailable:!!current.video};}},{signal:lifecycle.signal})).catch(e=>console.warn('Optional WebMCP registration unavailable',e));}catch(e){console.warn('Optional WebMCP unavailable',e);}
 }
}

// Recreate disposed renderers when returning through the browser's back/forward cache.
addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
