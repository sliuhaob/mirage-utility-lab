import {api} from './community.js?v=5';

export function createVisitAnalytics(){
 const $=s=>document.querySelector(s);let active=false,controller=null;
 const format=n=>Number(n).toLocaleString('zh-CN');
 const date=time=>new Date(time).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'});
 function clear(){active=false;controller?.abort();controller=null;$('#visits-results').hidden=true;$('#visits-message').textContent='';}
 async function refresh(){
  if(!active||controller)return;
  const request=new AbortController();controller=request;$('#visits-refresh').disabled=true;$('#visits-message').textContent='正在读取访问统计…';
  try{
   const data=await api('/admin/analytics',{signal:request.signal});if(!active||controller!==request)return;
   for(const [id,value] of [['today',data.today.views],['visitors',data.today.visitors],['week',data.weekViews],['month',data.monthViews]])$('#visits-'+id).textContent=format(value);
   $('#visits-updated').textContent='更新时间：'+date(data.updatedAt)+'（北京时间）';
   $('#visits-start').textContent=data.startedAt?'开始记录：'+date(data.startedAt)+'；此前没有历史数据。':'';
   const startedDay=data.startedAt?new Date(data.startedAt+8*3600000).toISOString().slice(0,10):'';
   const max=Math.max(1,...data.days.map(d=>d.views));
   $('#visits-chart').replaceChildren(...data.days.map(d=>{
    const bar=document.createElement('div'),fill=document.createElement('i'),label=document.createElement('span');
    bar.className='visit-bar';bar.title=d.day+(d.day<startedDay?'：尚未开始统计':'：'+d.views+' 次浏览，'+d.visitors+' 位当日访客');bar.setAttribute('aria-label',bar.title);
    fill.style.height=(d.views/max*100)+'%';label.textContent=d.day.slice(8);bar.append(fill,label);return bar;
   }));
   $('#visits-rows').replaceChildren(...[...data.days].reverse().map(d=>{const row=document.createElement('tr');for(const value of [d.day,d.day<startedDay?'—':format(d.views),d.day<startedDay?'—':format(d.visitors)]){const td=document.createElement('td');td.textContent=value;row.append(td);}return row;}));
   $('#visits-results').hidden=false;$('#visits-message').textContent=data.monthViews?'':'暂时没有访问记录。有人打开地图后，刷新即可查看。';
  }catch(e){if(!request.signal.aborted&&active){$('#visits-results').hidden=true;$('#visits-message').textContent=e.message||'统计加载失败，请重试';}}
  finally{if(controller===request){controller=null;$('#visits-refresh').disabled=false;}}
 }
 $('#visits-refresh').onclick=refresh;
 return {activate(){active=true;refresh();},deactivate(){active=false;controller?.abort();controller=null;$('#visits-refresh').disabled=false;},clear};
}
