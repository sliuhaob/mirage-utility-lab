import {utilities as mirageUtilities} from './data.js?v=2';
import {nukeUtilities} from './nuke-data.js?v=2';
import {ancientUtilities} from './ancient-data.js?v=2';
import {dust2Utilities} from './dust2-data.js?v=2';
import {infernoUtilities} from './inferno-data.js?v=2';
import {anubisUtilities} from './anubis-data.js?v=2';

import {cacheUtilities} from './cache-data.js?v=1';

export const maps={
 mirage:{id:'mirage',name:'荒漠迷城',en:'MIRAGE',utilities:mirageUtilities,
  model:'./assets/mirage-native.glb?v=7',metadata:'./assets/mirage-native.json?v=7',
  radars:{upper:'./assets/mirage-radar.png'},center:[1.2,0,.4],gridHeight:-4.6,
  cut:{min:-3,max:12,default:3.6},zones:{A:'A 区',mid:'中路',B:'B 区'},
  reference:'https://www.youtube.com/watch?v=sbDpI3xn9tE',
  labels:[["A包点",552,790,0.5,"site-label"],["B包点",235,289,0.5,"site-label"],["中路",580,477,-1.5],["T出生点",899,366,0.5],["CT出生点",297,724,-1],["B二楼",341,186,3.2],["B后巷",512,230,1.2],["匪二楼",675,179,2],["B小道",545,411,0.8],["下水道",452,397,-3.4,"area-label lower-label"],["超市",262,455,0.4],["VIP",403,512,0.8],["拱门",513,566,0.8],["连接",433,623,0.8],["A1坡道",735,655,0.8],["A二楼",754,780,4.2],["警亭",441,833,0.5],["跳台",547,650,2.2,"area-label detail-label"],["匪跳台",637,642,1.4,"area-label detail-label"],["三明治",587,674,0.5,"area-label detail-label"],["长箱",521,766,1.3,"area-label detail-label"],["短箱",592,751,1.3,"area-label detail-label"],["A死点",610,819,0.5,"area-label detail-label"],["忍者位",558,827,0.5,"area-label detail-label"],["二楼下",647,779,0.3,"area-label detail-label"],["二楼出口",657,726,4.2,"area-label detail-label"],["匪口",744,408,0.6,"area-label detail-label"],["中远",687,455,0.5,"area-label detail-label"],["沙袋",708,487,0.7,"area-label detail-label"],["中路长椅",477,512,-1.2,"area-label detail-label"],["椅子位",584,529,-0.5,"area-label detail-label"],["VIP窗口",424,473,0.7,"area-label detail-label"],["狗洞",382,552,0.5,"area-label detail-label"],["小黑屋",416,367,0.8,"area-label detail-label"],["B小拱门",348,285,0.5,"area-label detail-label"],["B小死点",414,305,0.5,"area-label detail-label"],["厨房",423,263,2.4,"area-label detail-label"],["下水道楼梯",472,283,-1.2,"area-label detail-label"],["超市门",195,401,0.3,"area-label detail-label"],["超市窗口",266,404,0.5,"area-label detail-label"],["白车",187,211,0.7,"area-label detail-label"],["沙发",137,282,0.6,"area-label detail-label"],["B二楼阳台",247,207,3.2,"area-label detail-label"],["B空地",236,358,0.3,"area-label detail-label"],["匪后巷",789,238,1.2,"area-label detail-label"]]},
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
maps.cache={id:'cache',name:'死城之谜',en:'CACHE',utilities:cacheUtilities,
 model:'./assets/cache-native.glb?v=1',metadata:'./assets/cache-native.json?v=1',
 radars:{upper:'./assets/cache-radar.png'},center:[0,0,2],gridHeight:-5,defaultZoom:1.02,
 cut:{min:-2,max:18,default:5.4},zones:{A:'A 区',mid:'中路',B:'B 区'},
 reference:'https://www.cs2util.com/cache',
 labels:[['A',325,275,1.8,'site-label'],['B',354,831,.4,'site-label'],['T 出生点',903,596,.5],['CT 出生点',93,463,.5],['中 路',413,556,.5],['匪 中 / 车库',591,556,.5],['警 中',267,548,.5],['白 箱',356,527,1.2],['沙 袋',365,611,1.2],['A 小',329,460,1.7],['A 门',484,341,.6],['A 二楼',392,350,4.9],['蓝 门',436,201,1.9],['叉 车',415,322,1],['卡 车',213,418,1.5],['B 厅',549,740,.5],['B 门',446,743,.5],['阳光房',522,831,.5],['B 二楼',280,723,3.7],['B1 / 树房',181,735,.5],['管 道',447,642,1.5],['B 死点',387,843,.5]]};
export const getMap=id=>maps[id]||maps.mirage;
export const mapUtilities=(config,type,zone='all',level='upper',team='all')=>config.utilities.filter(s=>s.type===type&&(zone==='all'||s.zone===zone)&&(!config.levelBoundary||s.level===level)&&(team==='all'||s.team==='any'||s.team===team));
