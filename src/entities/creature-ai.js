/* ---------- enemies ---------- */
function reviveMonster(m){const st=enemyStats(m.b);m.alive=true;m.x=m.hx;m.z=m.hz;m.hp=m.hpMax=st.hp;m.els=[];m.st='wander';m.hit=false;m.cd=0;m.mo.g.visible=true;if(m.glow)m.glow.visible=true;}
function hitMonster(m,dmg,mult,els){
 if(!m.alive)return;const w=W3,p=w.player;dmg=Math.max(1,Math.round(dmg));m.hp-=dmg;m.hit=true;m.flash=.15;w.target=m;
 if(els)els.forEach(e=>{if(e&&!m.els.includes(e))m.els.push(e);});
 const d=Math.hypot(m.x-p.x,m.z-p.z)||1;m.x+=(m.x-p.x)/d*.45;m.z+=(m.z-p.z)/d*.45;
 floatText(m.x,m.mo.g.position.y+2.2,m.z,String(dmg)+(mult>1.1?'!':''),mult>1.1?'#ffe066':mult<.9?'#b8b8c0':'#ffffff',mult>1.1);
 if(m.st==='wander'||m.st==='home')m.st='chase';
 if(m.hp<=0)killMonster(m);
}
function killMonster(m){
 const w=W3;m.alive=false;m.mo.g.visible=false;if(m.glow)m.glow.visible=false;if(m.tele)m.tele.material.opacity=0;m.deadT=w.clock.elapsedTime+ACT.respawn;
 burstFx(m.x,m.mo.g.position.y+1,m.z,m.b.el?ELEM[m.b.el].c:'#ffffff',4);if(w.target===m)w.target=null;
 OUT=[];L(killReward(m.b,m.els),'good');flush();toast(S.log[S.log.length-1].t);save();
}
function monsterStrike(m){
 const w=W3,p=w.player;teleOf(m).material.opacity=0;const my=m.mo.g.position.y;
 if(m.mo.type==='wisp'){const col=m.b.el?ELEM[m.b.el].c:'#cfe8ff';const dx=p.x-m.x,dz=p.z-m.z,d=Math.hypot(dx,dz)||1;spawnProj({from:'enemy',x:m.x,y:my+1.1,z:m.z,vx:dx/d*ACT.boltSpeed,vz:dz/d*ACT.boltSpeed,life:2.2,col,size:1.2,dmg:enemyHitDamage(m.b),src:m});return;}
 ringFx(m.x,my,m.z,ACT.enemyReach,'#ff6a4a',.25);
 const d=Math.hypot(p.x-m.x,p.z-m.z);if(d<=ACT.enemyReach+(m.mo.type==='golem'?.8:0)&&p.y-groundY(p.x,p.z)<1.2)damagePlayer(enemyHitDamage(m.b),m);
}
function damagePlayer(n,m){
 const w=W3,p=w.player,t=w.clock.elapsedTime;
 if(t<p.iUntil||S.hp<=0){floatText(p.x,p.y+2.6,p.z,'Dodged','#bfe4ff');return;}
 hurt(n);p.hitT=.35;floatText(p.x,p.y+2.6,p.z,'-'+n,'#ff6a5a',n>=12);
 document.body.classList.add('hurt');clearTimeout(w.hurtT);w.hurtT=setTimeout(()=>document.body.classList.remove('hurt'),220);
 if(S.hp<=0)playerDown(m);else render();
}
function playerDown(m){
 const w=W3;w.player.downT=1.8;w.grace=w.clock.elapsedTime+5;w.target=null;w.monsters.forEach(o=>{if(o.alive)o.st='home';o.hit=false;if(o.tele)o.tele.material.opacity=0;});
 const n=S.log.length;faint();const lines=S.log.slice(n).map(l=>l.t);
 ui.dialog={type:'battle',title:'You fell',text:(m?`The ${m.b.n} overwhelms you. `:'')+lines.join(' '),el:m?m.b.el:null};render();
}
function updateMonster(m,dt,t,blocked){
 const w=W3,p=w.player,mo=m.mo;
 if(!m.alive){if(t>m.deadT)reviveMonster(m);return;}
 const dxp=p.x-m.x,dzp=p.z-m.z,dp=Math.hypot(dxp,dzp)||.001,homeD=Math.hypot(m.x-m.hx,m.z-m.hz);
 const peace=blocked||w.grace>t||S.hp<=0;let vx=0,vz=0;m.cd-=dt;
 if(peace&&(m.st==='chase'||m.st==='windup'||m.st==='recover')){m.st='home';if(m.tele)m.tele.material.opacity=0;}
 if(m.st==='windup'){m.stT-=dt;turnTo(mo,dxp,dzp,dt);const tl=teleOf(m),k=1-Math.max(0,m.stT)/m.wind,r=mo.type==='wisp'?1:ACT.enemyReach+(mo.type==='golem'?.8:0);tl.scale.setScalar(r*(.35+.65*k));tl.material.opacity=.18+.32*k;tl.position.set(m.x,heightAt(m.x,m.z)+.08,m.z);if(m.stT<=0){monsterStrike(m);m.st='recover';m.stT=.55;}}
 else if(m.st==='recover'){m.stT-=dt;if(m.stT<=0)m.st='chase';}
 else if(m.st==='chase'||(!peace&&dp<ACT.aggro)){
  m.st='chase';
  if(homeD>ACT.leash||(dp>ACT.aggro*2.2&&!m.hit))m.st='home';
  else{const reach=mo.type==='wisp'?7:ACT.enemyReach*.75;if(dp>reach){const sp=mo.type==='golem'?3.2:mo.type==='wisp'?3.6:4.6;vx=dxp/dp*sp;vz=dzp/dp*sp;}else{turnTo(mo,dxp,dzp,dt);if(m.cd<=0){m.st='windup';m.wind=m.stT=ACT.windup*(mo.type==='golem'?1.35:1);m.cd=ACT.enemyCd;}}}
 }
 else if(m.st==='home'){const dx=m.hx-m.x,dz=m.hz-m.z,d=Math.hypot(dx,dz);if(d<1){m.st='wander';m.hit=false;m.hp=m.hpMax;m.els=[];}else{vx=dx/d*5.5;vz=dz/d*5.5;}}
 else{const dx=m.tx-m.x,dz=m.tz-m.z,d=Math.hypot(dx,dz);if(d<.5||Math.random()<dt*.15){m.tx=m.hx+(Math.random()-.5)*16;m.tz=m.hz+(Math.random()-.5)*16;if(regionAt(m.tx,m.tz)!==m.region||plotW(m.tx,m.tz)>0){m.tx=m.hx;m.tz=m.hz;}}else{vx=dx/d*1.6;vz=dz/d*1.6;}}
 m.x+=vx*dt;m.z+=vz*dt;const my=heightAt(m.x,m.z),mv=Math.abs(vx)+Math.abs(vz)>.05;
 if(mo.legL)animChibi(mo,dt,mv);else{mo.t+=dt*(mv?8:2);mo.body.position.y=mo.type==='wisp'?Math.sin(mo.t*.8)*.2:Math.abs(Math.sin(mo.t))*(mv?.1:.03);mo.legs.forEach((l,i)=>{l.rotation.x=mv?Math.sin(mo.t+i*Math.PI)*.5:0;});}
 if(m.st==='windup'&&mo.legL){mo.armR.rotation.x=-2.4;}
 if(mv)turnTo(mo,vx,vz,dt);mo.g.position.set(m.x,my,m.z);
 if(m.flash>0){m.flash-=dt;mo.g.scale.setScalar(m.baseS*1.15);}else mo.g.scale.setScalar(m.baseS);
 if(m.glow)m.glow.position.set(m.x,my+1.1+mo.body.position.y,m.z);
}

