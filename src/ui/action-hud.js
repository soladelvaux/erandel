/* ---------- action HUD: skills, focus, target, minimap ---------- */
function renderSkills(){
 if(!S)return;const sl=skillSlots();
 document.querySelectorAll('#btns .sk').forEach((b,i)=>{const sp=sl[i];const h=sp?`<kbd>${i+1}</kbd>${esc(ELEM[sp.e1].name)}<br>${esc(FORMS[sp.form].n)}`:`<kbd>${i+1}</kbd>Empty`;if(b._h!==h){b._h=h;b.innerHTML=h;}b.classList.toggle('empty',!sp);b.style.setProperty('--c',sp?ELEM[sp.e1].c:'#8a8a9a');b.setAttribute('aria-label',sp?`Cast ${sp.name} (${ACT.skill[sp.form].mp} focus)`:`Empty spell slot ${i+1}`);});
}
function updateActionUi(t){
 const w=W3,p=w.player,sl=skillSlots();
 const mb=document.querySelector('#mpbar i');if(mb)mb.style.width=Math.round(p.mp/mpMax()*100)+'%';
 document.querySelectorAll('#btns .sk').forEach((b,i)=>{const sp=sl[i];const left=sp?Math.max(0,(p.cd['s'+i]||0)-t)/ACT.skill[sp.form].cd:0;b.style.setProperty('--cd',left.toFixed(3));b.classList.toggle('low',!!sp&&p.mp<ACT.skill[sp.form].mp);});
 const ba=document.getElementById('b-atk'),bd=document.getElementById('b-dodge');if(ba)ba.classList.toggle('cool',p.cd.atk>t);if(bd)bd.classList.toggle('cool',p.cd.dodge>t);
 const tf=document.getElementById('target'),m=w.target;
 const show=m&&m.alive&&Math.hypot(m.x-p.x,m.z-p.z)<22&&!document.getElementById('controls').hidden;
 tf.hidden=!show;
 if(show){const h=`<b>${esc(m.b.n)}</b> · ${m.b.el?esc(ELEM[m.b.el].name):'No element'}<div class="tb"><i style="width:${Math.max(0,Math.round(m.hp/m.hpMax*100))}%"></i></div>`;if(tf._h!==h){tf._h=h;tf.innerHTML=h;}}
}
function initMini(){
 const W=128,H=144,b=document.createElement('canvas');b.width=W;b.height=H;const x=b.getContext('2d'),img=x.createImageData(W,H);
 for(let j=0;j<H;j++)for(let i=0;i<W;i++){const wx=WB.minX+(i+.5)/W*(WB.maxX-WB.minX),wz=WB.minZ+(j+.5)/H*(WB.maxZ-WB.minZ),h=heightAt(wx,wz);const c=h<-.2?[.17,.36,.5]:colorAt(wx,wz,h);const k=(j*W+i)*4;img.data[k]=c[0]*255;img.data[k+1]=c[1]*255;img.data[k+2]=c[2]*255;img.data[k+3]=255;}
 x.putImageData(img,0,0);W3.miniBase=b;
}
function drawMini(){
 const cv=document.getElementById('mini');if(!cv||cv.hidden||!W3.miniBase)return;const w=W3,c=cv.getContext('2d'),W=cv.width,H=cv.height;
 const X=x=>(x-WB.minX)/(WB.maxX-WB.minX)*W,Z=z=>(z-WB.minZ)/(WB.maxZ-WB.minZ)*H;
 c.drawImage(w.miniBase,0,0,W,H);
 c.fillStyle='#ffd890';w.npcs.forEach(n=>c.fillRect(X(n.x)-1.5,Z(n.z)-1.5,3,3));
 c.fillStyle='#ff5a4a';w.monsters.forEach(m=>{if(m.alive){c.beginPath();c.arc(X(m.x),Z(m.z),1.8,0,7);c.fill();}});
 c.fillStyle='#7ef0ff';c.strokeStyle='#0e1222';NET.peers.forEach(o=>{if(!o.ch)return;c.beginPath();c.arc(X(o.x),Z(o.z),2.8,0,7);c.fill();c.stroke();});
 const p=w.player,cy=w.cam.yaw;c.save();c.translate(X(p.x),Z(p.z));
 c.fillStyle='rgba(255,240,200,.18)';c.beginPath();c.moveTo(0,0);c.arc(0,0,22,Math.atan2(-Math.cos(cy),-Math.sin(cy))-.5,Math.atan2(-Math.cos(cy),-Math.sin(cy))+.5);c.fill();
 c.rotate(-p.ch.g.rotation.y);c.fillStyle='#ffffff';c.strokeStyle='#14100c';c.lineWidth=1.5;c.beginPath();c.moveTo(0,6);c.lineTo(-4,-4);c.lineTo(4,-4);c.closePath();c.fill();c.stroke();c.restore();
}

