import { chromium } from '@playwright/test';
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({viewport:{width:1200,height:1100}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/furniture-preview',r=>r.fulfill({contentType:'text/html',body:'<script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js"}}</script><body style="margin:0"></body>'}));
 await page.goto('http://localhost:4187/furniture-preview');
 console.log(await page.evaluate(async()=>{
  const T=await import('/node_modules/three/build/three.module.js');
  const {createPoangChair,createReadingTable}=await import('/src/Application/World/ReadingFurniture.ts');
  const s=new T.Scene();s.background=new T.Color('#d4d1c8');
  const r=new T.WebGLRenderer({antialias:true});r.setSize(1200,1100);r.outputEncoding=T.sRGBEncoding;r.toneMapping=T.ACESFilmicToneMapping;r.shadowMap.enabled=true;r.shadowMap.type=T.PCFSoftShadowMap;document.body.appendChild(r.domElement);
  const chair=createPoangChair();s.add(chair);const table=createReadingTable();table.position.set(1350,0,150);s.add(table);
  s.add(new T.HemisphereLight(0xfff7ec,0x777d7f,.85));const light=new T.DirectionalLight(0xfff1d9,2);light.position.set(-2500,4500,3000);light.castShadow=true;light.shadow.mapSize.set(2048,2048);Object.assign(light.shadow.camera,{left:-3500,right:3500,top:3500,bottom:-3500,near:1,far:10000});light.shadow.normalBias=2;s.add(light);
  const floor=new T.Mesh(new T.PlaneGeometry(20000,20000),new T.MeshStandardMaterial({color:0x9a9588,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-1;floor.receiveShadow=true;s.add(floor);
  const c=new T.PerspectiveCamera(36,1200/1100,1,20000);c.position.set(4300,3100,6000);c.lookAt(450,1000,0);r.render(s,c);
  return {chair:new T.Box3().setFromObject(chair).getSize(new T.Vector3()).toArray(),table:new T.Box3().setFromObject(table).getSize(new T.Vector3()).toArray(),triangles:r.info.render.triangles};
 }));
 await page.screenshot({path:'output/reading-furniture.png'});console.log({errors});
}finally {await browser.close();}
