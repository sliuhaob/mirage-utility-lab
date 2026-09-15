import {utilities as mirageUtilities} from './data.js';
import {nukeUtilities} from './nuke-data.js';
import {ancientUtilities} from './ancient-data.js';
import {dust2Utilities} from './dust2-data.js';
import {infernoUtilities} from './inferno-data.js';
import {anubisUtilities} from './anubis-data.js';

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
maps.ancient={id:'ancient',name:'远古遗迹',en:'ANCIENT',utilities:ancientUtilities,
 model:'./assets/ancient-native.glb?v=1',metadata:'./assets/ancient-native.json?v=1',
 radars:{upper:'./assets/ancient-radar.png'},center:[0,-1,0],gridHeight:-8.2,defaultZoom:1.1,
 cut:{min:-4,max:14,default:3.2},zones:{A:'A 区',mid:'中路',B:'B 区'},
 reference:'https://csnades.gg/ancient',
 labels:[['A',302,275,.1,'site-label'],['B',785,430,.6,'site-label'],['中 路',484,492,-.5],['T 出生点',511,882,-5],['CT 出生点',517,155,.8],['神庙',315,171,1],['A 大',175,457,-1],['A 外',283,675,-3],['甜甜圈',316,475,.8],['红房',478,277,1],['黑屋',631,543,-.5],['B 门',746,550,-1.5],['B 长廊',832,305,.6],['B 短廊',676,329,.5],['B 通道',669,594,-1],['匪口',817,726,-3]]};
maps.dust2={id:'dust2',name:'炙热沙城 II',en:'DUST II',utilities:dust2Utilities,
 model:'./assets/dust2-native.glb?v=1',metadata:'./assets/dust2-native.json?v=1',
 radars:{upper:'./assets/dust2-radar.png'},center:[0,0,0],gridHeight:-8.2,defaultZoom:.94,
 cut:{min:-4,max:16,default:4},zones:{A:'A 区',mid:'中路',B:'B 区'},
 reference:'https://www.cs2util.com/dust2',
 labels:[['A',820,172,3,'site-label'],['B',210,130,1.8,'site-label'],['中 路',465,557,-1],['T 出生点',390,921,2.6],['CT 出生点',600,207,-2],['A 大',903,425,.8],['A 门',727,605,1],['大坑',941,622,-1],['A 小',587,416,1.5],['A 平台',724,166,3],['鹅位',842,64,3.5],['中 门',465,352,-2],['Xbox',495,431,.8],['B1',353,417,-1.7],['B 洞',160,459,1],['B 门',274,216,.8],['B 窗',270,120,2.2],['B 后平台',105,55,2.1],['匪家平台',253,817,3]]};
maps.inferno={id:'inferno',name:'炼狱小镇',en:'INFERNO',utilities:infernoUtilities,
 model:'./assets/inferno-native.glb?v=1',metadata:'./assets/inferno-native.json?v=1',
 radars:{upper:'./assets/inferno-radar.png'},center:[3,1,1],gridHeight:-5.5,defaultZoom:.97,
 cut:{min:-3,max:18,default:6.2},zones:{A:'A 区',mid:'中路',banana:'香蕉道',B:'B 区'},
 reference:'https://www.cs2util.com/inferno',
 labels:[["A",825,690,4,"site-label"],["B",490,225,4,"site-label"],["T 出生点",92,734,-0.5],["CT 出生点",898,367,3],["香蕉道",479,447,2.4],["中 路",554,669,2.5],["侧 道",539,817,2.7],["A 二楼",737,854,6],["大 坑",943,831,2.2],["小 坑",854,871,2.9],["锅炉房",672,728,3.6],["连 接",800,563,3.8],["A 短",777,784,3.7],["拱 门",795,503,3.8],["书 房",946,556,3.8],["摩 托",930,599,4],["教 堂",623,127,4.2],["棺 材",533,152,4.2],["木 板",511,366,3.4],["沙 袋",566,403,4],["B 死点",432,141,4.2],["警家长廊",759,345,3.6]]};
maps.anubis={id:'anubis',name:'阿努比斯',en:'ANUBIS',utilities:anubisUtilities,
 model:'./assets/anubis-native.glb?v=1',metadata:'./assets/anubis-native.json?v=1',
 radars:{upper:'./assets/anubis-radar.png'},center:[0,-1,7],gridHeight:-8,defaultZoom:1.1,
 cut:{min:-4,max:16,default:3.6},zones:{A:'A 区',mid:'中路',water:'水下',B:'B 区'},
 reference:'https://csnades.gg/anubis',
 labels:[['A',755,273,-2.8,'site-label'],['B',322,536,.7,'site-label'],['T 出生点',486,926,.4],['CT 出生点',433,236,.9],['中 路',585,424,.7],['中路桥',518,606,.7],['VIP',526,488,.7],['匪 中',507,709,1],['水 下',589,616,-2.7,'area-label lower-label'],['船 位',726,543,-2.4],['A 大',874,445,-2.2],['A 天堂',729,200,-.1],['A 平台',722,365,-1],['A 小',650,385,-.8],['喷 泉',890,261,-2.7],['黑 屋',405,620,-1.4],['B 门',222,574,.6],['B 一柱',300,577,.7],['B 死点',408,546,1.2],['B 连接',374,427,1.2],['B 后巷',287,402,.7],['B 外',273,661,.7],['遗 迹',356,802,.7],['侧 巷',650,781,.7]]};
export const getMap=id=>maps[id]||maps.mirage;
export const mapUtilities=(config,type,zone='all',level='upper')=>config.utilities.filter(s=>s.type===type&&(zone==='all'||s.zone===zone)&&(!config.levelBoundary||s.level===level));
