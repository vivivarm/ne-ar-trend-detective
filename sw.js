/* NE-AR offline support: the site and its NASA data keep working without internet.
   Pages: network first (always the newest version when online), cache as fallback.
   Files and fonts: cache first. Live NASA services and the contact form are never cached. */
const CACHE='ne-ar-v10';
const CORE=['./','index.html','ar/himalaya.glb','ar/thar.glb','ar/sundarbans.glb','ar/himalaya.usdz','ar/thar.usdz','ar/sundarbans.usdz','assets/model-viewer.min.js','assets/i18n-es.js','data/cmip6-projections.json','manifest.webmanifest','assets/icon-192.png','assets/apple-touch-icon.png'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{
  const r=e.request, u=new URL(r.url);
  if(r.method!=='GET') return;
  if(/power\.larc\.nasa\.gov|nccs\.nasa\.gov|formsubmit\.co|eonet\.gsfc\.nasa\.gov|chatbase|dropbox|netlify/.test(u.hostname)) return;
  const sameOrigin=u.origin===location.origin, fonts=/fonts\.(googleapis|gstatic)\.com/.test(u.hostname);
  if(!sameOrigin&&!fonts) return;
  if(r.mode==='navigate'||u.pathname.endsWith('.html')||u.pathname.endsWith('/')){
    e.respondWith(fetch(r).then(res=>{ const cp=res.clone(); caches.open(CACHE).then(c=>c.put(r,cp)); return res; }).catch(()=>caches.match(r).then(m=>m||caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{ if(res.ok||res.type==='opaque'){ const cp=res.clone(); caches.open(CACHE).then(c=>c.put(r,cp)); } return res; })));
});
