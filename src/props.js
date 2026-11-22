// Props built in code from the approved concept pictures (assets/concepts). The build carries this file; the game uses
// the stall, belfry and Willowbank builders. tests/props.html shows them and saves pictures to assets/renders.
// Every builder takes three.js (T) and returns a Group in metres, standing on y=0 unless noted, facing +z, with its
// attachment points listed in group.userData.
(function(){
const PALETTE={                       // taken from assets/concepts/style-sheet-v1.jpg and Willowbank art pass
 timber:'#a5632f',timberDark:'#74431f',timberLight:'#c98646',wall:'#6b3a1c',wallLight:'#77421f',counterLight:'#83501f',
 red:'#c5343a',redDark:'#a12a30',cream:'#f6e6bd',creamDark:'#e9d3a0',
 crate:'#e6a23c',crateDark:'#c98428',
 thornwood:'#5b2c3a',thornwoodDark:'#47212d',thornwoodLight:'#6d3646',ember:'#c8372d',
 plaster:'#f1e2bd',thatch:'#d4a85a',thatchDark:'#b98a42',door:'#5e4630',
 post:'#7a5a3c',brace:'#8a6038',plank:'#b9763a',bridgePlank:'#b9824a',
 frameTimber:'#825435',frameTimberDark:'#6a4229',
 stone:'#9a968c',stoneDark:'#7f7c73',roofRed:'#ae493d',roofRedDark:'#8a372d',
 blossom:'#F299B5',blossomShade:'#c97894'
};
function kit(T){
 const mats=new Map();
 const mat=(c,two)=>{const k=c+(two?'2':'');if(!mats.has(k))mats.set(k,new T.MeshStandardMaterial({color:c,flatShading:true,roughness:.95,side:two?T.DoubleSide:T.FrontSide}));return mats.get(k);};
 const vmat=two=>new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,flatShading:true,roughness:.95,side:two?T.DoubleSide:T.FrontSide});
 const add=(g,geo,c,x,y,z,two)=>{const m=new T.Mesh(geo,mat(c,two));m.position.set(x,y,z);g.add(m);return m;};
 const box=(g,w,h,d,c,x,y,z)=>add(g,new T.BoxGeometry(w,h,d),c,x,y,z);
 // a beam of square section from one point to another
 const beam=(g,a,b,s,c)=>{const d=new T.Vector3().subVectors(b,a),m=add(g,new T.BoxGeometry(s,d.length(),s),c,(a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.clone().normalize());return m;};
 const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
 // geometry batcher: bakes local transforms so flat-shaded parts merge cleanly into one mesh per colour (or one vertex-coloured mesh)
 const batch=()=>{
  const parts=[],up=V(0,1,0),q=new T.Quaternion(),e=new T.Euler(),m4=new T.Matrix4(),sc=V(1,1,1),ps=V();
  const push=(geo,color,x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1,two=false)=>{
   const g=geo.index?geo.toNonIndexed():geo.clone();
   if(geo.index)geo.dispose();
   e.set(rx,ry,rz);q.setFromEuler(e);ps.set(x,y,z);sc.set(sx,sy,sz);m4.compose(ps,q,sc);g.applyMatrix4(m4);
   parts.push({geo:g,color,two});
  };
  const pushQuat=(geo,color,pos,quat,two=false)=>{
   const g=geo.index?geo.toNonIndexed():geo.clone();
   if(geo.index)geo.dispose();
   sc.set(1,1,1);m4.compose(pos,quat,sc);g.applyMatrix4(m4);
   parts.push({geo:g,color,two});
  };
  const bBox=(w,h,d,c,x=0,y=0,z=0,rx=0,ry=0,rz=0)=>push(new T.BoxGeometry(w,h,d),c,x,y,z,rx,ry,rz);
  const bBeam=(a,b,s,c,h=s)=>{const d=new T.Vector3().subVectors(b,a);q.setFromUnitVectors(up,d.clone().normalize());pushQuat(new T.BoxGeometry(s,d.length(),h),c,a.clone().lerp(b,.5),q);};
  const bRod=(a,b,r,segs,c,rb=r)=>{const d=new T.Vector3().subVectors(b,a);q.setFromUnitVectors(up,d.clone().normalize());pushQuat(new T.CylinderGeometry(r,rb,d.length(),segs),c,a.clone().lerp(b,.5),q);};
  const bCyl=(rt,rb,h,segs,c,x=0,y=0,z=0,rx=0,ry=0,rz=0,open=false,two=false)=>push(new T.CylinderGeometry(rt,rb,h,segs,1,open),c,x,y,z,rx,ry,rz,1,1,1,two);
  const bCone=(r,h,segs,c,x=0,y=0,z=0,rx=0,ry=0,rz=0)=>push(new T.ConeGeometry(r,h,segs),c,x,y,z,rx,ry,rz);
  const bIco=(r,det,c,x=0,y=0,z=0,sx=1,sy=1,sz=1)=>push(new T.IcosahedronGeometry(r,det),c,x,y,z,0,0,0,sx,sy,sz);
  const bTorus=(r,tube,rs,ts,c,x=0,y=0,z=0,rx=0,ry=0,rz=0)=>push(new T.TorusGeometry(r,tube,rs,ts),c,x,y,z,rx,ry,rz);
  const bQuad=(a,b,cPt,d,color,two=true)=>{
   const geo=new T.BufferGeometry();
   geo.setAttribute('position',new T.Float32BufferAttribute([a.x,a.y,a.z, b.x,b.y,b.z, cPt.x,cPt.y,cPt.z,  a.x,a.y,a.z, cPt.x,cPt.y,cPt.z, d.x,d.y,d.z],3));
   parts.push({geo,color,two});
  };
  const bTri=(a,b,cPt,color,two=true)=>{
   const geo=new T.BufferGeometry();
   geo.setAttribute('position',new T.Float32BufferAttribute([a.x,a.y,a.z, b.x,b.y,b.z, cPt.x,cPt.y,cPt.z],3));
   parts.push({geo,color,two});
  };
  const mergeList=(list,withCol)=>{
   let total=0;for(const p of list)total+=p.geo.attributes.position.count;
   const pos=new Float32Array(total*3),col=withCol?new Float32Array(total*3):null,tc=withCol?new T.Color():null;
   let off=0;
   for(const p of list){
    const a=p.geo.attributes.position.array;pos.set(a,off*3);
    if(withCol){tc.set(p.color);for(let i=0;i<p.geo.attributes.position.count;i++){const k=(off+i)*3;col[k]=tc.r;col[k+1]=tc.g;col[k+2]=tc.b;}}
    off+=p.geo.attributes.position.count;p.geo.dispose();
   }
   const out=new T.BufferGeometry();out.setAttribute('position',new T.Float32BufferAttribute(pos,3));   // three makes its own copy: an array made in another frame is refused by the renderer
   if(withCol)out.setAttribute('color',new T.Float32BufferAttribute(col,3));
   out.computeVertexNormals();return out;
  };
  const buildByColor=parent=>{
   const groups=new Map();
   for(const p of parts){const k=p.color+(p.two?'|2':'');if(!groups.has(k))groups.set(k,{color:p.color,two:p.two,list:[]});groups.get(k).list.push(p);}
   for(const gr of groups.values())parent.add(new T.Mesh(mergeList(gr.list,false),mat(gr.color,gr.two)));
   parts.length=0;
  };
  const buildSingle=(parent,two=false)=>{
   const m=new T.Mesh(mergeList(parts,true),vmat(two));parent.add(m);parts.length=0;return m;
  };
  return{push,box:bBox,beam:bBeam,rod:bRod,cyl:bCyl,cone:bCone,ico:bIco,torus:bTorus,quad:bQuad,tri:bTri,buildByColor,buildSingle};
 };
 return{mat,vmat,add,box,beam,V,batch};
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

// H8 The forked belfry of The Silent Peal (design/theme.md; improved per design/willowbank-props-review.md).
// 3.2 m tall, posts 1.4 m apart, forks' tips 2.2 m apart, crossbeam at 2.3 m, bell 0.75 m tall and 0.65 m across
// the lip. Faces +z. Merged to 8 meshes (frame, bell body, bold 0.08 m gold lip, 3 separate thorn bands for
// Bell Watch bind(0..3), silent crow+brambles+tied ribbon, restored sweeping two-bend ribbon).
function belfry(T,opt={}){
 const k=kit(T),{add,V,batch}=k,g=new T.Group();
 const TIMBER='#825435',TIMBER_D='#6a4229',IRON='#3B3538',BRONZE='#AE783E',GOLD='#F0C75A',PLUM='#4A2943',PLUM_L='#6D3362',CREAM='#F6E6BD',HEM='#ae493d',ROPE='#c9a66b',EMBER='#E02E32';
 const matIron=k.mat(IRON,true),matBronze=k.mat(BRONZE,true);
 // 1. static frame: posts, forks, iron straps, crossbeam, fixed hanger clevis, rope coil, triple cream lash (1 mesh)
 const fr=batch();
 for(const s of[-1,1]){
  fr.beam(V(s*.76,0,0),V(s*.68,2.52,0),.2,TIMBER);                                  // post, leaning in a little
  fr.beam(V(s*.68,2.42,0),V(s*1.1,3.2,0),.15,TIMBER);fr.beam(V(s*.68,2.42,0),V(s*.36,3.14,0),.15,TIMBER_D);   // the fork
  fr.box(.27,.15,.27,IRON,s*.69,2.3,0);                                             // iron strap where the beam meets the post
 }
 fr.beam(V(-.86,2.3,0),V(.86,2.3,0),.16,TIMBER_D);
 fr.box(.08,.2,.06,IRON,0,2.16,0);                                                  // iron hanger clevis under the crossbeam
 for(let i=0;i<3;i++)fr.torus(.19-.01*i,.04,5,10,ROPE,-.76,.05+i*.075,0,Math.PI/2,0,0);   // rope coiled at the left post
 for(let i=0;i<3;i++)fr.box(.25,.055,.25,CREAM,.69,1.93+i*.07,0);                   // triple cream rope lash on right post
 fr.buildSingle(g,false);
 // 2-3. swinging bell pivot at y=2.2: 0.75 m body (material swapped in set) + bold 0.08 m continuous gold lip (2 meshes)
 const bell=new T.Group();bell.position.set(0,2.2,0);g.add(bell);
 const prof=[[.04,-.12],[.15,-.13],[.2,-.3],[.235,-.58],[.325,-.83],[.325,-.87]].map(([r,y])=>new T.Vector2(r,y));
 const body=add(bell,new T.LatheGeometry(prof,10),IRON,0,0,0,true);body.material=matIron;
 const lipProf=[[.312,-.872],[.346,-.872],[.34,-.786],[.312,-.786]].map(([r,y])=>new T.Vector2(r,y));
 const lip=add(bell,new T.LatheGeometry(lipProf,10),GOLD,0,0,0,true);
 // 4-6. three separate thorn bands on the bell: two wide-set silent bands (leaving half the iron showing) + 3rd middle band for Bell Watch bind(3)
 const thorns=new T.Group();bell.add(thorns);
 const bands=[];
 for(const[y,r,tilt,turn]of[[-.33,.22,.34,.1],[-.68,.308,-.32,1.4],[-.51,.266,.12,2.4]]){
  const tb=batch();
  tb.torus(r,.032,5,10,PLUM,0,y,0,Math.PI/2+tilt,0,turn);
  for(let i=0;i<5;i++){
   const a=i/5*Math.PI*2+turn;
   tb.cone(.042,.16,4,PLUM_L,Math.cos(a)*(r+.06),y+Math.sin(a)*Math.sin(tilt)*r,Math.sin(a)*(r+.06)*Math.cos(tilt),0,-a,-Math.PI/2);
  }
  bands.push(tb.buildSingle(thorns,false));
 }
 // 7. silent-only extras: foot brambles + perched shade crow + flat lashed ribbon with swallowtail hem (1 DoubleSide mesh)
 const sil=batch();
 for(const[x,z,sk]of[[-1.15,.15,1],[-.45,-.2,.8],[.5,.2,.9],[1.1,-.1,1.05]])for(let i=0;i<3;i++){const a=i*2.1+x;sil.beam(V(x,0,z),V(x+Math.cos(a)*.3*sk,.32*sk,z+Math.sin(a)*.3*sk),.035,PLUM);}
 const cx=-1.1,cy=3.2;
 sil.ico(.13,0,PLUM,cx,cy+.16,0,1.7,.85,.8);
 sil.ico(.075,0,PLUM,cx+.2,cy+.27,0);sil.cone(.03,.11,4,PLUM_L,cx+.3,cy+.26,0,0,0,-Math.PI/2);
 sil.box(.22,.03,.1,PLUM_L,cx-.26,cy+.13,0,0,0,.35);for(const s of[-1,1])sil.box(.012,.1,.012,PLUM,cx+.02,cy+.05,s*.04);
 sil.box(.02,.02,.02,EMBER,cx+.24,cy+.29,.062);sil.box(.02,.02,.02,EMBER,cx+.24,cy+.29,-.062);
 sil.box(.23,.96,.025,CREAM,.71,1.44,.115);
 {const sh=new T.Shape();sh.moveTo(-.115,0);sh.lineTo(.115,0);sh.lineTo(.115,-.18);sh.lineTo(0,-.08);sh.lineTo(-.115,-.18);sh.closePath();sil.push(new T.ShapeGeometry(sh),HEM,.71,.96,.128,0,0,0,1,1,1,true);}
 const silentExtras=sil.buildSingle(g,true);
 // 8. restored-only streaming ribbon: two broad smooth cloth bends with continuous red hem carried along the bottom (1 DoubleSide mesh)
 const lo=batch();
 {
  const segs=8,x0=.78,x1=2.24,ribH=.23,hemH=.065;
  const pt=(t,dy)=>{
   const x=x0+(x1-x0)*t;
   const y=1.96-.24*t+.14*Math.sin(t*Math.PI*2-1.15)+dy;
   const z=.06*Math.sin(t*Math.PI*2);
   return V(x,y,z);
  };
  for(let i=0;i<segs;i++){
   const t0=i/segs,t1=(i+1)/segs,h0=ribH*(1-.14*t0),h1=ribH*(1-.14*t1);
   lo.quad(pt(t0,h0/2),pt(t0,-h0/2+hemH),pt(t1,-h1/2+hemH),pt(t1,h1/2),CREAM,true);
   lo.quad(pt(t0,-h0/2+hemH),pt(t0,-h0/2),pt(t1,-h1/2),pt(t1,-h1/2+hemH),HEM,true);
  }
  const hEnd=ribH*.86;
  lo.tri(pt(1,hEnd/2),pt(1,0),pt(1.07,hEnd*.35),CREAM,true);
  lo.tri(pt(1,0),pt(1,-hEnd/2),pt(1.07,-hEnd*.35),HEM,true);
 }
 const loose=lo.buildSingle(g,true);
 function set(state){
  const on=state==='restored';body.material=on?matBronze:matIron;lip.visible=on;thorns.visible=!on;bands.forEach((b,i)=>b.visible=i<2);silentExtras.visible=!on;loose.visible=on;g.userData.state=on?'restored':'silent';
 }
 // Bell Watch: n thorn bands (0 to 3) on the bell as it is, whatever its state
 function bind(n){thorns.visible=n>0||g.userData.state==='silent';bands.forEach((b,i)=>b.visible=n>0?i<n:i<2);g.userData.bound=n;}
 g.userData={name:'H8 Forked belfry',width:2.2,height:3.2,bell,set,bind,bound:0,points:{strike:V(0,1.72,0),lip:V(0,1.37,0),perch:V(-1.1,3.2,0)},forward:'+z',note:'the bell swings about z at userData.bell; set("silent") or set("restored"); bind(0..3)'};
 set(opt.state==='restored'?'restored':'silent');
 return g;
}

// 1. Village hut (opt.variant 0, 1 or 2): 12-sided cream (#F6E6BD) wall 3 m in radius, sharper two-band thatched roof
// with 0.85 m eaves overhang, deeply recessed (0.12 m) framed timber doorway facing +z.
function hut(T,opt={}){
 const {V,batch}=kit(T),g=new T.Group(),P=PALETTE,b=batch();
 const v=((opt.variant|0)%3+3)%3,wallH=v===1?2.07:v===2?2.2:2.3,peakH=wallH+2.32;
 b.cyl(3.12,3.18,.26,12,P.stone,0,.13,0);                                          // grounded 12-sided stone plinth
 b.cyl(3,3,wallH,12,P.cream,0,wallH/2,0);                                          // 3 m radius round cream wall
 // two broad thatch bands with clear ridge step and dark under-eave soffit (r = 3.85 m -> 0.85 m overhang)
 b.cyl(3.8,3.8,.08,12,P.door,0,wallH-.04,0);                                       // shaded eave underside
 b.cyl(2.26,3.85,1.02,12,P.thatchDark,0,wallH+.43,0);                              // darker broad lower thatch band
 b.cone(2.42,1.38,12,P.thatch,0,wallH+1.63,0);                                     // brighter upper thatch crown
 // doorway recessed 0.12 m inside a proud heavy timber frame (+z)
 const doorH=Math.min(1.82,wallH-.26),lintelD=v===1?.4:.32;
 b.box(1.22,doorH,.2,P.door,0,doorH/2+.06,2.86);                                   // recessed dark timber door leaf
 b.box(1.56,.14,.44,P.stone,0,.07,3.06);                                           // stone threshold step
 for(const s of[-1,1])b.box(.2,doorH+.06,.3,P.post,s*.71,doorH/2+.08,3.01);        // proud jambs (+0.12 m ahead of door)
 b.box(1.86,.22,lintelD,P.post,0,doorH+.16,3.02+(v===1?.04:0));                    // deep timber lintel
 if(v===1){                                                                        // variant 1: squatter hearth hut + off-centre stone chimney stack
  b.box(.56,1.05,.56,P.stone,1.05,wallH+1.72,-.68);
  b.box(.7,.15,.7,P.post,1.05,wallH+2.3,-.68);
 }else if(v===2){                                                                  // variant 2: same roof & recessed doorway + recessed shuttered window
  const a=.88,cx=Math.sin(a)*2.88,cz=Math.cos(a)*2.88;
  b.box(.82,.82,.2,P.door,cx,1.25,cz,0,a,0);
  b.box(1.08,.16,.28,P.post,Math.sin(a)*3.01,1.72,Math.cos(a)*3.01,0,a,0);
  b.box(1.08,.14,.28,P.post,Math.sin(a)*3.01,.78,Math.cos(a)*3.01,0,a,0);
  for(const s of[-1,1]){const ox=Math.cos(a)*s*.46,oz=-Math.sin(a)*s*.46;b.box(.14,.84,.26,P.post,Math.sin(a)*3.0+ox,1.25,Math.cos(a)*3.0+oz,0,a,0);}
 }
 b.buildByColor(g);
 g.userData={name:'Village hut',variant:v,width:7.7,height:peakH,radius:3,points:{door:V(0,0,3.18),roofPeak:V(0,peakH,0),base:V(0,0,0)},forward:'+z',note:'12-sided cream hut (variants 0-2), 3 m wall radius, 0.85 m two-band thatched eaves, 0.12 m recessed doorway on +z'};
 return g;
}

// 2. Watchtower: 10 m to the roof tip, 20% thicker legs in #825435, one bold X per front/back face (busy lower diagonals
// removed), 0.18 m gallery fascia band, clean low rail, banner-red (#AE493D) roof.
function watchtower(T){
 const {V,batch}=kit(T),g=new T.Group(),P=PALETTE,b=batch();
 // four 20% thicker splayed square timber legs on chunky stone plinths
 for(const sx of[-1,1])for(const sz of[-1,1]){
  b.box(.64,.36,.64,P.stone,sx*1.86,.18,sz*1.86);
  b.beam(V(sx*1.86,.25,sz*1.86),V(sx*1.38,6.84,sz*1.38),.34,P.frameTimber);
 }
 // one clean mid-level girt ring (all 4 sides) + ONE single bold X per visible face (+z and -z, y = 3.15..6.65)
 for(const s of[-1,1]){
  b.beam(V(-1.62,3.15,s*1.62),V(1.62,3.15,s*1.62),.2,P.frameTimber);
  b.beam(V(s*1.62,3.15,-1.62),V(s*1.62,3.15,1.62),.2,P.frameTimber);
  b.beam(V(-1.6,3.18,s*1.6),V(1.38,6.68,s*1.38),.19,P.frameTimber);
  b.beam(V(1.6,3.18,s*1.6),V(-1.38,6.68,s*1.38),.19,P.frameTimber);
 }
 // gallery deck (4.4 x 4.4 m) wrapped with a bold 0.18 m perimeter fascia so the level reads clearly
 b.box(4.4,.26,4.4,P.timber,0,6.98,0);
 for(const s of[-1,1]){
  b.box(4.56,.22,.14,P.frameTimberDark,0,6.98,s*2.21);
  b.box(.14,.22,4.56,P.frameTimberDark,s*2.21,6.98,0);
 }
 for(const sx of[-1,1])for(const sz of[-1,1]){
  b.beam(V(sx*1.44,6.15,sz*1.44),V(sx*2.02,6.88,sz*2.02),.16,P.frameTimberDark);
  b.box(.24,1.56,.24,P.frameTimber,sx*1.98,7.9,sz*1.98);
 }
 // single clean low gallery rail all round
 for(const s of[-1,1]){
  b.box(3.96,.15,.14,P.frameTimber,0,7.94,s*1.98);
  b.box(.14,.15,3.96,P.frameTimber,s*1.98,7.94,0);
 }
 // banner-red (#AE493D) pyramid roof with crisp dark fascia, tip at exactly y = 10.00 m
 b.box(4.82,.18,4.82,P.roofRedDark,0,8.52,0);
 b.cone(3.48,1.52,4,P.roofRed,0,9.24,0,0,Math.PI/4,0);
 b.buildByColor(g);
 g.userData={name:'Watchtower',width:4.92,height:10,points:{gallery:V(0,7.11,0),roofTip:V(0,10,0),base:V(0,0,0)},forward:'+z',note:'10 m village watchtower with thick legs, one X per face, 0.22 m gallery fascia and #AE493D roof'};
 return g;
}

// 3. Footbridge: 5 m long (along z) and 2 m wide (along x), shallow 0.22 m crown in 5 straight deck segments,
// two continuous curved timber stringers, 0.12 m posts, shallow-curved handrails, lowered bevelled stone abutments.
function footbridge(T){
 const {V,batch}=kit(T),g=new T.Group(),P=PALETTE,b=batch();
 const arch=z=>.48-.055*z*z;                                                        // shallow 0.22 m crown over 4 m span
 // lowered stone abutments bevelled into the banks (outer faces at +-2.5 m -> exact 5.0 m span, standing on y=0)
 for(const s of[-1,1]){
  b.box(2.26,.28,.44,P.stone,0,.14,s*2.18);
  b.box(2.26,.14,.26,P.stone,0,.11,s*2.34,s*.42,0,0);                               // bevelled outer bank slope
 }
 // two continuous arched timber stringers underneath
 const sPts=[-2.05,-1.05,0,1.05,2.05];
 for(const sx of[-1,1])for(let i=0;i<sPts.length-1;i++)b.beam(V(sx*.88,arch(sPts[i])-.11,sPts[i]),V(sx*.88,arch(sPts[i+1])-.11,sPts[i+1]),.13,P.timberDark,.16);
 // 5 straight crowned deck plank segments spanning z = -2.0..+2.0 m
 for(let i=-2;i<=2;i++){
  const z=i*.84,y=arch(z),rx=Math.atan(.11*z);
  b.box(2,.11,.8,i%2?P.bridgePlank:P.timber,0,y,z,rx,0,0);
 }
 // 0.12 m posts + smooth 4-segment shallow-curved handrail per side
 const rPts=[-1.95,-.98,0,.98,1.95];
 for(const sx of[-1,1]){
  for(const z of[-1.9,0,1.9]){const top=arch(z)+.88;b.box(.12,top,.12,P.post,sx*.94,top/2,z);}
  for(let i=0;i<rPts.length-1;i++)b.beam(V(sx*.94,arch(rPts[i])+.86,rPts[i]),V(sx*.94,arch(rPts[i+1])+.86,rPts[i+1]),.11,P.frameTimber,.12);
 }
 b.buildByColor(g);
 g.userData={name:'Footbridge',width:2.26,length:5,height:1.42,points:{crown:V(0,.54,0),entryNear:V(0,.26,2.5),entryFar:V(0,.26,-2.5)},forward:'+z',note:'5 x 2 m footbridge with 0.22 m crown in 5 segments, continuous stringers, 0.12 m posts and bevelled stone abutments'};
 return g;
}

// 4. Jetty: 5 m long (along z) by 2.4 m wide (along x), thicker 0.20 m piles in 4 pairs reaching 1.2 m below deck
// (down to y = -0.84 m), two lengthwise 0.14 x 0.20 m beams under planks, outer piles rising 0.26 m above planks.
function jetty(T){
 const {V,batch}=kit(T),g=new T.Group(),P=PALETTE,b=batch();
 const deckY=.36,pileBot=deckY-1.2;
 // two beefy 0.14 x 0.20 m lengthwise beams directly beneath the deck
 for(const sx of[-1,1])b.box(.14,.2,4.88,P.timberDark,sx*.92,deckY-.18,0);
 // 4 pairs of chunky 0.20 m piles + cross-bearers; outer water-end pair stands +0.26 m above planks to mark the end
 const zs=[-2.12,-.71,.71,2.12];
 zs.forEach((z,idx)=>{
  const top=deckY+(idx===3?.26:.17);
  b.box(2.26,.14,.14,P.timberDark,0,deckY-.17,z);
  for(const sx of[-1,1])b.rod(V(sx*1.06,pileBot,z),V(sx*1.06,top,z),.1,8,P.frameTimber);
 });
 // 8 chunky deck planks spanning exact 5.0 m x 2.4 m
 for(let i=0;i<8;i++)b.box(2.4,.09,.58,i%2?P.plank:P.timber,0,deckY-.045,-2.21+i*.6314);
 b.buildByColor(g);
 g.userData={name:'Timber jetty',width:2.4,length:5,height:deckY+.26-pileBot,deckY,points:{deck:V(0,deckY,0),head:V(0,deckY,2.5),shore:V(0,deckY,-2.5)},forward:'+z',note:'5 x 2.4 m jetty; y=0 is waterline, deck top y=0.36, 0.20 m piles reach 1.2 m below deck to y=-0.84'};
 return g;
}

// 5. Wind pennant: 3.5 m pole with two cream rope ties, and a 1.48 m tapered cloth pennant with two broad bends
// in wide #AE493D and #F6E6BD stripes as a separate child in userData.flag extending along +z.
function windPennant(T){
 const {V,batch}=kit(T),g=new T.Group(),P=PALETTE,pb=batch();
 pb.box(.26,.16,.26,P.stone,0,.08,0);                                               // base stone collar
 pb.cyl(.045,.07,3.44,6,P.frameTimber,0,1.72,0);                                    // tapered timber pole
 pb.ico(.065,0,P.timberLight,0,3.445,0);                                            // finial knob peaking at 3.50 m
 for(const y of[3.36,2.85])pb.cyl(.072,.072,.05,6,P.cream,0,y,0);                   // two chunky cream rope ties at the hoist
 pb.buildByColor(g);
 // separate cloth flag child at pole top: 1.48 m taper, 0.52 m hoist, two broad bends, 3 wide red/cream/red stripes
 const flag=new T.Group();flag.position.set(0,3.37,0);g.add(flag);
 const fb=batch(),L=1.48,H=.52,segs=9;
 const pTop=t=>V(.07*Math.sin(t*Math.PI*2),-.5*H*t+.035*Math.sin(t*Math.PI*2),t*L);
 const pBot=t=>V(.07*Math.sin(t*Math.PI*2),-H+.5*H*t+.035*Math.sin(t*Math.PI*2),t*L);
 for(let i=0;i<segs;i++){
  const t0=i/segs,t1=(i+1)/segs,col=(i>=3&&i<6)?P.cream:P.roofRed;
  if(i<segs-1)fb.quad(pTop(t0),pBot(t0),pBot(t1),pTop(t1),col,true);
  else fb.tri(pTop(t0),pBot(t0),pTop(1),col,true);
 }
 fb.buildByColor(flag);
 g.userData={name:'Wind pennant',width:.26,height:3.5,flag,points:{top:V(0,3.37,0),base:V(0,0,0)},forward:'+z',note:'3.5 m pole with two rope ties and 1.48 m wavy striped cloth pennant in userData.flag extending along +z'};
 return g;
}

// 6. Blossom tree (F1): 5 m tall, bent trunk with visible fork gap, five broad flattened asymmetric canopy lobes
// (~4.25 m wide) in #F299B5 on top and muted rose (#c97894) underneath; opt.scale scales the whole tree.
function blossomTree(T,opt={}){
 const {V,batch}=kit(T),g=new T.Group(),P=PALETTE,b=batch(),sc=opt.scale||1;
 // gently bent trunk with a clean visible V-fork gap beneath the crown
 b.cyl(.24,.36,.44,6,P.frameTimber,0,.22,0);                                        // root flare
 b.rod(V(0,.35,0),V(-.1,1.45,.04),.2,6,P.frameTimber,.24);                          // lower curved trunk
 b.rod(V(-.1,1.38,.04),V(.05,2.42,0),.16,6,P.frameTimber,.2);                       // upper bend to fork
 b.rod(V(.02,2.28,0),V(-1.05,3.26,.16),.095,5,P.frameTimber,.14);                   // left fork bough (leaves open V gap)
 b.rod(V(.05,2.34,0),V(.96,3.42,-.18),.095,5,P.frameTimber,.14);                    // right fork bough
 b.rod(V(.02,2.35,0),V(.16,3.34,-.78),.085,5,P.frameTimber,.12);                    // back bough
 // five broad flattened asymmetric canopy lobes peaking at exact y = 5.00 m
 b.ico(1.12,0,P.blossom,.22,4.26,-.06,1.22,.78,1.14);                               // upper right-centre crest
 b.ico(.92,0,P.blossom,-1.24,3.46,.22,1.18,.74,1.05);                               // broad offset left overhang
 b.ico(.92,0,P.blossom,1.16,3.7,-.2,1.14,.74,1.05);                                 // right wing lobe
 b.ico(.84,0,P.blossomShade,.36,3.28,.86,1.12,.72,1.0);                             // muted rose front-under lobe
 b.ico(.86,0,P.blossomShade,-.46,3.56,-.8,1.14,.74,1.02);                           // muted rose back-under lobe
 b.buildByColor(g);
 if(sc!==1)g.scale.setScalar(sc);
 g.userData={name:'F1 Blossom tree',width:4.25*sc,height:5*sc,scale:sc,points:{base:V(0,0,0),crown:V(0,3.7*sc,0)},forward:'+z',note:'5 m blossom tree with bent forked trunk and 5 broad flattened lobes (#F299B5 / muted rose); opt.scale defaults to 1'};
 return g;
}

// 7. Shooting rail: 6 m wide and 0.85 m high by default (opt.height lets seated VR lower it to 0.75 m).
function rail(T,opt={}){
 const {V,batch}=kit(T),g=new T.Group(),P=PALETTE,b=batch(),H=opt.height||.85;
 for(const x of[-2.92,-.97,.97,2.92]){
  b.box(.13,H-.04,.13,P.post,x,(H-.04)/2,0);
  b.box(.16,.04,.16,P.timberDark,x,H-.02,0);                                        // post cap flush at y = H
 }
 b.box(5.94,.08,.09,P.timber,0,H-.08,0);                                            // top rail
 b.box(5.94,.07,.08,P.timber,0,H*.48,0);                                            // mid rail
 for(const s of[-1,1])b.beam(V(s*2.9,H*.5,0),V(s*2.4,H-.08,0),.065,P.timberDark);   // outer corner knee braces
 b.buildByColor(g);
 g.userData={name:'Shooting rail',width:6,height:H,points:{centre:V(0,H,0),left:V(-3,0,0),right:V(3,0,0)},forward:'+z',note:'6 m stationary shooting-line rail; opt.height defaults to 0.85 m'};
 return g;
}

// 8. Archer's timber deck: 3.2 m wide by 2.6 m deep, standing flush on y = 0 with comfort-safe <= 3 cm plank gaps.
function deck(T){
 const {V,batch}=kit(T),g=new T.Group(),P=PALETTE,b=batch();
 // perimeter sleepers and under-bearers
 for(const s of[-1,1]){b.box(3.2,.05,.12,P.timberDark,0,.025,s*1.24);b.box(.12,.04,2.4,P.timberDark,s*1.1,.02,0);}
 // 8 longitudinal deck planks (3.2 x 2.6 m footprint, 3 cm gaps) + front toe-line cleat
 for(let i=0;i<8;i++)b.box(.37,.05,2.52,i%2?P.plank:P.timber,-1.4+i*.4,.055,0);
 b.box(2.96,.02,.08,P.timberLight,0,.085,1.08);                                     // front footing line cleat
 b.buildByColor(g);
 g.userData={name:'Archer deck',width:3.2,depth:2.6,height:.095,points:{stance:V(0,.08,0),front:V(0,.08,1.3)},forward:'+z',note:'3.2 x 2.6 m stationary timber footing deck, flush on y=0 with 3 cm plank gaps'};
 return g;
}

window.PROPS={PALETTE,thornwoodBow,marketStall,belfry,hut,watchtower,footbridge,jetty,windPennant,blossomTree,rail,deck};
})();
