'use strict';
// Release settings come from src/config.json at build time. In release mode the game shows the curated stage order under the
// release title and hides what is not finished (roaming, coins, free stage choice). Add ?release=0 to the address to see
// everything as before, ?release=1 to force release mode, and ?fps=1 for a frame counter.
const CONFIG=typeof BUILD_CONFIG!=='undefined'?BUILD_CONFIG:{release:false,title:'The Seven Bells',subtitle:'',world:'Brackenford',blurb:'',order:[]},QUERY=new URLSearchParams(location.search);
const RELEASE=QUERY.has('release')?QUERY.get('release')!=='0':!!CONFIG.release, SHOW_FPS=QUERY.get('fps')==='1';
// If something breaks, say so plainly instead of leaving the player with a frozen screen.
let oops=false;
function fault(){
 if(oops)return;oops=true;const b=document.createElement('div');
 b.textContent='Something went wrong. Please reload the page. Your progress is saved.';
 b.style.cssText='position:fixed;left:50%;top:14px;transform:translateX(-50%);z-index:9;background:#7a2a22;color:#fff5d8;padding:10px 16px;border-radius:5px;font:600 14px system-ui,sans-serif;box-shadow:0 2px 12px #0008';
 document.body.append(b);
}
window.addEventListener('error',fault);window.addEventListener('unhandledrejection',fault);
const $=id=>document.getElementById(id), T=THREE, V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
const clamp=T.MathUtils.clamp, lerp=T.MathUtils.lerp, smooth=T.MathUtils.smoothstep, hyp=Math.hypot;

// ---------------------------------------------------------------- renderer
const canvas=$('view'), scene=new T.Scene(), camera=new T.PerspectiveCamera(68,1,.05,1600);
const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5)); renderer.xr.enabled=true;
// ---- Stage 3, lighting and colour (design/willowbank-art-pass.md). One switch: "grade" in src/config.json, or
// ?grade=1 / ?grade=0. On: the day no longer turns; a fixed late-afternoon sun stands behind the archer's left shoulder
// (120 degrees left of the shooting direction, 25 degrees up: Gemini's direction, agreed by ChatGPT), warm key and cool
// fill, haze from 110 m to 480 m, and ChatGPT's colours for sky, clouds, meadow and water. Off: everything as before.
// ---- Mechanics first (design/controls-and-arrows.md). Two switches, both off unless asked for.
//   ?lab=1   the mechanics lab: a plain grey test range with no scenery, three targets at 10, 20 and 30 m, arrows
//            that never run out, and a read-out of every shot on the scoreboard and on the bow. It is for getting the
//            bow, the arrow and the controls right before any art is spent on them. It turns "pads" on.
//   "pads" in src/config.json, or ?pads=1 / ?pads=0: the face buttons of the Meta Quest controllers (A, B, X, Y) are
//            read by name and given jobs. Off: only triggers, grips and thumbsticks do anything, as before.
const LAB=QUERY.get('lab')==='1',PADS=LAB||(QUERY.has('pads')?QUERY.get('pads')==='1':!!CONFIG.pads);
const lab={started:false,shot:null,aims:[],drawNow:0,pad:null};
//   "grey" in src/config.json, or ?grey=1: the skeleton. The whole game, every stage, Bell Watch and the menus, plays in
//            the lab's plain look: grey ground and sky, no trees, grass, clouds or old-world buildings, the range's own
//            shapes in shades of grey. Targets, the bell and the shades keep their colours: they are what you play
//            against. It is for getting the game working end to end before its looks. The lab is always grey.
const GREY=LAB||(QUERY.has('grey')?QUERY.get('grey')==='1':!!CONFIG.grey);
//   "bow2" in src/config.json, or ?bow2=1: the bow and arrow, second version (Gemini's design/arrow-mechanics-v2.md).
//            Full draw fitted to the player's reach, a speed curve with a plateau at full draw, real gravity and light air,
//            a release that ignores the jerk of the trigger finger, a longer sweet spot, and a haptics table. Off: as before.
//   "bow3" in src/config.json, or ?bow3=1: the fun bow (Gemini's design/fun-bow.md, after the developer's note that the
//            arrow was too big and the aim is fun, not a simulation). A 0.72 m scout bow, a slim 46 cm arrow, a fixed 26 cm
//            draw, faster and flatter flight, quick rapid fire, gentle help on shades. It keeps version 2's release, haptics
//            plan and midpoint flight, so it switches version 2's machinery on with its own numbers. It wins over bow2.
const BOW3=QUERY.has('bow3')?QUERY.get('bow3')==='1':!!CONFIG.bow3;
const BOW2=BOW3||(QUERY.has('bow2')?QUERY.get('bow2')==='1':!!CONFIG.bow2);
// the bow and arrow as built: riser half-height and radius; limb (to the bend, out to the tip, how far back the tip sits,
// radius); arrow rest height and offset; where the string sits at rest; arrow shaft, head and feathers; trail width; how
// far a single-handed draw pulls the string back
const KIT=BOW3?{riser:.12,riserR:.015,l1:.13,l1z:.044,l2:.24,brace:.11,limbR:.011,rest:.032,restX:.024,nockZ:.10,grip:.65,shaft:.46,shaftR:.0045,tipR:.013,tipL:.044,fl:[.028,.004,.062],flZ:.415,flOff:.012,streakW:.016,pull:.26}
 :{riser:.21,riserR:.024,l1:.21,l1z:.06,l2:.39,brace:.15,limbR:.018,rest:.045,restX:.035,nockZ:.14,grip:1,shaft:.62,shaftR:.009,tipR:.03,tipL:.088,fl:[.05,.009,.1],flZ:.57,flOff:.018,streakW:.022,pull:.33};
const GRADE=!GREY&&(QUERY.has('grade')?QUERY.get('grade')==='1':!!CONFIG.grade);
const LOOK={skyTop:'#7798BD',skyHorizon:'#E4B7AA',skyBlueBy:16,lawn:'#A6B956',lawnFace:'#7D9C41',ringRed:'#AE493D',cloud:'#F6E6BD',cloudUnder:'#D8BAC2',sun:'#FFD1A0',sunStrength:3.4,fill:'#BCC8E0',fillGround:'#9C977C',fillStrength:1.7,
 haze:'#BBAAB9',hazeFrom:110,hazeTo:480,meadow:'#91A454',meadowLit:'#A5B662',meadowShade:'#788D48',lake:'#527F9A',tuft:'#8A9F50',tuftSize:.6,sunLeft:120,sunUp:25,
 hillNear:'#788950',hillMid:'#89748F',hillFar:'#A28AA5',hillAt:[9,20,33],
 ridges:[[150,15,55,7],[235,30,80,8]],   // two rows of hills built in front of the rim: [metres from the line, height, width, how many across the view]
 shadow:.55,                              // how much of the sun a cast shadow takes away: .55 darkens level ground by about a quarter
 glint:'#9ABBC4'};
const SHADOWS=GRADE&&LOOK.shadow>0&&QUERY.get('shadows')!=='0';   // ?shadows=0 keeps the graded look without cast shadows
const shaded=o=>{if(SHADOWS)o.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true;}});return o;};
   // the valley's rim in three bands by height (metres), the highest the lightest
scene.fog=GREY?new T.Fog('#c9ccd0',200,900):GRADE?new T.Fog(LOOK.haze,LOOK.hazeFrom,LOOK.hazeTo):new T.FogExp2(0xb4cfd3,.0031);
const rig=new T.Group();scene.add(rig);rig.add(camera);camera.rotation.order='YXZ';camera.position.set(0,1.65,0);
const sun=new T.DirectionalLight(0xffe5bb,2.1), hemi=new T.HemisphereLight(0xfff1cc,0x8fa37c,1.5);scene.add(sun,hemi);
if(SHADOWS){
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
 const c=sun.shadow.camera;c.left=c.bottom=-80;c.right=c.top=80;c.near=1;c.far=420;sun.shadow.bias=-.0004;sun.shadow.normalBias=.06;sun.shadow.intensity=LOOK.shadow;scene.add(sun.target);
}
const mats=new Map();
function material(color){
 if(!mats.has(color)) mats.set(color,new T.MeshStandardMaterial({color,flatShading:true,roughness:.95}));
 return mats.get(color);
}
function mesh(parent,geo,color,pos){
 const object=new T.Mesh(geo,typeof color==='string'?material(color):color);if(pos)object.position.copy(pos);parent.add(object);return object;
}
function box(parent,p,s,c){return mesh(parent,new T.BoxGeometry(s.x,s.y,s.z),c,p);}
function stick(parent,a,b,r,c,sides=7){
 const delta=b.clone().sub(a);const o=mesh(parent,new T.CylinderGeometry(r,r,delta.length(),sides),c,a.clone().lerp(b,.5));
 o.quaternion.setFromUnitVectors(V(0,1,0),delta.normalize());return o;
}
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const rng=mulberry(2071);

// ---------------------------------------------------------------- the vale: height field
function hash2(ix,iz){let h=Math.imul(ix,374761393)^Math.imul(iz,668265263);h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296;}
function vnoise(x,z){
 const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz,u=fx*fx*(3-2*fx),v=fz*fz*(3-2*fz);
 const a=hash2(ix,iz),b=hash2(ix+1,iz),c=hash2(ix,iz+1),d=hash2(ix+1,iz+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;
}
function fbm(x,z,o=5){let s=0,a=.5,f=1;for(let i=0;i<o;i++){s+=a*vnoise(x*f,z*f);a*=.5;f*=2.03;}return s;}
const gauss=(x,z,cx,cz,r)=>Math.exp(-((x-cx)**2+(z-cz)**2)/(r*r));
const SIZE=840, HALF=SIZE/2, N=240, CELL=SIZE/N, EDGE=372, WADE=-1.05;
const SITES=[
 {id:'hamlet',name:'Hamlet bell',x:14,z:-26,tone:523},
 {id:'isle',name:'Lake isle bell',x:-140,z:-120,tone:587},
 {id:'tor',name:'Tor bell',x:170,z:-190,tone:659},
 {id:'deepwood',name:'Deepwood bell',x:195,z:125,tone:784},
 {id:'keep',name:'Old keep bell',x:-225,z:140,tone:880,tower:true},
 {id:'windgap',name:'Windgap bell',x:20,z:-305,tone:988},
 {id:'meadow',name:'Southmeadow bell',x:-55,z:245,tone:1175}];
function rawHeight(x,z){
 let h=6+(fbm(x/170+7.3,z/170+2.1,5)-.5)*34+(fbm(x/38+40,z/38+11,3)-.5)*5;
 h+=46*gauss(x,z,170,-190,85);
 h+=14*gauss(x,z,-225,140,60);
 h+=20*gauss(x,z,20,-310,70);
 h=lerp(h,-7,smooth(gauss(x,z,-140,-120,75),.25,.75));
 h+=12*gauss(x,z,-140,-120,18);
 h=lerp(h,4.5,smooth(gauss(x,z,0,0,45),.3,.8));
 for(const s of SITES)if(s.id!=='isle')h=lerp(h,Math.max(h,3.5),smooth(gauss(x,z,s.x,s.z,26),.3,.8));
 return h+smooth(hyp(x,z),330,420)*70;
}
const YARD={x:-24,z:-22,ux:-.5,uz:-.866,rx:.866,rz:-.5};
// ---- The new range layout, built to assets/concepts/world-2-layout-v2.jpg (ChatGPT's picture, with Gemini's
// corrections). Never on in release mode; outside it, ?world=2 turns it on. With it off nothing below changes anything.
//   The lane is 16 m wide and runs 76 m from the line. The ground is levelled under it. A creek crosses at 38 m.
//   Beyond the creek the lane steps up in four terraces from 43 m, so distance reads without shadows; no stage
//   stands a target on a step's edge.
const WORLD2=GREY||QUERY.get('world')==='2'||(!QUERY.has('world')&&CONFIG.world===2);   // Willowbank Range, the art pass (stage 2). Off unless asked for: ?world=2, or "world": 2 in src/config.json
const LANE={half:8,from:-3,to:76,creek:38,steps:[[43,.7],[53,1.4],[63,2.1],[72,2.8]],base:0};
const laneAt=(x,z)=>{const dx=x-YARD.x,dz=z-YARD.z;return[dx*YARD.ux+dz*YARD.uz,dx*YARD.rx+dz*YARD.rz];};   // [metres along the lane, metres to the archer's right]
// the whole footprint of the new range: lane and shoulders, the creek's band, and the footbridge
const inRange2=(x,z)=>{const[a,b]=laneAt(x,z);return(a>-12&&a<84&&Math.abs(b)<13)||(a>6&&a<34&&b>9&&b<22)||(a>33&&a<57&&b<-7&&b>-17)||(a>62&&a<104&&b>12&&b<40)||(Math.abs(a-LANE.creek)<4.5&&Math.abs(b)<29)||(Math.abs(a-LANE.creek)<6&&Math.abs(b-13.5)<5);};
const inLane=(x,z)=>{const[a,b]=laneAt(x,z);return a>LANE.from&&a<LANE.to&&Math.abs(b)<LANE.half;};
const laneRise=a=>{let h=0;for(const[at,up]of LANE.steps)if(a>=at)h=up;return h;};
const yardBits=new T.Group();   // training-yard timber that stands in the lane; hidden while the new range is in use
const W=N+1, H=new Float32Array(W*W);
for(let j=0;j<W;j++)for(let i=0;i<W;i++)H[j*W+i]=rawHeight(-HALF+i*CELL,-HALF+j*CELL);
if(WORLD2){
 // level the ground under the lane and a little either side, wider where the creek crosses, easing back into the land around it
 LANE.base=rawHeight(YARD.x,YARD.z);
 for(let j=0;j<W;j++)for(let i=0;i<W;i++){
  const[a,b]=laneAt(-HALF+i*CELL,-HALF+j*CELL);if(a<-24||a>100||Math.abs(b)>48)continue;
  const flat=Math.abs(a-LANE.creek)<9?(b>0?37:27):13,w=(1-smooth(Math.abs(b),flat,flat+9))*smooth(a,-20,-10)*(1-smooth(a,86,96));
  H[j*W+i]=lerp(H[j*W+i],LANE.base,w);
  if(b<-15&&a>2&&a<45)H[j*W+i]=lerp(H[j*W+i],Math.min(H[j*W+i],-1.4),smooth(-b,16,23)*smooth(a,2,8)*(1-smooth(a,40,45)));   // the cove
 }
}
function groundAt(x,z){
 const fx=clamp((x+HALF)/CELL,0,N-.0001),fz=clamp((z+HALF)/CELL,0,N-.0001),i=fx|0,j=fz|0,u=fx-i,v=fz-j,k=j*W+i;
 const a=H[k],b=H[k+1],c=H[k+W],d=H[k+W+1];
 const h=u+v<=1?a+(b-a)*u+(c-a)*v:d+(c-d)*(1-u)+(b-d)*(1-v);
 if(WORLD2){const[al,rt]=laneAt(x,z);if(al>=LANE.steps[0][0]&&al<LANE.to&&Math.abs(rt)<8)return LANE.base+laneRise(al);}   // on a terrace
 return h;
}
const slopeAt=(x,z)=>hyp(groundAt(x+1.5,z)-groundAt(x-1.5,z),groundAt(x,z+1.5)-groundAt(x,z-1.5))/3;
const PATHS=SITES.map((s,k)=>{
 const pts=[],n=16,len=hyp(s.x,s.z),px=-s.z/len,pz=s.x/len;
 for(let i=0;i<=n;i++){const t=i/n,w=Math.sin(t*Math.PI)*Math.sin(t*5+k*2.1)*len*.07;pts.push([s.x*t+px*w,s.z*t+pz*w]);}
 return pts;
});
function pathDist(x,z){
 let best=1e9;
 for(const pts of PATHS)for(let i=1;i<pts.length;i++){
  const ax=pts[i-1][0],az=pts[i-1][1],bx=pts[i][0]-ax,bz=pts[i][1]-az,t=clamp(((x-ax)*bx+(z-az)*bz)/(bx*bx+bz*bz),0,1);
  const d=(x-ax-bx*t)**2+(z-az-bz*t)**2;if(d<best)best=d;
 }
 return Math.sqrt(best);
}
const pathMask=new Uint8Array(W*W), mapBase=document.createElement('canvas');mapBase.width=mapBase.height=W;
{
 const pos=new Float32Array(W*W*3),col=new Float32Array(W*W*3),idx=new Uint32Array(N*N*6);
 const img=mapBase.getContext('2d').createImageData(W,W);
 const cA=new T.Color(GRADE?LOOK.meadow:'#8fa45c'),cB=new T.Color(GRADE?LOOK.meadowShade:'#6b8c47'),cDry=new T.Color(GRADE?LOOK.meadowLit:'#b3ad6a'),cSand=new T.Color('#d2c08a'),cRock=new T.Color('#8d8a80'),cSnow=new T.Color('#e9ece6'),cDirt=new T.Color('#b08f62'),cBed=new T.Color('#5d7168'),cWater=new T.Color(GRADE?LOOK.lake:'#4f8f9e'),c=new T.Color(),m=new T.Color();
 for(let j=0;j<W;j++)for(let i=0;i<W;i++){
  const k=j*W+i,x=-HALF+i*CELL,z=-HALF+j*CELL,h=H[k];
  const sl=hyp(H[j*W+Math.min(N,i+1)]-H[j*W+Math.max(0,i-1)],H[Math.min(N,j+1)*W+i]-H[Math.max(0,j-1)*W+i])/(2*CELL);
  c.copy(cA).lerp(cB,smooth(fbm(x/60+5,z/60+8,3),.35,.65)).lerp(cDry,smooth(fbm(x/25,z/25,2),.55,.8)*.6);
  if(h<1.2)c.lerp(cSand,1-smooth(h,.3,1.2));
  if(h<0)c.lerp(cBed,smooth(-h,0,3));
  if(GRADE){c.lerp(cRock,smooth(sl,.55,.95)*(1-smooth(h,6,9)));[LOOK.hillNear,LOOK.hillMid,LOOK.hillFar].forEach((k,n)=>c.lerp(m.set(k),smooth(h,LOOK.hillAt[n]-1,LOOK.hillAt[n]+1)));}
  else{c.lerp(cRock,smooth(sl,.55,.95));c.lerp(cSnow,smooth(h,44,58));}
  if(h>.3){const pd=pathDist(x,z);if(pd<3.6){c.lerp(cDirt,1-smooth(pd,1.6,3.6));if(pd<2.8)pathMask[k]=1;}}
  pos.set([x,h,z],k*3);col.set([c.r,c.g,c.b],k*3);
  m.copy(c);if(h<0)m.lerp(cWater,.75);m.convertLinearToSRGB();
  const shade=clamp(1+(H[j*W+Math.min(N,i+1)]-H[Math.max(0,j-1)*W+i])*.035,.7,1.25);
  img.data.set([m.r*255*shade,m.g*255*shade,m.b*255*shade,255],k*4);
 }
 let q=0;for(let j=0;j<N;j++)for(let i=0;i<N;i++){const a=j*W+i,b=a+1,cc=a+W,d=cc+1;idx.set([a,cc,b,b,cc,d],q);q+=6;}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(pos,3));geo.setAttribute('color',new T.BufferAttribute(col,3));geo.setIndex(new T.BufferAttribute(idx,1));geo.computeVertexNormals();
 {const land=new T.Mesh(geo,new T.MeshStandardMaterial(GREY?{color:'#9a9da1',flatShading:true,roughness:1}:{vertexColors:true,flatShading:true,roughness:1}));land.receiveShadow=SHADOWS;scene.add(land);}
 mapBase.getContext('2d').putImageData(img,0,0);
 const water=new T.Mesh(new T.PlaneGeometry(SIZE*2,SIZE*2),new T.MeshStandardMaterial({color:GREY?'#7f8589':GRADE?LOOK.lake:'#4f8f9e',transparent:true,opacity:GRADE?.9:.8,roughness:GRADE?.6:.3}));
 water.rotation.x=-Math.PI/2;scene.add(water);
}
const onPath=(x,z)=>pathMask[Math.round(clamp((z+HALF)/CELL,0,N))*W+Math.round(clamp((x+HALF)/CELL,0,N))]===1;

// The training yard on the north-west side of the hamlet, kept clear of trees and rocks.
// YARD is the shooting line; the lane runs along (ux,uz), and (rx,rz) is to an archer's right.
const yardAt=(along,right)=>[YARD.x+YARD.ux*along+YARD.rx*right,YARD.z+YARD.uz*along+YARD.rz*right];
const inYard=(x,z)=>{const dx=x-YARD.x,dz=z-YARD.z,a=dx*YARD.ux+dz*YARD.uz,b=dx*YARD.rx+dz*YARD.rz;return a>-12&&a<82&&b>-16&&b<12;};

// ---------------------------------------------------------------- colliders (round, on a grid)
const grid=new Map(), scratch=[];
function addCollider(x,z,r,top,ar=r){const k=(Math.floor(x/8)+128)*512+Math.floor(z/8)+128;if(!grid.has(k))grid.set(k,[]);grid.get(k).push({x,z,r,top,ar});}
function near(x,z){
 scratch.length=0;const cx=Math.floor(x/8)+128,cz=Math.floor(z/8)+128;
 for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const list=grid.get((cx+a)*512+cz+b);if(list)for(const c of list)scratch.push(c);}
 return scratch;
}
// y is the height of the walker's feet: someone standing on top of a thing is not pushed off it
function tryMove(x,z,y){
 const d=hyp(x,z);if(d>EDGE){x*=EDGE/d;z*=EDGE/d;}
 for(const c of near(x,z)){if(y!==undefined&&y>=c.top-.4)continue;const ox=x-c.x,oz=z-c.z,dd=hyp(ox,oz),min=c.r+.35;if(dd<min&&dd>1e-4){x=c.x+ox/dd*min;z=c.z+oz/dd*min;}}
 return[x,z];
}
// Flat tops you can stand on, and the upright faces you climb to reach them.
const platforms=[],panels=[];
function floorAt(x,z,y){
 let g=Math.max(groundAt(x,z),WADE);
 for(const p of platforms)if(p.top>g&&y>=p.top-.6&&Math.abs(x-p.x)<=p.hx&&Math.abs(z-p.z)<=p.hz)g=p.top;
 return g;
}
function panelNear(p,reach){
 for(const a of panels){
  const d=(p.x-a.x)*a.nx+(p.z-a.z)*a.nz,side=(p.x-a.x)*-a.nz+(p.z-a.z)*a.nx;
  if(d>-.25&&d<reach&&Math.abs(side)<a.w+.15&&p.y>a.y0-.1&&p.y<a.y1+.4)return a;
 }
 return null;
}

// ---------------------------------------------------------------- sky, sun, clouds
const sky=new T.Mesh(new T.SphereGeometry(1300,24,12),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,fog:false,
 uniforms:{top:{value:new T.Color()},hor:{value:new T.Color()}},
 vertexShader:'varying float h;void main(){h=normalize(position).y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:'uniform vec3 top;uniform vec3 hor;varying float h;void main(){gl_FragColor=vec4(mix(hor,top,'+(GRADE?'smoothstep(0.,'+Math.sin(LOOK.skyBlueBy*Math.PI/180).toFixed(3)+',h)':'pow(clamp(h,0.,1.),.5)')+'),1.);\n#include <colorspace_fragment>\n}'}));
sky.frustumCulled=false;scene.add(sky);
const sunDisc=new T.Mesh(new T.CircleGeometry(38,24),new T.MeshBasicMaterial({color:0xfff3cf,fog:false,depthWrite:false}));scene.add(sunDisc);
const clouds=[];
{
 const cm=new T.MeshBasicMaterial({color:0xffffff,fog:false,transparent:true,opacity:.86}),cg=new T.IcosahedronGeometry(1,1);
 if(GRADE){   // cream faces, dusty undersides
  const p=cg.attributes.position,k=new Float32Array(p.count*3),up=new T.Color(LOOK.cloud),under=new T.Color(LOOK.cloudUnder),c=new T.Color();
  for(let i=0;i<p.count;i+=3){const y=(p.getY(i)+p.getY(i+1)+p.getY(i+2))/3;c.copy(under).lerp(up,clamp(y*2+.6,0,1));for(let v=0;v<3;v++)k.set([c.r,c.g,c.b],(i+v)*3);}
  cg.setAttribute('color',new T.Float32BufferAttribute(k,3));cm.vertexColors=true;cm.opacity=.95;
 }
 for(let i=0;i<16;i++){
  const g=new T.Group();g.position.set((rng()-.5)*1700,170+rng()*110,(rng()-.5)*1700);
  for(let k=0;k<4;k++){const b=new T.Mesh(cg,cm);b.position.set((rng()-.5)*60,(rng()-.5)*6,(rng()-.5)*30);b.scale.set(26+rng()*26,7+rng()*6,18+rng()*16);g.add(b);}
  scene.add(g);clouds.push(g);
 }
}
const DAY=[[0,'#5d8fc9','#f2c9a0','#ffc994',1.5,1.15],[.18,'#4d93d6','#b9d6dd','#fff0d0',2.2,1.5],[.6,'#4d93d6','#b9d6dd','#fff0d0',2.2,1.5],[.78,'#566fae','#f0b183','#ffb070',1.6,1.15],[.9,'#2c3d6b','#7686a8','#a9bbe6',.75,.9],[1,'#5d8fc9','#f2c9a0','#ffc994',1.5,1.15]]
 .map(k=>[k[0],new T.Color(k[1]),new T.Color(k[2]),new T.Color(k[3]),k[4],k[5]]);
let dayT=.24;const DAY_SECONDS=840, sunDir=V();
function updateSky(dt,eye){
 if(GREY){   // flat grey sky, plain white light from behind and above, nothing moving
  if(!sunDir.lengthSq()){
   sunDir.set(-YARD.ux*.5,.8,-YARD.uz*.5).normalize();sky.material.uniforms.top.value.set('#aeb2b7');sky.material.uniforms.hor.value.set('#c9ccd0');scene.fog.color.set('#c9ccd0');
   sun.color.set('#ffffff');sun.intensity=2;hemi.color.set('#ffffff');hemi.groundColor.set('#8c9094');hemi.intensity=1.5;sun.position.copy(sunDir).multiplyScalar(100);
   sunDisc.visible=false;for(const c of clouds)c.visible=false;
  }
  sky.position.copy(eye);return;
 }
 if(GRADE){
  if(!sunDir.lengthSq()){
   const a=LOOK.sunLeft*Math.PI/180,e=LOOK.sunUp*Math.PI/180,cs=Math.cos(a),sn=Math.sin(a);   // turned to the left of the lane: forward*cos - right*sin
   sunDir.set((YARD.ux*cs-YARD.rx*sn)*Math.cos(e),Math.sin(e),(YARD.uz*cs-YARD.rz*sn)*Math.cos(e));
   sky.material.uniforms.top.value.set(LOOK.skyTop);sky.material.uniforms.hor.value.set(LOOK.skyHorizon);scene.fog.color.set(LOOK.haze);
   sun.color.set(LOOK.sun);sun.intensity=LOOK.sunStrength;hemi.color.set(LOOK.fill);hemi.groundColor.set(LOOK.fillGround);hemi.intensity=LOOK.fillStrength;
   {const[cx,cz]=yardAt(40,4);sun.target.position.set(cx,groundAt(cx,cz),cz);sun.position.copy(sun.target.position).addScaledVector(sunDir,200);sun.target.updateMatrixWorld();}   // aimed at the middle of the range, so the shadow map covers it
   sunDisc.material.color.set(LOOK.sun);
  }
  sky.position.copy(eye);sunDisc.position.copy(eye).addScaledVector(sunDir,1150);sunDisc.lookAt(eye);
  for(const c of clouds){c.position.x+=dt*2.2;if(c.position.x>900)c.position.x=-900;}
  return;
 }
 dayT=(dayT+dt/DAY_SECONDS)%1;let i=1;while(DAY[i][0]<dayT)i++;const a=DAY[i-1],b=DAY[i],f=(dayT-a[0])/(b[0]-a[0]);
 sky.material.uniforms.top.value.copy(a[1]).lerp(b[1],f);sky.material.uniforms.hor.value.copy(a[2]).lerp(b[2],f);
 scene.fog.color.copy(sky.material.uniforms.hor.value);
 sun.color.copy(a[3]).lerp(b[3],f);sun.intensity=lerp(a[4],b[4],f);hemi.intensity=lerp(a[5],b[5],f);
 const el=.16+.95*Math.sin(Math.PI*clamp(dayT/.86,0,1)),az=.6+dayT*4.4;
 sunDir.set(Math.cos(az)*Math.cos(el),Math.sin(el),Math.sin(az)*Math.cos(el));sun.position.copy(sunDir).multiplyScalar(100);
 sky.position.copy(eye);sunDisc.position.copy(eye).addScaledVector(sunDir,1150);sunDisc.lookAt(eye);sunDisc.material.color.copy(sun.color);
 for(const c of clouds){c.position.x+=dt*2.2;if(c.position.x>900)c.position.x=-900;}
}

// ---------------------------------------------------------------- trees, rocks, grass
const dummy=new T.Object3D(), tint=new T.Color();
{
 const trees=[];
 for(let n=0;n<5600;n++){
  const x=(rng()-.5)*800,z=(rng()-.5)*800;if(hyp(x,z)>396)continue;
  const g=groundAt(x,z);if(g<1.2||g>40||hyp(x,z)<31||slopeAt(x,z)>.7)continue;
  if(SITES.some(s=>hyp(x-s.x,z-s.z)<11)||pathDist(x,z)<4.5)continue;
  const dens=smooth(fbm(x/110+3.7,z/110+9.2,3),.4,.62)*.85+.05+.7*gauss(x,z,195,125,90);
  if(rng()>dens)continue;
  trees.push({x,z,g,s:.8+rng()*.9,pine:rng()<smooth(g,8,22)*.6+.3,r:rng()*6.28,v:rng()});
 }
 for(let i=trees.length-1;i>=0;i--)if(inYard(trees[i].x,trees[i].z)||(WORLD2&&inRange2(trees[i].x,trees[i].z)))trees.splice(i,1);
 const white=new T.MeshStandardMaterial({color:0xffffff,flatShading:true,roughness:.95});
 const trunkGeo=new T.CylinderGeometry(.7,1,1,6,1,true).translate(0,.5,0),coneGeo=new T.ConeGeometry(1,1,7).translate(0,.5,0),blobGeo=new T.IcosahedronGeometry(1,0);
 const pines=trees.filter(t=>t.pine).length;
 const trunks=new T.InstancedMesh(trunkGeo,white,trees.length),cones=new T.InstancedMesh(coneGeo,white,pines*2),blobs=new T.InstancedMesh(blobGeo,white,(trees.length-pines)*2);
 let ci=0,bi=0;
 const put=(im,i,x,y,z,sx,sy,sz,ry,color,shade)=>{dummy.position.set(x,y,z);dummy.scale.set(sx,sy,sz);dummy.rotation.set(0,ry,0);dummy.updateMatrix();im.setMatrixAt(i,dummy.matrix);im.setColorAt(i,tint.set(color).multiplyScalar(shade));};
 trees.forEach((t,i)=>{
  const s=t.s,sh=.82+t.v*.36;
  if(t.pine){
   put(trunks,i,t.x,t.g-.3,t.z,.22*s,2.6*s,.22*s,t.r,'#6b4a33',sh);
   put(cones,ci++,t.x,t.g+1.5*s,t.z,1.75*s,4.2*s,1.75*s,t.r,'#3f6b45',sh);put(cones,ci++,t.x,t.g+3.9*s,t.z,1.2*s,3.3*s,1.2*s,t.r+.5,'#4a7a4c',sh);
   addCollider(t.x,t.z,.3*s,t.g+6.5*s,.45*s);
  }else{
   const leaf=t.v>.86?'#c9953f':t.v>.72?'#9aa648':'#6e9a4a';
   put(trunks,i,t.x,t.g-.3,t.z,.27*s,3.1*s,.27*s,t.r,'#7a5a3c',sh);
   put(blobs,bi++,t.x,t.g+4*s,t.z,2.2*s,1.9*s,2.2*s,t.r,leaf,sh);put(blobs,bi++,t.x+Math.cos(t.r)*1.1*s,t.g+5.2*s,t.z+Math.sin(t.r)*1.1*s,1.4*s,1.25*s,1.4*s,t.r,leaf,sh*1.08);
   addCollider(t.x,t.z,.34*s,t.g+3*s,.4*s);
  }
 });
 scene.add(trunks,cones,blobs);
 const rocks=new T.InstancedMesh(new T.DodecahedronGeometry(1,0),white,280);
 for(let i=0;i<rocks.count;i++){
  let x,z,g,tries=0;do{x=(rng()-.5)*780;z=(rng()-.5)*780;g=groundAt(x,z);tries++;}while((g<.4||hyp(x,z)<26||onPath(x,z)||SITES.some(s=>hyp(x-s.x,z-s.z)<9))&&tries<40);
  const s=.4+rng()*rng()*2.6;put(rocks,i,x,g+s*.2,z,s*(1+rng()*.5),s*.75,s,rng()*6,'#8f8c83',.8+rng()*.35);
  if(inYard(x,z)||(WORLD2&&inRange2(x,z))){dummy.scale.setScalar(0);dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix);continue;}
  if(s>1)addCollider(x,z,s*.95,g+s*.9);
 }
 scene.add(rocks);
}
const TILE=72, tufts=[], grass=new T.InstancedMesh(new T.ConeGeometry(.06,.34,3).translate(0,.17,0),material(GRADE?LOOK.tuft:'#71883f'),3600);   // graded: short and close to the ground's colour, so tall dark shapes are left to cover that matters
grass.frustumCulled=false;scene.add(grass);
if(GREY)for(const o of scene.children)if(o.isInstancedMesh)o.visible=false;   // grey: no trees, rocks or grass
for(let i=0;i<grass.count;i++)tufts.push([rng()*TILE,rng()*TILE,.6+rng()*1.1,rng()*6]);
let grassX=1e9,grassZ=1e9;
function updateGrass(px,pz){
 if(hyp(px-grassX,pz-grassZ)<3)return;grassX=px;grassZ=pz;
 for(let i=0;i<tufts.length;i++){
  const t=tufts[i],x=t[0]+TILE*Math.round((px-t[0])/TILE),z=t[1]+TILE*Math.round((pz-t[1])/TILE),g=groundAt(x,z);
  dummy.position.set(x,g,z);dummy.rotation.set(0,t[3],0);dummy.scale.setScalar(g<.5||onPath(x,z)||(WORLD2&&inRange2(x,z))?0:t[2]*(GRADE?LOOK.tuftSize:1));dummy.updateMatrix();grass.setMatrixAt(i,dummy.matrix);
 }
 grass.instanceMatrix.needsUpdate=true;
}

// ---------------------------------------------------------------- saved progress
const SAVE=RELEASE?'brackenford-trials-v1':'brackenford-seven-bells-v1';   // the release keeps its own progress, as its stages are in a different order
// ---- Replay pull (design/replay-plan.md, first-release pieces). One switch: "replay" in src/config.json, or ?replay=1 / ?replay=0.
//   1. The result of a stage says how far the score was from the next star, and by how much a best was beaten.
//   2. A playtest tally is kept on this device only (nothing is sent anywhere): tries, clears and retries by stage,
//      near misses and whether AGAIN followed, minutes played, the days played. "Copy playtest summary" puts it on the clipboard.
const REPLAY=QUERY.has('replay')?QUERY.get('replay')==='1':!!CONFIG.replay;
const STAR_AT=[.3,.6,.95];   // the share of a stage's ideal score each star asks for
const TALLY_KEY=SAVE+'-tally';
const tally=(()=>{let t={};try{t=JSON.parse(localStorage.getItem(TALLY_KEY)||'{}')||{};}catch{}return{days:t.days||[],stages:t.stages||{},near:t.near|0,nearAgain:t.nearAgain|0,seconds:t.seconds|0,sittings:t.sittings|0};})();
const tallyNow={begun:false,last:null};
function tallySave(){try{localStorage.setItem(TALLY_KEY,JSON.stringify(tally));}catch{}}
function tallyStage(name){return tally.stages[name]||(tally.stages[name]={tries:0,done:0,clears:0,again:0,stars:0});}
function tallyStart(name){
 if(!REPLAY)return;
 if(!tallyNow.begun){tallyNow.begun=true;tally.sittings++;const d=new Date().toISOString().slice(0,10);if(!tally.days.includes(d))tally.days.push(d);tally.days=tally.days.slice(-60);}
 const s=tallyStage(name),l=tallyNow.last;s.tries++;
 if(l&&l.name===name){if(l.stars)s.again++;if(l.near)tally.nearAgain++;}   // AGAIN after a clear; AGAIN after a near miss
 tallyNow.last=null;tallySave();
}
function tallyEnd(name,stars,near,seconds){
 if(!REPLAY)return;
 const s=tallyStage(name);s.done++;if(stars)s.clears++;s.stars=Math.max(s.stars,stars);if(near)tally.near++;tally.seconds+=Math.max(0,Math.round(seconds));
 tallyNow.last={name,stars,near};tallySave();
}
function playtest(){
 const st=Object.entries(tally.stages),sum=k=>st.reduce((a,[,s])=>a+s[k],0);
 return{build:CONFIG.title+(RELEASE?' release':' full'),days:tally.days.length,sittings:tally.sittings,minutes:Math.round(tally.seconds/6)/10,minutesPerSitting:tally.sittings?Math.round(tally.seconds/6/tally.sittings)/10:0,
  attempts:sum('tries'),finished:sum('done'),clears:sum('clears'),retriesAfterClear:sum('again'),nearMisses:tally.near,nearMissThenAgain:tally.nearAgain,
  stages:Object.fromEntries(st.map(([n,s])=>[n,{tries:s.tries,abandoned:s.tries-s.done,clears:s.clears,retriesAfterClear:s.again,bestStars:s.stars}]))};
}
const state={bells:new Set(),marks:new Set(),lanterns:new Set(),shots:0,longest:0,pos:null,done:false,lesson:0,coins:0,hand:'right',draw:'two',reach:'auto',mode:'range',range:{open:0,best:[],stars:[]}};
try{const s=JSON.parse(localStorage.getItem(SAVE)||'null');if(s){state.bells=new Set(s.bells);state.marks=new Set(s.marks);state.lanterns=new Set(s.lanterns);state.shots=s.shots|0;state.longest=s.longest|0;state.pos=s.pos;state.done=!!s.done;state.lesson=clamp(s.lesson|0,0,5);state.mode=s.mode==='roam'?'roam':'range';state.hand=s.hand==='left'?'left':'right';state.draw=s.draw==='one'?'one':'two';state.reach=s.reach==='short'||s.reach==='long'?s.reach:'auto';if(s.range)state.range={watchBest:s.range.watchBest|0,runs:s.range.runs|0,bell1:s.range.bell1?1:0,open:s.range.open|0,best:s.range.best||[],stars:s.range.stars||[],named:s.range.named&&typeof s.range.named==='object'?s.range.named:null};
 state.coins=typeof s.coins==='number'?Math.max(0,s.coins|0):state.range.stars.reduce((a,b)=>a+(b||0)*25,0)+Math.round(state.range.best.reduce((a,b)=>a+(b||0),0)/20);}}catch{}
function save(){try{rangeNames();localStorage.setItem(SAVE,JSON.stringify({bells:[...state.bells],marks:[...state.marks],lanterns:[...state.lanterns],shots:state.shots,longest:state.longest,pos:state.pos,done:state.done,lesson:state.lesson,coins:state.coins,hand:state.hand,draw:state.draw,reach:state.reach,mode:state.mode,range:state.range}));}catch{}}

// ---------------------------------------------------------------- hamlet, shrines, targets
const bronze='#ae783e', timber='#825435', cream='#e5c67e', red='#ae493d', stone='#9a968a', gold='#f0c75a';
const targets=[]; let hitMeshes=[];
function register(t,o){o.userData.target=t;t.meshes.push(o);hitMeshes.push(o);return o;}
function label(str,w=2.2){
 const c=document.createElement('canvas');c.width=1024;c.height=192;const g=c.getContext('2d');
 g.fillStyle='#273c34';g.fillRect(0,0,c.width,c.height);g.strokeStyle='#bcaa7a';g.lineWidth=8;g.strokeRect(10,10,1004,172);
 g.font='46px Georgia';g.textAlign='center';g.textBaseline='middle';g.fillStyle='#ffebbd';g.fillText(str,512,98);
 const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;
 return new T.Mesh(new T.PlaneGeometry(w,w*.1875),new T.MeshBasicMaterial({map:tex,side:T.DoubleSide}));
}
window.__oldFrom=scene.children.length;
for(const[x,z,s]of[[-15,7,1],[13,12,1.15],[-19,-9,.9],[1,20,1],[21,3,.95]]){
 const g=groundAt(x,z),hut=new T.Group();hut.position.set(x,g,z);scene.add(hut);
 mesh(hut,new T.CylinderGeometry(3*s,3.1*s,3.2,10),'#d9c59a',V(0,1.3,0));
 mesh(hut,new T.ConeGeometry(3.9*s,2.8,10),'#7a4f35',V(0,4.25,0));
 const a=Math.atan2(-x,-z);box(hut,V(Math.sin(a)*3*s,1,Math.cos(a)*3*s),V(1.1,2,.25),'#513c2b').rotation.y=a;
 addCollider(x,z,3.15*s,g+5);
}
{
 const g=groundAt(3.2,-7),b=label('Seven bells sleep in the vale  •  wake them',3.4);b.position.set(3.2,g+1.75,-7);b.rotation.y=-.35;scene.add(b);
 stick(scene,V(3.2,g,-7.05),V(3.2,g+1.5,-7.05),.07,timber);
}
function pennant(parent,x,y,color){
 const m=new T.MeshStandardMaterial({color,flatShading:true,roughness:.9,side:T.DoubleSide});
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute([0,0,0, 0,-.7,0, 0,-.35,1.5],3));geo.computeVertexNormals();
 const f=new T.Mesh(geo,m);f.position.set(x,y,0);parent.add(f);return f;
}
for(const s of SITES){
 const g=groundAt(s.x,s.z),root=new T.Group();root.position.set(s.x,g,s.z);root.rotation.y=Math.atan2(s.x,s.z);scene.add(root);
 let base=.3;
 if(s.tower){
  base=12.5;mesh(root,new T.CylinderGeometry(3.6,4.3,14.5,12),stone,V(0,5.25,0));
  for(let i=0;i<8;i++){const a=i*Math.PI/4;box(root,V(Math.cos(a)*3.3,13,Math.sin(a)*3.3),V(1.1,1,.7),'#878378').rotation.y=-a+Math.PI/2;}
  addCollider(s.x,s.z,4.3,g+12.5);
 }else{mesh(root,new T.CylinderGeometry(2.6,3.1,5,10),stone,V(0,-2.2,0));addCollider(s.x,s.z,2.9,g+.3);}
 for(const k of[-1,1])stick(root,V(k*1.15,base,0),V(k*1.15,base+3.7,0),.13,timber);
 stick(root,V(-1.5,base+3.7,0),V(1.5,base+3.7,0),.12,timber);
 const hang=new T.Group();hang.position.set(0,base+3.6,0);root.add(hang);
 const item={kind:'bell',site:s,name:s.name,root:hang,hit:state.bells.has(s.id),kick:-10,meshes:[]};targets.push(item);s.item=item;s.y=g;
 register(item,mesh(hang,new T.CylinderGeometry(.36,.64,1.2,16),bronze,V(0,-.6,0)));
 register(item,mesh(hang,new T.CylinderGeometry(.62,.9,.34,18),'#c99649',V(0,-1.28,0)));
 register(item,mesh(hang,new T.SphereGeometry(.2,10,8),'#734729',V(0,-1.56,0)));
 stick(root,V(2,base,0),V(2,base+8.5,0),.07,timber);
 item.flag=pennant(root,2,base+8.4,item.hit?gold:'#c9d8d2');
 item.beacon=new T.Mesh(new T.CylinderGeometry(.8,.8,190,10,1,true),new T.MeshBasicMaterial({color:0xffe2a0,transparent:true,opacity:.24,depthWrite:false,fog:false,side:T.DoubleSide}));
 item.beacon.position.set(0,base+95,0);item.beacon.visible=!item.hit;root.add(item.beacon);
}
function spaced(list,x,z,d){return list.every(p=>hyp(p.x-x,p.z-z)>d);}
const strawSpots=[{x:-8,z:-21},{x:-15,z:-33},{x:-5,z:-47}];
for(let n=0;n<6000&&strawSpots.length<24;n++){
 const x=(rng()-.5)*700,z=(rng()-.5)*700;
 if(hyp(x,z)>345||hyp(x,z)<60||groundAt(x,z)<1.5||slopeAt(x,z)>.3||!spaced(strawSpots,x,z,62)||!spaced(SITES,x,z,24)||pathDist(x,z)<6)continue;
 strawSpots.push({x,z});
}
strawSpots.forEach((p,idx)=>{
 const g=groundAt(p.x,p.z),root=new T.Group();root.position.set(p.x,g+1.5,p.z);root.rotation.y=Math.atan2(-p.x,-p.z)+(idx<3?0:(rng()-.5));scene.add(root);
 const face=new T.Group();face.scale.setScalar(1.2);root.add(face);
 const item={kind:'straw',idx,name:'Straw round',root:face,hit:state.marks.has(idx),kick:-10,meshes:[],x:p.x,z:p.z};targets.push(item);
 for(const[r,z,c]of[[.68,0,'#bf9959'],[.50,.038,red],[.37,.072,cream],[.23,.11,red],[.10,.15,cream]]){const o=mesh(face,new T.CylinderGeometry(r,r,.045,28),c,V(0,0,z));o.rotation.x=Math.PI/2;register(item,o);}
 for(const k of[-1,1])stick(root,V(k*.7,-1.9,.1),V(0,.3,-.06),.055,timber);stick(root,V(0,-1.9,-1),V(0,.3,-.06),.055,timber);
 stick(root,V(1.1,-1.9,0),V(1.1,2.6,0),.045,timber);item.flag=pennant(root,1.1,2.55,item.hit?gold:red);
});
const lanterns=[];
{
 const spots=[];
 for(let n=0;n<4000&&spots.length<10;n++){const x=(rng()-.5)*640,z=(rng()-.5)*640;if(hyp(x,z)>320||hyp(x,z)<55||groundAt(x,z)<1||!spaced(spots,x,z,85))continue;spots.push({x,z});}
 const paper=new T.MeshBasicMaterial({color:0xffb057}),geo=new T.CylinderGeometry(.5,.36,.8,8);
 spots.forEach((p,idx)=>{
  const root=new T.Group();scene.add(root);
  const item={kind:'lantern',idx,name:'Lantern',root,hit:state.lanterns.has(idx),kick:-10,meshes:[],cx:p.x,cz:p.z,r:5+rng()*9,h:groundAt(p.x,p.z)+8+rng()*9,speed:(rng()<.5?-1:1)*(.9+rng()*1.3),phase:rng()*6};item.speed/=item.r;
  mesh(root,geo,paper);box(root,V(0,-.52,0),V(.3,.16,.3),timber);
  if(item.hit)root.visible=false;else{const o=new T.Mesh(new T.SphereGeometry(.72,8,6),paper);o.visible=false;root.add(o);register(item,o);}
  targets.push(item);lanterns.push(item);
 });
}

// ---------------------------------------------------------------- training yard
// Five lessons beside the hamlet: three at the shooting line, then the climbing wall and tower.
const LESSON_NAMES=['First shots','Arrow drop','Moving mark','The climb','High shot'];
const drills={}, prog={count:0,done:new Set(),wall:false};
function drillRound(id,name,x,z,scale,yaw){
 const g=groundAt(x,z),h=.6+.7*scale,root=new T.Group();root.position.set(x,g+h,z);root.rotation.y=yaw;scene.add(root);
 const face=new T.Group();face.scale.setScalar(scale);root.add(face);
 const item={kind:'drill',id,name,root:face,base:root,hit:false,kick:-10,meshes:[],x,z,scale};targets.push(item);drills[id]=item;
 for(const[r,dz,c]of[[.68,0,'#bf9959'],[.50,.038,'#3d6f8e'],[.37,.072,cream],[.23,.11,'#3d6f8e'],[.10,.15,gold]]){const o=mesh(face,new T.CylinderGeometry(r,r,.045,28),c,V(0,0,dz));o.rotation.x=Math.PI/2;register(item,o);}
 return item;
}
function pegs(parent,x,cz,w,y0,y1,seed){   // pegs on a face that looks toward +x
 const r=mulberry(seed);
 for(let y=y0+.45;y<y1-.1;y+=.42)for(const k of[-1,0,1])box(parent,V(x+.06,y+(r()-.5)*.14,cz+k*w*.55+(r()-.5)*.3),V(.12,.07,.16),'#d8b25a');
}
let tower,wallTop;
const moverMid=yardAt(16,-7);
{
 const facing=(x,z)=>Math.atan2(YARD.x-x,YARD.z-z);
 for(const[id,name,along,right,scale]of[['near','Near round',10,-2,1.2],['d20','20 m round',20,4,1.2],['d40','40 m round',40,-3,1.6],['d70','Far round',70,6,2.4]]){
  const[x,z]=yardAt(along,right),t=drillRound(id,name,x,z,scale,facing(x,z)),h=.6+.7*scale;
  for(const k of[-1,1])stick(t.base,V(k*.7*scale/1.2,-h-.4,.1),V(0,.3,-.06),.055,timber);stick(t.base,V(0,-h-.4,-1),V(0,.3,-.06),.055,timber);
  stick(t.base,V(.95*scale,-h-.4,0),V(.95*scale,h+1.1,0),.045,timber);t.flag=pennant(t.base,.95*scale,h+1.05,'#c9d8d2');
 }
 // the sliding round hangs from a beam and runs back and forth across the line of sight
 const[mx,mz]=moverMid,gm=groundAt(mx,mz),mover=drillRound('mover','Sliding round',mx,mz,1.2,Math.atan2(-YARD.ux,-YARD.uz));mover.base.position.y=gm+1.5;
 stick(mover.base,V(0,.8,0),V(0,1.3,0),.04,timber);mover.flag=pennant(mover.base,0,1.3,'#c9d8d2');
 const ends=[yardAt(16,-11.5),yardAt(16,-2.5)];
 scene.add(yardBits);stick(yardBits,V(ends[0][0],gm+2.8,ends[0][1]),V(ends[1][0],gm+2.8,ends[1][1]),.07,timber);
 for(const[x,z]of ends)stick(yardBits,V(x,groundAt(x,z)-.4,z),V(x,gm+2.8,z),.08,timber);
 // the shooting line
 for(let b=-8;b<=8;b+=3.2){const[x,z]=yardAt(0,b),g=groundAt(x,z);stick(WORLD2?yardBits:scene,V(x,g-.3,z),V(x,g+.55,z),.06,timber);}
 // low climbing wall, pegged on the side that looks toward +x
 const gw=groundAt(-27,-17);box(scene,V(-27,gw+1,-17),V(1,4,3),stone);pegs(scene,-26.5,-17,1.5,gw,gw+3,11);
 wallTop={x:-27,z:-17,hx:.5,hz:1.5,top:gw+3};platforms.push(wallTop);
 panels.push({x:-26.5,z:-17,nx:1,nz:0,w:1.5,y0:gw,y1:gw+3,in:.5});
 for(const z of[-18,-17,-16])addCollider(-27,z,.5,gw+3);
 // climbing tower
 const tx=-33,tz=-14,gt=groundAt(tx,tz),H=7;
 box(scene,V(tx,gt+H/2-.6,tz),V(3,H+1,3),'#6f5238');box(scene,V(tx+1.55,gt+H/2,tz),V(.12,H,3.2),'#8a6a48');pegs(scene,tx+1.61,tz,1.6,gt,gt+H,23);
 for(const[a,b]of[[-1,-1],[1,-1],[-1,1],[1,1]])stick(scene,V(tx+a*1.6,gt-1,tz+b*1.6),V(tx+a*1.6,gt+H+(a<0?1.05:0),tz+b*1.6),.11,timber);
 box(scene,V(tx,gt+H-.1,tz),V(3.6,.2,3.6),'#a07c55');
 stick(scene,V(tx-1.6,gt+H+1,tz-1.6),V(tx-1.6,gt+H+1,tz+1.6),.05,timber);
 for(const b of[-1,1]){stick(scene,V(tx-1.6,gt+H+1,tz+b*1.6),V(tx+1.6,gt+H+1,tz+b*1.6),.05,timber);stick(scene,V(tx+1.6,gt+H,tz+b*1.6),V(tx+1.6,gt+H+1,tz+b*1.6),.05,timber);}
 const mast=new T.Group();mast.position.set(tx-1.6,gt+H,tz-1.6);scene.add(mast);stick(mast,V(0,0,0),V(0,3.2,0),.05,timber);pennant(mast,0,3.15,gold);
 tower={x:tx,z:tz,hx:1.8,hz:1.8,top:gt+H};platforms.push(tower);
 panels.push({x:tx+1.6,z:tz,nx:1,nz:0,w:1.6,y0:gt,y1:gt+H,in:.8});
 addCollider(tx,tz,1.7,gt+H);
}
// everything the old world put into the scene above (hamlet, bell shrines, straw rounds, drills, climbing wall and tower): hidden while shooting on Willowbank
const oldWorld=scene.children.slice(window.__oldFrom|0).filter(o=>o!==yardBits);let oldHidden=false;const oldWas=new Map();
function oldWorldShow(){const hide=(WORLD2&&range.on)||GREY;if(hide===oldHidden)return;oldHidden=hide;for(const o of oldWorld){if(hide){oldWas.set(o,o.visible);o.visible=false;}else if(oldWas.has(o))o.visible=oldWas.get(o);}}
// ---- the new range's lane, creek, terraces, rail, stall, footbridge and blossom trees (see WORLD2 above)
if(WORLD2){
 const R=new T.Group();R.position.set(YARD.x,LANE.base,YARD.z);R.rotation.y=Math.atan2(YARD.ux,YARD.uz);scene.add(R);scene.userData.range2=R;R.visible=!LAB;
 const P=(along,right,y=0)=>V(-right,y,along);   // a place given as metres along the lane, to the right, and up
 const LAWN=GRADE?LOOK.lawn:'#99B44E',EDGE='#8DA748',FACE=GRADE?LOOK.lawnFace:'#829B47',WATER='#5897BE',SAND='#B8A275',ROCK='#9a968c',BLOSSOM='#F299B5';   // ChatGPT's colours, set after it saw the first build
 // the lane: a lighter strip of mown grass from the line to the far end
 box(R,P((LANE.from+LANE.to)/2,0,.02),V(LANE.half*2,.04,LANE.to-LANE.from),LAWN);
 for(const s of[-1,1])for(let a=LANE.from,i=0;a<40;i++){const len=3+2.5*Math.abs(Math.sin(i*1.7+s)),wide=.7+.6*Math.abs(Math.sin(i*2.9+s*2));box(R,P(a+len/2,s*(LANE.half+wide/2),.015),V(wide,.03,len),EDGE);a+=len;}   // a broken shoulder about a metre wide, so the lawn does not end in a ruled line
 // the creek: a flat band of water with sandy banks and a few stones, crossing at 38 m
 box(R,P(LANE.creek,5.5,.05),V(63,.06,2.4),WATER);   // 2.4 m of water, from the cove on the left to past 36 m on the right
 for(const[a,r,k]of[[37.6,36.5,.9],[38.9,37.3,.7],[38.2,38.4,1.1]]){const m=mesh(R,new T.DodecahedronGeometry(k,0),ROCK,P(a,r,k*.45));m.rotation.set(a,r,0);}   // the rocks it rises among
 for(const s of[-1,1])for(let r=-27,i=0;r<27;i++){const len=1.5+2.5*Math.abs(Math.sin(i*2.3+s)),wide=.3+.3*Math.abs(Math.sin(i*1.3+s*3));if(i%4!==3)box(R,P(LANE.creek+s*(1.2+wide/2),r+len/2,.04),V(len,.05,wide),SAND);r+=len;}   // uneven patches of sand, 0.3 to 0.6 m wide, with gaps
 for(const[a,r,k]of[[36.4,-10.5,.5],[39.8,-13,.7],[36.2,10,.6],[39.9,12.2,.45],[36.5,-20,.8],[39.6,21,.7],[36.3,-25.5,.6],[39.7,25,.55]]){const m=mesh(R,new T.DodecahedronGeometry(k,0),ROCK,P(a,r,k*.4));m.rotation.set(a,r,0);m.scale.y=.7;}
 // the terraces: each a solid step across the lane, lighter on top and darker on its face
 let low=0;for(const[at,up]of LANE.steps){const len=LANE.to-at,tall=up-low;box(R,P(at+len/2,0,low+tall/2),V(16,tall,len),LAWN);box(R,P(at-.02,0,low+tall/2),V(16,tall,.06),FACE);
  for(const s of[-1,1]){const run=2.4*(up/.7),m=box(R,P(at+len/2,s*(8+run/2-.05),up/2-.02),V(Math.hypot(run,up),.06,len),EDGE);m.rotation.z=s*Math.atan2(up,run);m.position.y=up/2;}   // each end falls away to the meadow as a grass bank
  low=up;}
 {const m=box(R,P(78.4,0,1.4),V(16,.06,5.6),EDGE);m.rotation.x=Math.atan2(2.8,4.8);}   // the last terrace falls away behind as a grass bank
 // the rail at the shooting line, 0.85 m high as a starting height
 {const rail=PROPS.rail(T,{height:.85});rail.position.copy(P(.9,0));R.add(rail);}   // Gemini's rail
 // the stall, left of the line and outside the lane (world-plan: -1.5 along, 10.5 left), its counter turned toward the archer
 if(typeof PROPS!=='undefined'){const stall=PROPS.marketStall(T);stall.position.copy(P(-1.5,-10.5));stall.rotation.y=Math.PI/2+.3;R.add(stall);}
 // the archer's stand: a timber deck, flush with the ground for now (raising it over a channel changes the aim, so it waits for the playtest)
 {const deck=PROPS.deck(T);deck.position.copy(P(-.35,0));R.add(deck);}   // Gemini's deck
 // the path from the stall to the jetty, and the jetty itself at the lake's edge
 for(let i=0;i<9;i++){const t=i/8,a=-1.5+t*15.5,r=-8.6-6*t*t;const m=box(R,P(a,r,.02),V(1.6,.03,2.3),'#b9a070');m.rotation.y=-Math.atan2(-12*t*6/8,15.5/8)*.5;}
 {const j=PROPS.jetty(T);j.position.copy(P(14,-19.5,-.4));j.rotation.y=Math.PI/2;R.add(j);}   // Gemini's jetty, running out into the cove
 // the village on its rise at the far right: three round huts and the watchtower (world-plan: 82 to 98 m out, 18 to 38 m right)
 [[84,25,1,0],[90,31,1.15,1],[95,26,.95,2]].forEach(([a,r,k,variant])=>{const h=PROPS.hut(T,{variant}),p=P(a,r),[wx,wz]=yardAt(a,r);p.y=groundAt(wx,wz)-LANE.base;h.position.copy(p);h.scale.setScalar(k);h.rotation.y=Math.PI;R.add(h);});   // Gemini's huts, doors toward the archer
 {const t=PROPS.watchtower(T),p=P(88,29),[wx,wz]=yardAt(88,29);p.y=groundAt(wx,wz)-LANE.base;t.position.copy(p);R.add(t);}   // Gemini's watchtower
 // the footbridge over the creek, to the right of the lane and clear of it
 {const b=PROPS.footbridge(T);b.position.copy(P(LANE.creek,13.5));R.add(b);}   // Gemini's footbridge, its length across the creek
 // two blossom trees, one each side in the middle distance, well clear of the lane and never behind a target
 for(const[a,r,s]of[[31,-13.5,1],[46,21.5,1.15]]){const t=PROPS.blossomTree(T,{scale:s});t.position.copy(P(a,r));t.rotation.y=a;R.add(t);}   // Gemini's blossom trees
}
// the trainer's board beside the shooting line
// with the new layout the board is a cream cloth banner with a plum border and plum lettering (cloth is for what is read)
// ---- stage 3 on Willowbank: what the lighting pass adds to the range itself
// ---- the mechanics lab's floor: a pale lane, a dark line every 5 m (a heavier one every 10 m), and a pair of posts
// at 10, 20, 30 and 40 m that are 1, 2, 3 and 4 m tall, so distance can be read at a glance
if(LAB){
 const G=new T.Group(),P=(along,right,y=0)=>V(-right,y,along);G.position.set(YARD.x,LANE.base,YARD.z);G.rotation.y=Math.atan2(YARD.ux,YARD.uz);scene.add(G);
 box(G,P(20,0,.01),V(16,.02,48),'#b4b7ba');box(G,P(0,0,.03),V(3,.02,.12),'#22262a');
 for(let a=5;a<=40;a+=5){box(G,P(a,0,.025),V(16,.012,a%10?.04:.1),'#5b5f63');if(a%10===0)for(const s of[-1,1])box(G,P(a,s*8.3,a/20),V(.12,a/10,.12),'#5b5f63');}
}
// the skeleton's range: every shape on it in a grey of the same lightness as its colour, so steps and banks still read
if(GREY&&!LAB){
 const greys=new Map(),grey=c=>{const k=Math.round((c.r*.3+c.g*.59+c.b*.11)*20);if(!greys.has(k))greys.set(k,new T.MeshStandardMaterial({color:new T.Color().setScalar(.25+k/20*.6),flatShading:true,roughness:1}));return greys.get(k);};
 scene.userData.range2.traverse(o=>{if(o.isMesh&&o.material&&o.material.color)o.material=grey(o.material.color);});
}
function labStart(){if(!range.on)setMode('range');if(replay.on)endReplay();setStage(-2);}
// how far the aim moved in the last moments before the arrow left: the worst angle, in degrees, between the direction
// it was loosed along and where it pointed 60 to 200 ms earlier. Only a headset draw has it.
function labShake(dir){let worst=null;for(const[t,d]of lab.aims){const age=elapsed-t;if(age<.06||age>.2)continue;const a=d.angleTo(dir)*180/Math.PI;if(worst===null||a>worst)worst=a;}return worst;}
// how far what was sent differs from where the aim had settled 120 to 200 ms before the release
function labErr(dir){const v=V();let n=0;for(const[t,d]of lab.aims){const age=elapsed-t;if(age>=.12&&age<=.2){v.add(d);n++;}}return n?v.normalize().angleTo(dir)*180/Math.PI:null;}
function labText(k){
 const s=lab.shot,p=lab.pad&&elapsed-lab.pad.at<3?lab.pad:null;
 if(k===0)return s?'Draw '+Math.round(s.power*100)+'%'+(s.draw?'  '+Math.round(s.draw*100)+' cm':'')+'      Speed '+s.speed.toFixed(1)+' m/s      Up '+s.elev.toFixed(1)+'°'+(s.shake!==null?'      Shake '+s.shake.toFixed(1)+'°'+(s.sent!=null?' (sent '+s.sent.toFixed(1)+'°)':''):'')+(BOW3?'      fun bow':BOW2?'      v2':''):'Loose an arrow  ·  the board shows what it did';
 return(s&&s.result?s.result:'Targets at 10, 20 and 30 m')+(p?'      '+p.hand+' '+p.button+': '+p.action:'');
}
// ---- Meta Quest face buttons, by name. In the browser a Touch controller reports: 0 trigger, 1 grip, 3 thumbstick
// click, 4 the lower face button (A on the right, X on the left), 5 the upper one (B on the right, Y on the left).
// The menu button on the left and the Meta button on the right are kept by the headset and never reach a web page.
// Jobs go by what the hand is doing, not by left or right, so a left-handed archer gets the same layout mirrored
// (Gemini's settled map, design/arrow-mechanics-v2.md section 8):
//   string hand   lower: start again (a second press within 1.2 s while playing)   upper: next stage, on the result
//                 stick: turn in 30 degree steps        stick pressed: two-handed or single-handed draw
//   bow hand      lower: next special arrow             upper: open or close the menu
//                 stick: walk, off the range only       stick held 0.6 s: face down the lane again (a tap: run, off the range)
const PAD_NAMES={left:['X','Y'],right:['A','B']},PAD_MAP={string:['again','next'],bow:['arrow','menu']};
function padStep(h,gp){
 const side=h.source.handedness,role=h===bowHand?'bow':'string';
 for(let k=0;k<2;k++){const down=!!gp.buttons[4+k]?.pressed,was=!!h['pad'+k];h['pad'+k]=down;if(down&&!was)padDo(PAD_MAP[role][k],side,(PAD_NAMES[side]||[])[k]||'button '+(4+k),h);}
}
// the thumbsticks under the settled map: by bow hand and string hand, not by left and right
function padSticks(h,sx,sy,click,dt,eye,off){
 if(h===bowHand){
  if(click){if(!h.clickAt)h.clickAt=elapsed;if(!h.centred&&!charging&&elapsed-h.clickAt>=.6){h.centred=true;recentre();buzz(h,.35,30);say('Facing down the lane',2);lab.pad={hand:h.source.handedness,button:'stick',action:'centre',at:elapsed};}}
  else{if(h.clickAt&&!h.centred&&!range.on)running=!running;h.clickAt=0;h.centred=false;}
  const mag=hyp(sx,sy);
  if(mag>.18&&!range.on){   // walking is for off the range; on it the stick does nothing, so it cannot skip a stage by accident
   const yaw=headYaw(),sp=(running?7.5:3.6)*Math.min(1,mag)*(charging?.5:1)*(groundAt(eye.x,eye.z)<-.4?.5:1)*dt/mag,s=Math.sin(yaw),c=Math.cos(yaw);
   const[nx,nz]=tryMove(eye.x+(s*sy+c*sx)*sp,eye.z+(c*sy-s*sx)*sp,rig.position.y-off);walked(hyp(nx-eye.x,nz-eye.z));
   rig.position.x+=nx-eye.x;rig.position.z+=nz-eye.z;eye.x=nx;eye.z=nz;
  }else running=running&&mag>.05;
 }else{
  if(click&&!h.ran&&!charging){setDraw(state.draw==='one'?'two':'one');say(state.draw==='one'?'Single-handed draw  ·  hold a trigger':'Two-handed draw  ·  free hand to the string',3);buzz(h,.25,20);lab.pad={hand:h.source.handedness,button:'stick',action:'draw',at:elapsed};}h.ran=click;
  if(Math.abs(sx)>.65&&!h.turned&&!charging&&!range.on){   // on the range the world stays put: turn your body, or hold the bow stick to face down the lane
   const a=-Math.sign(sx)*Math.PI/6,ox=rig.position.x-eye.x,oz=rig.position.z-eye.z,s=Math.sin(a),c=Math.cos(a);
   rig.rotation.y+=a;rig.position.x=eye.x+ox*c+oz*s;rig.position.z=eye.z-ox*s+oz*c;h.turned=true;
  }else if(Math.abs(sx)<.3)h.turned=false;
 }
}
// turn so the head faces straight down the lane, and on the range step back onto the shooting line
function recentre(){
 const eye=head().getWorldPosition(V()),a=Math.atan2(-YARD.ux,-YARD.uz)-headYaw(),ox=rig.position.x-eye.x,oz=rig.position.z-eye.z,s=Math.sin(a),c=Math.cos(a);
 rig.rotation.y+=a;rig.position.x=eye.x+ox*c+oz*s;rig.position.z=eye.z-ox*s+oz*c;rig.updateMatrixWorld(true);
 if(range.on){const e=head().getWorldPosition(V());rig.position.x+=YARD.x-e.x;rig.position.z+=YARD.z-e.z;rig.updateMatrixWorld(true);}
}
function padDo(action,side,button,h){
 let said='';
 if(action==='again'){if(range.on&&!charging){
  const st=STAGES[range.stage],mid=range.phase==='play'&&!st.lab&&(range.fired>0||st.watch);
  if(mid&&!(lab.againAt&&elapsed-lab.againAt<=1.2)){lab.againAt=elapsed;said='Press again to start over';}   // a stray thumb never throws away a run
  else{lab.againAt=0;if(replay.on)endReplay();if(st.watch)watchStart();else setStage(range.stage);said='Started again';}}}
 else if(action==='next'){if(range.on&&range.phase==='results'&&rangeSigns.next.base.visible){range.pending='next';said='Next stage';}else said=range.on&&range.phase==='results'?'No next stage yet':'Next stage opens on the result';}
 else if(action==='arrow'){if(ARROWS&&range.on&&!charging){quiverStep(1);said='Arrow  ·  '+quiver.kind;}else said='No special arrows here';}
 else if(action==='menu'){if(VRMENU){if(vrMenu.open)vrMenuClose();else vrMenuOpen();said=vrMenu.open?'Menu':'Menu closed';}else said='The headset menu is switched off';}
 lab.pad={hand:side,button,action,at:elapsed};if(said)say(said,2.5);buzz(h,.25,20);
}
if(GRADE&&WORLD2){
 const R=scene.userData.range2,P=(along,right,y=0)=>V(-right,y,along),r=mulberry(77);
 // two rows of low hills between the village and the valley's rim, so the skyline is three overlapping ridges
 // (near green, middle plum, the rim itself the lightest). Real shapes, so they shift against each other as the head moves.
 const hills=new T.Group();scene.add(hills);
 LOOK.ridges.forEach(([dist,tall,wide,n],row)=>{for(let i=0;i<n;i++){
  // ChatGPT's two moves: the middle hill straight behind the lane goes 30 m left, clear of the far targets; the near hill behind the village is a quarter lower, so the tower roof breaks the skyline
  const deg=-80+160*(i+.5)/n+(r()-.5)*8,a=deg*Math.PI/180,aside=row===1&&Math.abs(deg)<9?30:0,low=row===0&&deg>6&&deg<30?.75:1;
  const d=dist*(1+(r()-.5)*.12),x=YARD.x+(YARD.ux*Math.cos(a)+YARD.rx*Math.sin(a))*d-YARD.rx*aside,z=YARD.z+(YARD.uz*Math.cos(a)+YARD.rz*Math.sin(a))*d-YARD.rz*aside,g=groundAt(x,z);
  if(g<.6)continue;   // not out in the lake
  for(let k=0;k<2;k++){const m=mesh(hills,new T.IcosahedronGeometry(1,1),row?LOOK.hillMid:LOOK.hillNear,V(x+(r()-.5)*wide*.7,g-tall*.2,z+(r()-.5)*wide*.7));m.scale.set(wide*(.7+r()*.5),tall*low*(.75+r()*.5),wide*(.55+r()*.4));m.rotation.y=r()*3;}
 }});
 // broken pale glints on the water along the creek's far bank, the one that faces the sun and the archer
 for(let rt=-26,i=0;rt<36;i++){const len=.6+1.6*Math.abs(Math.sin(i*2.1)),wide=.1+.1*Math.abs(Math.sin(i*1.7));if(i%3!==2)box(R,P(LANE.creek+1.05-wide/2,rt+len/2,.085),V(len,.012,wide),LOOK.glint);rt+=len+.5+1.2*Math.abs(Math.sin(i*.9));}
 shaded(R);
}
const BOARD=WORLD2?{cloth:'#f6e6bd',edge:'#4A2943',text:'#4A2943',mark:'#6D3362'}:{cloth:'#273c34',edge:'#bcaa7a',text:'#ffebbd',mark:'#f0c75a'};   // mark: the wind and best-score line (gold on the old board; plum on cloth, where gold is kept for rewards)
const board=(()=>{
 const c=document.createElement('canvas');c.width=1024;c.height=640;const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;
 const[bx,bz]=yardAt(WORLD2?12.5:11,WORLD2?11.2:6.5),g=groundAt(bx,bz),m=new T.Mesh(new T.PlaneGeometry(4.8,3),new T.MeshBasicMaterial({map:tex}));if(WORLD2)m.scale.setScalar(.75);   // Willowbank: 3.6 m wide, 42 degrees to the right
 m.position.set(bx,g+2.6,bz);m.rotation.y=Math.atan2(YARD.x-bx,YARD.z-bz);scene.add(m);
 for(const k of[-1,1]){const half=WORLD2?1.85:2.35,px=bx+k*half*Math.cos(m.rotation.y),pz=bz-k*half*Math.sin(m.rotation.y);stick(scene,V(px,g-.3,pz),V(px,g+(WORLD2?3.85:4.15),pz),.06,timber);}
 let shown='';
 return{set(key,info){
  if(key===shown)return;shown=key;const x=c.getContext('2d');
  x.fillStyle=BOARD.cloth;x.fillRect(0,0,1024,640);x.strokeStyle=BOARD.edge;x.lineWidth=10;x.strokeRect(14,14,996,612);
  x.textAlign='center';x.textBaseline='middle';x.fillStyle=BOARD.edge;x.font='40px Georgia';x.fillText(range.on?'THE RANGE':'TRAINING YARD',512,70);
  x.fillStyle=BOARD.text;x.font='64px Georgia';x.fillText(info.title,512,160,960);
  x.font='52px Georgia';const words=info.text.split(' ');let line='',y=265;
  for(const w of words){if(x.measureText(line+' '+w).width>900&&line){x.fillText(line,512,y);y+=68;line=w;}else line=line?line+' '+w:w;}
  x.fillText(line,512,y);
  if(info.mark){x.fillStyle=BOARD.mark;x.font='52px Georgia';x.fillText(info.mark,512,560,960);}
  tex.needsUpdate=true;
 }};
})();
function lessonInfo(){
 const n=state.lesson,vr=xrOn(),bare=vr&&hands.some(h=>h.source?.hand);
 if(n>=5)return{title:'Training complete',text:'The yard is yours to practise in. The bells of the vale are waiting.',mark:''};
 const how=vr?(bare?'Close a fist on the pegs':'Hold a grip on the pegs')+' and pull yourself up, hand over hand. Get your head above the top, then let go.':'Walk into the pegged wall and hold W to climb. Space lets go.';
 const all=[
  ['Stand at the posts and hit the near round three times.',prog.count+' of 3'],
  ['Arrows fall as they fly. Hit the rounds at 20, 40 and 70 m, aiming higher for each.',prog.done.size+' of 3'],
  ['Hit the sliding round three times. Aim where it is going.',prog.count+' of 3'],
  [how+' Climb the low wall, then the tower.',prog.wall?'Wall done  ·  now the tower':'Start with the low wall'],
  ['Stay on the tower and hit the far round from up there.','']][n];
 return{title:'Lesson '+(n+1)+' of 5  ·  '+LESSON_NAMES[n],text:all[0],mark:all[1]};
}
function flagDrills(){
 const active=[['near'],['d20','d40','d70'],['mover'],[],['d70']][state.lesson]||[];
 for(const id in drills)drills[id].flag.material.color.set(state.lesson===1&&prog.done.has(id)?gold:active.includes(id)?red:'#c9d8d2');
}
function lessonDone(){
 state.lesson++;prog.count=0;prog.done.clear();prog.wall=false;
 [523,659,784].forEach((f,i)=>note(f,.5,'sine',.1,i*.12));
 if(state.lesson>=5){say('Training complete  ·  the vale is yours',6);bellSound(784,.5,.6);}
 else say('Lesson '+(state.lesson+1)+'  ·  '+LESSON_NAMES[state.lesson],5);
 flagDrills();refresh();save();
}
function drillHit(t,q,dist){
 const n=state.lesson;
 if(n===0&&t.id==='near'){if(++prog.count>=3)lessonDone();else say('Near round  ·  '+prog.count+' of 3',2.5);}
 else if(n===1&&t.id.startsWith('d')){
  const fresh=!prog.done.has(t.id);prog.done.add(t.id);flagDrills();
  if(prog.done.size>=3)lessonDone();else say(t.name+'  ·  '+(fresh?prog.done.size+' of 3':'already hit'),2.5);
 }
 else if(n===2&&t.id==='mover'){if(++prog.count>=3)lessonDone();else say('Sliding round  ·  '+prog.count+' of 3',2.5);}
 else if(n===4&&t.id==='d70'){
  if(q.origin.y>tower.top+.5&&hyp(q.origin.x-tower.x,q.origin.z-tower.z)<3.2)lessonDone();else say('Take that shot from the top of the tower',3);
 }
 else say(t.name+'  ·  '+dist+' m',2);
}
const onTop=(p,x,z,y)=>Math.abs(x-p.x)<=p.hx&&Math.abs(z-p.z)<=p.hz&&y>=p.top-.25;
function trainingStep(x,z,y){
 if(range.on)return;
 const slide=Math.sin(elapsed*.9)*3.5;drills.mover.base.position.x=moverMid[0]+YARD.rx*slide;drills.mover.base.position.z=moverMid[1]+YARD.rz*slide;
 if(state.lesson===3){
  if(onTop(tower,x,z,y))lessonDone();
  else if(!prog.wall&&onTop(wallTop,x,z,y)){prog.wall=true;say('Now the tower',3);note(659,.4,'sine',.1);}
 }
 const vr=xrOn(),info=lessonInfo();
 board.set(state.lesson+'|'+prog.count+'|'+prog.done.size+'|'+prog.wall+'|'+info.text.length,info);
}

// ---------------------------------------------------------------- the range
// Stand at the line and shoot: twenty short stages of distance, wind and moving marks. No walking.
// A mark is [metres down the lane, metres to the right, size, slide, pop];
// slide is [metres each way, speed], pop is [seconds up, seconds down, offset]. Wind is [steady, gust], positive blowing to the right.
const ALL_STAGES=[
 {name:'First marks',arrows:5,marks:[[10,0,1.2]]},
 {name:'Stepping back',arrows:6,marks:[[15,-2.5,1.2],[20,2.5,1.2]]},
 {name:'The drop',arrows:6,marks:[[30,0,1.4]]},
 {name:'Three ranges',arrows:6,marks:[[15,-4,1.1],[30,0,1.4],[45,4,1.8]]},
 {name:'The long lane',arrows:6,marks:[[60,0,2.4]]},
 {name:'A breeze',arrows:6,wind:[3,0],marks:[[20,0,1.2]]},
 {name:'Crosswind',arrows:6,wind:[-5,0],marks:[[30,0,1.5]]},
 {name:'Sliding mark',arrows:6,marks:[[15,0,1.2,[3,.9]]]},
 {name:'Slide and breeze',arrows:6,wind:[3,0],marks:[[25,0,1.4,[3.5,.8]]]},
 {name:'Pop-ups',arrows:8,marks:[[14,-4,1.1,0,[3,2,0]],[18,0,1.2,0,[3,2,1.7]],[22,4,1.3,0,[3,2,3.3]]]},
 {name:'Far and small',arrows:6,marks:[[40,0,1.1]]},
 {name:'Gusts',arrows:6,wind:[0,6],marks:[[35,0,1.6]]},
 {name:'Quick marks',arrows:8,marks:[[12,-3,1,0,[1.8,1.6,0]],[16,3,1,0,[1.8,1.6,1.1]],[20,0,1.1,0,[1.8,1.6,2.2]]]},
 {name:'Crossing pair',arrows:8,marks:[[18,0,1.2,[3.5,1]],[26,0,1.4,[4,-.8]]]},
 {name:'Long wind',arrows:6,wind:[5,0],marks:[[60,0,2.4]]},
 {name:'The gauntlet',arrows:9,wind:[2,0],marks:[[15,-4.5,1.1],[24,0,1.3,[3,.9]],[32,4,1.5,0,[2.5,2,0]]]},
 {name:'Small bull',arrows:6,marks:[[20,0,.65]]},
 {name:'Storm lane',arrows:7,wind:[2,7],marks:[[45,0,1.9]]},
 {name:'Far slider',arrows:7,marks:[[50,0,2.1,[4,.6]]]},
 {name:'Master of the line',arrows:8,wind:[-3,5],marks:[[70,0,2.6,[4,.5]],[35,-5,1.3,0,[2.5,2,0]]]},
 // Chapter 2, The Blight. Shades have crept into the vale: hare-shaped things of dark thorn and ember, wrapped in violet smoke. An arrow banishes one.
 // A spirit is {t:'sit'|'hide'|'creep'|'run', at:[along,right] or path:[[along,right],...], back:seconds until a startled one returns (none: it is gone)}.
 {name:'First shade',chapter:'The Blight',arrows:5,marks:[],spirits:[{t:'sit',at:[14,0],alt:[17,3],back:4}]},
 {name:'The warren',arrows:7,marks:[],spirits:[{t:'sit',at:[12,-3],alt:[14,-5],back:6},{t:'sit',at:[18,2],alt:[20,4.5],back:6},{t:'sit',at:[24,-1.5],alt:[26,-4],back:6},{t:'sit',at:[30,4],alt:[32,1.5],back:6}]},
 {name:'Horns in the grass',arrows:7,marks:[],spirits:[{t:'hide',at:[13,-3.5]},{t:'hide',at:[19,1.5]},{t:'hide',at:[25,4.5]}],grass:[[16,-1],[22,-4],[28,1]]},
 {name:'Creepers',arrows:8,marks:[],spirits:[{t:'creep',path:[[15,-5.5],[15,0],[15,5.5]]},{t:'creep',path:[[23,5],[23,.5],[23,-4.5]]}],grass:[[15,-5.5],[15,0],[15,5.5],[23,5],[23,.5],[23,-4.5]]},
 {name:'Bolt',arrows:9,marks:[],spirits:[{t:'run',area:[13,19,-7,7]},{t:'run',area:[20,28,-7,7]},{t:'run',area:[12,24,-6,6]}]},
 // Winged shades. perch: sits on a post at [along, right, height]; a near miss sends it off, and with back it returns.
 // flush: lurks in a bush until an arrow lands close by, or it loses patience, then bursts out and climbs away. cross: flies back and forth over its lane.
 {name:'On the post',arrows:7,marks:[],spirits:[{t:'perch',at:[14,-4,2.2],back:5},{t:'perch',at:[20,2.5,2.9],back:5},{t:'perch',at:[27,5,3.5],back:5}]},
 {name:'Flush',arrows:8,marks:[],spirits:[{t:'flush',at:[13,-4]},{t:'flush',at:[18,3.5]},{t:'flush',at:[24,-1]}]},
 {name:'Flight line',arrows:10,wind:[3,0],marks:[],spirits:[{t:'cross',lane:15},{t:'cross',lane:21},{t:'cross',lane:27}]},
 {name:'Blighted meadow',arrows:10,marks:[],spirits:[{t:'sit',at:[13,-4],alt:[15,-6],back:5},{t:'hide',at:[19,4]},{t:'run',area:[20,27,-6,6]},{t:'perch',at:[16,1,2.6],back:5},{t:'cross',lane:24}]}];
// The release plays a chosen few of these in its own order (stage numbers, from one); every stage stays here, none is deleted.
if(BOW2&&!BOW3)for(const s of ALL_STAGES){   // design/bow2-audit.md (the fun bow needs none: design/fun-bow.md section 3): the same drift as before under real gravity and air
 if(s.name==='Long wind')s.wind=[4.5,0];
 if(s.name==='Storm lane')s.wind=[2,6];
 if(s.name==='Master of the line'){s.wind=[-3,4];s.marks[0][3]=[4,.45];}
}
const STAGES=RELEASE&&CONFIG.order.length?CONFIG.order.map(n=>ALL_STAGES[n-1]):ALL_STAGES;
// ---- Bell Watch: the main game, first playable. One switch: "watch" in src/config.json, or ?watch=1 / ?watch=0.
//   Three minutes on the range with arrows that never run out. Shades keep coming: when one is banished another
//   takes its place a moment later, somewhere else. No stars, no failing; one score to beat, kept apart from the
//   stages. It is not one of the stages: it lives at STAGES[-1], which no list, count or save of the stages ever sees.
//   Not yet in it: shades that make for the bell and bind it, waves that grow, and the per-place arenas.
const WATCH=QUERY.has('watch')?QUERY.get('watch')==='1':!!CONFIG.watch;
const WATCH_RULE={seconds:180,again:[1.2,2.8]};   // length of a run; how long before a banished shade's place is filled
const watchRand=(a,b)=>a+Math.random()*(b-a);
// Shades come for the bell. Most hares set out from somewhere in the lane and make for the foot of the belfry, running
// or creeping. One that arrives snaps a thorn band onto the bell (three at most) and is gone; another sets out in its
// place. An arrow into the bell rings it, throws every band off and scatters the hares close to it. Binding costs the
// player nothing; a bell that is unbound when the run ends rings out for a bonus. Crows do not go for the bell yet.
const WATCH_BELL={share:.65,reach:1.3,scatter:9,bonus:100,quiet:10};   // share of hares that go for the bell; arrival and scatter distances in metres; end bonus; seconds at the end with no new shades
const watchFoot=()=>[PEAL_AT[0]-.4,PEAL_AT[1]+(PEAL_AT[1]<0?1.3:-1.3)];   // the lane-side foot of the belfry, in lane metres
const watchGoing=()=>PEAL&&!!peal.root;
// where and how the next hare or winged shade appears
function watchCfg(bird,k){
 if(bird)return{t:'cross',lane:Math.round(watchRand(15,27))};   // a winged one crosses; the one perched at the start keeps its post
 if(watchGoing()&&Math.random()<WATCH_BELL.share){const from=[Math.round(watchRand(11,30)),+watchRand(-6,6).toFixed(1)];return{t:Math.random()<.55?'run':'creep',path:[from,watchFoot()],toBell:true};}
 const kind=Math.random();
 if(kind<.45)return{t:'sit',at:[Math.round(watchRand(11,30)),+watchRand(-6,6).toFixed(1)]};
 if(kind<.8)return{t:'run',area:[12,28,-6.5,6.5]};
 const a=Math.round(watchRand(13,26)),s=Math.random()<.5?-1:1;return{t:'creep',path:[[a,-5.5*s],[a,0],[a,5.5*s]]};
}
function watchStage(){
 const spirits=[];for(let k=0;k<4;k++)spirits.push(watchCfg(false,k));for(let k=0;k<3;k++)spirits.push(k===0?{t:'perch',at:[18,3,3]}:watchCfg(true,k));
 return{name:'Bell Watch',watch:true,arrows:9999,marks:[],spirits};
}
function watchStart(){if(!WATCH)return;if(!range.on)setMode('range');if(replay.on)endReplay();setStage(-1);}
function watchStep(dt){
 if(!range.on||range.phase!=='play'||!STAGES[range.stage].watch)return;
 const left=(range.endAt||0)-elapsed;
 if(watchGoing()){const[fx,fz]=yardAt(...watchFoot());
  for(const sp of spirits){
   if(!sp.cfg||!sp.cfg.toBell||!sp.live||!sp.base.visible)continue;
   if(hyp(sp.base.position.x-fx,sp.base.position.z-fz)<WATCH_BELL.reach){   // it has reached the bell
    const b=peal.root,n=Math.min(3,(b.userData.bound|0)+1);b.userData.bind(n);range.bound=(range.bound|0)+1;
    b.userData.bell.getWorldPosition(peal.at);burst(peal.at,'#4A2943',8,.7);note(147,.3,'triangle',.12,0,110);
    sp.live=false;sp.base.visible=false;sp.state='off';sp.due=0;rangeTargets();
   }
  }}
 if(left<WATCH_BELL.quiet)return;   // the last seconds: nothing new sets out
 if(ram&&watchGoing()&&ram.state==='off'&&left>RAM_RULE.least){   // one ram at a time, and none so late that it could not arrive
  if(!ram.due)ram.due=elapsed+watchRand(...RAM_RULE.again);
  if(elapsed>=ram.due){ram.due=0;ramSet();}
 }
 for(const sp of spirits){
  if(!sp.cfg||sp.state!=='off')continue;
  if(!sp.due)sp.due=elapsed+watchRand(WATCH_RULE.again[0],WATCH_RULE.again[1]);
  if(elapsed>=sp.due){sp.due=0;const c=sp.cfg.t==='perch'?sp.cfg:watchCfg(!!sp.bird);sp.cfg=c;sp.set(sp,c);rangeTargets();}
 }
}
// ---- Ribbons: one second goal on every stage, earned on a run that also clears it (design/small-specs.md).
// One switch: "ribbons" in src/config.json, or ?ribbons=1 / ?ribbons=0. Off: nothing is counted, shown or saved.
//   clean: every arrow loosed hit, and on a shade stage every shade was banished
//   dead N: N hits made with a perfect release        swift T: every shade banished within T seconds
//   pure: cleared without a special arrow; only exists while special arrows are switched on
const RIBBONS=QUERY.has('ribbons')?QUERY.get('ribbons')==='1':!!CONFIG.ribbons;
const RIBBON={'First marks':['clean'],'Stepping back':['dead',3],'The drop':['clean'],'Three ranges':['dead',3],'The long lane':['clean'],'A breeze':['clean'],'Crosswind':['pure'],'Sliding mark':['dead',3],
 'Slide and breeze':['pure'],'Pop-ups':['pure'],'Far and small':['dead',3],'Gusts':['dead',3],'Quick marks':['pure'],'Crossing pair':['clean'],'Long wind':['pure'],'The gauntlet':['dead',4],'Small bull':['clean'],
 'Storm lane':['pure'],'Far slider':['dead',3],'Master of the line':['pure'],'First shade':['clean'],'The warren':['swift',22],'Horns in the grass':['pure'],'Creepers':['clean'],'Bolt':['swift',25],
 'On the post':['clean'],'Flush':['swift',24],'Flight line':['pure'],'Blighted meadow':['swift',32]};
// the ribbon a stage offers today, as {name, goal, won(run)}; null when it has none (ribbons off, or Pure Bow without special arrows)
function ribbonFor(st){
 const r=RIBBONS&&RIBBON[st.name];if(!r)return null;const shades=st.spirits?st.spirits.length:0,all=x=>!shades||x.hits===shades;
 if(r[0]==='clean')return{name:'Clean Quiver',goal:'no misses',won:x=>x.fired>0&&x.hits===x.fired&&all(x)};
 if(r[0]==='dead')return{name:'Dead-Eye',goal:r[1]+' perfect',won:x=>x.perfectHits>=r[1]};
 if(r[0]==='swift')return{name:'Swift Banish',goal:'within '+r[1]+' s',won:x=>x.hits===shades&&x.sec<=r[1]};
 return ARROWS?{name:'Pure Bow',goal:'no special arrows',won:x=>x.specialUsed===0}:null;
}
// stars and bests by stage name, for the save file (see the note where the save is read)
function rangeNames(){
 const R=state.range,named=R.named&&typeof R.named==='object'?R.named:{};
 STAGES.forEach((st,i)=>{if(R.stars[i]||R.best[i]||(R.ribbon&&R.ribbon[i]))named[st.name]={s:R.stars[i]||0,b:R.best[i]||0,...(R.ribbon&&R.ribbon[i]?{r:1}:named[st.name]&&named[st.name].r?{r:1}:{})};});   // stages not in today's list keep what they had
 R.named=named;
}
// put a save that carries names back in today's order; the next stage to open is the first without a star
(function rangeFromNames(){
 const R=state.range;R.ribbon=STAGES.map(st=>R.named&&R.named[st.name]&&R.named[st.name].r?1:0);if(!R.named)return;
 R.stars=STAGES.map(st=>R.named[st.name]?R.named[st.name].s|0:0);R.best=STAGES.map(st=>R.named[st.name]?R.named[st.name].b|0:0);
 let open=0;while(open<STAGES.length-1&&R.stars[open]>0)open++;R.open=open;
})();
const coins=text=>RELEASE||CONFIG.coins===false?'':text;   // coins are earned but not shown until there is something to spend them on
const range={on:false,stage:0,phase:'idle',arrows:0,score:0,streak:0,best:0,hits:0,stars:0,newBest:false,earned:0,wind:0,endAt:0,t0:0,ideal:1,pending:null,last:''};
const rangeRounds=[],rangeSigns={};let rangeMeshes=[];
for(let k=0;k<3;k++){
 // a round on a single post that can lie back (pop-ups) and slide sideways
 const root=new T.Group(),tilt=new T.Group(),face=new T.Group();scene.add(root);root.add(tilt);tilt.add(face);root.visible=false;
 const item={kind:'range',root:face,base:root,tilt,kick:-10,meshes:[],scale:1.2,up:true};
 for(const[r,dz,c]of[[.68,0,'#bf9959'],[.50,.038,GRADE?LOOK.ringRed:red],[.37,.072,cream],[.23,.11,GRADE?LOOK.ringRed:red],[.10,.15,gold]]){const o=mesh(face,new T.CylinderGeometry(r,r,.045,28),c,V(0,0,dz));o.rotation.x=Math.PI/2;o.userData.target=item;item.meshes.push(o);}
 item.post=stick(tilt,V(0,0,-.06),V(0,1,-.06),.06,timber);shaded(root);
 targets.push(item);rangeRounds.push(item);
}
for(const[id,text,right]of[['back','◀  BACK',-3.6],['again','AGAIN',0],['next','NEXT  ▶',3.6]]){
 const[x,z]=yardAt(7,right),g=groundAt(x,z),root=new T.Group();root.position.set(x,g,z);root.rotation.y=Math.atan2(YARD.x-x,YARD.z-z);scene.add(root);root.visible=false;
 const item={kind:'sign',id,root,base:root,kick:-10,meshes:[]};
 stick(root,V(0,-.3,-.05),V(0,1.25,-.05),.06,timber);
 const c=document.createElement('canvas');c.width=512;c.height=128;const g2=c.getContext('2d');g2.fillStyle='#273c34';g2.fillRect(0,0,512,128);g2.strokeStyle='#bcaa7a';g2.lineWidth=8;g2.strokeRect(6,6,500,116);
 g2.font='600 78px Georgia';g2.textAlign='center';g2.textBaseline='middle';g2.fillStyle='#ffebbd';g2.fillText(text,256,68,470);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;
 const plate=box(root,V(0,1.5,0),V(2.5,.66,.05),timber),words=new T.Mesh(new T.PlaneGeometry(2.4,.6),new T.MeshBasicMaterial({map:tex}));words.position.set(0,1.5,.035);root.add(words);
 for(const o of[plate,words]){o.userData.target=item;item.meshes.push(o);}
 rangeSigns[id]=item;
}
// a pennant by the line that points downwind and stretches with the wind
const sock=(()=>{const[x,z]=yardAt(WORLD2?11:5,WORLD2?-9.8:-4.6),g=groundAt(x,z),root=new T.Group();root.position.set(x,g,z);scene.add(root);stick(root,V(0,-.3,0),V(0,3.3,0),.05,timber);return pennant(root,0,3.25,'#e8743b');})();
// numbers that rise from a hit
const pops=[];
function popup(text,pos,color,life=1.4){
 let s=pops.find(p=>p.life<=0);
 if(!s){
  if(pops.length>=8)s=pops[0];
  else{
   const c=document.createElement('canvas');c.width=512;c.height=128;const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;
   const sp=new T.Sprite(new T.SpriteMaterial({map:tex,transparent:true,depthTest:false,fog:false}));sp.renderOrder=9;scene.add(sp);s={sp,c,tex,life:0};pops.push(s);
  }
 }
 const g=s.c.getContext('2d');g.clearRect(0,0,512,128);g.font='600 84px Georgia';g.textAlign='center';g.textBaseline='middle';g.lineWidth=12;g.strokeStyle='#1e2926';g.strokeText(text,256,68,500);g.fillStyle=color;g.fillText(text,256,68,500);s.tex.needsUpdate=true;
 s.sp.position.copy(pos);s.life=life;s.sp.visible=true;
}
function stepPops(dt,eye){
 for(const s of pops){
  if(s.life<=0)continue;s.life-=dt;if(s.life<=0){s.sp.visible=false;continue;}
  const k=Math.max(.5,s.sp.position.distanceTo(eye)*.11);s.sp.position.y+=dt*k*.35;s.sp.scale.set(k*2,k*.5,1);s.sp.material.opacity=Math.min(1,s.life*2.2);
 }
}
// ---- models made outside the game. Each is a body and a head of flat-coloured triangles; the build step puts them in MODELS.
// (A concept picture from ChatGPT, turned into 3D by Tripo, then cut down to a few thousand faces in Blender.)
function modelGeometry(part,unit){
 const bytes=t=>Uint8Array.from(atob(t),c=>c.charCodeAt(0)),raw=new Int16Array(bytes(part.p).buffer),rgb=bytes(part.c),n=raw.length,pos=new Float32Array(n),col=new Float32Array(n),k=new T.Color();
 for(let i=0;i<n;i++)pos[i]=raw[i]/unit;
 for(let f=0;f<n/9;f++){k.setRGB(rgb[f*3]/255,rgb[f*3+1]/255,rgb[f*3+2]/255,T.SRGBColorSpace);for(let v=0;v<3;v++)col.set([k.r,k.g,k.b],f*9+v*3);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(pos,3));g.setAttribute('color',new T.BufferAttribute(col,3));g.computeVertexNormals();return g;
}
const HARE=typeof MODELS!=='undefined'&&MODELS['shade-hare']?{body:modelGeometry(MODELS['shade-hare'].body,MODELS['shade-hare'].unit),head:modelGeometry(MODELS['shade-hare'].head,MODELS['shade-hare'].unit),pivot:MODELS['shade-hare'].pivot}:null;
// A rigged model (tools/export-rigged.py): flat-coloured triangles whose corners are tied to bones.
// The bones are built with no rest rotation, so on every one of them x pitches, y yaws and z rolls, whatever the bone.
const RIG=(()=>{
 const m=typeof MODELS!=='undefined'&&MODELS['shade-hare-rig'];if(!m)return null;
 const bytes=t=>Uint8Array.from(atob(t),c=>c.charCodeAt(0)),g=modelGeometry({p:m.p,c:m.c},m.unit),si=bytes(m.si),sw=bytes(m.sw),w=new Float32Array(sw.length);
 for(let i=0;i<w.length;i+=4){const sum=sw[i]+sw[i+1]+sw[i+2]+sw[i+3]||1;for(let k=0;k<4;k++)w[i+k]=sw[i+k]/sum;}
 g.setAttribute('skinIndex',new T.Uint16BufferAttribute(Uint16Array.from(si),4));g.setAttribute('skinWeight',new T.BufferAttribute(w,4));
 return{geo:g,bones:m.bones};
})();
function rigInstance(material,R=RIG){
 const bones=R.bones.map(b=>{const o=new T.Bone();o.name=b.name;return o;}),by={};
 R.bones.forEach((b,i)=>{
  const o=bones[i];by[b.name]=o;
  if(b.parent<0)o.position.fromArray(b.head);else{const q=R.bones[b.parent].head;o.position.set(b.head[0]-q[0],b.head[1]-q[1],b.head[2]-q[2]);bones[b.parent].add(o);}
 });
 const skinned=new T.SkinnedMesh(R.geo,material);skinned.add(bones[0]);skinned.updateMatrixWorld(true);skinned.bind(new T.Skeleton(bones));skinned.frustumCulled=false;
 return{mesh:skinned,by};
}
// ---- The new standing hare and its timed bound. Only a build made with --new-hare carries them (src/build.mjs), and
// there ?hare=old goes back to the first hare. Its file keeps Tripo's colours, so it is recoloured here to the style
// sheet: dark plum, lighter plum on the lighter faces, ember eyes. It faces -z in its file.
const NEW_HARE=!!CONFIG.newHare&&QUERY.get('hare')!=='old'&&typeof MOVES!=='undefined'&&typeof MODELS!=='undefined'&&!!MODELS['shade-hare-standing'];
const RIG2=NEW_HARE?(()=>{
 const m=MODELS['shade-hare-standing'],bytes=t=>Uint8Array.from(atob(t),c=>c.charCodeAt(0)),g=modelGeometry({p:m.p,c:m.c},m.unit),c=bytes(m.c),si=bytes(m.si),sw=bytes(m.sw),w=new Float32Array(sw.length);
 for(let i=0;i<w.length;i+=4){const sum=sw[i]+sw[i+1]+sw[i+2]+sw[i+3]||1;for(let k=0;k<4;k++)w[i+k]=sw[i+k]/sum;}
 g.setAttribute('skinIndex',new T.Uint16BufferAttribute(Uint16Array.from(si),4));g.setAttribute('skinWeight',new T.BufferAttribute(w,4));
 const lum=f=>c[f*3]*.3+c[f*3+1]*.45+c[f*3+2]*.25,red=f=>c[f*3]>178&&c[f*3+1]<90&&c[f*3+2]<90,faces=c.length/3,col=g.attributes.color,pos=g.attributes.position;let lo=1e9,hi=-1e9;
 for(let f=0;f<faces;f++)if(!red(f)){lo=Math.min(lo,lum(f));hi=Math.max(hi,lum(f));}
 const plum=new T.Color('#4A2943'),light=new T.Color('#6D3362'),ember=new T.Color('#E02E32'),k=new T.Color(),eyes=[[0,0,0,0],[0,0,0,0]];
 for(let f=0;f<faces;f++){
  if(red(f)){k.copy(ember);for(let v=0;v<3;v++){const i=f*3+v,e=eyes[pos.getX(i)<0?0:1];e[0]+=pos.getX(i);e[1]+=pos.getY(i);e[2]+=pos.getZ(i);e[3]++;}}else k.copy(plum).lerp(light,(lum(f)-lo)/(hi-lo||1));
  for(let v=0;v<3;v++)col.setXYZ(f*3+v,k.r,k.g,k.b);
 }
 const head=m.bones.find(b=>b.name==='Head_1').head;
 return{geo:g,bones:m.bones,rootY:m.bones[0].head[1],eyes:eyes.filter(e=>e[3]).map(e=>V(e[0]/e[3]-head[0],e[1]/e[3]-head[1],e[2]/e[3]-head[2]))};
})():null;
const HARE_MOVES=RIG2?{lope:MOVES.hareBound(RIG2.bones,MOVES.HARE.lope),lopeLow:MOVES.hareBound(RIG2.bones,MOVES.HARE.lopeLow),run:MOVES.hareBound(RIG2.bones,MOVES.HARE.run),crouch:MOVES.hareCrouch(RIG2.bones,MOVES.HARE.crouch)}:null,HARE_SCALE=.55;
const EARS2=[['Head_2','Head_3','Head_4'],['Ear2_0','Ear2_1','Ear2_2']];
// the standing hare's hit shapes: body [up, back, half-width, half-height, half-length] from the hip bone; head [up, back, radius] from the head bone
const HIT_HARE={body:[-.02,-.11,.125,.15,.31],head:[.05,-.07,.115]};
// The standing hare's pose. Its bound comes from src/moves.js and is driven by how far it has travelled (sp.cyc, in
// strides), so its paws do not slide; everything else is laid over that. On this hare a positive turn about x tips the
// body nose-up, swings a leg forward and lays an ear back.
function standingPose(sp,dt){
 const B=sp.rig;sp.gait+=(sp.gaitTo-sp.gait)*Math.min(1,dt*8);
 sp.lowS+=(((sp.mode==='hide'&&!sp.exposed)||sp.sunk?1:0)-sp.lowS)*Math.min(1,dt*6);   // how low it is keeping: 1 while it hides or is in tall grass
 const run=sp.mode==='run',w=Math.min(1,sp.gait/(run?1:.45)),t=elapsed+sp.seed,rear=sp.rear,low=sp.lowS,turn=sp.turn*sp.look;
 for(const n in B)B[n].rotation.set(0,0,0);
 // Moving, it takes its gait, carried low where the grass is tall. Standing, it crouches if it is keeping low, with
 // its paws where they were. The two are mixed by how far it has got going. It never sinks into the ground.
 const go=(run?HARE_MOVES.run:HARE_MOVES.lope).pose(sp.cyc),goLow=run||low<.01?null:HARE_MOVES.lopeLow.pose(sp.cyc),still=HARE_MOVES.crouch.pose(low),val=(p,n)=>p[n]?p[n][0]:0;
 for(const n in B)B[n].rotation.x=(goLow?val(go,n)*(1-low)+val(goLow,n)*low:val(go,n))*w+val(still,n)*(1-w);
 const lift=(goLow?go._lift*(1-low)+goLow._lift*low:go._lift)*w+still._lift*(1-w);
 B.Root.position.y=RIG2.rootY+lift;
 const add=(n,x,y=0,z=0)=>{const r=B[n].rotation;r.x+=x;r.y+=y;r.z+=z;};
 add('Spine_1',Math.sin(t*2.1)*.022);                                             // breathing
 // risen on its haunches as it is banished; the hind legs turn the other way to stay planted
 const tipUp=rear*.5,fold=rear*.9;
 add('Spine_0',tipUp);add('1_Right_Limb_0',-tipUp);add('bone_18',-tipUp);add('1_Left_Limb_0',-tipUp*.6);
 for(const leg of['0_Right_Limb','0_Left_Limb']){add(leg+'_0',.7*fold);add(leg+'_1',-fold);}
 // head: turns to look at the archer, lifts a little as it does. The turn is on the head bone alone: the bone below
 // it (Head_0) also carries the forelegs, and turning that swings planted forepaws sideways.
 add('Head_1',-sp.look*.06-rear*.3,turn*.85,Math.sin(t*.9)*.03*(1-sp.look));
 // ears: sway, lie back in fear, prick when it looks, and one twitches now and then
 EARS2.forEach((chain,side)=>chain.forEach((name,i)=>{
  const k=(i+1)/3,lag=t*2.3-i*.6+side*1.3;
  add(name,Math.sin(lag)*.04+(i<2?sp.fear*.22-sp.look*.06:0),0,(side?-1:1)*(Math.sin(lag*.7)*.03)+(sp.twitch>0&&side===sp.twitchSide?Math.sin(sp.twitch*40)*.1*k:0));
 }));
 if(sp.twitch>0)sp.twitch-=dt;else if(Math.random()<dt*.25){sp.twitch=.25;sp.twitchSide=Math.random()<.5?0:1;}
}
const EARS=[['Head_2','Head_3','Head_4','Head_5','Head_6'],['bone_16','bone_17','bone_18','bone_19','bone_20']];
// The hare's whole animation, written out by hand: there are no recorded clips.
//   gait   0 at rest, about .45 creeping, 1 bounding     phase  where it is in its bound
//   look   0..1, how far the head has turned to the archer (turn is the angle)
//   rear   0..1, rising on its haunches as it is banished     fear  0..1, ears flattening as it slinks off
function shadePose(sp,dt){
 const B=sp.rig;if(!B)return;if(sp.bound)return standingPose(sp,dt);
 sp.gait+=(sp.gaitTo-sp.gait)*Math.min(1,dt*8);
 const t=elapsed+sp.seed,g=sp.gait,sn=Math.sin(sp.phase),cs=Math.cos(sp.phase),breath=Math.sin(t*2.1)*.022,rear=sp.rear,low=sp.mode==='hide'||sp.sunk?1:0;
 // spine: the haunches drive each bound and the chest pitches the other way, which keeps the head level
 B.Spine_0.rotation.x=-sn*.3*g-rear*.55+low*.12;
 B.Spine_1.rotation.x=breath+sn*.24*g+rear*.2-low*.1;
 // hind legs: kick straight behind on the push, fold under on the reach
 for(const leg of['0_Left_Limb','1_Left_Limb']){
  B[leg+'_0'].rotation.x=(sn*1.05-.15)*g+rear*.5;B[leg+'_1'].rotation.x=-sn*.95*g-rear*.4;B[leg+'_2'].rotation.x=cs*.45*g;
 }
 // front legs: reach forward and plant, the right a touch after the left. (Tripo's skeleton hangs the right foreleg off the left, hence the subtraction.)
 const left=-cs*.8*g-rear*1.1,right=-Math.cos(sp.phase-.55)*.8*g-rear*1.1;
 B.Spine_2.rotation.x=left;B['0_Right_Limb_0'].rotation.x=0;B['0_Right_Limb_1'].rotation.x=right-left;
 // head and neck: turn to look at the archer, dip a little with each bound, lift when it looks
 const turn=sp.turn*sp.look;
 B.Head_0.rotation.set(-sn*.1*g-sp.look*.1+low*.15,turn*.45,0);B.Head_1.rotation.set(-sp.look*.08-rear*.35,turn*.55,Math.sin(t*.9)*.03*(1-sp.look));
 B.bone_21.rotation.x=Math.sin(t*7)*.05*sp.look;   // the muzzle works as it scents you
 // ears: each joint follows the one before it a moment later, so they sway, trail behind a bound, prick when it looks and flatten in fear
 EARS.forEach((chain,side)=>chain.forEach((name,i)=>{
  const k=(i+1)/5,lag=t*2.3-i*.6+side*1.3;
  B[name].rotation.x=Math.sin(lag)*.05+cs*.2*g*k-sp.look*.07+sp.fear*.3*k+rear*.15*k;
  B[name].rotation.z=(side?-1:1)*(Math.sin(lag*.7)*.04+sp.fear*.12)+(sp.twitch>0&&side===sp.twitchSide?Math.sin(sp.twitch*40)*.12*k:0);
 }));
 if(sp.twitch>0)sp.twitch-=dt;else if(Math.random()<dt*.25){sp.twitch=.25;sp.twitchSide=Math.random()<.5?0:1;}
}
// ---- shades: hares of dark thorn with ember eyes, each wrapped in violet smoke until an arrow banishes it.
// A shade turns its head to look at the archer now and then, and its eyes flare as it does: that is how a hidden one gives itself away.
const spirits=[],grassClumps=[],SPIRIT={sit:100,hide:160,creep:200,run:240,perch:160,flush:300,cross:300},SPIRIT_SIZE=1.5,WINGED={perch:1,flush:1,cross:1};
for(let k=0;k<5;k++){
 const base=new T.Group(),tilt=new T.Group(),root=new T.Group();scene.add(base);base.add(tilt);tilt.add(root);base.visible=false;root.scale.setScalar(SPIRIT_SIZE);
 const glow=new T.MeshStandardMaterial({color:'#3b2444',emissive:'#6a1838',emissiveIntensity:.7,flatShading:true,roughness:.8,transparent:true});
 const leaf=new T.MeshStandardMaterial({color:'#8c1f2e',emissive:'#ff4a2a',emissiveIntensity:.8,flatShading:true,roughness:.8,transparent:true});
 const ember=new T.MeshBasicMaterial({color:0xff3b1f,transparent:true}),flare=new T.MeshBasicMaterial({color:0xff5a2a,transparent:true,opacity:.3,depthWrite:false,blending:T.AdditiveBlending});
 const head=new T.Group(),ears=[],flares=[];let rig=null,bound=false;
 if(RIG2){
  // the standing hare: one unit tall with its ears, drawn at the same size as the first hare and turned to face +z
  const fig=new T.Group();fig.scale.setScalar(HARE_SCALE);fig.rotation.y=Math.PI;root.add(fig);glow.color.set('#ffffff');glow.vertexColors=true;glow.emissive.set('#5a0f24');glow.emissiveIntensity=.3;
  const made=rigInstance(glow,RIG2);fig.add(made.mesh);rig=made.by;bound=true;
  for(const e of RIG2.eyes){mesh(rig.Head_1,new T.SphereGeometry(.017,6,5),ember,e);flares.push(mesh(rig.Head_1,new T.SphereGeometry(.03,8,6),flare,e));}
 }else if(RIG){
  // the rigged hare: one unit tall with its ears, so it is drawn at a little over half size
  const fig=new T.Group();fig.scale.setScalar(.55);root.add(fig);glow.color.set('#ffffff');glow.vertexColors=true;glow.emissive.set('#5a0f24');glow.emissiveIntensity=.3;
  const made=rigInstance(glow);fig.add(made.mesh);rig=made.by;
  for(const e of[-1,1]){mesh(rig.Head_1,new T.SphereGeometry(.02,6,5),ember,V(e*.075-.009,.055,.06));flares.push(mesh(rig.Head_1,new T.SphereGeometry(.03,8,6),flare,V(e*.079-.009,.055,.066)));}
 }else if(HARE){
  // the modelled hare: one unit tall with its ears, so it is drawn at a little over half size
  const fig=new T.Group();fig.scale.setScalar(.55);root.add(fig);glow.color.set('#ffffff');glow.vertexColors=true;glow.emissive.set('#5a0f24');glow.emissiveIntensity=.3;
  fig.add(new T.Mesh(HARE.body,glow));head.position.fromArray(HARE.pivot);fig.add(head);
  const skull=new T.Mesh(HARE.head,glow);skull.position.fromArray(HARE.pivot).negate();head.add(skull);
  mesh(head,new T.SphereGeometry(.07,8,6),new T.MeshBasicMaterial({color:0x1a0d1f}),V(0,-.02,-.02));   // fills the neck when the head is turned
  for(const e of[-1,1]){mesh(head,new T.SphereGeometry(.022,6,5),ember,V(e*.062,.105,.165));flares.push(mesh(head,new T.SphereGeometry(.03,8,6),flare,V(e*.066,.105,.17)));}
 }else{
  mesh(root,new T.SphereGeometry(.2,8,6),glow,V(0,.21,0)).scale.set(1,.88,1.5);
  mesh(root,new T.SphereGeometry(.17,8,6),glow,V(0,.2,-.17));
  head.position.set(0,.37,.23);root.add(head);mesh(head,new T.SphereGeometry(.11,8,6),glow,V());
  for(const e of[-1,1]){const g=new T.Group();g.position.set(e*.05,.07,-.02);head.add(g);mesh(g,new T.ConeGeometry(.03,.36,4),glow,V(0,.18,0));ears.push(g);mesh(head,new T.SphereGeometry(.024,6,5),ember,V(e*.052,.025,.09));flares.push(mesh(head,new T.SphereGeometry(.05,8,6),flare,V(e*.052,.025,.1)));}
  mesh(root,new T.SphereGeometry(.055,6,5),leaf,V(0,.25,-.36));
  for(const[z,h]of[[.1,.13],[0,.17],[-.11,.15],[-.22,.11]])mesh(root,new T.ConeGeometry(.03,h,4),leaf,V(0,.39+h/2-.02,z)).rotation.x=-.35;
 }
 const mist=mesh(root,new T.SphereGeometry(.44,10,8),new T.MeshBasicMaterial({color:0x3d2352,transparent:true,opacity:.34,depthWrite:false}),V(0,.24,0));
 const hitMesh=new T.Mesh(new T.SphereGeometry(1,8,6));hitMesh.visible=false;root.add(hitMesh);   // what an arrow actually strikes
 const sp={kind:'spirit',rig,bound,cyc:0,lowS:0,sink:bound?0:.3,seed:k*7.3,gait:0,gaitTo:0,phase:0,turn:0,rear:0,fear:0,twitch:0,twitchSide:0,base,tilt,root,head,ears,flares,flare,glow,glow0:glow.emissiveIntensity,leaf,ember,look:0,lookUntil:0,nextLook:0,mist,hitMesh,meshes:[hitMesh],scale:SPIRIT_SIZE,up:true,kick:-10,live:false,done:true,mode:'sit',state:'off',t:0};
 hitMesh.userData.target=sp;sp.set=spiritSet;spirits.push(sp);
 if(bound){
  // What an arrow strikes on the standing hare: one rounded shape about its body and one about its head, each fixed
  // to a bone, so they follow the leap, the crouch and the turn of the head with no further care. Sizes are in the
  // model's own units (in the game: body about 0.5 m long, 0.25 m deep and 0.2 m wide; head about 0.19 m across).
  // Legs, ears and tail are not part of it.
  rig.Spine_0.add(hitMesh);hitMesh.position.set(0,HIT_HARE.body[0],HIT_HARE.body[1]);hitMesh.scale.set(HIT_HARE.body[2],HIT_HARE.body[3],HIT_HARE.body[4]);
  const hitHead=new T.Mesh(hitMesh.geometry);hitHead.visible=false;rig.Head_1.add(hitHead);hitHead.position.set(0,HIT_HARE.head[0],HIT_HARE.head[1]);hitHead.scale.setScalar(HIT_HARE.head[2]);
  hitHead.userData.target=sp;sp.hitHead=hitHead;sp.meshes.push(hitHead);
 }
}
// ---- The shade ram (D3): the one big deliberate shot in Bell Watch (design/bell-watch.md). One switch: "ram" in
// src/config.json, or ?ram=1 / ?ram=0. Off, or in a build without the model: nothing of it exists.
//   It appears far down the lane, stands and paws the ground for a few seconds with its eyes flaring, then walks
//   straight for the bell, slow and heavy, head down. One arrow banishes it. If it gets there it rears, comes down on
//   the post and puts all three thorn bands on the bell at once. It never harms the player and costs no points.
//   Tripo's model (assets/staging/shade-ram-rig-turned-patched.json, with left hind leg mirrored from the right), one
//   unit tall with its horns; drawn so its shoulder is 1.1 m up. It faces +z; +x is its left. Recoloured by part inside
//   the locked plum/ember palette (design/theme-look.md) so it reads as a shade beside the hares.
const RAM_ON=(QUERY.has('ram')?QUERY.get('ram')==='1':!!CONFIG.ram)&&typeof MODELS!=='undefined'&&!!MODELS['shade-ram'];
// first, again: seconds before the first ram and between rams; from: where it appears [metres along the lane, most it
// may stand to either side]; stand: seconds it paws before it charges; speed in m/s; reach: how near the bell's foot it
// rears; value: points for banishing it; size: metres per model unit; stride: metres covered by one cycle of its legs
const RAM_RULE={first:[22,26],again:[34,38],from:[34,3],stand:2.8,speed:2.2,reach:1.6,value:300,size:1.77,stride:1.35,least:20};
// Recolour the ram's faces by part inside the locked shade palette (#4A2943 body, #6D3362 on broad outward-facing horn
// facets so the two curls separate at 34 m, near-black hooves, darker muzzle/belly, picked-out spikes, ember eyes).
function ramColor(m,pos,c,si,sw,col){
 const lum=f=>c[f*3]*.3+c[f*3+1]*.45+c[f*3+2]*.25,red=f=>c[f*3]>178&&c[f*3+1]<90&&c[f*3+2]<90,faces=c.length/3;
 let lo=1e9,hi=-1e9,rx=0,rn=0;
 for(let f=0;f<faces;f++)if(red(f)){rx+=pos[f*9];rn++;}else{lo=Math.min(lo,lum(f));hi=Math.max(hi,lum(f));}
 rx/=rn||1;   // the head is turned in the file, so the two eyes are told apart by which side of their own middle they lie
 const names=m.bones.map(b=>b.name),byName=new Map(m.bones.map(b=>[b.name,b.head]));
 const chain=ns=>{const pts=ns.map(n=>byName.get(n)).filter(Boolean),cum=[0];for(let i=1;i<pts.length;i++)cum.push(cum[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1],pts[i][2]-pts[i-1][2]));return{pts,cum,len:cum[cum.length-1]||1};};
 const proj=(ch,x,y,z)=>{let best=1e9,u=0;for(let i=0;i<ch.pts.length-1;i++){const a=ch.pts[i],b=ch.pts[i+1],dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],l2=dx*dx+dy*dy+dz*dz||1e-9,t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy+(z-a[2])*dz)/l2)),d2=(x-a[0]-dx*t)**2+(y-a[1]-dy*t)**2+(z-a[2]-dz*t)**2;if(d2<best){best=d2;u=(ch.cum[i]+t*(ch.cum[i+1]-ch.cum[i]))/ch.len;}}return u;};
 const hR=new Set(['Head_2','Head_3','Head_4','Head_5','Head_6']),hL=new Set(['bone_16','bone_17','bone_18','bone_19','bone_20']);
 const cR=chain([...hR]),cL=chain([...hL]),feet=new Set(['bone_26','bone_30','0_Right_Limb_4','HindL_4','0_Left_Limb_3']);
 const cosH=Math.cos(-.7),sinH=Math.sin(-.7);   // un-yaw normals by the same -0.7 rad that straightens Tripo's turned head
 const C={bodyLo:new T.Color('#3E2139'),plum:new T.Color('#4A2943'),bodyHi:new T.Color('#532D4B'),hornIn:new T.Color('#43243D'),hornMid:new T.Color('#6D3362'),hornCrest:new T.Color('#7C3F71'),ember:new T.Color('#E02E32'),hoof0:new T.Color('#1F1720'),hoof1:new T.Color('#312632'),dark0:new T.Color('#2E182B'),dark1:new T.Color('#3E2039'),spike0:new T.Color('#6D3362'),spike1:new T.Color('#7E3B71')};
 const k=new T.Color(),body=new T.Color(),hornOut=new T.Color(),eyes=[[0,0,0,0],[0,0,0,0]],bw=new Float32Array(m.bones.length);
 for(let f=0;f<faces;f++){
  const u=(lum(f)-lo)/(hi-lo||1);
  if(red(f)){
   k.copy(C.ember);
   for(let v=0;v<3;v++){const i=f*3+v,x=pos[i*3],e=eyes[x<rx?0:1];e[0]+=x;e[1]+=pos[i*3+1];e[2]+=pos[i*3+2];e[3]++;}
  }else{
   let cx=0,cy=0,cz=0,topI=0,topW=-1;bw.fill(0);
   for(let v=0;v<3;v++){
    const vi=f*3+v;cx+=pos[vi*3]/3;cy+=pos[vi*3+1]/3;cz+=pos[vi*3+2]/3;
    for(let j=0;j<4;j++){const bi=si[vi*4+j],w=sw[vi*4+j];if(w>0){bw[bi]+=w;if(bw[bi]>topW){topW=bw[bi];topI=bi;}}}
   }
   const b=names[topI],i0=f*9,e1x=pos[i0+3]-pos[i0],e1y=pos[i0+4]-pos[i0+1],e1z=pos[i0+5]-pos[i0+2],e2x=pos[i0+6]-pos[i0],e2y=pos[i0+7]-pos[i0+1],e2z=pos[i0+8]-pos[i0+2];
   const nx=e1y*e2z-e1z*e2y,ny=e1z*e2x-e1x*e2z,nz=e1x*e2y-e1y*e2x,nl=Math.hypot(nx,ny,nz)||1,nxN=nx/nl,nyN=ny/nl,nzN=nz/nl;
   // keep the body firmly anchored on #4A2943 so the lighter horn curls separate cleanly at 34 m
   if(u<.5)body.copy(C.bodyLo).lerp(C.plum,u*2);else body.copy(C.plum).lerp(C.bodyHi,(u-.5)*2);
   if(hR.has(b)||hL.has(b)){
    const isL=hL.has(b),side=isL?1:-1,t=proj(isL?cL:cR,cx,cy,cz),ridge=.5+.5*Math.sin(t*Math.PI*16);
    const fx=nxN*cosH+nzN*sinH,fz=-nxN*sinH+nzN*cosH;
    const out=Math.max(0,Math.min(1,(fx*side*.72+nyN*.35+fz*.32+.06)/.68));
    hornOut.copy(C.hornMid).lerp(C.hornCrest,ridge*.55);
    k.copy(C.hornIn).lerp(hornOut,out*.82+ridge*.18);
    if(t>.88)k.lerp(C.hornIn,(t-.88)/.12*.5);
   }else if(feet.has(b)&&cy<.075){
    k.copy(C.hoof0).lerp(C.hoof1,u);
    if(cy>.062)k.lerp(body,(cy-.062)/.013);
   }else if(b==='bone_21'||b==='bone_22'||(b==='Head_1'&&cz>.37&&cy<.72)){
    k.copy(C.dark0).lerp(C.dark1,u);
   }else if((b==='Root'||b==='0_Right_Limb_0'||b==='Spine_0')&&cz>=-.36&&cz<=.20&&Math.abs(cx)<.095&&cy>.612+.08*cz){
    k.copy(C.spike0).lerp(C.spike1,u);
   }else if(cy<.44&&nyN<-.15&&cz>=-.35&&cz<=.28&&Math.abs(cx)<.17){
    k.copy(C.dark0).lerp(C.dark1,u);
   }else k.copy(body);
  }
  for(let v=0;v<3;v++){const o=f*9+v*3;col[o]=k.r;col[o+1]=k.g;col[o+2]=k.b;}
 }
 return eyes.filter(e=>e[3]).map(e=>[e[0]/e[3],e[1]/e[3],e[2]/e[3]]);
}
const RAM_RIG=RAM_ON?(()=>{
 const m=MODELS['shade-ram'],bytes=t=>Uint8Array.from(atob(t),c=>c.charCodeAt(0)),g=modelGeometry({p:m.p,c:m.c},m.unit),c=bytes(m.c),si=bytes(m.si),sw=bytes(m.sw),w=new Float32Array(sw.length);
 for(let i=0;i<w.length;i+=4){const sum=sw[i]+sw[i+1]+sw[i+2]+sw[i+3]||1;for(let k=0;k<4;k++)w[i+k]=sw[i+k]/sum;}
 g.setAttribute('skinIndex',new T.Uint16BufferAttribute(Uint16Array.from(si),4));g.setAttribute('skinWeight',new T.Float32BufferAttribute(w,4));
 const eyes=ramColor(m,g.attributes.position.array,c,si,sw,g.attributes.color.array);
 const head=m.bones.find(b=>b.name==='Head_1').head;
 return{geo:g,bones:m.bones,rootY:m.bones[0].head[1],eyes:eyes.map(e=>V(e[0]-head[0],e[1]-head[1],e[2]-head[2]))};
})():null;
// The ram's whole animation as one pose: each named bone and how far it is turned about x, y, z.
//   cyc   how far it has walked, in cycles of its legs     go    0 standing .. 1 charging
//   paw   0..1, scraping the ground with its left forefoot     rear  0..1, risen on its hind legs     t  the clock
// Side-plane 2-bone IK (same method as src/moves.js for the hare) keeps every planted hoof locked to the ground while
// charging at RAM_RULE.speed over RAM_RULE.stride metres per cycle. The ram faces +z, so a positive x-turn swings a leg
// back, drops the head and lifts the tail.
const RAM_DUTY=.38;
let RAM_FRAME_SRC=null,RAM_FRAME=null;
function ramFrame(bones){
 if(RAM_FRAME&&RAM_FRAME_SRC===bones)return RAM_FRAME;
 const at=n=>{const b=bones.find(x=>x.name===n);return b?[b.head[2],b.head[1]]:null;};
 const hasHindL=!!at('HindL_1');
 const defs=[
  {front:true,bend:1,phase:0,names:['Spine_1','bone_29','bone_30']},
  {front:true,bend:1,phase:.5,names:['bone_23','bone_25','bone_26']},
  {front:false,bend:-1,phase:0,names:['0_Right_Limb_1','0_Right_Limb_3','0_Right_Limb_4']},
  {front:false,bend:-1,phase:.5,names:hasHindL?['HindL_1','HindL_3','HindL_4']:['0_Left_Limb_0','0_Left_Limb_2','0_Left_Limb_3']}
 ];
 const legs=defs.map(d=>{
  const top=at(d.names[0]),knee=at(d.names[1]),foot=at(d.names[2]);
  return{...d,top,foot,a:[knee[0]-top[0],knee[1]-top[1]],b:[foot[0]-knee[0],foot[1]-knee[1]],spot:top[0]+(d.front?0:-.04)};
 });
 const hips=at('0_Right_Limb_0'),hipR=at('0_Right_Limb_1'),hipDz=hips&&hipR?hips[0]-hipR[0]:0;
 RAM_FRAME_SRC=bones;RAM_FRAME={legs,hasHindL,hipDz};return RAM_FRAME;
}
function ramReach(J,Tpt,a,b,bend){
 const la=hyp(a[0],a[1]),lb=hyp(b[0],b[1]),vx=Tpt[0]-J[0],vy=Tpt[1]-J[1],want=hyp(vx,vy)||1e-6;
 const d=Math.min(Math.max(want,Math.abs(la-lb)+1e-4),la+lb-1e-4);
 const A=Math.acos(Math.max(-1,Math.min(1,(la*la+d*d-lb*lb)/(2*la*d)))),da=Math.atan2(vy,vx)+bend*A;
 const mx=J[0]+la*Math.cos(da),my=J[1]+la*Math.sin(da),ex=J[0]+vx*d/want,ey=J[1]+vy*d/want;
 return{a:da-Math.atan2(a[1],a[0]),b:Math.atan2(ey-my,ex-mx)-Math.atan2(b[1],b[0]),short:Math.max(0,want-d)};
}
function ramPoseOf(s){
 const P={},add=(n,x=0,y=0,z=0)=>{const r=P[n]||(P[n]=[0,0,0]);r[0]+=x;r[1]+=y;r[2]+=z;};
 const sm=(a,b,x)=>{const u=Math.max(0,Math.min(1,(x-a)/(b-a)));return u*u*(3-2*u);};
 const go=s.go||0,paw=s.paw||0,rear=s.rear||0,t=s.t||0,cyc=((s.cyc||0)%1+1)%1;
 const B=s.bones||(RAM_RIG&&RAM_RIG.bones),F=B?ramFrame(B):null,stride=RAM_RULE.stride/RAM_RULE.size;
 add('Head_0',0,-.35);add('Head_1',0,-.35);                                        // Tripo modelled the head turned to its left: bring it straight
 add('Spine_0',Math.sin(t*1.7)*.012*(1-go)*(1-paw));                              // breathing
 // head: carried low in the charge, nodding into the paw scrape, chin tucked so the horns lead when it rears
 add('Head_0',.28*go+.3*rear);add('Head_1',.12*go+.25*rear);
 add('bone_1',.35*go+.5*rear+Math.sin(t*3.1)*.08,0,Math.sin(t*2.3)*.12);           // tail
 // tall, heavy charge: chest and hips carried ~5 cm higher than crouched, vaulting up over mid-stance and easing into push-off
 const lift=(-.014+.014*Math.cos(Math.PI*4*(cyc-RAM_DUTY*.5)))*go+(F&&rear>1e-4?F.hipDz*Math.sin(.7*rear):0);
 P._lift=lift;
 // heavy charging trot: opposite corners plant together; each planted hoof sweeps back at travel speed so it stays locked,
 // planted hind legs straighten through push-off while the deep bend is kept for the high swing
 if(go>1e-4&&F){
  P._travel=-stride*cyc;P._short=0;P._down=[];P._marks=[];
  for(const leg of F.legs){
   const u=(cyc-leg.phase+1)%1,down=u<=RAM_DUTY;
   const z0=leg.spot+stride*(RAM_DUTY*.5),z1=leg.spot-stride*(RAM_DUTY*.5);
   let Tpt,toe=0;
   if(down)Tpt=[leg.spot-stride*(u-RAM_DUTY*.5),leg.foot[1]];
   else{const sc=(u-RAM_DUTY)/(1-RAM_DUTY),e=sc*sc*(3-2*sc),up=Math.sin(Math.PI*sc);Tpt=[z1+(z0-z1)*e,leg.foot[1]+(leg.front?.11:.145)*up];toe=(leg.front?.32:-.32)*up;}
   const bt=[leg.foot[0]+(Tpt[0]-leg.foot[0])*go,leg.foot[1]+(Tpt[1]-leg.foot[1])*go];
   const r=ramReach([leg.top[0],leg.top[1]+lift],bt,leg.a,leg.b,leg.bend);
   add(leg.names[0],-r.a);add(leg.names[1],-(r.b-r.a));add(leg.names[2],r.b+toe*go);
   P._down.push(down);
   if(down){P._short=Math.max(P._short,r.short);P._marks.push(-(bt[0]+(leg.front?.03:0)));} // negated so tests/creatures.html places the bar at +z
  }
 }
 // pawing: brief weight shift over the supporting right foreleg before the left forefoot lifts, reaches and scrapes back
 if(paw>1e-4){
  const u=((t/1.2+.13)%1+1)%1;
  const shift=paw*sm(0,.12,u)*(1-sm(.76,.96,u));
  const liftP=paw*sm(.18,.36,u)*(1-sm(.46,.58,u));
  const reach=paw*sm(.18,.42,u)*(1-sm(.46,.60,u));
  const scrape=paw*sm(.52,.64,u)*(1-sm(.72,.88,u));
  add('Spine_0',-.02*shift,-.13*shift,.17*shift);
  add('bone_23',-.18*shift,.10*shift,-.17*shift);add('bone_25',.31*shift);add('bone_26',-.13*shift);
  add('Spine_1',-.62*reach-.18*liftP+.16*scrape,0,-.10*shift);add('bone_29',.88*liftP+.28*reach+.36*scrape);add('bone_30',.25*liftP-.30*scrape);
  add('Head_0',paw*.18+.08*shift+.12*scrape,.12*shift,-.11*shift);add('Head_1',paw*.10+.08*scrape,0,-.05*shift);
  add('bone_1',.08*shift);
 }
 // rearing: the whole forehand swings up about the hips; both hind legs hang from 0_Right_Limb_0 on the patched rig and
 // turn back by the same amount to stay planted, while the forelegs fold under the chest
 if(rear>1e-4){
  add('0_Right_Limb_0',-.7*rear);add('0_Right_Limb_1',.7*rear);if(!F||F.hasHindL)add('HindL_1',.7*rear);
  for(const[top,bend]of[['Spine_1','bone_29'],['bone_23','bone_25']]){add(top,-.55*rear);add(bend,1.1*rear);}
 }
 return P;
}
const ram=RAM_RIG?(()=>{
 const base=new T.Group(),tilt=new T.Group(),root=new T.Group();scene.add(base);base.add(tilt);tilt.add(root);base.visible=false;root.scale.setScalar(RAM_RULE.size);
 const glow=new T.MeshStandardMaterial({color:'#ffffff',vertexColors:true,emissive:'#5a0f24',emissiveIntensity:.3,flatShading:true,roughness:.8,transparent:true});
 const leaf=new T.MeshBasicMaterial({transparent:true,opacity:0}),ember=new T.MeshBasicMaterial({color:0xe02e32,transparent:true}),flare=new T.MeshBasicMaterial({color:0xff4c2e,transparent:true,opacity:.24,depthWrite:false,blending:T.AdditiveBlending});
 const made=rigInstance(glow,RAM_RIG),rig=made.by,flares=[];root.add(made.mesh);
 for(const e of RAM_RIG.eyes){mesh(rig.Head_1,new T.SphereGeometry(.011,6,5),ember,e);flares.push(mesh(rig.Head_1,new T.SphereGeometry(.022,8,6),flare,e));}
 const mist=new T.Mesh(new T.SphereGeometry(.01,4,3),new T.MeshBasicMaterial({transparent:true,opacity:0}));mist.visible=false;root.add(mist);   // no smoke; kept so it shares the hares' code
 // what an arrow strikes: one rounded shape about its body and one about its head and horns, each fixed to a bone
 // (in the game: body about 1.3 m long, 0.65 m deep and wide; head and horns about 0.7 m across)
 const hitMesh=new T.Mesh(new T.SphereGeometry(1,8,6));hitMesh.visible=false;rig.Spine_0.add(hitMesh);hitMesh.position.set(0,-.06,-.15);hitMesh.scale.set(.19,.19,.37);
 const hitHead=new T.Mesh(hitMesh.geometry);hitHead.visible=false;rig.Head_1.add(hitHead);hitHead.position.set(.04,.08,.1);hitHead.scale.setScalar(.2);
 const sp={kind:'spirit',ram:true,rig,base,tilt,root,glow,glow0:.3,leaf,ember,flare,flares,mist,hitMesh,hitHead,meshes:[hitMesh,hitHead],scale:RAM_RULE.size,value:RAM_RULE.value,up:true,live:false,done:true,state:'off',t:0,cyc:0,go:0,paw:0,rear:0,due:0,struck:false,cfg:null};
 hitMesh.userData.target=sp;hitHead.userData.target=sp;return sp;
})():null;
function ramOff(){if(!ram)return;ram.base.visible=false;ram.live=false;ram.state='off';ram.due=0;}
// it appears: far down the lane, facing the bell
function ramSet(right=(Math.random()*2-1)*RAM_RULE.from[1]){
 const sp=ram;if(!sp)return;Object.assign(sp,{state:'in',t:0,live:true,done:false,cyc:0,go:0,paw:0,rear:0,struck:false});
 spiritPlace(sp,RAM_RULE.from[0],right);const[fx,fz]=yardAt(...watchFoot());spiritFace(sp,fx,fz);
 sp.base.visible=true;sp.root.position.set(0,0,0);sp.root.scale.setScalar(RAM_RULE.size);sp.glow.emissiveIntensity=sp.glow0;spiritShow(sp,0);rangeTargets();
}
function ramStep(dt){
 const sp=ram;if(!sp||!sp.base.visible)return;sp.t+=dt;
 const play=range.phase==='play',ease=(k,to,rate)=>{sp[k]+=(to-sp[k])*Math.min(1,dt*rate);};
 if(sp.state==='in'){spiritShow(sp,Math.min(1,sp.t/.8));if(sp.t>=.8){sp.state='stand';sp.t=0;note(98,.9,'sawtooth',.045,0,73);}}
 else if(sp.state==='stand'){ease('paw',1,4);if(play&&sp.t>=RAM_RULE.stand){sp.state='charge';sp.t=0;note(110,.5,'sawtooth',.04,0,82);}}
 else if(sp.state==='charge'){
  ease('paw',0,6);ease('go',1,2.5);
  if(play){
   const[tx,tz]=yardAt(...watchFoot()),b=sp.base.position,dx=tx-b.x,dz=tz-b.z,d=hyp(dx,dz),step=RAM_RULE.speed*sp.go*dt;spiritFace(sp,tx,tz);
   if(d<=RAM_RULE.reach){sp.state='rear';sp.t=0;}
   else{b.x+=dx/d*step;b.z+=dz/d*step;b.y=groundAt(b.x,b.z);sp.cyc+=step/RAM_RULE.stride;sp.along=(b.x-YARD.x)*YARD.ux+(b.z-YARD.z)*YARD.uz;sp.right=(b.x-YARD.x)*YARD.rx+(b.z-YARD.z)*YARD.rz;}
  }
 }
 else if(sp.state==='rear'){
  // up for most of a second, then down on the post: that is when the bands go on
  ease('go',0,8);const u=sp.t;sp.rear=u<.75?Math.sin(Math.min(1,u/.55)*Math.PI/2):Math.max(0,1-(u-.75)/.18);
  if(u>=.93&&!sp.struck){
   sp.struck=true;sp.live=false;rangeTargets();
   if(peal.root){const b=peal.root;if((b.userData.bound|0)<3){b.userData.bind(3);range.bound=(range.bound|0)+1;}b.userData.bell.getWorldPosition(peal.at);burst(peal.at,'#4A2943',16,1);}
   thump(90,.3,.3);note(110,.45,'triangle',.14,0,70);
  }
  if(u>=1.5){sp.state='leave';sp.t=0;}
 }
 else if(sp.state==='leave'){spiritShow(sp,Math.max(0,1-sp.t/.6));if(sp.t>=.6)ramOff();}
 else if(sp.state==='waking'){
  // banished: it rears, flares and is gone
  const u=sp.t/.9;sp.rear=Math.min(1,sp.t/.35);ease('go',0,8);ease('paw',0,8);sp.root.scale.setScalar(RAM_RULE.size*(1+u*.25));sp.glow.emissiveIntensity=sp.glow0+u*2;spiritShow(sp,Math.max(0,1-u*u));
  if(u>=1){sp.root.scale.setScalar(RAM_RULE.size);sp.glow.emissiveIntensity=sp.glow0;ramOff();}
 }
 const hot=sp.state==='stand'||sp.state==='charge'?.5+.25*Math.sin(elapsed*7):.2;sp.flare.opacity=hot*.45*sp.ember.opacity;for(const f of sp.flares)f.scale.setScalar(1+hot*.4);
 const B=sp.rig,P=ramPoseOf({cyc:sp.cyc,go:sp.go,paw:sp.paw,rear:sp.rear,t:elapsed});
 for(const n in B)B[n].rotation.set(0,0,0);for(const n in P)if(n[0]!=='_'&&B[n])B[n].rotation.set(P[n][0],P[n][1],P[n][2]);
 B.Root.position.y=RAM_RIG.rootY+(P._lift||0);
}
for(let k=0;k<9;k++){
 // a clump of tall grass that a spirit can sink into
 const g=new T.Group(),r=mulberry(300+k);scene.add(g);g.visible=false;
 for(let i=0;i<40;i++){const a=r()*6.28,d=Math.sqrt(r())*.8,h=.45+r()*.35,c=mesh(g,new T.ConeGeometry(.06,h,3),i%3?'#7d9a4a':'#a9ad62',V(Math.cos(a)*d,h/2,Math.sin(a)*d));c.rotation.set((r()-.5)*.3,r()*3,(r()-.5)*.3);}
 const hit=new T.Mesh(new T.SphereGeometry(1,8,6));hit.visible=false;hit.scale.set(.85,.5,.85);hit.position.y=.42;hit.userData.target={kind:'grass',g};g.add(hit);g.userData.hit=hit;   // what a Kiln arrow strikes
 grassClumps.push(g);
}
function spiritPlace(sp,along,right){
 const[x,z]=yardAt(along,right);sp.along=along;sp.right=right;sp.base.position.set(x,groundAt(x,z),z);
}
const spiritStart=cfg=>cfg.path?cfg.path[0]:cfg.area?[(cfg.area[0]+cfg.area[1])/2,cfg.area[2]+(cfg.area[3]-cfg.area[2])*Math.random()]:cfg.at;
// A shade's next stop. With a path it picks any other point on it; with an area, any spot in it at least a few metres off.
function spiritNext(sp){
 const c=sp.cfg;
 if(c.path){let i;do i=Math.floor(Math.random()*c.path.length);while(i===sp.seg);sp.seg=i;return c.path[i];}
 for(let n=0;n<20;n++){const a=c.area[0]+Math.random()*(c.area[1]-c.area[0]),r=c.area[2]+Math.random()*(c.area[3]-c.area[2]);if(hyp(a-sp.along,r-sp.right)>4)return[a,r];}
 return[(c.area[0]+c.area[1])/2,(c.area[2]+c.area[3])/2];
}
function spiritFace(sp,x,z){sp.base.rotation.y=Math.atan2(x-sp.base.position.x,z-sp.base.position.z);}
function spiritShow(sp,alpha){
 // the mist would give a hidden spirit away, so one in the grass has none: only its ears and its glow show
 sp.glow.opacity=sp.leaf.opacity=sp.ember.opacity=alpha;sp.mist.material.opacity=.34*alpha;sp.mist.visible=false;   // no smoke around a shade: its glowing eyes are enough to pick it out
}
// a spirit as the stage begins, or put back as it was for a replay
function spiritSet(sp,cfg){
 Object.assign(sp,{cfg,mode:cfg.t,value:SPIRIT[cfg.t],state:'in',t:0,live:true,done:false,up:true,seg:0,step:1,wait:cfg.t==='run'?1.2:1.6,sunk:0,rustle:1.5+Math.random()*2,swap:false,look:0,lookUntil:0,nextLook:elapsed+1+Math.random()*2,goal:null,pace:1,gait:0,gaitTo:0,phase:0,rear:0,fear:0,lowS:cfg.t==='hide'?1:0,exposed:false});
 sp.head.rotation.y=0;
 const at=spiritStart(cfg);spiritPlace(sp,at[0],at[1]);sp.base.visible=true;sp.root.position.set(0,0,0);sp.root.scale.setScalar(SPIRIT_SIZE);sp.root.rotation.set(0,0,0);
 if(cfg.path){const[x,z]=yardAt(cfg.path[1][0],cfg.path[1][1]);spiritFace(sp,x,z);}else sp.base.rotation.y=(cfg.area?Math.random()*6.28:0)+Math.atan2(YARD.x-sp.base.position.x,YARD.z-sp.base.position.z)+1.2;   // sitters sit side-on to the archer
 // a hiding spirit shows only its ears, so only its head can be struck
 const hidden=cfg.t==='hide';if(!sp.bound){sp.hitMesh.position.set(0,hidden?.42:.26,hidden?.1:.02);sp.hitMesh.scale.setScalar(hidden?.2:.3);}   // the standing hare sets its own in standingPose
 spiritShow(sp,0);
}
function spiritWake(sp){
 sp.state='waking';sp.t=0;sp.live=false;sp.done=true;sp.mist.visible=false;rangeTargets();
 const at=sp.root.getWorldPosition(V()).add(V(0,.3,0));burst(at,'#ff6a3c',22,1.6,1.5);burst(at,'#3b2444',14,1.3,1.2);
 note(180,.5,'sawtooth',.05,0,60);[523,784,1047].forEach((f,k)=>note(f,.45,'sine',.08,.08+k*.07));   // a snarl cut short, then a clear chime
}
// a near miss sends the nearest sitting or hiding spirit drifting off into the mist
function spiritStartle(at){
 let best=null,bd=3;for(const sp of spirits){if(!sp.live||sp.state!=='idle'||(sp.mode!=='sit'&&sp.mode!=='hide'))continue;const d=hyp(sp.base.position.x-at.x,sp.base.position.z-at.z);if(d<bd){bd=d;best=sp;}}
 if(!best)return;best.state='startled';best.t=0;best.live=false;rangeTargets();note(330,.35,'sine',.06,0,180);
}
// ---- winged shades. A stand-in built from a few solids until a modelled one is made: dark body, ember eyes, two flat wings that beat.
const perches=[],bushes=[];
for(let k=0;k<5;k++){
 const base=new T.Group(),tilt=new T.Group(),root=new T.Group();scene.add(base);base.add(tilt);tilt.add(root);base.visible=false;root.scale.setScalar(1.15);
 const glow=new T.MeshStandardMaterial({color:'#33203e',emissive:'#5a0f24',emissiveIntensity:.45,flatShading:true,roughness:.85,transparent:true});
 const leaf=new T.MeshStandardMaterial({color:'#7c1c2c',emissive:'#ff4a2a',emissiveIntensity:.55,flatShading:true,roughness:.85,transparent:true,side:T.DoubleSide});
 const ember=new T.MeshBasicMaterial({color:0xff3b1f,transparent:true}),flare=new T.MeshBasicMaterial({color:0xff5a2a,transparent:true,opacity:.3,depthWrite:false,blending:T.AdditiveBlending});
 mesh(root,new T.SphereGeometry(.12,8,6),glow,V(0,0,0)).scale.set(1,.85,2.1);
 const head=new T.Group(),flares=[];head.position.set(0,.05,.26);root.add(head);mesh(head,new T.SphereGeometry(.08,8,6),glow,V());
 mesh(head,new T.ConeGeometry(.03,.12,4),leaf,V(0,-.01,.11)).rotation.x=Math.PI/2;   // beak
 for(const e of[-1,1]){mesh(head,new T.SphereGeometry(.02,6,5),ember,V(e*.045,.025,.055));flares.push(mesh(head,new T.SphereGeometry(.03,8,6),flare,V(e*.047,.025,.06)));}
 const wing=side=>{   // a flat ragged blade hinged at the shoulder
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([0,0,.14, 0,0,-.16, side*.34,0,.04,  0,0,-.16, side*.62,0,-.12, side*.34,0,.04,  0,0,-.16, side*.3,0,-.3, side*.62,0,-.12],3));g.computeVertexNormals();
  const hinge=new T.Group();hinge.position.set(side*.07,.04,0);root.add(hinge);hinge.add(new T.Mesh(g,leaf));return hinge;
 };
 const wings=[wing(-1),wing(1)];
 const tailGeo=new T.BufferGeometry();tailGeo.setAttribute('position',new T.Float32BufferAttribute([0,0,-.2, -.12,0,-.46, .12,0,-.46],3));tailGeo.computeVertexNormals();root.add(new T.Mesh(tailGeo,leaf));
 const mist=new T.Mesh(new T.SphereGeometry(.01,4,3),new T.MeshBasicMaterial({transparent:true,opacity:0}));mist.visible=false;root.add(mist);   // winged shades have no smoke; kept so they share the hares' code
 const hitMesh=new T.Mesh(new T.SphereGeometry(1,8,6));hitMesh.visible=false;hitMesh.scale.setScalar(.36);root.add(hitMesh);
 const sp={kind:'spirit',bird:true,rig:null,seed:k*3.1,base,tilt,root,head,ears:[],wings,flares,flare,glow,glow0:.45,leaf,ember,mist,hitMesh,meshes:[hitMesh],scale:1.15,up:true,kick:-10,live:false,done:true,mode:'perch',state:'off',t:0,look:0,lookUntil:0,nextLook:0,turn:0,vel:V(),beat:0,air:0};
 hitMesh.userData.target=sp;sp.set=birdSet;spirits.push(sp);
 // a perching post and a bush for it to hide in, used when a stage calls for them
 const post=new T.Group();scene.add(post);post.visible=false;stick(post,V(0,-.4,0),V(0,1,0),.05,timber);stick(post,V(-.28,.97,0),V(.28,.97,0),.035,timber);perches.push(post);
 const bush=new T.Group(),r=mulberry(500+k);scene.add(bush);bush.visible=false;
 for(let i=0;i<7;i++)mesh(bush,new T.IcosahedronGeometry(.34+r()*.22,0),i%3?'#5f8a45':'#7fa052',V((r()-.5)*.9,.3+r()*.35,(r()-.5)*.9));
 bushes.push(bush);
}
// one pass across the lane for a crossing shade: a fresh side, height and speed every time
function birdPass(sp){
 const side=Math.random()<.5?-1:1,along=sp.cfg.lane+(Math.random()-.5)*3,[x,z]=yardAt(along,-side*12),h=3.2+Math.random()*3.6,speed=6.5+Math.random()*3;
 sp.base.position.set(x,groundAt(x,z)+h,z);sp.vel.set(YARD.rx*side*speed,0,YARD.rz*side*speed);sp.passFor=24/speed;sp.height=sp.base.position.y;
 sp.base.rotation.y=Math.atan2(sp.vel.x,sp.vel.z);sp.state='idle';sp.t=0;sp.air=1;sp.live=true;sp.root.visible=true;spiritShow(sp,1);rangeTargets();
}
function birdSet(sp,cfg){
 Object.assign(sp,{cfg,mode:cfg.t,value:SPIRIT[cfg.t],state:'in',t:0,live:cfg.t!=='flush',done:false,up:true,look:0,lookUntil:0,nextLook:elapsed+1+Math.random()*2,air:cfg.t==='cross'?1:0,beat:Math.random()*6,patience:6+Math.random()*7,glint:0,nextGlint:1.5+Math.random()*2,along:cfg.lane||cfg.at[0],right:cfg.lane?0:cfg.at[1]});
 sp.base.visible=true;sp.root.visible=true;sp.root.position.set(0,0,0);sp.root.scale.setScalar(1.15);sp.root.rotation.set(0,0,0);sp.head.rotation.set(0,0,0);sp.vel.set(0,0,0);
 if(cfg.t==='cross'){birdPass(sp);sp.state='in';spiritShow(sp,0);return;}
 const[x,z]=yardAt(cfg.at[0],cfg.at[1]),g=groundAt(x,z);sp.base.position.set(x,g+(cfg.t==='perch'?cfg.at[2]+.1:.45),z);
 sp.base.rotation.y=Math.atan2(YARD.x-x,YARD.z-z)+(cfg.t==='perch'?1.1:0);spiritShow(sp,0);
}
// it takes to the air: off its post after a near miss, or out of its bush
function birdLift(sp,flushed){
 const away=Math.random()<.5?-1:1,up=flushed?4.2:3,out=flushed?3.5+Math.random()*2:4.5;
 sp.vel.set(YARD.rx*away*out+YARD.ux*(1+Math.random()*2),up,YARD.rz*away*out+YARD.uz*(1+Math.random()*2));
 sp.base.rotation.y=Math.atan2(sp.vel.x,sp.vel.z);sp.state='fly';sp.t=0;sp.air=1;sp.flightFor=flushed?5.5:1.6;sp.live=flushed;sp.root.visible=true;spiritShow(sp,1);rangeTargets();
 note(flushed?520:330,.3,'sawtooth',.03,0,flushed?900:180);
}
// what a spent arrow does to the winged ones: a near miss lifts a percher, a landing by a bush flushes what is in it
function birdsHear(q){
 const n=q.near;if(n&&n.target.bird&&n.target.mode==='perch'&&n.target.state==='idle'&&n.off<2.2)birdLift(n.target,false);
 for(const sp of spirits)if(sp.bird&&sp.base.visible&&sp.state==='lurk'&&hyp(sp.base.position.x-q.o.position.x,sp.base.position.z-q.o.position.z)<3.5)birdLift(sp,true);
}
function birdStep(sp,dt,play){
 sp.t+=dt;sp.beat+=dt*(sp.air?17:0);
 // wings: beating in the air, folded along the back on a perch
 sp.wings.forEach((w,i)=>{const side=i?1:-1;w.rotation.z=sp.air?side*Math.sin(sp.beat)*.85:-side*1.15;w.rotation.y=sp.air?0:-side*.55;});
 if(sp.state==='in'){spiritShow(sp,sp.mode==='flush'?0:Math.min(1,sp.t/.4));if(sp.mode==='cross')sp.base.position.addScaledVector(sp.vel,dt);if(sp.t>=.4){sp.state=sp.mode==='flush'?'lurk':'idle';sp.t=sp.mode==='cross'?sp.t:0;}return;}
 if(sp.state==='waking'){const u=sp.t/.7;sp.root.scale.setScalar(1.15*(1+u*.6));sp.glow.emissiveIntensity=sp.glow0+u*2;spiritShow(sp,Math.max(0,1-u*u));if(u>=1){sp.base.visible=false;sp.state='off';sp.glow.emissiveIntensity=sp.glow0;}return;}
 if(sp.state==='away'){if(sp.t>=sp.cfg.back&&play){const c=sp.cfg;sp.set(sp,c);rangeTargets();}return;}
 if(sp.state==='gap'){if(sp.t>=sp.gapFor&&play)birdPass(sp);return;}
 if(sp.state==='lurk'){
  // hidden in its bush: nothing shows but a glint of its eyes now and then, and the leaves stirring
  spiritShow(sp,0);sp.nextGlint-=dt;if(sp.nextGlint<=0){sp.nextGlint=2.5+Math.random()*2.5;sp.glint=1;sp.shake=elapsed;if(play)note(2100+Math.random()*500,.16,'triangle',.012,0,1400);}
  sp.glint=Math.max(0,sp.glint-dt*1.1);sp.flare.opacity=sp.glint*.85;for(const f of sp.flares)f.scale.setScalar(1.6+sp.glint);
  if(sp.bush)sp.bush.rotation.z=Math.exp(-5*(elapsed-(sp.shake||-9)))*Math.sin((elapsed-(sp.shake||0))*30)*.07;
  if(play){sp.patience-=dt;if(sp.patience<=0)birdLift(sp,true);}
  return;
 }
 if(sp.state==='fly'){
  // climbing away, the climb easing off; it fades at the end of its flight
  sp.vel.y=Math.max(1.2,sp.vel.y-dt*.9);sp.base.position.addScaledVector(sp.vel,dt);sp.root.rotation.x=-.25;
  const left=sp.flightFor-sp.t;spiritShow(sp,clamp(left/.5,0,1));
  if(left<=0){sp.live=false;sp.root.rotation.x=0;if(sp.mode==='perch'&&sp.cfg.back&&play){sp.state='away';sp.t=0;sp.root.visible=false;}else{sp.base.visible=false;sp.state='off';sp.done=true;}rangeTargets();}
  const b=sp.base.position;sp.right=(b.x-YARD.x)*YARD.rx+(b.z-YARD.z)*YARD.rz;return;
 }
 // idle
 if(sp.mode==='cross'){
  if(play){sp.base.position.addScaledVector(sp.vel,dt);sp.base.position.y=sp.height+Math.sin(sp.t*2.2)*.35;}
  const b=sp.base.position;sp.right=(b.x-YARD.x)*YARD.rx+(b.z-YARD.z)*YARD.rz;sp.root.rotation.z=Math.sin(sp.t*1.3)*.12;
  if(sp.t>=sp.passFor){sp.state='gap';sp.t=0;sp.gapFor=.6+Math.random()*1.8;sp.live=false;sp.root.visible=false;rangeTargets();}
  sp.flare.opacity=.3*sp.ember.opacity;return;
 }
 // perched: it turns to look at the archer, eyes flaring, as the hares do
 if(elapsed>sp.nextLook){sp.lookUntil=elapsed+1.5;sp.nextLook=elapsed+3+Math.random()*3;}
 sp.look+=((sp.lookUntil>elapsed?1:0)-sp.look)*Math.min(1,dt*7);
 {const b=sp.base.position;let turn=Math.atan2(YARD.x-b.x,YARD.z-b.z)-sp.base.rotation.y;turn=Math.atan2(Math.sin(turn),Math.cos(turn));sp.head.rotation.y=clamp(turn,-1.4,1.4)*sp.look;}
 sp.head.rotation.x=Math.sin(elapsed*1.9+sp.seed)*.08;sp.root.rotation.x=.25;
 sp.flare.opacity=(.12+.5*sp.look)*sp.ember.opacity;for(const f of sp.flares)f.scale.setScalar(1+sp.look*.9);
}
function spiritStep(dt){
 if(!range.on)return;
 for(const sp of spirits){
  if(!sp.base.visible)continue;
  if(sp.bird){birdStep(sp,dt,range.phase==='play');continue;}
  sp.t+=dt;
  sp.rear=sp.state==='waking'?Math.min(1,sp.t/.35):0;sp.fear+=((sp.state==='startled'?1:0)-sp.fear)*Math.min(1,dt*10);if(sp.state!=='idle')sp.gaitTo=0;
  shadePose(sp,dt);
  const moving=sp.mode==='creep'||sp.mode==='run',play=range.phase==='play';
  if(sp.state==='in'){spiritShow(sp,Math.min(1,sp.t/.5));if(sp.t>=.5){sp.state='idle';sp.t=0;}}
  else if(sp.state==='waking'){
   // banished: it rears up, flares and is gone
   const u=sp.t/.9;sp.root.position.y=u*1.6*(2-u);sp.root.scale.setScalar(SPIRIT_SIZE*(1+u*.5));sp.glow.emissiveIntensity=sp.glow0+u*2;spiritShow(sp,Math.max(0,1-u*u));
   if(u>=1){sp.base.visible=false;sp.state='off';sp.glow.emissiveIntensity=sp.glow0;}continue;
  }
  else if(sp.state==='startled'){
   spiritShow(sp,Math.max(0,1-sp.t/.5));
   if(sp.t>=.5){
    if(sp.cfg.back&&play){sp.state='away';sp.t=0;}else{sp.base.visible=false;sp.state='off';sp.done=true;}
   }
   continue;
  }
  else if(sp.state==='away'){
   if(sp.t>=sp.cfg.back){sp.swap=!sp.swap;const at=sp.swap&&sp.cfg.alt?sp.cfg.alt:sp.cfg.at;spiritPlace(sp,at[0],at[1]);sp.state='in';sp.t=0;sp.live=true;rangeTargets();}
   continue;
  }
  // It looks at the archer every few seconds, and always just before it sets off: the head turns and the eyes flare.
  if(elapsed>sp.nextLook&&(!moving||sp.wait>0)){sp.lookUntil=elapsed+1.5;sp.nextLook=elapsed+3.5+Math.random()*3;}
  if(moving&&sp.wait>0&&sp.wait<.9)sp.lookUntil=Math.max(sp.lookUntil,elapsed+.15);
  sp.look+=((sp.lookUntil>elapsed?1:0)-sp.look)*Math.min(1,dt*7);
  {const b=sp.base.position;let turn=Math.atan2(YARD.x-b.x,YARD.z-b.z)-sp.base.rotation.y;turn=Math.atan2(Math.sin(turn),Math.cos(turn));sp.turn=clamp(turn,-1.25,1.25);sp.head.rotation.y=sp.turn*sp.look;}
  sp.flare.opacity=(.12+.5*sp.look)*sp.ember.opacity;for(const f of sp.flares)f.scale.setScalar(1+sp.look*.9+Math.sin(elapsed*9)*.08*sp.look);
  // idle: ears twitch; a hidden one rustles its grass now and then
  sp.ears.forEach((e,i)=>{e.rotation.z=(i?-1:1)*.12+Math.sin(elapsed*3+i*2+sp.base.position.x)*.07;e.rotation.x=-.15+Math.sin(elapsed*1.7+i)*.05;});
  sp.mist.scale.setScalar(1+Math.sin(elapsed*1.3+sp.base.position.z)*.06);sp.mist.visible=false;
  if(sp.mode==='hide'){
   sp.root.position.y=sp.exposed?0:-sp.sink;sp.rustle-=dt;
   if(sp.rustle<=0){sp.rustle=2.8+Math.random()*2;sp.shake=elapsed;sp.lookUntil=elapsed+1.5;sp.nextLook=elapsed+9;if(play)note(2400+Math.random()*600,.18,'triangle',.012,0,1500);}
   if(sp.clump)sp.clump.rotation.z=Math.exp(-5*(elapsed-(sp.shake||-9)))*Math.sin((elapsed-(sp.shake||0))*30)*.13;
  }
  if(moving&&play){
   const run=sp.mode==='run';
   if(sp.wait>0){sp.wait-=dt;sp.gaitTo=0;sp.root.position.y=lerp(sp.root.position.y,-sp.sink*sp.sunk,Math.min(1,dt*8));sp.root.rotation.x=lerp(sp.root.rotation.x,0,Math.min(1,dt*8));}
   else{
    // each leg of its journey has its own goal and its own pace
    if(!sp.goal){sp.goal=spiritNext(sp);sp.pace=run?.82+Math.random()*.4:.8+Math.random()*.45;}
    const[tx,tz]=yardAt(sp.goal[0],sp.goal[1]),b=sp.base.position,dx=tx-b.x,dz=tz-b.z,d=hyp(dx,dz),speed=(run?6.5:.95)*sp.pace,go=speed*dt;
    spiritFace(sp,tx,tz);sp.gaitTo=run?1:.45;sp.phase+=dt*(run?13:6.5)*sp.pace;
    if(sp.bound)sp.cyc+=Math.min(go,d)/((run?HARE_MOVES.run:HARE_MOVES.lope).stride*HARE_SCALE*SPIRIT_SIZE);   // the standing hare's bound follows the ground it covers
    if(d<=go){
     b.x=tx;b.z=tz;sp.along=sp.goal[0];sp.goal=null;
     // a runner sometimes only checks its stride and is off again; otherwise it stops, for a while that is never the same twice
     sp.wait=run?(Math.random()<.25?.18:.6+Math.random()*1.5):1.1+Math.random()*1.4;
    }else{b.x+=dx/d*go;b.z+=dz/d*go;}
    b.y=groundAt(b.x,b.z);
    // it hops as it goes, and sinks to its ears wherever the grass is tall
    sp.sunk=sp.mode==='creep'&&grassClumps.some(g=>g.visible&&hyp(g.position.x-b.x,g.position.z-b.z)<.85)?1:0;
    const hop=sp.bound?0:Math.max(0,Math.sin(sp.phase))*(run?.16:.05);   // the standing hare's leap is in its own pose
    sp.root.position.y=lerp(sp.root.position.y,hop-sp.sink*sp.sunk,Math.min(1,dt*12));sp.root.rotation.x=sp.rig?0:run?-.18+hop:0;   // a rigged hare pitches with its own spine
    const dxy=b.x-YARD.x,dzy=b.z-YARD.z;sp.right=dxy*YARD.rx+dzy*YARD.rz;
   }
   // a creeping spirit deep in the grass is as hard to strike as a hiding one
   if(!sp.bound){sp.hitMesh.scale.setScalar(sp.sunk?.2:.3);sp.hitMesh.position.set(0,sp.sunk?.42:.26,sp.sunk?.1:.02);}
  }
 }
 // the stage is over once every spirit is free or gone
 if(range.phase==='play'&&STAGES[range.stage].spirits&&!STAGES[range.stage].watch&&spirits.every(sp=>sp.done||!sp.cfg)&&!range.endAt)range.endAt=elapsed+1.3;
}
function rangeTargets(){
 rangeMeshes=[];for(const r of rangeRounds)if(r.base.visible)rangeMeshes.push(...r.meshes);
 for(const sp of spirits)if(sp.live&&sp.base.visible){rangeMeshes.push(sp.hitMesh);if(sp.hitHead)rangeMeshes.push(sp.hitHead);}
 if(ram&&ram.live&&ram.base.visible)rangeMeshes.push(...ram.meshes);
 for(const id in rangeSigns)if(rangeSigns[id].base.visible)rangeMeshes.push(...rangeSigns[id].meshes);
 if(peal.mesh)rangeMeshes.push(peal.mesh);
}
function setStage(i){
 if(i===-2)STAGES[-2]={name:'Mechanics lab',lab:true,arrows:9999,marks:[[10,-3,1.2],[20,0,1.2],[30,3,1.2]]};   // like Bell Watch, it lives outside the list of stages
 if(i===-1){STAGES[-1]=watchStage();state.range.best[-1]=state.range.watchBest||0;}
 const st=STAGES[i];Object.assign(range,{gap:'',gain:0,perfectHits:0,specialUsed:0,ribbon:'',stage:i,phase:'play',arrows:st.arrows,score:0,streak:0,best:0,hits:0,stars:0,newBest:false,t0:elapsed,endAt:0,pending:null,last:'',shot:null,lastShot:null,closest:null,replayed:false,skip:false,fired:0,guided:i===0&&!(state.range.stars[0]>0)});fps.low=0;
 quiver.kind='std';quiver.charges=ARROWS?ARROW_RULE.charges:0;tallyStart(st.name);
 if(PEAL){pealBuild();if(state.range.bell1&&!peal.rung)pealRing(true);}
 if(peal.root){peal.root.userData.set(st.watch||state.range.bell1?'restored':'silent');peal.root.userData.bind(0);}
 ramOff();if(st.watch){range.endAt=elapsed+WATCH_RULE.seconds;range.bound=0;range.rings=0;for(const sp of spirits)sp.due=0;if(ram)ram.due=elapsed+watchRand(...RAM_RULE.first);}
 for(let k=projectiles.length-1;k>=0;k--)recycle(k);
 if(replay.arrow)replay.arrow.visible=false;
 rangeRounds.forEach((r,k)=>{
  const m=st.marks[k];r.base.visible=!!m;if(!m)return;
  const[x,z]=yardAt(m[0],m[1]),h=.75+.72*m[2];Object.assign(r,{along:m[0],right:m[1],scale:m[2],slide:m[3]||null,pop:m[4]||null,up:true,lag:0,heldUntil:0,frosted:false});if(r.bracket)r.bracket.visible=false;
  r.base.position.set(x,groundAt(x,z),z);r.base.rotation.y=Math.atan2(YARD.x-x,YARD.z-z);r.root.position.y=h;r.root.scale.setScalar(m[2]);r.post.scale.y=h;r.post.position.y=h/2;r.tilt.rotation.x=0;
 });
 const wild=st.spirits||[];
 // each shade the stage asks for takes the next free hare or winged one
 for(const sp of spirits){sp.cfg=null;sp.base.visible=false;sp.live=false;sp.done=true;sp.state='off';}
 for(const w of wild){const sp=spirits.find(x=>!x.cfg&&!!x.bird===!!WINGED[w.t]);if(sp){sp.cfg=w;sp.set(sp,w);}}
 // posts under the perchers, bushes over the lurkers
 const birds=spirits.filter(x=>x.bird);
 birds.forEach((sp,k)=>{
  const c=sp.cfg,post=perches[k],bush=bushes[k];post.visible=!!c&&c.t==='perch';bush.visible=!!c&&c.t==='flush';sp.bush=bush.visible?bush:null;bush.rotation.z=0;
  if(post.visible){const[x,z]=yardAt(c.at[0],c.at[1]);post.position.set(x,groundAt(x,z),z);post.scale.set(1,c.at[2],1);post.rotation.y=Math.atan2(YARD.x-x,YARD.z-z);}
  if(bush.visible){const[x,z]=yardAt(c.at[0],c.at[1]);bush.position.set(x,groundAt(x,z),z);}
 });
 // tall grass: wherever the stage asks for it, and around every hiding spirit
 const tufts=[...(st.grass||[]),...wild.filter(w=>w.t==='hide').map(w=>w.at)];
 grassClumps.forEach((g,k)=>{const at=tufts[k];g.visible=!!at;g.rotation.z=0;if(at){const[x,z]=yardAt(at[0],at[1]);g.position.set(x,groundAt(x,z),z);}});
 spirits.forEach(sp=>{sp.clump=sp.cfg&&sp.cfg.t==='hide'?grassClumps.find(g=>g.visible&&hyp(g.position.x-sp.base.position.x,g.position.z-sp.base.position.z)<.1):null;});
 // a perfect run: every arrow a bullseye, or every spirit woken
 range.ideal=wild.length?wild.reduce((a,w)=>a+SPIRIT[w.t]+(w.path?w.path[0][0]:w.area?(w.area[0]+w.area[1])/2:w.lane||w.at[0]),0):st.arrows*(100+st.marks.reduce((a,m)=>a+m[0],0)/st.marks.length);
 for(const id in rangeSigns)rangeSigns[id].base.visible=false;
 if($('stageSel').options.length===STAGES.length)$('stageSel').value=i;
 rangeTargets();say((st.chapter?'Chapter 2  ·  '+st.chapter+'  ·  ':'Stage '+(i+1)+'  ·  ')+st.name,st.chapter?5:3);note(523,.25,'sine',.08);
}
// ---- the guided first stage: one plain instruction at a time, until stage 1 has been passed once
const guide=(()=>{
 const el=document.createElement('div');el.id='guide';el.className='ui';el.hidden=true;$('hud').append(el);
 const c=document.createElement('canvas');c.width=1024;c.height=256;const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;
 // in VR the words stand on a low board just ahead of the line, under the line of sight to the target
 const[x,z]=yardAt(3.4,0),g=groundAt(x,z),panel=new T.Mesh(new T.PlaneGeometry(2.4,.6),new T.MeshBasicMaterial({map:tex,transparent:true}));
 panel.position.set(x,g+.62,z);panel.rotation.order='YXZ';panel.rotation.y=Math.atan2(YARD.x-x,YARD.z-z);panel.rotation.x=-.55;panel.visible=false;scene.add(panel);
 let shown=null;
 return{panel,get text(){return shown;},set(text){
  panel.visible=!!text&&xrOn();if(text===shown)return;shown=text;el.textContent=text||'';el.hidden=!text;if(!text)return;
  const k=c.getContext('2d');k.clearRect(0,0,1024,256);k.fillStyle='rgba(30,41,38,.9)';k.fillRect(0,0,1024,256);k.strokeStyle='#bcaa7a';k.lineWidth=8;k.strokeRect(8,8,1008,240);
  k.fillStyle='#ffebbd';k.textAlign='center';k.textBaseline='middle';k.font='54px Georgia';const lines=[];let line='';
  for(const w of text.split(' ')){if(k.measureText(line+' '+w).width>940&&line){lines.push(line);line=w;}else line=line?line+' '+w:w;}
  lines.push(line);lines.forEach((l,i)=>k.fillText(l,512,128+(i-(lines.length-1)/2)*66));tex.needsUpdate=true;
 }};
})();
const guiding=()=>range.on&&range.guided;
function guideText(){
 if(!guiding()||!(playing||xrOn())||range.phase==='replay')return'';
 const vr=xrOn(),bare=vr&&hands.some(h=>h.source?.hand),one=vr&&state.draw==='one'&&!bare;
 if(range.phase==='results')return range.stars?(vr?'Well shot. Shoot the NEXT sign to go on':'Well shot. Shoot the NEXT sign, or press N, to go on'):(vr?'Shoot the AGAIN sign to try once more':'Shoot the AGAIN sign, or press R, to try once more');
 if(range.hits===0){
  if(charging)return vr?(one?'Point the bow at the target, then let go of the trigger':'Pull your hand back, look along the arrow at the target, then let go'):'Put the small circle on the target, then let go';
  if(range.fired)return'Aim at the middle of the target and try again';
  return vr?(bare?'Pinch the bowstring with your free hand and pull it back':one?'Hold a trigger to draw the bow':'Bring your free hand to the bowstring and hold its trigger'):'Hold the left mouse button to draw the bow';
 }
 if(range.hits<2)return'A hit. Hits in a row build a streak';
 return vr?'Let go just as you feel the pulse at full draw: a perfect release':'Let go just as the bar turns white: a perfect release';
}
// ---- Special arrows: Rime (frost), Gale and Kiln. The rules and every number are Gemini's (design/arrows-spec.md);
// the cues are ChatGPT's (design/chatgpt-round-1.md). Never on in release mode. Outside it, on when src/config.json sets
// "arrows" or the page is opened with ?arrows=1. Nothing here draws a random number.
//   Two charges a stage, shared by the three. A special shot spends a charge and a stage arrow, hit or miss.
//   Rime  a hit on a sliding or pop-up target holds its timer for 1.8 s, once per target. Scores nothing.
//   Gale  takes half the sideways wind; the ring or shade value it scores is capped at 60.
//   Kiln  a hit on a clump of tall grass clears it for the stage. Scores nothing and never harms a shade.
//   A Rime or Kiln shot that does its job leaves the streak alone; one that hits anything else breaks it.
const ARROWS=!RELEASE&&(!!CONFIG.arrows||QUERY.get('arrows')==='1');
const ARROW_RULE={charges:2,hold:1.8,galeWind:.5,galeCap:60},ARROW_NAMES={std:'Standard',rime:'Rime',gale:'Gale',kiln:'Kiln'},ARROW_ORDER=['std','rime','gale','kiln'];
const quiver={kind:'std',charges:0};
function quiverPick(kind){
 if(!ARROWS||!range.on||range.phase!=='play')return;
 if(kind!=='std'&&quiver.charges<=0){say('No special arrows left',1.5);kind='std';}else say(kind==='std'?'Standard arrow':ARROW_NAMES[kind]+' arrow  ·  '+quiver.charges+' special left',1.5);
 quiver.kind=kind;note(660,.08,'sine',.05);
}
const QUIVER_BAND={rime:'#8fd0ee',gale:'#4A2943',kiln:'#f6e6bd'};
function quiverMark(){
 let b=preview.userData.band;if(!b){if(quiver.kind==='std')return;b=preview.userData.band=mesh(preview.userData.body,new T.CylinderGeometry(.021,.021,.09,6),'#8fd0ee',V(0,0,.45));b.rotation.x=Math.PI/2;}
 b.visible=quiver.kind!=='std'&&range.phase==='play';if(b.visible)b.material=material(QUIVER_BAND[quiver.kind]);
}
function quiverStep(d){quiverPick(ARROW_ORDER[(ARROW_ORDER.indexOf(quiver.kind)+d+4)%4]);}
const ARROW_MARKS={std:'',rime:'[ ]  ',gale:'≈  ',kiln:'^^^  '};
const quiverText=()=>ARROWS&&range.phase==='play'?'      '+ARROW_MARKS[quiver.kind]+ARROW_NAMES[quiver.kind]+'  '+'●'.repeat(quiver.charges)+'○'.repeat(ARROW_RULE.charges-quiver.charges):'';
// Gale's cue: a short cream trail with three plum bands behind the arrow
function galeCue(o,on){
 let t=o.userData.gale;
 if(!t){if(!on)return;t=o.userData.gale=new T.Group();o.add(t);box(t,V(0,0,1.15),V(.035,.035,1),'#f6e6bd');for(let i=0;i<3;i++)box(t,V(0,0,.85+i*.3),V(.05,.05,.09),'#4A2943');}
 t.visible=on;
}
// Rime's cue: a broad sky-blue bracket locked about the target for as long as it is held
function rimeCue(t){
 if(!t.bracket){const b=new T.Group();t.root.add(b);t.bracket=b;const D=1.2,w=.08*D,out=D/2+.05*D+w/2;for(const s of[-1,1]){box(b,V(s*out,0,0),V(w,2*out+w,.05),'#8fd0ee');for(const y of[-1,1])box(b,V(s*(out-.15),y*out,0),V(.3+w,w,.05),'#8fd0ee');}}   // stroke 8% of the face's width, 5% clear of its rim
 t.bracket.visible=true;
}
// Kiln's cue: three broad cream chevrons that rise from the cleared clump and shrink away
const kilnMark=ARROWS?(()=>{const m=new T.Group();m.visible=false;scene.add(m);for(let i=0;i<3;i++)for(const s of[-1,1]){box(m,V(s*.29,i*.34,-.02),V(.84,.19,.03),'#4A2943').rotation.z=-s*.6;box(m,V(s*.29,i*.34,0),V(.78,.13,.05),'#f6e6bd').rotation.z=-s*.6;}return{g:m,t:-9,y:0};})():null;   // about 80% of a clump's width, cream on a thin plum edge
// a special arrow has done its job (ok) or failed to; it scores nothing either way, and only a failure breaks the streak
function specialDone(q,ok,text,at,color,life){
 q.done=true;if(q.path)q.path.push(q.o.position.clone());
 if(!ok){if(range.streak>1)note(196,.25,'triangle',.08,0,130);range.streak=0;}
 if(at)popup(text,at,color,life);else say(text,1.6);
 if(range.arrows<=0)range.endAt=Math.min(range.endAt||1e9,elapsed+.9);
}
// a Rime or Kiln arrow striking a target or a shade. Returns true when it has dealt with the hit; Gale and Standard go on to score.
function specialHit(t,q){
 if(q.kind!=='rime'&&q.kind!=='kiln')return false;
 const at=q.o.position.clone().add(V(0,.5*(t.scale||1),0)),ring=t.kind==='range';
 const ok=q.kind==='rime'&&ring&&!!(t.slide||t.pop)&&!t.frosted&&(!t.pop||t.up);   // a pop-up already folding cannot be held (it would only be held down)
 if(ok){t.frosted=true;t.heldUntil=elapsed+ARROW_RULE.hold;rimeCue(t);note(1568,.5,'sine',.08,0,1175);}
 if(ring){t.kick=elapsed;thump(500,.15,.25);}
 specialDone(q,ok,ok?'Held':'No effect',ok?at.add(V(0,.35*(t.scale||1),0)):at,ok?'#9fd8f0':'#fff1c4',ok?.4:1.4);return true;   // the word stays 0.4 s; the bracket carries the rest of the hold
}
// a Kiln arrow striking a clump of tall grass: the clump is gone for the stage and whatever hid in it is in the open
function kilnClear(t,q){
 const c=t.g;c.visible=false;kilnMark.g.position.copy(c.position);kilnMark.g.rotation.y=Math.atan2(YARD.x-c.position.x,YARD.z-c.position.z);kilnMark.y=c.position.y;kilnMark.t=elapsed;
 for(const sp of spirits){
  const here=sp.clump===c||(sp.base.visible&&!sp.bird&&hyp(sp.base.position.x-c.position.x,sp.base.position.z-c.position.z)<.85);if(!here)continue;
  if(sp.clump===c){sp.clump=null;sp.exposed=true;}
  sp.sunk=0;if(!sp.bound){sp.hitMesh.position.set(0,.26,.02);sp.hitMesh.scale.setScalar(.3);}   // a creeper resting there comes up out of it as well
 }
 note(520,.3,'triangle',.08,0,260);specialDone(q,true,'Cleared',null);   // the word goes to the message line, so the chevrons and the shade stay in view
}
function rangeLoosed(q,perfect){
 if(!range.on)return;q.windy=true;
 if(range.phase!=='play')return;
 q.ranged=true;q.perfect=perfect;q.path=[q.o.position.clone()];if(!STAGES[range.stage].watch)range.arrows--;range.fired++;
 q.kind='std';if(ARROWS&&quiver.kind!=='std'&&quiver.charges>0){q.kind=quiver.kind;if(--quiver.charges<=0)quiver.kind='std';}   // a special shot spends a charge as it leaves the string
 galeCue(q.o,q.kind==='gale');if(q.kind!=='std')range.specialUsed++;
 if(guiding()&&range.hits===0&&range.arrows<=0)range.arrows=3;   // a learner who has not yet hit anything is never left without arrows
 q.final=range.arrows<=0;
 if(perfect)note(1320,.18,'sine',.07,0,1760);
 if(range.arrows<=0)range.endAt=elapsed+3.5;
}
// how close the newest stretch of a flight passes to the middle of each standing mark
const nearA=V(),nearB=V();
function rangeNear(q){
 const n=q.path.length;if(n<2)return;const a=q.path[n-2],b=q.path[n-1];nearB.subVectors(b,a);const len=nearB.lengthSq()||1;
 for(const r of[...rangeRounds,...spirits]){
  if(!r.base.visible||!r.up||(r.kind==='spirit'&&!r.live))continue;r.root.getWorldPosition(nearA);if(r.kind==='spirit')nearA.y+=.35;
  const t=clamp(nearA.clone().sub(a).dot(nearB)/len,0,1),d=nearA.distanceTo(a.clone().addScaledVector(nearB,t));
  if(!q.near||d<q.near.off)q.near={off:d,target:r,nearIdx:n-1,base:r.base.position.clone()};
 }
}
// a scored arrow that came down without touching a mark
function rangeEnded(q){
 if(!q.ranged||q.done)return;q.done=true;
 q.path.push(q.o.position.clone());rangeNear(q);
 plogShot(q,{hit:false,landed:Math.round(q.origin.distanceTo(q.o.position)),missBy:q.near?r2(q.near.off):null});
 if(q.lab)q.lab.result='Miss      landed '+Math.round(q.origin.distanceTo(q.o.position))+' m out'+(q.near?'      passed '+q.near.off.toFixed(2)+' m from a target':'')+'      flight '+(elapsed-q.lab.t0).toFixed(2)+' s';
 if(q.near&&(!range.closest||q.near.off<range.closest.off))range.closest={path:q.path,miss:true,...q.near};
 if(q.final&&q.near&&q.near.off<=4)range.lastShot={path:q.path,miss:true,...q.near};   // a final arrow that only just missed is still shown
 if(!STAGES[range.stage].watch){if(range.streak>1)note(196,.25,'triangle',.08,0,130);range.streak=0;}spiritStartle(q.o.position);birdsHear(q);
 if(range.arrows<=0)range.endAt=Math.min(range.endAt||1e9,elapsed+.9);
}
function rangeHit(t,q){
 if(ARROWS&&q.ranged&&!q.done&&specialHit(t,q))return;
 const spirit=t.kind==='spirit';
 if(spirit){if(!t.live)return;spiritWake(t);}else{t.kick=elapsed;thump(500,.15,.25);note(124,.16,'triangle',.2,0,40);}
 if(!q.ranged||q.done)return;q.done=true;
 const at=q.o.position,local=t.root.worldToLocal(at.clone()),r=spirit?0:hyp(local.x,local.y),ring=Math.min(q.kind==='gale'?ARROW_RULE.galeCap:1e9,spirit?t.value:r<.1?100:r<.23?80:r<.37?60:r<.5?40:20),dist=Math.round(q.origin.distanceTo(at));
 range.streak++;range.hits++;if(q.perfect)range.perfectHits++;range.best=Math.max(range.best,range.streak);
 const pts=Math.round((ring+dist)*Math.min(2,1+.1*(range.streak-1))*(q.perfect?1.25:1));range.score+=pts;
 q.path.push(at.clone());const shot={path:q.path,pts,ring:spirit?100:ring,spirit,target:t,base:t.base.position.clone(),off:r*t.scale};
 if(q.lab)q.lab.result='Hit at '+dist+' m      '+Math.round(shot.off*100)+' cm off centre      flight '+(elapsed-q.lab.t0).toFixed(2)+' s';
 plogShot(q,{hit:true,at:dist,off:r2(shot.off),pts,ring:shot.ring,shade:spirit,ram:!!t.ram});
 if(!range.closest||shot.off<range.closest.off)range.closest=shot;
 if(shot.ring===100&&(!range.shot||pts>range.shot.pts))range.shot=shot;   // the best bullseye, or the best waking, of the stage
 if(q.final)range.lastShot=shot;                                     // or the final arrow of the stage, wherever it hit
 // each hit in a streak plays the next note up
 const f=392*2**([0,2,4,7,9,12,14,16,19,21,24][Math.min(range.streak-1,10)]/12);note(f,.35,'sine',.13);note(f*2,.25,'sine',.05,.03);
 if(BOW2&&xrOn()){const big=(ring===100&&!spirit)||!!t.ram,h=big?HAP.big:HAP.hit;buzz(bowHand,h[0],h[1]);if(big)buzz(hands.find(x=>x!==bowHand&&x.pose),h[2],h[3]);}
 if(ring===100&&!spirit){burst(at,'#ffd86b',22,1.5,1.4);note(f*1.5,.5,'sine',.1,.08);}
 popup('+'+pts,at.clone().add(V(0,.5*t.scale,0)),ring===100||spirit?'#ffd86b':'#fff1c4');
 say((spirit?'Shade banished  ·  ':ring===100?'Bullseye  ·  ':'')+(q.perfect?'Perfect release  ·  ':'')+(range.streak>1?'Streak '+range.streak:dist+' m'),1.6);
 if(dist>state.longest)state.longest=dist;
 if(range.arrows<=0)range.endAt=Math.min(range.endAt||1e9,elapsed+.9);
}
function rangeResults(){
 const i=range.stage,frac=range.score/range.ideal,stars=frac>=STAR_AT[2]?3:frac>=STAR_AT[1]?2:frac>=STAR_AT[0]?1:0,R=state.range;
 const watching=!!STAGES[i].watch;
 const before=R.best[i]||0,need=watching?0:stars<3?Math.max(1,Math.ceil(STAR_AT[stars]*range.ideal)-range.score):0;
 range.phase='results';range.stars=stars;range.newBest=range.score>before;
 range.gap=REPLAY&&need?need+(need===1?' point':' points')+' to '+'★'.repeat(stars+1):'';range.gain=REPLAY&&range.newBest&&before?range.score-before:0;
 tallyEnd(STAGES[i].name,stars,need>0&&need<=.1*range.ideal,elapsed-range.t0);
 {const rb=ribbonFor(STAGES[i]);range.ribbon='';
  if(rb&&stars){const had=!!(R.ribbon&&R.ribbon[i]),won=rb.won({fired:range.fired,hits:range.hits,perfectHits:range.perfectHits,specialUsed:range.specialUsed,sec:elapsed-range.t0});
   if(won&&!had){(R.ribbon||(R.ribbon=[]))[i]=1;range.ribbon='◆ Ribbon earned: '+rb.name;}else range.ribbon=had?'◆ '+rb.name:'◇ Ribbon: '+rb.name+' ('+rb.goal+')';}}
 range.earned=Math.round(range.score/20)+Math.max(0,stars-(R.stars[i]||0))*25;state.coins+=range.earned;
 if(watching&&peal.root){range.clear=!(peal.root.userData.bound|0);if(range.clear){range.score+=WATCH_BELL.bonus;pealRing(false);}range.newBest=range.score>before;range.gain=REPLAY&&range.newBest&&before?range.score-before:0;}
 if(LOG){plog.stages++;plogAdd('stage',{name:STAGES[i].name,score:range.score,stars:watching?null:stars,hits:range.hits,fired:range.fired,perfect:range.perfectHits,secs:Math.round(elapsed-range.t0),bell:watching?!!range.clear:null});}
 if(watching){if(range.newBest)R.watchBest=range.score;range.stars=0;range.earned=0;R.best[-1]=Math.max(before,range.score);R.runs=(R.runs|0)+1;save();range.shot=null;showResults();return;}
 if(range.newBest)R.best[i]=range.score;R.stars[i]=Math.max(R.stars[i]||0,stars);if(stars&&R.open<i+1)R.open=Math.min(STAGES.length-1,i+1);
 // one replay at most. Up close: the best bullseye, or failing that the final arrow, hit or near miss.
 // On a long lane (a mark at 40 m or more): always the one arrow that came closest, hit or miss.
 range.shot=Math.max(...STAGES[i].marks.map(m=>m[0]))>=40?range.closest:range.shot||range.lastShot;
 save();if(range.shot&&!xrOn())startReplay();else showResults();   // in a headset the world never moves under the player, so the close-up replay is for the flat screen only
}
// ---- The Silent Peal: the Practice Bell. One switch: "peal" in src/config.json, or ?peal=1 / ?peal=0.
//   A forked belfry stands 22 m out and 12.5 m to one side of the lane, outside it and behind no target. It is
//   silent (iron, thorn-bound, a shade crow on the fork) until the first place's four stages each hold a star. Then
//   the thorns break and the bell turns bronze; an arrow rings it, and if the player goes on without ringing it, it
//   rings itself softly as the next stage begins. Once unbound it stays so, and can be rung between stages.
const PEAL=!LAB&&(QUERY.has('peal')?QUERY.get('peal')==='1':!!CONFIG.peal)&&typeof PROPS!=='undefined'&&!!PROPS.belfry;
const PEAL_STAGES=['First marks','Stepping back','The drop','First shade'],PEAL_TONE=523;
// The plan puts the bell 22 m out and 12.5 m to the RIGHT. On today's range the scoreboard stands in that line of sight, so
// until the first place is rebuilt to its plan (where the board moves) the bell stands the same distance to the LEFT.
const PEAL_AT=WORLD2?[22,12.5]:[22,-12.5];
const peal={root:null,target:{kind:'peal'},mesh:null,rungAt:-99,rung:false,chevrons:[],at:V()};
function pealBuild(){
 if(!PEAL||peal.root)return;
 const[x,z]=yardAt(PEAL_AT[0],PEAL_AT[1]),b=PROPS.belfry(T,{state:state.range.bell1?'restored':'silent'});
 b.position.set(x,groundAt(x,z),z);b.rotation.y=Math.atan2(YARD.x-x,YARD.z-z);b.visible=false;scene.add(b);peal.root=b;shaded(b);peal.rung=!!state.range.bell1;
 // what an arrow strikes: a plain shape round the bell, unseen
 const m=new T.Mesh(new T.CylinderGeometry(.36,.36,.9,8),new T.MeshBasicMaterial({visible:false}));m.position.set(0,-.45,0);m.userData.target=peal.target;b.userData.bell.add(m);peal.mesh=m;
 // three open chevrons that spread from the lip when it rings, so the ring reads with the sound off
 for(let i=0;i<3;i++){const c=new T.Group();for(const s of[-1,1]){const k=new T.Mesh(new T.BoxGeometry(.5,.07,.02),new T.MeshBasicMaterial({color:i===1?'#F0C75A':'#F6E6BD'}));k.position.set(0,s*.17,0);k.rotation.z=s*-.7;c.add(k);}c.visible=false;b.add(c);peal.chevrons.push(c);}
}
function pealCleared(){const R=state.range;return PEAL_STAGES.every(n=>{const i=STAGES.findIndex(s=>s.name===n);return i>=0&&R.stars[i]>0;});}
function pealRing(soft){
 const b=peal.root;if(!b)return;peal.rungAt=elapsed;peal.rung=true;bellSound(PEAL_TONE,0,soft?.6:1);
 b.userData.bell.getWorldPosition(peal.at);
}
function pealUnbind(){
 const b=peal.root;if(!b||state.range.bell1)return;state.range.bell1=1;peal.rung=false;save();
 b.userData.set('restored');b.userData.bell.getWorldPosition(peal.at);peal.at.y-=.5;burst(peal.at,'#4A2943',14,.9);note(392,.25,'sine',.1,0,523);
 say('Practice Bell unbound  ·  shoot the bell to ring it, or shoot NEXT',7);
}
function pealHit(q){
 if(range.on&&STAGES[range.stage].watch){   // Bell Watch: the arrow is not a miss; it rings the bell, throws off the bands and scatters the hares near it
  q.done=true;if(!peal.root)return;const b=peal.root,had=b.userData.bound|0;pealRing(false);b.userData.bind(0);range.rings=(range.rings|0)+1;
  if(had){peal.at.y-=.5;burst(peal.at,'#4A2943',6*had,1);const[fx,fz]=yardAt(...watchFoot());
   for(const sp of spirits)if(sp.cfg&&sp.cfg.toBell&&sp.live&&hyp(sp.base.position.x-fx,sp.base.position.z-fz)<WATCH_BELL.scatter){burst(sp.base.position.clone().add(V(0,.4,0)),'#3b2444',8,1);sp.live=false;sp.base.visible=false;sp.state='off';sp.due=0;}
   rangeTargets();say('Bell rung clear',1.6);}
  return;
 }
 rangeEnded(q);if(!peal.root)return;
 if(!state.range.bell1){note(110,.3,'triangle',.18,0,90);thump(300,.12,.2);return;}   // still bound: a dull thud
 const first=!peal.rung;pealRing(false);if(first)say('Practice Bell restored',4);
}
function pealStep(){
 const b=peal.root;if(!b)return;b.visible=range.on;if(!range.on)return;
 const age=elapsed-peal.rungAt;b.userData.bell.rotation.z=age<3?Math.exp(-1.3*age)*Math.sin(age*6)*.44:0;
 peal.chevrons.forEach((c,i)=>{const t=(age-i*.12)/.6;c.visible=t>0&&t<1;if(c.visible){c.position.set(.45+t*.9,1.35,.05);c.scale.setScalar(.5+t*.9);}});
}
function showResults(){
 const i=range.stage,stars=range.stars,R=state.range;range.phase='results';stageList();
 rangeSigns.again.base.visible=true;rangeSigns.next.base.visible=i<STAGES.length-1&&R.open>i&&!STAGES[i].watch;rangeSigns.back.base.visible=i>0;rangeTargets();
 if(STAGES[i].watch){for(const sp of spirits){sp.base.visible=false;sp.live=false;sp.state='off';}ramOff();rangeTargets();[523,659,784].forEach((f,k)=>note(f,.45,'sine',.1,k*.13));say('Bell Watch  ·  '+range.score+(range.newBest?'  ·  new best':'  ·  best '+(R.watchBest||0))+'  ·  shoot AGAIN',6);return;}
 if(stars)[523,659,784,1047].slice(0,stars+1).forEach((f,k)=>note(f,.45,'sine',.1,k*.13));else note(196,.5,'triangle',.1,0,147);
 say((stars?'Stage clear  ·  '+'★'.repeat(stars)+'☆'.repeat(3-stars)+(range.gap?'  ·  '+range.gap:''):'Not enough  ·  '+(range.gap?range.gap+'  ·  ':'')+'shoot AGAIN')+coins(range.earned?'  ·  +'+range.earned+' coins':''),5);
 if(PEAL&&stars&&!R.bell1&&pealCleared())pealUnbind();
 if(range.earned&&!RELEASE)[1568,1976,2349].forEach((f,k)=>note(f,.12,'triangle',.05,.5+k*.07));   // coins dropping into the purse
}
// ---- the replay: at the end of a stage the best shot is shown again, slowed, from beside its mark
const replay={on:false,t:0,arrow:null,pts:[],cum:[],len:0,cam:V(),look:V(),gaze:V(),focus:V(),hit:V(),after:0,landed:false,struck:false,moved:false,save:null};
const cine=new T.PerspectiveCamera(56,1,.05,1600);scene.add(cine);
const shade=new T.Mesh(new T.SphereGeometry(.5,16,10),new T.MeshBasicMaterial({color:0x10100c,side:T.BackSide,transparent:true,opacity:0,depthTest:false,fog:false}));shade.renderOrder=20;shade.visible=false;scene.add(shade);
const archer=(()=>{
 // a small figure at the line, so the replay has someone loosing the arrow
 const g=new T.Group();g.position.set(YARD.x,groundAt(YARD.x,YARD.z),YARD.z);g.rotation.y=Math.atan2(-YARD.ux,-YARD.uz);scene.add(g);g.visible=false;
 mesh(g,new T.CylinderGeometry(.2,.26,1.25,8),'#3b5a47',V(0,.72,0));mesh(g,new T.SphereGeometry(.15,10,8),'#e5c67e',V(0,1.52,0));mesh(g,new T.ConeGeometry(.2,.3,8),'#7a4f35',V(0,1.74,0));
 stick(g,V(-.28,.75,-.5),V(-.28,2.05,-.5),.025,timber);stick(g,V(-.2,1.35,0),V(-.28,1.4,-.5),.05,'#3b5a47');return g;
})();
function startReplay(){
 const sh=range.shot,t=sh.target,R=replay,path=sh.path;let n=path.length;
 // a miss is shown up to the moment it passes the mark, and held there
 R.after=0;
 if(sh.miss){let k=sh.nearIdx;while(k<path.length-1&&R.after<1.2){R.after+=path[k].distanceTo(path[k+1]);k++;}n=k+1;}
 R.landed=n===path.length;
 range.phase='replay';range.replayed=true;range.skip=false;Object.assign(R,{on:true,t:0,struck:false,moved:false,save:null});
 for(let k=projectiles.length-1;k>=0;k--)recycle(k);
 t.base.position.copy(sh.base);
 if(sh.spirit){const cfg=t.cfg;t.set(t,cfg);t.base.position.copy(sh.base);t.state=t.bird?'held':'idle';t.live=false;t.root.visible=true;spiritShow(t,1);if(cfg.t==='hide')t.root.position.y=-(t.sink||0);}   // the spirit is asleep again for the replay
 t.base.updateMatrixWorld(true);
 // the last stretch of the recorded flight, walked back from the hit
 R.pts=[path[n-1]];R.cum=[0];R.len=0;
 for(let i=n-2;i>=0&&R.len<18;i--){R.len+=path[i].distanceTo(path[i+1]);R.pts.push(path[i]);R.cum.push(R.len);}
 R.hit.copy(path[n-1]);const ref=sh.miss?t.root.getWorldPosition(V()):R.hit;
 // for a miss the view sits just outside the arrow, so it passes between you and the mark, and settles on the gap
 let side=t.right>0?-1:1,sc=t.scale,back=1.4+.9*sc,out=1.2+.9*sc;R.focus.copy(R.hit);
 if(sh.miss){
  const near=path[Math.max(0,sh.nearIdx-1)].clone().lerp(path[sh.nearIdx],.5),lat=(near.x-ref.x)*YARD.rx+(near.z-ref.z)*YARD.rz;
  side=lat>0?1:-1;back+=1+sh.off*.4;out=Math.abs(lat)+1.8+.3*sc;R.focus.copy(ref).lerp(near,.5);
 }
 R.cam.set(ref.x-YARD.ux*back+YARD.rx*side*out,ref.y+.25,ref.z-YARD.uz*back+YARD.rz*side*out);R.cam.y=Math.max(R.cam.y,groundAt(R.cam.x,R.cam.z)+.7);
 R.look.copy(R.pts[R.pts.length-1]);R.gaze.copy(R.look);   // the view starts on the arrow far up the lane and follows it in
 if(!R.arrow)R.arrow=arrow();scene.add(R.arrow);R.arrow.visible=false;
 archer.visible=true;const what=sh.spirit?'Shade banished':sh.ring===100?'Bullseye':sh===range.lastShot?'Final arrow':'Closest arrow';say(what+'  ·  '+(sh.miss?sh.off.toFixed(1)+' m wide':'+'+sh.pts),3.5);
}
function endReplay(){
 const R=replay;R.on=false;shade.visible=false;archer.visible=false;range.skip=false;
 if(R.save){rig.position.copy(R.save.p);rig.rotation.y=R.save.r;R.save=null;}
 if(!R.struck&&R.arrow)R.arrow.visible=false;
 showResults();
}
// in a headset the view cannot be swapped, so the player was set down beside the mark behind a short fade; no longer
// used in a headset (25 November): the world must not move under the player. Kept for the flat screen's camera path.
function moveHead(to,look){
 const eye=head().getWorldPosition(V()),a=Math.atan2(-(look.x-to.x),-(look.z-to.z))-headYaw(),ox=rig.position.x-eye.x,oz=rig.position.z-eye.z,sn=Math.sin(a),cs=Math.cos(a);
 rig.rotation.y+=a;rig.position.x=eye.x+ox*cs+oz*sn;rig.position.z=eye.z-ox*sn+oz*cs;rig.position.add(to.clone().sub(eye));
}
function replayStep(dt){
 const R=replay,sh=range.shot,vr=xrOn(),lead=vr?.25:0,fly=1.5,end=lead+fly+1.3;R.t+=dt;
 if(vr){
  shade.visible=true;shade.position.copy(head().getWorldPosition(V()));
  shade.material.opacity=R.t<lead?R.t/lead:R.t<lead+.25?1-(R.t-lead)/.25:clamp((R.t-(end-.25))/.25,0,1);
  if(!R.moved&&R.t>=lead){R.moved=true;R.save={p:rig.position.clone(),r:rig.rotation.y};moveHead(R.cam,R.look);}
 }
 const k=clamp((R.t-lead)/fly,0,1),d=(1-k)*R.len,u=R.arrow.userData;
 let i=0;while(i<R.cum.length-2&&R.cum[i+1]<d)i++;
 const a=R.pts[i],b=R.pts[Math.min(i+1,R.pts.length-1)],span=R.cum[Math.min(i+1,R.cum.length-1)]-R.cum[i]||1,f=clamp((d-R.cum[i])/span,0,1);
 if(!R.struck){
  R.arrow.visible=R.t>=lead;R.arrow.position.lerpVectors(a,b,f);
  const dir=a.clone().sub(b);if(dir.lengthSq()>1e-6)R.arrow.quaternion.setFromUnitVectors(FWD,dir.normalize());
  u.streak.visible=true;u.streak.scale.z=1.5;u.body.rotation.set(0,0,R.t*9);
 }
 const settled=R.struck||(sh.miss&&d<=R.after+1.5);R.gaze.lerp(settled?R.focus:R.arrow.position,Math.min(1,dt*(settled?5:9)));cine.position.copy(R.cam);cine.lookAt(R.gaze);
 if(k>=1&&!R.struck){
  R.struck=true;u.streak.visible=false;R.arrow.position.copy(R.hit);
  if(sh.miss){
   u.streak.visible=!R.landed;if(R.landed)burst(R.hit,'#8d7b58',7,.7);note(196,.4,'triangle',.08,0,150);   // the arrow is held still beside the mark, so the gap can be seen
   popup(sh.off.toFixed(1)+' m wide',sh.target.root.getWorldPosition(V()).add(V(0,.9*sh.target.scale,0)),'#e8e2d0');return;
  }
  if(sh.spirit){R.arrow.visible=false;spiritWake(sh.target);popup('+'+sh.pts,R.hit.clone().add(V(0,.9,0)),'#ffd86b');return;}
  sh.target.tilt.attach(R.arrow);sh.target.kick=elapsed;
  burst(R.hit,sh.ring===100?'#ffd86b':'#e6cd7c',sh.ring===100?26:12,1.3,1.3);thump(500,.15,.3);note(124,.16,'triangle',.25,0,40);note(784,.6,'sine',.12,.05);if(sh.ring===100)note(1175,.7,'sine',.1,.14);
  popup('+'+sh.pts,R.hit.clone().add(V(0,.5*sh.target.scale,0)),sh.ring===100?'#ffd86b':'#fff1c4');
 }
 if(R.t>=end||range.skip)endReplay();
}
// frames a second, averaged over each second, and the lowest second since the stage began (?fps=1)
const fps={now:0,low:0,n:0,t:0,el:null};
const fpsText=()=>SHOW_FPS?'      '+fps.now+' fps  low '+fps.low:'';
function fpsStep(now){
 if(!SHOW_FPS)return;fps.n++;if(!fps.t){fps.t=now;return;}
 if(now-fps.t>=1000){
  fps.now=Math.round(fps.n*1000/(now-fps.t));fps.low=fps.low?Math.min(fps.low,fps.now):fps.now;fps.n=0;fps.t=now;
  if(!fps.el){fps.el=document.createElement('div');fps.el.style.cssText='position:fixed;right:10px;bottom:10px;z-index:8;background:#1e2926d9;color:#ffe5a9;padding:5px 9px;border-radius:4px;font:600 12px system-ui,sans-serif';document.body.append(fps.el);}
  fps.el.textContent=fps.now+' fps · low '+fps.low;
 }
}
function rangeInfo(){
 if(STAGES[range.stage].lab)return{title:'Mechanics lab',text:labText(0),mark:labText(1)+fpsText(),wind:'Still air'};
 const i=range.stage,st=STAGES[i],R=state.range,w=Math.round(range.wind),wind=w?'Wind '+Math.abs(w)+(w>0?'  →':'  ←'):'Still air';
 if(st.watch){const left=Math.max(0,Math.ceil((range.endAt||0)-elapsed)),clock=Math.floor(left/60)+':'+String(left%60).padStart(2,'0');
  return range.phase==='results'?{title:'Bell Watch  ·  '+range.score,text:'Score '+range.score+(range.newBest?'  ·  new best'+(range.gain?'  +'+range.gain:''):'  ·  best '+(R.watchBest||0))+'.  Shades banished '+range.hits+', longest streak '+range.best+'.'+(range.clear?'  Bell clear at the end: +'+WATCH_BELL.bonus+'.':peal.root?'  The bell ended bound.':'')+'  Shoot AGAIN for another run.',mark:'Best '+(R.watchBest||0)+fpsText(),wind}
   :{title:'Bell Watch  ·  '+clock,text:'Score '+range.score+'      Streak '+range.streak+'      Banished '+range.hits+quiverText(),mark:'Best '+(R.watchBest||0)+'      arrows never run out'+fpsText(),wind};}
 if(range.phase==='results')return{title:'Stage '+(i+1)+'  ·  '+'★'.repeat(range.stars)+'☆'.repeat(3-range.stars),
  text:'Score '+range.score+(range.newBest?'  ·  new best'+(range.gain?'  +'+range.gain:''):'  ·  best '+(R.best[i]||0))+'.  '+(range.gap?range.gap+'.  ':'')+(range.ribbon?range.ribbon+'.  ':'')+(st.spirits?'Shades banished '+range.hits+' of '+st.spirits.length:'Hits '+range.hits+' of '+st.arrows)+', longest streak '+range.best+'.'+coins('  +'+range.earned+' coins.')+'  Shoot a sign to go on.',
  mark:'★ '+R.stars.reduce((a,b)=>a+(b||0),0)+' of '+STAGES.length*3+coins('      Coins '+state.coins)+fpsText(),wind};
 return{title:'Stage '+(i+1)+' of '+STAGES.length+'  ·  '+st.name,text:'Arrows '+range.arrows+'      Score '+range.score+'      Streak '+range.streak+quiverText(),mark:wind+(R.best[i]?'      best '+R.best[i]:'')+coins('      Coins '+state.coins)+fpsText(),wind};
}
function rangeStep(dt){
 const w=range.on?STAGES[range.stage].wind||[0,0]:[0,0];
 range.wind=w[0]+w[1]*Math.sin(elapsed*.55)*Math.sin(elapsed*.21+1);
 const sign=range.wind<0?-1:1;sock.rotation.y=Math.atan2(YARD.rx*sign,YARD.rz*sign);sock.scale.z=clamp(Math.abs(range.wind)/5,.15,1.6);sock.rotation.x=Math.sin(elapsed*9)*.06*Math.min(1,Math.abs(range.wind));
 if(!range.on)return;
 if(range.phase==='replay')replayStep(dt);
 if(range.pending){const id=range.pending,i=range.stage;range.pending=null;if(range.phase==='results'){if(id==='next'&&rangeSigns.next.base.visible)setStage(i+1);else if(id==='back'&&i>0)setStage(i-1);else if(id==='again')setStage(i);}}
 const t=elapsed-range.t0;
 if(kilnMark){const k=elapsed-kilnMark.t;kilnMark.g.visible=k<.65;if(k<.65){kilnMark.g.position.y=kilnMark.y+.45+k/.65*.6;kilnMark.g.scale.setScalar(k<.5?1:1-(k-.5)/.15*.7);}}   // rises 0.6 m in 0.65 s, shrinking only in the last 0.15 s
 if(ARROWS&&preview)quiverMark();
 for(const r of rangeRounds){
  if(!r.base.visible)continue;
  if(r.heldUntil>elapsed)r.lag=(r.lag||0)+dt;const tt=t-(r.lag||0);if(r.bracket)r.bracket.visible=r.heldUntil>elapsed;   // Rime: a held target's own clock stands still
  if(r.slide&&range.phase!=='replay'){const[x,z]=yardAt(r.along,r.right+r.slide[0]*Math.sin(tt*r.slide[1]));r.base.position.x=x;r.base.position.z=z;}
  if(r.pop)r.up=range.phase!=='play'||(tt+r.pop[2])%(r.pop[0]+r.pop[1])<r.pop[0];
  r.tilt.rotation.x=lerp(r.tilt.rotation.x,r.up?0:-1.5,Math.min(1,dt*9));
 }
 spiritStep(dt);ramStep(dt);
 guide.set(guideText());
 if(range.phase==='play'&&range.endAt&&elapsed>=range.endAt)rangeResults();
 const info=rangeInfo(),key=info.title+info.text+info.mark;
 if(key!==range.last){range.last=key;board.set(key,info);$('status').textContent=info.title+'\n'+info.text.replace(/      /g,'  ·  ')+'\n'+info.mark.replace(/      /g,'  ·  ');}
}
function setMode(m){
 if(RELEASE)m='range';
 state.mode=m;range.on=m==='range';
 for(const id in drills)drills[id].base.visible=!range.on;yardBits.visible=!((WORLD2||PEAL)&&range.on);if(WORLD2)for(const t of targets){if(t.beacon)t.beacon.visible=!range.on&&!t.hit;if(t.kind==='lantern')t.root.visible=!range.on&&!t.hit;if(t.kind==='straw')t.root.parent.visible=!range.on;}   // on the new range the bells' beams, the lanterns and the roaming straw rounds are hidden while shooting
 for(let k=projectiles.length-1;k>=0;k--)recycle(k);
 if(range.on){place(YARD.x,YARD.z,Math.atan2(-YARD.ux,-YARD.uz));look.pitch=0;if(xrOn())recentre();setStage(clamp(state.range.open,0,STAGES.length-1));}
 else{if(replay.on)endReplay();ramOff();for(const sp of spirits){sp.base.visible=false;sp.live=false;}for(const g of[...grassClumps,...perches,...bushes])g.visible=false;for(const r of rangeRounds)r.base.visible=false;for(const id in rangeSigns)rangeSigns[id].base.visible=false;rangeMeshes=[];range.phase='idle';if(replay.arrow)replay.arrow.visible=false;}
 $('modeRange').classList.toggle('quiet',!range.on);$('modeRoam').classList.toggle('quiet',range.on);$('play').textContent=range.on?'Step up to the line':'Enter the vale';
 $('compass').style.visibility=$('map').style.visibility=range.on?'hidden':'';
 $('hint').textContent=range.on?'Hold left mouse to draw, release to loose · let go early, or roll the mouse wheel while drawing, for a softer shot · let go just as the draw completes for a perfect release · [ and ] change stage · after a stage shoot a sign, or press N next, R again, B back':'WASD to walk · Shift to run · Space to jump · hold left mouse to draw, release to loose · M for the map';
 refresh();save();
}
$('modeRange').onclick=()=>setMode('range');$('modeRoam').onclick=()=>setMode('roam');
// Any stage can be chosen while the game is being made; the list shows the stars earned on each.
function stageList(){
 const sel=$('stageSel'),R=state.range;
 if(sel.options.length!==STAGES.length){sel.innerHTML='';STAGES.forEach(()=>sel.add(document.createElement('option')));}
 STAGES.forEach((st,i)=>{const n=R.stars[i]||0;sel.options[i].value=i;sel.options[i].disabled=RELEASE&&i>R.open;sel.options[i].textContent=(i+1)+'.  '+st.name+(st.spirits?'  (shades)':'')+(n?'   '+'★'.repeat(n)+'☆'.repeat(3-n):'')+(R.best[i]?'   best '+R.best[i]:'')+(n&&ribbonFor(st)?(R.ribbon&&R.ribbon[i]?'   ◆':'   ◇'):'');});
 sel.value=range.on?range.stage:clamp(R.open,0,STAGES.length-1);
}
function stageGo(i){
 i=clamp(i|0,0,RELEASE?clamp(state.range.open,0,STAGES.length-1):STAGES.length-1);   // in the release only stages already opened can be chosen
 if(!range.on)setMode('range');
 if(replay.on)endReplay();
 if(i!==range.stage||range.phase!=='play')setStage(i);
 stageList();
}
$('stageSel').onchange=e=>stageGo(+e.target.value);

// ---------------------------------------------------------------- deer
const deer=[];
{
 const spots=[];
 for(let n=0;n<4000&&spots.length<14;n++){const x=(rng()-.5)*640,z=(rng()-.5)*640;if(hyp(x,z)>320||hyp(x,z)<50||groundAt(x,z)<1.5||!spaced(spots,x,z,45))continue;spots.push({x,z});}
 for(const p of spots){
  const root=new T.Group(),coat=rng()<.5?'#a8794d':'#96693f';root.position.set(p.x,groundAt(p.x,p.z),p.z);scene.add(root);
  box(root,V(0,1,0),V(.42,.5,1.15),coat);
  const neck=new T.Group();neck.position.set(0,1.15,.5);root.add(neck);
  box(neck,V(0,.3,.1),V(.2,.65,.22),coat);box(neck,V(0,.68,.26),V(.22,.24,.46),coat);box(neck,V(0,.85,.12),V(.34,.14,.05),'#7c5632');
  box(root,V(0,1.18,-.6),V(.12,.14,.1),'#f3ead6');
  const legs=[[-.14,.42],[.14,.42],[-.14,-.42],[.14,-.42]].map(([x,z])=>{const l=new T.Group();l.position.set(x,.8,z);root.add(l);box(l,V(0,-.4,0),V(.1,.8,.1),'#7c5632');return l;});
  deer.push({root,neck,legs,mode:'graze',timer:rng()*8,heading:rng()*6.28,phase:0});
 }
}
function updateDeer(dt,px,pz){
 for(const d of deer){
  const p=d.root.position,dx=p.x-px,dz=p.z-pz,dist=hyp(dx,dz);if(dist>260)continue;
  if(dist<17&&d.mode!=='flee')startle(d,px,pz);
  d.timer-=dt;
  if(d.timer<=0){if(d.mode==='graze'){d.mode='walk';d.timer=3+Math.random()*5;d.heading=Math.random()*6.28;}else{d.mode='graze';d.timer=4+Math.random()*8;}}
  const sp=d.mode==='flee'?8.5:d.mode==='walk'?1.2:0;
  if(sp){
   const nx=p.x+Math.sin(d.heading)*sp*dt,nz=p.z+Math.cos(d.heading)*sp*dt,g=groundAt(nx,nz);
   if(g<.6||hyp(nx,nz)>350)d.heading+=2;else p.set(nx,g,nz);
   d.phase+=dt*sp*2.4;d.legs.forEach((l,i)=>l.rotation.x=Math.sin(d.phase+(i%3?Math.PI:0))*(sp>3?.8:.4));
  }else d.legs.forEach(l=>l.rotation.x*=.9);
  d.neck.rotation.x=lerp(d.neck.rotation.x,d.mode==='graze'?1.25:.1,Math.min(1,dt*4));
  let turn=d.heading-d.root.rotation.y;turn=Math.atan2(Math.sin(turn),Math.cos(turn));d.root.rotation.y+=turn*Math.min(1,dt*6);
 }
}
function startle(d,fx,fz){d.mode='flee';d.timer=4+Math.random()*2.5;d.heading=Math.atan2(d.root.position.x-fx,d.root.position.z-fz)+(Math.random()-.5)*.8;}

// ---------------------------------------------------------------- sound
let sound=null,windGain=null,noiseBuf=null;
function audioStart(){
 try{
  if(!sound){
   sound=new AudioContext();noiseBuf=sound.createBuffer(1,sound.sampleRate*2,sound.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
   const src=sound.createBufferSource(),lp=sound.createBiquadFilter();src.buffer=noiseBuf;src.loop=true;lp.type='lowpass';lp.frequency.value=420;
   windGain=sound.createGain();windGain.gain.value=.035;src.connect(lp).connect(windGain).connect(sound.destination);src.start();
  }
  if(sound.state==='suspended')sound.resume().catch(()=>{});
 }catch{}
}
function note(f,len,kind,gain,delay=0,end=f){
 if(!sound||sound.state!=='running')return;const now=sound.currentTime+delay;
 const osc=sound.createOscillator(),amp=sound.createGain();osc.type=kind;osc.frequency.setValueAtTime(f,now);osc.frequency.exponentialRampToValueAtTime(end,now+len);
 amp.gain.setValueAtTime(.0001,now);amp.gain.exponentialRampToValueAtTime(gain,now+.008);amp.gain.exponentialRampToValueAtTime(.0001,now+len);
 osc.connect(amp).connect(sound.destination);osc.start(now);osc.stop(now+len+.01);
}
function thump(freq,len,gain){
 if(!sound||sound.state!=='running')return;const now=sound.currentTime,src=sound.createBufferSource(),lp=sound.createBiquadFilter(),amp=sound.createGain();
 src.buffer=noiseBuf;lp.type='lowpass';lp.frequency.value=freq;amp.gain.setValueAtTime(gain,now);amp.gain.exponentialRampToValueAtTime(.0001,now+len);
 src.connect(lp).connect(amp).connect(sound.destination);src.start(now,Math.random());src.stop(now+len+.02);
}
function bellSound(f,delay=0,g=1){note(f,2.2,'sine',.2*g,delay);note(f*1.49,1.6,'sine',.09*g,delay);note(f*2.27,.9,'sine',.05*g,delay);}

// ---------------------------------------------------------------- HUD
let messageEnd=0,message='',elapsed=0;
function say(s,seconds=2){message=s;$('notice').textContent=s;messageEnd=elapsed+seconds;}
function counts(){return`Bells ${state.bells.size} / 7\nStraw rounds ${state.marks.size} / ${strawSpots.length}\nLanterns ${state.lanterns.size} / ${lanterns.length}`;}
function refresh(){if(range.on){range.last='';return;}$('status').textContent=(state.lesson<5?`Training ${state.lesson+1} / 5  ·  ${LESSON_NAMES[state.lesson]}\n`:'')+counts()+(state.longest?`\nLongest shot ${state.longest} m`:'');}
const compassMarks=[['N',0],['E',-Math.PI/2],['S',Math.PI],['W',Math.PI/2]].map(([t,a])=>{const e=document.createElement('span');e.textContent=t;$('compass').append(e);return{e,a};});
for(const s of SITES){const e=document.createElement('span');e.textContent='◆';e.className='bell';$('compass').append(e);compassMarks.push({e,site:s});}
{const e=document.createElement('span');e.textContent='✦';e.className='bell';$('compass').append(e);compassMarks.push({e,site:{x:YARD.x,z:YARD.z,item:{get hit(){return state.lesson>=5;}}}});}
function nearestBell(px,pz){let best=null,bd=1e9;for(const s of SITES)if(!s.item.hit){const d=hyp(s.x-px,s.z-pz);if(d<bd){bd=d;best=s;}}return best;}
function updateCompass(px,pz,yaw){
 for(const m of compassMarks){
  if(m.site&&m.site.item.hit){m.e.style.display='none';continue;}
  const a=m.site?Math.atan2(-(m.site.x-px),-(m.site.z-pz)):m.a;let rel=a-yaw;rel=Math.atan2(Math.sin(rel),Math.cos(rel));
  if(Math.abs(rel)>1.2){m.e.style.display='none';continue;}
  m.e.style.display='';m.e.style.left=(50-rel/1.2*50)+'%';
 }
}
const mapCanvas=$('map'),mapCtx=mapCanvas.getContext('2d');let mapOpen=false,mapClock=0;
const toMap=v=>(v+HALF)/SIZE*520;
function drawMap(px,pz,yaw){
 const g=mapCtx;g.imageSmoothingEnabled=true;g.drawImage(mapBase,0,0,520,520);
 const big=mapOpen,r=big?7:11;
 g.fillStyle='#fff5d8';g.fillRect(toMap(0)-r*.5,toMap(0)-r*.5,r,r);
 for(const t of targets)if(t.kind==='straw'&&t.hit){g.fillStyle='#d4553f';g.beginPath();g.arc(toMap(t.x),toMap(t.z),r*.4,0,7);g.fill();}
 for(const s of SITES){g.beginPath();g.arc(toMap(s.x),toMap(s.z),r,0,7);g.lineWidth=big?2.5:4;g.strokeStyle='#2a221a';g.fillStyle=s.item.hit?'#f0c75a':'#fff5d8aa';g.fill();g.stroke();
  if(big){g.font='600 13px system-ui';g.fillStyle='#fff5d8';g.strokeStyle='#1e2926';g.lineWidth=3;g.textAlign='center';g.strokeText(s.name,toMap(s.x),toMap(s.z)-12);g.fillText(s.name,toMap(s.x),toMap(s.z)-12);}}
 g.fillStyle=state.lesson>=5?'#f0c75a':'#fff5d8';g.strokeStyle='#2a221a';g.lineWidth=2;g.fillRect(toMap(YARD.x)-r*.45,toMap(YARD.z)-r*.45,r*.9,r*.9);g.strokeRect(toMap(YARD.x)-r*.45,toMap(YARD.z)-r*.45,r*.9,r*.9);
 if(big){g.font='600 13px system-ui';g.fillStyle='#fff5d8';g.strokeStyle='#1e2926';g.lineWidth=3;g.textAlign='center';g.strokeText('Training yard',toMap(YARD.x)+8,toMap(YARD.z)+20);g.fillText('Training yard',toMap(YARD.x)+8,toMap(YARD.z)+20);}
 g.save();g.translate(toMap(px),toMap(pz));g.rotate(-yaw);g.fillStyle='#ffffff';g.strokeStyle='#1e2926';g.lineWidth=2;g.beginPath();g.moveTo(0,-r*1.5);g.lineTo(r*.9,r);g.lineTo(0,r*.45);g.lineTo(-r*.9,r);g.closePath();g.fill();g.stroke();g.restore();
 if(big){g.font='600 14px system-ui';g.textAlign='center';g.fillStyle='#1e2926d0';g.fillRect(70,490,380,26);g.fillStyle='#fff5d8';g.fillText('Click a woken bell to travel there  ·  M closes the map',260,508);}
}

// ---------------------------------------------------------------- bow and arrows
const bow=new T.Group();scene.add(bow);const ends=[V(),V()],limbs=[];
// A plain straight bow. As on a real one, the arrow lies against the side of the grip, resting on top of the bow hand:
// REST is its height above the middle of the hand, and restX() how far to the side it sits. A right-handed archer
// (bow in the left hand, handSide 1) has the arrow on the left of the bow; a left-handed one has it on the right.
const REST=KIT.rest, riser=new T.Group();bow.add(riser);let handSide=1;
const restX=()=>-handSide*KIT.restX;
stick(riser,V(0,-KIT.riser,0),V(0,KIT.riser,0),KIT.riserR,'#513c2b');
// The grip is handed: a leather wrap where the hand goes, swelling toward the palm, and a small rest on the arrow's side
// for the shaft to lie on. Built for a right-handed archer and mirrored for a left-handed one; the bow itself stays straight.
const gripSide=new T.Group();bow.add(gripSide);
const gripIn=KIT.grip===1?gripSide:new T.Group();if(gripIn!==gripSide){gripIn.scale.setScalar(KIT.grip);gripSide.add(gripIn);}   // the fun bow's grip is the same shape, smaller; the others are built as before
stick(gripIn,V(0,-.085,0),V(0,.03,0),.029,'#2e2219',9);                       // leather wrap
mesh(gripIn,new T.SphereGeometry(.03,9,7),'#2e2219',V(.012,-.03,.012)).scale.set(1,1.7,1);   // swell that fills the palm, on the side away from the arrow
box(gripIn,V(-.04,.028,0),V(.028,.01,.03),'#c08d51');                        // arrow rest
box(gripIn,V(-.03,.018,0),V(.012,.014,.03),'#2e2219');                       // its bracket
for(const s of[-1,1]){
 const limb=new T.Group();limb.position.set(0,s*KIT.riser,0);bow.add(limb);limbs.push(limb);
 stick(limb,V(),V(0,s*KIT.l1,KIT.l1z),KIT.limbR,'#c08d51');stick(limb,V(0,s*KIT.l1,KIT.l1z),V(0,s*KIT.l2,KIT.brace),KIT.limbR,'#c08d51');
}
const stringGeo=new T.BufferGeometry();stringGeo.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(9),3));
const string=new T.Line(stringGeo,new T.LineBasicMaterial({color:0xf2deb4}));string.frustumCulled=false;bow.add(string);
const nockNow=V(restX(),REST,KIT.nockZ);
// The limbs bend back with the draw, and the string runs between their tips through the nock.
function setString(p,flex=0){
 limbs.forEach((l,i)=>{const s=i?1:-1,t=s*flex;l.rotation.x=t;ends[i].set(0,s*KIT.riser+s*KIT.l2*Math.cos(t)-KIT.brace*Math.sin(t),s*KIT.l2*Math.sin(t)+KIT.brace*Math.cos(t));});
 nockNow.copy(p);const a=stringGeo.attributes.position;[ends[0],p,ends[1]].forEach((v,i)=>a.setXYZ(i,v.x,v.y,v.z));a.needsUpdate=true;
}
const streakGeo=(()=>{
 const g=new T.BufferGeometry(),w=KIT.streakW,pos=[],uv=[];
 for(const[x,y]of[[w,0],[0,w]]){pos.push(-x,-y,0, x,y,0, -x,-y,1, x,y,1);uv.push(0,0, 1,0, 0,1, 1,1);}
 g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex([0,1,2,2,1,3,4,5,6,6,5,7]);return g;
})();
const streakGold=(()=>{
 const c=document.createElement('canvas');c.width=4;c.height=64;const g=c.getContext('2d'),fade=g.createLinearGradient(0,64,0,0);
 fade.addColorStop(0,'rgba(255,233,168,.95)');fade.addColorStop(1,'rgba(255,233,168,0)');g.fillStyle=fade;g.fillRect(0,0,4,64);
 return new T.MeshBasicMaterial({map:new T.CanvasTexture(c),transparent:true,depthWrite:false,side:T.DoubleSide,opacity:.9});
})();
const streakMat=(()=>{
 const c=document.createElement('canvas');c.width=4;c.height=64;const g=c.getContext('2d'),fade=g.createLinearGradient(0,64,0,0);
 fade.addColorStop(0,'rgba(255,250,232,.9)');fade.addColorStop(1,'rgba(255,250,232,0)');g.fillStyle=fade;g.fillRect(0,0,4,64);
 return new T.MeshBasicMaterial({map:new T.CanvasTexture(c),transparent:true,depthWrite:false,side:T.DoubleSide});
})();
function arrow(){
 const g=new T.Group(),body=new T.Group();g.add(body);
 stick(body,V(0,0,KIT.shaft),V(),KIT.shaftR,'#67492f',6);
 const tip=mesh(body,new T.ConeGeometry(KIT.tipR,KIT.tipL,4),'#9ea9a4',V(0,0,-KIT.tipL/4));tip.rotation.x=-Math.PI/2;
 for(let i=0;i<3;i++){const f=box(body,V(),V(...KIT.fl),'#f2ead8');f.rotation.z=i*Math.PI*2/3;f.position.set(KIT.flOff*Math.cos(f.rotation.z),KIT.flOff*Math.sin(f.rotation.z),KIT.flZ);}
 const streak=mesh(g,streakGeo,streakMat,V(0,0,KIT.shaft));streak.visible=false;streak.frustumCulled=false;streak.renderOrder=3;
 g.userData={body,streak};return g;
}
const preview=arrow();scene.add(preview);preview.visible=false;const pool=[],projectiles=[];
const ray=new T.Raycaster(), GRAV=7, FWD=V(0,0,-1), tmpDir=V();
// rest: string-hand distance that is no draw; full* and eyeK: full draw fitted to the player (section 1); minLoose: less
// draw than this looses nothing; g and drag: gravity and air (section 3); sweet: seconds after full draw that a release is
// perfect; fullAt and rearm: when full draw counts, and how far back down it must come to count again (section 5)
// notches: draw fractions that tick in the string hand; creak: those that also tick in the bow hand; show and ready: seconds
// after a shot that the next arrow appears and is ready to draw; catch: how near the nock a trigger takes the string;
// oneHand: seconds a single-handed or desktop draw takes; v: launch speed [least, most, curve]; buffer: a trigger pressed
// this long before the bow is ready is held and caught; grace: help on shades and the bell (bow3 only, design/fun-bow.md)
const TENTHS=[.2,.3,.4,.5,.6,.7,.8,.9];
const BOW=BOW3?{rest:.10,full:.36,minLoose:.08,g:5.8,drag:.001,sweet:1.5,fullAt:.90,rearm:.70,notches:[.25,.5,.75],creak:[.5],show:.08,ready:.18,buffer:.10,catch:.35,oneHand:.45,v:[28,68,.72],grace:{rad:.40,bell:.30,cone:1.4,blend:.40,cap:.8}}
 :BOW2?{rest:.12,fullMin:.42,fullMax:.68,eyeK:.345,seated:.52,minLoose:.15,g:9.81,drag:.0025,sweet:1.2,fullAt:.96,rearm:.8,notches:TENTHS,creak:[.4,.6,.8],show:.3,ready:.55,buffer:0,catch:.33,oneHand:.85,v:[18,62,1.25]}
 :{rest:.12,full:.52,minLoose:.1,g:GRAV,drag:0,sweet:.9,fullAt:.95,rearm:.85,show:.3,ready:.55,buffer:0,catch:.33,oneHand:.85};
// what the hands feel: [strength, ms] for each moment (version 2's table, or the fun bow's lighter one for many quick shots)
const HAP=BOW3?{take:[.25,18],nock:[.20,16,.08,12],notch:c=>.06+.32*c,notchMs:12,creak:()=>.12,full:[.68,24,.38,20],closed:[.12,18],breath:[.07,16],cancel:[.10,12],loose:p=>[.28+.45*p,55,.24+.2*p,26],sweet:[.82,65,.45,30],hit:[.24,22],big:[.50,40,.24,24]}
 :{take:[.3,22],nock:[.22,18,.1,14],notch:c=>.12+.28*c,notchMs:14,creak:c=>.08+.14*c,full:[.78,28,.45,24],closed:[.14,20],breath:[.08,18],cancel:[.12,15],loose:p=>[.35+.5*p,75,.3+.2*p,32],sweet:[.92,85,.55,38],hit:[.28,26],big:[.55,45,.25,28]};
let bow3wait=null;   // a trigger pressed just before the bow was ready, caught as soon as it is
const tmpV0=V(),tmpMid=V();
// one pulse each to the string hand and the bow hand; on a single-handed draw they are the same controller, so the stronger wins
function bowBuzz(s,ss,sm,b,bs,bm){if(s&&s===b){buzz(s,Math.max(ss||0,bs||0),Math.max(sm||0,bm||0));return;}if(ss)buzz(s,ss,sm);if(bs)buzz(b,bs,bm);}
// what the hands feel through a v2 draw (section 7): notches every tenth from 20 to 90 percent with 2 percent of give on the
// way down, the bow creaking at 40, 60 and 80, a snap at full draw, a creak when the sweet spot closes, a breath while held
function bowFeel(s,full){
 const N=BOW.notches;
 if(bow2.notch<N.length&&charge>=N[bow2.notch]){const at=N[bow2.notch++];bowBuzz(s,HAP.notch(charge),HAP.notchMs,bowHand,BOW.creak.includes(at)?HAP.creak(charge):0,12);}
 else if(bow2.notch>0&&charge<N[bow2.notch-1]-.02)bow2.notch--;
 if(full){if(!fullAt){fullAt=elapsed;bow2.closed=false;bow2.breathAt=0;bowBuzz(s,...HAP.full.slice(0,2),bowHand,...HAP.full.slice(2));}}else if(charge<BOW.rearm)fullAt=0;
 if(fullAt){const held=elapsed-fullAt;
  if(held>BOW.sweet&&!bow2.closed){bow2.closed=true;buzz(bowHand,...HAP.closed);note(92,.25,'triangle',.03,0,80);}   // the sweet spot has passed: a soft creak, nothing more
  if(held>2&&elapsed>=bow2.breathAt){bow2.breathAt=elapsed+.9;buzz(bowHand,...HAP.breath);}}   // a held bow breathes: no effect on the aim
}
// keep one sample per moment: a second call in the same frame replaces the first, so no step is ever measured over no time
function pushSample(list,sample){const last=list[list.length-1];if(last&&last[0]===sample[0])list[list.length-1]=sample;else list.push(sample);}
const bow2={full:0,learned:[],up:0,down:0,peak:0,t0:0,buf:[],earlyAt:0,hi:false,notch:1,closed:false,breathAt:0,raw:null};
// launch speed from draw (section 2): v2 is a gentle curve from 18 to 62 m/s, flat over the last 4 percent of the draw
function arrowSpeed(power){if(!BOW2)return 24+power*38;const[a,b,k]=BOW.v;return power<BOW.minLoose?0:a+(b-a)*Math.pow(clamp(power/BOW.fullAt,0,1),k);}
// the player's full draw (section 1): first a guess from how high their eyes are, then learned from honest draws
function bowFull(){
 if(BOW3)return bow2.full=BOW.full;   // the fun bow's draw is short enough for everyone: no fitting
 if(state.reach==='short')return bow2.full=.46;
 if(state.reach==='long')return bow2.full=.64;
 if(bow2.full)return bow2.full;
 const eyeY=head().getWorldPosition(V()).y-(rig.position.y-localEyeOffset);
 bow2.full=localEyeOffset||eyeY<1.15?BOW.seated:clamp(eyeY*BOW.eyeK,.44,.66);return bow2.full;
}
// a fixed draw length from Settings, or Auto (eye height, then learning); choosing any of them starts the learning afresh
function setReach(r){state.reach=r;bow2.full=0;bow2.learned=[];bow2.up=0;bow2.down=0;save();}
function bowLearn(peak,hold){
 if(state.reach!=='auto'||BOW3)return;
 if(!(hold>=.35&&peak>=.36&&peak<=.72))return;   // only a real draw teaches it
 const L=bow2.learned,med=a=>{const s=[...a].sort((x,y)=>x-y);return s[s.length>>1];};if(peak>=.72*bow2.full){L.push(peak);if(L.length>5)L.shift();}
 if(peak>bow2.full/.95){bow2.up++;bow2.down=0;}else if(peak>=.72*bow2.full&&peak<=.92*bow2.full){bow2.down++;bow2.up=0;}else{bow2.up=0;bow2.down=0;}
 if(bow2.up>=3)bow2.full+=(.95*med(L)-bow2.full)*.35;else if(bow2.down>=3)bow2.full+=(.98*med(L.slice(-3))-bow2.full)*.35;
 bow2.full=clamp(bow2.full,BOW.fullMin,BOW.fullMax);
}
// the release (section 4): the aim from just before the trigger finger's jerk, and the most draw of the last tenth of a second
function bowRelease(){
 const tc=bow2.earlyAt&&elapsed-bow2.earlyAt<=.08?bow2.earlyAt:elapsed,B=bow2.buf.filter(s=>s[0]<=tc+1e-6),win=B.filter(s=>s[0]>=tc-.12);
 let spike=null;for(let k=1;k<win.length;k++){const dt=win[k][0]-win[k-1][0];if(dt>0&&win[k][1].angleTo(win[k-1][1])*57.2958/dt>45){spike=win[k][0];break;}}
 const avg=(a,b)=>{const v=V();let n=0;for(const s of B)if(s[0]>=a&&s[0]<b){v.add(s[1]);n++;}return n?v.normalize():null;};
 const mid=(a,b)=>{const v=V();let n=0;for(const s of B)if(s[0]>=a&&s[0]<b&&s[3]){v.add(s[3]);n++;}return n?v.multiplyScalar(1/n):null;};
 let dir,end,origin;
 if(spike!==null){end=spike;dir=avg(spike-.045,spike)||(B.filter(s=>s[0]<spike).pop()||[0,aimVR()])[1].clone();origin=mid(spike-.045,spike);}
 else{end=tc;dir=avg(tc-.045,tc+1e-6)||aimVR();origin=mid(tc-.045,tc+1e-6);}
 let power=0;for(const s of B)if(s[0]>=end-.1&&s[0]<=end+1e-6)power=Math.max(power,s[2]);
 return{dir,power:power||charge,spike:spike!==null,origin:origin||preview.position.clone()};
}
let charging=false,charge=0,startTime=0,twang=-9,twangPower=0,zoom=0,hitFlash=0,drawStep=0;
// After a release: kick is the slow recoil of the bow, snap the fast ringing of the string.
function recoil(){
 const t=elapsed-twang;if(t>1.5)return{t,kick:0,snap:0};
 return{t,kick:twangPower*Math.exp(-7*t)*Math.sin(13*t),snap:twangPower*Math.exp(-11*t)*Math.sin(62*t)};
}
// The nocked arrow sits with its tail on the string; a fresh one comes up shortly after a shot.
function poseArrow(dir,show){
 const t=elapsed-twang,size=bow.scale.x;bow.updateMatrixWorld();
 preview.scale.setScalar(size);preview.position.copy(nockNow).applyMatrix4(bow.matrixWorld).addScaledVector(dir,KIT.shaft*size);preview.quaternion.setFromUnitVectors(FWD,dir);
 preview.visible=show&&(charging||t>BOW.show);
 if(!charging&&t>BOW.show&&t<BOW.ready)preview.position.y-=((BOW.ready-t)/(BOW.ready-BOW.show))**2*.2*size;
}
function buzz(h,strength,ms){try{h?.source?.gamepad?.hapticActuators?.[0]?.pulse(strength,ms);}catch{}}
function cancel(){charging=false;charge=0;$('ret').classList.remove('draw');$('fill').style.width='0';}
function recycle(i){const q=projectiles[i];q.o.visible=false;pool.push(q.o);projectiles.splice(i,1);}
// The fun bow's help (design/fun-bow.md section 4): once, at the release, never in flight. If the arrow is already going
// within 0.40 m of a live shade (0.30 m of the bell) and within 1.4 degrees of the line that would hit it, it is turned 40
// percent of the way onto that line, never more than 0.8 degrees. Ring targets and the lab get none: a miss there is a miss.
function graceAim(origin,dir,speed){
 const G=BOW.grace;if(!G||!range.on||LAB||!speed)return dir;
 const aims=[];
 for(const sp of spirits)if(sp.live&&sp.base.visible)aims.push([sp.hitMesh.getWorldPosition(V()),G.rad]);
 if(ram&&ram.live&&ram.base.visible)aims.push([ram.hitMesh.getWorldPosition(V()),G.rad]);
 if(peal.mesh&&peal.root&&peal.root.visible!==false)aims.push([peal.mesh.getWorldPosition(V()),G.bell]);
 let best=null,bestA=1e9;
 for(const[p,rad]of aims){
  const d=V(p.x-origin.x,0,p.z-origin.z),flat=d.length(),h=p.y-origin.y,g=BOW.g,s2=speed*speed,disc=s2*s2-g*(g*flat*flat+2*h*s2);if(disc<0||flat<1)continue;
  const up=Math.atan((s2-Math.sqrt(disc))/(g*flat)),ideal=d.normalize().multiplyScalar(Math.cos(up)).add(V(0,Math.sin(up),0)).normalize(),a=dir.angleTo(ideal);
  if(a*180/Math.PI<=G.cone&&a*flat<=rad&&a<bestA){bestA=a;best=ideal;}
 }
 if(!best||bestA<1e-6)return dir;
 const turn=Math.min(bestA*G.blend,G.cap*Math.PI/180)/bestA,q=new T.Quaternion().setFromUnitVectors(dir.clone().normalize(),best);
 return dir.clone().applyQuaternion(new T.Quaternion().slerp(q,turn)).normalize();
}
// ---- Playtest log (?log=1, or "log" in src/config.json; off by default). Sends what happened in a test to the playtest
// store named by CONFIG.logTo (a Supabase table the page can only add to, through playtest_add): a session row at the start, one row per shot or
// cancel, one per finished stage, an end row with the time played and the frame rate, and the rating the tester gives after
// leaving the headset. A random session id only; nothing that identifies the player. Rows wait in this browser until sent.
const LOG_DRY=QUERY.get('log')==='dry';   // the tests: rows are kept in plog.sent, never sent
const LOG=(QUERY.has('log')?QUERY.get('log')==='1'||LOG_DRY:!!CONFIG.log)&&!!(CONFIG.logTo&&CONFIG.logTo.url&&CONFIG.logTo.key);
const PLOG_KEY='bow-shadow-playlog-queue',r2=n=>n==null||!isFinite(n)?null:Math.round(n*100)/100;
const plog={sent:[],id:'',q:[],sentAt:0,busy:false,shots:0,hits:0,cancels:0,stages:0,frames:0,ftime:0,slow:0,xrTime:0,xrWas:false,t0:Date.now(),panel:null};
const plogUuid=()=>crypto.randomUUID?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g,()=>(Math.random()*16|0).toString(16));
function plogAdd(kind,data){
 if(!LOG)return;
 plog.q.push({rid:plogUuid(),session:plog.id,kind,test:location.search.slice(0,200),bow:BOW3?'fun':BOW2?'v2':'v1',build:String(CONFIG.build||'').slice(0,40),sent_at:null,data});
 if(plog.q.length>2000)plog.q.splice(0,plog.q.length-2000);
 if(!LOG_DRY)try{localStorage.setItem(PLOG_KEY,JSON.stringify(plog.q));}catch{}
}
function plogFlush(final){
 if(!LOG||plog.busy||!plog.q.length)return;
 const rows=plog.q.slice(0,final?60:200),now=new Date().toISOString();rows.forEach(r=>r.sent_at=now);
 if(LOG_DRY){plog.sent.push(...plog.q.splice(0,rows.length));plog.sentAt=performance.now();return;}
 plog.busy=true;
 fetch(CONFIG.logTo.url+'/rest/v1/rpc/playtest_add',{method:'POST',keepalive:!!final,headers:{apikey:CONFIG.logTo.key,'Content-Type':'application/json'},body:JSON.stringify({rows})})   // a row sent twice is kept once
  .then(r=>{if(r.ok){plog.q.splice(0,rows.length);try{localStorage.setItem(PLOG_KEY,JSON.stringify(plog.q));}catch{}}})
  .catch(()=>{}).finally(()=>{plog.busy=false;plog.sentAt=performance.now();});
}
function plogEnd(why){
 if(!LOG)return;
 plogAdd('end',{why,secs:Math.round((Date.now()-plog.t0)/1000),xrSecs:Math.round(plog.xrTime),shots:plog.shots,hits:plog.hits,cancels:plog.cancels,stages:plog.stages,
  fps:plog.ftime?Math.round(plog.frames/plog.ftime):null,slowShare:plog.frames?r2(plog.slow/plog.frames):null});
 plogFlush(true);
}
// at the release: what the hands did. The result is added when the arrow lands (plogShot).
function plogLoose(q,dir,power,perfect){
 if(!LOG)return;const vr=xrOn();let cant=null;
 if(vr&&bowHand){const up=V(0,1,0).applyQuaternion(bow.quaternion),side=dir.clone().cross(V(0,1,0));if(side.lengthSq()>1e-6)cant=Math.asin(clamp(up.dot(side.normalize()),-1,1))*57.2958;}
 q.plog={t0:elapsed,stage:range.on&&STAGES[range.stage]?STAGES[range.stage].name:'',vr,hand:state.hand,power:r2(power),speed:r2(arrowSpeed(power)),up:r2(Math.asin(clamp(dir.y,-1,1))*57.2958),cant:r2(cant),perfect:!!perfect,
  draw:LAB?r2(lab.drawNow):null,shake:LAB?r2(labShake(bow2.raw||dir)):null,sent:LAB&&BOW2&&bow2.raw?r2(labErr(dir)):null};
}
function plogShot(q,res){if(!LOG||!q.plog)return;plog.shots++;if(res.hit)plog.hits++;const d=Object.assign(q.plog,res,{flight:r2(elapsed-q.plog.t0)});delete d.t0;plogAdd('shot',d);q.plog=null;}
function plogCancel(power){if(!LOG)return;plog.cancels++;plogAdd('shot',{cancel:true,power:r2(power),vr:xrOn(),stage:range.on&&STAGES[range.stage]?STAGES[range.stage].name:''});}
function plogStep(dt){
 if(!LOG)return;const vr=renderer.xr.isPresenting;
 if(dt>0&&dt<1){plog.frames++;plog.ftime+=dt;if(dt>1.5/72)plog.slow++;}
 if(vr)plog.xrTime+=dt;
 if(plog.xrWas&&!vr){plogEnd('left headset');plogRate(true);}
 plog.xrWas=vr;
}
// the rating, on the page after leaving the headset (a "Rate this test" button keeps it reachable)
function plogRate(open){
 if(!LOG)return;
 if(!plog.panel){
  const p=document.createElement('div');p.id='plogPanel';
  p.style.cssText='position:fixed;inset:0;z-index:50;display:none;align-items:center;justify-content:center;background:#0009;font:18px/1.4 system-ui,sans-serif;color:#eef2ee';
  const row=(k,label,opts)=>'<div style="margin:14px 0 6px">'+label+'</div><div data-k="'+k+'" style="display:flex;gap:8px;flex-wrap:wrap">'+opts.map(o=>'<button data-v="'+o+'" style="min-width:56px;padding:12px 14px;font:inherit;border-radius:10px;border:2px solid #4a5753;background:#2a3331;color:inherit">'+o+'</button>').join('')+'</div>';
  p.innerHTML='<div style="background:#1d2322;border-radius:16px;padding:22px;width:min(560px,92vw);max-height:92vh;overflow:auto"><b style="font-size:22px">How was that test?</b>'
   +row('fun','Fun (1 dull, 5 great)',[1,2,3,4,5])+row('comfort','Comfort (1 sore or awkward, 5 easy)',[1,2,3,4,5])+row('aim','Did the arrow go where you expected? (1 never, 5 always)',[1,2,3,4,5])+row('sick','Any sickness or dizziness?',['none','a little','yes'])
   +'<div style="margin:14px 0 6px">Anything else (optional)</div><textarea maxlength="500" rows="3" style="width:100%;font:inherit;border-radius:10px;background:#2a3331;color:inherit;border:2px solid #4a5753;padding:8px"></textarea>'
   +'<div style="display:flex;gap:10px;margin-top:16px"><button data-do="send" style="flex:1;padding:14px;font:inherit;font-weight:700;border-radius:10px;border:0;background:#e2c27a;color:#1d2322">Send</button><button data-do="close" style="padding:14px 18px;font:inherit;border-radius:10px;border:2px solid #4a5753;background:transparent;color:inherit">Not now</button></div><div data-msg style="margin-top:10px;color:#a9b6b0"></div></div>';
  const pick={};['keydown','keyup','mousedown','pointerdown','click','wheel'].forEach(t=>p.addEventListener(t,e=>e.stopPropagation()));
  p.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
   const g=b.parentElement.dataset.k;if(g){pick[g]=b.dataset.v;[...b.parentElement.children].forEach(x=>x.style.borderColor=x===b?'#e2c27a':'#4a5753');return;}
   if(b.dataset.do==='close'){p.style.display='none';return;}
   if(b.dataset.do==='send'){plogAdd('rating',{...pick,note:p.querySelector('textarea').value.slice(0,500),shots:plog.shots,hits:plog.hits});plogFlush(true);p.querySelector('[data-msg]').textContent='Saved. Thank you.';setTimeout(()=>{p.style.display='none';},900);}});
  document.body.append(p);plog.panel=p;
  const k=document.createElement('button');k.textContent='Rate this test';k.style.cssText='position:fixed;left:10px;bottom:10px;z-index:9;padding:8px 12px;font:600 14px system-ui,sans-serif;border-radius:8px;border:0;background:#e2c27a;color:#1d2322';
  ['mousedown','pointerdown','keydown'].forEach(t=>k.addEventListener(t,e=>e.stopPropagation()));k.addEventListener('click',e=>{e.stopPropagation();plogRate(true);});document.body.append(k);
 }
 if(open){const p=plog.panel;p.querySelector('[data-msg]').textContent='';p.style.display='flex';if(document.pointerLockElement)document.exitPointerLock?.();}
}
if(LOG){
 if(!LOG_DRY)try{plog.q=JSON.parse(localStorage.getItem(PLOG_KEY)||'[]')||[];}catch{plog.q=[];}
 plog.id=plogUuid();
 plogAdd('session',{ua:navigator.userAgent.slice(0,160),screen:innerWidth+'x'+innerHeight,lab:LAB,grey:GREY,pads:PADS,hand:state.hand,draw:state.draw,reach:state.reach});
 addEventListener('pagehide',()=>plogEnd('page closed'));
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')plogEnd('page hidden');});
 plogRate(false);setTimeout(plogFlush,1000);setInterval(plogFlush,5000);   // sent on its own clock, so rows go even before the game starts
}
function loose(origin,dir,power,perfect=false){
 if(power<BOW.minLoose||(range.on&&(range.phase==='replay'||(range.phase==='play'&&range.arrows<=0)))){if(power<BOW.minLoose)plogCancel(power);if(BOW2&&power<BOW.minLoose)buzz(drawHand||quickHand,...HAP.cancel);cancel();return;}
 if(projectiles.length>48)recycle(0);
 if(BOW3)dir=graceAim(origin,dir,arrowSpeed(power));
 const o=pool.pop()||arrow();scene.add(o);o.visible=true;o.position.copy(origin);o.quaternion.setFromUnitVectors(FWD,dir);
 o.userData.body.rotation.set(0,0,0);o.userData.streak.visible=true;o.userData.streak.scale.z=.001;
 if(BOW2){const gold=perfect;o.userData.streak.material=gold?streakGold:streakMat;o.userData.streak.scale.x=gold?(BOW3?1.3:1.25):1;}
 projectiles.push({o,origin:origin.clone(),velocity:dir.clone().multiplyScalar(arrowSpeed(power)),life:0,stuck:false,power,roll:Math.random()*6,stuckAt:0,jolt:0,spent:false,flat:false});
 rangeLoosed(projectiles[projectiles.length-1],perfect);plogLoose(projectiles[projectiles.length-1],dir,power,perfect);
 if(LAB){lab.shot=projectiles[projectiles.length-1].lab={power,speed:arrowSpeed(power),elev:Math.asin(clamp(dir.y,-1,1))*180/Math.PI,draw:lab.drawNow,shake:labShake(bow2.raw||dir),sent:BOW2&&bow2.raw?labErr(dir):null,dir:dir.clone(),t0:elapsed,result:''};lab.aims.length=0;lab.drawNow=0;}
 state.shots++;twang=elapsed;twangPower=power;
 if(BOW3){note(290,.08,'triangle',.09,0,115);note(135,.18,'sawtooth',.025*power,0,95);thump(1400,.08,.11);}   // a taut whip-snap, lighter than the longbow's
 else{note(210,.1,'triangle',.09,0,85);note(98,.24,'sawtooth',.03*power,0,72);thump(900,.12,.12);thump(2600,.3,.05*power);}
 if(BOW2){const s=drawHand||quickHand,h=perfect?HAP.sweet:HAP.loose(power);buzz(bowHand,h[0],h[1]);if(s!==bowHand)buzz(s,h[2],h[3]);}
 else{buzz(bowHand,.4+.6*power,90);buzz(drawHand,.5,40);}cancel();
}
// Small flat-shaded chips thrown up where an arrow lands.
const bits=[],bitGeo=new T.BoxGeometry(1,1,1);
function burst(p,color,n,force=1,lift=1){
 for(let i=0;i<n;i++){
  let b=bits.find(x=>x.life<=0);
  if(!b){if(bits.length>=96)return;b={m:new T.Mesh(bitGeo),v:V(),life:0,span:1,size:1};scene.add(b.m);bits.push(b);}
  b.m.material=material(color);b.m.visible=true;b.m.position.copy(p);b.m.rotation.set(Math.random()*6,Math.random()*6,0);
  const a=Math.random()*6.283,r=Math.random()*1.7*force;b.v.set(Math.cos(a)*r,(1+Math.random()*2.6)*lift*force,Math.sin(a)*r);
  b.span=b.life=.45+Math.random()*.5;b.size=.025+Math.random()*.035;b.m.scale.setScalar(b.size);
 }
}
function stepBits(dt){
 for(const b of bits){
  if(b.life<=0)continue;b.life-=dt;if(b.life<=0){b.m.visible=false;continue;}
  b.v.y-=9*dt;b.m.position.addScaledVector(b.v,dt);b.m.rotation.x+=dt*7;b.m.scale.setScalar(b.size*Math.min(1,b.life/b.span*1.6));
 }
}
function hit(t,q){
 if(BOW2&&xrOn()&&t.kind!=='range'&&t.kind!=='spirit'){const big=t.kind==='peal'||t.kind==='bell',h=big?HAP.big:HAP.hit;buzz(bowHand,h[0],h[1]);if(big)buzz(hands.find(x=>x!==bowHand&&x.pose),h[2],h[3]);}
 if(t.kind==='peal'){pealHit(q);return;}
 if(t.kind==='grass'){kilnClear(t,q);return;}
 if(t.kind==='range'||t.kind==='spirit'){rangeHit(t,q);return;}
 if(t.kind==='sign'){thump(600,.1,.2);if(range.phase==='results')range.pending=t.id;return;}
 const dist=Math.round(q.origin.distanceTo(q.o.position));t.kick=elapsed;
 if(dist>state.longest&&(t.kind!=='bell'||!t.hit))state.longest=dist;
 if(t.kind==='bell'){
  bellSound(t.site.tone);
  if(!t.hit){
   t.hit=true;state.bells.add(t.site.id);t.beacon.visible=false;t.flag.material.color.set(gold);
   if(state.bells.size===SITES.length){state.done=true;say('All seven bells ring across the vale',9);SITES.forEach((s,i)=>bellSound(s.tone,.9+i*.42,.8));for(const s of SITES)s.item.kick=elapsed+.9;}
   else say(`${t.name} wakes  ·  ${state.bells.size} of 7  ·  ${dist} m`,4.5);
  }else say(t.name,1.3);
 }else if(t.kind==='straw'){
  note(124,.16,'triangle',.29,0,40);thump(500,.15,.25);
  if(!t.hit){t.hit=true;state.marks.add(t.idx);t.flag.material.color.set(gold);say(`Straw round  ·  ${state.marks.size} of ${strawSpots.length}  ·  ${dist} m`,3);}
 }else if(t.kind==='drill'){
  note(124,.16,'triangle',.29,0,40);thump(500,.15,.25);drillHit(t,q,dist);
 }else if(!t.hit){
  t.hit=true;state.lanterns.add(t.idx);hitMeshes=hitMeshes.filter(m=>m.userData.target!==t);
  note(880,.25,'sine',.15,0,1760);thump(2500,.2,.2);say(`Lantern  ·  ${state.lanterns.size} of ${lanterns.length}  ·  ${dist} m`,3);
 }
 refresh();save();
}
function settle(q,dir,deep){
 q.jolt=BOW3?clamp(q.velocity.length()/62,.25,1):BOW2?clamp(q.velocity.length()/58,.25,1):clamp(q.velocity.length()/55,.3,1);q.stuck=true;q.stuckAt=elapsed;
 const u=q.o.userData;u.streak.visible=false;if(u.gale)u.gale.visible=false;u.body.rotation.set(0,0,q.roll);if(deep)q.o.position.addScaledVector(dir,deep);
}
function stepArrows(dt){
 for(let i=projectiles.length-1;i>=0;i--){
  const q=projectiles[i],u=q.o.userData;q.life+=dt;
  if(q.life>(q.stuck?50:14)){recycle(i);continue;}
  if(q.stuck){const t=elapsed-q.stuckAt;if(!q.flat&&t<1.2)u.body.rotation.x=BOW3?(t<.7?q.jolt*.13*Math.exp(-8*t)*Math.sin(64*t):0):BOW2?(t<.9?q.jolt*.16*Math.exp(-7*t)*Math.sin(58*t):0):q.jolt*.15*Math.exp(-6*t)*Math.sin(52*t);continue;}
  if(BOW2)tmpV0.copy(q.velocity);
  if(BOW.drag){const s=q.velocity.length();q.velocity.addScaledVector(q.velocity,-BOW.drag*s*dt);}q.velocity.y-=BOW.g*dt;
  if(q.windy){const push=range.wind*1.4*dt*(q.kind==='gale'?ARROW_RULE.galeWind:1);q.velocity.x+=YARD.rx*push;q.velocity.z+=YARD.rz*push;}   // a crosswind pushes the arrow sideways all the way down the lane
  const mv=BOW2?tmpMid.copy(tmpV0).add(q.velocity).multiplyScalar(.5):q.velocity,speed=mv.length(),dir=tmpDir.copy(mv).divideScalar(speed),distance=speed*dt,p=q.o.position;
  let contact=null;
  if(!q.spent){ray.set(p,dir);ray.far=distance+.01;contact=range.on?ray.intersectObjects(rangeMeshes,false).find(c=>{const t=c.object.userData.target;return!(t.tilt&&t.tilt.rotation.x<-.6);}):ray.intersectObjects(hitMeshes,false)[0];}   // a pop-up lying down cannot be hit
  if(ARROWS&&q.kind==='kiln'&&!q.spent&&!q.done){
   // grass before whatever is in it: a clump struck on the way wins over anything behind it, and a shade reached first that is keeping low in an intact clump counts as that clump
   for(const c of grassClumps)if(c.visible){const k=ray.intersectObject(c.userData.hit,false)[0];if(k&&(!contact||k.distance<=contact.distance))contact=k;}
   const sp=contact&&contact.object.userData.target;
   if(sp&&sp.kind==='spirit'&&!sp.bird){const b=sp.base.position,c=grassClumps.find(c=>c.visible&&hyp(c.position.x-b.x,c.position.z-b.z)<.85);if(c)contact={distance:contact.distance,point:contact.point,object:c.userData.hit};}
  }
  const limit=contact?contact.distance:distance;
  q.o.quaternion.setFromUnitVectors(FWD,dir);
  if(q.spent){q.roll+=dt*13;u.body.rotation.set(q.roll,0,0);}
  else{
   // the shaft fishtails as it leaves the string, then steadies and spins
   if(BOW3){const w=(.04+.055*q.power)*Math.exp(-10*q.life);q.roll+=dt*(14+speed*.3);
    u.body.rotation.set(w*.3*Math.cos(39*q.life),w*Math.sin(52*q.life),q.roll);u.streak.scale.z=clamp((speed-18)*.036,.2,1.8)*Math.min(1,q.life/.04)*clamp((1.7-q.life)/.5,0,1);}
   else if(BOW2){const w=(.06+.08*q.power)*Math.exp(-7.5*q.life);q.roll+=dt*(10+speed*.25);
    u.body.rotation.set(w*.35*Math.cos(31*q.life),w*Math.sin(42*q.life),q.roll);u.streak.scale.z=clamp((speed-14)*.045,.15,2.2)*Math.min(1,q.life/.06)*clamp((2-q.life)/.5,0,1);}
   else{const w=q.power*.08*Math.exp(-4.5*q.life);q.roll+=dt*(8+speed*.2);
   u.body.rotation.set(w*.5*Math.sin(29*q.life),w*Math.sin(36*q.life),q.roll);u.streak.scale.z=clamp(speed*.04,.2,2.4)*Math.min(1,q.life/.1);}
  }
  let gone=0;
  walk:while(gone<limit){
   const step=Math.min(.3,limit-gone);p.addScaledVector(dir,step);gone+=step;
   const g=groundAt(p.x,p.z);
   if(p.y<0&&g<0){rangeEnded(q);p.y=0;thump(1800,.3,.12);burst(p,'#d8ecee',12,1,1.3);recycle(i);q.stuck=true;break;}
   if(p.y<=g){
    const wet=WORLD2&&(()=>{const[a,b]=laneAt(p.x,p.z);return Math.abs(a-LANE.creek)<1.5&&Math.abs(b)<27;})();   // in the creek
    rangeEnded(q);p.y=g;thump(wet?1800:350,wet?.3:.1,.14);burst(p,wet?'#d8ecee':'#8d7b58',wet?12:q.spent?3:7,wet?1:.7,wet?1.3:1);
    if(q.spent){
     settle(q,dir,0);q.flat=true;u.body.rotation.set(0,0,0);p.y+=.02;
     const l=hyp(dir.x,dir.z);q.o.quaternion.setFromUnitVectors(FWD,l>.001?V(dir.x/l,0,dir.z/l):V(1,0,0));
    }else settle(q,dir,.07);
    for(const d of deer)if(hyp(d.root.position.x-p.x,d.root.position.z-p.z)<22)startle(d,p.x,p.z);
    break;
   }
   if(!q.spent)for(const c of near(p.x,p.z))if(p.y<c.top&&hyp(p.x-c.x,p.z-c.z)<c.ar){rangeEnded(q);note(160,.08,'triangle',.12,0,70);burst(p,'#6e5a44',5,.6);settle(q,dir,.05);break walk;}
  }
  if(q.ranged&&!q.done&&q.path.length<900){q.path.push(p.clone());rangeNear(q);}
  if(!q.stuck&&contact){
   p.copy(contact.point);const t=contact.object.userData.target;hit(t,q);hitFlash=elapsed+.2;
   if(t.kind==='straw'||t.kind==='drill'||t.kind==='range'||t.kind==='sign'){burst(p,'#e6cd7c',10,.8);settle(q,dir,.09);if(t.id==='mover'||t.kind==='range')(t.tilt||t.base).attach(q.o);}   // an arrow in the sliding round rides along with it
   else if(t.kind==='spirit'||t.kind==='grass'){u.streak.visible=false;q.spent=true;q.velocity.copy(dir).multiplyScalar(speed*.12);}
   else if(t.kind==='lantern'){burst(p,'#ffb866',16,1.2);t.root.visible=false;}   // the arrow flies on through the paper
   else{
    // an arrow glances off the bronze and tumbles to the ground
    burst(p,'#ffd98a',8,1);
    const n=contact.face?contact.face.normal.clone().transformDirection(contact.object.matrixWorld):dir.clone().negate();
    q.velocity.copy(dir).multiplyScalar(speed);q.velocity.addScaledVector(n,-2*q.velocity.dot(n)).multiplyScalar(.2);q.velocity.y+=1.5;
    q.spent=true;u.streak.visible=false;p.addScaledVector(n,.05);
   }
  }
 }
}

// ---------------------------------------------------------------- desktop play
const keys=new Set(), look={yaw:0,pitch:0};
let playing=false,noLock=false,vy=0,airborne=false,stride=0,saveClock=0,climb=null,introduced=false,drawHold=null;
function feet(out){if(xrOn()){head().getWorldPosition(out);}else out.copy(rig.position);return out;}
function place(x,z,yaw=look.yaw){rig.position.set(x,Math.max(groundAt(x,z),WADE),z);look.yaw=yaw;vy=0;climb=null;airborne=false;grassX=1e9;}
function walked(d){stride+=d;if(stride>1.7){stride=0;thump(260,.09,.07);}}
function desktopMove(dt){
 const f=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0),s=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0);
 look.yaw+=((keys.has('KeyQ')||keys.has('ArrowLeft')?1:0)-(keys.has('KeyE')||keys.has('ArrowRight')?1:0))*1.9*dt;
 if(range.on)return;   // on the range you stand at the line
 const p=rig.position;
 if(climb){
  // on a climbing face: W and S go up and down, A and D shuffle sideways, Space lets go
  const a=climb,tx=-a.nz,tz=a.nx,side=clamp((p.x-a.x)*tx+(p.z-a.z)*tz-s*1.6*dt,-(a.w-.25),a.w-.25),low=Math.max(groundAt(p.x,p.z),WADE);
  p.y+=f*2.3*dt;if(f)walked(2.3*dt*.8);
  p.x=a.x+a.nx*.45+tx*side;p.z=a.z+a.nz*.45+tz*side;
  if(p.y>=a.y1){p.x=a.x-a.nx*a.in+tx*side;p.z=a.z-a.nz*a.in+tz*side;p.y=a.y1;climb=null;thump(240,.12,.1);}
  else if(p.y<=low){p.y=low;if(f<0)climb=null;}
  else if(keys.has('Space')){keys.delete('Space');climb=null;airborne=true;vy=0;p.x+=a.nx*.3;p.z+=a.nz*.3;}
  return;
 }
 const wading=groundAt(p.x,p.z)<-.4;
 if(f||s){
  const sp=(keys.has('ShiftLeft')||keys.has('ShiftRight')?9.5:5.2)*(wading?.5:1)*(charging?.5:1)*dt/hyp(f,s),sy=Math.sin(look.yaw),cy=Math.cos(look.yaw);
  const[nx,nz]=tryMove(p.x+(-sy*f+cy*s)*sp,p.z+(-cy*f-sy*s)*sp,p.y);if(!airborne)walked(hyp(nx-p.x,nz-p.z));p.x=nx;p.z=nz;
 }
 if(f>0){
  const a=panelNear(V(p.x,p.y+1,p.z),.95);
  if(a&&p.y<a.y1-.3&&Math.sin(look.yaw)*a.nx+Math.cos(look.yaw)*a.nz>.4){climb=a;airborne=false;vy=0;cancel();return;}
 }
 const g=floorAt(p.x,p.z,p.y);
 if(!airborne&&p.y>g+.6){airborne=true;vy=0;}
 if(keys.has('Space')&&!airborne&&!wading){vy=6.2;airborne=true;}
 if(airborne){vy-=18*dt;p.y+=vy*dt;if(p.y<=g){p.y=g;airborne=false;vy=0;thump(240,.12,.1);}}else p.y=lerp(p.y,g,Math.min(1,dt*18));
}
const bowTurn=new T.Quaternion(),bowEuler=new T.Euler();
// side is 1 when the bow is in the left hand (a right-handed archer) and -1 when it is in the right
function bowSide(side){
 if(side===handSide)return;handSide=side;gripSide.scale.x=side;plaque.mesh.position.x=.2*side;plaque.mesh.rotation.y=-.3*side;
}
function setHand(hand){
 state.hand=hand;$('handR').classList.toggle('quiet',hand!=='right');$('handL').classList.toggle('quiet',hand!=='left');save();
}
$('handR').onclick=()=>setHand('right');$('handL').onclick=()=>setHand('left');
// how the bow is drawn in VR: 'two' is the real two-handed draw, 'one' draws on a held trigger alone
function setDraw(mode){
 state.draw=mode;$('drawTwo').classList.toggle('quiet',mode!=='two');$('drawOne').classList.toggle('quiet',mode!=='one');save();
}
$('drawTwo').onclick=()=>setDraw('two');$('drawOne').onclick=()=>setDraw('one');
function desktopPose(){
 // the draw eases out, so the last of the pull is the slowest
 // the mouse wheel takes over the draw: roll back to ease the string forward for a soft shot, roll forward to pull further
 if(charging){if(drawHold!==null)charge=drawHold;else{const u=Math.min(1,(elapsed-startTime)/BOW.oneHand);charge=1-(1-u)*(1-u);}}
 const r=recoil(),fov=68-7*zoom+r.kick*2.5;
 if(Math.abs(fov-camera.fov)>.01){camera.fov=fov;camera.updateProjectionMatrix();}
 camera.rotation.set(look.pitch+r.kick*.012,look.yaw,0);camera.updateMatrixWorld();
 const q=camera.quaternion,eye=camera.getWorldPosition(V());
 const tired=!BOW2&&charging&&charge>=1?Math.min(1,(elapsed-startTime-.85)/2)*.0022:0;
 const side=state.hand==='left'?-1:1;bowSide(side);   // a left-handed archer holds the bow on the right of the view
 bow.scale.setScalar(.73);bow.visible=!climb&&!replay.on;
 bow.position.copy(eye).add(V(side*(-.26+.07*zoom)+Math.sin(elapsed*31)*tired,-.28+.05*zoom+Math.sin(elapsed*43)*tired,-.63-r.kick*.05).applyQuaternion(q));
 bow.quaternion.copy(q).multiply(bowTurn.setFromEuler(bowEuler.set(-r.kick*.3,0,side*(-.3+.2*zoom))));
 setString(V(restX(),REST,KIT.nockZ+charge*KIT.pull-.05*r.snap),.2*charge-.04*r.snap);
 poseArrow(aimDesktop(),!climb&&!replay.on);
}
function aimDesktop(){const eye=camera.getWorldPosition(V());return eye.add(V(0,0,-70).applyQuaternion(camera.quaternion)).sub(bow.position).normalize();}
function begin(locked){
 playing=true;noLock=!locked;$('start').hidden=true;audioStart();
 if(!introduced&&state.lesson===0&&!range.on){introduced=true;say('The training yard is just north-west of the hamlet  ·  follow the ✦ on the compass',8);}
}
function pause(){if(xrOn())return;playing=false;cancel();keys.clear();if(!mapOpen){$('play').textContent='Return to the vale';$('start').hidden=false;}save();}
$('play').onclick=()=>{audioStart();try{const r=canvas.requestPointerLock();if(r&&r.catch)r.catch(()=>begin(false));}catch{begin(false);}};
document.addEventListener('pointerlockchange',()=>{if(document.pointerLockElement===canvas)begin(true);else if(!noLock)pause();});
document.addEventListener('pointerlockerror',()=>begin(false));
document.addEventListener('mousemove',e=>{
 if(!playing||xrOn())return;look.yaw-=e.movementX*.0023;look.pitch=clamp(look.pitch-e.movementY*.0023,-1.45,1.45);
});
canvas.addEventListener('mousedown',e=>{if(e.button!==0||!playing||xrOn()||climb)return;if(replay.on){range.skip=true;return;}charging=true;drawHold=null;startTime=elapsed;$('ret').classList.add('draw');note(64,.7,'sawtooth',.012,0,118);});
window.addEventListener('mouseup',e=>{if(e.button!==0||!charging||xrOn())return;desktopPose();const held=elapsed-startTime;loose(preview.position,aimDesktop(),charge,drawHold===null&&held>=BOW.oneHand&&held<=BOW.oneHand+(BOW2?BOW.sweet:.45));});
canvas.addEventListener('wheel',e=>{if(!charging||xrOn())return;e.preventDefault();drawHold=clamp((drawHold===null?charge:drawHold)-Math.sign(e.deltaY)*.07,.1,1);},{passive:false});
window.addEventListener('blur',()=>{cancel();keys.clear();});
function setMap(open){
 mapOpen=open;mapCanvas.classList.toggle('big',open);mapClock=0;
 if(open){playing=false;cancel();keys.clear();if(document.pointerLockElement)document.exitPointerLock();}
 else if(noLock)begin(false);else $('play').onclick();
}
window.addEventListener('keydown',e=>{
 if(xrOn())return;
 if(e.code==='KeyM'&&!e.repeat&&(playing||mapOpen)){setMap(!mapOpen);return;}
 if(e.code==='Escape'&&noLock&&playing){pause();return;}
 if(e.code==='KeyH'&&playing&&!e.repeat&&!charging){setHand(state.hand==='left'?'right':'left');say(state.hand==='left'?'Left-handed  ·  bow in the right hand':'Right-handed  ·  bow in the left hand',2.5);return;}
 if(range.on&&playing&&!charging){const step={BracketLeft:-1,PageUp:-1,BracketRight:1,PageDown:1}[e.code];if(step){e.preventDefault();stageGo(range.stage+step);return;}}
 if(replay.on&&playing&&(e.code==='Space'||e.code==='Enter')){range.skip=true;e.preventDefault();return;}
 if(ARROWS&&range.on&&playing&&!e.repeat&&!charging){const k={Digit1:'std',Digit2:'rime',Digit3:'gale',Digit4:'kiln'}[e.code];if(k){quiverPick(k);return;}}
 if(range.on&&playing&&range.phase==='results'){const go={KeyN:'next',Enter:'next',KeyR:'again',KeyB:'back'}[e.code];if(go){range.pending=go;return;}}
 if(playing){keys.add(e.code);if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();}
});
window.addEventListener('keyup',e=>keys.delete(e.code));
mapCanvas.addEventListener('click',e=>{
 if(!mapOpen)return;const r=mapCanvas.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*SIZE-HALF,z=(e.clientY-r.top)/r.height*SIZE-HALF;
 const s=SITES.filter(s=>s.item.hit).sort((a,b)=>hyp(a.x-x,a.z-z)-hyp(b.x-x,b.z-z))[0];
 if(s&&hyp(s.x-x,s.z-z)<34){travel(s);setMap(false);}
});
function travel(s){const l=hyp(s.x,s.z),d=s.tower?10:7;place(s.x-s.x/l*d,s.z-s.z/l*d,Math.atan2(s.x,s.z)+Math.PI);say(s.name,2);note(660,.5,'sine',.08,0,990);}
$('wipe').onclick=()=>{try{localStorage.removeItem(SAVE);}catch{}location.reload();};
if(REPLAY&&$('tally')){const b=$('tally');b.hidden=false;b.onclick=async()=>{const text=JSON.stringify(playtest(),null,1);let ok=false;try{await navigator.clipboard.writeText(text);ok=true;}catch{}
 if(!ok){const a=document.createElement('textarea');a.value=text;document.body.appendChild(a);a.select();try{ok=document.execCommand('copy');}catch{}a.remove();}
 b.textContent=ok?'Copied':'Could not copy';setTimeout(()=>b.textContent='Copy playtest summary',2000);};}

// ---------------------------------------------------------------- VR play
const fake={on:false};
const xrOn=()=>renderer.xr.isPresenting||fake.on, head=()=>fake.on?camera:renderer.xr.getCamera();
const hands=[0,1].map(i=>{
 const grip=renderer.xr.getControllerGrip(i),raySpace=renderer.xr.getController(i),hand=renderer.xr.getHand(i),hold=new T.Object3D(),pinch=new T.Object3D();
 rig.add(grip,raySpace,hand,hold,pinch);
 mesh(grip,new T.SphereGeometry(.039,12,8),i?'#dac5a5':'#92afa6',V());
 // hold: where a bow sits in this hand. pinch: where this hand takes the string. Both follow the controller, or the tracked hand.
 const h={grip,raySpace,hand,hold,pinch,pointDir:V(),source:null,pose:false,turned:false,ran:false,fist:false,nip:false,grab:false,point:false,pointFor:0,climb:null,climbPanel:null,climbAt:0};
 raySpace.addEventListener('connected',e=>{h.source=e.data;});
 raySpace.addEventListener('disconnected',()=>{h.source=null;h.pose=false;h.fist=h.nip=h.grab=h.point=false;h.climb=null;if(bowHand===h||drawHand===h){if(bowHand===h)bowHand=null;drawHand=null;cancel();}});
 return h;
});
const drawAt=V();let frameDt=.016;
let bowHand=null,drawHand=null,quickHand=null,quickAt=0,localEyeOffset=0,running=false,vrVy=0,lastPanel=null,fullAt=0;
const plaque=(()=>{
 const c=document.createElement('canvas');c.width=512;c.height=224;const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;
 const m=new T.Mesh(new T.PlaneGeometry(.25,.109),new T.MeshBasicMaterial({map:tex}));m.position.set(.2,-.02,.12);m.rotation.set(-.35,-.3,0);m.visible=false;bow.add(m);
 let shown='';
 return{mesh:m,set(text){
  if(text===shown)return;shown=text;const g=c.getContext('2d');g.fillStyle='#273c34';g.fillRect(0,0,512,224);g.strokeStyle='#bcaa7a';g.lineWidth=6;g.strokeRect(6,6,500,212);
  g.fillStyle='#ffebbd';g.textAlign='center';g.textBaseline='middle';const lines=text.split('\n');g.font=(lines.length>2?36:42)+'px Georgia';
  lines.forEach((l,i)=>g.fillText(l,256,112+(i-(lines.length-1)/2)*(lines.length>2?56:64),490));tex.needsUpdate=true;
 }};
})();
const needle=mesh(scene,new T.ConeGeometry(.018,.09,6).rotateX(-Math.PI/2),new T.MeshBasicMaterial({color:0xffd277}));needle.visible=false;
function vrStatus(){
 if(elapsed<messageEnd)return message.replaceAll('  ·  ','\n');
 const bare=hands.some(h=>h.source?.hand);
 if(!bowHand)return bare?'Close a fist on the bow\nPoint a finger to walk':'Grip near the bow\nwith either hand';
 if(!state.shots)return bare?'Pinch the string\npull back and let go':state.draw==='one'?'Hold a trigger to draw\nlet go to loose':'Free hand to the string\nhold trigger, pull, let go';
 if(charging)return'Draw '+Math.round(charge*10)*10+'%'+String.fromCharCode(10)+(charge>=.95?'full draw':'pull further for more power');
 if(range.on&&STAGES[range.stage].lab)return labText(0).replaceAll('      ','\n')+'\n'+labText(1).replaceAll('      ','\n');
 if(range.on){const i=rangeInfo();return range.phase==='results'?'Score '+range.score+'  '+'★'.repeat(range.stars)+'☆'.repeat(3-range.stars)+(range.gap?'\n'+range.gap:range.gain?'\nnew best  +'+range.gain:'')+coins('\n+'+range.earned+' coins  ·  '+state.coins)+'\nShoot a sign':(STAGES[range.stage].watch?i.title.split('  ·  ')[1]:'Arrows '+range.arrows)+'   Streak '+range.streak+'\nScore '+range.score+quiverText()+'\n'+(SHOW_FPS?fps.now+' fps  low '+fps.low:i.wind);}
 if(state.lesson<5&&hyp(rig.position.x-YARD.x,rig.position.z-YARD.z)<80){const i=lessonInfo();return i.title.split('  ·  ')[1]+'\n'+(i.mark||'See the board');}
 if(state.lesson<5&&state.bells.size===0)return'Training yard\nfollow the gold needle';
 if(state.done)return'The vale is awake\n'+counts().split('\n').slice(1).join('\n');
 return counts();
}
function takeBow(h){
 if(!h.pose||h===drawHand)return;
 if(h!==bowHand&&h.hold.getWorldPosition(V()).distanceTo(bow.position)<.42){bowHand=h;drawHand=null;cancel();audioStart();thump(600,.08,.1);if(BOW2)buzz(h,...HAP.take);}
}
// A hand closed on a climbing face holds on there; moving that hand then moves you instead.
function grabClimb(h){
 if(!h.pose)return false;
 const at=h.hold.getWorldPosition(V()),a=panelNear(at,.32);if(!a)return false;
 h.climb=at;h.climbPanel=a;h.climbAt=elapsed;if(h===drawHand||charging){drawHand=null;cancel();}
 buzz(h,.5,30);thump(420,.06,.08);return true;
}
// Two-handed: bring the free hand to the string, hold its trigger, pull back and let go; how far you pull sets the power.
// Single-handed: hold any trigger and the bow draws by itself; let go and the arrow flies straight out of the bow.
// Tracked hands have no trigger, so they always take the string.
function startDraw(h){
 if(vrMenu.open)return;
 if(BOW3&&elapsed-twang<BOW.ready){if(BOW.ready-(elapsed-twang)<=BOW.buffer)bow3wait={h,at:elapsed};return;}   // no arrows while the cloth menu is up
 if(replay.on){range.skip=true;return;}
 if(!h.pose||!bowHand||!bowHand.pose||charging||hands.some(x=>x.climb))return;
 const atString=h!==bowHand&&h.pinch.getWorldPosition(V()).distanceTo(bow.localToWorld(V(restX(),REST,KIT.nockZ)))<BOW.catch;
 if(state.draw==='one'&&!h.source?.hand){quickHand=h;quickAt=elapsed;}
 else if(atString){drawHand=h;h.pinch.getWorldPosition(drawAt);}
 else{if(!h.source?.hand)say(h===bowHand?'Use the trigger on your other hand, at the string':'Bring this hand to the string first',2.2);return;}
 charging=true;drawStep=0;fullAt=0;note(64,.7,'sawtooth',.012,0,118);
 if(BOW2){Object.assign(bow2,{peak:0,t0:elapsed,buf:[],earlyAt:0,hi:false,notch:0,closed:false,breathAt:0,raw:null});if(drawHand===h)bowBuzz(h,HAP.nock[0],HAP.nock[1],bowHand,HAP.nock[2],HAP.nock[3]);else if(quickHand===h)buzz(h,HAP.nock[0],HAP.nock[1]);}
 if(BOW3)note(320,.05,'sine',.03,0,440);   // the fun bow's catch: a short bright tap
}
function endDraw(h){
 if(bow3wait&&bow3wait.h===h)bow3wait=null;   // let go before it was caught: nothing
 if(h===quickHand){
  quickHand=null;
  if(charging&&bowHand?.pose){vrPose();const held=elapsed-quickAt;loose(preview.position,V(0,0,-1).transformDirection(bow.matrixWorld),charge,held>=BOW.oneHand&&held<=BOW.oneHand+(BOW2?BOW.sweet:.45));}else cancel();
  return;
 }
 if(h!==drawHand)return;
 if(charging&&h.pose&&bowHand?.pose){vrPose();
  if(BOW2&&Math.min(charge,(h.pinch.getWorldPosition(V()).distanceTo(bow.position)-BOW.rest)/(bowFull()-BOW.rest))<BOW.minLoose){plogCancel(charge);buzz(h,...HAP.cancel);cancel();drawHand=null;return;}   // angle-sim fix 4: the hand back at the bow (where it really is, not the smoothed draw) is a cancel, never a shot
  if(BOW2){bow2.raw=aimVR();const r=bowRelease();bowLearn(bow2.peak,elapsed-bow2.t0);loose(r.origin,r.dir,r.power,!!fullAt&&r.power>=BOW.fullAt-.005&&elapsed-fullAt<=BOW.sweet);bow2.raw=null;}
  else loose(preview.position,aimVR(),charge,!!fullAt&&charge>=.95&&elapsed-fullAt<=.9);}else cancel();drawHand=null;
}
for(const h of hands){ // controllers; tracked hands are read in senseHand instead
 h.raySpace.addEventListener('squeezestart',()=>{if(!h.source?.hand&&!grabClimb(h))takeBow(h);});
 h.raySpace.addEventListener('squeezeend',()=>{if(!h.source?.hand)h.climb=null;});
 h.raySpace.addEventListener('selectstart',()=>{if(vrMenu.open){vrMenuPress(h);return;}if(!h.source?.hand)startDraw(h);});
 h.raySpace.addEventListener('selectend',()=>{if(!h.source?.hand)endDraw(h);});
}
// Hand tracking. A fist on the bow takes it; a pinch or fist on the string draws, opening the hand looses;
// to pass the bow across, open the bow hand and close the other on it; a raised pointing finger walks that way.
const dotGeo=new T.SphereGeometry(.008,8,6),basis=new T.Matrix4();
function senseHand(h){
 const j=h.hand.joints,P=n=>j[n]?.position,w=P('wrist'),it=P('index-finger-tip'),tt=P('thumb-tip'),ik=P('index-finger-phalanx-proximal'),pk=P('pinky-finger-phalanx-proximal'),mk=P('middle-finger-phalanx-proximal');
 if(!h.hand.visible||!w||!it||!tt||!ik||!pk||!mk)return false;
 for(const n in j)if(!j[n].userData.dot)j[n].userData.dot=mesh(j[n],dotGeo,h.source.handedness==='left'?'#92afa6':'#dac5a5',V());
 const size=Math.max(.05,w.distanceTo(mk)),reach=n=>P(n)?P(n).distanceTo(w)/size:2;
 const curl=(reach('middle-finger-tip')+reach('ring-finger-tip')+reach('pinky-finger-tip'))/3,idx=reach('index-finger-tip');
 h.nip=tt.distanceTo(it)<(h.nip?.05:.022);h.fist=curl<(h.fist?1.5:1.2)&&idx<(h.fist?1.6:1.3);h.point=idx>1.6&&curl<1.3&&!h.nip;
 const kn=ik.clone().add(pk).multiplyScalar(.5),f=kn.clone().sub(w).normalize(),u=ik.clone().sub(pk);u.addScaledVector(f,-u.dot(f)).normalize();
 h.hold.position.lerpVectors(w,kn,.75);h.hold.quaternion.setFromRotationMatrix(basis.makeBasis(f.clone().cross(u),u,f.clone().negate()));
 h.pinch.position.lerpVectors(tt,it,.5);h.pointDir.subVectors(it,ik);
 return true;
}
function handGestures(h,dt,eye,climbing){
 const grab=h.pose&&(h.nip||h.fist);
 if(grab&&!h.grab){
  if(grabClimb(h)){}
  else if(h!==bowHand&&h!==drawHand){if(bowHand?.pose&&(bowHand.fist||!bowHand.source?.hand))startDraw(h);else takeBow(h);}
 }else if(!grab&&h.grab){h.climb=null;endDraw(h);}
 h.grab=grab;
 const raised=!climbing&&!range.on&&h.pose&&h.point&&h!==bowHand&&h!==drawHand&&h.pinch.getWorldPosition(V()).y>eye.y-.55;
 h.pointFor=raised?h.pointFor+dt:0;
 if(h.pointFor>.25){
  const d=h.pointDir.clone().applyQuaternion(rig.quaternion),m=hyp(d.x,d.z);
  if(m>.6*d.length()){
   const sp=4*(groundAt(eye.x,eye.z)<-.4?.5:1)*dt/m,[nx,nz]=tryMove(eye.x+d.x*sp,eye.z+d.z*sp,rig.position.y-localEyeOffset);walked(hyp(nx-eye.x,nz-eye.z));
   rig.position.x+=nx-eye.x;rig.position.z+=nz-eye.z;eye.x=nx;eye.z=nz;
  }
 }
}
// the arrow runs from the string hand past the side of the grip. On the new bows (design/angle-sim.md fix 1) that point
// is held above the grip by the world's up and beside it on the level, so tilting (canting) the bow never moves the shot;
// held upright it is the same point as before.
function aimVR(){
 if(!BOW2)return bow.localToWorld(V(restX(),REST,0)).sub(drawAt).normalize();
 const f=bow.position.clone().sub(drawAt);f.y=0;const side=f.lengthSq()>1e-6?V(-f.z,0,f.x).normalize():V(1,0,0).transformDirection(bow.matrixWorld);
 return bow.position.clone().add(V(0,REST,0)).addScaledVector(side,restX()).sub(drawAt).normalize();
}
function headYaw(){const f=FWD.clone().applyQuaternion(head().getWorldQuaternion(new T.Quaternion()));return Math.atan2(-f.x,-f.z);}
function vrLocomotion(dt,frame){
 const eye=head().getWorldPosition(V()),climbing=hands.some(h=>h.climb),off=localEyeOffset;
 for(const h of hands){
  const bare=!!h.source?.hand;
  if(bare)h.pose=senseHand(h);
  else{
   h.pose=fake.on?!!h.source:!!(frame&&h.source?.gripSpace&&frame.getPose(h.source.gripSpace,renderer.xr.getReferenceSpace()));
   h.hold.position.copy(h.grip.position);h.hold.quaternion.copy(h.grip.quaternion);h.pinch.position.copy(h.grip.position);
  }
  if(!h.pose&&h===drawHand){drawHand=null;cancel();}
  if(!h.pose&&h===quickHand){quickHand=null;cancel();}
  if(!h.pose)h.climb=null;
  if(bare){handGestures(h,dt,eye,climbing);continue;}
  const gp=h.source?.gamepad;if(!gp||climbing)continue;
  if(BOW2&&h===drawHand&&charging){const tv=gp.buttons[0]?.value;if(tv>=.85){bow2.hi=true;bow2.earlyAt=0;}else if(bow2.hi&&tv<.8&&!bow2.earlyAt)bow2.earlyAt=elapsed;}
  const ax=gp.axes,sx=ax.length>=4?ax[2]:ax[0]||0,sy=ax.length>=4?ax[3]:ax[1]||0,click=!!gp.buttons[3]?.pressed;if(PADS){padStep(h,gp);padSticks(h,sx,sy,click,dt,eye,off);continue;}
  if(h.source.handedness==='left'){
   if(click&&!h.ran)running=!running;h.ran=click;
   const mag=hyp(sx,sy);
   if(range.on){
    if(Math.abs(sx)>.7&&!h.turned&&!charging){h.turned=true;stageGo(range.stage+Math.sign(sx));}else if(Math.abs(sx)<.3)h.turned=false;
    if(ARROWS){if(Math.abs(sy)>.7&&Math.abs(sx)<.4&&!h.picked&&!charging){h.picked=true;quiverStep(sy<0?1:-1);}else if(Math.abs(sy)<.3)h.picked=false;}   // up or down picks the arrow
   }
   if(mag>.18&&!range.on){
    const yaw=headYaw(),sp=(running?7.5:3.6)*Math.min(1,mag)*(charging?.5:1)*(groundAt(eye.x,eye.z)<-.4?.5:1)*dt/mag,s=Math.sin(yaw),c=Math.cos(yaw);
    const[nx,nz]=tryMove(eye.x+(s*sy+c*sx)*sp,eye.z+(c*sy-s*sx)*sp,rig.position.y-off);walked(hyp(nx-eye.x,nz-eye.z));
    rig.position.x+=nx-eye.x;rig.position.z+=nz-eye.z;eye.x=nx;eye.z=nz;
   }else running=running&&mag>.05;
  }else{
   if(click&&!h.ran&&!charging){setDraw(state.draw==='one'?'two':'one');say(state.draw==='one'?'Single-handed draw  ·  hold a trigger':'Two-handed draw  ·  free hand to the string',3);}h.ran=click;
   if(Math.abs(sx)>.65&&!h.turned&&!range.on){
    const a=-Math.sign(sx)*Math.PI/6,ox=rig.position.x-eye.x,oz=rig.position.z-eye.z,s=Math.sin(a),c=Math.cos(a);
    rig.rotation.y+=a;rig.position.x=eye.x+ox*c+oz*s;rig.position.z=eye.z-ox*s+oz*c;h.turned=true;
   }else if(Math.abs(sx)<.3)h.turned=false;
  }
 }
 // the bow is put in your hand: the left for a right-handed archer, the right for a left-handed one. A grip squeeze near it still swaps hands.
 if(!bowHand){const want=state.hand==='left'?'right':'left',h=hands.find(x=>x.pose&&!x.climb&&x.source?.handedness===want);if(h){bowHand=h;thump(600,.08,.1);}}
 if(quickHand&&(!bowHand||!bowHand.pose)){quickHand=null;cancel();}
 if(replay.on){vrVy=0;return;}   // the replay holds the player beside the mark
 // the hand that took hold last leads: the rig moves so that hand stays where it gripped
 const lead=hands.filter(h=>h.climb).sort((a,b)=>b.climbAt-a.climbAt)[0];
 if(lead){
  const d=lead.climb.clone().sub(lead.hold.getWorldPosition(V()));rig.position.add(d);eye.add(d);
  const low=Math.max(groundAt(eye.x,eye.z),WADE);if(rig.position.y-off<low)rig.position.y=low+off;
  vrVy=0;lastPanel=lead.climbPanel;return;
 }
 let feetY=rig.position.y-off;
 if(lastPanel){
  // letting go with your head above the top steps you onto it
  const a=lastPanel;lastPanel=null;
  if(feetY>=a.y1-1){
   const tx=-a.nz,tz=a.nx,side=clamp((eye.x-a.x)*tx+(eye.z-a.z)*tz,-(a.w-.3),a.w-.3),nx=a.x-a.nx*a.in+tx*side,nz=a.z-a.nz*a.in+tz*side;
   rig.position.x+=nx-eye.x;rig.position.z+=nz-eye.z;eye.x=nx;eye.z=nz;rig.position.y=a.y1+off;feetY=a.y1;thump(240,.12,.1);
  }
 }
 const floor=floorAt(eye.x,eye.z,feetY);
 if(feetY>floor+.6||vrVy<0){vrVy-=18*dt;rig.position.y+=vrVy*dt;if(rig.position.y-off<=floor){rig.position.y=floor+off;vrVy=0;thump(240,.12,.1);}}
 else rig.position.y=lerp(rig.position.y,floor+off,Math.min(1,dt*10));
}
const steady=new T.Matrix4(),ZERO=V();
function vrPose(){
 const slung=hands.some(h=>h.climb);   // the bow goes over your shoulder while you climb
 bow.scale.setScalar(1);bow.visible=!slung&&!replay.on;const hd=head(),eye=hd.getWorldPosition(V());
 if(!bowHand){const yaw=headYaw();bow.position.set(eye.x-Math.sin(yaw)*.44,eye.y-.31,eye.z-Math.cos(yaw)*.44);bow.rotation.set(0,yaw,0);}
 else{bowHand.hold.getWorldPosition(bow.position);bowHand.hold.getWorldQuaternion(bow.quaternion);}
 bowSide(bowHand?(bowHand.source?.handedness==='right'?-1:1):state.hand==='left'?-1:1);
 bow.updateMatrixWorld();
 const r=recoil();let nock=V(restX(),REST,KIT.nockZ-.05*r.snap),flex=-.04*r.snap,dir;
 if(charging&&drawHand&&bowHand){
  // The string hand is followed with a little smoothing, so jitter close to the face does not shake the aim.
  // The bow then turns to lie along the arrow, keeping only its lean from the wrist, so twisting the bow hand does not turn the shot.
  const hp=drawAt.lerp(drawHand.pinch.getWorldPosition(V()),1-Math.exp(-frameDt*28)),reach=hp.distanceTo(bow.position);
  if(BOW2){bowFull();bow2.peak=Math.max(bow2.peak,reach);charge=clamp((reach-BOW.rest)/(bow2.full-BOW.rest),0,1);}else charge=clamp((reach-.12)/.4,0,1);
  dir=aimVR();
  if(BOW2){const fw=V(0,0,-1).applyQuaternion(bow.quaternion);bow.quaternion.premultiply(fw.dot(dir)>-.999?new T.Quaternion().setFromUnitVectors(fw,dir):new T.Quaternion().setFromAxisAngle(V(0,1,0),Math.PI));bow.updateMatrixWorld();}   // angle-sim fix 2
  else{const lean=V(0,1,0).applyQuaternion(bow.quaternion);if(Math.abs(lean.dot(dir))<.95){bow.quaternion.setFromRotationMatrix(steady.lookAt(ZERO,dir,lean));bow.updateMatrixWorld();dir=aimVR();}}
  if(LAB){lab.drawNow=hp.distanceTo(bow.position);pushSample(lab.aims,[elapsed,dir.clone()]);while(lab.aims.length&&elapsed-lab.aims[0][0]>.3)lab.aims.shift();}
  nock=bow.worldToLocal(hp.clone());flex=.2*charge;
  if(BOW2){
   pushSample(bow2.buf,[elapsed,dir.clone(),charge,hp.clone().addScaledVector(dir,KIT.shaft)]);   // angle-sim fix 3: the start point toowhile(bow2.buf.length&&elapsed-bow2.buf[0][0]>.22)bow2.buf.shift();
   bowFeel(drawHand,charge>=BOW.fullAt);
  }else{
  const stepNow=Math.floor(charge*8);if(stepNow!==drawStep){drawStep=stepNow;buzz(drawHand,.15+.3*charge,14);}
  // a perfect release is one made soon after reaching full draw; a strong pulse marks the moment
  if(charge>=.95){if(!fullAt){fullAt=elapsed;buzz(drawHand,.9,30);buzz(bowHand,.5,30);}}else if(charge<.85)fullAt=0;}
 }else dir=V(0,0,-1).transformDirection(bow.matrixWorld);
 if(charging&&quickHand&&bowHand){
  // quick draw: the string comes back by itself while the trigger is held, the last of the pull slowest
  const u=Math.min(1,(elapsed-quickAt)/BOW.oneHand);charge=1-(1-u)*(1-u);nock=V(restX(),REST,KIT.nockZ+charge*KIT.pull);flex=.2*charge;
  if(BOW2)bowFeel(quickHand,u>=1);
  else{const stepNow=Math.floor(charge*8);if(stepNow!==drawStep){drawStep=stepNow;buzz(quickHand,.15+.3*charge,14);}
  if(u>=1&&!fullAt){fullAt=elapsed;buzz(quickHand,.9,30);if(bowHand!==quickHand)buzz(bowHand,.5,30);}}
 }
 if(BOW2&&charging&&fullAt&&elapsed-fullAt>2)nock.x+=Math.sin(elapsed*47)*.0015;   // looks only: the aim is already fixed
 setString(nock,flex);poseArrow(dir,!!bowHand&&!slung&&!replay.on);plaque.mesh.visible=true;plaque.set(vrStatus());
 const s=state.lesson<5?YARD:nearestBell(eye.x,eye.z);needle.visible=!!s&&!slung&&!range.on;   // the needle leads to the yard until training is done
 if(s){plaque.mesh.getWorldPosition(needle.position);needle.position.y+=.1;needle.rotation.set(0,Math.atan2(-(s.x-eye.x),-(s.z-eye.z)),0);}
}
function leaveVR(){
 const p=feet(V()),yaw=headYaw();bowHand=null;drawHand=null;quickHand=null;cancel();bow.visible=true;for(const h of hands)h.climb=null;plaque.mesh.visible=false;needle.visible=false;
 return()=>{rig.rotation.y=0;camera.position.set(0,1.65,0);place(p.x,p.z,yaw);look.pitch=0;};
}
async function initXR(){
 if(!navigator.xr)return;
 const supported=await navigator.xr.isSessionSupported('immersive-vr').catch(()=>false);
 if(!supported)return;$('vr').hidden=false;cloth.vrOk=true;clothRender();
 $('vr').onclick=async()=>{try{
  audioStart();const session=await navigator.xr.requestSession('immersive-vr',{optionalFeatures:['local-floor','bounded-floor','hand-tracking']});
  if(BOW2&&state.reach==='auto'){bow2.full=0;bow2.learned=[];bow2.up=0;bow2.down=0;}
  const floor=await session.requestReferenceSpace('local-floor').then(()=>true,()=>false);
  renderer.xr.setReferenceSpaceType(floor?'local-floor':'local');await renderer.xr.setSession(session);
  $('hud').style.display='none';$('start').hidden=true;playing=false;cancel();keys.clear();
  localEyeOffset=floor?0:1.6;rig.rotation.y=look.yaw;camera.position.set(0,0,0);camera.rotation.set(0,0,0);rig.position.y=groundAt(rig.position.x,rig.position.z)+localEyeOffset;
  if(range.on)say('Stage '+(range.stage+1)+'  ·  '+STAGES[range.stage].name,5);else say(state.lesson<5?'The training yard is close by  ·  follow the gold needle':'Seven bells sleep in the vale',6);vrVy=0;lastPanel=null;for(const h of hands)h.climb=null;
  if(VRMENU&&clothReturning())setTimeout(vrMenuOpen,600);   // once the headset has given its first pose
  session.addEventListener('end',()=>{vrMenuClose();const restore=leaveVR();restore();$('hud').style.display='';$('play').textContent='Return to the vale';$('start').hidden=false;save();},{once:true});
 }catch(e){$('start').hidden=false;say('VR could not start. '+e.message,5);}};
}

// ---- The cloth menu inside the headset (design/first-menu.md). Its own switch, off until it has been tried on a
// headset: "vrmenu" in src/config.json, or ?vrmenu=1. It needs the cloth menu ("menu") to be on as well.
//   A returning player who enters VR faces the cloth 2.4 m ahead, 2.0 m wide and 1.15 m high, centred just below the
//   eyes wherever they are (so it is lower for a seated player). A new player never sees it: they land on stage 1.
//   Chosen by pointing a controller at a button and pressing its trigger; arrows cannot be drawn while it is up.
const VRMENU=(QUERY.has('menu')?QUERY.get('menu')==='1':!!CONFIG.menu)&&(QUERY.has('vrmenu')?QUERY.get('vrmenu')==='1':!!CONFIG.vrmenu);
const vrMenu={open:false,face:'home',root:null,cv:null,ctx:null,tex:null,spots:[],hover:null,rays:[],W:1024,H:590,wide:2,tall:1.15,away:2.4};
function vrMenuBuild(){
 if(vrMenu.root)return;
 const m=vrMenu,cv=document.createElement('canvas');cv.width=m.W;cv.height=m.H;m.cv=cv;m.ctx=cv.getContext('2d');m.tex=new T.CanvasTexture(cv);if('colorSpace'in m.tex)m.tex.colorSpace=T.SRGBColorSpace;
 m.root=new T.Group();m.root.visible=false;scene.add(m.root);
 m.root.add(new T.Mesh(new T.PlaneGeometry(m.wide,m.tall),new T.MeshBasicMaterial({map:m.tex})));
 const back=new T.Mesh(new T.PlaneGeometry(m.wide,m.tall),new T.MeshBasicMaterial({color:'#e9d8ac'}));back.rotation.y=Math.PI;m.root.add(back);   // the cloth's plain back
 for(const s of[-1,1])stick(m.root,V(s*(m.wide/2+.09),-2.2,0),V(s*(m.wide/2+.09),m.tall/2+.22,0),.05,'#7a5a3c');
 stick(m.root,V(-m.wide/2-.2,m.tall/2+.1,0),V(m.wide/2+.2,m.tall/2+.1,0),.04,'#7a5a3c');
 for(const h of hands){const line=new T.Line(new T.BufferGeometry().setFromPoints([V(),V(0,0,-1)]),new T.LineBasicMaterial({color:'#fff4d6'}));line.visible=false;h.raySpace.add(line);m.rays.push(line);}
}
function vrMenuDraw(){
 const m=vrMenu,c=m.ctx,R=state.range,PLUM='#4A2943',RED='#b3202f',CREAM='#f6e6bd';m.spots=[];
 const text=(s,x,y,size,col=PLUM,bold=true,align='center')=>{c.font=(bold?'700 ':'400 ')+size+'px Georgia, serif';c.fillStyle=col;c.textAlign=align;c.textBaseline='middle';c.fillText(s,x,y);};
 const pennant=(x,y,w,h,fill,line)=>{const k=h*.38;c.beginPath();c.moveTo(x+k,y);c.lineTo(x+w-k,y);c.lineTo(x+w,y+h/2);c.lineTo(x+w-k,y+h);c.lineTo(x+k,y+h);c.lineTo(x,y+h/2);c.closePath();c.fillStyle=fill;c.fill();if(line){c.lineWidth=4;c.strokeStyle=line;c.stroke();}};
 const spot=(id,x,y,w,h,label,size,main)=>{const on=m.hover===id;pennant(x,y,w,h,main?(on?'#d43348':RED):(on?'#fff8e2':CREAM),main?null:PLUM);if(on){c.lineWidth=6;c.strokeStyle='#ffd86b';c.strokeRect(x-6,y-6,w+12,h+12);}text(label,x+w/2,y+h/2+2,size,main?'#fbefd0':PLUM);m.spots.push({id,x,y,w,h});};
 c.fillStyle=CREAM;c.fillRect(0,0,m.W,m.H);c.lineWidth=8;c.strokeStyle=RED;c.strokeRect(16,16,m.W-32,m.H-32);
 if(m.face==='home'){
  const i=clothStage(),stars=R.stars.reduce((a,b)=>a+(b||0),0);
  text(RELEASE?CONFIG.title:'The Seven Bells',m.W/2,92,76);text('★ '+stars+' of '+STAGES.length*3,m.W/2,162,40);
  spot('continue',292,206,440,110,'Continue',64,true);text('Stage '+(i+1)+'  ·  '+STAGES[i].name,m.W/2,350,36,PLUM,false);
  spot('stages',232,400,260,80,'Stages',48);spot('settings',532,400,260,80,'Settings',48);
 }else if(m.face==='stages'){
  spot('home',40,36,190,64,'◀ Back',40);text('Stages',m.W/2,68,52);
  const n=STAGES.length,rows=Math.ceil(n/3),h=Math.min(64,(m.H-150)/rows),w=306;
  STAGES.forEach((st,k)=>{const col=Math.floor(k/rows),x=40+col*(w+12),y=120+(k%rows)*h,shut=RELEASE&&k>R.open,id='stage'+k,on=m.hover===id,s=R.stars[k]||0;
   c.fillStyle=on?'#fff8e2':'#f1dfb2';c.fillRect(x,y,w,h-6);if(on){c.lineWidth=4;c.strokeStyle='#ffd86b';c.strokeRect(x,y,w,h-6);}
   c.globalAlpha=shut?.4:1;text((k+1)+'. '+st.name,x+10,y+(h-6)/2+1,Math.min(26,h*.45),PLUM,false,'left');text(shut?'':'★'.repeat(s),x+w-8,y+(h-6)/2+1,22,RED,true,'right');c.globalAlpha=1;
   if(!shut)m.spots.push({id,x,y,w,h:h-6});});
 }else{
  spot('home',40,36,190,64,'◀ Back',40);text('Settings',m.W/2,68,52);
  text('Bow hand',70,200,44,PLUM,true,'left');spot('handR',420,160,250,84,'Right',44,state.hand==='right');spot('handL',700,160,250,84,'Left',44,state.hand==='left');
  text('Draw mode',70,340,44,PLUM,true,'left');spot('drawTwo',420,300,250,84,'Two hands',40,state.draw==='two');spot('drawOne',700,300,250,84,'One hand',40,state.draw==='one');
  if(BOW2&&!BOW3){text('Draw length',70,450,40,PLUM,true,'left');spot('reachAuto',330,415,190,70,'Auto',34,state.reach==='auto');spot('reachShort',540,415,190,70,'Short',34,state.reach==='short');spot('reachLong',750,415,190,70,'Long',34,state.reach==='long');}
  else text('Grip swaps the bow hand  ·  right stick click swaps the draw',m.W/2,470,30,PLUM,false);
 }
 m.tex.needsUpdate=true;
}
function vrMenuOpen(){
 if(!VRMENU)return;vrMenuBuild();const m=vrMenu,p=head().getWorldPosition(V());
 let ux=YARD.ux,uz=YARD.uz;if(!range.on){const d=head().getWorldDirection(V());const l=hyp(d.x,d.z)||1;ux=d.x/l;uz=d.z/l;}
 m.root.position.set(p.x+ux*m.away,p.y-.1,p.z+uz*m.away);m.root.lookAt(p.x,m.root.position.y,p.z);m.root.updateMatrixWorld(true);
 m.open=true;m.face='home';m.hover=null;m.root.visible=true;cancel();vrMenuDraw();
}
function vrMenuClose(){const m=vrMenu;m.open=false;if(m.root)m.root.visible=false;for(const l of m.rays)l.visible=false;}
// where a hand's ray meets the cloth: the spot under it, or null
function vrMenuAim(h,k){
 const m=vrMenu,line=m.rays[k];if(!h.pose&&!fake.on){if(line)line.visible=false;return null;}
 h.raySpace.updateMatrixWorld(true);const o=m.root.worldToLocal(h.raySpace.getWorldPosition(V())),end=m.root.worldToLocal(h.raySpace.localToWorld(V(0,0,-1))),d=end.sub(o);
 if(d.z>=-1e-4||o.z<=0){if(line)line.visible=false;return null;}
 const t=-o.z/d.z,x=o.x+d.x*t,y=o.y+d.y*t;if(line){line.visible=true;line.scale.z=Math.min(t,6);}
 if(Math.abs(x)>m.wide/2||Math.abs(y)>m.tall/2)return null;
 const u=(x/m.wide+.5)*m.W,v=(.5-y/m.tall)*m.H;return m.spots.find(s=>u>=s.x&&u<=s.x+s.w&&v>=s.y&&v<=s.y+s.h)||null;
}
function vrMenuStep(){
 const m=vrMenu;if(!m.open)return;let over=null;hands.forEach((h,k)=>{if(h===bowHand&&hands.some(x=>x!==h&&x.pose))  {if(m.rays[k])m.rays[k].visible=false;return;}const s=vrMenuAim(h,k);if(s&&!over)over=s.id;});
 if(over!==m.hover){m.hover=over;vrMenuDraw();if(over)note(880,.05,'sine',.03);}
}
function vrMenuPress(h){
 const m=vrMenu,k=hands.indexOf(h),s=vrMenuAim(h,k);if(!s)return;const id=s.id;note(660,.12,'triangle',.06,0,990);buzz(h,.4,30);
 if(id==='continue'){vrMenuClose();say('Stage '+(range.stage+1)+'  ·  '+STAGES[range.stage].name,4);return;}
 if(id==='home'||id==='stages'||id==='settings'){m.face=id;m.hover=null;vrMenuDraw();return;}
 if(id==='handR'||id==='handL'){setHand(id==='handR'?'right':'left');vrMenuDraw();return;}
 if(id==='drawTwo'||id==='drawOne'){setDraw(id==='drawTwo'?'two':'one');vrMenuDraw();return;}
 if(id==='reachAuto'||id==='reachShort'||id==='reachLong'){setReach(id.slice(5).toLowerCase());vrMenuDraw();return;}
 if(id.startsWith('stage')){stageGo(+id.slice(5));vrMenuClose();say('Stage '+(range.stage+1)+'  ·  '+STAGES[range.stage].name,4);}
}

// ---------------------------------------------------------------- loop
function resize(){camera.aspect=cine.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();cine.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight,false);}
window.addEventListener('resize',resize);resize();
if(state.pos)place(state.pos[0],state.pos[1],state.pos[2]);else place(0,0,Math.atan2(-YARD.x,-YARD.z));   // a new game faces the training yard
refresh();initXR();setString(V(restX(),REST,KIT.nockZ));
const eyeNow=V(),feetNow=V();let last=null;
function tick(dt,frame){
 if(bow3wait&&elapsed-twang>=BOW.ready){const h=bow3wait.h;bow3wait=null;startDraw(h);}
 if(LAB&&!lab.started&&(playing||xrOn())){lab.started=true;labStart();}
 elapsed+=dt;frameDt=dt||.016;const vr=xrOn();plogStep(dt);
 if(vr)vrLocomotion(dt,frame);else if(playing)desktopMove(dt);
 feet(feetNow);const yaw=vr?headYaw():look.yaw;
 trainingStep(feetNow.x,feetNow.z,vr?rig.position.y-localEyeOffset:rig.position.y);rangeStep(dt);
 for(const t of targets){
  const age=elapsed-t.kick;if(age<0||age>4)continue;const wave=Math.exp(-2.4*age)*Math.sin(age*11);
  if(t.kind==='bell')t.root.rotation.z=wave*.3;else if(t.kind==='straw'||t.kind==='drill'||t.kind==='range')t.root.scale.setScalar((t.scale||1.2)*(1+wave*.05));
 }
 for(const l of lanterns)if(!l.hit){const a=l.phase+elapsed*l.speed;l.root.position.set(l.cx+Math.cos(a)*l.r,l.h+Math.sin(elapsed*.6+l.phase)*.8,l.cz+Math.sin(a)*l.r);}
 updateDeer(dt,feetNow.x,feetNow.z);updateGrass(feetNow.x,feetNow.z);
 scene.updateMatrixWorld();
 zoom+=(charge-zoom)*Math.min(1,dt*10);
 if(vr)vrPose();else desktopPose();if(vr)vrMenuStep();pealStep();watchStep(dt);oldWorldShow();
 bow.updateMatrixWorld();stepArrows(dt);stepBits(dt);
 $('ret').classList.toggle('hit',elapsed<hitFlash);$('ret').style.visibility=replay.on?'hidden':'';
 (vr?head():camera).getWorldPosition(eyeNow);updateSky(dt,eyeNow);stepPops(dt,replay.on&&!vr?cine.position:eyeNow);
 $('fill').classList.toggle('sweet',!vr&&charging&&drawHold===null&&elapsed-startTime>=BOW.oneHand&&elapsed-startTime<=BOW.oneHand+(BOW2?BOW.sweet:.45));
 if(!vr){const txt=charging?'Draw '+Math.round(charge*100)+'%'+(drawHold!==null?'  ·  held with the wheel':''):'';if($('pow').textContent!==txt)$('pow').textContent=txt;}
 if(windGain)windGain.gain.value=.03+.02*Math.sin(elapsed*.23)+clamp(eyeNow.y/60,0,1)*.05;
 if(!vr){
  $('fill').style.width=(100*charge)+'%';if(elapsed>messageEnd&&$('notice').textContent)$('notice').textContent='';
  updateCompass(feetNow.x,feetNow.z,yaw);mapClock-=dt;if(mapClock<=0){mapClock=mapOpen?.1:.25;drawMap(feetNow.x,feetNow.z,yaw);}
 }
 saveClock+=dt;if(saveClock>6&&(playing||vr)){saveClock=0;state.pos=[+feetNow.x.toFixed(1),+feetNow.z.toFixed(1),+yaw.toFixed(2)];save();}
}
renderer.setAnimationLoop((now,frame)=>{
 fpsStep(now);
 const dt=last===null?0:Math.min(.05,(now-last)/1000);last=now;
 tick(dt,frame);renderer.render(scene,replay.on&&!renderer.xr.isPresenting?cine:camera);
});
// the release title and wording, applied only in release mode so nothing is renamed for good until it is approved
if(RELEASE){
 document.title=CONFIG.title+(CONFIG.subtitle?' · '+CONFIG.subtitle:'');
 for(const q of['#top h1','#card h2'])document.querySelector(q).textContent=CONFIG.title;
 document.querySelector('#top .eyebrow').textContent=CONFIG.subtitle||'';document.querySelector('#card .eyebrow').textContent=(CONFIG.subtitle||'')+(CONFIG.world?'  ·  a tale of '+CONFIG.world:'');
 $('aboutRange').textContent=CONFIG.blurb;for(const e of document.querySelectorAll('.roam'))e.hidden=true;
}
// ---- The cloth menu (design/first-menu.md): the first thing a player meets. One switch: "menu" in src/config.json, or
// ?menu=1 / ?menu=0. With it off the old title card is used and nothing here runs. The old card stays in the page,
// hidden, and the cloth's buttons press its buttons, so everything the card did still works the same way.
//   home:     a new player sees the title, one red button and Settings; a returning one sees stars, Continue and Stages
//   stages:   the stages that are open, with their stars
//   settings: bow hand, draw mode, the controls, Start over (asks twice), and on test builds the playtest summary
const MENU=QUERY.has('menu')?QUERY.get('menu')==='1':!!CONFIG.menu;
const cloth={face:'home',sure:0,vrOk:false,quest:/OculusBrowser|Quest/i.test(navigator.userAgent)};
function clothReturning(){return state.range.stars.some(n=>n>0)||state.shots>0;}
function clothStage(){return clamp(range.on?range.stage:state.range.open,0,STAGES.length-1);}
function clothRender(face){
 if(!MENU)return;const el=$('cloth');if(!el)return;
 if(face)cloth.face=face;const R=state.range,esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
 const title=esc(RELEASE?CONFIG.title:'The Seven Bells'),sub=esc(RELEASE?CONFIG.subtitle||'':'Brackenford'),pick=(on,a,b)=>'<span class="pair"><button data-do="'+a[0]+'" class="'+(on?'on':'')+'">'+a[1]+'</button><button data-do="'+b[0]+'" class="'+(on?'':'on')+'">'+b[1]+'</button></span>';
 let h='';
 if(cloth.face==='home'){
  const back=clothReturning(),stars=R.stars.reduce((a,b)=>a+(b||0),0),i=clothStage();
  h='<h2 class="'+(back?'small':'')+'">'+title+'</h2>';
  if(back)h+='<p class="tally">★ '+stars+' of '+STAGES.length*3+'</p>';
  else h+=(sub?'<p class="sub">'+sub+'</p>':'')+'<p class="line">A fantasy archery game</p>';
  const vrFirst=cloth.vrOk&&cloth.quest,word=back?'Continue':'Begin';
  h+='<button class="main" data-do="'+(vrFirst?'vr':'play')+'">'+(vrFirst?'Enter VR':word)+'</button>';
  if(back)h+='<p class="where">Stage '+(i+1)+'  ·  '+esc(STAGES[i].name)+'</p>';
  if(WATCH)h+='<div class="row"><button class="plain" data-do="watch">Bell Watch'+(R.watchBest?'  ·  best '+R.watchBest:'')+'</button></div>';
  h+='<div class="row">'+(cloth.vrOk?'<button class="plain" data-do="'+(vrFirst?'play':'vr')+'">'+(vrFirst?'Play on screen':'Enter VR')+'</button>':'')+(back?'<button class="plain" data-do="stages">Stages</button>':'')+'</div>';
  h+='<button class="link" data-do="settings">Settings</button>';
 }else if(cloth.face==='stages'){
  h='<button class="link back" data-do="home">◀ Back</button><h3>Stages</h3><div class="list">';
  STAGES.forEach((st,i)=>{const n=R.stars[i]||0,shut=RELEASE&&i>R.open;h+='<button class="stage" data-stage="'+i+'"'+(shut?' disabled':'')+'><span>'+(i+1)+'.  '+esc(st.name)+'</span><span>'+(shut?'locked':'★'.repeat(n)+'☆'.repeat(3-n)+(n&&ribbonFor(st)?(R.ribbon&&R.ribbon[i]?' ◆':' ◇'):''))+'</span></button>';});
  h+='</div>';
 }else{
  h='<button class="link back" data-do="home">◀ Back</button><h3>Settings</h3>';
  h+='<p class="set"><span>Bow hand</span>'+pick(state.hand==='right',['handR','Right'],['handL','Left'])+'</p>';
  h+='<p class="set"><span>Draw mode</span>'+pick(state.draw==='two',['drawTwo','Two-handed'],['drawOne','Single-handed'])+'</p>';
  if(BOW2&&!BOW3)h+='<p class="set"><span>Draw length</span><span class="pair">'+['auto','short','long'].map(r=>'<button data-do="reach-'+r+'" class="'+(state.reach===r?'on':'')+'">'+{auto:'Auto',short:'Short 46 cm',long:'Long 64 cm'}[r]+'</button>').join('')+'</span><button class="plain" data-do="reach-reset">Reset</button></p>';
  h+='<h4>Controls</h4><ul><li>Hold the left mouse button to draw the bow; let go to loose.</li><li>Let go early, or roll the mouse wheel while drawing, for a softer shot.</li><li>After a stage: N next, R again, B back. Esc brings back this menu.</li><li>In VR: trigger draws and looses, grip swaps the bow hand, right stick click swaps the draw mode.</li></ul>';
  h+='<div class="row"><button class="plain" data-do="wipe">'+(cloth.sure>performance.now()?'Press again to erase all progress':'Start over')+'</button>'+(REPLAY?'<button class="plain" data-do="tally">Copy playtest summary</button>':'')+'</div>';
 }
 el.innerHTML=h;
}
if(MENU&&$('cloth')){
 document.body.classList.add('menu');$('frame').hidden=false;$('cloth').hidden=false;$('card').hidden=true;
 const press=id=>$(id).click();
 $('cloth').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||b.disabled)return;const d=b.dataset.do;
  if(b.dataset.stage!==undefined){stageGo(+b.dataset.stage);clothRender('home');press('play');return;}
  if(d==='watch'){watchStart();press('play');return;}
  if(d==='play'){press('play');return;}
  if(d==='vr'){press('vr');return;}
  if(d==='home'||d==='stages'||d==='settings'){cloth.sure=0;clothRender(d);return;}
  if(d==='handR'||d==='handL'||d==='drawTwo'||d==='drawOne'){press(d);clothRender();return;}
  if(d&&d.startsWith('reach-')){setReach(d==='reach-reset'?'auto':d.slice(6));clothRender();return;}
  if(d==='wipe'){if(cloth.sure>performance.now())press('wipe');else{cloth.sure=performance.now()+5000;clothRender();}return;}
  if(d==='tally'){press('tally');b.textContent='Copied';setTimeout(()=>clothRender(),1500);}
 });
 // whenever the menu comes back (Esc, leaving VR) it opens on its home face, and the game's own bars step aside
 new MutationObserver(()=>{const open=!$('start').hidden;document.body.classList.toggle('menu-open',open);if(open)clothRender('home');}).observe($('start'),{attributes:true,attributeFilter:['hidden']});
 document.body.classList.toggle('menu-open',!$('start').hidden);
}
flagDrills();setMode(state.mode);if(RELEASE&&!state.range.stars.some(n=>n>0))$('play').textContent='Begin';stageList();setHand(state.hand);setDraw(state.draw);clothRender('home');
window.vale={LOG,LOG_DRY,plog,plogEnd,plogRate,plogFlush,get elapsed(){return elapsed;},BOW3,KIT,HAP,graceAim,get bow3wait(){return bow3wait;},setReach,recentre,headYaw,YARD,rangeSigns,BOW2,BOW,bow2,arrowSpeed,bowFull,get charge(){return charge;},GREY,LAB,scene,PADS,lab,labStart,labText,padStep,PAD_MAP,PAD_NAMES,SHADOWS,GRADE,LOOK,sunDir,ram,RAM_ON,RAM_RULE,ramSet,ramStep,ramOff,ramPoseOf,ramColor,rangeTargets,WATCH_BELL,watchFoot,yardAt,WATCH,WATCH_RULE,watchStart,watchStep,PEAL,peal,pealCleared,pealHit,RIBBONS,RIBBON,ribbonFor,rangeNames,save,MENU,cloth,clothRender,VRMENU,vrMenu,vrMenuOpen,vrMenuClose,vrMenuStep,vrMenuPress,vrMenuAim,fpsStep,RELEASE,SHOW_FPS,CONFIG,ALL_STAGES,guide,guideText,fps,fault,perches,bushes,birdLift,stageGo,stageList,REPLAY,STAR_AT,tally,playtest,rangeInfo,NEW_HARE,HARE_MOVES,WORLD2,LANE,laneAt,ARROWS,ARROW_RULE,quiver,quiverPick,posePeek(sp){const r=sp.rear;shadePose(sp,0);sp.rear=r;shadePose(sp,0);},RIG,spirits,grassClumps,range,STAGES,setMode,setStage,rangeRounds,rangeSigns,pops,replay,cine,shot(){resize();renderer.render(scene,replay.on?cine:camera);return canvas.toDataURL("image/jpeg",.8);},YARD,drills,prog,panels,platforms,tower:()=>tower,wallTop:()=>wallTop,keys,lessonInfo,floorAt,get climb(){return climb;},set lesson(n){state.lesson=n;prog.count=0;prog.done.clear();prog.wall=false;flagDrills();},preview,bits,limbs,T,state,SITES,targets,lanterns,deer,hands,fake,rig,camera,bow,look,projectiles,groundAt,place,travel,loose,tick,begin,setMap,
 riser,gripSide,REST,setHand,setDraw,drawAt,get handSide(){return handSide;},get drawHold(){return drawHold;},get charging(){return charging;},get charge(){return charge;},get bowHand(){return bowHand;},get quickHand(){return quickHand;},get drawHand(){return drawHand;},get playing(){return playing;},
 aimAt(p){const eye=camera.getWorldPosition(V()),d=p.clone().sub(eye);look.yaw=Math.atan2(-d.x,-d.z);look.pitch=Math.atan2(d.y,hyp(d.x,d.z));}};
