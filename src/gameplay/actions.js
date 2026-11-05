/* ============ ACTIONS ============ */
const ACTS={
 train:{n:'Train',d:'Strength and Endurance. −4 HP',run(){hurt(4);L(`You train hard. ${gains([['str',2],['end',1]])}.`);}},
 explore:{n:'Explore',d:'Agility and Endurance. May find things',run(){
  const g=gains([['agi',2],['end',1]]);let extra='';
  if(Math.random()*100<20+S.fate*0.2){const r=ri(1,3);
   if(r===1){const gd=ri(10,25);S.gold+=gd;extra=` You find ${gd} gold in an old cache.`;}
   else if(r===2){extra=` You find healing herbs. +${heal(15)} HP.`;}
   else{extra=` You find an ancient carving. Mind +${f1(addStat('mnd',2))}.`;}}
  L(`You explore ${REG[S.region].name}. ${g}.${extra}`);}},
 study:{n:'Study',d:'Mind. Better in town and the Sanctum',run(){const b=['vael','sanctum'].includes(S.region)?3:2;L(`You study. ${gains([['mnd',b]])}.`);}},
 meditate:{n:'Meditate',d:'Spirit and Spirit affinity',run(){const g=gains([['spr',2]]);const a=addAff('spirit',2,{quiet:true});L(`You meditate. ${join(g,affText('spirit',a))}.`);}},
 socialize:{n:'Socialize',d:'Charm and local reputation',run(){const g=gains([['cha',2]]);addReg(S.region,2);addRep(npcHere(),2);L(`You spend time with the locals. ${g} · ${REG[S.region].name} reputation +2.`);}},
 hunt:{n:'Hunt',d:'Fight a local creature for gold',check:()=>S.hp<=10?'You are too badly hurt to fight. Rest or heal first.':null,run(bi){hunt(bi==null?undefined:+bi);}},
 rest:{n:'Rest',d:'Restore 25 HP',run(){L(`You rest. +${heal(25)} HP.`);}},
 work:{n:'Work',d:'Earn gold and job experience',check:()=>S.job?null:'Take up a job at the guild in Thorngate first.',run(){
  const J=JOBS[S.job];const before=jobRank();
  let gold=8+before.i*8+S.stats[J.s]*0.4;if(S.regRep[S.region]<=-40)gold/=2;gold=Math.round(gold);S.gold+=gold;
  const xp=J.el&&REG[S.region].els.includes(J.el)?4.5:3;S.jobXp+=xp;
  const g=gains([[J.s,1]]);const a=J.el?addAff(J.el,1,{quiet:true}):0;
  if(J.dark){addCorr(2);addFate(-1);}
  L(`You work as a ${J.n}. +${gold} gold · ${join(g,affText(J.el,a))}${J.dark?' · Corruption +2':''}${S.regRep[S.region]<=-40?' (locals pay you half)':''}.`);
  const after=jobRank();if(after.i>before.i){L(`You are now a ${after.n} ${J.n}.`,'gold');chron(`Became a ${after.n} ${J.n}.`);}
 }},
};
const SP={
 inn:{n:'Rest at the inn',d:'8 gold · +50 HP, cures sickness, burns and chills',gold:8,kind:'',run(){const c=cure(['sick','burned','chilled']);L(`A warm bed at Ysolde’s inn. +${heal(50)} HP${c.length?`. No longer ${c.join(', ')}`:''}.`);}},
 tonic:{n:'Buy a tonic',d:'15 gold · +25 HP, cures sickness and burns, takes no time',gold:15,cost:0,run(){const c=cure(['sick','burned']);L(`You drink a tonic. +${heal(25)} HP${c.length?`. No longer ${c.join(', ')}`:''}.`);}},
 seek:{n:'Look for a companion',d:'Meet a traveler of another kind. Some kinds clash',kind:'kind',run(){
  const rid=pick(Object.keys(RACES));const name=pick(COMP_NAMES);const c=compat(rid);
  S.cand={name,race:rid,compat:c.s,why:c.why};
  L(`You meet ${name}, a ${RACES[rid].sing}. Compatibility ${c.s}${c.why.length?`: ${c.why.join('; ')}`:''}.`);}},
 charm:{n:'Buy a fortune charm',d:'40 gold · Fate +3, once a day',gold:40,cost:0,check:()=>S.charmDay===S.day?'The charm seller has nothing more for you today.':null,run(){S.charmDay=S.day;addFate(3);L('You buy a fortune charm. Fate +3.','good');}},
 market:{n:'Open the night market',d:'Needs a stall or tea house. Travelers come to buy',kind:'kind',check:()=>marketCheck(),run(){openMarket();}},
 buywood:{n:'Buy timber',d:'10 gold \u00b7 +3 wood, takes no time',gold:10,cost:0,run(){S.mat.wood+=3;L('You buy timber. +3 wood.');}},
 buystone:{n:'Buy cut stone',d:'12 gold \u00b7 +3 stone, takes no time',gold:12,cost:0,run(){S.mat.stone+=3;L('You buy cut stone. +3 stone.');}},
 chop:{n:'Gather wood',d:'Strength and +3 wood',run(){const g=gains([['str',1]]);S.mat.wood+=3;L(`You gather fallen wood. +3 wood \u00b7 ${g}.`);}},
 quarry:{n:'Quarry stone',d:'Strength, Endurance, +3 stone',run(){const g=gains([['str',1],['end',1]]);S.mat.stone+=3;L(`You split stone from the pass. +3 stone \u00b7 ${g}.`);}},
 pearls:{n:'Dive for pearls',d:'Endurance, Agility, Water, gold',run(){const gd=ri(6,16);S.gold+=gd;const g=gains([['end',1],['agi',1]]);const a=addAff('water',3);L(`You dive the reef. +${gd} gold · ${join(g,affText('water',a))}.`);}},
 plant:{n:'Plant trees',d:'Fate, Spirit, Nature',kind:'kind',run(){addFate(2);addReg('greenmere',3);addRep('bramble',3);const g=gains([['spr',1]]);const a=addAff('nature',3);L(`You plant saplings. Fate +2 · ${join(g,affText('nature',a))}.`,'good');}},
 burn:{n:'Burn the woods',d:'Corruption +10, Fire. The forest remembers',kind:'dark',run(){addCorr(10);addFate(-4);addReg('greenmere',-20);addRep('bramble',-25);npcMem('bramble','burned the woods');const a=addAff('fire',4,{force:false});if(!S.flags.burned){S.flags.burned=true;chron('Set the woods of Erelian on fire.');}L(`Flames take the old trees. Corruption +10 · Fate −4${a?` · ${affText('fire',a)}`:''}.`,'dark');}},
 forge:{n:'Forge at the vents',d:'Strength, Fire, Magma',run(){const g=gains([['str',2]]);const a=addAff('fire',2,{quiet:true}),b=addAff('magma',2,{quiet:true});L(`You hammer metal over the vents. ${join(g,affText('fire',a),affText('magma',b))}.`);}},
 climb:{n:'Climb the peaks',d:'Agility, Endurance, Air. Climbers need rescue',run(){const g=gains([['agi',2],['end',1]]);const a=addAff('air',3);let x='';if(Math.random()<0.2){addFate(4);addRep('tovin',5);x=' You rescue a stranded climber. Fate +4.';if(!S.flags.rescue){S.flags.rescue=true;chron('Rescued a climber on Vetharn\u2019s Pass.');}}L(`You climb the wind-cut ridges. ${join(g,affText('air',a))}.${x}`);}},
 endure:{n:'Endure the cold',d:'Endurance +3, Ice. −4 HP',run(){hurt(4);const g=gains([['end',3]]);const a=addAff('ice',3);L(`You stand in the blizzard. ${join(g,affText('ice',a))}.`);}},
 mine:{n:'Mine ore',d:'Strength, Endurance, Earth, gold, stone',run(){const gd=ri(5,14);S.gold+=gd;const g=gains([['str',1],['end',1]]);const a=addAff('earth',3);S.mat.stone+=2;L(`You mine a seam of ore. +${gd} gold \u00b7 +2 stone \u00b7 ${join(g,affText('earth',a))}.`);}},
 honor:{n:'Honor the dead',d:'Spirit, Fate, Spirit affinity',kind:'kind',run(){addFate(2);addCorr(-2);const g=gains([['spr',2]]);const a=addAff('spirit',2);L(`You tend the graves. Fate +2 · ${join(g,affText('spirit',a))}.`,'good');}},
 rite:{n:'Perform a dark rite',d:'Corruption +8, Mind, Death',kind:'dark',run(){addCorr(8);addFate(-3);const g=gains([['mnd',1]]);const a=addAff('death',5);L(`You speak words that should stay buried. Corruption +8 · ${join(g,affText('death',a))}.`,'dark');}},
 pray:{n:'Pray at the altar',d:'Spirit, Light, Fate. Cleanses Corruption',kind:'kind',run(){addFate(2);addCorr(-3);const g=gains([['spr',2]]);const a=addAff('light',2);L(`You pray. Fate +2 · Corruption −3 · ${join(g,affText('light',a))}.`,'good');}},
 moonbathe:{n:'Moonbathe',d:'Spirit, Moon. Strongest at night',run(){const g=gains([['spr',1]]);const a=addAff('moon',3);L(`You bathe in moonlit water. ${join(g,affText('moon',a))}.`);}},
};

function compat(rid){
 const them=RACES[rid];let s=40;const why=[];
 if(isRival(S.race,rid)){s-=50;why.push(`${R().name} and ${them.name} are old enemies`);}
 if(R().group===them.group){s+=15;why.push('kindred kind');}
 if(S.home&&them.home&&S.home!==them.home){
  if(elemMult(them.home,S.home)>=1.5){s-=15;why.push(`their ${ELEM[them.home].name} overpowers your ${ELEM[S.home].name}`);}
  else if(FUSION[[S.home,them.home].sort().join('+')]){s+=15;why.push(`your ${ELEM[S.home].name} and their ${ELEM[them.home].name} fuse well`);}
 }
 const md=dietOf(S.race),td=dietOf(rid);
 if((md==='blood'||md==='carrion')&&td!==md){s-=10;why.push('they fear your hunger');}
 if(rid==='seraphs'&&S.corr>=25){s-=25;why.push('your Corruption repels them');}
 if(['demons','liches'].includes(rid)&&S.fate>=50){s-=15;why.push('your Fate unsettles them');}
 const ch=Math.round(S.stats.cha*0.5);s+=ch;why.push(`your Charm +${ch}`);
 return{s:clamp(Math.round(s),0,100),why};
}
function foodsHere(){return Object.entries(FOODS).filter(([k,f])=>(f.where==='*'||f.where.includes(S.region))&&(!f.when||f.when()));}
function actionDef(kind,arg){
 if(kind==='eat')return{cost:0,check:()=>{
  const f=FOODS[arg];if(!f||!foodsHere().some(([k])=>k===arg))return'That food is not available here right now.';
  if(dietOf(S.race)==='none')return`A ${R().sing} needs no food.`;
  if(f.gold&&S.gold<f.gold)return`You need ${f.gold} gold.`;
  return null;},run(){
  const f=FOODS[arg];if(f.gold)S.gold-=f.gold;
  const ok=DIETS[dietOf(S.race)].ok.includes(f.type);
  if(f.dark){addCorr(5);addFate(-3);}
  if(ok){
   const firstMeal=S.fedDay!==S.day;S.fedDay=S.day;const c=cure(['hungry']);
   if(firstMeal)addCond('fed',1);
   L(`You eat: ${f.n.toLowerCase()}. It suits you. +${heal(5)} HP${c.length?' · no longer hungry':''}${f.dark?' · Corruption +5':''}.`,f.dark?'dark':'good');
  }else{addCond('sick',2);L(`You eat: ${f.n.toLowerCase()}. Your ${R().sing} body rejects it.${f.dark?' Corruption +5.':''}`,'dark');}
 }};
 if(kind==='invite')return{cost:0,check:()=>!S.cand?'There is no one to invite.':S.cand.compat<35?`${S.cand.name} refuses to travel with a ${R().sing}.`:null,run(){
  const c=S.cand;
  if(S.comp)L(`${S.comp.name} parts ways with you.`,'mutl');
  S.comp={name:c.name,race:c.race,compat:c.compat,bond:30+Math.round(c.compat/5),sworn:false};S.cand=null;
  L(`${c.name} the ${RACES[c.race].sing} joins you. They fight beside you in hunts.`,'good');chron(`${c.name} the ${RACES[c.race].sing} joined you.`);
 }};
 if(kind==='decline')return{cost:0,check:()=>S.cand?null:'There is no one here.',run(){L(`You part ways with ${S.cand.name}.`,'mutl');S.cand=null;}};
 if(kind==='dismiss')return{cost:0,check:()=>S.comp?null:'You travel alone.',run(){L(`You part ways with ${S.comp.name}.`,'mutl');chron(`Parted ways with ${S.comp.name}.`);S.comp=null;}};
 if(ACTS[kind])return ACTS[kind];
 if(kind==='sp'){if(!REG[S.region].sp.includes(arg))return null;return SP[arg];}
 if(kind==='travel')return{cost:1,check:()=>!REG[arg]?'Choose a place.':arg===S.region?'You are already here.':null,run(){S.region=arg;L(`You travel to ${REG[arg].name}. Weather here: ${WEATHER[weatherHere()].name}.`);}};
 if(kind==='practice')return{check:()=>practicable().includes(arg)?null:'You cannot practice that element here.',run(){const a=addAff(arg,4);const g=gains([['mnd',1]]);L(`You practice ${ELEM[arg].name} magic. ${join(affText(arg,a),g)}.`);}};
 if(kind==='job')return{cost:0,check:()=>S.region!=='vael'?'Jobs are taken up at the guild in Thorngate.':!JOBS[arg]?'Choose a job.':arg===S.job?'You already work this job.':null,run(){S.job=arg;S.jobXp=0;L(`You join the guild as an Apprentice ${JOBS[arg].n}.`,'gold');}};
 if(kind==='help')return{check:()=>npcHere()!==arg?'They are not here.':S.npcs[arg].helped===S.day?`You already helped ${NPCS[arg].name} today.`:null,kind:'kind',run(){
  const N=NPCS[arg];const need=needOf(arg);S.npcs[arg].helped=S.day;
  addFate(5);addCorr(-1);addRep(arg,10);addReg(S.region,5);
  const g=gains([['cha',1],[N.stat,1]]);npcMem(arg,`you helped: ${need.toLowerCase()}`);
  L(`You help ${N.name}: ${need.toLowerCase()}. Fate +5 · ${g}.`,'good');
  const st=S.npcs[arg];
  if(st.rep>=60&&!st.gifted){st.gifted=true;S.stats[N.stat]+=4;const el=REG[S.region].els[0];const a=el?addAff(el,6,{quiet:true}):0;L(`${N.name} trusts you completely and teaches you a secret. ${SN[N.stat]} +4${a?` · ${affText(el,a)}`:''}.`,'evo');chron(`${N.name} became a devoted ally.`);}
 }};
 if(kind==='trade')return{check:()=>npcHere()!==arg?'They are not here.':S.npcs[arg].rep<-20||S.regRep[S.region]<=-40?`${NPCS[arg].name} refuses to trade with you.`:null,run(){
  const gold=Math.round(8+S.stats.cha*0.4+Math.max(0,S.npcs[arg].rep)*0.1);S.gold+=gold;addRep(arg,2);const g=gains([['cha',1]]);
  L(`You trade with ${NPCS[arg].name}. +${gold} gold · ${g}.`);}};
 if(kind==='steal')return{check:()=>npcHere()!==arg?'They are not here.':null,kind:'dark',run(){
  const N=NPCS[arg];const chance=Math.min(0.9,0.35+S.stats.agi*0.012);addCorr(6);addFate(-3);
  if(Math.random()<chance){const gd=ri(15,35);S.gold+=gd;L(`You steal from ${N.name} unseen. +${gd} gold · Corruption +6 · Fate −3.`,'dark');}
  else{addRep(arg,-30);addReg(S.region,-15);hurt(5);npcMem(arg,'caught you stealing');L(`${N.name} catches you stealing. Reputation falls · Corruption +6 · −5 HP.`,'dark');}
 }};
 if(kind==='forge')return{check:()=>{
  forgeState();
  if(!S.sources.includes(ui.fs))return'Choose a source you have unlocked.';
  if(!ui.fe1||S.aff[ui.fe1]<10)return'You need an element at Spark (10) or higher.';
  if(ui.fe2&&(ui.fe2===ui.fe1||S.aff[ui.fe2]<30||S.aff[ui.fe1]<30))return'Fusion needs two different elements at Flow (30).';
  if(S.spells.length>=6)return'Your spellbook holds 6 spells. Forget one first.';
  const k=codexKey({src:ui.fs,e1:ui.fe1,e2:ui.fe2||null,form:ui.ff});
  if(S.spells.some(s=>codexKey(s)===k))return'You already know that spell.';
  return null;},run(){
  const sp={src:ui.fs,e1:ui.fe1,e2:ui.fe2||null,form:ui.ff,name:''};
  const k=codexKey(sp);const typed=(ui.fname||'').trim().slice(0,28);
  addStat('mnd',1);
  if(CODEX[k]){sp.name=CODEX[k].name;sp.mine=CODEX[k].inventor===S.name;S.spells.push(sp);L(`You learn ${sp.name}, a spell first created by ${CODEX[k].inventor}.`,'gold');}
  else{sp.name=typed||autoName(sp.e1,sp.e2,sp.form);sp.mine=true;CODEX[k]={name:sp.name,inventor:S.name,day:S.day};saveCodex();S.spells.push(sp);
   L(`You invent a new spell: ${sp.name}. Your name is written as its creator.`,'evo');chron(`Invented the spell ${sp.name}.`);}
  ui.fname='';
 }};
 if(kind==='forget')return{cost:0,check:()=>S.spells[+arg]?null:'No such spell.',run(){const sp=S.spells.splice(+arg,1)[0];L(`You let ${sp.name} fade from memory.`,'mutl');}};
 return null;
}

function doAction(kind,arg){
 if(typeof W3!=='undefined'&&W3&&W3.player)W3.player.interactT=1.4; // animation only (docs/characters/character-system.md)
 if(!S)return;
 const def=actionDef(kind,arg);if(!def)return;
 const cost=def.cost===undefined?1:def.cost;
 if(cost>0&&energyLeft()<cost)return toast('You are too tired. Sleep until dawn to start a new day.');
 const err=def.check?def.check():null;if(err)return toast(err);
 if(def.gold){if(S.gold<def.gold)return toast(`You need ${def.gold} gold.`);S.gold-=def.gold;}
 OUT=[];SLOT=timeIdx();
 def.run(arg);
 if(cost>0){envEffects();S.used+=cost;}
 checkSources();
 flush();
 if(S.hp<=0)faint();
 S.hp=Math.min(S.hp,hpMax());
 save();render();
}
function hazards(rid,player){
 const r=RACES[rid],reg=REG[S.region],w=weatherHere(),W=WEATHER[w],out=[];
 const aff=e=>player?S.aff[e]:0;
 const home=player?S.home:r.home;
 if(reg.under&&!WATER_BREATH.includes(rid)&&aff('water')<30)out.push({n:8,t:'Cannot breathe underwater',fix:'Water affinity 30 grows gills'});
 if(r.group==='sea'&&!reg.els.includes('water')&&!['rain','storm'].includes(w))out.push({n:4,t:'Drying out away from water',fix:'Rain or storms keep you wet'});
 if(r.weak&&reg.els.includes(r.weak))out.push({n:6,t:`${ELEM[r.weak].name} here weakens a ${r.sing}`});
 else if(r.weak&&W.boost.includes(r.weak))out.push({n:4,t:`The ${W.name.toLowerCase()} saps a ${r.sing}`,cond:'sick',chance:0.15});
 if(S.region==='ember'&&!FIRE_SAFE.includes(rid)&&home!=='fire'&&home!=='magma'&&aff('fire')<30&&aff('magma')<30&&r.weak!=='fire')out.push({n:5,t:'The lava ground scorches',cond:'burned',chance:0.3,fix:'Fire or Magma affinity 30'});
 if(S.region==='frostfell'&&!COLD_SAFE.includes(rid)&&home!=='ice'&&aff('ice')<30&&!(player&&S.stats.end>=30)&&r.weak!=='ice')out.push({n:4,t:'The deep cold bites',cond:'chilled',chance:0.3,fix:'Ice affinity 30 or Endurance 30'});
 if(S.region==='skyreach'&&r.group!=='sky'&&aff('air')<30&&!(player&&S.stats.end>=25))out.push({n:3,t:'The thin air leaves you gasping',fix:'Air affinity 30 or Endurance 25'});
 if(S.region==='hollow'&&r.group!=='night'&&rid!=='liches'&&aff('death')<10&&aff('spirit')<10)out.push({n:2,t:'Grave miasma sickens the living',cond:'sick',chance:0.25,fix:'Death or Spirit affinity 10'});
 if(r.group==='night'&&timeIdx()<2&&isSunny())out.push({n:rid==='vampires'?8:4,t:rid==='vampires'?'Sunlight burns your skin':'Sunlight stings'});
 return out;
}
function envWarnings(){return hazards(S.race,true);}
function envEffects(){
 envWarnings().forEach(x=>{hurt(x.n);L(`${x.t}. −${x.n} HP.`,'dark');if(x.cond&&Math.random()<x.chance)addCond(x.cond,x.cond==='sick'?2:1);});
 Object.keys(S.cond).forEach(c=>{if(COND[c]&&COND[c].hp){hurt(COND[c].hp);L(`${COND[c].n}: −${COND[c].hp} HP.`,'dark');}});
 if(S.comp){const hz=hazards(S.comp.race,false);if(hz.length){S.comp.bond=clamp(S.comp.bond-2*hz.length,0,100);L(`${S.comp.name} suffers here: ${hz.map(x=>x.t.toLowerCase()).join(', ')}. Bond −${2*hz.length}.`,'mutl');}}
}
function faint(){
 const lost=Math.round(S.gold*0.3);S.gold-=lost;S.hp=1;S.region='vael';
 OUT=[];L(`You collapse. Strangers carry you back to Thorngate. You lost ${lost} gold.`,'dark');chron('Collapsed and was carried back to Thorngate.');S.pos={x:2,z:46};window.__teleport=true;
 dawn(true);flush();
}
function dawn(fromFaint){
 const top=Object.entries(S.dayGains).sort((a,b)=>b[1]-a[1])[0];
 const ate=S.fedDay===S.day;
 S.day++;S.used=0;S.dayGains={};S.weather=rollWeather();
 L(`Dawn · Day ${S.day} · ${WEATHER[weatherHere()].name}`,'dawn');
 const drift={str:'Your arms wake heavier with muscle.',agi:'Your steps feel lighter and quicker.',mnd:'Your thoughts run sharper this morning.',spr:'You wake calm, as if something listened to you.',cha:'People seem to smile back more easily.',end:'Your body shrugs off yesterday’s strain.'};
 if(!fromFaint)L(top?drift[top[0]]:'An uneventful night.','mutl');
 S.hp=Math.min(hpMax(),S.hp+30);
 delete S.cond.fed;
 ['sick','burned','chilled'].forEach(c=>{if(S.cond[c]){S.cond[c]--;if(S.cond[c]<=0){delete S.cond[c];L(`You are no longer ${COND[c].n.toLowerCase()}.`,'good');}}});
 if(dietOf(S.race)!=='none'&&!ate){
  if(!S.cond.hungry)L(`You went a day without food that suits you. ${COND.hungry.d}`,'dark');
  S.cond.hungry=1;S.hp=Math.max(1,S.hp-10);
 }
 if(S.comp){
  const c=S.comp,d=c.compat>=60?3:c.compat>=40?1:-3;c.bond=clamp(c.bond+d,0,100);
  if(c.bond<=0){L(`${c.name} the ${RACES[c.race].sing} has had enough and leaves you.`,'dark');chron(`${c.name} the ${RACES[c.race].sing} left your side.`);S.comp=null;}
  else if(c.bond>=80&&!c.sworn){c.sworn=true;L(`${c.name} swears to travel with you for good.`,'evo');chron(`${c.name} the ${RACES[c.race].sing} became a sworn companion.`);}
 }
 S.cand=null;
 conversions();
 tryEvolve();
 luckRoll();
 checkSources();
 if(typeof dawnHook==='function')dawnHook();
}
function sleep(){if(!S)return;OUT=[];SLOT=2;dawn(false);flush();save();render();}

