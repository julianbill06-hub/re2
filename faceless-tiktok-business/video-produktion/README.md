# Video-Produktion

Mit diesem Code sind die Videos in `../videos/` entstanden. Jedes Video ist eine JSON-Spec in `specs/`: Sätze, Untertitel, Hervorhebungen, Tags und Panels.

## Ablauf

```bash
python3 voice.py specs/v01.json   # Stimme erzeugen: mehrere Takes pro Satz, per Whisper prüfen, besten nehmen
python3 build.py specs/v01.json   # Timeline, HTML-Szene und Ton-Mix nach work/<id>/
./make.sh v01-gelbe-fugen         # Frames rendern (Playwright), Ton normalisieren -> out/<id>.mp4
```

## Benötigt (nicht im Repo, weil groß)

- `tts/`: Piper `2023.11.14-2` (`piper_linux_x86_64.tar.gz`, nur für `piper_phonemize`) und die Stimme `vits-piper-de_DE-thorsten-high` aus sherpa-onnx `tts-models`
- `asr/`: sherpa-onnx `v1.12.0` linux-x64-static und `sherpa-onnx-whisper-small`
- Python: `numpy` und `onnxruntime`; außerdem Node mit `playwright`, `ffmpeg` und die Schrift Inter

## Neues Video

Spec kopieren und die Sätze ändern. Zahlen im Feld `say` ausschreiben, mit Ziffern im Feld `show`. Panel-Typen: `stat`, `vs`, `list`, `cta`. Ziel: über 61 Sekunden, damit das Video für Creator Rewards zählt. `build.py` gibt die Dauer aus.
