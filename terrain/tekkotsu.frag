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

float sdSphere(vec3 p, float r){
    return length(p) - r;
}

float boxSDF(vec3 p, vec3 c, vec3 d, float t){
    p = abs(p - c);
    return length(max(p - d, vec3(0.0))) + min(max(max(p.x - d.x, p.y - d.y), p.z - d.z), 0.0) - t;
}

float sdBox(vec3 p){
    vec3 center = vec3(0.0, 0.0, 2.0);
    vec3 scale = vec3(0.5);
    float thickness = 0.1;
    return boxSDF(p, center, scale, thickness);
}
float sdBase(vec3 p){
    return sdBox(p);
}

vec3 normal(vec3 p){
    return normalize(
        vec3(
            sdBase(p + vec3(1., .0, .0)*eps) - sdBase(p - vec3(1., .0, .0)*eps),
            sdBase(p + vec3(0., 1.0, .0)*eps) - sdBase(p - vec3(0., 1.0, .0)*eps),
            sdBase(p + vec3(0., .0, 1.0)*eps) - sdBase(p - vec3(0., .0, 1.0)*eps)
        )
    );
}

void main(){
	vec2 pos = (gl_FragCoord.xy * 2.0 - u_resolution) / max(u_resolution.x, u_resolution.y);
	//pos *= 50.;
    
        // カメラの位置。中心から後方にあるイメージ
	vec3 camera_pos = vec3(0.0, .0, -2.);
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
		d = sdBase(ray.pos);
                // ヒットした
		if (d < 0.0001) {
			break;
		}
                // 次のレイは最小距離d * ray.dirの分だけ進める（効率化）
		t += d;
		ray.pos = camera_pos + t * ray.dir;
	}
	
	vec3 L = normalize(vec3(0.0, 1.0, 0.0)); // 光源ベクトル
	vec3 N = normal(ray.pos); // 法線ベクトル
	vec3 LColor = vec3(1.0, 1.0, 1.0); // 光の色
	vec3 I = dot(N, L) * LColor; // 輝度
	
	if (d < 0.001) {
                // ヒットしていれば白
		fragColor = vec4(I, 1.0);
	} else {
		fragColor = vec4(vec3(0.0), 1.0);	
	}
}