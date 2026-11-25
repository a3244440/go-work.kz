// Рендер карточек для 2ГИС: node promo/2gis/render.cjs <папка> (нужен сервер на :8765 из корня сайта)
const {chromium}=require('playwright');(async()=>{const out=process.argv[2];const b=await chromium.launch();
const p=await b.newPage({viewport:{width:1700,height:1300}});await p.goto('http://localhost:8765/promo/2gis/cards.html');
await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(800);
for(const id of await p.$$eval('section',a=>a.map(s=>s.id))){await (await p.$('#'+id)).screenshot({path:`${out}/${id}.${id==='logo'?'png':'jpg'}`,...(id==='logo'?{}:{quality:92})});}
await b.close();console.log('ok');})();
