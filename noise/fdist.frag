#version 300 es
precision highp float;
precision highp int;
out vec4 fragColor;
uniform float u_time;
uniform vec2 u_resolution;

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

vec2 hash22(vec2 p){
    uvec2 n = floatBitsToUint(p);
    return vec2(uhash22(n)) / vec2(UINT_MAX);
}

float fdist21(vec2 p){
    vec2 n = floor(p + 0.5);
    float dist = sqrt(2.0);

    for(float j=0.0; j<=2.0; j++){
        vec2 grid;
        grid.y = n.y + sign(mod(j, 2.0) - 0.5) * ceil(j * 0.5);
        if(abs(grid.y - p.y ) - 0.5 > dist){
            continue;
        }

        for(float i=-1.0; i<=1.0; i++){
            grid.x = n.x + i;
            vec2 jitter = hash22(grid) - 0.5;
            dist = min(dist, length(grid + jitter - p));
        }
    }

    return dist;
}

void main(){
    vec2 pos = gl_FragCoord.xy/min(u_resolution.x, u_resolution.y);
    pos *= 25.0;
    fragColor = vec4(fdist21(pos));
}