/* 写实视图保留原图，并给出清晰的档案入口。 */
(()=>{
  const core=document.querySelector('#home .head-core');
  if(!core||typeof setMode!=='function')return;
  const card=document.createElement('div');
  card.className='real-mode-card';
  card.innerHTML='<div><small>REAL VIEW · 原图</small><strong>写实记录</strong><p>保留原始光线和面部细节，用于长期回看。</p></div><div class="real-mode-actions"><button type="button" onclick="go(\'capture\')">更新写实照片</button><button type="button" onclick="go(\'timeline\')">查看变化记录 ›</button></div>';
  core.querySelector('#modeHint').before(card);
  const original=setMode;
  setMode=function(next){
    original(next);
    const real=next==='real';
    core.classList.toggle('real-mode',real);
    card.hidden=!real;
    const face=document.getElementById('userFace');
    face.alt=real?'用户写实原图，不使用高帧率显示效果':'用户照片的柔和高帧率预览';
    document.getElementById('realBtn').setAttribute('aria-pressed',String(real));
    document.getElementById('polishedBtn').setAttribute('aria-pressed',String(!real));
  };
  setMode(mode);
})();
