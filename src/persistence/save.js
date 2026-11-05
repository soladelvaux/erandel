/* ============ SAVE ============ */
function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(S));}catch(e){}}
function saveCodex(){try{localStorage.setItem(CODEX_KEY,JSON.stringify(CODEX));}catch(e){}}
function loadSaved(){
 try{const c=JSON.parse(localStorage.getItem(CODEX_KEY)||'{}');if(c&&typeof c==='object')CODEX=c;}catch(e){}
 try{const s=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');if(valid(s))return s;}catch(e){}
 return null;
}
function valid(s){
 if(!(s&&s.v===1&&RACES[s.race]&&REG[s.region]&&s.stats&&s.aff&&Array.isArray(s.log)))return false;
 if(!s.cond||typeof s.cond!=='object')s.cond={};
 if(typeof s.fedDay!=='number')s.fedDay=s.day;
 if(typeof s.bloodDay!=='number')s.bloodDay=0;
 if(s.comp===undefined)s.comp=null;
 if(s.cand===undefined)s.cand=null;
 if(!s.mat||typeof s.mat!=='object')s.mat={wood:0,stone:0};if(!Array.isArray(s.build))s.build=[];['marketDay','salesToday','salesCap'].forEach(k=>{if(typeof s[k]!=='number')s[k]=0;});
 worldDefaults(s); // living-world state (docs/systems/living-world.md); old saves get defaults
 repairSave(s);
 return true;
}
/** Repairs a damaged or hand-edited save in place (production/qa/phase7-qa-report.md, C1): every
 * field the game reads gets the right type and a value the game knows, and good values are kept.
 * Without this, one bad field made every render throw, so the save broke the game on every visit.
 * Returns the list of repaired fields (empty for a healthy save).
 * Example: const s=JSON.parse(raw); if(valid(s)) S=s; // valid() calls repairSave(s) */
function repairSave(s){
 const fixed=[],r=RACES[s.race];
 const isObj=v=>!!v&&typeof v==='object'&&!Array.isArray(v),num=v=>typeof v==='number'&&isFinite(v);
 const fix=(k,ok,def)=>{if(!ok(s[k])){s[k]=typeof def==='function'?def():def;fixed.push(k);}};
 const int=(lo,hi)=>v=>num(v)&&v>=lo&&v<=hi&&Math.floor(v)===v;
 fix('name',v=>typeof v==='string'&&v.trim().length>0&&v.length<=24,'Wanderer');
 fix('legendName',v=>typeof v==='string','');
 fix('tier',int(1,4),1);
 fix('path',v=>v===null||int(0,r.paths.length-1)(v),null);
 if(s.tier>=2&&s.path===null){s.tier=1;fixed.push('tier');}
 fix('home',v=>v===null||v===undefined||!!ELEM[v],r.home||null);
 ['day','fedDay'].forEach(k=>fix(k,int(1,1e7),1));
 ['used','jobXp','charmDay','bloodDay','marketDay','salesToday','salesCap'].forEach(k=>fix(k,v=>num(v)&&v>=0&&v<1e9,0));
 ['fate','corr'].forEach(k=>fix(k,v=>num(v)&&v>=0&&v<=1e6,0));
 fix('gold',v=>num(v)&&v>=0&&v<1e9,0);
 fix('weather',v=>typeof v==='string'&&!!WEATHER[v],'clear');
 fix('job',v=>v===null||(typeof v==='string'&&!!JOBS[v]),null);
 fix('blood',v=>v===null||v===undefined||(typeof v==='string'&&!!BLOOD[v]),null);
 fix('pet',v=>v===null||v===undefined||(typeof v==='string'&&v.length<=40),null);
 fix('extraSlot',v=>typeof v==='boolean',false);
 fix('stats',isObj,{});STATS.forEach(k=>{if(!num(s.stats[k])||s.stats[k]<0||s.stats[k]>1e4){s.stats[k]=5+(r.bonus[k]||0);fixed.push('stats.'+k);}});
 fix('aff',isObj,{});ELS.forEach(e=>{if(!num(s.aff[e])){s.aff[e]=0;fixed.push('aff.'+e);}});
 fix('regRep',isObj,{});Object.keys(REG).forEach(id=>{if(!num(s.regRep[id])){s.regRep[id]=0;fixed.push('regRep.'+id);}});
 fix('npcs',isObj,{});Object.keys(NPCS).forEach(id=>{let n=s.npcs[id];if(!isObj(n)){n=s.npcs[id]={rep:0,mem:[],helped:0,gifted:false};fixed.push('npcs.'+id);}
  if(!num(n.rep))n.rep=0;if(!Array.isArray(n.mem))n.mem=[];if(!num(n.helped))n.helped=0;n.gifted=!!n.gifted;});
 ['flags','dayGains','cond'].forEach(k=>fix(k,isObj,{}));
 fix('mat',isObj,{});['wood','stone'].forEach(k=>{if(!num(s.mat[k])||s.mat[k]<0){s.mat[k]=0;fixed.push('mat.'+k);}});
 const arr=(k,keep)=>{fix(k,Array.isArray,[]);const n=s[k].length;s[k]=s[k].filter(keep);if(s[k].length!==n)fixed.push(k);};
 arr('traits',v=>typeof v==='string');
 arr('sources',v=>typeof v==='string'&&!!SRC[v]);if(!s.sources.length&&SRC[r.nat]){s.sources.push(r.nat);}
 arr('spells',v=>isObj(v)&&!!SRC[v.src]&&!!FORMS[v.form]&&!!ELEM[v.e1]&&(v.e2===null||v.e2===undefined||!!ELEM[v.e2])&&typeof v.name==='string');
 arr('log',v=>isObj(v)&&typeof v.t==='string');s.log.forEach(o=>{if(typeof o.cls!=='string')o.cls='';});
 arr('chron',v=>isObj(v)&&typeof v.t==='string');
 arr('build',v=>isObj(v)&&!!CATALOG[v.t]&&num(v.c)&&num(v.r));s.build.forEach(o=>{if(!num(o.rot))o.rot=0;if(typeof o.id!=='string')o.id='r'+o.c+'_'+o.r+o.t;});
 fix('comp',v=>v===null||(isObj(v)&&typeof v.name==='string'&&!!RACES[v.race]&&num(v.bond)&&num(v.compat)),null);
 fix('cand',v=>v===null||isObj(v),null);
 if(s.pos!==undefined&&!(isObj(s.pos)&&num(s.pos.x)&&num(s.pos.z))){delete s.pos;fixed.push('pos');}
 if(!num(s.hp)||s.hp<0){s.hp=Math.round(60+s.stats.end*2);fixed.push('hp');}
 if(fixed.length)console.warn('Erandel repaired a damaged save:',fixed.join(', '));
 return fixed;
}

function newChar(name,raceId){
 const r=RACES[raceId];
 const st={};STATS.forEach(k=>st[k]=5+(r.bonus[k]||0));
 const aff={};ELS.forEach(e=>aff[e]=0);if(r.home)aff[r.home]=12;
 const npcs={};Object.keys(NPCS).forEach(id=>npcs[id]={rep:0,mem:[],helped:0,gifted:false});
 const regRep={};Object.keys(REG).forEach(id=>regRep[id]=0);
 S={v:1,name,race:raceId,tier:1,path:null,legendName:'',home:r.home,stats:st,hp:0,day:1,used:0,weather:'clear',region:'vael',
  fate:raceId==='halflings'?15:0,corr:raceId==='liches'?15:raceId==='fallen'?10:0,gold:30,aff,traits:[],job:null,jobXp:0,
  spells:[],sources:[r.nat],npcs,regRep,log:[],chron:[],pet:null,blood:null,dayGains:{},flags:{},charmDay:0,extraSlot:false,
  cond:{},fedDay:1,bloodDay:0,comp:null,cand:null,mat:{wood:10,stone:4},build:[],marketDay:0,salesToday:0,salesCap:0};
 S.hp=hpMax();worldDefaults(S);
 if(DISTRUSTED.includes(raceId)){S.regRep.vael=-15;S.npcs.ysolde.rep=-10;}
 OUT=[];
 L(`Dawn · Day 1 · Clear`,'dawn');
 L(`You pass the Thorngate as a newly born ${r.sing}. Everything you do from here shapes what you become.`);
 checkSources();flush();
 chron(`${name} was reborn as a ${r.sing} at the Thorngate.`);
}

