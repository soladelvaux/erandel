/* ---------- painted textures (generated in code, no image files) ---------- */
/** A tiling hand-painted texture: base wash, brush streaks and speckle, in grey so vertex colours tint it. */
function paintTex(kind){
 const S2=256,cv=document.createElement('canvas');cv.width=cv.height=S2;const x=cv.getContext('2d'),r=mulberry(kind==='rock'?31:kind==='grass'?17:5);
 x.fillStyle='#d8d8d8';x.fillRect(0,0,S2,S2);
 const wrap=(f)=>{for(const ox of[-S2,0,S2])for(const oy of[-S2,0,S2]){x.save();x.translate(ox,oy);f();x.restore();}};
 if(kind==='rock'){
  for(let i=0;i<70;i++){const px=r()*S2,py=r()*S2,len=30+r()*90,wd=2+r()*7,g=90+r()*120|0;const a=`rgba(${g},${g},${g},${.25+r()*.35})`;wrap(()=>{x.strokeStyle=a;x.lineWidth=wd;x.lineCap='round';x.beginPath();x.moveTo(px,py);x.bezierCurveTo(px+(r()-.5)*14,py+len*.3,px+(r()-.5)*14,py+len*.7,px+(r()-.5)*8,py+len);x.stroke();});}
  for(let i=0;i<26;i++){const px=r()*S2,py=r()*S2,w2=20+r()*60;const g=235+r()*20|0;wrap(()=>{x.strokeStyle=`rgba(${g},${g},${g},.55)`;x.lineWidth=1.5+r()*2;x.beginPath();x.moveTo(px,py);x.lineTo(px+w2,py+(r()-.5)*6);x.stroke();});}
 }else if(kind==='grass'){
  for(let i=0;i<900;i++){const px=r()*S2,py=r()*S2,g=150+r()*100|0;x.strokeStyle=`rgba(${g},${g},${g},.5)`;x.lineWidth=1+r()*1.5;x.beginPath();x.moveTo(px,py);x.lineTo(px+(r()-.5)*4,py-4-r()*7);x.stroke();}
  for(let i=0;i<40;i++){const px=r()*S2,py=r()*S2,rr=10+r()*30,g=170+r()*70|0;wrap(()=>{x.fillStyle=`rgba(${g},${g},${g},.18)`;x.beginPath();x.arc(px,py,rr,0,7);x.fill();});}
 }else{
  for(let i=0;i<60;i++){const px=r()*S2,py=r()*S2,rr=8+r()*40,g=150+r()*100|0;wrap(()=>{x.fillStyle=`rgba(${g},${g},${g},.2)`;x.beginPath();x.ellipse(px,py,rr,rr*.5,r()*3,0,7);x.fill();});}
 }
 for(let i=0;i<1400;i++){const g=r()<.5?110:250;x.fillStyle=`rgba(${g},${g},${g},${.08+r()*.12})`;x.fillRect(r()*S2,r()*S2,1+r()*2,1+r()*2);}
 const t=new THREE.CanvasTexture(cv);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;
}
/** Terrain shader: blends painted grass on flat ground and streaked rock on slopes, tinted by the biome vertex colours. */
function paintTerrain(material){
 const grass=paintTex('grass'),rock=paintTex('rock');
 material.onBeforeCompile=sh=>{
  sh.uniforms.tGrass={value:grass};sh.uniforms.tRock={value:rock};
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWPos;\nvarying vec3 vWNorm;').replace('#include <begin_vertex>','#include <begin_vertex>\nvWPos=(modelMatrix*vec4(position,1.0)).xyz;\nvWNorm=normalize(mat3(modelMatrix)*normal);');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D tGrass;\nuniform sampler2D tRock;\nvarying vec3 vWPos;\nvarying vec3 vWNorm;').replace('#include <color_fragment>',
   '#include <color_fragment>\nfloat slope=1.0-clamp(vWNorm.y,0.0,1.0);\nfloat rk=smoothstep(0.18,0.42,slope);\nvec3 gC=texture2D(tGrass,vWPos.xz*0.11).rgb;\nvec3 rX=texture2D(tRock,vec2(vWPos.x*0.09,-vWPos.y*0.14)).rgb;\nvec3 rZ=texture2D(tRock,vec2(vWPos.z*0.09,-vWPos.y*0.14)).rgb;\nvec3 rC=mix(rX,rZ,abs(vWNorm.x)/(abs(vWNorm.x)+abs(vWNorm.z)+0.001));\nvec3 rockCol=mix(vec3(0.5,0.49,0.47),diffuseColor.rgb,0.25)*rC*1.25;\ndiffuseColor.rgb=mix(diffuseColor.rgb*gC*1.18,rockCol,rk);');
 };
 material.needsUpdate=true;
}
/** Props dissolve (dithered) when the camera is inside or right next to them, so trees never block the view. */
const FADE={value:null},FADE_CAM={value:null};
function nearFade(m){
 if(m.userData.faded)return m;m.userData.faded=true;
 m.onBeforeCompile=sh=>{
  sh.uniforms.uFadeP=FADE;sh.uniforms.uCamP=FADE_CAM;
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vFadeW;').replace('#include <begin_vertex>','#include <begin_vertex>\nvec4 fw=vec4(transformed,1.0);\n#ifdef USE_INSTANCING\nfw=instanceMatrix*fw;\n#endif\nvFadeW=(modelMatrix*fw).xyz;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vFadeW;\nuniform vec3 uFadeP;\nuniform vec3 uCamP;').replace('void main() {','void main() {\nvec3 fa=uCamP,fb=uFadeP+vec3(0.0,1.0,0.0),fab=fb-fa;float ft=clamp(dot(vFadeW-fa,fab)/max(dot(fab,fab),0.001),0.0,1.0);float fd=length(vFadeW-(fa+ft*fab));float fdC=distance(vFadeW,uCamP);float fk=min((fdC-1.0)/2.2,ft<0.9?(fd-0.6)/1.4:1.0);\nif(fk<1.0){vec2 ba=floor(gl_FragCoord.xy);vec2 bb=floor(ba*0.5);float th=fract(bb.x*0.5+bb.y*bb.y*0.75)*0.25+fract(ba.x*0.5+ba.y*ba.y*0.75)+0.03125;if(th>fk)discard;}');
 };
 m.needsUpdate=true;return m;
}
function discTex(){const cv=document.createElement('canvas');cv.width=cv.height=64;const x=cv.getContext('2d');const g=x.createRadialGradient(32,32,20,32,32,31);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.beginPath();x.arc(32,32,31,0,7);x.fill();return new THREE.CanvasTexture(cv);}
function makeSky(scene){
 const N=700,pos=new Float32Array(N*3),r=mulberry(99);for(let i=0;i<N;i++){const a=r()*Math.PI*2,e=.08+r()*1.3,R2=360;pos[i*3]=Math.cos(a)*Math.cos(e)*R2;pos[i*3+1]=Math.sin(e)*R2;pos[i*3+2]=Math.sin(a)*Math.cos(e)*R2;}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));
 const stars=new THREE.Points(g,new THREE.PointsMaterial({color:'#ffffff',size:1.7,sizeAttenuation:false,transparent:true,opacity:0,fog:false,depthWrite:false}));stars.frustumCulled=false;stars.renderOrder=-2;scene.add(stars);
 const bodyM=new THREE.SpriteMaterial({map:discTex(),color:new THREE.Color('#fff4d0'),transparent:true,fog:false,depthWrite:false});const body=new THREE.Sprite(bodyM);body.scale.set(24,24,1);body.renderOrder=-2;scene.add(body);
 const haloM=new THREE.SpriteMaterial({map:GT,color:new THREE.Color('#fff0c0'),transparent:true,opacity:.4,fog:false,depthWrite:false,blending:THREE.AdditiveBlending});const halo=new THREE.Sprite(haloM);halo.scale.set(110,110,1);halo.renderOrder=-2;scene.add(halo);
 return{stars,body,halo};
}
function updateSky(nf,dt){
 const w=W3,sk=w.sky,c=w.camera.position,k=Math.min(1,dt*2),night=Math.min(1,nf);
 sk.stars.position.copy(c);sk.stars.material.opacity+=(night*.9-sk.stars.material.opacity)*k;
 const dir=night>.5?[.55,.42,-.72]:[-.5,.55,-.66];const R2=330;
 sk.body.position.set(c.x+dir[0]*R2,c.y+dir[1]*R2,c.z+dir[2]*R2);sk.halo.position.copy(sk.body.position);
 sk.body.material.color.lerp(_c2.set(night>.5?'#e8f0ff':'#fff4d0'),k);sk.halo.material.color.lerp(_c2.set(night>.5?'#9ab4ff':'#fff0c0'),k);
 sk.halo.material.opacity+=((night>.5?.22:.38)-sk.halo.material.opacity)*k;
}

