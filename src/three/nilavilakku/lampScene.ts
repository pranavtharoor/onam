import {
  NeutralToneMapping, Color, DoubleSide, Group, MathUtils, Mesh, MeshBasicMaterial, MeshStandardMaterial,
  Object3D, PerspectiveCamera, PlaneGeometry, PointLight, Scene, Vector3, type Texture, type WebGLRenderer,
} from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { courtyardEnvironment } from '../core/courtyardEnvironment'
import { flameGeometry, flameMaterial, haloMaterial } from './flames'
import { lightCatcherMaterial, MAX_FLAMES } from './lightCatcher'

/**
 * The nilavilakku under the painted beam, in WebGL.
 *
 * World: metres, y up, the lamp's foot at the origin, the viewer toward +z.
 * The camera is framed from the page's layout, not from fixed numbers: the flame
 * cluster is pinned to the page's FLAME_AT point (the next scene's iris opens there)
 * via an off-centre projection, and the camera distance puts the lamp's foot on the
 * painted floor band.
 */

// ---- story timing, in the nadumuttam timeline's progress (see NadumuttamScene: tilt-down 0.22–0.48,
// light-on-the-beam 0.44–0.62, then the hold under the next scene's iris).
/** The five wicks are lit one after another as the beam's letters come up. */
export const LIGHTING = { start: 0.45, step: 0.032, each: 0.03 }
/** The camera cranes up a little and settles as the wall arrives. */
const CRANE = { start: 0.3, end: 0.64, elev: [3, 11] as const, yaw: [-14, 0] as const }

const FOV = 17                       // a long lens: little distortion, like the flat painted room
const FLAME_Y = 0.448                // the middle of the flames
const DISH = { y: 0.421, r: 0.094 }  // the dish's plane and rim, for the floor's shadowing
const FLAME_SIZE = { w: 0.042, h: 0.036 } // quad: 3× the flame's width; ≈ 3.2 cm tall flames
const LIGHT = { color: '#ff9f4d', candela: 0.004 }

export interface LampLayout {
  width: number
  height: number
  /** Flame point, as fractions of the canvas. */
  flame: { x: number; y: number }
  /** Where the lamp's foot should stand, as a fraction of canvas height. */
  foot: number
  /** The painted floor's far edge (where it meets the wall), as a fraction of canvas height. */
  floorLine: number
}

export interface LampScene {
  layout(l: LampLayout): void
  /** Returns true when something changed and the frame needs drawing. */
  update(progress: number, time: number): boolean
  render(): void
  dispose(): void
}

const smooth = (e0: number, e1: number, x: number) => {
  const t = MathUtils.clamp((x - e0) / (e1 - e0), 0, 1)
  return t * t * (3 - 2 * t)
}

export async function createLampScene(renderer: WebGLRenderer, url: string): Promise<LampScene> {
  renderer.toneMapping = NeutralToneMapping
  renderer.toneMappingExposure = 1.0

  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
  const gltf = await loader.loadAsync(url)

  const scene = new Scene()
  const env: Texture = courtyardEnvironment(renderer)
  scene.environment = env

  const lamp = gltf.scene
  scene.add(lamp)
  const anchors: Object3D[] = []
  const disposables: { dispose(): void }[] = [env]

  lamp.traverse((o) => {
    if (/^Flame_\d$/.test(o.name)) anchors.push(o)
    if (!(o instanceof Mesh)) return
    const m = o.material as MeshStandardMaterial
    if (o.name === 'Nilavilakku') {
      // Turned brass: the lathe leaves fine rings, so highlights stretch around the lamp (anisotropy along u).
      const brass = new MeshStandardMaterial({
        map: m.map, aoMap: m.aoMap, roughnessMap: m.roughnessMap, metalnessMap: m.metalnessMap,
        metalness: 1, roughness: 1, aoMapIntensity: 1, envMapIntensity: 1.0,
      })
      m.dispose()
      o.material = brass
      disposables.push(brass)
    } else if (o.name === 'Oil') {
      // Coconut oil: a thin, glossy, amber layer over the brass.
      const oil = new MeshStandardMaterial({ color: new Color('#5a3510'), roughness: 0.04, metalness: 0, transparent: true, opacity: 0.72, envMapIntensity: 1.3 })
      m.dispose()
      o.material = oil
      o.renderOrder = 1
      disposables.push(oil)
    } else if (o.name === 'Shadow') {
      const shadow = new MeshBasicMaterial({ map: m.map, color: 0x000000, transparent: true, opacity: 0.55, depthWrite: false })
      m.dispose()
      o.material = shadow
      o.renderOrder = -1
      disposables.push(shadow)
    } else if (o.name.startsWith('Wick')) {
      m.roughness = 0.85
      m.side = DoubleSide
    }
    disposables.push(o.geometry)
  })
  anchors.sort((a, b) => a.name.localeCompare(b.name))

  // ---- flames, their light, and the light they throw on the painted floor and wall
  const flames = new Group()
  scene.add(flames)
  const fGeo = flameGeometry()
  disposables.push(fGeo)
  const flameMeshes = anchors.map((a, i) => {
    const mat = flameMaterial(i * 1.7 + 0.3)
    const mesh = new Mesh(fGeo, mat)
    a.getWorldPosition(mesh.position)
    mesh.position.y -= 0.004
    mesh.scale.set(FLAME_SIZE.w, FLAME_SIZE.h, 1)
    mesh.renderOrder = 3
    flames.add(mesh)
    disposables.push(mat)
    return mesh
  })
  // One light for the brass, not five: per-pixel lights are the lamp's main cost on weak GPUs,
  // and at this size five glints read as one. It sits at the front flame (the one facing the
  // guest), so the spire and dish catch the light where the eye expects it; the floor and wall
  // light (lightCatcher) still sums all five flames.
  const light = new PointLight(LIGHT.color, 0, 0, 2)
  if (flameMeshes[0]) light.position.copy(flameMeshes[0].position).add(new Vector3(0, 0.012, 0))
  scene.add(light)
  const halo = new Mesh(new PlaneGeometry(1, 1), haloMaterial())
  halo.position.set(0, FLAME_Y + 0.004, 0)
  halo.scale.setScalar(0.24)
  halo.renderOrder = 4
  scene.add(halo)
  disposables.push(halo.geometry, halo.material)

  const floorMat = lightCatcherMaterial({ albedo: '#6e2419', normal: new Vector3(0, 1, 0), dish: DISH })
  // Quads only as large as the light's fade radius (uFadeR): pixels outside them cost nothing.
  const floor = new Mesh(new PlaneGeometry(1.5, 1.5), floorMat)
  floor.rotation.x = -Math.PI / 2
  floor.position.y = 0.0005
  floor.renderOrder = 2
  scene.add(floor)
  const wallMat = lightCatcherMaterial({ albedo: '#d9cdb0', normal: new Vector3(0, 0, 1) })
  const wall = new Mesh(new PlaneGeometry(0.86, 0.86), wallMat)
  wall.renderOrder = 2
  scene.add(wall)
  disposables.push(floor.geometry, floorMat, wall.geometry, wallMat)
  for (const mat of [floorMat, wallMat]) {
    flameMeshes.forEach((f, i) => mat.uniforms.uFlames!.value[i].copy(f.position).add(new Vector3(0, 0.012, 0)))
  }
  floorMat.uniforms.uGain!.value = 0.0016
  floorMat.uniforms.uFadeAt!.value.set(0, 0, 0)
  floorMat.uniforms.uFadeR!.value = [0.25, 0.75]
  wallMat.uniforms.uGain!.value = 0.0011
  wallMat.uniforms.uFadeR!.value = [0.12, 0.42]

  // ---- camera, framed from the page
  const camera = new PerspectiveCamera(FOV, 1, 0.05, 30)
  // The pivot is the front flame (the one facing the guest): the next scene's iris opens from it.
  const pivot = flameMeshes[0] ? flameMeshes[0].position.clone().add(new Vector3(0, 0.011, 0)) : new Vector3(0, FLAME_Y, 0)
  let distance = 3
  let offset = { x: 0, y: 0 }
  let lastKey = ''

  const place = (elevDeg: number, yawDeg: number) => {
    const e = MathUtils.degToRad(elevDeg)
    const a = MathUtils.degToRad(yawDeg)
    camera.position.set(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)).multiplyScalar(distance).add(pivot)
    camera.lookAt(pivot)
    camera.updateMatrixWorld()
  }
  const project = () => {
    camera.updateProjectionMatrix()
    // Off-centre projection: the pivot lands on the flame point instead of the canvas centre.
    const e = camera.projectionMatrix.elements
    e[8] = -offset.x
    e[9] = -offset.y
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert()
  }
  const screenY = (p: Vector3) => 0.5 - p.clone().project(camera).y / 2

  let layout: LampLayout | null = null
  const api: LampScene = {
    layout(l) {
      layout = l
      camera.aspect = l.width / l.height
      offset = { x: l.flame.x * 2 - 1, y: 1 - l.flame.y * 2 }
      // Distance so the foot stands at l.foot (settled pose; small-angle, then refined).
      const e1 = MathUtils.degToRad(CRANE.elev[1])
      const t = Math.tan(MathUtils.degToRad(FOV) / 2)
      distance = (pivot.y * Math.cos(e1)) / (2 * t * (l.foot - l.flame.y))
      for (let i = 0; i < 4; i++) {
        place(CRANE.elev[1], 0)
        project()
        const got = screenY(new Vector3(0, 0, 0))
        distance *= (got - l.flame.y) / (l.foot - l.flame.y)
      }
      place(CRANE.elev[1], 0)
      project()
      // The wall stands where the painted floor meets it.
      let lo = 0.05, hi = 6
      for (let i = 0; i < 30; i++) {
        const mid = (lo + hi) / 2
        if (screenY(new Vector3(0, 0, -mid)) > l.floorLine) lo = mid; else hi = mid
      }
      const wallZ = -(lo + hi) / 2
      wall.position.set(0, FLAME_Y, wallZ)
      floorMat.uniforms.uClipZ!.value = wallZ
      wallMat.uniforms.uFadeAt!.value.set(0, FLAME_Y, wallZ)
      lastKey = ''
    },
    update(progress, time) {
      // Once the hold is over, the next scene's iris has covered the lamp completely.
      if (!layout || progress >= 0.999) return false
      const c = smooth(CRANE.start, CRANE.end, progress)
      place(MathUtils.lerp(CRANE.elev[0], CRANE.elev[1], c), MathUtils.lerp(CRANE.yaw[0], CRANE.yaw[1], c))
      project()
      let litSum = 0
      let glow = 0
      flameMeshes.forEach((f, i) => {
        const lit = smooth(LIGHTING.start + i * LIGHTING.step, LIGHTING.start + i * LIGHTING.step + LIGHTING.each, progress)
        litSum += lit
        const u = (f.material as ReturnType<typeof flameMaterial>).uniforms
        u.uTime!.value = time
        u.uLit!.value = lit
        f.visible = lit > 0.001
        // Cylindrical billboard: flames stay upright and turn to the camera.
        f.rotation.y = Math.atan2(camera.position.x - f.position.x, camera.position.z - f.position.z)
        const flicker = 0.9 + 0.06 * Math.sin(time * 6.1 + i * 7) + 0.04 * Math.sin(time * 13.7 + i)
        glow += lit * flicker
        floorMat.uniforms.uLit!.value[i] = lit * flicker
        wallMat.uniforms.uLit!.value[i] = lit * flicker
      })
      light.intensity = LIGHT.candela * glow
      const hu = (halo.material as ReturnType<typeof haloMaterial>).uniforms
      hu.uGain!.value = (0.55 * litSum) / MAX_FLAMES
      hu.uTime!.value = time
      halo.quaternion.copy(camera.quaternion)
      const key = `${progress.toFixed(5)}|${litSum > 0 ? time.toFixed(3) : ''}`
      const changed = key !== lastKey
      lastKey = key
      return changed
    },
    render() {
      renderer.render(scene, camera)
    },
    dispose() {
      disposables.forEach((d) => d.dispose())
      scene.clear()
    },
  }
  return api
}
