import { assetLoadingManager } from "./assetLoading";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import EventEmitter from "./EventEmitter";
import Application from "../Application";

export default class Resources extends EventEmitter {
  sources: Resource[];
  // Not sure about this one
  items: {
    texture: { [name: string]: LoadedTexture };
    cubeTexture: { [name: string]: LoadedCubeTexture };
    gltfModel: { [name: string]: LoadedModel };
    audio: { [name: string]: LoadedAudio };
  };
  toLoad: number;
  loaded: number;
  loaders: {
    gltfLoader: GLTFLoader;
    textureLoader: THREE.TextureLoader;
    cubeTextureLoader: THREE.CubeTextureLoader;
  };

  constructor(sources: Resource[]) {
    super();

    this.sources = sources;

    this.items = { texture: {}, cubeTexture: {}, gltfModel: {}, audio: {} };
    this.toLoad = this.sources.length;
    this.loaded = 0;

    this.setLoaders();
    // Audio decoding can outlive its network request. Keep initialization open
    // until every resource callback has run and the world has been constructed.
    assetLoadingManager.itemStart("room-initialization");
    this.startLoading();
  }

  setLoaders() {
    this.loaders = {
      gltfLoader: new GLTFLoader(assetLoadingManager),
      textureLoader: new THREE.TextureLoader(assetLoadingManager),
      cubeTextureLoader: new THREE.CubeTextureLoader(assetLoadingManager),
    };
  }

  startLoading() {
    // Load each source
    for (const source of this.sources) {
      const onError = (error: unknown) => {
        console.error(
          `Could not load required resource: ${source.path}`,
          error,
        );
        new Application().loading.fail();
      };
      if (source.type === "gltfModel") {
        this.loaders.gltfLoader.load(
          source.path,
          (file) => {
            this.sourceLoaded(source, file);
          },
          undefined,
          onError,
        );
      } else if (source.type === "texture") {
        this.loaders.textureLoader.load(
          source.path,
          (file) => {
            file.encoding = THREE.sRGBEncoding;
            this.sourceLoaded(source, file);
          },
          undefined,
          onError,
        );
      } else if (source.type === "cubeTexture") {
        this.loaders.cubeTextureLoader.load(
          source.path,
          (file) => {
            this.sourceLoaded(source, file);
          },
          undefined,
          onError,
        );
      } else if (source.type === "audio") {
        void this.loadAudio(source);
      }
    }
  }

  private async loadAudio(source: Resource & { path: string }) {
    // Track decoding as well as the download. Three r137's AudioLoader ignores
    // asynchronous decode rejection, which used to strand room-initialization.
    const task = `audio:${source.name}`;
    assetLoadingManager.itemStart(task);
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let buffer: AudioBuffer;
    try {
      const audio = async () => {
        const response = await fetch(source.path, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.arrayBuffer();
        return THREE.AudioContext.getContext().decodeAudioData(data);
      };
      buffer = await Promise.race([
        audio(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            controller.abort();
            reject(new Error("Audio download or decoding timed out"));
          }, 15000);
        }),
      ]);
    } catch (error) {
      console.warn(`Continuing without sound: ${source.path}`, error);
      // Keep all audio consumers valid, including looping ambience.
      buffer = new AudioBuffer({
        length: 1,
        sampleRate: 44100,
        numberOfChannels: 1,
      });
    } finally {
      clearTimeout(timer!);
    }
    try {
      this.sourceLoaded(source, buffer);
    } finally {
      assetLoadingManager.itemEnd(task);
    }
  }

  sourceLoaded(source: Resource, file: LoadedResource) {
    this.items[source.type][source.name] = file;

    this.loaded++;

    if (this.loaded === this.toLoad) {
      try {
        this.trigger("ready");
      } catch (error) {
        console.error("Could not construct the room", error);
        new Application().loading.fail();
      } finally {
        assetLoadingManager.itemEnd("room-initialization");
      }
    }
  }
}
