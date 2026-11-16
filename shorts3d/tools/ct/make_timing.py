import json, sys
raw = json.load(open(sys.argv[1])); caps = [l.strip() for l in open('tools/ct/captions.txt') if l.strip()]
out = {'duration': raw['duration'], 'lines': raw['lines'], 'words': raw['words'], 'caps': []}
for i, (s, e) in enumerate(raw['lines']):
    parts = caps[i].split('|'); w = [len(p) + 6 for p in parts]; tot = sum(w); acc = 0
    for p, k in zip(parts, w):
        out['caps'].append({'line': i, 'text': p, 'start': round(s + (e - s) * acc / tot, 3), 'end': round(s + (e - s) * (acc + k) / tot, 3)}); acc += k
json.dump(out, open('src/timing_ct.json', 'w'), ensure_ascii=False, indent=0)
for i, (s, e) in enumerate(raw['lines']): print(i, round(s, 2), round(e, 2))
print('dur', out['duration'])
