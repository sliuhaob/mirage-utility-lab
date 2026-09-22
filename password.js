import {api} from './community.js?v=2';

export function setupPasswordChange({getUser,canOpen,onBusy}){
 const dialog=document.querySelector('#password-dialog'),form=document.querySelector('#password-form');
 const current=form.elements.currentPassword,next=form.elements.newPassword,confirm=form.elements.confirmPassword;
 const status=document.querySelector('#password-status'),submit=document.querySelector('#password-submit'),close=document.querySelector('#password-close');
 let busy=false;
 const message=(text,error=false)=>{status.textContent=text;status.classList.toggle('danger-message',error);};
 document.querySelector('#dev-password').onclick=()=>{
  if(!getUser()||!canOpen())return;
  form.reset();form.elements.username.value=getUser().username;message('');dialog.showModal();current.focus();
 };
 close.onclick=()=>{if(!busy)dialog.close();};
 dialog.addEventListener('cancel',event=>{if(busy)event.preventDefault();});
 dialog.addEventListener('close',()=>{form.reset();message('');});
 form.onsubmit=async event=>{
  event.preventDefault();if(busy)return;
  if(next.value!==confirm.value){message('两次输入的新密码不一致',true);confirm.focus();return;}
  if(next.value===current.value){message('新密码不能与当前密码相同',true);next.focus();return;}
  busy=true;onBusy(true);form.inert=true;submit.disabled=true;close.disabled=true;message('正在修改密码…');
  try{
   await api('/auth/password',{method:'POST',data:{currentPassword:current.value,newPassword:next.value}});
   form.reset();form.elements.username.value=getUser().username;
   message('密码已修改。当前设备保持登录，其他已登录设备已退出。');
  }catch(error){message(error instanceof TypeError?'网络异常，请重试；若修改已生效，请重新登录。':error.message,true);}
  finally{busy=false;onBusy(false);form.inert=false;submit.disabled=false;close.disabled=false;}
 };
}
