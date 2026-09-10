import { chromium } from '@playwright/test';
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try {
 const page=await browser.newPage({viewport:{width:1512,height:945},reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:4187/');
 await page.getByRole('button',{name:'START',exact:true}).click({timeout:60000});
 await page.waitForFunction(()=>document.querySelector('.door-entry')?.classList.contains('is-finished'));
 const result=await page.evaluate(async()=>{
  const url=performance.getEntriesByType('resource').find(e=>/\/Application\/Application\.ts(?:\?|$)/.test(e.name)).name;
  const {default:App}=await import(url);const app=new App();
  app.world.room.roomWindow.dateOverride=new Date('2026-09-10T19:23:00Z');
  const fixture=app.scene.getObjectByName('Office ceiling light');
  const light=app.scene.getObjectByName('Office ceiling light illumination');
  const point=light.getWorldPosition(light.position.clone()).project(app.camera.instance);
  const target=[...app.world.room.interactions.targets.values()].find(e=>e.label==='Toggle office ceiling light');
  target.action();const off=light.intensity;target.action();
  return {position:fixture.position.toArray(),projected:point.toArray(),off,on:light.intensity};
 });
 if(Math.abs(result.projected[0])>1||Math.abs(result.projected[1])>1)throw Error('Fixture is out of view: '+JSON.stringify(result));
 if(result.off!==0||result.on!==1.15)throw Error('Toggle failed');
 await page.waitForTimeout(1400);
 await page.screenshot({path:'output/back-left-ceiling-fixture.png'});
 console.log({result,errors});if(errors.length)throw Error(errors.join('\n'));
} finally {await browser.close()}
