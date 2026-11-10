---
name: final-call-stories
description: "Erstellt eine neue Folge der Serie „Final Call Stories“ (TikTok @finalcall.stories / YouTube Shorts): düstere 3D-Liminal-Space-Geschichten in der Du-Form mit Auswahl-Chips, „Let's rewind“ und Kommentar-Frage, 55–66 s, 9:16. Nutzen bei: Final Call Stories, neue Folge, Liminal-Story, Nacht-Flughafen-Video, Horror-Short mit Auswahl."
---

# Final Call Stories – 3D-Liminal-Shorts

**Kanal:** Final Call Stories · TikTok **@finalcall.stories** · YouTube Shorts.
**Bio:** „You wake up somewhere empty. Choose wisely. 🌙 New story every week 👇“
**Profilbild:** der Attendant (gesichtsloser Kopf mit glühendem bernsteinfarbenem Lichtschlitz) – `shorts3d/out/profilbild.png`.
**Erste Folge:** „Flight 404“ (`shorts3d/src/NightStory.tsx`, fertig: `out/flight404_elevenlabs.mp4`).
**Stil:** immer zusätzlich den Skill/Leitfaden **3d-night-liminal** (`shorts3d/STIL_NACHT.md`) befolgen. Code-Basis: Projekt `shorts3d/` (Remotion + Three.js) im Repo `julianbill06-hub/re2`.

## 1. Folgen-Formel (55–66 s, 18–22 Sprechzeilen)
1. **Hook (0–3 s):** Du-Form, unheimliche Ausgangslage an einem leeren, vertrauten Ort bei Nacht („Du schläfst am Gate ein. Als du aufwachst, ist alles leer.“).
2. **Das Unmögliche (3–15 s):** ein Detail, das nicht stimmt (gestrichene Flüge bis auf einen, eine Durchsage, eine Uhr, die rückwärts läuft …) + **der Gegenspieler** wird enthüllt (gesichtslos, ein Licht-Merkmal).
3. **Entscheidung (≈15 s):** „Du hast zwei Möglichkeiten.“ → zwei Auswahl-Chips oben (rot/grün, englisch, z. B. „STAY SEATED / WALK TO THE DESK“).
4. **Weg A (≈12 s):** Eskalation, Ende im Schwarz / offen-unheimlich.
5. **„Lass uns zurückspulen.“** (◀◀, VHS-Streifen, Rückspul-Sound).
6. **Weg B (≈12 s):** Spannung durch Wiederholung (Flackern → er ist jedes Mal näher), dann scheinbare Rettung (Morgen, Menschen, Licht).
7. **Twist (≈5 s):** ein Beweis, dass es echt war (Bordkarte in der Tasche …).
8. **Endkarte (3 s):** „WHAT WOULD YOU DO?“ + beide Chips → Kommentar-Frage.
Regeln: eigene Geschichten und Figuren (nie Inhalte, Figuren, Orte oder Texte anderer Kanäle nachbauen), keine echten Marken/Personen, unheimlich aber ohne Gewaltdarstellung (Bedrohung bleibt angedeutet), jede Folge abgeschlossen.

**Ideen-Pool (eigene Konzepte):** Nachtzug hält an einer Station, die es nicht gibt · Hotelflur, dessen Zimmernummern sich ändern · leeres Kaufhaus nach Ladenschluss mit Durchsage „Bitte bleiben Sie stehen“ · Parkhaus-Ebene −4, die im Aufzug nicht existiert · Krankenhaus-Wartezimmer, in dem nur deine Nummer aufgerufen wird · Raststätte, an der jedes Auto dein Kennzeichen hat.

## 2. Figuren (eigene Designs, immer gleich)
- **Du (Protagonist):** Cartoon-Kopf mit gezeichnetem Gesicht (Stimmungen calm/stern/shock), braune Locken, türkiser Parka, Strichkörper, Maßstab 0,7 zu Möbeln (`Traveler` in `NightGate.tsx`).
- **Gegenspieler:** gesichtslos, glatter Kopf, **ein** glühendes Licht-Merkmal, Uniform passend zum Ort. Folge 1: **der Attendant** (dunkle Uniform, Mütze, bernsteinfarbener Lichtschlitz). Neue Orte bekommen neue Gegenspieler nach derselben Logik (z. B. Schaffner mit rotem Lichtpunkt, Hotelpage mit grünem Schlitz).
- Statisten (Morgen-Szenen): generische Cartoon-Figuren in bunten Farben.

## 3. Sprache, Text, Ton
- **Stimme:** deutsch. Entweder Piper thorsten-high (`length-scale 1.1`) **oder** ElevenLabs (bevorzugt, Stimme „Adam – American Dark and Tough“, Stability ~60–70 %).
- **Skript für ElevenLabs:** eine Zeile pro Satz, Zahlen ausgeschrieben, Pausen als `<break time="0.6s" />` (0,4–1,1 s; länger vor Schocks).
- **Untertitel im Video: englisch** (1–2 Wörter, weiße fette Großbuchstaben, ~55 % Bildhöhe, weicher Schatten). Chips, Tafeln, Schilder, Endkarte: **englisch**.
- **Ton:** Drone, Lüftung, Gong, Leuchtröhren-Summen, tiefe Schläge, Rückspul-Whoosh (Skript-Vorlage `tools/music_f404.py`).

## 4. Produktion
1. Story nach Formel schreiben → `tools/<folge>/lines.txt` (deutsch), `captions.txt` (englisch, gleiche Zeilen), `pauses.txt`.
2. Stimme + Timing: `python3 tools/voice.py tools/<folge> public/<folge>_voice.wav src/timing_<folge>.json`.
3. Set/Komposition nach Vorlage `src/NightStory.tsx` (`NightWorld` + `SHOTS` + `stateAt` + Chips/Rewind/Endkarte), in `src/Root.tsx` registrieren. Neue Orte als eigene Welt-Komponente im gleichen Look (siehe 3d-night-liminal).
4. Musik/SFX-Skript analog `tools/music_f404.py`.
5. Standbilder pro Szene prüfen (Kamera nie in Figuren/Möbeln, nichts angeschnitten, nicht zu dunkel), dann rendern (`--gl=swangle --concurrency=2`, 60 s ≈ 1 h).
6. **ElevenLabs-Fassung (schnell, ohne Neu-Rendern):** User schickt die MP3 → Satzanfänge per `silencedetect` ermitteln, per DP den Skriptzeilen zuordnen (Vorlage: Abschnitt in dieser Session / `tools/f404de/`), das **fertige Video pro Zeile zeitlich dehnen** (ffmpeg `trim`+`setpts`+`concat`) und MP3 + neu getaktete Musik darunterlegen. Englische Untertitel bleiben eingebrannt; keine Balken, keine deutschen Untertitel. Dauer ~30 s.

## 5. Lieferung
- MP4 (1080×1920) per Datei an den User, Repo committen/pushen.
- **TikTok-Beschreibung (Vorlage):** „<Hook-Satz> 😳 Would you <Option A> or <Option B>? 👇 #horror #liminalspace #scarystories #<ort> #animation“
- **YouTube Shorts:** Titel „<Unmögliches Detail>… Would You <Option>? <Emoji> #shorts“ + 2–3 Sätze Teaser + Kommentar-Frage + `#shorts #horror #liminalspace #scarystories #animation`.
- Hinweis an den User: KI-Kennzeichnung beim Upload setzen.
- Danach fragen, ob die nächste Folge (neuer Ort) gebaut werden soll; optional „FINAL CALL STORIES“-Logo in die Endkarte.
