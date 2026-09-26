import { CustomBlending, OneFactor, PlaneGeometry, ShaderMaterial, ZeroFactor } from 'three'

/**
 * Oil-lamp flames as camera-facing quads with a procedural shader: a small blue
 * root, a yellow-white core, an orange body tapering to a flickering tip, and a
 * soft glow around it. Drawn additively (rgb only; the canvas's alpha is left
 * alone), so on the transparent canvas they add light to whatever is behind.
 */

/** rgb += src, alpha unchanged: light added over the page. */
export const ADD_LIGHT = {
  blending: CustomBlending,
  blendSrc: OneFactor,
  blendDst: OneFactor,
  blendSrcAlpha: ZeroFactor,
  blendDstAlpha: OneFactor,
} as const

/** Quad with its origin at the flame's root; the flame body spans the middle third in x. */
export function flameGeometry() {
  const g = new PlaneGeometry(1, 1)
  g.translate(0, 0.5, 0)
  return g
}

export function flameMaterial(seed: number) {
  return new ShaderMaterial({
    ...ADD_LIGHT,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    uniforms: { uTime: { value: 0 }, uSeed: { value: seed }, uLit: { value: 1 } },
    vertexShader: /* glsl */ `
      uniform float uTime, uSeed, uLit;
      varying vec2 vUv;
      varying float vN;
      void main() {
        vUv = uv;
        float t = uTime;
        float n = sin(t * 6.1 + uSeed * 7.0) * 0.55 + sin(t * 11.3 + uSeed * 3.0) * 0.3 + sin(t * 23.7 + uSeed) * 0.15;
        vN = n;
        vec3 p = position;
        p.y *= (0.93 + 0.07 * n) * mix(0.12, 1.0, uLit);
        p.x *= mix(0.55, 1.0, uLit);
        p.x += n * 0.035 * uv.y * uv.y;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, uSeed, uLit;
      varying vec2 vUv;
      varying float vN;
      void main() {
        // Flame space: x in [-1, 1] across the body (the middle third of the quad), y 0..1 up.
        float x = (vUv.x - 0.5) * 6.0;
        float y = vUv.y * 1.18;
        x -= vN * 0.18 * y * y;                          // the tip leans with the draught
        float yp = pow(clamp(y, 0.0, 1.0), 0.6);
        float hw = pow(clamp(4.0 * yp * (1.0 - yp), 0.0, 1.0), 0.8) + 1e-3;
        float d = abs(x) / hw;
        float inside = step(y, 1.0);
        float body = smoothstep(1.0, 0.45, d) * smoothstep(0.0, 0.07, y) * inside;
        float core = smoothstep(0.7, 0.05, d) * smoothstep(0.04, 0.2, y) * smoothstep(0.72, 0.3, y) * inside;
        float root = smoothstep(0.2, 0.02, y) * smoothstep(1.1, 0.2, d) * smoothstep(0.0, 0.03, y);
        vec3 bodyCol = mix(vec3(1.0, 0.38, 0.07), vec3(1.0, 0.66, 0.22), smoothstep(0.95, 0.3, y));
        vec3 col = bodyCol * body * 1.05 + vec3(1.0, 0.9, 0.66) * core * 1.25 + vec3(0.18, 0.28, 1.0) * root * 0.28;
        // A soft glow around the flame, inside the quad.
        vec2 g = vec2((vUv.x - 0.5) * 2.2, (vUv.y - 0.36) * 1.7);
        col += vec3(1.0, 0.55, 0.2) * exp(-dot(g, g) * 5.0) * 0.16;
        float flick = 0.93 + 0.07 * sin(uTime * 17.0 + uSeed * 5.0);
        // Fade the quad's rectangle to nothing at its borders.
        float edge = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x) * smoothstep(1.0, 0.9, vUv.y);
        gl_FragColor = vec4(col * uLit * flick * edge, 0.0);
      }`,
  })
}

/** A wide, faint halo around the cluster of flames: the lamp's light in the air, without a bloom pass. */
export function haloMaterial() {
  return new ShaderMaterial({
    ...ADD_LIGHT,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
    uniforms: { uGain: { value: 0 }, uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uGain, uTime;
      varying vec2 vUv;
      void main() {
        vec2 p = (vUv - 0.5) * 2.0;
        float r2 = dot(p, p);
        float g = exp(-r2 * 9.0) * 0.55 + exp(-r2 * 2.6) * 0.25;
        g *= smoothstep(1.0, 0.7, sqrt(r2));
        float flick = 0.95 + 0.05 * sin(uTime * 9.0) * sin(uTime * 3.7);
        gl_FragColor = vec4(vec3(1.0, 0.62, 0.3) * g * uGain * flick, 0.0);
      }`,
  })
}
