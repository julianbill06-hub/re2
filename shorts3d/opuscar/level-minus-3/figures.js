// Figures: your red sneakers (seen when looking down), your hand with the teal parka cuff, and the attendant
import * as THREE from 'three';
import { paint, glow, U } from './world.js';
const V = (x, y, z) => new THREE.Vector3(x, y, z);

function bone(mat, r) {          // capsule between two points
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, 1, 6, 12), mat);
  m.set = (a, b, r2) => { const d = new THREE.Vector3().subVectors(b, a), L = d.length(); m.position.copy(a).addScaledVector(d, .5);
    m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); const k = (r2 ?? r) / r; m.scale.set(k, Math.max(.01, (L + r) / (1 + 2 * r)), k); };
  return m;
}

// —— your shoes: red sneakers, white sole, laces (only toes are ever in frame) ——
function shoeGeo(w, L, h, bevel) {
  const sh = new THREE.Shape(), n = 40;
  for (let k = 0; k <= n; k++) {
    const a = k / n * Math.PI * 2, c = Math.cos(a), zf = Math.sin(a);
    const wid = w / 2 * (.78 + .22 * Math.sin((zf + 1) / 2 * Math.PI * 1.1)) * (zf > .55 ? Math.sqrt(Math.max(0, 1 - ((zf - .55) / .5) ** 2)) * .35 + .65 : 1);
    k ? sh.lineTo(c * wid, zf * L / 2) : sh.moveTo(c * wid, zf * L / 2);
  }
  const g = new THREE.ExtrudeGeometry(sh, { depth: h, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * .8, bevelSegments: 4, curveSegments: 24 });
  g.rotateX(-Math.PI / 2); g.scale(1, 1, -1); return g;
}
export function makeShoes(scene) {
  const g = new THREE.Group(); scene.add(g);
  const red = paint({ color: '#b3231c', shin: 20, spec: .05 }), sole = paint({ color: '#e9e5da' }), lace = paint({ color: '#f1ede3' }), toe = paint({ color: '#e3ded2' });
  const upG = shoeGeo(.1, .28, .05, .025), soG = shoeGeo(.114, .3, .02, .004);
  const parts = [0, 1].map(() => {
    const s = new THREE.Group();
    const so = new THREE.Mesh(soG, sole); so.position.y = .004; const up = new THREE.Mesh(upG, red); up.position.y = .028;
    const cap = new THREE.Mesh(new THREE.SphereGeometry(.05, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), toe); cap.scale.set(.95, .5, 1.1); cap.position.set(0, .035, .1);
    s.add(so, up, cap);
    for (let k = 0; k < 5; k++) { const l = new THREE.Mesh(new THREE.BoxGeometry(.052, .007, .008), lace); l.position.set(0, .088 - k * .004, -.06 + k * .02); l.rotation.x = -.3; s.add(l); }
    g.add(s); return s;
  });
  g.pose = b => {
    const fw = V(-Math.sin(b.yaw), 0, -Math.cos(b.yaw)), rt = V(Math.cos(b.yaw), 0, -Math.sin(b.yaw));
    parts.forEach((s, i) => { const sd = i ? 1 : -1, ph = b.phase + i * Math.PI;
      const fwd = Math.sin(ph) * .24 * b.amp + .16, lift = Math.max(0, Math.cos(ph)) * .06 * b.amp;
      s.position.copy(V(b.x, b.y ?? 0, b.z).addScaledVector(fw, fwd).addScaledVector(rt, sd * .11)).setY((b.y ?? 0) + lift);
      s.rotation.set(0, b.yaw + Math.PI - sd * .1, 0); s.rotateX(Math.max(0, Math.cos(ph)) * .2 * b.amp); });
  };
  return g;
}

// —— your hand: teal parka cuff (quilted), a hand holding the ticket ——
export function makeHand(scene) {
  const g = new THREE.Group(); scene.add(g); g.visible = false;
  const teal = paint({ color: '#1f8a8a', shin: 12, spec: .05 }), seam = paint({ color: '#166b6b' }), skin = paint({ color: '#d9a27f', shin: 8, spec: .03 });
  const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(.065, .075, .34, 18), teal); sleeve.rotation.x = Math.PI / 2; sleeve.position.z = .2; g.add(sleeve);
  for (let k = 0; k < 3; k++) { const r = new THREE.Mesh(new THREE.TorusGeometry(.068 + k * .003, .006, 6, 24), seam); r.position.z = .1 + k * .09; g.add(r); }
  const cuff = new THREE.Mesh(new THREE.TorusGeometry(.058, .016, 8, 24), seam); cuff.position.z = .035; g.add(cuff);
  const palm = new THREE.Mesh(new THREE.BoxGeometry(.085, .028, .09), skin); palm.position.set(0, 0, -.03); g.add(palm);
  for (let k = 0; k < 4; k++) { const f = bone(skin, .009); f.set(V(-.03 + k * .02, .004, -.075), V(-.03 + k * .021, .02, -.115 + Math.abs(k - 1.5) * .006)); g.add(f); }
  const th = bone(skin, .011); th.set(V(.045, 0, -.02), V(.03, .03, -.075)); g.add(th);
  return g;
}

// —— the attendant: faceless, glossy dark head, one green slit; proportions slightly wrong (long neck, small head, long arms) ——
export function makeAttendant(scene) {
  const g = new THREE.Group(); scene.add(g);
  const coat = paint({ color: '#1e2328', shin: 10, spec: .03 }), trous = paint({ color: '#15181b' }), vest = paint({ color: '#232a33', shin: 8, spec: .04 });
  const refl = paint({ color: '#cfd2cc', emit: .12, shin: 60, spec: .5 }), glove = paint({ color: '#efece4', shin: 10, spec: .05 }), brass = paint({ color: '#a88a45', shin: 70, spec: .6 });
  const head = paint({ color: '#0b0c0e', shin: 90, spec: .9 }), shoe = paint({ color: '#0a0a0a', shin: 80, spec: .6 }), cap = paint({ color: '#14171a', shin: 30, spec: .1 });
  // legs + shoes
  const legs = [0, 1].map(() => { const t = bone(trous, .07); const s = new THREE.Mesh(new THREE.BoxGeometry(.11, .07, .29), shoe); g.add(t, s); return { t, s }; });
  // long coat: a lathe, flared to the knee
  const prof = [[.0, .5], [.27, .5], [.25, .8], [.22, 1.15], [.23, 1.45], [.24, 1.62], [.16, 1.72], [.0, 1.73]].map(([r, y]) => new THREE.Vector2(r, y));
  const body = new THREE.Mesh(new THREE.LatheGeometry(prof, 28), coat); body.scale.z = .72; g.add(body);
  // vest over it with two reflective bands
  const vp = [[.0, 1.0], [.245, 1.0], [.245, 1.6], [.18, 1.7], [.0, 1.71]].map(([r, y]) => new THREE.Vector2(r, y));
  const vst = new THREE.Mesh(new THREE.LatheGeometry(vp, 28), vest); vst.scale.set(1.03, 1, .75); g.add(vst);
  for (const y of [1.12, 1.4]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(.256, .256, .05, 28, 1, true), refl); b.position.y = y; b.scale.z = .76; g.add(b); }
  // buttons, name badge (blank), ticket punch on the belt
  for (let k = 0; k < 4; k++) { const b = new THREE.Mesh(new THREE.SphereGeometry(.014, 8, 6), brass); b.position.set(0, .7 + k * .1, .182); g.add(b); }
  const badge = new THREE.Mesh(new THREE.BoxGeometry(.08, .03, .01), brass); badge.position.set(.1, 1.52, .18); g.add(badge);
  const punch = new THREE.Mesh(new THREE.BoxGeometry(.05, .12, .03), brass); punch.position.set(-.2, .95, .1); g.add(punch);
  // long neck, small glossy head, cap with brim, the green slit
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.045, .055, .26, 14), coat); neck.position.y = 1.85; g.add(neck);
  const hd = new THREE.Mesh(new THREE.SphereGeometry(.105, 28, 20), head); hd.scale.set(1, 1.22, 1.05); hd.position.y = 2.06; g.add(hd);
  const ck = new THREE.Mesh(new THREE.CylinderGeometry(.115, .11, .07, 24), cap); ck.position.y = 2.17; g.add(ck);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, .012, 24, 1, false, -Math.PI / 2, Math.PI), cap); brim.position.set(0, 2.14, .03); g.add(brim);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(.117, .117, .022, 24, 1, true), paint({ color: '#1d6b3a' })); band.position.y = 2.155; g.add(band);
  const slit = new THREE.Mesh(new THREE.BoxGeometry(.11, .012, .01), glow('#36ff8a', 7)); slit.position.set(0, 2.07, .108); g.add(slit);
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(.17, .035), new THREE.MeshBasicMaterial({ color: new THREE.Color('#2bff7a').multiplyScalar(.5), transparent: true, opacity: .3, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  halo.position.set(0, 2.07, .12); g.add(halo);
  // long arms, white gloves
  const arms = [0, 1].map(() => { const u = bone(coat, .05), l = bone(coat, .045), h = new THREE.Mesh(new THREE.SphereGeometry(.05, 12, 10), glove); h.scale.set(1, 1.3, .7); g.add(u, l, h); return { u, l, h }; });
  const tix = new THREE.Mesh(new THREE.PlaneGeometry(.085, .16), paint({ color: '#f1ecd9', side: THREE.DoubleSide })); g.add(tix);
  g.slit = slit;
  // pose: walk phase, offer (0..1: right arm raised forward, holding out the ticket)
  g.pose = (ph = 0, amp = 0, offer = 0) => {
    legs.forEach((L, i) => { const sd = i ? 1 : -1, p = ph + i * Math.PI, fw = Math.sin(p) * .22 * amp, lift = Math.max(0, Math.cos(p)) * .07 * amp;
      L.t.set(V(sd * .1, .95, 0), V(sd * .1, .1 + lift, fw)); L.s.position.set(sd * .1, .04 + lift, fw + .05); });
    arms.forEach((A, i) => { const sd = i ? 1 : -1, sw = Math.sin(ph + i * Math.PI) * .12 * amp;
      const sh = V(sd * .26, 1.62, 0); let el = V(sd * .3, 1.2, sw), wr = V(sd * .3, .78, sw * 1.6);
      if (i === 1 && offer > 0) { el = el.lerp(V(.28, 1.35, .3), offer); wr = wr.lerp(V(.16, 1.38, .72), offer); }
      A.u.set(sh, el); A.l.set(el, wr); A.h.position.copy(wr).add(V(0, -.04, 0)); });
    tix.visible = offer > .05; tix.position.copy(arms[1].h.position).add(V(-.02, .05, .03)); tix.rotation.set(-.3, 0, .15);
  };
  g.pose();
  return g;
}
