import { chromium } from '@playwright/test';
const browser=await chromium.launch();
try{
 const page=await browser.newPage({viewport:{width:1200,height:1400}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/shelf-cabinet-preview',r=>r.fulfill({contentType:'text/html',body:'<script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js"}}</script><body style="margin:0"></body>'}));
 await page.goto('http://localhost:4187/shelf-cabinet-preview');
 console.log(await page.evaluate(async()=>{
 const T=await import('/node_modules/three/build/three.module.js');
 const {createShelfCabinet}=await import('/src/Application/World/ShelfCabinet.ts');
 const {cabinet,shelf}=createShelfCabinet();const board=new T.Group();cabinet.position.set(0,0,0);shelf.position.set(-130,3145,-410);board.add(cabinet,shelf);const scene=new T.Scene();scene.background=new T.Color('#737b6a');scene.add(board);
 const renderer=new T.WebGLRenderer({antialias:true});renderer.setSize(1200,1400);renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;document.body.appendChild(renderer.domElement);
 scene.add(new T.HemisphereLight(0xfff5e8,0x7b8178,.8));const light=new T.DirectionalLight(0xfff2df,1.5);light.position.set(-1600,4300,3000);light.castShadow=true;light.shadow.mapSize.set(2048,2048);Object.assign(light.shadow.camera,{left:-3000,right:3000,top:4500,bottom:-4500,near:1,far:7000});light.shadow.normalBias=.25;scene.add(light);
 const wall=new T.Mesh(new T.PlaneGeometry(10000,10000),new T.MeshStandardMaterial({color:0x737b6a,roughness:1}));wall.position.z=-630;wall.receiveShadow=true;scene.add(wall);
 const floor=new T.Mesh(new T.PlaneGeometry(15000,15000),new T.MeshStandardMaterial({color:0x8f8b7f,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-1;floor.receiveShadow=true;scene.add(floor);
 const camera=new T.PerspectiveCamera(38,1200/1400,1,10000);camera.position.set(2800,2600,6300);camera.lookAt(0,1850,0);renderer.render(scene,camera);
 const bounds=new T.Box3().setFromObject(board);return {size:bounds.getSize(new T.Vector3()).toArray(),triangles:renderer.info.render.triangles};
 }));await page.screenshot({path:'output/shelf-cabinet.png'});console.log({errors});if(errors.length)process.exitCode=1;
}finally{await browser.close();}
