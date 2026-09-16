import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';
import { GLTFLoader } from './vendor/loaders/GLTFLoader.js';
import { DRACOLoader } from './vendor/loaders/DRACOLoader.js';
import { utilityTypes } from './utility-types.js';
import { createUtilityEffect } from './utility-effects.js';

// Native geometry is transformed once in Blender into this radar-aligned frame.
export const radarToWorld = (u, v, height = 0) => new THREE.Vector3((u - 512) / 10, height, (v - 512) / 10);
function disposeTree(root){
 const geometries=new Set(),materials=new Set();
 root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of (Array.isArray(o.material)?o.material:[o.material]))materials.add(m)});
 geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
}
export async function createMap(host, labels, smokes, select, utilityIcon, config, signal, editor={}) {
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  let disposed=false,frameId,observer,curve,ball,smokeGroup,active,started=0,playing=false,resolvePlay,view='3d',level='upper',showRoofs=false;
  const radarTextures={},elements=[];
  function dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(frameId);observer?.disconnect();cancelPlay();controls.dispose();host.removeEventListener('keydown',onKey);elements.forEach(e=>e.remove());disposeTree(scene);scene.traverse(o=>o.shadow?.dispose());Object.values(radarTextures).forEach(t=>t.dispose());renderer.dispose();renderer.domElement.remove();signal?.removeEventListener('abort',dispose);}
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.localClippingEnabled = true;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  host.append(renderer.domElement);
  // Orthographic projection preserves the radar's proportions in both views.
  const camera = new THREE.OrthographicCamera(-55, 55, 55, -55, .1, 500);
  const center = new THREE.Vector3(...config.center);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(center);
  controls.enableDamping = true;
  controls.dampingFactor = .09;
  controls.minZoom = .65;
  controls.maxZoom = 5;
  controls.maxPolarAngle = Math.PI / 2.25;
  controls.minPolarAngle = .001;
  controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.PAN, RIGHT: null };
  controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
  signal?.addEventListener('abort',dispose,{once:true});
  if(signal?.aborted){dispose();throw new DOMException('Map load cancelled','AbortError');}
  try {
  // Suppress browser auto-scroll while using middle-button map dragging.
  for(const event of ['pointerdown','auxclick'])renderer.domElement.addEventListener(event,e=>{if(e.button===1)e.preventDefault();});
  scene.add(new THREE.AmbientLight(0xdfe9e5, 1.7));
  const sun = new THREE.DirectionalLight(0xffe7c3, 2.5);
  sun.position.set(-38, 95, -35);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -65, right: 65, top: 65, bottom: -65, near: 1, far: 220 });
  sun.shadow.normalBias = .04;
  scene.add(sun);
  const grid = new THREE.GridHelper(180, 90, 0x53685f, 0x53685f);
  grid.position.y = config.gridHeight;
  grid.material.transparent = true;
  grid.material.opacity = .09;
  scene.add(grid);
  const decoder = new DRACOLoader().setDecoderPath('./vendor/draco/').setDecoderConfig({type:'wasm'}).setWorkerLimit(2);
  const loader = new GLTFLoader().setDRACOLoader(decoder);
  const loadingText=document.querySelector('#map-loading span');
  const [native,metadata] = await Promise.all([
    loader.loadAsync(config.model,event=>{if(!disposed&&loadingText)loadingText.textContent=event.total?`正在加载${config.name} ${Math.round(event.loaded/event.total*100)}%`:`正在加载${config.name}…`}).then(asset=>{decoder.dispose();if(disposed){disposeTree(asset.scene);throw new DOMException('Map load cancelled','AbortError');}scene.add(asset.scene);return asset;},error=>{decoder.dispose();throw error;}),
    fetch(config.metadata,{signal}).then(r=>{if(!r.ok)throw new Error('Map metadata unavailable');return r.json()})
  ]);
  decoder.dispose();
  const model=native.scene;model.name='Native '+config.en;
  const cutPlane=new THREE.Plane(new THREE.Vector3(0,-1,0),config.cut.default);
  const lowerCeiling=new THREE.Plane(new THREE.Vector3(0,-1,0),config.lowerCut||0);
  const upperFloor=new THREE.Plane(new THREE.Vector3(0,1,0),-(config.levelBoundary||0));
  // Peripheral scenery has been physically removed from the Blender asset.
  const perimeter=[];
  const modelMaterials=new Set();
  model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;for(const m of (Array.isArray(o.material)?o.material:[o.material])){m.side=THREE.DoubleSide;m.clippingPlanes=[...perimeter,cutPlane];m.clipShadows=true;modelMaterials.add(m)}}});
  model.updateMatrixWorld(true);
  const floorLevels = new Map();
  for(const s of smokes) for(const kind of ['origin','target'])floorLevels.set(s[kind],metadata.anchors[s.id]?.[kind]?.height??s[kind+'Height']??0);
  scene.add(model);
  await Promise.all(Object.entries(config.radars).map(async([id,url])=>{const texture=await new THREE.TextureLoader().loadAsync(url);if(disposed){texture.dispose();throw new DOMException('Map load cancelled','AbortError');}texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());radarTextures[id]=texture;}));

  // Exact raster comparison uses the same coordinates and camera, without extruded walls.
  const referencePlane = new THREE.Mesh(new THREE.PlaneGeometry(102.4,102.4),new THREE.MeshBasicMaterial({map:radarTextures.upper,transparent:true,depthWrite:false}));
  referencePlane.rotation.x=-Math.PI/2;referencePlane.position.y=.03;referencePlane.visible=false;scene.add(referencePlane);
  const projected=[];
  function label(text,u,v,y=1,cls='area-label',labelLevel) {
    const e=document.createElement('div');e.className='world-label '+cls;e.textContent=text;labels.append(e);elements.push(e);
    const item={e,position:radarToWorld(u,v,y),baseHeight:y,level:labelLevel};projected.push(item);return item;
  }
  config.labels.forEach(args=>label(...args));
  const levelAt = (point,height) => floorLevels.get(point)??height??0;
  const markers=new Map();
  for(const s of smokes) {
    const e=document.createElement('button');e.className='world-label world-marker';
    e.innerHTML=utilityIcon(s);const caption=document.createElement('span');caption.className='marker-caption';caption.textContent=s.name;e.append(caption);
    e.style.setProperty('--marker-color',utilityTypes[s.type].color);
    e.setAttribute('aria-label',s.name+'：查看投掷方法');e.title=s.name;e.onclick=()=>select(s.id);labels.append(e);elements.push(e);
    const markerHeight=levelAt(s.target)+(s.targetOffset||0)+2.2;
    const m={e,position:new THREE.Vector3(s.target[0],markerHeight,s.target[1]),baseHeight:markerHeight,smoke:s};
    projected.push(m);markers.set(s.id,m);
  }
  const origin=label('投掷站位',0,0,2,'origin-label');
  let picking=null,downPoint;
  const pickRay=new THREE.Raycaster(),pickDots=new THREE.Group();scene.add(pickDots);
  renderer.domElement.addEventListener('pointerdown',e=>{if(e.button===0)downPoint=[e.clientX,e.clientY];});
  renderer.domElement.addEventListener('pointerup',e=>{
   if(!picking||e.button!==0||!downPoint||Math.hypot(e.clientX-downPoint[0],e.clientY-downPoint[1])>5)return;
   const box=renderer.domElement.getBoundingClientRect();pickRay.setFromCamera(new THREE.Vector2((e.clientX-box.left)/box.width*2-1,-(e.clientY-box.top)/box.height*2+1),camera);
   const hit=pickRay.intersectObject(model,true).find(h=>{
    const mat=Array.isArray(h.object.material)?h.object.material[h.face.materialIndex]:h.object.material;
    const normal=h.face.normal.clone().transformDirection(h.object.matrixWorld);
    // Imported double-sided floors may have reversed winding after conversion.
    return Math.abs(normal.y)>.7&&!(mat.clippingPlanes||[]).some(p=>p.distanceToPoint(h.point)<-.001);
   });
   if(!hit){editor.onMiss?.();return;}const kind=picking;picking=null;editor.onPick?.(kind,hit.point.toArray());
  });
  function setEditorPoints(points){
   disposeTree(pickDots);pickDots.clear();
   for(const [kind,p] of Object.entries(points)){if(!p)continue;const dot=new THREE.Mesh(new THREE.SphereGeometry(.65,12,10),new THREE.MeshBasicMaterial({color:kind==='target'?0xe8b576:0x8ed5c1}));dot.position.set(p[0],p[1]+.7,p[2]);pickDots.add(dot);}
  }
  const routeGroup=new THREE.Group();scene.add(routeGroup);
  const ring=new THREE.Mesh(new THREE.RingGeometry(2.3,2.45,48),new THREE.MeshBasicMaterial({color:0xf3b574,transparent:true,opacity:.8,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;scene.add(ring);
  const originRing=new THREE.Mesh(new THREE.RingGeometry(.5,.75,32),new THREE.MeshBasicMaterial({color:0x86d8c6,side:THREE.DoubleSide}));originRing.rotation.x=-Math.PI/2;scene.add(originRing);
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function selectSmoke(s) {
    cancelPlay();active=s;
    while(routeGroup.children.length){const c=routeGroup.children[0];c.traverse(o=>{o.geometry?.dispose();if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose())});routeGroup.remove(c)}
    ring.visible=originRing.visible=!!s;origin.e.hidden=!s;
    if(!s){markers.forEach(m=>{m.e.classList.remove('selected');m.e.setAttribute('aria-pressed','false')});return;}
    markers.forEach((m,id)=>{m.e.classList.toggle('selected',id===s.id);m.e.setAttribute('aria-pressed',String(id===s.id))});
    const oy=view==='radar'?0:levelAt(s.origin,s.originHeight),ty=view==='radar'?0:levelAt(s.target,s.targetHeight);
    const color=utilityTypes[s.type].color;
    ring.material.color.set(color);
    origin.position.set(s.origin[0],oy+2,s.origin[1]);origin.baseHeight=oy+2;
    originRing.position.set(s.origin[0],oy+.1,s.origin[1]);ring.position.set(s.target[0],ty+.15,s.target[1]);
    const a=new THREE.Vector3(s.origin[0],oy+1.7,s.origin[1]),b=new THREE.Vector3(s.target[0],ty+(s.targetOffset||.5),s.target[1]);
    const arc=config.id==='nuke'?Math.min(10,Math.max(2,a.distanceTo(b)*.3)):20;
    curve=new THREE.QuadraticBezierCurve3(a,new THREE.Vector3((a.x+b.x)/2,Math.max(oy,ty)+arc,(a.z+b.z)/2),b);
    const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(90)),new THREE.LineDashedMaterial({color,dashSize:.7,gapSize:.45,transparent:true,opacity:.8}));line.computeLineDistances();routeGroup.add(line);
    ball=new THREE.Mesh(new THREE.SphereGeometry(.36,12,12),new THREE.MeshBasicMaterial({color:0xffe0a1}));ball.visible=false;routeGroup.add(ball);
    smokeGroup=createUtilityEffect(s.type);
    smokeGroup.position.set(b.x,ty+(s.targetOffset||0),b.z);smokeGroup.visible=false;routeGroup.add(smokeGroup);
  }
  function play(){cancelPlay();if(!active)return Promise.resolve();started=performance.now();playing=true;ball.visible=true;smokeGroup.visible=false;return new Promise(r=>resolvePlay=r)}
  function resize(){const {width,height}=host.getBoundingClientRect();if(!width||!height)return;const aspect=width/height;const halfHeight=Math.max(53,64/aspect);camera.left=-halfHeight*aspect;camera.right=halfHeight*aspect;camera.top=halfHeight;camera.bottom=-halfHeight;camera.updateProjectionMatrix();renderer.setSize(width,height)}
  observer=new ResizeObserver(resize);observer.observe(host);resize();
  function reset(){controls.target.copy(center);if(level==='lower')controls.target.set(9,-4,2);camera.zoom=level==='lower'?2.1:(config.defaultZoom||1);camera.position.copy(controls.target).add(view==='3d'?new THREE.Vector3(60,108,90):new THREE.Vector3(0,150,.01));camera.updateProjectionMatrix();controls.update()}
  function zoom(f){camera.zoom=THREE.MathUtils.clamp(camera.zoom/f,controls.minZoom,controls.maxZoom);camera.updateProjectionMatrix()}
  host.addEventListener('keydown',onKey);
  reset();
  const temp=new THREE.Vector3();
  function frame(now){
    if(disposed)return;frameId=requestAnimationFrame(frame);controls.update();renderer.render(scene,camera);
    const w=host.clientWidth,h=host.clientHeight;
    for(const {e,position,smoke} of projected){temp.copy(position);if(view==='radar')temp.y=.3;temp.project(camera);e.style.left=((temp.x*.5+.5)*w)+'px';e.style.top=((-temp.y*.5+.5)*h)+'px';e.style.visibility=temp.z>1||temp.z< -1?'hidden':'visible';e.style.zIndex=smoke?.id===active?.id?25:10;}
    // North rotates with the camera; its initial orientation matches the radar.
    const north=document.querySelector('.compass svg');if(north)north.style.transform=`rotate(${controls.getAzimuthalAngle()*180/Math.PI}deg)`;
    if(active&&!reduce)ring.scale.setScalar(1+Math.sin(now*.002)*.035);
    if(playing){const t=reduce?1:(now-started)/2200;ball.position.copy(curve.getPoint(Math.min(t,1)));if(t>=1){ball.visible=false;smokeGroup.visible=true;smokeGroup.scale.setScalar(Math.max(.02,reduce?1:Math.min((t-1)*2,1)));if(t>=1.6||reduce){playing=false;resolvePlay?.();resolvePlay=null}}}
  }
  frameId=requestAnimationFrame(frame);
  document.querySelector('#map-loading').hidden=true;
  function updateSection(){
   modelMaterials.forEach(m=>{m.clippingPlanes=config.levelBoundary?(level==='lower'?[lowerCeiling]:showRoofs?[]:[upperFloor,cutPlane]):showRoofs?perimeter:[...perimeter,cutPlane];m.needsUpdate=true;});
   projected.forEach(item=>{if(item.level)item.e.hidden=item.level!==level;});
   referencePlane.material.map=radarTextures[level]||radarTextures.upper;referencePlane.material.needsUpdate=true;
  }
  updateSection();
  return {dispose,setPicking:kind=>{picking=kind;},setEditorPoints,setLevel:next=>{level=next;updateSection();reset();},setRoofs:enabled=>{showRoofs=enabled;updateSection();},setCutHeight:height=>{if(level==='lower')lowerCeiling.constant=height;else cutPlane.constant=height;},select:selectSmoke,play,filter:items=>{const ids=new Set(items.map(s=>s.id));markers.forEach(({e,smoke})=>e.hidden=!ids.has(smoke.id));},zoom,reset,setView:v=>{view=v;model.visible=v!=='radar';referencePlane.visible=v==='radar';controls.enableRotate=v==='3d';controls.mouseButtons.LEFT=v==='3d'?THREE.MOUSE.ROTATE:THREE.MOUSE.PAN;controls.touches.ONE=v==='3d'?THREE.TOUCH.ROTATE:THREE.TOUCH.PAN;reset();if(active)selectSmoke(active)}};
  } catch(error){dispose();throw error;}
  function cancelPlay(){playing=false;if(resolvePlay){resolvePlay();resolvePlay=null}}
  function onKey(e){const moves={ArrowLeft:[-3,0],ArrowRight:[3,0],ArrowUp:[0,-3],ArrowDown:[0,3]};if(moves[e.key]){e.preventDefault();const[x,z]=moves[e.key];const d=new THREE.Vector3(x,0,z);controls.target.add(d);camera.position.add(d)}if(e.key==='+'||e.key==='='){camera.zoom=Math.min(camera.zoom/.85,5);camera.updateProjectionMatrix();}if(e.key==='-'){camera.zoom=Math.max(camera.zoom/1.15,.65);camera.updateProjectionMatrix();}}
}
