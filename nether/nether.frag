#version 300 es
precision highp float;
precision highp int;
out vec4 fragColor;
uniform float u_time;
uniform vec2 u_resolution;
int channel;

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
float map(vec3 p){
    float rect1 =  sdRect(p, vec3(-0.5, 0.0, -0.0), vec3(0.5, 0.5, 0.01), 0.0);
    float rect2 =  sdRect(p, vec3(0.5, 1.0, -0.0), vec3(0.5, 0.5, 0.01), 0.0);
    float rect3 =  sdRect(p, vec3(-0.5, 1.0, -0.0+0.02), vec3(0.5, 0.5, 0.01+0.02), 0.0);
    float rect4 =  sdRect(p, vec3(0.5, 0.0, -0.0+0.02), vec3(0.5, 0.5, 0.01+0.02), 0.0);
    return min(min(min(rect1, rect2), rect3),rect4);
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
    //t = vec3(.0);
    vec3 cPos = euler(vec3(0.0, 0.0, 4.0), t);
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
            float diff = 0.9 * max(dot(normalize(lDir), n), 0.0);
            fragColor.rgb = diff*vec3(1.0);
            break;
        }else{
            rPos += map(rPos)*ray;
        }
    }

    fragColor.a = 1.0;
}