#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 u_resolution;
uniform float u_time;
const float PI = 3.1415926;
uint k = 0x456789abu;
const uint UINT_MAX = 0xffffffffu;

uint uhash11(uint n){
    uint m =n;
    m ^= (m << 1);
    m ^= (m >> 1);
    m *= k;
    m ^= (m << 1);
    return m*k;
}

float hash11(float n){
    uint m = floatBitsToUint(n);
    return float(uhash11(m))/float(uhash11(UINT_MAX));
}

float atan2(float y, float x){
    return x==0.0 ? sign(y)*PI/2.0 : atan(y, x);
}

vec2 xyToPol(vec2 xy){
    return vec2(atan2(xy.y, xy.x), length(xy));
}

vec2 polToXy(vec2 pol){
    return pol.y*vec2(sin(pol.x), cos(pol.x));
}

float fractSin11(float x){
    return fract(1000.0*x);
}

float fractSin21(vec2 xy){
    return fract(sin(dot(xy, vec2(12.9898, 78.233)))*43758.5453123);
}

vec3 tex(vec2 st){
    float time = u_time * 1.0;
    vec3 circ = vec3(polToXy(vec2(time, 0.5))+vec2(0.5), 1.0);

    vec3[3] col3 = vec3[](
        circ.rgb,
        circ.gbr,
        circ.bgr
    );

    st.s = st.s/PI + 1.0;
    st.s += time;
    int ind = int(st.s);

    vec3 col = mix(col3[ind%2], col3[(ind+1)%2], fract(st.s));
    return mix(col3[2], col, st.t);
}

void main(){
    float time = 60.0 * u_time;
    vec2 pos = gl_FragCoord.xy + time;
    fragColor.rgb = vec3(hash11(pos.x));
    fragColor.a = 1.0;
}