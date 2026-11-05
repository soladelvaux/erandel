/* ---------- LIVING WORLD runtime (docs/systems/living-world.md) ----------
 * World clock and light, weather transitions and wind, NPC schedules with three simulation levels,
 * NPC lines and memory, creature habits (used by updateMonster), world events and discoveries,
 * and the world state kept in the save (S.world). Data: src/data/living-world.js. */
const LW={slot:-1,day:-1,rain:0,rainBase:null,npcT:0,evT:0,discT:0,uiT:0,active:{},fx:{},L:null};
/** Shared wind uniform for the painted materials (weather sets it). */
const PAINT_WIND={value:.35};

/** Adds the world state to a save, and migrates saves made before it existed. */
function worldDefaults(s){
 if(!s.world||typeof s.world!=='object')s.world={};const w=s.world;
 if(typeof w.hour!=='number')w.hour=CLOCK.slots[Math.min(s.used||0,2)][0];
 if(!w.disc||typeof w.disc!=='object')w.disc={};if(!w.events||typeof w.events!=='object')w.events={};
 if(!w.kills||typeof w.kills!=='object')w.kills={day:s.day,by:{}};if(typeof w.fellDay!=='number')w.fellDay=0;
 Object.keys(s.npcs||{}).forEach(id=>{const n=s.npcs[id];['met','lastDay','talks'].forEach(k=>{if(typeof n[k]!=='number')n[k]=0;});});
 return s;
}

/* ----- clock and light ----- */
/** The clock runs inside the current part of the day and waits at its end until you act or sleep. */
function clockTick(dt){
 if(!S||!S.world)return;const w=S.world,slot=Math.min(S.used,2),[a,b]=CLOCK.slots[slot];
 if(LW.slot>=0&&(slot!==LW.slot||S.day!==LW.day))w.hour=a; // a deed or a new day moved time on
 LW.slot=slot;LW.day=S.day;
 if(w.hour<a||w.hour>=b)w.hour=a;
 w.hour=Math.min(b-.02,w.hour+dt/CLOCK.secPerHour);
}
/** The hour 0-24 for display; the stored hour runs 6-30. */
function clockLabel(){if(!S||!S.world)return'';const h=S.world.hour%24,hh=Math.floor(h),mm=Math.floor((h-hh)*60/10)*10;return String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0');}
/** Light by hour: blends the game's morning, afternoon and night palettes through dawn and dusk. */
function worldLight(ti){
 if(!LW.L){const C=(o)=>({sky:new THREE.Color(o.sky),gnd:new THREE.Color(o.gnd),sun:new THREE.Color(o.sun),fog:new THREE.Color(o.fog),water:new THREE.Color(o.water),hi:o.hi,si:o.si,night:o.night});
  const M=C(LIGHT[0]),A=C(LIGHT[1]),N=C(LIGHT[2]),D=C(LIGHT[1]);['sky','gnd','sun','fog','water'].forEach(k=>D[k].lerp(N[k],.5).lerp(new THREE.Color('#e88a50'),k==='sky'||k==='fog'?.25:0));D.hi=(A.hi+N.hi)/2;D.si=(A.si+N.si)/2;D.night=.45;
  LW.L={keys:[[5,N],[7,M],[11,M],[13,A],[16.5,A],[18.4,D],[19.2,N],[28.6,N],[30,M]],out:C(LIGHT[1])};}
 if(!S||!S.world)return LIGHT[ti];
 const h=S.world.hour,K=LW.L.keys,o=LW.L.out;let i=0;while(i<K.length-2&&h>=K[i+1][0])i++;
 const [h0,a]=K[i],[h1,b]=K[i+1],t=Math.max(0,Math.min(1,(h-h0)/(h1-h0)));
 ['sky','gnd','sun','fog','water'].forEach(k=>o[k].copy(a[k]).lerp(b[k],t));o.hi=a.hi+(b.hi-a.hi)*t;o.si=a.si+(b.si-a.si)*t;o.night=a.night+(b.night-a.night)*t;
 return o;
}

/* ----- NPC schedules and simulation levels ----- */
function npcEntry(id,h){const sc=SCHEDULES[id]||SCHEDULE_DEFAULT;for(const e of sc)if(h>=e[0]&&h<e[1])return e;return sc[sc.length-1];}
/** Where the schedule puts an NPC at hour h: a pure function of the clock, so every simulation level agrees. */
function npcWhere(n,h,out){
 const e=npcEntry(n.id,h),tg=e[3],rel=!SCHEDULES[n.id],home=n.home;out.act=e[2];
 if(!tg){out.x=home[0];out.z=home[1];return out;}
 const P=(p)=>rel?[home[0]+p[0],home[1]+p[1]]:p;
 if(!Array.isArray(tg[0])){const p=P(tg);out.x=p[0];out.z=p[1];return out;}
 const pts=tg.map(P);let len=0;for(let i=0;i<pts.length-1;i++)len+=Math.hypot(pts[i+1][0]-pts[i][0],pts[i+1][1]-pts[i][1]);
 const loops=Math.max(1,Math.floor(1.3*(e[1]-e[0])*CLOCK.secPerHour/Math.max(len,1)));
 let s=(((h-e[0])/(e[1]-e[0]))*loops%1)*len;
 for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(s<=l||i===pts.length-2){const t=l>0?Math.min(1,s/l):0;out.x=a[0]+(b[0]-a[0])*t;out.z=a[1]+(b[1]-a[1])*t;break;}s-=l;}
 return out;
}
const _lwp={x:0,z:0,act:''};
/** A chibi pose for what the NPC is doing while standing. */
function npcPose(c,act,t){
 const k=.12;c.body.rotation.x+=((act==='tend'?.55:act==='sleep'?.2:0)-c.body.rotation.x)*k;c.body.position.y+=((act==='tend'?-.18:act==='rest'||act==='sleep'?-.22:0)-c.body.position.y)*k;
 if(act==='tend'){c.armL.rotation.x=-1.2+Math.sin(t*2)*.2;c.armR.rotation.x=-1.1-Math.sin(t*2)*.2;}
 else if(act==='work'){c.armR.rotation.x=-.8+Math.sin(t*3.2)*.6;}
 else if(act==='rest'||act==='sleep'){c.legL.rotation.x=-1.2;c.legR.rotation.x=-1.2;c.head.rotation.x=act==='sleep'?.35:0;}
 else if(act==='serve'){c.armR.rotation.x=-1.4;}
}
/** Updates the named NPCs at three levels of detail by distance to the player (SIM_LEVELS). */
function livingNpcs(dt,t){
 const w=W3,p=w.player,h=S&&S.world?S.world.hour:12;LW.npcT-=dt;const simple=LW.npcT<=0;if(simple)LW.npcT=SIM_LEVELS.simpleEvery;
 for(const n of w.npcs){
  if(!n.home)n.home=[n.x,n.z];
  const d=Math.hypot(p.x-n.x,p.z-n.z);
  if(n.special||!S||ui.screen!=='game'){animChibi(n.ch,dt,false);if(d*d<40&&S&&ui.screen==='game')turnTo(n.ch,p.x-n.x,p.z-n.z,dt);n.ch.g.position.y=heightAt(n.x,n.z);n.lvl='full';continue;}
  npcWhere(n,h,_lwp);if(heightAt(_lwp.x,_lwp.z)<.3&&bridgeY(_lwp.x,_lwp.z)===-Infinity){_lwp.x=n.home[0];_lwp.z=n.home[1];}n.act=_lwp.act;
  if(d<SIM_LEVELS.full){ // full: walk to the scheduled point with animation, pose, face the player
   n.lvl='full';n.ch.g.visible=true;const dx=_lwp.x-n.x,dz=_lwp.z-n.z,dd=Math.hypot(dx,dz);
   if(dd>8){n.x=_lwp.x;n.z=_lwp.z;}const moving=dd>.15&&dd<=8;
   if(moving){const sp=Math.min(dd,1.6*dt);n.x+=dx/dd*sp;n.z+=dz/dd*sp;turnTo(n.ch,dx,dz,dt);}
   animChibi(n.ch,dt,moving);if(!moving){npcPose(n.ch,n.act,t);if(d<6&&n.act!=='sleep')turnTo(n.ch,p.x-n.x,p.z-n.z,dt);}
  }else if(d<SIM_LEVELS.simple){ // simplified: a few updates a second, straight to the scheduled point, no animation
   n.lvl='simple';n.ch.g.visible=true;if(simple){n.x=_lwp.x;n.z=_lwp.z;}
  }else{ // distant: the schedule is applied every few seconds, the model is hidden
   n.lvl='distant';n.ch.g.visible=false;n.distT=(n.distT||0)-dt;if(n.distT<=0){n.distT=SIM_LEVELS.distantEvery;n.x=_lwp.x;n.z=_lwp.z;}
  }
  n.ch.g.position.set(n.x,groundY(n.x,n.z),n.z);
 }
}

/* ----- NPC lines, reactions and memory ----- */
function npcLineWhen(key,id,st){
 const h=S.world.hour,act=npcEntry(id,h)[2],wx=weatherHere(NPC_REGION[id]);
 const k=S.world.kills;switch(key){
  case'first':return st.talks===0;case'huntedHere':return k.day===S.day&&(k.by[NPC_REGION[id]]||0)>=2;
  case'corrHigh':return S.corr>=30;case'fateHigh':return S.fate>=30;case'helpedRecently':return st.helped>0&&S.day-st.helped<=3&&st.helped!==S.day;
  case'away':return st.lastDay>0&&S.day-st.lastDay>=3;case'fellToday':return S.world.fellDay===S.day;
  case'rain':return wx==='rain'||wx==='storm';case'sleep':return act==='sleep';case'tend':return act==='tend';
  case'walkEvening':return act==='walk'&&h>=17;case'walk':return act==='walk';case'night':return h>=19;case'morning':return h<10;
  case'any':return true;}return false;
}
/** What an NPC says now: the first matching line (NPC_LINES), else a narration of what they are doing. */
function npcSay(id){
 const st=S.npcs[id];if(!st)return'';const lines=NPC_LINES[id];
 if(lines){for(const[k,text]of lines)if(npcLineWhen(k,id,st)){const days=S.day-(st.lastDay||S.day),n=(S.world.kills.by[NPC_REGION[id]]||0);return text.replace('{name}',S.name).replace('{days}',days).replace('{n}',n);}}
 const act=npcEntry(id,S.world.hour)[2];return(NPC_NARRATION[act]||'').replace('{who}',NPCS[id].name);
}
/** Called when a conversation opens: remembers the meeting. */
function npcRemember(id){const st=S.npcs[id];if(!st)return;if(!st.met)st.met=S.day;st.lastDay=S.day;st.talks++;save();}

/* ----- creature habits (used by updateMonster) ----- */
function habitOf(m){return HABITS[m.b.n]||{};}
/** Is this creature awake now? 'day' creatures rest at night, 'night' creatures rest by day. */
function creatureAwake(h){if(!h.awake||!S||!S.world)return true;const night=S.world.hour>=19||S.world.hour<6;return h.awake==='night'?night:!night;}

/* ----- world events and discoveries ----- */
function eventWorldNote(id,text){const e=S.world.events[id];if(!e){S.world.events[id]={first:S.day,last:S.day,count:1};OUT=[];L(text,'good');flush();chron(text);toast(text);save();}else if(e.last!==S.day){e.last=S.day;e.count++;}}
function eventFx(id,on,t,dt){
 const w=W3;
 if(id==='souls-thorngate'){let f=LW.fx[id];if(!f&&on){f=LW.fx[id]=[];for(let i=0;i<8;i++){const g=mkGlow('#d8f0ff',1.2,0);w.scene.add(g);f.push({g,o:i/8});}}
  if(f)f.forEach(s=>{const k=(t*.05+s.o)%1,x=Math.sin(k*9+s.o*20)*3,z=52+k*34,y=heightAt(x,z)+1.5+Math.sin(k*12)*.4;s.g.position.set(x,y,z);s.g.material.opacity+=((on?.55*Math.sin(k*Math.PI):0)-s.g.material.opacity)*Math.min(1,dt*2);});}
 if(id==='erelian-lamps'){let f=LW.fx[id];if(!f&&on&&typeof ERELIAN_STRUCTURES!=='undefined'){f=LW.fx[id]=[];ERELIAN_STRUCTURES.filter(s=>/spire/.test(s[0])).forEach(([n,x,z,,s])=>{const g=mkGlow('#ffd890',2.4,0);g.position.set(x,heightAt(x,z)+(n.includes('_b')?23:18)*s,z);w.scene.add(g);f.push({g});});}
  if(f)f.forEach(s=>{s.g.material.opacity+=((on?.75:0)-s.g.material.opacity)*Math.min(1,dt*.8);});}
 if(id==='moon-in-the-well'){let f=LW.fx[id];if(!f&&on){const g=mkGlow('#cfe4ff',9,0);g.position.set(10,heightAt(10,-8)+.8,-8);w.scene.add(g);f=LW.fx[id]=[{g}];}
  if(f)f.forEach(s=>{s.g.material.opacity+=((on?.5+.15*Math.sin(t*.8):0)-s.g.material.opacity)*Math.min(1,dt);});}
 if(id==='stag-watches'&&on&&typeof CHR!=='undefined'&&!LW.active.stagPicked){const p=w.player;const c=CHR.stags.slice().sort((a,b)=>Math.hypot(a.s.x-p.x,a.s.z-p.z)-Math.hypot(b.s.x-p.x,b.s.z-p.z))[0];if(c&&Math.hypot(c.s.x-p.x,c.s.z-p.z)<25){c.s.watchT=15;LW.active.stagPicked=true;}}
}
function eventsTick(dt,t){
 const w=W3,p=w.player;LW.evT-=dt;
 if(LW.evT<=0){LW.evT=1;const h=S.world.hour;
  for(const[id,ev]of Object.entries(WORLD_EVENTS)){
   const hh=h,inH=hh>=ev.hours[0]&&hh<ev.hours[1],inR=!ev.region||S.region===ev.region,inN=!ev.near||Math.hypot(p.x-ev.near[0],p.z-ev.near[1])<ev.near[2];
   const ok=inH&&inR&&inN;
   if(ok&&!LW.active[id]&&Math.random()<ev.chance){LW.active[id]=true;eventWorldNote(id,ev.text);}
   if(!ok&&LW.active[id]){LW.active[id]=false;if(id==='stag-watches')LW.active.stagPicked=false;}
  }}
 for(const id of Object.keys(WORLD_EVENTS))eventFx(id,!!LW.active[id],t,dt);
 LW.discT-=dt;if(LW.discT<=0){LW.discT=.5;for(const[id,d]of Object.entries(DISCOVERIES)){if(S.world.disc[id])continue;if(d.at.some(([x,z])=>Math.hypot(p.x-x,p.z-z)<d.r)){S.world.disc[id]=S.day;OUT=[];L(d.text,'good');flush();chron(d.text);toast(d.text);save();}}}
}

/* ----- weather transitions and wind ----- */
function weatherTick(dt,wx){
 const w=W3,rainy=wx==='rain'||wx==='storm'||wx==='snow';
 if(LW.rainBase==null)LW.rainBase=w.pmat.opacity;
 LW.rain+=((rainy?1:0)-LW.rain)*Math.min(1,dt*.35);
 if(wx!=='under')w.points.visible=LW.rain>.02;w.pmat.opacity=LW.rainBase*LW.rain;
 PAINT_WIND.value+=((WIND[wx]!=null?WIND[wx]:.35)-PAINT_WIND.value)*Math.min(1,dt*.3);
}
/** Per-frame living-world update (3D only). */
function livingTick(dt,t,wx){
 if(!S||!S.world||ui.screen!=='game')return;
 clockTick(dt);weatherTick(dt,wx);eventsTick(dt,t);
 LW.uiT-=dt;if(LW.uiT<=0){LW.uiT=1;const el=document.getElementById('lw-clock');if(el)el.textContent=clockLabel();}
}
