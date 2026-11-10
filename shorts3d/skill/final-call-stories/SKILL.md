---
name: "final-call-stories"
description: "Erstellt eine neue Folge der Serie „Final Call Stories“ (TikTok @finalcall.stories / YouTube Shorts): düstere 3D-Liminal-Space-Geschichten in der Du-Form mit Auswahl-Chips, Rewind und Abstimmung, 45–52 s, 9:16, 60 fps, auf Zu-Ende-Schauen optimiert."
---

# Final Call Stories – 3D-Liminal-Shorts (HD-Standard)

**Kanal:** Final Call Stories · TikTok **@finalcall.stories** · YouTube Shorts.
**Bio:** „You wake up somewhere empty. Choose wisely. 🌙 New story every week 👇“
**Profilbild:** der Attendant – `shorts3d/out/profilbild.png`.
**Folgen:** 1 „Flight 404“ (`src/NightStory.tsx`) · 2 „Platform Zero“ (Nachtzug, `src/NightTrain.tsx`, Referenz `TrainRef` / `TrainRefClose`).
**Stil:** zusätzlich **3d-night-liminal** (`shorts3d/STIL_NACHT.md`) befolgen. Code-Basis: `shorts3d/` (Remotion + Three.js) im Repo `julianbill06-hub/re2`, Branch `claude/confident-rubin-0wri5d`.

## 0. Retention zuerst (Ziel: >60 % schauen weiter statt wegzuwischen)
Ausgangslage Nov. 2026: nur 40,6 % schauen weiter, 59,4 % wischen weg → die ersten 2 Sekunden entscheiden.
- **Frame 0 ist schon spannend:** kein Einblenden aus Schwarz, kein Logo, kein ruhiger Establishing-Shot. Das erste Bild zeigt die Bedrohung (z. B. den Gegenspieler direkt hinter der Hauptfigur) mit der Kamera schon in Bewegung.
- **Cold Open:** Die erste Zeile ist eine Warnung oder ein Verbot, kein Erzählen („Steig niemals an Gleis null aus.“). Maximal 6 Wörter, gesprochen ab Frame 0, und die Untertitel stehen ab Frame 0.
- **Text-Hook oben ab Frame 0** (bis ~2,5 s): eine Frage auf Englisch („WOULD YOU GET OFF?“), danach Chips.
- **Laut in der ersten Sekunde:** tiefer Schlag oder Gong auf Frame 0, keine leise Musik zum Start.
- **Dauer 45–52 s**, nicht länger. Jeder Satz, der die Spannung nicht erhöht, fliegt raus.
- **Offene Schleifen:** Nach dem Rewind kommt ein Versprechen („Denn Weg zwei ist schlimmer.“), damit niemand nach Weg A aussteigt.
- **Loop-Ende:** Der letzte Satz führt nahtlos in den ersten (Endfrage → Cold-Open-Satz). Das letzte Bild passt zum ersten Bild, damit Wiederholungen gezählt werden.
- **Endkarte nur 1,5 s**, die Frage wird schon während des Twists gestellt.

## 1. Folgen-Formel (45–52 s, 15–17 Sprechzeilen)
1. **Cold Open + Hook (0–3 s):** Warnsatz (siehe 0.), dann sofort Du-Form-Ausgangslage. Der Gegenspieler ist schon im ersten Bild zu sehen.
2. **Das Unmögliche (3–15 s):** ein Detail, das nicht stimmt + **der Gegenspieler** wird enthüllt (gesichtslos, ein Licht-Merkmal).
3. **Entscheidung (≈15 s):** „Du hast zwei Möglichkeiten.“ → zwei Auswahl-Chips oben (rot/grün, englisch).
4. **Weg A (≈12 s):** Eskalation, Ende im Schwarz / offen-unheimlich.
5. **„Zurückspulen. Denn Weg zwei ist schlimmer.“** (◀◀, VHS-Streifen, Rückspul-Sound): offene Schleife statt Ruhepause.
6. **Weg B (≈12 s):** Spannung durch Wiederholung (Flackern → er ist jedes Mal näher), dann scheinbare Rettung (Morgen, Menschen, Licht).
7. **Twist (≈5 s):** ein Beweis, dass es echt war – idealerweise einer, der zurück zu Weg A führt (Diskussionsstoff).
8. **Abstimmung + Loop (1,5 s):** Die gesprochene Endfrage (z. B. „Also … steigst du ein?“) führt direkt in den Cold-Open-Satz. Die Endkarte zeigt „WHAT WOULD YOU DO?“ und beide Chips groß, dazu die Kommentar-Frage.

**Spannungs-Regeln:** alle 1,5–2,5 s ein neuer Shot oder eine sichtbare Veränderung; Stille (0,8–1,1 s) vor jedem Schock; Bedrohung steht hinter oder seitlich der Figur („the threat is always behind you“); jede Folge hat ein Bild, das man pausieren will (z. B. Gegenspieler im Fensterspiegel für 2 Frames).
Regeln: eigene Geschichten und Figuren (nie Inhalte, Figuren, Orte oder Texte anderer Kanäle nachbauen), keine echten Marken/Personen, unheimlich ohne Gewaltdarstellung, jede Folge abgeschlossen.

**Ideen-Pool:** Nachtzug / Gleis 0 (Folge 2) · Hotelflur, dessen Zimmernummern sich ändern · leeres Kaufhaus nach Ladenschluss · Parkhaus-Ebene −4 · Krankenhaus-Wartezimmer, in dem nur deine Nummer aufgerufen wird · Raststätte, an der jedes Auto dein Kennzeichen hat.

## 2. Figuren – HD-Detailstandard (verbindlich)
Alle Figuren werden aus **posierbaren Knochen** gebaut (`Bone` a→b, Gelenk-Kugeln an Knie/Ellbogen, `Hand` mit Handfläche, 4 Fingern, Daumen, Krümmung `curl`), nicht mehr als Strichfiguren. Mindestens **6 Detail-Elemente pro Figur** (Nähte, Knöpfe, Taschen, Kragen, Schuhe mit Sohle + Schnürung …). Jede Figur hat dünne Toon-Kontur.
- **Du (Protagonist) = `TravelerHD`** (`src/NightTrain.tsx`): großer Cartoon-Kopf (`Head`, Stimmungen calm/stern/shock/grin, `look` für Blickrichtung), **dichte Locken (~120 Kugeln, 3 Brauntöne) + Pony**, türkiser Stepp-Parka (Steppnähte, Reißverschluss mit Messing-Zipper, 2 Pattentaschen, Halbmond-Aufnäher), Kapuze mit Fellrand, senfgelber Schal mit Fransen, Jeans mit goldener Naht + Umschlag, rote Sneaker (weiße Sohle, Schnürung). Posen: `sit` / stehend, `breathe` für Atmen.
- **Gegenspieler:** gesichtslos, **glänzender** glatter Kopf (`Gloss`), **ein** glühendes Licht-Merkmal (kleiner Kern + zwei Halos + schwaches Punktlicht, Kopf bleibt dunkel), Uniform mit vielen Details, weiße Handschuhe, kaltes Gegenlicht von hinten für die Silhouette.
  - Folge 1: **Attendant** (bernsteinfarbener Lichtschlitz).
  - Folge 2: **Conductor** (`Conductor`): langer Mantel, doppelte Messingknopfreihe, Gürtel + Schnalle, Revers, Stehkragen, Epauletten mit Goldfransen, Hose mit roter Paspel, Lackschuhe, Schirmmütze mit rotem Band, Lackschirm + Flügel-Abzeichen, Fahrkartenzange, `point` (0–1) zum Zeigen, **ein roter Lichtpunkt**.
  - Neue Orte → neuer Gegenspieler nach derselben Logik (z. B. Hotelpage mit grünem Schlitz).
- Statisten (Morgen-Szenen): einfachere Varianten von `TravelerHD` in anderen Farben/Frisuren.

## 3. Bild, Bewegung, Frames
- **60 fps** (Komposition `fps={60}`), 1080×1920, `dpr 1.5`, ACES, Exposure 1,45–1,6.
- **Mehr Bewegung pro Shot:** Kamera fährt immer (Bezier-Ease), Handkamera-Drift, Figuren atmen/blinzeln, Licht flackert, Staub treibt. Keine Standbilder länger als 0,5 s.
- **Shot-Liste:** 25–35 Shots pro Folge (statt ~12): Mischung aus Totale (Gang-Fluchtlinie), Nah (Gesicht), Detail (Ticket, Schild, Lichtpunkt), POV, Überschulter. Zoom-Punch (+8 % in 6 Frames) auf jeden Schock.
- **Film-Look-Overlay** (`FilmLook`): Vignette + animiertes Korn. **Kein Einblenden am Anfang**, Schwarz nur bei Schocks innerhalb der Folge.
- Overlays: `Chips` (oben, aktive Wahl hell, andere 35 %), `Caption` (1–2 Wörter, fett, weiß, Großbuchstaben, ~55 % Bildhöhe, weicher Schatten).

## 4. Sprache, Text, Ton
- **Stimme:** deutsch, ElevenLabs „Adam – American Dark and Tough“ (Stability 60–70 %) bevorzugt, sonst Piper thorsten-high (`length-scale 1.1`).
- **Skript für ElevenLabs:** eine Zeile pro Satz, Zahlen ausgeschrieben, Pausen als `<break time="0.6s" />` (0,4–1,1 s; länger vor Schocks).
- **Untertitel, Chips, Schilder, Endkarte: englisch.**
- **Ton:** Drone, Lüftung/Fahrgeräusch, Gong, Leuchtröhren-Summen, tiefe Schläge, Rückspul-Whoosh (Vorlage `tools/music_f404.py`).

## 5. Produktion
1. Skript nach Formel → dem User zuerst zeigen (deutsche Zeilen mit Breaks + englische Untertitel).
2. **Referenzbild vor dem Rendern:** Totale + Nahaufnahme Gegenspieler als Standbild (`npx remotion still …`) an den User schicken, Feedback einarbeiten.
3. `tools/<folge>/lines.txt`, `captions.txt`, `pauses.txt`. Mit ElevenLabs-MP3: Satzanfänge per `silencedetect`, per DP den Zeilen zuordnen → `src/timing_<folge>.json` (Shots direkt auf die MP3 takten). Ohne MP3: `python3 tools/voice.py …`.
4. Set/Komposition nach Vorlage `src/NightTrain.tsx` + `src/NightStory.tsx` (`SHOTS` + `stateAt` + Chips/Rewind/Endkarte), in `src/Root.tsx` mit 60 fps registrieren.
5. Musik/SFX-Skript analog `tools/music_f404.py`.
6. Standbilder pro Szene prüfen (Kamera nie in Figuren/Möbeln, nichts angeschnitten, nicht zu dunkel, Gegenspieler-Kopf dunkel mit klar lesbarem Lichtpunkt), dann rendern (`--gl=swangle --concurrency=2`; 60 s bei 60 fps ≈ 2 h).

## 6. Lieferung
- MP4 (1080×1920, 60 fps) per Datei an den User, Code committen/pushen (Bilder/Videos in `out/` sind gitignored).
- **TikTok-Beschreibung:** „<Hook-Satz> 😳 Would you <Option A> or <Option B>? 👇 #horror #liminalspace #scarystories #<ort> #animation“
- **YouTube Shorts:** Titel „<Unmögliches Detail>… Would You <Option>? <Emoji> #shorts“ + 2–3 Sätze Teaser + Kommentar-Frage + `#shorts #horror #liminalspace #scarystories #animation`.
- Hinweis: KI-Kennzeichnung beim Upload setzen.
- Danach fragen, ob die nächste Folge (neuer Ort) gebaut werden soll.