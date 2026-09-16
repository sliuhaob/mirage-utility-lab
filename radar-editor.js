const NS='http://www.w3.org/2000/svg',heightCache=new Map();
const svgNode=(name,attrs={})=>{const e=document.createElementNS(NS,name);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);return e;};
export function decodeFloors(data){
 const levels={};for(const [id,runs] of Object.entries(data.levels)){const grid=new Int16Array(data.size*data.size);let offset=0;for(let i=0;i<runs.length;i+=2){grid.fill(runs[i+1],offset,offset+runs[i]);offset+=runs[i];}if(offset!==grid.length)throw Error('地图高度数据无效');levels[id]=grid;}
 return {...data,levels};
}
export function floorHeight(data,level,x,z){
 const gx=Math.floor((x-data.min)/data.span*data.size),gz=Math.floor((z-data.min)/data.span*data.size),grid=data.levels[level]||data.levels.upper;
 if(gx<0||gz<0||gx>=data.size||gz>=data.size)return null;
 // Prefer the cell under the pointer; allow one neighboring cell at narrow edges.
 for(const [dx,dz] of [[0,0],[-1,0],[1,0],[0,-1],[0,1]]){const ix=gx+dx,iz=gz+dz;if(ix<0||iz<0||ix>=data.size||iz>=data.size)continue;const h=grid[iz*data.size+ix];if(h!==data.missing)return h/data.scale;}
 return null;
}
export async function createRadarEditor(host,config,signal,editor){
 let disposed=false,level='upper',picking=null,points={},down=null,dragging=false,animation=null,selected=null;
 let view={x:-70,y:-100,w:1164,h:1224};
 const root=svgNode('svg',{class:'radar-editor',role:'img','aria-label':config.name+'二维选点地图',preserveAspectRatio:'xMidYMid meet'});
 const raster=svgNode('image',{x:0,y:0,width:1024,height:1024,href:config.radars.upper});
 const labels=svgNode('g',{class:'radar-labels'}),route=svgNode('g'),dots=svgNode('g');root.append(raster,labels,route,dots);host.append(root);
 const dispose=()=>{if(disposed)return;disposed=true;animation?.cancel();root.remove();signal?.removeEventListener('abort',dispose);};
 signal?.addEventListener('abort',dispose,{once:true});
 const setViewBox=()=>root.setAttribute('viewBox',`${view.x} ${view.y} ${view.w} ${view.h}`);setViewBox();
 const coordinate=e=>{const m=root.getScreenCTM();return m?new DOMPoint(e.clientX,e.clientY).matrixTransform(m.inverse()):null;};
 function draw(){
  dots.replaceChildren();labels.replaceChildren();
  for(const [name,u,v,,cls,labelLevel] of config.labels){if(labelLevel&&labelLevel!==level)continue;const t=svgNode('text',{x:u,y:v,class:cls==='site-label'?'radar-site':'radar-callout'});t.textContent=name;labels.append(t);}
  for(const [kind,p] of Object.entries(points)){if(!p)continue;const other=config.levelBoundary&&(p[1]<config.levelBoundary)!==(level==='lower'),g=svgNode('g',{opacity:other?0.35:1,'data-point':kind});g.append(svgNode('circle',{cx:p[0]*10+512,cy:p[2]*10+512,r:11,fill:kind==='target'?'#e8b576':'#8ed5c1',stroke:'#111d1f','stroke-width':4}));const t=svgNode('text',{x:p[0]*10+512,y:p[2]*10+487,class:'radar-point-label'});t.textContent=(kind==='target'?'落点':'站位')+(other?' · 另一层':'');g.append(t);dots.append(g);}
 }
 function clearRoute(){animation?.cancel();animation=null;route.replaceChildren();selected=null;}
 const setPicking=kind=>{picking=kind;root.style.cursor=kind?'crosshair':'grab';};
 root.addEventListener('pointerdown',e=>{if(e.button!==0&&e.button!==1)return;e.preventDefault();root.setPointerCapture(e.pointerId);down={x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,button:e.button};dragging=false;});
 root.addEventListener('pointermove',e=>{if(!down)return;if(Math.hypot(e.clientX-down.x,e.clientY-down.y)>5)dragging=true;if(!dragging)return;const current=coordinate(e),last=coordinate({clientX:down.lastX,clientY:down.lastY});if(current&&last){view.x-=current.x-last.x;view.y-=current.y-last.y;setViewBox();}down.lastX=e.clientX;down.lastY=e.clientY;});
 root.addEventListener('pointerup',e=>{if(!down)return;const choose=!dragging&&down.button===0&&picking;down=null;if(root.hasPointerCapture(e.pointerId))root.releasePointerCapture(e.pointerId);if(!choose)return;const p=coordinate(e);if(!p)return;const x=(p.x-512)/10,z=(p.y-512)/10,y=floorHeight(heights,level,x,z);if(y===null){editor.onMiss?.();return;}const kind=picking;setPicking(null);editor.onPick(kind,[x,y,z]);});
 root.addEventListener('pointercancel',()=>{down=null;});root.addEventListener('auxclick',e=>e.preventDefault());
 root.addEventListener('wheel',e=>{e.preventDefault();const p=coordinate(e);if(!p)return;const factor=Math.exp(Math.max(-.3,Math.min(.3,e.deltaY*.0015))),w=Math.max(230,Math.min(1800,view.w*factor)),f=w/view.w;view={x:p.x+(view.x-p.x)*f,y:p.y+(view.y-p.y)*f,w,h:view.h*f};setViewBox();},{passive:false});
 root.addEventListener('keydown',e=>{const delta={ArrowLeft:[-35,0],ArrowRight:[35,0],ArrowUp:[0,-35],ArrowDown:[0,35]}[e.key];if(delta){e.preventDefault();view.x+=delta[0];view.y+=delta[1];setViewBox();}});root.setAttribute('tabindex','0');
 let heights;
 try{
  heights=heightCache.get(config.id);if(!heights){const response=await fetch(`./assets/${config.id}-floors.json`,{signal});if(!response.ok)throw Error('地图高度加载失败');heights=decodeFloors(await response.json());heightCache.set(config.id,heights);}
  const image=new Image();image.src=config.radars.upper;await image.decode();if(signal?.aborted||disposed)throw new DOMException('Map load cancelled','AbortError');draw();
 }catch(e){dispose();throw e;}
 return {dispose,zoom:factor=>{const w=Math.max(230,Math.min(1800,view.w*factor)),f=w/view.w;view={x:view.x+(view.w-w)/2,y:view.y+(view.h-view.h*f)/2,w,h:view.h*f};setViewBox();},setPicking,setEditorPoints:next=>{points=next;draw();},setLevel:next=>{level=next;raster.setAttribute('href',config.radars[level]||config.radars.upper);draw();},setCutHeight:()=>{},reset:()=>{view={x:-70,y:-100,w:1164,h:1224};setViewBox();},select:item=>{clearRoute();selected=item;},play:()=>{
  if(!selected)return;const a=selected.origin.map(v=>v*10+512),b=selected.target.map(v=>v*10+512),path=svgNode('path',{d:`M${a[0]} ${a[1]} L${b[0]} ${b[1]}`,fill:'none',stroke:'#e8b576','stroke-width':4,'stroke-dasharray':'12 9'}),ball=svgNode('circle',{cx:0,cy:0,r:7,fill:'#fff0ce'});route.replaceChildren(path,ball);animation=ball.animate([{transform:`translate(${a[0]}px,${a[1]}px)`},{transform:`translate(${b[0]}px,${b[1]}px)`}],{duration:1200,fill:'forwards'});
 }};
}
