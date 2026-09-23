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

// Resolve generated station labels by coordinates so repeated reads are idempotent.
export function currentSpawnLabel(item){
 if(item.map!=='mirage'||!/^T 出生点 · \d+ 号（本站）$/.test(item.from)||!Array.isArray(item.origin))return item;
 const point=mirageTSpawns.find(p=>Math.abs(p.position[0]-item.origin[0])<.00001&&Math.abs(p.position[2]-item.origin[1])<.00001&&Math.abs(p.position[1]-item.originHeight)<.00001);
 return point?{...item,from:'T 出生点 · '+point.number+' 号（本站）'}:item;
}
