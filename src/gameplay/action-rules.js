/* ============ ACTION COMBAT RULES (real-time; see design/gdd/action-combat.md) ============ */
/** Tunable numbers for third-person movement, real-time combat, focus and the camera. */
const ACT={runSpeed:7,jumpV:9,gravity:25,
 atkCd:.55,atkRange:2.7,atkArc:1.25,
 dodgeCd:1.2,dodgeDist:6.5,dodgeTime:.28,iframes:.4,
 mpBase:50,mpPerMnd:2,mpRegen:4,
 aggro:9,leash:24,windup:.7,enemyCd:1.9,enemyReach:2.3,boltSpeed:9,
 killCap:8,killGold:.4,killGain:.3,respawn:75,
 skill:{bolt:{mp:10,cd:1.2,range:18},wave:{mp:18,cd:4,r:4.5},summon:{mp:25,cd:12,dur:8,tick:1,share:.3,r:7},ritual:{mp:30,cd:8,delay:1.2,r:3.5}},
 camMin:4,camMax:14,pitchMin:.12,pitchMax:1.15};
/** Focus (MP) pool for casting in real time. */
function mpMax(){return Math.round(ACT.mpBase+S.stats.mnd*ACT.mpPerMnd);}
/** Passive spell forms the player knows and can use. */
function passives(){const u=S.spells.filter(spellUsable);const has=f=>u.some(s=>s.form===f);return{ward:has('ward'),weave:has('weave'),shape:has('shape'),enchant:has('enchant'),summon:has('summon')};}
/** Weapon damage per swing before the random ±15%. Same formula as a hunt round. */
function meleeBase(){const p=passives();return(4+S.stats.str*0.5+S.stats.agi*0.3)*(p.shape?1.3:1)*(p.enchant?1.2:1);}
/** Companion damage added to each swing (half of a hunt round). */
function compDamage(b){if(!S.comp)return 0;const ch=RACES[S.comp.race].home;return(5+S.tier*3+S.comp.bond*0.05)*(ch?elemMult(ch,b.el):1)*0.5;}
/** The four hotbar spells: the first four damage spells in the spellbook. */
function skillSlots(){return S.spells.filter(s=>DMG_FORMS.includes(s.form)).slice(0,4);}
/** Damage of one spell hit on an enemy of element el (before the random ±10%). */
function skillDamage(sp,el){return spellPower(sp)*spellMult(sp,el)*FORMS[sp.form].dmg;}
function enemyScale(){return 1+0.5*(S.tier-1);}
/** Real-time enemy HP and attack, scaled by the player's tier like a hunt. */
function enemyStats(b){const sc=enemyScale();return{hp:Math.round(b.hp*sc),atk:b.atk*sc};}
/** Damage one enemy strike deals to the player. */
function enemyHitDamage(b){const p=passives();const m2=b.el&&S.home?elemMult(b.el,S.home):1;return Math.max(1,Math.round(b.atk*enemyScale()*m2*(p.ward?0.6:1)*(p.summon?0.85:1)-S.stats.end*0.2));}
/** Rewards for a real-time kill. Costs no action; only the first ACT.killCap kills a day pay. Returns the log line. */
function killReward(b,els){
 if(!S.kills||S.kills.d!==S.day)S.kills={d:S.day,n:0};S.kills.n++;S.bloodDay=S.day;
 if(S.kills.n>ACT.killCap)return `${b.n} defeated. The wilds have given all they will today; come back after dawn.`;
 const gold=Math.max(1,Math.round(b.gold*enemyScale()*ACT.killGold));S.gold+=gold;
 if(S.comp)S.comp.bond=clamp(S.comp.bond+1,0,100);
 const g=gains([['str',ACT.killGain],['agi',ACT.killGain]]);
 const ag=[];(els||[]).filter((e,i,a)=>e&&a.indexOf(e)===i).forEach(e=>{const x=addAff(e,1,{quiet:true});if(x>0)ag.push(affText(e,x));});
 const healed=passives().weave?heal(4):0;
 return `${b.n} defeated. +${gold} gold${healed?`, healed ${healed}`:''}. ${join(g,...ag)}.`;
}

