import {utilities as mirageUtilities} from './data.js';
import {nukeUtilities} from './nuke-data.js';

export const maps={
 mirage:{id:'mirage',name:'荒漠迷城',en:'MIRAGE',utilities:mirageUtilities,
  model:'./assets/mirage-native.glb?v=7',metadata:'./assets/mirage-native.json?v=7',
  radars:{upper:'./assets/mirage-radar.png'},center:[1.2,0,.4],gridHeight:-4.6,
  cut:{min:-3,max:12,default:3.6},zones:{A:'A 区',mid:'中路',B:'B 区'},
  reference:'https://www.youtube.com/watch?v=sbDpI3xn9tE',
  labels:[['A',552,785,.5,'site-label'],['B',235,289,.5,'site-label'],['中 路',580,477,-1.5],['T 出生点',899,366,.5],['CT 出生点',297,724,-1],['B 二楼',341,186,3.2],['B 后巷',660,175,1.2],['B 小',464,375,.8],['下水道',452,397,-3.4,'area-label lower-label'],['超市',262,455,.4],['VIP',403,512,.8],['拱门',513,571,.8],['A1',765,611,.8],['A2 / PALACE',754,780,4.2]]},
 nuke:{id:'nuke',name:'核子危机',en:'NUKE',utilities:nukeUtilities,
  model:'./assets/nuke-native.glb?v=1',metadata:'./assets/nuke-native.json?v=1',
  radars:{upper:'./assets/nuke-radar.png',lower:'./assets/nuke-lower-radar.png'},center:[7,0,1],gridHeight:-7.6,
  cut:{min:.4,max:16,default:3.2},levelBoundary:-1.12857,lowerCut:-3.6,defaultZoom:1.25,
  zones:{A:'A 区',outside:'外场',ramp:'铁板',B:'B 区'},
  reference:'https://csnades.gg/nuke',
  labels:[['A',590,515,.6,'site-label','upper'],['T 出生点',197,549,.8,'area-label','upper'],['CT 出生点',846,470,.8,'area-label','upper'],['外 场',635,718,.8,'area-label','upper'],['大仓',746,715,1,'area-label','upper'],['水塔',503,653,4.5,'area-label','upper'],['黄房',549,545,1,'area-label','upper'],['铁门',545,606,.8,'area-label','upper'],['正门',591,649,.8,'area-label','upper'],['三楼',650,472,4.8,'area-label','upper'],['大厅',480,559,1,'area-label','upper'],['铁 板',585,375,.3,'area-label','upper'],['奖杯室',520,474,1,'area-label','upper'],['B',586,569,-4.4,'site-label','lower'],['B 下坡',569,455,-3,'area-label','lower'],['双开门',644,516,-4,'area-label','lower'],['观察室',665,486,-3.4,'area-label','lower'],['活门',590,620,-4.4,'area-label','lower'],['K1 / SECRET',689,651,-3.2,'area-label','lower'],['通风管道',530,630,-4.2,'area-label','lower']]}
};
export const getMap=id=>maps[id]||maps.mirage;
export const mapUtilities=(config,type,zone='all',level='upper')=>config.utilities.filter(s=>s.type===type&&(zone==='all'||s.zone===zone)&&(!config.levelBoundary||s.level===level));
