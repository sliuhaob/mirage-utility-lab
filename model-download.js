// Fetch is cancellable, unlike GLTFLoader.loadAsync. A settled result can safely
// start before the tutorial request, without an unhandled rejection on a fast switch.
export async function downloadModel(url,signal){
 try{const response=await fetch(url,{signal});if(!response.ok)throw Error('地图模型下载失败');return {buffer:await response.arrayBuffer()};}
 catch(error){return {error};}
}
