/* ---------- player pose and climbing ---------- */
function posePlayer(p,dt){
 const c=p.ch;
 if(p.climb){p.climbT+=dt*(p.climbMove?7:1.5);const s=Math.sin(p.climbT);c.armL.rotation.x=-2.6+s*.5;c.armR.rotation.x=-2.6-s*.5;c.legL.rotation.x=-.6+s*.4;c.legR.rotation.x=-.6-s*.4;c.body.rotation.x=-.25;return;}
 if(p.atkAnim>0){p.atkAnim-=dt;const k=1-Math.max(0,p.atkAnim)/.28;c.armR.rotation.x=-2.6+k*3.4;c.body.rotation.y=Math.sin(k*Math.PI)*.5;}else c.body.rotation.y*=.8;
 if(p.castAnim>0){p.castAnim-=dt;c.armL.rotation.x=-2.7;c.armR.rotation.x=-2.7;}
 if(!p.ground){c.legL.rotation.x=-.8;c.legR.rotation.x=.3;}
 c.body.rotation.x=p.dodgeT>0?.55:c.body.rotation.x*.8;
}
/** Peers only send an animation name; this approximates the pose. */
function poseChibi(c,anim,t){
 if(anim==='atk'){c.armR.rotation.x=-2.2+Math.sin(t*20)*1.2;}
 else if(anim==='cast'){c.armL.rotation.x=-2.7;c.armR.rotation.x=-2.7;}
 else if(anim==='jump'){c.legL.rotation.x=-.8;c.legR.rotation.x=.3;}
 else if(anim==='climb'){const s=Math.sin(t*7);c.armL.rotation.x=-2.6+s*.5;c.armR.rotation.x=-2.6-s*.5;}
 c.body.rotation.x=anim==='dodge'?.55:anim==='climb'?-.25:0;
}

