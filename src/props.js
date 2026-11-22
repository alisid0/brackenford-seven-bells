// Props built in code from the approved concept pictures (assets/concepts). The build carries this file; the game uses
// the stall and belfry now and swaps in the Willowbank builders as stage 2 lands. tests/props.html shows them and saves pictures to assets/renders.
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
 stone:'#9a968c',stoneDark:'#7f7c73',roofRed:'#b3202f',roofRedDark:'#8e1b26',
 blossom:'#F299B5',blossomShade:'#e182a1'
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
  const mergeList=(list,withCol)=>{
   let total=0;for(const p of list)total+=p.geo.attributes.position.count;
   const pos=new Float32Array(total*3),col=withCol?new Float32Array(total*3):null,tc=withCol?new T.Color():null;
   let off=0;
   for(const p of list){
    const a=p.geo.attributes.position.array;pos.set(a,off*3);
    if(withCol){tc.set(p.color);for(let i=0;i<p.geo.attributes.position.count;i++){const k=(off+i)*3;col[k]=tc.r;col[k+1]=tc.g;col[k+2]=tc.b;}}
    off+=p.geo.attributes.position.count;p.geo.dispose();
   }
   const out=new T.BufferGeometry();out.setAttribute('position',new T.BufferAttribute(pos,3));
   if(withCol)out.setAttribute('color',new T.BufferAttribute(col,3));
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
  return{push,box:bBox,beam:bBeam,rod:bRod,cyl:bCyl,cone:bCone,ico:bIco,torus:bTorus,buildByColor,buildSingle};
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

// H8 The forked belfry of The Silent Peal (design/theme.md; picture assets/concepts/theme-belfry-states.jpg). One stands
// in every place. 3.2 m tall, posts 1.4 m apart, the forks' tips 2.2 m apart, crossbeam at 2.3 m, a bell 0.75 m tall
// and 0.65 m across the lip. Faces +z. Merged down to 8 meshes (static frame, bell body, gold lip, 3 thorn bands,
// silent crow+brambles+tied ribbon, restored streaming ribbon).
function belfry(T,opt={}){
 const k=kit(T),{add,V,batch}=k,g=new T.Group();
 const TIMBER='#825435',TIMBER_D='#6a4229',IRON='#3B3538',BRONZE='#AE783E',GOLD='#F0C75A',PLUM='#4A2943',PLUM_L='#6D3362',CREAM='#F6E6BD',HEM='#ae493d',ROPE='#c9a66b',EMBER='#E02E32';
 const matIron=k.mat(IRON,true),matBronze=k.mat(BRONZE,true);
 // 1. static frame: posts, forks, iron straps, crossbeam, fixed hanger bracket, rope coil, ribbon post-wrap (1 mesh)
 const fr=batch();
 for(const s of[-1,1]){
  fr.beam(V(s*.76,0,0),V(s*.68,2.52,0),.2,TIMBER);                                  // post, leaning in a little
  fr.beam(V(s*.68,2.42,0),V(s*1.1,3.2,0),.15,TIMBER);fr.beam(V(s*.68,2.42,0),V(s*.36,3.14,0),.15,TIMBER_D);   // the fork
  fr.box(.27,.15,.27,IRON,s*.69,2.3,0);                                             // iron strap where the beam meets the post
 }
 fr.beam(V(-.86,2.3,0),V(.86,2.3,0),.16,TIMBER_D);
 fr.box(.08,.2,.06,IRON,0,2.16,0);                                                  // iron hanger clevis under the crossbeam
 for(let i=0;i<3;i++)fr.torus(.19-.01*i,.04,5,10,ROPE,-.76,.05+i*.075,0,Math.PI/2,0,0);   // rope coiled at the left post
 fr.box(.24,.2,.24,CREAM,.69,2.0,0);                                                // ribbon wrap round the post, in both states
 fr.buildSingle(g,false);
 // 2-3. swinging bell pivot at y=2.2: body (material swapped in set) + gold lip (2 meshes)
 const bell=new T.Group();bell.position.set(0,2.2,0);g.add(bell);
 const prof=[[.04,-.12],[.15,-.13],[.2,-.3],[.235,-.58],[.325,-.83],[.325,-.87]].map(([r,y])=>new T.Vector2(r,y));
 const body=add(bell,new T.LatheGeometry(prof,8),IRON,0,0,0,true);body.material=matIron;
 const lip=add(bell,new T.CylinderGeometry(.332,.332,.08,8,1,true),GOLD,0,-.83,0,true);
 // 4-6. three individual thorn bands on the bell (1 merged mesh per band so bind(0..3) toggles each cleanly)
 const thorns=new T.Group();bell.add(thorns);
 const bands=[];
 for(const[y,r,tilt,turn]of[[-.42,.235,.42,0],[-.66,.3,-.36,1.3],[-.54,.27,.1,2.4]]){
  const tb=batch();
  tb.torus(r,.028,5,10,PLUM,0,y,0,Math.PI/2+tilt,0,turn);
  for(let i=0;i<5;i++){const a=i/5*Math.PI*2+turn;tb.cone(.03,.13,4,PLUM_L,Math.cos(a)*(r+.05),y+Math.sin(a)*Math.sin(tilt)*r,Math.sin(a)*(r+.05)*Math.cos(tilt),0,-a,-Math.PI/2);}
  bands.push(tb.buildSingle(thorns,false));
 }
 // 7. silent-only extras: foot brambles + perched shade crow + lashed flat ribbon (1 merged DoubleSide mesh)
 const sil=batch();
 for(const[x,z,sk]of[[-1.15,.15,1],[-.45,-.2,.8],[.5,.2,.9],[1.1,-.1,1.05]])for(let i=0;i<3;i++){const a=i*2.1+x;sil.beam(V(x,0,z),V(x+Math.cos(a)*.3*sk,.32*sk,z+Math.sin(a)*.3*sk),.035,PLUM);}
 const cx=-1.1,cy=3.2;
 sil.ico(.13,0,PLUM,cx,cy+.16,0,1.7,.85,.8);
 sil.ico(.075,0,PLUM,cx+.2,cy+.27,0);sil.cone(.03,.11,4,PLUM_L,cx+.3,cy+.26,0,0,0,-Math.PI/2);
 sil.box(.22,.03,.1,PLUM_L,cx-.26,cy+.13,0,0,0,.35);for(const s of[-1,1])sil.box(.012,.1,.012,PLUM,cx+.02,cy+.05,s*.04);
 sil.box(.02,.02,.02,EMBER,cx+.24,cy+.29,.062);sil.box(.02,.02,.02,EMBER,cx+.24,cy+.29,-.062);
 sil.box(.22,1.0,.025,CREAM,.72,1.45,.115);sil.box(.05,1.0,.027,HEM,.72,1.45,.116);
 {const sh=new T.Shape();sh.moveTo(-.11,0);sh.lineTo(.11,0);sh.lineTo(.11,-.16);sh.lineTo(0,-.07);sh.lineTo(-.11,-.16);sh.closePath();sil.push(new T.ShapeGeometry(sh),HEM,.72,.95,.128,0,0,0,1,1,1,true);}
 const silentExtras=sil.buildSingle(g,true);
 // 8. restored-only streaming ribbon (1 merged mesh)
 const lo=batch();
 {const pts=[[.8,2.0],[1.15,1.82],[1.5,1.96],[1.85,1.74],[2.15,1.84]];for(let i=0;i<pts.length-1;i++){const a=V(pts[i][0],pts[i][1],0),b=V(pts[i+1][0],pts[i+1][1],.02*i),d=b.clone().sub(a),rz=Math.atan2(d.y,d.x);lo.box(d.length()+.02,.22-.03*i,.02,CREAM,(a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2,0,0,rz);lo.box(d.length()+.02,.05,.022,HEM,(a.x+b.x)/2,(a.y+b.y)/2-.085+.012*i,(a.z+b.z)/2,0,0,rz);}}
 const loose=lo.buildSingle(g,false);
 function set(state){
  const on=state==='restored';body.material=on?matBronze:matIron;lip.visible=on;thorns.visible=!on;bands.forEach((b,i)=>b.visible=i<2);silentExtras.visible=!on;loose.visible=on;g.userData.state=on?'restored':'silent';
 }
 // Bell Watch: n thorn bands (0 to 3) on the bell as it is, whatever its state
 function bind(n){thorns.visible=n>0||g.userData.state==='silent';bands.forEach((b,i)=>b.visible=n>0?i<n:i<2);g.userData.bound=n;}
 g.userData={name:'H8 Forked belfry',width:2.2,height:3.2,bell,set,bind,bound:0,points:{strike:V(0,1.72,0),lip:V(0,1.37,0),perch:V(-1.1,3.2,0)},forward:'+z',note:'the bell swings about z at userData.bell; set("silent") or set("restored"); bind(0..3)'};
 set(opt.state==='restored'?'restored':'silent');
 return g;
}

// 1. Village hut (opt.variant 0, 1 or 2): round cream wall 3 m in radius, deep two-band thatched overhang, recessed
// timber doorway facing +z. Reads clearly as a building from 85 m.
function hut(T,opt={}){
 const {V,batch}=kit(T),g=new T.Group(),P=PALETTE,b=batch();
 const v=((opt.variant|0)%3+3)%3,wallH=v===1?2.45:v===2?2.2:2.3,peakH=wallH+2.45;
 b.cyl(3.12,3.18,.28,10,P.stone,0,.14,0);                                          // stone plinth grounding the round wall
 b.cyl(3,3,wallH,10,P.plaster,0,wallH/2,0);                                        // 3 m radius round cream wall
 // low thatched roof in two bands with a deep 1.35 m overhang
 b.cyl(2.35,4.35,1.15,10,P.thatchDark,0,wallH+.35,0);                              // broad lower overhang band
 b.cone(2.55,1.55,10,P.thatch,0,wallH+1.675,0);                                    // lighter upper thatch crown
 // recessed timber doorway on +z with thick jambs, overhanging lintel and threshold stone
 b.box(1.26,1.88,.34,P.door,0,.94,2.86);                                           // recessed dark door leaf
 b.box(1.52,.14,.42,P.stone,0,.07,3.06);                                           // threshold step
 b.box(1.76,.2,.3,P.post,0,1.98,3.04);                                             // heavy timber lintel
 for(const s of[-1,1])b.box(.18,1.92,.26,P.post,s*.72,.96,3.02);                   // door jambs
 if(v===1){                                                                        // variant 1: hearth hut with roof chimney
  b.box(.62,.95,.62,P.stone,.85,wallH+1.85,-.55);b.box(.74,.14,.74,P.post,.85,wallH+2.36,-.55);
 }else if(v===2){                                                                  // variant 2: shuttered cottage with side window
  const a=.88,cx=Math.sin(a)*2.94,cz=Math.cos(a)*2.94;
  b.box(.82,.82,.2,P.door,cx,1.3,cz,0,a,0);b.box(1.06,.14,.24,P.post,Math.sin(a)*3.02,1.76,Math.cos(a)*3.02,0,a,0);b.box(1.06,.12,.24,P.post,Math.sin(a)*3.02,.84,Math.cos(a)*3.02,0,a,0);
 }
 b.buildByColor(g);
 g.userData={name:'Village hut',variant:v,width:8.7,height:peakH,radius:3,points:{door:V(0,0,3.15),roofPeak:V(0,peakH,0),base:V(0,0,0)},forward:'+z',note:'round cream hut (variant 0-2), 3 m wall radius, two-band thatched eaves, doorway faces +z'};
 return g;
}

// 2. Watchtower: 10 m to the roof tip, thick splayed legs, two-sided X-braces (+z and -z), overhanging gallery deck
// with low rail, red pyramid roof.
function watchtower(T){
 const {V,batch}=kit(T),g=new T.Group(),P=PALETTE,b=batch();
 // four thick splayed timber legs on stone plinth blocks
 for(const sx of[-1,1])for(const sz of[-1,1]){
  b.box(.56,.34,.56,P.stone,sx*1.85,.17,sz*1.85);
  b.rod(V(sx*1.85,.25,sz*1.85),V(sx*1.38,6.88,sz*1.38),.24,6,P.post,.28);
 }
 // horizontal girts at mid height (all four sides) + thick X-braces on front (+z) and back (-z)
 for(const s of[-1,1]){
  b.beam(V(-1.62,3.4,s*1.62),V(1.62,3.4,s*1.62),.18,P.brace);
  b.beam(V(s*1.62,3.4,-1.62),V(s*1.62,3.4,1.62),.18,P.brace);
  for(const[y0,y1,x0,x1]of[[.35,3.35,1.78,1.58],[3.45,6.65,1.58,1.38]]){
   b.beam(V(-x0,y0,s*x0),V(x1,y1,s*x1),.16,P.brace);b.beam(V(x0,y0,s*x0),V(-x1,y1,s*x1),.16,P.brace);
  }
 }
 // gallery deck (4.4 x 4.4 m, wider than legs) + corner brackets + posts + low rail
 b.box(4.4,.28,4.4,P.timber,0,6.99,0);
 for(const sx of[-1,1])for(const sz of[-1,1]){
  b.beam(V(sx*1.42,6.05,sz*1.42),V(sx*2.02,6.88,sz*2.02),.15,P.brace);
  b.box(.22,1.68,.22,P.post,sx*1.96,7.96,sz*1.96);
 }
 for(const s of[-1,1])for(const y of[7.62,8.08]){
  b.box(3.92,.13,.13,P.brace,0,y,s*1.96);b.box(.13,.13,3.92,P.brace,s*1.96,y,0);
 }
 // red pyramid roof with dark eaves fascia, tip at exactly y = 10.0 m
 b.box(4.76,.14,4.76,P.roofRedDark,0,8.52,0);
 b.cone(3.46,1.54,4,P.roofRed,0,9.23,0,0,Math.PI/4,0);
 b.buildByColor(g);
 g.userData={name:'Watchtower',width:4.89,height:10,points:{gallery:V(0,7.13,0),roofTip:V(0,10,0),base:V(0,0,0)},forward:'+z',note:'10 m village watchtower with splayed legs, two-sided X-braces, overhanging gallery and red roof'};
 return g;
}

// 3. Footbridge: 5 m long (along z) and 2 m wide (along x), crowned plank deck, thick posts with one solid handrail
// per side, stone abutments at both ends.
function footbridge(T){
 const {V,batch}=kit(T),g=new T.Group(),P=PALETTE,b=batch();
 const arch=z=>.66-.082*z*z;
 // stone abutments at z = +-2.25 (outer faces at +-2.5 m -> exact 5 m length)
 for(const s of[-1,1]){
  b.box(2.34,.44,.5,P.stone,0,.22,s*2.25);
  for(const sx of[-1,1])b.box(.34,.56,.5,P.stone,sx*1.04,.28,s*2.25);
 }
 // arched stringers underneath + 9 crowned deck planks
 for(const sx of[-1,1])for(const[z0,z1]of[[-2.05,-1],[-1,0],[0,1],[1,2.05]])b.beam(V(sx*.82,arch(z0)-.12,z0),V(sx*.82,arch(z1)-.12,z1),.14,P.post);
 for(let i=-4;i<=4;i++){
  const z=i*.49,y=arch(z),rx=Math.atan(.164*z);
  b.box(2,.12,.45,i%2?P.bridgePlank:P.timber,0,y,z,rx,0,0);
 }
 // three thick posts + one solid arched handrail per side
 for(const sx of[-1,1]){
  for(const z of[-2,0,2]){const top=arch(z)+.96;b.box(.15,top,.15,P.post,sx*.92,top/2,z);}
  b.beam(V(sx*.92,arch(-2)+.92,-2),V(sx*.92,arch(0)+.92,0),.11,P.brace,.13);
  b.beam(V(sx*.92,arch(0)+.92,0),V(sx*.92,arch(2)+.92,2),.11,P.brace,.13);
 }
 b.buildByColor(g);
 g.userData={name:'Footbridge',width:2.42,length:5,height:1.62,points:{crown:V(0,.72,0),entryNear:V(0,.34,2.5),entryFar:V(0,.34,-2.5)},forward:'+z',note:'5 x 2 m crowned plank footbridge with stone abutments and single solid handrails; spans along z'};
 return g;
}

// 4. Jetty: 5 m long (along z) by 2.4 m wide (along x), deck top at y = 0.36 m, piles reaching 1.2 m below the deck
// (down to y = -0.84 m) with mooring bollard tops above the planks.
function jetty(T){
 const {V,batch}=kit(T),g=new T.Group(),P=PALETTE,b=batch();
 const deckY=.36,pileBot=deckY-1.2,pileTop=.78;
 // under-deck stringers and cross-bearers
 for(const sx of[-1,1])b.box(.14,.14,4.86,P.timberDark,sx*.92,deckY-.13,0);
 for(const z of[-2.15,-.72,.72,2.15]){
  b.box(2.26,.12,.14,P.timberDark,0,deckY-.14,z);
  for(const sx of[-1,1])b.rod(V(sx*1.08,pileBot,z),V(sx*1.08,pileTop,z),.09,6,P.post);
 }
 // 10 deck planks spanning 5.0 m x 2.4 m
 for(let i=0;i<10;i++)b.box(2.4,.08,.46,i%2?P.plank:P.timber,0,deckY-.04,-2.27+i*.504);
 b.buildByColor(g);
 g.userData={name:'Timber jetty',width:2.4,length:5,height:pileTop-pileBot,deckY,points:{deck:V(0,deckY,0),head:V(0,deckY,2.5),shore:V(0,deckY,-2.5)},forward:'+z',note:'5 x 2.4 m jetty; y=0 is waterline, deck top at y=0.36, piles reach 1.2 m below deck to y=-0.84'};
 return g;
}

// 5. Wind pennant: 3.5 m pole standing on y = 0, with a 1.6 m red-and-cream striped pennant as a separate child in
// userData.flag extending along +z so the game can turn (rotation.y) and stretch (scale.z) it with the wind.
function windPennant(T){
 const {V,batch}=kit(T),g=new T.Group(),P=PALETTE,pb=batch();
 pb.box(.26,.16,.26,P.stone,0,.08,0);                                               // base stone collar
 pb.cyl(.042,.065,3.44,6,P.post,0,1.72,0);                                          // tapered timber pole
 pb.ico(.065,0,P.timberLight,0,3.445,0);                                            // finial knob peaking at 3.50 m
 pb.buildByColor(g);
 // separate flag child at pole top, 1.6 m long along +z, four alternating red and cream stripes
 const flag=new T.Group();flag.position.set(0,3.38,0);g.add(flag);
 const fb=batch(),L=1.6,H=.72,bands=4;
 for(let i=0;i<bands;i++){
  const z0=i/bands*L,z1=(i+1)/bands*L,t0=z0/L,t1=z1/L,yTop0=-t0*H/2,yBot0=-H+t0*H/2,yTop1=-t1*H/2,yBot1=-H+t1*H/2;
  const geo=new T.BufferGeometry();
  const pts=i<bands-1?[0,yTop0,z0, 0,yBot0,z0, 0,yBot1,z1,  0,yTop0,z0, 0,yBot1,z1, 0,yTop1,z1]:[0,yTop0,z0, 0,yBot0,z0, 0,-H/2,z1];
  geo.setAttribute('position',new T.Float32BufferAttribute(pts,3));
  fb.push(geo,i%2?P.cream:P.red,0,0,0,0,0,0,1,1,1,true);
 }
 fb.buildByColor(flag);
 g.userData={name:'Wind pennant',width:.26,height:3.5,flag,points:{top:V(0,3.38,0),base:V(0,0,0)},forward:'+z',note:'3.5 m pole with 1.6 m red-and-cream striped pennant in userData.flag extending along +z'};
 return g;
}

// 6. Blossom tree (F1): 5 m tall with a 3.5 m faceted crown in #F299B5; opt.scale scales the whole tree.
function blossomTree(T,opt={}){
 const {V,batch}=kit(T),g=new T.Group(),P=PALETTE,b=batch(),sc=opt.scale||1;
 b.cyl(.22,.34,.45,6,P.post,0,.225,0);                                              // rooted base flare
 b.rod(V(0,.35,0),V(.14,2.65,0),.16,6,P.post,.22);                                  // main trunk
 b.rod(V(.08,1.95,0),V(-.98,3.3,.2),.09,5,P.post,.14);                              // left bough
 b.rod(V(.1,2.1,0),V(1.02,3.4,-.25),.09,5,P.post,.14);                              // right bough
 b.rod(V(.06,2.15,0),V(.05,3.4,.85),.08,5,P.post,.12);                              // front bough
 // 3.5 m faceted crown peaking at y = 5.0 m
 b.ico(1.16,0,P.blossom,0,4.01,0);
 b.ico(.86,0,P.blossom,-1.02,3.52,.18);
 b.ico(.86,0,P.blossom,1.02,3.58,-.2);
 b.ico(.82,0,P.blossomShade,-.1,3.38,.98);
 b.ico(.84,0,P.blossomShade,.18,3.68,-.96);
 b.buildByColor(g);
 if(sc!==1)g.scale.setScalar(sc);
 g.userData={name:'F1 Blossom tree',width:3.5*sc,height:5*sc,scale:sc,points:{base:V(0,0,0),crown:V(0,3.6*sc,0)},forward:'+z',note:'5 m blossom tree with 3.5 m crown in #F299B5; opt.scale defaults to 1'};
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
