/* ============ MAGIC ============ */
function usableSources(){return S.sources;}
function fusionWord(a,b){const k=[a,b].sort().join('+');return FUSION[k]||`${ELEM[a].adj}-${ELEM[b].adj}`;}
function autoName(e1,e2,form){if(!e1||!FORMS[form])return'';return `${e2?fusionWord(e1,e2):ELEM[e1].adj} ${FORMS[form].noun}`;}
function codexKey(sp){return `${sp.src}|${[sp.e1,sp.e2].filter(Boolean).sort().join('+')}|${sp.form}`;}
function spellPower(sp){
 const src=SRC[sp.src];const st=S.stats[src.stat];
 const aff=sp.e2?(S.aff[sp.e1]+S.aff[sp.e2])/2+5:S.aff[sp.e1];
 let p=5+st*0.6+aff*0.3;
 if(sp.src==='nature'){if(S.region==='vael')p*=0.6;else if(['greenmere','moonwell','coral'].includes(S.region))p*=1.3;}
 if(sp.src==='runes')p*=1.15;
 return p;
}
function spellUsable(sp){return!(sp.src==='faith'&&S.corr>S.fate);}
function spellMult(sp,enemyEl){if(!enemyEl)return 1;let m=elemMult(sp.e1,enemyEl);if(sp.e2)m=Math.max(m,elemMult(sp.e2,enemyEl));return m;}
function checkSources(){
 Object.keys(SRC).forEach(k=>{if(!S.sources.includes(k)&&SRC[k].req()){S.sources.push(k);L(`New source of power unlocked: ${SRC[k].n}.`,'gold');chron(`Unlocked ${SRC[k].n} magic.`);}});
}
function forgeState(){
 const srcs=S.sources;
 const e1s=ELS.filter(e=>S.aff[e]>=10);
 if(!srcs.includes(ui.fs))ui.fs=srcs[0]||'';
 if(!e1s.includes(ui.fe1))ui.fe1=e1s[0]||'';
 const e2s=ELS.filter(e=>e!==ui.fe1&&S.aff[e]>=30&&S.aff[ui.fe1]>=30);
 if(ui.fe2&&!e2s.includes(ui.fe2))ui.fe2='';
 if(!FORMS[ui.ff])ui.ff='bolt';
 return{srcs,e1s,e2s};
}

