// Props built in code from the approved concept pictures (assets/concepts). Not yet part of the game build:
// src/build.mjs does not read this file. tests/props.html shows them and saves pictures to assets/renders.
// Every builder takes three.js (T) and returns a Group in metres, standing on y=0 unless noted, with its
// attachment points listed in group.userData.
(function(){
const PALETTE={                       // taken from assets/concepts/style-sheet-v1.jpg
 timber:'#a5632f',timberDark:'#74431f',timberLight:'#c98646',wall:'#6b3a1c',
 red:'#c5343a',redDark:'#a12a30',cream:'#f6e6bd',creamDark:'#e9d3a0',
 crate:'#e6a23c',crateDark:'#c98428',
 thornwood:'#5b2c3a',thornwoodDark:'#47212d',thornwoodLight:'#6d3646',ember:'#c8372d'
};
function kit(T){
 const mats=new Map();
 const mat=(c,two)=>{const k=c+(two?'2':'');if(!mats.has(k))mats.set(k,new T.MeshStandardMaterial({color:c,flatShading:true,roughness:.95,side:two?T.DoubleSide:T.FrontSide}));return mats.get(k);};
 const add=(g,geo,c,x,y,z,two)=>{const m=new T.Mesh(geo,mat(c,two));m.position.set(x,y,z);g.add(m);return m;};
 const box=(g,w,h,d,c,x,y,z)=>add(g,new T.BoxGeometry(w,h,d),c,x,y,z);
 // a beam of square section from one point to another
 const beam=(g,a,b,s,c)=>{const d=new T.Vector3().subVectors(b,a),m=add(g,new T.BoxGeometry(s,d.length(),s),c,(a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.clone().normalize());return m;};
 const V=(x,y,z)=>new T.Vector3(x,y,z);
 return{mat,add,box,beam,V};
}

// A4 Thornwood bow: the wooden body only, 1.5 m, straight and the same top and bottom so it can be mirrored for
// either hand. Lies along y with its middle at the origin; the belly (the side facing the archer) is -z and the
// thorns are on the back, +z. The string, leather grip and arrow rest are added by the game at the points in userData.
function thornwoodBow(T){
 const {add,V}=kit(T),g=new T.Group(),P=PALETTE,half=.75,grip=.17,shoulder=.045;
 const squash=m=>{m.scale.set(.62,1,1);return m;};               // limbs are deeper front-to-back than they are wide
 squash(add(g,new T.CylinderGeometry(.019,.019,grip*2,6),P.thornwood,0,0,0));
 for(const s of[1,-1]){
  const limb=new T.Group();limb.scale.y=s;g.add(limb);            // the lower limb is the upper one mirrored
  squash(add(limb,new T.CylinderGeometry(.03,.019,shoulder,6),P.thornwoodLight,0,grip+shoulder/2,0));
  const len=half-grip-shoulder-.03;
  squash(add(limb,new T.CylinderGeometry(.009,.03,len,6),P.thornwood,0,grip+shoulder+len/2,0));
  squash(add(limb,new T.CylinderGeometry(.007,.009,.03,6),P.thornwoodDark,0,half-.015,0));   // the tip, where the string sits
  for(const y of[.36,.56]){                                       // two blunt thorns on the back of each limb
   const r=.03-(y-grip-shoulder)/len*.021,t=add(limb,new T.CylinderGeometry(.007,.015,.03,5),P.thornwoodLight,0,y+.006,r+.008);t.rotation.x=1.1;}
  for(const side of[1,-1]){                                       // a flat ember vein down each side, in three bends
   const pts=[[.26,.004],[.38,-.006],[.5,.005],[.63,-.002]];
   for(let i=0;i<pts.length-1;i++){const[a,za]=pts[i],[b,zb]=pts[i+1],d=V(0,b-a,zb-za),ya=(a+b)/2,r=(.03-(ya-grip-shoulder)/len*.021)*.62;
    const v=add(limb,new T.BoxGeometry(.003,d.length()+.004,.0095),P.ember,side*(r-.0005),ya,(za+zb)/2);v.rotation.x=Math.atan2(zb-za,b-a);}
  }
 }
 g.userData={name:'A4 Thornwood bow',length:half*2,points:{grip:V(0,0,0),rest:V(0,.045,0),nockTop:V(0,half-.012,0),nockBottom:V(0,-half+.012,0)},forward:'+z',note:'held at grip; string runs between the two nocks'};
 return g;
}

// H6 Market stall: 3.3 m wide across the awning, 2.6 m tall, 2.1 m deep. Stands on y=0, open front facing +z.
function marketStall(T){
 const {add,box,beam,V}=kit(T),g=new T.Group(),P=PALETTE;
 const X=1.4,ZF=.8,ZB=-.8,post=.16,HF=1.95,HB=2.55;
 for(const x of[X,-X]){
  box(g,post,HF,post,P.timber,x,HF/2,ZF);box(g,post,HB,post,P.timber,x,HB/2,ZB);
  beam(g,V(x,1.02,ZF),V(x,1.02,ZB),.1,P.timberDark);                          // side rail at counter height
  beam(g,V(x,HF-.02,ZF),V(x,HB-.02,ZB),.11,P.timber);                         // rafter under the awning
  beam(g,V(x,1.4,ZF),V(x-Math.sign(x)*.55,HF-.03,ZF),.08,P.timberLight);      // corner brace across the front
  beam(g,V(x,1.75,ZB),V(x,2.1,ZB+.55),.08,P.timberLight);                     // brace from back post to rafter
 }
 beam(g,V(-X,HF-.06,ZF),V(X,HF-.06,ZF),.11,P.timber);beam(g,V(-X,HB-.06,ZB),V(X,HB-.06,ZB),.11,P.timber);
 for(let i=0;i<7;i++)box(g,.39,HB-.12,.05,i%2?P.wall:'#77421f',-1.2+i*.4,(HB-.12)/2,ZB-.03);   // plank back wall
 box(g,3.1,.09,.62,P.timberLight,0,.985,ZF-.05);                              // counter top
 for(let i=0;i<6;i++)box(g,.46,.93,.05,i%2?P.timberDark:'#83501f',-1.175+i*.47,.47,ZF-.02);     // plank counter front
 // awning: five stripes sloping down to the front, each with a point hanging from its front edge
 const y0=HB+.07,z0=ZB-.15,y1=HF-.02,z1=ZF+.35,len=Math.hypot(y1-y0,z1-z0),tilt=Math.atan2(y0-y1,z1-z0),w=3.3/5;
 for(let i=0;i<5;i++){
  const c=i%2?P.cream:P.red,x=-1.65+w*(i+.5),s=box(g,w,.045,len,c,x,(y0+y1)/2,(z0+z1)/2);s.rotation.x=tilt;
  const sh=new T.Shape();sh.moveTo(-w/2,0);sh.lineTo(w/2,0);sh.lineTo(0,-.24);sh.closePath();
  add(g,new T.ShapeGeometry(sh),i%2?P.creamDark:P.redDark,x,y1-.01,z1,true);
 }
 const crate=(s,x,y,z,turn)=>{const c=new T.Group();c.position.set(x,y,z);c.rotation.y=turn;g.add(c);
  box(c,s,s*.84,s,P.crate,0,s*.42,0);box(c,s*1.06,s*.16,s*1.06,P.crate,0,s*.92,0);
  for(const r of[.62,-.62]){const b=box(c,s*.11,s*.86,.02,P.crateDark,0,s*.42,s/2+.006);b.rotation.z=r;const d=box(c,.02,s*.86,s*.11,P.crateDark,s/2+.006,s*.42,0);d.rotation.x=r;}};
 crate(.46,.78,1.03,ZF-.08,.06);crate(.56,1.85,0,ZF+.18,-.12);
 g.userData={name:'H6 Market stall',width:3.3,height:y0,points:{counter:V(0,1.03,ZF-.05),keeper:V(0,0,0)},forward:'+z',note:'stands on the ground; the counter top is where goods and the bow rack sit'};
 return g;
}
window.PROPS={PALETTE,thornwoodBow,marketStall};
})();
