(function(){
  const VERSION='0.2.4';
  const BUILD='2026.10.11.3';
  const isStandalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  const statusText=document.createElement('p');statusText.className='pwa-install-status';statusText.id='pwaInstallStatus';statusText.textContent=`网页安装版 · v${VERSION}`;
  const settings=document.querySelector('#mySettings .myx-settings-body');
  if(settings){
    const card=document.createElement('section');card.className='pwa-install-card';card.innerHTML='<h3>手机版安装与更新</h3><div class="pwa-install-actions"><button class="primary" type="button" id="pwaInstallHelp">查看安装方法</button><button type="button" id="pwaCheckUpdate">检查更新</button></div>';
    const replay=document.createElement('button');replay.type='button';replay.textContent='预览开屏动画';replay.className='pwa-splash-preview';replay.addEventListener('click',()=>window.replayAppSplash?.());card.append(statusText,replay);settings.append(card);
  }
  const help=document.createElement('div');help.className='pwa-help';help.hidden=true;help.innerHTML='<section class="pwa-help-card" role="dialog" aria-modal="true" aria-labelledby="pwaHelpTitle"><h2 id="pwaHelpTitle">添加到手机主屏幕</h2><p><b>iPhone：</b>用 Safari 打开，点“分享”→“添加到主屏幕”。</p><p><b>安卓：</b>用 Chrome 打开，点右上角菜单→“安装应用”或“添加到主屏幕”。</p><p>以后无需重新安装。打开、回到前台或在页面顶部下拉，都会检查线上新版本。</p><button type="button" id="pwaHelpClose">知道了</button></section>';
  document.body.append(help);
  const banner=document.createElement('div');banner.className='pwa-update-banner';banner.hidden=true;banner.setAttribute('role','status');banner.innerHTML='<span>检测到新版本，更新会保留本机浏览器记录。</span><button type="button" id="pwaApplyUpdate">立即更新</button><button class="pwa-dismiss" type="button" id="pwaDismissUpdate" aria-label="稍后">×</button>';document.body.append(banner);
  let registration=null,latestBuild=BUILD,latestVersion=VERSION,controllerReload=false;
  const dismissedKey='aesthetic_pwa_dismissed_build';
  function setStatus(text){if(statusText)statusText.textContent=text}
  function showUpdate(build,version){
    if(!build||build===BUILD||localStorage.getItem(dismissedKey)===build)return;
    latestBuild=build;latestVersion=version||build;
    banner.hidden=false;
    setStatus(`发现新版本 v${latestVersion} · 更新会保留本机记录`);
  }
  async function checkVersion(){
    try{const response=await fetch(`./app-version.json?check=${Date.now()}`,{cache:'no-store'});if(!response.ok)return{ok:false,updated:false};const data=await response.json();if(data.version&&data.build&&data.build!==BUILD){showUpdate(data.build,data.version);return{ok:true,updated:true,version:data.version}}if(data.build===BUILD){banner.hidden=true;setStatus(`网页安装版 · v${VERSION} · 已是最新`)}return{ok:true,updated:false,version:data.version||VERSION}}catch{return{ok:false,updated:false}}
  }
  async function checkUpdate(){
    setStatus('正在检查更新…');
    if(registration){try{await registration.update()}catch{}}
    const result=await checkVersion();
    if(banner.hidden)setStatus(`网页安装版 · v${VERSION} · 已是最新`);
    return result;
  }
  window.appCheckForUpdate=checkUpdate;
  document.getElementById('pwaInstallHelp')?.addEventListener('click',()=>{help.hidden=false});
  document.getElementById('pwaHelpClose')?.addEventListener('click',()=>{help.hidden=true});
  help.addEventListener('click',event=>{if(event.target===help)help.hidden=true});
  document.getElementById('pwaCheckUpdate')?.addEventListener('click',checkUpdate);
  document.getElementById('pwaDismissUpdate')?.addEventListener('click',()=>{localStorage.setItem(dismissedKey,latestBuild);banner.hidden=true});
  document.getElementById('pwaApplyUpdate')?.addEventListener('click',async()=>{
    document.getElementById('pwaApplyUpdate').disabled=true;
    if(registration?.waiting){registration.waiting.postMessage({type:'SKIP_WAITING'});return}
    try{await registration?.update();if(registration?.waiting){registration.waiting.postMessage({type:'SKIP_WAITING'});return}}catch{}
    location.reload();
  });
  if('serviceWorker'in navigator&&(location.protocol==='https:'||['localhost','127.0.0.1'].includes(location.hostname))){
    const hadController=!!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange',()=>{if(hadController&&!controllerReload){controllerReload=true;location.reload()}});
    navigator.serviceWorker.register('./service-worker.js',{scope:'./'}).then(async reg=>{
      registration=reg;setStatus(`网页安装版 · v${VERSION}`);
      reg.addEventListener('updatefound',()=>{const worker=reg.installing;if(!worker)return;worker.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)checkVersion()})});
      if(reg.waiting&&navigator.serviceWorker.controller)checkVersion();
      await checkVersion();
    }).catch(()=>setStatus('安装版更新检查暂不可用'));
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){checkVersion();registration?.update().catch(()=>{})}});
    setInterval(checkVersion,30*60*1000);
  }else{
    setStatus(isStandalone()?`网页安装版 · v${VERSION}`:'发布到 HTTPS 地址后即可安装与在线更新');
  }
})();
