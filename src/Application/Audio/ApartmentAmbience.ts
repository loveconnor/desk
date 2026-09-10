import * as THREE from "three";
import type AudioManager from "./AudioManager";

const WINDOW = new THREE.Vector3(-2600, 1200, -1900);

/** A closed window transmits low traffic rumble; blinds absorb only a little. */
export function apartmentMix(
  position: THREE.Vector3,
  quaternion: THREE.Quaternion,
  daylight: number,
  coverage: number,
) {
  const direction = WINDOW.clone().sub(position);
  const proximity = 1 / (1 + direction.length() / 3500);
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(quaternion);
  const day = THREE.MathUtils.clamp(daylight, 0, 1);
  const blinds = THREE.MathUtils.clamp(coverage, 0, 1);
  return {
    cityVolume: (0.1 + proximity * 0.12) * (0.5 + day * 0.5) * (1 - blinds * 0.12),
    cityFrequency: 7000 + proximity * 3000 - blinds * 400,
    cityPan: THREE.MathUtils.clamp(direction.normalize().dot(right) * 0.65, -0.65, 0.65),
    roomVolume: 0.035,
  };
}

export default class ApartmentAmbience {
  private city: THREE.Audio;
  private room: THREE.Audio;
  private lowpass: BiquadFilterNode;
  private pan: StereoPannerNode;
  private entered = false;
  private muted = false;
  private lastUpdate = -Infinity;

  constructor(private manager: AudioManager) {
    const context = manager.listener.context;
    this.lowpass = context.createBiquadFilter();
    this.lowpass.type = "lowpass";
    this.lowpass.Q.value = 0.5;
    this.pan = context.createStereoPanner();
    this.city = new THREE.Audio(manager.listener)
      .setBuffer(manager.loadedAudio.apartmentCity)
      .setLoop(true)
      .setVolume(0);
    this.city.setFilters([this.lowpass, this.pan]);
    this.room = new THREE.Audio(manager.listener)
      .setBuffer(manager.loadedAudio.apartmentRoom)
      .setLoop(true)
      .setVolume(0);
    document.addEventListener("doorOpening", this.enter);
    document.addEventListener("doorClosed", this.leave);
    document.addEventListener("muteToggle", this.mute);
    document.addEventListener("visibilitychange", this.syncPlayback);
  }

  private enter = () => {
    this.entered = true;
    this.syncPlayback();
  };

  private leave = () => {
    this.entered = false;
    this.syncPlayback();
  };

  private mute = (event: Event) => {
    this.muted = Boolean((event as CustomEvent).detail);
    this.syncPlayback();
  };

  private syncPlayback = () => {
    const playing = this.entered && !this.muted && !document.hidden;
    for (const audio of [this.city, this.room]) {
      if (playing && !audio.isPlaying) {
        audio.gain.gain.cancelScheduledValues(audio.context.currentTime);
        audio.gain.gain.setValueAtTime(0, audio.context.currentTime);
        audio.play();
      } else if (!playing && audio.isPlaying) {
        audio.pause();
        audio.disconnect();
      }
    }
    this.lastUpdate = -Infinity;
    this.update();
  };

  update() {
    if (!this.city.isPlaying) return;
    const now = performance.now();
    if (now - this.lastUpdate < 250) return;
    this.lastUpdate = now;
    const { camera, world } = this.manager.application;
    const window = world.room.roomWindow;
    const mix = apartmentMix(camera.instance.position, camera.instance.quaternion, window.daylight, window.coverage);
    const time = this.city.context.currentTime;
    this.city.gain.gain.setTargetAtTime(mix.cityVolume, time, 0.4);
    this.room.gain.gain.setTargetAtTime(mix.roomVolume, time, 0.4);
    this.lowpass.frequency.setTargetAtTime(mix.cityFrequency, time, 0.4);
    this.pan.pan.setTargetAtTime(mix.cityPan, time, 0.4);
  }

  destroy() {
    document.removeEventListener("doorOpening", this.enter);
    document.removeEventListener("doorClosed", this.leave);
    document.removeEventListener("muteToggle", this.mute);
    document.removeEventListener("visibilitychange", this.syncPlayback);
    for (const audio of [this.city, this.room]) {
      if (audio.isPlaying) {
        audio.stop();
        audio.disconnect();
      }
      audio.gain.disconnect();
    }
    this.lowpass.disconnect();
    this.pan.disconnect();
  }
}
