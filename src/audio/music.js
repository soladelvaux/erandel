/* ---------- music (procedural ambient) ---------- */
const TRACKS=[
 {n:'Calm',sub:'Thorngate at dusk',scale:[0,2,4,7,9],root:57,bpm:64,wave:'triangle'},
 {n:'Lantern Night',sub:'The market by the water',scale:[0,3,5,7,10],root:55,bpm:56,wave:'sine'},
 {n:'White Boughs',sub:'Morning in Erelian',scale:[0,2,4,7,9,11],root:62,bpm:74,wave:'sine'},
];
const MUS={ctx:null,master:null,wet:null,playing:false,track:0,timer:null,next:0,step:0,deg:4,rng:mulberry(3)};
function mNote(n){return 440*Math.pow(2,(n-69)/12);}
function mInit(){
 const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;
 const ctx=new AC();MUS.ctx=ctx;MUS.master=ctx.createGain();MUS.master.gain.value=PREFS.vol*.5;MUS.master.connect(ctx.destination);
 const len=ctx.sampleRate*3,buf=ctx.createBuffer(2,len,ctx.sampleRate);for(let ch=0;ch<2;ch++){const d=buf.getChannelData(ch);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.6);}
 const cv=ctx.createConvolver();cv.buffer=buf;MUS.wet=ctx.createGain();MUS.wet.gain.value=.55;MUS.wet.connect(cv);cv.connect(MUS.master);return true;
}
function mVoice(t,f,dur,vol,wave,cut){const c=MUS.ctx,o=c.createOscillator(),g=c.createGain(),lp=c.createBiquadFilter();o.type=wave;o.frequency.value=f;lp.type='lowpass';lp.frequency.value=cut;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.015);g.gain.exponentialRampToValueAtTime(.0008,t+dur);o.connect(lp);lp.connect(g);g.connect(MUS.master);g.connect(MUS.wet);o.start(t);o.stop(t+dur+.05);}
function mPad(t,notes,dur){const c=MUS.ctx;notes.forEach(n=>{[-5,5].forEach(dt=>{const o=c.createOscillator(),g=c.createGain(),lp=c.createBiquadFilter();o.type='sawtooth';o.frequency.value=mNote(n);o.detune.value=dt;lp.type='lowpass';lp.frequency.value=700;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.018,t+dur*.4);g.gain.linearRampToValueAtTime(0,t+dur);o.connect(lp);lp.connect(g);g.connect(MUS.master);g.connect(MUS.wet);o.start(t);o.stop(t+dur+.1);});});}
function mSched(){
 const c=MUS.ctx,T=TRACKS[MUS.track],step=60/T.bpm/2;const sc=T.scale;const deg=i=>T.root+sc[((i%sc.length)+sc.length)%sc.length]+12*Math.floor(i/sc.length);
 while(MUS.next<c.currentTime+.5){
  const t=MUS.next,s=MUS.step;
  if(s%32===0){const base=[0,3,4,2][(s/32)%4];mPad(t,[deg(base)-12,deg(base+2)-12,deg(base+4)-12],step*32);mVoice(t,mNote(deg(base)-24),step*14,.12,'sine',400);}
  if(MUS.rng()<.62){MUS.deg=clamp(MUS.deg+Math.round((MUS.rng()-.5)*4),0,sc.length*2);mVoice(t,mNote(deg(MUS.deg)),step*(3+MUS.rng()*5),.09,T.wave,2400);}
  if(s%8===4&&MUS.rng()<.5)mVoice(t,mNote(deg(MUS.deg+2)+12),step*6,.035,'sine',3000);
  MUS.next+=step;MUS.step++;
 }
}
function mPlay(){if(!MUS.ctx&&!mInit()){toast('Music is not available in this browser.');return;}MUS.ctx.resume();if(MUS.playing)return;MUS.playing=true;MUS.next=MUS.ctx.currentTime+.1;MUS.timer=setInterval(mSched,120);}
function mPause(){MUS.playing=false;clearInterval(MUS.timer);if(MUS.ctx)MUS.ctx.suspend();}
function mSkip(d){MUS.track=(MUS.track+d+TRACKS.length)%TRACKS.length;MUS.step=0;MUS.deg=4;if(MUS.playing&&MUS.ctx)MUS.next=MUS.ctx.currentTime+.1;}

