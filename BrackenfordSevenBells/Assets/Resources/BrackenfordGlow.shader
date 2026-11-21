// Unlit, alpha blended, tinted by vertex colour. Used for the sky, sun, clouds, water, beacons and lanterns.
// _Fog 1 fades with scene fog, 0 ignores it.
Shader "Brackenford/Glow"
{
    Properties
    {
        _Color ("Color", Color) = (1,1,1,1)
        _Fog ("Fog", Range(0,1)) = 1
    }
    SubShader
    {
        Tags { "Queue"="Transparent" "RenderType"="Transparent" "IgnoreProjector"="True" }
        Blend SrcAlpha OneMinusSrcAlpha
        ZWrite Off
        Cull Off
        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma multi_compile_fog
            #pragma multi_compile_instancing
            #include "UnityCG.cginc"
            struct appdata
            {
                float4 vertex : POSITION;
                fixed4 color : COLOR;
                UNITY_VERTEX_INPUT_INSTANCE_ID
            };
            struct v2f
            {
                float4 pos : SV_POSITION;
                fixed4 color : COLOR;
                UNITY_FOG_COORDS(0)
                UNITY_VERTEX_OUTPUT_STEREO
            };
            fixed4 _Color;
            float _Fog;
            v2f vert (appdata v)
            {
                v2f o;
                UNITY_SETUP_INSTANCE_ID(v);
                UNITY_INITIALIZE_OUTPUT(v2f, o);
                UNITY_INITIALIZE_VERTEX_OUTPUT_STEREO(o);
                o.pos = UnityObjectToClipPos(v.vertex);
                o.color = v.color * _Color;
                UNITY_TRANSFER_FOG(o, o.pos);
                return o;
            }
            fixed4 frag (v2f i) : SV_Target
            {
                fixed4 c = i.color;
                fixed4 fogged = c;
                UNITY_APPLY_FOG(i.fogCoord, fogged);
                c.rgb = lerp(c.rgb, fogged.rgb, _Fog);
                return c;
            }
            ENDCG
        }
    }
}
