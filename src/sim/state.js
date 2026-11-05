/* ============ SIMULATION STATE (docs/architecture/multiplayer-architecture.md §3) ============
 * The boundary between game simulation and presentation. simState() returns the whole game state as
 * plain JSON data, grouped the way a future server owns it: player, world, npcs, creatures, inventory,
 * quests, events. It never contains three.js objects, DOM nodes or functions, so it can be saved, sent
 * over a network, or recomputed on a server. SIM_AUTHORITY says, field by field, who may decide each
 * value once multiplayer exists: 'server' (authoritative), 'predicted' (the client moves first, the
 * server corrects), or 'client' (presentation only, never trusted).
 * Example: const s=simState(); JSON.stringify(s) // the full, renderer-free state */
const SIM_VERSION=1;
/** Who decides each field (dotted path; '*' covers a whole section). */
const SIM_AUTHORITY={
 'player.id':'server','player.name':'server','player.kind':'server','player.tier':'server','player.path':'server','player.stats':'server','player.hp':'server','player.hpMax':'server','player.mp':'server','player.fate':'server','player.corr':'server','player.aff':'server','player.traits':'server','player.conds':'server','player.region':'server',
 'player.pos':'predicted','player.facing':'predicted','player.anim':'client','player.actionsUsed':'server','player.day':'server',
 'world.*':'server','npcs.*':'server','creatures.*':'server','inventory.*':'server','quests.*':'server','events.*':'server',
};
/** Which authority applies to a dotted path (most specific rule wins). */
function simAuthority(path){if(SIM_AUTHORITY[path])return SIM_AUTHORITY[path];const sec=path.split('.')[0]+'.*';return SIM_AUTHORITY[sec]||'server';}
const r2=v=>Math.round(v*100)/100;
/** The full game state as plain data. Safe without the 3D world (2D journal mode, tests, a server). */
function simState(){
 if(!S)return null;const w3=typeof W3!=='undefined'&&W3,p=w3&&w3.player;
 const pos=p?{x:r2(p.x),y:r2(p.y),z:r2(p.z)}:{x:r2(S.pos?S.pos.x:SPAWN.x),y:0,z:r2(S.pos?S.pos.z:SPAWN.z)};
 const world=S.world||{};
 return{
  v:SIM_VERSION,
  player:{id:null,name:S.name,kind:S.race,tier:S.tier,path:S.path,legend:S.legendName||'',stats:{...S.stats},hp:S.hp,hpMax:hpMax(),mp:p?r2(p.mp):null,
   fate:S.fate,corr:S.corr,aff:{...S.aff},traits:[...S.traits],conds:{...S.cond},region:S.region,pos,facing:p&&p.ch?r2(p.ch.g.rotation.y):0,
   anim:p?p.anim||'idle':'idle',actionsUsed:S.used,day:S.day,job:S.job,jobXp:S.jobXp,sources:[...S.sources]},
  world:{day:S.day,hour:typeof world.hour==='number'?r2(world.hour):null,weather:S.weather,weatherHere:weatherHere(),regionRep:{...S.regRep},fellDay:world.fellDay||0},
  npcs:Object.keys(NPCS).map(id=>{const n=w3&&w3.npcs?w3.npcs.find(o=>o.id===id):null,st=S.npcs[id]||{};
   return{id,name:NPCS[id].name,region:NPC_REGION[id],pos:n?{x:r2(n.x),z:r2(n.z)}:{x:NPC_POS[id][0],z:NPC_POS[id][1]},activity:n&&n.act||null,
    rep:st.rep||0,helpedDay:st.helped||0,gifted:!!st.gifted,met:st.met||0,lastDay:st.lastDay||0,talks:st.talks||0};}),
  creatures:w3&&w3.monsters?w3.monsters.map((m,i)=>({id:'c'+i,name:m.b.n,region:m.region,alive:!!m.alive,hp:m.hp,hpMax:m.hpMax,state:m.st,pos:{x:r2(m.x),z:r2(m.z)},home:{x:r2(m.hx),z:r2(m.hz)},respawnAt:m.alive?null:r2(m.deadT)})):[],
  inventory:{gold:S.gold,materials:{...S.mat},spells:S.spells.map(s=>({...s})),buildings:S.build.map(b=>({...b})),pet:S.pet?{...S.pet}:null,companion:S.comp?{...S.comp}:null,blood:S.blood||null},
  quests:{npcHelp:Object.fromEntries(Object.keys(S.npcs).map(id=>[id,S.npcs[id].helped||0])),discoveries:{...(world.disc||{})},flags:{...S.flags},candidate:S.cand||null},
  events:{world:JSON.parse(JSON.stringify(world.events||{})),huntedToday:JSON.parse(JSON.stringify(world.kills||{})),market:{day:S.marketDay,sales:S.salesToday,cap:S.salesCap}},
 };
}
/** Checks a snapshot is plain data: no functions, no class instances other than plain objects and arrays. */
function simIsPlain(v,path){
 path=path||'state';if(v===null||['string','number','boolean'].includes(typeof v))return typeof v==='number'&&!isFinite(v)?path+' is not a finite number':null;
 if(typeof v==='function'||typeof v==='symbol'||typeof v==='undefined')return path+' is a '+typeof v;
 const proto=Object.getPrototypeOf(v);if(!Array.isArray(v)&&proto!==Object.prototype&&proto!==null)return path+' is a '+(v.constructor&&v.constructor.name||'class instance');
 for(const k of Object.keys(v)){const e=simIsPlain(v[k],path+'.'+k);if(e)return e;}return null;
}
