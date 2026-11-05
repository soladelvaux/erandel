/* ---------- targeting and player actions ---------- */
function canAct(){return!!(W3&&ui.screen==='game'&&S&&S.hp>0&&!(ui.dialog||ui.journal||ui.fadeText||ui.build||ui.photo||NET.open));}
function nearestMonster(r){const p=W3.player;let best=null,bd=r*r;W3.monsters.forEach(m=>{if(!m.alive)return;const d=(m.x-p.x)**2+(m.z-p.z)**2;if(d<bd){bd=d;best=m;}});return best;}
function pickTarget(r){const w=W3,p=w.player,t=w.target;if(t&&t.alive&&Math.hypot(t.x-p.x,t.z-p.z)<=r)return t;const n=nearestMonster(r);if(n)w.target=n;return n;}
function faceTo(m){const p=W3.player;p.ch.g.rotation.y=Math.atan2(m.x-p.x,m.z-p.z);}
function playerJump(){if(!canAct())return;const p=W3.player;if(p.ground||p.climb){p.vy=ACT.jumpV*(p.climb?.8:1);p.ground=false;p.climb=false;}}
function playerDodge(){
 if(!canAct())return;const w=W3,p=w.player,t=w.clock.elapsedTime;if(p.cd.dodge>t||p.dodgeT>0)return;
 p.cd.dodge=t+ACT.dodgeCd;let dx=p.inX,dz=p.inZ;if(!dx&&!dz){const ry=p.ch.g.rotation.y;dx=Math.sin(ry);dz=Math.cos(ry);}
 p.dodgeX=dx;p.dodgeZ=dz;p.dodgeT=ACT.dodgeTime;p.iUntil=t+ACT.iframes;p.tx=null;p.climb=false;p.ch.g.rotation.y=Math.atan2(dx,dz);
 netFx({s:'slash',x:p.x,y:p.y-5,z:p.z,r:0});
}
function playerAttack(){
 const w=W3;if(!canAct())return;const p=w.player,t=w.clock.elapsedTime;if(p.cd.atk>t)return;
 p.cd.atk=t+ACT.atkCd;p.atkAnim=.28;p.tx=null;
 const tg=pickTarget(ACT.atkRange+1.5);if(tg)faceTo(tg);
 const ry=p.ch.g.rotation.y,fx=Math.sin(ry),fz=Math.cos(ry);slashFx(p.x,p.y,p.z,ry);
 const base=meleeBase();
 w.monsters.forEach(m=>{if(!m.alive)return;const dx=m.x-p.x,dz=m.z-p.z,d=Math.hypot(dx,dz);if(d>ACT.atkRange+(m.mo.type==='golem'?.7:0))return;if(d>.6&&(dx*fx+dz*fz)/d<Math.cos(ACT.atkArc))return;hitMonster(m,(base+compDamage(m.b))*rnd(.85,1.15),1,null);});
 netFx({s:'slash',x:p.x,y:p.y,z:p.z,r:ry});
}
function castSkill(i){
 const w=W3;if(!canAct())return;const p=w.player,t=w.clock.elapsedTime;const sp=skillSlots()[i];
 if(!sp){toast('No spell here yet. Forge a Bolt, Wave, Summon or Ritual spell on the Magic page of your journal.');return;}
 if(!spellUsable(sp)){toast('Your god is silent while Corruption is higher than Fate.');return;}
 const C=ACT.skill[sp.form],key='s'+i;if((p.cd[key]||0)>t)return;
 if(p.mp<C.mp){floatText(p.x,p.y+2.6,p.z,'Not enough focus','#9ab8ff');return;}
 p.mp-=C.mp;p.cd[key]=t+C.cd;p.castAnim=.4;p.tx=null;
 if(sp.src==='life'){hurt(3);floatText(p.x,p.y+2.6,p.z,'-3','#ff6a5a');if(S.hp<=0){playerDown(null);return;}}
 if(sp.src==='contract')addCorr(1);
 const col=ELEM[sp.e1].c,els=[sp.e1,sp.e2].filter(Boolean);
 const dmgFn=m=>skillDamage(sp,m.b.el)*rnd(.9,1.1),multFn=m=>spellMult(sp,m.b.el);
 const tg=pickTarget(sp.form==='bolt'?C.range:sp.form==='ritual'?14:(C.r||6)+2);if(tg)faceTo(tg);
 const ry=p.ch.g.rotation.y,fx=Math.sin(ry),fz=Math.cos(ry);let tx=p.x+fx*5,tz=p.z+fz*5;
 if(sp.form==='bolt'){const v=16;spawnProj({from:'me',x:p.x+fx*.6,y:p.y+1.2,z:p.z+fz*.6,vx:fx*v,vz:fz*v,life:C.range/v,col,size:1.1,home:tg,dmgFn,multFn,els});if(tg){tx=tg.x;tz=tg.z;}}
 else if(sp.form==='wave'){ringFx(p.x,p.y,p.z,C.r,col,.45);burstFx(p.x,p.y+.8,p.z,col,3);w.monsters.forEach(m=>{if(m.alive&&Math.hypot(m.x-p.x,m.z-p.z)<=C.r)hitMonster(m,dmgFn(m),multFn(m),els);});tx=p.x;tz=p.z;}
 else if(sp.form==='summon'){const g=mkGlow(col,1.3,.95);w.scene.add(g);w.summons.push({until:t+C.dur,next:t+.6,s:g,a:0,dmgFn,multFn,els,col});}
 else if(sp.form==='ritual'){if(tg){tx=tg.x;tz=tg.z;}const y=groundY(tx,tz);const mk=new THREE.Mesh(fxGeo().ring,fxMat(col,.8));mk.rotation.x=-Math.PI/2;mk.position.set(tx,y+.12,tz);mk.scale.setScalar(C.r);w.scene.add(mk);w.rites.push({x:tx,z:tz,y,at:t+C.delay,mk,col,dmgFn,multFn,els,r:C.r});}
 netFx({s:sp.form,x:p.x,y:p.y,z:p.z,r:ry,e:sp.e1,tx,tz});
 render();
}
function spawnProj(o){const s=mkGlow(o.col,o.size||1,1);s.position.set(o.x,o.y,o.z);W3.scene.add(s);o.s=s;W3.projs.push(o);return o;}
function updateProjs(dt){
 const w=W3,p=w.player;
 w.projs=w.projs.filter(o=>{
  o.life-=dt;
  if(o.home&&o.home.alive){const dx=o.home.x-o.x,dz=o.home.z-o.z,d=Math.hypot(dx,dz)||1,sp=Math.hypot(o.vx,o.vz),k=Math.min(1,dt*6);o.vx+=(dx/d*sp-o.vx)*k;o.vz+=(dz/d*sp-o.vz)*k;o.y+=(o.home.mo.g.position.y+1-o.y)*Math.min(1,dt*4);}
  o.x+=o.vx*dt;o.z+=o.vz*dt;o.s.position.set(o.x,o.y,o.z);let hit=false;
  if(o.from==='enemy'){if(Math.hypot(p.x-o.x,p.z-o.z)<.9&&Math.abs(p.y+1-o.y)<1.3){damagePlayer(o.dmg,o.src);hit=true;}}
  else if(o.from==='me'){for(const m of w.monsters){if(m.alive&&Math.hypot(m.x-o.x,m.z-o.z)<1.1){hitMonster(m,o.dmgFn(m),o.multFn(m),o.els);hit=true;break;}}}
  if(hit)burstFx(o.x,o.y,o.z,o.col,2);
  if(hit||o.life<=0){w.scene.remove(o.s);o.s.material.dispose();return false;}return true;});
}
function updateSummons(dt,t){
 const w=W3,p=w.player,C=ACT.skill.summon;
 w.summons=w.summons.filter(o=>{o.a+=dt*2.4;const sp=o.s.position;sp.set(p.x+Math.cos(o.a)*1.3,p.y+1.9+Math.sin(o.a*2)*.2,p.z+Math.sin(o.a)*1.3);
  if(t>=o.next){o.next=t+C.tick;const m=nearestMonster(C.r);if(m){const dx=m.x-sp.x,dz=m.z-sp.z,d=Math.hypot(dx,dz)||1;spawnProj({from:'me',x:sp.x,y:sp.y,z:sp.z,vx:dx/d*14,vz:dz/d*14,life:1,col:o.col,size:.7,home:m,dmgFn:mm=>o.dmgFn(mm)*C.share,multFn:o.multFn,els:o.els});}}
  if(t>o.until){burstFx(sp.x,sp.y,sp.z,o.col,2);w.scene.remove(o.s);o.s.material.dispose();return false;}return true;});
}
function updateRites(t){
 const w=W3;w.rites=w.rites.filter(o=>{o.mk.material.opacity=.4+.4*Math.sin(t*14);o.mk.rotation.z+=.05;if(t<o.at)return true;
  w.scene.remove(o.mk);o.mk.material.dispose();ringFx(o.x,o.y,o.z,o.r,o.col,.5);burstFx(o.x,o.y+1,o.z,o.col,7);
  w.monsters.forEach(m=>{if(m.alive&&Math.hypot(m.x-o.x,m.z-o.z)<=o.r)hitMonster(m,o.dmgFn(m),o.multFn(m),o.els);});return false;});
}

