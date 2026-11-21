using System.Collections;
using System.Reflection;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;

namespace Brackenford
{
    // Smoke test: enters Play, looses one full-draw arrow at the hamlet bell and checks that it wakes.
    // Run from a terminal with: Unity -batchmode -projectPath <project> -executeMethod Brackenford.PlayCheck.Run
    // It clears saved progress before and after, so do not run it over a game you care about.
    [InitializeOnLoad]
    public static class PlayCheck
    {
        const string Flag="brackenford-playcheck",SaveKey="brackenford-seven-bells-v1";
        static int frames,errors;static float shotAt=-1;
        static PlayCheck()
        {
            if(!SessionState.GetBool(Flag,false))return;
            EditorApplication.update+=Tick;
            Application.logMessageReceived+=(text,stack,type)=>{if(text.Contains("openxr")||stack.Contains("UnityEditor.Search"))return; // headless editor noise, not the game
                if(type==LogType.Error||type==LogType.Exception||type==LogType.Assert){errors++;Debug.Log("PLAYCHECK problem: "+text);}};
        }
        public static void Run()
        {
            PlayerPrefs.DeleteKey(SaveKey);PlayerPrefs.Save();
            SessionState.SetBool(Flag,true);
            EditorSceneManager.OpenScene("Assets/Scenes/SevenBells.unity");
            EditorApplication.EnterPlaymode();
        }
        static object Field(object target,string name)=>target.GetType().GetField(name,BindingFlags.Instance|BindingFlags.NonPublic|BindingFlags.Public).GetValue(target);
        static void Tick()
        {
            if(!EditorApplication.isPlaying)return;
            frames++;
            var game=Object.FindFirstObjectByType<SevenBells>();
            if(game==null){if(frames>600)Finish("no game object");return;}
            if(frames==30){
                var vale=(Vale)Field(game,"vale");var bow=(Transform)Field(game,"bow");var site=vale.Sites[0];
                Vector3 from=bow.position,to=new Vector3(site.x,site.y+3.3f,site.z),flat=new Vector3(to.x-from.x,0,to.z-from.z);
                float d=flat.magnitude,h=to.y-from.y,v=62,g=7,angle=Mathf.Atan((v*v-Mathf.Sqrt(v*v*v*v-g*(g*d*d+2*h*v*v)))/(g*d));
                Vector3 dir=flat.normalized*Mathf.Cos(angle)+Vector3.up*Mathf.Sin(angle);
                game.GetType().GetField("power",BindingFlags.Instance|BindingFlags.NonPublic).SetValue(game,1f);
                game.GetType().GetMethod("Loose",BindingFlags.Instance|BindingFlags.NonPublic).Invoke(game,new object[]{dir,new Vector3(0,0,-.14f)});shotAt=Time.time;
            }
            if(shotAt>=0&&Time.time>shotAt+3){
                var progress=Field(game,"progress");
                int bells=((ICollection)Field(progress,"bells")).Count,shots=(int)Field(progress,"shots"),longest=(int)Field(progress,"longest");
                Finish("bells "+bells+" shots "+shots+" longest "+longest+" renderers "+game.GetComponentsInChildren<Renderer>(true).Length+" errors "+errors,bells==1&&errors==0);
            }
        }
        static void Finish(string report,bool passed=false)
        {
            Debug.Log("PLAYCHECK "+(passed?"PASS ":"FAIL ")+report);
            SessionState.SetBool(Flag,false);PlayerPrefs.DeleteKey(SaveKey);PlayerPrefs.Save();
            EditorApplication.Exit(passed?0:1);
        }
    }
}
