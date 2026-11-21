// Matte lit surface tinted by vertex colour. Used for the terrain, trees and every solid prop.
Shader "Brackenford/Lit"
{
    Properties { _Color ("Color", Color) = (1,1,1,1) }
    SubShader
    {
        Tags { "RenderType"="Opaque" }
        LOD 200
        CGPROGRAM
        #pragma surface surf Lambert noforwardadd
        #pragma target 3.0
        struct Input { float4 color : COLOR; };
        fixed4 _Color;
        void surf (Input IN, inout SurfaceOutput o)
        {
            o.Albedo = _Color.rgb * IN.color.rgb;
            o.Alpha = 1;
        }
        ENDCG
    }
    FallBack "Diffuse"
}
