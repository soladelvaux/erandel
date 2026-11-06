/* ---------- "Spring" art style: bright storybook anime fantasy (ERANDEL_ART_BIBLE.md §19) ----------
 * The default look since 0.5: pastel gradient sky with soft clouds, lavender moonlit nights,
 * cel-shaded chibis with ink outlines and sparkling eyes, flower meadows, drifting petals,
 * and a colour grade that tints shadows violet instead of black. The older amber
 * night-diorama look stays selectable in Settings (Style) and with ?style=night. */

/** The art style in use: 'spring' (default) or 'night' (the classic cozy night diorama). */
function artStyle(){
 try{const m=/[?&]style=(spring|night)\b/.exec(location.search);if(m)return m[1];}catch(e){}
 return PREFS.style==='night'?'night':'spring';
}
const SPRING=artStyle()==='spring';

/** Light presets for the spring look (morning, afternoon, night). Same keys as LIGHT. */
const SPRING_LIGHT={
 0:{sky:'#fff0f4',gnd:'#7f9c6a',hi:.82,sun:'#fff0dc',si:.85,fog:'#f8dce6',night:.05,water:'#62c4dc'},
 1:{sky:'#f2f9ff',gnd:'#86b26e',hi:.85,sun:'#fffaf0',si:.9,fog:'#cfe8fa',night:0,water:'#4fbcdc'},
 2:{sky:'#8a82d0',gnd:'#2a2450',hi:.55,sun:'#b8c0ff',si:.3,fog:'#2c2a5e',night:1,water:'#2e4a8a'},
 dusk:'#ff98b4',
};
if(SPRING)Object.assign(LIGHT,SPRING_LIGHT);
try{if(SPRING)document.body.classList.add('spring');}catch(e){}

/** Three-tone ramp shared by every cel-shaded material. */
let TOON_RAMP=null;
function toonRamp(){
 if(TOON_RAMP)return TOON_RAMP;
 const d=new Uint8Array([140,140,150,255,200,198,205,255,236,236,236,255]);
 TOON_RAMP=new THREE.DataTexture(d,3,1,THREE.RGBAFormat);TOON_RAMP.minFilter=TOON_RAMP.magFilter=THREE.NearestFilter;TOON_RAMP.generateMipmaps=false;TOON_RAMP.needsUpdate=true;
 return TOON_RAMP;
}
/** A character material: cel-shaded MeshToonMaterial in the spring look, Lambert otherwise. */
function charMaterial(params){
 if(!SPRING)return new THREE.MeshLambertMaterial(params);
 return new THREE.MeshToonMaterial(Object.assign({gradientMap:toonRamp()},params));
}

/* ----- sky dome and clouds ----- */
function cloudTex(){
 const cv=document.createElement('canvas');cv.width=256;cv.height=128;const x=cv.getContext('2d'),r=mulberry(7);
 for(let i=0;i<14;i++){const px=40+r()*176,py=70+(r()-.5)*30-Math.sin((px-40)/176*Math.PI)*22,rr=18+r()*26;const g=x.createRadialGradient(px,py,0,px,py,rr);g.addColorStop(0,'rgba(255,255,255,.95)');g.addColorStop(.6,'rgba(255,255,255,.8)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.beginPath();x.arc(px,py,rr,0,7);x.fill();}
 return new THREE.CanvasTexture(cv);
}
function petalTex(){
 const cv=document.createElement('canvas');cv.width=cv.height=32;const x=cv.getContext('2d');
 x.fillStyle='#fff';x.beginPath();x.ellipse(16,16,13,8,.6,0,7);x.fill();
 x.globalCompositeOperation='destination-out';x.beginPath();x.arc(27,8,5,0,7);x.fill();
 return new THREE.CanvasTexture(cv);
}
/** Builds the spring sky, clouds, flower meadows and petals. Call once after the world exists. */
function springInit(){
 if(!SPRING||!W3)return;
 const w=W3,scene=w.scene,SP={};w.spring=SP;
 // gradient dome: horizon = fog colour, zenith = a deeper sky blue derived from it
 const dm=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,
  uniforms:{uH:{value:new THREE.Color('#cfe8fa')},uNight:{value:0}},
  vertexShader:'varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:'uniform vec3 uH;uniform float uNight;varying vec3 vD;void main(){float y=clamp(vD.y,0.0,1.0);vec3 day=uH*vec3(0.5,0.72,1.0)+vec3(0.02,0.06,0.12);vec3 nite=uH*vec3(0.55,0.5,0.9)*0.55;vec3 top=mix(day,nite,uNight);vec3 c=mix(uH,top,pow(y,0.55));gl_FragColor=vec4(c,1.0);}'});
 SP.dome=new THREE.Mesh(new THREE.SphereGeometry(390,24,12),dm);SP.dome.renderOrder=-3;SP.dome.frustumCulled=false;scene.add(SP.dome);
 const ct=cloudTex(),r=mulberry(41);SP.clouds=[];
 for(let i=0;i<9;i++){const m=new THREE.SpriteMaterial({map:ct,transparent:true,opacity:.85,fog:false,depthWrite:false});const s=new THREE.Sprite(m);const sc=60+r()*70;s.scale.set(sc,sc*.5,1);s.renderOrder=-2;scene.add(s);SP.clouds.push({s,a:r()*Math.PI*2,e:.08+r()*.22,v:(r()-.5)*.01});}
 // flower meadows
 const T=gfx(),N=Math.round(2600*T.density),fl=new THREE.InstancedMesh(new THREE.CylinderGeometry(.16,.06,.06,5),new THREE.MeshLambertMaterial({color:'#ffffff'}),N);
 fl.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(N*3),3);fl.frustumCulled=false;
 const ctr=new THREE.InstancedMesh(new THREE.SphereGeometry(.06,5,4),new THREE.MeshBasicMaterial({color:'#ffe27a'}),N);ctr.frustumCulled=false;
 const COLS=['#ffb3cf','#ffd6e6','#fff3a8','#d8c4ff','#ffffff','#a8e0ff','#ff9ec0'],GREEN={vael:1,greenmere:1,moonwell:1,sanctum:1};
 const d=new THREE.Object3D(),c=new THREE.Color(),fr=mulberry(23);let n=0;
 for(let tries=0;tries<N*6&&n<N;tries++){
  // clusters: pick a patch centre, then scatter a few blooms round it
  const px=WB.minX+14+fr()*(WB.maxX-WB.minX-28),pz=WB.minZ+14+fr()*(WB.maxZ-WB.minZ-28);if(!GREEN[regionAt(px,pz)])continue;
  const col=COLS[Math.floor(fr()*COLS.length)];
  for(let k=0;k<7&&n<N;k++){
   const x=px+(fr()-.5)*4,z=pz+(fr()-.5)*4;if(tileAt(x,z)||Math.abs(x)<2.6&&z>24&&z<74)continue;
   const h=heightAt(x,z);if(h<.25||h>9||Math.abs(heightAt(x+.6,z)-h)>.3||Math.abs(heightAt(x,z+.6)-h)>.3)continue;
   const s=.7+fr()*.6;d.position.set(x,h+.16*s,z);d.rotation.set((fr()-.5)*.4,fr()*6,(fr()-.5)*.4);d.scale.setScalar(s);d.updateMatrix();
   fl.setMatrixAt(n,d.matrix);fl.setColorAt(n,c.set(col));d.position.y+=.035*s;d.updateMatrix();ctr.setMatrixAt(n,d.matrix);n++;
  }
 }
 fl.count=ctr.count=n;fl.instanceMatrix.needsUpdate=ctr.instanceMatrix.needsUpdate=true;fl.instanceColor.needsUpdate=true;scene.add(fl,ctr);SP.flowers=fl;
 // drifting petals round the camera target
 const PN=Math.round(90+T.motes*.4),pos=new Float32Array(PN*3),pr=mulberry(5);for(let i=0;i<PN*3;i++)pos[i]=(pr()-.5)*36;
 const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(pos,3));
 SP.petals=new THREE.Points(pg,new THREE.PointsMaterial({map:petalTex(),color:'#ffc4da',size:.32,transparent:true,opacity:.85,depthWrite:false,alphaTest:.1}));SP.petals.frustumCulled=false;scene.add(SP.petals);
 SP.seed=pos.slice();
 springShadowsInit();
}
/** Per-frame spring update: dome colour, clouds, petals. nf = night factor 0..1. */
function springTick(dt,t,nf){
 adaptiveRes();
 const w=W3,SP=w&&w.spring;if(!SP)return;springShadowTick(dt);const cp=w.camera.position,night=Math.min(1,nf);
 SP.dome.position.copy(cp);SP.dome.material.uniforms.uH.value.copy(w.scene.fog.color);SP.dome.material.uniforms.uNight.value=night;
 SP.clouds.forEach(o=>{o.a+=o.v*dt;const R=300;o.s.position.set(cp.x+Math.cos(o.a)*R,cp.y+Math.sin(o.e)*R*.6+10,cp.z+Math.sin(o.a)*R);o.s.material.opacity=.85-.6*night;o.s.material.color.setRGB(1-.35*night,1-.38*night,1-.2*night);});
 const P=SP.petals,a=P.geometry.attributes.position.array,s=SP.seed,tg=(S&&w.player)?w.player:{x:cp.x,z:cp.z},by=S?groundY(tg.x,tg.z):heightAt(tg.x,tg.z);
 for(let i=0;i<a.length;i+=3){
  const k=i*.37,fx=s[i]+Math.sin(t*.35+k)*2+t*.9,fy=s[i+1]-t*.55,fz=s[i+2]+Math.cos(t*.3+k)*2+t*.4;
  const wr=(v)=>((v%36)+54)%36-18;a[i]=tg.x+wr(fx);a[i+1]=by+2+(((fy%14)+21)%14)-1;a[i+2]=tg.z+wr(fz);
 }
 P.geometry.attributes.position.needsUpdate=true;
 P.material.color.set(night>.5?'#d8e4ff':'#ffc4da');P.material.size=night>.5?.18:.32;
}

/* ----- post-process: anime colour grade + ink outlines from depth ----- */
const SPRING_GRADE={
 uniforms:{tDiffuse:{value:null},tDepth:{value:null},uRes:{value:null},uNear:{value:.5},uFar:{value:420},uInk:{value:1},uNight:{value:0}},
 vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
 fragmentShader:[
  'uniform sampler2D tDiffuse;uniform sampler2D tDepth;uniform vec2 uRes;uniform float uNear;uniform float uFar;uniform float uInk;uniform float uNight;varying vec2 vUv;',
  'float lin(vec2 uv){float z=texture2D(tDepth,uv).x*2.0-1.0;return 2.0*uNear*uFar/(uFar+uNear-z*(uFar-uNear));}',
  'void main(){',
  ' vec3 c=texture2D(tDiffuse,vUv).rgb;float l=dot(c,vec3(0.299,0.587,0.114));',
  ' c=mix(vec3(l),c,1.18);',                                     // livelier colour
  ' float q=floor(l*4.0+0.5)/4.0;c*=mix(1.0,clamp(q/max(l,0.02),0.6,1.5),0.22);', // soft cel bands
  ' c+=vec3(0.05,0.03,0.10)*(1.0-l)*(1.0-0.5*uNight);',          // violet shadows, never black
  ' c=mix(c,c*vec3(1.02,0.98,0.95),smoothstep(0.7,1.0,l));',      // warm highlights
  ' if(uInk>0.5){vec2 px=1.0/uRes;float d=lin(vUv);',
  '  if(d<uFar*0.9){float e=0.0;vec2 o[4];o[0]=vec2(px.x,0.0);o[1]=-o[0];o[2]=vec2(0.0,px.y);o[3]=-o[2];',
  '   for(int i=0;i<4;i++){float n=lin(vUv+o[i]);e=max(e,abs(n-d)/min(n,d));}',
  '   float k=smoothstep(0.08,0.2,e)*(1.0-smoothstep(25.0,70.0,d));c=mix(c,c*vec3(0.32,0.26,0.4),k*0.85);}}',
  ' gl_FragColor=vec4(clamp(c,0.0,1.0),1.0);}'
 ].join('\n'),
};
/** Adds the spring grade pass to an EffectComposer (with depth textures for the ink lines). */
function springComposer(c,w){
 if(!SPRING||!THREE.ShaderPass)return null;
 const ink=!IS_PHONE||gfxTier()!=='low';
 if(ink&&THREE.DepthTexture){[c.renderTarget1,c.renderTarget2].forEach(rt=>{rt.depthTexture=new THREE.DepthTexture(rt.width,rt.height);});}
 const p=new THREE.ShaderPass(SPRING_GRADE);p.uniforms.uRes.value=new THREE.Vector2(window.innerWidth,window.innerHeight);p.uniforms.uInk.value=ink&&THREE.DepthTexture?1:0;
 p.uniforms.uNear.value=w.camera.near;p.uniforms.uFar.value=w.camera.far;
 const base=p.render;p.render=function(r,wb,rb){this.uniforms.tDepth.value=rb.depthTexture||null;if(!rb.depthTexture)this.uniforms.uInk.value=0;this.uniforms.uRes.value.set(rb.width,rb.height);return base.apply(this,arguments);};
 c.addPass(p);return p;
}

/* ----- soft sun shadows near the player (pattern from the threejs-materials-lighting skill:
 *       renderer.shadowMap + light.castShadow + per-mesh cast/receive, with a tight
 *       orthographic shadow camera that follows the player) ----- */
/** Shadow budget per graphics tier: map size and whether instanced trees and rocks cast. */
const SPRING_SHADOW={low:null,medium:{map:1024,trees:false,span:18},high:{map:2048,trees:true,span:24}};
function springShadowsInit(){
 const w=W3,cfg=SPRING_SHADOW[gfxTier()];if(!SPRING||!cfg)return;
 const r=w.renderer;r.shadowMap.enabled=true;r.shadowMap.type=THREE.PCFSoftShadowMap;
 const sun=w.sun,sh=sun.shadow,c=sh.camera;sun.castShadow=true;sh.mapSize.set(cfg.map,cfg.map);
 c.left=c.bottom=-cfg.span;c.right=c.top=cfg.span;c.near=1;c.far=160;c.updateProjectionMatrix();
 sh.bias=-.0006;sh.normalBias=.04;sh.radius=3;w.scene.add(sun.target);
 w.terrain.receiveShadow=true;
 w.spring.shadow={cfg,t:0,trees:new Set(['itrunk','icanopy','icone','irock'].map(k=>GEO[k]).filter(Boolean))};
 springShadowTag();
}
/** Marks new meshes as shadow casters/receivers. Cheap: each mesh is visited once. */
function springShadowTag(){
 const s=W3.spring&&W3.spring.shadow;if(!s)return;
 W3.scene.traverse(o=>{
  if(!o.isMesh||o.userData.shT||o===W3.terrain||o===W3.water)return;o.userData.shT=1;
  const m=Array.isArray(o.material)?o.material[0]:o.material;if(!m||m.transparent||m.isMeshBasicMaterial||m.isShaderMaterial||m.alphaTest>0)return;
  o.receiveShadow=true;
  if(o.isInstancedMesh)o.castShadow=s.cfg.trees&&s.trees.has(o.geometry);else o.castShadow=true;
 });
}
/** Keeps the sun's shadow box centred on the player. */
function springShadowTick(dt){
 const s=W3.spring&&W3.spring.shadow;if(!s)return;
 const p=(S&&W3.player)?W3.player:{x:14,z:42},y=S?groundY(p.x,p.z):heightAt(p.x,p.z),sun=W3.sun;
 // snap to shadow texels so edges do not shimmer while walking
 const q=(s.cfg.span*2)/s.cfg.map,x=Math.round(p.x/q)*q,z=Math.round(p.z/q)*q;
 sun.position.set(x-24,y+48,z+20);sun.target.position.set(x,y,z);sun.target.updateMatrixWorld();
 s.t-=dt;if(s.t<=0){s.t=1;springShadowTag();}
}

/* ----- adaptive resolution (pattern from the threejs-scene-setup skill: measure sustained
 *       frame time, step the pixel ratio by 0.25 between a floor and the cap, with a cooldown
 *       and separate drop/raise thresholds so it never oscillates) ----- */
const ADAPT={floor:.75,step:.25,dropMs:30,raiseMs:19,window:3,cool:6,raiseAfter:3};
const ADAPT_S={cap:0,ratio:0,acc:0,n:0,cool:3,good:0,last:0};
function adaptiveRes(){
 const w=W3,now=performance.now();if(!w||!w.renderer||navigator.webdriver)return;const A=ADAPT_S; // automated browsers run at a few fps: keep their screenshots at full size
 if(!A.cap){A.cap=w.renderer.getPixelRatio();A.ratio=A.cap;A.last=now;return;}
 const d=now-A.last;A.last=now;
 if(d>250||document.hidden)return; // hidden tab or a loading stall: not a measurement
 A.acc+=d;A.n++;if(A.acc<ADAPT.window*1000)return;
 const avg=A.acc/A.n;A.acc=0;A.n=0;if(A.cool>0){A.cool-=ADAPT.window;return;}
 let next=A.ratio;
 if(avg>ADAPT.dropMs&&A.ratio>ADAPT.floor){next=Math.max(ADAPT.floor,A.ratio-ADAPT.step);A.good=0;}
 else if(avg<ADAPT.raiseMs&&A.ratio<A.cap){if(++A.good>=ADAPT.raiseAfter){next=Math.min(A.cap,A.ratio+ADAPT.step);A.good=0;}}
 else A.good=0;
 if(next!==A.ratio){A.ratio=next;A.cool=ADAPT.cool;w.renderer.setPixelRatio(next);w.renderer.setSize(window.innerWidth,window.innerHeight,false);if(w.composer){w.composer.setPixelRatio(next);w.composer.setSize(window.innerWidth,window.innerHeight);}window.__res=next;}
}
