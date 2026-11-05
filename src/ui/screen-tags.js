/* ---------- screen tags: name plates, enemy bars, speech, damage numbers ---------- */
const TAGS={layer:null,map:new Map(),f:0};
function tag(key,cls){let e=TAGS.map.get(key);if(!e){e=document.createElement('div');e.className='tag '+cls;TAGS.layer.appendChild(e);TAGS.map.set(key,e);}e._u=TAGS.f;return e;}
function setHTML(e,h){if(e._h!==h){e._h=h;e.innerHTML=h;}}
function setTxt(e,t){if(e._h!==t){e._h=t;e.textContent=t;}}
function toScreen(x,y,z){_pv.set(x,y,z).project(W3.camera);if(_pv.z>1||Math.abs(_pv.x)>1.15||Math.abs(_pv.y)>1.15)return null;return[((_pv.x+1)/2*window.innerWidth)|0,((1-_pv.y)/2*window.innerHeight)|0];}
function placeTag(e,x,y,z){const s=toScreen(x,y,z);if(!s){e.style.display='none';return;}e.style.display='';e.style.transform=`translate(${s[0]}px,${s[1]}px) translate(-50%,-100%)`;}
function sweepTags(){TAGS.map.forEach((e,k)=>{if(e._u!==TAGS.f){e.remove();TAGS.map.delete(k);}});TAGS.f++;}
function floatText(x,y,z,txt,col,big){if(!TAGS.layer)return;const s=toScreen(x,y,z);if(!s)return;const e=document.createElement('div');e.className='ft'+(big?' big':'');e.textContent=txt;e.style.color=col;e.style.left=s[0]+'px';e.style.top=s[1]+'px';TAGS.layer.appendChild(e);setTimeout(()=>e.remove(),950);}
function drawTags(){
 const w=W3,p=w.player,now=Date.now();
 w.monsters.forEach((m,i)=>{if(!m.alive)return;const d2=(m.x-p.x)**2+(m.z-p.z)**2;if(d2>18*18||(m.hp>=m.hpMax&&m!==w.target))return;const e=tag('eb'+i,'eb'+(m===w.target?' tg':''));setHTML(e,`<i style="width:${Math.max(0,Math.round(m.hp/m.hpMax*100))}%"></i>`);placeTag(e,m.x,m.mo.g.position.y+(m.mo.type==='golem'?2.6:2),m.z);});
 w.npcs.forEach(n=>{if((n.x-p.x)**2+(n.z-p.z)**2>14*14)return;const e=tag('nn'+n.id,'np');setHTML(e,esc(n.name));placeTag(e,n.x,n.ch.g.position.y+2.75,n.z);});
 NET.peers.forEach(o=>{if(!o.ch||!o.d)return;if((o.x-p.x)**2+(o.z-p.z)**2>60*60)return;const e=tag('pn'+o.id,'np peer');setHTML(e,`${esc(o.d.name)}<small>${esc(RACES[o.d.race].sing)} · T${o.d.tier}</small>`);placeTag(e,o.x,o.y+2.7,o.z);
  if(o.say&&now<o.sayUntil){const b=tag('ps'+o.id,'say');setTxt(b,o.say);placeTag(b,o.x,o.y+3.5,o.z);}});
 if(p.say&&now<p.sayUntil){const b=tag('mysay','say');setTxt(b,p.say);placeTag(b,p.x,p.y+2.9,p.z);}
}

