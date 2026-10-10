(function(){
  const BUILD='2026.10.10.2';
  const isStandalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  const statusText=document.createElement('p');statusText.className='pwa-install-status';statusText.id='pwaInstallStatus';statusText.textContent=`网页安装版 · v${BUILD}`;
  const settings=document.querySelector('#mySettings .myx-settings-body');
  if(settings){
    const card=document.createElement('section');card.className='pwa-install-card';card.innerHTML='<h3>iPhone 安装与更新</h3><p>通过 Safari 添加到主屏幕，后续可在这里检查新版本。</p><div class="pwa-install-actions"><button class="primary" type="button" id="pwaInstallHelp">查看安装方法</button><button type="button" id="pwaCheckUpdate">检查更新</button></div>';
    card.append(statusText);settings.append(card);
  }
  const help=document.createElement('div');help.className='pwa-help';help.hidden=true;help.innerHTML='<section class="pwa-help-card" role="dialog" aria-modal="true" aria-labelledby="pwaHelpTitle"><h2 id="pwaHelpTitle">添加到 iPhone 主屏幕</h2><p>正式发布到 HTTPS 地址后，在 iPhone 上用 Safari 打开该地址：</p><ol><li>点 Safari 的“分享”按钮</li><li>选择“添加到主屏幕”</li><li>打开“作为网页 App 打开”，再点“添加”</li></ol><p>这是网页安装版，不经过 App Store，也不是原生 IPA。</p><button type="button" id="pwaHelpClose">知道了</button></section>';
  document.body.append(help);
  const banner=document.createElement('div');banner.className='pwa-update-banner';banner.hidden=true;banner.setAttribute('role','status');banner.innerHTML='<span>检测到新版本，更新会保留本机浏览器记录。</span><button type="button" id="pwaApplyUpdate">立即更新</button><button class="pwa-dismiss" type="button" id="pwaDismissUpdate" aria-label="稍后">×</button>';document.body.append(banner);
  let registration=null,latestBuild=BUILD,controllerReload=false;
  function setStatus(text){if(statusText)statusText.textContent=text}
  function showUpdate(){banner.hidden=false;setStatus(`发现新版本 v${latestBuild} · 更新会保留本机记录`)}
  async function checkVersion(){
    try{const response=await fetch(`./app-version.json?check=${Date.now()}`,{cache:'no-store'});if(!response.ok)return;const data=await response.json();if(data.version&&data.build&&data.build!==BUILD){latestBuild=data.version;showUpdate()}else if(data.version)setStatus(`网页安装版 · v${data.version} · 已是最新`)}catch{}
  }
  async function checkUpdate(){
    setStatus('正在检查更新…');
    if(registration){try{await registration.update()}catch{}}
    await checkVersion();
    if(banner.hidden)setStatus(`网页安装版 · v${BUILD} · 已是最新`);
  }
  document.getElementById('pwaInstallHelp')?.addEventListener('click',()=>{help.hidden=false});
  document.getElementById('pwaHelpClose')?.addEventListener('click',()=>{help.hidden=true});
  help.addEventListener('click',event=>{if(event.target===help)help.hidden=true});
  document.getElementById('pwaCheckUpdate')?.addEventListener('click',checkUpdate);
  document.getElementById('pwaDismissUpdate')?.addEventListener('click',()=>{banner.hidden=true});
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
      registration=reg;setStatus(`网页安装版 · v${BUILD}`);
      reg.addEventListener('updatefound',()=>{const worker=reg.installing;if(!worker)return;worker.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller){latestBuild='新版本';showUpdate()}})});
      if(reg.waiting&&navigator.serviceWorker.controller){latestBuild='新版本';showUpdate()}
      await checkVersion();
    }).catch(()=>setStatus('安装版更新检查暂不可用'));
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){checkVersion();registration?.update().catch(()=>{})}});
    setInterval(checkVersion,30*60*1000);
  }else{
    setStatus(isStandalone()?`网页安装版 · v${BUILD}`:'发布到 HTTPS 地址后即可安装与在线更新');
  }
})();
