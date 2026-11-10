# Projekt-Notizen für Claude

- 3D-Shorts-Projekt liegt in `shorts3d/` (Remotion + Three.js). Nischen-Plan und Format-Regeln: `shorts3d/NISCHEN.md` – vor jedem neuen Video lesen.
- Stil: 3D-Strichmännchen-Cartoon (eigene Figuren aus `shorts3d/src/hd.tsx`), deutsche Stimme (Piper thorsten-high), englische Untertitel.
- Render: `npx remotion render <Comp> out/<name>.mp4 --browser-executable=<chrome-headless-shell> --gl=swangle --concurrency=2`.
- Antworten an den Nutzer auf Deutsch.
- Die Serien „30 Tage Glow-Up“, „30 Tage Maloche“ und „SV Matsch 04“ werden im 3D-Stickman-Cartoon-Stil gebaut: `shorts3d/STIL_3D.md` befolgen (ersetzt den SVG-Bildteil der Serien-Skills).
- Düsterer Nacht-/Liminal-Space-Stil (leere Flughäfen etc., Auswahl-Chips, Rewind): `shorts3d/STIL_NACHT.md` befolgen, Code-Vorlage `shorts3d/src/NightGate.tsx`.
- Serie „Final Call Stories“ (@finalcall.stories): `shorts3d/skill/final-call-stories/SKILL.md` befolgen.
