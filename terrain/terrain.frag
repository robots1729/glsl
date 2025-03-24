#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 u_resolution;
uniform float u_time;
const float PI = 3.1415926;
uint k = 0x456789abu;
const uint UINT_MAX = 0xffffffffu;
const float eps = 0.00001;

float terrain(vec2 p){
    return sin(p.x) * sin(p.y);
}

bool castRay(in vec3 ro, in vec3 rd, out float resT){
    float dt = 0.001;
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
            terrain(vec2(p.x, p.z-eps) - terrain(vec2(p.x, p.z+eps)))
        )
    );
}

void main(){
    vec2 pos = gl_FragCoord.xy / u_resolution.xy;
    pos -= 0.5;
    float resolution = 50.;
    pos *= resolution;

    vec3 cUp = vec3(.0, 1., .0);
    vec3 cDir = vec3 (.0, .0, 1.);
    vec3 cSide = cross(cDir, cUp);

    vec3 cPos = vec3(.0, .0, -1.0);
    float targetDepth = 1.;

    vec3 ray;

    float resT;

    fragColor.rgb = vec3(.0);

    for(float i=-resolution.x; i<resolution.x; i++){
        for(float j=-resolution.y; j<resolution.y; j++){
            ray = i*cSide + j*cUp + targetDepth*cDir;
            
        }
    }

    if(castRay(cPos, ray, resT)){
        fragColor.rgb = vec3(1.0);
    }

    //fragColor.rgb = vec3(terrain(pos));
    fragColor.a = 1.0;
}