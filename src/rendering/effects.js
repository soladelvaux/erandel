/* ============ ACTION LAYER (third-person movement, real-time combat, effects) ============ */
let FXG=null;
function fxGeo(){if(FXG)return FXG;FXG={slash:new THREE.RingGeometry(1.1,2.5,20,1,-Math.PI/2-ACT.atkArc,ACT.atkArc*2),ring:new THREE.RingGeometry(.86,1,40),disc:new THREE.CircleGeometry(1,32)};return FXG;}
function fxMat(col,op){return new THREE.MeshBasicMaterial({color:new THREE.Color(col),transparent:true,opacity:op,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});}
function addFx(obj,life,opt){W3.scene.add(obj);const o=Object.assign({obj,life,max:life,base:obj.scale.x,op:opt&&opt.mat?opt.mat.opacity:1},opt||{});W3.fx.push(o);return o;}
function slashFx(x,y,z,ry,col){const g=new THREE.Group();const mt=fxMat(col||'#ffd9a0',.55);const m=new THREE.Mesh(fxGeo().slash,mt);m.rotation.x=-Math.PI/2;g.add(m);g.position.set(x,y+.9,z);g.rotation.y=ry;addFx(g,.22,{mat:mt,grow:.25});}
function ringFx(x,y,z,r,col,life){const mt=fxMat(col,.9);const m=new THREE.Mesh(fxGeo().ring,mt);m.rotation.x=-Math.PI/2;m.position.set(x,y+.15,z);m.scale.setScalar(.3);addFx(m,life||.4,{mat:mt,to:r});}
function burstFx(x,y,z,col,size){const s=mkGlow(col,size||3,.9);s.position.set(x,y,z);addFx(s,.35,{mat:s.material,grow:1.2});}
function updateFx(dt){const w=W3;w.fx=w.fx.filter(o=>{o.life-=dt;const k=1-Math.max(0,o.life)/o.max;if(o.mat)o.mat.opacity=o.op*(1-k);if(o.to)o.obj.scale.setScalar(.3+(o.to-.3)*Math.min(1,k*1.6));if(o.grow)o.obj.scale.setScalar(o.base*(1+k*o.grow));if(o.life<=0){w.scene.remove(o.obj);if(o.mat)o.mat.dispose();return false;}return true;});}
function teleOf(m){if(!m.tele){const r=new THREE.Mesh(fxGeo().disc,new THREE.MeshBasicMaterial({color:'#ff4a3a',transparent:true,opacity:0,depthWrite:false}));r.rotation.x=-Math.PI/2;W3.scene.add(r);m.tele=r;}return m.tele;}

