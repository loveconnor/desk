# Apartment ambience

Two quiet, locally served loops: traffic heard through a closed apartment window
and faint indoor ventilation. No added speech, music, birds, rain, or sirens.
The city recording is a general urban ambience, not a claimed NYC field recording.

Sources (both listed as CC0 1.0 on Freesound, checked 2026-09-09):

- `apartment-city.wav`: “Seamless City Loop” by qubodup, based on a CC0 window
  recording by jmbphilmes. https://freesound.org/people/qubodup/sounds/223093/
  Preview: https://cdn.freesound.org/previews/223/223093_71257-hq.mp3
- `apartment-room.wav`: “Empty Office Room Tone” by richwise (recorded before
  anyone arrived; ventilation only). https://freesound.org/people/richwise/sounds/456207/
  Preview: https://cdn.freesound.org/previews/456/456207_1481531-hq.mp3
- License: https://creativecommons.org/publicdomain/zero/1.0/

Edits: mono downmix for spatial placement, 16 kHz PCM, high/low-pass filtering,
level matching, and two-second crossfaded loop seams. The indoor filter also
removes the high-frequency equipment beep mentioned in the source description.

To rebuild, download the previews above, decode each with macOS `afconvert
-f WAVE -d LEI16 input.mp3 output.wav`, then run:

```sh
python3 scripts/build-apartment-audio.py city.wav room.wav
```

Only two native Web Audio loops run in the browser. Mixing updates at most four
times per second, with smooth audio parameter ramps. Loops pause when muted,
when the page is hidden, or after returning to the closed door. Re-entering does
not stack additional loops. The original `office.mp3` is retained but not loaded.
