import { assetLoadingManager } from "./assetLoading";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import EventEmitter from "./EventEmitter";

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
    audioLoader: THREE.AudioLoader;
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
      audioLoader: new THREE.AudioLoader(assetLoadingManager),
    };
  }

  startLoading() {
    // Load each source
    for (const source of this.sources) {
      if (source.type === "gltfModel") {
        this.loaders.gltfLoader.load(source.path, (file) => {
          this.sourceLoaded(source, file);
        });
      } else if (source.type === "texture") {
        this.loaders.textureLoader.load(source.path, (file) => {
          file.encoding = THREE.sRGBEncoding;
          this.sourceLoaded(source, file);
        });
      } else if (source.type === "cubeTexture") {
        this.loaders.cubeTextureLoader.load(source.path, (file) => {
          this.sourceLoaded(source, file);
        });
      } else if (source.type === "audio") {
        this.loaders.audioLoader.load(source.path, (buffer) => {
          this.sourceLoaded(source, buffer);
        });
      }
    }
  }

  sourceLoaded(source: Resource, file: LoadedResource) {
    this.items[source.type][source.name] = file;

    this.loaded++;

    if (this.loaded === this.toLoad) {
      this.trigger("ready");
      assetLoadingManager.itemEnd("room-initialization");
    }
  }
}
