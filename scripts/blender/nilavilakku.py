"""
Nilavilakku: a Kerala standing brass lamp, built procedurally for the 3D edition.

Run (headless):
  blender -b --factory-startup --python scripts/blender/nilavilakku.py -- \
      --out public/models/src/nilavilakku.glb [--tex 1024] [--preview qa-artifacts/blender] [--samples 96]

What it builds (units: metres in the file, centimetres in the profile below):
  - Lamp: one lathe-turned body (stepped base with a bell dome, a stem of knops and
    rings, a trumpet under a shallow dish with five pinched wick lips, a spire
    rising from the dish centre). ~52 cm tall, 19 cm base, like a household
    Kerala nilavilakku.
  - Oil: a thin disc of coconut oil in the dish.
  - Wicks: five twisted cotton wicks lying in the oil, their tips out over the lips,
    charred at the burning end (vertex colours: oil-soaked, dry, charred).
  - Flame_0..4: empties at the burning tips; the web page puts its flames there.
  - Shadow: a floor plane carrying the lamp's soft contact and skylight shadow
    (baked), as an alpha texture.

Textures are baked, then composed in numpy from the lathe's analytic UVs
(u = angle, v = distance along the profile), so every mask knows where it is on
the lamp: patina in crevices (small-radius AO), soot above the wicks, an oil film in
the dish, lathe rings in the roughness, and occlusion for image-based light.

It is a household lamp polished for Onam (tamarind and ash), so the brass is bright
and only the grooves the cloth can't reach have darkened.
"""
import bpy
import bmesh
import math
import os
import sys

import numpy as np
from mathutils import Vector

# ---------------------------------------------------------------- arguments
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []


def arg(name, default=None):
    if f'--{name}' in argv:
        i = argv.index(f'--{name}')
        return argv[i + 1] if i + 1 < len(argv) and not argv[i + 1].startswith('--') else True
    return default


OUT = os.path.abspath(arg('out', 'public/models/src/nilavilakku.glb'))
TEX = int(arg('tex', 1024))
PREVIEW = arg('preview')
SAMPLES = int(arg('samples', 96))
SEGMENTS = 96           # around the axis; enough for the five wick lips
CM = 0.01
RES = 0.5              # profile resolution (curve points per segment, relative)
WICKS = 5
# The first wick faces the viewer (+Y in Blender = towards the camera after export, -Z in three).
WICK_ANGLES = [math.radians(-90 + i * 360 / WICKS) for i in range(WICKS)]

rng = np.random.default_rng(1947)

# ---------------------------------------------------------------- the profile
class Profile:
    """A 2D (r, z) path in cm, built from segments; each point carries its part name."""

    def __init__(self, r, z):
        self.pts = [(r, z)]
        self.part = ['base']
        self.cur = 'base'

    def to(self, part):
        self.cur = part
        return self

    def line(self, r, z, n=1):
        r0, z0 = self.pts[-1]
        for i in range(1, n + 1):
            t = i / n
            self._add(r0 + (r - r0) * t, z0 + (z - z0) * t)
        return self

    def bez(self, c1, c2, p, n=10):
        n = max(2, round(n * RES))
        p0 = self.pts[-1]
        for i in range(1, n + 1):
            t = i / n
            a, b, c, d = (1 - t) ** 3, 3 * (1 - t) ** 2 * t, 3 * (1 - t) * t ** 2, t ** 3
            self._add(a * p0[0] + b * c1[0] + c * c2[0] + d * p[0], a * p0[1] + b * c1[1] + c * c2[1] + d * p[1])
        return self

    def bead(self, rad, n=8):
        """A half-round bead (a turned ring) bulging outward, starting at the current point, going up."""
        n = max(4, round(n * RES))
        r0, z0 = self.pts[-1]
        cz = z0 + rad
        for i in range(1, n + 1):
            a = -math.pi / 2 + math.pi * i / n
            self._add(r0 + rad * math.cos(a), cz + rad * math.sin(a))
        return self

    def disc(self, r_out, thick, r_back, edge=0.12):
        """A flat, sharp-edged collar (the washer-like rings of a Kerala lamp's stem):
        out along the underside, a slightly rounded edge, back in along the top."""
        r0, z0 = self.pts[-1]
        self.line(r_out - edge, z0 + 0.02)
        self.bez((r_out, z0 + 0.03), (r_out, z0 + 0.03), (r_out, z0 + edge + 0.03), 2)
        self.line(r_out, z0 + thick - edge)
        self.bez((r_out, z0 + thick), (r_out, z0 + thick), (r_out - edge, z0 + thick), 2)
        self.line(r_back, z0 + thick)
        return self

    def knop(self, r_max, h, r_end, belly=0.45, n=10):
        """A carinated knop: convex below a sharp equator, a longer ogee shoulder above."""
        r0, z0 = self.pts[-1]
        ze = z0 + h * belly
        self.bez((r0 + (r_max - r0) * 0.35, z0 + 0.1), (r_max, ze - h * belly * 0.55), (r_max, ze), n)
        self.bez((r_max, ze + (h - h * belly) * 0.35), (r_end + (r_max - r_end) * 0.1, z0 + h * 0.8), (r_end, z0 + h), n + 4)
        return self

    def _add(self, r, z):
        self.pts.append((max(0.0, r), z))
        self.part.append(self.cur)


def lamp_profile():
    p = Profile(0.0, 0.0)
    # Base (peedam): a foot ring, two steps and a bead, then a tall bell dome to the neck.
    p.line(9.1, 0.0).bez((9.55, 0.0), (9.7, 0.3), (9.7, 0.7), 4).line(9.7, 1.0)
    p.bez((9.7, 1.3), (9.55, 1.42), (9.25, 1.42), 3).line(8.95, 1.45)
    p.bead(0.34, 8).line(8.6, 2.2).line(8.6, 2.55).bez((8.6, 2.7), (8.5, 2.75), (8.3, 2.75), 2)
    p.line(8.05, 2.8)
    p.bez((8.0, 4.9), (4.6, 5.0), (3.4, 7.0), 20)
    p.line(3.3, 7.05).bead(0.36, 8).line(2.5, 7.8)
    # Stem (thandu): discs and carinated knops, two slender shafts between them.
    p.to('stem').disc(3.35, 0.5, 2.1)
    p.knop(3.25, 3.9, 1.55, belly=0.42)
    p.line(1.55, 12.35).disc(2.75, 0.42, 1.5)
    p.line(1.42, 12.95).line(1.3, 22.8, 6)
    p.line(1.45, 22.85).bead(0.3, 6).line(1.35, 23.5).disc(2.55, 0.4, 1.7)
    p.knop(3.7, 4.6, 1.6, belly=0.5, n=12)
    p.line(1.6, 28.6).disc(2.9, 0.45, 1.5).line(1.4, 29.3).bead(0.28, 6)
    p.line(1.28, 29.9).line(1.2, 36.2, 4)
    p.line(1.3, 36.25).disc(2.4, 0.38, 1.35).bead(0.3, 6)
    # Trumpet under the dish, then the dish's underside and its rolled rim.
    p.to('trumpet').line(1.3, 37.35).bez((1.4, 39.2), (2.9, 40.35), (4.7, 40.65), 12)
    p.to('dish').bez((6.6, 40.95), (8.3, 41.4), (9.0, 41.95), 10)
    p.to('rim').bead(0.44, 10).line(8.65, 42.88)
    # Inside of the dish (the oil sits in here).
    p.to('bowl').bez((8.25, 42.65), (7.3, 42.02), (5.5, 41.86), 8).line(2.0, 41.74, 3)
    # Spire (kalasam) rising from the centre of the dish: a collar, a stem, a bulb, a bud.
    p.to('spire').line(1.7, 41.74).disc(1.95, 0.38, 1.0).line(0.72, 42.5)
    p.line(0.68, 43.9, 2).disc(1.2, 0.22, 0.8)
    p.knop(1.85, 2.7, 0.72, belly=0.55, n=8)
    p.line(0.8, 47.1).bead(0.2, 6).line(0.78, 47.55)
    p.bez((1.4, 48.2), (0.6, 49.9), (0.0, 51.8), 12)
    return p


def rim_lip(theta, r, z, part):
    """Pinch the dish rim into five small lips where the wicks lie."""
    if part not in ('rim', 'bowl', 'dish') or z < 41.6:
        return r, z
    g = 0.0
    for a in WICK_ANGLES:
        d = math.atan2(math.sin(theta - a), math.cos(theta - a))
        g = max(g, math.exp(-(d / math.radians(6.5)) ** 2))
    k = min(1.0, max(0.0, (r - 7.4) / 1.5))  # only the outer rim moves
    return r + 0.55 * g * k, z - 0.22 * g * k


# ---------------------------------------------------------------- scene helpers
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    s = bpy.context.scene
    s.render.engine = 'CYCLES'
    s.cycles.device = 'CPU'
    s.cycles.use_denoising = False
    s.unit_settings.system = 'METRIC'
    return s


def lathe(name, profile):
    pts, parts = profile.pts, profile.part
    # Arc length along the profile → v.
    L = [0.0]
    for i in range(1, len(pts)):
        L.append(L[-1] + math.dist(pts[i], pts[i - 1]))
    total = L[-1]
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    rings = []
    for (r, z), part in zip(pts, parts):
        if r < 1e-4:
            rings.append([bm.verts.new((0, 0, z * CM))])
            continue
        ring = []
        for j in range(SEGMENTS):
            th = 2 * math.pi * j / SEGMENTS
            rr, zz = rim_lip(th, r, z, part)
            ring.append(bm.verts.new((rr * CM * math.cos(th), rr * CM * math.sin(th), zz * CM)))
        rings.append(ring)
    uv_layer = bm.loops.layers.uv.new('UVMap')
    faces = []
    for i in range(len(rings) - 1):
        a, b = rings[i], rings[i + 1]
        va, vb = L[i] / total, L[i + 1] / total
        for j in range(SEGMENTS):
            j1 = (j + 1) % SEGMENTS
            u0, u1 = j / SEGMENTS, (j + 1) / SEGMENTS
            if len(a) == 1:
                f = bm.faces.new((a[0], b[j], b[j1])) if True else None
                uvs = [((u0 + u1) / 2, va), (u0, vb), (u1, vb)]
            elif len(b) == 1:
                f = bm.faces.new((a[j], a[j1], b[0]))
                uvs = [(u0, va), (u1, va), ((u0 + u1) / 2, vb)]
            else:
                f = bm.faces.new((a[j], a[j1], b[j1], b[j]))
                uvs = [(u0, va), (u1, va), (u1, vb), (u0, vb)]
            for loop, uv in zip(f.loops, uvs):
                loop[uv_layer].uv = uv
            faces.append(f)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    for poly in me.polygons:
        poly.use_smooth = True
    me.use_auto_smooth = True
    me.auto_smooth_angle = math.radians(38)
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    # Per-row lookup for the texture composer: r, z, part at each v.
    row = {'L': np.array(L) / total, 'r': np.array([p[0] for p in pts]), 'z': np.array([p[1] for p in pts]), 'part': parts}
    return ob, row


def principled(name, color=(0.8, 0.8, 0.8, 1), rough=0.5, metal=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = color
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    return m


def srgb_to_lin(c):
    c = np.asarray(c, dtype=np.float64)
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


# ---------------------------------------------------------------- baking
def bake_ao(ob, size, distance, samples, name):
    img = bpy.data.images.new(name, size, size, float_buffer=True)
    img.colorspace_settings.name = 'Non-Color'
    mat = ob.data.materials[0]
    nt = mat.node_tree
    node = nt.nodes.new('ShaderNodeTexImage')
    node.image = img
    nt.nodes.active = node
    s = bpy.context.scene
    s.cycles.samples = samples
    s.world.light_settings.distance = distance
    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.bake(type='AO', margin=6, use_clear=True)
    nt.nodes.remove(node)
    a = np.array(img.pixels[:], dtype=np.float32).reshape(size, size, 4)[..., 0]
    return a


def periodic_noise(h, w, fu, fv, seed):
    """Value noise, periodic in u (columns), smooth-interpolated. Returns (h, w) in 0..1."""
    g = np.random.default_rng(seed).random((fv + 1, fu))
    ys = np.linspace(0, fv, h)
    xs = np.arange(w) / w * fu
    y0 = np.floor(ys).astype(int).clip(0, fv - 1)
    x0 = np.floor(xs).astype(int) % fu
    ty = ys - y0
    tx = xs - np.floor(xs)
    ty = ty * ty * (3 - 2 * ty)
    tx = tx * tx * (3 - 2 * tx)
    x1 = (x0 + 1) % fu
    a = g[y0][:, x0]
    b = g[y0][:, x1]
    c = g[y0 + 1][:, x0]
    d = g[y0 + 1][:, x1]
    top = a + (b - a) * tx[None, :]
    bot = c + (d - c) * tx[None, :]
    return top + (bot - top) * ty[:, None]


def fbm(h, w, fu, fv, octaves, seed):
    out = np.zeros((h, w))
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        out += amp * periodic_noise(h, w, fu * 2 ** o, fv * 2 ** o, seed + o)
        tot += amp
        amp *= 0.5
    return out / tot


def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def compose_brass(row, ao_small, ao_large, size):
    H = W = size
    v = (np.arange(H) + 0.5) / H
    # Map each texel row back onto the profile.
    r = np.interp(v, row['L'], row['r'])
    z = np.interp(v, row['L'], row['z'])
    idx = np.clip(np.searchsorted(row['L'], v), 0, len(row['part']) - 1)
    part = np.array(row['part'])[idx]
    theta = (np.arange(W) + 0.5) / W * 2 * np.pi
    R = np.repeat(r[:, None], W, 1)
    Z = np.repeat(z[:, None], W, 1)
    P = np.repeat(part[:, None], W, 1)
    TH = np.repeat(theta[None, :], H, 0)

    n_low = fbm(H, W, 6, 10, 4, 11)
    n_mid = fbm(H, W, 24, 60, 4, 21)
    n_fine = fbm(H, W, 90, 260, 2, 31)
    streaks = fbm(H, W, 3, 160, 3, 51)   # polishing strokes follow the turning: long around, narrow along
    # Lathe rings: roughness varies in bands along the profile only.
    rings = np.repeat(fbm(H, 1, 1, 420, 2, 41), W, 1)

    crevice = smooth(0.35, 0.95, 1 - ao_small) * (0.75 + 0.5 * n_low)          # grooves the cloth can't reach
    tarnish = np.clip(crevice * 0.9 + smooth(0.55, 0.85, n_low) * 0.10, 0, 1)
    # Wick proximity (angle), for soot and oil.
    wick = np.zeros_like(TH)
    for a in WICK_ANGLES:
        d = np.arctan2(np.sin(TH - a), np.cos(TH - a))
        wick = np.maximum(wick, np.exp(-(d / 0.16) ** 2))
    is_spire = P == 'spire'
    is_bowl = P == 'bowl'
    is_rim = P == 'rim'
    soot = np.zeros_like(TH)
    # The spire above the flames darkens most on the faces turned to a wick.
    soot += is_spire * smooth(42.5, 44.5, Z) * (1 - smooth(46.5, 50.5, Z)) * (0.25 + 0.55 * wick) * (0.7 + 0.6 * n_mid)
    # Over each lip, a lick of soot on the rim.
    soot += is_rim * wick * 0.75 * (0.6 + 0.8 * n_mid)
    soot = np.clip(soot, 0, 0.92)
    oil = np.clip(is_bowl * 1.0 + is_rim * wick * 0.6, 0, 1)

    brass = np.array([0.90, 0.80, 0.54])       # sRGB; measured brass F0 ≈ linear (0.91, 0.78, 0.42), a little aged
    brass_hi = np.array([0.95, 0.88, 0.64])
    tarn = np.array([0.46, 0.36, 0.20])
    deep = np.array([0.20, 0.15, 0.085])
    verd = np.array([0.33, 0.35, 0.25])
    soot_c = np.array([0.075, 0.062, 0.05])

    col = brass[None, None, :] + (brass_hi - brass)[None, None, :] * (smooth(0.4, 0.9, n_mid) * 0.35 + smooth(0.6, 1.0, n_fine) * 0.15)[..., None]
    col = col * (0.94 + 0.08 * streaks)[..., None]
    col = col + (tarn - col) * (tarnish * 0.85)[..., None]
    col = col + (deep - col) * (smooth(0.55, 1.0, crevice) * 0.6)[..., None]
    col = col + (verd - col) * (smooth(0.8, 1.0, crevice) * smooth(0.55, 0.8, n_mid) * 0.35)[..., None]
    col = col * (1 - oil * 0.12)[..., None] * np.array([1.0, 0.96, 0.88])[None, None, :] ** oil[..., None]
    col = col + (soot_c - col) * soot[..., None]

    rough = 0.22 + 0.08 * (n_mid - 0.5) * 2 + 0.05 * (rings - 0.5) * 2 + 0.07 * (streaks - 0.5) * 2 + 0.03 * (n_fine - 0.5)
    rough = rough + (0.52 - rough) * tarnish
    rough = rough + (0.13 - rough) * oil * 0.8
    rough = rough + (0.78 - rough) * soot
    metal = 1.0 - 0.25 * tarnish - 0.8 * soot
    occ = np.clip(ao_large, 0, 1) ** 0.9

    base_rgba = np.concatenate([np.clip(col, 0, 1), np.ones((H, W, 1))], axis=2)
    orm_rgba = np.stack([occ, np.clip(rough, 0.05, 1), np.clip(metal, 0, 1), np.ones((H, W))], axis=2)
    return base_rgba, orm_rgba


def image_from(name, rgba, colorspace, path):
    h, w = rgba.shape[:2]
    img = bpy.data.images.new(name, w, h, alpha=True)
    img.colorspace_settings.name = colorspace
    img.pixels.foreach_set(rgba.astype(np.float32).ravel())
    img.filepath_raw = path
    img.file_format = 'PNG'
    img.save()
    return img


def gltf_output_group():
    """The node group the glTF exporter reads occlusion from."""
    g = bpy.data.node_groups.get('glTF Material Output')
    if g:
        return g
    g = bpy.data.node_groups.new('glTF Material Output', 'ShaderNodeTree')
    g.interface.new_socket('Occlusion', in_out='INPUT', socket_type='NodeSocketFloat')
    g.interface.new_socket('Thickness', in_out='INPUT', socket_type='NodeSocketFloat')
    return g


def brass_material(base_img, orm_img):
    m = bpy.data.materials['Brass']
    nt = m.node_tree
    b = nt.nodes['Principled BSDF']
    tb = nt.nodes.new('ShaderNodeTexImage')
    tb.image = base_img
    to = nt.nodes.new('ShaderNodeTexImage')
    to.image = orm_img
    sep = nt.nodes.new('ShaderNodeSeparateColor')
    nt.links.new(tb.outputs['Color'], b.inputs['Base Color'])
    nt.links.new(to.outputs['Color'], sep.inputs['Color'])
    nt.links.new(sep.outputs['Green'], b.inputs['Roughness'])
    nt.links.new(sep.outputs['Blue'], b.inputs['Metallic'])
    grp = nt.nodes.new('ShaderNodeGroup')
    grp.node_tree = gltf_output_group()
    nt.links.new(sep.outputs['Red'], grp.inputs['Occlusion'])
    return m


# ---------------------------------------------------------------- wicks
def wick_objects():
    """Five cotton wicks, each a swept tube in its own radial plane, coloured by vertex."""
    mat = bpy.data.materials.new('Wick')
    mat.use_nodes = True
    nt = mat.node_tree
    b = nt.nodes['Principled BSDF']
    b.inputs['Roughness'].default_value = 0.85
    ca = nt.nodes.new('ShaderNodeVertexColor')
    ca.layer_name = 'Col'
    nt.links.new(ca.outputs['Color'], b.inputs['Base Color'])
    obs, anchors = [], []
    # Path in the radial plane (r, z) in cm: lying in the oil, climbing over the lip, tip turned up.
    # Starts under the oil (surface at 42.34), surfaces towards the rim, rests in the lip, tip lifted by the flame's draw.
    path = [(4.8, 41.98), (6.0, 42.12), (7.2, 42.3), (8.2, 42.56), (8.9, 42.84), (9.45, 42.98), (9.8, 43.08), (10.02, 43.24)]
    radius = [0.8, 0.95, 1.0, 1.0, 1.0, 0.95, 0.85, 0.7]  # a rolled cotton wick, thinning where it burns
    for i, a in enumerate(WICK_ANGLES):
        cu = bpy.data.curves.new(f'wick{i}', 'CURVE')
        cu.dimensions = '3D'
        cu.bevel_depth = 0.21 * CM
        cu.bevel_resolution = 3
        cu.resolution_u = 6
        sp = cu.splines.new('NURBS')
        sp.points.add(len(path) - 1)
        jitter = rng.normal(0, 0.09, len(path))
        for k, (r, z) in enumerate(path):
            rr, zz = r, z
            # the lip is pinched outward/down here; follow it
            pinch = min(1.0, max(0.0, (r - 7.4) / 1.5))  # same pinch as rim_lip at the lip's centre
            rr += 0.55 * pinch
            zz -= 0.22 * pinch
            side = jitter[k] * CM
            x = rr * CM * math.cos(a) - side * math.sin(a)
            y = rr * CM * math.sin(a) + side * math.cos(a)
            sp.points[k].co = (x, y, zz * CM, 1)
            sp.points[k].radius = radius[k]
        sp.use_endpoint_u = True
        sp.order_u = 3
        ob = bpy.data.objects.new(f'Wick_{i}', cu)
        bpy.context.collection.objects.link(ob)
        bpy.context.view_layer.objects.active = ob
        ob.select_set(True)
        bpy.ops.object.convert(target='MESH')
        ob = bpy.context.view_layer.objects.active
        ob.select_set(False)
        me = ob.data
        # A slight cotton twist: displace along the tube by a helical ripple.
        col = me.color_attributes.new('Col', 'BYTE_COLOR', 'CORNER')
        for poly in me.polygons:
            for li in poly.loop_indices:
                vtx = me.vertices[me.loops[li].vertex_index].co
                rr = math.hypot(vtx.x, vtx.y) / CM
                if rr > 10.4:
                    c = (0.05, 0.04, 0.035, 1)          # charred tip
                elif rr > 10.0:
                    t = (rr - 10.0) / 0.4
                    c = (0.55 * (1 - t) + 0.05 * t, 0.45 * (1 - t) + 0.04 * t, 0.28 * (1 - t) + 0.035 * t, 1)
                elif rr > 8.9:
                    c = (0.88, 0.82, 0.66, 1)            # cotton, oil-wet
                else:
                    c = (0.74, 0.62, 0.38, 1)            # soaked in the oil
                col.data[li].color = c
        for poly in me.polygons:
            poly.use_smooth = True
        me.materials.append(mat)
        obs.append(ob)
        # Flame anchor: just above the burning tip.
        tip_r, tip_z = 10.68, 43.3
        e = bpy.data.objects.new(f'Flame_{i}', None)
        e.empty_display_size = 0.01
        e.location = (tip_r * CM * math.cos(a), tip_r * CM * math.sin(a), tip_z * CM)
        bpy.context.collection.objects.link(e)
        anchors.append(e)
    return obs, anchors


def oil_object():
    bpy.ops.mesh.primitive_circle_add(vertices=SEGMENTS, radius=8.05 * CM, fill_type='TRIFAN', location=(0, 0, 42.34 * CM))
    ob = bpy.context.active_object
    ob.name = 'Oil'
    # Match the pinched lips so the oil reaches into each.
    for v in ob.data.vertices:
        if v.co.length < 1e-6:
            continue
        th = math.atan2(v.co.y, v.co.x)
        g = max(math.exp(-(math.atan2(math.sin(th - a), math.cos(th - a)) / math.radians(6.5)) ** 2) for a in WICK_ANGLES)
        v.co.x *= 1 + 0.03 * g
        v.co.y *= 1 + 0.03 * g
    # Coconut oil, lit from above: nearly clear and very glossy over the brass; reads dark amber.
    m = principled('Oil', (0.85, 0.6, 0.22, 1), 0.03, 0.0)
    m.node_tree.nodes['Principled BSDF'].inputs['Transmission Weight'].default_value = 1.0
    m.node_tree.nodes['Principled BSDF'].inputs['IOR'].default_value = 1.46
    ob.data.materials.append(m)
    return ob


# ---------------------------------------------------------------- floor shadow
def bake_floor_shadow(lamp_objs, size=256, extent=1.0):
    bpy.ops.mesh.primitive_plane_add(size=extent, location=(0, 0, 0))
    plane = bpy.context.active_object
    plane.name = 'Shadow'
    m = principled('ShadowBake', (0.8, 0.8, 0.8, 1), 1.0, 0.0)
    plane.data.materials.append(m)
    # Skylight from the nadumuttam, overhead and toward the viewer: a big soft area light.
    ld = bpy.data.lights.new('sky', 'AREA')
    ld.shape = 'DISK'
    ld.size = 2.2
    ld.energy = 900
    sky = bpy.data.objects.new('sky', ld)
    sky.location = (0, -0.9, 2.4)
    sky.rotation_euler = (math.radians(-20), 0, 0)
    bpy.context.collection.objects.link(sky)
    s = bpy.context.scene
    s.render.bake.use_pass_direct = True
    s.render.bake.use_pass_indirect = False
    img = bpy.data.images.new('shadow', size, size, float_buffer=True)
    img.colorspace_settings.name = 'Non-Color'
    nt = m.node_tree
    node = nt.nodes.new('ShaderNodeTexImage')
    node.image = img
    nt.nodes.active = node
    s.cycles.samples = 256
    bpy.ops.object.select_all(action='DESELECT')
    plane.select_set(True)
    bpy.context.view_layer.objects.active = plane
    bpy.ops.object.bake(type='SHADOW', margin=2)
    shadow = np.array(img.pixels[:], dtype=np.float32).reshape(size, size, 4)[..., 0]
    s.world.light_settings.distance = 0.10
    img2 = bpy.data.images.new('contact', size, size, float_buffer=True)
    node.image = img2
    bpy.ops.object.bake(type='AO', margin=2)
    ao = np.array(img2.pixels[:], dtype=np.float32).reshape(size, size, 4)[..., 0]
    nt.nodes.remove(node)
    bpy.data.objects.remove(sky)
    lit = np.clip(shadow / max(1e-6, np.percentile(shadow, 99)), 0, 1)
    dark = np.clip(1 - lit * ao, 0, 1)
    # Fade to nothing at the plane's edge so it has no border.
    yy, xx = np.mgrid[0:size, 0:size]
    d = np.hypot(xx - size / 2 + 0.5, yy - size / 2 + 0.5) / (size / 2)
    dark *= 1 - smooth(0.7, 0.98, d)
    rgba = np.zeros((size, size, 4))
    rgba[..., 3] = dark * 0.9
    out = image_from('ShadowTex', rgba, 'sRGB', os.path.join(os.path.dirname(OUT), 'nilavilakku-shadow.png'))
    m2 = bpy.data.materials.new('Shadow')
    m2.use_nodes = True
    m2.blend_method = 'BLEND'
    nt2 = m2.node_tree
    b2 = nt2.nodes['Principled BSDF']
    b2.inputs['Base Color'].default_value = (0, 0, 0, 1)
    t2 = nt2.nodes.new('ShaderNodeTexImage')
    t2.image = out
    nt2.links.new(t2.outputs['Alpha'], b2.inputs['Alpha'])
    plane.data.materials.clear()
    plane.data.materials.append(m2)
    return plane


# ---------------------------------------------------------------- build
def build():
    reset()
    s = bpy.context.scene
    s.world = bpy.data.worlds.new('World')
    s.world.use_nodes = True
    s.world.node_tree.nodes['Background'].inputs['Color'].default_value = (1, 1, 1, 1)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)

    prof = lamp_profile()
    lamp, row = lathe('Nilavilakku', prof)
    lamp.data.materials.append(principled('Brass', (0.8, 0.6, 0.3, 1), 0.3, 1.0))
    oil = oil_object()
    wicks, anchors = wick_objects()

    # Occlusion bakes on the lamp alone (+ oil + wicks as occluders).
    ao_small = bake_ao(lamp, TEX, 0.012, 48, 'ao_small')
    ao_large = bake_ao(lamp, TEX, 0.09, 48, 'ao_large')
    base, orm = compose_brass(row, ao_small, ao_large, TEX)
    d = os.path.dirname(OUT)
    base_img = image_from('brass_basecolor', base, 'sRGB', os.path.join(d, 'nilavilakku-basecolor.png'))
    orm_img = image_from('brass_orm', orm, 'Non-Color', os.path.join(d, 'nilavilakku-orm.png'))
    brass_material(base_img, orm_img)

    shadow = bake_floor_shadow([lamp, oil] + wicks)

    bpy.ops.object.select_all(action='DESELECT')
    for ob in [lamp, oil, shadow] + wicks + anchors:
        ob.select_set(True)
    kw = dict(filepath=OUT, export_format='GLB', use_selection=True, export_apply=True, export_yup=True,
              export_cameras=False, export_lights=False, export_extras=False, export_image_format='AUTO')
    bpy.ops.export_scene.gltf(**kw)
    print('EXPORTED', OUT, os.path.getsize(OUT), 'bytes;', len(lamp.data.vertices), 'lamp verts')
    return lamp, oil, wicks, anchors, shadow


# ---------------------------------------------------------------- preview stills
def flame_material():
    """Preview-only flame: emission graded up the teardrop, transparent at the silhouette."""
    fm = bpy.data.materials.new('Flame')
    fm.use_nodes = True
    fm.blend_method = 'BLEND'
    nt = fm.node_tree
    nt.nodes.remove(nt.nodes['Principled BSDF'])
    out = nt.nodes['Material Output']
    tc = nt.nodes.new('ShaderNodeTexCoord')
    sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    nt.links.new(tc.outputs['Generated'], sep.inputs['Vector'])
    mr = nt.nodes.new('ShaderNodeMapRange')
    mr.inputs['From Min'].default_value = 0
    mr.inputs['From Max'].default_value = 1
    nt.links.new(sep.outputs['Z'], mr.inputs['Value'])
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    el = ramp.color_ramp.elements
    el[0].position, el[0].color = 0.0, (0.15, 0.2, 0.9, 1)
    el[1].position, el[1].color = 1.0, (1.0, 0.35, 0.05, 1)
    for pos, c in [(0.12, (1.0, 0.45, 0.08, 1)), (0.35, (1.0, 0.82, 0.45, 1)), (0.7, (1.0, 0.62, 0.18, 1))]:
        e = el.new(pos)
        e.color = c
    nt.links.new(mr.outputs['Result'], ramp.inputs['Fac'])
    em = nt.nodes.new('ShaderNodeEmission')
    em.inputs['Strength'].default_value = 14
    nt.links.new(ramp.outputs['Color'], em.inputs['Color'])
    lw = nt.nodes.new('ShaderNodeLayerWeight')
    lw.inputs['Blend'].default_value = 0.45
    tr = nt.nodes.new('ShaderNodeBsdfTransparent')
    mix = nt.nodes.new('ShaderNodeMixShader')
    nt.links.new(lw.outputs['Facing'], mix.inputs['Fac'])
    nt.links.new(em.outputs['Emission'], mix.inputs[1])
    nt.links.new(tr.outputs['BSDF'], mix.inputs[2])
    nt.links.new(mix.outputs['Shader'], out.inputs['Surface'])
    return fm


def preview(anchors, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    s = bpy.context.scene
    s.cycles.samples = SAMPLES
    s.view_settings.view_transform = 'AgX'
    s.view_settings.look = 'AgX - Base Contrast' if 'AgX - Base Contrast' in [i.name for i in bpy.types.ColorManagedViewSettings.bl_rna.properties['look'].enum_items] else 'None'
    s.world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.20, 0.16, 0.12, 1)
    s.world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.35
    s.render.film_transparent = False
    # Red-oxide floor, lime-plastered wall behind (as on the page).
    bpy.ops.mesh.primitive_plane_add(size=6, location=(0, 0, -0.0005))
    fl = bpy.context.active_object
    fl.data.materials.append(principled('Floor', (*srgb_to_lin([0.43, 0.14, 0.10]), 1), 0.32, 0.0))
    bpy.ops.mesh.primitive_plane_add(size=6, location=(0, 0.8, 1.5), rotation=(math.radians(90), 0, 0))
    wall = bpy.context.active_object
    wall.data.materials.append(principled('Wall', (*srgb_to_lin([0.85, 0.80, 0.69]), 1), 0.9, 0.0))
    # Skylight from the courtyard (overhead, toward the viewer).
    ld = bpy.data.lights.new('sky', 'AREA')
    ld.shape = 'DISK'
    ld.size = 2.4
    ld.energy = 260
    ld.color = (0.95, 0.97, 1.0)
    sky = bpy.data.objects.new('sky', ld)
    sky.location = (0, -1.3, 2.3)
    sky.rotation_euler = (math.radians(-30), 0, 0)
    s.collection.objects.link(sky)
    # Flames: small emissive teardrops with a point light in each.
    fm = flame_material()
    for e in anchors:
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.0045, location=e.location + Vector((0, 0, 0.009)))
        f = bpy.context.active_object
        f.scale = (0.8, 0.8, 2.4)
        f.data.materials.append(fm)
        f.visible_shadow = False
        pl = bpy.data.lights.new('flame', 'POINT')
        pl.energy = 0.5
        pl.color = (1.0, 0.66, 0.32)
        pl.shadow_soft_size = 0.008
        po = bpy.data.objects.new('flame', pl)
        po.location = e.location + Vector((0, 0, 0.014))
        s.collection.objects.link(po)
    shots = {
        'web-framing': dict(loc=(0, -2.35, 0.95), target=(0, 0, 0.30), lens=85, res=(700, 900)),
        'hero': dict(loc=(0.35, -1.25, 0.72), target=(0, 0, 0.27), lens=70, res=(900, 1200)),
        'dish': dict(loc=(0.12, -0.42, 0.60), target=(0, 0, 0.43), lens=70, res=(1200, 900)),
    }
    for name, sh in shots.items():
        cam_d = bpy.data.cameras.new(name)
        cam_d.lens = sh['lens']
        cam = bpy.data.objects.new(name, cam_d)
        s.collection.objects.link(cam)
        cam.location = sh['loc']
        direction = np.array(sh['target']) - np.array(sh['loc'])
        cam.rotation_euler = Vector(direction).to_track_quat('-Z', 'Y').to_euler()
        s.camera = cam
        s.render.resolution_x, s.render.resolution_y = sh['res']
        s.render.filepath = os.path.join(out_dir, f'nilavilakku-{name}.png')
        bpy.ops.render.render(write_still=True)
        print('RENDERED', s.render.filepath)


lamp, oil, wicks, anchors, shadow = build()
if PREVIEW:
    shadow.hide_render = True
    preview(anchors, os.path.abspath(PREVIEW))
