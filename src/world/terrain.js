/* ---------- terrain math ---------- */
function hashN(i,j){let h=Math.imul(i,374761393)+Math.imul(j,668265263);h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967295;}
function vnoise(x,z){const i=Math.floor(x),j=Math.floor(z),fx=x-i,fz=z-j;const u=fx*fx*(3-2*fx),v=fz*fz*(3-2*fz);const a=hashN(i,j),b=hashN(i+1,j),c=hashN(i,j+1),d=hashN(i+1,j+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
function fbm(x,z){return vnoise(x*.08,z*.08)*.65+vnoise(x*.21+40,z*.21+40)*.35;}
function segDist(px,pz,a,b){const dx=b[0]-a[0],dz=b[1]-a[1];const t=clamp(((px-a[0])*dx+(pz-a[1])*dz)/(dx*dx+dz*dz),0,1);const x=a[0]+t*dx-px,z=a[1]+t*dz-pz;return Math.sqrt(x*x+z*z);}
function riverDist(x,z){let m=1e9;for(let i=0;i<RIVER.length-1;i++)m=Math.min(m,segDist(x,z,RIVER[i],RIVER[i+1]));return m;}
function regionAt(x,z){let best='vael',bd=1e9;for(const k in CENTERS){const dx=x-CENTERS[k][0],dz=z-CENTERS[k][1],d=dx*dx+dz*dz;if(d<bd){bd=d;best=k;}}return best;}
function biomeMix(x,z){let ws=0,h=0,amp=0;const w={};for(const k in CENTERS){const dx=x-CENTERS[k][0],dz=z-CENTERS[k][1];const v=Math.exp(-(dx*dx+dz*dz)/(2*22*22))+1e-9;w[k]=v;ws+=v;h+=v*BIOME[k].h;amp+=v*BIOME[k].amp;}return{w,ws,h:h/ws,amp:amp/ws};}

