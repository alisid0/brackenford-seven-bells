using UnityEditor;
using UnityEditor.XR.OpenXR.Features;
using UnityEngine;
using UnityEngine.XR.OpenXR;

namespace Brackenford
{
    // Turns on the OpenXR "Hand Tracking Subsystem" feature (from the XR Hands package) for desktop builds,
    // so the game's hand tracking works without a trip through Project Settings.
    // Also on the menu as Brackenford > Enable hand tracking.
    [InitializeOnLoad]
    public static class HandSetup
    {
        static HandSetup(){EditorApplication.delayCall+=()=>Run();}

        [MenuItem("Brackenford/Enable hand tracking")]
        public static void Run()
        {
            FeatureHelpers.RefreshFeatures(BuildTargetGroup.Standalone);
            var settings=OpenXRSettings.GetSettingsForBuildTargetGroup(BuildTargetGroup.Standalone);
            if(settings==null){Debug.Log("HANDSETUP no OpenXR settings for Standalone");return;}
            foreach(var feature in settings.GetFeatures()){
                if(feature==null||feature.GetType().FullName!="UnityEngine.XR.Hands.OpenXR.HandTracking")continue;
                if(!feature.enabled){feature.enabled=true;EditorUtility.SetDirty(feature);EditorUtility.SetDirty(settings);AssetDatabase.SaveAssets();Debug.Log("HANDSETUP enabled hand tracking");}
                else Debug.Log("HANDSETUP hand tracking already enabled");
                return;
            }
            Debug.Log("HANDSETUP hand tracking feature not found");
        }
    }
}
