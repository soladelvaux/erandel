/* ---------- graphics quality tiers (ERANDEL_ART_BIBLE.md §16; docs/regions/erelian.md) ---------- */
/** Rendering budgets per tier. Gameplay never depends on these. */
const GFX_TIERS={
 low:   {density:.45,grassDist:16,lod0Dist:16,treeDist:75, motes:60, spray:36, rays:false,maxGrass:900},
 medium:{density:.7, grassDist:24,lod0Dist:24,treeDist:105,motes:140,spray:80, rays:true, maxGrass:2200},
 high:  {density:1,  grassDist:34,lod0Dist:34,treeDist:140,motes:240,spray:140,rays:true, maxGrass:4200},
};
const GFX_ORDER=['auto','low','medium','high'];
/** The tier in use: ?gfx=low|medium|high, else the saved setting, else medium on phones and high elsewhere. */
function gfxTier(){
 let q=null;try{const m=/[?&]gfx=(low|medium|high)\b/.exec(location.search);q=m&&m[1];}catch(e){}
 const p=PREFS.gfx&&PREFS.gfx!=='auto'?PREFS.gfx:null;
 return q||p||(IS_PHONE?'medium':'high');
}
/** Budgets of the tier in use. */
function gfx(){return GFX_TIERS[gfxTier()];}
