import { Color, ShaderMaterial, Vector3 } from 'three'
import { ADD_LIGHT } from './flames'

export const MAX_FLAMES = 5

/**
 * The lamp's light on a surface that the page already paints (the red-oxide floor,
 * the plastered wall): this draws only the light that surface would gain from the
 * flames, albedo × flame colour × Σ cosθ / d², added over the page.
 *
 * On the floor, the dish shades part of each flame's light: a ray from the floor to a
 * flame that crosses the dish's plane inside its rim is blocked (softly), which gives
 * the star of overlapping shadows a five-wick lamp throws around its own foot.
 */
export function lightCatcherMaterial({ albedo, normal, dish }: { albedo: string; normal: Vector3; dish?: { y: number; r: number } }) {
  return new ShaderMaterial({
    ...ADD_LIGHT,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    defines: { N_FLAMES: MAX_FLAMES, DISH: dish ? 1 : 0 },
    uniforms: {
      uFlames: { value: Array.from({ length: MAX_FLAMES }, () => new Vector3()) },
      uLit: { value: new Array(MAX_FLAMES).fill(0) },
      uAlbedo: { value: new Color(albedo) },
      uLight: { value: new Color('#ffb566') },
      uNormal: { value: normal },
      uGain: { value: 0.002 },
      uDish: { value: new Vector3(0, dish?.y ?? 0, dish?.r ?? 0) },
      uClipZ: { value: -10 },
      uFadeAt: { value: new Vector3() },
      uFadeR: { value: [0.3, 0.6] },
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vWorld = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uFlames[N_FLAMES];
      uniform float uLit[N_FLAMES];
      uniform vec3 uAlbedo, uLight, uNormal, uDish, uFadeAt;
      uniform float uFadeR[2];
      uniform float uGain, uClipZ;
      varying vec3 vWorld;
      void main() {
        if (vWorld.z < uClipZ) discard;
        float sum = 0.0;
        for (int i = 0; i < N_FLAMES; i++) {
          vec3 L = uFlames[i] - vWorld;
          float d2 = max(dot(L, L), 1e-4);
          float cosT = max(dot(uNormal, L) * inversesqrt(d2), 0.0);
          float occ = 1.0;
          #if DISH
            float t = (uDish.y - vWorld.y) / L.y;
            vec2 c = vWorld.xz + L.xz * t;
            occ = smoothstep(uDish.z - 0.015, uDish.z + 0.02, length(c));
          #endif
          sum += uLit[i] * cosT / d2 * occ;
        }
        // Keep the light off the edges of the quad (and so off the edges of the canvas).
        float fade = 1.0 - smoothstep(uFadeR[0], uFadeR[1], distance(vWorld, uFadeAt));
        gl_FragColor = vec4(uAlbedo * uLight * sum * uGain * fade, 0.0);
      }`,
  })
}
