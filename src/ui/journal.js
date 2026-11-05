/* ============ RENDER ============ */
function toast(msg){ui.toast=msg;render();clearTimeout(toastTimer);toastTimer=setTimeout(()=>{ui.toast='';render();},3200);}
function bar(v,max,color){const w=max>0?clamp(v/max*100,0,100):0;return `<div class="bar"><span style="width:${w}%;background:${color}"></span></div>`;}
function opt(v,label,sel){return `<option value="${esc(v)}"${v===sel?' selected':''}>${esc(label)}</option>`;}

function renderCreate(){
 const r=RACES[ui.pick];
 const groups=Object.keys(GROUPS).map(g=>`<div style="display:grid;gap:8px"><h3>${GROUPS[g]}</h3><div class="race-grid">${
  Object.values(RACES).filter(x=>x.group===g).map(x=>`<button class="race${x.id===ui.pick?' sel':''}" data-act="pick" data-arg="${x.id}" aria-pressed="${x.id===ui.pick}"><b>${x.name}</b>${x.home?elChip(x.home):'<span class="el" style="--c:var(--mut)">Any</span>'}</button>`).join('')}</div></div>`).join('');
 const bonus=Object.entries(r.bonus).map(([k,v])=>`${SN[k]} +${v}`).join(', ');
 return `
 <div class="create-head"><div class="kicker">Erandel</div><h1>Choose your kind</h1>
 <p class="mut" style="max-width:62ch">No classes. What you do each day feeds your stats and elements, and every dawn the world checks whether you evolve. NPCs remember your deeds. Fate brings luck; Corruption opens darker paths.</p></div>
 <section style="border-top:0">
  <div class="row"><label for="cname" class="kicker">Your name</label><input type="text" id="cname" data-bind="cname" maxlength="24" value="${esc(ui.cname)}" style="flex:1 1 200px"></div>
  <div class="detail">
   <div class="row" style="justify-content:space-between"><h2>${r.name}</h2><div class="chips">${r.home?elChip(r.home):'<span class="el" style="--c:var(--mut)">No element yet</span>'}${r.weak?`<span class="kicker">weak to</span>${elChip(r.weak)}`:''}</div></div>
   <p>${esc(r.trait)}.</p>
   <p class="mut">${GROUPS[r.group]} · Natural magic: ${SRC[r.nat].n} · Starting bonus: ${bonus}</p>
   <p><span class="kicker">Body</span> ${DIETS[dietOf(r.id)].n} · ${bodyNotes(r.id).join(' · ')}</p>
   <div><div class="kicker" style="margin-bottom:4px">Evolution paths → Tier 3</div><ul class="paths">${r.paths.map(p=>`<li>${p.n} <span class="mut">(${SN[p.s]})</span> → ${p.t3}</li>`).join('')}</ul></div>
   <p><span class="kicker">Legendary</span> ${r.legend} <span class="mut">· dark path:</span> ${r.dark}</p>
   <div class="row"><button class="btn primary" data-act="begin">Begin as ${esc(r.sing)}</button><button class="btn" data-act="random">Random kind</button></div>
  </div>
 </section>
 <section style="gap:18px">${groups}</section>`;
}

function renderHud(){
 const r=R(),reg=REG[S.region],w=WEATHER[weatherHere()];
 const pips=Array.from({length:energyMax()},(_,i)=>`<span class="pip${i<energyLeft()?' on':''}"></span>`).join('');
 return `<header class="hud">
  <div class="hud-top">
   <div><div class="kicker">${r.name} · Tier ${S.tier}${S.home?'':''}</div><h1>${esc(S.name)}</h1><div class="title">${esc(title())}</div></div>
   <div class="when"><div class="kicker">Day ${S.day} · ${TIMES[timeIdx()]} · ${w.name}</div><div style="font-family:var(--display);font-size:1.3rem">${reg.name}</div>
   <div class="pips" style="justify-content:inherit" aria-label="${energyLeft()} actions left">${pips}<span class="mut" style="font-size:.85rem;margin-left:4px">${energyLeft()} left</span></div></div>
  </div>
  <div class="meters">
   <div class="meter"><div class="meter-l"><span>Health</span><span class="num">${Math.max(0,Math.round(S.hp))}/${hpMax()}</span></div>${bar(S.hp,hpMax(),'var(--hp)')}</div>
   <div class="meter"><div class="meter-l"><span>Fate</span><span class="num">${fl(S.fate)}</span></div>${bar(S.fate,100,'var(--fate)')}</div>
   <div class="meter"><div class="meter-l"><span>Corruption</span><span class="num">${fl(S.corr)}</span></div>${bar(S.corr,100,'var(--corr)')}</div>
   <div class="meter"><div class="meter-l"><span>Gold</span><span class="num">${S.gold}</span></div><div class="mut" style="font-size:.85rem">${S.job?`${jobRank().n} ${JOBS[S.job].n}`:'No job yet'}</div></div>
  </div>
  ${Object.keys(S.cond).length?`<div class="chips">${Object.keys(S.cond).filter(c=>COND[c]).map(c=>`<span class="el" style="--c:${COND[c].good?'var(--good)':'var(--hp)'}" title="${esc(COND[c].d)}">${COND[c].n}${c!=='hungry'&&c!=='fed'?` · ${S.cond[c]}d`:''}</span>`).join('')}</div>`:''}
 </header>
 <nav class="tabs" aria-label="Pages">${[['act','Act'],['self','Self'],['magic','Magic'],['world','World'],['log','Chronicle']].map(([k,n])=>`<button class="tab${ui.tab===k?' on':''}" data-act="tab" data-arg="${k}" aria-current="${ui.tab===k}">${n}</button>`).join('')}</nav>`;
}
function logList(items){return `<ul class="log">${items.map(o=>`<li class="${o.cls}">${esc(o.t)}</li>`).join('')}</ul>`;}

function renderAct(){
 const reg=REG[S.region],w=WEATHER[weatherHere()],out=energyLeft()<=0;
 const others=Object.keys(REG).filter(k=>k!==S.region);
 if(!others.includes(ui.travel))ui.travel=others[0];
 const prac=practicable();
 if(!prac.includes(ui.prac))ui.prac=prac[0]||'';
 const warns=envWarnings();
 const btn=(act,arg,n,d,kind,cost,disabled)=>`<button class="act ${kind||''}" data-act="${act}"${arg!=null?` data-arg="${arg}"`:''}${(cost!==0&&out)||disabled?' disabled':''}><b>${n}</b><small>${d}</small></button>`;
 const npc=npcHere(),N=NPCS[npc],st=S.npcs[npc],att=attitude(st.rep);
 const npcLine={Hostile:'turns away the moment you appear.',Wary:'watches you carefully.',Neutral:'nods at you.',Friendly:'greets you warmly.',Devoted:'lights up when they see you.'}[att.n];
 return `
 <section>
  <div class="row" style="justify-content:space-between"><h2>${reg.name}</h2><div class="chips">${reg.els.length?reg.els.map(elChip).join(''):'<span class="el" style="--c:var(--mut)">Town</span>'}</div></div>
  <p>${reg.desc}</p>
  <p class="mut">Weather: ${w.name}${w.boost.length?` · boosts ${w.boost.map(e=>ELEM[e].name).join(', ')}`:''}${w.pen.length?` · weakens ${w.pen.map(e=>ELEM[e].name).join(', ')}`:''} · reputation here: ${attitude(S.regRep[S.region]).n} (${fl(S.regRep[S.region])})</p>
  <p class="mut">Materials: ${S.mat.wood} wood \u00b7 ${S.mat.stone} stone. ${HAS3D?'Build on your plot in Thorngate with the hammer button.':''}</p>
  ${warns.map(x=>`<p class="warn">${x.t}: −${x.n} HP per action${x.cond?`, may leave you ${COND[x.cond].n.toLowerCase()}`:''}.${x.fix?` <span class="mut">Resist with: ${x.fix}.</span>`:''}</p>`).join('')}
  ${HAS3D?'<p class="mut">Walk the world to travel. Each place has its own people, dangers and creatures.</p>':`<div class="row"><label for="travel" class="kicker">Travel to</label><select id="travel" data-bind="travel">${others.map(k=>opt(k,`${REG[k].name}${REG[k].els.length?' · '+REG[k].els.map(e=>ELEM[e].name).join('/'):''}`,ui.travel)).join('')}</select><button class="btn" data-act="travel"${out?' disabled':''}>Travel · 1 action</button></div>`}
 </section>
 <section>
  <h3>Actions</h3>
  ${out?'<p class="warn">No actions left today. Sleep to wake at dawn.</p>':''}
  <div class="acts">
   ${Object.entries(ACTS).filter(([k])=>k!=='work'||S.job).map(([k,a])=>btn(k,null,a.n,a.d)).join('')}
   ${reg.sp.map(k=>btn('sp',k,SP[k].n,SP[k].d,SP[k].kind,SP[k].cost)).join('')}
  </div>
  <div class="row"><label for="prac" class="kicker">Practice element</label>
   ${prac.length?`<select id="prac" data-bind="prac">${prac.map(e=>opt(e,`${ELEM[e].name} (${fl(S.aff[e])})`,ui.prac)).join('')}</select><button class="btn" data-act="practice"${out?' disabled':''}>Practice · 1 action</button>`:'<span class="mut">No element you can practice here right now.</span>'}
  </div>
  ${S.region==='vael'?`<div class="row"><label for="job" class="kicker">Guild</label><select id="job" data-bind="job">${Object.keys(JOBS).map(k=>opt(k,`${JOBS[k].n} · ${SN[JOBS[k].s]}${JOBS[k].el?' · '+ELEM[JOBS[k].el].name:''}`,ui.job||S.job||'blacksmith')).join('')}</select><button class="btn" data-act="job">${S.job?'Change job':'Take up job'}</button></div>${S.job?'<p class="mut" style="font-size:.88rem">Changing job resets job experience.</p>':''}`:''}
 </section>
 <section>
  <h3>Food</h3>
  ${dietOf(S.race)==='none'?`<p class="mut">A ${R().sing} needs no food.</p>`:(()=>{
   const fh=foodsHere();const okT=DIETS[dietOf(S.race)].ok;
   if(!fh.some(([k])=>k===ui.food))ui.food=(fh.find(([k,f])=>okT.includes(f.type))||fh[0]||[''])[0];
   return `<p class="mut">${DIETS[dietOf(S.race)].n}. ${S.fedDay===S.day?'You have eaten today.':'You have not eaten today. Go to sleep hungry and you wake weaker.'}</p>
   ${fh.length?`<div class="row"><select id="food" data-bind="food">${fh.map(([k,f])=>opt(k,`${f.n}${f.gold?` · ${f.gold} gold`:''} · ${okT.includes(f.type)?'suits you':'makes you sick'}`,ui.food)).join('')}</select><button class="btn" data-act="eat">Eat · no time</button></div>`:'<p class="mut">Nothing you can eat here right now.</p>'}`;})()}
 </section>
 ${S.comp||S.cand?`<section>
  <h3>Companion</h3>
  ${S.comp?`<div class="npc"><div class="npc-h"><b>${esc(S.comp.name)} the ${RACES[S.comp.race].sing}</b><span class="att" style="color:${S.comp.bond>=50?'var(--fate)':S.comp.bond>=25?'var(--mut)':'var(--hp)'}">Bond ${fl(S.comp.bond)}</span></div>
   <p class="mut">Compatibility ${S.comp.compat}. ${S.comp.compat>=60?'You get along well; bond grows each dawn.':S.comp.compat>=40?'You tolerate each other; bond grows slowly.':'You clash; bond falls each dawn.'} Places that hurt their kind lower bond. At 0 they leave.</p>
   ${hazards(S.comp.race,false).length?`<p class="warn">${esc(S.comp.name)} suffers here: ${hazards(S.comp.race,false).map(x=>x.t.toLowerCase()).join(', ')}.</p>`:''}
   <div class="row"><button class="btn" data-act="dismiss">Part ways</button></div></div>`:''}
  ${S.cand?`<div class="npc"><div class="npc-h"><b>${esc(S.cand.name)}, a ${RACES[S.cand.race].sing}</b><span class="att" style="color:${S.cand.compat>=60?'var(--fate)':S.cand.compat>=35?'var(--mut)':'var(--corr)'}">Compatibility ${S.cand.compat}</span></div>
   <p class="mut">${S.cand.why.map(esc).join(' · ')}. ${S.cand.compat<35?'They will not travel with you.':''}</p>
   <div class="row"><button class="btn primary" data-act="invite"${S.cand.compat<35?' disabled':''}>Invite${S.comp?' (replaces '+esc(S.comp.name)+')':''}</button><button class="btn" data-act="decline">Part ways</button></div></div>`:''}
 </section>`:''}
 <section>
  <div class="npc">
   <div class="npc-h"><h3 style="color:var(--fg)">${N.name}, ${N.role}</h3><span class="att" style="color:${att.c}">${att.n} ${fl(st.rep)}</span></div>
   <p>${N.name} ${npcLine}</p>
   <p class="mut">Today: ${needOf(npc)}.</p>
   <div class="acts">
    ${btn('help',npc,'Help',st.helped===S.day?'Already helped today':'Fate +5, reputation +10','kind',1,st.helped===S.day)}
    ${btn('trade',npc,'Trade','Gold and Charm',null,1)}
    ${btn('steal',npc,'Steal',`Gold, Corruption +6. ${Math.round(Math.min(0.9,0.35+S.stats.agi*0.012)*100)}% unseen`,'dark',1)}
   </div>
   ${st.mem.length?`<p class="mut" style="font-size:.88rem">Remembers: ${st.mem.slice(-2).map(esc).join(' · ')}</p>`:''}
  </div>
 </section>
 <section>
  <button class="btn primary sleep" data-act="sleep">Sleep until dawn</button>
  <h3>Recent</h3>
  ${logList(S.log.slice(-12).reverse())}
 </section>`;
}

function renderSelf(){
 const r=R();const smax=Math.max(40,...STATS.map(k=>S.stats[k]));
 const lean=S.tier===1?bestPath():S.path;
 const nodes=r.paths.map((p,i)=>{
  const cls=S.tier>=2?(i===S.path?'cur':'dim'):(i===lean?'lean':'');
  return `<span class="node ${cls}">${p.n} <span class="mut">${SN[p.s]}</span></span>`;}).join('');
 const t3=r.paths.map((p,i)=>`<span class="node ${S.tier>=3&&i===S.path?'cur':S.tier>=2&&i!==S.path?'dim':''}">${p.t3}</span>`).join('');
 const legendLight=S.race==='humans'&&S.blood?BLOOD[S.blood].legend:r.legend;
 const reqs=S.tier<4?evoReqs(S.tier+1):[];
 return `
 <section>
  <h3>Evolution</h3>
  <div class="tree">
   <div class="tier"><span class="kicker">Tier 1</span><div><span class="node ${S.tier===1?'cur':''}">Newly Born ${r.sing}</span></div></div>
   <div class="tier"><span class="kicker">Tier 2</span><div>${nodes}</div></div>
   <div class="tier"><span class="kicker">Tier 3</span><div>${t3}</div></div>
   <div class="tier"><span class="kicker">Tier 4</span><div><span class="node ${S.tier===4&&S.legendName===legendLight?'cur':S.tier<4&&S.fate>=S.corr?'lean':''}">${legendLight}</span><span class="node ${S.tier===4&&S.legendName===r.dark?'cur':S.tier<4&&S.corr>S.fate?'lean':''}" style="border-color:color-mix(in srgb,var(--corr) 60%,var(--line))">${r.dark}</span></div></div>
  </div>
  ${S.tier===1?`<p class="mut">Leaning toward <b style="color:var(--gold)">${r.paths[lean].n}</b>, your highest matching stat is ${SN[r.paths[lean].s]}. Your path is fixed when you reach Tier 2.</p>`:''}
  ${S.tier<4?`<div><div class="kicker" style="margin-bottom:6px">Next dawn evolution to Tier ${S.tier+1} needs</div><ul class="req">${reqs.map(x=>`<li class="${x.ok?'ok':''}">${x.l}</li>`).join('')}</ul>${S.tier===3?`<p class="mut" style="margin-top:6px">Whichever is higher, Fate or Corruption, decides your legendary form.</p>`:''}</div>`:'<p class="mut">You have reached your legendary form.</p>'}
 </section>
 <div class="two">
  <section>
   <h3>Stats</h3>
   ${STATS.map(k=>`<div class="stat"><span>${SN[k]}</span>${bar(S.stats[k],smax,'var(--gold)')}<span class="num" style="text-align:right">${fl(S.stats[k])}</span></div>`).join('')}
   <p class="mut" style="font-size:.88rem">Total ${fl(statSum())}. Endurance 25 grants a 4th daily action.${R().group==='night'?' Night kind: gains +30% at night, −20% in sunlight.':''}${S.pet?` Companion: ${S.pet} (+10% gains).`:''}</p>
  </section>
  <section>
   <h3>Elements</h3>
   <p class="mut" style="font-size:.88rem">Holding ${slotsUsed()} of ${maxSlots()} elements. ${S.race==='humans'?'Humans grow elements 50% faster and change body at Flow.':'Body changes at Bond.'}</p>
   ${ELS.map(e=>{const v=S.aff[e],lv=affLevel(v),locked=v<=0&&!canGrow(e);return `<div class="aff" style="${locked?'opacity:.4':''}"><span style="color:${ELEM[e].c}">${ELEM[e].name}</span>${bar(v,100,ELEM[e].c)}<span class="lvl">${locked?'Locked':`${lv.n} ${fl(v)}`}</span></div>`;}).join('')}
  </section>
 </div>
 <section>
  <h3>Body and needs</h3>
  <p>${DIETS[dietOf(S.race)].n} · ${bodyNotes(S.race).join(' · ')}</p>
  <p class="mut" style="font-size:.9rem">Elements protect you too: Water 30 lets you breathe underwater, Fire or Magma 30 lets you walk on lava, Ice 30 resists cold, Air 30 handles thin air, Death or Spirit 10 resists grave miasma.</p>
  ${Object.keys(S.cond).length?`<ul class="req">${Object.keys(S.cond).filter(c=>COND[c]).map(c=>`<li class="${COND[c].good?'ok':''}"><b>${COND[c].n}</b> · ${COND[c].d}</li>`).join('')}</ul>`:''}
  <p>${S.traits.length?S.traits.map(esc).join(' · '):'<span class="mut">No changes yet. Elements at Bond reshape your body.</span>'}</p>
  <p class="mut">${esc(r.trait)}.${S.blood?` Awakened ${BLOOD[S.blood].name} blood.`:''}${S.home?` Home element: ${ELEM[S.home].name}.`:' No home element yet; your strongest element becomes it at Tier 2.'}</p>
 </section>`;
}

function renderMagic(){
 const fs=forgeState();const out=energyLeft()<=0;
 const preview=ui.fe1?autoName(ui.fe1,ui.fe2||null,ui.ff):'';
 const k=ui.fs&&ui.fe1?codexKey({src:ui.fs,e1:ui.fe1,e2:ui.fe2||null,form:ui.ff}):'';
 const known=k&&CODEX[k];
 return `
 <section>
  <h3>Sources of power</h3>
  <p class="mut">Spell = Source + Element + Form. Power grows with the source’s stat and your element affinity.</p>
  <div class="srcs">${Object.entries(SRC).map(([id,s])=>{const on=S.sources.includes(id);return `<div class="src${on?' on':''}"><b>${s.n} ${on?'<span class="kicker" style="color:var(--gold)">unlocked</span>':''}</b><span class="mut">${s.d}</span><span class="kicker">${on?`Uses ${SN[s.stat]}`:`Needs ${s.rt}`}</span></div>`;}).join('')}</div>
 </section>
 <section>
  <h3>Spell forge</h3>
  ${fs.e1s.length?`
  <div class="forge">
   <label for="fs">Source<select id="fs" data-bind="fs">${fs.srcs.map(s=>opt(s,SRC[s].n,ui.fs)).join('')}</select></label>
   <label for="fe1">Element<select id="fe1" data-bind="fe1">${fs.e1s.map(e=>opt(e,`${ELEM[e].name} (${fl(S.aff[e])})`,ui.fe1)).join('')}</select></label>
   <label for="fe2">Fuse with<select id="fe2" data-bind="fe2">${opt('','None',ui.fe2)}${fs.e2s.map(e=>opt(e,ELEM[e].name,ui.fe2)).join('')}</select></label>
   <label for="ff">Form<select id="ff" data-bind="ff">${Object.keys(FORMS).map(f=>opt(f,FORMS[f].n,ui.ff)).join('')}</select></label>
  </div>
  <p class="mut">${FORMS[ui.ff].d}${fs.e2s.length?'':' Fusion unlocks when two elements reach Flow (30).'}</p>
  ${known?`<p>This spell already exists: <b>${esc(known.name)}</b>, created by ${esc(known.inventor)}. You will learn it under that name.</p>`:`<div class="row"><label for="fname" class="kicker">Name it</label><input type="text" id="fname" data-bind="fname" maxlength="28" placeholder="${esc(preview)}" value="${esc(ui.fname)}" style="flex:1 1 200px"></div><p class="mut">No one has made this combination yet. You will be its creator.</p>`}
  <div class="row"><button class="btn primary" data-act="forge"${out?' disabled':''}>Forge spell · 1 action</button><span class="mut">${S.spells.length}/6 spells</span></div>
  `:'<p class="mut">You need an element at Spark (10) to shape a spell. Practice an element first.</p>'}
 </section>
 <section>
  <h3>Spellbook</h3>
  ${S.spells.length?S.spells.map((sp,i)=>`<div class="spell"><div style="display:grid;gap:4px;min-width:0"><span class="spell-name">${esc(sp.name)}${sp.mine?' <span class="kicker" style="color:var(--gold)">your creation</span>':''}</span><div class="chips">${elChip(sp.e1)}${sp.e2?elChip(sp.e2):''}<span class="kicker">${SRC[sp.src].n} · ${FORMS[sp.form].n}</span></div></div><div class="row"><span class="num">${spellUsable(sp)?`Power ${fl(spellPower(sp))}`:'Silent'}</span><button class="btn" data-act="forget" data-arg="${i}">Forget</button></div></div>`).join(''):'<p class="mut">Empty. Spells are used automatically in hunts: the best damage spell for the enemy’s element each round, plus any Ward, Weave, Shape or Enchant you know.</p>'}
 </section>
 <section>
  <h3>Spell codex of this world</h3>
  <p class="mut" style="font-size:.88rem">Every first creation is recorded with its inventor. In this prototype the world lives in your browser, shared by every character you make here.</p>
  ${Object.keys(CODEX).length?`<div class="tbl-wrap"><table><thead><tr><th>Spell</th><th>Recipe</th><th>Creator</th></tr></thead><tbody>${Object.entries(CODEX).map(([key,c])=>{const[src,els,form]=key.split('|');return `<tr><td>${esc(c.name)}</td><td>${SRC[src]?SRC[src].n:esc(src)} · ${els.split('+').map(e=>ELEM[e]?ELEM[e].name:esc(e)).join(' + ')} · ${FORMS[form]?FORMS[form].n:esc(form)}</td><td>${esc(c.inventor)}, day ${c.day}</td></tr>`;}).join('')}</tbody></table></div>`:'<p class="mut">No spells recorded yet.</p>'}
 </section>`;
}

function renderWorld(){
 return `
 <section>
  <h3>Regions</h3>
  <div class="tbl-wrap"><table><thead><tr><th>Place</th><th>Elements</th><th>Weather today</th><th>Reputation</th></tr></thead><tbody>
  ${Object.entries(REG).map(([k,r])=>{const a=attitude(S.regRep[k]);return `<tr><td>${r.name}${k===S.region?' <span class="kicker" style="color:var(--gold)">here</span>':''}</td><td><div class="chips">${r.els.map(elChip).join('')||'<span class="mut">Town</span>'}</div></td><td>${WEATHER[weatherHere(k)].name}</td><td style="color:${a.c}">${a.n} ${fl(S.regRep[k])}</td></tr>`;}).join('')}
  </tbody></table></div>
 </section>
 <section>
  <h3>People who know you</h3>
  <div class="tbl-wrap"><table><thead><tr><th>Person</th><th>Lives in</th><th>Attitude</th><th>Remembers</th></tr></thead><tbody>
  ${Object.entries(NPCS).map(([k,n])=>{const s=S.npcs[k],a=attitude(s.rep);return `<tr><td>${n.name}<div class="mut" style="font-size:.82rem">${n.role}</div></td><td>${REG[NPC_REGION[k]].name}</td><td style="color:${a.c}">${a.n} ${fl(s.rep)}${s.gifted?' · ally':''}</td><td class="mut">${s.mem.length?s.mem.slice(-3).map(esc).join('<br>'):'Nothing yet'}</td></tr>`;}).join('')}
  </tbody></table></div>
  <p class="mut" style="font-size:.88rem">Reputation 60 with a person makes them a devoted ally who teaches you a secret. Hostile places pay half for work and people there refuse to trade.</p>
 </section>
 <section>
  <h3>Element wheel</h3>
  <div class="tbl-wrap"><table><thead><tr><th>Element</th><th>Strong against</th><th>Weak against</th></tr></thead><tbody>
  ${ELS.map(e=>`<tr><td>${elChip(e)}</td><td>${ELEM[e].strong.map(x=>ELEM[x].name).join(', ')}</td><td>${ELEM[e].weak.map(x=>ELEM[x].name).join(', ')}</td></tr>`).join('')}
  </tbody></table></div>
 </section>`;
}

function renderLog(){
 return `
 <section>
  <h3>Chronicle</h3>
  <p class="mut" style="font-size:.88rem">The great moments of your life.</p>
  <ul class="log">${S.chron.slice().reverse().map(c=>`<li class="gold"><span class="kicker">Day ${c.d}</span> ${esc(c.t)}</li>`).join('')}</ul>
 </section>
 <section>
  <h3>Full journal</h3>
  ${logList(S.log.slice().reverse().slice(0,80))}
 </section>
 <section>
  ${ui.confirm?`<div class="confirm"><p>Start over with a new character? This one will be gone. Spells in the codex stay.</p><div class="row"><button class="btn" data-act="reset-yes" style="border-color:var(--corr)">Yes, start over</button><button class="btn" data-act="reset-no">Keep playing</button></div></div>`:`<button class="btn" data-act="reset">New character</button>`}
 </section>`;
}


