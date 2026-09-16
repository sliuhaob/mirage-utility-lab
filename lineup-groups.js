// Radar/world units: 2 units = 20 radar pixels. Keep nearby throws separate in data.
export const LANDING_DISTANCE=2,LANDING_HEIGHT=1.25;
export function nearbyLanding(a,b){
 return a.map===b.map&&a.type===b.type&&(a.level||'upper')===(b.level||'upper')&&
  (a.team===b.team||a.team==='any'||b.team==='any')&&
  Math.hypot(a.target[0]-b.target[0],a.target[1]-b.target[1])<=LANDING_DISTANCE&&
  Math.abs((a.targetHeight||0)-(b.targetHeight||0))<=LANDING_HEIGHT;
}
export function groupLineups(items){
 const groups=[];
 // Complete-link grouping prevents a chain of nearby points spanning a whole site.
 for(const item of [...items].sort((a,b)=>Number(!!b.builtinId)-Number(!!a.builtinId)||a.id.localeCompare(b.id))){
  let group=groups.find(g=>g.items.every(other=>nearbyLanding(item,other)));
  if(!group){group={id:item.id,items:[],target:[0,0]};groups.push(group);}
  group.items.push(item);
 }
 for(const g of groups)g.target=g.items.reduce((p,s)=>[p[0]+s.target[0]/g.items.length,p[1]+s.target[1]/g.items.length],[0,0]);
 return groups;
}
