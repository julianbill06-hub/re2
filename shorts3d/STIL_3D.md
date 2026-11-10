# 3D-Stickman-Cartoon-Stil (verbindlich für: 30 Tage Glow-Up, 30 Tage Maloche, SV Matsch 04)

Diese Serien werden **nicht mehr im flachen SVG-Stil** gebaut, sondern als 3D-Animation mit **Remotion + Three.js** im Projekt `shorts3d/`.
Handlung, Figuren, Running Gags, Abstimmung, Stimme, Länge, Lieferung und Chronik bleiben genau wie im jeweiligen Serien-Skill – **nur die Bild-Umsetzung ändert sich**.

## Look
- Figuren: großer runder Cartoon-Kopf mit gezeichnetem Gesicht (dicke schwarze Konturen, Lider/Brauen für Stimmungen) + **Strichmännchen-Körper** (lange dünne Arme/Beine mit Knie/Ellbogen, schmaler Rumpf mit Kleidung, Schuhe). Bausteine: `Head`, `StickBody`, `Roman`, `T`, `M`, `GEO` aus `src/hd.tsx`.
- Sauberer, glatter 3D-Look: `meshStandardMaterial`, dünne Inverted-Hull-Konturen, weiche Schatten (`shadows`, `shadow-radius`), warmes Key-Light + Fill-Light, leichte Vignette, `dpr={1.5}`.
- Kamera **eher weit** (Figuren meist ganz im Bild), Nahaufnahmen nur für Reaktionen; Schnitt pro Sprechzeile mit kurzer Kamerafahrt + 0,12-s-Weißblitz.
- Format bleibt **1080×1920, 30 fps**, Untertitel wie bisher in der Serie (große weiße Großbuchstaben mit dunkler Kontur, Farb-Hervorhebungen) als HTML-Overlay in Remotion; Chips/Karten/Abstimmungskarten als HTML-Overlays über der 3D-Szene.
- Sprache/Stimme wie im Serien-Skill (deutsch, Piper thorsten-high).

## Figuren-Übersetzung in 3D (immer gleich aussehen lassen!)
**30 Tage Glow-Up**
- Lenny: wirre schwarze Haare (Kugel-Locken in Schwarz), Brille mit Klebeband (Ring-Brille + weißes Klebeband-Kästchen), Stoppeln/Pickel als Gesichts-Textur, senffarbener Bademantel (Tunika in `#d9a83a` + offene Bademantel-Kanten) über fleckigem Shirt, Jogginghose (graue Beine), Socken + blaue Badelatschen. Stinkwolken = grüne halbtransparente Kugeln. Glow-Up wird über neue Looks sichtbar (geduscht, neue Frisur, Outfit) – neue Varianten als Props anlegen und danach beibehalten.
- Mama: Lockenwickler (bunte Zylinder auf dem Kopf), rosa Kittel. Marvin: blonde Tolle, rosa Polo mit hochgestelltem Kragen, Glitzer-Grinsen. Jessi: braune Haare, Sommersprossen-Textur, grüner Hoodie.
- Fliegen (Horst, Uwe, Brigitte, Kevin Jr.) als kleine 3D-Fliegen mit Namens-Chip; Pizzakarton-Turm, Pfandflaschen als Requisiten.

**30 Tage Maloche**
- Benni: oranger Beanie mit Bommel, grüner Hoodie, Jeans (blaue Beine), weiße Sneaker. Frau Krawuttke: graue Dutt-Haare, Brille, lila Strickjacke, Wischmopp, nie lächelnd (Mood `stern`). Killer: winziger wütender Chihuahua mit Stachelhalsband (eigenes 3D-Modell aus Kugeln/Kegeln).
- Requisiten in 3D: Fahrrad mit Platten, Pakete, Firmen-Spardose, Mitarbeiterwand, Firmenausweis. Farben Petrol `#06393d`, Orange `#F4A27C`/`#E8875E`, Nacht-Skyline lila.
- Auswahlkarten bleiben im Jobanzeigen-Stil (HTML-Overlay).

**SV Matsch 04**
- Gründer: blaue Regenjacke, gelber Schal mit blauen Streifen, Navy-Cap mit gelbem Schirm, brauner Vollbart. Opa Horst (Tor): grüner Torwartpulli, graue Haare + Bart, Brille, Nr. 1. Kevin: grüne Crocs, blond, Nr. 4. Manni: Bierbauch, Bart, Grillzange, Nr. 9 + Grill.
- Welt in 3D: Kreisliga-Platz bei Nacht mit Pfützen und Regen (Partikel), Flutlicht, Tribüne mit Sitzplätzen (1 Follower = 1 Fan), Vereinsheim als grüner Container mit Schild, Bierbank, Tor. Vereinsfarben Blau `#1f5fd0` / Gelb `#FFD23F`, Wappen „SVM 04“.

## Ablauf pro Folge
1. Stand/Chronik wie im Serien-Skill holen, Skript + Stimme wie dort (Längen-Regeln beachten).
2. `tools/voice.py <ordner> public/<serie>_voice.wav src/timing_<serie>.json` (lines.txt, optional captions.txt/pauses.txt).
3. Neue Komposition `src/<Serie>Tag<N>.tsx` (Vorlage: `src/Ocean60.tsx`/`src/Marsh.tsx` – Shots, State pro Zeile, Captions, Pills, Endkarte) und in `src/Root.tsx` registrieren. Wiederkehrende Figuren/Sets einmal pro Serie in `src/series/<serie>.tsx` anlegen und dann immer wiederverwenden.
4. Musik/SFX mit einem `tools/music_*.py` (wie im Serien-Skill beschrieben) → `public/<serie>_music.wav`.
5. Erst Standbilder pro Szene prüfen (Kamera nicht in Figuren, alles im Bild), dann rendern:
   `npx remotion render <Comp> out/<name>.mp4 --browser-executable=<chrome-headless-shell> --gl=swangle --concurrency=2` (60 s ≈ 1 h).
