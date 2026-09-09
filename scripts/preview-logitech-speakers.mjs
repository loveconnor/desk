import { chromium } from '@playwright/test';
const browser = await chromium.launch({headless:true});
try {
 const page=await browser.newPage({viewport:{width:1300,height:1000}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/speakers-preview',r=>r.fulfill({contentType:'text/html',body:'<script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js"}}</script><body style="margin:0"></body>'}));
 await page.goto(`${process.env.SPEAKERS_PREVIEW_URL||'http://localhost:4187'}/speakers-preview`);
 const metrics=await page.evaluate(async()=>{
  const T=await import('/node_modules/three/build/three.module.js');
  const {GLTFLoader}=await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
  const gltf=await new GLTFLoader().loadAsync('/models/logitech-z207/speakers.glb');
  const s=new T.Scene();s.background=new T.Color('#bcbcb8');
  const r=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});r.setSize(1300,1000);r.outputEncoding=T.sRGBEncoding;r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=.85;
  document.body.appendChild(r.domElement);
  const sizes={};
  for(const [name,x] of [['LeftSpeaker',-.14],['RightSpeaker',.14]]){
   const o=gltf.scene.getObjectByName(name);o.position.x=x;s.add(o);
   sizes[name]=new T.Box3().setFromObject(o).getSize(new T.Vector3()).toArray();
  }
  s.add(new T.HemisphereLight(0xfff8ed,0x737579,1.05));const light=new T.DirectionalLight(0xfff7e8,1.2);light.position.set(-1,2,2);s.add(light);
  const table=new T.Mesh(new T.BoxGeometry(1,.02,.6),new T.MeshStandardMaterial({color:0x252628,roughness:.8}));table.position.y=-.01;s.add(table);
  const c=new T.PerspectiveCamera(37,1.3,.001,10);c.position.set(.32,.3,.69);c.lookAt(0,.12,0);r.render(s,c);
  const {default:Pair}=await import('/src/Application/World/LogitechSpeakers.ts');
  const pair=new Pair(r);await pair.ready;
  const placement={};
  for(const name of ['LeftSpeaker','RightSpeaker']){
    const box=new T.Box3().setFromObject(pair.getObjectByName(name));
    if(Math.abs(box.min.y-352.5)>.01)throw new Error(`${name} does not rest on shelf`);
    if(Math.abs(box.max.y-box.min.y-542.25)>.01)throw new Error(`${name} incorrect scale`);
    if(name==='LeftSpeaker' && box.max.x > -929)throw new Error('Left speaker overlaps monitor');
    if(name==='RightSpeaker' && box.min.x < 929)throw new Error('Right speaker overlaps monitor');
    placement[name]={min:box.min.toArray(),max:box.max.toArray()};
  }
  return {sizes,placement};
 });
 await page.screenshot({path:'output/logitech-speakers.png'});console.log(JSON.stringify({metrics,errors}));
 if(errors.length)process.exitCode=1;
}finally{await browser.close();}
