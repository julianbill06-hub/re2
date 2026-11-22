// Timeline of „Level -3“ (Final Call Stories, episode 3): the single source of truth for camera, figure, lights, tape events
// Coordinates: metres; x east, z south; yaw 0 = facing −z, +yaw turns left; camera key = [x, y, z, yaw, pitch, fovH, focus]
import { track, clamp, seg, ss } from '/core/lib.js';
import { MIRROR, DOOR, STAIR } from './world.js';

export const DUR = 47.0;
const aim = (f, t) => { const dx = t[0] - f[0], dy = t[1] - f[1], dz = t[2] - f[2]; return [Math.atan2(-dx, -dz), Math.atan2(dy, Math.hypot(dx, dz))]; };
const C0 = [0.1, 1.5, 5.4], [MY, MP] = aim(C0, [MIRROR.p.x, MIRROR.p.y, MIRROR.p.z]);
const SIGN = [0, 2.0, -14], DOORP = [DOOR.x, 1.3, DOOR.z];
const FIG_FAR = [0.4, 1.9, -42];
const PIL = [-8, 1.7, -20];

// camera segments (a cut between segments = a tape tear)
const k = (t, x, y, z, yaw, pitch, fov, focus) => [t, [x, y, z, yaw, pitch, fov, focus]];
const D1 = aim([0, 1.5, -10], FIG_FAR), D2 = aim([0, 1.5, -9.6], DOORP), P2 = aim([-9.6, 1.45, -22.6], PIL);
export const SEGS = [
  { name: 'mirror', t0: 0, t1: 10.3, keys: [
    k(0, ...C0, MY, MP, 30, 1.35), k(1.6, ...C0, MY + .02, MP - .01, 32, 1.35),
    k(2.6, .1, 1.5, 5.2, .25, .08, 46, 6), k(3.6, .1, 1.52, 4.6, 0, -.02, 52, 12),
    k(6.3, .2, 1.5, -2.5, .02, -.06, 52, 14), k(7.0, .25, 1.5, -4.2, .0, -.95, 52, 1.2), k(7.7, .3, 1.5, -5.8, .02, -.9, 52, 1.2),
    k(8.4, .3, 1.5, -7.6, 0, .05, 50, 8), k(9.4, .2, 1.48, -9.6, 0, .33, 40, 4.6), k(10.3, .2, 1.48, -9.8, 0, .3, 40, 4.6)] },
  { name: 'again', t0: 10.3, t1: 18.4, keys: [
    k(10.3, .2, 1.48, -9.8, 0, .3, 40, 4.6), k(11.6, .2, 1.48, -9.8, .01, .29, 40, 4.6),
    k(12.6, .1, 1.5, -9.9, 0, .02, 52, 14), k(13.2, 0, 1.5, -10, D1[0], D1[1], 52, 20),
    k(13.9, 0, 1.5, -10, D1[0], D1[1], 15, 30), k(14.4, 0, 1.5, -10, D1[0], D1[1], 13, 58), k(16.2, 0, 1.5, -10, D1[0], D1[1], 12, 58),
    k(17.2, 0, 1.5, -10, D1[0], D1[1], 30, 30), k(18.4, 0, 1.5, -9.6, D2[0] * .4, -.02, 50, 12)] },
  { name: 'door', t0: 18.4, t1: 21.0, keys: [
    k(18.4, 0, 1.5, -9.6, D2[0] * .4, -.02, 50, 12), k(19.0, -.6, 1.5, -11.0, D2[0], D2[1] + .05, 50, 12),
    k(20.2, -7.2, 1.5, -20.0, aim([-7.2, 1.5, -20], DOORP)[0], .12, 48, 3.5), k(21.0, -9.3, 1.5, -22.4, aim([-9.3, 1.5, -22.4], [DOOR.x - 2, 1.4, DOOR.z])[0], .05, 50, 2)] },
  { name: 'stairs', t0: 21.0, t1: 23.75, keys: [
    k(21.0, STAIR.x0 + .8, 1.45, STAIR.z1 - .5, 0, -1.05, 52, 1.0), k(21.5, STAIR.x0 + .8, 1.45, STAIR.z1 - .9, 0, -1.0, 52, 1.0), k(22.2, STAIR.x0 + .8, 1.45 - 2.3, STAIR.z1 - .8 - 4.4, 0, -.55, 52, 3), k(22.6, STAIR.x0 + .8, 1.45 - 2.7, STAIR.z1 - .8 - 5.1, 0, -.4, 52, 4),
    k(23.0, STAIR.x0 + .8, 1.45 - STAIR.steps * STAIR.rise, STAIR.z0 + 1.8, -.75, .02, 50, 2.5), k(23.75, STAIR.x0 + 1.0, 1.45 - STAIR.steps * STAIR.rise, STAIR.z0 + 1.3, -.95, .04, 46, 2.2)] },
  { name: 'pillar', t0: 23.75, t1: 25.6, keys: [
    k(23.75, -9.6, 1.45, -22.6, P2[0], P2[1], 46, 2.8), k(24.0, -9.6, 1.45, -22.6, P2[0], P2[1], 40, 2.8), k(25.6, -9.55, 1.45, -22.5, P2[0] + .02, P2[1], 38, 2.8)] },
  { name: 'rewind', t0: 25.6, t1: 28.6, rewind: [25.0, 16.4] },
  { name: 'follow', t0: 28.6, t1: 35.5, keys: [
    k(28.6, 0, 1.5, -10, D1[0], D1[1], 46, 30), k(30.2, 0, 1.5, -10.3, D1[0], D1[1] - .01, 48, 30),
    k(31.3, 0, 1.5, -10.5, D1[0] * .5, -.01, 50, 18), k(32.3, 0, 1.5, -10.6, 0, .08, 52, 5), k(33.3, 0, 1.5, -10.6, 0, .16, 50, 2.4),
    k(34.2, 0, 1.5, -10.65, 0, .02, 44, 1.6), k(35.5, 0, 1.5, -10.7, 0, -.02, 42, 1.5)] },
  { name: 'barrier', t0: 35.5, t1: 43.6, keys: [
    k(35.5, .9, 1.5, 6.0, Math.PI, .0, 52, 9), k(37.2, .9, 1.5, 8.4, Math.PI - .05, .02, 52, 9), k(38.5, .9, 1.5, 9.2, Math.PI - .02, -.3, 52, 2),
    k(39.4, .9, 1.48, 9.3, Math.PI, -.32, 46, .42), k(40.6, .9, 1.47, 9.3, Math.PI, -.34, 34, .38), k(43.6, .9, 1.47, 9.3, Math.PI, -.35, 31, .37)] },
  { name: 'loop', t0: 43.6, t1: 47, keys: [
    k(43.6, .9, 1.47, 9.3, Math.PI, -.35, 31, .37), k(44.3, .6, 1.5, 7.8, MY + .6, MP - .1, 40, 3),
    k(45.3, ...C0, MY, MP, 30, 1.35), k(47, ...C0, MY + .01, MP, 30, 1.35)] },
];
for (const s of SEGS) if (s.keys) s.cam = track(s.keys);
export const segAt = t => SEGS.find(s => t >= s.t0 && t < s.t1) || SEGS[SEGS.length - 1];

// key moments
export const T = {
  hook: [0, 2.6], tear1: [10.15, 10.5], hush: [16.2, 18.2], chips: 16.9, stairsOn: [18.4, 25.6], followOn: [28.6, 45.3],
  doorOpen: [20.2, 21.0], stBotOpen: [23.0, 23.7], tear2: [20.85, 21.1], tear3: [23.6, 23.85], blackA: [25.15, 25.6],
  rewind: [25.6, 28.6], flicks: [30.25, 31.35, 32.4], offer: [33.6, 34.6], tear4: [35.35, 35.6],
  barrier: [35.9, 37.0], day: [36.0, 37.6], twist: 41.1, end: [45.35, 47],
  punch: [0, 13.95, 23.8, 30.3, 31.4, 32.45, 41.1],
};
// the attendant: where he is (null = not there), facing (yaw), offer amount
export function figure(t) {
  if (t < 3.3) return { p: [0.8, 0, 7.5], yaw: Math.PI, offer: 0 };
  if (t >= 12.8 && t < 18.4) return { p: [0.4, 0, -42], yaw: 0, offer: 0 };
  if (t >= 28.6 && t < 35.5) {
    const z = t < T.flicks[0] ? -42 : t < T.flicks[1] ? -31 : t < T.flicks[2] ? -21 : -13.0;
    return { p: [t < T.flicks[2] ? .4 : .05, 0, z], yaw: 0, offer: ss(seg(t, T.offer[0], T.offer[1])) };
  }
  if (t >= 44.9) return { p: [0.8, 0, 7.5], yaw: Math.PI, offer: 0 };
  return null;
}
// handheld fear 0..1 and "held breath" (freeze)
export const FEAR = t => clamp(.15 + .5 * seg(t, 12.8, 14.2) - .2 * seg(t, 18.4, 19) + .4 * seg(t, 29, 33.5) - .5 * seg(t, 36, 38) + .6 * seg(t, 41, 41.6), 0, 1);
export const HOLD = t => (t > T.hush[0] && t < T.hush[1]) || (t > 40.0 && t < 41.1) ? 1 : 0;
// OSD clock (hh:mm:ss): starts 00:07, jumps at the tears, runs backwards in the rewind, morning at the barrier, back to 00:07 at the twist
export function clock(t) {
  let s;
  if (t < 10.3) s = 7 * 60 + 12 + t;
  else if (t < 21.0) s = 13 * 60 + 40 + (t - 10.3);
  else if (t < 25.6) s = 31 * 60 + 5 + (t - 21);
  else if (t < 28.6) s = 31 * 60 + 9 - (t - 25.6) * 300;
  else if (t < 35.5) s = 13 * 60 + 58 + (t - 28.6);
  else if (t < T.twist) s = 5 * 3600 + 58 * 60 + 3 + (t - 35.5);
  else s = 7 * 60 + 12 + (t - T.twist);
  s = Math.max(0, s); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, sc = Math.floor(s) % 60;
  return `${String(h).padStart(1, '0')}:${String(m).padStart(2, '0')}:${String(sc).padStart(2, '0')}`;
}
