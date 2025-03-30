#version 300 es
precision highp float;
precision highp int;
out vec4 fragColor;
uniform float u_time;
uniform vec2 u_resolution;
int channel;

#define rot(a) mat2(cos(a),sin(a),-sin(a),cos(a))

//start hash
uvec3 k = uvec3(0x456789abu, 0x6789ab45u, 0x89ab4567u);
uvec3 u = uvec3(1, 2, 3);
const uint UINT_MAX = 0xffffffffu;

uint uhash11(uint n){
    n ^= (n << u.x);
    n ^= (n >> u.x);
    n *= k.x;
    n ^= (n << u.x);
    return n * k.x;
}
uvec2 uhash22(uvec2 n){
    n ^= (n.yx << u.xy);
    n ^= (n.yx >> u.xy);
    n *= k.xy;
    n ^= (n.yx << u.xy);
    return n * k.xy;
}
uvec3 uhash33(uvec3 n){
    n ^= (n.yzx << u);
    n ^= (n.yzx >> u);
    n *= k;
    n ^= (n.yzx << u);
    return n * k;
}
float hash11(float p){
    uint n = floatBitsToUint(p);
    return float(uhash11(n)) / float(UINT_MAX);
}
float hash21(vec2 p){
    uvec2 n = floatBitsToUint(p);
    return float(uhash22(n).x) / float(UINT_MAX);
}
float hash31(vec3 p){
    uvec3 n = floatBitsToUint(p);
    return float(uhash33(n).x) / float(UINT_MAX);
}
vec2 hash22(vec2 p){
    uvec2 n = floatBitsToUint(p);
    return vec2(uhash22(n)) / vec2(UINT_MAX);
}
vec3 hash33(vec3 p){
    uvec3 n = floatBitsToUint(p);
    return vec3(uhash33(n)) / vec3(UINT_MAX);
}
//end hash

//start gnoise
float gnoise21(vec2 p){
    vec2 n = floor(p);
    vec2[4] g;
    for (int j = 0; j < 2; j ++){
        for (int i = 0; i < 2; i++){
            g[i+2*j] = normalize(hash22(n + vec2(i,j)) - vec2(0.5));
        }
    }
    vec2 f = fract(p);
    float[4] v;
    for (int j = 0; j < 2; j ++){
        for (int i = 0; i < 2; i++){
            v[i+2*j] = dot(g[i+2*j], f - vec2(i, j));
        }
    }
    f = f * f * f * (10.0 - 15.0 * f + 6.0 * f * f);
    return 0.5 * mix(mix(v[0], v[1], f[0]), mix(v[2], v[3], f[0]), f[1]) + 0.5;
}
float gnoise31(vec3 p){
    vec3 n = floor(p);
    vec3[8] g;
    for (int k = 0; k < 2; k++ ){
        for (int j = 0; j < 2; j++ ){
            for (int i = 0; i < 2; i++){
                g[i+2*j+4*k] = normalize(hash33(n + vec3(i, j, k)) - vec3(0.5));
            }
            
        }
    }
    vec3 f = fract(p);
    float[8] v;
    for (int k = 0; k < 2; k++ ){
        for (int j = 0; j < 2; j++ ){
            for (int i = 0; i < 2; i++){
                v[i+2*j+4*k] = dot(g[i+2*j+4*k], f - vec3(i, j, k));
            }
            
        }
    }
    f = f * f * f * (10.0 - 15.0 * f + 6.0 * f * f);
    float[2] w;
    for (int i = 0; i < 2; i++){
        w[i] = mix(mix(v[4*i], v[4*i+1], f[0]), mix(v[4*i+2], v[4*i+3], f[0]), f[1]);
    }
    return 0.5 * mix(w[0], w[1], f[2]) + 0.5;
}
//end gnoise

//start pnoise
float gtable2(vec2 lattice, vec2 p){
    uvec2 n = floatBitsToUint(lattice);
    uint ind = uhash22(n).x >> 29;
    float u = 0.92387953 * (ind < 4u ? p.x : p.y);  //0.92387953 = cos(pi/8)
    float v = 0.38268343 * (ind < 4u ? p.y : p.x);  //0.38268343 = sin(pi/8)
    return ((ind & 1u) == 0u ? u : -u) + ((ind & 2u) == 0u? v : -v);
}
float pnoise21(vec2 p){
    vec2 n = floor(p);
    vec2 f = fract(p);
    float[4] v;
    for (int j = 0; j < 2; j ++){
        for (int i = 0; i < 2; i++){
            v[i+2*j] = gtable2(n + vec2(i, j), f - vec2(i, j));
        }
    }
    f = f * f * f * (10.0 - 15.0 * f + 6.0 * f * f);
    return 0.5 * mix(mix(v[0], v[1], f[0]), mix(v[2], v[3], f[0]), f[1]) + 0.5;
}
float gtable3(vec3 lattice, vec3 p){
    uvec3 n = floatBitsToUint(lattice);
    uint ind = uhash33(n).x >> 28;
    float u = ind < 8u ? p.x : p.y;
    float v = ind < 4u ? p.y : ind == 12u || ind == 14u ? p.x : p.z;
    return ((ind & 1u) == 0u? u: -u) + ((ind & 2u) == 0u? v : -v);
}

float vnoise21(vec2 p){
    vec2 n = floor(p);
    float[4] v;
    for (int j = 0; j < 2; j ++){
        for (int i = 0; i < 2; i++){
            v[i+2*j] = hash21(n + vec2(i, j));
        }
    }
    vec2 f = fract(p);
    f = f * f * f * (10.0 - 15.0 * f + 6.0 * f * f);
    return mix(mix(v[0], v[1], f[0]), mix(v[2], v[3], f[0]), f[1]);
}

float pnoise31(vec3 p){
    vec3 n = floor(p);
    vec3 f = fract(p);
    float[8] v;
    for (int k = 0; k < 2; k++ ){
        for (int j = 0; j < 2; j++ ){
            for (int i = 0; i < 2; i++){
                v[i+2*j+4*k] = gtable3(n + vec3(i, j, k), f - vec3(i, j, k)) * 0.70710678;
            }
            
        }
    }
    f = f * f * f * (10.0 - 15.0 * f + 6.0 * f * f);
    float[2] w;
    for (int i = 0; i < 2; i++){
        w[i] = mix(mix(v[4*i], v[4*i+1], f[0]), mix(v[4*i+2], v[4*i+3], f[0]), f[1]);
    }
    return 0.5 * mix(w[0], w[1], f[2]) + 0.5;
}
//end pnoise

float base21(vec2 p){
    return pnoise21(p) - 0.5;
}

float fbm21(vec2 p, float g){
    float amp = 1.0;
    float val = 0.0;
    float freq = 1.0;

    for(int i=0; i<4; i++){
        val += amp * base21(freq*p);
        amp *= g;
        freq *= 2.01;
    }

    return 0.5*val + 0.5;
}


void main(){
    vec2 pos = gl_FragCoord.xy/min(u_resolution.x, u_resolution.y);
    channel = 1;
    pos = 10.0 * pos;
    float u = abs(cos(u_time)) + 0.5;
    float v_x = 0.6*u*fbm21(pos, 1.0+2.0*min(0.8, sin(1.6*u)));
    float v_y = 0.5*u*fbm21(pos, 0.5*min(0.8, cos(u*0.1)));
    float v_z = 1.9*u*fbm21(pos, 10.*min(.8, cos(u*2.2+1.5)));
    fragColor = vec4(2.5*vec3(v_x, v_y, v_z), 1.0);
}