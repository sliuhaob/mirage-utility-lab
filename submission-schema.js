export const submissionZones={mirage:['A','mid','B'],nuke:['A','outside','ramp','B'],ancient:['A','mid','B'],dust2:['A','mid','B'],inferno:['A','mid','banana','B'],anubis:['A','mid','water','B'],cache:['A','mid','B']};
export const MAX_VIDEO_BYTES=40*1024*1024;
export function validateSubmission(value){
 if(!value||typeof value!=='object')throw Error('教程内容不完整');
 const out={};
 for(const [key,max,required] of [['name',80,true],['from',120,true],['method',120,true],['description',600,false],['tip',600,false]]){
  if(typeof value[key]!=='string'||value[key].trim().length>max||(required&&!value[key].trim()))throw Error('请检查名称、站位或投掷说明');
  out[key]=value[key].trim();
 }
 if(!submissionZones[value.map]?.includes(value.zone))throw Error('请选择有效的地图和区域');
 if(!['t','ct','any'].includes(value.team)||!['smoke','flash','he','molotov'].includes(value.type))throw Error('请选择阵营和道具');
 Object.assign(out,{map:value.map,zone:value.zone,team:value.team,type:value.type,level:value.map==='nuke'?value.level:'upper'});
 if(!['upper','lower'].includes(out.level))throw Error('请选择楼层');
 for(const key of ['origin','target']){
  const p=value[key];if(!Array.isArray(p)||p.length!==2||!p.every(n=>Number.isFinite(n)&&Math.abs(n)<=60))throw Error('请在地图上选择站位和落点');
  const h=value[key+'Height'];if(!Number.isFinite(h)||h< -12||h>32)throw Error('选点高度无效');
  out[key]=p.map(n=>+n.toFixed(5));out[key+'Height']=+h.toFixed(5);
 }
 if(out.map==='nuke'&&(out.level!==(out.targetHeight< -1.12857?'lower':'upper')||(out.zone==='B')!==(out.level==='lower')))throw Error('请按落点所在楼层选择区域：下层落点请选择 B 区');
 if(!Array.isArray(value.steps)||!value.steps.length||value.steps.length>8||value.steps.some(s=>typeof s!=='string'||!s.trim()||s.length>400))throw Error('请填写 1～8 条投掷步骤');
 out.steps=value.steps.map(s=>s.trim());
 const allowed=['左键','右键','跳跃','蹲下','W','Shift'];
 if(!Array.isArray(value.keys)||value.keys.length>6||value.keys.some(k=>!allowed.includes(k)))throw Error('投掷按键无效');
 out.keys=[...new Set(value.keys)];out.en='COMMUNITY LINEUP';
 out.targetOffset=value.type==='flash'?2:0;
 if(value.pointGroups!==undefined){
  if(!value.pointGroups||typeof value.pointGroups!=='object'||Array.isArray(value.pointGroups)||Object.keys(value.pointGroups).some(k=>!['target','origin'].includes(k)))throw Error('点位合并设置无效');
  out.pointGroups={};
  for(const kind of ['target','origin']){const key=value.pointGroups[kind];if(key===undefined)continue;if(typeof key!=='string'||!/^(?:point:|record:(?:local-)?)[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(key))throw Error('点位合并设置无效');out.pointGroups[kind]=key;}
 }
 return out;
}
export const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
