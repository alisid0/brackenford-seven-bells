// Props built in code from the approved concept pictures (assets/concepts). The build carries this file; the game uses
// the stall only in the new range layout (?world=2). tests/props.html shows them and saves pictures to assets/renders.
// Every builder takes three.js (T) and returns a Group in metres, standing on y=0 unless noted, with its
// attachment points listed in group.userData.
(function(){
const PALETTE={                       // taken from assets/concepts/style-sheet-v1.jpg
 timber:'#a5632f',timberDark:'#74431f',timberLight:'#c98646',wall:'#6b3a1c',wallLight:'#77421f',counterLight:'#83501f',
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
 const {add,mat,V}=kit(T),g=new T.Group(),P=PALETTE,half=.75,grip=.17,shoulder=.045,SQ=.62;
 const squash=m=>{m.scale.set(SQ,1,1);return m;};                // limbs are deeper front-to-back than they are wide
 const y0=grip+shoulder,len=half-y0-.03,rad=y=>.03-(y-y0)/len*.021;   // limb radius at height y
 squash(add(g,new T.CylinderGeometry(.019,.019,grip*2,6),P.thornwood,0,0,0));
 for(const s of[1,-1]){
  const limb=new T.Group();limb.scale.y=s;g.add(limb);            // the lower limb is the upper one mirrored
  squash(add(limb,new T.CylinderGeometry(.03,.019,shoulder,6),P.thornwoodLight,0,grip+shoulder/2,0));
  squash(add(limb,new T.CylinderGeometry(.009,.03,len,6),P.thornwood,0,y0+len/2,0));
  // the tip: a short block with two prongs, leaving a notch between them for the string
  squash(add(limb,new T.CylinderGeometry(.009,.009,.016,6),P.thornwoodDark,0,half-.022,0));
  for(const z of[.0062,-.0062])add(limb,new T.BoxGeometry(.008,.016,.0052),P.thornwoodDark,0,half-.008,z);
  // two blunt thorns on the back of each limb, broad where they join the wood
  for(const y of[.36,.56]){const t=add(limb,new T.CylinderGeometry(.009,.021,.03,5),P.thornwoodLight,0,y+.004,rad(y)+.006);t.rotation.x=1.15;}
  // a flat ember vein lying in each side face of the limb: a ribbon that zig-zags slightly and tapers to nothing
  // at both ends. The six-sided limb has a flat face on each side, at x = +-0.866 * radius * squash.
  const ys=[.255,.33,.405,.48,.555,.63,.695],zig=[0,.3,-.3,.3,-.3,.2,0],wide=[0,.34,.4,.4,.38,.3,0];
  for(const side of[1,-1]){
   const pos=[],idx=[];
   ys.forEach((y,i)=>{const r=rad(y),x=side*(r*.866*SQ+.0004),z=zig[i]*r,w=wide[i]*r/2;pos.push(x,y,z-w, x,y,z+w);});
   for(let i=0;i<ys.length-1;i++){const a=i*2;idx.push(a,a+1,a+2, a+1,a+3,a+2);}
   const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setIndex(idx);geo.computeVertexNormals();
   limb.add(new T.Mesh(geo,mat(P.ember,true)));
  }
 }
 g.userData={name:'A4 Thornwood bow',length:half*2,points:{grip:V(0,0,0),rest:V(0,.045,0),nockTop:V(0,half-.012,0),nockBottom:V(0,-half+.012,0)},forward:'+z',note:'held at grip; string runs between the two nocks'};
 return g;
}

// H6 Market stall: 3.3 m wide across the awning, 2.6 m tall, 2.1 m deep. Stands on y=0, open front facing +z.
function marketStall(T){
 const {add,box,beam,V}=kit(T),g=new T.Group(),P=PALETTE;
 const X=1.4,ZF=.8,ZB=-.8,post=.16,HF=1.95,HB=2.55;
 const rafter=z=>HB-.02+(HF-HB)*(z-ZB)/(ZF-ZB);                              // height of the rafter above depth z
 for(const x of[X,-X]){
  box(g,post,HF,post,P.timber,x,HF/2,ZF);box(g,post,HB,post,P.timber,x,HB/2,ZB);
  beam(g,V(x,1.02,ZF),V(x,1.02,ZB),.1,P.timberDark);                          // side rail at counter height
  beam(g,V(x,rafter(ZF),ZF),V(x,rafter(ZB),ZB),.11,P.timber);                 // rafter under the awning
  beam(g,V(x,1.4,ZF),V(x-Math.sign(x)*.55,HF-.06,ZF),.08,P.timberLight);      // corner brace across the front, up to the front beam
  beam(g,V(x,1.75,ZB),V(x,rafter(ZB+.62)-.03,ZB+.62),.08,P.timberLight);      // brace from the back post up to the rafter
 }
 beam(g,V(-X,HF-.06,ZF),V(X,HF-.06,ZF),.11,P.timber);beam(g,V(-X,HB-.06,ZB),V(X,HB-.06,ZB),.11,P.timber);
 for(let i=0;i<7;i++)box(g,.39,HB-.12,.05,i%2?P.wall:P.wallLight,-1.2+i*.4,(HB-.12)/2,ZB-.03);     // plank back wall
 box(g,3.1,.09,.62,P.timberLight,0,.985,ZF-.05);                              // counter top
 for(let i=0;i<6;i++)box(g,.46,.93,.05,i%2?P.timberDark:P.counterLight,-1.175+i*.47,.47,ZF-.02);  // plank counter front
 // awning: five stripes sloping down to the front. At the front edge the cloth turns and hangs straight down for a
 // short way, then ends in one point per stripe.
 const y0=HB+.07,z0=ZB-.15,y1=HF-.02,z1=ZF+.35,len=Math.hypot(y1-y0,z1-z0),tilt=Math.atan2(y0-y1,z1-z0),w=3.3/5,drop=.16,point=.22;
 for(let i=0;i<5;i++){
  const c=i%2?P.cream:P.red,dark=i%2?P.creamDark:P.redDark,x=-1.65+w*(i+.5),s=box(g,w,.045,len,c,x,(y0+y1)/2,(z0+z1)/2);s.rotation.x=tilt;
  box(g,w,drop,.03,dark,x,y1-drop/2+.01,z1);
  const sh=new T.Shape();sh.moveTo(-w/2,0);sh.lineTo(w/2,0);sh.lineTo(0,-point);sh.closePath();
  add(g,new T.ShapeGeometry(sh),dark,x,y1-drop+.01,z1+.015,true);
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
