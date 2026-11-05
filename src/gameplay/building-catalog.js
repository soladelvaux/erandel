/* ---------- build catalog ---------- */
const CATALOG={
 boardwalk:{n:'Boardwalk',cost:{wood:2},amb:1,layer:'floor',where:'any',d:'A wooden deck. Build over the pond.'},
 stonepath:{n:'Stone path',cost:{stone:1},amb:1,layer:'floor',where:'land',d:'Flat stepping stones.'},
 lantern:{n:'Lantern post',cost:{gold:8,wood:1},amb:3,layer:'obj',where:'any',light:1,d:'A warm light on a post.'},
 shoji:{n:'Paper lantern',cost:{gold:15},amb:5,layer:'obj',where:'any',light:1.3,d:'A tall glowing paper lantern.'},
 toro:{n:'Stone lantern',cost:{stone:3},amb:4,layer:'obj',where:'any',light:.6,d:'An old stone lantern.'},
 garland:{n:'Light garland',cost:{gold:12},amb:4,layer:'obj',where:'any',light:.9,d:'String lights between two posts.'},
 torii:{n:'Torii gate',cost:{gold:50,wood:6},amb:12,layer:'obj',where:'any',size:[3,1],d:'A red gate for travelers.'},
 stall:{n:'Market stall',cost:{gold:70,wood:8},amb:6,layer:'obj',where:'any',size:[2,2],sells:5,light:1.1,d:'Sells to travelers at the night market.'},
 teahouse:{n:'Tea house',cost:{gold:140,wood:12,stone:4},amb:10,layer:'obj',where:'any',size:[2,2],sells:8,light:1.3,d:'Sells more, earns more.'},
 parasol:{n:'Parasol table',cost:{gold:20,wood:2},amb:4,layer:'obj',where:'any',d:'A paper parasol over a table.'},
 flowers:{n:'Flower bed',cost:{gold:6},amb:2,layer:'obj',where:'land',d:'A patch of night flowers.'},
 wisteria:{n:'Wisteria arch',cost:{gold:14,wood:1},amb:5,layer:'obj',where:'any',d:'Hanging purple blossoms.'},
 bamboo:{n:'Bamboo',cost:{gold:4},amb:2,layer:'obj',where:'land',d:'A cluster of bamboo.'},
 lily:{n:'Lily pads',cost:{gold:3},amb:2,layer:'obj',where:'water',d:'Lily pads and lotus.'},
 floatlantern:{n:'Floating lanterns',cost:{gold:6},amb:4,layer:'obj',where:'water',light:.5,d:'Small lanterns on the water.'},
 bench:{n:'Bench',cost:{wood:3},amb:2,layer:'obj',where:'any',d:'A place to rest.'},
 moonring:{n:'Moon ring',cost:{gold:40,stone:2},amb:8,layer:'obj',where:'any',light:.8,d:'A glowing spirit ring.'},
};
const STARTER=[['boardwalk',4,4],['boardwalk',5,4],['boardwalk',6,4],['boardwalk',7,4],['boardwalk',8,4],['boardwalk',9,4],['boardwalk',9,5],['boardwalk',9,3],
 ['stall',1,1],['lantern',0,4],['lantern',3,4],['lantern',3,0],['shoji',5,4],['toro',9,3],['moonring',7,4],['garland',0,6],['parasol',3,2],
 ['flowers',0,0],['flowers',0,1],['bamboo',13,0],['bamboo',0,9],['bamboo',12,9],
 ['floatlantern',7,6],['floatlantern',11,3],['floatlantern',11,6],['floatlantern',8,2],['lily',10,7],['lily',6,6],['lily',12,5],['lily',8,6]];
function itemSize(it){const C=CATALOG[it.t];const s=C.size||[1,1];return it.rot%2?[s[1],s[0]]:[s[0],s[1]];}
function footprint(it){const[w,d]=itemSize(it);const out=[];for(let i=0;i<w;i++)for(let j=0;j<d;j++)out.push([it.c+i,it.r+j]);return out;}
function occMap(){const m={};S.build.forEach(it=>{const L=CATALOG[it.t].layer;footprint(it).forEach(([c,r])=>{m[c+','+r+L]=it;});});return m;}
function canPlace(t,c,r,rot){
 const C=CATALOG[t];if(!C)return'Unknown item.';const o=occMap();
 for(const[cc,rr] of footprint({t,c,r,rot})){
  if(cc<0||rr<0||cc>=PLOT.cols||rr>=PLOT.rows)return'That does not fit on your plot.';
  if(o[cc+','+rr+C.layer])return'Something is already there.';
  const wet=tileWater(cc,rr);
  if(C.where==='water'){if(!wet)return'This goes on open water.';if(o[cc+','+rr+'floor'])return'This goes on open water, not on a deck.';}
  else if(C.where==='land'){if(wet)return'This needs dry land.';}
  else if(C.layer==='obj'&&wet&&!o[cc+','+rr+'floor'])return'Build a boardwalk over the water first.';
  if(C.layer==='floor'&&o[cc+','+rr+'obj']&&CATALOG[o[cc+','+rr+'obj'].t].where==='water')return'Clear the water first.';
 }
 return null;
}
function costText(cost){return Object.entries(cost).map(([k,v])=>`${v} ${k}`).join(' · ');}
function canAfford(cost){return(S.gold>=(cost.gold||0))&&(S.mat.wood>=(cost.wood||0))&&(S.mat.stone>=(cost.stone||0));}
function pay(cost,sign){S.gold-=(cost.gold||0)*sign;S.mat.wood-=(cost.wood||0)*sign;S.mat.stone-=(cost.stone||0)*sign;}
const AMB_DECAY=.8,COST_GROWTH=1.1;
/** Ambience: each extra copy of the same item counts AMB_DECAY times the previous copy. */
function ambience(){const n={};let a=0;S.build.forEach(it=>{const C=CATALOG[it.t];if(!C)return;const k=n[it.t]=(n[it.t]||0)+1;a+=C.amb*Math.pow(AMB_DECAY,k-1);});return Math.round(a);}
/** Cost of the next copy of an item: decorations grow by COST_GROWTH per copy already placed; floors never grow. */
function itemCost(t){const C=CATALOG[t];if(C.layer==='floor')return C.cost;const k=S.build.filter(i=>i.t===t).length;const f=Math.pow(COST_GROWTH,k);const o={};for(const r in C.cost)o[r]=Math.ceil(C.cost[r]*f);return o;}
function sellers(){return S.build.filter(it=>CATALOG[it.t]&&CATALOG[it.t].sells);}
function applyStarter(){STARTER.forEach(([t,c,r])=>{if(!canPlace(t,c,r,0))S.build.push({t,c,r,rot:0,id:'s'+c+'_'+r+t});});S.flags.starter=true;}
function buildPlace(t,c,r,rot){
 const C=CATALOG[t];const err=canPlace(t,c,r,rot);if(err)return err;
 const cost=itemCost(t);if(!canAfford(cost))return`You need ${costText(cost)}.`;
 pay(cost,1);const it={t,c,r,rot,id:Date.now().toString(36)+Math.floor(Math.random()*1e4)};S.build.push(it);
 if(W3)addItemMesh(it);save();return null;
}
function buildRemove(c,r){
 const o=occMap();const it=o[c+','+r+'obj']||o[c+','+r+'floor'];if(!it)return'Nothing to remove there.';
 if(CATALOG[it.t].layer==='floor'&&footprint(it).some(([cc,rr])=>o[cc+','+rr+'obj']))return'Remove what stands on the deck first.';
 S.build.splice(S.build.indexOf(it),1);const C=CATALOG[it.t];pay({gold:Math.floor((C.cost.gold||0)/2),wood:Math.floor((C.cost.wood||0)/2),stone:Math.floor((C.cost.stone||0)/2)},-1);
 if(W3)removeItemMesh(it);save();return null;
}

