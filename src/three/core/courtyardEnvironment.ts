import {
  BackSide, BoxGeometry, Color, Mesh, MeshBasicMaterial, PlaneGeometry, PMREMGenerator, Scene,
  type Texture, type WebGLRenderer,
} from 'three'

/**
 * Image-based light for objects standing under the courtyard beam, built from
 * geometry (nothing downloaded): what polished brass there would reflect.
 * Units are metres; the object stands at the origin, the viewer is toward +z.
 *
 *   - the square of sky in the nadumuttam, overhead and toward the viewer (the key light);
 *   - the sunlit courtyard floor behind the viewer (warm bounce);
 *   - lime-plastered walls, the dark carved beam and pillars behind the object;
 *   - the red-oxide floor it stands on; dark rafters above.
 */
export function courtyardEnvironment(renderer: WebGLRenderer): Texture {
  const scene = new Scene()
  const add = (geo: BoxGeometry | PlaneGeometry, hex: string, gain: number, place: (m: Mesh) => void, side = 0) => {
    const mat = new MeshBasicMaterial({ color: new Color(hex).multiplyScalar(gain) })
    if (side) mat.side = BackSide
    const m = new Mesh(geo, mat)
    place(m)
    scene.add(m)
    return m
  }
  // The room: plaster walls (inside faces of a box).
  add(new BoxGeometry(7, 4.2, 7), '#d6d0bd', 0.5, (m) => m.position.set(0, 2.1, 0.8), 1)
  // Red-oxide floor, cool and slightly dark.
  add(new PlaneGeometry(7, 7), '#6e2419', 0.12, (m) => { m.rotation.x = -Math.PI / 2; m.position.set(0, 0.002, 0.8) })
  // Rafters and roof underside.
  add(new PlaneGeometry(7, 7), '#2a1a10', 0.25, (m) => { m.rotation.x = Math.PI / 2; m.position.set(0, 4.19, 0.8) })
  // The nadumuttam: open sky, overhead and in front of the object.
  add(new PlaneGeometry(2.6, 2.6), '#e4e8e0', 6, (m) => { m.rotation.x = Math.PI / 2; m.position.set(0, 4.15, 2.3) })
  // Sunlit courtyard floor behind the viewer: warm bounce light.
  add(new PlaneGeometry(6.6, 2.4), '#cbb89a', 1.7, (m) => { m.rotation.y = Math.PI; m.position.set(0, 1.0, 4.28) })
  // The beam and the pillars behind the object.
  add(new PlaneGeometry(7, 0.7), '#3d2515', 0.35, (m) => m.position.set(0, 2.5, -2.68))
  for (const x of [-1.9, 1.9]) add(new BoxGeometry(0.22, 4.2, 0.22), '#24150c', 0.4, (m) => m.position.set(x, 2.1, -2.4))

  const pmrem = new PMREMGenerator(renderer)
  const target = pmrem.fromScene(scene, 0.035)
  pmrem.dispose()
  scene.traverse((o) => {
    if (o instanceof Mesh) { o.geometry.dispose(); (o.material as MeshBasicMaterial).dispose() }
  })
  return target.texture
}
