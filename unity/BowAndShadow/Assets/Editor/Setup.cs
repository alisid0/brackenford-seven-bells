// One-off project set-up, run from the command line:
//   Unity.exe -batchmode -nographics -projectPath <this project> -executeMethod BowAndShadow.Setup.Run -logFile <file>
// It makes the one scene the project needs (empty: the range builds itself when the game starts) and puts it in the
// build list, so opening the project and pressing Play works.
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;

namespace BowAndShadow
{
    public static class Setup
    {
        // A Windows build, to prove the game runs outside the editor: -executeMethod BowAndShadow.Setup.BuildWindows
        public static void BuildWindows()
        {
            var report = BuildPipeline.BuildPlayer(new[] { "Assets/Scenes/Range.unity" }, "Builds/Windows/BowAndShadow.exe", BuildTarget.StandaloneWindows64, BuildOptions.None);
            bool ok = report.summary.result == UnityEditor.Build.Reporting.BuildResult.Succeeded;
            Debug.Log(ok ? "BUILD OK: " + report.summary.totalSize + " bytes" : "BUILD FAILED: " + report.summary.result);
            EditorApplication.Exit(ok ? 0 : 1);
        }

        public static void Run()
        {
            const string path = "Assets/Scenes/Range.unity";
            System.IO.Directory.CreateDirectory("Assets/Scenes");
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            bool saved = EditorSceneManager.SaveScene(scene, path);
            EditorBuildSettings.scenes = new[] { new EditorBuildSettingsScene(path, true) };
            // the one material every shape is drawn with, as a project asset so its shader is packed into builds
            System.IO.Directory.CreateDirectory("Assets/Resources");
            if (AssetDatabase.LoadAssetAtPath<Material>("Assets/Resources/Flat.mat") == null)
            {
                var flat = new Material(Shader.Find("Standard"));
                flat.SetFloat("_Glossiness", 0f);
                AssetDatabase.CreateAsset(flat, "Assets/Resources/Flat.mat");
            }
            PlayerSettings.productName = "Bow & Shadow";
            PlayerSettings.companyName = "Brackenford";
            AssetDatabase.SaveAssets();
            Debug.Log(saved ? "SETUP OK: " + path : "SETUP FAILED: could not save " + path);
            EditorApplication.Exit(saved ? 0 : 1);
        }
    }
}
