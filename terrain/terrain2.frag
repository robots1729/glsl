#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
const float PI = 3.1415926;
uint k = 0x456789abu;
const uint UINT_MAX = 0xffffffffu;
const float eps = 0.001;

struct Ray {
	vec3 pos;
	vec3 dir;
};

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

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

float height(vec2 pos){
    	const float GROUND_BASE = -10.2;
    float power = pos.x*pos.x + (pos.y-20.0)*(pos.y-20.0);
    float height = 20.*exp(-power/2000.0001);
    height = height > 0.4 ? height : 0.;
    return height;
}

float map(vec3 v) {
	const float GROUND_BASE = -10.2;
    float power = v.x*v.x + (v.z-20.0)*(v.z-20.0);
    float height = 20.*exp(-power/200.0001);
    height = height > 0.4 ? height : 0.;
    float decay = 1.;2./(abs(v.z-20.0)+abs(v.x));
    return v.y - height + 10.0 - decay*0.6*snoise(v.xz*.4);
}

vec3 map_normal(vec3 v) {
	float delta = 0.01;
	return normalize(vec3(map(v + vec3(delta, 0.0, 0.0)) - map(v), 
			      map(v + vec3(0.0, delta, 0.0)) - map(v), 
			      map(v + vec3(0.0, 0.0, delta)) - map(v)));
}


void main(){
	vec2 pos = (gl_FragCoord.xy * 2.0 - u_resolution) / max(u_resolution.x, u_resolution.y);
	
        // カメラの位置。中心から後方にあるイメージ
	vec3 camera_pos = vec3(0., 0.0, -36.0);
        // カメラの上方向の姿勢を定めるベクトル　この場合水平
	vec3 camera_up = normalize(vec3(0.0, 1.0, 0.0));
        //  カメラの向いている方向　
	vec3 camera_dir = normalize(vec3(0.0, 0.0, 1.0));
        // camera_upとcamera_dirの外積から定まるカメラの横方向のベクトル 
	vec3 camera_side = normalize(cross(camera_up, camera_dir));
	
        // レイの位置、飛ぶ方向を定義する
	Ray ray;
	ray.pos = camera_pos;
	ray.dir = normalize(pos.x * camera_side + pos.y * camera_up + camera_dir);
	
	float t = 0.0, d;
        // レイを飛ばす (計算回数は最大64回まで)
	for (int i = 0; i < 256; i++) {
		d = map(ray.pos);
                // ヒットした
		if (d < 0.0001) {
			break;
		}
                // 次のレイは最小距離d * ray.dirの分だけ進める（効率化）
		t += d;
		ray.pos = camera_pos + t * ray.dir;
	}
	
	vec3 L = normalize(vec3(0.0, 1.0, 0.0)); // 光源ベクトル
	vec3 N = map_normal(ray.pos); // 法線ベクトル
	vec3 LColor = vec3(1.0, 1.0, 1.0); // 光の色
    vec3 color = vec3(0.5176, 0.949, 0.5961);
	vec3 I = dot(N, L) * color; // 輝度
	
	if (d < 0.001) {
                // ヒットしていれば白
		fragColor = vec4(I, 1.0);
	} else {
		fragColor = vec4(vec3(0.6157, 0.8471, 0.9725), 1.0);	
	}
}