"use strict";
/* ============ DATA ============ */
const STATS=['str','agi','mnd','spr','cha','end'];
const SN={str:'Strength',agi:'Agility',mnd:'Mind',spr:'Spirit',cha:'Charm',end:'Endurance'};

const ELEM={
 fire:{name:'Fire',c:'#e8613f',adj:'Ember',strong:['ice','nature'],weak:['water'],trait:'Ember eyes'},
 water:{name:'Water',c:'#4fa3dc',adj:'Tide',strong:['fire','magma'],weak:['lightning','nature'],trait:'Gill slits along the neck'},
 earth:{name:'Earth',c:'#b48d5c',adj:'Stone',strong:['lightning'],weak:['air','nature'],trait:'Stone-flecked skin'},
 air:{name:'Air',c:'#c7d9c0',adj:'Gale',strong:['earth'],weak:['ice'],trait:'Feather-light step'},
 ice:{name:'Ice',c:'#8fd4f0',adj:'Frost',strong:['air','nature'],weak:['fire','magma'],trait:'Frost on your breath'},
 lightning:{name:'Lightning',c:'#ead85a',adj:'Storm',strong:['water','air'],weak:['earth'],trait:'Hair that crackles'},
 nature:{name:'Nature',c:'#71bf6c',adj:'Thorn',strong:['water','earth'],weak:['fire','ice'],trait:'Leaf-veined skin'},
 magma:{name:'Magma',c:'#ff9142',adj:'Magma',strong:['ice','earth'],weak:['water'],trait:'Glowing cracks in the skin'},
 light:{name:'Light',c:'#f3e7a9',adj:'Dawn',strong:['shadow','death'],weak:['moon'],trait:'A faint halo'},
 shadow:{name:'Shadow',c:'#9b8fd0',adj:'Shade',strong:['light','spirit'],weak:['light'],trait:'A shadow that moves on its own'},
 spirit:{name:'Spirit',c:'#9fe0d0',adj:'Soul',strong:['death'],weak:['shadow'],trait:'Translucent edges'},
 moon:{name:'Moon',c:'#c9cde3',adj:'Lunar',strong:['light','shadow'],weak:['spirit'],trait:'Silver irises'},
 death:{name:'Death',c:'#93a08b',adj:'Grave',strong:['light','nature'],weak:['spirit','light'],trait:'Cold, pale skin'},
};
const ELS=Object.keys(ELEM);
const FUSION={'lightning+water':'Storm','light+shadow':'Eclipse','fire+ice':'Steam','air+fire':'Firestorm','earth+water':'Mire','nature+water':'Bloom','death+spirit':'Wraith','moon+shadow':'Nightveil','light+moon':'Silverdawn','fire+light':'Solar','ice+water':'Glacier','air+ice':'Blizzard','air+lightning':'Tempest','earth+nature':'Rootstone','death+nature':'Blight','fire+magma':'Inferno','death+shadow':'Dread','moon+spirit':'Dreamtide'};

const WEATHER={
 clear:{name:'Clear',boost:[],pen:[]},
 rain:{name:'Rain',boost:['water','nature'],pen:['fire']},
 storm:{name:'Storm',boost:['lightning','air'],pen:['fire']},
 snow:{name:'Snow',boost:['ice'],pen:['nature']},
 heat:{name:'Heatwave',boost:['fire','magma'],pen:['ice']},
 fog:{name:'Fog',boost:['shadow','spirit'],pen:['light']},
 under:{name:'Underground',boost:['earth'],pen:[]},
};
const TIMES=['Morning','Afternoon','Night'];

const GROUPS={sea:'Sea',night:'Night',nature:'Nature',sky:'Sky',elemental:'Elemental',beast:'Beastfolk',divine:'Divine & cursed',small:'Small folk & humans'};
// id, name, singular, group, home, weak, natural source, bonus, trait, paths, legend, dark legend
const RACE_DEF=[
['merfolk','Merfolk','Merfolk','sea','water','fire','mana','agi2 cha2','Breathe water; dry out away from it','Deep Diver:end:Abyssal Hunter|Shore Walker:agi:Tidewalker|Songweaver:cha:Siren|Reef Warden:str:Coral Knight|Pearl Seer:mnd:Pearl Oracle','Tide Sovereign','Drowned One'],
['sirens','Sirens','Siren','sea','water','lightning','song','cha3 mnd1','Voice magic and charm; frail body','Lullaby:spr:Dream Singer|Wailer:mnd:Shipbreaker|Mirror-Voice:cha:Echo Thief','Voice of the Abyss','Drowning Chorus'],
['selkies','Selkies','Selkie','sea','water','fire','spirit','end2 cha1 agi1','Seal skin lets them shift between sea and land','Skin-Keeper:spr:Storm Seal|Wanderer:agi:Two-World Diplomat|Hearth-Bound:cha:Village Guardian','Eternal Tide-Walker','Skinless Wraith'],
['nereids','Nereids','Nereid','sea','water','shadow','nature','spr2 cha2','Sea-nymphs who heal and calm waters','Calm-Bringer:spr:Tide Priestess|Current Rider:agi:Whirlpool Dancer|Pearl Healer:mnd:Ocean Mender','Daughter of the Sea God','Brine Witch'],
['vampires','Vampires','Vampire','night','shadow','light','life','str1 agi1 cha2','Blood heals and empowers; sunlight burns','Noble Blood:cha:Blood Lord|Feral Hunger:str:Mist Stalker|Penitent:spr:Crimson Healer','Daywalker Saint','Blood Tyrant'],
['werewolves','Werewolves','Werewolf','night','moon','light','spirit','str3 end1','Wolf form; the full moon forces the shift','Pack Alpha:cha:Howl Lord|Lone Wolf:agi:Shadow Fang|Moon-Sage:spr:Spirit Wolf','Moon’s Chosen','Fenris-Born'],
['ghouls','Ghouls','Ghoul','night','death','light','spirit','end2 mnd2','Borrow memories from the dead; hated in towns','Grave Scholar:mnd:Memory Thief|Scavenger:end:Bone Crafter|Mourner:spr:Death Priest','Keeper of Lost Souls','Hollow King'],
['shades','Shades','Shade','night','shadow','light','mana','agi3 mnd1','Living shadows that step through darkness','Lurker:agi:Umbral Assassin|Whisper:cha:Spy-Master|Lantern-Bearer:spr:Shadow Guide','Nightfall Incarnate','The Unlit'],
['nymphs','Nymphs','Nymph','nature','nature','fire','nature','spr2 cha2','Bound to a tree, spring or mountain home','Rooted:end:Grove Mother|Wandering:agi:River Spirit|Blooming:cha:Spring Healer','Spirit of the Land','Withered Dryad'],
['elves','Elves','Elf','nature','nature','shadow','mana','agi2 mnd2','Long-lived, keen senses, archery and magic','Wood Elf:agi:Arcane Archer|Dusk Elf:str:Spellblade|High Elf:mnd:Starseer','Starborn','Blightborne'],
['fae','Fae','Fae','nature','nature','earth','nature','cha2 mnd1 agi1','Tiny tricksters; iron burns; promises bind','Trickster:cha:Glamour Weaver|Court Fae:spr:Seelie Knight|Wild Fae:agi:Dream Fae','Fae Monarch','Unseelie Sovereign'],
['treants','Treants','Treant','nature','nature','fire','nature','str2 end2','Huge and slow; regenerate in sunlight','Guardian:end:Forest Titan|Rootwalker:mnd:Root Mage|Sapling-Keeper:spr:Seed Prophet','World-Tree Heart','Blight Colossus'],
['satyrs','Satyrs','Satyr','nature','nature','ice','song','cha3 agi1','Music, revelry and wild charm','Reveler:cha:Frenzy Dancer|Herd-Keeper:end:Beast Shepherd|Pipe Player:mnd:Wild Bard','Lord of the Wild Feast','Maddened Piper'],
['harpies','Harpies','Harpy','sky','air','ice','mana','agi3 str1','Talons and fast dives; distrusted','Raider:str:Sky Reaper|Nest-Keeper:end:Wind Matron|Storm Rider:agi:Thunder Talon','Queen of Tempests','Carrion Queen'],
['birdfolk','Birdfolk','Birdfolk','sky','air','water','mana','agi2 mnd1 end1','Feathered folk with keen sight','Scout:agi:Eagle Eye|Messenger:cha:Cloud Courier|Sky Sailor:end:Airship Captain','Phoenix-Blooded','Ashwing'],
['sylphs','Sylphs','Sylph','sky','air','earth','spirit','agi2 spr2','Air spirits, near-invisible in wind','Breeze:spr:Sky Healer|Gale:agi:Tornado Dancer|Whisper-Wind:cha:Voice-Carrier','Living Wind','Dead Calm'],
['tengu','Tengu','Tengu','sky','air','earth','spirit','str2 agi2','Crow-winged warrior monks','Mountain Hermit:spr:Mountain Sage|Blade Monk:str:Storm Swordsman|Trickster Crow:cha:Feather Illusionist','Great Tengu Lord','Black-Feather Demon'],
['salamanders','Salamanders','Salamander','elemental','fire','water','mana','str2 end2','Fire-skinned, immune to burns','Ember:mnd:Flame Dancer|Forge-Born:end:Magma Smith|Wildfire:str:Inferno Berserker','Living Volcano','Ashen Ruin'],
['golems','Golems','Golem','elemental','earth','air','runes','str2 end2','Stone bodies with huge defense','Sentinel:end:Mountain Guard|Builder:mnd:Rune Architect|Awakened:spr:Gem-Heart','Titan of the Deep Earth','Rampaging Colossus'],
['djinn','Djinn','Djinn','elemental','fire','water','contract','mnd2 cha2','Smoke forms; grant small wishes for a price','Wish-Trader:cha:Sand Sultan|Desert Wanderer:agi:Mirage Weaver|Bound Servant:spr:Free Djinn','Marid Emperor','Ifrit of Ruin'],
['frostkin','Frostkin','Frostkin','elemental','ice','fire','mana','end2 mnd2','Ice-born with a freezing touch','Snow Hunter:str:Blizzard Lord|Glacier Keeper:mnd:Ice Sculptor-Mage|Winter Witch:spr:Frost Healer','Eternal Winter','Heart of Black Ice'],
['kitsune','Kitsune','Kitsune','beast','spirit','light','spirit','mnd2 cha2','Fox shapeshifters who grow tails','Shrine Fox:spr:Spirit Messenger|Trickster Fox:cha:Illusion Queen|Wild Fox:mnd:Foxfire Mage','Nine-Tailed Celestial','Nine-Tailed Calamity'],
['nekomata','Nekomata','Nekomata','beast','shadow','light','spirit','agi3 cha1','Two-tailed cat spirits, agile and curious','Alley Cat:agi:Night Prowler|Temple Cat:cha:Fortune Cat|Ghost Cat:spr:Spirit Puppeteer','Cat Sovereign of Ten Lives','Bakeneko Curse'],
['minotaurs','Minotaurs','Minotaur','beast','earth','air','mana','str3 end1','Huge strength and charge attacks','Labyrinth Guard:end:Maze Lord|Gladiator:str:Bull Champion|Earth-Tiller:spr:Earth Shaker','Horned Colossus','Bloodhorn Tyrant'],
['centaurs','Centaurs','Centaur','beast','nature','air','nature','agi2 end2','Fast runners, archers and star-readers','Plains Rider:agi:Storm Archer|Star Watcher:mnd:Astrologer|Herd Healer:spr:Wild Healer','Sky-Hoof Ancient','Burning-Plain Warlord'],
['lizardfolk','Lizardfolk','Lizardfolk','beast','water','ice','spirit','end2 str2','Scaled swamp folk who regrow limbs','Swamp Hunter:str:Croc Warlord|Shaman:spr:Toad Seer|Scale-Trader:cha:Dragon-Kin','Dragonblood Ascendant','Venom Wyrm'],
['seraphs','Seraphs','Seraph','divine','light','shadow','faith','spr3 cha1','Winged healers; Corruption 25 starts the Fall','Guardian:end:Sun Paladin|Messenger:spr:Divine Healer|Judge:mnd:Oath Keeper','Archangel','Fallen Archon'],
['fallen','Fallen','Fallen','divine','shadow','light','mana','str2 spr1 cha1','Broken wings; Fate 70 with almost no Corruption restores them','Seeker of Grace:spr:Redeemed|Embraced Dark:str:Night Herald|Grey Wanderer:agi:Grey Warden','Morningstar','Lord of the Pit'],
['demons','Demons','Demon','divine','fire','light','contract','str2 cha2','Contracts and a fear aura','Contractor:cha:Pact Lord|Tormentor:str:Hellfire Knight|Exile:spr:Repentant Demon','Demon Saint','Archdemon'],
['tieflings','Tieflings','Tiefling','divine','fire','light','contract','cha2 mnd2','Part-demon humans, distrusted at first','Outcast:end:Hellborn Hero|Charmer:cha:Silver-Tongue|Rebel:mnd:Infernal Warlock','Crowned Heir of Two Worlds','Infernal Heir'],
['liches','Liches','Lich','divine','death','light','life','mnd3 spr1','Undead mages; start with Corruption','Scholar of Death:mnd:Soul Archivist|Tomb Lord:cha:Necromancer King|Bone Mage:str:Plague Lord','Death’s Equal','Eternal Lich'],
['dwarves','Dwarves','Dwarf','small','earth','water','runes','str2 end2','Smiths and miners, hard to poison','Miner:end:Deep Delver|Smith:str:Runesmith|Brewer:cha:Ale-Sage','Forge-Father','Greed-Bound King'],
['gnomes','Gnomes','Gnome','small','lightning','earth','runes','mnd3 agi1','Inventors of gadgets and illusions','Tinkerer:mnd:Clockwork Master|Illusionist:cha:Prism Mage|Gem-Cutter:agi:Airship Engineer','Grand Inventor','Mad Machinist'],
['halflings','Halflings','Halfling','small','nature','ice','mana','agi2 cha2','Naturally lucky; start with Fate','Homebody:end:Master Chef|Pickpocket:agi:Lucky Rogue|Adventurer:mnd:Lorekeeper','Fortune’s Favorite','Thief-Lord of Shadows'],
['goblins','Goblins','Goblin','small','shadow','light','mana','agi2 mnd1 cha1','Clever traders, distrusted in towns','Scrapper:mnd:Junk Engineer|Merchant:cha:Trade Baron|Shaman:spr:Goblin Hex-Mage','Goblin King of the Market','Warboss of Ruin'],
['humans','Humans','Human','small',null,null,'mana','str1 agi1 mnd1 spr1 cha1 end1','No natural element; adapt 50% faster and may awaken a hidden bloodline','Warrior:str:Champion|Ranger:agi:Shadowblade|Scholar:mnd:Archmage|Mystic:spr:Saint|Diplomat:cha:Sovereign|Survivor:end:Ironheart','Legend of Erandel','Tyrant of Erandel'],
];
const RACES={};
RACE_DEF.forEach(d=>{
 const bonus={};
 d[7].split(' ').forEach(t=>{const m=t.match(/^([a-z]+)(\d+)$/);if(m)bonus[m[1]]=+m[2];});
 RACES[d[0]]={id:d[0],name:d[1],sing:d[2],group:d[3],home:d[4],weak:d[5],nat:d[6],bonus,trait:d[8],
  paths:d[9].split('|').map(p=>{const[n,s,t3]=p.split(':');return{n,s,t3};}),legend:d[10],dark:d[11]};
});
const DISTRUSTED=['ghouls','demons','tieflings','goblins','harpies','liches','fallen'];

/* Survival: bodies, diets, conditions, companions */
const DIET_OF={merfolk:'fish',sirens:'fish',selkies:'fish',nereids:'fish',vampires:'blood',ghouls:'carrion',shades:'none',nymphs:'sun',fae:'nectar',treants:'sun',sylphs:'none',salamanders:'fire',golems:'ore',djinn:'fire',frostkin:'fish',nekomata:'fish',lizardfolk:'fish',liches:'none'};
const DIETS={
 any:{n:'Eats ordinary food',ok:['meal','fish','nectar']},
 fish:{n:'Eats fish and seafood',ok:['fish','meal']},
 blood:{n:'Lives on blood only',ok:['blood']},
 carrion:{n:'Eats the dead',ok:['carrion','blood']},
 sun:{n:'Feeds on sunlight and nectar',ok:['sun','nectar']},
 nectar:{n:'Lives on nectar and sunlight',ok:['nectar','sun']},
 fire:{n:'Eats fire and coal',ok:['fire']},
 ore:{n:'Eats ore and metal',ok:['ore']},
 none:{n:'Needs no food',ok:[]},
};
function dietOf(rid){return DIET_OF[rid]||'any';}
const WATER_BREATH=['merfolk','sirens','selkies','nereids','lizardfolk'];
const FIRE_SAFE=['salamanders','djinn','demons','tieflings','golems'];
const COLD_SAFE=['frostkin','werewolves','selkies','golems','minotaurs'];
const RIVALS=[['vampires','werewolves'],['seraphs','demons'],['seraphs','liches'],['fae','dwarves'],['salamanders','frostkin'],['salamanders','merfolk'],['salamanders','treants'],['salamanders','nymphs'],['elves','goblins'],['harpies','birdfolk'],['kitsune','werewolves'],['nekomata','werewolves']];
function isRival(a,b){return RIVALS.some(([x,y])=>(x===a&&y===b)||(x===b&&y===a));}
const COND={
 hungry:{n:'Hungry',d:'Gains −25% and −10 HP each dawn until you eat food that suits you.',gm:0.75},
 fed:{n:'Well fed',d:'Gains +10% until dawn.',gm:1.1,good:true},
 sick:{n:'Sick',d:'Gains −30%, −3 HP per action.',gm:0.7,hp:3},
 burned:{n:'Burned',d:'−4 HP per action.',hp:4},
 chilled:{n:'Chilled',d:'Gains −15%.',gm:0.85},
};
const FOODS={
 stew:{n:'Hearty stew',type:'meal',gold:6,where:['vael']},
 smoked:{n:'Smoked fish',type:'fish',gold:5,where:['vael']},
 brazier:{n:'Brazier coals',type:'fire',gold:4,where:['vael']},
 filings:{n:'Iron filings',type:'ore',gold:4,where:['vael']},
 sleeper:{n:'Drink from a sleeper',type:'blood',gold:0,where:['vael'],when:()=>timeIdx()===2,dark:true},
 bread:{n:'Blessed bread',type:'meal',gold:0,where:['sanctum']},
 jerky:{n:'Goat jerky',type:'meal',gold:3,where:['skyreach']},
 reef:{n:'Fresh reef fish',type:'fish',gold:0,where:['coral']},
 icefish:{n:'Ice-hole fish',type:'fish',gold:0,where:['frostfell']},
 berries:{n:'Wild berries and nectar',type:'nectar',gold:0,where:['greenmere']},
 dew:{n:'Moon dew',type:'nectar',gold:0,where:['moonwell']},
 coal:{n:'Glowing vent coal',type:'fire',gold:0,where:['ember']},
 ore:{n:'Raw ore',type:'ore',gold:0,where:['stonedeep']},
 carrion:{n:'Grave offerings',type:'carrion',gold:0,where:['hollow']},
 sun:{n:'Soak up sunlight',type:'sun',gold:0,where:'*',when:()=>timeIdx()<2&&isSunny()},
 blood:{n:'Blood from today’s hunt',type:'blood',gold:0,where:'*',when:()=>S.bloodDay===S.day},
};
const COMP_NAMES=['Mira','Toren','Isk','Vela','Rook','Sable','Nim','Orrin','Lyse','Kael','Bryn','Thessa','Juno','Wren','Faro','Ilsa'];
function bodyNotes(rid){
 const r=RACES[rid],n=[];
 n.push(WATER_BREATH.includes(rid)?'Breathes underwater':'Must hold breath underwater');
 if(r.group==='sea')n.push('Dries out away from water');
 if(FIRE_SAFE.includes(rid)||r.home==='fire')n.push('Walks on lava');
 if(COLD_SAFE.includes(rid)||r.home==='ice')n.push('Shrugs off deep cold');
 if(r.group==='sky')n.push('Thrives in thin air');
 if(r.group==='night')n.push(rid==='vampires'?'Burned by sunlight':'Stung by sunlight');
 if(r.weak)n.push(`Sickened by ${ELEM[r.weak].name.toLowerCase()} places and weather`);
 return n;
}
const BLOOD={
 fae:{name:'Fae',el:'nature',legend:'Fae-Blooded Sovereign',stats:['cha','agi']},
 dragon:{name:'Dragon',el:'fire',legend:'Dragonheart',stats:['str','end']},
 angel:{name:'Angel',el:'light',legend:'Seraph-Born',stats:['spr','cha']},
 demon:{name:'Demon',el:'shadow',legend:'Demon-Blooded Conqueror',stats:['str','cha']},
};

const REG={
 vael:{name:'Thorngate',els:[],desc:'The gate-town where reborn souls enter Erandel. Aelarion Silverbough keeps the gate; the job guild, Ysolde\u2019s inn and your lantern plot are here.',sp:['market','inn','tonic','charm','seek','buywood','buystone'],npc:'ysolde',
  beasts:[{n:'Rat King',el:null,hp:30,atk:5,gold:8},{n:'Cutpurse Gang',el:'shadow',hp:40,atk:7,gold:18}]},
 coral:{name:'Aethwyn Mere',els:['water'],under:true,desc:'Where the Aethwyn river sinks into a deep mere. The Mermaid Queen\u2019s court lies on the bottom. Everything here happens underwater.',sp:['pearls'],npc:'maren',
  beasts:[{n:'Reef Shark',el:'water',hp:45,atk:8,gold:15},{n:'Drowned Sailor',el:'death',hp:40,atk:7,gold:14}]},
 greenmere:{name:'Erelian',els:['nature'],desc:'The elven city of white boughs, built among trees that still listen.',sp:['plant','chop','burn'],npc:'bramble',
  beasts:[{n:'Thornback Boar',el:'nature',hp:50,atk:8,gold:14},{n:'Will-o’-Wisp',el:'spirit',hp:30,atk:9,gold:16}]},
 ember:{name:'Cindral Wastes',els:['fire','magma'],desc:'Ash dunes and glowing vents where smiths work the earth’s heat.',sp:['forge'],npc:'kesh',
  beasts:[{n:'Ember Wisp',el:'fire',hp:35,atk:9,gold:15},{n:'Ash Drake Whelp',el:'magma',hp:60,atk:11,gold:28}]},
 skyreach:{name:'Vetharn\u2019s Pass',els:['air','lightning'],desc:'The high road through wind-cut peaks, where the Aethwyn begins and storms are born.',sp:['climb','quarry'],npc:'tovin',
  beasts:[{n:'Storm Roc',el:'lightning',hp:55,atk:10,gold:24},{n:'Gale Harpy',el:'air',hp:40,atk:8,gold:16}]},
 frostfell:{name:'Hrimwold',els:['ice'],desc:'A white plain under endless winter.',sp:['endure','chop'],npc:'hilde',
  beasts:[{n:'Frost Wolf',el:'ice',hp:45,atk:9,gold:16},{n:'Rime Wraith',el:'ice',hp:40,atk:10,gold:18}]},
 stonedeep:{name:'Runekar\u2019s Deep',els:['earth'],desc:'Mines and rune-halls beneath the mountains, where Runekar\u2019s hammer still rings. No sun reaches here.',sp:['mine'],npc:'durgan',
  beasts:[{n:'Cave Golem',el:'earth',hp:65,atk:9,gold:22},{n:'Deep Crawler',el:'shadow',hp:40,atk:8,gold:15}]},
 hollow:{name:'The Veilmoor',els:['death','shadow'],desc:'Fog and graves beyond the gate, where souls who chose eternity linger.',sp:['honor','rite'],npc:'nyx',
  beasts:[{n:'Restless Ghoul',el:'death',hp:45,atk:9,gold:17},{n:'Wailing Shade',el:'shadow',hp:35,atk:10,gold:16}]},
 sanctum:{name:'Dawnspire',els:['light'],desc:'A white tower where the light is kept.',sp:['pray'],npc:'aldric',
  beasts:[{n:'Fallen Templar',el:'light',hp:55,atk:10,gold:22},{n:'Corrupted Acolyte',el:'shadow',hp:40,atk:8,gold:15}]},
 moonwell:{name:'Caelithra\u2019s Moonwell',els:['moon','spirit'],desc:'A silver pool that holds the moon. Strongest at night.',sp:['moonbathe'],npc:'selune',
  beasts:[{n:'Moon Moth Swarm',el:'moon',hp:35,atk:8,gold:14},{n:'Lunar Stag',el:'moon',hp:55,atk:9,gold:20}]},
};
const NPCS={
 ysolde:{name:'Ysolde',role:'innkeeper',stat:'cha',needs:['A brawl broke out in the common room','The well rope snapped','A traveler cannot pay and is in tears']},
 maren:{name:'Queen Maren',role:'mermaid queen',stat:'cha',needs:['Her pearl net is tangled in the reef','A sailor is lost in the kelp','She wants a duet partner for the tide festival']},
 bramble:{name:'Elash',role:'warden of the white boughs',stat:'spr',needs:['Saplings need water before the dry wind','A fawn is caught in thorns','Poachers left snares in the grove']},
 kesh:{name:'Kesh',role:'vent smith',stat:'str',needs:['Her bellows need hauling to the upper vent','Ore carts overturned on the ash road','She needs a hand quenching a blade']},
 tovin:{name:'Tovin',role:'mountain guide',stat:'agi',needs:['A climber is stuck on the north face','Rope anchors need checking before the storm','His hawk has not come back']},
 hilde:{name:'Hilde',role:'ice harvester',stat:'end',needs:['Ice blocks need cutting before nightfall','Her sled dog is lost in the snow','The cold store door is frozen shut']},
 durgan:{name:'Runekar',role:'rune-smith',stat:'str',needs:['A tunnel has partly collapsed','The lamp oil is running low','Strange tapping comes from the lower shaft']},
 nyx:{name:'Nyx',role:'keeper of lingering souls',stat:'mnd',needs:['Unmarked graves need names','A restless spirit will not settle','The lantern line has gone dark']},
 aldric:{name:'Brother Aldric',role:'priest',stat:'spr',needs:['The sanctum candles must be relit','Pilgrims need guiding up the stairs','A sick child needs a night vigil']},
 selune:{name:'Caelithra',role:'moon oracle',stat:'spr',needs:['The moonwell water is clouded','She needs silverleaf from the glade edge','Visions trouble her sleep']},
};
const NPC_REGION={};Object.keys(REG).forEach(r=>NPC_REGION[REG[r].npc]=r);

const JOBS={
 blacksmith:{n:'Blacksmith',s:'str',el:'fire'},alchemist:{n:'Alchemist',s:'mnd',el:'nature'},herbalist:{n:'Herbalist',s:'spr',el:'nature'},
 farmer:{n:'Farmer',s:'end',el:'earth'},fisher:{n:'Fisher',s:'end',el:'water'},merchant:{n:'Merchant',s:'cha',el:null},
 bard:{n:'Bard',s:'cha',el:'air'},cartographer:{n:'Cartographer',s:'agi',el:'air'},healer:{n:'Healer',s:'spr',el:'light'},
 hunter:{n:'Hunter',s:'agi',el:'nature'},knight:{n:'Knight',s:'str',el:'earth'},assassin:{n:'Assassin',s:'agi',el:'shadow'},
 thief:{n:'Thief',s:'agi',el:'shadow',dark:true},scholar:{n:'Scholar',s:'mnd',el:null},priest:{n:'Priest',s:'spr',el:'light'},
 shipwright:{n:'Shipwright',s:'str',el:'water'},innkeeper:{n:'Innkeeper',s:'cha',el:null},spy:{n:'Spy',s:'cha',el:'shadow'},
 architect:{n:'Architect',s:'mnd',el:'earth'},chef:{n:'Chef',s:'end',el:'fire'},tamer:{n:'Beast Tamer',s:'cha',el:'nature'},
 runecarver:{n:'Rune Carver',s:'mnd',el:'earth'},pearldiver:{n:'Pearl Diver',s:'end',el:'water'},cryptwarden:{n:'Crypt Warden',s:'spr',el:'death'},
 courier:{n:'Sky Courier',s:'agi',el:'air'},iceharvester:{n:'Ice Harvester',s:'end',el:'ice'},astrologer:{n:'Astrologer',s:'mnd',el:'moon'},
};
const JOB_RANKS=[{at:0,n:'Apprentice'},{at:30,n:'Journeyman'},{at:80,n:'Expert'},{at:160,n:'Master'}];

const SRC={
 mana:{n:'Mana',stat:'mnd',d:'Inner energy that refills with rest.',req:()=>S.stats.mnd>=12,rt:'Mind 12'},
 life:{n:'Life Essence',stat:'end',d:'Power from blood and vitality. Costs 3 HP per cast.',req:()=>S.corr>=10,rt:'Corruption 10'},
 nature:{n:'Nature Pact',stat:'spr',d:'Borrowed from the land: ×1.3 in wild places, ×0.6 in town.',req:()=>S.aff.nature>=10,rt:'Nature affinity 10'},
 spirit:{n:'Spirit Bond',stat:'spr',d:'Bonded spirits cast with you.',req:()=>S.stats.spr>=14,rt:'Spirit 14'},
 song:{n:'Voice & Song',stat:'cha',d:'Magic sung or spoken aloud.',req:()=>S.stats.cha>=14,rt:'Charm 14'},
 faith:{n:'Faith',stat:'spr',d:'Granted by a god. Silent while Corruption is higher than Fate.',req:()=>S.stats.spr>=12&&S.fate>=15,rt:'Spirit 12 and Fate 15'},
 contract:{n:'Contract',stat:'cha',d:'Power bought with a price: +1 Corruption per cast.',req:()=>S.stats.cha>=12&&S.corr>=5,rt:'Charm 12 and Corruption 5'},
 runes:{n:'Runes',stat:'mnd',d:'Magic carved into symbols: 15% stronger.',req:()=>S.stats.mnd>=14&&S.stats.str>=10,rt:'Mind 14 and Strength 10'},
};
const FORMS={
 bolt:{n:'Bolt',noun:'Lance',d:'Single strike. Damage ×1.1.',dmg:1.1},
 wave:{n:'Wave',noun:'Surge',d:'Area burst. Damage ×1.0.',dmg:1.0},
 summon:{n:'Summon',noun:'Calling',d:'An ally fights with you. Damage ×0.9; while known, enemies hit 15% softer.',dmg:0.9},
 ritual:{n:'Ritual',noun:'Rite',d:'Huge but slow. Damage ×1.6, fails half the time.',dmg:1.6},
 ward:{n:'Ward',noun:'Wall',d:'Passive: take 40% less damage in fights.'},
 weave:{n:'Weave',noun:'Blessing',d:'Passive: heal 12 HP after each fight.'},
 shape:{n:'Shape',noun:'Form',d:'Passive: weapon attacks +30%.'},
 enchant:{n:'Enchant',noun:'Edge',d:'Passive: weapon attacks +20%.'},
};
const DMG_FORMS=['bolt','wave','summon','ritual'];

