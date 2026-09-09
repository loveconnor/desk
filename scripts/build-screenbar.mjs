import { writeFile } from 'node:fs/promises';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { createScreenBarModel } from '../src/Application/World/screenBarModel.mjs';
globalThis.window = { FileReader: class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();}); }
}};
const model=createScreenBarModel();
new GLTFExporter().parse(model,async buffer=>{
  await writeFile(new URL('../public/models/screenbar/original-screenbar.glb',import.meta.url),Buffer.from(buffer));
  console.log('Wrote original-screenbar.glb');
},error=>{throw error;},{binary:true});
