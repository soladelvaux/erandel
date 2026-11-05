/* ---------- build item meshes ---------- */
function itemCenter(it){const[w,d]=itemSize(it);return[PLOT.x0+(it.c+w/2)*PLOT.t,PLOT.z0+(it.r+d/2)*PLOT.t];}
function itemBase(it){const C=CATALOG[it.t];if(C.where==='water')return 0;if(C.layer==='floor')return PLOT.land;const o=occMap();const has=footprint(it).some(([c,r])=>o[c+','+r+'floor']);return has?PLOT.deck:PLOT.land;}
function hasFloor(c,r){return S.build.some(it=>CATALOG[it.t].layer==='floor'&&footprint(it).some(([cc,rr])=>cc===c&&rr===r));}
function groundY(x,z){const t=tileAt(x,z);if(t&&hasFloor(t.c,t.r))return PLOT.deck;return heightAt(x,z);}
function frontOf(it){const[x,z]=itemCenter(it);const[w,d]=itemSize(it);const f=[[0,1],[-1,0],[0,-1],[1,0]][it.rot%4];return{x:x+f[0]*(w+.8),z:z+f[1]*(d+.8),fx:f[0],fz:f[1]};}
const ITEM_BUILD={
 boardwalk(g,it,lit){addMesh(g,geo('deck',()=>new THREE.BoxGeometry(2,.2,2)),mat('#7a5236'),0,.1,0);for(let i=-1;i<=1;i++)addMesh(g,geo('plank',()=>new THREE.BoxGeometry(2,.02,.04)),mat('#4a3020'),0,.21,i*.5);if(tileWater(it.c,it.r))[[-.85,-.85],[.85,-.85],[-.85,.85],[.85,.85]].forEach(([x,z])=>addMesh(g,geo('pile',()=>new THREE.CylinderGeometry(.08,.08,2,6)),mat('#3a2614'),x,-1,z));},
 stonepath(g,it){[[-.45,-.4],[.45,.1],[-.2,.55]].forEach(([x,z],i)=>{const m=addMesh(g,geo('slab',()=>new THREE.BoxGeometry(.75,.1,.75)),mat('#8a8a84'),x,.05,z);m.rotation.y=i*.6;});},
 lantern(g,it,lit){addMesh(g,geo('lpost',()=>new THREE.BoxGeometry(.16,1.3,.16)),mat('#3a2a1a'),0,.65,0);addMesh(g,geo('lcap',()=>new THREE.BoxGeometry(.42,.06,.42)),mat('#2a1a10'),0,1.68,0);addMesh(g,geo('llamp',()=>new THREE.BoxGeometry(.3,.32,.3)),bmat('#ffd08a'),0,1.48,0);lit(0,1.48,0,1.3,'#ffcf7a');},
 shoji(g,it,lit){addMesh(g,geo('shp',()=>new THREE.BoxGeometry(.52,1.3,.52)),bmat('#ffe2b0'),0,.85,0);addMesh(g,geo('shtop',()=>new THREE.BoxGeometry(.62,.1,.62)),mat('#2a1a10'),0,1.55,0);addMesh(g,geo('shtop',()=>new THREE.BoxGeometry(.62,.1,.62)),mat('#2a1a10'),0,.17,0);[[-.27,-.27],[.27,-.27],[-.27,.27],[.27,.27]].forEach(([x,z])=>addMesh(g,geo('shst',()=>new THREE.BoxGeometry(.05,1.4,.05)),mat('#2a1a10'),x,.85,z));lit(0,.95,0,1.6,'#ffd8a0');},
 toro(g,it,lit){addMesh(g,geo('tb',()=>new THREE.BoxGeometry(.55,.25,.55)),mat('#8a8a82'),0,.12,0);addMesh(g,geo('tpl',()=>new THREE.CylinderGeometry(.11,.13,.55,6)),mat('#8a8a82'),0,.52,0);addMesh(g,geo('tfb',()=>new THREE.BoxGeometry(.4,.32,.4)),mat('#8a8a82'),0,.95,0);addMesh(g,geo('tw',()=>new THREE.BoxGeometry(.22,.16,.42)),bmat('#ffb860'),0,.95,0);const r=addMesh(g,geo('tr',()=>new THREE.ConeGeometry(.45,.3,4)),mat('#7a7a72'),0,1.26,0);r.rotation.y=Math.PI/4;lit(0,.95,0,.9,'#ffb860');},
 garland(g,it,lit){[-.9,.9].forEach(x=>addMesh(g,geo('gpost',()=>new THREE.BoxGeometry(.1,1.9,.1)),mat('#3a2a1a'),x,.95,0));for(let i=1;i<10;i++){const t=i/10,x=-.9+1.8*t,y=1.85-Math.sin(t*Math.PI)*.35;addMesh(g,geo('gb',()=>new THREE.SphereGeometry(.06,6,4)),bmat('#ffe2a0'),x,y,0);if(i%3===0)lit(x,y,0,.9,'#ffd890',true);}lit(0,1.6,0,0,'#ffd890');},
 torii(g,it){const red=mat('#b8322a'),blk=mat('#221614');[-2.2,2.2].forEach(x=>addMesh(g,geo('tp',()=>new THREE.CylinderGeometry(.17,.2,3.1,10)),red,x,1.55,0));addMesh(g,geo('tn',()=>new THREE.BoxGeometry(5,.2,.2)),red,0,2.35,0);addMesh(g,geo('tk2',()=>new THREE.BoxGeometry(5.4,.2,.3)),red,0,2.8,0);addMesh(g,geo('tk',()=>new THREE.BoxGeometry(5.9,.24,.38)),blk,0,3.02,0);},
 stall(g,it,lit){const wood=mat('#8a5a36'),dk=mat('#5a3a22');[[-1.6,-1.6],[1.6,-1.6],[-1.6,1.6],[1.6,1.6]].forEach(([x,z])=>addMesh(g,geo('sp',()=>new THREE.CylinderGeometry(.09,.09,2.5,6)),dk,x,1.25,z));addMesh(g,geo('scnt',()=>new THREE.BoxGeometry(3.2,.9,.7)),wood,0,.45,1.15);addMesh(g,geo('stop',()=>new THREE.BoxGeometry(3.3,.08,.8)),mat('#b07a4a'),0,.94,1.15);addMesh(g,geo('sshelf',()=>new THREE.BoxGeometry(3,1.4,.4)),dk,0,.7,-1.3);
  [-1,1].forEach(sd=>{const r=addMesh(g,geo('sroof',()=>new THREE.BoxGeometry(3.8,.14,2.3)),mat('#3a3f4a'),0,2.75,sd*.95);r.rotation.x=sd*.42;});addMesh(g,geo('sridge',()=>new THREE.BoxGeometry(3.9,.16,.2)),mat('#2a2e36'),0,3.2,0);
  addMesh(g,geo('snoren',()=>new THREE.BoxGeometry(3.1,.45,.04)),mat('#2a3a6a'),0,2.1,1.63);
  [-1.1,0,1.1].forEach(x=>{addMesh(g,geo('slan',()=>new THREE.SphereGeometry(.17,10,8)),bmat('#ff8a4a'),x,1.75,1.75);});for(let i=0;i<9;i++)addMesh(g,geo('gb',()=>new THREE.SphereGeometry(.06,6,4)),bmat('#ffe2a0'),-1.8+i*.45,2.25,1.85);
  [[-1,.98,1.1,'#e85a5a'],[-.4,.98,1.15,'#f0c050'],[.3,.98,1.1,'#7ac060'],[1,.98,1.2,'#e8e0d0']].forEach(([x,y,z,c])=>addMesh(g,geo('sgood',()=>new THREE.SphereGeometry(.12,8,6)),mat(c),x,y+.08,z));
  lit(0,1.8,1.8,2,'#ff9a50');},
 teahouse(g,it,lit){addMesh(g,geo('thw',()=>new THREE.BoxGeometry(3.4,1.9,3)),mat('#e8dcc0'),0,.95,-.2);addMesh(g,geo('thwin',()=>new THREE.PlaneGeometry(2.6,1.1)),bmat('#ffd8a0'),0,1.05,1.31);[-.65,.65,0].forEach(x=>addMesh(g,geo('thbar',()=>new THREE.BoxGeometry(.06,1.2,.04)),mat('#3a2a1a'),x,1.05,1.33));
  const r=addMesh(g,geo('throof',()=>new THREE.ConeGeometry(3.2,1.6,4)),mat('#3a3f4a'),0,2.7,-.2);r.rotation.y=Math.PI/4;addMesh(g,geo('thdeck',()=>new THREE.BoxGeometry(3.6,.12,.9)),mat('#7a5236'),0,.06,1.6);
  [-1.5,1.5].forEach(x=>{addMesh(g,geo('slan',()=>new THREE.SphereGeometry(.17,10,8)),bmat('#ff7a4a'),x,1.6,1.5);});lit(0,1.2,1.6,2.2,'#ffd8a0');},
 parasol(g,it){addMesh(g,geo('ptop',()=>new THREE.CylinderGeometry(.5,.5,.06,12)),mat('#7a5236'),0,.72,0);addMesh(g,geo('pleg',()=>new THREE.CylinderGeometry(.06,.06,.7,6)),mat('#4a3020'),0,.35,0);addMesh(g,geo('ppole',()=>new THREE.CylinderGeometry(.025,.025,2.1,6)),mat('#4a3020'),.1,1.05,0);addMesh(g,geo('pcone',()=>new THREE.ConeGeometry(1.25,.5,16,1,true)),new THREE.MeshLambertMaterial({color:'#efe4cc',side:THREE.DoubleSide}),.1,2.05,0);},
 flowers(g,it){const r=mulberry(it.c*31+it.r*7);addMesh(g,geo('fbase',()=>new THREE.CylinderGeometry(.75,.8,.12,10)),mat('#3a5a2a'),0,.06,0);for(let i=0;i<9;i++)addMesh(g,geo('fl',()=>new THREE.SphereGeometry(.12,7,5)),mat(['#c060d0','#f0a0c0','#fff0e0','#a080f0'][i%4]),(r()-.5)*1.2,.2+r()*.25,(r()-.5)*1.2);},
 wisteria(g,it){[-.85,.85].forEach(x=>addMesh(g,geo('wpost',()=>new THREE.BoxGeometry(.12,2.1,.12)),mat('#3a2a1a'),x,1.05,0));addMesh(g,geo('wbeam',()=>new THREE.BoxGeometry(2,.12,.5)),mat('#3a2a1a'),0,2.1,0);const r=mulberry(it.c*13+it.r);for(let i=0;i<16;i++){const x=(r()-.5)*1.6,z=(r()-.5)*.4;for(let k=0;k<3;k++)addMesh(g,geo('wf',()=>new THREE.SphereGeometry(.09,6,5)),mat(k%2?'#b08ae0':'#8a6ad0'),x,1.95-k*.18,z);}},
 bamboo(g,it){const r=mulberry(it.c*7+it.r*19);for(let i=0;i<6;i++){const h=3+r()*2;const x=(r()-.5)*1.3,z=(r()-.5)*1.3;addMesh(g,geo('bam',()=>{const c=new THREE.CylinderGeometry(.06,.07,1,6);c.translate(0,.5,0);return c;}),mat(['#6a9a4a','#7aaa52','#5a8a40'][i%3]),x,0,z).scale.y=h;addMesh(g,geo('bleaf',()=>new THREE.IcosahedronGeometry(.35,0)),mat('#5a8a3a'),x,h,z);}},
 lily(g,it){const r=mulberry(it.c*5+it.r*11);for(let i=0;i<3;i++)addMesh(g,geo('lp',()=>new THREE.CylinderGeometry(.42,.42,.04,10)),mat('#3f7a3a'),(r()-.5)*1.2,.03,(r()-.5)*1.2);for(let i=0;i<2;i++){const m=addMesh(g,geo('lotus',()=>new THREE.ConeGeometry(.16,.22,7)),bmat('#ff9ab8'),(r()-.5)*1,.14,(r()-.5)*1);m.rotation.x=Math.PI;}},
 floatlantern(g,it,lit){const r=mulberry(it.c*3+it.r*17);for(let i=0;i<2;i++){const x=(r()-.5)*1.2,z=(r()-.5)*1.2;addMesh(g,geo('fln',()=>new THREE.BoxGeometry(.24,.2,.24)),bmat('#ffb860'),x,.12,z);lit(x,.22,z,.9,'#ffb050',i===1);lit(x,-.3,z,.8,'#ff9a40',true,.35);}},
 bench(g,it){addMesh(g,geo('bseat',()=>new THREE.BoxGeometry(1.4,.1,.45)),mat('#8a5a36'),0,.45,0);addMesh(g,geo('bback',()=>new THREE.BoxGeometry(1.4,.4,.08)),mat('#8a5a36'),0,.75,-.2);[[-.6,-.15],[.6,-.15],[-.6,.15],[.6,.15]].forEach(([x,z])=>addMesh(g,geo('bleg',()=>new THREE.BoxGeometry(.08,.45,.08)),mat('#4a3020'),x,.22,z));},
 moonring(g,it,lit){addMesh(g,geo('mrb',()=>new THREE.CylinderGeometry(.3,.4,.2,10)),mat('#7a7a72'),0,.1,0);addMesh(g,geo('mring',()=>new THREE.TorusGeometry(.75,.07,8,32)),bmat('#ffe0a0'),0,1.05,0);lit(0,1.05,0,1.5,'#ffd890');},
};
function addItemMesh(it){
 const w=W3;if(!w||!ITEM_BUILD[it.t])return;
 const g=new THREE.Group();const lights=[];
 const lit=(x,y,z,size,colr,noLight,op)=>{if(size>0){const gl=mkGlow(colr,size,.3);gl.position.set(x,y,z);g.add(gl);w.glows.push({s:gl,base:.03*(op||1),night:.6*(op||1),pulse:CATALOG[it.t].where==='water'?1:0,item:it.id});}if(!noLight)lights.push([x,y,z]);};
 ITEM_BUILD[it.t](g,it,lit);
 const[x,z]=itemCenter(it);g.position.set(x,itemBase(it),z);g.rotation.y=-(it.rot%4)*Math.PI/2;w.buildGroup.add(g);
 g.updateMatrixWorld(true);const C=CATALOG[it.t];
 lights.forEach(([lx,ly,lz])=>{const v=new THREE.Vector3(lx,ly,lz);g.localToWorld(v);w.LIGHTS.push({x:v.x,y:v.y,z:v.z,str:(C.light||1)/Math.max(1,lights.length*.6),col:WARM,item:it.id});});
 w.itemMeshes[it.id]=g;
 if(C.layer==='floor')S.build.filter(o=>CATALOG[o.t].layer==='obj'&&w.itemMeshes[o.id]&&footprint(o).some(([c,r])=>footprint(it).some(([cc,rr])=>cc===c&&rr===r))).forEach(o=>{removeItemMesh(o);addItemMesh(o);});
}
function removeItemMesh(it){const w=W3;const g=w.itemMeshes[it.id];if(g){w.buildGroup.remove(g);delete w.itemMeshes[it.id];}w.glows=w.glows.filter(o=>o.item!==it.id);w.LIGHTS=w.LIGHTS.filter(o=>o.item!==it.id);}
function setGhost(){
 const w=W3;const key=ui.build&&ui.build.tool!=='remove'?ui.build.sel+'|'+ui.build.rot:'';if(key===w.ghostKey)return;w.ghostKey=key;
 if(w.ghost){w.scene.remove(w.ghost);w.ghost=null;}if(!key)return;
 const it={t:ui.build.sel,c:0,r:0,rot:ui.build.rot,id:'ghost'};const g=new THREE.Group();ITEM_BUILD[it.t](g,it,()=>{});
 const gm=new THREE.MeshBasicMaterial({color:'#ffe8a0',transparent:true,opacity:.45,depthWrite:false});g.traverse(o=>{if(o.isMesh)o.material=gm;});g.rotation.y=-(it.rot%4)*Math.PI/2;g.visible=false;w.scene.add(g);w.ghost=g;
}

