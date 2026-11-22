// An arrow in flight. It moves by the web game's own rule, not by Unity's physics: speed set at the string,
// the game's gravity (7 m/s2, not 9.81) pulling it down, the wind pushing it sideways, and a ray cast along each
// step so a fast arrow cannot pass through a thin target.
using UnityEngine;

namespace BowAndShadow
{
    public class Arrow : MonoBehaviour
    {
        public Vector3 velocity;
        public Vector3 origin;
        public bool perfect;
        public Range range;
        bool done;
        float life;

        void Update()
        {
            if (done) return;
            float dt = Mathf.Min(Time.deltaTime, 0.05f);
            life += dt;
            var bow = range.Data.bow;
            velocity.y -= bow.gravity * dt;
            velocity += range.Right * (range.Wind * bow.windPush * dt);
            Vector3 step = velocity * dt;
            float distance = step.magnitude;
            if (distance > 0.0001f)
            {
                transform.rotation = Quaternion.LookRotation(velocity);
                if (Physics.Raycast(transform.position, step / distance, out RaycastHit hit, distance + 0.01f))
                {
                    transform.position = hit.point;
                    Land(hit);
                    return;
                }
                transform.position += step;
            }
            if (transform.position.y < -5f || life > 12f) { done = true; range.ArrowMissed(this); Destroy(gameObject, 0.1f); }
        }

        void Land(RaycastHit hit)
        {
            done = true;
            var target = hit.collider.GetComponentInParent<RingTarget>();
            var bell = hit.collider.GetComponentInParent<PracticeBell>();
            if (target != null) { transform.SetParent(target.transform, true); range.ArrowHit(this, target, hit.point); }
            else if (bell != null) { bell.Struck(); range.ArrowSpent(this); Destroy(gameObject, 0.05f); return; }
            else range.ArrowMissed(this);
            Destroy(gameObject, 20f);
        }
    }
}
