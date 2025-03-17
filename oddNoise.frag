#version 300 es
precision highp float;
precision highp int;
out vec4 fragColor;
uniform float u_time;
uniform vec2 u_resolution;
float r1 = 0.2;
float r2 = 0.4;
float thick = 0.01;

vec2 cExp(vec2 z){
    return exp(z.x) * vec2(cos(z.y), sin(z.y));
}

vec3 anulus(vec2 p, float a, float b){
    return pow(p.x, 2.0) + pow(p.y, 2.0) < pow(b, 2.0) && pow(a, 2.0) < pow(p.x,2.0) + pow(p.y, 2.0) ? vec3(1.0) : vec3(0.0);
}

vec3 circles(vec2 p, float a, float b){
    if(-0.5*thick < p.y && p.y < 0.5*thick && p.x <b && -b < p.x)return vec3(1.0);

    if(-0.5*thick < p.x && p.x < 0.5*thick && p.y <b && -b < p.y)return vec3(1.0);

    vec3 z = anulus(p, b-thick, b);
    if(z.x==1.0)return z * vec3(1.0, 0.0, 0.0);

    a = a*exp(log(b/a)*0.5);
    z = anulus(p, a-thick, a);
    if(z.x==1.0)return z * vec3(0.0, 0.0, 1.0);

    return vec3(0.0);
}

vec2 cLog(vec2 z){
    float r = pow(z.x, 2.0) + pow(z.y, 2.0);
    z = normalize(z);
    float angle = atan(z.y/z.x);
    return log(r/0.5) / vec2(cos(angle), sin(angle));
}

vec3 color(vec2 z, float r1, float r2) {
	z = z*10.0; // just so we can see more
    z = cLog(z);
    z.x = mod(z.x,log(r2/r1)); 
	z = cExp(z)*r1;
    return circles(z,r1,r2);
}

void main(){
    vec2 pos = gl_FragCoord.xy/u_resolution;
    pos.x -= 0.5;
    pos.y -= 0.5;
    fragColor = vec4(color(pos, r1, r2), 1.0);
}