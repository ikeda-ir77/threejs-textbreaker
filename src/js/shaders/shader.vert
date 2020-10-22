attribute vec3 fPosition;
attribute vec3 tPosition;
attribute vec3 rPosition;

uniform float ticker;

varying vec2 vUv;

void main() {
  vUv = uv;

  vec3 pos = mix(fPosition, mix(rPosition, tPosition, ticker), ticker);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}