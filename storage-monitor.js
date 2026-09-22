import {api} from './community.js?v=2';

export const storageStatus={published:'已发布',draft:'草稿',archived:'已撤下',unlinked:'未关联教程',pending:'待清理',untracked:'无教程记录'};
export function formatBytes(value){
 if(!Number.isFinite(value)||value<0)return '—';
 if(value<1000)return value+' B';
 const index=Math.min(3,Math.floor(Math.log(value)/Math.log(1000)));
 return (value/1000**index).toFixed(2)+' '+['B','KB','MB','GB'][index];
}
export function storageSummary(items,referenceBytes){
 const unique=[...new Map(items.map(item=>[item.id,item])).values()],categories={};let bytes=0,nonStandardBytes=0;
 for(const item of unique){bytes+=item.size;if(item.storageClass!=='Standard')nonStandardBytes+=item.size;const group=categories[item.status]||={bytes:0,count:0};group.bytes+=item.size;group.count++;}
 const ratio=bytes/referenceBytes;
 return {bytes,count:unique.length,nonStandardBytes,categories,remaining:Math.max(0,referenceBytes-bytes),ratio,severity:ratio>=1?'exceeded':ratio>=.9?'danger':ratio>=.8?'warning':'normal'};
}
export function createStorageMonitor({onManageVideo}){
 const $=selector=>document.querySelector(selector),panel=$('#storage-panel');
 let active=false,controller=null,items=[],referenceBytes=10_000_000_000,page=0,timer=null,checkedAt=null;
 const text=(selector,value)=>{$(selector).textContent=value;};
 function render(){
  const stats=storageSummary(items,referenceBytes),percent=(stats.ratio*100).toFixed(2);
  text('#storage-used',formatBytes(stats.bytes));$('#storage-used').title=stats.bytes.toLocaleString()+' 字节';
  text('#storage-count',stats.count+' 个');text('#storage-remaining',formatBytes(stats.remaining));
  text('#storage-percent',percent+'% / 10 GB 容量参考线');$('#storage-progress').value=Math.min(100,stats.ratio*100);
  panel.dataset.severity=stats.nonStandardBytes&&stats.severity==='normal'?'warning':stats.severity;
  const notice={normal:'当前容量低于预警线。',warning:'已达到 80% 提醒线，请检查大文件与不再需要的视频。',danger:'已达到 90% 警告线，建议暂停新上传并清理存储。',exceeded:'当前容量已达到或超过 10 GB 参考线，请尽快检查存储和 Cloudflare 账单。'};
  text('#storage-alert',notice[stats.severity]+(stats.nonStandardBytes?' 有 '+formatBytes(stats.nonStandardBytes)+' 非 Standard 存储，不适用免费存储额度。':''));
  text('#storage-updated','上次完整扫描：'+new Date(checkedAt).toLocaleString('zh-CN'));
  $('#storage-categories').replaceChildren(...Object.entries(storageStatus).map(([id,name])=>{
   const card=document.createElement('div'),label=document.createElement('span'),value=document.createElement('strong'),group=stats.categories[id]||{count:0,bytes:0};label.textContent=name;value.textContent=`${group.count} 个 · ${formatBytes(group.bytes)}`;card.append(label,value);return card;
  }));
  renderRows();
 }
 function renderRows(){
  const kind=$('#storage-filter').value,term=$('#storage-search').value.trim().toLowerCase(),sort=$('#storage-sort').value;
  const filtered=items.filter(item=>(!kind||item.status===kind)&&(!term||[item.title,item.author,item.id].some(value=>value.toLowerCase().includes(term))));
  filtered.sort((a,b)=>sort==='small'?a.size-b.size:sort==='newest'?b.uploaded.localeCompare(a.uploaded):b.size-a.size);
  page=Math.min(page,Math.max(0,Math.ceil(filtered.length/50)-1));
  $('#storage-rows').replaceChildren(...filtered.slice(page*50,(page+1)*50).map(item=>{
   const row=document.createElement('tr');
   for(const value of [item.title||storageStatus[item.status],formatBytes(item.size),item.author||'—',storageStatus[item.status],new Date(item.uploaded).toLocaleString('zh-CN')]){const cell=document.createElement('td');cell.textContent=value;row.append(cell);}
   const id=document.createElement('small');id.textContent=item.id;row.firstChild.append(id);
   if(item.references>1){const count=document.createElement('small');count.textContent=item.references+' 条教程共用 · 仅计一次';row.firstChild.append(count);}
   const controls=document.createElement('td');
   if(item.references){const button=document.createElement('button');button.textContent='查看教程';button.onclick=()=>onManageVideo(item.id);controls.append(button);}else controls.textContent=item.status==='pending'?'打开教程库会重试清理':'计入占用';
   row.append(controls);return row;
  }));
  text('#storage-page',filtered.length?`${page+1} / ${Math.ceil(filtered.length/50)} 页 · ${filtered.length} 个文件`:'没有符合条件的文件');
  $('#storage-prev').disabled=page===0;$('#storage-next').disabled=(page+1)*50>=filtered.length;
 }
 async function refresh(){
  if(!active||controller)return;
  const scan=new AbortController();controller=scan;$('#storage-refresh').disabled=true;
  text('#storage-message','正在读取 R2 实际文件…');
  try{
   const collected=new Map(),seen=new Set();let cursor=null,result;
   do{
    result=await api('/admin/storage'+(cursor?'?cursor='+encodeURIComponent(cursor):''),{signal:scan.signal});
    for(const item of result.items)collected.set(item.id,item);
    text('#storage-message',`正在扫描，已读取 ${collected.size} 个文件；完成后更新总计…`);
    cursor=result.cursor;if(cursor&&seen.has(cursor))throw Error('分页读取异常，请重新刷新');seen.add(cursor);
   }while(cursor);
   if(!active||scan.signal.aborted)return;
   items=[...collected.values()];referenceBytes=result.referenceBytes;checkedAt=result.checkedAt;page=0;
   render();$('#storage-results').hidden=false;text('#storage-message','扫描完成。只读取文件信息，不下载视频。');
  }catch(error){if(!scan.signal.aborted)text('#storage-message',(checkedAt?'本次刷新失败，下面保留上次扫描结果。':'无法读取存储，未将失败结果当作 0。')+' '+(error instanceof TypeError?'请检查网络后重试。':error.message));}
  finally{if(controller===scan){controller=null;$('#storage-refresh').disabled=false;}}
 }
 $('#storage-refresh').onclick=refresh;
 for(const id of ['#storage-filter','#storage-sort'])$(id).onchange=()=>{page=0;renderRows();};
 $('#storage-search').oninput=()=>{page=0;renderRows();};
 $('#storage-prev').onclick=()=>{page--;renderRows();};$('#storage-next').onclick=()=>{page++;renderRows();};
 return {
  activate(){active=true;refresh();clearInterval(timer);timer=setInterval(()=>{if(!document.hidden)refresh();},300000);},
  deactivate(){active=false;controller?.abort();controller=null;clearInterval(timer);$('#storage-refresh').disabled=false;},
  clear(){this.deactivate();items=[];checkedAt=null;$('#storage-results').hidden=true;$('#storage-rows').replaceChildren();$('#storage-categories').replaceChildren();for(const id of ['#storage-used','#storage-count','#storage-remaining','#storage-percent','#storage-updated','#storage-alert'])text(id,'—');text('#storage-message','');}
 };
}
