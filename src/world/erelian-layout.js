/* ---------- Erelian benchmark region: layout and terrain shaping (docs/regions/erelian.md) ----------
 * Erelian is a CANON name (ERANDEL_LORE_REGISTRY.md L3). Everything laid out here (the western
 * plateau, the falls, the streams, the stairs, the bridge, the ruins) is a PROVISIONAL visual layout,
 * not lore. The Aethwyn river (L0, CANON) keeps its existing course through the region. */
const ERELIAN={
 centre:[-46,8],
 /** Rough box the region's shaping and props live in (fast reject). */
 box:{minX:-82,maxX:-24,minZ:-24,maxZ:40},
 plateau:{top:6.5,cliffX:-61.5,minZ:-16,maxZ:32},
 falls:[{x:-61.6,z:20,w:3.4},{x:-61.6,z:-4,w:2.4}],
 pools:[{x:-58.2,z:20,r:3.2},{x:-58.2,z:-4,r:2.6}],
 /** Streams below the cliff, from each pool to the Aethwyn. */
 streams:[[[-58.2,20],[-52,24],[-46.5,28],[-43,30.5]],[[-58.2,-4],[-50,-3],[-40,1],[-31.8,5.1]]],
 /** Streams on the plateau, feeding each fall. */
 upper:[[[-68.2,19.4],[-65,20.6],[-62.3,20]],[[-68.2,-5.2],[-65,-3.2],[-62.3,-4]]],
 /** Wide stairs up the cliff: bottom at x, rising toward -x. */
 stairs:{x:-55,z:8,run:8,rise:5,w:4,base:1.5},
 /** Stone bridge over the Aethwyn: centre, axis angle (radians, +x turned toward the axis), length, deck height at the ends, hump. */
 bridge:{x:-39.8,z:20,ang:Math.atan2(.287,.958),len:14,deckY:2.2,hump:.6,w:3.4},
};
function polyDist(x,z,pts){let m=1e9;for(let i=0;i<pts.length-1;i++)m=Math.min(m,segDist(x,z,pts[i],pts[i+1]));return m;}
const sm01=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
/** Bridge coordinates of a point: s along the deck (0 = centre), l across it. */
function bridgeLocal(x,z){const b=ERELIAN.bridge,dx=x-b.x,dz=z-b.z,c=Math.cos(b.ang),s=Math.sin(b.ang);return[dx*c+dz*s,-dx*s+dz*c];}
/** Height of the bridge deck walking surface at (x,z), or -Infinity off the deck. */
function bridgeY(x,z){const b=ERELIAN.bridge;if(Math.abs(x-b.x)>9||Math.abs(z-b.z)>9)return -Infinity;const[s,l]=bridgeLocal(x,z);if(Math.abs(s)>b.len/2||Math.abs(l)>b.w/2-.15)return -Infinity;const h=b.len/2;return b.deckY+b.hump*(1-(s/h)*(s/h));}
/** Shapes the terrain height h at (x,z) for Erelian: plateau and cliff, stair ramp, stream and pool
 *  channels, raised banks at the bridge ends. Outside the region box it returns h unchanged. */
function erelianShape(x,z,h){
 const E=ERELIAN,B=E.box;if(x<B.minX||x>B.maxX||z<B.minZ||z>B.maxZ)return h;
 const P=E.plateau;
 const pm=sm01((P.cliffX+1-x)/2.6)*sm01((z-P.minZ)/4)*sm01((P.maxZ-z)/4);
 if(pm>0)h=h*(1-pm)+(P.top+(fbm(x,z)-.5)*.6)*pm;
 for(const u of E.upper){const d=polyDist(x,z,u);if(d<2.4)h-=.9*Math.exp(-d*d/1.1)*pm;}
 const st=E.stairs,t=(st.x-x)/st.run,lz=Math.abs(z-st.z);
 if(t>-.3&&t<1.08&&lz<st.w/2+1.4){const ramp=st.base+st.rise*Math.max(0,Math.min(1,t));h+=(ramp-h)*sm01((st.w/2+1.4-lz)/1.4)*sm01((t+.3)/.3)*sm01((1.08-t)/.08);}
 for(const p of E.pools){const d=Math.hypot(x-p.x,z-p.z);if(d<p.r+3)h-=3*Math.exp(-(d*d)/(p.r*p.r*.55));}
 for(const s of E.streams){const d=polyDist(x,z,s);if(d<4)h-=2.4*Math.exp(-(d*d)/2.6);}
 const b=E.bridge;if(Math.abs(x-b.x)<13&&Math.abs(z-b.z)<13){const[s,l]=bridgeLocal(x,z),as=Math.abs(s);
  if(as>5&&as<11.5&&Math.abs(l)<b.w/2+2.6){const k=(as<7?1:sm01((11.5-as)/4.5))*sm01((b.w/2+2.6-Math.abs(l))/2),tgt=b.deckY-.05;if(h<tgt)h+=(tgt-h)*k;}}
 return h;
}
