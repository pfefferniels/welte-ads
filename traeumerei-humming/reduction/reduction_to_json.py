"""reduction.mei -> the event list the live page sings from (into data/static.json).

Each event carries score positions in ticks (720 per quarter, the performance's own date grid):
  {"k": "n", "id": <transcription note>, "p": <sung MIDI pitch>, "s": start, "e": end, "pedal": bool}
  {"k": "r", "s": start, "e": end, "b": breath?}
  {"k": "a", "s": start, "e": end, "t": "teeth" | "lips"}
Tied notes are one event. The page takes each note's onset and dynamics from the piano note it
points to, and its end from the piano's release where the sung note is the whole written note.

usage: reduction_to_json.py <reduction.mei> <static.json to update>
"""
import json, sys
from lxml import etree

MEI = 'http://www.music-encoding.org/ns/mei'; ns = {'m': MEI}
XID = '{http://www.w3.org/XML/1998/namespace}id'
Q, BAR = 720, 2880
PC = {'c': 0, 'd': 2, 'e': 4, 'f': 5, 'g': 7, 'a': 9, 'b': 11}
ACC = {'s': 1, 'f': -1, 'ss': 2, 'ff': -2, 'n': 0}
DUR = {'1': 2880, '2': 1440, '4': 720, '8': 360, '16': 180, '32': 90}


def ticks(el):
    t = DUR[el.get('dur')]
    dots = int(el.get('dots', '0'))
    return t + sum(t >> (i + 1) for i in range(dots))


def midi(n, keysig_flats=('b',)):
    acc = n.get('accid') or n.get('accid.ges')
    a = ACC.get(acc, -1 if (acc is None and n.get('pname') in keysig_flats) else 0)
    return 12 * (int(n.get('oct')) + 1) + PC[n.get('pname')] + a


def convert(path):
    t = etree.parse(path)
    events, bars, pos = [], [], 0
    for m in t.iterfind('.//m:measure', ns):
        label = m.get('label')
        bars.append([label, pos])
        for el in m.iterfind('m:staff/m:layer/*', ns):
            tag = etree.QName(el).localname
            if tag not in ('note', 'rest'):
                continue
            d = ticks(el)
            tie = el.get('tie')
            if tag == 'rest':
                ev = dict(k='r', s=pos, e=pos + d, b=el.get('type') == 'breath')
                if events and events[-1]['k'] == 'r' and not ev['b']:
                    events[-1]['e'] = pos + d
                else:
                    events.append(ev)
            elif (el.get('type') or '').startswith('air'):
                if tie in ('m', 't') and events and events[-1]['k'] == 'a':
                    events[-1]['e'] = pos + d
                else:
                    events.append(dict(k='a', s=pos, e=pos + d, t=el.get('type').split('-')[1]))
            else:
                if tie in ('m', 't'):
                    events[-1]['e'] = pos + d
                else:
                    events.append(dict(k='n', id=el.get('corresp').split('#')[1], p=midi(el), s=pos, e=pos + d,
                                       pedal=el.get('type') == 'pedal'))
            pos += d
        if label == '0':
            pos = Q
    return events, bars


if __name__ == '__main__':
    events, bars = convert(sys.argv[1])
    st = json.load(open(sys.argv[2]))
    st['reduction'] = events
    st['bars'] = [b for b in bars if b[0] != '0']
    st.pop('melody', None)
    n = sum(e['k'] == 'n' for e in events)
    if len(st.get('calibration', [])) != n:
        st['calibration'] = [0.0] * n
    json.dump(st, open(sys.argv[2], 'w'), separators=(',', ':'))
    print(n, 'sung notes,', sum(e['k'] == 'r' and e['b'] for e in events), 'breaths,', sum(e['k'] == 'a' for e in events),
          'air; ends at', pos if False else events[-1]['e'], 'ticks')
