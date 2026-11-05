/* ============ ERANDEL WORLD (cozy 3D diorama) ============ */
let HAS3D=false,CAN3D=false;
(function(){try{const c=document.createElement('canvas');CAN3D=!!(c.getContext('webgl')||c.getContext('experimental-webgl'));}catch(e){CAN3D=false;}HAS3D=!!(window.THREE&&CAN3D);})();
const IS_PHONE=Math.min(window.innerWidth||800,window.innerHeight||800)<700;
const PREF_KEY='erandel-prefs-v1';
let PREFS={glow:true,tilt:true,vol:.5};
try{Object.assign(PREFS,JSON.parse(localStorage.getItem(PREF_KEY)||'{}'));}catch(e){}
function savePrefs(){try{localStorage.setItem(PREF_KEY,JSON.stringify(PREFS));}catch(e){}}

const CENTERS={vael:[0,38],greenmere:[-46,8],coral:[-52,58],sanctum:[40,30],moonwell:[10,-8],skyreach:[-4,-50],frostfell:[-48,-46],ember:[56,-12],stonedeep:[46,-54],hollow:[0,84]};
const BIOME={vael:{h:1,amp:.6,c:'#5f8a40'},greenmere:{h:1.4,amp:.8,c:'#56704a'},coral:{h:-6,amp:.8,c:'#2f6f72'},sanctum:{h:2.5,amp:.6,c:'#98ab6a'},moonwell:{h:1,amp:.5,c:'#43786a'},skyreach:{h:13,amp:3.5,c:'#7e837f'},frostfell:{h:4,amp:1.2,c:'#dfe8ee'},ember:{h:1.6,amp:1,c:'#6e402e'},stonedeep:{h:15,amp:3.5,c:'#625a50'},hollow:{h:.3,amp:.5,c:'#434a40'}};
const TAGLINE={vael:'Where reborn souls cross into Erandel',greenmere:'City of the White Boughs',coral:'Where the Aethwyn sleeps beneath the water',sanctum:'Keeper of the first light',moonwell:'The pool that holds the moon',skyreach:'The windward road where the Aethwyn begins',frostfell:'The winter that never ends',ember:'Ash, vents and the old fire',stonedeep:'Halls of the rune-hammer',hollow:'Where souls choose rebirth or eternity'};
const WB={minX:-80,maxX:80,minZ:-80,maxZ:100};
const RIVER=[[-4,-44],[-8,-24],[-24,-6],[-38,14],[-44,34],[-52,56]];
const SPAWN={x:0,z:60};
const NPC_POS={ysolde:[-5,37],maren:[-52,58],bramble:[-42,12],kesh:[54,-10],tovin:[-4,-45],hilde:[-46,-42],durgan:[46,-47],nyx:[3,82],aldric:[37,33],selune:[13,-5]};
const AEL_POS=[2.6,53.2];
const AEL_LORE=[
 'Every soul that reaches the Thorngate must choose: rebirth, or eternity. You chose to be born again. Erandel will remember what you do with that choice.',
 'The Aethwyn begins in the snows of Vetharn’s Pass, runs through Erelian, and sinks into the Mere, where the Mermaid Queen keeps her court beneath the water.',
 'Erelian, the city of white boughs, lies to the west. Elash keeps its groves. Its people read the old magic in leaves and running water.',
 'South of this gate lies the Veilmoor. The souls who chose eternity wait there. The living should not linger long.',
 'Runekar still hammers runes in the Deep, far to the northeast. Caelithra reads the moon at her well in the heart of the land.',
 'The plot by the lantern pond is yours. Light it well. Travelers of every kind will come to a market that glows.',
 'Fate and Corruption are not rewards or punishments. They are the shape your deeds leave on the world, and the world answers that shape.',
];
