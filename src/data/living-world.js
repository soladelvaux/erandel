/* ============ LIVING WORLD DATA (docs/systems/living-world.md) ============
 * Everything here is data: clock, NPC schedules and lines, creature habits, world events and
 * discoveries. Lore status: names come from ERANDEL_LORE_REGISTRY.md; every schedule, line, habit,
 * event and discovery here is a PROVISIONAL development idea (registry section 12, rows LW1-LW5)
 * built on existing rows, never a new fact about Erandel's history. */

/** World clock. Hours run inside the current part of the day and wait at its end for your deeds
 *  (the deed-based day is the game's progression rule and is unchanged). */
const CLOCK={secPerHour:45,slots:[[6,12],[12,18],[18,30]]};

/** NPC daily schedules: [fromHour, toHour, activity, target]. target: [x,z] point or a route of points.
 *  Hours past 24 belong to the night (18-30 = 6 pm to 6 am). Aelarion keeps the gate (canon C1) and
 *  is never scheduled away; the mermaid queen keeps her court (C3). */
const SCHEDULES={
 bramble:[ // Elash, Erelian (C5 canon name; this day is PROVISIONAL)
  [6,10,'tend',[-47.2,14.2]],
  [10,14,'walk',[[-44,4],[-50,-6],[-46,-10],[-40,-4],[-44,4]]],
  [14,17,'rest',[-52.5,13.5]],
  [17,20,'walk',[[-48,17],[-46.5,18],[-39.8,20],[-33.1,22],[-39.8,20],[-46.5,18],[-48,17]]],
  [20,30,'sleep',[-51.5,6.5]],
 ],
 ysolde:[ // the innkeeper, Thorngate
  [6,11,'work',[-5,37]],
  [11,15,'walk',[[-4,39],[-2,42],[3,44],[8,44.5],[3,42],[-4,39]]],
  [15,19,'work',[-6,36]],
  [19,30,'serve',[-5.5,38.5]],
 ],
 maren:[[6,30,'court',null]],
};
/** The day every other named NPC keeps near home (offsets from NPC_POS). */
const SCHEDULE_DEFAULT=[[6,12,'work',[0,0]],[12,14,'walk',[[0,0],[3,2],[3,-2],[-2,-3],[0,0]]],[14,19,'work',[0,0]],[19,30,'rest',[1.5,1]]];
/** Simulation levels by distance to the player (metres). */
const SIM_LEVELS={full:35,simple:90,simpleEvery:.5,distantEvery:5};

/** What an NPC says when you talk to them, tried in order; the first whose `when` holds is used.
 *  Lines are at most 120 characters; {name} {days} {n} are filled in. PROVISIONAL (registry LW2). */
const NPC_LINES={
 bramble:[
  ['first','You are new to the white boughs. Walk softly; the trees here still listen.'],
  ['huntedHere','{n} of the grove’s creatures fell to you today. The boughs remember every one.'],
  ['corrHigh','There is a shadow on you. The leaves turn away from it.'],
  ['helpedRecently','You helped me before. Erelian does not forget a kindness.'],
  ['away','{name}. {days} days since you last walked my groves.'],
  ['sleep','Mm. The boughs sleep too. Come back at first light.'],
  ['rain','Rain feeds the Aethwyn. The saplings will drink well tonight.'],
  ['tend','These roots are older than the spires. Someone has to keep them.'],
  ['walkEvening','I cross the old bridge every evening. The river sounds different from the middle.'],
  ['fateHigh','The water runs clearer when you pass. Something in Erelian trusts you.'],
  ['any','The groves are quiet today. That is how I like them.'],
 ],
 ysolde:[
  ['first','Another soul through the Thorngate. Rooms are upstairs and the stew is hot.'],
  ['fellToday','You were carried in through the gate today. Sit down and eat something.'],
  ['away','{name}! {days} days. I was starting to think the road took you.'],
  ['night','The night crowd is louder. Keep your coin close.'],
  ['rain','Rain brings travellers in. Good for the inn, bad for my floors.'],
  ['morning','Up early? The bread is not ready, but the gossip is.'],
  ['walk','Market run. If you see good onions, tell me before the goblins buy them all.'],
  ['any','Busy day at the inn. Always is.'],
 ],
};
/** For NPCs without their own lines: a short narration of what they are doing (not invented speech). */
const NPC_NARRATION={work:'{who} keeps working as you talk.',walk:'{who} slows down to talk to you.',rest:'{who} is resting and looks up as you come near.',sleep:'{who} is half asleep.',court:'{who} receives you at her court.',tend:'{who} kneels among the roots.',serve:'{who} serves the night crowd.'};

/** Creature habits by name (registry section 5, PROVISIONAL): when they are awake, whether they patrol a
 *  loop around home, and whether they flee when badly hurt. Anything not listed is always awake,
 *  wanders, and fights to the end. */
const HABITS={
 'Thornback Boar':{awake:'day',flee:true},'Frost Wolf':{awake:'day',flee:true},'Reef Shark':{awake:'day',flee:true},'Ash Drake Whelp':{awake:'day'},'Storm Roc':{awake:'day',patrol:true},'Gale Harpy':{awake:'day',patrol:true},
 'Will-o’-Wisp':{awake:'night'},'Ember Wisp':{awake:'night'},'Rime Wraith':{awake:'night'},'Wailing Shade':{awake:'night'},'Restless Ghoul':{awake:'night'},'Drowned Sailor':{awake:'night'},
 'Cutpurse Gang':{awake:'night',patrol:true},'Fallen Templar':{patrol:true},'Cave Golem':{patrol:true},'Lunar Stag':{awake:'night'},'Moon Moth Swarm':{awake:'night'},
};
const HABIT_FLEE_AT=.25,HABIT_FLEE_TIME=3.5,HABIT_WAKE_DIST=2.5;

/** World events, checked about once a second. PROVISIONAL (registry LW4), each built on the rows named.
 *  when: hours [from,to) (24+ = night), region, near [x,z,r]; chance per check once eligible. */
const WORLD_EVENTS={
 'souls-thorngate':{hours:[20,29],region:'vael',near:[0,52,32],chance:1,
  text:'Pale lights pass through the Thorngate and drift south toward the Veilmoor.',lore:'W2 (canon), A4'},
 'erelian-lamps':{hours:[18,22],region:'greenmere',chance:1,
  text:'Lamps wake along Erelian’s spires as dusk falls.',lore:'L3, L11-L14'},
 'stag-watches':{hours:[17,21],region:'greenmere',chance:.15,
  text:'A Lunar Stag stops and watches you. Its antlers glow like moonlight.',lore:'B20'},
 'moon-in-the-well':{hours:[21,28],region:'moonwell',chance:1,
  text:'The moon rises in the well.',lore:'L10'},
};
/** Local discoveries: found by standing near them. Kept forever in the save. PROVISIONAL (registry LW5). */
const DISCOVERIES={
 'erelian-springs':{at:[[-68.2,19.4],[-68.2,-5.2]],r:4.5,text:'You found the springs that feed Erelian’s falls.',lore:'L11'},
 'erelian-bridge':{at:[[-39.8,20]],r:3,text:'You crossed the old stone bridge over the Aethwyn.',lore:'L0, L13'},
 'erelian-ruins':{at:[[-47.5,-12.5],[-52,-15],[-36,-14]],r:4,text:'Ruins older than the spires. No one you have met can say who raised them.',lore:'L14'},
};
/** Wind strength by weather (sway of grass, leaves, mantle and hair). */
const WIND={clear:.35,heat:.2,rain:.75,storm:1.35,fog:.12,snow:.55,under:0};
