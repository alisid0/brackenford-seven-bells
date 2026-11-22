// The first range, built in code when the game starts, so any scene (even an empty one) plays. It holds the
// stage being shot, the score and the wind, and turns "metres along the lane, metres to the right" into places.
// First milestone: one range, the bow, ring targets from the shared stage numbers, and the Practice Bell.
// Not here yet: shades, Bell Watch, menus, saves, the headset rig.
using System.Collections.Generic;
using UnityEngine;

namespace BowAndShadow
{
    public class Range : MonoBehaviour
    {
        public GameData Data { get; private set; }
        public StageData Stage { get; private set; }
        public Vector3 Forward => Vector3.forward;      // down the lane
        public Vector3 Right => Vector3.right;          // to the archer's right
        public float Wind { get; private set; }
        public int Score { get; private set; }
        public int Streak { get; private set; }
        public int ArrowsLeft { get; private set; }
        public int Hits { get; private set; }
        public bool Finished { get; private set; }
        public int Stars { get; private set; }
        public string Last { get; private set; } = "";

        int place = 1;
        float ideal;
        readonly List<RingTarget> targets = new List<RingTarget>();
        PracticeBell bell;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        static void Begin()
        {
            if (FindFirstObjectByType<Range>() != null) return;
            new GameObject("Range").AddComponent<Range>();
        }

        public Vector3 At(float along, float right, float up) => Forward * along + Right * right + Vector3.up * up;

        void Awake()
        {
            Data = GameData.Load();
            BuildWorld();
            gameObject.AddComponent<DesktopBow>().range = this;
            SetStage(1);
            // "-shot <file>" on the command line: take one picture two seconds in and quit (used to prove a build runs)
            var args = System.Environment.GetCommandLineArgs();
            int k = System.Array.IndexOf(args, "-shot");
            if (k >= 0 && k + 1 < args.Length) StartCoroutine(Shot(args[k + 1]));
        }

        System.Collections.IEnumerator Shot(string file)
        {
            yield return new WaitForSeconds(2f);
            ScreenCapture.CaptureScreenshot(file);
            yield return new WaitForSeconds(1f);
            Application.Quit();
        }

        void BuildWorld()
        {
            RenderSettings.ambientMode = UnityEngine.Rendering.AmbientMode.Flat;
            RenderSettings.ambientLight = new Color(0.62f, 0.66f, 0.74f);
            var sun = new GameObject("Sun").AddComponent<Light>();
            sun.type = LightType.Directional; sun.color = Palette.Hex("#FFD1A0"); sun.intensity = 1.25f; sun.shadows = LightShadows.None;
            sun.transform.rotation = Quaternion.Euler(22, 135, 0);   // ChatGPT's late-afternoon sun: 22 degrees up, from the archer's left
            Shapes.Box(transform, new Vector3(0, -0.5f, 40), new Vector3(400, 1, 400), Palette.Meadow);
            Shapes.Box(transform, new Vector3(0, 0.005f, 36.5f), new Vector3(16, 0.01f, 79), Palette.Lawn, false);          // the lane, 16 m wide
            Shapes.Box(transform, new Vector3(0, 0.02f, 38), new Vector3(60, 0.02f, 2.4f), Palette.Water, false);           // the creek at 38 m
            for (int i = 0; i < 8; i++) Shapes.Box(transform, new Vector3(-1.4f + i * 0.4f, 0.03f, -0.35f), new Vector3(0.37f, 0.06f, 2.6f), i % 2 == 0 ? Palette.Timber : Palette.TimberLight, false);   // the deck
            foreach (float x in new[] { -3f, -1f, 1f, 3f }) Shapes.Cylinder(transform, new Vector3(x, 0.45f, 0.9f), 0.06f, 0.9f, Palette.Timber, false);
            foreach (float y in new[] { 0.85f, 0.45f }) Shapes.Box(transform, new Vector3(0, y, 0.9f), new Vector3(6, 0.07f, 0.07f), Palette.Timber, false);   // the rail
            var b = Data.place.practiceBell;
            bell = PracticeBell.Build(this, b.along, b.right, b.tone);
        }

        public void SetStage(int placeInOrder)
        {
            place = Mathf.Clamp(placeInOrder, 1, Data.releaseOrder.Length);
            Stage = Data.ReleaseStage(place);
            foreach (var t in targets) Destroy(t.gameObject);
            targets.Clear();
            float far = 0;
            foreach (var d in Stage.targets) { targets.Add(RingTarget.Build(this, d)); far += d.along; }
            ArrowsLeft = Stage.arrows; Score = 0; Streak = 0; Hits = 0; Finished = false; Stars = 0; Last = "";
            // the web game's "ideal": every arrow a bullseye at the stage's mean distance, without the streak bonus
            ideal = Stage.targets.Length > 0 ? Stage.arrows * (100 + far / Stage.targets.Length) : 1;
        }

        void Update()
        {
            float w0 = Stage.wind != null && Stage.wind.Length > 0 ? Stage.wind[0] : 0, w1 = Stage.wind != null && Stage.wind.Length > 1 ? Stage.wind[1] : 0;
            Wind = w0 + w1 * Mathf.Sin(Time.time * 0.55f) * Mathf.Sin(Time.time * 0.21f + 1);
            if (Input.GetKeyDown(KeyCode.N) && Finished && Stars > 0) SetStage(place + 1);
            if (Input.GetKeyDown(KeyCode.R)) SetStage(place);
            if (Input.GetKeyDown(KeyCode.B)) SetStage(place - 1);
        }

        public bool CanLoose => !Finished && ArrowsLeft > 0;
        public void ArrowLoosed() { ArrowsLeft--; }

        public void ArrowHit(Arrow arrow, RingTarget target, Vector3 at)
        {
            Vector3 local = target.transform.InverseTransformPoint(at) - new Vector3(0, GameData.CentreHeight(target.data.size), 0);
            float off = new Vector2(local.x, local.y).magnitude;
            if (off > GameData.OuterRadius(target.data.size)) { ArrowMissed(arrow); return; }   // the collider is square; the corners are not target
            int ring = Data.RingPoints(off, target.data.size), distance = Mathf.RoundToInt(Vector3.Distance(arrow.origin, at));
            Streak++; Hits++;
            int points = Mathf.RoundToInt((ring + distance) * GameData.StreakBonus(Streak) * (arrow.perfect ? Data.scoring.perfectRelease : 1f));
            Score += points;
            Last = (ring == 100 ? "Bullseye  ·  " : "") + (arrow.perfect ? "Perfect release  ·  " : "") + "+" + points + (Streak > 1 ? "  ·  streak " + Streak : "");
            Spent();
        }

        public void ArrowMissed(Arrow arrow) { Streak = 0; Last = "Miss"; Spent(); }
        public void ArrowSpent(Arrow arrow) { Spent(); }   // an arrow that rang the bell: neither hit nor miss

        void Spent()
        {
            if (ArrowsLeft > 0 || Finished || FindObjectsByType<Arrow>(FindObjectsSortMode.None).Length > 1) return;
            Finished = true;
            float share = Score / ideal;
            var at = Data.scoring.starAt;
            Stars = share >= at[2] ? 3 : share >= at[1] ? 2 : share >= at[0] ? 1 : 0;
        }

        void OnGUI()
        {
            var style = new GUIStyle(GUI.skin.label) { fontSize = 22, richText = true };
            style.normal.textColor = Color.white;
            string top = "Stage " + place + " of " + Data.releaseOrder.Length + "  ·  " + Stage.name + "      Arrows " + ArrowsLeft + "      Score " + Score + "      Streak " + Streak
                + "      Wind " + (Mathf.Abs(Wind) < 0.5f ? "still" : Mathf.RoundToInt(Mathf.Abs(Wind)) + (Wind > 0 ? " →" : " ←"));
            GUI.Label(new Rect(20, 14, Screen.width - 40, 34), top, style);
            GUI.Label(new Rect(20, 46, Screen.width - 40, 34), Last, style);
            if (Finished)
                GUI.Label(new Rect(20, 84, Screen.width - 40, 70), (Stars > 0 ? "Stage clear  ·  " + new string('★', Stars) + new string('☆', 3 - Stars) + "      N next" : "Not enough") + "      R again      B back", style);
            GUI.Label(new Rect(20, Screen.height - 44, Screen.width - 40, 34), "Hold the left mouse button to draw, let go to loose  ·  move the mouse to aim  ·  Esc frees the mouse", style);
        }
    }
}
