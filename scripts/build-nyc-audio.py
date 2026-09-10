"""Preserve the NYC recording's stereo detail; only edit length, seam and gain.
Usage: python3 scripts/build-nyc-audio.py decoded-source.wav output.wav
Encode: afconvert -f m4af -d aac@44100 -b 96000 output.wav nyc-apartment.m4a
"""
import sys
import numpy as np
from scipy.io import wavfile

rate, raw = wavfile.read(sys.argv[1])
samples = raw[5 * rate:307 * rate].astype(np.float64)
if len(samples) != 302 * rate:
    raise ValueError('At least 307 seconds of source audio required')
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
