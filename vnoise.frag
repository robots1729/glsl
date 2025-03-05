#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 u_resolution;
uniform float u_time;
const float PI = 3.1415926;
const uint UINT_MAX = 0xffffffffu;

uvec3 k = uvec3(0x456789abu, 0x6789ab45u, 0x89ab4567u);
uvec3 u = uvec3(1, 2, 3);
uvec3 colorSeed = uvec3(0x183059abu, 0x42019845u, 0x12874567u);
int channel;

uvec2 uhash22(uvec2 n){
    n ^= (n.yx << u.xy);
    n ^= (n.yx >> u.xy);
    n *= k.xy;
    n ^= (n.yx << u.xy);
    return n * k.xy;
}

float hash21(vec2 p){
    uvec2 n = floatBitsToUint(p);
    return float(uhash22(n).x)/float(UINT_MAX);
}

uvec3 uhash33(uvec3 n){
    n ^= n.yzx << u;
    n ^= n.yzx >> u;
    n *= k;
    n ^= n.yzx << u;
    return n*k;
}

float hash31(vec3 p){
    uvec3 n = floatBitsToUint(p);
    return float(uhash33(n).x)/float(UINT_MAX);
}

vec3 hash33(vec3 p){
    uvec3 v = floatBitsToUint(p);
    return vec3(float(v)/float(UINT_MAX));
}

float vnoise21(vec2 p){
    vec2 n = floor(p);

    float[4] v;

    for(int j=0; j<2; j++){
        for(int i=0; i<2; i++){
            v[i+2*j] = hash21(n + vec2(i, j));
        }
    }

    vec2 f = fract(p);
    if(channel==1){
        f = f * f * (3.0 - 2.0*f);
    }

    return mix(mix(v[0], v[1], f[0]), mix(v[2], v[3], f[0]), f[1]);
}

float vnoise31(vec3 p){
    vec3 n = floor(p);

    float[8] v;
    for(int k=0; k<2; k++){
        for(int j=0; j<2; j++){
            for(int i=0; i<2; i++){
                v[i+2*j+4*k] = hash31(n + vec3(i, j, k)); 
            }
        }
    }

    vec3 f = fract(p);
    f = f * f * (3.0-2.0*f);

    float[2] w;

    for(int i=0; i<2; i++){
        w[i] = mix(mix(v[4*i], v[4*i+1], f[0]), mix(v[4*i+2], v[4*i+3], f[0]), f[1]);
    }

    return mix(w[0], w[1], f[2]);
}

uint uhash11(uint n){
    uint m = n;
    m ^= (m << 1);
    m ^= (m >> 1);
    m *= k[0];
    m ^= (m << 1);
    return m*(k[0]);
}

float hash11(float n){
    uint m = floatBitsToUint(n);
    return float(uhash11(m))/float(uhash11(UINT_MAX));
}

float[3] colorNoise(vec2 p){
    vec3 n = vec3(p.x*p.y, p.x*u_time, p.y*u_time);

    float[3] v;
    v[0] = hash11(float(n[0]));
    v[1] = hash11(float(n[1]));
    v[2] = hash11(float(n[2]));

    return v;
}

vec3 vnoiseColor3(vec3 p){
    vec3 p1 = p;
    vec3 p2 = hash33(p1);
    p2.x = u_time;
    vec3 p3 = hash33(p2);
    p3.y = u_time*2.0;
    vec3 v;
    v[0] = vnoise31(p1);
    v[1] = vnoise31(p2);
    v[2] = vnoise31(p3);

    return v;
}

void main(){
    vec2 pos = gl_FragCoord.xy/min(u_resolution.x, u_resolution.y);
    channel = int(gl_FragCoord*3.0/u_resolution.x);

    pos = 10.0*pos + u_time;
    if(channel < 2){
        fragColor.xyz = vnoiseColor3(vec3(pos.x, u_time, pos.y));
        fragColor.a = 1.0;
    }else{
        fragColor = vec4(vnoise31(vec3(pos, u_time)));
    }
}