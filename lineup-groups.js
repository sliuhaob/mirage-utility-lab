// Proximity only proposes a merge; a saved group key is required to display one.
export const LANDING_DISTANCE=2,LANDING_HEIGHT=1.25,ORIGIN_DISTANCE=.65,ORIGIN_HEIGHT=.35;
export const pointIdentity=item=>item.recordId||item.id;
export const pointGroupKey=(item,kind)=>item.pointGroups?.[kind]||'record:'+pointIdentity(item);
export function nearbyPoint(a,b,kind='target'){
 const pa=a[kind],pb=b[kind];
 return a.map===b.map&&(a.team===b.team||a.team==='any'||b.team==='any')&&
  (kind==='origin'||a.type===b.type&&(a.level||'upper')===(b.level||'upper'))&&
  Array.isArray(pa)&&Array.isArray(pb)&&Math.hypot(pa[0]-pb[0],pa[1]-pb[1])<=(kind==='origin'?ORIGIN_DISTANCE:LANDING_DISTANCE)&&
  Math.abs((a[kind+'Height']||0)-(b[kind+'Height']||0))<=(kind==='origin'?ORIGIN_HEIGHT:LANDING_HEIGHT);
}
export const nearbyLanding=(a,b)=>nearbyPoint(a,b,'target');
export function groupLineups(items,kind='target'){
 const groups=[];
 for(const item of [...items].sort((a,b)=>Number(!!b.builtinId)-Number(!!a.builtinId)||a.id.localeCompare(b.id))){
  const key=pointGroupKey(item,kind);
  let group=groups.find(g=>g.key===key&&g.items.every(other=>nearbyPoint(item,other,kind)));
  if(!group){group={id:item.id,key,kind,items:[],point:[0,0]};groups.push(group);}
  group.items.push(item);
 }
 for(const g of groups){g.point=g.items.reduce((p,s)=>[p[0]+s[kind][0]/g.items.length,p[1]+s[kind][1]/g.items.length],[0,0]);g.target=g.point;}
 return groups;
}
export function mergeCandidates(item,items,kind){
 const buckets=new Map();
 for(const other of items){if(pointIdentity(item)&&pointIdentity(item)===pointIdentity(other))continue;const key=pointGroupKey(other,kind);if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(other);}
 return [...buckets].filter(([,members])=>members.every(a=>nearbyPoint(item,a,kind)&&members.every(b=>nearbyPoint(a,b,kind)))).map(([key,members])=>({key,items:members,distance:Math.min(...members.map(s=>Math.hypot(item[kind][0]-s[kind][0],item[kind][1]-s[kind][1])))})).sort((a,b)=>a.distance-b.distance||a.key.localeCompare(b.key));
}
export function samePointDefinition(a,b,kind){
 return !!a&&a.map===b.map&&a.team===b.team&&(kind==='origin'||a.type===b.type&&(a.level||'upper')===(b.level||'upper'))&&a[kind+'Height']===b[kind+'Height']&&a[kind]?.every((n,i)=>n===b[kind]?.[i]);
}
// Compatibility for saves from an older editor: keep choices only if that point
// has not moved or changed scope. Otherwise give it a fresh, independent key.
export function savedPointGroups(data,previous){
 return Object.fromEntries(['target','origin'].map(kind=>[kind,data.pointGroups?.[kind]||(samePointDefinition(previous,data,kind)?pointGroupKey(previous,kind):'point:'+crypto.randomUUID())]));
}
