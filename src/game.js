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
scene.fog=new T.FogExp2(0xb4cfd3,.0031);
const rig=new T.Group();scene.add(rig);rig.add(camera);camera.rotation.order='YXZ';camera.position.set(0,1.65,0);
const sun=new T.DirectionalLight(0xffe5bb,2.1), hemi=new T.HemisphereLight(0xfff1cc,0x8fa37c,1.5);scene.add(sun,hemi);
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
const WORLD2=!RELEASE&&QUERY.get('world')==='2';
const LANE={half:8,from:-3,to:76,creek:38,steps:[[43,.7],[53,1.4],[63,2.1],[72,2.8]],base:0};
const laneAt=(x,z)=>{const dx=x-YARD.x,dz=z-YARD.z;return[dx*YARD.ux+dz*YARD.uz,dx*YARD.rx+dz*YARD.rz];};   // [metres along the lane, metres to the archer's right]
// the whole footprint of the new range: lane and shoulders, the creek's band, and the footbridge
const inRange2=(x,z)=>{const[a,b]=laneAt(x,z);return(a>-12&&a<84&&Math.abs(b)<13)||(Math.abs(a-LANE.creek)<4.5&&Math.abs(b)<29)||(Math.abs(a-LANE.creek)<6&&Math.abs(b-13.5)<5);};
const inLane=(x,z)=>{const[a,b]=laneAt(x,z);return a>LANE.from&&a<LANE.to&&Math.abs(b)<LANE.half;};
const laneRise=a=>{let h=0;for(const[at,up]of LANE.steps)if(a>=at)h=up;return h;};
const yardBits=new T.Group();   // training-yard timber that stands in the lane; hidden while the new range is in use
const W=N+1, H=new Float32Array(W*W);
for(let j=0;j<W;j++)for(let i=0;i<W;i++)H[j*W+i]=rawHeight(-HALF+i*CELL,-HALF+j*CELL);
if(WORLD2){
 // level the ground under the lane and a little either side, wider where the creek crosses, easing back into the land around it
 LANE.base=rawHeight(YARD.x,YARD.z);
 for(let j=0;j<W;j++)for(let i=0;i<W;i++){
  const[a,b]=laneAt(-HALF+i*CELL,-HALF+j*CELL);if(a<-24||a>100||Math.abs(b)>40)continue;
  const flat=Math.abs(a-LANE.creek)<9?27:13,w=(1-smooth(Math.abs(b),flat,flat+9))*smooth(a,-20,-10)*(1-smooth(a,86,96));
  H[j*W+i]=lerp(H[j*W+i],LANE.base,w);
 }
}
function groundAt(x,z){
 const fx=clamp((x+HALF)/CELL,0,N-.0001),fz=clamp((z+HALF)/CELL,0,N-.0001),i=fx|0,j=fz|0,u=fx-i,v=fz-j,k=j*W+i;
 const a=H[k],b=H[k+1],c=H[k+W],d=H[k+W+1];
 const h=u+v<=1?a+(b-a)*u+(c-a)*v:d+(c-d)*(1-u)+(b-d)*(1-v);
 if(WORLD2){const[al,rt]=laneAt(x,z);if(al>=LANE.steps[0][0]&&al<LANE.to&&Math.abs(rt)<10.5)return LANE.base+laneRise(al);}   // on a terrace
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
 const cA=new T.Color('#8fa45c'),cB=new T.Color('#6b8c47'),cDry=new T.Color('#b3ad6a'),cSand=new T.Color('#d2c08a'),cRock=new T.Color('#8d8a80'),cSnow=new T.Color('#e9ece6'),cDirt=new T.Color('#b08f62'),cBed=new T.Color('#5d7168'),cWater=new T.Color('#4f8f9e'),c=new T.Color(),m=new T.Color();
 for(let j=0;j<W;j++)for(let i=0;i<W;i++){
  const k=j*W+i,x=-HALF+i*CELL,z=-HALF+j*CELL,h=H[k];
  const sl=hyp(H[j*W+Math.min(N,i+1)]-H[j*W+Math.max(0,i-1)],H[Math.min(N,j+1)*W+i]-H[Math.max(0,j-1)*W+i])/(2*CELL);
  c.copy(cA).lerp(cB,smooth(fbm(x/60+5,z/60+8,3),.35,.65)).lerp(cDry,smooth(fbm(x/25,z/25,2),.55,.8)*.6);
  if(h<1.2)c.lerp(cSand,1-smooth(h,.3,1.2));
  if(h<0)c.lerp(cBed,smooth(-h,0,3));
  c.lerp(cRock,smooth(sl,.55,.95));c.lerp(cSnow,smooth(h,44,58));
  if(h>.3){const pd=pathDist(x,z);if(pd<3.6){c.lerp(cDirt,1-smooth(pd,1.6,3.6));if(pd<2.8)pathMask[k]=1;}}
  pos.set([x,h,z],k*3);col.set([c.r,c.g,c.b],k*3);
  m.copy(c);if(h<0)m.lerp(cWater,.75);m.convertLinearToSRGB();
  const shade=clamp(1+(H[j*W+Math.min(N,i+1)]-H[Math.max(0,j-1)*W+i])*.035,.7,1.25);
  img.data.set([m.r*255*shade,m.g*255*shade,m.b*255*shade,255],k*4);
 }
 let q=0;for(let j=0;j<N;j++)for(let i=0;i<N;i++){const a=j*W+i,b=a+1,cc=a+W,d=cc+1;idx.set([a,cc,b,b,cc,d],q);q+=6;}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(pos,3));geo.setAttribute('color',new T.BufferAttribute(col,3));geo.setIndex(new T.BufferAttribute(idx,1));geo.computeVertexNormals();
 scene.add(new T.Mesh(geo,new T.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:1})));
 mapBase.getContext('2d').putImageData(img,0,0);
 const water=new T.Mesh(new T.PlaneGeometry(SIZE*2,SIZE*2),new T.MeshStandardMaterial({color:'#4f8f9e',transparent:true,opacity:.8,roughness:.3}));
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
 fragmentShader:'uniform vec3 top;uniform vec3 hor;varying float h;void main(){gl_FragColor=vec4(mix(hor,top,pow(clamp(h,0.,1.),.5)),1.);\n#include <colorspace_fragment>\n}'}));
sky.frustumCulled=false;scene.add(sky);
const sunDisc=new T.Mesh(new T.CircleGeometry(38,24),new T.MeshBasicMaterial({color:0xfff3cf,fog:false,depthWrite:false}));scene.add(sunDisc);
const clouds=[];
{
 const cm=new T.MeshBasicMaterial({color:0xffffff,fog:false,transparent:true,opacity:.86}),cg=new T.IcosahedronGeometry(1,1);
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
const TILE=72, tufts=[], grass=new T.InstancedMesh(new T.ConeGeometry(.06,.34,3).translate(0,.17,0),material('#71883f'),3600);
grass.frustumCulled=false;scene.add(grass);
for(let i=0;i<grass.count;i++)tufts.push([rng()*TILE,rng()*TILE,.6+rng()*1.1,rng()*6]);
let grassX=1e9,grassZ=1e9;
function updateGrass(px,pz){
 if(hyp(px-grassX,pz-grassZ)<3)return;grassX=px;grassZ=pz;
 for(let i=0;i<tufts.length;i++){
  const t=tufts[i],x=t[0]+TILE*Math.round((px-t[0])/TILE),z=t[1]+TILE*Math.round((pz-t[1])/TILE),g=groundAt(x,z);
  dummy.position.set(x,g,z);dummy.rotation.set(0,t[3],0);dummy.scale.setScalar(g<.5||onPath(x,z)||(WORLD2&&inRange2(x,z))?0:t[2]);dummy.updateMatrix();grass.setMatrixAt(i,dummy.matrix);
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
const state={bells:new Set(),marks:new Set(),lanterns:new Set(),shots:0,longest:0,pos:null,done:false,lesson:0,coins:0,hand:'right',draw:'two',mode:'range',range:{open:0,best:[],stars:[]}};
try{const s=JSON.parse(localStorage.getItem(SAVE)||'null');if(s){state.bells=new Set(s.bells);state.marks=new Set(s.marks);state.lanterns=new Set(s.lanterns);state.shots=s.shots|0;state.longest=s.longest|0;state.pos=s.pos;state.done=!!s.done;state.lesson=clamp(s.lesson|0,0,5);state.mode=s.mode==='roam'?'roam':'range';state.hand=s.hand==='left'?'left':'right';state.draw=s.draw==='one'?'one':'two';if(s.range)state.range={open:s.range.open|0,best:s.range.best||[],stars:s.range.stars||[]};
 state.coins=typeof s.coins==='number'?Math.max(0,s.coins|0):state.range.stars.reduce((a,b)=>a+(b||0)*25,0)+Math.round(state.range.best.reduce((a,b)=>a+(b||0),0)/20);}}catch{}
function save(){try{localStorage.setItem(SAVE,JSON.stringify({bells:[...state.bells],marks:[...state.marks],lanterns:[...state.lanterns],shots:state.shots,longest:state.longest,pos:state.pos,done:state.done,lesson:state.lesson,coins:state.coins,hand:state.hand,draw:state.draw,mode:state.mode,range:state.range}));}catch{}}

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
// ---- the new range's lane, creek, terraces, rail, stall, footbridge and blossom trees (see WORLD2 above)
if(WORLD2){
 const R=new T.Group();R.position.set(YARD.x,LANE.base,YARD.z);R.rotation.y=Math.atan2(YARD.ux,YARD.uz);scene.add(R);
 const P=(along,right,y=0)=>V(-right,y,along);   // a place given as metres along the lane, to the right, and up
 const LAWN='#99B44E',EDGE='#8DA748',FACE='#829B47',WATER='#5897BE',SAND='#B8A275',ROCK='#9a968c',BLOSSOM='#F299B5';   // ChatGPT's colours, set after it saw the first build
 // the lane: a lighter strip of mown grass from the line to the far end
 box(R,P((LANE.from+LANE.to)/2,0,.02),V(LANE.half*2,.04,LANE.to-LANE.from),LAWN);
 for(const s of[-1,1])for(let a=LANE.from,i=0;a<40;i++){const len=3+2.5*Math.abs(Math.sin(i*1.7+s)),wide=.7+.6*Math.abs(Math.sin(i*2.9+s*2));box(R,P(a+len/2,s*(LANE.half+wide/2),.015),V(wide,.03,len),EDGE);a+=len;}   // a broken shoulder about a metre wide, so the lawn does not end in a ruled line
 // the creek: a flat band of water with sandy banks and a few stones, crossing at 38 m
 box(R,P(LANE.creek,0,.05),V(54,.06,3),WATER);
 for(const s of[-1,1])for(let r=-27,i=0;r<27;i++){const len=1.5+2.5*Math.abs(Math.sin(i*2.3+s)),wide=.3+.3*Math.abs(Math.sin(i*1.3+s*3));if(i%4!==3)box(R,P(LANE.creek+s*(1.5+wide/2),r+len/2,.04),V(len,.05,wide),SAND);r+=len;}   // uneven patches of sand, 0.3 to 0.6 m wide, with gaps
 for(const[a,r,k]of[[36.4,-10.5,.5],[39.8,-13,.7],[36.2,10,.6],[39.9,12.2,.45],[36.5,-20,.8],[39.6,21,.7],[36.3,-25.5,.6],[39.7,25,.55]]){const m=mesh(R,new T.DodecahedronGeometry(k,0),ROCK,P(a,r,k*.4));m.rotation.set(a,r,0);m.scale.y=.7;}
 // the terraces: each a solid step across the lane, lighter on top and darker on its face
 let low=0;for(const[at,up]of LANE.steps){const len=LANE.to-at,tall=up-low;box(R,P(at+len/2,0,low+tall/2),V(21,tall,len),LAWN);box(R,P(at-.02,0,low+tall/2),V(21,tall,.06),FACE);low=up;}
 // the rail at the shooting line, 0.85 m high as a starting height
 for(const r of[-3,-1,1,3])stick(R,P(.9,r,-.3),P(.9,r,.95),.06,timber);
 for(const y of[.85,.45])stick(R,P(.9,-3,y),P(.9,3,y),.045,timber);
 // the stall, beside the line on the right (the climbing wall and tower already stand on the left)
 if(typeof PROPS!=='undefined'){const stall=PROPS.marketStall(T);stall.position.copy(P(-2.5,11.5));stall.rotation.y=-Math.PI/2-.25;R.add(stall);}
 // the footbridge over the creek, to the right of the lane and clear of it
 {const b=new T.Group();b.position.copy(P(LANE.creek,13.5));R.add(b);
  for(let i=-2;i<=2;i++){const p=box(b,V(0,.42-.07*i*i,i*.95),V(1.9,.1,1),'#b9824a');p.rotation.x=i*.14;}
  for(const s of[-1,1]){for(const z of[-2.1,0,2.1])stick(b,V(s*.9,.1,z),V(s*.9,z?1:1.25,z),.05,timber);stick(b,V(s*.9,.95,-2.1),V(s*.9,1.2,0),.04,timber);stick(b,V(s*.9,1.2,0),V(s*.9,.95,2.1),.04,timber);}}
 // two blossom trees, one each side in the middle distance, well clear of the lane and never behind a target
 for(const[a,r,s]of[[31,-17.5,1],[45,17,1.15]]){const t=new T.Group();t.position.copy(P(a,r));t.scale.setScalar(s);R.add(t);
  stick(t,V(0,-.3,0),V(.15,2.6,0),.2,'#7a5a3c');stick(t,V(.1,1.9,0),V(-.9,3.1,.2),.1,'#7a5a3c');stick(t,V(.1,2.1,0),V(.9,3.2,-.3),.1,'#7a5a3c');
  for(const[x,y,z,k]of[[0,3.9,0,1.5],[-1.2,3.4,.3,1.05],[1.2,3.5,-.4,1.1]])mesh(t,new T.IcosahedronGeometry(k,0),BLOSSOM,V(x,y,z));}
}
// the trainer's board beside the shooting line
// with the new layout the board is a cream cloth banner with a plum border and plum lettering (cloth is for what is read)
const BOARD=WORLD2?{cloth:'#f6e6bd',edge:'#4A2943',text:'#4A2943',mark:'#6D3362'}:{cloth:'#273c34',edge:'#bcaa7a',text:'#ffebbd',mark:'#f0c75a'};   // mark: the wind and best-score line (gold on the old board; plum on cloth, where gold is kept for rewards)
const board=(()=>{
 const c=document.createElement('canvas');c.width=1024;c.height=640;const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;
 const[bx,bz]=yardAt(11,WORLD2?12:6.5),g=groundAt(bx,bz),m=new T.Mesh(new T.PlaneGeometry(4.8,3),new T.MeshBasicMaterial({map:tex}));
 m.position.set(bx,g+2.6,bz);m.rotation.y=Math.atan2(YARD.x-bx,YARD.z-bz);scene.add(m);
 for(const k of[-1,1]){const px=bx+k*2.35*Math.cos(m.rotation.y),pz=bz-k*2.35*Math.sin(m.rotation.y);stick(scene,V(px,g-.3,pz),V(px,g+4.15,pz),.06,timber);}
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
const STAGES=RELEASE&&CONFIG.order.length?CONFIG.order.map(n=>ALL_STAGES[n-1]):ALL_STAGES;
const coins=text=>RELEASE?'':text;   // coins are earned but not shown until there is something to spend them on
const range={on:false,stage:0,phase:'idle',arrows:0,score:0,streak:0,best:0,hits:0,stars:0,newBest:false,earned:0,wind:0,endAt:0,t0:0,ideal:1,pending:null,last:''};
const rangeRounds=[],rangeSigns={};let rangeMeshes=[];
for(let k=0;k<3;k++){
 // a round on a single post that can lie back (pop-ups) and slide sideways
 const root=new T.Group(),tilt=new T.Group(),face=new T.Group();scene.add(root);root.add(tilt);tilt.add(face);root.visible=false;
 const item={kind:'range',root:face,base:root,tilt,kick:-10,meshes:[],scale:1.2,up:true};
 for(const[r,dz,c]of[[.68,0,'#bf9959'],[.50,.038,red],[.37,.072,cream],[.23,.11,red],[.10,.15,gold]]){const o=mesh(face,new T.CylinderGeometry(r,r,.045,28),c,V(0,0,dz));o.rotation.x=Math.PI/2;o.userData.target=item;item.meshes.push(o);}
 item.post=stick(tilt,V(0,0,-.06),V(0,1,-.06),.06,timber);
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
const sock=(()=>{const[x,z]=yardAt(5,WORLD2?-10.5:-4.6),g=groundAt(x,z),root=new T.Group();root.position.set(x,g,z);scene.add(root);stick(root,V(0,-.3,0),V(0,3.3,0),.05,timber);return pennant(root,0,3.25,'#e8743b');})();
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
 if(range.phase==='play'&&STAGES[range.stage].spirits&&spirits.every(sp=>sp.done||!sp.cfg)&&!range.endAt)range.endAt=elapsed+1.3;
}
function rangeTargets(){
 rangeMeshes=[];for(const r of rangeRounds)if(r.base.visible)rangeMeshes.push(...r.meshes);
 for(const sp of spirits)if(sp.live&&sp.base.visible){rangeMeshes.push(sp.hitMesh);if(sp.hitHead)rangeMeshes.push(sp.hitHead);}
 for(const id in rangeSigns)if(rangeSigns[id].base.visible)rangeMeshes.push(...rangeSigns[id].meshes);
}
function setStage(i){
 const st=STAGES[i];Object.assign(range,{gap:'',gain:0,stage:i,phase:'play',arrows:st.arrows,score:0,streak:0,best:0,hits:0,stars:0,newBest:false,t0:elapsed,endAt:0,pending:null,last:'',shot:null,lastShot:null,closest:null,replayed:false,skip:false,fired:0,guided:i===0&&!(state.range.stars[0]>0)});fps.low=0;
 quiver.kind='std';quiver.charges=ARROWS?ARROW_RULE.charges:0;tallyStart(st.name);
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
 q.ranged=true;q.perfect=perfect;q.path=[q.o.position.clone()];range.arrows--;range.fired++;
 q.kind='std';if(ARROWS&&quiver.kind!=='std'&&quiver.charges>0){q.kind=quiver.kind;if(--quiver.charges<=0)quiver.kind='std';}   // a special shot spends a charge as it leaves the string
 galeCue(q.o,q.kind==='gale');
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
 if(q.near&&(!range.closest||q.near.off<range.closest.off))range.closest={path:q.path,miss:true,...q.near};
 if(q.final&&q.near&&q.near.off<=4)range.lastShot={path:q.path,miss:true,...q.near};   // a final arrow that only just missed is still shown
 if(range.streak>1)note(196,.25,'triangle',.08,0,130);range.streak=0;spiritStartle(q.o.position);birdsHear(q);
 if(range.arrows<=0)range.endAt=Math.min(range.endAt||1e9,elapsed+.9);
}
function rangeHit(t,q){
 if(ARROWS&&q.ranged&&!q.done&&specialHit(t,q))return;
 const spirit=t.kind==='spirit';
 if(spirit){if(!t.live)return;spiritWake(t);}else{t.kick=elapsed;thump(500,.15,.25);note(124,.16,'triangle',.2,0,40);}
 if(!q.ranged||q.done)return;q.done=true;
 const at=q.o.position,local=t.root.worldToLocal(at.clone()),r=spirit?0:hyp(local.x,local.y),ring=Math.min(q.kind==='gale'?ARROW_RULE.galeCap:1e9,spirit?t.value:r<.1?100:r<.23?80:r<.37?60:r<.5?40:20),dist=Math.round(q.origin.distanceTo(at));
 range.streak++;range.hits++;range.best=Math.max(range.best,range.streak);
 const pts=Math.round((ring+dist)*Math.min(2,1+.1*(range.streak-1))*(q.perfect?1.25:1));range.score+=pts;
 q.path.push(at.clone());const shot={path:q.path,pts,ring:spirit?100:ring,spirit,target:t,base:t.base.position.clone(),off:r*t.scale};
 if(!range.closest||shot.off<range.closest.off)range.closest=shot;
 if(shot.ring===100&&(!range.shot||pts>range.shot.pts))range.shot=shot;   // the best bullseye, or the best waking, of the stage
 if(q.final)range.lastShot=shot;                                     // or the final arrow of the stage, wherever it hit
 // each hit in a streak plays the next note up
 const f=392*2**([0,2,4,7,9,12,14,16,19,21,24][Math.min(range.streak-1,10)]/12);note(f,.35,'sine',.13);note(f*2,.25,'sine',.05,.03);
 if(ring===100&&!spirit){burst(at,'#ffd86b',22,1.5,1.4);note(f*1.5,.5,'sine',.1,.08);}
 popup('+'+pts,at.clone().add(V(0,.5*t.scale,0)),ring===100||spirit?'#ffd86b':'#fff1c4');
 say((spirit?'Shade banished  ·  ':ring===100?'Bullseye  ·  ':'')+(q.perfect?'Perfect release  ·  ':'')+(range.streak>1?'Streak '+range.streak:dist+' m'),1.6);
 if(dist>state.longest)state.longest=dist;
 if(range.arrows<=0)range.endAt=Math.min(range.endAt||1e9,elapsed+.9);
}
function rangeResults(){
 const i=range.stage,frac=range.score/range.ideal,stars=frac>=STAR_AT[2]?3:frac>=STAR_AT[1]?2:frac>=STAR_AT[0]?1:0,R=state.range;
 const before=R.best[i]||0,need=stars<3?Math.max(1,Math.ceil(STAR_AT[stars]*range.ideal)-range.score):0;
 range.phase='results';range.stars=stars;range.newBest=range.score>before;
 range.gap=REPLAY&&need?need+(need===1?' point':' points')+' to '+'★'.repeat(stars+1):'';range.gain=REPLAY&&range.newBest&&before?range.score-before:0;
 tallyEnd(STAGES[i].name,stars,need>0&&need<=.1*range.ideal,elapsed-range.t0);
 range.earned=Math.round(range.score/20)+Math.max(0,stars-(R.stars[i]||0))*25;state.coins+=range.earned;
 if(range.newBest)R.best[i]=range.score;R.stars[i]=Math.max(R.stars[i]||0,stars);if(stars&&R.open<i+1)R.open=Math.min(STAGES.length-1,i+1);
 // one replay at most. Up close: the best bullseye, or failing that the final arrow, hit or near miss.
 // On a long lane (a mark at 40 m or more): always the one arrow that came closest, hit or miss.
 range.shot=Math.max(...STAGES[i].marks.map(m=>m[0]))>=40?range.closest:range.shot||range.lastShot;
 save();if(range.shot)startReplay();else showResults();
}
function showResults(){
 const i=range.stage,stars=range.stars,R=state.range;range.phase='results';stageList();
 rangeSigns.again.base.visible=true;rangeSigns.next.base.visible=i<STAGES.length-1&&R.open>i;rangeSigns.back.base.visible=i>0;rangeTargets();
 if(stars)[523,659,784,1047].slice(0,stars+1).forEach((f,k)=>note(f,.45,'sine',.1,k*.13));else note(196,.5,'triangle',.1,0,147);
 say((stars?'Stage clear  ·  '+'★'.repeat(stars)+'☆'.repeat(3-stars)+(range.gap?'  ·  '+range.gap:''):'Not enough  ·  '+(range.gap?range.gap+'  ·  ':'')+'shoot AGAIN')+coins(range.earned?'  ·  +'+range.earned+' coins':''),5);
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
// in a headset the view cannot be swapped, so the player is set down beside the mark behind a short fade
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
 const i=range.stage,st=STAGES[i],R=state.range,w=Math.round(range.wind),wind=w?'Wind '+Math.abs(w)+(w>0?'  →':'  ←'):'Still air';
 if(range.phase==='results')return{title:'Stage '+(i+1)+'  ·  '+'★'.repeat(range.stars)+'☆'.repeat(3-range.stars),
  text:'Score '+range.score+(range.newBest?'  ·  new best'+(range.gain?'  +'+range.gain:''):'  ·  best '+(R.best[i]||0))+'.  '+(range.gap?range.gap+'.  ':'')+(st.spirits?'Shades banished '+range.hits+' of '+st.spirits.length:'Hits '+range.hits+' of '+st.arrows)+', longest streak '+range.best+'.'+coins('  +'+range.earned+' coins.')+'  Shoot a sign to go on.',
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
 spiritStep(dt);
 guide.set(guideText());
 if(range.phase==='play'&&range.endAt&&elapsed>=range.endAt)rangeResults();
 const info=rangeInfo(),key=info.title+info.text+info.mark;
 if(key!==range.last){range.last=key;board.set(key,info);$('status').textContent=info.title+'\n'+info.text.replace(/      /g,'  ·  ')+'\n'+info.mark.replace(/      /g,'  ·  ');}
}
function setMode(m){
 if(RELEASE)m='range';
 state.mode=m;range.on=m==='range';
 for(const id in drills)drills[id].base.visible=!range.on;yardBits.visible=!(WORLD2&&range.on);if(WORLD2)for(const t of targets){if(t.beacon)t.beacon.visible=!range.on&&!t.hit;if(t.kind==='lantern')t.root.visible=!range.on&&!t.hit;if(t.kind==='straw')t.root.parent.visible=!range.on;}   // on the new range the bells' beams, the lanterns and the roaming straw rounds are hidden while shooting
 for(let k=projectiles.length-1;k>=0;k--)recycle(k);
 if(range.on){place(YARD.x,YARD.z,Math.atan2(-YARD.ux,-YARD.uz));look.pitch=0;if(xrOn())rig.rotation.y=look.yaw;setStage(clamp(state.range.open,0,STAGES.length-1));}
 else{if(replay.on)endReplay();for(const sp of spirits){sp.base.visible=false;sp.live=false;}for(const g of[...grassClumps,...perches,...bushes])g.visible=false;for(const r of rangeRounds)r.base.visible=false;for(const id in rangeSigns)rangeSigns[id].base.visible=false;rangeMeshes=[];range.phase='idle';if(replay.arrow)replay.arrow.visible=false;}
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
 STAGES.forEach((st,i)=>{const n=R.stars[i]||0;sel.options[i].value=i;sel.options[i].disabled=RELEASE&&i>R.open;sel.options[i].textContent=(i+1)+'.  '+st.name+(st.spirits?'  (shades)':'')+(n?'   '+'★'.repeat(n)+'☆'.repeat(3-n):'')+(R.best[i]?'   best '+R.best[i]:'');});
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
const REST=.045, riser=new T.Group();bow.add(riser);let handSide=1;
const restX=()=>-handSide*.035;
stick(riser,V(0,-.21,0),V(0,.21,0),.024,'#513c2b');
// The grip is handed: a leather wrap where the hand goes, swelling toward the palm, and a small rest on the arrow's side
// for the shaft to lie on. Built for a right-handed archer and mirrored for a left-handed one; the bow itself stays straight.
const gripSide=new T.Group();bow.add(gripSide);
stick(gripSide,V(0,-.085,0),V(0,.03,0),.029,'#2e2219',9);                       // leather wrap
mesh(gripSide,new T.SphereGeometry(.03,9,7),'#2e2219',V(.012,-.03,.012)).scale.set(1,1.7,1);   // swell that fills the palm, on the side away from the arrow
box(gripSide,V(-.04,.028,0),V(.028,.01,.03),'#c08d51');                        // arrow rest
box(gripSide,V(-.03,.018,0),V(.012,.014,.03),'#2e2219');                       // its bracket
for(const s of[-1,1]){
 const limb=new T.Group();limb.position.set(0,s*.21,0);bow.add(limb);limbs.push(limb);
 stick(limb,V(),V(0,s*.21,.06),.018,'#c08d51');stick(limb,V(0,s*.21,.06),V(0,s*.39,.15),.018,'#c08d51');
}
const stringGeo=new T.BufferGeometry();stringGeo.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(9),3));
const string=new T.Line(stringGeo,new T.LineBasicMaterial({color:0xf2deb4}));string.frustumCulled=false;bow.add(string);
const nockNow=V(restX(),REST,.14);
// The limbs bend back with the draw, and the string runs between their tips through the nock.
function setString(p,flex=0){
 limbs.forEach((l,i)=>{const s=i?1:-1,t=s*flex;l.rotation.x=t;ends[i].set(0,s*.21+s*.39*Math.cos(t)-.15*Math.sin(t),s*.39*Math.sin(t)+.15*Math.cos(t));});
 nockNow.copy(p);const a=stringGeo.attributes.position;[ends[0],p,ends[1]].forEach((v,i)=>a.setXYZ(i,v.x,v.y,v.z));a.needsUpdate=true;
}
const streakGeo=(()=>{
 const g=new T.BufferGeometry(),w=.022,pos=[],uv=[];
 for(const[x,y]of[[w,0],[0,w]]){pos.push(-x,-y,0, x,y,0, -x,-y,1, x,y,1);uv.push(0,0, 1,0, 0,1, 1,1);}
 g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex([0,1,2,2,1,3,4,5,6,6,5,7]);return g;
})();
const streakMat=(()=>{
 const c=document.createElement('canvas');c.width=4;c.height=64;const g=c.getContext('2d'),fade=g.createLinearGradient(0,64,0,0);
 fade.addColorStop(0,'rgba(255,250,232,.9)');fade.addColorStop(1,'rgba(255,250,232,0)');g.fillStyle=fade;g.fillRect(0,0,4,64);
 return new T.MeshBasicMaterial({map:new T.CanvasTexture(c),transparent:true,depthWrite:false,side:T.DoubleSide});
})();
function arrow(){
 const g=new T.Group(),body=new T.Group();g.add(body);
 stick(body,V(0,0,.62),V(),.009,'#67492f',6);
 const tip=mesh(body,new T.ConeGeometry(.03,.088,4),'#9ea9a4',V(0,0,-.022));tip.rotation.x=-Math.PI/2;
 for(let i=0;i<3;i++){const f=box(body,V(),V(.05,.009,.1),'#f2ead8');f.rotation.z=i*Math.PI*2/3;f.position.set(.018*Math.cos(f.rotation.z),.018*Math.sin(f.rotation.z),.57);}
 const streak=mesh(g,streakGeo,streakMat,V(0,0,.62));streak.visible=false;streak.frustumCulled=false;streak.renderOrder=3;
 g.userData={body,streak};return g;
}
const preview=arrow();scene.add(preview);preview.visible=false;const pool=[],projectiles=[];
const ray=new T.Raycaster(), GRAV=7, FWD=V(0,0,-1), tmpDir=V();
let charging=false,charge=0,startTime=0,twang=-9,twangPower=0,zoom=0,hitFlash=0,drawStep=0;
// After a release: kick is the slow recoil of the bow, snap the fast ringing of the string.
function recoil(){
 const t=elapsed-twang;if(t>1.5)return{t,kick:0,snap:0};
 return{t,kick:twangPower*Math.exp(-7*t)*Math.sin(13*t),snap:twangPower*Math.exp(-11*t)*Math.sin(62*t)};
}
// The nocked arrow sits with its tail on the string; a fresh one comes up shortly after a shot.
function poseArrow(dir,show){
 const t=elapsed-twang,size=bow.scale.x;bow.updateMatrixWorld();
 preview.scale.setScalar(size);preview.position.copy(nockNow).applyMatrix4(bow.matrixWorld).addScaledVector(dir,.62*size);preview.quaternion.setFromUnitVectors(FWD,dir);
 preview.visible=show&&(charging||t>.3);
 if(!charging&&t>.3&&t<.55)preview.position.y-=((.55-t)/.25)**2*.2*size;
}
function buzz(h,strength,ms){try{h?.source?.gamepad?.hapticActuators?.[0]?.pulse(strength,ms);}catch{}}
function cancel(){charging=false;charge=0;$('ret').classList.remove('draw');$('fill').style.width='0';}
function recycle(i){const q=projectiles[i];q.o.visible=false;pool.push(q.o);projectiles.splice(i,1);}
function loose(origin,dir,power,perfect=false){
 if(power<.1||(range.on&&(range.phase==='replay'||(range.phase==='play'&&range.arrows<=0)))){cancel();return;}
 if(projectiles.length>48)recycle(0);
 const o=pool.pop()||arrow();scene.add(o);o.visible=true;o.position.copy(origin);o.quaternion.setFromUnitVectors(FWD,dir);
 o.userData.body.rotation.set(0,0,0);o.userData.streak.visible=true;o.userData.streak.scale.z=.001;
 projectiles.push({o,origin:origin.clone(),velocity:dir.clone().multiplyScalar(24+power*38),life:0,stuck:false,power,roll:Math.random()*6,stuckAt:0,jolt:0,spent:false,flat:false});
 rangeLoosed(projectiles[projectiles.length-1],perfect);
 state.shots++;twang=elapsed;twangPower=power;
 note(210,.1,'triangle',.09,0,85);note(98,.24,'sawtooth',.03*power,0,72);thump(900,.12,.12);thump(2600,.3,.05*power);
 buzz(bowHand,.4+.6*power,90);buzz(drawHand,.5,40);cancel();
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
 q.jolt=clamp(q.velocity.length()/55,.3,1);q.stuck=true;q.stuckAt=elapsed;
 const u=q.o.userData;u.streak.visible=false;if(u.gale)u.gale.visible=false;u.body.rotation.set(0,0,q.roll);if(deep)q.o.position.addScaledVector(dir,deep);
}
function stepArrows(dt){
 for(let i=projectiles.length-1;i>=0;i--){
  const q=projectiles[i],u=q.o.userData;q.life+=dt;
  if(q.life>(q.stuck?50:14)){recycle(i);continue;}
  if(q.stuck){const t=elapsed-q.stuckAt;if(!q.flat&&t<1.2)u.body.rotation.x=q.jolt*.15*Math.exp(-6*t)*Math.sin(52*t);continue;}
  q.velocity.y-=GRAV*dt;
  if(q.windy){const push=range.wind*1.4*dt*(q.kind==='gale'?ARROW_RULE.galeWind:1);q.velocity.x+=YARD.rx*push;q.velocity.z+=YARD.rz*push;}   // a crosswind pushes the arrow sideways all the way down the lane
  const speed=q.velocity.length(),dir=tmpDir.copy(q.velocity).divideScalar(speed),distance=speed*dt,p=q.o.position;
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
   const w=q.power*.08*Math.exp(-4.5*q.life);q.roll+=dt*(8+speed*.2);
   u.body.rotation.set(w*.5*Math.sin(29*q.life),w*Math.sin(36*q.life),q.roll);u.streak.scale.z=clamp(speed*.04,.2,2.4)*Math.min(1,q.life/.1);
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
 if(charging){if(drawHold!==null)charge=drawHold;else{const u=Math.min(1,(elapsed-startTime)/.85);charge=1-(1-u)*(1-u);}}
 const r=recoil(),fov=68-7*zoom+r.kick*2.5;
 if(Math.abs(fov-camera.fov)>.01){camera.fov=fov;camera.updateProjectionMatrix();}
 camera.rotation.set(look.pitch+r.kick*.012,look.yaw,0);camera.updateMatrixWorld();
 const q=camera.quaternion,eye=camera.getWorldPosition(V());
 const tired=charging&&charge>=1?Math.min(1,(elapsed-startTime-.85)/2)*.0022:0;
 const side=state.hand==='left'?-1:1;bowSide(side);   // a left-handed archer holds the bow on the right of the view
 bow.scale.setScalar(.73);bow.visible=!climb&&!replay.on;
 bow.position.copy(eye).add(V(side*(-.26+.07*zoom)+Math.sin(elapsed*31)*tired,-.28+.05*zoom+Math.sin(elapsed*43)*tired,-.63-r.kick*.05).applyQuaternion(q));
 bow.quaternion.copy(q).multiply(bowTurn.setFromEuler(bowEuler.set(-r.kick*.3,0,side*(-.3+.2*zoom))));
 setString(V(restX(),REST,.14+charge*.33-.05*r.snap),.2*charge-.04*r.snap);
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
window.addEventListener('mouseup',e=>{if(e.button!==0||!charging||xrOn())return;desktopPose();const held=elapsed-startTime;loose(preview.position,aimDesktop(),charge,drawHold===null&&held>=.85&&held<=1.3);});
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
 if(range.on){const i=rangeInfo();return range.phase==='results'?'Score '+range.score+'  '+'★'.repeat(range.stars)+'☆'.repeat(3-range.stars)+(range.gap?'\n'+range.gap:range.gain?'\nnew best  +'+range.gain:'')+coins('\n+'+range.earned+' coins  ·  '+state.coins)+'\nShoot a sign':'Arrows '+range.arrows+'   Streak '+range.streak+'\nScore '+range.score+quiverText()+'\n'+(SHOW_FPS?fps.now+' fps  low '+fps.low:i.wind);}
 if(state.lesson<5&&hyp(rig.position.x-YARD.x,rig.position.z-YARD.z)<80){const i=lessonInfo();return i.title.split('  ·  ')[1]+'\n'+(i.mark||'See the board');}
 if(state.lesson<5&&state.bells.size===0)return'Training yard\nfollow the gold needle';
 if(state.done)return'The vale is awake\n'+counts().split('\n').slice(1).join('\n');
 return counts();
}
function takeBow(h){
 if(!h.pose||h===drawHand)return;
 if(h!==bowHand&&h.hold.getWorldPosition(V()).distanceTo(bow.position)<.42){bowHand=h;drawHand=null;cancel();audioStart();thump(600,.08,.1);}
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
 if(vrMenu.open)return;   // no arrows while the cloth menu is up
 if(replay.on){range.skip=true;return;}
 if(!h.pose||!bowHand||!bowHand.pose||charging||hands.some(x=>x.climb))return;
 const atString=h!==bowHand&&h.pinch.getWorldPosition(V()).distanceTo(bow.localToWorld(V(restX(),REST,.14)))<.33;
 if(state.draw==='one'&&!h.source?.hand){quickHand=h;quickAt=elapsed;}
 else if(atString){drawHand=h;h.pinch.getWorldPosition(drawAt);}
 else{if(!h.source?.hand)say(h===bowHand?'Use the trigger on your other hand, at the string':'Bring this hand to the string first',2.2);return;}
 charging=true;drawStep=0;fullAt=0;note(64,.7,'sawtooth',.012,0,118);
}
function endDraw(h){
 if(h===quickHand){
  quickHand=null;
  if(charging&&bowHand?.pose){vrPose();const held=elapsed-quickAt;loose(preview.position,V(0,0,-1).transformDirection(bow.matrixWorld),charge,held>=.85&&held<=1.3);}else cancel();
  return;
 }
 if(h!==drawHand)return;
 if(charging&&h.pose&&bowHand?.pose){vrPose();loose(preview.position,aimVR(),charge,!!fullAt&&charge>=.95&&elapsed-fullAt<=.9);}else cancel();drawHand=null;
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
function aimVR(){return bow.localToWorld(V(restX(),REST,0)).sub(drawAt).normalize();}   // the arrow runs from the string hand past the side of the grip
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
  const ax=gp.axes,sx=ax.length>=4?ax[2]:ax[0]||0,sy=ax.length>=4?ax[3]:ax[1]||0,click=!!gp.buttons[3]?.pressed;
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
   if(Math.abs(sx)>.65&&!h.turned){
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
 const r=recoil();let nock=V(restX(),REST,.14-.05*r.snap),flex=-.04*r.snap,dir;
 if(charging&&drawHand&&bowHand){
  // The string hand is followed with a little smoothing, so jitter close to the face does not shake the aim.
  // The bow then turns to lie along the arrow, keeping only its lean from the wrist, so twisting the bow hand does not turn the shot.
  const hp=drawAt.lerp(drawHand.pinch.getWorldPosition(V()),1-Math.exp(-frameDt*28));charge=clamp((hp.distanceTo(bow.position)-.12)/.4,0,1);
  dir=aimVR();
  const lean=V(0,1,0).applyQuaternion(bow.quaternion);if(Math.abs(lean.dot(dir))<.95){bow.quaternion.setFromRotationMatrix(steady.lookAt(ZERO,dir,lean));bow.updateMatrixWorld();dir=aimVR();}
  nock=bow.worldToLocal(hp.clone());flex=.2*charge;
  const stepNow=Math.floor(charge*8);if(stepNow!==drawStep){drawStep=stepNow;buzz(drawHand,.15+.3*charge,14);}
  // a perfect release is one made soon after reaching full draw; a strong pulse marks the moment
  if(charge>=.95){if(!fullAt){fullAt=elapsed;buzz(drawHand,.9,30);buzz(bowHand,.5,30);}}else if(charge<.85)fullAt=0;
 }else dir=V(0,0,-1).transformDirection(bow.matrixWorld);
 if(charging&&quickHand&&bowHand){
  // quick draw: the string comes back by itself while the trigger is held, the last of the pull slowest
  const u=Math.min(1,(elapsed-quickAt)/.85);charge=1-(1-u)*(1-u);nock=V(restX(),REST,.14+charge*.33);flex=.2*charge;
  const stepNow=Math.floor(charge*8);if(stepNow!==drawStep){drawStep=stepNow;buzz(quickHand,.15+.3*charge,14);}
  if(u>=1&&!fullAt){fullAt=elapsed;buzz(quickHand,.9,30);if(bowHand!==quickHand)buzz(bowHand,.5,30);}
 }
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
  text('Grip swaps the bow hand  ·  right stick click swaps the draw',m.W/2,470,30,PLUM,false);
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
 if(id.startsWith('stage')){stageGo(+id.slice(5));vrMenuClose();say('Stage '+(range.stage+1)+'  ·  '+STAGES[range.stage].name,4);}
}

// ---------------------------------------------------------------- loop
function resize(){camera.aspect=cine.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();cine.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight,false);}
window.addEventListener('resize',resize);resize();
if(state.pos)place(state.pos[0],state.pos[1],state.pos[2]);else place(0,0,Math.atan2(-YARD.x,-YARD.z));   // a new game faces the training yard
refresh();initXR();setString(V(restX(),REST,.14));
const eyeNow=V(),feetNow=V();let last=null;
function tick(dt,frame){
 elapsed+=dt;frameDt=dt||.016;const vr=xrOn();
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
 if(vr)vrPose();else desktopPose();if(vr)vrMenuStep();
 bow.updateMatrixWorld();stepArrows(dt);stepBits(dt);
 $('ret').classList.toggle('hit',elapsed<hitFlash);$('ret').style.visibility=replay.on?'hidden':'';
 (vr?head():camera).getWorldPosition(eyeNow);updateSky(dt,eyeNow);stepPops(dt,replay.on&&!vr?cine.position:eyeNow);
 $('fill').classList.toggle('sweet',!vr&&charging&&drawHold===null&&elapsed-startTime>=.85&&elapsed-startTime<=1.3);
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
  h+='<div class="row">'+(cloth.vrOk?'<button class="plain" data-do="'+(vrFirst?'play':'vr')+'">'+(vrFirst?'Play on screen':'Enter VR')+'</button>':'')+(back?'<button class="plain" data-do="stages">Stages</button>':'')+'</div>';
  h+='<button class="link" data-do="settings">Settings</button>';
 }else if(cloth.face==='stages'){
  h='<button class="link back" data-do="home">◀ Back</button><h3>Stages</h3><div class="list">';
  STAGES.forEach((st,i)=>{const n=R.stars[i]||0,shut=RELEASE&&i>R.open;h+='<button class="stage" data-stage="'+i+'"'+(shut?' disabled':'')+'><span>'+(i+1)+'.  '+esc(st.name)+'</span><span>'+(shut?'locked':'★'.repeat(n)+'☆'.repeat(3-n))+'</span></button>';});
  h+='</div>';
 }else{
  h='<button class="link back" data-do="home">◀ Back</button><h3>Settings</h3>';
  h+='<p class="set"><span>Bow hand</span>'+pick(state.hand==='right',['handR','Right'],['handL','Left'])+'</p>';
  h+='<p class="set"><span>Draw mode</span>'+pick(state.draw==='two',['drawTwo','Two-handed'],['drawOne','Single-handed'])+'</p>';
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
  if(d==='play'){press('play');return;}
  if(d==='vr'){press('vr');return;}
  if(d==='home'||d==='stages'||d==='settings'){cloth.sure=0;clothRender(d);return;}
  if(d==='handR'||d==='handL'||d==='drawTwo'||d==='drawOne'){press(d);clothRender();return;}
  if(d==='wipe'){if(cloth.sure>performance.now())press('wipe');else{cloth.sure=performance.now()+5000;clothRender();}return;}
  if(d==='tally'){press('tally');b.textContent='Copied';setTimeout(()=>clothRender(),1500);}
 });
 // whenever the menu comes back (Esc, leaving VR) it opens on its home face, and the game's own bars step aside
 new MutationObserver(()=>{const open=!$('start').hidden;document.body.classList.toggle('menu-open',open);if(open)clothRender('home');}).observe($('start'),{attributes:true,attributeFilter:['hidden']});
 document.body.classList.toggle('menu-open',!$('start').hidden);
}
flagDrills();setMode(state.mode);if(RELEASE&&!state.range.stars.some(n=>n>0))$('play').textContent='Begin';stageList();setHand(state.hand);setDraw(state.draw);clothRender('home');
window.vale={MENU,cloth,clothRender,VRMENU,vrMenu,vrMenuOpen,vrMenuClose,vrMenuStep,vrMenuPress,vrMenuAim,fpsStep,RELEASE,SHOW_FPS,CONFIG,ALL_STAGES,guide,guideText,fps,fault,perches,bushes,birdLift,stageGo,stageList,REPLAY,STAR_AT,tally,playtest,rangeInfo,NEW_HARE,HARE_MOVES,WORLD2,LANE,laneAt,ARROWS,ARROW_RULE,quiver,quiverPick,posePeek(sp){const r=sp.rear;shadePose(sp,0);sp.rear=r;shadePose(sp,0);},RIG,spirits,grassClumps,range,STAGES,setMode,setStage,rangeRounds,rangeSigns,pops,replay,cine,shot(){resize();renderer.render(scene,replay.on?cine:camera);return canvas.toDataURL("image/jpeg",.8);},YARD,drills,prog,panels,platforms,tower:()=>tower,wallTop:()=>wallTop,keys,lessonInfo,floorAt,get climb(){return climb;},set lesson(n){state.lesson=n;prog.count=0;prog.done.clear();prog.wall=false;flagDrills();},preview,bits,limbs,T,state,SITES,targets,lanterns,deer,hands,fake,rig,camera,bow,look,projectiles,groundAt,place,travel,loose,tick,begin,setMap,
 riser,gripSide,REST,setHand,setDraw,drawAt,get handSide(){return handSide;},get drawHold(){return drawHold;},get charging(){return charging;},get charge(){return charge;},get bowHand(){return bowHand;},get quickHand(){return quickHand;},get drawHand(){return drawHand;},get playing(){return playing;},
 aimAt(p){const eye=camera.getWorldPosition(V()),d=p.clone().sub(eye);look.yaw=Math.atan2(-d.x,-d.z);look.pitch=Math.atan2(d.y,hyp(d.x,d.z));}};
