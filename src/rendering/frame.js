const PERF=(()=>{try{return/[?&]perf\b/.test(location.search)?{el:null,n:0,t:0,max:0,last:0,calls:0,tris:0,gpu:''}:null;}catch(e){return null;}})();
function perfTick(){
 const p=PERF,w=W3;if(!p)return;const now=performance.now();
 if(!p.el){p.el=document.createElement('div');p.el.id='perf';p.el.style.cssText='position:fixed;left:6px;top:calc(6px + env(safe-area-inset-top,0px));z-index:60;pointer-events:none;font:11px/1.35 ui-monospace,monospace;color:#cfffcf;background:rgba(0,0,0,.72);padding:5px 7px;border-radius:6px;white-space:pre';document.body.appendChild(p.el);perfSpots();
  try{const gl=w.renderer.getContext(),x=gl.getExtension('WEBGL_debug_renderer_info');p.gpu=x?String(gl.getParameter(x.UNMASKED_RENDERER_WEBGL)).slice(0,40):'GPU name hidden';}catch(e){p.gpu='?';}p.last=now;return;}
 const d=now-p.last;p.last=now;p.n++;p.t+=d;if(d>p.max)p.max=d;p.calls=w.renderer.info.render.calls;p.tris=w.renderer.info.render.triangles;
 if(p.t>=1000){const fps=p.n*1000/p.t;window.__perf={fps:Math.round(fps),avgMs:+(p.t/p.n).toFixed(1),maxMs:Math.round(p.max),calls:p.calls,tris:p.tris};
  p.el.textContent=`${fps.toFixed(0)} fps  avg ${(p.t/p.n).toFixed(1)} ms  worst ${p.max.toFixed(0)} ms\n${p.calls} draw calls  ${(p.tris/1000).toFixed(0)}k tris\n${S&&REG[S.region]?REG[S.region].name:'title'}  ${innerWidth}x${innerHeight} @${w.renderer.getPixelRatio()}  glow ${PREFS.glow?'on':'off'}\nthree r${THREE.REVISION}  ${p.gpu}`;
  p.n=0;p.t=0;p.max=0;}
}
/** The seven measurement spots of the perf probe, so a real-device test matches the lab numbers. */
const PERF_SPOTS=[['1 Spawn',0,60],['2 Gate',0,46],['3 Plot',14,44],['4 Erelian',-44,4],['5 Cindral',56,-8],['6 Deep',46,-44],['7 Veilmoor',0,80]];
function perfSpots(){
 const bar=document.createElement('div');bar.style.cssText='position:fixed;left:6px;top:calc(84px + env(safe-area-inset-top,0px));z-index:60;display:flex;flex-wrap:wrap;gap:4px;max-width:250px';
 const mk=(t,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=t;b.style.cssText='font:11px ui-monospace,monospace;color:#cfffcf;background:rgba(0,0,0,.72);border:1px solid #4a8a4a;border-radius:5px;padding:3px 6px';b.addEventListener('click',e=>{e.stopPropagation();fn(b);});bar.appendChild(b);};
 PERF_SPOTS.forEach(([t,x,z])=>mk(t,()=>{if(!S||!W3)return;ui.dialog=null;S.pos={x,z};window.__teleport=true;W3.cam.yaw=0;W3.cam.pitch=.38;W3.grace=W3.clock.elapsedTime+60;render();}));
 mk('Night: off',b=>{PERF.night=!PERF.night;b.textContent='Night: '+(PERF.night?'on':'off');});
 document.body.appendChild(bar);
}
function renderFrame(){const w=W3;FADE_CAM.value.copy(w.camera.position);if(PERF){w.renderer.info.autoReset=false;w.renderer.info.reset();}if(w.composer)w.composer.render();else w.renderer.render(w.scene,w.camera);perfTick();}

function setRegion(r){
 if(ui.market&&r!=='vael')closeMarket('you left Thorngate');
 if(ui.build&&r!=='vael')ui.build=null;
 S.region=r;OUT=[];L(`You enter ${REG[r].name}.`,'mutl');flush();
 ui.banner={name:REG[r].name,sub:TAGLINE[r]};clearTimeout(ui._bt);ui._bt=setTimeout(()=>{ui.banner=null;render();},3200);
 save();render();
}
