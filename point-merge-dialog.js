import {mergeCandidates,pointGroupKey,samePointDefinition,pointIdentity} from './lineup-groups.js?v=2';
const names={target:'落点',origin:'站位'};
function el(tag,text){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;}
export function previousMergeChoice(previous,data,candidates,kind,options,{incomplete=false}={}){
 if(!previous)return null;
 const key=pointGroupKey(previous,kind),same=samePointDefinition(previous,data,kind);
 const peers=candidates.filter(item=>pointIdentity(item)!==pointIdentity(previous)&&pointGroupKey(item,kind)===key);
 const index=options.findIndex(group=>group.key===key);
 let text,value=null;
 if(peers.length){
  const item=peers[0],name=kind==='origin'?item.from:item.name;
  text='已保存选择：合并到「'+name+'」'+(peers.length>1?'等 '+peers.length+' 条教程':'');
  if(same&&index>=0)value=String(index);
  else if(same)text+='。原分组当前不满足合并条件，请重新选择。';
 }else if(incomplete){
  text='已保存选择：暂时无法确认，部分教程未能读取。';
 }else{
  text='已保存状态：当前独立显示（未找到其他同组教程）。';
  if(same)value='separate';
 }
 if(!same)text+=' '+names[kind]+'位置或适用范围已修改，请重新选择。';
 return {text,value};
}
// One dialog, two independent decisions. No merge option is preselected.
export async function confirmPointMerges(data,candidates,previous,{notice=''}={}){
 const options=Object.fromEntries(['target','origin'].map(kind=>[kind,mergeCandidates({...data,id:previous?.id,recordId:previous?.recordId},candidates,kind)]));
 const result=Object.fromEntries(['target','origin'].map(kind=>[kind,samePointDefinition(previous,data,kind)?pointGroupKey(previous,kind):'point:'+crypto.randomUUID()]));
 if(!Object.values(options).some(list=>list.length))return result;
 return new Promise(resolve=>{
  const dialog=el('dialog');dialog.className='merge-dialog';dialog.setAttribute('aria-labelledby','merge-title');
  const title=el('h2','确认点位合并');title.id='merge-title';dialog.append(title,el('p','发现相近点位，请分别选择。合并仅影响地图标志，精确坐标、投法和视频保持独立。'));
  if(notice)dialog.append(el('p',notice));
  const form=el('form'),required=[];
  for(const kind of ['target','origin']){
   const list=options[kind];if(!list.length)continue;required.push(kind);
   const field=el('fieldset');field.append(el('legend',names[kind]+'是否合并？'));
   const prior=previousMergeChoice(previous,data,candidates,kind,list,{incomplete:!!notice});
   if(prior){const summary=el('p',prior.text);summary.className='merge-previous';field.append(summary);}
   const add=(value,label,description)=>{const row=el('label');row.className='merge-choice';const radio=el('input');radio.type='radio';radio.name=kind;radio.value=value;radio.required=true;const copy=el('span');copy.append(el('strong',label),el('small',description));if(prior?.value===value){row.classList.add('merge-choice-previous');const badge=el('small','已保存的选项');badge.className='merge-previous-badge';copy.append(badge);}row.append(radio,copy);field.append(row);};
   add('separate','不合并，独立显示','保留单独的'+names[kind]+'标志');
   for(const [i,group] of list.entries()){
    const item=group.items[0],label=kind==='origin'?item.from:item.name;
    add(String(i),'合并到：'+label,`${group.items.length} 条教程 · 雷达间距 ${(group.distance*10).toFixed(1)} 像素 · ${item.local?'本地':item.author||item.sourceName||'已有教程'}${(kind==='origin'||group.items.length>1)?' · '+group.items.slice(0,3).map(s=>s.name).join('、'):''}`);
   }
   form.append(field);
  }
  const actions=el('div');actions.className='merge-actions';const cancel=el('button','取消保存'),submit=el('button','确认并保存');cancel.type='button';submit.type='submit';submit.disabled=true;actions.append(cancel,submit);form.append(actions);dialog.append(form);
  let answer=null;form.onchange=()=>{submit.disabled=!required.every(kind=>form.elements.namedItem(kind)?.value);};
  cancel.onclick=()=>dialog.close();dialog.addEventListener('close',()=>{dialog.remove();resolve(answer);},{once:true});
  form.onsubmit=event=>{event.preventDefault();if(!required.every(kind=>form.elements.namedItem(kind)?.value))return;for(const kind of required){const selected=form.elements.namedItem(kind).value;result[kind]=selected==='separate'?'point:'+crypto.randomUUID():options[kind][Number(selected)].key;}answer=result;dialog.close();};
  document.body.append(dialog);dialog.showModal();title.tabIndex=-1;title.focus({preventScroll:true});dialog.scrollTop=0;
 });
}
