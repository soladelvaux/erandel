/* ---------- Phase 4: rigged characters and creatures (docs/characters/character-system.md) ----------
 * Loads the skinned GLBs authored by tools/assets/author-characters.mjs and drives them with
 * AnimationMixer state machines. Game logic is unchanged: animation follows the state the game
 * already keeps (movement, dodge, attack, cast, climb, jump, creature AI) and never drives it.
 * Off with ?chars=off. If a model fails to load, the old chibi or primitive stays. */
const CHR={status:'off',errors:[],lib:{},hero:null,creatures:[],stags:[],SU:null};
function charsWanted(){try{return !/[?&]chars=off\b/.test(location.search);}catch(e){return true;}}
const CHR_EYE_DEFAULT='#1a1420';
/** Shared painted material for skinned characters: vertex colour x slot tint, soft rim light (art bible §6, §11.3). */
function chrMat(color,o){
 o=o||{};const m=new THREE.MeshLambertMaterial({color,vertexColors:true,map:o.map||null,alphaTest:o.map?.35:0,side:o.double?THREE.DoubleSide:THREE.FrontSide,emissive:o.emissive||'#000000'});
 m.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <output_fragment>','float rimK=pow(1.0-clamp(dot(normal,normalize(vViewPosition)),0.0,1.0),3.0);\noutgoingLight+=vec3(1.0,0.94,0.82)*rimK*0.22;\n#include <output_fragment>');};
 m.customProgramCacheKey=()=>'erandel-chr'+(o.map?'m':'')+(o.double?'d':'');return m;
}
/** Builds the clip actions for a model: { mixer, act:{name:action}, cur, meta }. */
function rigCtl(root,clips,meta){
 const mixer=new THREE.AnimationMixer(root),act={};
 clips.forEach(c=>{const a=mixer.clipAction(c);const loop=/^(idle|walk|run|climb)$/.test(c.name);a.setLoop(loop?THREE.LoopRepeat:THREE.LoopOnce,Infinity);a.clampWhenFinished=!loop;act[c.name]=a;});
 const bones={};root.traverse(o=>{if(o.isBone)bones[o.name]=o;});
 return{mixer,act,cur:null,meta,bones,root,oneShot:0};
}
/** Switches to clip `name` with a cross-fade; one-shots restart. timeScale keeps animation in sync with the game. */
function rigPlay(c,name,fade,timeScale,restart){
 const a=c.act[name];if(!a)return;if(timeScale!=null)a.timeScale=timeScale;
 if(c.cur===name&&!restart)return;
 const prev=c.cur&&c.act[c.cur];a.reset();a.setEffectiveWeight(1);a.play();if(prev&&prev!==a)prev.crossFadeTo(a,fade,false);else if(prev===a)a.time=0;
 c.cur=name;
}

/* ----- the player adventurer ----- */
function tintHero(model,spec){
 const eye=spec.eye&&spec.eye!==CHR_EYE_DEFAULT?spec.eye:'#4f7a5a';
 const tints={'chr-skin':spec.skin,'chr-hair':spec.hair,'chr-cloth':spec.robe,'chr-trim':spec.robe2,'chr-leather':'#6a4a30','chr-metal':'#c8cdd2','chr-face':'#ffffff','chr-iris':eye};
 model.traverse(o=>{if(!o.isMesh)return;const n=o.userData.slot||(o.userData.slot=o.material.name);const map=o.material.map;
  o.material=chrMat(tints[n]||'#ffffff',{map:(n==='chr-face'||n==='chr-iris')?map:null,double:n==='chr-trim',emissive:n==='chr-iris'&&spec.eye&&spec.eye!==CHR_EYE_DEFAULT?eye:null});
  if(/ear_elf/.test(o.name))o.visible=spec.ears==='elf';if(/ear_human/.test(o.name))o.visible=spec.ears!=='elf';o.frustumCulled=false;});
}
/** Puts the adventurer into the player's character group (the chibi stays as the logic container, hidden). */
function attachHero(){
 const p=W3.player,L=CHR.lib.hero;if(!p||!p.ch||!L||!S)return;
 if(CHR.hero&&CHR.hero.race===S.race&&CHR.hero.ch===p.ch)return;
 if(CHR.hero&&CHR.hero.model.parent)CHR.hero.model.parent.remove(CHR.hero.model);
 const model=CHR.SU.clone(L.scene);tintHero(model,charSpec(S.race));
 p.ch.g.children.forEach(o=>{o.visible=false;});p.ch.g.add(model);p.ch.g.scale.setScalar(1);model.scale.setScalar(1.12);
 const c=rigCtl(model,L.animations,L.meta);c.race=S.race;c.ch=p.ch;c.model=model;c.px=p.x;c.pz=p.z;c.blinkT=2;c.dlg=null;rigPlay(c,'idle',0);
 CHR.hero=c;
}
/** Chooses the adventurer's clip from the player state each frame; locomotion plays at the real ground speed. */
function heroTick(p,dt){
 if(!CHR.lib.hero||!p.ch)return;if(!CHR.hero||CHR.hero.ch!==p.ch||CHR.hero.race!==S.race)attachHero();const c=CHR.hero;if(!c)return;
 const jump=Math.hypot(p.x-c.px,p.z-c.pz);if(jump>3){c.speed=0;c.px=p.x;c.pz=p.z;} // a teleport is not movement
 const sp=dt>0?Math.hypot(p.x-c.px,p.z-c.pz)/dt:0;c.px=p.x;c.pz=p.z;c.speed=(c.speed||0)+(Math.min(sp,12)-(c.speed||0))*Math.min(1,dt*10);
 const st=c.meta.stride||{walk:1.7,run:7};
 ['hitT','interactT','downT'].forEach(k=>{if(p[k]>0)p[k]-=dt;});
 const talking=!!(ui.dialog&&(ui.dialog.type==='npc'||ui.dialog.type==='ael'||ui.dialog.type==='talk'));if(talking&&!c.dlg)p.interactT=1.4;c.dlg=talking; // a conversation starting
 let want,fade=.16,ts=1,restart=false;
 if(p.downT>0||S.hp<=0)want='death';
 else if(p.dodgeT>0){want='dodge';fade=.05;ts=.5/ACT.dodgeTime;restart=c.cur!=='dodge';}
 else if(p.atkAnim>0){want='attack';fade=.05;ts=1.25;restart=c.cur!=='attack';}
 else if(p.castAnim>0){want='cast';fade=.06;ts=1;}
 else if(p.hitT>0){want='hit';fade=.05;restart=c.cur!=='hit';}
 else if(p.climb){want='climb';ts=p.climbMove?1:.25;}
 else if(!p.ground){want='jump';fade=.08;}
 else if(c.speed>3.6){want='run';ts=Math.max(.5,c.speed/st.run);}
 else if(c.speed>.35){want='walk';ts=Math.max(.4,c.speed/st.walk);fade=.2;}
 else if(p.interactT>0){want='interact';fade=.12;}
 else want='idle';
 rigPlay(c,want,fade,ts,restart);c.mixer.update(dt);
 // blink: the eyes bone closes for 0.12 s every 2.5 - 5 s
 const eyes=c.bones.eyes;if(eyes){c.blinkT-=dt;if(c.blinkT<0){eyes.scale.y=.12;if(c.blinkT<-.12){c.blinkT=2.5+Math.random()*2.5;}}else eyes.scale.y=1;}
}

/* ----- creatures ----- */
function tintCreature(model,glow){model.traverse(o=>{if(!o.isMesh)return;const light=o.material.name==='chr-light';o.material=chrMat('#ffffff',{emissive:light&&glow?glow:null});o.frustumCulled=false;});}
/** Gives a monster the rigged model of its kind: the primitive parts are hidden, the AI keeps moving the group. */
function rigMonster(m,L){
 const model=CHR.SU.clone(L.scene);tintCreature(model,null);const g=m.mo.g;
 g.children.forEach(o=>{o.visible=false;});g.add(model);model.scale.setScalar(1/(m.baseS||1));
 const c=rigCtl(model,L.animations,L.meta);c.m=m;c.px=m.x;c.pz=m.z;c.deadT=0;c.wasAlive=true;rigPlay(c,'idle',0);CHR.creatures.push(c);
}
function creatureTick(c,dt){
 const m=c.m,st=c.meta.stride;
 if(!m.alive){if(c.wasAlive){c.wasAlive=false;c.deadT=1.6;rigPlay(c,'death',.08,1,true);}
  if(c.deadT>0){c.deadT-=dt;m.mo.g.visible=c.deadT>0;c.mixer.update(dt);}return;}
 if(!c.wasAlive){c.wasAlive=true;rigPlay(c,'idle',0,1,true);}
 if(Math.hypot(m.x-c.px,m.z-c.pz)>3){c.px=m.x;c.pz=m.z;c.speed=0;}
 const sp=dt>0?Math.hypot(m.x-c.px,m.z-c.pz)/dt:0;c.px=m.x;c.pz=m.z;c.speed=(c.speed||0)+(Math.min(sp,12)-(c.speed||0))*Math.min(1,dt*8);
 let want='idle',ts=1,fade=.18,restart=false;
 if(m.st==='windup'){want='attack';ts=.35/Math.max(.2,m.wind||ACT.windup);restart=c.cur!=='attack';fade=.08;}
 else if(m.flash>0){want='hit';fade=.05;restart=c.cur!=='hit';}
 else if(c.speed>2.6){want='run';ts=Math.max(.5,c.speed/st.run);}
 else if(c.speed>.25){want='walk';ts=Math.max(.4,c.speed/st.walk);}
 if(m.st==='recover'&&c.cur==='attack')want='attack';
 rigPlay(c,want,fade,ts,restart);c.mixer.update(dt);
}

/* ----- Lunar Stag: neutral wildlife in Erelian (registry B20; this role is PROVISIONAL) ----- */
const STAG_HOMES=[[-50,-6],[-58,28],[-70,0]];
function spawnStags(L){
 STAG_HOMES.forEach(([x,z],i)=>{const model=CHR.SU.clone(L.scene);tintCreature(model,'#9fb8ff');const y=heightAt(x,z);model.position.set(x,y,z);model.rotation.y=i*2.1;W3.scene.add(model);
  const c=rigCtl(model,L.animations,L.meta);c.s={x,z,hx:x,hz:z,tx:x,tz:z,st:'graze',t:2+i,ry:i*2.1};c.px=x;c.pz=z;rigPlay(c,'idle',0);CHR.stags.push(c);});
}
/** Grazes, wanders near home, and flees from anyone who comes within 7 m. Never attacks, never targeted. */
function stagTick(c,dt){
 const s=c.s,p=W3.player,dpx=s.x-p.x,dpz=s.z-p.z,dp=Math.hypot(dpx,dpz)||.01;let vx=0,vz=0;
 if(dp<7&&S&&S.hp>0){s.st='flee';s.t=3;}
 if(s.st==='flee'){s.t-=dt;vx=dpx/dp*7.5;vz=dpz/dp*7.5;const nx=s.x+vx*dt,nz=s.z+vz*dt;if(regionAt(nx,nz)!=='greenmere'||heightAt(nx,nz)<.3||Math.hypot(nx-s.hx,nz-s.hz)>26){vx=-vx*.3+(s.hx-s.x)*.3;vz=-vz*.3+(s.hz-s.z)*.3;}if(s.t<=0&&dp>12)s.st='graze';}
 else{s.t-=dt;if(s.st==='graze'&&s.t<=0){s.st='walk';s.tx=s.hx+(Math.random()-.5)*14;s.tz=s.hz+(Math.random()-.5)*14;if(regionAt(s.tx,s.tz)!=='greenmere'||heightAt(s.tx,s.tz)<.3){s.tx=s.hx;s.tz=s.hz;}}
  if(s.st==='walk'){const dx=s.tx-s.x,dz=s.tz-s.z,d=Math.hypot(dx,dz);if(d<.6){s.st='graze';s.t=4+Math.random()*5;}else{vx=dx/d*1.4;vz=dz/d*1.4;}}}
 s.x+=vx*dt;s.z+=vz*dt;if(Math.abs(vx)+Math.abs(vz)>.05){const a=Math.atan2(vx,vz);let d=a-s.ry;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;s.ry+=d*Math.min(1,dt*6);}
 c.root.position.set(s.x,heightAt(s.x,s.z),s.z);c.root.rotation.y=s.ry;
 const sp=Math.hypot(vx,vz);rigPlay(c,sp>3?'run':sp>.2?'walk':'idle',.25,sp>3?sp/c.meta.stride.run:sp>.2?sp/c.meta.stride.walk:1);
 c.root.visible=Math.hypot(s.x-W3.camera.position.x,s.z-W3.camera.position.z)<140;if(c.root.visible)c.mixer.update(dt);
}

/* ----- loading and the per-frame hook ----- */
async function loadCharacters(){
 const base=regionAssetBase();CHR.status='loading';
 try{
  const [{GLTFLoader},{MeshoptDecoder},SU]=await Promise.all([import('three/addons/loaders/GLTFLoader.js'),import('three/addons/libs/meshopt_decoder.module.js'),import('three/addons/utils/SkeletonUtils.js')]);
  CHR.SU=SU;const l=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const get=async(k,f)=>{try{const g=await l.loadAsync(base+f);g.meta=(g.asset&&g.asset.extras&&g.asset.extras.erandel)||(g.parser&&g.parser.json.asset.extras&&g.parser.json.asset.extras.erandel)||{stride:{walk:1.6,run:6}};CHR.lib[k]={scene:g.scene,animations:g.animations,meta:g.meta};}catch(e){CHR.errors.push(k+': '+(e&&e.message||e));}};
  await get('hero','all/chr_all_adventurer.glb');if(CHR.lib.hero)attachHero();
  await Promise.all([get('boar','erelian/cre_erelian_thornback-boar.glb'),get('stag','erelian/cre_erelian_lunar-stag.glb')]);
  if(CHR.lib.boar)W3.monsters.filter(m=>m.b.n==='Thornback Boar').forEach(m=>rigMonster(m,CHR.lib.boar));
  if(CHR.lib.stag)spawnStags(CHR.lib.stag);
  CHR.status=CHR.errors.length?(Object.keys(CHR.lib).length?'partial':'failed'):'ready';
 }catch(e){CHR.status='failed';CHR.errors.push(String(e&&e.message||e));console.warn('Rigged characters did not load; the chibi characters stay',e);}
}
/** Called once from initWorld. */
function charactersInit(){if(!charsWanted())return;CHR.status='waiting';setTimeout(loadCharacters,250);}
/** Per-frame: creatures and wildlife (the player is driven from the movement code via heroTick). */
function charactersTick(dt){if(CHR.status==='off')return;for(const c of CHR.creatures)creatureTick(c,dt);for(const c of CHR.stags)stagTick(c,dt);}
