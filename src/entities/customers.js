/* ---------- customers ---------- */
function despawnCustomers(){const w=W3;w.customers.forEach(c=>{w.scene.remove(c.ch.g);if(c.bub)w.scene.remove(c.bub);});w.customers=[];}
function spawnCustomer(){
 const w=W3,sl=sellers();if(!sl.length)return;const it=pick(sl);const rid=pick(Object.keys(RACES));const spec=charSpec(rid);if(Math.random()<.35)spec.hat=true;
 const ch=makeChibi(spec,1.05);ch.g.position.set((Math.random()-.5)*3,heightAt(0,56),56);w.scene.add(ch.g);
 const bub=new THREE.Sprite(new THREE.SpriteMaterial({map:w.BT,transparent:true,depthWrite:false}));bub.scale.set(.8,.8,1);bub.visible=false;w.scene.add(bub);
 w.customers.push({ch,x:ch.g.position.x,z:56,item:it,state:'road',wait:0,bub,race:rid});
}
function updateCustomers(dt,t){
 const w=W3;if(!ui.market){return;}
 if(S.region!=='vael'){closeMarket('you left Thorngate');return;}
 const remaining=S.salesCap-S.salesToday-w.customers.filter(c=>c.state!=='leave').length;
 w.spawnT-=dt;if(remaining>0&&w.spawnT<=0&&w.customers.length<9){spawnCustomer();w.spawnT=Math.max(1.6,5-ambience()*.03);}
 const queues={};
 w.customers.forEach(c=>{
  if(!S.build.includes(c.item)&&c.state!=='leave'){c.state='leave';}
  let tx,tz;const f=frontOf(c.item);
  if(c.state==='road'){tx=2.2;tz=f.z;if(Math.abs(c.z-tz)<.6)c.state='go';}
  if(c.state==='go'||c.state==='buy'){const q=queues[c.item.id]=(queues[c.item.id]||0)+1;tx=f.x+f.fx*(q-1)*1;tz=f.z+f.fz*(q-1)*1;if(c.state==='go'&&q===1&&Math.hypot(c.x-tx,c.z-tz)<.35){c.state='buy';c.wait=2.2;}}
  if(c.state==='buy'&&queues[c.item.id]===1){c.wait-=dt;c.bub.visible=true;if(c.wait<=0){const g=salePrice(c.item);S.gold+=g;S.salesToday++;ui.market.sold++;ui.market.gold+=g;addReg('vael',.3);c.state='leave';c.bub.visible=false;render();}}
  if(c.state==='leave'){tx=2.2;tz=58;if(Math.hypot(c.x-2.2,c.z-58)<.8)c.gone=true;}
  const dx=tx-c.x,dz=tz-c.z,d=Math.hypot(dx,dz);const mv=d>.08;
  if(mv){const sp=Math.min(d,3.2*dt);c.x+=dx/d*sp;c.z+=dz/d*sp;turnTo(c.ch,dx,dz,dt);}else if(c.state==='buy')turnTo(c.ch,-f.fx,-f.fz,dt);
  animChibi(c.ch,dt,mv);const y=Math.max(groundY(c.x,c.z),0);c.ch.g.position.set(c.x,y,c.z);c.bub.position.set(c.x,y+2.6,c.z);
 });
 w.customers.filter(c=>c.gone).forEach(c=>{w.scene.remove(c.ch.g);w.scene.remove(c.bub);});w.customers=w.customers.filter(c=>!c.gone);
 if(S.salesToday>=S.salesCap&&!w.customers.length)closeMarket('every traveler has been served');
}

