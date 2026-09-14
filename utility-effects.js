import * as THREE from 'three';
import {utilityTypes} from './utility-types.js';

// Compact effect symbols communicate the utility type, not game physics.
export function createUtilityEffect(type){
 const group=new THREE.Group();group.name=type+' effect';
 const add=(geometry,color,opacity)=>{const m=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,side:THREE.DoubleSide}));group.add(m);return m;};
 const color=utilityTypes[type].color;
 if(type==='smoke'){
  for(let i=0;i<9;i++){const puff=add(new THREE.IcosahedronGeometry(1.55,2),'#c2cabe',.25);const a=i*2.4;puff.position.set(Math.cos(a)*(i?1.4:0),1+((i%3)*.6),Math.sin(a)*(i?1.4:0));}
 }else if(type==='molotov'){
  for(let i=0;i<9;i++){const a=i*2.4,x=Math.cos(a)*(i?1.45:0),z=Math.sin(a)*(i?1.45:0);const patch=add(new THREE.CircleGeometry(.95,18),color,.55);patch.rotation.x=-Math.PI/2;patch.position.set(x,.12+(i%2)*.03,z);const flame=add(new THREE.ConeGeometry(.32,.9+(i%3)*.25,5),'#ffc46a',.55);flame.position.set(x,.6,z);}
 }else{
  const core=add(new THREE.IcosahedronGeometry(type==='flash'?.7:1,1),color,.45);core.position.y=type==='he'?.7:0;
  const ring=add(new THREE.RingGeometry(1.9,2.1,40),color,.8);ring.rotation.x=-Math.PI/2;ring.position.y=.14;
  if(type==='flash')for(let i=0;i<6;i++){const ray=add(new THREE.ConeGeometry(.13,1.4,4),color,.75);const a=i*Math.PI/3;ray.position.set(Math.cos(a)*1.5,Math.sin(a)*1.5,0);ray.rotation.z=a-Math.PI/2;}
 }
 return group;
}
