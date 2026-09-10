import {chromium,expect} from '@playwright/test';
const browser=await chromium.launch({headless:true,args:process.platform==='darwin'?['--use-angle=metal']:[]});
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:4187/');await expect(page.getByRole('button',{name:'START',exact:true})).toBeEnabled({timeout:60000});await page.getByRole('button',{name:'START',exact:true}).click();await expect(page.locator('.door-entry')).toHaveClass(/is-finished/);
 for(const title of ['Tableau','Proun 5A']) {
  await page.evaluate(async title=>{
   const url=performance.getEntriesByType('resource').find(e=>/\/Application\/Application\.ts(?:\?|$)/.test(e.name)).name;
   const {default:App}=await import(url);const app=new App();
   const entry=[...app.world.room.interactions.targets.values()].find(t=>t.label===title);if(!entry)throw Error('Missing artwork');entry.action();
  },title);
  await expect(page.locator('.object-in-hand')).toHaveAttribute('aria-label',`Inspecting ${title}`);
  await page.locator('.artwork-context summary').click();await expect(page.locator('.artwork-context p')).toBeVisible();
  await page.screenshot({path:`output/art-${title==='Tableau'?'mondrian':'lissitzky'}-inspection.png`});
  await page.getByRole('button',{name:'Put back ↙'}).click();await expect(page.locator('.object-in-hand')).toHaveCount(0);
 }
 console.log({errors,artworksInspectedAndReturned:2});if(errors.length)throw Error(errors.join('\n'));
}finally{await browser.close();}
