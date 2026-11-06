/* ---------- world build ---------- */
let W3=null,dummy=null,_tc=null,_c1=null,_c2=null,_v=null,_pv=null;
function Inst(geom,material,max,scene){const m=new THREE.InstancedMesh(geom,material,max);m.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(max*3),3);m.count=0;m._max=max;m.frustumCulled=false;scene.add(m);return m;}
function put(im,x,y,z,sx,sy,sz,ry,col,rx){if(PUT_OFF&&regionAt(x,z)==='greenmere')return;if(im.count>=im._max)return;dummy.position.set(x,y,z);dummy.rotation.set(rx||0,ry||0,0);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();im.setMatrixAt(im.count,dummy.matrix);im.setColorAt(im.count,_tc.set(col||'#ffffff'));im.count++;}
function finishInst(list){list.forEach(im=>{im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;});}
function mkGlow(color,size,op){const m=new THREE.SpriteMaterial({map:GT,color:new THREE.Color(color),transparent:true,opacity:op,blending:THREE.AdditiveBlending,depthWrite:false});const s=new THREE.Sprite(m);s.scale.set(size,size,1);return s;}
function glowTex(){const cv=document.createElement('canvas');cv.width=cv.height=64;const x=cv.getContext('2d');const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.3,'rgba(255,255,255,.45)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(cv);}
function bubbleTex(){const cv=document.createElement('canvas');cv.width=cv.height=64;const x=cv.getContext('2d');x.fillStyle='#fff8e8';x.beginPath();x.arc(32,28,22,0,Math.PI*2);x.fill();x.beginPath();x.moveTo(24,46);x.lineTo(32,60);x.lineTo(38,46);x.fill();x.fillStyle='#e0a820';x.beginPath();x.arc(32,28,12,0,Math.PI*2);x.fill();x.fillStyle='#fff3c0';x.fillRect(30,20,4,16);return new THREE.CanvasTexture(cv);}
function addMesh(parent,gm,m,x,y,z){const me=new THREE.Mesh(gm,m);me.position.set(x,y,z);parent.add(me);return me;}
const WARM='#ffc870';

function initWorld(){
 dummy=new THREE.Object3D();_tc=new THREE.Color();_c1=new THREE.Color();_c2=new THREE.Color();_v=new THREE.Vector3();_pv=new THREE.Vector3();FADE.value=new THREE.Vector3(0,-999,0);FADE_CAM.value=new THREE.Vector3();
 const canvas=document.getElementById('world');
 const renderer=new THREE.WebGLRenderer({canvas,antialias:!IS_PHONE,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,IS_PHONE?1.25:1.5));
 renderer.setSize(window.innerWidth,window.innerHeight,false);
 const scene=new THREE.Scene();scene.background=new THREE.Color('#bcd8e6');scene.fog=new THREE.Fog('#bcd8e6',40,150);
 const camera=new THREE.PerspectiveCamera(36,window.innerWidth/window.innerHeight,.5,420);
 const hemi=new THREE.HemisphereLight('#ffffff','#445533',.9);scene.add(hemi);
 const sun=new THREE.DirectionalLight('#ffffff',1);sun.position.set(-30,60,25);scene.add(sun);
 GT=glowTex();
 const NPL=IS_PHONE?4:8;const plights=[];for(let i=0;i<NPL;i++){const l=new THREE.PointLight(WARM,0,13,2);scene.add(l);plights.push(l);}
 // terrain
 const NX=IS_PHONE?130:170,NZ=IS_PHONE?146:192,pos=new Float32Array((NX+1)*(NZ+1)*3),col=new Float32Array((NX+1)*(NZ+1)*3);
 for(let j=0;j<=NZ;j++)for(let i=0;i<=NX;i++){const x=WB.minX+(WB.maxX-WB.minX)*i/NX,z=WB.minZ+(WB.maxZ-WB.minZ)*j/NZ,h=heightAt(x,z),k=(j*(NX+1)+i)*3,c=colorAt(x,z,h);pos[k]=x;pos[k+1]=h;pos[k+2]=z;col[k]=c[0];col[k+1]=c[1];col[k+2]=c[2];}
 const idx=[];for(let j=0;j<NZ;j++)for(let i=0;i<NX;i++){const a=j*(NX+1)+i,b=a+1,c=a+NX+1,d=c+1;idx.push(a,c,b,b,c,d);}
 const tg=new THREE.BufferGeometry();tg.setAttribute('position',new THREE.BufferAttribute(pos,3));tg.setAttribute('color',new THREE.BufferAttribute(col,3));tg.setIndex(idx);tg.computeVertexNormals();
 const tmat=new THREE.MeshPhongMaterial({vertexColors:true,flatShading:false,shininess:0,specular:'#000000'});paintTerrain(tmat);const terrain=new THREE.Mesh(tg,tmat);scene.add(terrain);
 const water=new THREE.Mesh(new THREE.PlaneGeometry(WB.maxX-WB.minX,WB.maxZ-WB.minZ),new THREE.MeshPhongMaterial({color:'#2f6f92',transparent:true,opacity:.72,shininess:140,specular:'#d8ecff',depthWrite:false}));
 water.rotation.x=-Math.PI/2;water.position.set(0,0,(WB.minZ+WB.maxZ)/2);water.renderOrder=-1;scene.add(water);
 // instanced props
 const W=new THREE.Color('#ffffff');
 const I={
  trunk:Inst(geo('itrunk',()=>{const c=new THREE.CylinderGeometry(.12,.2,1,6);c.translate(0,.5,0);return c;}),new THREE.MeshLambertMaterial({color:W}),900,scene),
  canopy:Inst(geo('icanopy',()=>new THREE.IcosahedronGeometry(1,0)),new THREE.MeshLambertMaterial({color:W}),1400,scene),
  cone:Inst(geo('icone',()=>{const c=new THREE.ConeGeometry(1,1,7);c.translate(0,.5,0);return c;}),new THREE.MeshLambertMaterial({color:W}),1400,scene),
  rock:Inst(geo('irock',()=>new THREE.DodecahedronGeometry(1,0)),new THREE.MeshLambertMaterial({color:W}),700,scene),
  glowy:Inst(geo('icrys',()=>new THREE.OctahedronGeometry(1,0)),new THREE.MeshBasicMaterial({color:W}),400,scene),
  bulb:Inst(geo('ibulb',()=>new THREE.SphereGeometry(1,6,4)),new THREE.MeshBasicMaterial({color:W}),1400,scene),
  box:Inst(geo('ibox',()=>{const b=new THREE.BoxGeometry(1,1,1);b.translate(0,.5,0);return b;}),new THREE.MeshLambertMaterial({color:W}),900,scene),
  lamp:Inst(geo('ilamp',()=>new THREE.BoxGeometry(1,1,1)),new THREE.MeshBasicMaterial({color:W}),400,scene),
  pad:Inst(geo('ipad',()=>new THREE.CylinderGeometry(1,1,.05,10)),new THREE.MeshLambertMaterial({color:W}),300,scene),
  grass:Inst(geo('igrass',()=>{const c=new THREE.ConeGeometry(.07,.36,4);c.translate(0,.18,0);return c;}),new THREE.MeshLambertMaterial({color:W}),2600,scene),
 };
 const erelianNew=regionWanted();
 const rng=mulberry(7);const glows=[];const LIGHTS=[];const flick=[];const COL=new Map();const addCol=(x,z,r,cr,lo,hi)=>{if(PUT_OFF&&regionAt(x,z)==='greenmere')return;const k=Math.floor(x/4)+','+Math.floor(z/4);if(!COL.has(k))COL.set(k,[]);const g=heightAt(x,z);COL.get(k).push({x,z,r,cr:cr||r,lo:g+(lo==null?0:lo),hi:g+(hi==null?12:hi)});};
 const addLight=(x,y,z,str,colr)=>LIGHTS.push({x,y,z,str,col:colr||WARM});
 const lantern=(x,z,h)=>{const y=heightAt(x,z);put(I.box,x,y,z,.14,h||1.4,.14,0,'#3a2a1a');put(I.lamp,x,y+(h||1.4)+.16,z,.3,.34,.3,0,'#ffd08a');const g=mkGlow('#ffcf7a',1.5,.3);g.position.set(x,y+(h||1.4)+.16,z);scene.add(g);glows.push({s:g,base:.15,night:.9});addLight(x,y+(h||1.4)+.2,z,1);};
 const floatL=(x,z)=>{put(I.lamp,x,.1,z,.24,.2,.24,rng()*3,'#ffc070');const g=mkGlow('#ffb050',1.1,.25);g.position.set(x,.22,z);scene.add(g);glows.push({s:g,base:.08,night:.55,pulse:1});const r=mkGlow('#ff9a40',.9,.12);r.position.set(x,-.3,z);scene.add(r);glows.push({s:r,base:.03,night:.25});flick.push({x,z,t:rng()*6,o:g});};
 const keep=[...Object.values(NPC_POS),AEL_POS,[SPAWN.x,SPAWN.z],...Object.values(CENTERS)];
 const TABLE={vael:[['broad',4],['thorn',2],['flower',3],['grass',4]],greenmere:[['white',6],['broad',2],['flower',3],['grass',3]],coral:[['coral',5],['rock',2],['crys',1]],sanctum:[['broad',2],['flower',5],['rock',1],['white',1],['grass',3]],moonwell:[['crys',3],['white',2],['flower',2],['grass',2]],skyreach:[['pine',3],['rock',4]],frostfell:[['snowpine',4],['ice',3],['rock',1]],ember:[['ash',4],['rock',3]],stonedeep:[['rock',4],['crys',2],['pine',1]],hollow:[['dead',4],['grave',3],['thorn',1]]};
 const GREENS=['#3f7a34','#4c8a3e','#5a9a44','#38703a'],PALE=['#a2c98a','#b8d8a0','#c8e6b4'];
 for(let n=0;n<2200;n++){
  const x=WB.minX+6+rng()*(WB.maxX-WB.minX-12),z=WB.minZ+6+rng()*(WB.maxZ-WB.minZ-12);const reg=regionAt(x,z),h=heightAt(x,z);
  PUT_OFF=erelianNew; // old props standing inside Erelian are skipped (the region replaces them)
  if(reg==='coral'){if(h>-.8)continue;}else if(h<.25)continue;
  if(Math.abs(x)<4.5&&z>22&&z<76)continue;if(plotW(x,z)>0)continue;
  if(keep.some(p=>(p[0]-x)**2+(p[1]-z)**2<20))continue;
  if(cragAt(x,z)>.3&&rng()<.85)continue;
  const tb=TABLE[reg];const tot=tb.reduce((a,t)=>a+t[1],0);let r=rng()*tot,type=tb[0][0];for(const t of tb){r-=t[1];if(r<=0){type=t[0];break;}}
  if(type==='pine'&&h>9)type='snowpine';const s=.8+rng()*.5,ry=rng()*6;
  if(['broad','white','pine','snowpine','dead','ash'].includes(type))addCol(x,z,.38*s,.42*s,0,3.3*s);else if(type==='rock')addCol(x,z,.7*s,.7*s,0,.6*s);
  if(type==='broad'){put(I.trunk,x,h,z,s,1.5*s,s,ry,'#5a3d26');put(I.canopy,x,h+1.9*s,z,1.25*s,1.05*s,1.25*s,ry,GREENS[n%4]);put(I.canopy,x+.5*s,h+1.4*s,z+.3,.8*s,.7*s,.8*s,ry,GREENS[(n+1)%4]);}
  else if(type==='white'){put(I.trunk,x,h,z,.9*s,2*s,.9*s,ry,'#e9e3d2');put(I.canopy,x,h+2.3*s,z,1.3*s,1.1*s,1.3*s,ry,PALE[n%3]);put(I.canopy,x-.5*s,h+1.8*s,z,.8*s,.7*s,.8*s,ry,PALE[(n+1)%3]);}
  else if(type==='pine'||type==='snowpine'){put(I.trunk,x,h,z,s,.6*s,s,ry,'#4a3222');put(I.cone,x,h+.5*s,z,1*s,1.8*s,1*s,ry,'#2b5a3a');put(I.cone,x,h+1.6*s,z,.7*s,1.3*s,.7*s,ry,type==='snowpine'?'#eef4f6':'#356a44');}
  else if(type==='dead'){put(I.trunk,x,h,z,.8*s,2.2*s,.8*s,ry,'#5d5a57');put(I.trunk,x,h+1.2*s,z,.5*s,1.1*s,.5*s,ry,'#5d5a57',.8);}
  else if(type==='rock')put(I.rock,x,h+.1,z,.8*s,.5*s,.7*s,ry,['#6a6d70','#7f8286','#5d6064'][n%3]);
  else if(type==='crys'){for(let k=0;k<3;k++)put(I.glowy,x+(k-1)*.3,h+.4*s,z+(k%2)*.3,.22*s,.6*s*(1+k*.2),.22*s,ry,k%2?'#a890f0':'#80d0ff');if(rng()<.3)addLight(x,h+1.2,z,.16,'#80d0ff');}
  else if(type==='coral'){for(let k=0;k<3;k++)put(I.cone,x+(k-1)*.35,h,z+(k%2)*.3,.18*s,.9*s*(1+k*.3),.18*s,ry,['#e0708a','#f0a050','#d860b0'][k]);}
  else if(type==='ash'){put(I.trunk,x,h,z,1.6*s,2.2*s,1.6*s,ry,'#2e2422');put(I.bulb,x+.1,h+1.2*s,z+.25,.07,.12,.07,0,'#ff7a2a');}
  else if(type==='ice')put(I.cone,x,h,z,.5*s,2.2*s,.5*s,ry,'#bfe6f5');
  else if(type==='grave')put(I.box,x,h,z,.6,.8,.2,ry*.2,'#7c7f84');
  else if(type==='thorn')put(I.canopy,x,h+.4,z,.8*s,.45*s,.8*s,ry,'#2a4a2a');
  else if(type==='flower'){for(let k=0;k<4;k++)put(I.bulb,x+(rng()-.5)*.8,h+.15,z+(rng()-.5)*.8,.11,.11,.11,0,['#f2d26a','#e88ab0','#b090f0','#fff4e0'][k]);}
  else if(type==='grass'){for(let k=0;k<6;k++)put(I.grass,x+(rng()-.5)*1.4,h,z+(rng()-.5)*1.4,1,.8+rng()*.6,1,rng()*6,GREENS[k%4]);}
 }
 PUT_OFF=false; // only the scatter loop skips Erelian's old props; everything after it is placed as before
 // Thorngate: bamboo belt, road lights, string lights
 const BAM=['#6a9a4a','#7aaa52','#5a8a40'];
 for(let n=0;n<220;n++){const x=33+rng()*12,z=20+rng()*40;const h=heightAt(x,z);if(h<.2)continue;const t=3.5+rng()*3;put(I.trunk,x,h,z,.45,t,.45,0,BAM[n%3]);if(n%3===0)put(I.canopy,x,h+t,z,.55,.35,.55,rng()*6,'#5a8a3a');}
 for(let n=0;n<60;n++){const x=-24+rng()*10,z=22+rng()*30;const h=heightAt(x,z);if(h<.2)continue;const t=3+rng()*3;put(I.trunk,x,h,z,.45,t,.45,0,BAM[n%3]);}
 const posts=[];for(let z=26;z<=50;z+=6){[-3.6,3.6].forEach(x=>{lantern(x,z,1.9);posts.push([x,z]);});}
 const strand=(a,b,n,sag)=>{const ya=heightAt(a[0],a[1])+2.1,yb=heightAt(b[0],b[1])+2.1;for(let i=1;i<n;i++){const t=i/n,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t,y=ya+(yb-ya)*t-Math.sin(t*Math.PI)*sag;put(I.bulb,x,y,z,.07,.07,.07,0,'#ffe2a0');if(i%3===0){const g=mkGlow('#ffd890',.9,.2);g.position.set(x,y,z);scene.add(g);glows.push({s:g,base:.05,night:.75});}}};
 for(let z=26;z<50;z+=6){strand([-3.6,z],[-3.6,z+6],10,.5);strand([3.6,z],[3.6,z+6],10,.5);}
 for(let z=26;z<=50;z+=12)strand([-3.6,z],[3.6,z],12,.7);
 // river and mere floating lanterns + lilies
 for(let i=0;i<RIVER.length-1;i++){for(let k=0;k<3;k++){const t=rng(),x=RIVER[i][0]+(RIVER[i+1][0]-RIVER[i][0])*t+(rng()-.5)*2,z=RIVER[i][1]+(RIVER[i+1][1]-RIVER[i][1])*t+(rng()-.5)*2;if(heightAt(x,z)<-.4){if(k===0)floatL(x,z);else put(I.pad,x,.02,z,.45,1,.45,0,'#3f7a3a');}}}
 // landmarks
 const G=(x,z)=>heightAt(x,z);const stone=mat('#8f8a80'),dark=mat('#3a342e');
 [[-9,33],[-13,43],[-9,25],[-15,35]].forEach(([x,z],i)=>{const y=G(x,z);addCol(x,z,2.6);addMesh(scene,geo('house',()=>new THREE.BoxGeometry(4,3,4)),mat(i%2?'#d8c8a8':'#cbb894'),x,y+1.5,z);const roof=addMesh(scene,geo('roof',()=>new THREE.ConeGeometry(3.4,2.4,4)),mat(i%2?'#3a3f4a':'#5a3a2a'),x,y+4.2,z);roof.rotation.y=Math.PI/4;const win=addMesh(scene,geo('win',()=>new THREE.PlaneGeometry(1,.8)),bmat('#ffd890'),x+2.01,y+1.6,z);win.rotation.y=Math.PI/2;win.visible=false;flick.push({win});addLight(x+2.6,y+1.6,z,.7);});
 const gy=G(0,52);addCol(-4.5,52,1.1);addCol(4.5,52,1.1);addMesh(scene,geo('gp',()=>new THREE.BoxGeometry(1.6,7,1.6)),stone,-4.5,gy+3.5,52);addMesh(scene,geo('gp',()=>new THREE.BoxGeometry(1.6,7,1.6)),stone,4.5,gy+3.5,52);
 addMesh(scene,new THREE.TorusGeometry(4.5,.75,6,16,Math.PI),mat('#3d5a2c'),0,gy+7,52);
 addMesh(scene,new THREE.TorusGeometry(4.5,.35,5,16,Math.PI),mat('#5a3a22'),0,gy+7.3,52.3);
 for(let i=0;i<14;i++){const a=i/13*Math.PI;const g=mkGlow('#b8ffb0',.7,.3);g.position.set(Math.cos(a)*4.6,gy+7+Math.sin(a)*4.6,52.6);scene.add(g);glows.push({s:g,base:.2,night:.8,pulse:1});}
 if(!erelianNew)for(let i=0;i<7;i++){const a=i/7*Math.PI*2,x=-46+Math.cos(a)*(6+(i%2)*4),z=8+Math.sin(a)*(6+(i%2)*4),y=G(x,z);addCol(x,z,1.3);addMesh(scene,geo('spire'+(i%3),()=>new THREE.CylinderGeometry(.8,1.2,10+(i%3)*2,6)),mat('#ece8dc'),x,y+5+(i%3),z);addMesh(scene,geo('spc',()=>new THREE.ConeGeometry(1.4,5,6)),mat('#6fa860'),x,y+12.5+(i%3)*2,z);lantern(x+1.8,z+.5,1.6);}
 const sy=G(40,30);addCol(40,30,3);addMesh(scene,new THREE.CylinderGeometry(2,3,24,8),mat('#f0ece0'),40,sy+12,30);addMesh(scene,new THREE.SphereGeometry(2,12,9),bmat('#fff2b0'),40,sy+25,30);
 {const g=mkGlow('#fff0b0',12,.55);g.position.set(40,sy+25,30);scene.add(g);glows.push({s:g,base:.45,night:.9});addLight(40,sy+3,30,1.2,'#fff0c0');}
 const my=G(10,-8);const ring=addMesh(scene,new THREE.TorusGeometry(3.6,.5,6,18),mat('#9aa0b0'),10,my+.35,-8);ring.rotation.x=Math.PI/2;
 const pool=addMesh(scene,new THREE.CircleGeometry(3.2,20),bmat('#bfe4ff'),10,my+.3,-8);pool.rotation.x=-Math.PI/2;
 {const g=mkGlow('#bfe4ff',9,.35);g.position.set(10,my+1.5,-8);scene.add(g);glows.push({s:g,base:.3,night:.8,pulse:1});addLight(10,my+1.5,-8,1.2,'#bfe4ff');}
 [[52,-6],[58,-18],[62,-8],[50,-16],[56,-2]].forEach(([x,z])=>{const y=G(x,z);addCol(x,z,1.5);addMesh(scene,geo('vent',()=>new THREE.ConeGeometry(1.6,2.6,6)),mat('#3a2a26'),x,y+1.2,z);addMesh(scene,geo('ventg',()=>new THREE.SphereGeometry(.45,8,6)),bmat('#ff7a2a'),x,y+2.5,z);const g=mkGlow('#ff8a3a',3.2,.45);g.position.set(x,y+2.7,z);scene.add(g);glows.push({s:g,base:.4,night:.8,pulse:1});addLight(x,y+2.8,z,1,'#ff8a3a');});
 const dy=G(46,-51);addMesh(scene,geo('dp',()=>new THREE.BoxGeometry(1.5,5,1.5)),dark,43.5,dy+2.5,-50);addMesh(scene,geo('dp',()=>new THREE.BoxGeometry(1.5,5,1.5)),dark,48.5,dy+2.5,-50);addMesh(scene,new THREE.BoxGeometry(6.5,1.4,1.6),dark,46,dy+5.5,-50);
 addMesh(scene,new THREE.PlaneGeometry(3.5,4.6),bmat('#0a0806'),46,dy+2.3,-50.6);
 {const g=mkGlow('#ff9a40',5,.35);g.position.set(46,dy+2,-49.5);scene.add(g);glows.push({s:g,base:.3,night:.7,pulse:1});addLight(46,dy+2,-48.5,1.3,'#ff9a40');}
 [[-50,-48],[-44,-50],[-52,-42],[-42,-44]].forEach(([x,z])=>{const y=G(x,z);addCol(x,z,2.1);addMesh(scene,geo('dome',()=>new THREE.SphereGeometry(2,10,7,0,Math.PI*2,0,Math.PI/2)),mat('#dfeaf2'),x,y,z);});
 for(let i=0;i<8;i++){const a=i/8*Math.PI*2,x=-52+Math.cos(a)*7,z=58+Math.sin(a)*7;addCol(x,z,.7);addMesh(scene,geo('mp',()=>new THREE.CylinderGeometry(.6,.6,5,6)),mat('#c8d8d8'),x,G(x,z)+2.5,z);}
 [[-2,-40],[-8,-56],[2,-60],[-10,-46]].forEach(([x,z])=>{const y=G(x,z);for(let k=0;k<3;k++)addMesh(scene,geo('cairn'+k,()=>new THREE.BoxGeometry(1.2-k*.3,.6,1.2-k*.3)),stone,x,y+.3+k*.6,z);});
 const wisps=[];for(let i=0;i<16;i++){const x=-14+rng()*28,z=70+rng()*22,g=mkGlow('#cfe8ff',1.4,.6);g.position.set(x,G(x,z)+1.5,z);scene.add(g);wisps.push({s:g,x,z,y:G(x,z)+1.5,t:rng()*6});}
 const flies=[];const fm=new THREE.MeshLambertMaterial({color:'#f1e7c6',emissive:'#3a3424',side:THREE.DoubleSide});for(let i=0;i<16;i++){const x=-46+(rng()-.5)*30,z=8+(rng()-.5)*30;const f=new THREE.Group();[-1,1].forEach(sd=>{const w=new THREE.Mesh(geo('fly',()=>{const w=new THREE.Shape();w.moveTo(0,.01);w.bezierCurveTo(.06,.1,.2,.12,.22,.06);w.bezierCurveTo(.23,.01,.12,0,.03,-.005);w.bezierCurveTo(.12,-.03,.17,-.09,.12,-.11);w.bezierCurveTo(.07,-.12,.02,-.06,0,-.01);return new THREE.ShapeGeometry(w,6);}),fm);w.scale.x=sd;f.add(w);});scene.add(f);flies.push({s:f,x,z,t:rng()*9});}
 for(let i=0;i<40;i++){const x=-6+rng()*44,z=-20+rng()*30;const g=mkGlow('#d8ff90',.35,0);g.position.set(x,G(x,z)+.8+rng(),z);scene.add(g);glows.push({s:g,base:0,night:.9,pulse:1,fire:{x,z,y:g.position.y,t:rng()*9}});}
 PUT_OFF=false;
 finishInst(Object.values(I));
 ['trunk','canopy','cone','rock','box','glowy','grass'].forEach(k=>nearFade(I[k].material));
 // build layer
 const buildGroup=new THREE.Group();scene.add(buildGroup);
 const grid=(()=>{const pts=[];const y=PLOT.land+.03;for(let c=0;c<=PLOT.cols;c++){const x=PLOT.x0+c*PLOT.t;pts.push(x,y,PLOT.z0,x,y,PLOT.z0+PLOT.rows*PLOT.t);}for(let r=0;r<=PLOT.rows;r++){const z=PLOT.z0+r*PLOT.t;pts.push(PLOT.x0,y,z,PLOT.x0+PLOT.cols*PLOT.t,y,z);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));const l=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:'#ffd890',transparent:true,opacity:.45}));l.visible=false;scene.add(l);return l;})();
 const hilite=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({color:'#9af0a0',transparent:true,opacity:.35,depthWrite:false}));hilite.rotation.x=-Math.PI/2;hilite.visible=false;scene.add(hilite);
 // characters
 const player={x:SPAWN.x,z:SPAWN.z,y:0,vy:0,ground:true,climb:false,climbT:0,climbMove:false,ry:0,anim:'idle',inX:0,inZ:0,dodgeT:0,dodgeX:0,dodgeZ:0,iUntil:0,atkAnim:0,castAnim:0,mp:0,cd:{atk:0,dodge:0},ch:null,race:null,tx:null,tz:null,say:'',sayUntil:0};
 if(S&&S.pos){player.x=S.pos.x;player.z=S.pos.z;}
 player.y=heightAt(player.x,player.z);
 const npcs=[];
 const addNpc=(id,x,z,spec,special,name)=>{const ch=makeChibi(spec,1.2);ch.g.position.set(x,heightAt(x,z),z);ch.g.rotation.y=Math.atan2(SPAWN.x-x,SPAWN.z-z)*0;scene.add(ch.g);npcs.push({id,x,z,ch,special,name});};
 Object.keys(NPC_POS).forEach(id=>addNpc(id,NPC_POS[id][0],NPC_POS[id][1],NPC_SPEC[id],null,NPCS[id].name));
 addNpc('aelarion',AEL_POS[0],AEL_POS[1],NPC_SPEC.aelarion,'aelarion','Aelarion Silverbough');
 const aelGlow=mkGlow('#7af08a',2.4,.7);scene.add(aelGlow);addLight(AEL_POS[0],2.6,AEL_POS[1],.9,'#8af09a');
 const comp={ch:null,race:null,x:0,z:0};
 const monsters=[];const mrng=mulberry(11);
 Object.keys(REG).forEach(rid=>{const c=CENTERS[rid];let made=0,tries=0;while(made<3&&tries<80){tries++;const x=c[0]+(mrng()-.5)*34,z=c[1]+(mrng()-.5)*34;if(regionAt(x,z)!==rid)continue;if((x-c[0])**2+(z-c[1])**2<36)continue;if(rid==='vael'&&(z>22||plotW(x,z)>0))continue;
  const bi=made%REG[rid].beasts.length;const b=REG[rid].beasts[bi];const mo=makeMonster(b);mo.g.position.set(x,heightAt(x,z),z);scene.add(mo.g);let glow=null;if(mo.type==='wisp'){glow=mkGlow(b.el?ELEM[b.el].c:'#ffffff',2.4,.5);scene.add(glow);}
  const mon={region:rid,bi,b,x,z,hx:x,hz:z,tx:x,tz:z,mo,glow,alive:true,hp:1,hpMax:1,els:[],st:'wander',cd:0,stT:0,wind:1,hit:false,flash:0,deadT:0,baseS:mo.g.scale.x,tele:null};mo.g.userData.mon=mon;monsters.push(mon);made++;}});
 const NP=700,pp=new Float32Array(NP*3);for(let i=0;i<NP;i++){pp[i*3]=(Math.random()-.5)*60;pp[i*3+1]=Math.random()*26;pp[i*3+2]=(Math.random()-.5)*60;}
 const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(pp,3));
 const pmat=new THREE.PointsMaterial({color:'#dfe9ff',size:.22,transparent:true,opacity:.8,depthWrite:false});const points=new THREE.Points(pg,pmat);points.frustumCulled=false;scene.add(points);
 const BT=bubbleTex();const sky=makeSky(scene);const plamp=new THREE.PointLight('#ffd9a0',0,9,1.6);scene.add(plamp);
 W3={renderer,scene,camera,hemi,sun,water,terrain,glows,LIGHTS,staticLights:LIGHTS.length,plights,flick,wisps,flies,player,npcs,aelGlow,comp,monsters,points,pmat,BT,
  clock:new THREE.Clock(),lastDay:S?S.day:0,saveT:0,lightT:0,talk:null,flash:0,orbit:0,look:new THREE.Vector3(),camInit:false,camDist:30,zoom:1,
  buildGroup,itemMeshes:{},grid,hilite,ghost:null,ghostKey:'',hover:null,buildCam:{x:18,z:38},customers:[],spawnT:0,composer:null,bloom:null,
  sky,COL,plamp,cam:{yaw:0,pitch:.38},fx:[],projs:[],summons:[],rites:[],target:null,uiT:0,netT:0,grace:0};
 TAGS.layer=document.getElementById('tags');
 initMini();
 S&&S.build.forEach(addItemMesh);
 scene.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh&&o!==terrain&&o!==water&&o.material&&!o.material.transparent&&/Lambert|Phong|Standard/.test(o.material.type))nearFade(o.material);});
 setupComposer();
 erelianInit();
 charactersInit();
 springInit();
 window.addEventListener('resize',()=>{renderer.setSize(window.innerWidth,window.innerHeight,false);camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();if(W3.composer)W3.composer.setSize(window.innerWidth,window.innerHeight);});
 initPointer(canvas);
 requestAnimationFrame(loop);
}
function setupComposer(){
 const w=W3;w.composer=null;w.bloom=null;
 if(!(PREFS.glow||SPRING)||!THREE.EffectComposer||!THREE.RenderPass||!(THREE.UnrealBloomPass||SPRING))return;
 try{const c=new THREE.EffectComposer(w.renderer);c.addPass(new THREE.RenderPass(w.scene,w.camera));const b=PREFS.glow&&THREE.UnrealBloomPass?new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth/2,window.innerHeight/2),.6,.45,.8):null;if(b)c.addPass(b);w.grade=springComposer(c,w);c.setSize(window.innerWidth,window.innerHeight);w.composer=c;w.bloom=b;}catch(e){w.composer=null;}
}

