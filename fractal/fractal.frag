#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 u_resolution;
uniform float u_time;
const float PI = 3.1415926;
uint k = 0x456789abu;
const uint UINT_MAX = 0xffffffffu;

vec3 tile(vec2 p){
   // return vec3(10.*sin(10.*p.x)*sin(10.*p.y));
    p = floor(p);
    float n = mod(p.x+p.y, 2.0);
    return n==.0 ? vec3(1.0) : vec3(.0);
}

vec2 fold(vec2 p, float ang){
    vec2 n=vec2(cos(-ang),sin(-ang));
    p-= 2.*min(0.,dot(p,n))*n;
	return p;
}

float d2hline(vec2 p){
    p.x-=max(0.,min(1.,p.x));
    return length(p)*5.;
}

vec2 koch_fold(vec2 pt) {
	// Fold horizontally
    pt.x = abs(pt.x);
    pt.x-=.5;
    //Fold across PI/6
    pt = fold(pt,PI/6.);
    return pt;
}

vec2 koch_curve(vec2 pt, int n){
    for(int i=0; i<n; i++){
        pt *= 3.;
        pt.x -= 1.5;
        pt = koch_fold(pt);
    }
    return pt;
}

vec3 color(vec2 pt, int n) {
    pt=pt*.5+.5;
    pt = koch_curve(pt, n);
    return vec3(d2hline(pt)/float(n));
}

void main(){
    vec2 p = gl_FragCoord.xy / u_resolution.xy;
    int n = 6;
    p.y -= 0.85;
    p.x -= 0.5;
    p *= 3.5;
    fragColor = vec4(color(p, n), 1.0);
}