/* ---------- multiplayer data (untrusted input from other viewers) ---------- */
const PEER_ANIMS=['idle','run','jump','atk','cast','dodge'];
const FX_KINDS=['slash','bolt','wave','summon','ritual'];
const own=(o,k)=>typeof k==='string'&&Object.prototype.hasOwnProperty.call(o,k);
/** Strips control and invisible characters and cuts to n characters. */
function cleanText(s,n){return String(s==null?'':s).replace(/[\u0000-\u001f\u007f-\u009f]/g,' ').replace(/[\u00ad\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/g,'').replace(/\s+/g,' ').trim().slice(0,n);}
function numIn(v,a,b){return typeof v==='number'&&isFinite(v)?clamp(v,a,b):null;}
/** What this player shares with everyone in the room (presence). */
function myPresence(p){return{n:cleanText(S.name,20),k:S.race,t:S.tier,ti:cleanText(title(),40),x:Math.round(p.x*10)/10,y:Math.round(p.y*10)/10,z:Math.round(p.z*10)/10,r:Math.round((p.ry||0)*100)/100,a:PEER_ANIMS.includes(p.anim)?p.anim:'idle',h:Math.round(Math.max(0,S.hp)),hm:hpMax(),g:S.region};}
/** Turns another viewer's presence into safe display data, or null if it has no position. */
function sanitizePeer(p){
 if(!p||typeof p!=='object')return null;const x=numIn(p.x,WB.minX,WB.maxX),z=numIn(p.z,WB.minZ,WB.maxZ);if(x===null||z===null)return null;
 const y=numIn(p.y,-30,80),r=numIn(p.r,-1000,1000),t=numIn(p.t,1,9),h=numIn(p.h,0,100000),hm=numIn(p.hm,1,100000);
 return{name:cleanText(p.n,20)||'Wanderer',race:own(RACES,p.k)?p.k:'humans',tier:Math.round(t===null?1:t),title:cleanText(p.ti,40),x,y:y===null?0:y,z,ry:r===null?0:r,anim:PEER_ANIMS.includes(p.a)?p.a:'idle',hp:h===null?0:h,hpMax:hm===null?1:hm,region:own(REG,p.g)?p.g:null};
}
/** Validates a cosmetic skill effect another viewer broadcast. */
function sanitizeFx(d){
 if(!d||typeof d!=='object'||!FX_KINDS.includes(d.s))return null;const x=numIn(d.x,WB.minX,WB.maxX),z=numIn(d.z,WB.minZ,WB.maxZ);if(x===null||z===null)return null;
 const tx=numIn(d.tx,WB.minX,WB.maxX),tz=numIn(d.tz,WB.minZ,WB.maxZ),y=numIn(d.y,-30,80),r=numIn(d.r,-1000,1000);
 return{s:d.s,x,z,y:y===null?0:y,r:r===null?0:r,e:own(ELEM,d.e)?d.e:null,tx:tx===null?x:tx,tz:tz===null?z:tz};
}

