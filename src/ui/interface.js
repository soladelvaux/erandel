/* ============ INTERFACE ============ */
const ICON={
 hammer:'<path d="M14 3l7 7-3 3-7-7z"/><path d="M12 8l-9 9 3 3 9-9"/>',camera:'<rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13.5" r="3.5"/><path d="M8.5 7l2-3h3l2 3"/>',
 moon:'<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',book:'<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z"/><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3"/>',
 gear:'<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
 coin:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/>',wood:'<rect x="3" y="8.5" width="18" height="7" rx="1"/><circle cx="17.5" cy="12" r="2"/>',stone:'<path d="M4 16l3-8 6-3 6 5-1 7-9 2z"/>',
 shop:'<path d="M3 9.5L5 4h14l2 5.5M4.5 9.5V20h15V9.5M3 9.5h18"/><path d="M10 20v-5h4v5"/>',prev:'<path d="M6 5v14M19 5l-10 7 10 7z"/>',play:'<path d="M7 4.5l13 7.5-13 7.5z"/>',pause:'<path d="M7 4.5h3.5v15H7zM13.5 4.5H17v15h-3.5z"/>',next:'<path d="M18 5v14M5 5l10 7-10 7z"/>',
 rotate:'<path d="M19.5 12a7.5 7.5 0 1 1-2.6-5.7"/><path d="M19.5 4v4.5H15"/>',trash:'<path d="M4 7h16M9 7V4h6v3M6.5 7l1 13h9l1-13"/>',check:'<path d="M4.5 12.5l5 5 10-11"/>',
};
const ic=(n,c)=>`<svg class="ic${c?' '+c:''}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON[n]}</svg>`;
function miniBar(label,v,max,color){return `<div class="mb"><span>${label}</span><div class="bar"><span style="width:${max>0?clamp(v/max*100,0,100):0}%;background:${color}"></span></div><b class="num">${Math.max(0,Math.round(v))}</b></div>`;}
function renderHud3(){
 const r=R(),w=WEATHER[weatherHere()],T=TRACKS[MUS.track];
 const pips=Array.from({length:energyMax()},(_,i)=>`<span class="pip${i<energyLeft()?' on':''}"></span>`).join('');
 const inTown=S.region==='vael';
 const mk=ui.market?`<button class="pill on pe" data-act="market-close">${ic('shop')}Close market · ${ui.market.sold} sold</button>`:(inTown?`<button class="pill pe" data-act="sp" data-arg="market">${ic('shop')}Open night market</button>`:'');
 return `<div class="hud3">
  <div class="hcard hl"><div class="hname">${esc(S.name)} <span class="kicker">${r.sing} · T${S.tier}</span></div><div class="htitle">${esc(title())}</div>
   ${miniBar('HP',S.hp,hpMax(),'var(--hp)')}${miniBar('Fate',S.fate,100,'var(--fate)')}${miniBar('Corr',S.corr,100,'var(--corr)')}
   <div class="hrow"><div class="pips" aria-label="${energyLeft()} actions left">${pips}</div><span class="kicker">${TIMES[timeIdx()]} · ${w.name}</span></div>
   ${Object.keys(S.cond).length?`<div class="chips" style="margin-top:4px">${Object.keys(S.cond).filter(c=>COND[c]).map(c=>`<span class="el" style="--c:${COND[c].good?'var(--good)':'var(--hp)'}">${COND[c].n}</span>`).join('')}</div>`:''}
  </div>
  <div class="hc"><div class="counters"><span title="Gold">${ic('coin','g')}<b class="num">${S.gold}</b></span><span title="Wood">${ic('wood','w')}<b class="num">${S.mat.wood}</b></span><span title="Stone">${ic('stone','s')}<b class="num">${S.mat.stone}</b></span></div>${mk}<div class="hreg">Day ${S.day} · ${esc(REG[S.region].name)}</div></div>
  <div class="hr">
   <div class="music pe"><div class="mcov"></div><div class="mt"><b>${T.n}</b><span>${T.sub}</span></div><button class="mb2" data-act="m-prev" aria-label="Previous track">${ic('prev')}</button><button class="mb2" data-act="m-play" aria-label="${MUS.playing?'Pause':'Play'} music">${ic(MUS.playing?'pause':'play')}</button><button class="mb2" data-act="m-next" aria-label="Next track">${ic('next')}</button></div>
   <div class="icol pe"><button class="ibtn" data-act="settings" aria-label="Settings">${ic('gear')}</button><button class="ibtn" data-act="journal-open" aria-label="Journal">${ic('book')}</button></div>
   ${ui.settings?`<div class="settings pe"><div class="kicker">Settings</div><button class="btn" data-act="set-glow">Glow: ${PREFS.glow?'On':'Off'}</button><button class="btn" data-act="set-gfx">Graphics: ${(PREFS.gfx||'auto')==='auto'?'Auto ('+gfxTier()+')':gfxTier()}${REGION.on&&REGION.tier!==gfxTier()?' · reload':''}</button><button class="btn" data-act="set-tilt">Tilt-shift: ${PREFS.tilt?'On':'Off'}</button><label for="vol" class="kicker">Music volume</label><input type="range" id="vol" min="0" max="1" step=".05" value="${PREFS.vol}"></div>`:''}
  </div>
 </div>
 ${ui.build?'':`<div class="tools pe"><button class="ibtn${inTown?'':' dim'}" data-act="build-open" aria-label="Build">${ic('hammer')}</button><button class="ibtn" data-act="photo" aria-label="Photo mode">${ic('camera')}</button><button class="ibtn" data-act="sleep-ask" aria-label="Sleep">${ic('moon')}</button></div>`}`;
}
function renderBuildBar(){
 const b=ui.build;const a=ambience();
 return `<div class="buildtop pe"><div><b>Building your plot</b><span class="kicker">Ambience ${a} · ${sellers().length} seller${sellers().length===1?'':'s'}</span></div><span class="mut">${b.tool==='remove'?'Tap something to remove it. You get half the cost back.':`Tap a tile to place: ${esc(CATALOG[b.sel].n)}. ${esc(CATALOG[b.sel].d)}`}</span></div>
 <div class="buildbar pe">
  <div class="btools"><button class="ibtn${b.tool==='remove'?' on':''}" data-act="b-remove" aria-label="Remove">${ic('trash')}</button><button class="ibtn" data-act="b-rotate" aria-label="Rotate">${ic('rotate')}</button><button class="ibtn ok" data-act="build-close" aria-label="Done">${ic('check')}</button></div>
  <div class="cat">${Object.entries(CATALOG).map(([k,C])=>`<button class="citem${b.sel===k&&b.tool!=='remove'?' on':''}${canAfford(itemCost(k))?'':' poor'}" data-act="b-sel" data-arg="${k}"><b>${esc(C.n)}</b><small>${esc(costText(itemCost(k)))}</small><small class="amb">+${C.amb} ambience${C.sells?` · sells ${C.sells}`:''}</small></button>`).join('')}</div>
 </div>`;
}
function tabsNav(){return `<nav class="tabs" aria-label="Pages">${[['act','Act'],['self','Self'],['magic','Magic'],['world','World'],['log','Chronicle']].map(([k,n])=>`<button class="tab${ui.tab===k?' on':''}" data-act="tab" data-arg="${k}" aria-current="${ui.tab===k}">${n}</button>`).join('')}</nav>`;}
function renderJournal(){
 const body={act:renderAct,self:renderSelf,magic:renderMagic,world:renderWorld,log:renderLog}[ui.tab]();
 if(!HAS3D)return `<div class="journal pe solo"><div class="jin">${renderHud()}${body}</div></div>`;
 return `<div class="journal pe"><div class="jin"><div class="jhead"><h2>Journal</h2><button class="btn" data-act="journal-close">Back to the world</button></div>${tabsNav()}${body}</div></div>`;
}
function portrait(kind,arg){
 if(kind==='ael')return `<div class="portrait" style="background-image:url(${AEL_IMG})"></div>`;
 if(kind==='npc'){const el=REG[NPC_REGION[arg]].els[0];return `<div class="portrait sig" style="--c:${el?ELEM[el].c:'var(--gold)'}">${esc(NPCS[arg].name.replace(/^(Queen|Brother) /,'')[0])}</div>`;}
 if(kind==='moon')return `<div class="portrait sig" style="--c:#c9cde3">${ic('moon')}</div>`;
 return `<div class="portrait sig" style="--c:${arg?ELEM[arg].c:'var(--hp)'}">⚔</div>`;
}
function renderDialog(){
 const d=ui.dialog;let name,por,text,ch;
 if(d.type==='ael'){
  name='Aelarion Silverbough';por=portrait('ael');text=esc(d.text);const blessed=S.flags.blessDay===S.day;
  ch=[['ael-lore','Tell me of Erandel'],['ael-evo','How will I change?'],['ael-bless',blessed?'You have had his blessing today':'Ask for his blessing',blessed],['dlg-close','Farewell']];
 }else if(d.type==='npc'){
  const N=NPCS[d.id],st=S.npcs[d.id],att=attitude(st.rep);
  const line={Hostile:'turns away the moment you appear.',Wary:'watches you carefully.',Neutral:'nods at you.',Friendly:'greets you warmly.',Devoted:'lights up when they see you.'}[att.n];
  name=`${N.name}, ${N.role}`;por=portrait('npc',d.id);
  text=`<span class="att" style="color:${att.c}">${att.n} ${fl(st.rep)}</span> ${N.name} ${line}<br>“${esc(needOf(d.id))}.”${d.result?`<span class="dres">${esc(d.result)}</span>`:''}`;
  const out=energyLeft()<=0;
  ch=[['dlg-help',st.helped===S.day?'Help (done today)':'Help · 1 action',st.helped===S.day||out,d.id],['dlg-trade','Trade · 1 action',out,d.id],['dlg-steal',`Steal · ${Math.round(Math.min(.9,.35+S.stats.agi*.012)*100)}% unseen`,out,d.id],['dlg-close','Leave']];
 }else if(d.type==='sleep'){
  name='Rest until dawn';por=portrait('moon');text=esc(`Day ${S.day} ends here. ${energyLeft()>0?`You still have ${energyLeft()} action${energyLeft()===1?'':'s'} left. `:''}${S.fedDay===S.day||dietOf(S.race)==='none'?'':'You have not eaten today. '}At dawn the world looks at what you did, and you may change.`);
  ch=[['sleep','Sleep until dawn'],['dlg-close','Not yet']];
 }else{name=d.title;por=portrait('battle',d.el);text=esc(d.text);ch=[['dlg-close','Continue']];}
 return `<div class="dialog pe" role="dialog" aria-label="${esc(name)}">${por}<div class="dbody"><div class="dname">${esc(name)}</div><p class="dtext">${text}</p>
  <div class="dch">${ch.map(([a,l,dis,arg])=>`<button class="choice" data-act="${a}"${arg?` data-arg="${arg}"`:''}${dis?' disabled':''}>${esc(l)}</button>`).join('')}</div></div></div>`;
}
function renderThreshold(){
 const r=RACES[ui.pick];const bonus=Object.entries(r.bonus).map(([k,v])=>`${SN[k]} +${v}`).join(', ');
 const groups=Object.keys(GROUPS).map(g=>`<div style="display:grid;gap:8px"><h3>${GROUPS[g]}</h3><div class="race-grid">${Object.values(RACES).filter(x=>x.group===g).map(x=>`<button class="race${x.id===ui.pick?' sel':''}" data-act="pick" data-arg="${x.id}" aria-pressed="${x.id===ui.pick}"><b>${x.name}</b>${x.home?elChip(x.home):'<span class="el" style="--c:var(--mut)">Any</span>'}</button>`).join('')}</div></div>`).join('');
 return `<div class="threshold pe"><div class="tin">
  <div class="thero" style="background-image:url(${AEL_IMG})"><div class="thero-txt"><div class="kicker">The Thorngate</div><h1>Erandel</h1></div></div>
  <div class="speech"><div class="dname">Aelarion Silverbough, keeper of the gate</div><p>Soul, you have reached the Thorngate. You chose rebirth over eternity, so you must take a form before you pass. Choose your kind, and tell me the name you will carry into Erandel.</p></div>
  <div class="row"><label for="cname" class="kicker">Your name</label><input type="text" id="cname" data-bind="cname" maxlength="24" value="${esc(ui.cname)}" style="flex:1 1 200px"></div>
  <div class="detail">
   <div class="row" style="justify-content:space-between"><h2>${r.name}</h2><div class="chips">${r.home?elChip(r.home):'<span class="el" style="--c:var(--mut)">No element yet</span>'}${r.weak?`<span class="kicker">weak to</span>${elChip(r.weak)}`:''}</div></div>
   <p>${esc(r.trait)}.</p>
   <p class="mut">${GROUPS[r.group]} · Natural magic: ${SRC[r.nat].n} · Starting bonus: ${bonus}</p>
   <p><span class="kicker">Body</span> ${DIETS[dietOf(r.id)].n} · ${bodyNotes(r.id).join(' · ')}</p>
   <div><div class="kicker" style="margin-bottom:4px">Evolution paths → Tier 3</div><ul class="paths">${r.paths.map(p=>`<li>${p.n} <span class="mut">(${SN[p.s]})</span> → ${p.t3}</li>`).join('')}</ul></div>
   <p><span class="kicker">Legendary</span> ${r.legend} <span class="mut">· dark path:</span> ${r.dark}</p>
   <div class="row"><button class="btn primary" data-act="begin">Be reborn as ${esc(r.sing)}</button><button class="btn" data-act="random">Random kind</button></div>
  </div>
  <div style="display:grid;gap:18px">${groups}</div>
 </div></div>`;
}
function render(){
 let html='';
 if(ui.screen==='create'||!S)html=renderThreshold();
 else{
  if(HAS3D&&!ui.photo)html+=renderHud3();
  if(ui.build&&HAS3D)html+=renderBuildBar();
  if(ui.banner&&HAS3D&&!ui.journal&&!ui.build&&!ui.photo)html+=`<div class="banner"><div class="kicker">Now entering</div><div class="bname">${esc(ui.banner.name)}</div><div class="bsub">${esc(ui.banner.sub)}</div></div>`;
  if(ui.journal||!HAS3D)html+=renderJournal();
  if(ui.dialog)html+=renderDialog();
  if(ui.photo)html+=`<div class="photohint">Photo mode · tap to return</div>`;
 }
 if(ui.flash)html+=`<div class="flash"></div>`;
 if(ui.fadeText)html+=`<div class="fade"><div class="bname">${esc(ui.fadeText)}</div></div>`;
 if(ui.toast)html+=`<div class="toast" role="status">${esc(ui.toast)}</div>`;
 app.innerHTML=html;
 const show=HAS3D&&ui.screen==='game'&&S&&!ui.dialog&&!ui.journal&&!ui.build&&!ui.photo;document.getElementById('controls').hidden=!show||NET.open;
 const world=HAS3D&&ui.screen==='game'&&!!S&&!ui.journal&&!ui.build&&!ui.photo;
 document.getElementById('mini').hidden=!world;document.getElementById('net').hidden=!(show&&NET.room);document.getElementById('chatbar').hidden=!(show&&NET.room&&NET.open);
 if(!show)document.getElementById('target').hidden=true;
 renderSkills();
 document.body.classList.toggle('notilt',!PREFS.tilt);
}

