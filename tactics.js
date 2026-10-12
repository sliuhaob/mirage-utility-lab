import {listTactics,saveTactic,deleteTactic,tacticEntry,tacticKey} from './tactics-store.js?v=1';
import {utilityTypes} from './utility-types.js';
import {localError} from './local-lineups.js?v=4';

export function setupTactics({maps,getContext,onMap,onActivate,getActive}){
 const $=s=>document.querySelector(s),dialog=$('#tactics-dialog');
 let books=[],editing=null,selected=new Map(),busy=false,dirty=false;
 const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
 const message=text=>{$('#tactics-message').textContent=text;};
 function button(text,fn){const b=el('button',text);b.type='button';b.onclick=()=>run(fn);return b;}
 async function run(fn){if(busy)return;busy=true;dialog.setAttribute('aria-busy','true');try{await fn();}catch(error){message(localError(error));}finally{busy=false;dialog.removeAttribute('aria-busy');}}
 function canLeave(){return !dirty||confirm('战术修改尚未保存，确定放弃吗？');}
 function close(){if(busy||!canLeave())return;dialog.close();}
 $('#tactics-close').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 function showLibrary(){
  editing=null;dirty=false;selected=new Map();$('#tactics-form').hidden=true;$('.tactics-library').hidden=false;
  message('');
 }
 function renderBooks(){
  $('#tactics-books').replaceChildren(...books.map(book=>{
   const row=el('article',undefined,'tactic-book');
   const active=getActive()?.id===book.id;row.classList.toggle('active',active);
   const view=button('',async()=>{if(!canLeave())return;await onActivate(book);dirty=false;dialog.close();});view.className='tactic-open';view.setAttribute('aria-pressed',String(active));
   view.append(el('strong',book.name),el('small',maps[book.map].name+' · '+book.entries.length+' 条道具'));row.append(view);
   const actions=el('div',undefined,'tactic-book-actions');actions.append(button('编辑',()=>edit(book)),button('删除',async()=>{
    if(editing?.id===book.id&&!canLeave())return;
    if(!confirm('删除战术“'+book.name+'”？道具教程和视频会保留。'))return;
    await deleteTactic(book);if(getActive()?.id===book.id)await onActivate(null);
    if(editing?.id===book.id)showLibrary();
    books=await listTactics();renderBooks();message('战术已删除');
   }));row.append(actions);return row;
  }));
  if(!books.length)$('#tactics-books').append(el('p','还没有保存的战术，点击右上角“新建战术”开始。','tactics-empty'));
 }
 function renderChoices(){
  const context=getContext(),query=$('#tactics-search').value.trim().toLowerCase(),type=$('#tactics-type').value,team=$('#tactics-team').value;
  const available=new Map(context.items.map(item=>[tacticKey(item),{...tacticEntry(item),local:!!item.local,level:item.level}]));
  const all=[...available.values(),...[...selected.values()].filter(e=>!available.has(e.key)).map(e=>({...e,missing:true}))];
  const shown=all.filter(e=>(!type||type===e.type)&&(!team||e.team===team||e.team==='any')&&(!query||[e.name,e.from].some(t=>t.toLowerCase().includes(query))));
  $('#tactics-choices').replaceChildren(...shown.map(entry=>{
   const row=el('label',undefined,'tactic-choice'),input=el('input');input.type='checkbox';input.checked=selected.has(entry.key);input.dataset.key=entry.key;
   input.onchange=()=>{if(busy){input.checked=selected.has(entry.key);return;}if(input.checked)selected.set(entry.key,entry);else selected.delete(entry.key);dirty=true;updateCount();if(entry.missing&&!input.checked)renderChoices();};
   const icon=el('span',undefined,'tactic-icon');icon.innerHTML=utilityTypes[entry.type].icon;icon.style.color=utilityTypes[entry.type].color;
   const info=el('span');info.append(el('strong',entry.name),el('small',({t:'匪方',ct:'警方',any:'通用'}[entry.team])+' · '+utilityTypes[entry.type].label+' · '+entry.from),el('small',(entry.missing?'暂未读取到此道具，保留选择后可稍后重试':entry.local?'本地道具':'公开教程')+(context.map==='nuke'&&entry.level?' · '+(entry.level==='lower'?'下层 B':'上层 A'):'')));
   row.append(input,icon,info);return row;
  }));
  if(!shown.length)$('#tactics-choices').append(el('p',context.ready?'没有符合条件的道具。':'正在读取地图教程…'));
  $('#tactics-load-note').textContent=context.error?'部分教程未能读取，已保存的选择会保留。关闭后可重试加载地图。':'';
  updateCount();
 }
 function updateCount(){$('#tactics-selected-count').textContent='已选择 '+selected.size+' 条道具';}
 async function edit(book=null){
  if(!canLeave())return;
  if(book&&book.map!==getContext().map)await onMap(book.map);
  editing=book;selected=new Map((book?.entries||[]).map(e=>[e.key,e]));dirty=false;
  $('#tactics-form').reset();$('.tactics-library').hidden=true;$('#tactics-form').hidden=false;
  $('#tactics-name').value=book?.name||'';$('#tactics-editor-title').textContent=(book?'编辑战术':'新建战术')+' · '+maps[getContext().map].name;
  message('');renderChoices();$('#tactics-choices').scrollTop=0;$('#tactics-name').focus();
 }
 $('#tactics-new').onclick=()=>run(()=>edit());
 $('#tactics-back').onclick=()=>run(()=>{if(!canLeave())return;showLibrary();renderBooks();$('#tactics-new').focus();});
 $('#tactics-search').oninput=renderChoices;$('#tactics-type').onchange=renderChoices;$('#tactics-team').onchange=renderChoices;
 $('#tactics-name').oninput=()=>{dirty=true;};
 $('#tactics-form').onsubmit=e=>{e.preventDefault();run(async()=>{
  $('#tactics-form').inert=true;
  try{
  const book=await saveTactic({id:editing?.id,revision:editing?.revision,name:$('#tactics-name').value,map:getContext().map,entries:[...selected.values()]});
  dirty=false;editing=book;await onActivate(book);dialog.close();
  }finally{$('#tactics-form').inert=false;}
 });};
 $('#tactics-entry').onclick=()=>{
  if(dialog.open)return;showLibrary();dialog.showModal();message('正在读取本地战术…');
  $('#tactics-books').replaceChildren();run(async()=>{books=await listTactics();renderBooks();message('');});
 };
 return {refresh(){if(dialog.open&&!$('#tactics-form').hidden)renderChoices();}};
}
