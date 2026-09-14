import {smokes,utilities} from './data.js';
import {utilityTypes,filterUtilities} from './utility-types.js';
import {createMap} from './map.js';
import {setupMobileLayout} from './mobile-layout.js';

const mobileUI=setupMobileLayout();

let type='smoke',filter='all',current=smokes[0],map;
const zoneName=z=>({A:'A 区',B:'B 区',mid:'中路',all:'全部区域'}[z]);
const $=selector=>document.querySelector(selector);
const visible=()=>filterUtilities(utilities,type,filter);
const icon=s=>utilityTypes[s.type].icon;
const pad=n=>String(n).padStart(2,'0');

function renderList(){
 const items=visible();
 $('#library-heading').textContent=utilityTypes[type].targetLabel;
 $('#point-count').textContent=pad(items.length);
 $('#point-list').innerHTML=items.length?items.map(s=>'<button class="point-item '+(s.id===current?.id?'active':'')+'" data-id="'+s.id+'" aria-pressed="'+(s.id===current?.id)+'"><span class="smoke-icon">'+icon(s)+'</span><span><strong>'+s.name+'</strong><small>'+s.en+'</small></span><span class="zone-tag">'+(s.zone==='mid'?'M':s.zone)+'</span></button>').join(''):'<p class="empty-points">'+zoneName(filter)+'暂无'+utilityTypes[type].label+'点位。<br>选择“全部”查看已有教程。</p>';
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
 if(next){type=next.type;if(filter!=='all'&&filter!==next.zone)filter='all';}
 current=next||null;
 syncFilters();map?.select(current);renderList();renderDetail();mobileUI.showDetails();
}
function changeFilters(nextType,nextZone){
 type=nextType;filter=nextZone;
 const items=visible();
 current=items.find(s=>s.id===current?.id)||items[0]||null;
 syncFilters();map?.select(current);renderList();renderDetail();
}
$('#utility-switch').innerHTML=Object.entries(utilityTypes).map(([id,t])=>'<button data-type="'+id+'" aria-label="'+t.label+'" title="'+t.label+'" aria-pressed="'+(id===type)+'" class="'+(id===type?'active':'')+'" style="--type-color:'+t.color+'">'+t.icon+'<span>'+t.short+'</span></button>').join('');
document.querySelectorAll('[data-type]').forEach(b=>b.onclick=()=>changeFilters(b.dataset.type,filter));
document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>changeFilters(type,b.dataset.filter));
$('#zoom-in').onclick=()=>map?.zoom(.83);$('#zoom-out').onclick=()=>map?.zoom(1.2);$('#reset-view').onclick=()=>map?.reset();
for(const view of ['3d','top','radar'])$('#view-'+view).onclick=()=>{map?.setView(view);$('.touch-gesture').textContent=view==='3d'?'单指旋转 · 双指平移与缩放':'单指平移 · 双指平移与缩放';for(const v of ['3d','top','radar']){const b=$('#view-'+v);b.classList.toggle('active',v===view);b.setAttribute('aria-pressed',String(v===view));}};
const roofButton=$('#toggle-roofs');
roofButton.onclick=()=>{const enabled=roofButton.getAttribute('aria-pressed')!=='true';map?.setRoofs(enabled);roofButton.setAttribute('aria-pressed',String(enabled));roofButton.classList.toggle('active',enabled);roofButton.textContent=enabled?'返回剖切':'完整建筑';$('#cut-height').disabled=enabled;};
$('#cut-height').oninput=e=>map?.setCutHeight(Number(e.target.value));
syncFilters();renderList();renderDetail();
try{
 map=await createMap($('#map-canvas'),$('#map-labels'),utilities,select,icon);
 map.setRoofs(roofButton.getAttribute('aria-pressed')==='true');
 map.setCutHeight(Number($('#cut-height').value));
 const selectedView=document.querySelector('.map-view-switch button.active')?.id;
 if(selectedView==='view-top'||selectedView==='view-radar')map.setView(selectedView.slice(5));
 syncFilters();map.select(current);
}catch(e){console.error('3D map initialization failed',e);$('#map-error').hidden=false;$('#map-loading').hidden=true;}
renderDetail();

// Preserve the existing smoke integration and expose the other utility types.
if(document.modelContext?.registerTool){
 const lifecycle=new AbortController();
 addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
 for(const [name,title,items] of [['show_mirage_smoke','查看荒漠迷城烟雾教程',smokes],['show_mirage_utility','查看荒漠迷城道具教程',utilities]]){
  try{Promise.resolve(document.modelContext.registerTool({name,title,description:'在地图和教学面板中显示道具落点、站位与投掷方法。',inputSchema:{type:'object',properties:{id:{type:'string',enum:items.map(s=>s.id)}},required:['id'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!input||typeof input!=='object'||Object.keys(input).some(k=>k!=='id')||!items.some(s=>s.id===input.id))throw new Error('请选择有效的道具点位');filter='all';select(input.id);return {id:current.id,type:current.type,name:current.name,from:current.from,method:current.method,steps:current.steps,videoAvailable:false};}},{signal:lifecycle.signal})).catch(e=>console.warn('Optional WebMCP registration unavailable',e));}catch(e){console.warn('Optional WebMCP unavailable',e);}
 }
}
