// ---- Lantern Rise: Claude's arcade mode for the Claude vs Gemini contest (design/duel-brief.md, design/duel-claude.md).
// Paper lanterns rise from the valley below the range into the evening sky. Loose one before it drifts out of reach;
// nothing is lost if it does. Some rise as a string of three to five, tied by a thread: kindle the whole string for a
// bonus. A gold lantern hushes the sky: every lantern hangs still for a few seconds. The run builds from a few slow
// lanterns to a festival in the last half minute, then the last few seconds are quiet.
(()=>{
const LR={
 phases:[   // until (s into the run), most lanterns in view, seconds between releases, chance of a string, string length, rise speed (m/s)
  {until:15, max:3,every:[1.8,2.4],string:0,  len:[3,3],rise:[.75,.95]},
  {until:60, max:6,every:[1.5,2.1],string:.35,len:[3,3],rise:[.85,1.1]},
  {until:150,max:8,every:[1.1,1.7],string:.45,len:[3,5],rise:[.95,1.25]},
  {until:175,max:9,every:[.55,.85],string:0,  len:[3,3],rise:[1.3,1.6],small:true},
  {until:1e9,max:0,every:[99,99],string:0,len:[3,3],rise:[1,1]}],
 along:[13,34],right:[-7,7],top:17,       // where lanterns rise (m out, m to the side) and how high above the ground they go before fading
 points:40,perM:1,perUp:4,                // a lantern: 40 + 1 a metre away + 4 a metre above head height
 stringBonus:120,                         // a whole string: 120 for each lantern in it
 glow:[[6,1.25],[12,1.5],[24,2]],         // hits in a run: x1.25 at 6, x1.5 at 12, x2 at 24 (a miss never takes it away)
 goldFrom:35,goldEvery:[22,28],hush:5,    // gold lanterns from 35 s, one every 22 to 28 s; the hush lasts 5 s
 quiet:5,                                 // nothing new in the last 5 s
};
const COLORS=['#F2B35B','#E9875A','#F4D27A','#D9745E'],GOLD='#FFD86B',THREAD='#F6E6BD';
const SCALE=[0,2,4,7,9,12,14,16];         // a string plays up a pentatonic scale as it is kindled
const pool=[],threads=[],S={};
let built=false;
function build(){
 if(built)return;built=true;
 for(let i=0;i<9;i++){
  const g=new T.Group();g.visible=false;scene.add(g);
  const paper=new T.MeshBasicMaterial({color:COLORS[0],transparent:true,opacity:.95});
  const body=new T.Mesh(new T.CylinderGeometry(.26,.3,.52,10,1,true),paper);g.add(body);
  const cap=new T.Mesh(new T.CylinderGeometry(.14,.26,.08,10),new T.MeshBasicMaterial({color:'#3b2a22'}));cap.position.y=.3;g.add(cap);
  const glow=new T.Mesh(new T.SphereGeometry(.16,8,6),new T.MeshBasicMaterial({color:'#FFF1C4'}));glow.position.y=-.08;g.add(glow);
  const hit=new T.Mesh(new T.SphereGeometry(.46,8,6),new T.MeshBasicMaterial({visible:false}));g.add(hit);
  pool.push({g,body,paper,glow,hit,on:false});
 }
 for(let i=0;i<8;i++){
  const geo=new T.BufferGeometry().setFromPoints([V(),V()]);const l=new T.Line(geo,new T.LineBasicMaterial({color:THREAD,transparent:true,opacity:.55}));
  l.visible=false;l.frustumCulled=false;scene.add(l);threads.push({l,a:null,b:null});
 }
}
const phase=()=>{const t=elapsed-range.t0;return LR.phases.find(p=>t<p.until);};
const glowOf=k=>{let m=1;for(const[at,x]of LR.glow)if(k>=at)m=x;return m;};
const inView=()=>pool.filter(p=>p.on).length;
function reset(){
 Object.assign(S,{due:0,goldDue:0,hushUntil:0,strings:0,stringsWon:0,kindled:0,highest:0,golds:0,nextString:1,str:{},next:''});
 for(const p of pool){p.on=false;p.g.visible=false;arcadeDrop(p.hit);}
 for(const t of threads){t.l.visible=false;t.a=t.b=null;}
}
function release(along,right,o){
 const p=pool.find(x=>!x.on);if(!p)return null;
 const[x,z]=yardAt(along,right),g0=groundAt(x,z);
 Object.assign(p,{on:true,x,z,g0,y:.4,t:0,rise:watchRand(...o.rise),sway:Math.random()*6.28,gold:!!o.gold,str:o.str||0,fade:0,small:!!o.small,kind:o.gold?'gold':o.str?'string':'single'});
 p.paper.color.set(o.gold?GOLD:o.color||COLORS[Math.floor(Math.random()*COLORS.length)]);p.paper.opacity=.95;
 p.g.scale.setScalar(.01);p.g.visible=true;p.g.position.set(x,g0+p.y,z);
 arcadeTarget(p.hit,{lantern:p});return p;
}
function releaseString(P){
 const n=Math.round(watchRand(P.len[0],P.len[1]+.49)),id=S.nextString++,a=watchRand(LR.along[0]+2,LR.along[1]-4),r0=watchRand(LR.right[0]+1,LR.right[1]-1-(n-1)*1.6);
 const color=COLORS[Math.floor(Math.random()*COLORS.length)],rise=watchRand(...P.rise),members=[];
 for(let k=0;k<n;k++){const p=release(a+k*.8,r0+k*1.6,{str:id,color,rise:[rise,rise]});if(p){p.y=.4-k*.35;members.push(p);}}   // a slight stagger, so the string climbs like a ribbon
 S.str[id]={members,left:members.length,broken:false};S.strings++;
 for(let k=0;k+1<members.length;k++){const t=threads.find(x=>!x.a);if(t){t.a=members[k];t.b=members[k+1];t.l.visible=true;}}
}
function gone(p,kindled){
 p.on=false;arcadeDrop(p.hit);if(!kindled){p.fade=1;}else p.g.visible=false;
 for(const t of threads)if(t.a===p||t.b===p){t.l.visible=false;t.a=t.b=null;}
 if(p.str&&S.str[p.str]){const s=S.str[p.str];if(!kindled)s.broken=true;else s.left--;}
}
arcadeMode('claude',{
 name:'Lantern Rise',seconds:180,
 start(){build();reset();say('Lantern Rise  ·  kindle the lanterns before they drift away',4);},
 step(dt,left){
  const P=phase(),hushed=elapsed<S.hushUntil;
  for(const p of pool){
   if(!p.on&&p.fade>0){p.fade-=dt*1.5;p.paper.opacity=.95*Math.max(0,p.fade);p.g.position.y+=dt*.6;if(p.fade<=0)p.g.visible=false;continue;}
   if(!p.on)continue;
   p.t+=dt;p.sway+=dt*1.3;
   if(!hushed)p.y+=p.rise*dt*(p.small?1:1);
   const drift=Math.sin(p.sway)*.35*dt;p.x+=YARD.rx*drift;p.z+=YARD.rz*drift;
   p.g.position.set(p.x,p.g0+p.y+(hushed?Math.sin(elapsed*2+p.sway)*.04:0),p.z);
   p.g.rotation.y+=dt*.4;p.g.scale.setScalar(Math.min(1,p.t/.6)*(p.small?1.05:1.4));   // 1.4 times life size, so a lantern reads at 30 m
   p.glow.scale.setScalar(1+.12*Math.sin(elapsed*7+p.sway)+(hushed?.4:0));
   if(p.y>=LR.top)gone(p,false);   // it drifts out of reach: nothing is lost
  }
  for(const t of threads)if(t.a){const pos=t.l.geometry.attributes.position;pos.setXYZ(0,t.a.g.position.x,t.a.g.position.y+.3,t.a.g.position.z);pos.setXYZ(1,t.b.g.position.x,t.b.g.position.y+.3,t.b.g.position.z);pos.needsUpdate=true;}
  if(left<LR.quiet)return;
  const t=elapsed-range.t0;
  if(t>=LR.goldFrom){if(!S.goldDue)S.goldDue=elapsed+watchRand(...LR.goldEvery)-15;if(elapsed>=S.goldDue&&inView()<P.max){S.goldDue=elapsed+watchRand(...LR.goldEvery);const p=release(watchRand(18,30),watchRand(-5,5),{gold:true,rise:[.7,.8]});if(p){S.golds++;note(880,.4,'sine',.05);note(1320,.5,'sine',.03,.12);}}}
  if(!S.due)S.due=elapsed+.8;
  if(elapsed<S.due||hushed)return;
  const room=P.max-inView();
  if(!S.next)S.next=P.string&&Math.random()<P.string?'string':'single';   // what comes next is chosen first, so a string waits for room instead of losing it to singles
  if(S.next==='string'&&!P.string)S.next='single';
  if(S.next==='string'){if(room<P.len[0])return;releaseString({...P,len:[P.len[0],Math.min(P.len[1],room)]});}
  else{if(room<=0)return;release(watchRand(...LR.along),watchRand(...LR.right),{rise:P.rise,small:P.small});}
  S.next='';S.due=elapsed+watchRand(...P.every);
 },
 hit(target,q,info){
  const p=target.lantern;if(!p||!p.on)return null;
  const up=Math.max(0,p.y-1.5),mult=glowOf(range.streak+1);let pts=LR.points+LR.perM*info.dist+LR.perUp*up,tag='';
  S.kindled++;S.highest=Math.max(S.highest,Math.round(p.y));
  burst(info.at,p.gold?GOLD:'#FFE6A8',p.small?8:14,1,1.4);
  if(p.gold){S.hushUntil=elapsed+LR.hush;tag='Hush';pts+=100;[523,659,784,1047].forEach((f,k)=>note(f,.6,'sine',.06,k*.08));say('Hush  ·  the lanterns hang still',LR.hush);}
  let won=0;
  if(p.str&&S.str[p.str]){const s=S.str[p.str],idx=s.members.length-s.left;note(523*2**(SCALE[Math.min(idx,7)]/12),.4,'sine',.07);
   if(s.left===1&&!s.broken){won=LR.stringBonus*s.members.length;S.stringsWon++;tag='String of '+s.members.length;[0,4,7,12].forEach((k,i)=>note(659*2**(k/12),.5,'sine',.05,.1+i*.07));}}
  gone(p,true);
  pts=(pts+won)*mult;
  popup('+'+Math.round(pts)+(tag?'  ·  '+tag:''),info.at.clone().add(V(0,.6,0)),p.gold||won?'#F0C75A':'#fff1c4');
  return pts;
 },
 bell(q){pealRing(true);return true;},   // the bell only rings softly here; it is not part of this mode
 info({phase,clock,best}){
  const m=glowOf(range.streak);
  if(phase==='results')return{title:'Lantern Rise',stitch:range.newBest,text:'Score '+range.score+'      '+(range.newBest?'New best':'Best '+best)+'\nLanterns '+S.kindled+'  ·  Strings '+S.stringsWon+' of '+S.strings+'  ·  Gold '+S.golds+'\nHighest '+S.highest+' m',mark:'Shoot AGAIN for another run'};
  return{title:'Lantern Rise  ·  '+(phase==='closing'?'0:00':clock),text:'Score '+range.score+'      Lanterns '+S.kindled+(m>1?'      Glow ×'+m:''),mark:(elapsed<S.hushUntil?'Hush      ':'')+'Best '+best};
 },
 end(){for(const p of pool){p.on=false;p.fade=0;p.g.visible=false;arcadeDrop(p.hit);}for(const t of threads){t.l.visible=false;t.a=t.b=null;}},
});
})();
