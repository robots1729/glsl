#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 u_resolution;
uniform float u_time;
const float PI = 3.1415926;
uint k = 0x456789abu;
const uint UINT_MAX = 0xffffffffu;

uniform sampler2D iChannel0;

vec2 fold(vec2 p, float ang){
    vec2 n=vec2(cos(-ang),sin(-ang));
    p-= 2.*min(0.,dot(p,n))*n;
	return p;
}

vec3 hexagon(vec2 p, float diameter, vec2 center){
    p -= center;

    float edge1 = p.y < -tan(PI/6.0)*p.x + diameter ?  1. : 0.;
    float edge2 = p.y < tan(PI/6.0)*p.x + diameter ?  1. : 0.;
    float edge3 = p.x > -sqrt(0.75*diameter*diameter) ?  1. : 0.;
    float edge4 = p.y > -tan(PI/6.0)*p.x - diameter ?  1. : 0.;
    float edge5 = p.y > tan(PI/6.0)*p.x - diameter ?  1. : 0.;
    float edge6 = p.x < sqrt(0.75*diameter*diameter) ?  1. : 0.;
    

    return vec3(edge1*edge2*edge3*edge4*edge5*edge6);
}

vec3 hexagonEdge(vec2 p, float diameter, vec2 center, float width){
    return hexagon(p, diameter, center) - hexagon(p, diameter-width, center);
}

vec3 multipleHexagon(vec2 p, float diameter, vec2 center, float width){
    float current_diameter = diameter;

    for(float i=0.; i<10.0; i++){
        vec3 r = hexagonEdge(p, current_diameter, center, width);
        if(r.x == 1.0)return r;
        current_diameter += diameter;
    }
    return vec3(0.0);
    float period = sqrt(0.75*diameter*diameter);
    p = mod(p, vec2(period));
    return hexagonEdge(p, diameter, center, width);
}

void main()
{
    vec2 pos=gl_FragCoord.xy/u_resolution.xy;
    pos -= 0.5;
    pos *= 2.;
    fragColor.rgb = multipleHexagon(pos, 0.08, vec2(0.0), 0.03);
    fragColor.a = 1.0;
}