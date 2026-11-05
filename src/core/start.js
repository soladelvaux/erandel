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
/** Loads three.js and its post-processing add-ons as ES modules through the page's import map
 *  (three.js r148+ ships add-ons only as modules; ADR-0002 U3) and exposes them as the one THREE
 *  object the game has always used. Same fallbacks as the old script tags: if an add-on fails,
 *  the 3D world starts without bloom; if three.js itself fails, or WebGL is missing, the game
 *  starts in its 2D journal mode. Never rejects. */
function loadThree(){
 if(window.THREE||!CAN3D)return Promise.resolve();
 const add=(p)=>import('three/addons/postprocessing/'+p+'.js').catch((err)=>{console.warn('three.js add-on '+p+' did not load, no bloom',err);return {};});
 return Promise.all([import('three'),add('EffectComposer'),add('RenderPass'),add('ShaderPass'),add('UnrealBloomPass')])
  .then((mods)=>{window.THREE=Object.assign({},...mods);HAS3D=true;})
  .catch((err)=>{console.error('three.js did not load, starting in 2D',err);});
}
function boot(){
 if(window.claude&&window.claude.hot&&window.claude.hot.ready)window.claude.hot.ready(start);
 else start(window.claude&&window.claude.hot&&window.claude.hot.data?window.claude.hot.data:{});
}
if(window.THREE||!CAN3D)boot();else loadThree().then(boot);

