// A ring target on a post: built from plain shapes in the game's colours, sized and placed from the shared stage
// numbers. Slides side to side if its stage says so. Faces back down the lane toward the archer.
using UnityEngine;

namespace BowAndShadow
{
    public class RingTarget : MonoBehaviour
    {
        public TargetData data;
        public Range range;
        Transform face;
        float clock;

        public Vector3 Centre => face.position;

        public static RingTarget Build(Range range, TargetData data)
        {
            var go = new GameObject("Target " + data.along + " m");
            var t = go.AddComponent<RingTarget>();
            t.range = range; t.data = data;
            go.transform.position = range.At(data.along, data.right, 0);
            go.transform.rotation = Quaternion.LookRotation(-range.Forward);
            float h = GameData.CentreHeight(data.size), outer = GameData.OuterRadius(data.size);
            Shapes.Cylinder(go.transform, new Vector3(0, h / 2, -0.06f), 0.05f, h, Palette.Timber, false);   // the post, behind the face
            var face = new GameObject("Face").transform;
            face.SetParent(go.transform, false); face.localPosition = new Vector3(0, h, 0);
            // straw rim, cream, red, cream, gold centre: the game's rings, widest first, each a thin disc in front of the last
            float[] radius = { 1f, 0.735f, 0.545f, 0.34f, 0.147f };
            Color[] colour = { Palette.Straw, Palette.Cream, Palette.Red, Palette.Cream, Palette.Gold };
            for (int i = 0; i < radius.Length; i++)
                Shapes.Disc(face, new Vector3(0, 0, 0.01f * (i + 1)), outer * radius[i], 0.02f, colour[i], i == 0);
            t.face = face;
            return t;
        }

        void Update()
        {
            if (data.slide == null || data.slide.reach <= 0) return;
            clock += Time.deltaTime;
            transform.position = range.At(data.along, data.right + data.slide.reach * Mathf.Sin(clock * data.slide.rate), 0);
        }
    }
}
