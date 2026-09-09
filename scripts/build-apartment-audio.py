"""Build quiet, seamless ambience loops from decoded CC0 recordings.

Usage: python3 scripts/build-apartment-audio.py city.wav room.wav
Source links and decoding instructions: public/audio/atmosphere/README.md.
Requires numpy and scipy. No synthesis or DSP runs in the browser.
"""
import sys
from pathlib import Path
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfiltfilt, resample_poly
from math import gcd

OUTPUT = Path(__file__).resolve().parents[1] / "public/audio/atmosphere"


def build(source, name, seconds, low, high, rms_db):
    rate, samples = wavfile.read(source)
    samples = samples.astype(np.float64)
    if samples.ndim == 2:
        samples = samples.mean(axis=1)
    # Avoid recording setup noises; leave two seconds for the loop crossfade.
    samples = samples[rate * 5:rate * (5 + seconds + 2)]
    divisor = gcd(rate, 16000)
    samples = resample_poly(samples, 16000 // divisor, rate // divisor)
    samples = sosfiltfilt(butter(3, [low, high], btype="bandpass", fs=16000, output="sos"), samples)
    fade = 2 * 16000
    weight = np.linspace(0, 1, fade)
    # Head follows tail across the seam, preserving noise power in the overlap.
    seam = samples[-fade:] * np.sqrt(1 - weight) + samples[:fade] * np.sqrt(weight)
    loop = np.concatenate([samples[fade:-fade], seam])
    loop *= 10 ** (rms_db / 20) / np.sqrt(np.mean(loop ** 2))
    if np.max(np.abs(loop)) > 0.85:
        loop *= 0.85 / np.max(np.abs(loop))
    wavfile.write(OUTPUT / name, 16000, np.round(loop * 32767).astype(np.int16))
    print(f"{name}: {len(loop)/16000:.1f}s; peak {20*np.log10(max(abs(loop))):.1f} dBFS; RMS {20*np.log10(np.sqrt(np.mean(loop**2))):.1f} dBFS")


if __name__ == "__main__":
    build(sys.argv[1], "apartment-city.wav", 20, 75, 2200, -19)
    build(sys.argv[2], "apartment-room.wav", 14, 55, 850, -24)
