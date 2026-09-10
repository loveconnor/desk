# Apartment ambience

The city layer uses a five-minute section of an actual Bushwick, Brooklyn field
recording: distant traffic and the elevated M train, recorded from a rooftop.
It is played quietly through the window position to approximate
hearing the city indoors; the source itself is not an indoor recording.
A faint ventilation loop supplies the indoor room tone.

## Sources

- `nyc-apartment.m4a`: “New York City night evening rooftop ambience traffic,
  Bushwick, Brooklyn, above-ground subway M train.wav” by SpliceSound.
  Original duration: 22:39.529. CC0, verified September 10, 2026.
  https://freesound.org/people/SpliceSound/sounds/369891/
  Preview: https://cdn.freesound.org/previews/369/369891_1480854-hq.mp3
- `apartment-room.wav`: “Empty Office Room Tone” by richwise, CC0.
  https://freesound.org/people/richwise/sounds/456207/
- License: https://creativecommons.org/publicdomain/zero/1.0/

City edits: skip the initial five seconds, preserve stereo and the source's
frequency detail, apply a single peak-safe gain, and crossfade the two-second
loop seam. No baked-in filtering or compression. Encode as 96 kbps / 44.1 kHz
AAC. The loop lasts five minutes.

Rebuild with `python3 scripts/build-nyc-audio.py decoded-source.wav output.wav`,
then `afconvert -f m4af -d aac@44100 -b 96000 output.wav nyc-apartment.m4a`.
Runtime filtering only rolls off the upper treble (approximately 7–10 kHz),
and the ventilation layer is kept substantially quieter than the city.

Room edits: mono 16 kHz PCM, 55–850 Hz filtering, level matching and a two-second
crossfade. The filter removes the high equipment beep in the source recording.

Two native Web Audio loops start as soon as the door is activated, before the
camera enters the room. Mixing updates at most four times
per second with smooth ramps. Loops pause when muted, hidden, or after returning
to the closed door. Re-entering does not stack loops.

Legacy apartment-city.wav (not loaded) is “Seamless City Loop” by qubodup,
https://freesound.org/people/qubodup/sounds/223093/, CC0. office.mp3 is also unused.
