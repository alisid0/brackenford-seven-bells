// Timed movement for the staging creatures. Not part of the game build: src/build.mjs does not read this file.
// tests/creatures.html plays it and tools/check-moves.mjs measures it.
//
// A move is a function of phase only: pose(t) for t from 0 to 1 gives every bone's turn at that point of the cycle,
// so it plays the same at any frame rate. The body follows a keyed path, and each leg is solved so that its paw
// sits on a fixed spot of ground for as long as it is down, then swings to the next spot.
(function(root){
const rot=(v,a)=>[v[0]*Math.cos(a)-v[1]*Math.sin(a),v[0]*Math.sin(a)+v[1]*Math.cos(a)];
const add=(a,b)=>[a[0]+b[0],a[1]+b[1]],sub=(a,b)=>[a[0]-b[0],a[1]-b[1]],ang=v=>Math.atan2(v[1],v[0]);
// a smooth closed curve through keys [[t,value],...] with t from 0 to 1
function loop(keys){
 const n=keys.length,K=i=>{const k=keys[((i%n)+n)%n];return[k[0]+Math.floor(i/n),k[1]];};
 return t=>{t-=Math.floor(t);let i=0;while(i<n&&keys[i][0]<=t)i++;i--;
  const p0=K(i-1),p1=K(i),p2=K(i+1),p3=K(i+2),s=(t-p1[0])/(p2[0]-p1[0]),m1=(p2[1]-p0[1])/(p2[0]-p0[0])*(p2[0]-p1[0]),m2=(p3[1]-p1[1])/(p3[0]-p1[0])*(p2[0]-p1[0]);
  return(2*s*s*s-3*s*s+1)*p1[1]+(s*s*s-2*s*s+s)*m1+(-2*s*s*s+3*s*s)*p2[1]+(s*s*s-s*s)*m2;};
}
// Two bones reaching from joint J to target T in the side plane. a and b are the bones as they lie at rest; bend is
// +1 for a knee that points forward and -1 for an elbow that points back. Returns each bone's turn from rest and
// how far short of the target the leg fell (0 when it reaches).
function reach(J,T,a,b,bend){
 const la=Math.hypot(...a),lb=Math.hypot(...b),v=sub(T,J),want=Math.hypot(...v),d=Math.min(Math.max(want,Math.abs(la-lb)+1e-4),la+lb-1e-4);
 const A=Math.acos((la*la+d*d-lb*lb)/(2*la*d)),da=ang(v)+bend*A,mid=add(J,[la*Math.cos(da),la*Math.sin(da)]),end=add(J,[v[0]*d/want,v[1]*d/want]);
 return{a:da-ang(a),b:ang(sub(end,mid))-ang(b),short:Math.max(0,want-d)};
}

// The shade hare's bound. bones is the list from its staging file. The hare faces -z there, so "forward" below is
// -z and a turn about x by a positive angle swings a hanging leg forward.
// One cycle: hind paws down and pushing (0 to 0.30), flight, forepaws down (0.55 to 0.80), hind legs gather.
function hareBound(bones,opt={}){
 const stride=opt.stride||.9,period=opt.period||.46,hind=[0,.30],fore=[.55,.80];
 const J=n=>{const b=bones.find(b=>b.name===n);if(!b)throw new Error("no bone "+n);return[-b.head[2],b.head[1]];};
 const hips=J("Spine_0"),mid=J("Spine_1");
 const legs=[
  {front:true ,names:["0_Right_Limb_0","0_Right_Limb_1","0_Right_Limb_2"]},
  {front:true ,names:["0_Left_Limb_0","0_Left_Limb_1","0_Left_Limb_2"]},
  {front:false,names:["1_Right_Limb_0","1_Right_Limb_1","1_Right_Limb_3"],still:"1_Right_Limb_2"},
  {front:false,names:["bone_18","bone_19","bone_21"],still:"bone_20"}
 ].map(l=>{const top=J(l.names[0]),knee=J(l.names[1]),foot=J(l.names[2]);return{...l,top,foot,a:sub(knee,top),b:sub(foot,knee)};});
 // the body's path: how far the hips rise, how far the whole body tips nose-up, and how far the front half bends up
 const lift=loop([[0,-.07],[.15,-.055],[.30,-.02],[.43,.11],[.55,0],[.67,.03],[.80,0],[.90,-.04]]);
 const tip =loop([[0,-.05],[.15,.13],[.30,.24],[.42,.08],[.55,-.15],[.67,-.27],[.80,-.2],[.90,-.12]]);
 const bend=loop([[0,-.2],[.30,.1],[.42,.1],[.55,0],[.67,-.1],[.90,-.25]]);
 const body=t=>{const l=lift(t),p=tip(t),f=p+bend(t),h=[hips[0],hips[1]+l];
  return{l,p,f,h,top:leg=>leg.front?add(add(h,rot(sub(mid,hips),p)),rot(sub(leg.top,mid),f)):add(h,rot(sub(leg.top,hips),p))};};
 // each leg's planted spot is set so the paw passes under its joint at the middle of its time on the ground
 for(const leg of legs){const on=leg.front?fore:hind,tm=(on[0]+on[1])/2;leg.on=on;leg.tm=tm;leg.spot=body(tm).top(leg)[0]+(leg.front?.03:.02);}
 function pose(t){
  t-=Math.floor(t);const B=body(t),o={_lift:B.l,_travel:stride*t,_marks:[],_short:0,_down:[]};
  o.Spine_0=[B.p];o.Spine_1=[B.f-B.p];o.Head_1=[-B.f*.8];o["1_Left_Limb_0"]=[-B.p*.6];
  const air=Math.sin(Math.PI*Math.min(1,Math.max(0,(t-.25)/.35)));o.Head_2=o.Ear2_0=[.15+.3*air];o.Head_3=o.Ear2_1=[.15*air];
  for(const leg of legs){
   const[t0,t1]=leg.on,down=t>=t0&&t<=t1,at=x=>leg.spot-stride*(x-leg.tm),top=B.top(leg);let T,toe=0;
   if(down)T=[at(t),leg.foot[1]];
   else{
    // in the air the paw travels from the spot it left to the next one, and on the way is drawn in to a tucked
    // point close under its own joint: quickly after leaving the ground, held, then let go to reach for the next spot
    const s=((t-t1+1)%1)/(1-(t1-t0)),e=s*s*(3-2*s),up=Math.sin(Math.PI*s),ss=(a,b,x)=>{x=Math.min(1,Math.max(0,(x-a)/(b-a)));return x*x*(3-2*x);},w=ss(0,.2,s)*(1-ss(.7,1,s))*.92;
    const path=[at(t1)+(at(t0)-at(t1))*e,leg.foot[1]+.06*up],tuck=add(top,leg.front?[.07,-.2]:[.06,-.21]);
    T=[path[0]+(tuck[0]-path[0])*w,path[1]+(tuck[1]-path[1])*w];toe=-.7*up;
   }
   const r=reach(top,T,leg.a,leg.b,leg.front?-1:1),parent=leg.front?B.f:B.p;
   o[leg.names[0]]=[r.a-parent];o[leg.names[1]]=[r.b-r.a];if(leg.still)o[leg.still]=[0];o[leg.names[2]]=[toe-r.b];
   o._down.push(down);if(down){o._marks.push(T[0]);o._short=Math.max(o._short,r.short);}
  }
  return o;
 }
 return{pose,stride,period,phases:{hind,fore},paws:legs.map(l=>l.names[2])};
}
root.MOVES={hareBound};
})(typeof window!=="undefined"?window:globalThis);
