// The numbers both versions of the game share. They are set in the web game (src/game.js) and written to
// shared/game-data.json by tools/export-data.mjs; a copy lives in Assets/StreamingAssets. This class only reads them.
// JsonUtility cannot read lists inside lists or free-form objects, so the shades' paths and the ribbon table are
// not read here yet; everything a ring-target stage needs is.
using System;
using System.IO;
using UnityEngine;

namespace BowAndShadow
{
    [Serializable] public class BowData { public float speedAtRest = 24, speedPerDraw = 38, gravity = 7, windPush = 1.4f; }
    [Serializable] public class RingScore { public float within; public int points; }
    [Serializable] public class ScoringData { public RingScore[] rings; public float[] starAt; public float perfectRelease = 1.25f; }
    [Serializable] public class SlideData { public float reach, rate; }
    [Serializable] public class PopData { public float up, down, offset; }
    [Serializable] public class TargetData { public float along, right, size = 1.2f; public SlideData slide; public PopData pop; }
    [Serializable] public class StageData { public int id; public string name; public int arrows; public float[] wind; public TargetData[] targets; }
    [Serializable] public class BellData { public float along = 22, right = 12.5f, tone = 523; }
    [Serializable] public class PlaceData { public string name; public BellData practiceBell; }

    [Serializable]
    public class GameData
    {
        public string title;
        public int[] releaseOrder;
        public BowData bow;
        public ScoringData scoring;
        public PlaceData place;
        public StageData[] stages;

        static GameData loaded;

        public static GameData Load()
        {
            if (loaded != null) return loaded;
            string path = Path.Combine(Application.streamingAssetsPath, "game-data.json");
            if (!File.Exists(path)) throw new FileNotFoundException("game-data.json is missing from StreamingAssets. Run tools/export-data.mjs and copy shared/game-data.json there.", path);
            loaded = JsonUtility.FromJson<GameData>(File.ReadAllText(path));
            return loaded;
        }

        // the stage played at a place in the release order (1 is the first)
        public StageData ReleaseStage(int place)
        {
            int id = releaseOrder[Mathf.Clamp(place - 1, 0, releaseOrder.Length - 1)];
            return Array.Find(stages, s => s.id == id);
        }

        // a ring target's centre height and outer radius, as the web game sets them
        public static float CentreHeight(float size) => 0.75f + 0.72f * size;
        public static float OuterRadius(float size) => 0.68f * size;

        public int RingPoints(float metresFromCentre, float size)
        {
            float r = metresFromCentre / size;
            foreach (var ring in scoring.rings) if (r < ring.within) return ring.points;
            return 20;
        }

        public static float StreakBonus(int streak) => Mathf.Min(2f, 1f + 0.1f * (streak - 1));
    }
}
