using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.InputSystem.Controls;
using UnityEngine.InputSystem.XR;
using UnityEngine.XR;
using UnityEngine.XR.Hands;
using Controller=UnityEngine.InputSystem.XR.XRController;

namespace Brackenford
{
    public sealed class SevenBells : MonoBehaviour
    {
        static Vector3 P(float x,float y,float z) => new Vector3(x,y,z);
        const int Bell=0,StrawRound=1,Lantern=2;
        const string SaveKey="brackenford-seven-bells-v1";
        sealed class Mark
        {
            public int kind,index; public string name; public Transform root; public bool scored; public float struck=-10f;
            public Site site; public Renderer flag; public GameObject beacon; public LanternSpec orbit; public float x,z;
        }
        sealed class Flight { public Transform arrow,body,streak; public Vector3 velocity,origin; public float age,power,roll,stoppedAt,jolt; public bool stopped,spent,flat; }
        sealed class Chip { public Transform t; public Renderer r; public Vector3 v; public float life,span,size; }
        sealed class Animal { public Transform root,neck; public Transform[] legs; public int mode; public float timer,heading,phase; }
        sealed class Chime { public float time,volume; public AudioClip clip; }
        [Serializable] sealed class Progress
        {
            public List<string> bells=new List<string>(); public List<int> marks=new List<int>(),lanterns=new List<int>();
            public int shots,longest; public float x,z,yaw; public bool placed,done;
        }

        Vale vale; Progress progress=new Progress();
        readonly List<Mark> marks=new List<Mark>();
        readonly List<Mark> lanterns=new List<Mark>();
        readonly List<Animal> herd=new List<Animal>();
        readonly List<Flight> flights=new List<Flight>();
        readonly Stack<Transform> spare=new Stack<Transform>();
        readonly List<Chime> chimes=new List<Chime>();
        readonly List<Round> nearby=new List<Round>();
        readonly List<Chip> chips=new List<Chip>();
        readonly Dictionary<string,Material> chipPaint=new Dictionary<string,Material>();
        readonly Transform[] limbs=new Transform[2];
        Mesh streakMesh,chipMesh; Material streakPaint; AudioClip whoosh,creak;
        float loosedAt=-9,loosedPower,zoom,hitFlash; int drawStep;
        Transform rig,bow,upper,lower,loaded,needle,sunDisc,skyDome; Camera eye; Light sun; TextMesh plaque;
        Mesh arrowMesh,skyMesh,grassMesh; Vector3[] skyPoints,grassPoints; Color[] skyColors;
        readonly List<Transform> clouds=new List<Transform>();
        AudioSource audioSource,wind; AudioClip pluck,thud,pop,step,ground,splash,chime; AudioClip[] bellTones;
        int strawTotal,strawFound,lanternsFound;
        float power,started,yaw,pitch,fall,stride,saveClock,dayTime=.24f,noticeEnd,grassX=1e9f,grassZ=1e9f;
        string notice="";
        bool charging,playing,mapOpen,airborne,leftBow=true,held,running,turned,xr,lastXR,floor=true;
        Controller stringController;
        // A tracked bare hand: hold is where a bow sits in it, pinch is where it takes the string.
        sealed class Palm { public bool tracked,fist,nip,grab,rose,fell,point; public Vector3 hold,pinch,pointDir; public Quaternion turn; public float pointFor; public GameObject root; public Transform[] dots; }
        readonly Palm[] palms={new Palm(),new Palm()}; readonly List<XRHandSubsystem> handSystems=new List<XRHandSubsystem>(); Palm stringPalm; bool bare;
        readonly List<XRInputSubsystem> inputs=new List<XRInputSubsystem>();
        float nextOriginCheck;

        // ------------------------------------------------------------ setup
        void Start()
        {
            try{var saved=PlayerPrefs.GetString(SaveKey,"");if(saved.Length>0)progress=JsonUtility.FromJson<Progress>(saved)??new Progress();}catch(Exception){progress=new Progress();}
            vale=new Vale(transform);
            RenderSettings.ambientMode=UnityEngine.Rendering.AmbientMode.Flat;RenderSettings.fog=true;
            RenderSettings.fogMode=FogMode.ExponentialSquared;RenderSettings.fogDensity=.0031f;
            sun=Group("Sun",transform,Vector3.zero).AddComponent<Light>();sun.type=LightType.Directional;sun.shadows=LightShadows.None;
            rig=Group("Player",transform,Vector3.zero).transform;
            eye=Group("Player eyes",rig,Vector3.up*1.65f).AddComponent<Camera>();eye.tag="MainCamera";
            eye.clearFlags=CameraClearFlags.SolidColor;eye.nearClipPlane=.05f;eye.farClipPlane=1600;eye.fieldOfView=68;eye.gameObject.AddComponent<AudioListener>();
            BuildSound();BuildSky();BuildHamlet();BuildBells();BuildStraw();BuildLanterns();BuildHerd();BuildBow();BuildGrass();
            if(progress.placed)Place(progress.x,progress.z,progress.yaw);else Place(0,0,0);
            Application.onBeforeRender+=UpdateHead;
        }
        void OnDestroy(){Application.onBeforeRender-=UpdateHead;}
        void OnApplicationFocus(bool focus){if(!focus)CancelDraw();}
        void OnApplicationQuit(){Save();}
        static GameObject Group(string name,Transform parent,Vector3 pos)
        {
            var obj=new GameObject(name);obj.transform.SetParent(parent,false);obj.transform.localPosition=pos;return obj;
        }
        void Save()
        {
            Vector3 p=Feet();progress.placed=true;progress.x=p.x;progress.z=p.z;progress.yaw=xr?HeadYaw():yaw;
            PlayerPrefs.SetString(SaveKey,JsonUtility.ToJson(progress));PlayerPrefs.Save();
        }

        // ------------------------------------------------------------ sound
        static AudioClip Tone(string name,float frequency,float duration,float decay,float second=1.51f)
        {
            const int rate=22050;var samples=new float[Mathf.CeilToInt(rate*duration)];
            for(int i=0;i<samples.Length;i++){
                float t=i/(float)rate;
                samples[i]=Mathf.Min(1,t*160)*Mathf.Exp(-t*decay)*(.43f*Mathf.Sin(2*Mathf.PI*frequency*t)+.17f*Mathf.Sin(2*Mathf.PI*frequency*second*t)+.08f*Mathf.Sin(2*Mathf.PI*frequency*2.27f*t));
            }
            var clip=AudioClip.Create(name,samples.Length,1,rate,false);clip.SetData(samples,0);return clip;
        }
        static AudioClip Hiss(string name,float duration,float decay,float softness,bool loop=false)
        {
            const int rate=22050;var samples=new float[Mathf.CeilToInt(rate*duration)];var random=new System.Random(7);float low=0;
            for(int i=0;i<samples.Length;i++){
                low+=((float)random.NextDouble()*2-1-low)*softness;
                samples[i]=low*(loop?1:Mathf.Exp(-i/(float)rate*decay))*2.2f;
            }
            if(loop){int blend=rate/4;for(int i=0;i<blend;i++){float t=i/(float)blend;samples[samples.Length-blend+i]=Mathf.Lerp(samples[samples.Length-blend+i],samples[i],t);}}
            var clip=AudioClip.Create(name,samples.Length,1,rate,false);clip.SetData(samples,0);return clip;
        }
        void BuildSound()
        {
            audioSource=gameObject.AddComponent<AudioSource>();audioSource.playOnAwake=false;
            wind=gameObject.AddComponent<AudioSource>();wind.clip=Hiss("Wind",4,0,.03f,true);wind.loop=true;wind.volume=.1f;wind.Play();
            pluck=Tone("String",195,.12f,14);thud=Tone("Straw",112,.18f,20);pop=Tone("Lantern",990,.3f,9,2);chime=Tone("Travel",740,.5f,6);
            whoosh=Hiss("Whoosh",.3f,10,.4f);creak=Tone("Draw",82,.45f,7,1.33f);
            step=Hiss("Step",.09f,40,.08f);ground=Hiss("Ground",.12f,30,.12f);splash=Hiss("Splash",.3f,11,.5f);
            bellTones=new AudioClip[vale.Sites.Length];
            for(int i=0;i<bellTones.Length;i++)bellTones[i]=Tone(vale.Sites[i].name,vale.Sites[i].tone,2.3f,2.4f,1.49f);
        }

        // ------------------------------------------------------------ sky and day
        static readonly float[] dayKeys={0,.18f,.6f,.78f,.9f,1};
        static readonly string[] dayTop={"5d8fc9","4d93d6","4d93d6","566fae","2c3d6b","5d8fc9"};
        static readonly string[] dayHorizon={"f2c9a0","b9d6dd","b9d6dd","f0b183","7686a8","f2c9a0"};
        static readonly string[] daySun={"ffc994","fff0d0","fff0d0","ffb070","a9bbe6","ffc994"};
        static readonly float[] daySunPower={1.5f,2.2f,2.2f,1.6f,.75f,1.5f},dayAmbient={1.15f,1.5f,1.5f,1.15f,.9f,1.15f};
        static Color Rgb(string hex){ColorUtility.TryParseHtmlString("#"+hex,out var c);return c;}
        void BuildSky()
        {
            const int rings=12,around=24;
            skyPoints=new Vector3[(rings+1)*(around+1)];skyColors=new Color[skyPoints.Length];var order=new int[rings*around*6];
            for(int r=0;r<=rings;r++)for(int a=0;a<=around;a++){
                float lat=Mathf.PI*(r/(float)rings-.5f),lon=2*Mathf.PI*a/around;
                skyPoints[r*(around+1)+a]=P(Mathf.Cos(lat)*Mathf.Cos(lon),Mathf.Sin(lat),Mathf.Cos(lat)*Mathf.Sin(lon))*1300;
            }
            int q=0;for(int r=0;r<rings;r++)for(int a=0;a<around;a++){
                int k=r*(around+1)+a;order[q++]=k;order[q++]=k+1;order[q++]=k+around+1;order[q++]=k+1;order[q++]=k+around+2;order[q++]=k+around+1;
            }
            skyMesh=new Mesh{name="Sky"};skyMesh.vertices=skyPoints;skyMesh.colors=skyColors;skyMesh.triangles=order;skyMesh.bounds=new Bounds(Vector3.zero,Vector3.one*1e6f);
            var dome=Group("Sky",transform,Vector3.zero);skyDome=dome.transform;dome.AddComponent<MeshFilter>().sharedMesh=skyMesh;dome.AddComponent<MeshRenderer>().sharedMaterial=Paint.Glow(Color.white,0,1000);
            var disc=new Builder();disc.Tube(Vector3.zero,Vector3.forward*.01f,38,38,24,Color.white);
            sunDisc=disc.ToObject("Sun disc",transform,Paint.Glow(Color.white,0,1001)).transform;
            var cloudPaint=Paint.Glow(new Color(1,1,1,.86f),0,2990);
            foreach(var spec in vale.Clouds){
                var b=new Builder();for(int k=0;k<4;k++)b.Blob(spec.offsets[k],spec.scales[k],Quaternion.identity,Color.white);
                var cloud=b.ToObject("Cloud",transform,cloudPaint).transform;cloud.position=spec.position;clouds.Add(cloud);
            }
        }
        void UpdateSky(float dt)
        {
            dayTime=(dayTime+dt/840)%1;int i=1;while(dayKeys[i]<dayTime)i++;
            float f=(dayTime-dayKeys[i-1])/(dayKeys[i]-dayKeys[i-1]);
            Color top=Color.Lerp(Rgb(dayTop[i-1]),Rgb(dayTop[i]),f),horizon=Color.Lerp(Rgb(dayHorizon[i-1]),Rgb(dayHorizon[i]),f);
            Color top2=Paint.Fix(top),horizon2=Paint.Fix(horizon);
            for(int k=0;k<skyPoints.Length;k++)skyColors[k]=Color.Lerp(horizon2,top2,Mathf.Sqrt(Mathf.Clamp01(skyPoints[k].y/1300)));
            skyMesh.colors=skyColors;
            RenderSettings.fogColor=horizon;eye.backgroundColor=horizon;
            sun.color=Color.Lerp(Rgb(daySun[i-1]),Rgb(daySun[i]),f);sun.intensity=Mathf.Lerp(daySunPower[i-1],daySunPower[i],f)*.5f;
            RenderSettings.ambientLight=new Color(.71f,.73f,.65f)*(Mathf.Lerp(dayAmbient[i-1],dayAmbient[i],f)/1.5f);
            float el=.16f+.95f*Mathf.Sin(Mathf.PI*Mathf.Clamp01(dayTime/.86f)),az=.6f+dayTime*4.4f;
            Vector3 toSun=P(Mathf.Cos(az)*Mathf.Cos(el),Mathf.Sin(el),-Mathf.Sin(az)*Mathf.Cos(el)),at=eye.transform.position;
            sun.transform.rotation=Quaternion.LookRotation(-toSun);
            skyMesh.bounds=new Bounds(Vector3.zero,Vector3.one*1e6f);
            skyDome.position=at;
            sunDisc.position=at+toSun*1150;sunDisc.rotation=Quaternion.LookRotation(toSun);sunDisc.GetComponent<Renderer>().sharedMaterial.color=sun.color;
            foreach(var c in clouds){var p=c.position;p.x+=dt*2.2f;if(p.x>900)p.x=-900;c.position=p;}
            wind.volume=.08f+.04f*Mathf.Sin(Time.time*.23f)+Mathf.Clamp01(at.y/60)*.1f;
        }

        // ------------------------------------------------------------ the hamlet, bells and targets
        TextMesh Words(string name,Transform parent,Vector3 pos,float size,string text)
        {
            var words=Group(name,parent,pos).AddComponent<TextMesh>();
            var font=Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            if(font!=null){words.font=font;words.GetComponent<MeshRenderer>().sharedMaterial=font.material;}
            words.anchor=TextAnchor.MiddleCenter;words.alignment=TextAlignment.Center;words.characterSize=size;words.fontSize=54;
            words.color=new Color(1,.92f,.74f);words.text=text;return words;
        }
        void BuildHamlet()
        {
            var b=new Builder();
            float[,] huts={{-15,-7,1},{13,-12,1.15f},{-19,9,.9f},{1,-20,1},{21,-3,.95f}};
            for(int i=0;i<5;i++){
                float x=huts[i,0],z=huts[i,1],s=huts[i,2],g=vale.GroundAt(x,z);Vector3 p=P(x,g,z),inward=P(-x,0,-z).normalized;
                b.Tube(p+Vector3.down*.3f,p+Vector3.up*2.9f,3.1f*s,3*s,10,Paint.Hex("d9c59a"));
                b.Tube(p+Vector3.up*2.85f,p+Vector3.up*5.65f,3.9f*s,0,10,Paint.Hex("7a4f35"));
                b.Box(p+inward*3*s+Vector3.up,P(1.1f,2,.25f),Quaternion.LookRotation(inward),Paint.Hex("513c2b"));
                vale.AddCollider(x,z,3.15f*s,g+5);
            }
            float sg=vale.GroundAt(3.2f,7);
            b.Tube(P(3.2f,sg,7.08f),P(3.2f,sg+1.5f,7.08f),.07f,.07f,7,Paint.Hex("825435"));
            b.Box(P(3.2f,sg+1.75f,7.05f),P(3.5f,.66f,.05f),Quaternion.identity,Paint.Hex("273c34"));
            b.ToObject("Hamlet",transform,Paint.Lit);
            Words("Signboard",transform,P(3.2f,sg+1.75f,7),.021f,"Seven bells sleep in the vale  •  wake them");
        }
        Renderer Pennant(Transform parent,Vector3 pos,string hex)
        {
            var b=new Builder();b.TwoSided(Vector3.zero,P(0,-.7f,0),P(0,-.35f,1.5f),Color.white);
            var flag=b.ToObject("Pennant",parent,Paint.Tinted(hex));flag.transform.localPosition=pos;return flag.GetComponent<Renderer>();
        }
        void BuildBells()
        {
            var beaconPaint=Paint.Glow(new Color(1,.886f,.627f,.24f),0);
            foreach(var s in vale.Sites){
                var root=Group(s.name,transform,P(s.x,s.y,s.z)).transform;root.rotation=Quaternion.LookRotation(P(-s.x,0,-s.z));
                var b=new Builder();float bottom=.3f;
                if(s.tower){
                    bottom=12.5f;b.Tube(P(0,-2,0),P(0,12.5f,0),4.3f,3.6f,12,Paint.Hex("9a968a"));
                    for(int i=0;i<8;i++){float a=i*Mathf.PI/4;var radial=P(Mathf.Cos(a),0,Mathf.Sin(a));b.Box(radial*3.3f+Vector3.up*13,P(1.1f,1,.7f),Quaternion.LookRotation(radial),Paint.Hex("878378"));}
                    vale.AddCollider(s.x,s.z,4.3f,s.y+12.5f);
                }else{b.Tube(P(0,-4.7f,0),P(0,.3f,0),3.1f,2.6f,10,Paint.Hex("9a968a"));vale.AddCollider(s.x,s.z,2.9f,s.y+.3f);}
                foreach(int side in new[]{-1,1})b.Tube(P(side*1.15f,bottom,0),P(side*1.15f,bottom+3.7f,0),.13f,.13f,7,Paint.Hex("825435"));
                b.Tube(P(-1.5f,bottom+3.7f,0),P(1.5f,bottom+3.7f,0),.12f,.12f,7,Paint.Hex("825435"));
                b.Tube(P(2,bottom,0),P(2,bottom+8.5f,0),.07f,.07f,7,Paint.Hex("825435"));
                b.ToObject("Shrine",root,Paint.Lit);
                var bell=new Builder();
                bell.Tube(Vector3.zero,P(0,-1.2f,0),.36f,.64f,16,Paint.Hex("ae783e"));
                bell.Tube(P(0,-1.11f,0),P(0,-1.45f,0),.62f,.9f,18,Paint.Hex("c99649"));
                bell.Blob(P(0,-1.56f,0),Vector3.one*.2f,Quaternion.identity,Paint.Hex("734729"));
                var hang=bell.ToObject("Bell",root,Paint.Lit).transform;hang.localPosition=P(0,bottom+3.6f,0);
                var mark=new Mark{kind=Bell,name=s.name,root=hang,site=s,scored=progress.bells.Contains(s.id)};
                mark.flag=Pennant(root,P(2,bottom+8.4f,0),mark.scored?"f0c75a":"c9d8d2");
                var light=new Builder();light.Tube(P(0,bottom,0),P(0,bottom+190,0),.8f,.8f,10,Color.white,false,false);
                mark.beacon=light.ToObject("Beacon",root,beaconPaint);mark.beacon.SetActive(!mark.scored);
                marks.Add(mark);
            }
        }
        void BuildStraw()
        {
            float[] radii={.68f,.50f,.37f,.23f,.10f},depth={0,.038f,.072f,.11f,.15f};
            string[] colors={"bf9959","ae493d","e5c67e","ae493d","e5c67e"};
            strawTotal=vale.Straw.Count;
            for(int i=0;i<strawTotal;i++){
                float x=vale.Straw[i].x,z=vale.Straw[i].y,g=vale.GroundAt(x,z);
                var root=Group("Straw round",transform,P(x,g+1.5f,z)).transform;
                root.rotation=Quaternion.LookRotation(P(-x,0,-z))*Quaternion.Euler(0,vale.StrawTurn[i]*Mathf.Rad2Deg,0);
                var stand=new Builder();
                foreach(int side in new[]{-1,1})stand.Tube(P(side*.7f,-1.9f,.1f),P(0,.3f,-.06f),.055f,.055f,7,Paint.Hex("825435"));
                stand.Tube(P(0,-1.9f,-1),P(0,.3f,-.06f),.055f,.055f,7,Paint.Hex("825435"));
                stand.Tube(P(1.1f,-1.9f,0),P(1.1f,2.6f,0),.045f,.045f,7,Paint.Hex("825435"));
                stand.ToObject("Stand",root,Paint.Lit);
                var face=new Builder();
                for(int k=0;k<radii.Length;k++)face.Tube(P(0,0,depth[k]-.0225f),P(0,0,depth[k]+.0225f),radii[k],radii[k],28,Paint.Hex(colors[k]));
                var disc=face.ToObject("Face",root,Paint.Lit).transform;disc.localScale=Vector3.one*1.2f;
                var mark=new Mark{kind=StrawRound,index=i,name="Straw round",root=disc,x=x,z=z,scored=progress.marks.Contains(i)};
                mark.flag=Pennant(root,P(1.1f,2.55f,0),mark.scored?"f0c75a":"ae493d");
                if(mark.scored)strawFound++;
                marks.Add(mark);
            }
        }
        void BuildLanterns()
        {
            var paper=Paint.Glow(Rgb("ffb057"),1);
            for(int i=0;i<vale.Lanterns.Count;i++){
                var root=Group("Lantern",transform,Vector3.zero).transform;
                var shade=new Builder();shade.Tube(P(0,-.4f,0),P(0,.4f,0),.36f,.5f,8,Color.white);shade.ToObject("Paper",root,paper);
                var basket=new Builder();basket.Box(P(0,-.52f,0),P(.3f,.16f,.3f),Quaternion.identity,Paint.Hex("825435"));basket.ToObject("Basket",root,Paint.Lit);
                var mark=new Mark{kind=Lantern,index=i,name="Lantern",root=root,orbit=vale.Lanterns[i],scored=progress.lanterns.Contains(i)};
                if(mark.scored){lanternsFound++;root.gameObject.SetActive(false);}
                marks.Add(mark);lanterns.Add(mark);
            }
        }
        void BuildHerd()
        {
            foreach(var spec in vale.Deer){
                string coat=spec.dark?"96693f":"a8794d";
                var root=Group("Deer",transform,P(spec.x,vale.GroundAt(spec.x,spec.z),spec.z)).transform;
                var body=new Builder();body.Box(P(0,1,0),P(.42f,.5f,1.15f),Quaternion.identity,Paint.Hex(coat));body.Box(P(0,1.18f,-.6f),P(.12f,.14f,.1f),Quaternion.identity,Paint.Hex("f3ead6"));
                body.ToObject("Body",root,Paint.Lit);
                var head=new Builder();head.Box(P(0,.3f,.1f),P(.2f,.65f,.22f),Quaternion.identity,Paint.Hex(coat));head.Box(P(0,.68f,.26f),P(.22f,.24f,.46f),Quaternion.identity,Paint.Hex(coat));
                head.Box(P(0,.85f,.12f),P(.34f,.14f,.05f),Quaternion.identity,Paint.Hex("7c5632"));
                var neck=head.ToObject("Neck",root,Paint.Lit).transform;neck.localPosition=P(0,1.15f,.5f);
                var legs=new Transform[4];float[,] hips={{-.14f,.42f},{.14f,.42f},{-.14f,-.42f},{.14f,-.42f}};
                for(int i=0;i<4;i++){
                    var leg=new Builder();leg.Box(P(0,-.4f,0),P(.1f,.8f,.1f),Quaternion.identity,Paint.Hex("7c5632"));
                    legs[i]=leg.ToObject("Leg",root,Paint.Lit).transform;legs[i].localPosition=P(hips[i,0],.8f,hips[i,1]);
                }
                herd.Add(new Animal{root=root,neck=neck,legs=legs,timer=spec.timer,heading=spec.heading});
            }
        }
        void UpdateHerd(float dt,Vector3 player)
        {
            foreach(var d in herd){
                Vector3 p=d.root.position;float dist=Vector2.Distance(new Vector2(p.x,p.z),new Vector2(player.x,player.z));if(dist>260)continue;
                if(dist<17&&d.mode!=2)Startle(d,player);
                d.timer-=dt;
                if(d.timer<=0){
                    if(d.mode==0){d.mode=1;d.timer=3+UnityEngine.Random.value*5;d.heading=UnityEngine.Random.value*6.28f;}
                    else{d.mode=0;d.timer=4+UnityEngine.Random.value*8;}
                }
                float speed=d.mode==2?8.5f:d.mode==1?1.2f:0;
                if(speed>0){
                    float nx=p.x+Mathf.Sin(d.heading)*speed*dt,nz=p.z+Mathf.Cos(d.heading)*speed*dt,g=vale.GroundAt(nx,nz);
                    if(g<.6f||Mathf.Sqrt(nx*nx+nz*nz)>350)d.heading+=2;else d.root.position=P(nx,g,nz);
                    d.phase+=dt*speed*2.4f;
                    for(int i=0;i<4;i++)d.legs[i].localRotation=Quaternion.Euler(Mathf.Sin(d.phase+(i%3!=0?Mathf.PI:0))*(speed>3?46:23),0,0);
                }else for(int i=0;i<4;i++)d.legs[i].localRotation=Quaternion.Slerp(d.legs[i].localRotation,Quaternion.identity,.1f);
                d.neck.localRotation=Quaternion.Slerp(d.neck.localRotation,Quaternion.Euler(d.mode==0?72:6,0,0),Mathf.Min(1,dt*4));
                d.root.rotation=Quaternion.Slerp(d.root.rotation,Quaternion.Euler(0,d.heading*Mathf.Rad2Deg,0),Mathf.Min(1,dt*6));
            }
        }
        static void Startle(Animal d,Vector3 from)
        {
            Vector3 p=d.root.position;d.mode=2;d.timer=4+UnityEngine.Random.value*2.5f;d.heading=Mathf.Atan2(p.x-from.x,p.z-from.z)+(UnityEngine.Random.value-.5f)*.8f;
        }
        void BuildGrass()
        {
            grassPoints=new Vector3[Vale.TuftCount*9];var normals=new Vector3[grassPoints.Length];var tint=new Color[grassPoints.Length];var order=new int[grassPoints.Length];
            Color green=Paint.Hex("71883f");
            for(int i=0;i<order.Length;i++){order[i]=i;normals[i]=Vector3.up;tint[i]=green;}
            grassMesh=new Mesh{name="Grass"};grassMesh.MarkDynamic();grassMesh.vertices=grassPoints;grassMesh.normals=normals;grassMesh.colors=tint;grassMesh.triangles=order;
            var obj=Group("Grass",transform,Vector3.zero);obj.AddComponent<MeshFilter>().sharedMesh=grassMesh;
            var renderer=obj.AddComponent<MeshRenderer>();renderer.sharedMaterial=Paint.Lit;renderer.shadowCastingMode=UnityEngine.Rendering.ShadowCastingMode.Off;
        }
        void UpdateGrass(Vector3 player)
        {
            if(Mathf.Abs(player.x-grassX)+Mathf.Abs(player.z-grassZ)<3)return;grassX=player.x;grassZ=player.z;
            for(int i=0;i<Vale.TuftCount;i++){
                float bx=vale.Tufts[i*4],bz=vale.Tufts[i*4+1],size=vale.Tufts[i*4+2],turn=vale.Tufts[i*4+3];
                float x=bx+Vale.Tile*Mathf.Round((player.x-bx)/Vale.Tile),z=bz+Vale.Tile*Mathf.Round((player.z-bz)/Vale.Tile),g=vale.GroundAt(x,z);
                if(g<.5f||vale.OnPath(x,z))size=0;
                Vector3 centre=P(x,g,z),tip=centre+Vector3.up*.34f*size;
                for(int k=0;k<3;k++){
                    float a0=turn+k*2.0944f,a1=a0+2.0944f;
                    // listed clockwise seen from outside, which is the front face
                    grassPoints[i*9+k*3]=centre+P(Mathf.Cos(a1),0,Mathf.Sin(a1))*.06f*size;
                    grassPoints[i*9+k*3+1]=centre+P(Mathf.Cos(a0),0,Mathf.Sin(a0))*.06f*size;
                    grassPoints[i*9+k*3+2]=tip;
                }
            }
            grassMesh.vertices=grassPoints;grassMesh.bounds=new Bounds(player,Vector3.one*200);
        }

        // ------------------------------------------------------------ bow and arrows
        void BuildBow()
        {
            var b=new Builder();
            foreach(int side in new[]{-1,1})b.Tube(Vector3.zero,P(0,side*.21f,0),.026f,.026f,7,Paint.Hex("513c2b"));
            bow=b.ToObject("Ash bow",transform,Paint.Lit).transform;
            // each limb is its own piece so it can bend back with the draw
            for(int i=0;i<2;i++){
                int side=i==0?-1:1;var l=new Builder();
                l.Tube(Vector3.zero,P(0,side*.21f,-.06f),.018f,.018f,7,Paint.Hex("c08d51"));l.Tube(P(0,side*.21f,-.06f),P(0,side*.39f,-.15f),.018f,.018f,7,Paint.Hex("c08d51"));
                limbs[i]=l.ToObject(i==0?"Lower limb":"Upper limb",bow,Paint.Lit).transform;limbs[i].localPosition=P(0,side*.21f,0);
            }
            var strand=new Builder();strand.Tube(P(0,-.5f,0),P(0,.5f,0),.5f,.5f,5,Paint.Hex("f2deb4"));var strandMesh=strand.ToMesh("String");
            upper=Strand("Upper string",strandMesh);lower=Strand("Lower string",strandMesh);
            var a=new Builder();
            a.Tube(P(0,0,-.62f),Vector3.zero,.009f,.009f,6,Paint.Hex("67492f"));a.Tube(P(0,0,-.02f),P(0,0,.066f),.03f,0,4,Paint.Hex("9ea9a4"));
            for(int i=0;i<3;i++){float t=i*2*Mathf.PI/3;a.Box(P(.018f*Mathf.Cos(t),.018f*Mathf.Sin(t),-.57f),P(.05f,.009f,.1f),Quaternion.Euler(0,0,t*Mathf.Rad2Deg),Paint.Hex("f2ead8"));}
            arrowMesh=a.ToMesh("Arrow");
            // a pale streak behind an arrow in flight: two crossed strips that fade out away from the tail
            var points=new List<Vector3>();var tints=new List<Color>();var order=new List<int>();
            foreach(var across in new[]{Vector3.right*.022f,Vector3.up*.022f}){
                int n=points.Count;points.Add(-across);points.Add(across);points.Add(-across+Vector3.back);points.Add(across+Vector3.back);
                tints.Add(new Color(1,1,1,.9f));tints.Add(new Color(1,1,1,.9f));tints.Add(new Color(1,1,1,0));tints.Add(new Color(1,1,1,0));
                order.AddRange(new[]{n,n+1,n+2,n+2,n+1,n+3});
            }
            streakMesh=new Mesh{name="Streak"};streakMesh.SetVertices(points);streakMesh.SetColors(tints);streakMesh.SetTriangles(order,0);streakMesh.RecalculateBounds();
            streakPaint=Paint.Glow(Rgb("fffae8"),1,3100);
            var chip=new Builder();chip.Box(Vector3.zero,Vector3.one,Quaternion.identity,Color.white);chipMesh=chip.ToMesh("Chip");
            loaded=NewArrow();loaded.gameObject.SetActive(false);
            var back=new Builder();back.Box(P(0,0,.006f),P(.3f,.12f,.006f),Quaternion.identity,Paint.Hex("273c34"));
            var board=back.ToObject("Plaque",bow,Paint.Lit).transform;board.localPosition=P(.24f,-.02f,-.1f);board.localRotation=Quaternion.Euler(0,14,0);
            plaque=Words("Plaque words",board,Vector3.zero,.0042f,"");board.gameObject.SetActive(false);
            var point=new Builder();point.Tube(Vector3.zero,P(0,0,.09f),.018f,0,6,Color.white);
            needle=point.ToObject("Bell needle",transform,Paint.Glow(Rgb("ffd277"),0)).transform;needle.gameObject.SetActive(false);
        }
        Transform Strand(string name,Mesh mesh)
        {
            var obj=Group(name,bow,Vector3.zero);obj.AddComponent<MeshFilter>().sharedMesh=mesh;obj.AddComponent<MeshRenderer>().sharedMaterial=Paint.Lit;return obj.transform;
        }
        static void Stretch(Transform strand,Vector3 end,Vector3 nock)
        {
            strand.localPosition=(end+nock)*.5f;strand.localRotation=Quaternion.FromToRotation(Vector3.up,end-nock);
            strand.localScale=P(.007f,(end-nock).magnitude,.007f);
        }
        // Bends the limbs by flex (radians) and runs the string from their tips through the nock.
        void SetString(Vector3 nock,float flex)
        {
            for(int i=0;i<2;i++){
                int side=i==0?-1:1;limbs[i].localRotation=Quaternion.Euler(-side*flex*Mathf.Rad2Deg,0,0);
                Stretch(i==0?lower:upper,limbs[i].localPosition+limbs[i].localRotation*P(0,side*.39f,-.15f),nock);
            }
        }
        // After a release: kick is the slow recoil of the bow, snap the fast ringing of the string.
        void Recoil(out float kick,out float snap)
        {
            float t=Time.time-loosedAt;kick=0;snap=0;if(t>1.5f)return;
            kick=loosedPower*Mathf.Exp(-7*t)*Mathf.Sin(13*t);snap=loosedPower*Mathf.Exp(-11*t)*Mathf.Sin(62*t);
        }
        Transform NewArrow()
        {
            var root=Group("Arrow",transform,Vector3.zero);
            var shaft=Group("Shaft",root.transform,Vector3.zero);shaft.AddComponent<MeshFilter>().sharedMesh=arrowMesh;shaft.AddComponent<MeshRenderer>().sharedMaterial=Paint.Lit;
            var streak=Group("Streak",root.transform,P(0,0,-.62f));streak.AddComponent<MeshFilter>().sharedMesh=streakMesh;streak.AddComponent<MeshRenderer>().sharedMaterial=streakPaint;streak.SetActive(false);
            return root.transform;
        }
        void CancelDraw(){charging=false;power=0;stringController=null;stringPalm=null;}
        void Retire(int i){var f=flights[i];f.streak.gameObject.SetActive(false);f.body.localRotation=Quaternion.identity;f.arrow.gameObject.SetActive(false);spare.Push(f.arrow);flights.RemoveAt(i);}
        // The arrow leaves from where it sat on the string: its tail on the nock, pointing along dir.
        void Loose(Vector3 dir,Vector3 nock)
        {
            if(power>=.1f){
                if(flights.Count>48)Retire(0);
                var a=spare.Count>0?spare.Pop():NewArrow();a.gameObject.SetActive(true);a.localScale=Vector3.one;
                Vector3 from=bow.TransformPoint(nock)+dir*.62f*bow.localScale.x;a.SetPositionAndRotation(from,Quaternion.LookRotation(dir));
                var f=new Flight{arrow=a,body=a.GetChild(0),streak=a.GetChild(1),origin=from,velocity=dir*(24+power*38),power=power,roll=UnityEngine.Random.value*360};
                f.body.localRotation=Quaternion.identity;f.streak.gameObject.SetActive(true);f.streak.localScale=P(1,1,.001f);
                flights.Add(f);progress.shots++;loosedAt=Time.time;loosedPower=power;
                audioSource.PlayOneShot(pluck,.4f);audioSource.PlayOneShot(whoosh,.3f*power);
            }
            CancelDraw();
        }
        // Small flat-shaded chips thrown up where an arrow lands.
        void Burst(Vector3 at,string hex,int count,float force,float lift)
        {
            if(!chipPaint.TryGetValue(hex,out var paint)){paint=Paint.Tinted(hex);chipPaint.Add(hex,paint);}
            for(int i=0;i<count;i++){
                Chip c=null;foreach(var x in chips)if(x.life<=0){c=x;break;}
                if(c==null){
                    if(chips.Count>=96)return;
                    var obj=Group("Chip",transform,Vector3.zero);obj.AddComponent<MeshFilter>().sharedMesh=chipMesh;
                    c=new Chip{t=obj.transform,r=obj.AddComponent<MeshRenderer>()};chips.Add(c);
                }
                c.r.sharedMaterial=paint;c.t.gameObject.SetActive(true);c.t.SetPositionAndRotation(at,UnityEngine.Random.rotation);
                float a=UnityEngine.Random.value*6.283f,r=UnityEngine.Random.value*1.7f*force;
                c.v=P(Mathf.Cos(a)*r,(1+UnityEngine.Random.value*2.6f)*lift*force,Mathf.Sin(a)*r);
                c.span=c.life=.45f+UnityEngine.Random.value*.5f;c.size=.025f+UnityEngine.Random.value*.035f;c.t.localScale=Vector3.one*c.size;
            }
        }
        void StepChips(float dt)
        {
            foreach(var c in chips){
                if(c.life<=0)continue;c.life-=dt;if(c.life<=0){c.t.gameObject.SetActive(false);continue;}
                c.v.y-=9*dt;c.t.position+=c.v*dt;c.t.Rotate(420*dt,0,0);c.t.localScale=Vector3.one*c.size*Mathf.Min(1,c.life/c.span*1.6f);
            }
        }
        static void Buzz(Controller c,float strength,float seconds)
        {
            if(c==null)return;
            var device=InputDevices.GetDeviceAtXRNode(c==Controller.leftHand?XRNode.LeftHand:XRNode.RightHand);
            if(device.isValid)device.SendHapticImpulse(0,Mathf.Clamp01(strength),seconds);
        }
        static float HitSphere(Vector3 from,Vector3 dir,float reach,Vector3 centre,float radius)
        {
            Vector3 m=from-centre;float b=Vector3.Dot(m,dir),c=m.sqrMagnitude-radius*radius;
            if(c<=0)return 0;
            float disc=b*b-c;if(disc<0)return -1;
            float t=-b-Mathf.Sqrt(disc);return t>=0&&t<=reach?t:-1;
        }
        // Nearest target crossed by this step of an arrow, or null.
        Mark Strike(Vector3 from,Vector3 dir,float reach,out float along)
        {
            Mark best=null;along=reach;
            foreach(var m in marks){
                float t=-1;
                if(m.kind==Bell){
                    t=HitSphere(from,dir,reach,m.root.TransformPoint(P(0,-.55f,0)),.55f);
                    float lip=HitSphere(from,dir,reach,m.root.TransformPoint(P(0,-1.22f,0)),.85f);
                    if(lip>=0&&(t<0||lip<t))t=lip;
                }else if(m.kind==StrawRound){
                    Vector3 normal=m.root.forward;float facing=Vector3.Dot(dir,normal);
                    if(Mathf.Abs(facing)>1e-4f){
                        float d=Vector3.Dot(m.root.position-from,normal)/facing;
                        if(d>=0&&d<=reach&&(from+dir*d-m.root.position).magnitude<.68f*1.2f)t=d;
                    }
                }else if(!m.scored)t=HitSphere(from,dir,reach,m.root.position,.72f);
                if(t>=0&&t<=along){along=t;best=m;}
            }
            return best;
        }
        void Say(string text,float seconds){notice=text;noticeEnd=Time.time+seconds;}
        void Score(Mark m,Flight f)
        {
            int distance=Mathf.RoundToInt(Vector3.Distance(f.origin,f.arrow.position));m.struck=Time.time;
            if(distance>progress.longest&&!(m.kind==Bell&&m.scored))progress.longest=distance;
            if(m.kind==Bell){
                int which=Array.IndexOf(vale.Sites,m.site);audioSource.PlayOneShot(bellTones[which]);
                if(!m.scored){
                    m.scored=true;progress.bells.Add(m.site.id);m.beacon.SetActive(false);m.flag.sharedMaterial.color=Rgb("f0c75a");
                    if(progress.bells.Count==vale.Sites.Length){
                        progress.done=true;Say("All seven bells ring across the vale",9);
                        for(int i=0;i<bellTones.Length;i++)chimes.Add(new Chime{time=Time.time+.9f+i*.42f,clip=bellTones[i],volume=.8f});
                        foreach(var other in marks)if(other.kind==Bell)other.struck=Time.time+.9f;
                    }else Say(m.name+" wakes  ·  "+progress.bells.Count+" of 7  ·  "+distance+" m",4.5f);
                }else Say(m.name,1.3f);
            }else if(m.kind==StrawRound){
                audioSource.PlayOneShot(thud);
                if(!m.scored){m.scored=true;progress.marks.Add(m.index);strawFound++;m.flag.sharedMaterial.color=Rgb("f0c75a");Say("Straw round  ·  "+strawFound+" of "+strawTotal+"  ·  "+distance+" m",3);}
            }else{
                m.scored=true;progress.lanterns.Add(m.index);lanternsFound++;m.root.gameObject.SetActive(false);audioSource.PlayOneShot(pop);
                Say("Lantern  ·  "+lanternsFound+" of "+lanterns.Count+"  ·  "+distance+" m",3);
            }
            Save();
        }
        void Settle(Flight f)
        {
            f.jolt=Mathf.Clamp(f.velocity.magnitude/55,.3f,1);f.stopped=true;f.stoppedAt=Time.time;
            f.streak.gameObject.SetActive(false);f.body.localRotation=Quaternion.Euler(0,0,f.roll);
        }
        void Simulate(float dt)
        {
            for(int i=flights.Count-1;i>=0;i--){
                var f=flights[i];f.age+=dt;
                if(f.age>(f.stopped?50:14)){Retire(i);continue;}
                if(f.stopped){
                    // the shaft quivers where it stuck
                    float t=Time.time-f.stoppedAt;
                    if(!f.flat&&t<1.2f)f.body.localRotation=Quaternion.Euler(f.jolt*8.6f*Mathf.Exp(-6*t)*Mathf.Sin(52*t),0,f.roll);
                    continue;
                }
                f.velocity+=Vector3.down*7*dt;
                float speed=f.velocity.magnitude,reach=speed*dt,limit=reach;Vector3 dir=f.velocity/speed,p=f.arrow.position;
                Mark mark=null;if(!f.spent)mark=Strike(p,dir,reach,out limit);
                f.arrow.rotation=Quaternion.LookRotation(dir);
                if(f.spent){f.roll+=dt*745;f.body.localRotation=Quaternion.Euler(f.roll,0,0);}
                else{
                    // the shaft fishtails as it leaves the string, then steadies and spins
                    float w=f.power*4.6f*Mathf.Exp(-4.5f*f.age);f.roll+=dt*(8+speed*.2f)*Mathf.Rad2Deg;
                    f.body.localRotation=Quaternion.Euler(w*.5f*Mathf.Sin(29*f.age),w*Mathf.Sin(36*f.age),f.roll);
                    f.streak.localScale=P(1,1,Mathf.Clamp(speed*.04f,.2f,2.4f)*Mathf.Min(1,f.age/.1f));
                }
                float gone=0;bool sunk=false;
                while(gone<limit&&!f.stopped){
                    float stride=Mathf.Min(.3f,limit-gone);p+=dir*stride;gone+=stride;
                    float g=vale.GroundAt(p.x,p.z);
                    if(p.y<0&&g<0){p.y=0;audioSource.PlayOneShot(splash,.5f);Burst(p,"d8ecee",12,1,1.3f);sunk=true;f.stopped=true;break;}
                    if(p.y<=g){
                        p.y=g;audioSource.PlayOneShot(ground,.5f);Burst(p,"8d7b58",f.spent?3:7,.7f,1);Settle(f);
                        if(f.spent){
                            f.flat=true;f.body.localRotation=Quaternion.identity;p.y+=.02f;
                            Vector3 lie=P(dir.x,0,dir.z);f.arrow.rotation=Quaternion.LookRotation(lie.sqrMagnitude>1e-6f?lie:Vector3.right);
                        }else p+=dir*.07f;
                        foreach(var d in herd)if(Vector2.Distance(new Vector2(d.root.position.x,d.root.position.z),new Vector2(p.x,p.z))<22)Startle(d,p);
                        break;
                    }
                    if(f.spent)continue;
                    vale.Near(p.x,p.z,nearby);
                    foreach(var c in nearby)if(p.y<c.top&&(p.x-c.x)*(p.x-c.x)+(p.z-c.z)*(p.z-c.z)<c.ar*c.ar){
                        audioSource.PlayOneShot(ground,.35f);Burst(p,"6e5a44",5,.6f,1);Settle(f);p+=dir*.05f;break;
                    }
                }
                f.arrow.position=p;
                if(sunk){Retire(i);continue;}
                if(!f.stopped&&mark!=null){
                    Score(mark,f);hitFlash=Time.time+.2f;
                    if(mark.kind==StrawRound){Burst(p,"e6cd7c",10,.8f,1);Settle(f);f.arrow.position=p+dir*.09f;}
                    else if(mark.kind==Lantern)Burst(p,"ffb866",16,1.2f,1);   // the arrow flies on through the paper
                    else{
                        // an arrow glances off the bronze and tumbles to the ground
                        Burst(p,"ffd98a",8,1,1);
                        Vector3 n=(p-mark.root.TransformPoint(P(0,-.9f,0))).normalized,v=dir*speed;
                        f.velocity=(v-2*Vector3.Dot(v,n)*n)*.2f+Vector3.up*1.5f;f.spent=true;f.streak.gameObject.SetActive(false);f.arrow.position=p+n*.05f;
                    }
                }
            }
        }

        // ------------------------------------------------------------ moving about
        Vector3 Feet(){Vector3 p=xr?eye.transform.position:rig.position;return p;}
        float HeadYaw(){Vector3 f=eye.transform.forward;return Mathf.Atan2(f.x,f.z)*Mathf.Rad2Deg;}
        void Place(float x,float z,float heading)
        {
            rig.position=P(x,Mathf.Max(vale.GroundAt(x,z),Vale.Wade)+(xr&&!floor?1.62f:0),z);yaw=heading;fall=0;airborne=false;grassX=1e9f;
        }
        void Travel(Site s)
        {
            float l=Mathf.Sqrt(s.x*s.x+s.z*s.z),d=s.tower?10:7;
            Place(s.x-s.x/l*d,s.z-s.z/l*d,Mathf.Atan2(s.x,s.z)*Mathf.Rad2Deg);Say(s.name,2);audioSource.PlayOneShot(chime,.5f);
        }
        void Walked(float distance){stride+=distance;if(stride>1.7f){stride=0;audioSource.PlayOneShot(step,.35f);}}
        void Resume(){playing=true;mapOpen=false;Cursor.lockState=CursorLockMode.Locked;Cursor.visible=false;}
        void Pause(){playing=false;CancelDraw();Cursor.lockState=CursorLockMode.None;Cursor.visible=true;Save();}
        void UpdateHead()
        {
            if(!xr||eye==null)return;
            var head=InputSystem.GetDevice<XRHMD>();
            if(head!=null){
                eye.transform.localPosition=head.centerEyePosition.ReadValue();
                eye.transform.localRotation=head.centerEyeRotation.ReadValue();
            }
        }
        void Update()
        {
            xr=XRSettings.isDeviceActive;
            if(xr!=lastXR){
                Vector3 p=Feet();float heading=lastXR?HeadYaw():yaw;held=false;CancelDraw();lastXR=xr;bare=false;foreach(var palm in palms)if(palm.root!=null)palm.root.SetActive(false);nextOriginCheck=0;
                rig.rotation=xr?Quaternion.Euler(0,heading,0):Quaternion.identity;Place(p.x,p.z,heading);
                if(xr){playing=false;mapOpen=false;Cursor.lockState=CursorLockMode.None;eye.transform.localPosition=Vector3.zero;Say("Seven bells sleep in the vale",5);}
                else{eye.transform.localPosition=Vector3.up*1.65f;pitch=0;}
            }
            if(xr&&Time.unscaledTime>=nextOriginCheck){
                nextOriginCheck=Time.unscaledTime+2;
                SubsystemManager.GetSubsystems(inputs);
                foreach(var input in inputs)if(input.running){
                    if(input.GetTrackingOriginMode()!=TrackingOriginModeFlags.Floor)input.TrySetTrackingOriginMode(TrackingOriginModeFlags.Floor);
                    floor=input.GetTrackingOriginMode()==TrackingOriginModeFlags.Floor;break;
                }
            }
            UpdateHead();
            float dt=Mathf.Min(Time.deltaTime,.05f);
            Vector3 dir=eye.transform.forward,nock=P(0,0,-.14f);
            if(xr)VRInput(dt,ref dir,ref nock);else DesktopInput(dt,ref dir,ref nock);
            Recoil(out _,out float snap);
            if(!charging){nock=P(0,0,-.14f+.05f*snap);if(xr)dir=bow.forward;}
            SetString(nock,charging?.2f*power:-.04f*snap);
            // the nocked arrow sits with its tail on the string; a fresh one comes up shortly after a shot
            float since=Time.time-loosedAt,size=bow.localScale.x;bool show=(!xr||held)&&(charging||since>.3f);
            loaded.gameObject.SetActive(show);
            if(show){
                Vector3 at=bow.TransformPoint(nock)+dir*.62f*size;if(!charging&&since<.55f)at.y-=Mathf.Pow((.55f-since)/.25f,2)*.2f*size;
                loaded.localScale=Vector3.one*size;loaded.SetPositionAndRotation(at,Quaternion.LookRotation(dir));
            }
            foreach(var m in marks){
                float age=Time.time-m.struck;if(age<0||age>4)continue;float wave=Mathf.Exp(-2.4f*age)*Mathf.Sin(age*11);
                if(m.kind==Bell)m.root.localRotation=Quaternion.Euler(0,0,wave*17);else if(m.kind==StrawRound)m.root.localScale=Vector3.one*1.2f*(1+wave*.05f);
            }
            foreach(var l in lanterns)if(!l.scored){
                var o=l.orbit;float a=o.phase+Time.time*o.speed;
                l.root.position=P(o.cx+Mathf.Cos(a)*o.r,o.h+Mathf.Sin(Time.time*.6f+o.phase)*.8f,o.cz+Mathf.Sin(a)*o.r);
            }
            Vector3 feet=Feet();
            UpdateHerd(dt,feet);UpdateGrass(feet);Simulate(dt);StepChips(dt);UpdateSky(dt);
            for(int i=chimes.Count-1;i>=0;i--)if(Time.time>=chimes[i].time){audioSource.PlayOneShot(chimes[i].clip,chimes[i].volume);chimes.RemoveAt(i);}
            saveClock+=dt;if(saveClock>6&&(playing||xr)){saveClock=0;Save();}
        }
        void DesktopInput(float dt,ref Vector3 dir,ref Vector3 nock)
        {
            var keyboard=Keyboard.current;var mouse=Mouse.current;
            bow.gameObject.SetActive(true);plaque.transform.parent.gameObject.SetActive(false);needle.gameObject.SetActive(false);
            if(keyboard!=null){
                if(keyboard.mKey.wasPressedThisFrame&&(playing||mapOpen)){if(mapOpen)Resume();else{Pause();mapOpen=true;}}
                if(keyboard.escapeKey.wasPressedThisFrame&&playing)Pause();
            }
            if(playing&&keyboard!=null){
                if(mouse!=null){Vector2 look=mouse.delta.ReadValue();yaw+=look.x*.13f;pitch=Mathf.Clamp(pitch+look.y*.13f,-83,83);}
                yaw+=((keyboard.eKey.isPressed||keyboard.rightArrowKey.isPressed?1:0)-(keyboard.qKey.isPressed||keyboard.leftArrowKey.isPressed?1:0))*109*dt;
                float f=(keyboard.wKey.isPressed||keyboard.upArrowKey.isPressed?1:0)-(keyboard.sKey.isPressed||keyboard.downArrowKey.isPressed?1:0),s=(keyboard.dKey.isPressed?1:0)-(keyboard.aKey.isPressed?1:0);
                Vector3 p=rig.position;bool wading=vale.GroundAt(p.x,p.z)<-.4f;
                if(f!=0||s!=0){
                    float rad=yaw*Mathf.Deg2Rad,pace=(keyboard.shiftKey.isPressed?9.5f:5.2f)*(wading?.5f:1)*(charging?.5f:1)*dt/Mathf.Sqrt(f*f+s*s);
                    Vector2 next=vale.TryMove(p.x+(Mathf.Sin(rad)*f+Mathf.Cos(rad)*s)*pace,p.z+(Mathf.Cos(rad)*f-Mathf.Sin(rad)*s)*pace);
                    if(!airborne)Walked(Vector2.Distance(next,new Vector2(p.x,p.z)));p.x=next.x;p.z=next.y;
                }
                float g=Mathf.Max(vale.GroundAt(p.x,p.z),Vale.Wade);
                if(keyboard.spaceKey.isPressed&&!airborne&&!wading){fall=6.2f;airborne=true;}
                if(airborne){fall-=18*dt;p.y+=fall*dt;if(p.y<=g){p.y=g;airborne=false;fall=0;audioSource.PlayOneShot(step,.5f);}}else p.y=Mathf.Lerp(p.y,g,Mathf.Min(1,dt*18));
                rig.position=p;
            }
            // the view tightens a little with the draw and jolts on the release
            Recoil(out float kick,out _);zoom+=(power-zoom)*Mathf.Min(1,dt*10);
            eye.fieldOfView=68-7*zoom+kick*2.5f;eye.transform.localRotation=Quaternion.Euler(-pitch-kick*.7f,yaw,0);
            float tired=charging&&power>=1?Mathf.Min(1,(Time.time-started-.85f)/2)*.0022f:0;
            bow.localScale=Vector3.one*.73f;
            bow.SetPositionAndRotation(eye.transform.TransformPoint(P(-.26f+.07f*zoom+Mathf.Sin(Time.time*31)*tired,-.28f+.05f*zoom+Mathf.Sin(Time.time*43)*tired,.63f+kick*.05f)),
                eye.transform.rotation*Quaternion.Euler(kick*17,0,-17+11.5f*zoom));
            dir=(eye.transform.position+eye.transform.forward*70-bow.position).normalized;
            if(!playing||mouse==null){if(charging)CancelDraw();return;}
            if(mouse.leftButton.wasPressedThisFrame){charging=true;started=Time.time;audioSource.PlayOneShot(creak,.12f);}
            // the draw eases out, so the last of the pull is the slowest
            if(charging){float u=Mathf.Clamp01((Time.time-started)/.85f);power=1-(1-u)*(1-u);nock.z-=power*.33f;}
            if(charging&&mouse.leftButton.wasReleasedThisFrame)Loose(dir,nock);
        }

        // ------------------------------------------------------------ VR
        static bool Tracked(Controller c)=>c!=null&&c.added&&c.isTracked.isPressed;
        static ButtonControl Button(Controller c,string name)=>c?.TryGetChildControl<ButtonControl>(name);
        static bool Press(Controller c,string name)=>Button(c,name)?.wasPressedThisFrame==true;
        static Vector2 Stick(Controller c)
        {
            if(c==null)return Vector2.zero;
            var stick=c.TryGetChildControl<Vector2Control>("thumbstick")??c.TryGetChildControl<Vector2Control>("primary2DAxis");
            return stick!=null?stick.ReadValue():Vector2.zero;
        }
        Vector3 Hand(Controller c)=>rig.TransformPoint(c.devicePosition.ReadValue());
        void VRInput(float dt,ref Vector3 dir,ref Vector3 nock)
        {
            var left=Controller.leftHand;var right=Controller.rightHand;
            Vector3 head=eye.transform.position;
            // bare hands take over only while no controller is tracked
            bool seen=SenseHands();bare=seen&&!Tracked(left)&&!Tracked(right);
            foreach(var palm in palms)if(palm.root!=null)palm.root.SetActive(bare&&palm.tracked);
            if(bare)PointWalk(dt,ref head);
            if(Tracked(left)){
                if(Press(left,"thumbstickClicked"))running=!running;
                Vector2 push=Stick(left);float size=push.magnitude;
                if(size>.18f){
                    float rad=HeadYaw()*Mathf.Deg2Rad,pace=(running?7.5f:3.6f)*Mathf.Min(1,size)*(charging?.5f:1)*(vale.GroundAt(head.x,head.z)<-.4f?.5f:1)*dt/size;
                    Vector2 next=vale.TryMove(head.x+(Mathf.Sin(rad)*push.y+Mathf.Cos(rad)*push.x)*pace,head.z+(Mathf.Cos(rad)*push.y-Mathf.Sin(rad)*push.x)*pace);
                    Walked(Vector2.Distance(next,new Vector2(head.x,head.z)));
                    rig.position+=P(next.x-head.x,0,next.y-head.z);head.x=next.x;head.z=next.y;
                }else if(size<.05f)running=false;
            }
            if(Tracked(right)){
                float twist=Stick(right).x;
                if(Mathf.Abs(twist)>.65f&&!turned){rig.RotateAround(head,Vector3.up,Mathf.Sign(twist)*30);turned=true;}
                else if(Mathf.Abs(twist)<.3f)turned=false;
            }
            Vector3 at=rig.position;at.y=Mathf.Lerp(at.y,Mathf.Max(vale.GroundAt(head.x,head.z),Vale.Wade)+(floor?0:1.62f),Mathf.Min(1,dt*10));rig.position=at;
            head=eye.transform.position;

            bow.localScale=Vector3.one;plaque.transform.parent.gameObject.SetActive(true);
            if(bare)HandInput(head,ref dir,ref nock);else{
            var hand=leftBow?left:right;var other=leftBow?right:left;
            if(held&&!Tracked(hand)){held=false;CancelDraw();}
            if(!held){
                float heading=HeadYaw();
                bow.SetPositionAndRotation(head+Quaternion.Euler(0,heading,0)*P(0,-.31f,.44f),Quaternion.Euler(0,heading,0));
                foreach(var c in new[]{left,right})if(Tracked(c)&&Press(c,"gripPressed")&&Vector3.Distance(Hand(c),bow.position)<.42f){leftBow=c==left;held=true;break;}
            }else if(!charging&&Tracked(other)&&Press(other,"gripPressed")&&Vector3.Distance(Hand(other),bow.position)<.42f){
                leftBow=!leftBow;var swap=hand;hand=other;other=swap;
            }
            if(held){
                bow.SetPositionAndRotation(Hand(hand),rig.rotation*hand.deviceRotation.ReadValue());
                if(!Tracked(other))CancelDraw();
                else{
                    var pull=Hand(other);
                    if(!charging&&Press(other,"triggerPressed")&&Vector3.Distance(pull,bow.TransformPoint(nock))<.33f){charging=true;stringController=other;drawStep=0;audioSource.PlayOneShot(creak,.12f);}
                    if(charging&&other!=stringController)CancelDraw();
                    if(charging){
                        Vector3 difference=bow.position-pull;
                        dir=difference.sqrMagnitude>.0001f?difference.normalized:bow.forward;
                        power=Mathf.Clamp01((difference.magnitude-.12f)/.4f);nock=bow.InverseTransformPoint(pull);
                        int stepNow=Mathf.FloorToInt(power*8);if(stepNow!=drawStep){drawStep=stepNow;Buzz(other,.15f+.3f*power,.014f);}
                        if(Button(other,"triggerPressed")?.wasReleasedThisFrame==true){float pull2=power;Loose(dir,nock);Buzz(hand,.4f+.6f*pull2,.09f);Buzz(other,.5f,.04f);}
                    }
                }
            }
            }
            plaque.text=VRStatus();
            Site nearest=null;float best=1e9f;
            foreach(var m in marks)if(m.kind==Bell&&!m.scored){float d=Vector2.Distance(new Vector2(m.site.x,m.site.z),new Vector2(head.x,head.z));if(d<best){best=d;nearest=m.site;}}
            needle.gameObject.SetActive(nearest!=null);
            if(nearest!=null){
                Vector3 toward=P(nearest.x-head.x,0,nearest.z-head.z);
                needle.position=plaque.transform.position+Vector3.up*.1f;if(toward.sqrMagnitude>.01f)needle.rotation=Quaternion.LookRotation(toward);
            }
        }
        // ------------------------------------------------------------ hand tracking
        // A fist on the bow takes it; a pinch or fist on the string draws and opening the hand looses;
        // to pass the bow across, open the bow hand and close the other on it; a raised pointing finger walks that way.
        bool SenseHands()
        {
            SubsystemManager.GetSubsystems(handSystems);
            XRHandSubsystem system=null;foreach(var s in handSystems)if(s.running){system=s;break;}
            bool any=false;
            for(int i=0;i<2;i++){
                var palm=palms[i];palm.tracked=false;
                if(system!=null){var hand=i==0?system.leftHand:system.rightHand;palm.tracked=hand.isTracked&&Sense(palm,hand,i);}
                if(!palm.tracked)palm.fist=palm.nip=palm.point=false;
                any|=palm.tracked;
            }
            return any;
        }
        bool Joint(XRHand hand,XRHandJointID id,out Vector3 at)
        {
            if(hand.GetJoint(id).TryGetPose(out Pose pose)){at=rig.TransformPoint(pose.position);return true;}
            at=default;return false;
        }
        bool Sense(Palm palm,XRHand hand,int side)
        {
            if(!Joint(hand,XRHandJointID.Wrist,out var w)|!Joint(hand,XRHandJointID.IndexTip,out var it)|!Joint(hand,XRHandJointID.ThumbTip,out var tt)
                |!Joint(hand,XRHandJointID.IndexProximal,out var ik)|!Joint(hand,XRHandJointID.LittleProximal,out var lk)|!Joint(hand,XRHandJointID.MiddleProximal,out var mk)
                |!Joint(hand,XRHandJointID.MiddleTip,out var mt)|!Joint(hand,XRHandJointID.RingTip,out var rt)|!Joint(hand,XRHandJointID.LittleTip,out var lt))return false;
            float size=Mathf.Max(.05f,Vector3.Distance(w,mk));
            float curl=(Vector3.Distance(mt,w)+Vector3.Distance(rt,w)+Vector3.Distance(lt,w))/(3*size),index=Vector3.Distance(it,w)/size;
            palm.nip=Vector3.Distance(tt,it)<(palm.nip?.05f:.022f);
            palm.fist=curl<(palm.fist?1.5f:1.2f)&&index<(palm.fist?1.6f:1.3f);
            palm.point=index>1.6f&&curl<1.3f&&!palm.nip;
            Vector3 knuckles=(ik+lk)/2,forward=(knuckles-w).normalized,up=Vector3.ProjectOnPlane(ik-lk,forward).normalized;
            if(forward.sqrMagnitude<.5f||up.sqrMagnitude<.5f)return false;
            palm.hold=Vector3.Lerp(w,knuckles,.75f);palm.turn=Quaternion.LookRotation(forward,up);palm.pinch=(tt+it)/2;palm.pointDir=it-ik;
            int count=XRHandJointID.EndMarker.ToIndex();
            if(palm.root==null){
                palm.root=Group(side==0?"Left hand":"Right hand",transform,Vector3.zero);palm.dots=new Transform[count];
                var paint=Paint.Tinted(side==0?"92afa6":"dac5a5");
                for(int i=0;i<count;i++){
                    var dot=Group("Joint",palm.root.transform,Vector3.zero);dot.AddComponent<MeshFilter>().sharedMesh=chipMesh;dot.AddComponent<MeshRenderer>().sharedMaterial=paint;
                    dot.transform.localScale=Vector3.one*.014f;palm.dots[i]=dot.transform;
                }
            }
            for(int i=0;i<count;i++){
                bool shown=hand.GetJoint(XRHandJointIDUtility.FromIndex(i)).TryGetPose(out Pose pose);
                if(palm.dots[i].gameObject.activeSelf!=shown)palm.dots[i].gameObject.SetActive(shown);
                if(shown)palm.dots[i].SetPositionAndRotation(rig.TransformPoint(pose.position),rig.rotation*pose.rotation);
            }
            return true;
        }
        void PointWalk(float dt,ref Vector3 head)
        {
            for(int i=0;i<2;i++){
                var palm=palms[i];bool bowSide=held&&(i==0)==leftBow;
                bool raised=palm.tracked&&palm.point&&!bowSide&&palm!=stringPalm&&palm.pinch.y>head.y-.55f;
                palm.pointFor=raised?palm.pointFor+dt:0;
                if(palm.pointFor<=.25f)continue;
                Vector3 d=palm.pointDir;float flat=new Vector2(d.x,d.z).magnitude;
                if(flat<=.6f*d.magnitude)continue;
                float pace=4*(vale.GroundAt(head.x,head.z)<-.4f?.5f:1)*dt/flat;
                Vector2 next=vale.TryMove(head.x+d.x*pace,head.z+d.z*pace);
                Walked(Vector2.Distance(next,new Vector2(head.x,head.z)));
                rig.position+=P(next.x-head.x,0,next.y-head.z);head.x=next.x;head.z=next.y;
            }
        }
        void HandInput(Vector3 head,ref Vector3 dir,ref Vector3 nock)
        {
            foreach(var palm in palms){bool grab=palm.tracked&&(palm.nip||palm.fist);palm.rose=grab&&!palm.grab;palm.fell=!grab&&palm.grab;palm.grab=grab;}
            var hand=palms[leftBow?0:1];var other=palms[leftBow?1:0];
            if(!held){
                float heading=HeadYaw();
                bow.SetPositionAndRotation(head+Quaternion.Euler(0,heading,0)*P(0,-.31f,.44f),Quaternion.Euler(0,heading,0));
                for(int i=0;i<2;i++)if(palms[i].rose&&Vector3.Distance(palms[i].hold,bow.position)<.42f){leftBow=i==0;held=true;hand=palms[i];other=palms[1-i];CancelDraw();break;}
            }else if(other.rose&&!charging){
                if(hand.tracked&&hand.fist){
                    if(Vector3.Distance(other.pinch,bow.TransformPoint(nock))<.33f){charging=true;stringPalm=other;drawStep=0;audioSource.PlayOneShot(creak,.12f);}
                }else if(Vector3.Distance(other.hold,bow.position)<.42f){leftBow=!leftBow;var swap=hand;hand=other;other=swap;}
            }
            if(!held)return;
            if(hand.tracked)bow.SetPositionAndRotation(hand.hold,hand.turn);
            if(!charging)return;
            if(stringPalm!=other||!other.tracked||!hand.tracked){CancelDraw();return;}
            Vector3 difference=bow.position-other.pinch;
            dir=difference.sqrMagnitude>.0001f?difference.normalized:bow.forward;
            power=Mathf.Clamp01((difference.magnitude-.12f)/.4f);nock=bow.InverseTransformPoint(other.pinch);
            if(other.fell)Loose(dir,nock);
        }
        string Counts()=>"Bells "+progress.bells.Count+" / 7\nStraw rounds "+strawFound+" / "+strawTotal+"\nLanterns "+lanternsFound+" / "+lanterns.Count;
        string VRStatus()
        {
            if(Time.time<noticeEnd)return notice.Replace("  ·  ","\n");
            if(!held)return bare?"Close a fist on the bow\nPoint a finger to walk":"Grip near the bow\nwith either hand";
            if(progress.shots==0)return bare?"Pinch the string\npull back and let go":"Other trigger by the string\npull back and release";
            return (progress.done?"The vale is awake\n":"")+Counts();
        }

        // ------------------------------------------------------------ desktop HUD
        GUIStyle title,body,big,centred;
        void Styles()
        {
            if(title!=null)return;
            body=new GUIStyle(GUI.skin.label){fontSize=14,wordWrap=true,richText=true};body.normal.textColor=new Color(.95f,.91f,.84f);
            title=new GUIStyle(body){fontSize=26};title.normal.textColor=new Color(1,.96f,.85f);
            centred=new GUIStyle(body){alignment=TextAnchor.MiddleCenter};
            big=new GUIStyle(centred){fontSize=24,wordWrap=false};big.normal.textColor=Color.white;
        }
        static void Fill(Rect r,Color c){var old=GUI.color;GUI.color=c;GUI.DrawTexture(r,Texture2D.whiteTexture);GUI.color=old;}
        void DrawMap(Rect r,bool large)
        {
            Fill(new Rect(r.x-2,r.y-2,r.width+4,r.height+4),new Color(.9f,.82f,.65f,.7f));
            GUI.DrawTexture(r,vale.Map);
            float dot=large?14:9;
            Vector2 On(float x,float z)=>new Vector2(r.x+(x+Vale.Half)/Vale.Size*r.width,r.y+(1-(z+Vale.Half)/Vale.Size)*r.height);
            foreach(var m in marks){
                if(m.kind==StrawRound&&m.scored){var q=On(m.x,m.z);Fill(new Rect(q.x-dot*.25f,q.y-dot*.25f,dot*.5f,dot*.5f),new Color(.83f,.33f,.25f));}
                if(m.kind!=Bell)continue;
                var c=On(m.site.x,m.site.z);
                Fill(new Rect(c.x-dot*.5f-2,c.y-dot*.5f-2,dot+4,dot+4),new Color(.16f,.13f,.1f));
                Fill(new Rect(c.x-dot*.5f,c.y-dot*.5f,dot,dot),m.scored?new Color(.94f,.78f,.35f):new Color(1,.96f,.85f,.75f));
                if(large)GUI.Label(new Rect(c.x-90,c.y-dot-18,180,20),m.name,centred);
            }
            Vector3 feet=Feet();var me=On(feet.x,feet.z);var saved=GUI.matrix;
            GUIUtility.RotateAroundPivot(yaw,me);
            Fill(new Rect(me.x-dot*.35f,me.y-dot*.35f,dot*.7f,dot*.7f),Color.white);Fill(new Rect(me.x-1.5f,me.y-dot*1.3f,3,dot),Color.white);
            GUI.matrix=saved;
            if(!large)return;
            GUI.Label(new Rect(r.x,r.yMax+4,r.width,22),"Click a woken bell to travel there  ·  M closes the map",centred);
            var e=Event.current;
            if(e.type==EventType.MouseDown&&r.Contains(e.mousePosition)){
                float x=(e.mousePosition.x-r.x)/r.width*Vale.Size-Vale.Half,z=(1-(e.mousePosition.y-r.y)/r.height)*Vale.Size-Vale.Half;
                Site pick=null;float best=34;
                foreach(var m in marks)if(m.kind==Bell&&m.scored){float d=Vector2.Distance(new Vector2(m.site.x,m.site.z),new Vector2(x,z));if(d<best){best=d;pick=m.site;}}
                if(pick!=null){Travel(pick);Resume();}
                e.Use();
            }
        }
        void OnGUI()
        {
            if(xr||vale==null)return;
            Styles();
            float w=Screen.width,h=Screen.height;
            GUI.Label(new Rect(22,14,420,36),"The Seven Bells",title);
            GUI.Box(new Rect(w-212,14,196,progress.longest>0?86:68),"");
            GUI.Label(new Rect(w-202,18,180,84),Counts()+(progress.longest>0?"\nLongest shot "+progress.longest+" m":""),body);
            // compass
            float cw=Mathf.Min(420,w*.4f),cx=w*.5f;Fill(new Rect(cx-cw*.5f,44,cw,1),new Color(1,.96f,.85f,.5f));Fill(new Rect(cx,38,1,7),Color.white);
            Vector3 feet=Feet();
            void Tick(string text,float bearing){float rel=Mathf.DeltaAngle(yaw,bearing);if(Mathf.Abs(rel)<69)GUI.Label(new Rect(cx+rel/69*cw*.5f-20,20,40,22),text,centred);}
            Tick("N",0);Tick("E",90);Tick("S",180);Tick("W",270);
            foreach(var m in marks)if(m.kind==Bell&&!m.scored)Tick("<color=#ffd277>◆</color>",Mathf.Atan2(m.site.x-feet.x,m.site.z-feet.z)*Mathf.Rad2Deg);
            if(Time.time<noticeEnd)GUI.Label(new Rect(0,h*.24f,w,40),notice,big);
            if(playing){
                float mark=Time.time<hitFlash?13:7;
                Fill(new Rect(cx-1,h*.5f-mark,2,mark*2),charging?new Color(1,.78f,.38f):Color.white);Fill(new Rect(cx-mark,h*.5f-1,mark*2,2),charging?new Color(1,.78f,.38f):Color.white);
                GUI.Label(new Rect(22,h-52,w*.6f,22),"WASD to walk · Shift to run · Space to jump · hold left mouse to draw, release to loose · M for the map",body);
                Fill(new Rect(22,h-26,110,3),new Color(.9f,.82f,.6f,.3f));Fill(new Rect(22,h-26,110*power,3),new Color(.96f,.75f,.41f));
            }
            if(mapOpen){
                Fill(new Rect(0,0,w,h),new Color(.06f,.1f,.09f,.75f));float size=Mathf.Min(w,h)*.8f;DrawMap(new Rect((w-size)*.5f,(h-size)*.5f-10,size,size),true);
            }else DrawMap(new Rect(w-196,h-196,176,176),false);
            if(playing||mapOpen)return;
            Fill(new Rect(0,0,w,h),new Color(.09f,.13f,.12f,.8f));
            var card=new Rect(w*.5f-280,h*.5f-190,560,380);GUI.Box(card,"");
            GUILayout.BeginArea(new Rect(card.x+28,card.y+22,card.width-56,card.height-44));
            GUILayout.Label("The Seven Bells",title);
            GUILayout.Label("Seven bells sleep across the vale: on the lake isle, the tor, in the deepwood, on the old keep. Walk where you like and wake each one with an arrow. Straw rounds and drifting lanterns are hidden along the way.",body);
            GUILayout.Space(8);
            GUILayout.Label("Mouse looks  ·  W A S D walks  ·  Shift runs  ·  Space jumps\nHold the left mouse button to draw, release to loose\nM opens the map  ·  Esc pauses\n\nVR: left stick walks, right stick turns, grip takes the bow,\nthe other trigger draws the string\nHand tracking: a fist takes the bow, a pinch draws, point to walk",body);
            GUILayout.FlexibleSpace();
            GUILayout.BeginHorizontal();
            if(GUILayout.Button(progress.shots>0?"Return to the vale":"Enter the vale",GUILayout.Height(34),GUILayout.Width(190)))Resume();
            if(GUILayout.Button("Start over",GUILayout.Height(34),GUILayout.Width(120))){
                PlayerPrefs.DeleteKey(SaveKey);PlayerPrefs.Save();
                UnityEngine.SceneManagement.SceneManager.LoadScene(UnityEngine.SceneManagement.SceneManager.GetActiveScene().buildIndex);
            }
            GUILayout.EndHorizontal();GUILayout.EndArea();
        }
    }
}
