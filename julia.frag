#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 u_resolution;
uniform float u_time;
const float PI = 3.1415926;
uint k = 0x456789abu;
const uint UINT_MAX = 0xffffffffu;
int iter = 10000;
float threashold = 3.0;

vec2 cMul(vec2 z, vec2 w){
    return vec2(z.x*w.x-z.y*w.y, z.x*w.y+z.y*w.x);
}

float julia(vec2 z, vec2 c){
    float value = length(z);
    vec2 current_pos = z;
    int count = 0;

    float dist = length(current_pos);

    for(int i = 0; i < iter ; i++){
        // return 0 if diverge
        if(value > threashold)return .0;
        current_pos = cMul(current_pos, current_pos) + c;
        value = length(current_pos);
        dist = min(dist, length(current_pos));
    }

    return dist;
}

vec3 coloringFractal(int n){
    if(n == 0)return vec3(.0, .0, .0);

    return vec3(1.0);
}

void main(){
    vec2 pos = gl_FragCoord.xy / u_resolution.xy;
    pos -= 0.5;
    pos *= 5.;

    vec2 c = 0.45 * cos(vec2(0.5, 3.9) + u_time * 0.3 * vec2(1.2, 1.7)) - vec2(0.3, 0.0);
    c = vec2(-0.74543+(0.005-0.00000000005*sin(u_time)), 0.11301);

    float julia_dist = julia(pos, c);
    fragColor.rgb = 10.0*vec3(julia_dist);//*(vec3(.0, .0, 2.*julia_dist*cos(u_time)) + vec3(sin(u_time), .0, .0));
    fragColor.rgb *= 4.0;
    fragColor.a = 1.0;
}