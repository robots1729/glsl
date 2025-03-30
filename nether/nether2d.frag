#version 300 es
precision highp float;
precision highp int;
out vec4 fragColor;
uniform float u_time;
uniform vec2 u_resolution;
int channel;

bool inRectangle(vec2 p, vec2 center, vec2 size){
    float left = center.x - size.x;
    float right = center.x + size.x;
    float top = center.y + size.x;
    float bottom = center.y - size.y;

    if(left > p.x)return false;
    if(right < p.x)return false;
    if(top < p.y)return false;
    if(bottom > p.y)return false;

    return true;
}


void main(){
    vec2 pos = gl_FragCoord.xy / u_resolution.xy;
    pos -= 0.5;

    fragColor.rgb = vec3(.0, .0,1.);
    if(inRectangle(pos, vec2(0.0), vec2(.045))){
        fragColor.rgb = vec3(1.0);
    }

    fragColor.a = 1.0;
}