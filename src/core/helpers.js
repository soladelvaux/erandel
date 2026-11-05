/* ============ HELPERS ============ */
const app=document.getElementById('app');
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rnd=(a,b)=>a+Math.random()*(b-a);
const ri=(a,b)=>Math.floor(rnd(a,b+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const f1=n=>String(Math.round(n*10)/10);
const fl=n=>Math.floor(n);
const elChip=e=>e&&ELEM[e]?`<span class="el" style="--c:${ELEM[e].c}">${ELEM[e].name}</span>`:'';
const SAVE_KEY='erandel-save-v1', CODEX_KEY='erandel-codex-v1';

let S=null;
let CODEX={};
let OUT=[];
let SLOT=0;
const ui={screen:'create',tab:'act',pick:'elves',cname:'Wanderer',confirm:false,travel:'',prac:'',job:'',fs:'',fe1:'',fe2:'',ff:'bolt',fname:'',food:'',toast:''};
let toastTimer=null;

function R(){return RACES[S.race];}
function L(t,cls){OUT.push({t,cls:cls||''});}
function pushLog(t,cls){S.log.push({t,cls:cls||'',d:S.day});if(S.log.length>160)S.log.splice(0,S.log.length-160);}
function flush(){OUT.forEach(o=>pushLog(o.t,o.cls));OUT=[];}
function chron(t){S.chron.push({d:S.day,t});}
function hpMax(){return Math.round(60+S.stats.end*2);}
function energyMax(){return 3+(S.stats.end>=25?1:0);}
function energyLeft(){return Math.max(0,energyMax()-S.used);}
function timeIdx(){return Math.min(S.used,2);}
function statSum(){return STATS.reduce((a,k)=>a+S.stats[k],0);}
function slotsUsed(){return ELS.filter(e=>S.aff[e]>0).length;}
function maxSlots(){return 3+(S.extraSlot?1:0);}
function topAff(){let b=null,v=0;ELS.forEach(e=>{if(S.aff[e]>v){v=S.aff[e];b=e;}});return b;}
function topAffVal(){const t=topAff();return t?S.aff[t]:0;}
function affLevel(v){if(v>=100)return{i:4,n:'Avatar'};if(v>=60)return{i:3,n:'Bond'};if(v>=30)return{i:2,n:'Flow'};if(v>=10)return{i:1,n:'Spark'};return{i:0,n:v>0?'Faint':'None'};}
function attitude(v){if(v<=-40)return{n:'Hostile',c:'var(--corr)'};if(v<=-10)return{n:'Wary',c:'var(--hp)'};if(v<10)return{n:'Neutral',c:'var(--mut)'};if(v<40)return{n:'Friendly',c:'var(--fate)'};return{n:'Devoted',c:'var(--gold)'};}
function jobRank(){let r=JOB_RANKS[0],i=0;JOB_RANKS.forEach((x,j)=>{if(S.jobXp>=x.at){r=x;i=j;}});return{n:r.n,i};}
function elemMult(a,d){if(!a||!d||!ELEM[a])return 1;const s=ELEM[a].strong.includes(d),w=ELEM[a].weak.includes(d);if(s&&w)return 1.2;if(s)return 1.5;if(w)return 0.67;return 1;}

function weatherHere(region){
 region=region||S.region;const w=S.weather;
 if(region==='stonedeep')return'under';
 if(region==='frostfell'&&['rain','heat','storm'].includes(w))return'snow';
 if(region==='ember'&&['rain','snow','fog'].includes(w))return'heat';
 if(region==='coral'&&w==='snow')return'rain';
 if(region==='hollow'&&w==='heat')return'fog';
 if(region==='greenmere'&&w==='heat')return'clear';
 if(['vael','greenmere','coral','sanctum','moonwell','hollow','skyreach'].includes(region)&&w==='snow'&&region!=='skyreach')return'rain';
 return w;
}
function rollWeather(){return pick(['clear','clear','clear','rain','rain','storm','fog','heat','snow']);}
function isSunny(){return['clear','heat'].includes(weatherHere());}
function gainMult(){let m=1;if(R().group==='night'){if(SLOT===2)m*=1.3;else if(isSunny())m*=0.8;}if(S.pet)m*=1.1;Object.keys(S.cond).forEach(c=>{if(COND[c]&&COND[c].gm)m*=COND[c].gm;});return m;}
function addCond(id,days){const had=S.cond[id]>0;S.cond[id]=Math.max(S.cond[id]||0,days);if(!had)L(`You are now ${COND[id].n.toLowerCase()}. ${COND[id].d}`,COND[id].good?'good':'dark');}
function cure(ids){const c=ids.filter(id=>S.cond[id]);c.forEach(id=>delete S.cond[id]);return c.map(id=>COND[id].n.toLowerCase());}
function timeMult(el){if(SLOT===2)return{moon:1.5,shadow:1.3,light:0.7}[el]||1;return{light:1.2,moon:0.6}[el]||1;}

function addStat(k,n){const g=n*gainMult();S.stats[k]+=g;S.dayGains[k]=(S.dayGains[k]||0)+g;return g;}
function gains(list){return list.map(([k,n])=>`${SN[k]} +${f1(addStat(k,n))}`).join(' · ');}
function addFate(n){S.fate=clamp(S.fate+n,0,100);}
function addCorr(n){S.corr=clamp(S.corr+n,0,100);}
function addRep(id,n){S.npcs[id].rep=clamp(S.npcs[id].rep+n,-100,100);}
function addReg(id,n){S.regRep[id]=clamp(S.regRep[id]+n,-100,100);}
function npcMem(id,t){const m=S.npcs[id].mem;m.push(`Day ${S.day}: ${t}`);if(m.length>6)m.shift();}
function heal(n){const b=S.hp;S.hp=Math.min(hpMax(),S.hp+n);return Math.round(S.hp-b);}
function hurt(n){S.hp-=n;}

function canGrow(el){return S.aff[el]>0||slotsUsed()<maxSlots();}
function addAff(el,n,opt){
 opt=opt||{};
 if(!el||!ELEM[el])return 0;
 const cur=S.aff[el];
 if(cur<=0&&!opt.force&&slotsUsed()>=maxSlots()){
  if(!opt.quiet)L(`Your soul has no room for ${ELEM[el].name}. You already hold ${maxSlots()} elements.`,'mutl');
  return 0;
 }
 let m=1;
 if(S.race==='humans')m*=1.5;
 if(REG[S.region].els.includes(el))m*=1.5;
 const W=WEATHER[weatherHere()];
 if(W.boost.includes(el))m*=1.5;
 if(W.pen.includes(el))m*=0.5;
 m*=timeMult(el);
 const after=Math.min(100,cur+n*m);
 S.aff[el]=after;
 const lb=affLevel(cur),la=affLevel(after);
 if(la.i>lb.i&&la.i>=1){L(`${ELEM[el].name} affinity reached ${la.n}.`,'gold');if(la.i>=3)chron(`${ELEM[el].name} affinity reached ${la.n}.`);}
 const th=S.race==='humans'?30:60;
 if(after>=th&&!S.traits.includes(ELEM[el].trait)){
  S.traits.push(ELEM[el].trait);
  L(`Your body changes: ${ELEM[el].trait.toLowerCase()}.`,'evo');
  chron(`Body changed from ${ELEM[el].name}: ${ELEM[el].trait.toLowerCase()}.`);
 }
 return after-cur;
}
function affText(el,g){return g>0?`${ELEM[el].name} affinity +${f1(g)}`:'';}
function join(...a){return a.filter(Boolean).join(' · ');}

function practicable(){
 const reg=REG[S.region],W=WEATHER[weatherHere()];
 return ELS.filter(e=>canGrow(e)&&(S.aff[e]>0||reg.els.includes(e)||W.boost.includes(e)));
}
function bestPath(){
 const r=R();let bi=0,bv=-1;
 r.paths.forEach((p,i)=>{if(S.stats[p.s]>bv){bv=S.stats[p.s];bi=i;}});
 return bi;
}
function title(){
 const r=R();
 if(S.tier===1)return'Newly Born';
 if(S.tier===4)return S.legendName;
 const p=r.paths[S.path];
 return S.tier===2?p.n:p.t3;
}
function npcHere(){return REG[S.region].npc;}
function needOf(id){const keys=Object.keys(NPCS);const i=keys.indexOf(id);const n=NPCS[id].needs;return n[(S.day+i)%n.length];}

