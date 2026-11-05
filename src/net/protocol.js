/* ============ NETWORK PROTOCOL (docs/architecture/multiplayer-architecture.md §5) ============
 * Messages a client may send. A client never sends results (gold, damage, items, progression): it
 * sends INTENTS, and the authority (today the local game, later the server) decides. These validators
 * are pure functions with no game or browser dependencies, written so the same file can run on a
 * Node server. Each returns null when the message is acceptable, or a short reason when it is not.
 * Example: validateIntent({t:'move',x:1,z:2,seq:5},{x:0,z:0,dt:.1,seq:4}) // -> null */
const NET_PROTOCOL=1;
const NET_LIMITS={chatMax:120,nameMax:24,speedSlack:1.25,runSpeed:7,dodgeDist:6.5,maxSkills:4,maxBatch:8};
/** Intent types and their required fields (type name -> field -> 'number' | 'string' | 'boolean'). */
const INTENTS={
 move:{x:'number',z:'number',seq:'number'},
 jump:{seq:'number'},dodge:{dx:'number',dz:'number',seq:'number'},
 attack:{target:'string',seq:'number'},cast:{slot:'number',target:'string',seq:'number'},
 action:{kind:'string',arg:'string',seq:'number'},talk:{npc:'string',seq:'number'},
 chat:{text:'string'},
};
/** Validates one intent. ctx (optional): the authority's view {x,z,dt,seq} of this player for move checks. */
function validateIntent(m,ctx){
 if(!m||typeof m!=='object'||Array.isArray(m))return'not an object';
 const spec=INTENTS[m.t];if(!spec)return'unknown intent';
 for(const k of Object.keys(m))if(k!=='t'&&!(k in spec))return'unexpected field '+k;
 for(const[k,type]of Object.entries(spec)){if(typeof m[k]!==type)return k+' must be a '+type;if(type==='number'&&!isFinite(m[k]))return k+' must be finite';}
 if('seq' in spec&&ctx&&typeof ctx.seq==='number'&&m.seq<=ctx.seq)return'stale or replayed';
 if(m.t==='move'&&ctx&&typeof ctx.dt==='number'){const d=Math.hypot(m.x-ctx.x,m.z-ctx.z),max=NET_LIMITS.runSpeed*NET_LIMITS.speedSlack*Math.max(ctx.dt,.05)+NET_LIMITS.dodgeDist*(ctx.dodging?1:0);if(d>max)return'moved too far';}
 if(m.t==='dodge'&&Math.hypot(m.dx,m.dz)>1.01)return'dodge direction too long';
 if(m.t==='cast'&&(m.slot<0||m.slot>=NET_LIMITS.maxSkills||m.slot!==Math.floor(m.slot)))return'no such skill slot';
 if(m.t==='chat'){if(!m.text.trim())return'empty';if(m.text.length>NET_LIMITS.chatMax)return'too long';}
 return null;
}
/** Fields a client must never send: anything that is an outcome rather than a wish. */
const NET_FORBIDDEN=['gold','hp','hpMax','damage','xp','fate','corr','stats','items','inventory','tier','loot','reward','level','killed','sales'];
/** Rejects any message that tries to state an outcome, however deep it is nested. */
function containsForbidden(m,depth){if(!m||typeof m!=='object')return null;if((depth||0)>6)return'too deep';for(const k of Object.keys(m)){if(NET_FORBIDDEN.includes(k))return'clients may not send '+k;const e=containsForbidden(m[k],(depth||0)+1);if(e)return e;}return null;}
/** The whole check a server runs on every client message. */
function acceptClientMessage(m,ctx){return containsForbidden(m)||validateIntent(m,ctx);}
