import * as THREE from 'three';

// Loop shape: m = 0 -> perfect circle, m = 1 -> teardrop (wide bottom, tight top)
export const R = 3;
export function loopPoint(theta: number, m: number) {
  const s2 = Math.sin(theta / 2) ** 2; // 0 at bottom, 1 at top
  const ax = R * (1 - 0.48 * m * s2); // narrower near the top
  const by = R * (1 + 0.32 * m * s2); // taller
  return new THREE.Vector3(ax * Math.sin(theta), by * (1 - Math.cos(theta)), 0);
}

export function buildCurve(m: number) {
  const pts: THREE.Vector3[] = [];
  for (let x = -16; x < -0.5; x += 1.5) pts.push(new THREE.Vector3(x, 0, 0));
  const N = 90;
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    const p = loopPoint(s * Math.PI * 2, m);
    p.z = 1.1 * (s * s * (3 - 2 * s)); // side shift so the track does not cross itself
    pts.push(p);
  }
  for (let x = 1.5; x <= 16; x += 1.5) pts.push(new THREE.Vector3(x, 0, 1.1));
  return new THREE.CatmullRomCurve3(pts, false, 'centripetal');
}

// fraction of arc length where the loop starts / ends (approx.)
export function loopRange(curve: THREE.CatmullRomCurve3) {
  const lens = curve.getLengths(600);
  const total = lens[lens.length - 1];
  let a = 0, b = 1;
  for (let i = 0; i <= 600; i++) {
    const p = curve.getPoint(i / 600);
    if (a === 0 && p.x > -0.3) a = lens[i] / total;
    if (p.x > 0.3 && p.y < 0.05 && i > 300) { b = lens[i] / total; break; }
  }
  return [a, b] as const;
}
