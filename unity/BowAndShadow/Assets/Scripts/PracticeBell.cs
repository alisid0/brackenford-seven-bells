// The Practice Bell of The Silent Peal, as plain shapes until the exported belfry is imported: a forked timber
// frame 3.2 m tall and a bronze bell that swings and rings when an arrow strikes it. Its note is made in code.
using UnityEngine;

namespace BowAndShadow
{
    public class PracticeBell : MonoBehaviour
    {
        Transform pivot;
        float rungAt = -99;
        AudioSource voice;

        public static PracticeBell Build(Range range, float along, float right, float tone)
        {
            var go = new GameObject("Practice Bell");
            go.transform.position = range.At(along, right, 0);
            go.transform.rotation = Quaternion.LookRotation(-go.transform.position.normalized);   // turned toward the archer
            var b = go.AddComponent<PracticeBell>();
            foreach (float s in new[] { -1f, 1f })
            {
                Shapes.Cylinder(go.transform, new Vector3(s * 0.72f, 1.26f, 0), 0.1f, 2.52f, Palette.Timber, false);
                var horn = Shapes.Cylinder(go.transform, new Vector3(s * 0.9f, 2.82f, 0), 0.075f, 0.9f, Palette.Timber, false);
                horn.transform.localRotation = Quaternion.Euler(0, 0, -s * 28);
                var inner = Shapes.Cylinder(go.transform, new Vector3(s * 0.52f, 2.8f, 0), 0.075f, 0.8f, Palette.Timber, false);
                inner.transform.localRotation = Quaternion.Euler(0, 0, s * 24);
            }
            Shapes.Box(go.transform, new Vector3(0, 2.3f, 0), new Vector3(1.72f, 0.16f, 0.16f), Palette.Timber, false);
            b.pivot = new GameObject("Bell").transform;
            b.pivot.SetParent(go.transform, false); b.pivot.localPosition = new Vector3(0, 2.2f, 0);
            Shapes.Cylinder(b.pivot, new Vector3(0, -0.5f, 0), 0.3f, 0.72f, Palette.Bronze, true);
            Shapes.Cylinder(b.pivot, new Vector3(0, -0.84f, 0), 0.335f, 0.08f, Palette.Gold, false);   // the gold lip
            b.voice = go.AddComponent<AudioSource>();
            b.voice.spatialBlend = 1; b.voice.maxDistance = 120; b.voice.rolloffMode = AudioRolloffMode.Linear;
            b.voice.clip = Tone(tone);
            return b;
        }

        // the web game's bell: the note with two quieter overtones, each dying away
        static AudioClip Tone(float f)
        {
            const int rate = 44100; int n = (int)(rate * 2.2f); var data = new float[n];
            for (int i = 0; i < n; i++)
            {
                float t = i / (float)rate;
                data[i] = 0.5f * Mathf.Sin(2 * Mathf.PI * f * t) * Mathf.Exp(-2.2f * t)
                        + 0.22f * Mathf.Sin(2 * Mathf.PI * f * 1.49f * t) * Mathf.Exp(-3f * t)
                        + 0.12f * Mathf.Sin(2 * Mathf.PI * f * 2.27f * t) * Mathf.Exp(-5f * t);
            }
            var clip = AudioClip.Create("bell", n, 1, rate, false); clip.SetData(data, 0); return clip;
        }

        public void Struck() { rungAt = Time.time; voice.Play(); }

        void Update()
        {
            float age = Time.time - rungAt;
            pivot.localRotation = Quaternion.Euler(0, 0, age < 3 ? Mathf.Exp(-1.3f * age) * Mathf.Sin(age * 6) * 25f : 0);
        }
    }
}
