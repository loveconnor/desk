import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// Original AR17 proportions: 450 mm bar, 90 mm clamp depth, 92 mm overall
// height. Scene scale matches the existing monitor (1370 units / 450 mm).
export function createScreenBarModel() {
  const root = new THREE.Group();
  root.name = 'BenQ ScreenBar AR17 — original';
  const metal = new THREE.MeshStandardMaterial({color:0x17191b, metalness:0.65, roughness:0.36});
  const plastic = new THREE.MeshStandardMaterial({color:0x111214, roughness:0.67});
  const rubber = new THREE.MeshStandardMaterial({color:0x08090a, roughness:0.95});
  const lens = new THREE.MeshStandardMaterial({color:0xe4e2d6, roughness:0.4, emissive:0xffdfaa, emissiveIntensity:0.4});
  const mesh = (name, geometry, material, x=0,y=0,z=0) => {
    const m = new THREE.Mesh(geometry,material);m.name=name;m.position.set(x,y,z);root.add(m);return m;
  };
  const box = (name,w,h,d,x,y,z,material=plastic,r=5) =>
    mesh(name,new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/3,h/3,d/3)),material,x,y,z);
  // Cylindrical aluminum tube with inset end caps, rather than a square beam.
  const tube = mesh('Aluminum barrel',new THREE.CylinderGeometry(34,34,1350,48),metal);
  tube.rotation.z=Math.PI/2;
  for(const x of [-680,680]) {
    const cap=mesh('End cap',new THREE.CylinderGeometry(33.6,33.6,10,48),plastic,x);
    cap.rotation.z=Math.PI/2;
    const seam=mesh('End seam',new THREE.TorusGeometry(33.8,0.9,6,48),rubber,x-Math.sign(x)*6);
    seam.rotation.y=Math.PI/2;
  }
  // The diffuser faces down and slightly forward; the front lip conceals LEDs
  // from a seated viewing position.
  const diffuser=box('Diffuser',1260,3,24,0,-30,14,lens,1);
  diffuser.rotation.x=-0.35;
  box('Optical cutoff lip',1290,10,5,0,-28,29,metal,2);
  box('Touch control deck',360,8,46,0,31,0,plastic,4);
  for(const [i,name] of ['brightness','temperature','auto','power'].entries())
    box('Control_'+name,58,3,34,-135+i*90,36,0,plastic,4);
  mesh('Ambient sensor',new THREE.SphereGeometry(6,16,8),rubber,25,36,0).scale.y=0.35;
  const indicator=mesh('Auto indicator',new THREE.SphereGeometry(3.5,12,8),new THREE.MeshStandardMaterial({color:0x30392d,emissive:0x75b752}),45,34,24);
  indicator.scale.z=0.4;
  // Weighted, rubber-lined clip hooks over the bezel and grips the rear.
  box('Pivot housing',125,86,95,0,-3,-55,plastic,15);
  const pivot=mesh('Tilt axle',new THREE.CylinderGeometry(29,29,137,32),metal,0,-8,-60);
  pivot.rotation.z=Math.PI/2;
  box('Upper clamp arm',110,27,195,0,-16,-137,plastic,10);
  box('Front bezel hook',105,95,26,0,-62,-39,plastic,6);
  box('Front silicone pad',96,65,6,0,-72,-55,rubber,2);
  box('Rear counterweight',145,170,85,0,-124,-208,plastic,25);
  box('Rear silicone pad',115,95,8,0,-120,-160,rubber,3);
  box('Micro USB port',31,12,5,0,8,-104,rubber,2);
  const cord=new THREE.CatmullRomCurve3([
    new THREE.Vector3(0,8,-106),new THREE.Vector3(0,0,-170),
    new THREE.Vector3(40,-100,-245),new THREE.Vector3(60,-270,-235),
    new THREE.Vector3(60,-390,-225),
  ]);
  mesh('USB cable',new THREE.TubeGeometry(cord,30,4,8,false),rubber);
  root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  return root;
}
