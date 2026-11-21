using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Rendering;

namespace Brackenford
{
    // Collects flat-shaded, vertex-coloured triangles. Every triangle is wound to face away from the
    // point it is given, so shapes stay right-side-out whatever order their corners are listed in.
    public sealed class Builder
    {
        readonly List<Vector3> points=new List<Vector3>();
        readonly List<Color> colors=new List<Color>();
        public int Count => points.Count;
        public void Tri(Vector3 a,Vector3 b,Vector3 c,Color color,Vector3 outward)
        {
            if(Vector3.Dot(Vector3.Cross(b-a,c-a),outward)<0){var t=b;b=c;c=t;}
            points.Add(a);points.Add(b);points.Add(c);colors.Add(color);colors.Add(color);colors.Add(color);
        }
        public void TwoSided(Vector3 a,Vector3 b,Vector3 c,Color color)
        {
            var n=Vector3.Cross(b-a,c-a);Tri(a,b,c,color,n);Tri(a,b,c,color,-n);
        }
        // A tapered tube from a to b. A zero radius at either end makes a cone.
        public void Tube(Vector3 a,Vector3 b,float ra,float rb,int sides,Color color,bool capA=true,bool capB=true)
        {
            var axis=(b-a).normalized;
            var u=Vector3.Cross(axis,Mathf.Abs(axis.y)<.9f?Vector3.up:Vector3.right).normalized;
            var w=Vector3.Cross(axis,u);
            for(int i=0;i<sides;i++){
                float t0=i*2*Mathf.PI/sides,t1=(i+1)*2*Mathf.PI/sides,tm=(t0+t1)*.5f;
                Vector3 d0=u*Mathf.Cos(t0)+w*Mathf.Sin(t0),d1=u*Mathf.Cos(t1)+w*Mathf.Sin(t1),dm=u*Mathf.Cos(tm)+w*Mathf.Sin(tm);
                Vector3 a0=a+d0*ra,a1=a+d1*ra,b0=b+d0*rb,b1=b+d1*rb;
                if(ra>0)Tri(a0,a1,b0,color,dm);
                if(rb>0)Tri(a1,b1,b0,color,dm);
                if(capA&&ra>0)Tri(a,a0,a1,color,-axis);
                if(capB&&rb>0)Tri(b,b0,b1,color,axis);
            }
        }
        public void Box(Vector3 centre,Vector3 size,Quaternion turn,Color color)
        {
            Vector3 h=size*.5f;
            Vector3[] axes={turn*Vector3.right,turn*Vector3.up,turn*Vector3.forward};
            float[] half={h.x,h.y,h.z};
            for(int k=0;k<3;k++)for(int side=-1;side<=1;side+=2){
                Vector3 n=axes[k]*side,p=axes[(k+1)%3]*half[(k+1)%3],q=axes[(k+2)%3]*half[(k+2)%3],c=centre+n*half[k];
                Tri(c-p-q,c+p-q,c+p+q,color,n);Tri(c-p-q,c+p+q,c-p+q,color,n);
            }
        }
        static readonly Vector3[] icoPoints=MakeIco();
        static readonly int[] icoFaces={0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1};
        static Vector3[] MakeIco()
        {
            float t=(1+Mathf.Sqrt(5))*.5f;
            var p=new[]{new Vector3(-1,t,0),new Vector3(1,t,0),new Vector3(-1,-t,0),new Vector3(1,-t,0),new Vector3(0,-1,t),new Vector3(0,1,t),new Vector3(0,-1,-t),new Vector3(0,1,-t),new Vector3(t,0,-1),new Vector3(t,0,1),new Vector3(-t,0,-1),new Vector3(-t,0,1)};
            for(int i=0;i<p.Length;i++)p[i]=p[i].normalized;
            return p;
        }
        public void Blob(Vector3 centre,Vector3 scale,Quaternion turn,Color color)
        {
            for(int f=0;f<icoFaces.Length;f+=3){
                Vector3 a=centre+turn*Vector3.Scale(icoPoints[icoFaces[f]],scale),b=centre+turn*Vector3.Scale(icoPoints[icoFaces[f+1]],scale),c=centre+turn*Vector3.Scale(icoPoints[icoFaces[f+2]],scale);
                Tri(a,b,c,color,(a+b+c)/3-centre);
            }
        }
        public Mesh ToMesh(string name)
        {
            var mesh=new Mesh{name=name};
            if(points.Count>65000)mesh.indexFormat=IndexFormat.UInt32;
            var order=new int[points.Count];for(int i=0;i<order.Length;i++)order[i]=i;
            mesh.SetVertices(points);mesh.SetColors(colors);mesh.SetTriangles(order,0);
            mesh.RecalculateNormals();mesh.RecalculateBounds();
            return mesh;
        }
        public GameObject ToObject(string name,Transform parent,Material material)
        {
            var obj=new GameObject(name);obj.transform.SetParent(parent,false);
            obj.AddComponent<MeshFilter>().sharedMesh=ToMesh(name);
            var renderer=obj.AddComponent<MeshRenderer>();renderer.sharedMaterial=material;
            renderer.shadowCastingMode=ShadowCastingMode.Off;renderer.receiveShadows=false;
            return obj;
        }
    }

    public static class Paint
    {
        static Material lit;
        static readonly Dictionary<string,Color> cache=new Dictionary<string,Color>();
        // Vertex colours are not colour-managed, so convert them by hand when the project is linear.
        public static Color Fix(Color c)=>QualitySettings.activeColorSpace==ColorSpace.Linear?c.linear:c;
        public static Color Hex(string hex)
        {
            if(cache.TryGetValue(hex,out var found))return found;
            ColorUtility.TryParseHtmlString("#"+hex,out var c);c=Fix(c);cache.Add(hex,c);return c;
        }
        public static Color Shade(string hex,float amount){var c=Hex(hex);return new Color(c.r*amount,c.g*amount,c.b*amount,1);}
        public static Material Lit
        {
            get{if(lit==null)lit=new Material(Resources.Load<Shader>("BrackenfordLit"));return lit;}
        }
        public static Material Tinted(string hex)
        {
            ColorUtility.TryParseHtmlString("#"+hex,out var c);
            return new Material(Resources.Load<Shader>("BrackenfordLit")){color=c};
        }
        public static Material Glow(Color color,float fog,int queue=3000)
        {
            var m=new Material(Resources.Load<Shader>("BrackenfordGlow")){color=color,renderQueue=queue};
            m.SetFloat("_Fog",fog);return m;
        }
    }
}
