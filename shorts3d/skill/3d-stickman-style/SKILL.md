---
name: 3d-stickman-style
description: "Bild-Stil für die Serien „30 Tage Glow-Up“, „30 Tage Maloche“ und „SV Matsch 04“ (und alle neuen Shorts): 3D-Stickman-Cartoon mit Remotion + Three.js statt flachem SVG. Immer zusammen mit dem jeweiligen Serien-Skill laden; dieser Skill ersetzt nur dessen Bild-/Render-Teil."
---

# 3D-Stickman-Cartoon-Stil (Remotion + Three.js)

Gilt für **30 Tage Glow-Up**, **30 Tage Maloche**, **SV Matsch 04** und neue Shorts.
Handlung, Figuren, Gags, Abstimmung, Stimme (Piper thorsten-high), Länge, Lieferung und Chronik kommen **unverändert aus dem Serien-Skill**. Dieser Skill ersetzt nur Szene, Rendern und Look.

## 1. Look (verbindlich)
- **Figuren:** großer runder Cartoon-Kopf mit **gezeichnetem Gesicht** (Canvas-Textur: dicke schwarze Augenkonturen, Pupillen, Lider, kräftige Brauen, Mund je Stimmung: smug, grin, stern, grumpy, shock, calm) auf einem **Strichmännchen-Körper**: lange dünne Beine und Arme mit Knie/Ellbogen (dunkles `#2b2430`), schmaler Rumpf mit Kleidung (nach unten ausgestellter Zylinder), Hände mit Daumen, Schuhe.
- Proportionen (Figur-Höhe ca. 3,4 Einheiten): Hüfte y 1,32 · Schulter y 1,98 · Kopfmitte y 2,7 · Kopf-Radius ~0,78 × 0,72. Beine 0,66 + 0,64, Arme 0,50 + 0,47, Glieder-Radius 0,04–0,05.
- **Sauberer 3D-Look:** `meshStandardMaterial` (roughness ~0,6), Metall `metalness 0,35`; **dünne schwarze Kontur** per Inverted Hull (Geometrie entlang der Normalen um 0,01–0,03 aufblasen, `BackSide`, schwarz); weiche Schatten (`shadows`, `shadow-radius 5`, Map 2048); warmes Key-Light + Fill-Light + Hemisphere; leichte Vignette als Overlay; `dpr={1.5}`.
- **Kamera eher weit:** Figuren meist ganz im Bild, Nahaufnahmen nur für Reaktionen. Jede Sprechzeile = eigener Shot mit kurzer, sanfter Kamerafahrt (Bezier-Ease) + 0,1-s-Weißblitz beim Schnitt. Kamera nie in Figuren/Requisiten stellen.
- **Format:** 1080×1920, 30 fps. Untertitel, Chips, Abstimmungskarten und Endkarte als **HTML-Overlays** in Remotion, Untertitel-Stil wie im Serien-Skill (große Großbuchstaben, weiß mit dicker dunkler Kontur, aktuelles Wort farbig).
- **Nur eigene Figuren** – nie Figuren oder Look anderer Kanäle nachbauen.

## 2. Figuren der Serien in 3D (immer gleich!)
**30 Tage Glow-Up:** Lenny – wirre schwarze Locken (Kugel-Locken), Brille mit weißem Klebeband, Stoppeln/Pickel auf der Gesichts-Textur, senffarbener Bademantel `#d9a83a` über fleckigem Shirt, graue Jogginghose, Socken + blaue Badelatschen, Stinkwolken = grüne halbtransparente Kugeln. Neue Looks (geduscht, Frisur, Outfit) als Varianten anlegen und danach beibehalten. Mama: bunte Lockenwickler-Zylinder, rosa Kittel. Marvin: blonde Tolle, rosa Polo mit hochgestelltem Kragen, Glitzer-Grinsen. Jessi: braune Haare, Sommersprossen, grüner Hoodie. Fliegen (Horst, Uwe, Brigitte, Kevin Jr.) als kleine 3D-Fliegen mit Namens-Chip.
**30 Tage Maloche:** Benni – oranger Beanie mit Bommel, grüner Hoodie, blaue Jeans-Beine, weiße Sneaker. Frau Krawuttke – graue Dutt-Haare, Brille, lila Strickjacke, Wischmopp, Stimmung immer `stern`. Killer – winziger wütender Chihuahua mit Stachelhalsband (aus Kugeln/Kegeln). Requisiten: Fahrrad mit Platten, Pakete, Spardose, Mitarbeiterwand, Firmenausweis. Farben Petrol `#06393d`, Orange `#F4A27C`/`#E8875E`. Auswahlkarten bleiben im Jobanzeigen-Stil (HTML).
**SV Matsch 04:** Gründer – Navy-Cap mit gelbem Schirm, brauner Vollbart, blaue Jacke `#1f5fd0`, gelber Schal mit blauen Streifen. Opa Horst – grüner Torwartpulli mit „1“, graue Haare + Bart, Brille. Kevin – blond, Trikot „4“, grüne Crocs. Manni – Bierbauch, Bart, Trikot „9“, Grillzange. Welt: Kreisliga-Platz nachts mit Regen-Partikeln, Matsch + spiegelnde Pfützen, Flutlichtmast mit Lichtkegel, Zaun, Tor mit Netz, Tribüne mit Fans (1 Follower = 1 Fan, max. ~60 zeichnen + Schild „FANS N“), grüner Vereinsheim-Container mit Schild „SV MATSCH 04“, Bierbank, Grill. Farben Blau `#1f5fd0` / Gelb `#FFD23F`.

## 3. Projekt-Setup (einmal)
```bash
mkdir shorts3d && cd shorts3d
# package.json dependencies (exakte Versionen):
#  remotion 4.0.542, @remotion/cli 4.0.542, @remotion/three 4.0.542,
#  @react-three/fiber 8.18.0, three 0.169.0, react 18.3.1, react-dom 18.3.1
#  dev: typescript 5.6.3, @types/react 18.3.12, @types/three 0.169.0
npm install
```
`src/index.ts` → `registerRoot(RemotionRoot)`; `src/Root.tsx` registriert pro Folge eine `<Composition id=… width={1080} height={1920} fps={30} durationInFrames={…}>`.
Ordnung: `src/hd.tsx` (Basis: Materialien, Kontur, Köpfe, StickBody), `src/series/<serie>.tsx` (Welt + Stammfiguren der Serie, einmal bauen und immer wiederverwenden), `src/<Serie>Tag<N>.tsx` (eine Folge).

## 4. Bausteine (in `src/hd.tsx` anlegen)
- `T` – Mesh mit `meshStandardMaterial` + Inverted-Hull-Kontur (`o` = Konturstärke), `M` – dasselbe metallisch.
- `GEO` – geteilte Geometrien: sphere, capsule, cylinder, box, rounded box, torus, cone, half-sphere, **face** (`SphereGeometry(1,48,36, π/2−1.05, 2.1, π/2−0.95, 1.9)` = Gesichtsfeld vorne).
- `faceTex(mood, lookX)` – 1024er Canvas pro Stimmung (gecacht): Augen weiß mit 20-px-Kontur, Pupille, Lid in Hautfarbe für smug/stern/grumpy, geschlossene Bögen für calm, Brauen 30 px mit Neigung je Stimmung, Mund (Grinsen mit Zähnen, Smirk, gerade Linie, offenes O bei shock), leichte Wangenröte. Als `meshBasicMaterial transparent` auf `GEO.face`, minimal größer als der Kopf.
- `Head` – Kopfkugel + Gesichtsfeld + Ohren + Frisur (caesar, curly, bald, none).
- `StickBody` – Beine/Arme als `Limb` (Oberteil-Kapsel, Gelenkkugel, Unterteil-Kapsel, Endstück), Rumpf als konischer Zylinder in Kleidungsfarbe, Schulterkugeln, Hals; Parameter `armR/armL` (Heben), `elbowR/L`, `walk` (Beinschwung per sin), `handR/handL` (Requisit in der Hand).
- `Roman`/Figur – StickBody + Head (+ Zubehör per Wrapper-Gruppe: Brille, Bart, Mütze, Schal, Trikotnummer als Canvas-Textur auf der Brust, Bauch-Kugel), Parameter `mood, look, bob` (Idle-Atmen).

## 5. Folge bauen
1. **Stand + Skript** genau nach Serien-Skill (Chronik, Top-Kommentar, Follower, Längen-Regeln). Sprechtext phonetisch (z. B. Fäns, Krocks), Untertitel in normaler Schreibung.
2. **Stimme:** Piper thorsten-high via sherpa-onnx (`--vits-length-scale 0.86–1.07` je nach Ziel-Länge), pro Zeile WAV → Stille abschneiden, `loudnorm=I=-16`, 48 kHz, Pausen pro Zeile → `public/<folge>_voice.wav` + `src/timing_<folge>.json` mit `lines: [[start,end],…]` und `words: [{text,start,end,line}]` (Wortzeiten anteilig nach Wortlänge).
3. **Komposition:** `SHOTS` = Liste `{at, from, to, lookA, lookB, dur, fov}` pro Zeile; `camAt(t)` interpoliert mit Ease; Kamera via `useThree().camera` jedes Frame setzen. Zustand pro Zeile (`stateAt(t)`: Stimmungen, Arme, Requisiten, Animationen mit `interpolate(..., {extrapolateLeft/Right:'clamp'})`). Alles **deterministisch aus der Frame-Zeit** (kein `useFrame`, kein Zufall ohne Seed).
4. **Overlays:** Serien-Chip oben, Pop-Chips (`spring`) exakt auf Wortzeiten, Untertitel (1–2 Wörter, aktuelles Wort farbig), Abstimmungskarten 1/2/3 im Serien-Stil, Endkarte/CTA, Weißblitz am Ende (Loop).
5. **Ton:** Musik + SFX selbst mit numpy/scipy synthetisieren wie im Serien-Skill (keine Rausch-Teppiche) → `public/<folge>_music.wav`; beide WAVs per `<Audio>` einbinden.

## 6. Prüfen und Rendern
- Erst **Standbilder** pro Szene: `npx remotion still <Comp> out/x.png --frame=N --browser-executable=<chrome-headless-shell> --gl=swangle` → Kontaktbogen ansehen: Kamera nicht in Figuren, nichts abgeschnitten, Overlays kollidieren nicht. Fehler fixen.
- Dann rendern: `npx remotion render <Comp> out/<serie>_tagN.mp4 --browser-executable=<chrome-headless-shell> --gl=swangle --concurrency=2` (60 s ≈ 1 h auf 2 Kernen, im Hintergrund laufen lassen).
- End-Kontaktbogen (`ffmpeg -vf fps=1/3,scale=180:-1,tile=9x2`) prüfen, dann wie im Serien-Skill liefern (MP4, Beschreibung, KI-Label-Hinweis, Chronik).
