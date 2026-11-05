/* ---------- pointer: tap to walk, tap to build, pinch zoom ---------- */
function initPointer(canvas){
 const pts=new Map();let down=null,pinch0=0,zoom0=1;const ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),-PLOT.land),hit=new THREE.Vector3();
 const toNdc=e=>{const r=canvas.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);ray.setFromCamera(ndc,W3.camera);};
 const tileFromEvent=e=>{toNdc(e);if(!ray.ray.intersectPlane(plane,hit))return null;return tileAt(hit.x,hit.z);};
 canvas.addEventListener('pointerdown',e=>{pts.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pts.size===1)down={x:e.clientX,y:e.clientY,t:performance.now(),moved:false,bx:W3.buildCam.x,bz:W3.buildCam.z};if(pts.size===2){const a=[...pts.values()];pinch0=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);zoom0=W3.zoom;if(down)down.moved=true;}});
 canvas.addEventListener('pointermove',e=>{
  if(pts.has(e.pointerId))pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pts.size===2){const a=[...pts.values()];const d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);if(pinch0>0)W3.zoom=clamp(zoom0*pinch0/d,.5,1.7);return;}
  if(down&&pts.size===1){const dx=e.clientX-down.x,dy=e.clientY-down.y;if(Math.hypot(dx,dy)>9)down.moved=true;
   if(!ui.build&&down.moved&&ui.screen==='game'&&S&&!ui.dialog&&!ui.journal&&!ui.photo){const lx=down.lx==null?down.x:down.lx,ly=down.ly==null?down.y:down.ly;W3.cam.yaw-=(e.clientX-lx)*.0075;W3.cam.pitch=clamp(W3.cam.pitch+(e.clientY-ly)*.005,ACT.pitchMin,ACT.pitchMax);}
   down.lx=e.clientX;down.ly=e.clientY;
   if(ui.build&&down.moved){const k=.05*W3.zoom*(W3.camDist/30);W3.buildCam.x=clamp(down.bx-dx*k,PLOT.x0,PLOT.x0+PLOT.cols*PLOT.t);W3.buildCam.z=clamp(down.bz-dy*k,PLOT.z0-4,PLOT.z0+PLOT.rows*PLOT.t+4);}}
  if(ui.build&&e.pointerType==='mouse'&&!pts.size)W3.hover=tileFromEvent(e);
 });
 const end=e=>{
  const wasTap=down&&!down.moved&&pts.size===1&&performance.now()-down.t<600;pts.delete(e.pointerId);if(pts.size===0)down=null;
  if(!wasTap)return;
  if(ui.photo){ui.photo=false;document.body.classList.remove('photo');render();return;}
  if(ui.build){const t=tileFromEvent(e);if(!t)return;W3.hover=t;if(ui.build.tool==='remove'){const err=buildRemove(t.c,t.r);if(err)toast(err);}else{const err=buildPlace(ui.build.sel,t.c,t.r,ui.build.rot);if(err)toast(err);}render();return;}
  if(ui.screen==='game'&&S&&!ui.dialog&&!ui.journal){toNdc(e);
   const mh=ray.intersectObjects(W3.monsters.filter(m=>m.alive).map(m=>m.mo.g),true)[0];
   if(mh){let o=mh.object;while(o&&!o.userData.mon)o=o.parent;if(o){const m=o.userData.mon,p=W3.player;W3.target=m;if(Math.hypot(m.x-p.x,m.z-p.z)<=ACT.atkRange+1.5)playerAttack();else{p.tx=m.x;p.tz=m.z;}return;}}
   const h=ray.intersectObject(W3.terrain)[0];if(h){W3.player.tx=h.point.x;W3.player.tz=h.point.z;}}
 };
 canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',e=>{pts.delete(e.pointerId);down=null;});
 canvas.addEventListener('wheel',e=>{W3.zoom=clamp(W3.zoom*(1+e.deltaY*.001),.5,1.65);e.preventDefault();},{passive:false});
 canvas.addEventListener('contextmenu',e=>e.preventDefault());
}

