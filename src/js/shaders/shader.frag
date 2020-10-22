uniform sampler2D map;
varying vec4 vColor;
varying vec2 vUv;

void main() {
//  gl_FragColor = texture2D(map, vUv);
  float a = gl_FragCoord.x / 512.0;
  gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
}