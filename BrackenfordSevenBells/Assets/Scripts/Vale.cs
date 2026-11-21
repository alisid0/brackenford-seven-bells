using System;
using System.Collections.Generic;
using UnityEngine;

namespace Brackenford
{
    public sealed class Site { public string id,name; public float x,z,tone,y; public bool tower; }
    public struct Round { public float x,z,r,top,ar; }
    public sealed class LanternSpec { public float cx,cz,r,h,speed,phase; }
    public sealed class DeerSpec { public float x,z,timer,heading; public bool dark; }
    public sealed class CloudSpec { public Vector3 position; public Vector3[] offsets=new Vector3[4],scales=new Vector3[4]; }

    // The vale itself: the height field, paths, trees, rocks and where everything stands.
    // It is generated with the same noise, random sequence and order as the browser build, so the two worlds match.
    // The generator works in the browser's axes (north is -z); Unity positions use north = +z, so z is negated on the way out.
    public sealed class Vale
    {
        public const float Size=840,Half=420,Edge=372,Wade=-1.05f,Tile=72;
        public const int N=240,W=N+1,TuftCount=3600;
        const double Cell=3.5;
        public readonly Site[] Sites={
            new Site{id="hamlet",name="Hamlet bell",x=14,z=26,tone=523},
            new Site{id="isle",name="Lake isle bell",x=-140,z=120,tone=587},
            new Site{id="tor",name="Tor bell",x=170,z=190,tone=659},
            new Site{id="deepwood",name="Deepwood bell",x=195,z=-125,tone=784},
            new Site{id="keep",name="Old keep bell",x=-225,z=-140,tone=880,tower=true},
            new Site{id="windgap",name="Windgap bell",x=20,z=305,tone=988},
            new Site{id="meadow",name="Southmeadow bell",x=-55,z=-245,tone=1175}};
        public readonly List<Vector2> Straw=new List<Vector2>();
        public readonly List<float> StrawTurn=new List<float>();
        public readonly List<LanternSpec> Lanterns=new List<LanternSpec>();
        public readonly List<DeerSpec> Deer=new List<DeerSpec>();
        public readonly List<CloudSpec> Clouds=new List<CloudSpec>();
        public readonly float[] Tufts=new float[TuftCount*4];
        public Texture2D Map;
        readonly float[] heights=new float[W*W];
        readonly bool[] pathMask=new bool[W*W];
        readonly double[][] paths;
        readonly Dictionary<int,List<Round>> grid=new Dictionary<int,List<Round>>();

        // ---- the same generators as the browser build
        int seed=2071;
        double Next()
        {
            unchecked{
                seed+=0x6D2B79F5;int t=(seed^(int)((uint)seed>>15))*(1|seed);
                t=(t+(t^(int)((uint)t>>7))*(61|t))^t;
                return (uint)(t^(int)((uint)t>>14))/4294967296.0;
            }
        }
        static double Hash(int ix,int iz)
        {
            unchecked{
                int h=(ix*374761393)^(iz*668265263);h=(h^(int)((uint)h>>13))*1274126177;
                return (uint)(h^(int)((uint)h>>16))/4294967296.0;
            }
        }
        static double Noise(double x,double z)
        {
            int ix=(int)Math.Floor(x),iz=(int)Math.Floor(z);double fx=x-ix,fz=z-iz,u=fx*fx*(3-2*fx),v=fz*fz*(3-2*fz);
            double a=Hash(ix,iz),b=Hash(ix+1,iz),c=Hash(ix,iz+1),d=Hash(ix+1,iz+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;
        }
        static double Fbm(double x,double z,int octaves)
        {
            double s=0,a=.5,f=1;for(int i=0;i<octaves;i++){s+=a*Noise(x*f,z*f);a*=.5;f*=2.03;}return s;
        }
        static double Gauss(double x,double z,double cx,double cz,double r)=>Math.Exp(-((x-cx)*(x-cx)+(z-cz)*(z-cz))/(r*r));
        static double Smooth(double x,double min,double max){if(x<=min)return 0;if(x>=max)return 1;x=(x-min)/(max-min);return x*x*(3-2*x);}
        static double Mix(double a,double b,double t)=>a+(b-a)*t;
        static double Hyp(double a,double b)=>Math.Sqrt(a*a+b*b);
        static double Clamp(double v,double a,double b)=>v<a?a:v>b?b:v;
        double RawHeight(double x,double z)
        {
            double h=6+(Fbm(x/170+7.3,z/170+2.1,5)-.5)*34+(Fbm(x/38+40,z/38+11,3)-.5)*5;
            h+=46*Gauss(x,z,170,-190,85);
            h+=14*Gauss(x,z,-225,140,60);
            h+=20*Gauss(x,z,20,-310,70);
            h=Mix(h,-7,Smooth(Gauss(x,z,-140,-120,75),.25,.75));
            h+=12*Gauss(x,z,-140,-120,18);
            h=Mix(h,4.5,Smooth(Gauss(x,z,0,0,45),.3,.8));
            foreach(var s in Sites)if(s.id!="isle")h=Mix(h,Math.Max(h,3.5),Smooth(Gauss(x,z,s.x,-s.z,26),.3,.8));
            return h+Smooth(Hyp(x,z),330,420)*70;
        }
        // Heights in the generator's axes.
        double Ground(double x,double z)
        {
            double fx=Clamp((x+Half)/Cell,0,N-.0001),fz=Clamp((z+Half)/Cell,0,N-.0001);int i=(int)fx,j=(int)fz;double u=fx-i,v=fz-j;int k=j*W+i;
            double a=heights[k],b=heights[k+1],c=heights[k+W],d=heights[k+W+1];
            return u+v<=1?a+(b-a)*u+(c-a)*v:d+(c-d)*(1-u)+(b-d)*(1-v);
        }
        double Slope(double x,double z)=>Hyp(Ground(x+1.5,z)-Ground(x-1.5,z),Ground(x,z+1.5)-Ground(x,z-1.5))/3;
        double PathDistance(double x,double z)
        {
            double best=1e18;
            foreach(var p in paths)for(int i=2;i<p.Length;i+=2){
                double ax=p[i-2],az=p[i-1],bx=p[i]-ax,bz=p[i+1]-az,t=Clamp(((x-ax)*bx+(z-az)*bz)/(bx*bx+bz*bz),0,1);
                double dx=x-ax-bx*t,dz=z-az-bz*t,d=dx*dx+dz*dz;if(d<best)best=d;
            }
            return Math.Sqrt(best);
        }
        bool Masked(double x,double z)=>pathMask[(int)Math.Round(Clamp((z+Half)/Cell,0,N))*W+(int)Math.Round(Clamp((x+Half)/Cell,0,N))];
        bool NearSite(double x,double z,double d){foreach(var s in Sites)if(Hyp(x-s.x,z+s.z)<d)return true;return false;}

        // ---- what the game asks (Unity axes)
        public float GroundAt(float x,float z)=>(float)Ground(x,-z);
        public bool OnPath(float x,float z)=>Masked(x,-z);
        public void AddCollider(float x,float z,float r,float top,float ar=-1)
        {
            int k=(Mathf.FloorToInt(x/8)+128)*512+Mathf.FloorToInt(z/8)+128;
            if(!grid.TryGetValue(k,out var list)){list=new List<Round>();grid.Add(k,list);}
            list.Add(new Round{x=x,z=z,r=r,top=top,ar=ar<0?r:ar});
        }
        public void Near(float x,float z,List<Round> into)
        {
            into.Clear();int cx=Mathf.FloorToInt(x/8)+128,cz=Mathf.FloorToInt(z/8)+128;
            for(int a=-1;a<=1;a++)for(int b=-1;b<=1;b++)if(grid.TryGetValue((cx+a)*512+cz+b,out var list))into.AddRange(list);
        }
        readonly List<Round> scratch=new List<Round>();
        public Vector2 TryMove(float x,float z)
        {
            float d=Mathf.Sqrt(x*x+z*z);if(d>Edge){x*=Edge/d;z*=Edge/d;}
            Near(x,z,scratch);
            foreach(var c in scratch){
                float ox=x-c.x,oz=z-c.z,dd=Mathf.Sqrt(ox*ox+oz*oz),min=c.r+.35f;
                if(dd<min&&dd>1e-4f){x=c.x+ox/dd*min;z=c.z+oz/dd*min;}
            }
            return new Vector2(x,z);
        }

        static Color Rgb(string hex){ColorUtility.TryParseHtmlString("#"+hex,out var c);return c;}
        static Vector3 U(double x,double y,double z)=>new Vector3((float)x,(float)y,(float)-z);

        public Vale(Transform root)
        {
            for(int j=0;j<W;j++)for(int i=0;i<W;i++)heights[j*W+i]=(float)RawHeight(-Half+i*Cell,-Half+j*Cell);
            foreach(var s in Sites)s.y=GroundAt(s.x,s.z);
            paths=new double[Sites.Length][];
            for(int k=0;k<Sites.Length;k++){
                double sx=Sites[k].x,sz=-Sites[k].z,len=Hyp(sx,sz),px=-sz/len,pz=sx/len;const int n=16;
                var pts=new double[(n+1)*2];
                for(int i=0;i<=n;i++){double t=i/(double)n,w=Math.Sin(t*Math.PI)*Math.Sin(t*5+k*2.1)*len*.07;pts[i*2]=sx*t+px*w;pts[i*2+1]=sz*t+pz*w;}
                paths[k]=pts;
            }
            BuildGround(root);
            for(int i=0;i<16;i++){
                var cloud=new CloudSpec{position=U((Next()-.5)*1700,170+Next()*110,(Next()-.5)*1700)};
                for(int k=0;k<4;k++){
                    cloud.offsets[k]=U((Next()-.5)*60,(Next()-.5)*6,(Next()-.5)*30);
                    cloud.scales[k]=new Vector3((float)(26+Next()*26),(float)(7+Next()*6),(float)(18+Next()*16));
                }
                Clouds.Add(cloud);
            }
            BuildWoods(root);
            for(int i=0;i<TuftCount;i++){
                Tufts[i*4]=(float)(Next()*Tile);Tufts[i*4+1]=(float)(Next()*Tile);Tufts[i*4+2]=(float)(.6+Next()*1.1);Tufts[i*4+3]=(float)(Next()*6);
            }
            PlaceThings();
        }

        void BuildGround(Transform root)
        {
            Color cA=Rgb("8fa45c"),cB=Rgb("6b8c47"),cDry=Rgb("b3ad6a"),cSand=Rgb("d2c08a"),cRock=Rgb("8d8a80"),cSnow=Rgb("e9ece6"),cDirt=Rgb("b08f62"),cBed=Rgb("5d7168"),cWater=Rgb("4f8f9e");
            var tint=new Color[W*W];var pixels=new Color32[W*W];
            for(int j=0;j<W;j++)for(int i=0;i<W;i++){
                int k=j*W+i;double x=-Half+i*Cell,z=-Half+j*Cell,h=heights[k];
                double sl=Hyp(heights[j*W+Math.Min(N,i+1)]-heights[j*W+Math.Max(0,i-1)],heights[Math.Min(N,j+1)*W+i]-heights[Math.Max(0,j-1)*W+i])/(2*Cell);
                var c=Color.Lerp(cA,cB,(float)Smooth(Fbm(x/60+5,z/60+8,3),.35,.65));
                c=Color.Lerp(c,cDry,(float)(Smooth(Fbm(x/25,z/25,2),.55,.8)*.6));
                if(h<1.2)c=Color.Lerp(c,cSand,(float)(1-Smooth(h,.3,1.2)));
                if(h<0)c=Color.Lerp(c,cBed,(float)Smooth(-h,0,3));
                c=Color.Lerp(c,cRock,(float)Smooth(sl,.55,.95));c=Color.Lerp(c,cSnow,(float)Smooth(h,44,58));
                if(h>.3){double pd=PathDistance(x,z);if(pd<3.6){c=Color.Lerp(c,cDirt,(float)(1-Smooth(pd,1.6,3.6)));if(pd<2.8)pathMask[k]=true;}}
                c.a=1;tint[k]=Paint.Fix(c);
                var m=h<0?Color.Lerp(c,cWater,.75f):c;
                float shade=(float)Clamp(1+(heights[j*W+Math.Min(N,i+1)]-heights[Math.Max(0,j-1)*W+i])*.035,.7,1.25);
                pixels[(N-j)*W+i]=new Color(Mathf.Clamp01(m.r*shade),Mathf.Clamp01(m.g*shade),Mathf.Clamp01(m.b*shade),1);
            }
            Map=new Texture2D(W,W,TextureFormat.RGBA32,false){wrapMode=TextureWrapMode.Clamp,filterMode=FilterMode.Bilinear};
            Map.SetPixels32(pixels);Map.Apply();
            const int chunk=60;
            for(int cj=0;cj<N;cj+=chunk)for(int ci=0;ci<N;ci+=chunk){
                var b=new Builder();
                for(int j=cj;j<cj+chunk;j++)for(int i=ci;i<ci+chunk;i++){
                    int k=j*W+i;
                    Vector3 p0=Corner(i,j),p1=Corner(i+1,j),p2=Corner(i,j+1),p3=Corner(i+1,j+1);
                    Flat(b,p0,p2,p1,tint[k],tint[k+W],tint[k+1]);Flat(b,p1,p2,p3,tint[k+1],tint[k+W],tint[k+W+1]);
                }
                b.ToObject("Ground",root,Paint.Lit);
            }
            var water=new Builder();Vector3 w0=new Vector3(-Size,0,-Size),w1=new Vector3(Size,0,-Size),w2=new Vector3(Size,0,Size),w3=new Vector3(-Size,0,Size);
            water.Tri(w0,w1,w2,Color.white,Vector3.up);water.Tri(w0,w2,w3,Color.white,Vector3.up);
            var wc=Rgb("4f8f9e");wc.a=.8f;water.ToObject("Water",root,Paint.Glow(wc,1));
        }
        Vector3 Corner(int i,int j)=>new Vector3((float)(-Half+i*Cell),heights[j*W+i],(float)(Half-j*Cell));
        // One ground triangle with its own colour at each corner, facing up.
        static void Flat(Builder b,Vector3 p,Vector3 q,Vector3 r,Color cp,Color cq,Color cr)
        {
            b.Tri(p,q,r,Blend(cp,cq,cr),Vector3.up);
        }
        static Color Blend(Color a,Color b,Color c)=>new Color((a.r+b.r+c.r)/3,(a.g+b.g+c.g)/3,(a.b+b.b+c.b)/3,1);

        void BuildWoods(Transform root)
        {
            var parts=new Builder[16];for(int i=0;i<16;i++)parts[i]=new Builder();
            Builder At(double x,double z)=>parts[Mathf.Clamp((int)((z+Half)/210),0,3)*4+Mathf.Clamp((int)((x+Half)/210),0,3)];
            for(int n=0;n<5600;n++){
                double x=(Next()-.5)*800,z=(Next()-.5)*800;if(Hyp(x,z)>396)continue;
                double g=Ground(x,z);if(g<1.2||g>40||Hyp(x,z)<31||Slope(x,z)>.7)continue;
                if(NearSite(x,z,11)||PathDistance(x,z)<4.5)continue;
                double dens=Smooth(Fbm(x/110+3.7,z/110+9.2,3),.4,.62)*.85+.05+.7*Gauss(x,z,195,125,90);
                if(Next()>dens)continue;
                float s=(float)(.8+Next()*.9);bool pine=Next()<Smooth(g,8,22)*.6+.3;float r=(float)(Next()*6.28),v=(float)Next(),sh=.82f+v*.36f;
                var b=At(x,z);Vector3 p=U(x,g,z);
                if(pine){
                    b.Tube(p+Vector3.down*.3f,p+Vector3.up*(2.6f*s-.3f),.22f*s,.154f*s,6,Paint.Shade("6b4a33",sh),false,false);
                    b.Tube(p+Vector3.up*1.5f*s,p+Vector3.up*5.7f*s,1.75f*s,0,7,Paint.Shade("3f6b45",sh));
                    b.Tube(p+Vector3.up*3.9f*s,p+Vector3.up*7.2f*s,1.2f*s,0,7,Paint.Shade("4a7a4c",sh));
                    AddCollider(p.x,p.z,.3f*s,p.y+6.5f*s,.45f*s);
                }else{
                    string leaf=v>.86f?"c9953f":v>.72f?"9aa648":"6e9a4a";var turn=Quaternion.Euler(0,r*Mathf.Rad2Deg,0);
                    b.Tube(p+Vector3.down*.3f,p+Vector3.up*(3.1f*s-.3f),.27f*s,.19f*s,6,Paint.Shade("7a5a3c",sh),false,false);
                    b.Blob(p+Vector3.up*4*s,new Vector3(2.2f*s,1.9f*s,2.2f*s),turn,Paint.Shade(leaf,sh));
                    b.Blob(p+new Vector3(Mathf.Cos(r)*1.1f*s,5.2f*s,-Mathf.Sin(r)*1.1f*s),new Vector3(1.4f*s,1.25f*s,1.4f*s),turn,Paint.Shade(leaf,sh*1.08f));
                    AddCollider(p.x,p.z,.34f*s,p.y+3*s,.4f*s);
                }
            }
            for(int i=0;i<280;i++){
                double x,z,g;int tries=0;
                do{x=(Next()-.5)*780;z=(Next()-.5)*780;g=Ground(x,z);tries++;}while((g<.4||Hyp(x,z)<26||Masked(x,z)||NearSite(x,z,9))&&tries<40);
                float s=(float)(.4+Next()*Next()*2.6),sx=s*(float)(1+Next()*.5),ry=(float)(Next()*6),shade=(float)(.8+Next()*.35);
                Vector3 p=U(x,g+s*.2,z);
                At(x,z).Blob(p,new Vector3(sx,s*.75f,s),Quaternion.Euler(0,ry*Mathf.Rad2Deg,0),Paint.Shade("8f8c83",shade));
                if(s>1)AddCollider(p.x,p.z,s*.95f,(float)g+s*.9f);
            }
            foreach(var b in parts)if(b.Count>0)b.ToObject("Woods",root,Paint.Lit);
        }

        void PlaceThings()
        {
            var spots=new List<double[]>{new double[]{-8,-21},new double[]{-15,-33},new double[]{-5,-47}};
            for(int n=0;n<6000&&spots.Count<24;n++){
                double x=(Next()-.5)*700,z=(Next()-.5)*700;
                if(Hyp(x,z)>345||Hyp(x,z)<60||Ground(x,z)<1.5||Slope(x,z)>.3||!Spaced(spots,x,z,62)||NearSite(x,z,24)||PathDistance(x,z)<6)continue;
                spots.Add(new[]{x,z});
            }
            for(int i=0;i<spots.Count;i++){Straw.Add(new Vector2((float)spots[i][0],(float)-spots[i][1]));StrawTurn.Add(i<3?0:(float)(Next()-.5));}
            spots=new List<double[]>();
            for(int n=0;n<4000&&spots.Count<10;n++){
                double x=(Next()-.5)*640,z=(Next()-.5)*640;
                if(Hyp(x,z)>320||Hyp(x,z)<55||Ground(x,z)<1||!Spaced(spots,x,z,85))continue;spots.Add(new[]{x,z});
            }
            foreach(var p in spots){
                var l=new LanternSpec{cx=(float)p[0],cz=(float)-p[1]};
                l.r=(float)(5+Next()*9);l.h=(float)(Ground(p[0],p[1])+8+Next()*9);
                double sign=Next()<.5?-1:1;l.speed=(float)(sign*(.9+Next()*1.3)/l.r);l.phase=(float)(Next()*6);
                Lanterns.Add(l);
            }
            spots=new List<double[]>();
            for(int n=0;n<4000&&spots.Count<14;n++){
                double x=(Next()-.5)*640,z=(Next()-.5)*640;
                if(Hyp(x,z)>320||Hyp(x,z)<50||Ground(x,z)<1.5||!Spaced(spots,x,z,45))continue;spots.Add(new[]{x,z});
            }
            foreach(var p in spots){
                var d=new DeerSpec{x=(float)p[0],z=(float)-p[1]};d.dark=Next()>=.5;d.timer=(float)(Next()*8);d.heading=(float)(Next()*6.28);Deer.Add(d);
            }
        }
        static bool Spaced(List<double[]> list,double x,double z,double d){foreach(var p in list)if(Hyp(p[0]-x,p[1]-z)<=d)return false;return true;}
    }
}
