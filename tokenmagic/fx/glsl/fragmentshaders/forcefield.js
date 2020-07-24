export const forceField = `
precision mediump float;

uniform float time;
uniform int blend;
uniform int shieldType;
uniform vec3 color;
uniform vec2 posLight;
uniform vec3 ambientColor;
uniform float intensity;
uniform float lightColorAlpha;
uniform float lightSize;
uniform float scale;
uniform float radius;
uniform bool chromatic;
uniform sampler2D uSampler;

varying vec2 vTextureCoord;
varying vec2 vFilterCoord;

#define SQRT5B20 0.30901699
#define PI 3.14159265
#define SPEED 0.01

vec3 hsvToRgb(vec3 hsVcolor)
{
    vec4 K = vec4(1., 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(hsVcolor.xxx + K.xyz) 
             * 6.0 - K.www);
    return hsVcolor.z 
           * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), hsVcolor.y);
}

vec4 multihue(vec2 uv) 
{
    float h = 0.5 + atan(uv.y, uv.x) / (2. * PI);
    float b2 = .5 * ((1.0 - 1.) 
                + 1. + sqrt((1.0 - 2.) 
                * (1.0 - 2.) + 0.01));
    vec3 hsv = vec3(h, sqrt(1.), b2);
    return vec4(hsvToRgb(hsv), 1.0);
}

float random(vec2 n) 
{ 
	return fract(cos(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

vec2 random2(vec2 p) 
{
    return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
}

float bornedCos(float minimum, float maximum)
{
    return (maximum-minimum)*(cos(2.*PI*time/20. + 1.)/2.)+minimum;
}

float bornedSin(float minimum, float maximum)
{
    return (maximum-minimum)*(sin(2.*PI*time/20. + 1.)/2.)+minimum;
}

vec4 mod289(vec4 x) 
{
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

float mod289(float x) 
{
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) 
{
    return mod289(((x*34.0)+1.0)*x);
}

float permute(float x) 
{
    return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r) 
{
    return 1.79284291400159 - 0.85373472095314 * r;
}

float taylorInvSqrt(float r) 
{
    return 1.79284291400159 - 0.85373472095314 * r;
}

vec4 grad4(float j, vec4 ip) 
{
    const vec4 ones = vec4(1.0, 1.0, 1.0, -1.0);
    vec4 p,s;

    p.xyz = floor( fract (vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0;
    p.w = 1.5 - dot(abs(p.xyz), ones.xyz);
    s = vec4(lessThan(p, vec4(0.0)));
    p.xyz = p.xyz + (s.xyz*2.0 - 1.0) * s.www;

    return p;
}

float snoise(vec4 v) 
{
    const vec4  C = vec4( 0.138196601125011,
                          0.276393202250021,
                          0.414589803375032,
                         -0.447213595499958);

    vec4 i  = floor(v + dot(v, vec4(SQRT5B20)) );
    vec4 x0 = v -   i + dot(i, C.xxxx);

    vec4 i0;
    vec3 isX = step( x0.yzw, x0.xxx );
    vec3 isYZ = step( x0.zww, x0.yyz );
      
    i0.x = isX.x + isX.y + isX.z;
    i0.yzw = 1.0 - isX;
      
    i0.y += isYZ.x + isYZ.y;
    i0.zw += 1.0 - isYZ.xy;
    i0.z += isYZ.z;
    i0.w += 1.0 - isYZ.z;

    vec4 i3 = clamp( i0, 0.0, 1.0 );
    vec4 i2 = clamp( i0-1.0, 0.0, 1.0 );
    vec4 i1 = clamp( i0-2.0, 0.0, 1.0 );

    vec4 x1 = x0 - i1 + C.xxxx;
    vec4 x2 = x0 - i2 + C.yyyy;
    vec4 x3 = x0 - i3 + C.zzzz;
    vec4 x4 = x0 + C.wwww;
    
    i = mod289(i);
    float j0 = permute( permute( permute( permute(i.w) + i.z) + i.y) + i.x);
    vec4 j1 = permute( permute( permute( permute (
                        i.w + vec4(i1.w, i2.w, i3.w, 1.0 ))
                    + i.z + vec4(i1.z, i2.z, i3.z, 1.0 ))
                + i.y + vec4(i1.y, i2.y, i3.y, 1.0 ))
            + i.x + vec4(i1.x, i2.x, i3.x, 1.0 ));

    vec4 ip = vec4(1.0/294.0, 1.0/49.0, 1.0/7.0, 0.0) ;

    vec4 p0 = grad4(j0,   ip);
    vec4 p1 = grad4(j1.x, ip);
    vec4 p2 = grad4(j1.y, ip);
    vec4 p3 = grad4(j1.z, ip);
    vec4 p4 = grad4(j1.w, ip);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    p4 *= taylorInvSqrt(dot(p4,p4));

    vec3 m0 = max(0.6 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0);
    vec2 m1 = max(0.6 - vec2(dot(x3,x3), dot(x4,x4)            ), 0.0);
    m0 = m0 * m0;
    m1 = m1 * m1;
    return 49.0 * ( dot(m0*m0, vec3( dot( p0, x0 ), dot( p1, x1 ), dot( p2, x2 )))
            + dot(m1*m1, vec2( dot( p3, x3 ), dot( p4, x4 ) ) ) ) ;

}

float surface( vec4 coord ) 
{
	float n = 0.0;

	n += 0.25 * abs( snoise( coord * 4.0 ) );
	n += 0.5 * abs( snoise( coord * 8.0 ) );
	n += 0.25 * abs( snoise( coord * 16.0 ) );
	n += 0.125 * abs( snoise( coord * 32.0 ) );
	
	return n;
}

vec4 ambientLight(vec4 pixel, vec2 fragCoord, vec2 posLg) 
{
  vec3 lightColor = (color+vec3(2.))/3.;
  vec2 position = posLg;
  
  float maxDistance = lightSize + 0.055*sin(time*10.);
  float distance = distance(fragCoord-posLg, position);
  float value = 1.0 - smoothstep(-0.2, maxDistance, distance);
  
  vec3 ambient = pixel.rgb * color * intensity;
  vec3 light = (lightColor*lightColorAlpha) * clamp(value, 0.0, 1.0);
  vec3 intensity = ambient + light;
  vec3 final = pixel.rgb * intensity;

  return vec4(final, 1.0);
}

vec3 toGray(vec3 color)
{
  float average = (color.r + color.g + color.b) / 3.0;
  return vec3(average, average, average);
}

vec3 colorize(vec3 grayscale, vec3 color)
{
    return (grayscale * color);
}

vec4 blenderVec3(int blend, vec4 fColv4, vec4 sColv4)
{
    vec3 fCol = vec3(fColv4);
    vec3 sCol = vec3(sColv4);
    if ( blend == 1) { fCol = fCol * sCol; }
    else if (blend == 2) { fCol = (1. - (1. - fCol) * (1. - sCol)); }
    else if (blend == 3) { fCol = min(fCol, sCol); }
    else if (blend == 4) { fCol = max(fCol, sCol); }
    else if (blend == 5) { fCol = abs(fCol - sCol); }
    else if (blend == 6) { fCol = 1. - abs(1. - fCol - sCol); }
    else if (blend == 7) { fCol = fCol + sCol - (2. * fCol * sCol); }
    else if (blend == 8) { fCol = all(lessThanEqual(fCol, vec3(0.5, 0.5, 0.5))) ? (2. * fCol * sCol) : (1. - 2. * (1. - fCol) * (1. - sCol)); }
    else if (blend == 9) { fCol = all(lessThanEqual(sCol, vec3(0.5, 0.5, 0.5))) ? (2. * fCol * sCol) : (1. - 2. * (1. - fCol) * (1. - sCol)); }
    else if (blend == 10) { fCol = all(lessThanEqual(sCol, vec3(0.5, 0.5, 0.5))) ? (2. * fCol * sCol + fCol * fCol * (1. - 2. * sCol)) : sqrt(fCol) * (2. * sCol - 1.) + (2. * fCol) * (1. - sCol); }
    else if (blend == 11) { fCol = fCol / (1.0 - sCol + 0.00001); }
    else if (blend == 12) { fCol = 1.0 - (1.0 - fCol) / sCol + 0.00001; }
    else if (blend == 13) { fCol = fCol + sCol; return vec4(fCol,0.6); }
    else { fCol = fCol + sCol; }
    
    return vec4(fCol,(fColv4.a+sColv4.a)/2.);
}

float hexDist(vec2 p) 
{
	p = abs(p);
	
    float c = dot(p, normalize(vec2(1,1.73)));
    c = max(c, p.x);
    
    return c;
}

vec4 hexCoords(vec2 uv) 
{
	const vec2 r = vec2(1, 1.73);
    const vec2 h = r*.5;
    
    vec2 a = mod(uv, r)-h;
    vec2 b = mod(uv-h, r)-h;
    vec2 gv = dot(a, a) < dot(b,b) ? a : b;
    
    float x = atan(gv.x, gv.y);
    float y = .65-hexDist(gv);
    vec2 id = uv-gv;
    return vec4(x, y, id.x,id.y);
}

vec4 hexa(vec2 fragCoord)
{
    float t = time;
    
    vec2 uv = fragCoord/1.;
    vec2 uv1 = uv + vec2(0, sin(uv.x*1. +t)*.25);
    
    vec2 uv2 = .5*uv1 + .5*uv + vec2(sin(uv.y*5. + t)*.05, 0);
    float a = 1. + t*.1;
    float c = cos(a);
    float s = sin(a);
    uv2 *= mat2(c, -s, s, c);
    
    vec3 col = color;
    col += (smoothstep(abs(uv2.y)/1.5, 3.99, hexCoords(uv2*15.).y) * 40.*(sin(t)+1.));
    col += (smoothstep(abs(uv2.x)/1.5, 3.99, hexCoords(uv2*15.).y) * 40.*(cos(t)+1.));

    return vec4(colorize(toGray(clamp(col,0.,2.)),color),1.);
}

vec4 voronoi( in vec2 x, float step1, float step2 ) 
{
    vec2 n = floor(x);
    vec2 f = fract(x);

    vec2 mg, mr;
    float md = 8.0;
    for (int j= -1; j <= 1; j++) {
        for (int i= -1; i <= 1; i++) {
            vec2 g = vec2(float(i),float(j));
            vec2 o = random2( n + g );
            o = 0.5 + 0.5*sin( time + 6.2831*o );

            vec2 r = g + o - f;
            float d = dot(r,r);

            if( d<md ) {
                md = d;
                mr = r;
                mg = g;
            }
        }
    }

    md = 8.0;
    for (int j= -2; j <= 1; j++) {
        for (int i= -2; i <= 1; i++) {
            vec2 g = mg + vec2(float(i),float(j));
            vec2 o = random2( n + g );
            o = 0.5 + 0.5*sin( time + 6.2831*o );

            vec2 r = g + o - f;

            if ( dot(mr-r,mr-r)>0.000001 ) {
                md = min(md, dot( 0.6*(mr+r), normalize(r-mr) ));
            }
        }
    }
    vec3 intermediate = vec3(md, mr);
    vec3 final = (intermediate.x*(0.4 + .5*sin(64.0*intermediate.x))*color);
    final = mix( color, final, smoothstep( step1, step2, intermediate.x*18. ) );
    return vec4(final,1.);
}

float noise(vec2 n) 
{
	const vec2 d = vec2(0.0, 1.0);
	vec2 b = floor(n);
	vec2 f = smoothstep(vec2(0.), vec2(1.0), fract(n));
	return mix(mix(random(b), random(b + d.yx), f.x), 
	       mix(random(b + d.xy), random(b + d.yy), f.x), f.y);
}

float fbm(vec2 n) 
{
	float total = 0.0, amp = 1.;
	for (int i = 0; i < 7; i++) {
		total += noise(n) * amp;
		n += n;
		amp *= 0.5;
	}
	return total;
}

float fbm2(vec2 n) 
{
	float total = 0.0, amp = 1.;
	for (int i = 0; i < 2; i++) {
		total += noise(n) * amp;
		n += n;
		amp *= 0.5;
	}
	return total;
}

vec4 ripples(vec2 suv) 
{
    suv.x += time/2.;
    vec3 c1 = ( 0.0 ) * (color / 0.1);
    vec3 c2 = vec3(c1);
    vec3 c3 = vec3(c1);
    vec3 c4 = vec3( color.r/0.2, color.g/0.3, color.b/0.5 );
    vec3 c5 = vec3(c3);
    vec3 c6 = vec3(c1);
    vec2 p = suv;
    float q = 2.*fbm2(p + time*2.);
    vec2 r = vec2(fbm2(p + q + ( time  ) - p.x - p.y), fbm2(p + p + ( time )));
    r.x += bornedCos(-0.3,-0.2);
    r.y += 200.*bornedSin(-1.9,1.9);
    
    vec3 c = color * (
        mix( c1, c2, fbm( p + r ) ) + mix( c3, c4, r.x ) - mix( c5, c6, r.y )
    );
    return vec4(c,1.);
}

vec4 fire(vec2 suv) 
{
    vec3 c1 = color+(2.*vec3(0.1, 0.0, 0.))/3.;
	vec3 c2 = color+(2.*vec3(0.7, 0.0, 0.))/3.;
	vec3 c3 = color+(2.*vec3(0.2, 0.0, 0.))/3.;
	vec3 c4 = color+(2.*vec3(1.0, 0.9, 0.))/3.;
	vec3 c5 = vec3(0.1);
	vec3 c6 = vec3(0.9);
    vec2 uv = suv - vec2(0.92,0.26);
	vec2 p = uv.xy * 8.0;
	float q = fbm(p - time * 0.1);
	vec2 r = vec2(fbm(p + q + time * 0.7 - p.x - p.y), fbm(p + q - time * 0.4));
	vec3 c = mix(c1, c2, fbm(p + r)) + mix(c3, c4, r.x) - mix(c5, c6, r.y);
	return vec4(c * cos(1.57/(1.-0.03) * uv.y), 1.0);
}

vec4 surface4d(vec2 suv)
{
    float s = suv.x + 0.61;
    float t = suv.y + 0.5;
    
    float multiplier = 1.0 / ( 2.0 * PI );
    float nx = cos( s * 2.0 * PI ) * multiplier;
    float ny = cos( t * 2.0 * PI ) * multiplier;
    float nz = sin( s * 2.0 * PI ) * multiplier;
    float nw = sin( t * 2.0 * PI ) * multiplier;

    float surf = surface( vec4( nx, ny, nz, nw ) + time * SPEED * 3. );
    return vec4( color * vec3( surf ), 1.0 );
}

vec4 fbmy(vec2 suv)
{
    vec4 noiseColor;
    noiseColor.r = (color.r * fbm(suv + time/2.));
    noiseColor.g = (color.g * fbm(suv + time/2.));
    noiseColor.b = (color.b * fbm(suv + time/2.));
    noiseColor.a = 1.;
    return clamp(noiseColor,0.,1.);
}

vec4 noisy(vec2 suv)
{
    vec4 noiseColor;
    noiseColor.r = (color.r * noise(suv + fbm(suv) + time/2.));
    noiseColor.g = (color.g * noise(suv + fbm(suv) + time/2.));
    noiseColor.b = (color.b * noise(suv + fbm(suv) + time/2.));
    noiseColor.a = 1.;
    return clamp(noiseColor,0.,1.);
}

vec2 circuit(vec2 p) {
	p = fract(p);
	float r = 0.3;
	float v = 0.0, g = 1.0;
	float d;
	
	const int iter = 7;
	for(int i = 0; i < iter; i ++)
	{
		d = p.x - r;
		g += pow(clamp(1.0 - abs(d), 0.0, 1.0), 200.0);
		
		if(d > 0.0) {
			p.x = (p.x - r) / (1.8 - r);
		}
		else {
			p.x = p.x;
		}
		p = p.yx;
	}
	v /= float(iter);
	return vec2(g, v);
}

vec4 denseSmoke(vec2 suv)
{
    vec4 noiseColor;
    vec2 uv;
    uv.x = (fbm(suv*2.)-suv.x);
    uv.y = (suv.y+fbm(suv*2.));
    uv *= 1.;
    noiseColor.r = (color.r * min(fbm(uv - time/2.),fbm(uv)*1.5));
    noiseColor.g = (color.g * min(fbm(uv - time/2.),fbm(uv)*1.5));
    noiseColor.b = (color.b * min(fbm(uv - time/2.),fbm(uv)*1.5));
    noiseColor.a = 1.0;
    return clamp(noiseColor,0.,1.);
}

vec4 dancingFume(vec2 suv)
{
    vec4 noiseColor;
    vec2 uv;
    uv.x += noise(suv)+fbm(suv);
    uv.y += noise(suv)+fbm(suv);
    uv *= 0.5;
    noiseColor.r = (color.r * fbm((uv + suv*0.15) - time));
    noiseColor.g = (color.g * fbm((uv + suv*0.15) - time));
    noiseColor.b = (color.b * fbm((uv + suv*0.15) - time));
    noiseColor.a = 1.0;
    return clamp(noiseColor,0.,1.);
}

vec4 hugeSmoke(vec2 suv)
{
    vec4 noiseColor;
    vec2 uv;
    uv.x += sin(suv.y)+fbm(suv);
    uv.y += cos(suv.x)+fbm(suv);
    uv *= 0.5;
    noiseColor.r = (color.r * fbm((uv + suv) - time));
    noiseColor.g = (color.g * fbm((uv + suv) - time));
    noiseColor.b = (color.b * fbm((uv + suv) - time));
    noiseColor.a = 1.0;
    return clamp(noiseColor,0.,1.);
}

vec4 grid(vec2 suv)
{
    vec2 uv = suv + vec2(0.,-1.5);
	vec2 cid2 = floor(uv);
	float cid = (cid2.y + cid2.x);

	vec2 dg = circuit(uv);
	float d = dg.x;
	vec3 col1 = (0.5-vec3(max(min(d, 2.0) - 1., 0.))) * color * 2.;
    col1.r = sqrt(col1.r/2.);
	col1.g = sqrt(col1.g/2.);
	col1.b = sqrt(col1.b/2.);
	vec3 col2 = vec3(max(d - 1.0, 0.0)) * color * 30. ;

	float f = max(0.7 - mod(sin(-uv.y) - cos(-uv.x) + (time * 1.) + (dg.y * 0.2), 0.9), 0.0) * 1.;
	col2 *= f;

    return vec4(col1 + col2, 1.0);
}

vec4 galaxy(vec2 suv)
{
    vec2 uv = suv/6. 
        + vec2(bornedCos(0.0,0.7),
               bornedSin(0.0,0.7));

    float t = 4.4 * time 
            * 0.1 + (
            ( 0.25 + 0.05 * sin( time * 0.44 ) ) 
            / ( length( uv.xy ) + 0.2 )) * 2.2;
    
    float si = sin( t * 1.5 );
    float co = cos( t / 1.5 );
    mat2 matrix = mat2( -co, si, si, co );
    
    float c;
    float v1 = 0.0;
    float v2 = 0.0;
    vec3 uv2 = vec3( uv, 0.0 );
    
    for( int i = 0; i < 50; i++ ) {
        float s = float( i ) * 0.035;
        vec3 p = s * uv2;
        p.xy *= matrix;
        p += vec3( .22,.3, s - 1.5 - sin( t * 0.13 ) * 0.1 );

        for( int i = 0; i < 6; i++ ) {
            p = abs( p ) / dot( p, p ) - 0.659;
        }

        v1 += dot( p,p ) * 0.0015 * 3. * ( 1.8 + sin( length( uv.xy * 13.0 ) + 0.5 - t * 0.2 ) );
        v2 += dot( p,p ) * 0.0015 * 3. * ( 1.5 + sin( length( uv.xy * 13.5 ) + 2.2 - t * 0.3 ) );
        c = length( p.xy * 0.5 ) * 0.35 * 3.;
    }
    
    float len = length( uv );
    v1 *= smoothstep( 0.7, 0.0, len );
    v2 *= smoothstep( 0.6, 0.0, len );
    
    float r = clamp( c, 0.0, 1.0 );
    float g = clamp( ( v1 + c ) * 0.25, 0.0, 1.0 );
    float b = clamp( v2, 0.0, 1.0 );
    vec3 col = color * vec3( r, g, b ) + smoothstep( 0.15, 0.0, len ) * 0.9;

    return clamp(vec4( col, 1.0 ),0.,1.);
}

vec2 getSphere(out float alpha, out float r)
{
  vec2 tc = vFilterCoord.xy;
  vec2 p = (-1.0 + 2. * tc) * (1.01 / radius+0.000001);
  r = dot(p,p);
  alpha = 1.0;
  if (r > 1.0) alpha = (1./r)-0.85;
  if (alpha < 0.) alpha = 0.;
  float f = (1.0-sqrt(1.0-r))/(r);
  vec2 uv;
  uv.x = p.x*f;
  uv.y = p.y*f;
  return uv;
}

void main()
{
    float a, r;
    vec4 result;

    vec4 pixel = texture2D(uSampler, vTextureCoord);

    vec2 uv = getSphere(a, r);

    if (shieldType <= 1) {
        result = ripples(15.*uv*scale);
    } else if (shieldType == 2) {
        result = hexa(uv*scale);
    } else if (shieldType == 3) {
        result = fire(uv/1.5*scale);
    } else if (shieldType == 4) {
        result = voronoi(uv*scale*3.+0.3*cos(time),0.29,0.0);
    } else if (shieldType == 5) {
        result = voronoi(uv*scale*3.+0.3*cos(time),0.0019,1.);
    } else if (shieldType == 6) {
        result = 3.*surface4d(uv*scale);
    } else if (shieldType == 7) {
        result = noisy(uv*20.*scale);
    } else if (shieldType == 8) {
        result = denseSmoke(uv*10.*scale);
    } else if (shieldType == 9) {
        result = dancingFume(uv*20.*scale);
    } else if (shieldType == 10) {
        result = hugeSmoke(uv*5.*scale);
    } else if (shieldType == 11) {
        result = grid(uv*5.*scale);
    } else if (shieldType == 12) {
        result = galaxy(uv*5.*scale);
    } else if (shieldType != 1) {
        result = vec4(color,1.);
    }
   
    float glow = 
        0.05 / (0.015 + distance(radius + .008, 0.99));

    result.a = a;

    vec4 colorized;
    vec3 chromaOption;

    if (chromatic) {
        vec2 vHue = uv;
        vHue.x -= bornedCos(-0.,+2.2);
        vHue.y -= bornedSin(-0.,+2.2);
        chromaOption = vec3(multihue(vHue));
    } else {
        chromaOption = color;
    }

    colorized = (vec4(
                    colorize(
                        toGray(result.rgb + glow), chromaOption), result.a) + result)/2.;
    
    vec4 final = clamp(ambientLight(clamp(colorized, 0., 1.)*intensity, uv, posLight-vec2(0.5,0.5)),0.,1.);

    gl_FragColor =
            r > 1.0
                ? pixel*(1.-a)
                : (pixel.a < 1. 
                        ? mix(blenderVec3(13, pixel, final),blenderVec3(blend, pixel, final),pixel.a)
                        : blenderVec3(blend, pixel, final));
}
`;