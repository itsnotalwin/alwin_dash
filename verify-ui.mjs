// CI only: all captured content is synthetic.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {writeFile,readFile} from 'node:fs/promises';
import {createDashboard} from './server.mjs';
const password='synthetic-screenshot-password';
const server=createDashboard({DASHBOARD_PASSWORD:password,DASHBOARD_DEMO:'1',APP_ORIGIN:'http://localhost:3000'});
server.listen(3000,'127.0.0.1');await once(server,'listening');
const browser=await chromium.launch();
const errors=[];
try{
 const context=await browser.newContext({viewport:{width:1440,height:1024},reducedMotion:'reduce'});
 const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://localhost:3000');
 await page.locator('#login').waitFor({state:'visible'});
 await page.locator('#password').fill(password);
 await page.getByRole('button',{name:'Open my dashboard'}).click();
 await page.locator('#shell').waitFor({state:'visible'});
 await page.getByText('Sample preview · no private data').waitFor();
 await page.screenshot({path:'web/SCREENSHOT.png',fullPage:true});
 for(const [view,title]of [['australia','Your road to Australia.'],['paige','A place for the things you make.'],['life','Keep the important things moving.'],['brain','Connected to your Brain.']]){
  await page.locator('[data-view="'+view+'"]').click();await page.locator('#view-title').filter({hasText:title}).waitFor();
 }
 await page.locator('[data-view="today"]').click();
 await page.getByRole('button',{name:'Read source: Move overview'}).first().click();
 await page.locator('#source-dialog').waitFor({state:'visible'});
 assert.ok((await page.locator('#source-content').textContent()).includes('Choose the next move milestone'));
 await page.keyboard.press('Escape');
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:'web/SCREENSHOT-MOBILE.png',fullPage:true});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile layout must not overflow horizontally');
 assert.deepEqual(errors,[],'No uncaught browser errors');
 const design=await readFile('web/DESIGN.md','utf8');
 await writeFile('web/DESIGN.md',design.replace(/2026-10-20: INCOMPLETE[\s\S]*$/,'Captured '+new Date().toISOString().slice(0,10)+' from the actual running app in Chromium using synthetic data. Files: SCREENSHOT.png (1440×1024) and SCREENSHOT-MOBILE.png (390×844), full page. Browser smoke checks cover sign-in, five views, source dialog and mobile overflow. Captures still require visual inspection.\n'));
 console.log('Browser checks passed; genuine synthetic-data screenshots captured.');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
