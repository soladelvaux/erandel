/* ---------- characters (3D chibi) ---------- */
const GROUP_SKIN={sea:'#b9d8d0',night:'#dcd4e2',nature:'#e8c9a0',sky:'#e8d2b0',elemental:'#d9b48a',beast:'#d9b48a',divine:'#f0dcc4',small:'#e2b890'};
function shade(hex,f){const c=hexRgb(hex).map(v=>clamp(f>0?v+(1-v)*f:v*(1+f),0,1));return'#'+c.map(v=>Math.round(v*255).toString(16).padStart(2,'0')).join('');}
function charSpec(rid){
 const r=RACES[rid];const s={skin:GROUP_SKIN[r.group],hair:'#4a3020',robe:r.home?shade(ELEM[r.home].c,-.3):'#5a6a90',eye:'#1a1420'};
 s.robe2=shade(s.robe,-.35);s.legs=shade(s.robe,-.55);
 const set=o=>Object.assign(s,o);
 ({merfolk:()=>set({hair:'#2f8f9a',tail:'#2f8f9a'}),sirens:()=>set({hair:'#9ad0e8',longHair:true}),selkies:()=>set({hair:'#5a5048'}),nereids:()=>set({hair:'#e8f0f0',longHair:true}),
  vampires:()=>set({skin:'#ece4ec',hair:'#1a1418',eye:'#ff3040',robe:'#3a1a24',robe2:'#1e0e14'}),werewolves:()=>set({skin:'#8a8a8e',hair:'#5a5a60',ears:'wolf',tail:'#6a6a70'}),
  ghouls:()=>set({skin:'#a0a890',hair:'#3a3a32'}),shades:()=>set({skin:'#2a2440',hair:'#1a1628',eye:'#a8f0ff',robe:'#221c34',robe2:'#14101f'}),
  nymphs:()=>set({hair:'#7ab85a',longHair:true}),elves:()=>set({hair:'#e8dca0',ears:'elf',longHair:true}),fae:()=>set({hair:'#e89ad0',ears:'elf',wings:'#f0d8ff'}),
  treants:()=>set({skin:'#6a4a2a',hair:'#5a9a4a',robe:'#5a3a22',robe2:'#3a2414'}),satyrs:()=>set({hair:'#6a4a2a',horns:'#d8c8a8'}),
  harpies:()=>set({hair:'#7a5a3a',wings:'#8a6a4a'}),birdfolk:()=>set({hair:'#c8a070',wings:'#c8a070'}),sylphs:()=>set({skin:'#e6f4f6',hair:'#cfe8f0',wings:'#dff2f8',longHair:true}),tengu:()=>set({hair:'#1a1a22',wings:'#1a1a22',skin:'#d0a080'}),
  salamanders:()=>set({skin:'#e07a4a',hair:'#ffb040',tail:'#e07a4a'}),golems:()=>set({skin:'#8a8a80',hair:'#6a6a62',robe:'#7a7a70',robe2:'#5a5a52',eye:'#7ad0ff'}),
  djinn:()=>set({skin:'#7a9ad8',hair:'#2a2a4a',eye:'#ffd060'}),frostkin:()=>set({skin:'#cfe6f2',hair:'#ffffff'}),
  kitsune:()=>set({hair:'#e08a3a',ears:'fox',tail:'#e08a3a',bigTail:true}),nekomata:()=>set({hair:'#3a3040',ears:'fox',tail:'#3a3040'}),minotaurs:()=>set({skin:'#7a5a3a',hair:'#4a3020',horns:'#e8e0c8'}),
  centaurs:()=>set({hair:'#8a5a2a'}),lizardfolk:()=>set({skin:'#6a9a5a',hair:'#3a6a3a',tail:'#5a8a5a'}),
  seraphs:()=>set({hair:'#f2e2a0',wings:'#f8f4e8',robe:'#e8e0c8',robe2:'#c8b890'}),fallen:()=>set({hair:'#2a2430',wings:'#2a2430'}),
  demons:()=>set({skin:'#b84a4a',hair:'#1a1010',horns:'#2a1a1a',tail:'#8a2a2a',eye:'#ffcf40'}),tieflings:()=>set({skin:'#c87a9a',hair:'#3a1a3a',horns:'#3a2a3a'}),
  liches:()=>set({skin:'#e8e4d8',hair:'#e8e4d8',eye:'#a070ff',robe:'#3a2a5a',robe2:'#22183a'}),
  dwarves:()=>set({hair:'#b0502a',beard:'#b0502a',short:true}),gnomes:()=>set({hair:'#e8e8f0',short:true,hat:'#c84a3a'}),halflings:()=>set({hair:'#7a5a3a',short:true}),
  goblins:()=>set({skin:'#7aa05a',hair:'#2a2a1a',ears:'elf',short:true}),humans:()=>set({hair:'#5a3a22'}),
 }[rid]||(()=>{}))();
 return s;
}
const NPC_SPEC={
 ysolde:{skin:'#e8c4a0',hair:'#8a3a22',robe:'#7a5a3a',robe2:'#5a3a22',legs:'#3a2a1a',eye:'#1a1420',apron:true},
 maren:{skin:'#b9d8d0',hair:'#3aa0b0',robe:'#1f6a7a',robe2:'#124a56',legs:'#124a56',eye:'#1a1420',crown:true,longHair:true,tail:'#2f8f9a'},
 bramble:{skin:'#e8d0a8',hair:'#e0d8a0',robe:'#3f7a3a',robe2:'#2a5226',legs:'#22401e',eye:'#1a1420',ears:'elf',longHair:true},
 kesh:{skin:'#8a5a3a',hair:'#1a1010',robe:'#5a2a1a',robe2:'#3a1a10',legs:'#2a140c',eye:'#1a1420',hammer:true},
 tovin:{skin:'#e0c0a0',hair:'#c8a070',robe:'#6a7a8a',robe2:'#4a5a6a',legs:'#33404c',eye:'#1a1420',wings:'#c8a070'},
 hilde:{skin:'#cfe6f2',hair:'#ffffff',robe:'#5a7a9a',robe2:'#3a5a7a',legs:'#2a4058',eye:'#1a1420'},
 durgan:{skin:'#e0b890',hair:'#c0602a',beard:'#c0602a',robe:'#4a4a52',robe2:'#2e2e34',legs:'#22222a',eye:'#1a1420',short:true,hammer:true},
 nyx:{skin:'#c8c4d8',hair:'#1a1628',robe:'#2a2440',robe2:'#18142a',legs:'#14101f',eye:'#a8f0ff',hood:'#3a3456'},
 aldric:{skin:'#e8c8a0',hair:'#8a8a8a',robe:'#e8e2d0',robe2:'#c8b890',legs:'#9a8a6a',eye:'#1a1420'},
 selune:{skin:'#e6e4f2',hair:'#d8dcf0',robe:'#3a4a8a',robe2:'#26326a',legs:'#1c2650',eye:'#1a1420',longHair:true},
 aelarion:{skin:'#f0dcc0',hair:'#ecdca0',robe:'#2f6a3a',robe2:'#c8a850',legs:'#1f4a28',eye:'#2a5a30',ears:'elf',longHair:true,staff:'#8af09a'},
};
const MAT={},GEO={};let GT=null;
function mat(col,o){const k=col+'|'+(o?Object.keys(o).map(x=>x+':'+(o[x]&&o[x].isColor?o[x].getHexString():o[x])).join(','):'');if(!MAT[k])MAT[k]=charMaterial(Object.assign({color:col},o||{}));return MAT[k];}
function bmat(col){const k='B'+col;if(!MAT[k])MAT[k]=new THREE.MeshBasicMaterial({color:col});return MAT[k];}
function geo(k,f){return GEO[k]||(GEO[k]=f());}
const DARK_EYES=['#1a1420','#2a5a30'];
function makeChibi(s,scale){
 const g=new THREE.Group(),body=new THREE.Group();g.add(body);
 const P=(gm,m,x,y,z,parent)=>{const me=new THREE.Mesh(gm,typeof m==='string'?mat(m):m);me.position.set(x,y,z);(parent||body).add(me);return me;};
 const sph=r=>geo('s'+r,()=>new THREE.SphereGeometry(r,14,10));
 P(geo('torso',()=>new THREE.CylinderGeometry(.3,.42,.62,12)),s.robe,0,.52,0);
 P(geo('belt',()=>new THREE.CylinderGeometry(.335,.36,.07,12)),s.robe2,0,.6,0);
 if(s.apron)P(geo('apron',()=>new THREE.BoxGeometry(.36,.42,.05)),'#e8e0d0',0,.44,.37);
 const limb=(k,r1,r2,h)=>geo(k,()=>{const c=new THREE.CylinderGeometry(r1,r2,h,8);c.translate(0,-h/2,0);return c;});
 const legL=new THREE.Group(),legR=new THREE.Group();legL.position.set(-.14,.26,0);legR.position.set(.14,.26,0);body.add(legL,legR);
 P(limb('leg',.09,.1,.26),s.legs,0,0,0,legL);P(limb('leg',.09,.1,.26),s.legs,0,0,0,legR);
 const armL=new THREE.Group(),armR=new THREE.Group();armL.position.set(-.37,.78,0);armR.position.set(.37,.78,0);armL.rotation.z=-.25;armR.rotation.z=.25;body.add(armL,armR);
 P(limb('arm',.07,.08,.34),s.robe,0,0,0,armL);P(limb('arm',.07,.08,.34),s.robe,0,0,0,armR);P(sph(.08),s.skin,0,-.36,0,armL);P(sph(.08),s.skin,0,-.36,0,armR);
 const head=new THREE.Group();head.position.set(0,1.22,0);body.add(head);
 P(sph(.42),s.skin,0,0,0,head);
 const cap=P(geo('cap',()=>new THREE.SphereGeometry(.45,14,10,0,Math.PI*2,0,Math.PI*.5)),s.hair,0,.03,-.04,head);cap.rotation.x=-.3;
 if(s.longHair){const lh=P(geo('lh2',()=>new THREE.SphereGeometry(.4,14,10)),s.hair,0,-.22,-.2,head);lh.scale.set(1.02,1.1,.55);}
 const em=DARK_EYES.includes(s.eye)?mat(s.eye):bmat(s.eye);
 [-.14,.14].forEach(x=>{const e=P(geo('eye',()=>new THREE.SphereGeometry(.065,8,6)),em,x,-.03,.38,head);e.scale.set(1,1.35,.6);if(SPRING){e.scale.set(1.25,1.65,.6);P(geo('eyehi',()=>new THREE.SphereGeometry(.022,6,4)),bmat('#ffffff'),x+.025,.02,.425,head);}});
 [-.24,.24].forEach(x=>{const b=P(geo('blush',()=>new THREE.CircleGeometry(.06,10)),mat('#f0a0a0',{transparent:true,opacity:.5}),x,-.14,.37,head);b.rotation.y=x>0?.4:-.4;});
 if(s.ears==='elf')[-1,1].forEach(sd=>{const e=P(geo('ear',()=>new THREE.ConeGeometry(.08,.34,6)),s.skin,sd*.43,.02,0,head);e.rotation.z=-sd*1.25;});
 if(s.ears==='wolf'||s.ears==='fox')[-1,1].forEach(sd=>{P(geo('ear2',()=>new THREE.ConeGeometry(.13,.26,6)),s.hair,sd*.24,.4,0,head).rotation.z=-sd*.2;});
 if(s.horns)[-1,1].forEach(sd=>{P(geo('horn',()=>new THREE.ConeGeometry(.07,.32,6)),s.horns,sd*.22,.42,.04,head).rotation.z=-sd*.4;});
 if(s.crown){const c=P(geo('crown',()=>new THREE.TorusGeometry(.22,.045,6,14)),mat('#e8c050',{emissive:new THREE.Color('#5a4010')}),0,.42,0,head);c.rotation.x=Math.PI/2;}
 if(s.hood){const h=P(geo('hood',()=>new THREE.SphereGeometry(.5,14,10,0,Math.PI*2,0,Math.PI*.62)),s.hood,0,.04,-.03,head);h.rotation.x=-.2;}
 if(s.beard)P(sph(.26),s.beard,0,-.33,.22,head).scale.set(1,.85,.7);
 if(s.hat){const h=P(geo('hat',()=>new THREE.ConeGeometry(.62,.32,14)),s.hat===true?'#d8b870':s.hat,0,.46,0,head);}
 const wings=[];
 if(s.wings){const wm=new THREE.MeshLambertMaterial({color:s.wings,side:THREE.DoubleSide,transparent:true,opacity:.92});[-1,1].forEach(sd=>{const wg=new THREE.Group();wg.position.set(sd*.12,.9,-.32);const w=new THREE.Mesh(geo('wing',()=>{const p=new THREE.PlaneGeometry(.6,.78);p.translate(.3,.08,0);return p;}),wm);w.scale.x=sd;wg.add(w);body.add(wg);wings.push({g:wg,sd});});}
 if(s.tail){const t=P(geo('tail',()=>{const c=new THREE.CylinderGeometry(.05,.13,.6,8);c.translate(0,.3,0);return c;}),s.tail,0,.38,-.32);t.rotation.x=-2.1;if(s.bigTail)t.scale.set(1.8,1.2,1.8);}
 let orb=null;
 if(s.staff){P(geo('staff',()=>new THREE.CylinderGeometry(.03,.035,2,6)),'#6a4a2a',.52,1,.12);orb=P(sph(.13),bmat(s.staff),.52,2.02,.12);}
 if(s.hammer){P(geo('hh',()=>new THREE.CylinderGeometry(.03,.03,.6,6)),'#6a4a2a',0,-.5,.1,armR);P(geo('hb',()=>new THREE.BoxGeometry(.3,.18,.18)),'#9aa0aa',0,-.8,.1,armR);}
 const shadow=new THREE.Mesh(geo('shadow',()=>new THREE.CircleGeometry(.48,16)),new THREE.MeshBasicMaterial({color:'#000',transparent:true,opacity:.32,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.03;g.add(shadow);
 const sc=(scale||1)*(s.short?.82:1);g.scale.setScalar(sc);
 return{g,body,legL,legR,armL,armR,head,wings,orb,t:Math.random()*6,face:0,bob:0};
}
function animChibi(c,dt,moving){
 c.t+=dt*(moving?10:2.2);const s=Math.sin(c.t);
 if(moving){c.legL.rotation.x=s*.7;c.legR.rotation.x=-s*.7;c.armL.rotation.x=-s*.6;c.armR.rotation.x=s*.6;c.body.position.y=Math.abs(s)*.07;}
 else{const k=Math.min(1,dt*8);[c.legL,c.legR,c.armL,c.armR].forEach(l=>{l.rotation.x+=(0-l.rotation.x)*k;});c.body.position.y=0;c.head.rotation.z=Math.sin(c.t*.7)*.04;c.body.scale.y=1+Math.sin(c.t)*.012;}
 c.wings.forEach(w=>{w.g.rotation.y=w.sd*(-.3+Math.sin(c.t*(moving?1.4:.8))*.35);});
}
function turnTo(c,dx,dz,dt){if(Math.abs(dx)+Math.abs(dz)<1e-3)return;const a=Math.atan2(dx,dz);let d=a-c.g.rotation.y;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;c.g.rotation.y+=d*Math.min(1,dt*10);}
function monsterType(n){if(/Wisp|Shade|Wraith|Swarm/.test(n))return'wisp';if(/Sailor|Gang|Ghoul|Templar|Acolyte/.test(n))return'man';if(/Golem/.test(n))return'golem';return'beast';}
function makeMonster(b){
 const col=b.el?ELEM[b.el].c:'#8a7a6a';const t=monsterType(b.n);
 if(t==='man'){const c=makeChibi({skin:shade(col,.15),hair:shade(col,-.6),robe:shade(col,-.4),robe2:shade(col,-.6),legs:shade(col,-.7),eye:'#ff4040',hood:shade(col,-.5)},1.1);c.type=t;return c;}
 const g=new THREE.Group(),body=new THREE.Group();g.add(body);const M=mat(col),D=mat(shade(col,-.35));
 const P=(gm,m,x,y,z)=>{const me=new THREE.Mesh(gm,m);me.position.set(x,y,z);body.add(me);return me;};
 let legs=[];
 if(t==='wisp'){P(geo('wisp',()=>new THREE.SphereGeometry(.42,14,10)),bmat(shade(col,.35)),0,1.1,0);[-.14,.14].forEach(x=>P(geo('eye',()=>new THREE.SphereGeometry(.065,8,6)),mat('#1a1420'),x,1.14,.38));}
 else if(t==='golem'){P(geo('golem',()=>new THREE.DodecahedronGeometry(.75,0)),Object.assign(M),0,.8,0);[-.22,.22].forEach(x=>P(geo('eye',()=>new THREE.SphereGeometry(.065,8,6)),bmat('#7ad0ff'),x,.95,.68).scale.setScalar(1.6));[-.5,.5].forEach(x=>legs.push(P(geo('gleg',()=>new THREE.BoxGeometry(.3,.4,.3)),D,x,.2,0)));}
 else{const bd=P(geo('bbody',()=>new THREE.SphereGeometry(.45,14,10)),M,0,.6,0);bd.scale.set(.85,.75,1.25);P(geo('bhead',()=>new THREE.SphereGeometry(.3,12,9)),M,0,.82,.58);[-.12,.12].forEach(x=>P(geo('eye',()=>new THREE.SphereGeometry(.065,8,6)),bmat('#ff4040'),x,.9,.84));[[-.25,.35],[.25,.35],[-.25,-.35],[.25,-.35]].forEach(([x,z])=>legs.push(P(geo('bleg',()=>new THREE.CylinderGeometry(.08,.07,.36,6)),D,x,.18,z)));}
 const shadow=new THREE.Mesh(geo('shadow',()=>new THREE.CircleGeometry(.48,16)),new THREE.MeshBasicMaterial({color:'#000',transparent:true,opacity:.3,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.03;shadow.scale.setScalar(1.3);g.add(shadow);
 if(t==='golem')g.scale.setScalar(1.3);
 return{g,body,legs,type:t,t:Math.random()*6,face:0};
}

