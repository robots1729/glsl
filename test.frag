#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 u_resolution;
uniform float u_time;
const float PI = 3.1415926;
uint k = 0x456789abu;
const uint UINT_MAX = 0xffffffffu;

uniform sampler2D iChannel0;

void main(out vec4 fragColor,in vec2 fragCoord)
{
    vec2 uv=gl_fragCoord.xy/u_resolution.xy;

    vec4 col = texture2D(iChannel0, uv);

    fragColor=col;
}