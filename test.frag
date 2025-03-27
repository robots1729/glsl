#version 300 es
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
out vec4 fragColor;

#define rot(a) mat2(cos(a),sin(a),-sin(a),cos(a))
float sdHexagon( in vec2 p, in float r )
{
    const vec3 k = vec3(-0.866025404,0.5,0.577350269);
    p = abs(p);
    p -= 2.0*min(dot(k.xy,p),0.0)*k.xy;
    p -= vec2(clamp(p.x, -k.z*r, k.z*r), r);
    return length(p)*sign(p.y);
}

float map(vec3 p){
    p.xy*=rot(u_time*1.);
    p.xz*=rot(u_time*1.);
    float sdf2d=abs(length(p.xy)-1.)-.1;
    float d=abs(p.z)-.1;
    return max(sdf2d,d);
}

void main(){
    fragColor = vec4(0.0);
    vec2 uv=(gl_FragCoord.xy-.5*u_resolution)/u_resolution.y;
    vec3 rd=normalize(vec3(uv,1));
    vec3 p=vec3(0,0,-3);
    float d=1.,i;
    for(;++i<99.&&d>.001;){p+=rd*(d=map(p));}
    if(d<.001)fragColor+=3./i;
}