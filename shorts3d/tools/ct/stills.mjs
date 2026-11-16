import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'path';
const times = JSON.parse(process.argv[2]);
const outDir = process.argv[3];
const browserExecutable = process.env.CHS;
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const composition = await selectComposition({serveUrl, id: process.argv[4] || 'ClosingTime', browserExecutable, chromiumOptions: {gl: 'swangle'}});
for (const [i, t] of times.entries()) {
  const frame = Math.min(composition.durationInFrames - 1, Math.round(t * 60));
  await renderStill({serveUrl, composition, frame, output: `${outDir}/s${String(i).padStart(2, '0')}_${t.toFixed(2)}.png`, browserExecutable, chromiumOptions: {gl: 'swangle'}, scale: 0.4});
  console.log('ok', i, t);
}
