# Apartment ambience

The active city layer is “NYC Quiet Commercial Loft, Room tone, Light Street
Noise” by flood-mix. Recorded inside a vacant NYC loft with windows cracked
open and some winter wind. A quiet ventilation layer supplies additional room tone.

## Sources

- `nyc-loft.m4a`: https://freesound.org/people/flood-mix/sounds/413340/
  Original duration: 2:00.250. CC0, verified September 10, 2026.
  Preview: https://cdn.freesound.org/previews/413/413340_7723777-hq.mp3
- `apartment-room.wav`: “Empty Office Room Tone” by richwise, CC0.
  https://freesound.org/people/richwise/sounds/456207/
- License: https://creativecommons.org/publicdomain/zero/1.0/

Loft edits: preserve stereo and natural frequency detail, apply one peak-safe
level adjustment and a two-second crossfade. No baked-in filtering or
compression. Result: 118-second loop, 96 kbps / 44.1 kHz AAC.

Rebuild after decoding the preview with afconvert:
`python3 scripts/build-nyc-audio.py decoded.wav loop.wav 118 0`
then `afconvert -f m4af -d aac@44100 -b 96000 loop.wav nyc-loft.m4a`.
Runtime filtering gently rolls off the upper treble (approximately 7–10 kHz).

The previous `nyc-apartment.m4a` is unused. Its CC0 source is SpliceSound's
Brooklyn rooftop recording: https://freesound.org/people/SpliceSound/sounds/369891/.

Room edits: mono 16 kHz PCM, 55–850 Hz filtering, level matching and a two-second
crossfade. The filter removes the high equipment beep in the source recording.

Two native Web Audio loops start as soon as the door is activated, before the
camera enters the room. Mixing updates at most four times
per second with smooth ramps. Loops pause when muted, hidden, or after returning
to the closed door. Re-entering does not stack loops.

Legacy apartment-city.wav (not loaded) is “Seamless City Loop” by qubodup,
https://freesound.org/people/qubodup/sounds/223093/, CC0. office.mp3 is also unused.
