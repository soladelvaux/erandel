/* ---------- the plot (build area) ---------- */
const PLOT={x0:4,z0:28,cols:14,rows:10,t:2,land:.6,deck:.8};
const POND={x:23,z:38,rx:8.5,rz:7};
function inPond(x,z){const a=(x-POND.x)/POND.rx,b=(z-POND.z)/POND.rz;return a*a+b*b<1;}
function plotW(x,z){const x1=PLOT.x0+PLOT.cols*PLOT.t,z1=PLOT.z0+PLOT.rows*PLOT.t;const dx=Math.max(PLOT.x0-x,0,x-x1),dz=Math.max(PLOT.z0-z,0,z-z1);const d=Math.hypot(dx,dz);return d<=0?1:Math.max(0,1-d/5);}
function tileCenter(c,r){return[PLOT.x0+(c+.5)*PLOT.t,PLOT.z0+(r+.5)*PLOT.t];}
function tileAt(x,z){const c=Math.floor((x-PLOT.x0)/PLOT.t),r=Math.floor((z-PLOT.z0)/PLOT.t);return(c>=0&&r>=0&&c<PLOT.cols&&r<PLOT.rows)?{c,r}:null;}
function tileWater(c,r){const p=tileCenter(c,r);return inPond(p[0],p[1]);}

/** Climbable rock crags: steep painted cliffs with flat tops. [x, z, height, top radius, foot radius] */
const CRAGS=[[10,18,7,3.5,7.5],[-16,8,6,3,6.5],[25,-21,6,3,6.5],[-18,-62,9,4,8],[9,-63,8,3.5,7],[-63,-30,8,3.5,7.5],[67,-29,7,3.5,7],[33,-67,8,3.5,7.5],[56,84,6,3,6.5]];
function cragAt(x,z){let best=0;for(const c of CRAGS){const dx=x-c[0],dz=z-c[1];if(dx>c[4]+2||dx<-c[4]-2||dz>c[4]+2||dz<-c[4]-2)continue;const d=Math.hypot(dx,dz)*(1+(fbm(x*.9,z*.9)-.5)*.35);const k=1-clamp((d-c[3])/(c[4]-c[3]),0,1);const v=c[2]*k*k*(3-2*k);if(v>best)best=v;}return best;}
function heightAt(x,z){
 const m=biomeMix(x,z);let h=m.h+(fbm(x,z)-.5)*2*m.amp;
 const rd=riverDist(x,z);if(rd<7)h-=3.4*Math.exp(-(rd*rd)/9);
 const cw=cragAt(x,z);if(cw)h=Math.max(h,h+cw);
 if(Math.abs(x)<3&&z>24&&z<74)h=h*.4+.6*(1+(fbm(x,z)-.5)*.3);
 const pw=plotW(x,z);if(pw>0){const ph=inPond(x,z)?-1.1:PLOT.land;h=h*(1-pw)+ph*pw;}
 h=erelianShape(x,z,h);
 const e=Math.min(x-WB.minX,WB.maxX-x,z-WB.minZ,WB.maxZ-z);if(e<12)h+=Math.pow((12-e)/12,2)*18;
 return h;
}
function hexRgb(h){const n=parseInt(h.slice(1),16);return[(n>>16&255)/255,(n>>8&255)/255,(n&255)/255];}
const BIOME_RGB={};for(const k in BIOME)BIOME_RGB[k]=hexRgb(BIOME[k].c);
function colorAt(x,z,h){
 const m=biomeMix(x,z);let r=0,g=0,b=0;for(const k in m.w){const c=BIOME_RGB[k];r+=c[0]*m.w[k];g+=c[1]*m.w[k];b+=c[2]*m.w[k];}r/=m.ws;g/=m.ws;b/=m.ws;
 const mix=(c,t)=>{r+=(c[0]-r)*t;g+=(c[1]-g)*t;b+=(c[2]-b)*t;};
 if(h>10)mix([.93,.95,.97],clamp((h-10)/3,0,1));
 if(h<-.2)mix([.16,.22,.24],clamp(-h/1.5,0,.8));
 if(riverDist(x,z)<5&&h<.6&&h>-.2)mix([.62,.56,.42],.5);
 if(Math.abs(x)<2.2&&z>24&&z<74)mix([.52,.45,.33],.8);
 const j=(hashN(Math.floor(x*3),Math.floor(z*3))-.5)*.06;return[clamp(r+j,0,1),clamp(g+j,0,1),clamp(b+j,0,1)];
}
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

