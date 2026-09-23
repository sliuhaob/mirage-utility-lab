const NS='http://www.w3.org/2000/svg';
let catalog;
const el=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
const svg=(tag,attrs)=>{const e=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);return e;};
export const spawnLabel=point=>(point.team==='ct'?'CT':'T')+' 出生点 · '+point.number+' 号（本站）';
export async function chooseSpawn(config,team,current){
 const dialog=el('dialog');dialog.className='spawn-dialog';dialog.setAttribute('aria-labelledby','spawn-title');
 const title=el('h2','选择具体出生点');title.id='spawn-title';
 const help=el('p',config.name+' · 选择编号，将此出生点设为投掷站位。本站编号不代表出生顺序，也可能与其他教程不同。');
 const controls=el('div');controls.className='spawn-controls';
 const sideLabel=el('label','出生阵营'),side=el('select');side.setAttribute('aria-label','出生阵营');side.append(new Option('匪方 T','t'),new Option('警方 CT','ct'));side.value=team==='ct'?'ct':'t';sideLabel.append(side);
 const extraLabel=el('label'),extra=el('input');extra.type='checkbox';extraLabel.className='spawn-extra';extraLabel.append(extra,document.createTextNode('显示备用出生点'));controls.append(sideLabel,extraLabel);
 const body=el('div');body.className='spawn-body';const image=svg('svg',{class:'spawn-map',role:'group','aria-label':'出生点编号地图',viewBox:'0 0 1024 1024'});
 const raster=svg('image',{x:0,y:0,width:1024,height:1024,href:config.radars.upper}),markers=svg('g',{});image.append(raster,markers);
 const panel=el('div'),selectLabel=el('label','出生位置'),select=el('select');select.setAttribute('aria-label','具体出生位置');selectLabel.append(select);
 const detail=el('p','正在读取游戏出生点…');detail.setAttribute('role','status');panel.append(selectLabel,detail);body.append(image,panel);
 const actions=el('div');actions.className='spawn-actions';const cancel=el('button','取消'),apply=el('button','使用此出生点');cancel.type=apply.type='button';apply.disabled=true;actions.append(cancel,apply);
 select.disabled=side.disabled=extra.disabled=true;
 dialog.append(title,help,controls,body,actions);document.body.append(dialog);dialog.showModal();title.tabIndex=-1;title.focus({preventScroll:true});
 let chosen=null,answer=null,items=[],closed=false;const controller=new AbortController();
 const result=new Promise(resolve=>dialog.addEventListener('close',()=>{closed=true;controller.abort();dialog.remove();resolve(answer);},{once:true}));
 cancel.onclick=()=>dialog.close();apply.onclick=()=>{if(chosen){answer=chosen;dialog.close();}};
 function choose(id){chosen=items.find(p=>p.id===id)||null;select.value=chosen?.id||'';apply.disabled=!chosen;detail.textContent=chosen?spawnLabel(chosen)+(chosen.primary?'':' · 备用')+'；游戏坐标 '+chosen.source.map(n=>n.toFixed(2)).join(' / ')+'。确认后填入对应阵营、站位及说明，落点保持不变。':'点击地图编号或从列表选择。';for(const marker of markers.children){const active=marker.dataset.spawnId===chosen?.id;marker.setAttribute('aria-pressed',String(active));marker.classList.toggle('selected',active);}}
 function render(){
  items=(catalog.maps[config.id]||[]).filter(p=>p.team===side.value&&(extra.checked||p.primary));chosen=null;apply.disabled=true;
  select.replaceChildren(new Option('请选择出生位置',''),...items.map(p=>new Option(spawnLabel(p)+(p.primary?'':' · 备用'),p.id)));markers.replaceChildren();
  if(!items.length){detail.textContent='这张地图暂无可选出生点。';return;}
  const xs=items.map(p=>p.position[0]*10+512),ys=items.map(p=>p.position[2]*10+512),cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2,size=Math.max(150,Math.max(...xs)-Math.min(...xs)+70,Math.max(...ys)-Math.min(...ys)+70);
  image.setAttribute('viewBox',`${cx-size/2} ${cy-size/2} ${size} ${size}`);
  for(const p of items){
   const x=p.position[0]*10+512,y=p.position[2]*10+512,g=svg('g',{class:'spawn-number',role:'button',tabindex:0,'aria-label':spawnLabel(p)+(p.primary?'':' · 备用'),'aria-pressed':'false','data-spawn-id':p.id,transform:`translate(${x} ${y})`});
   const circle=svg('circle',{r:7}),number=svg('text',{'text-anchor':'middle',dy:2.5});number.textContent=p.number;g.append(circle,number);markers.append(g);
   g.onclick=()=>choose(p.id);g.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(p.id);}};
  }
  choose('');
 }
 side.onchange=extra.onchange=render;select.onchange=()=>choose(select.value);
 try{
  if(!catalog){const response=await fetch('./assets/spawn-points.json?v=3',{signal:AbortSignal.any([controller.signal,AbortSignal.timeout(10000)])});if(!response.ok)throw Error('出生点读取失败');const data=await response.json();if(!data.maps?.[config.id]?.length)throw Error('出生点数据无效');catalog=data;}
  if(!closed){select.disabled=side.disabled=extra.disabled=false;extra.checked=(catalog.maps[config.id]||[]).some(p=>p.team===side.value&&!p.primary&&current&&p.position.every((n,i)=>Math.abs(n-current[i])<.00001));render();const match=items.find(p=>current&&p.position.every((n,i)=>Math.abs(n-current[i])<.00001));if(match)choose(match.id);}
 }catch(error){if(!closed){detail.textContent='出生点暂时无法读取，请关闭后重试。';select.disabled=side.disabled=extra.disabled=true;}}
 return result;
}
