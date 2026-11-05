/* ============ COMBAT ============ */
function hunt(bi){
 const reg=REG[S.region];const b=(bi!=null&&reg.beasts[bi])?reg.beasts[bi]:pick(reg.beasts);const sc=1+0.5*(S.tier-1);
 let ehp=Math.round(b.hp*sc);const eatk=b.atk*sc;
 const usable=S.spells.filter(spellUsable);
 const has=f=>usable.some(s=>s.form===f);
 const silent=S.spells.some(s=>s.src==='faith')&&!S.spells.filter(s=>s.src==='faith').some(spellUsable);
 const ward=has('ward'),weave=has('weave'),shape=has('shape'),enchant=has('enchant'),summon=has('summon');
 const phys=(4+S.stats.str*0.5+S.stats.agi*0.3)*(shape?1.3:1)*(enchant?1.2:1);
 const dmgSp=usable.filter(s=>DMG_FORMS.includes(s.form));
 const used={};let rounds=0;const startHp=S.hp;let best_m=1;
 while(ehp>0&&rounds<6&&S.hp>10){
  rounds++;
  let bestD=phys,bestSp=null;
  dmgSp.forEach(sp=>{const m=spellMult(sp,b.el);const exp=spellPower(sp)*m*FORMS[sp.form].dmg*(sp.form==='ritual'?0.5:1);if(exp>bestD){bestD=exp;bestSp=sp;}});
  let dealt;
  if(bestSp){
   const m=spellMult(bestSp,b.el);best_m=m;
   dealt=bestSp.form==='ritual'?(Math.random()<0.5?0:spellPower(bestSp)*m*1.6):spellPower(bestSp)*m*FORMS[bestSp.form].dmg*rnd(0.85,1.15);
   if(bestSp.src==='life')hurt(3);
   if(bestSp.src==='contract')addCorr(1);
   used[bestSp.name]=(used[bestSp.name]||0)+1;
  }else{dealt=phys*rnd(0.85,1.15);used['your weapon']=(used['your weapon']||0)+1;}
  if(S.comp){const ch=RACES[S.comp.race].home;dealt+=(5+S.tier*3+S.comp.bond*0.05)*(ch?elemMult(ch,b.el):1)*rnd(0.85,1.15);}
  ehp-=dealt;
  if(ehp<=0)break;
  const m2=b.el&&S.home?elemMult(b.el,S.home):1;
  const ed=Math.max(1,eatk*m2*(ward?0.6:1)*(summon?0.85:1)*rnd(0.8,1.2)-S.stats.end*0.2);
  hurt(ed);
 }
 const usedTxt=Object.entries(used).map(([n,c])=>`${esc(n)} ×${c}`).join(', ');
 const lost=Math.round(startHp-S.hp);
 const head=`Hunted a ${b.n}${b.el?` (${ELEM[b.el].name})`:''} using ${usedTxt}${S.comp?`, with ${S.comp.name} at your side`:''}.`;
 if(ehp<=0){
  const gold=Math.round(b.gold*sc*rnd(0.8,1.2));S.gold+=gold;S.bloodDay=S.day;
  if(S.comp)S.comp.bond=clamp(S.comp.bond+2,0,100);
  const g=gains([['str',1],['agi',1]]);
  const ag=[];dmgSp.filter(s=>used[s.name]).forEach(s=>{[s.e1,s.e2].filter(Boolean).forEach(e=>{const x=addAff(e,2,{quiet:true});if(x>0)ag.push(affText(e,x));});});
  let healed=0;if(weave)healed=heal(12);
  L(`${head} Victory${best_m>1.1?', super effective':''}. +${gold} gold, −${lost} HP${healed?`, then healed ${healed}`:''}. ${join(g,...ag)}.`,'good');
 }else if(S.hp<=10){L(`${head} You retreat, badly hurt. −${lost} HP.`,'dark');}
 else{L(`${head} It escapes after a long fight. −${lost} HP.`,'mutl');}
}


