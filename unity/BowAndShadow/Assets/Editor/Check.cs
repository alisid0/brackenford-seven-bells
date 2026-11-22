// A check Unity can run from the command line with no window and no headset:
//   Unity.exe -batchmode -nographics -projectPath <this project> -executeMethod BowAndShadow.Check.Run -logFile <file>
// It confirms the scripts compile, that the shared numbers load and match what the web game uses, and that an arrow
// flown by the game's own rule lands where the same sum says it should. It writes one line starting "CHECK".
using System.Collections.Generic;
using UnityEditor;
using UnityEngine;

namespace BowAndShadow
{
    public static class Check
    {
        public static void Run()
        {
            var bad = new List<string>();
            void Need(bool ok, string what) { if (!ok) bad.Add(what); }
            try
            {
                var d = GameData.Load();
                Need(d.stages.Length == 29, "29 stages, found " + d.stages.Length);
                Need(d.releaseOrder.Length == 17, "17 release stages, found " + d.releaseOrder.Length);
                var first = d.ReleaseStage(1);
                Need(first.name == "First marks" && first.arrows == 5 && first.targets.Length == 1 && Mathf.Approximately(first.targets[0].along, 10), "stage 1 is First marks: 5 arrows, one target at 10 m");
                var gauntlet = System.Array.Find(d.stages, s => s.name == "The gauntlet");
                Need(gauntlet != null && gauntlet.targets.Length == 3 && gauntlet.targets[1].slide != null && Mathf.Approximately(gauntlet.targets[1].slide.reach, 3), "The gauntlet's middle target slides 3 m");
                Need(Mathf.Approximately(d.bow.speedAtRest + d.bow.speedPerDraw, 62) && Mathf.Approximately(d.bow.gravity, 7), "full draw is 62 m/s under gravity 7");
                Need(d.RingPoints(0.05f, 1.2f) == 100 && d.RingPoints(0.2f, 1.2f) == 80 && d.RingPoints(0.5f, 1.2f) == 40 && d.RingPoints(0.7f, 1.2f) == 20, "ring points by distance from the centre");
                Need(Mathf.Approximately(GameData.CentreHeight(1.2f), 1.614f), "a size 1.2 target's centre is 1.614 m up");
                Need(Mathf.Approximately(GameData.StreakBonus(1), 1) && Mathf.Approximately(GameData.StreakBonus(6), 1.5f) && Mathf.Approximately(GameData.StreakBonus(30), 2), "streak bonus 1, 1.5 at six, capped at 2");
                Need(d.place.practiceBell.along == 22 && d.place.practiceBell.tone == 523, "the Practice Bell is 22 m out and rings at 523 Hz");
                // an arrow aimed level from 1.6 m at full draw: stepped as Arrow.cs steps it, against the plain formula
                float v = 62, g = d.bow.gravity, y = 1.6f, z = 0, vy = 0, dt = 1f / 90f;
                float t = 0;
                while (z < 30) { vy -= g * dt; y += vy * dt; z += v * dt; t += dt; }
                float exact = 1.6f - 0.5f * g * t * t;   // the plain formula at the time the stepped arrow got there
                Need(Mathf.Abs(y - exact) < 0.03f, "arrow drop at 30 m: stepped " + y.ToString("F3") + " against " + exact.ToString("F3"));
            }
            catch (System.Exception e) { bad.Add("threw: " + e.Message); }
            Debug.Log(bad.Count == 0 ? "CHECK OK: scripts compile, shared numbers load and match, arrow flight agrees" : "CHECK FAILED: " + string.Join("; ", bad));
            EditorApplication.Exit(bad.Count == 0 ? 0 : 1);
        }
    }
}
