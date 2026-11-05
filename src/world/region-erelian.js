/* ---------- Erelian benchmark region: runtime (docs/regions/erelian.md) ----------
 * Builds the region on top of the shared world: flowing water, waterfalls, distant mountains,
 * light shafts and drifting motes at once (generated, no download), then streams in the authored
 * prefabs (assets/game/erelian/*.glb, foliage atlas KTX2) and places them with instancing.
 * Off with ?region=off. If an asset fails to load, the region stays playable without it. */
const REGION={cnt:[0,0],updAt:0,lastCam:null,on:false,status:'off',loaded:[],errors:[],sets:[],atlas:null,wE:0,updT:0,water:null,falls:null,spray:null,mtn:null,rays:null,motes:null,base:null};
let PUT_OFF=false;
const _ru={m:null,m2:null,p:null,q:null,s:null,up:null,sph:null,fr:null,pm:null,col:null,tint:null};
function regionAssetBase(){return(window.ERANDEL_ASSETS||'assets/game/');}
/** The jsDelivr folder of the three.js add-ons, read from the page's import map. */
function threeAddonsBase(){try{const m=JSON.parse(document.querySelector('script[type="importmap"]').textContent);return m.imports['three/addons/']||null;}catch(e){return null;}}
function regionWanted(){try{return !/[?&]region=off\b/.test(location.search);}catch(e){return true;}}
/** Adds a collider to the world grid (same format as initWorld's colliders). */
function regionCol(x,z,r,cr,hi){const C=W3.COL,k=Math.floor(x/4)+','+Math.floor(z/4);if(!C.has(k))C.set(k,[]);const g=heightAt(x,z);C.get(k).push({x,z,r,cr:cr||r,lo:g,hi:g+(hi||12)});}

/* ----- instanced sets with CPU culling and distance LOD ----- */
/** One prefab drawn with InstancedMesh: lods = [[{geom,mat,mtx}], ...]; o = {cap, maxDist, lod0Dist, radius, color}.
 *  Example: const s=makeSet('rock',lods,{cap:80,maxDist:120,lod0Dist:30,radius:1.5}); s.add(x,y,z,ry,sc); */
function makeSet(name,lods,o){
 const set={name,o,n:0,cap:o.cap,x:new Float32Array(o.cap),y:new Float32Array(o.cap),z:new Float32Array(o.cap),r:new Float32Array(o.cap),s:new Float32Array(o.cap),c:o.color?new Float32Array(o.cap*3):null,lods:[]};
 set.lods=lods.map(parts=>parts.map(pt=>{const m=new THREE.InstancedMesh(pt.geom,pt.mat,o.cap);m.frustumCulled=false;m.count=0;m.visible=false;m.name=name;if(o.color)m.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(o.cap*3),3);W3.scene.add(m);return{m,mtx:pt.mtx};}));
 set.add=(x,y,z,ry,s,col)=>{if(set.n>=set.cap)return false;const i=set.n++;set.x[i]=x;set.y[i]=y;set.z[i]=z;set.r[i]=ry;set.s[i]=s;if(col&&set.c){set.c[i*3]=col[0];set.c[i*3+1]=col[1];set.c[i*3+2]=col[2];}return true;};
 REGION.sets.push(set);return set;
}
/** Rebuilds every set's visible instances for the camera: culls by distance and frustum, picks lod0 or lod1. */
function updateSets(cam){
 const u=_ru;u.pm.multiplyMatrices(cam.projectionMatrix,cam.matrixWorldInverse);u.fr.setFromProjectionMatrix(u.pm);
 const cx=cam.position.x,cz=cam.position.z;
 for(const set of REGION.sets){
  const o=set.o,max2=o.maxDist*o.maxDist,l02=o.lod0Dist*o.lod0Dist,nl=set.lods.length;
  const cnt0=REGION.cnt;cnt0[0]=0;cnt0[1]=0;
  for(let i=0;i<set.n;i++){
   const dx=set.x[i]-cx,dz=set.z[i]-cz,d2=dx*dx+dz*dz;if(d2>max2)continue;
   const s=set.s[i];u.sph.center.set(set.x[i],set.y[i]+o.radius*s*.6,set.z[i]);u.sph.radius=o.radius*s+3;if(!u.fr.intersectsSphere(u.sph))continue;
   const li=nl>1&&d2>l02?1:0,k=cnt0[li]++;
   u.m.compose(u.p.set(set.x[i],set.y[i],set.z[i]),u.q.setFromAxisAngle(u.up,set.r[i]),u.s.set(s,s,s));
   for(const pt of set.lods[li]){u.m2.multiplyMatrices(u.m,pt.mtx);pt.m.setMatrixAt(k,u.m2);if(set.c)pt.m.setColorAt(k,u.col.setRGB(set.c[i*3],set.c[i*3+1],set.c[i*3+2]));}
  }
  for(let li=0;li<nl;li++)for(const pt of set.lods[li]){pt.m.count=cnt0[li];pt.m.visible=cnt0[li]>0;if(cnt0[li]){pt.m.instanceMatrix.needsUpdate=true;if(pt.m.instanceColor)pt.m.instanceColor.needsUpdate=true;}}
 }
}

/* ----- water: river, streams, pools (one mesh, one shader) ----- */
function waterShader(){
 return new THREE.ShaderMaterial({
  uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{uT:{value:0},uNight:{value:0},uSky:{value:new THREE.Color('#bcd8e6')}}]),
  vertexShader:'attribute float depth;attribute float foam;attribute float fade;varying vec2 vUv;varying float vD;varying float vFoam;varying float vFade;varying vec3 vW;\n#include <fog_pars_vertex>\nvoid main(){vUv=uv;vD=depth;vFoam=foam;vFade=fade;vec4 wp=modelMatrix*vec4(position,1.0);vW=wp.xyz;vec4 mvPosition=viewMatrix*wp;gl_Position=projectionMatrix*mvPosition;\n#include <fog_vertex>\n}',
  fragmentShader:'uniform float uT;uniform float uNight;uniform vec3 uSky;varying vec2 vUv;varying float vD;varying float vFoam;varying float vFade;varying vec3 vW;\n#include <fog_pars_fragment>\n'+PAINT_NOISE+
   'void main(){float d=clamp(vD/2.4,0.0,1.0);vec3 c=mix(vec3(0.25,0.655,0.627),vec3(0.10,0.235,0.24),sqrt(d));\n'+
   'float f1=pN(vec3(vUv.x*7.0,vUv.y*0.55-uT*0.9,1.0)),f2=pN(vec3(vUv.x*13.0+3.0,vUv.y*1.1-uT*1.5,4.0));c+=smoothstep(0.58,0.82,f1*0.65+f2*0.35)*0.15;\n'+
   'float e=min(vUv.x,1.0-vUv.x);float fo=max(vFoam,1.0-smoothstep(0.0,0.16,e))*smoothstep(0.42,0.7,pN(vec3(vW.x*2.2,vW.z*2.2,uT*0.7)));c=mix(c,vec3(0.88,0.94,0.9),fo*0.6);\n'+
   'vec3 V=normalize(cameraPosition-vW);c=mix(c,uSky,pow(1.0-max(V.y,0.0),3.0)*0.45);c=mix(c,c*0.3+vec3(0.03,0.07,0.1),uNight);\n'+
   'gl_FragColor=vec4(c,0.9*smoothstep(0.0,0.07,e)*vFade);\n#include <fog_fragment>\n}',
  transparent:true,depthWrite:false,fog:true});
}
function nearFall(x,z){let f=0;for(const p of ERELIAN.pools){const d2=(x-p.x+1.5)*(x-p.x+1.5)+(z-p.z)*(z-p.z);f=Math.max(f,Math.exp(-d2/5));}return f;}
/** Appends a flowing ribbon along pts at water level y (or yFn) to the buffers. */
function ribbon(B,pts,width,y,seg){
 const S=[];let total=0;
 for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],len=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.max(1,Math.ceil(len/seg));for(let k=i?1:0;k<=n;k++){const t=k/n;S.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,total+len*t]);}total+=len;}
 const b0=B.pos.length/3;
 S.forEach((s,i)=>{const a=S[Math.max(0,i-1)],c=S[Math.min(S.length-1,i+1)];let tx=c[0]-a[0],tz=c[1]-a[1];const l=Math.hypot(tx,tz)||1;tx/=l;tz/=l;
  for(const side of[0,1]){const off=(side-.5)*width,x=s[0]-tz*off,z=s[1]+tx*off;B.pos.push(x,y,z);B.uv.push(side,s[2]);B.depth.push(Math.max(0,y-heightAt(x,z)));B.foam.push(nearFall(x,z));B.fade.push(Math.min(1,s[2]/4,(total-s[2])/4));}});
 for(let i=0;i<S.length-1;i++){const a=b0+i*2;B.idx.push(a,a+2,a+1,a+1,a+2,a+3);}
}
function pool(B,p,y){const b0=B.pos.length/3,N=28,R=p.r+1.4;B.pos.push(p.x,y,p.z);B.uv.push(.5,0);B.depth.push(Math.max(0,y-heightAt(p.x,p.z)));B.foam.push(nearFall(p.x,p.z));B.fade.push(1);
 for(let i=0;i<=N;i++){const a=i/N*Math.PI*2,x=p.x+Math.cos(a)*R,z=p.z+Math.sin(a)*R;B.pos.push(x,y,z);B.uv.push(0,a*R*.5);B.depth.push(Math.max(0,y-heightAt(x,z)));B.foam.push(nearFall(x,z));B.fade.push(1);}
 for(let i=0;i<N;i++)B.idx.push(b0,b0+1+i+1,b0+1+i);}
function buildWater(){
 const B={pos:[],uv:[],depth:[],foam:[],fade:[],idx:[]};const E=ERELIAN;
 ribbon(B,[[-20,-10.5],[-24,-6],[-38,14],[-44,34],[-46,40.5]],10,.04,1.2);
 E.streams.forEach(s=>ribbon(B,s,4.4,.05,1));E.pools.forEach(p=>pool(B,p,.06));
 E.upper.forEach(s=>ribbon(B,s,2.4,E.plateau.top-.35,.8));
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(B.pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(B.uv,2));
 g.setAttribute('depth',new THREE.Float32BufferAttribute(B.depth,1));g.setAttribute('foam',new THREE.Float32BufferAttribute(B.foam,1));g.setAttribute('fade',new THREE.Float32BufferAttribute(B.fade,1));g.setIndex(B.idx);
 const m=new THREE.Mesh(g,waterShader());m.renderOrder=1;m.name='erelian-water';W3.scene.add(m);return m;
}
/** Waterfall curtains from the plateau streams' lips into the pools. */
function buildFalls(){
 const pos=[],uv=[],idx=[];const top=ERELIAN.plateau.top-.35;
 ERELIAN.falls.forEach(f=>{const b0=pos.length/3,NV=12,NU=6,x0=f.x-1;
  for(let j=0;j<=NV;j++){const t=j/NV,x=x0+2.8*Math.pow(t,.7),y=top*(1-t)-.1*t;for(let i=0;i<=NU;i++){const u=i/NU,w=f.w*(1+.25*t);pos.push(x+Math.sin(u*3.1)*.25*t,y,f.z+(u-.5)*w);uv.push(u,t);}}
  for(let j=0;j<NV;j++)for(let i=0;i<NU;i++){const a=b0+j*(NU+1)+i;idx.push(a,a+NU+1,a+1,a+1,a+NU+1,a+NU+2);}});
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);
 const mat=new THREE.ShaderMaterial({uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{uT:{value:0},uNight:{value:0}}]),
  vertexShader:'varying vec2 vUv;\n#include <fog_pars_vertex>\nvoid main(){vUv=uv;vec4 mvPosition=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*mvPosition;\n#include <fog_vertex>\n}',
  fragmentShader:'uniform float uT;uniform float uNight;varying vec2 vUv;\n#include <fog_pars_fragment>\n'+PAINT_NOISE+'void main(){float s=pN(vec3(vUv.x*16.0,vUv.y*3.0-uT*2.6,2.0))*0.6+pN(vec3(vUv.x*31.0,vUv.y*6.0-uT*3.4,5.0))*0.4;\nvec3 c=mix(vec3(0.42,0.72,0.70),vec3(0.93,0.97,0.95),smoothstep(0.35,0.75,s));c=mix(c,c*0.35+vec3(0.04,0.08,0.11),uNight);\nfloat e=smoothstep(0.0,0.18,vUv.x)*smoothstep(1.0,0.82,vUv.x);float a=(0.45+0.5*s)*e*(1.0-smoothstep(0.85,1.0,vUv.y)*0.6);gl_FragColor=vec4(c,a*0.88);\n#include <fog_fragment>\n}',
  transparent:true,depthWrite:false,side:THREE.DoubleSide,fog:true});
 const m=new THREE.Mesh(g,mat);m.renderOrder=2;m.name='erelian-falls';W3.scene.add(m);
 ERELIAN.falls.forEach(f=>{const gl=mkGlow('#e8fff6',2.6,.14);gl.position.set(f.x+2.1,.7,f.z);W3.scene.add(gl);W3.glows.push({s:gl,base:.12,night:.08});});
 return m;
}
/** Spray and mist at the foot of each fall: one Points cloud, animated in the shader. */
function buildSpray(n){
 const seed=new Float32Array(n*4),pos=new Float32Array(n*3),r=mulberry(31);
 for(let i=0;i<n;i++){const f=ERELIAN.falls[i%ERELIAN.falls.length];pos[i*3]=f.x+1.9;pos[i*3+1]=0;pos[i*3+2]=f.z;seed[i*4]=r();seed[i*4+1]=r();seed[i*4+2]=r();seed[i*4+3]=f.w;}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('seed',new THREE.BufferAttribute(seed,4));
 const mat=new THREE.ShaderMaterial({uniforms:{uT:{value:0},uMap:{value:GT},uNight:{value:0},uScale:{value:W3.renderer.domElement.height*.5}},
  vertexShader:'attribute vec4 seed;uniform float uT;uniform float uScale;varying float vA;void main(){float t=fract(uT*0.35+seed.x);vec3 p=position+vec3((seed.y-0.5)*2.4+t*1.2,t*2.6*(0.4+seed.z),(seed.z-0.5)*seed.w*1.2);vA=sin(t*3.14159)*0.55;vec4 mv=modelViewMatrix*vec4(p,1.0);gl_Position=projectionMatrix*mv;gl_PointSize=(0.6+seed.z*0.9+t*1.4)*uScale/max(1.0,-mv.z);}',
  fragmentShader:'uniform sampler2D uMap;uniform float uNight;varying float vA;void main(){vec4 t=texture2D(uMap,gl_PointCoord);gl_FragColor=vec4(mix(vec3(0.92,0.98,0.96),vec3(0.35,0.45,0.55),uNight),t.a*vA);}',
  transparent:true,depthWrite:false});
 const pts=new THREE.Points(g,mat);pts.frustumCulled=false;pts.name='erelian-spray';W3.scene.add(pts);return pts;
}
/** Distant mountain ridges around the whole map, tinted toward the haze colour. */
function buildMountains(){
 const pos=[],lay=[],idx=[];const N=160,layers=[[215,26,60],[275,40,95],[345,55,130]];
 layers.forEach(([R,h0,amp],li)=>{const b0=pos.length/3;for(let i=0;i<=N;i++){const a=i/N*Math.PI*2,n=fbm(Math.cos(a)*40+li*31,Math.sin(a)*40)+.5*fbm(Math.cos(a)*120,Math.sin(a)*120+li*9),ridge=h0+amp*Math.pow(Math.max(0,n-.25),1.4);
   const x=Math.cos(a)*R,z=10+Math.sin(a)*R;pos.push(x,-30,z,x,ridge,z);lay.push(li,0,li,1);}
  for(let i=0;i<N;i++){const a=b0+i*2;idx.push(a,a+2,a+1,a+1,a+2,a+3);}});
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('lay',new THREE.Float32BufferAttribute(lay,2));g.setIndex(idx);
 const mat=new THREE.ShaderMaterial({uniforms:{uHaze:{value:new THREE.Color('#bcd8e6')},uNight:{value:0}},
  vertexShader:'attribute vec2 lay;varying vec2 vL;varying float vY;void main(){vL=lay;vY=position.y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:'uniform vec3 uHaze;uniform float uNight;varying vec2 vL;varying float vY;void main(){vec3 rock=mix(vec3(0.30,0.38,0.36),vec3(0.42,0.47,0.52),vL.x*0.5);float k=0.42+vL.x*0.18;vec3 c=mix(rock,uHaze,k);c=mix(c,uHaze,(1.0-smoothstep(-10.0,60.0,vY))*0.55);c=mix(c,mix(c,vec3(0.95,0.97,1.0),0.35),smoothstep(70.0,120.0,vY)*(1.0-uNight));gl_FragColor=vec4(c,1.0);}',
  side:THREE.DoubleSide,depthWrite:true});
 const m=new THREE.Mesh(g,mat);m.frustumCulled=false;m.renderOrder=-1;m.name='mountains';W3.scene.add(m);return m;
}
/** Light shafts through the Erelian canopy (daytime, additive). */
function buildRays(){
 const spots=[[-46,2],[-50,14],[-40,-6],[-55,22],[-34,8],[-58,-8],[-67,10],[-48,28]];
 const pos=[],uv=[],sd=[],idx=[];const dir=[.5,.66];
 spots.forEach(([x,z],k)=>{const y=heightAt(x,z),H=20,w=2.6+(k%3);for(const rot of[0,Math.PI/2]){const b0=pos.length/3,cx=Math.cos(rot+k),cz=Math.sin(rot+k);
   const tx=x+dir[0]*10,tz=z+dir[1]*10;
   pos.push(x-cx*w/2,y-1,z-cz*w/2,x+cx*w/2,y-1,z+cz*w/2,tx+cx*w*.8,y+H,tz+cz*w*.8,tx-cx*w*.8,y+H,tz-cz*w*.8);uv.push(0,0,1,0,1,1,0,1);sd.push(k,k,k,k);idx.push(b0,b0+1,b0+2,b0,b0+2,b0+3);}});
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setAttribute('sd',new THREE.Float32BufferAttribute(sd,1));g.setIndex(idx);
 const mat=new THREE.ShaderMaterial({uniforms:{uT:{value:0},uOp:{value:0}},vertexShader:'attribute float sd;varying vec2 vUv;varying float vS;void main(){vUv=uv;vS=sd;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:'uniform float uT;uniform float uOp;varying vec2 vUv;varying float vS;void main(){float a=pow(1.0-abs(vUv.x*2.0-1.0),2.0)*smoothstep(0.0,0.25,vUv.y)*smoothstep(1.0,0.45,vUv.y);a*=0.65+0.35*sin(uT*0.35+vS*1.7);gl_FragColor=vec4(vec3(1.0,0.96,0.82)*a*uOp,1.0);}',
  transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
 const m=new THREE.Mesh(g,mat);m.renderOrder=3;m.name='erelian-rays';W3.scene.add(m);return m;
}
/** Drifting pollen by day and fireflies at night around the camera (wraps in a 44 m box). */
function buildMotes(n){
 const p=new Float32Array(n*3),s=new Float32Array(n),r=mulberry(57);for(let i=0;i<n;i++){p[i*3]=r()*44;p[i*3+1]=r()*9;p[i*3+2]=r()*44;s[i]=r();}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('sd',new THREE.BufferAttribute(s,1));
 const mat=new THREE.ShaderMaterial({uniforms:{uT:{value:0},uC:{value:new THREE.Vector3()},uOp:{value:0},uNight:{value:0},uMap:{value:GT},uScale:{value:W3.renderer.domElement.height*.5}},
  vertexShader:'attribute float sd;uniform float uT;uniform vec3 uC;uniform float uScale;uniform float uNight;varying float vA;void main(){vec3 q=position+vec3(sin(uT*0.3+sd*9.0)*1.5+uT*0.4,sin(uT*0.5+sd*5.0)*0.8,cos(uT*0.25+sd*7.0)*1.5);vec3 w=uC+mod(q-uC+22.0,44.0)-22.0;w.y=uC.y-2.0+mod(q.y,9.0);\nvA=mix(0.55,0.5+0.5*sin(uT*2.2+sd*31.0),uNight);vec4 mv=modelViewMatrix*vec4(w,1.0);gl_Position=projectionMatrix*mv;gl_PointSize=mix(0.18,0.32,uNight)*uScale/max(1.0,-mv.z);}',
  fragmentShader:'uniform sampler2D uMap;uniform float uOp;uniform float uNight;varying float vA;void main(){vec4 t=texture2D(uMap,gl_PointCoord);gl_FragColor=vec4(mix(vec3(1.0,0.95,0.75),vec3(0.8,1.0,0.45),uNight)*t.a*vA*uOp,1.0);}',
  transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
 const m=new THREE.Points(g,mat);m.frustumCulled=false;m.name='erelian-motes';W3.scene.add(m);return m;
}

/* ----- placement (deterministic) ----- */
const ERELIAN_STRUCTURES=[
 ['env_erelian_spire_b',-66,12,.2,1],['env_erelian_spire_a',-67,26,1.1,1],['env_erelian_spire_a',-53.5,0,.6,.9],['env_erelian_spire_b',-55.5,15.5,2.3,.85],['env_erelian_spire_a',-69,-9,.4,1.05],
 ['env_erelian_ruin-arch',-64.6,8,Math.PI/2,1.05],['env_erelian_ruin-arch_broken',-47.5,-12.5,.5,1],['env_erelian_ruin-wall',-52,-15,.2,1],['env_erelian_ruin-wall',-36,-14,2.2,.9],
 ['env_erelian_ruin-pillar',-53.4,11.3,0,1],['env_erelian_ruin-pillar',-53.4,4.7,1,1],['env_erelian_ruin-pillar_short',-44,-9.5,.3,1],['env_erelian_ruin-pillar',-41,-11.5,1.4,.9],['env_erelian_ruin-pillar_short',-56.5,25.5,2,1],
 ['env_erelian_stairs',-55,8,0,1],['env_erelian_bridge',-39.8,20,0,1],
];
function erelianFree(x,z,clear){
 if(regionAt(x,z)!=='greenmere')return false;const h=heightAt(x,z);if(h<.35)return false;
 const E=ERELIAN;if(Math.hypot(x-E.centre[0],z-E.centre[1])<7+clear)return false;
 for(const k in NPC_POS){const p=NPC_POS[k];if((p[0]-x)**2+(p[1]-z)**2<16)return false;}
 if(Math.abs(z-E.stairs.z)<E.stairs.w/2+1.2+clear&&x<E.stairs.x+2&&x>E.stairs.x-E.stairs.run-2.5)return false;
 const[s,l]=bridgeLocal(x,z);if(Math.abs(s)<12&&Math.abs(l)<3+clear)return false;
 for(const st of E.streams)if(polyDist(x,z,st)<2.2+clear)return false;
 for(const st of E.upper)if(polyDist(x,z,st)<1.6+clear)return false;
 for(const p of E.pools)if(Math.hypot(x-p.x,z-p.z)<p.r+1+clear)return false;
 for(const f of E.falls)if(Math.abs(z-f.z)<f.w/2+1&&x>f.x-1.5&&x<f.x+4.5)return false;
 for(const st of ERELIAN_STRUCTURES)if(Math.hypot(x-st[1],z-st[2])<3+clear)return false;
 return true;
}
function slopeAt(x,z){return Math.hypot(heightAt(x+.7,z)-heightAt(x-.7,z),heightAt(x,z+.7)-heightAt(x,z-.7))/1.4;}
/** Places a loaded pack's prefabs. lib: prefab name -> lods. */
function placePack(pack,lib){
 const T=gfx(),B=ERELIAN.box,r=mulberry({env_erelian_ruins:11,env_erelian_rocks:12,veg_erelian_trees:13,veg_all_groundcover:14}[pack]||1);
 const set=(name,o)=>lib[name]?makeSet(name,lib[name],o):null;
 if(pack==='env_erelian_ruins'){
  const sets={};ERELIAN_STRUCTURES.forEach(([n])=>{if(!sets[n])sets[n]=set(n,{cap:8,maxDist:T.treeDist+60,lod0Dist:T.lod0Dist+16,radius:n.includes('spire')?11:n.includes('bridge')?7:4});});
  ERELIAN_STRUCTURES.forEach(([n,x,z,ry,s])=>{const st=sets[n];if(!st)return;
   if(n==='env_erelian_bridge'){st.add(x,0,z,ERELIAN.bridge.ang,1);return;}
   if(n==='env_erelian_stairs'){st.add(x,ERELIAN.stairs.base,z,0,1);return;}
   const y=heightAt(x,z)-.15;st.add(x,y,z,ry,s);
   if(n.includes('spire'))regionCol(x,z,1.5*s,1.5*s,24);else if(n.includes('arch')){const c=Math.cos(ry),sn=Math.sin(ry);for(const d of[-3.1,3.1])regionCol(x+c*d,z-sn*d,.9,1.1,5);}else if(n.includes('wall'))for(let d=-3;d<=3;d+=1.5)regionCol(x+Math.cos(ry)*d,z-Math.sin(ry)*d,.75,1,3);else regionCol(x,z,.7,1,4);});
 }
 if(pack==='env_erelian_rocks'){
  const sA=set('env_erelian_rock_a',{cap:90,maxDist:T.treeDist,lod0Dist:T.lod0Dist,radius:1.4}),sB=set('env_erelian_rock_b',{cap:90,maxDist:T.treeDist,lod0Dist:T.lod0Dist,radius:1.3}),sF=set('env_erelian_rock_flat',{cap:60,maxDist:T.treeDist,lod0Dist:T.lod0Dist,radius:1.6}),sC=set('env_erelian_boulder_cliff',{cap:24,maxDist:T.treeDist+40,lod0Dist:T.lod0Dist+10,radius:3.5}),sL=set('veg_erelian_log',{cap:12,maxDist:T.treeDist*.7,lod0Dist:T.lod0Dist,radius:3});
  for(let z=-14;z<=31;z+=3.3){const x=ERELIAN.plateau.cliffX+1.6+r()*1.2;if(Math.abs(z-ERELIAN.stairs.z)<4.5)continue;if(ERELIAN.falls.some(f=>Math.abs(z-f.z)<f.w/2+1.6))continue;if(ERELIAN.pools.some(p=>Math.hypot(x-p.x,z-p.z)<p.r+1.5))continue;const s=.7+r()*.6;sC&&sC.add(x,heightAt(x,z)-.4,z,r()*6,s);regionCol(x,z,2.4*s,2.4*s,3*s);}
  let n=0;for(let i=0;i<900&&n<150*T.density+40;i++){const x=B.minX+4+r()*(B.maxX-B.minX-6),z=B.minZ+2+r()*(B.maxZ-B.minZ-4);
   const nearW=Math.min(...ERELIAN.streams.map(s=>polyDist(x,z,s)),riverDist(x,z));const want=nearW<5?.8:.18;if(r()>want)continue;if(!erelianFree(x,z,.2))continue;
   const s=.35+r()*.75,k=r(),st=k<.4?sA:k<.75?sB:sF;if(!st)continue;st.add(x,heightAt(x,z)-.12*s,z,r()*6,s);if(s>.7)regionCol(x,z,.9*s,.9*s,1.2*s);n++;}
  ERELIAN.upper.forEach(u=>{const[x,z]=u[0];sC&&sC.add(x-1.4,heightAt(x-1.4,z)-.6,z,r()*6,.75);regionCol(x-1.4,z,1.8,1.8,2.5);});
  for(let i=0;i<60&&sL&&sL.n<8;i++){const x=-74+r()*44,z=-18+r()*52;if(!erelianFree(x,z,1.5)||slopeAt(x,z)>.3)continue;sL.add(x,heightAt(x,z)-.1,z,r()*6,.8+r()*.3);}
 }
 if(pack==='veg_erelian_trees'){
  const opt=(rad)=>({cap:260,maxDist:T.treeDist,lod0Dist:T.lod0Dist,radius:rad});
  const H=set('veg_erelian_white-tree_hero',{cap:4,maxDist:T.treeDist+60,lod0Dist:T.lod0Dist+20,radius:10});
  const kinds=[set('veg_erelian_white-tree_a',opt(5)),set('veg_erelian_white-tree_b',opt(6)),set('veg_erelian_green-tree_a',opt(5.5)),set('veg_erelian_green-tree_b',opt(4.5))];
  [[-49.5,16.5,1],[-71,6,.9],[-36,-2,.8]].forEach(([x,z,s])=>{if(H){H.add(x,heightAt(x,z)-.2,z,r()*6,s);regionCol(x,z,1.5*s,1.6*s,14);}});
  for(let gx=B.minX+2;gx<B.maxX;gx+=2.2)for(let gz=B.minZ+1;gz<B.maxZ;gz+=2.2){
   const x=gx+(r()-.5)*1.9,z=gz+(r()-.5)*1.9,grove=sm01((fbm(x*1.6+90,z*1.6-40)-.42)/.2),plat=x<ERELIAN.plateau.cliffX-2?.3:0;
   const d=Math.min(1,(.35+.65*grove)*.9+plat)*T.density;if(r()>d)continue;if(!erelianFree(x,z,1.2)||slopeAt(x,z)>.8)continue;
   if([[-49.5,16.5],[-71,6],[-36,-2]].some(h=>Math.hypot(x-h[0],z-h[1])<6))continue;
   const k=r(),st=kinds[k<.32?0:k<.6?1:k<.82?2:3];if(!st)continue;const s=.9+r()*.55;st.add(x,heightAt(x,z)-.15,z,r()*6,s);regionCol(x,z,.42*s,.5*s,8*s);}
 }
 if(pack==='veg_all_groundcover'){
  const gc=(n,rad,cap)=>set(n,{cap,maxDist:T.grassDist,lod0Dist:999,radius:rad,color:true});
  const G=gc('veg_all_grass-clump',.8,T.maxGrass),GT2=gc('veg_all_grass-tall',1,Math.round(T.maxGrass*.35)),FL=gc('veg_all_flowers',.8,Math.round(T.maxGrass*.25)),FE=gc('veg_all_fern',1.2,Math.round(T.maxGrass*.2)),RE=gc('veg_all_reeds',1.2,400),BU=gc('veg_all_bush',1.4,240);
  const tint=(x,z,h)=>{const c=colorAt(x,z,h);return[.55+c[0]*.9,.55+c[1]*.9,.55+c[2]*.9];};
  const step=.95/Math.sqrt(T.density);
  for(let gx=B.minX+1;gx<B.maxX;gx+=step)for(let gz=B.minZ+1;gz<B.maxZ;gz+=step){
   const x=gx+(r()-.5)*step,z=gz+(r()-.5)*step;if(regionAt(x,z)!=='greenmere')continue;const h=heightAt(x,z);
   const water=Math.min(riverDist(x,z),...ERELIAN.streams.map(s=>polyDist(x,z,s)),...ERELIAN.pools.map(p=>Math.hypot(x-p.x,z-p.z)-p.r));
   if(h>.05&&h<.9&&water<4.5){if(r()<.5&&RE)RE.add(x,h-.05,z,r()*6,.8+r()*.5,[1,1,1]);continue;}
   if(h<.3||slopeAt(x,z)>.75)continue;if(!erelianFree(x,z,-1.5))continue;
   const grove=sm01((fbm(x*1.6+90,z*1.6-40)-.42)/.2),fl=sm01((fbm(x*2.3-30,z*2.3+11)-.55)/.15),k=r(),c=tint(x,z,h),s=.75+r()*.5,ry=r()*6;
   if(grove>.5&&k<.12){FE&&FE.add(x,h-.05,z,ry,s,[1,1,1]);continue;}
   if(grove>.5&&k<.16){BU&&BU.add(x,h-.1,z,ry,s,[1,1,1]);continue;}
   if(fl>.4&&k<.35){FL&&FL.add(x,h-.03,z,ry,s,[1,1,1]);continue;}
   if(k<.72)G&&G.add(x,h-.04,z,ry,s,c);else if(k<.86)GT2&&GT2.add(x,h-.04,z,ry,s,c);}
 }
 REGION.updT=0;
}

/* ----- loading ----- */
async function loadRegionTex(base){
 const add=threeAddonsBase();
 try{const {KTX2Loader}=await import('three/addons/loaders/KTX2Loader.js');const l=new KTX2Loader().setTranscoderPath(add+'libs/basis/').detectSupport(W3.renderer);const t=await l.loadAsync(base+'all/tex_all_foliage-atlas.ktx2');return t;}
 catch(e){REGION.errors.push('ktx2: '+(e&&e.message||e));}
 const t=await new THREE.TextureLoader().loadAsync(base+'all/tex_all_foliage-atlas.png');t.flipY=false;t.needsUpdate=true;return t;
}
/** Streams in the region's packs, nearest-first by importance, placing each as it arrives. */
async function loadRegion(){
 const base=regionAssetBase();REGION.status='loading';
 try{
  const [{GLTFLoader},{MeshoptDecoder}]=await Promise.all([import('three/addons/loaders/GLTFLoader.js'),import('three/addons/libs/meshopt_decoder.module.js')]);
  REGION.atlas=await loadRegionTex(base);REGION.atlas.anisotropy=Math.min(4,W3.renderer.capabilities.getMaxAnisotropy());
  const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  for(const pack of['env_erelian_ruins','env_erelian_rocks','veg_erelian_trees','veg_all_groundcover']){
   try{const g=await loader.loadAsync(base+'erelian/'+pack+'.glb');g.scene.updateMatrixWorld(true);const lib={},windy=pack.startsWith('veg');
    g.scene.children.forEach(node=>{const mm=/^(.*)_lod(\d)$/.exec(node.name);if(!mm)return;const parts=[];node.traverse(o=>{if(o.isMesh)parts.push({geom:o.geometry,mtx:o.matrixWorld.clone(),mat:paintedMat(o.material.name==='erandel-foliage'?'foliage':'painted',windy,REGION.atlas,pack==='veg_all_groundcover'||/rock_|log|bridge|stairs/.test(mm[1]))});});(lib[mm[1]]=lib[mm[1]]||[])[+mm[2]]=parts;});
    placePack(pack,lib);REGION.loaded.push(pack);}
   catch(e){REGION.errors.push(pack+': '+(e&&e.message||e));console.warn('Erelian pack did not load',pack,e);}
  }
  REGION.status=REGION.errors.length&&!REGION.loaded.length?'failed':'ready';
 }catch(e){REGION.status='failed';REGION.errors.push(String(e&&e.message||e));console.warn('Erelian assets did not load; the region stays playable without them',e);}
}
/** Called once from initWorld when the 3D world exists. Builds the generated parts at once and starts streaming assets. */
function erelianInit(){
 if(!regionWanted())return;REGION.on=true;
 const u=_ru;u.m=new THREE.Matrix4();u.m2=new THREE.Matrix4();u.p=new THREE.Vector3();u.q=new THREE.Quaternion();u.s=new THREE.Vector3();u.up=new THREE.Vector3(0,1,0);u.sph=new THREE.Sphere();u.fr=new THREE.Frustum();u.pm=new THREE.Matrix4();u.col=new THREE.Color();u.tint=new THREE.Color();u.mist=new THREE.Color('#c3d1ae');u.gnd=new THREE.Color('#3f4f33');u.sunW=new THREE.Color('#ffe6bc');
 const T=gfx();REGION.tier=gfxTier();
 REGION.water=buildWater();REGION.falls=buildFalls();REGION.spray=buildSpray(T.spray);REGION.mtn=buildMountains();if(T.rays)REGION.rays=buildRays();REGION.motes=buildMotes(T.motes);
 REGION.status='waiting';setTimeout(()=>{loadRegion();},700);
}
/** Per-frame update: shader clocks, region weight, atmosphere blend, instance culling (throttled). */
function erelianTick(dt,t,nf){
 if(!REGION.on)return;const w=W3,u=_ru,night=Math.max(0,Math.min(1,nf));PAINT_T.value=t;
 const px=w.player?w.player.x:0,pz=w.player?w.player.z:0,dist=Math.hypot(px-ERELIAN.centre[0],pz-ERELIAN.centre[1]);
 const wE=1-sm01((dist-30)/24);REGION.wE+=(wE-REGION.wE)*Math.min(1,dt*1.5);const e=REGION.wE,k=Math.min(1,dt*2)*e;
 if(e>.001){const day=1-night;w.scene.fog.color.lerp(u.mist,k*.45*day);w.scene.background.lerp(u.mist,k*.45*day);w.hemi.groundColor.lerp(u.gnd,k*.6);w.sun.color.lerp(u.sunW,k*.5*day);w.hemi.intensity+=(w.hemi.intensity*.72-w.hemi.intensity)*k;w.sun.intensity+=(w.sun.intensity*1.18-w.sun.intensity)*k*day;w.scene.fog.near+=(w.scene.fog.near*.62-w.scene.fog.near)*k;}
 if(REGION.water){const U=REGION.water.material.uniforms;U.uT.value=t;U.uNight.value=night;U.uSky.value.copy(w.scene.fog.color);}
 if(REGION.falls){const U=REGION.falls.material.uniforms;U.uT.value=t;U.uNight.value=night;}
 if(REGION.spray){REGION.spray.material.uniforms.uT.value=t;REGION.spray.material.uniforms.uNight.value=night;}
 if(REGION.mtn){REGION.mtn.visible=e>.02;REGION.mtn.material.uniforms.uHaze.value.copy(w.scene.fog.color);REGION.mtn.material.uniforms.uNight.value=night;}
 if(REGION.rays){REGION.rays.material.uniforms.uT.value=t;REGION.rays.material.uniforms.uOp.value=e*(1-night)*.16;REGION.rays.visible=e>.02&&night<.9;}
 if(REGION.motes){const U=REGION.motes.material.uniforms;U.uT.value=t;U.uC.value.copy(w.camera.position);U.uNight.value=night;U.uOp.value=e*(.5+.5*night);REGION.motes.visible=e>.02;}
 if(REGION.sets.length){const now=performance.now(),c=w.camera.position,L=REGION.lastCam;const jumped=!L||Math.abs(c.x-L.x)+Math.abs(c.z-L.z)>4;
  if(jumped||now-REGION.updAt>180){REGION.updAt=now;REGION.lastCam=REGION.lastCam||new THREE.Vector3();REGION.lastCam.copy(c);updateSets(w.camera);}}
}
