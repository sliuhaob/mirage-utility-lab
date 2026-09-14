import {maps,getMap,mapUtilities} from './maps.js?v=2';
import {utilityTypes} from './utility-types.js';
import {createMap} from './map.js?v=2';
import {setupMobileLayout} from './mobile-layout.js';

const mobileUI=setupMobileLayout();

let config=getMap(new URLSearchParams(location.search).get('map'));
let utilities=config.utilities,type='smoke',filter='all',level='upper',current=utilities.find(s=>s.type==='smoke'),map,loadController,loadGeneration=0;
let view='3d';
const zoneName=z=>z==='all'?'全部区域':config.zones[z]||z;
const $=selector=>document.querySelector(selector);
const visible=()=>mapUtilities(config,type,filter,level);
const icon=s=>utilityTypes[s.type].icon;
const pad=n=>String(n).padStart(2,'0');

function renderList(){
 const items=visible();
 $('#library-heading').textContent=utilityTypes[type].targetLabel;
 $('#point-count').textContent=pad(items.length);
 $('#point-list').innerHTML=items.length?items.map(s=>'<button class="point-item '+(s.id===current?.id?'active':'')+'" data-id="'+s.id+'" aria-pressed="'+(s.id===current?.id)+'"><span class="smoke-icon">'+icon(s)+'</span><span><strong>'+s.name+'</strong><small>'+s.en+'</small></span><span class="zone-tag">'+({mid:'M',outside:'Y',ramp:'R'}[s.zone]||s.zone)+'</span></button>').join(''):'<p class="empty-points">'+zoneName(filter)+'暂无'+utilityTypes[type].label+'点位。<br>选择“全部”查看已有教程。</p>';
 document.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>select(b.dataset.id));
}
function renderDetail(){
 const items=visible(),s=current;
 $('#detail-number').textContent=pad(s?items.findIndex(x=>x.id===s.id)+1:0)+' / '+pad(items.length);
 if(!s){$('#detail-content').innerHTML='<div class="empty-detail"><span>'+utilityTypes[type].icon+'</span><h2>暂无对应点位</h2><p>切换区域或道具类型，查看已有投掷教学。</p></div>';return;}
 $('#detail-content').innerHTML='<span class="detail-zone">'+zoneName(s.zone)+' · '+utilityTypes[type].label+'</span><h2 class="detail-heading">'+s.name+'</h2><div class="detail-en">'+s.en+'</div><p class="detail-description">'+s.description+'</p><div class="video-placeholder" role="img" aria-label="视频教学暂未加入"><span class="video-format">LINEUP / VIDEO</span><span class="play">▷</span><strong>教学视频，待加入</strong><small>先通过下方步骤了解投掷方法</small></div><div class="route-info"><div class="route-row"><span>投掷位置</span><span><i class="origin-swatch">◉</i>'+s.from+'</span></div><div class="route-row"><span>投掷方式</span><span>'+s.method+'</span></div></div><h3 class="steps-title">投掷步骤</h3><ol class="steps">'+s.steps.map(t=>'<li>'+t+'</li>').join('')+'</ol><div class="key-row">'+s.keys.map(k=>'<kbd>'+k+'</kbd>').join('<span>+</span>')+'</div><button class="trajectory-button" id="play-route">⌁ <span>演示投掷路线</span></button><p class="tip"><strong>实战提示 / </strong>'+s.tip+'</p><a class="source-link" href="'+s.source+'" target="_blank" rel="noopener noreferrer">图文来源：'+s.sourceName+' ↗</a>';
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
 $('#legend-target').textContent=info.targetLabel;
 $('.sidebar-hint').textContent=type==='flash'?'选择你想投闪的位置':'选择你想投掷到的位置';
 map?.filter(type,filter);
}
function select(id){
 const next=utilities.find(s=>s.id===id);
 if(next){type=next.type;if(config.levelBoundary&&next.level!==level){level=next.level;map?.setLevel(level);syncLevelControls();resetCutControl();}if(filter!=='all'&&filter!==next.zone)filter='all';}
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
$('#utility-switch').innerHTML=Object.entries(utilityTypes).map(([id,t])=>'<button data-type="'+id+'" aria-label="'+t.label+'" title="'+t.label+'" aria-pressed="'+(id===type)+'" class="'+(id===type?'active':'')+'" style="--type-color:'+t.color+'">'+t.icon+'<span>'+t.short+'</span></button>').join('');
document.querySelectorAll('[data-type]').forEach(b=>b.onclick=()=>changeFilters(b.dataset.type,filter));
function bindZones(){document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>changeFilters(type,b.dataset.filter));}
$('#zoom-in').onclick=()=>map?.zoom(.83);$('#zoom-out').onclick=()=>map?.zoom(1.2);$('#reset-view').onclick=()=>map?.reset();
for(const nextView of ['3d','top','radar'])$('#view-'+nextView).onclick=()=>{view=nextView;map?.setView(view);$('.touch-gesture').textContent=view==='3d'?'单指旋转 · 双指平移与缩放':'单指平移 · 双指平移与缩放';for(const v of ['3d','top','radar']){const b=$('#view-'+v);b.classList.toggle('active',v===view);b.setAttribute('aria-pressed',String(v===view));}};
const roofButton=$('#toggle-roofs');
roofButton.onclick=()=>{const enabled=roofButton.getAttribute('aria-pressed')!=='true';map?.setRoofs(enabled);roofButton.setAttribute('aria-pressed',String(enabled));roofButton.classList.toggle('active',enabled);roofButton.textContent=enabled?'返回剖切':'完整建筑';$('#cut-height').disabled=enabled;};
$('#cut-height').oninput=e=>map?.setCutHeight(Number(e.target.value));
function syncLevelControls(){
 $('#level-switch').hidden=!config.levelBoundary;
 document.querySelectorAll('[data-level]').forEach(b=>{b.classList.toggle('active',b.dataset.level===level);b.setAttribute('aria-pressed',String(b.dataset.level===level));});
 $('#cut-height').disabled=roofButton.getAttribute('aria-pressed')==='true'&&level!=='lower';
 roofButton.disabled=level==='lower';
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
 loadController=new AbortController();config=getMap(id);utilities=config.utilities;filter='all';level='upper';
 current=visible()[0]||null;
 if(updateUrl){const url=new URL(location.href);url.searchParams.set('map',config.id);history.replaceState(null,'',url);}
 $('#map-picker').value=config.id;document.title=config.en+' LAB · '+config.name+'道具地图';
 $('#brand-map').textContent=config.en;$('.top-title').textContent=config.name+' / 互动道具地图';
 $('.map-card h1').innerHTML=config.name+'<span>'+config.en+'</span>';
 $('.map-card .eyebrow').textContent='ACTIVE MAP / '+(config.id==='nuke'?'02':'01');
 $('.filters').innerHTML=Object.entries({all:'全部',...config.zones}).map(([zone,name])=>'<button data-filter="'+zone+'" aria-pressed="false">'+name+'</button>').join('');bindZones();
 $('.map-stage').setAttribute('aria-label',config.name+'三维互动地图');
 $('#map-loading').hidden=false;$('#map-loading span').textContent='正在加载'+config.name+'…';$('#map-error').hidden=true;
 const cut=$('#cut-height');cut.min=config.cut.min;cut.max=config.cut.max;cut.value=config.cut.default;
 roofButton.setAttribute('aria-pressed','false');roofButton.classList.remove('active');roofButton.textContent='完整建筑';
 $('.map-disclaimer').innerHTML=config.en+' / 游戏几何 · 简化材质 · 示意弹道 <a class="map-source" href="'+config.reference+'" target="_blank" rel="noopener noreferrer">地图参考 ↗</a>';
 syncLevelControls();syncFilters();renderList();renderDetail();
 try{
  const loaded=await createMap($('#map-canvas'),$('#map-labels'),utilities,select,icon,config,loadController.signal);
  if(generation!==loadGeneration){loaded.dispose();return;}
  map=loaded;map.setLevel(level);map.setRoofs(roofButton.getAttribute('aria-pressed')==='true');map.setCutHeight(Number(cut.value));map.setView(view);syncFilters();map.select(current);
 }catch(error){if(generation!==loadGeneration||error.name==='AbortError')return;console.error('3D map initialization failed',error);$('#map-error').hidden=false;$('#map-loading').hidden=true;}
 renderDetail();
}
$('#map-picker').onchange=e=>switchMap(e.target.value);
$('#retry-map').onclick=()=>switchMap(config.id,false);
addEventListener('pagehide',()=>{loadController?.abort();map?.dispose();});
await switchMap(config.id,false);

// Keep the public Mirage integration stable and add Nuke as a separate tool.
if(document.modelContext?.registerTool){
 const lifecycle=new AbortController();addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
 for(const [name,mapId,smokeOnly] of [['show_mirage_smoke','mirage',true],['show_mirage_utility','mirage',false],['show_nuke_utility','nuke',false]]){
  const target=maps[mapId],items=target.utilities.filter(s=>!smokeOnly||s.type==='smoke');
  try{Promise.resolve(document.modelContext.registerTool({name,title:'查看'+target.name+'道具教程',description:'切换地图并显示道具落点、站位与投掷方法。',inputSchema:{type:'object',properties:{id:{type:'string',enum:items.map(s=>s.id)}},required:['id'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},async execute(input){if(!input||typeof input!=='object'||Object.keys(input).some(k=>k!=='id')||!items.some(s=>s.id===input.id))throw new Error('请选择有效的道具点位');if(config.id!==mapId)await switchMap(mapId);filter='all';select(input.id);return {id:current.id,map:config.id,type:current.type,name:current.name,from:current.from,method:current.method,steps:current.steps,videoAvailable:false};}},{signal:lifecycle.signal})).catch(e=>console.warn('Optional WebMCP registration unavailable',e));}catch(e){console.warn('Optional WebMCP unavailable',e);}
 }
}
