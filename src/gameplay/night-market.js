/* ---------- night market ---------- */
function salesCap(){return Math.min(24,sellers().reduce((a,it)=>a+(it.t==='teahouse'?5:3),0)+Math.floor(ambience()/10));}
function salePrice(it){const a=ambience();return Math.max(1,Math.round(CATALOG[it.t].sells*(1+a/300)*(1+Math.max(0,S.regRep.vael)/200)*(1+S.stats.cha/200)));}
function marketCheck(){
 if(S.region!=='vael')return'The night market is held in Thorngate.';
 if(!sellers().length)return'Build a market stall or tea house on your plot first.';
 if(S.marketDay===S.day)return'You already held the market today. Open it again tomorrow.';
 return null;
}
function openMarket(){
 S.marketDay=S.day;S.salesToday=0;S.salesCap=salesCap();
 if(!HAS3D||!W3){
  let g=0;const sl=sellers();for(let i=0;i<S.salesCap;i++)g+=salePrice(sl[i%sl.length]);S.gold+=g;S.salesToday=S.salesCap;addReg('vael',Math.min(8,S.salesCap*.3));
  L(`You hold the night market. ${S.salesCap} travelers buy from you. +${g} gold.`,'gold');
 }else{ui.market={sold:0,gold:0};ui.journal=false;ui.build=false;L(`You open the night market. Up to ${S.salesCap} travelers may come tonight.`,'gold');}
}
function closeMarket(reason,inner){
 if(!ui.market)return;const m=ui.market;ui.market=null;if(W3)despawnCustomers();
 if(!inner)OUT=[];
 L(`The market closes${reason?` (${reason})`:''}. ${m.sold} sales, +${m.gold} gold.`,'gold');
 if(m.sold>=10&&!S.flags.bigMarket){S.flags.bigMarket=true;chron(`Held a night market with ${m.sold} sales.`);}
 if(!inner){flush();save();render();}
}
function dawnHook(){
 if(ui.market)closeMarket('the night ended',true);
 const a=ambience();
 if(a>=100){addFate(1);L(`Your lantern plot glows through the night. Ambience ${a}: Fate +1.`,'good');}
 if(a>=150)addReg('vael',2);
}

