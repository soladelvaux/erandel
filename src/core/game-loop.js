/* ---------- main loop ---------- */
const LIGHT={
 0:{sky:'#ffe0b8',gnd:'#4a5a3a',hi:.85,sun:'#ffd59a',si:.95,fog:'#e2cfae',night:.15,water:'#3f7f9a'},
 1:{sky:'#e4f3ff',gnd:'#55704a',hi:.95,sun:'#fff4dc',si:1.05,fog:'#bcd8e6',night:0,water:'#3a86a8'},
 2:{sky:'#6a5a86',gnd:'#2a1c12',hi:.58,sun:'#a0a8e0',si:.26,fog:'#1e150f',night:1,water:'#18303e'},
};
const keys=new Set();const stick={x:0,y:0};
function updatePlayerChar(){const p=W3.player;if(p.race!==S.race){p.race=S.race;if(p.ch)W3.scene.remove(p.ch.g);p.ch=makeChibi(charSpec(S.race),1.2);W3.scene.add(p.ch.g);}}
function updateComp(){const c=W3.comp;const want=S.comp?S.comp.race:null;if(c.race!==want){c.race=want;if(c.ch){W3.scene.remove(c.ch.g);c.ch=null;}if(want){c.ch=makeChibi(charSpec(want),1.1);c.x=W3.player.x-1.5;c.z=W3.player.z+1;W3.scene.add(c.ch.g);}}}
function respawnMonsters(){W3.monsters.forEach(reviveMonster);}
/** How far the camera can sit behind the player before terrain or a big landmark blocks it (trees dissolve instead). */
function camClear(fx,fy,fz,ox,oy,oz,dist){
 const C=W3.COL;let best=dist;
 for(let i=1;i<=12;i++){const d=dist*i/12,x=fx+ox*d,y=fy+oy*d,z=fz+oz*d;if(groundY(x,z)+.35>y){best=Math.max(ACT.camMin*.75,d-dist/12);break;}}
 const cx=Math.floor(fx/4),cz=Math.floor(fz/4),R=Math.ceil(best/4)+1;
 for(let i=-R;i<=R;i++)for(let j=-R;j<=R;j++){const L2=C.get((cx+i)+','+(cz+j));if(!L2)continue;for(const c of L2){if(c.cr<1)continue;const rx=c.x-fx,rz=c.z-fz,hl=Math.hypot(ox,oz)||1,ux=ox/hl,uz=oz/hl,along=rx*ux+rz*uz;if(along<.8||along>best*hl)continue;const perp=Math.abs(rx*uz-rz*ux),rr=c.cr+.25;if(perp>=rr)continue;const dh=(along-Math.sqrt(Math.max(0,rr*rr-perp*perp)))/hl,y=fy+oy*dh;if(y>c.hi+.3||y<c.lo-.5)continue;const d=Math.max(ACT.camMin*.75,dh);if(d<best)best=d;}}
 return best;
}
/** Pushes a circle at (x,z) out of trees, rocks and landmarks. */
function collide(o,r){const C=W3.COL,cx=Math.floor(o.x/4),cz=Math.floor(o.z/4);for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const L2=C.get((cx+i)+','+(cz+j));if(!L2)continue;for(const c of L2){const dx=o.x-c.x,dz=o.z-c.z,d=Math.hypot(dx,dz),m=c.r+r;if(d<m&&d>1e-4){o.x=c.x+dx/d*m;o.z=c.z+dz/d*m;}}}}
function assignLights(cx,cz,nf){
 const w=W3;const sorted=w.LIGHTS.map(l=>({l,d:(l.x-cx)**2+(l.z-cz)**2})).sort((a,b)=>a.d-b.d);
 w.plights.forEach((pl,i)=>{const o=sorted[i];if(o&&o.d<900){pl.position.set(o.l.x,o.l.y,o.l.z);pl.color.set(o.l.col);pl.userData.target=o.l.str*1.15*nf;}else pl.userData.target=0;});
}
function loop(){
 requestAnimationFrame(loop);
 const w=W3,dt=Math.min(w.clock.getDelta(),.05),t=w.clock.elapsedTime;
 const playing=ui.screen==='game'&&S;
 const ti=playing?(PERF&&PERF.night?2:timeIdx()):2;const L0=LIGHT[ti];const wx=playing?weatherHere():'clear';
 _c1.set(L0.fog);if(wx==='rain'||wx==='storm')_c1.lerp(_c2.set(ti===2?'#101420':'#7a8696'),.5);if(wx==='snow')_c1.lerp(_c2.set('#e8eef4'),ti===2?.15:.45);if(wx==='fog')_c1.lerp(_c2.set('#b8bcc0'),ti===2?.15:.5);if(wx==='heat')_c1.lerp(_c2.set('#f0c890'),.3);
 const k=Math.min(1,dt*2);w.scene.fog.color.lerp(_c1,k);w.scene.background.lerp(_c1,k);
 w.hemi.color.lerp(_c2.set(L0.sky),k);w.hemi.groundColor.lerp(_c2.set(L0.gnd),k);w.hemi.intensity+=(L0.hi*(wx==='storm'||wx==='rain'?.8:1)-w.hemi.intensity)*k;
 w.sun.color.lerp(_c2.set(L0.sun),k);w.sun.intensity+=(L0.si*(wx==='storm'||wx==='rain'||wx==='fog'?.55:1)-w.sun.intensity)*k;
 w.water.material.color.lerp(_c2.set(L0.water),k);
 const cd=w.camDist;const fogFar=cd+(wx==='fog'?45:120);w.scene.fog.far+=(fogFar-w.scene.fog.far)*k;w.scene.fog.near+=(cd+(wx==='fog'?-8:12)-w.scene.fog.near)*k;
 if(wx==='storm'&&Math.random()<dt*.15)w.flash=1;if(w.flash>0){w.hemi.intensity+=w.flash*1.2;w.flash=Math.max(0,w.flash-dt*4);}
 const nf=L0.night+(wx==='rain'||wx==='storm'||wx==='fog'?.25:0)+(playing&&S.region==='stonedeep'?.5:0);
 w.glows.forEach(g=>{const target=nf>.5?g.night:g.base+(g.night-g.base)*nf;let tg=target*(g.pulse?(.82+.18*Math.sin(t*2.3+(g.s.position.x))):1);if(g.fire){g.fire.t+=dt;g.s.position.set(g.fire.x+Math.sin(g.fire.t*.4)*1.5,g.fire.y+Math.sin(g.fire.t*1.1)*.5,g.fire.z+Math.cos(g.fire.t*.3)*1.5);tg=nf>.5?target*(.5+.5*Math.sin(g.fire.t*3)):0;}g.s.material.opacity+=(tg-g.s.material.opacity)*k;});
 w.flick.forEach(f=>{if(f.win)f.win.visible=nf>.3;});
 w.plights.forEach(pl=>{pl.intensity+=((pl.userData.target||0)-pl.intensity)*k;});
 if(w.bloom){const nn=clamp(nf-(playing&&S.region==='stonedeep'?.5:0),0,1);w.bloom.strength+=((.08+.5*nn)-w.bloom.strength)*k;w.bloom.threshold+=((.99-.13*nn)-w.bloom.threshold)*k;w.bloom.radius=.3+.15*nn;}
 w.wisps.forEach(o=>{o.t+=dt;o.s.position.set(o.x+Math.sin(o.t*.5)*1.5,o.y+Math.sin(o.t*1.3)*.5,o.z+Math.cos(o.t*.4)*1.5);});
 w.flies.forEach(o=>{o.t+=dt;o.s.position.set(o.x+Math.sin(o.t*.6)*3,heightAt(o.x,o.z)+1.6+Math.abs(Math.sin(o.t*5))*.5,o.z+Math.cos(o.t*.45)*3);o.s.rotation.y=o.t*.6;o.s.children.forEach((c,i)=>{c.rotation.y=(i?-1:1)*Math.sin(o.t*16)*.9;});});
 const near=(n,d)=>playing&&(w.player.x-n.x)**2+(w.player.z-n.z)**2<d;
 w.npcs.forEach(n=>{animChibi(n.ch,dt,false);if(near(n,40))turnTo(n.ch,w.player.x-n.x,w.player.z-n.z,dt);n.ch.g.position.y=heightAt(n.x,n.z);});
 const ael=w.npcs.find(n=>n.special);if(ael.ch.orb){ael.ch.orb.getWorldPosition(_v);w.aelGlow.position.copy(_v);}w.aelGlow.material.opacity=.5+.25*Math.sin(t*2.2);
 w.lightT-=dt;
 if(!playing){
  if(w.camera.fov!==36){w.camera.fov=36;w.camera.updateProjectionMatrix();}if(TAGS.map.size)sweepTags();erelianTick(dt,t,nf);updateSky(nf,dt);
  FADE.value.set(0,-999,0);
  w.orbit+=dt*.05;const cx=14,cz=42,cy=1,ok=clamp(1.3/w.camera.aspect,1,2.2);w.camDist=30*ok;w.camera.position.set(cx+Math.sin(w.orbit)*24*ok,cy+20*ok,cz+Math.cos(w.orbit)*24*ok);w.camera.lookAt(cx,cy,cz);
  if(w.lightT<=0){w.lightT=.3;assignLights(cx,cz,1);}
  w.points.visible=false;document.body.classList.remove('under');renderFrame();return;
 }
 updatePlayerChar();updateComp();setGhost();
 const p=w.player;
 if(!w.ready){w.ready=true;p.mp=mpMax();respawnMonsters();}
 if(window.__teleport){p.x=S.pos.x;p.z=S.pos.z;p.y=groundY(p.x,p.z);p.vy=0;p.ground=true;p.climb=false;window.__teleport=false;w.camInit=false;p.tx=null;}
 if(S.day!==w.lastDay){w.lastDay=S.day;respawnMonsters();}
 const blocked=!!(ui.dialog||ui.journal||ui.fadeText||ui.build||ui.photo||NET.open);
 // third-person movement: input is relative to the camera
 let mx=0,mz=0;
 if(!blocked){if(keys.has('a')||keys.has('arrowleft'))mx-=1;if(keys.has('d')||keys.has('arrowright'))mx+=1;if(keys.has('w')||keys.has('arrowup'))mz-=1;if(keys.has('s')||keys.has('arrowdown'))mz+=1;mx+=stick.x;mz+=stick.y;}
 if(Math.hypot(mx,mz)>.12)p.tx=null;
 const cyw=w.cam.yaw,cs=Math.cos(cyw),sn=Math.sin(cyw);let ix=cs*mx+sn*mz,iz=-sn*mx+cs*mz;
 if(p.tx!=null&&!blocked){const dx=p.tx-p.x,dz=p.tz-p.z,d=Math.hypot(dx,dz);if(d<.3)p.tx=null;else{ix=dx/d;iz=dz/d;}}
 const ml=Math.hypot(ix,iz);let moving=ml>.12&&!blocked;p.inX=moving?ix/ml:0;p.inZ=moving?iz/ml:0;p.climbMove=false;
 if(p.dodgeT>0){p.dodgeT-=dt;const v=ACT.dodgeDist/ACT.dodgeTime;p.x+=p.dodgeX*v*dt;p.z+=p.dodgeZ*v*dt;}
 else if(moving){
  let sp=ACT.runSpeed*Math.min(1,ml)*(p.ground?1:.85)*dt;const ux=ix/ml,uz=iz/ml;
  // climbing: steep rock ahead slows you to a climb instead of a run
  const ahead=groundY(p.x+ux*.6,p.z+uz*.6)-groundY(p.x,p.z),steep=ahead/.6;
  if(p.ground&&steep>1.05){p.climb=true;p.climbMove=true;sp=Math.min(sp,2.6*dt/steep);}else if(steep<.7)p.climb=false;
  p.x+=ux*sp;p.z+=uz*sp;if(p.atkAnim<=0&&p.castAnim<=0)turnTo(p.ch,ix,iz,dt);
 }else if(p.climb&&groundY(p.x+Math.sin(p.ch.g.rotation.y)*.6,p.z+Math.cos(p.ch.g.rotation.y)*.6)-groundY(p.x,p.z)<.5)p.climb=false;
 p.x=clamp(p.x,WB.minX+4,WB.maxX-4);p.z=clamp(p.z,WB.minZ+4,WB.maxZ-4);collide(p,.35);
 const gy=groundY(p.x,p.z);
 if(!p.ground||p.vy>0){p.vy-=ACT.gravity*dt;p.y+=p.vy*dt;if(p.y<=gy){p.y=gy;p.vy=0;p.ground=true;}}else p.y=gy;
 const py=p.y;
 animChibi(p.ch,dt,moving&&p.ground&&!p.climb);posePlayer(p,dt);p.ch.g.position.set(p.x,py,p.z);p.ry=p.ch.g.rotation.y;
 p.mp=Math.min(mpMax(),p.mp+ACT.mpRegen*dt);
 p.anim=p.dodgeT>0?'dodge':p.climb?'climb':p.atkAnim>0?'atk':p.castAnim>0?'cast':!p.ground?'jump':moving?'run':'idle';
 const c=w.comp;if(c.ch){const tx=p.x-Math.sin(p.ch.g.rotation.y)*1.6,tz=p.z-Math.cos(p.ch.g.rotation.y)*1.6;const dx=tx-c.x,dz=tz-c.z,d=Math.hypot(dx,dz);const cm=d>.3;if(cm){const s=Math.min(d,9*dt*(d>3?1.6:1));c.x+=dx/d*s;c.z+=dz/d*s;turnTo(c.ch,dx,dz,dt);}animChibi(c.ch,dt,cm);c.ch.g.position.set(c.x,groundY(c.x,c.z),c.z);}
 const reg=regionAt(p.x,p.z);if(reg!==S.region)setRegion(reg);
 const und=reg==='coral'&&py<-.6;document.body.classList.toggle('under',und);w.water.material.opacity+=((und?.2:.72)-w.water.material.opacity)*Math.min(1,dt*3);
 w.monsters.forEach(m=>updateMonster(m,dt,t,blocked));
 updateProjs(dt);updateSummons(dt,t);updateRites(t);updateFx(dt);updatePeers(dt,t);
 updateCustomers(dt,t);
 let best=null,bd=12;w.npcs.forEach(n=>{const d=(p.x-n.x)**2+(p.z-n.z)**2;if(d<bd){bd=d;best=n;}});
 if(best!==w.talk){w.talk=best;const b=document.getElementById('b-talk');b.textContent=best?`Talk · ${best.name}`:'Talk';b.disabled=!best;b.classList.toggle('away',!best);}
 const rainy=wx==='rain'||wx==='storm',snowy=wx==='snow';w.points.visible=rainy||snowy;
 if(w.points.visible){const a=w.points.geometry.attributes.position;const sp=snowy?3:26;w.pmat.size=snowy?.32:.16;w.pmat.color.set(snowy?'#ffffff':'#cfdcf0');for(let i=0;i<a.count;i++){let y=a.getY(i)-sp*dt;if(y<0)y+=26;a.setY(i,y);if(snowy)a.setX(i,a.getX(i)+Math.sin(t+i)*dt*.6);}a.needsUpdate=true;w.points.position.set(p.x,py-2,p.z);}
 // camera: overhead in build mode, close third-person otherwise
 let fx,fy,fz;const wantFov=ui.build?36:58;if(w.camera.fov!==wantFov){w.camera.fov=wantFov;w.camera.updateProjectionMatrix();}
 if(ui.build){const kb=clamp(1.2/w.camera.aspect,1,2.3)*w.zoom;fx=w.buildCam.x;fy=PLOT.land;fz=w.buildCam.z;w.camDist=34*kb;_v.set(fx,fy+25*kb,fz+21*kb);}
 else{const cam=w.cam,port=clamp(1.15/w.camera.aspect,1,1.45),dist=clamp(6.5*w.zoom*port,ACT.camMin,ACT.camMax),cp=Math.cos(cam.pitch),spp=Math.sin(cam.pitch);w.camDist=dist;
  fx=p.x;fy=py+1.35;fz=p.z;const ox=Math.sin(cam.yaw)*cp,oy=spp,oz=Math.cos(cam.yaw)*cp;const dd=camClear(fx,fy,fz,ox,oy,oz,dist);
  w.camD=w.camD==null||dd<w.camD?dd:w.camD+(dd-w.camD)*Math.min(1,dt*3);
  _v.set(fx+ox*w.camD,fy+oy*w.camD,fz+oz*w.camD);
  let gmin=groundY(_v.x,_v.z)+.6;if(!und)gmin=Math.max(gmin,.4);if(_v.y<gmin)_v.y=gmin;}
 if(!w.camInit){w.camera.position.copy(_v);w.look.set(fx,fy,fz);w.camInit=true;}
 const ck=ui.build?4:14,lk=ui.build?5:20;w.camera.position.lerp(_v,Math.min(1,dt*ck));w.look.x+=(fx-w.look.x)*Math.min(1,dt*lk);w.look.y+=(fy-w.look.y)*Math.min(1,dt*lk);w.look.z+=(fz-w.look.z)*Math.min(1,dt*lk);w.camera.lookAt(w.look);
 if(w.lightT<=0){w.lightT=.3;assignLights(w.look.x,w.look.z,nf);}
 // build helpers
 w.grid.visible=!!ui.build;
 if(ui.build&&w.hover){const t2=w.hover;const isRem=ui.build.tool==='remove';const it={t:ui.build.sel,c:t2.c,r:t2.r,rot:ui.build.rot};const[sw,sd]=isRem?[1,1]:itemSize(it);const ok=isRem?true:!canPlace(it.t,t2.c,t2.r,it.rot)&&canAfford(itemCost(it.t));
  w.hilite.visible=true;w.hilite.scale.set(sw*PLOT.t,sd*PLOT.t,1);w.hilite.position.set(PLOT.x0+(t2.c+sw/2)*PLOT.t,PLOT.land+.05,PLOT.z0+(t2.r+sd/2)*PLOT.t);w.hilite.material.color.set(isRem?'#ff8a6a':ok?'#9af0a0':'#ff6a6a');
  if(w.ghost){w.ghost.visible=!isRem;const[gx,gz]=itemCenter(it);w.ghost.position.set(gx,CATALOG[it.t].where==='water'?0:(hasFloor(t2.c,t2.r)&&CATALOG[it.t].layer==='obj'?PLOT.deck:PLOT.land),gz);}}
 else{w.hilite.visible=false;if(w.ghost)w.ghost.visible=false;}
 w.saveT+=dt;if(w.saveT>1.5){w.saveT=0;S.pos={x:Math.round(p.x*10)/10,z:Math.round(p.z*10)/10};save();}
 FADE.value.set(p.x,ui.build?-999:py,p.z);w.plamp.position.set(p.x,py+2.4,p.z);w.plamp.intensity+=(Math.min(1,nf)*.9-w.plamp.intensity)*Math.min(1,dt*4);
 erelianTick(dt,t,nf);updateSky(nf,dt);drawTags();sweepTags();
 w.uiT-=dt;if(w.uiT<=0){w.uiT=.1;updateActionUi(t);drawMini();}
 w.netT-=dt;if(w.netT<=0){w.netT=2;renderNet();}
 netSend(dt);
 renderFrame();
}
/** Performance overlay, only with ?perf in the address (diagnostic; see production/qa/mobile-perf-test-plan.md). */
