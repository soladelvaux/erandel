/* ============ EVOLUTION ============ */
function evoReqs(t){
 const sum=statSum(),ta=topAffVal();
 if(t===2)return[{l:'Live through 3 dawns',ok:S.day>=4},{l:`Total stats 50 (now ${fl(sum)})`,ok:sum>=50}];
 if(t===3)return[{l:'Reach day 11',ok:S.day>=11},{l:`Total stats 110 (now ${fl(sum)})`,ok:sum>=110},{l:`One element at Flow, 30 (now ${fl(ta)})`,ok:ta>=30}];
 if(t===4)return[{l:'Reach day 21',ok:S.day>=21},{l:`Total stats 180 (now ${fl(sum)})`,ok:sum>=180},{l:`One element at Bond, 60 (now ${fl(ta)})`,ok:ta>=60},{l:`Fate or Corruption 50 (now ${fl(Math.max(S.fate,S.corr))})`,ok:Math.max(S.fate,S.corr)>=50}];
 return[];
}
function tryEvolve(){
 if(S.tier>=4)return;
 const next=S.tier+1;
 if(!evoReqs(next).every(x=>x.ok))return;
 const r=R();
 S.tier=next;
 if(next===2){
  S.path=bestPath();
  if(S.race==='humans'&&!S.home){const t=topAff();if(t)S.home=t;}
 }
 if(next===4){
  const light=S.fate>=S.corr;
  S.legendName=light?(S.race==='humans'&&S.blood?BLOOD[S.blood].legend:r.legend):r.dark;
 }
 const p=r.paths[S.path];
 S.stats[p.s]+=3;STATS.forEach(k=>S.stats[k]+=1);
 S.hp=hpMax();
 const t=title();
 L(`You have evolved. Tier ${next}: ${t}.`,'evo');
 chron(`Evolved into ${t} (Tier ${next}).`);
}
function conversions(){
 let to=null;
 if(S.race==='seraphs'&&S.corr>=25)to='fallen';
 else if(S.race==='fallen'&&S.fate>=70&&S.corr<=10)to='seraphs';
 if(!to)return;
 const from=R().sing;
 S.race=to;S.home=RACES[to].home;
 if(S.aff[S.home]<=0)addAff(S.home,12,{force:true,quiet:true});
 if(!S.sources.includes(RACES[to].nat))S.sources.push(RACES[to].nat);
 if(S.tier>=2&&S.tier<4)S.path=bestPath();
 const msg=to==='fallen'?'Your wings blacken and tear. You have Fallen.':'Light floods your broken wings. You rise again as a Seraph.';
 L(msg,'evo');chron(`${from} became ${RACES[to].sing}. ${msg}`);
}

