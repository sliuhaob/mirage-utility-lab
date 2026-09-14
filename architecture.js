import * as THREE from 'three';

// Radar pixels locate structures. Vertical dimensions are a reviewed blockout,
// not measurements extracted from the game. See references/VIDEO-REVIEW.md.
export const world = (u,v,y=0) => new THREE.Vector3((u-512)/10,y,(v-512)/10);
const clamp = THREE.MathUtils.clamp;
export function groundHeight(u,v) {
  // CT slope up to the A courtyard.
  if(v>650 && u<480) return -1.5 + 1.5*clamp((u-390)/90,0,1);
  // Connector climbs from lower mid into A; the landing continues to Jungle.
  if(u>=477 && u<=552 && v>=505 && v<=600) return -1.6+1.6*clamp((v-509)/83,0,1);
  // Mid: the east end rises toward top mid. Catwalk stays above the lower lane.
  if(u>=426 && u<=758 && v>=443 && v<=535) return -1.6+1.6*clamp((u-570)/140,0,1);
  // Underpass lies below the B apartments / short junction.
  if(u>=402 && u<=454 && v>=268 && v<=441) return -2.2;
  return 0;
}

export function buildMirageModel(plan) {
  const group = new THREE.Group(); group.name='Mirage architecture';
  const roofs = new THREE.Group(); roofs.name='Removable roofs'; roofs.visible=false; group.add(roofs);
  const floors = new THREE.Group(); floors.name='Walkable surfaces'; group.add(floors);
  const openings=[];
  const palette={stone:0xc5a979, light:0xddc8a2, dark:0x8c7353, wood:0x90704b, blue:0x6d929d, green:0x8f9e58, metal:0x727765, box:0xbca276};
  const mats=new Map();
  function material(color) {if(!mats.has(color))mats.set(color,new THREE.MeshStandardMaterial({color,roughness:.92}));return mats.get(color)}
  const stone=material(palette.stone), light=material(palette.light), dark=material(palette.dark);
  function mesh(geometry,mat,parent=group,name='') {
    const m=new THREE.Mesh(geometry,mat);m.castShadow=true;m.receiveShadow=true;m.name=name;parent.add(m);return m;
  }
  function box(u,v,w,d,h,base=0,color=palette.stone,parent=group,name='') {
    const m=mesh(new THREE.BoxGeometry(w/10,h,d/10),material(color),parent,name);
    m.position.copy(world(u+w/2,v+d/2,base+h/2));return m;
  }
  function shapeOf(poly) {
    const make=(points,Type)=>{const p=new Type();points.forEach(([u,v],i)=>{i?p.lineTo((u-512)/10,-(v-512)/10):p.moveTo((u-512)/10,-(v-512)/10)});p.closePath();return p};
    const s=make(poly.shell,THREE.Shape);s.holes=(poly.holes||[]).map(h=>make(h,THREE.Path));return s;
  }
  function slab(poly,base,thickness,color=palette.stone,parent=group,name='') {
    const g=new THREE.ExtrudeGeometry(shapeOf(poly),{depth:thickness,bevelEnabled:false,curveSegments:1});g.rotateX(-Math.PI/2);
    const m=mesh(g,material(color),parent,name);m.position.y=base;return m;
  }
  // Independently triangulated ground cells allow actual changes of elevation.
  const positions=[];
  for(const tri of plan.groundTriangles) for(const [u,v] of tri) {const p=world(u,v,groundHeight(u,v));positions.push(p.x,p.y,p.z)}
  const groundGeo=new THREE.BufferGeometry();groundGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));groundGeo.computeVertexNormals();
  mesh(groundGeo,material(0xb6a080),floors,'Terraced ground');
  // The base is below the lowest path, not an opaque fill through every floor.
  slab(plan.floor,-2.5,.35,0x615643,group,'Map foundation');

  // Boundary walls follow the radar footprint; unlike v0.2, voids are never
  // filled with solid buildings. Intervals requiring windows are authored below.
  const boundaryRings=[plan.floor.shell,...plan.floor.holes];
  function nearWindow(u,v){return (u>416&&u<432&&v>430&&v<588)||(v>388&&v<405&&u>182&&u<281)}
  for(const ring of boundaryRings) for(let i=0;i<ring.length;i++) {
    const a=ring[i],b=ring[(i+1)%ring.length],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
    if(length<3)continue;
    const n=Math.ceil(length/12);
    for(let j=0;j<n;j++) {
      const t=(j+.5)/n,u=a[0]+(b[0]-a[0])*t,v=a[1]+(b[1]-a[1])*t;
      // Upper rooms have their own walls, with playable entrances left open.
      if(nearWindow(u,v)||(u>424&&u<458&&v>403&&v<446)||(v<275&&u>222&&u<623)||(v>727&&u>638)||(u>798&&v>580&&v<740))continue;
      const h=(u>758||u<180)?3.8:2.65;
      const m=box(u-length/n/2,v-1.5,length/n,3,h,groundHeight(u,v),palette.stone);
      m.position.copy(world(u,v,groundHeight(u,v)+h/2));m.rotation.y=-Math.atan2(b[1]-a[1],b[0]-a[0]);
    }
  }
  // A portal is an actual opening: side piers plus curved masonry above it.
  // Axis u runs east-west; axis v runs north-south.
  function arch(name,u,v,width,height,depth,base=0,axis='u',color=palette.stone) {
    const r=width/20, spring=height-r, thick=depth/10;
    const s=new THREE.Shape();s.moveTo(-r,height+.45);s.lineTo(r,height+.45);s.lineTo(r,spring);
    s.absarc(0,spring,r,0,Math.PI,false);s.lineTo(-r,height+.45);s.closePath();
    const g=new THREE.ExtrudeGeometry(s,{depth:thick,bevelEnabled:false,curveSegments:12});g.translate(0,0,-thick/2);
    const m=mesh(g,material(color),group,name+' arch');m.position.copy(world(u,v,base));if(axis==='v')m.rotation.y=Math.PI/2;
    for(const sign of [-1,1]) {
      const x=axis==='u'?u+sign*(width/2+3):u, z=axis==='v'?v+sign*(width/2+3):v;
      box(x-(axis==='u'?3:depth/2),z-(axis==='u'?depth/2:3),axis==='u'?6:depth,axis==='u'?depth:6,height+.45,base,color,group,name+' pier');
    }
    openings.push({name,u,v,width,height,base,axis});
  }
  function wallWindow(name,u,v,length,height,openingStart,openingWidth,sill,openingHeight,base=0,axis='u',color=palette.stone) {
    const segment=(start,len,b,h)=>{if(len<=0||h<=0)return;return box(u+(axis==='u'?start:0),v+(axis==='v'?start:0),axis==='u'?len:4,axis==='u'?4:len,h,b,color,group,name)};
    segment(0,openingStart,base,height);segment(openingStart+openingWidth,length-openingStart-openingWidth,base,height);
    segment(openingStart,openingWidth,base,sill);segment(openingStart,openingWidth,base+sill+openingHeight,height-sill-openingHeight);
    openings.push({name,u:u+(axis==='u'?openingStart+openingWidth/2:2),v:v+(axis==='v'?openingStart+openingWidth/2:2),width:openingWidth,height:openingHeight,base:base+sill,axis});
  }
  function steps(name,u,v,w,d,count,from,to,axis='v') {
    for(let i=0;i<count;i++) {const h=from+(to-from)*(i+.5)/count, floor=-2.15;
      box(u+(axis==='u'?w*i/count:0),v+(axis==='v'?d*i/count:0),axis==='u'?w/count:w,axis==='v'?d/count:d,h-floor,floor,palette.light,floors,name);
    }
  }
  function roofRect(u,v,w,d,y,color=palette.stone,name='Roof') {return box(u,v,w,d,.25,y,color,roofs,name)}
  function beam(u1,v1,y1,u2,v2,y2,r=.1,color=palette.wood,parent=group) {
    const a=world(u1,v1,y1),b=world(u2,v2,y2),delta=b.clone().sub(a);
    const m=mesh(new THREE.CylinderGeometry(r,r,delta.length(),6),material(color),parent,'Timber beam');m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return m;
  }
  function crate(name,u,v,w,d,h,base=0,angle=0) {
    const parent=new THREE.Group();parent.name=name;parent.position.copy(world(u+w/2,v+d/2,base));parent.rotation.y=angle;group.add(parent);
    const body=mesh(new THREE.BoxGeometry(w/10,h,d/10),material(palette.box),parent);body.position.y=h/2;
    for(const y of [.12,h-.13]) {const m=mesh(new THREE.BoxGeometry(w/10+.06,.09,d/10+.06),material(palette.wood),parent);m.position.y=y}
    for(const x of [-w/35,w/35]){const m=mesh(new THREE.BoxGeometry(.07,h+.04,d/10+.08),material(palette.metal),parent);m.position.set(x,h/2,0)}
    return parent;
  }
  function canisters(name,u,v,cols,rows,base=0,axis='u') {
    const parent=new THREE.Group();parent.name=name;parent.position.copy(world(u,v,base));group.add(parent);if(axis==='v')parent.rotation.y=Math.PI/2;
    for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
      const m=mesh(new THREE.CylinderGeometry(.32,.32,1.7,12),material(0xa4a58b),parent,'Horizontal canister');m.rotation.x=Math.PI/2;m.position.set((col-(cols-1)/2)*.7,.38+row*.7,0);
    }
    for(const x of [-cols*.37,cols*.37]){const p=mesh(new THREE.BoxGeometry(.13,rows*.7+.1,1.8),material(palette.metal),parent);p.position.set(x,rows*.35,0)}
  }

  // B: two distinct arches, central column, open shelter and apartments.
  arch('B short north',346,250,40,3.6,7,0,'v');
  arch('B short south',346,303,40,3.6,7,0,'v');
  beam(346,224,4.25,346,329,4.25,.1);
  for(const [u,v] of [[199,249],[269,249],[199,327],[269,327]])box(u-2,v-2,4,4,3.65,0,palette.light);
  for(const v of [249,287,327])beam(198,v,3.75,273,v,3.75,.13);
  for(const u of [199,269])beam(u,248,3.75,u,330,3.75,.13);
  // Lightweight cloth remains identifiable in cutaway mode, with an open strip
  // in the middle so the destination and cover beneath it remain visible.
  for(const [u,w] of [[197,20],[253,20]])box(u,246,w,84,.06,3.85,palette.green,group,'B shelter cloth edge');
  roofRect(217,246,36,84,3.85,palette.green,'B shelter canopy');
  crate('B site wooden cover',210,253,23,17,1.45);
  canisters('B stacked cylinders',260,309,2,3,0,'v');
  crate('B bench cover',158,286,10,21,.9);
  crate('Short boxes',449,326,24,20,1.8);
  // White van under the apartments exit.
  const van=box(162,184,34,21,1.35,0,0xd6d4bf,group,'B white van');van.rotation.y=-.15;
  box(166,186,21,18,.85,1.35,0xe0deca);box(182,185,7,20,.48,1.5,palette.blue);
  for(const u of [169,187])for(const v of [184,204]){const wheel=mesh(new THREE.CylinderGeometry(.36,.36,.2,12),material(0x343638));wheel.rotation.x=Math.PI/2;wheel.position.copy(world(u,v,.35))}

  for(const f of plan.upperFloors.filter(f=>f.name.startsWith('B')))slab(f,2.75,.35,palette.light,floors,f.name);
  box(224,162,120,4,2.65,3.1);box(344,171,99,4,2.65,3.1);
  wallWindow('B apartments balcony opening',224,208,120,2.65,8,54,0,2.3,3.1,'u');
  box(345,207,57,4,2.65,3.1);box(402,210,4,43,2.65,3.1);
  box(446,270,174,4,2.65,3.1);box(447,211,103,4,2.65,3.1);
  box(548,158,4,55,2.65,3.1);box(551,155,69,4,2.65,3.1);
  box(617,160,4,108,2.65,3.1);
  roofRect(224,163,219,49,5.8,palette.light,'B apartments roof');roofRect(442,214,177,56,5.8,palette.light,'B hall roof');
  steps('Back alley to apartments',574,163,42,48,9,0,3.1);
  // Market north facade: independent door and raised window.
  wallWindow('Market door',188,394,36,3.5,8,19,0,2.65,0,'u',palette.blue);
  wallWindow('Market window',224,394,52,3.5,3,30,1,1.85,0,'u',palette.blue);
  roofRect(168,398,165,88,3.7,palette.blue,'Market roof');
  for(const u of [174,304])box(u,430,7,44,1.65,0,0x9d9c8a,group,'Market shelves');

  // Mid: lower lane, elevated short bridge, underpass and a real VIP opening.
  slab({shell:[[427,320],[456,320],[456,410],[474,430],[650,430],[650,443],[448,443],[427,420]]},-.12,.32,palette.light,floors,'Continuous short walkway');
  box(451,346,3,66,.8,.2);box(467,440,168,3,.6,.2);
  slab({shell:[[429,269],[450,269],[450,417],[439,437],[427,437],[427,417]]},-2.4,.2,palette.dark,floors,'Underpass lower floor');
  arch('Underpass exit',438,414,25,2.05,6,-2.2);
  wallWindow('VIP window',422,432,149,4.5,18,44,1.6,1.7,-1.6,'v',palette.blue);
  slab({shell:[[392,433],[421,433],[421,581],[389,581],[389,516]]},-.1,.3,palette.light,floors,'VIP room floor');
  roofRect(389,432,36,151,3.3,palette.blue,'VIP roof');
  box(396,475,13,12,.85,.2,palette.wood,group,'VIP interior box');
  steps('Connector stairs',484,511,43,82,12,-1.6,0);
  arch('Connector mid entrance',506,508,37,3.45,7,-1.6);
  arch('Connector A exit',511,596,42,3.1,7,0);
  box(478,517,4,75,3.8,-.7);box(529,519,4,73,3.8,-.7);
  roofRect(481,516,49,78,3.15,palette.wood,'Connector timber ceiling');
  for(const v of [532,554,576])beam(480,v,3.1,533,v,3.1,.12,palette.wood,roofs);
  crate('Top mid stacked boxes',699,451,21,21,1.65,0,.75);crate('Top mid cover',702,477,16,17,.85);

  // A: courtyard crates, separate ticket booth, ramp and Palace timber balcony.
  steps('A stairs',548,629,23,40,8,2.35,0);
  box(539,617,37,13,2.35,0,palette.light,group,'Stairs landing');
  arch('Jungle opening',480,625,32,3.1,5,0,'v');
  arch('A ramp exit',714,668,37,3.1,6,0,'v');
  wallWindow('Ticket booth',447,798,64,3.55,20,24,0,2.6,-1.5,'v');
  roofRect(423,798,27,52,2.15,palette.light,'Ticket booth roof');
  crate('A triple wooden crates',503,747,23,19,1.7,0,.5);
  crate('A default cover',531,742,15,13,.92);
  canisters('A triple cylinders',584,772,2,4,0,'v');
  crate('A default bomb crate',555,789,20,15,1.12,0,.4);
  crate('Tetris lower',600,641,27,18,.85);crate('Tetris upper',613,624,21,15,1.8);
  crate('Firebox',581,812,19,13,1.6,0,.5);
  for(const f of plan.upperFloors.filter(f=>f.name==='Palace'))slab(f,2.7,.3,palette.light,floors,'Palace floor');
  box(700,728,131,4,3.8,3);box(648,817,213,4,3.8,3);
  box(859,738,4,80,3.8,3);box(824,600,4,131,3.8,3);box(800,584,81,4,3.8,3);
  // Pillars correspond to the three dark column footprints on the radar.
  for(const u of [731,768,806]){box(u-4,774,8,8,3.8,3,palette.light,group,'Palace column');box(u-6,772,12,12,.2,6.65,palette.light)}
  wallWindow('Palace exit',666,776,46,3.8,3,32,0,3.2,3,'v');
  roofRect(697,731,165,89,6.85,palette.light,'Palace main roof');roofRect(803,589,26,145,6.85,palette.light,'Palace corridor roof');
  // Outside wooden balcony / scaffolding, with air beneath instead of solid fill.
  for(let i=0;i<9;i++)box(640,715+i*7,40,6.6,.18,2.82,palette.wood,floors,'Palace balcony plank');
  for(const u of [643,676])for(const v of [718,773])beam(u,v,0,u,v,2.86,.11);
  beam(643,718,.15,676,718,2.8,.08);beam(643,774,2.8,676,774,.15,.08);
  crate('Under palace box',647,754,18,15,1.2);
  // A site marking is a thin inset strip on the actual courtyard floor.
  const siteLine=new THREE.Line(new THREE.BufferGeometry().setFromPoints([[522,756],[577,756],[594,796],[523,811],[522,756]].map(([u,v])=>world(u,v,.035))),new THREE.LineBasicMaterial({color:0xd87936}));group.add(siteLine);

  group.userData.openings=openings;
  return {group,roofs,floors,openings};
}

// Static masonry is authored as named parts for checking, then batched by
// material for the viewer. Keep the removable roofs as their own batch.
export function batchArchitecture(architecture) {
  const {group,roofs}=architecture;
  group.updateMatrixWorld(true);
  function batch(parent,exclude=null) {
    const buckets=new Map(),originals=[];
    parent.traverse(o=>{
      if(!o.isMesh)return;
      for(let p=o;p;p=p.parent)if(p===exclude)return;
      const geometry=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();
      geometry.applyMatrix4(o.matrixWorld);
      const key=o.material.uuid;
      if(!buckets.has(key))buckets.set(key,{material:o.material,geometries:[]});
      buckets.get(key).geometries.push(geometry);originals.push(o);
    });
    for(const {material,geometries} of buckets.values()) {
      const count=geometries.reduce((n,g)=>n+g.attributes.position.array.length,0),positions=new Float32Array(count),normals=new Float32Array(count);
      let offset=0;
      for(const g of geometries){positions.set(g.attributes.position.array,offset);normals.set(g.attributes.normal.array,offset);offset+=g.attributes.position.array.length;g.dispose()}
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(positions,3));g.setAttribute('normal',new THREE.BufferAttribute(normals,3));
      g.computeBoundingSphere();const m=new THREE.Mesh(g,material);m.name='Static '+material.color.getHexString();m.castShadow=true;m.receiveShadow=true;parent.add(m);
    }
    for(const o of originals){o.removeFromParent();o.geometry.dispose()}
  }
  batch(group,roofs);batch(roofs);
  return architecture;
}
