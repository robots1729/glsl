#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 u_resolution;
uniform float u_time;
const float PI = 3.1415926;
uint k = 0x456789abu;
const uint UINT_MAX = 0xffffffffu;

uniform sampler2D iChannel0;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {

    // Precompute values for skewed triangular grid
    const vec4 C = vec4(0.211324865405187,
                        // (3.0-sqrt(3.0))/6.0
                        0.366025403784439,
                        // 0.5*(sqrt(3.0)-1.0)
                        -0.577350269189626,
                        // -1.0 + 2.0 * C.x
                        0.024390243902439);
                        // 1.0 / 41.0

    // First corner (x0)
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);

    // Other two corners (x1, x2)
    vec2 i1 = vec2(0.0);
    i1 = (x0.x > x0.y)? vec2(1.0, 0.0):vec2(0.0, 1.0);
    vec2 x1 = x0.xy + C.xx - i1;
    vec2 x2 = x0.xy + C.zz;

    // Do some permutations to avoid
    // truncation effects in permutation
    i = mod289(i);
    vec3 p = permute(
            permute( i.y + vec3(0.0, i1.y, 1.0))
                + i.x + vec3(0.0, i1.x, 1.0 ));

    vec3 m = max(0.5 - vec3(
                        dot(x0,x0),
                        dot(x1,x1),
                        dot(x2,x2)
                        ), 0.0);

    m = m*m ;
    m = m*m ;

    // Gradients:
    //  41 pts uniformly over a line, mapped onto a diamond
    //  The ring size 17*17 = 289 is close to a multiple
    //      of 41 (41*7 = 287)

    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;

    // Normalise gradients implicitly by scaling m
    // Approximation of: m *= inversesqrt(a0*a0 + h*h);
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0+h*h);

    // Compute final noise value at P
    vec3 g = vec3(0.0);
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * vec2(x1.x,x2.x) + h.yz * vec2(x1.y,x2.y);
    return 130.0 * dot(m, g);
}

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

    for(float i=0.; i<25.0; i++){
        vec3 r = hexagonEdge(p, current_diameter, center, width);
        if(r.x == 1.0)return (0.5 + cos(10.0*u_time*snoise(vec2(i*i))))*r;
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