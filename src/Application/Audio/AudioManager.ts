import * as THREE from "three";
import Application from "../Application";
import { AmbienceAudio, ComputerAudio } from "./AudioSources";
import UIEventBus from "../UI/EventBus";

const DEFAULT_REF_DISTANCE = 10000;
export default class Audio {
  private nextAudioId = 0;
  application: Application;
  listener: THREE.AudioListener;
  context: AudioContext;
  loadedAudio: { [key in string]: LoadedAudio };
  audioPool: { [key in string]: THREE.PositionalAudio | THREE.Audio };
  audioSources: {
    computer: ComputerAudio;
    ambience: AmbienceAudio;
  };
  scene: THREE.Scene;

  constructor() {
    this.application = new Application();
    this.listener = new THREE.AudioListener();
    this.application.camera.instance.add(this.listener);
    this.loadedAudio = this.application.resources.items.audio;
    this.scene = this.application.scene;
    this.audioPool = {};

    this.audioSources = {
      computer: new ComputerAudio(this),
      ambience: new AmbienceAudio(this),
    };

    this.context = this.listener.context as AudioContext;
    const resume = () => {
      void this.context.resume().catch(() => {});
    };
    document.addEventListener("pointerdown", resume, true);
    document.addEventListener("keydown", resume, true);

    UIEventBus.on("muteToggle", (mute: boolean) => {
      this.listener.setMasterVolume(mute ? 0 : 1);
    });
  }

  playAudio(
    sourceName: string,
    options: {
      volume?: number;
      randDetuneScale?: number;
      loop?: boolean;
      filter?: {
        type: BiquadFilterType;
        frequency: number;
      };
      position?: THREE.Vector3;
      refDistance?: number;
      pitch?: number;
    } = {},
  ) {
    // Resume context if it's suspended
    if (this.context.state === "suspended")
      void this.context.resume().catch(() => {});

    // Get the audio source
    sourceName = this.getRandomVariant(sourceName);

    // Setup
    const buffer = this.loadedAudio[sourceName];
    const poolKey = sourceName + "_" + this.nextAudioId++;

    let audio: THREE.Audio<any> | THREE.PositionalAudio = new THREE.Audio(
      this.listener,
    );

    if (options.position) {
      audio = new THREE.PositionalAudio(this.listener);

      (audio as THREE.PositionalAudio).setRefDistance(options.refDistance ?? DEFAULT_REF_DISTANCE);
      audio.position.copy(options.position);
      audio.name = poolKey;
      this.scene.add(audio);
      audio.updateMatrixWorld(true);
    }
    audio.setBuffer(buffer);

    if (options.filter) {
      const ac = audio.context;
      const filter = ac.createBiquadFilter();
      filter.type = options.filter.type; // Low pass filter
      filter.frequency.setValueAtTime(options.filter.frequency, ac.currentTime);
      // filter.frequency.linearRampToValueAtTime(2400, ac.currentTime + 2);

      audio.setFilter(filter);
    }

    // Set options
    audio.setLoop(options.loop ? true : false);
    audio.setVolume(options.volume ?? 1);

    audio.play();

    // add a filter to the audio

    // Calculate detune
    const detuneAmount =
      (Math.random() * 200 - 100) *
      (options.randDetuneScale ? options.randDetuneScale : 0);

    // Set detune after .play is called
    audio.setDetune(detuneAmount);

    if (options.pitch) {
      audio.setDetune(options.pitch * 100);
    }

    // Add to pool
    if (audio.source) {
      audio.source.onended = () => {
        delete this.audioPool[poolKey];
        audio.onEnded();
        audio.disconnect();
        audio.gain.disconnect();
        audio.removeFromParent();
      };
      this.audioPool[poolKey] = audio;
    }
    return poolKey;
  }

  setAudioFilterFrequency(audio: string, frequency: number) {
    const a = this.audioPool[audio];

    if (a) {
      const ac = a.context;
      const filter = a.getFilter() as BiquadFilterNode;
      // clamp the frequency between 0 and 22500
      const f = Math.max(0, Math.min(22050, frequency));

      filter.frequency.setValueAtTime(f, ac.currentTime);
    }
  }

  setAudioVolume(audio: string, volume: number) {
    const a = this.audioPool[audio];
    if (a) {
      a.setVolume(volume);
    }
  }

  getRandomVariant(sourceName: string) {
    const variants = [];
    for (const key in this.loadedAudio) {
      if (key.includes(sourceName)) {
        variants.push(key);
      }
    }
    return variants[Math.floor(Math.random() * variants.length)];
  }

  update() {
    for (const key in this.audioSources) {
      const _key = key as keyof typeof this.audioSources;
      this.audioSources[_key].update();
    }
  }
}
