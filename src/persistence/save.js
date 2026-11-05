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
 return true;
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

