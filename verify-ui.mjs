// CI only: all captured content is synthetic.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {writeFile,readFile} from 'node:fs/promises';
import {createDashboard} from './server.mjs';
import {createHostedPreviewServer} from './hosted-preview.mjs';
const password='synthetic-screenshot-password';
const hosted=process.env.VERIFY_HOSTED==='1';
const server=hosted?await createHostedPreviewServer():createDashboard({DASHBOARD_PASSWORD:password,DASHBOARD_DEMO:'1',APP_ORIGIN:'http://localhost:3000'});
server.listen(3000,'127.0.0.1');await once(server,'listening');
const browser=await chromium.launch();
const errors=[];
try{
 const context=await browser.newContext({viewport:{width:1440,height:1024},reducedMotion:'reduce'});
 const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://localhost:3000');
 if(!hosted){
 await page.locator('#login').waitFor({state:'visible'});
 await page.locator('#password').fill(password);
 await page.getByRole('button',{name:'Open my dashboard'}).click();
 }
 await page.locator('#shell').waitFor({state:'visible'});
 await page.getByText('Sample preview · no private data').waitFor();
 await page.evaluate(()=>document.fonts.ready);
 assert.equal(await page.evaluate(()=>document.fonts.check('40px Lobster')),true,'Embedded display font loads under the CSP');
 if(hosted){assert.equal(await page.locator('#hosted-logout').getAttribute('target'),'_top');assert.ok((await page.locator('#hosted-logout').getAttribute('href')).startsWith('/signout-with-chatgpt'));}
 await page.setViewportSize({width:390,height:844});
 for(const [view,title]of [['australia','Your road to Australia.'],['paige','A place for the things you make.'],['life','Keep the important things moving.'],['brain','Connected to your Brain.']]){
  await page.locator('[data-view="'+view+'"]').click();await page.locator('#view-title').filter({hasText:title}).waitFor();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile '+view+' must not overflow');
  await page.locator('.skip').focus();await page.locator('.skip').click();
  assert.equal(await page.evaluate(()=>location.hash),'#'+view,'Skip link preserves the selected view');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'main','Skip link focuses main content');
 }
 await page.locator('[data-view="today"]').click();
 await page.getByRole('button',{name:'Read source: Move overview'}).first().click();
 await page.locator('#source-dialog').waitFor({state:'visible'});
 assert.ok((await page.locator('#source-content').textContent()).includes('choose the next move milestone'));
 await page.keyboard.press('Escape');
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile layout must not overflow horizontally');
 // Expanded coverage, reference separation, searchable note bodies and readable tables.
 await page.locator('[data-view="brain"]').click();
 await page.locator('.source-library').waitFor({state:'visible'});
 assert.equal(await page.locator('.library-row').count(),22);
 await page.getByRole('button',{name:'Australia',exact:true}).click();
 assert.equal(await page.locator('.library-row').count(),7);
 await page.getByRole('searchbox',{name:'Search connected notes'}).fill('monthly contribution');
 assert.equal(await page.locator('.library-row').count(),1);
 await page.getByRole('button',{name:'Read note: Move fund',exact:true}).click();
 await page.locator('#source-content table').waitFor({state:'visible'});
 assert.ok((await page.locator('#source-content').textContent()).includes('Intended contributions stay separate'));
 await page.getByText('View original Markdown',{exact:true}).click();
 assert.ok((await page.locator('#source-raw').textContent()).includes('| Measure |'));
 await page.keyboard.press('Escape');
 await page.locator('[data-view="today"]').click();
 await page.locator('.focus-layout').waitFor({state:'visible'});
 assert.equal(await page.locator('.task-row').filter({hasText:'Reference-only document checklist example'}).count(),0);
 await page.locator('.focus-panel .pin-button').first().click();
 assert.equal(await page.locator('.focus-panel .pin-button[aria-pressed=true]').count(),1);
 // A refreshed note SHA must not erase a user's locally selected focus.
 await page.route('**/api/brain*',async route=>{const response=await route.fetch();const data=await response.json();for(const n of data.notes){n.sha+='-changed';for(const t of n.tasks)t.sha=n.sha;}await route.fulfill({response,json:data});});
 await page.getByRole('button',{name:'Refresh Brain',exact:true}).click();
 await page.waitForFunction(()=>!document.getElementById('refresh').disabled);
 assert.equal(await page.locator('.focus-panel .pin-button[aria-pressed=true]').count(),1);
 await page.locator('.focus-panel .pin-button').first().click();
 await page.unroute('**/api/brain*');
 await page.emulateMedia({reducedMotion:'no-preference'});
 // The authored liquid changes shape, stops on demand, and consumes no frames offscreen.
 await page.evaluate(()=>scrollTo(0,0));
 await page.waitForFunction(()=>document.querySelector('.flow-edge').dataset.flowing==='true');
 const startShape=await page.locator('.flow-ink').getAttribute('d');
 await page.waitForFunction(d=>document.querySelector('.flow-ink').getAttribute('d')!==d,startShape);
 await page.getByRole('button',{name:'Pause liquid animation',exact:true}).click();
 const pausedShape=await page.locator('.flow-ink').getAttribute('d');
 await page.waitForTimeout(150);
 assert.equal(await page.locator('.flow-ink').getAttribute('d'),pausedShape,'Paused liquid holds its frame');
 await page.reload();await page.locator('#shell').waitFor({state:'visible'});
 assert.equal(await page.getByRole('button',{name:'Play liquid animation',exact:true}).getAttribute('aria-pressed'),'true','Pause survives reload');
 await page.getByRole('button',{name:'Play liquid animation',exact:true}).click();
 await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));
 await page.waitForFunction(()=>document.querySelector('.flow-edge').dataset.flowing==='false');
 const offscreenShape=await page.locator('.flow-ink').getAttribute('d');
 await page.waitForTimeout(150);
 assert.equal(await page.locator('.flow-ink').getAttribute('d'),offscreenShape,'Offscreen liquid stops');
 await page.evaluate(()=>scrollTo(0,0));
 await page.waitForFunction(()=>document.querySelector('.flow-edge').dataset.flowing==='true');
 for(const view of ['life','paige','australia','brain','today'])await page.locator('[data-view="'+view+'"]').click();
 for(const width of [320,768,1440]){
  await page.setViewportSize({width,height:900});
  for(const view of ['today','australia','paige','life','brain']){
   await page.locator('[data-view="'+view+'"]').click();
   await page.waitForFunction(v=>document.querySelector('[data-view="'+v+'"]').getAttribute('aria-current')==='page',view);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No overflow: '+width+' '+view);
  }
 }
 await page.locator('[data-view="australia"]').click();
 await page.locator('[data-note="fund"] summary').click();
 await page.locator('[data-note="fund"] table').waitFor({state:'visible'});
 await page.setViewportSize({width:390,height:844});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Expanded source table stays within phone width');
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.locator('[data-view="today"]').click();
 await page.locator('.focus-layout').waitFor({state:'visible'});
 assert.equal(await page.evaluate(()=>document.querySelector('#workspace').getAnimations({subtree:true}).length),0,'Reduced motion does not play spatial view animations');
 assert.equal(await page.locator('.flow-edge').getAttribute('data-flowing'),'false','Reduced motion stops liquid');
 assert.equal(await page.locator('#motion-toggle').isVisible(),false,'System motion preference takes precedence');
 assert.deepEqual(errors,[],'No uncaught browser errors');
 // Capture the shipped animated treatment, including its visible pause control.
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.setViewportSize({width:1440,height:1024});
 await page.evaluate(()=>scrollTo(0,0));
 await page.waitForFunction(()=>document.querySelector('.flow-echo').hasAttribute('d'));
 await page.screenshot({path:'web/SCREENSHOT.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:'web/SCREENSHOT-MOBILE.png',fullPage:true});
 const design=await readFile('web/DESIGN.md','utf8');
 await writeFile('web/DESIGN.md',design.replace(/Capture routes:[\s\S]*$/, 'Capture route: authenticated / in '+(hosted?'hosted':'standalone')+' synthetic mode. Required viewports: 1440×1024 and 390×844. Captured '+new Date().toISOString().slice(0,10)+' from the actual running app in Chromium using synthetic data. Files: SCREENSHOT.png (1440×1024) and SCREENSHOT-MOBILE.png (390×844), full page. Browser smoke checks cover sign-in, five views, source dialog and mobile overflow. Captures still require visual inspection.\n'));
 console.log('Browser checks passed; genuine synthetic-data screenshots captured.');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
