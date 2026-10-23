// Run with Node 22+ and Google Chrome: node scripts/check-moments.cjs
// Uses real decoded local media, including range requests and cold-load races.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {spawn} = require('node:child_process');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../dist');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const types = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.mp4':'video/mp4'};
const server = http.createServer((req, res) => {
  const file = path.join(root, decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\//, '') || 'index.html');
  if (!file.startsWith(root + '/') || !fs.existsSync(file) || !fs.statSync(file).isFile()) {res.writeHead(404).end();return;}
  const size = fs.statSync(file).size;
  const range = req.headers.range?.match(/bytes=(\d+)-(\d*)/);
  const start = range ? Number(range[1]) : 0;
  const end = range?.[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
  const headers = {'Content-Type':types[path.extname(file)] || 'application/octet-stream', 'Content-Length':end-start+1, 'Accept-Ranges':'bytes'};
  if (range) headers['Content-Range'] = `bytes ${start}-${end}/${size}`;
  // Give consecutive clicks time to race against an actual media load.
  setTimeout(() => {
    if (res.destroyed) return;
    res.writeHead(range ? 206 : 200, headers);
    const stream = fs.createReadStream(file, {start, end});
    res.on('close', () => stream.destroy());
    stream.pipe(res);
  }, path.extname(file) === '.mp4' ? 150 : 0);
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'foveanav-moments-'));
  const chrome = spawn('google-chrome', ['--headless','--no-sandbox','--disable-gpu','--no-first-run','--no-default-browser-check','--disable-background-networking','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'], {stdio:['ignore','ignore','pipe']});
  let ws;
  try {
    const endpoint = await new Promise((resolve, reject) => {
      let output = '';
      chrome.stderr.on('data', data => {output += data; const match = output.match(/DevTools listening on (ws:\/\/[^\s]+)/);if (match) resolve(match[1]);});
      chrome.once('exit', code => reject(new Error(`Chrome exited: ${code}`)));
      setTimeout(() => reject(new Error('Chrome startup timeout')), 10000).unref();
    });
    ws = new WebSocket(endpoint);
    await new Promise(resolve => ws.addEventListener('open', resolve, {once:true}));
    let sequence = 0;
    const pending = new Map(), errors = [];
    ws.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.id) {const entry = pending.get(message.id);pending.delete(message.id);message.error ? entry.reject(new Error(JSON.stringify(message.error))) : entry.resolve(message.result);}
      if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails);
    });
    const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {const id = ++sequence;pending.set(id, {resolve,reject});ws.send(JSON.stringify({id,method,params,...(sessionId ? {sessionId} : {})}));});
    const {targetId} = await send('Target.createTarget', {url:'about:blank'});
    const {sessionId} = await send('Target.attachToTarget', {targetId,flatten:true});
    const cdp = (method, params) => send(method, params, sessionId);
    const evaluate = async expression => {
      const result = await cdp('Runtime.evaluate', {expression,returnByValue:true,awaitPromise:true,userGesture:true});
      if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
      return result.result.value;
    };
    await cdp('Runtime.enable');await cdp('Page.enable');await cdp('Network.enable');
    await cdp('Network.setCacheDisabled', {cacheDisabled:true});
    await cdp('Emulation.setDeviceMetricsOverride', {width:1440,height:1000,deviceScaleFactor:1,mobile:false});
    const until = async (expression, label) => {
      for (let i = 0; i < 100; i++) {if (await evaluate(expression)) return;await wait(100);}
      throw new Error(`Timed out: ${label}; ${JSON.stringify(await evaluate('window.mediaEvents'))}`);
    };
    const fresh = async () => {
      await cdp('Page.navigate', {url:`http://127.0.0.1:${server.address().port}/`});
      await until("document.querySelectorAll('#results-table tr').length === 9", 'page');
      await evaluate(`window.mediaEvents=[];for(const id of ['forest-video','redbag-video']){const v=document.getElementById(id);for(const type of ['loadedmetadata','loadeddata','canplay','seeking','seeked','play','pause'])v.addEventListener(type,()=>mediaEvents.push({id,type,t:v.currentTime,rs:v.readyState}));}`);
    };
    const click = (id, time) => `document.querySelector('[data-seek-player="${id}"][data-time="${time}"]').click()`;
    const verify = async (id, time, label) => {
      await until(`(()=>{const v=document.getElementById('${id}');return v.readyState>=2&&!v.seeking&&v.paused&&Math.abs(v.currentTime-${time})<0.12})()`, label);
      const frame = await evaluate(`(()=>{const v=document.getElementById('${id}'),c=document.createElement('canvas');c.width=64;c.height=36;const x=c.getContext('2d');x.drawImage(v,0,0,64,36);const a=x.getImageData(0,0,64,36).data;let h=2166136261,lit=0;for(let i=0;i<a.length;i+=4){h=Math.imul(h^a[i],16777619);if(a[i]+a[i+1]+a[i+2]>40)lit++;}return {hash:h,lit,t:v.currentTime}})()`);
      assert(frame.lit > 100, `${label}: decoded image must not be blank`);
      await wait(1000);
      assert(await evaluate(`(()=>{const v=document.getElementById('${id}');return v.paused&&!v.seeking&&Math.abs(v.currentTime-${time})<0.12})()`), `${label}: remains paused at requested time`);
      console.log(`PASS ${label}: time=${frame.t.toFixed(3)} frame=${frame.hash}`);
      return frame.hash;
    };
    const hashes = {'forest-video':[], 'redbag-video':[]};
    for (const [id, times] of [['forest-video',[0,4.8,8.5]], ['redbag-video',[4,8,17]]]) {
      for (const time of times) {
        await fresh();
        assert.equal(await evaluate(`document.getElementById('${id}').readyState`), 0, 'cold before click');
        await evaluate(click(id,time));hashes[id].push(await verify(id,time,`${id} cold ${time}`));
      }
      assert.equal(new Set(hashes[id]).size, times.length, `${id}: selected moments show different frames`);
    }
    await evaluate("document.getElementById('redbag-video').play()");
    await wait(250);await evaluate(click('redbag-video',8));await verify('redbag-video',8,'playing → paused moment');
    await evaluate(`${click('redbag-video',4)};${click('redbag-video',17)};${click('redbag-video',8)}`);
    await verify('redbag-video',8,'rapid warm clicks: last wins');
    await fresh();await evaluate(`${click('forest-video',4.8)};${click('forest-video',8.5)}`);
    await verify('forest-video',8.5,'rapid cold clicks: last wins');
    await fresh();await evaluate(`${click('forest-video',8.5)};document.querySelector('[data-src="forest-external"]').click()`);
    await verify('forest-video',0,'source change cancels pending moment');
    for (const time of [0,4.8,8.5]) {await evaluate(click('forest-video',time));await verify('forest-video',time,`external view ${time}`);}
    assert.deepEqual(errors, []);
    console.log('PASS all real-media moment regressions; no JavaScript errors');
  } finally {
    ws?.close();chrome.kill('SIGTERM');server.closeAllConnections();server.close();await wait(300);fs.rmSync(profile,{recursive:true,force:true});
  }
})().catch(error => {console.error(error);process.exitCode=1;server.close();});
