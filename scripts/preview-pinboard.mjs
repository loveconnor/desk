import { chromium } from '@playwright/test';
const browser=await chromium.launch();
try{
 const page=await browser.newPage({viewport:{width:1400,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/pinboard-preview',r=>r.fulfill({contentType:'text/html',body:'<script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js"}}</script><body style="margin:0"></body>'}));
 await page.goto('http://localhost:4187/pinboard-preview');
 console.log(await page.evaluate(async()=>{
 const T=await import('/node_modules/three/build/three.module.js');
 const {createPinboard}=await import('/src/Application/World/Pinboard.ts');const {roomNotes}=await import('/src/Application/World/roomContent.ts');
 const {board,notes}=createPinboard(roomNotes);const scene=new T.Scene();scene.background=new T.Color('#737b6a');scene.add(board);
 const renderer=new T.WebGLRenderer({antialias:true});renderer.setSize(1400,1000);renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;document.body.appendChild(renderer.domElement);
 scene.add(new T.HemisphereLight(0xfff5e8,0x7b8178,.8));const light=new T.DirectionalLight(0xfff2df,1.5);light.position.set(-1600,2300,3000);light.castShadow=true;light.shadow.mapSize.set(2048,2048);Object.assign(light.shadow.camera,{left:-1700,right:1700,top:1300,bottom:-1300,near:1,far:7000});light.shadow.normalBias=.25;scene.add(light);
 const wall=new T.Mesh(new T.PlaneGeometry(10000,10000),new T.MeshStandardMaterial({color:0x737b6a,roughness:1}));wall.position.z=-38;wall.receiveShadow=true;scene.add(wall);
 const camera=new T.PerspectiveCamera(38,1.4,1,10000);camera.position.set(900,500,3300);camera.lookAt(0,0,0);renderer.render(scene,camera);
 const bounds=new T.Box3().setFromObject(board);return {notes:notes.length,size:bounds.getSize(new T.Vector3()).toArray(),triangles:renderer.info.render.triangles};
 }));await page.screenshot({path:'output/pinboard.png'});console.log({errors});if(errors.length)process.exitCode=1;
}finally{await browser.close();}
