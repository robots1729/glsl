#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 u_resolution;
uniform float u_time;
const float PI = 3.1415926;
const uint UINT_MAX = 0xffffffffu;

uvec3 k = uvec3(0x456789abu, 0x6789ab45u, 0x89ab4567u);
uvec3 u = uvec3(1, 2, 3);

const float radius = .8;
const vec3 center = vec3(.0, .0, .5);

const vec3 lightDir = vec3(1.8, 0.9, -0.6477);

float smin( float a, float b, float k )
{
    float h = max(k-abs(a-b),0.0);
    return min(a, b) - h*h*0.25/k;
}

float smax( float a, float b, float k )
{
    float h = max(k-abs(a-b),0.0);
    return max(a, b) + h*h*0.25/k;
}

uvec3 uhash33(uvec3 n){
    n ^= (n.yzx << u);
    n ^= (n.yzx >> u);
    n *= k;
    n ^= (n.yzx << u);
    return n * k;
}

float hash31(ivec3 p){
    return float(uhash33(uvec3(p)).x) / float(UINT_MAX);
}

vec3 trans(vec3 p){
    return mod(p, 4.0) - 2.0;
}

float sdSphere(vec3 pos){
    return length(pos-center) - radius;
}

float sph( ivec3 i, vec3 f, ivec3 c )
{
   // random radius at grid vertex i+c
   float rad = .3*hash31(i+c);
   // distance to sphere at grid vertex i+c
   return length(f-vec3(c)) - rad; 
}

float sdBase( vec3 p )
{
   ivec3 i = ivec3(floor(p));
    vec3 f =       fract(p);
   // distance to the 8 corners spheres
   return min(min(min(sph(i,f,ivec3(0,0,0)),
                      sph(i,f,ivec3(0,0,1))),
                  min(sph(i,f,ivec3(0,1,0)),
                      sph(i,f,ivec3(0,1,1)))),
              min(min(sph(i,f,ivec3(1,0,0)),
                      sph(i,f,ivec3(1,0,1))),
                  min(sph(i,f,ivec3(1,1,0)),
                      sph(i,f,ivec3(1,1,1)))));
}

float sdBox( vec3 p, vec3 b )
{
  vec3 q = abs(p) - b;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}

float sdBoxFrame( vec3 p, vec3 b, float e )
{
       p = abs(p)-b;
  vec3 q = abs(p+e)-e;
  return min(min(
      length(max(vec3(p.x,q.y,q.z),0.0))+min(max(p.x,max(q.y,q.z)),0.0),
      length(max(vec3(q.x,p.y,q.z),0.0))+min(max(q.x,max(p.y,q.z)),0.0)),
      length(max(vec3(q.x,q.y,p.z),0.0))+min(max(q.x,max(q.y,p.z)),0.0));
}

vec3 getNormal(vec3 pos){
    float d = 0.0001;

    return normalize(vec3(
        sdBase(pos + vec3(d, .0, .0)) - sdBase(pos - vec3(d, .0, .0)),
        sdBase(pos + vec3(.0, d, .0)) - sdBase(pos - vec3(.0, d, .0)),
        sdBase(pos + vec3(.0, .0, d)) - sdBase(pos - vec3(.0, .0, d))
    ));
}

float sdFbm( vec3 p, float d )
{
   float s = 1.0;
   for( int i=0; i<11; i++ )
   {
       // evaluate new octave
       float n = s*sdBase(p);
	
       // add
       n = smax(n,d-0.1*s,0.3*s);
       d = smin(n,d      ,0.3*s);
	
       // prepare next octave
       p = mat3( 0.00, 1.60, 1.20,
                -1.60, 0.72,-0.96,
                -1.20,-0.96, 1.28 )*p;
       s = 0.5*s;
   }
   return d;
}

void main(){
    vec2 pos = gl_FragCoord.xy / u_resolution.xy;
    pos -= 0.5;
    pos *= 1.0;
    vec3 cPos = vec3(1., .5, -10.5);

    vec3 cDir = vec3(.0, .0, 1.0);
    vec3 cUp = vec3(.0, 1., .0);
    vec3 cSide = cross(cDir, cUp);
    float targetDepth = 1.;

    vec3 ray = cSide*pos.x + cUp*pos.y + cDir * targetDepth;

    float rDist = .0;
    float rLen = .0;
    vec3 rPos = cPos;

    float d = length(p-vec3(0.0,-250.0,0.0))-250.0
    for(int i=0; i < 128; i++){
        //rDist = sdFbm(rPos, 0.2);
        rLen += rDist;
        rPos = cPos + rLen * ray;
    }

    float threashold = 0.0001;
    if(abs(rDist) < threashold){
        vec3 normal = getNormal(rPos);
        float diff = clamp(dot(lightDir, normal), 0.1, 1.0);
        fragColor.rgb = 0.8*vec3(diff);
    }

    fragColor.a = 1.;
}