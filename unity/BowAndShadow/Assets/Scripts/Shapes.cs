// Plain shapes and the locked palette, so the first scene can be built in code with no imported art. Gemini's
// exported props (assets/glb) replace these shapes once they are imported.
using UnityEngine;

namespace BowAndShadow
{
    public static class Palette
    {
        public static readonly Color Lawn = Hex("#99B44E"), Meadow = Hex("#91A454"), Timber = Hex("#825435"), TimberLight = Hex("#b9763a"),
            Cream = Hex("#F6E6BD"), Red = Hex("#b3202f"), Gold = Hex("#F0C75A"), Straw = Hex("#d9b56a"), Plum = Hex("#4A2943"),
            Iron = Hex("#3B3538"), Bronze = Hex("#AE783E"), Sky = Hex("#7798BD"), Water = Hex("#648FA7");

        public static Color Hex(string hex) { ColorUtility.TryParseHtmlString(hex, out Color c); return c; }
    }

    public static class Shapes
    {
        static Material flat;

        public static Material Flat(Color colour)
        {
            // Assets/Resources/Flat.mat is a real material in the project (made by Setup.Run), so its shader is packed into
            // a built game. A material made from a shader found by name, or from the default material, is not: the first
            // builds drew nothing, then drew everything magenta.
            if (flat == null) flat = Resources.Load<Material>("Flat");
            if (flat == null) throw new System.Exception("Assets/Resources/Flat.mat is missing; run BowAndShadow.Setup.Run");
            var m = new Material(flat) { color = colour };
            if (m.HasProperty("_Glossiness")) m.SetFloat("_Glossiness", 0f);
            if (m.HasProperty("_Smoothness")) m.SetFloat("_Smoothness", 0f);
            if (m.HasProperty("_BaseColor")) m.SetColor("_BaseColor", colour);
            return m;
        }

        static GameObject Make(PrimitiveType type, Transform parent, Vector3 at, Vector3 scale, Color colour, bool solid)
        {
            var go = GameObject.CreatePrimitive(type);
            go.transform.SetParent(parent, false);
            go.transform.localPosition = at; go.transform.localScale = scale;
            go.GetComponent<Renderer>().sharedMaterial = Flat(colour);
            if (!solid) Object.Destroy(go.GetComponent<Collider>());
            return go;
        }

        public static GameObject Box(Transform parent, Vector3 at, Vector3 size, Color colour, bool solid = true) => Make(PrimitiveType.Cube, parent, at, size, colour, solid);

        // an upright cylinder of the given radius and height
        public static GameObject Cylinder(Transform parent, Vector3 at, float radius, float height, Color colour, bool solid = true)
            => Make(PrimitiveType.Cylinder, parent, at, new Vector3(radius * 2, height / 2, radius * 2), colour, solid);

        // a disc facing along the parent's z axis
        public static GameObject Disc(Transform parent, Vector3 at, float radius, float thickness, Color colour, bool solid)
        {
            var go = Make(PrimitiveType.Cylinder, parent, at, new Vector3(radius * 2, thickness / 2, radius * 2), colour, false);
            go.transform.localRotation = Quaternion.Euler(90, 0, 0);
            if (solid)
            {   // one thin box collider the size of the whole face, so the ray test is exact enough and cheap
                var c = go.AddComponent<BoxCollider>();
                c.size = new Vector3(1, 1, 1);
            }
            return go;
        }
    }
}
