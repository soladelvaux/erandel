/* ============ LUCK ============ */
const GOOD_EVENTS=[
 {ok:()=>true,w:3,run:()=>{addStat('cha',3);L('Washed up at your feet: a singing shell. Its song stays with you. Charm +3.','good');}},
 {ok:()=>!S.pet,w:2,run:()=>{S.pet=pick(['Ember Fox','Storm Hawk','Moon Moth','Tide Otter','Shadow Cat','Thorn Hare']);L(`A ${S.pet} follows you home and stays. All gains +10%.`,'good');chron(`A ${S.pet} became your companion.`);}},
 {ok:()=>S.race==='humans'&&S.tier>=2&&!S.blood&&S.fate>=25,w:4,run:()=>{
   const b=S.corr>S.fate?'demon':pick(['fae','dragon','angel']);S.blood=b;S.extraSlot=true;
   const B=BLOOD[b];B.stats.forEach(k=>S.stats[k]+=3);addAff(B.el,15,{force:true,quiet:true});
   L(`Your hidden bloodline awakens: ${B.name} blood. ${ELEM[B.el].name} stirs in you and your soul gains room for a fourth element.`,'evo');
   chron(`Awakened a hidden ${B.name} bloodline.`);}},
 {ok:()=>!S.flags.relic,w:2,run:()=>{S.flags.relic=true;addStat('spr',4);const g=addAff('light',10,{quiet:true});L(`A cracked trinket you carried glows at dawn. It was a divine relic. ${join('Spirit +4',affText('light',g))}.`,'good');chron('Discovered a divine relic.');}},
 {ok:()=>true,w:3,run:()=>{S.gold+=40;L('You find a forgotten purse by the road. +40 gold.','good');}},
 {ok:()=>true,w:3,run:()=>{addStat('mnd',3);L('A dream shows you old lore. Mind +3.','good');}},
 {ok:()=>S.hp<hpMax(),w:2,run:()=>{S.hp=hpMax();L('You wake fully healed, as if blessed.','good');}},
];
const DARK_EVENTS=[
 {run:()=>{const g=addAff('shadow',5,{quiet:true});addCorr(3);L(`Whispers in the dark teach you something. ${join(affText('shadow',g),'Corruption +3')}.`,'dark');}},
 {run:()=>{S.gold+=40;addFate(-5);L('A cursed coin appears in your pocket. +40 gold, Fate −5.','dark');}},
 {run:()=>{S.hp=Math.max(1,S.hp-15);L('Nightmares. You wake drained. −15 HP.','dark');}},
];
function luckRoll(){
 if(Math.random()*100<8+S.fate*0.3){
  const list=GOOD_EVENTS.filter(e=>e.ok());const tot=list.reduce((a,e)=>a+e.w,0);let r=Math.random()*tot;
  for(const e of list){r-=e.w;if(r<=0){e.run();break;}}
 }
 if(Math.random()*100<S.corr*0.25)pick(DARK_EVENTS).run();
}

