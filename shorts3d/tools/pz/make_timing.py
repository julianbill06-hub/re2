import json, re, sys
SPEED = 1.1
words = [l.rstrip('\n').split('\t') for l in open('tools/pz/words_whisper.tsv')]
words = [(float(a)/SPEED, float(b)/SPEED, w.strip()) for a,b,w in words]
# line end words (in order) – each line ends at the first match after the previous line
ends = ['aus.', 'leer.', 'Null.', 'aussteigen.', 'Punkt.', 'aus?', 'sich.', 'eins.', 'dir.', 'schlimmer.', 'dir.', 'näher.', 'Geschafft.', 'Tasche.', 'Nacht.', 'ein?']
EN = [
 [["NEVER GET OFF", "AT PLATFORM ZERO."]],
 [["YOU FALL ASLEEP", "ON THE LAST", "NIGHT TRAIN."], ["YOU WAKE UP.", "THE CAR", "IS EMPTY."]],
 [["THE TRAIN", "HAS STOPPED."], ["A SIGN", "OUTSIDE."], ["PLATFORM", "ZERO."]],
 [["LAST STOP."], ["ALL PASSENGERS,", "PLEASE EXIT."]],
 [["BEHIND YOU", "STANDS", "THE CONDUCTOR."], ["NO FACE."], ["JUST ONE", "RED LIGHT."]],
 [["HE POINTS", "AT THE DOOR."], ["DO YOU STAY", "OR GET OFF?"]],
 [["YOU STAY."], ["THE DOORS", "CLOSE."]],
 [["OUTSIDE:", "ONLY BLACK."], ["THE SPEAKER", "COUNTS DOWN."], ["THREE.", "TWO.", "ONE."]],
 [["LIGHTS OUT."], ["THE RED LIGHT", "IS RIGHT", "NEXT TO YOU."]],
 [["LET'S REWIND."], ["PATH TWO", "IS WORSE."]],
 [["YOU GET OFF."], ["THE LIGHTS", "FLICKER."], ["HE'S BEHIND YOU."]],
 [["FLICKER."], ["HE'S CLOSER."]],
 [["YOU RUN", "UP THE STAIRS."], ["MORNING."], ["PEOPLE."], ["YOU MADE IT."]],
 [["THEN", "YOU CHECK", "YOUR POCKET."]],
 [["A TICKET."], ["PLATFORM ZERO."], ["DEPARTS:", "TONIGHT."]],
 [["SO…", "WILL YOU", "GET ON?"]],
]
lines, i = [], 0
for li, e in enumerate(ends):
    j = i
    while words[j][2] != e: j += 1
    lines.append(words[i:j+1]); i = j + 1
assert i == len(words), (i, len(words))
out = {"lines": [], "sentences": [], "caps": [], "words": []}
for li, lw in enumerate(lines):
    out["lines"].append([round(lw[0][0], 3), round(lw[-1][1], 3)])
    sents, cur = [], []
    for w in lw:
        cur.append(w)
        if re.search(r'[.?!]$', w[2]): sents.append(cur); cur = []
    if cur: sents.append(cur)
    assert len(sents) == len(EN[li]), (li, [' '.join(x[2] for x in s) for s in sents])
    for si, (s, en) in enumerate(zip(sents, EN[li])):
        out["sentences"].append({"line": li, "start": round(s[0][0], 3), "end": round(s[-1][1], 3), "de": ' '.join(x[2] for x in s)})
        n = len(en)
        for ci, txt in enumerate(en):
            a = s[int(ci * len(s) / n)][0]
            b = s[int((ci + 1) * len(s) / n) - 1][1] if ci < n - 1 else s[-1][1]
            out["caps"].append({"line": li, "start": round(a, 3), "end": round(b, 3), "text": txt})
    for w in lw: out["words"].append({"line": li, "start": round(w[0], 3), "end": round(w[1], 3), "text": w[2]})
out["duration"] = round(words[-1][1] + 0.1, 3)
json.dump(out, open('src/timing_pz.json', 'w'), ensure_ascii=False, indent=0)
for li, lw in enumerate(lines): print(li, round(lw[0][0], 2), round(lw[-1][1], 2), ' '.join(w[2] for w in lw))
print('dur', out["duration"])
