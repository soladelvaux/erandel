function start(data){
 data=data||{};
 const fromLocal=loadSaved();
 if(data.S&&valid(data.S)){S=data.S;if(data.codex)CODEX=data.codex;}else S=fromLocal;
 if(S){ui.screen='game';if(data.ui)ui.tab=data.ui.tab||'act';if(!S.flags.starter&&!S.build.length)applyStarter();}
 if(HAS3D){try{initWorld();}catch(err){HAS3D=false;console.error(err);}}
 render();
 if(HAS3D)initNet();
}
if(window.claude&&window.claude.hot&&window.claude.hot.snapshot){try{window.claude.hot.snapshot(()=>({S,codex:CODEX,ui:{tab:ui.tab}}));}catch(e){}}
if(window.claude&&window.claude.hot&&window.claude.hot.ready)window.claude.hot.ready(start);
else start(window.claude&&window.claude.hot&&window.claude.hot.data?window.claude.hot.data:{});

