#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
const float PI = 3.1415926;
uint k = 0x456789abu;
const uint UINT_MAX = 0xffffffffu;
const float eps = 0.001;

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

float terrain(vec2 p){
    float power = -pow(p.x,2.)-pow(p.y-100., 2.);
    return 20.*exp(power/0.001);
}

bool castRay(in vec3 ro, in vec3 rd, out float resT){
    float dt = 0.005;
    float minT = 0.001;
    float maxT = 10.0;

    float lh = 0.0;
    float ly = 0.0;

    for(float t=minT; t < maxT ; t+=dt){
        vec3 p = ro + t*rd;
        float h = terrain(p.xz);

        if(p.y < h){
            resT = h - lh + dt * (lh - ly)/(p.y - h - ly + lh);
            return true;
        }
        lh = h;
        ly = p.y;
    }

    return false;
}

vec3 getNormal(vec3 p){
    return normalize(
        vec3(
            terrain(vec2(p.x-eps, p.z)) - terrain(vec2(p.x+eps, p.z)),
            2.0*eps,
            terrain(vec2(p.x, p.z-eps)) - terrain(vec2(p.x, p.z+eps)))
        );
}

void main(){
    float t = -0.5*PI * (u_mouse.y /u_resolution.y);
    vec2 pos = gl_FragCoord.xy / u_resolution.xy;
    pos -= 0.5;
    float resolution = 50.;
    pos *= resolution;

    vec3 origin = vec3(.0, 6.0, -1.0);
    vec3 target = vec3(0.0, .0, 0.0);

    vec3 cz = normalize(target - origin);
    vec3 cx = cross(cz, vec3(0., 1.0, .0));
    vec3 cy = cross(cx, cz);

    float targetDepth = 1.0;
    vec3 ray = normalize(pos.y *cy + targetDepth*cz + pos.x*cx);

    float resT;

    fragColor.rgb = vec3(.0);

    if(castRay(origin, ray, resT)){
        vec3 p = origin + resT * ray;
        vec3 n = getNormal(p);
        p = normalize(p);

        float diff = clamp(dot(p, n), 0.1, 1.0);

        fragColor.rgb = vec3(diff);
    }else{
        fragColor.rgb = vec3(0.0);
    }

    fragColor.a = 1.0;
}