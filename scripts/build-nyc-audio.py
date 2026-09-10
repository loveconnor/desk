"""Preserve the NYC recording's stereo detail; only edit length, seam and gain.
Usage: python3 scripts/build-nyc-audio.py decoded-source.wav output.wav [seconds=300] [start=5]
Encode: afconvert -f m4af -d aac@44100 -b 96000 output.wav nyc-apartment.m4a
"""
import sys
import numpy as np
from scipy.io import wavfile

rate, raw = wavfile.read(sys.argv[1])
seconds = float(sys.argv[3]) if len(sys.argv) > 3 else 300
start = float(sys.argv[4]) if len(sys.argv) > 4 else 5
length = round((seconds + 2) * rate)
samples = raw[round(start * rate):round(start * rate) + length].astype(np.float64)
if len(samples) != length:
    raise ValueError("Source is too short for the requested excerpt and crossfade")
fade = 2 * rate
weight = np.linspace(0, 1, fade)
if samples.ndim == 2:
    weight = weight[:, None]
seam = samples[-fade:] * np.sqrt(1 - weight) + samples[:fade] * np.sqrt(weight)
loop = np.concatenate([samples[fade:-fade], seam])
# A single gain preserves natural changes in traffic volume; no compression/EQ.
loop *= 0.85 / np.max(np.abs(loop))
wavfile.write(sys.argv[2], rate, np.round(loop * 32767).astype(np.int16))
print(f'{len(loop)/rate:.1f}s, {rate} Hz, peak -1.4 dBFS')
