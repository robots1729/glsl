#version 300 es
precision highp float;
precision highp int;
out vec4 fragColor;
uniform float u_time;
uniform vec2 u_resolution;
int channel;
const float PI = 3.14159265;
uvec3 k = uvec3(0x456789abu, 0x6789ab45u, 0x89ab4567u);
uvec3 u = uvec3(1, 2, 3);
const uint UINT_MAX = 0xffffffffu;

uvec2 uhash22(uvec2 n){
    n ^= (n.yx << u.xy);
    n ^= (n.yx >> u.xy);
    n *= k.xy;
    n ^= (n.yx << u.xy);
    return n * k.xy;
}

float hash21(vec2 p){
    uvec2 n = floatBitsToUint(p);
    return float(uhash22(n).x) / float(UINT_MAX);
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

float fbm21(vec2 p, float g){
    float val = 0.0;
    float amp = 1.0;
    float freq = 1.0;
    for (int i = 0; i < 4; i++){
        val += amp * (vnoise21(freq * p) - 0.5);
        amp *= g;
        freq *= 2.01;
    }
    return 0.5 * val + 0.5;
}

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

float base21(vec2 p){
    return channel == 0 ? fbm21(p, 0.5): 
        pnoise21(p);
}

float warp21(vec2 p, float g){
    float val = 0.0;

    for(int i=0; i<4; i++){
        val = base21(p+g*val);
    }

    return val;
}

vec2 rot2(vec2 p, float t){
    return vec2(cos(t) * p.x -sin(t) * p.y, sin(t) * p.x + cos(t) * p.y);
}
vec3 rotX(vec3 p, float t){
    return vec3(p.x, rot2(p.yz, t));
}
vec3 rotY(vec3 p, float t){
    return vec3(p.y, rot2(p.zx, t)).zxy;
}
vec3 rotZ(vec3 p, float t){
    return vec3(rot2(p.xy, t), p.z);
}

vec3 euler(vec3 p, vec3 t){
    return rotZ(rotY(rotX(p, t.x), t.y), t.z);
}
float sdRect(vec3 p, vec3 c, vec3 d, float r){
    p = abs(p-c);
    return length(max(p-d, vec3(.0))) + min(max(max(p.x-d.x, p.y-d.y), p.z-d.z), .0) -r;
}

float sdGround(vec3 p){
    return p.y;
}

float sdGate(vec3 p){
    //return sdGround(p);
    float thick1 = 0.01; 
    float thick2 = 0.02;

    float rect1 =  sdRect(p, vec3(-0.5, 0.0, -0.0), vec3(0.5, 0.5, thick1), 0.0);
    float rect2 =  sdRect(p, vec3(0.5, 1.0, -0.0), vec3(0.5, 0.5,  thick1), 0.0);
    float rect3 =  sdRect(p, vec3(-0.5, 1.0, -0.0+thick2), vec3(0.5, 0.5, thick1+thick2), 0.0);
    float rect4 =  sdRect(p, vec3(0.5, 0.0, -0.0+thick2), vec3(0.5, 0.5, thick1+thick2), 0.0);
    float rect5 =  sdRect(p, vec3(-0.5,-1.0, -0.0+thick2), vec3(0.5, 0.5, thick1+thick2), 0.0);
    float rect6 =  sdRect(p, vec3(0.5,-1.0, -0.0), vec3(0.5, 0.5, thick1), 0.0);
    
    float rect7 = sdRect(p, vec3(1.5,-1.0, -0.0), vec3(0.5, 0.5, 4.*thick1), 0.0);
    rect7 = 2.;
    return min(min(min(min(min(min(rect1, rect2), rect3),rect4), rect5), rect6), rect7);
}

float map(vec3 p){
    return sdGate(p);
}

vec3 getNormal(vec3 p){
    float eps = 0.001;
    return normalize(vec3(
        map(p + vec3(eps, 0.0, 0.0)) - map(p - vec3(eps, 0.0, 0.0)),
        map(p + vec3(0.0, eps, 0.0)) - map(p - vec3(0.0, eps, 0.0)),
        map(p + vec3(0.0, 0.0, eps)) - map(p - vec3(0.0, 0.0, eps))
    ));
}

void main(){
    vec2 pos = gl_FragCoord.xy/u_resolution.xy;
    pos -= 0.5;
    vec3 theta = vec3(u_time*0.5);

    vec3 t = vec3(u_time * 0.5);
    t = vec3(.0);
    float u = .5*u_time;
    float back = 1.0;
    vec3 cPos = euler(vec3(0.0, 0.0, 4.0 + back), t);
    vec3 cDir = euler(vec3(0.0, 0.0, - 1.0), t);
    vec3 cUp = euler(vec3(0.0, 1.0, 0.0), t);
    vec3 lDir = euler(vec3(0.0, 0.0, 1.0), t);
    vec3 cSide = cross(cDir, cUp);
    float targetDepth = 1.0;

    vec3 ray = pos.x*cSide + pos.y*cUp + cDir*targetDepth;
    vec3 rPos = ray + cPos;
    ray = normalize(ray);

    fragColor = vec4(vec3(0.0), 1.0);

    for(int i=0; i<256; i++){
        if(map(rPos) < 0.001){
            vec3 n = getNormal(rPos);
            float diff = .9 * max(dot(normalize(lDir), n), 0.0);
            
            float mul = 1.0;
            float u = cos(5.0*u_time*(rPos.x + rPos.y));
            
            float g = abs(mod(u, mul*10.0) - mul*5.0);
            
            fragColor.rgb = diff*vec3(warp21(rPos.xy, g), 0.7*warp21(rPos.xy, 4.2*g), warp21(rPos.xy, 2.0*g));
            break;
        }else{
            rPos += map(rPos)*ray;
        }
    }

    fragColor.a = 1.0;
}