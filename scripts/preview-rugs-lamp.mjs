import { chromium } from '@playwright/test';
const browser=await chromium.launch();
try{
 const page=await browser.newPage({viewport:{width:1200,height:1400}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/rugs-lamp-preview',r=>r.fulfill({contentType:'text/html',body:'<script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js"}}</script><body style="margin:0"></body>'}));
 await page.goto('http://localhost:4187/rugs-lamp-preview');
 console.log(await page.evaluate(async()=>{
 const T=await import('/node_modules/three/build/three.module.js');
 const {createWovenRug,createFloorLamp}=await import('/src/Application/World/TextilesLighting.ts');
 const board=new T.Group();const lamp=createFloorLamp();lamp.group.position.set(1700,0,-800);const rug=createWovenRug(4750,4400,'#9da395');board.add(rug,lamp.group);lamp.setOn(false);if(lamp.light.intensity!==0)throw Error('Lamp did not turn off');lamp.setOn(true);if(lamp.light.intensity!==1.65)throw Error('Lamp did not turn on');const scene=new T.Scene();scene.background=new T.Color('#737b6a');scene.add(board);
 const renderer=new T.WebGLRenderer({antialias:true});renderer.setSize(1200,1400);renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;document.body.appendChild(renderer.domElement);
 scene.add(new T.HemisphereLight(0xfff5e8,0x7b8178,.8));const light=new T.DirectionalLight(0xfff2df,1.5);light.position.set(-1600,4300,3000);light.castShadow=true;light.shadow.mapSize.set(2048,2048);Object.assign(light.shadow.camera,{left:-3000,right:3000,top:4500,bottom:-4500,near:1,far:7000});light.shadow.normalBias=.25;scene.add(light);
 const wall=new T.Mesh(new T.PlaneGeometry(10000,10000),new T.MeshStandardMaterial({color:0x737b6a,roughness:1}));wall.position.z=-2400;wall.receiveShadow=true;scene.add(wall);
 const floor=new T.Mesh(new T.PlaneGeometry(15000,15000),new T.MeshStandardMaterial({color:0x8f8b7f,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-1;floor.receiveShadow=true;scene.add(floor);
 const camera=new T.PerspectiveCamera(38,1200/1400,20,25000);camera.position.set(6100,5800,7500);camera.lookAt(0,1100,0);renderer.render(scene,camera);
 const bounds=new T.Box3().setFromObject(board);return {size:bounds.getSize(new T.Vector3()).toArray(),triangles:renderer.info.render.triangles};
 }));await page.screenshot({path:'output/rugs-lamp.png'});console.log({errors});if(errors.length)process.exitCode=1;
}finally{await browser.close();}
