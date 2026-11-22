// The bow on a flat screen, for testing without a headset: move the mouse to look, hold the left button to draw
// (a full draw takes one second), let go to loose. Letting go between 0.85 and 1.3 seconds is a perfect release,
// as in the web game. The headset rig will replace this; the arrow and the range do not change.
using UnityEngine;

namespace BowAndShadow
{
    public class DesktopBow : MonoBehaviour
    {
        public Range range;
        Camera eye;
        float yaw, pitch, held = -1;

        void Start()
        {
            eye = Camera.main;
            if (eye == null) { eye = new GameObject("Eye").AddComponent<Camera>(); eye.tag = "MainCamera"; eye.gameObject.AddComponent<AudioListener>(); }
            eye.transform.position = new Vector3(0, 1.6f, 0);
            eye.clearFlags = CameraClearFlags.SolidColor; eye.backgroundColor = Palette.Sky; eye.fieldOfView = 62; eye.nearClipPlane = 0.05f; eye.farClipPlane = 800;
            Cursor.lockState = CursorLockMode.Locked;
        }

        public float Draw => held < 0 ? 0 : Mathf.Clamp01((Time.time - held) / 1f);

        void Update()
        {
            if (Input.GetKeyDown(KeyCode.Escape)) Cursor.lockState = CursorLockMode.None;
            if (Input.GetMouseButtonDown(0) && Cursor.lockState != CursorLockMode.Locked) { Cursor.lockState = CursorLockMode.Locked; return; }
            if (Cursor.lockState == CursorLockMode.Locked)
            {
                yaw += Input.GetAxis("Mouse X") * 2.2f; pitch = Mathf.Clamp(pitch - Input.GetAxis("Mouse Y") * 2.2f, -80, 80);
                eye.transform.rotation = Quaternion.Euler(pitch, yaw, 0);
            }
            if (Input.GetMouseButtonDown(0) && range.CanLoose) held = Time.time;
            if (Input.GetMouseButtonUp(0) && held >= 0)
            {
                float draw = Draw, time = Time.time - held; held = -1;
                if (draw >= 0.1f && range.CanLoose) Loose(draw, time >= 0.85f && time <= 1.3f);
            }
        }

        void Loose(float draw, bool perfect)
        {
            var bow = range.Data.bow;
            var go = new GameObject("Arrow");
            Shapes.Box(go.transform, new Vector3(0, 0, -0.35f), new Vector3(0.018f, 0.018f, 0.7f), Palette.TimberLight, false);
            Shapes.Box(go.transform, new Vector3(0, 0, -0.66f), new Vector3(0.05f, 0.004f, 0.1f), Palette.Cream, false);
            go.transform.position = eye.transform.position + eye.transform.forward * 0.6f - eye.transform.up * 0.08f;
            var a = go.AddComponent<Arrow>();
            a.range = range; a.origin = go.transform.position; a.perfect = perfect;
            a.velocity = eye.transform.forward * (bow.speedAtRest + draw * bow.speedPerDraw);
            range.ArrowLoosed();
        }

        void OnGUI()
        {
            float d = Draw; if (d <= 0) return;
            float w = 220, x = (Screen.width - w) / 2, y = Screen.height - 90;
            GUI.color = new Color(0, 0, 0, 0.5f); GUI.DrawTexture(new Rect(x, y, w, 10), Texture2D.whiteTexture);
            float t = Time.time - held; GUI.color = t >= 0.85f && t <= 1.3f ? Color.white : Palette.Gold;
            GUI.DrawTexture(new Rect(x, y, w * d, 10), Texture2D.whiteTexture); GUI.color = Color.white;
        }
    }
}
