using System.Text;
using UnityEditor;
using UnityEngine;

namespace Brackenford
{
    // Brackenford > Check the vale: builds the world without entering Play and logs what it placed,
    // so the Unity world can be compared with the browser build. Also runnable with -executeMethod.
    public static class ValeCheck
    {
        [MenuItem("Brackenford/Check the vale")]
        public static void Run()
        {
            var root=new GameObject("Vale check");
            try{
                var vale=new Vale(root.transform);
                var report=new StringBuilder("VALECHECK ");
                foreach(var s in vale.Sites)report.Append(s.id).Append('=').Append(s.y.ToString("F2")).Append(' ');
                report.Append("| straw ").Append(vale.Straw.Count);
                for(int i=3;i<6&&i<vale.Straw.Count;i++)report.Append(" (").Append(vale.Straw[i].x.ToString("F1")).Append(',').Append(vale.Straw[i].y.ToString("F1")).Append(')');
                report.Append(" | lanterns ").Append(vale.Lanterns.Count);
                if(vale.Lanterns.Count>0)report.Append(" (").Append(vale.Lanterns[0].cx.ToString("F1")).Append(',').Append(vale.Lanterns[0].cz.ToString("F1")).Append(',').Append(vale.Lanterns[0].r.ToString("F2")).Append(')');
                report.Append(" | deer ").Append(vale.Deer.Count).Append(" | meshes ").Append(root.GetComponentsInChildren<MeshFilter>().Length);
                foreach(var name in new[]{"BrackenfordLit","BrackenfordGlow"}){
                    var shader=Resources.Load<Shader>(name);
                    report.Append(" | ").Append(name).Append(shader==null?" missing":ShaderUtil.ShaderHasError(shader)?" has errors":" ok");
                }
                Debug.Log(report.ToString());
            }finally{Object.DestroyImmediate(root);}
        }
    }
}
