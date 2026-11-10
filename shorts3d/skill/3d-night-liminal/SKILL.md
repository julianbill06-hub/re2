---
name: 3d-night-liminal
description: "Düsterer, filmischer 3D-Look „Nacht-Gate / Liminal Space“ für Storytelling-Shorts mit Auswahl-Chips (z. B. leere Flughäfen, Kabinen, Bahnhöfe bei Nacht). Remotion + Three.js, eigene Figuren, deutsche Stimme, englische Untertitel. Nutzen, wenn eine Videoidee in diesem Stil umgesetzt werden soll."
---

# 3D-Nacht-Liminal-Stil

Code-Basis: Projekt `shorts3d/` (Remotion 4.0.542 + @remotion/three + @react-three/fiber 8.18 + three 0.169).
Wichtigste Dateien: `src/hd.tsx` (Figuren-Bausteine), `src/NightGate.tsx` (Set, Figuren, Detail-Ebene, Beispiel-Kompositionen), `tools/voice.py` (Stimme + Timing).

## Look (verbindlich)
- **Licht:** sehr dunkel, filmisch. `toneMapping: ACESFilmic`, `toneMappingExposure 1.6–1.7`. Kühle Deckenleisten (weiß-blau, emissive Boxen + Punktlichter, eine Leiste defekt/flackernd), warmes Praxislicht (orange `#ff9a3c`) an einem Ort der Bedrohung (Schalter), Spot mit sichtbarem Lichtkegel + Staubpartikeln auf die Hauptfigur. Ambient/Hemisphere nur schwach (0,3/0,5).
- **Atmosphäre:** Glüh-Halos (additive Sprites) um alle Lichtquellen, Fake-Bodenspiegelungen (additive Flächen unter Lichtern), polierter Boden (roughness 0,18, metalness 0,35), Nebel `#07080b` ab 8 m, starke Vignette (radial, bis 70 % Schwarz), Ein- und Ausblenden über Schwarz.
- **Set-Details:** Anzeigetafel als Canvas-Textur (CANCELLED rot, ein Ziel BOARDING orange), beleuchtetes Gate-Schild, Exit-Schild grün, Uhr, Absperrpfosten mit rotem Gurt, Sitzreihen mit Polster + Chrombeinen, Rucksack, Mülleimer, Ladesäule, Kassettendecke, Fensterfront mit Flugzeug + Rollfeld-Lichtern + blinkendem Beacon. Alles mit dünner Kontur.
- **Figuren (eigene Designs, nie fremde Kanal-Figuren):** Protagonist = Cartoon-Kopf mit gezeichnetem Gesicht + Strichkörper, türkiser Parka, Maßstab 0,7 (passend zu Sitzen). Gegenspieler „Attendant“ = dunkle Uniform, glatter grauer Kopf **ohne Gesicht**, glühender bernsteinfarbener Lichtschlitz (emissive, `toneMapped=false`), Mütze, Abzeichen. Weitere Gegenspieler/Nebenfiguren in derselben Logik erfinden (gesichtslos, ein Licht-Merkmal).
- **Kamera:** langsame, ruhige Fahrten (Bezier-Ease, 2–4 s pro Shot), leichte Handkamera-Drift (±1 cm). Mischung aus weiten Fluchtlinien-Shots (Gänge, Sitzreihen), Close-ups auf Gesichter/Gegenstände (Bordkarte, Tafel, Handy) und langsamen Zufahrten auf die Bedrohung. Kamera nie in Objekte stellen; Figuren im Verhältnis zu Möbeln korrekt.
- **Overlays:** oben 2 Auswahl-Chips (weiße Pillen mit rotem/grünem Punkt, z. B. „STAY SEATED / WALK TO THE DESK“), aktive Wahl bleibt während der Szene sichtbar. Untertitel: 1–2 Wörter, weiße fette Großbuchstaben, mittig auf ~55 % Bildhöhe, weicher Schatten, keine Kontur. Erzählprinzip „Let's rewind“ → zurück zum Entscheidungspunkt, andere Wahl.
- **Ton:** tiefer Drone (55 Hz-Schwebung), leises Lüftungsrauschen, Gong/Durchsage-Ton, Leuchtröhren-Summen bei Flackern, tiefer Schlag bei Enthüllungen, Stille vor Schocks. Deutsche Stimme (Piper thorsten-high, `length-scale 1.1–1.15`, ruhig), englische Untertitel.

## Ablauf für eine neue Videoidee
1. Idee in Szenen + Entscheidungspunkte zerlegen (Hook in den ersten 2 s, je Wahl ein Ausgang, „Let's rewind“, Endfrage für Kommentare).
2. `tools/<folge>/lines.txt` (deutsch), `captions.txt` (englisch), `pauses.txt` → `python3 tools/voice.py tools/<folge> public/<folge>_voice.wav src/timing_<folge>.json`.
3. Neues Set analog `GateSet` + `GateDetails` bauen (oder wiederverwenden), Komposition analog `NightGateScene` (Shots-Liste, Zustand pro Zeile, Chips, Untertitel) und in `src/Root.tsx` registrieren.
4. Ton-Skript analog `tools/music_gate.py`.
5. Erst Standbilder prüfen (`npx remotion still …`), dann rendern: `npx remotion render <Comp> out/<name>.mp4 --browser-executable=<chrome-headless-shell> --gl=swangle --concurrency=2`.
