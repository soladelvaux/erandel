/* ============ EVENTS ============ */
function dlgAct(kind,arg){const n=S.log.length;doAction(kind,arg);const lines=S.log.slice(n).map(x=>x.t);if(ui.dialog&&lines.length)ui.dialog.result=lines.join(' ');render();}
function openTalk(n){if(!n)return;if(n.special)ui.dialog={type:'ael',text:`Welcome back, ${S.name}. ${AEL_LORE[0]}`,page:0};else{ui.dialog={type:'npc',id:n.id,result:'',say:S.world?npcSay(n.id):''};if(S.world)npcRemember(n.id);}render();}
/** Aelarion's first advice, tailored to the new character's body and diet. */
function spawnTip(){
 const r=R(),tips=[];
 if(r.group==='sea')tips.push('Your kind dries out on land: stay near water, or travel when it rains.');
 if(r.group==='night')tips.push(S.race==='vampires'?'The sun burns you: act at night or underground in Runekar\u2019s Deep.':'The sun stings you: act at night or underground in Runekar\u2019s Deep.');
 if(r.weak&&!tips.length)tips.push(`${ELEM[r.weak].name} places and weather sicken you; avoid them until you are stronger.`);
 const d=dietOf(S.race);
 if(d==='blood')tips.push('You live on blood: win a hunt, then drink from it.');
 else if(d==='carrion')tips.push('You eat the dead: the Veilmoor has grave offerings.');
 else if(d==='fire')tips.push('You eat fire: Ysolde sells brazier coals.');
 else if(d==='ore')tips.push('You eat metal: Ysolde sells iron filings.');
 else if(d==='sun')tips.push('You feed on sunlight on clear days, or on nectar in Erelian.');
 else if(d==='none')tips.push('You need no food at all.');
 return tips.slice(0,2).join(' ');
}
function evoText(){
 if(S.tier>=4)return `You have become ${S.legendName}. There is no higher form, only what you do with this one.`;
 const reqs=evoReqs(S.tier+1);const r=R();const lean=S.tier===1?r.paths[bestPath()].n:title();
 return `You are ${S.tier===1?'leaning toward '+lean:lean}. To reach the next form at dawn you still need: ${reqs.filter(x=>!x.ok).map(x=>x.l.toLowerCase()).join('; ')||'nothing more. Sleep, and wake changed'}.`;
}
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-act]');if(!b||b.disabled)return;
 const a=b.dataset.act,g=b.dataset.arg;
 switch(a){
  case'pick':ui.pick=g;render();break;
  case'random':ui.pick=pick(Object.keys(RACES));render();break;
  case'begin':{
   newChar((ui.cname||'').trim().slice(0,24)||'Wanderer',ui.pick);S.pos={x:SPAWN.x,z:SPAWN.z};window.__teleport=true;applyStarter();
   if(W3){Object.values(W3.itemMeshes).forEach(m=>W3.buildGroup.remove(m));W3.itemMeshes={};W3.glows=W3.glows.filter(o=>!o.item);W3.LIGHTS=W3.LIGHTS.filter(o=>!o.item);S.build.forEach(addItemMesh);}
   ui.screen='game';ui.tab='act';ui.confirm=false;ui.journal=false;
   ui.dialog=HAS3D?{type:'ael',text:`Welcome, ${S.name} the ${R().sing}. Erandel lies north, through this gate. ${IS_PHONE?'Move with the stick and drag the screen to look around. Attack, Jump, Dodge and your spells are on the right.':'Move with W A S D and drag with the mouse to look around. Space jumps, F attacks, Shift dodges, 1 to 4 cast your spells, E talks.'} Steep rock can be climbed. The lantern plot east of the road is yours: build on it with the hammer, and open a night market for travelers.${spawnTip()?' '+spawnTip():''}`,page:-1}:null;
   save();render();break;}
  case'tab':ui.tab=g;ui.confirm=false;render();break;
  case'travel':doAction('travel',ui.travel);break;
  case'practice':doAction('practice',ui.prac);break;
  case'job':doAction('job',ui.job||'blacksmith');break;
  case'forge':doAction('forge');break;
  case'eat':doAction('eat',ui.food);break;
  case'sleep-ask':ui.dialog={type:'sleep'};render();break;
  case'sleep':
   if(ui.market)closeMarket('you went to sleep');
   ui.journal=false;ui.dialog=null;ui.build=null;ui.fadeText=`Dawn · Day ${S.day+1}`;render();
   setTimeout(()=>{sleep();setTimeout(()=>{ui.fadeText='';render();},900);},550);break;
  case'reset':ui.confirm=true;render();break;
  case'reset-no':ui.confirm=false;render();break;
  case'reset-yes':if(ui.market)ui.market=null;if(W3)despawnCustomers();S=null;try{localStorage.removeItem(SAVE_KEY);}catch(err){}ui.screen='create';ui.confirm=false;ui.journal=false;ui.dialog=null;ui.build=null;render();break;
  case'journal-open':ui.journal=true;ui.settings=false;render();break;
  case'journal-close':ui.journal=false;render();break;
  case'dlg-close':ui.dialog=null;render();break;
  case'dlg-help':dlgAct('help',g);break;
  case'dlg-trade':dlgAct('trade',g);break;
  case'dlg-steal':dlgAct('steal',g);break;
  case'ael-lore':{const d=ui.dialog;d.page=(d.page+1)%AEL_LORE.length;d.text=AEL_LORE[d.page];render();break;}
  case'ael-evo':ui.dialog.text=evoText();render();break;
  case'ael-bless':{
   if(S.flags.blessDay===S.day)break;S.flags.blessDay=S.day;const c=cure(['sick','burned','chilled']);S.hp=hpMax();addFate(1);
   OUT=[];L(`Aelarion’s green light washes over you. Fully healed${c.length?`, no longer ${c.join(', ')}`:''}. Fate +1.`,'good');flush();
   ui.dialog.text='Go with the light of the boughs. Come back tomorrow if the road is hard.';save();render();break;}
  case'market-close':closeMarket('you closed it');break;
  case'build-open':if(!HAS3D)break;if(S.region!=='vael'){toast('You can build on your plot in Thorngate.');break;}ui.build={sel:ui.lastSel||'lantern',rot:0,tool:'place'};ui.journal=false;ui.dialog=null;ui.settings=false;W3.buildCam={x:18,z:38};W3.hover=null;render();break;
  case'build-close':ui.build=null;render();break;
  case'b-sel':ui.build.sel=g;ui.lastSel=g;ui.build.tool='place';render();break;
  case'b-rotate':ui.build.rot=(ui.build.rot+1)%4;ui.build.tool='place';render();break;
  case'b-remove':ui.build.tool=ui.build.tool==='remove'?'place':'remove';render();break;
  case'photo':ui.photo=true;ui.settings=false;document.body.classList.add('photo');render();break;
  case'settings':ui.settings=!ui.settings;render();break;
  case'set-glow':PREFS.glow=!PREFS.glow;savePrefs();if(W3)setupComposer();render();break;
  case'set-gfx':{const i=GFX_ORDER.indexOf(PREFS.gfx||'auto');PREFS.gfx=GFX_ORDER[(i+1)%GFX_ORDER.length];savePrefs();render();break;}
  case'set-tilt':PREFS.tilt=!PREFS.tilt;savePrefs();render();break;
  case'm-play':if(MUS.playing)mPause();else mPlay();render();break;
  case'm-next':mSkip(1);render();break;
  case'm-prev':mSkip(-1);render();break;
  default:doAction(a,g);
 }
});
document.addEventListener('change',e=>{const el=e.target;if(el.dataset&&el.dataset.bind){ui[el.dataset.bind]=el.value;if(el.tagName==='SELECT')render();}});
document.addEventListener('input',e=>{const el=e.target;if(el.id==='vol'){PREFS.vol=+el.value;savePrefs();if(MUS.master)MUS.master.gain.value=PREFS.vol*.5;return;}if(el.dataset&&el.dataset.bind&&el.tagName==='INPUT')ui[el.dataset.bind]=el.value;});
document.addEventListener('keydown',e=>{
 const tg=e.target.tagName;if(tg==='INPUT'||tg==='SELECT'||tg==='TEXTAREA')return;
 const k=e.key.toLowerCase();
 if(['w','a','s','d','c','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){keys.add(k);if(k.startsWith('arrow'))e.preventDefault();}
 if(!S||ui.screen!=='game')return;
 if(k==='escape'&&NET.open){openChat(false);return;}
 if(k==='escape'){if(ui.photo){ui.photo=false;document.body.classList.remove('photo');}else if(ui.dialog)ui.dialog=null;else if(ui.build)ui.build=null;else if(ui.journal)ui.journal=false;else ui.settings=false;render();}
 if((k==='e'||k==='enter')&&!ui.dialog&&!ui.journal&&!ui.build&&W3&&W3.talk){e.preventDefault();openTalk(W3.talk);}
 if(W3&&HAS3D){
  if(k===' '){e.preventDefault();if(!e.repeat)playerJump();}
  if(k==='shift'&&!e.repeat)playerDodge();
  if(k==='f')playerAttack();
  if(['1','2','3','4'].includes(k))castSkill(+k-1);
  if(k==='t'&&NET.room&&!ui.dialog&&!ui.journal&&!ui.build){e.preventDefault();openChat(true);}
 }
 if((k==='m'||k==='j')&&!ui.dialog&&!ui.build){ui.journal=!ui.journal;render();}
 if(k==='r'&&ui.build){ui.build.rot=(ui.build.rot+1)%4;render();}
 if(k==='b'&&!ui.dialog&&!ui.journal){if(ui.build)ui.build=null;else if(S.region==='vael'&&HAS3D){ui.build={sel:ui.lastSel||'lantern',rot:0,tool:'place'};W3.buildCam={x:18,z:38};}render();}
});
document.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>keys.clear());
(function(){
 const st=document.getElementById('stick'),kn=document.getElementById('knob');let id=null;
 const move=e=>{const r=st.getBoundingClientRect();let x=e.clientX-(r.left+r.width/2),y=e.clientY-(r.top+r.height/2);const m=Math.hypot(x,y),R0=r.width/2-14;if(m>R0){x=x/m*R0;y=y/m*R0;}kn.style.transform=`translate(${x}px,${y}px)`;stick.x=x/R0;stick.y=y/R0;};
 st.addEventListener('pointerdown',e=>{id=e.pointerId;try{st.setPointerCapture(id);}catch(err){}move(e);e.preventDefault();});
 st.addEventListener('pointermove',e=>{if(e.pointerId===id)move(e);});
 const end=e=>{if(e.pointerId!==id)return;id=null;stick.x=0;stick.y=0;kn.style.transform='';};
 st.addEventListener('pointerup',end);st.addEventListener('pointercancel',end);
 document.getElementById('b-talk').addEventListener('click',()=>{if(W3&&W3.talk)openTalk(W3.talk);});
 const bind=(b,fn)=>{b.addEventListener('pointerdown',e=>{e.preventDefault();fn();});b.addEventListener('click',e=>{if(e.detail===0)fn();});};
 bind(document.getElementById('b-atk'),()=>playerAttack());bind(document.getElementById('b-jump'),()=>playerJump());bind(document.getElementById('b-dodge'),()=>playerDodge());
 document.querySelectorAll('#btns .sk').forEach(b=>bind(b,()=>castSkill(+b.dataset.slot)));
 document.getElementById('b-net').addEventListener('click',()=>openChat(!NET.open));
 document.getElementById('chatbar').addEventListener('submit',e=>{e.preventDefault();const i=document.getElementById('chatin');sendChat(i.value);i.value='';});
})();
function openChat(on){NET.open=!!(on&&NET.room);keys.clear();stick.x=0;stick.y=0;render();renderNet();if(NET.open)setTimeout(()=>{const i=document.getElementById('chatin');if(i)i.focus();},30);}

