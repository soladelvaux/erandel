/* ---------- live multiplayer (room capability; solo when absent) ---------- */
const NET={room:null,peers:new Map(),chat:[],sendT:0,last:'',open:false,uiT:0};
/** Peer-to-peer world for copies outside claude.ai (GitHub Pages, a downloaded file): WebRTC via Trystero over public Nostr relays. */
const P2P={lib:'https://cdn.jsdelivr.net/npm/trystero@0.26.0/+esm',appId:'erandel-world-v1',room:'erandel'};
/** Wraps a Trystero room in the same calls the game uses from the claude.ai room (presence, emit, on, onPeers, connected). */
async function p2pRoom(){
 let mod;try{mod=await import(window.__P2P_LIB||P2P.lib);}catch(e){return null;}
 if(!mod||typeof mod.joinRoom!=='function')return null;
 let room;try{room=mod.joinRoom({appId:P2P.appId},P2P.room);}catch(e){return null;}
 const pres={},hs={},peerH=[],mine={},seen={};
 const snap=()=>Object.keys(pres).map(id=>({peer:id,by:null,isMe:false,sameTab:false,kind:'viewer',guest:false,presence:pres[id],updatedAt:seen[id]||0}));
 const fire=()=>{const p=snap();peerH.forEach(h=>{try{h({peers:p,joined:[],left:[],updated:[]});}catch(e){}});};
 const small=d=>{try{return d&&typeof d==='object'&&JSON.stringify(d).length<=4096;}catch(e){return false;}};
 const act=n=>room.makeAction(n);const aP=act('pres'),aF=act('fx'),aC=act('chat');
 aP.onMessage=(d,c)=>{if(!small(d)||!c||!c.peerId)return;pres[c.peerId]=d;seen[c.peerId]=Date.now();fire();};
 const relay=t=>(d,c)=>{if(!small(d)||!c||!c.peerId)return;(hs[t]||[]).forEach(h=>{try{h({topic:t,data:d,peer:c.peerId,by:null,isMe:false,sameTab:false,kind:'viewer',guest:false});}catch(e){}});};
 aF.onMessage=relay('fx');aC.onMessage=relay('chat');
 room.onPeerJoin=id=>{if(Object.keys(mine).length)aP.send(mine,{target:id}).catch(()=>{});};
 room.onPeerLeave=id=>{delete pres[id];fire();};
 return{p2p:true,
  presence:async p=>{Object.assign(mine,p);await aP.send(mine);},
  emit:async(t,d)=>{if(t==='fx')await aF.send(d);else if(t==='chat')await aC.send(d);},
  on:(t,h)=>{(hs[t]=hs[t]||[]).push(h);return()=>{};},
  onPeers:h=>{peerH.push(h);setTimeout(()=>h({peers:snap(),joined:[],left:[],updated:[]}),0);return()=>{};},
  connected:()=>true};
}
async function initNet(){
 try{
  let r=null;
  if(window.claude&&typeof window.claude.use==='function')r=await window.claude.use('room');
  if(!r)r=await p2pRoom();
  if(!r)return;NET.room=r;
  r.onPeers(ch=>netPeers(ch.peers),()=>{netClear();NET.room=null;render();});
  r.on('fx',netFxIn);r.on('chat',netChatIn);
  if(typeof r.onConnection==='function')r.onConnection(()=>renderNet());
  render();
 }catch(e){NET.room=null;}
}
function netClear(){NET.peers.forEach(o=>{if(W3&&o.ch)W3.scene.remove(o.ch.g);if(W3&&o.sg)W3.scene.remove(o.sg);});NET.peers.clear();}
function netPeers(list){
 const seen=new Set();
 list.forEach(pr=>{if(pr.sameTab||pr.kind!=='viewer')return;const d=sanitizePeer(pr.presence);if(!d)return;let o=NET.peers.get(pr.peer);if(!o){if(NET.peers.size>=24)return;o={id:pr.peer.replace(/[^a-z0-9]/gi,'').slice(0,24),ch:null,race:null,x:d.x,y:d.y,z:d.z};NET.peers.set(pr.peer,o);}o.d=d;seen.add(pr.peer);});
 NET.peers.forEach((o,k)=>{if(!seen.has(k)){if(W3&&o.ch)W3.scene.remove(o.ch.g);if(W3&&o.sg)W3.scene.remove(o.sg);NET.peers.delete(k);}});
 renderNet();
}
function netSend(dt){
 if(!NET.room)return;NET.sendT-=dt;if(NET.sendT>0)return;const p=W3.player;NET.sendT=p.anim==='idle'?1:.14;
 const pr=myPresence(p),s=JSON.stringify(pr);if(s===NET.last)return;NET.last=s;NET.room.presence(pr).catch(()=>{});
}
function netFx(d){if(!NET.room)return;const r=v=>Math.round(v*10)/10;const o={s:d.s,x:r(d.x),y:r(d.y),z:r(d.z),r:r(d.r||0)};if(d.e)o.e=d.e;if(d.tx!=null){o.tx=r(d.tx);o.tz=r(d.tz);}NET.room.emit('fx',o).catch(()=>{});}
function netFxIn(m){
 if(m.sameTab||!W3)return;const o=NET.peers.get(m.peer);if(!o)return;const now=Date.now();if(now-(o.fxT||0)<120)return;o.fxT=now;
 const d=sanitizeFx(m.data);if(!d||d.y<-20)return;const col=d.e?ELEM[d.e].c:'#d8f4ff';
 if(d.s==='slash')slashFx(d.x,d.y,d.z,d.r,col);
 else if(d.s==='bolt'){const dx=d.tx-d.x,dz=d.tz-d.z,dd=Math.hypot(dx,dz)||1;spawnProj({from:'peer',x:d.x,y:d.y+1.2,z:d.z,vx:dx/dd*16,vz:dz/dd*16,life:Math.min(1.2,dd/16),col,size:1.1});}
 else if(d.s==='wave')ringFx(d.x,d.y,d.z,ACT.skill.wave.r,col,.45);
 else if(d.s==='ritual'){const y=heightAt(d.tx,d.tz);setTimeout(()=>{if(W3){ringFx(d.tx,y,d.tz,ACT.skill.ritual.r,col,.5);burstFx(d.tx,y+1,d.tz,col,7);}},ACT.skill.ritual.delay*1000);}
 else if(d.s==='summon'){o.summonUntil=now+ACT.skill.summon.dur*1000;o.summonCol=col;}
}
function netChatIn(m){
 if(m.sameTab)return;const t=cleanText(m.data&&m.data.t,80);if(!t)return;const o=NET.peers.get(m.peer),now=Date.now();
 if(o){if(now-(o.chatT||0)<800)return;o.chatT=now;o.say=t;o.sayUntil=now+6000;}
 addChat(o&&o.d?o.d.name:'Someone',t,false);
}
function addChat(n,t,me){NET.chat.push({n,t,me,at:Date.now()});if(NET.chat.length>30)NET.chat.shift();renderNet();}
function sendChat(text){
 const t=cleanText(text,80);if(!t||!NET.room)return;NET.room.emit('chat',{t}).catch(()=>toast('Your message could not be sent.'));
 addChat(S.name,t,true);if(W3){W3.player.say=t;W3.player.sayUntil=Date.now()+6000;}
}
function updatePeers(dt,t){
 const w=W3,now=Date.now();
 NET.peers.forEach(o=>{const d=o.d;if(!d)return;
  if(o.race!==d.race){if(o.ch)w.scene.remove(o.ch.g);o.race=d.race;o.ch=makeChibi(charSpec(d.race),1.2);w.scene.add(o.ch.g);o.x=d.x;o.y=d.y;o.z=d.z;}
  const k=Math.min(1,dt*8),ox=o.x,oz=o.z;o.x+=(d.x-o.x)*k;o.y+=(d.y-o.y)*k;o.z+=(d.z-o.z)*k;
  const mv=Math.hypot(o.x-ox,o.z-oz)>dt*.6||d.anim==='run';
  let dr=d.ry-o.ch.g.rotation.y;while(dr>Math.PI)dr-=Math.PI*2;while(dr<-Math.PI)dr+=Math.PI*2;o.ch.g.rotation.y+=dr*Math.min(1,dt*10);
  animChibi(o.ch,dt,mv&&d.anim!=='jump');poseChibi(o.ch,d.anim,t);o.ch.g.position.set(o.x,o.y,o.z);
  if(o.summonUntil>now){if(!o.sg){o.sg=mkGlow(o.summonCol,1.3,.95);w.scene.add(o.sg);}const a=t*2.4;o.sg.position.set(o.x+Math.cos(a)*1.3,o.y+1.9,o.z+Math.sin(a)*1.3);}
  else if(o.sg){w.scene.remove(o.sg);o.sg=null;}
 });
}
function renderNet(){
 const net=document.getElementById('net');if(!net)return;
 const b=document.getElementById('b-net'),n=1+NET.peers.size;
 b.textContent=!NET.room?'Solo':(typeof NET.room.connected==='function'&&!NET.room.connected()?'Connecting…':`${n} online · ${NET.open?'Close chat':'Chat'}`);
 const log=document.getElementById('chatlog'),now=Date.now();
 const lines=NET.chat.filter(c=>NET.open||now-c.at<20000).slice(NET.open?-8:-3);
 log.textContent='';
 if(NET.open){const h=document.createElement('div');h.className='here';const names=[...NET.peers.values()].filter(o=>o.d).map(o=>o.d.name);h.textContent=names.length?`Here now: ${names.join(', ')}`:'Nobody else is here right now. Share this page with a friend to play together.';log.appendChild(h);}
 lines.forEach(c=>{const d=document.createElement('div');const bb=document.createElement('b');bb.textContent=c.n+': ';d.appendChild(bb);d.appendChild(document.createTextNode(c.t));log.appendChild(d);});
}

