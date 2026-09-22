// Coalesce UI changes into one frame. Keep running only while animation needs it.
export function createRenderScheduler(draw,{request=cb=>requestAnimationFrame(cb),cancel=id=>cancelAnimationFrame(id),visible=()=>!document.hidden}={}){
 let pending=null,disposed=false;
 function invalidate(){if(!disposed&&pending===null&&visible())pending=request(frame);}
 function frame(time){pending=null;if(disposed||!visible())return;if(draw(time))invalidate();}
 function pause(){if(pending!==null)cancel(pending);pending=null;}
 return {invalidate,pause,dispose(){disposed=true;pause();}};
}
