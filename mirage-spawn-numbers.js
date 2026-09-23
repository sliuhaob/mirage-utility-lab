// Stable spawn entities: changing labels must never move existing lineups.
export const mirageTSpawns=[
 {
  "entityId": "2:60299",
  "number": 1,
  "position": [
   39.32,
   -0.159661,
   -9.9
  ]
 },
 {
  "entityId": "2:60303",
  "number": 2,
  "position": [
   39.32,
   -0.159661,
   -17.58
  ]
 },
 {
  "entityId": "2:60304",
  "number": 3,
  "position": [
   37.72,
   -0.159661,
   -16.62
  ]
 },
 {
  "entityId": "2:60305",
  "number": 4,
  "position": [
   37.72,
   -0.159661,
   -14.64
  ]
 },
 {
  "entityId": "2:60306",
  "number": 5,
  "position": [
   37.72,
   -0.097599,
   -12.72
  ]
 },
 {
  "entityId": "2:60307",
  "number": 6,
  "position": [
   37.72,
   -0.097046,
   -10.8
  ]
 },
 {
  "entityId": "2:60308",
  "number": 7,
  "position": [
   36.12,
   -0.097698,
   -11.82
  ]
 },
 {
  "entityId": "2:60309",
  "number": 8,
  "position": [
   36.12,
   -0.094084,
   -13.74
  ]
 },
 {
  "entityId": "2:60310",
  "number": 9,
  "position": [
   36.12,
   -0.096241,
   -15.66
  ]
 },
 {
  "entityId": "2:60311",
  "number": 10,
  "position": [
   36.12,
   -0.096987,
   -17.58
  ]
 }
];

export const nukeCtSpawns=[
 {
  "entityId": "2:47509",
  "number": 1,
  "position": [
   33.9,
   0.914565,
   -5.042857
  ]
 },
 {
  "entityId": "2:47511",
  "number": 2,
  "position": [
   34.585714,
   0.914565,
   -3.9
  ]
 },
 {
  "entityId": "2:47512",
  "number": 3,
  "position": [
   34.014286,
   0.914565,
   -2.757143
  ]
 },
 {
  "entityId": "2:47520",
  "number": 4,
  "position": [
   35.057143,
   0.914565,
   -5.042857
  ]
 },
 {
  "entityId": "2:47523",
  "number": 5,
  "position": [
   35.042857,
   0.914565,
   -2.757143
  ]
 }
];

export const nukeTSpawns=[
 {
  "entityId": "2:47457",
  "number": 1,
  "position": [
   -27.7,
   0.000247,
   4.685714
  ]
 },
 {
  "entityId": "2:47495",
  "number": 2,
  "position": [
   -29.685857,
   0.000247,
   3.830143
  ]
 },
 {
  "entityId": "2:47498",
  "number": 3,
  "position": [
   -29.685857,
   0.000247,
   5.787286
  ]
 },
 {
  "entityId": "2:47504",
  "number": 4,
  "position": [
   -28.7,
   0.000247,
   4.042857
  ]
 },
 {
  "entityId": "2:47505",
  "number": 5,
  "position": [
   -28.042857,
   0.000247,
   6.614286
  ]
 },
 {
  "entityId": "2:47506",
  "number": 6,
  "position": [
   -29.428571,
   0.000247,
   4.685714
  ]
 },
 {
  "entityId": "2:47507",
  "number": 7,
  "position": [
   -28.642857,
   0.000247,
   5.414286
  ]
 },
 {
  "entityId": "2:47508",
  "number": 8,
  "position": [
   -27.7,
   0.000247,
   5.6
  ]
 }
];

// Resolve generated station labels by coordinates so repeated reads are idempotent.
export function currentSpawnLabel(item){
 const label=/^(T|CT) 出生点 · \d+ 号（本站）$/.exec(item.from);
 const spawns=item.map==='mirage'&&label?.[1]==='T'?mirageTSpawns:item.map==='nuke'&&label?.[1]==='CT'?nukeCtSpawns:item.map==='nuke'&&label?.[1]==='T'?nukeTSpawns:null;
 if(!spawns||!Array.isArray(item.origin))return item;
 const point=spawns.find(p=>Math.abs(p.position[0]-item.origin[0])<.00001&&Math.abs(p.position[2]-item.origin[1])<.00001&&Math.abs(p.position[1]-item.originHeight)<.00001);
 return point?{...item,from:label[1]+' 出生点 · '+point.number+' 号（本站）'}:item;
}
