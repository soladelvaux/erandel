/* ---------- painted materials for authored assets (ERANDEL_ART_BIBLE.md §11) ---------- */
/** Shared clock for wind and water shaders (seconds). */
const PAINT_T={value:0};
/** GLSL: value noise used for brush variation in world space. */
const PAINT_NOISE='float pH(vec3 p){p=fract(p*0.3183099+0.1);p*=17.0;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}\nfloat pN(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.0-2.0*f);return mix(mix(mix(pH(i),pH(i+vec3(1,0,0)),f.x),mix(pH(i+vec3(0,1,0)),pH(i+vec3(1,1,0)),f.x),f.y),mix(mix(pH(i+vec3(0,0,1)),pH(i+vec3(1,0,1)),f.x),mix(pH(i+vec3(0,1,1)),pH(i+vec3(1,1,1)),f.x),f.y),f.z);}\n';
const PAINTED_MATS={};
/** Returns the shared material for authored prefabs. kind: 'painted' (stone, wood, rock),
 *  'foliage' (alpha-cut leaf and grass cards from the atlas). wind: vertices sway by their _wind weight.
 *  All of them: vertex colour x painted brush variation in world space, and the camera dissolve. */
function paintedMat(kind,wind,map,small){
 const key=kind+(wind?'w':'')+(map?'m':'')+(small?'s':'');if(PAINTED_MATS[key])return PAINTED_MATS[key];
 const fol=kind==='foliage';
 const m=new THREE.MeshLambertMaterial({vertexColors:true,map:fol?map:null,alphaTest:fol?.45:0,side:fol?THREE.DoubleSide:THREE.FrontSide});
 m.defines={};if(wind)m.defines.USE_WIND='';if(small)m.defines.SMALL_FADE='';
 m.onBeforeCompile=sh=>{
  sh.uniforms.uT=PAINT_T;sh.uniforms.uWind=PAINT_WIND;sh.uniforms.uFadeP=FADE;sh.uniforms.uCamP=FADE_CAM;
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uT;\nuniform float uWind;\nvarying vec3 vPW;\n#ifdef USE_WIND\nattribute float _wind;\n#endif')
   .replace('#include <begin_vertex>','#include <begin_vertex>\n#ifdef USE_WIND\nvec3 ip=vec3(0.0);\n#ifdef USE_INSTANCING\nip=vec3(instanceMatrix[3][0],instanceMatrix[3][1],instanceMatrix[3][2]);\n#endif\nfloat ph=uT*1.25+ip.x*0.37+ip.z*0.29;\nfloat sw=sin(ph)*0.6+sin(ph*2.3+transformed.y*0.45)*0.4;\nfloat wk=uWind*2.857;\ntransformed.x+=sw*_wind*0.16*wk;\ntransformed.z+=cos(ph*0.8+transformed.x*0.3)*_wind*0.11*wk;\ntransformed.y+=sin(ph*3.1+transformed.x*1.7)*_wind*0.025;\n#endif\nvec4 pw=vec4(transformed,1.0);\n#ifdef USE_INSTANCING\npw=instanceMatrix*pw;\n#endif\nvPW=(modelMatrix*pw).xyz;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vPW;\nuniform vec3 uFadeP;\nuniform vec3 uCamP;\n'+PAINT_NOISE)
   .replace('void main() {','void main() {\nvec3 fa=uCamP,fb=uFadeP+vec3(0.0,1.0,0.0),fab=fb-fa;float ft=clamp(dot(vPW-fa,fab)/max(dot(fab,fab),0.001),0.0,1.0);float fd=length(vPW-(fa+ft*fab));float fdC=distance(vPW,uCamP);\n#ifdef SMALL_FADE\nfloat fk=(fdC-0.8)/1.6;\n#else\nfloat fk=min((fdC-1.0)/2.2,ft<0.9?(fd-0.6)/1.4:1.0);\n#endif\n\nif(fk<1.0){vec2 ba=floor(gl_FragCoord.xy);vec2 bb=floor(ba*0.5);float th=fract(bb.x*0.5+bb.y*bb.y*0.75)*0.25+fract(ba.x*0.5+ba.y*ba.y*0.75)+0.03125;if(th>fk)discard;}')
   .replace('#include <color_fragment>','#include <color_fragment>\nfloat bs=pN(vec3(vPW.x*0.9+vPW.y*0.35,vPW.y*2.6,vPW.z*0.9-vPW.y*0.2));float bw=pN(vPW*0.23+7.0);\ndiffuseColor.rgb*=0.86+0.26*bs;\ndiffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.06,1.01,0.9),bw*0.6);')
   .replace('#include <normal_fragment_begin>',fol?'#include <normal_fragment_begin>\n#ifdef DOUBLE_SIDED\nnormal*=faceDirection;\n#endif':'#include <normal_fragment_begin>');
 };
 m.customProgramCacheKey=()=>'erandel-painted-'+key;
 return(PAINTED_MATS[key]=m);
}
