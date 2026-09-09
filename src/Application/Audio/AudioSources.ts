import { keyboardState } from "../../keyboard/KeyboardState";
import AudioManager from "./AudioManager";
import * as THREE from "three";
export { default as AmbienceAudio } from "./ApartmentAmbience";

export class AudioSource {
  manager: AudioManager;

  constructor(manager: AudioManager) {
    this.manager = manager;
  }

  update() {}
}
export class ComputerAudio extends AudioSource {
  constructor(manager: AudioManager) {
    super(manager);

    document.addEventListener("mousedown", (event) => {
      // @ts-ignore
      if (event.inComputer) {
        this.manager.playAudio("mouseDown", {
          volume: 0.8,
          position: new THREE.Vector3(800, -300, 1200),
        });
      }
    });

    document.addEventListener("mouseup", (event) => {
      // @ts-ignore
      if (event.inComputer) {
        this.manager.playAudio("mouseUp", {
          volume: 0.8,
          position: new THREE.Vector3(800, -300, 1200),
        });
      }
    });

    keyboardState.listeners.add(() => {
      this.manager.playAudio("keyboardKeydown", {
        volume: 0.45,
        randDetuneScale: 0.35,
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key.includes("_AUTO_")) {
        this.manager.playAudio("ccType", {
          volume: 0.1,
          randDetuneScale: 0,
          pitch: 20,
        });
        return;
      }
    });
  }
}
