/* 交互式 3D 头模采集原型：只在明确点击后打开摄像头，画面仅在本机处理。 */
(function () {
  const core = document.querySelector('#home .head-core');
  const flatFacebox = core?.querySelector('#facebox');
  if (!core || !flatFacebox) return;

  const originalMode = core.querySelector('.head-mode');
  const foot = core.querySelector('.head-foot');
  const pager = document.createElement('div');
  pager.className = 'face-category-pager';
  pager.innerHTML = '<div class="face-category-track"><section class="face-category-page flat-page" aria-label="平面"><div class="face-category-name">平面</div></section><section class="face-category-page solid-page" aria-label="立体"><div class="face-category-name">立体</div></section></div><div class="face-category-dots" role="tablist" aria-label="我的脸分类"><button type="button" class="active" role="tab" aria-label="平面" aria-selected="true"></button><button type="button" role="tab" aria-label="立体" aria-selected="false"></button></div>';
  const track = pager.querySelector('.face-category-track');
  const flatPage = pager.querySelector('.flat-page');
  const solidPage = pager.querySelector('.solid-page');
  const solidMode = originalMode.cloneNode(true);
  solidMode.querySelectorAll('[id]').forEach(item => item.removeAttribute('id'));
  originalMode.querySelector('#polishedBtn').textContent = '高帧率';
  solidMode.querySelectorAll('button')[0].textContent = '高帧率';
  originalMode.querySelectorAll('button').forEach((button, index) => button.dataset.faceMode = index ? 'real' : 'polished');
  solidMode.querySelectorAll('button').forEach((button, index) => button.dataset.faceMode = index ? 'real' : 'polished');
  const solidFacebox = flatFacebox.cloneNode(false);
  solidFacebox.removeAttribute('id');
  flatFacebox.querySelectorAll('.marker').forEach(marker => solidFacebox.append(marker.cloneNode(true)));
  const solidPhoto = document.createElement('img');
  solidPhoto.className = 'head3d-solid-photo';
  solidPhoto.alt = '最近一次立体采集的正面写实记录';
  solidPhoto.hidden = true;
  solidFacebox.append(solidPhoto);
  flatPage.append(originalMode, flatFacebox);
  solidPage.append(solidMode, solidFacebox);
  core.insertBefore(pager, foot);
  let activeCategory = 0;
  function setCategory(index) {
    activeCategory = Math.max(0, Math.min(1, index));
    track.style.transform = `translateX(${-activeCategory * 50}%)`;
    pager.querySelectorAll('.face-category-dots button').forEach((dot, i) => {
      dot.classList.toggle('active', i === activeCategory);
      dot.setAttribute('aria-selected', String(i === activeCategory));
    });
    const isReal = mode === 'real';
    viewer.hidden = activeCategory === 0 || isReal;
    solidPhoto.hidden = activeCategory === 0 || !isReal;
    angles.hidden = activeCategory === 0;
    actions.hidden = activeCategory === 0;
    if (compare) compare.hidden = activeCategory === 0 || !hasTwoCaptureSessions();
  }
  pager.querySelectorAll('.face-category-dots button').forEach((dot, i) => dot.addEventListener('click', () => setCategory(i)));
  let swipeStartX = 0;
  pager.addEventListener('touchstart', event => { swipeStartX = event.touches[0].clientX; }, { passive: true });
  pager.addEventListener('touchend', event => {
    if (event.target.closest('button')) return;
    const dx = event.changedTouches[0].clientX - swipeStartX;
    const threshold = event.target.closest('.head3d-model') ? 86 : 42;
    if (Math.abs(dx) > threshold) setCategory(activeCategory + (dx < 0 ? 1 : -1));
  }, { passive: true });

  const storageKey = 'aesthetic_3d_head_v1';
  const captureDateInput = document.getElementById('captureDate');
  function updateCaptureDate() {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (captureDateInput) captureDateInput.value = today;
    return today;
  }
  if (captureDateInput) {
    captureDateInput.type = 'text';
    captureDateInput.readOnly = true;
    captureDateInput.setAttribute('aria-label', '拍摄日期，自动记录当天日期');
    updateCaptureDate();
    window.setInterval(updateCaptureDate, 60000);
  }
  let saved = null;
  let stream = null;
  let recorder = null;
  let clipParts = [];
  let recording = false;
  let startAt = 0;
  let animationFrame = 0;
  let frames = [];
  let clipBlob = null;
  let textureFrames = null;

  try { saved = JSON.parse(localStorage.getItem(storageKey) || 'null'); } catch (_) {}

  const viewer = document.createElement('div');
  viewer.className = 'head3d-viewer';
  viewer.innerHTML = '<div class="head3d-model" role="img" aria-label="可拖动旋转的 3D 头模预览" tabindex="0"><span class="head3d-halo"></span><span class="head3d-neck"></span><span class="head3d-ear left"></span><span class="head3d-ear right"></span><span class="head3d-skull"><span class="head3d-hair"></span><span class="head3d-texture"></span><span class="head3d-contour"></span><span class="head3d-brow left"></span><span class="head3d-brow right"></span><span class="head3d-eye left"></span><span class="head3d-eye right"></span><span class="head3d-nose"></span><span class="head3d-mouth"></span><span class="head3d-light"></span></span><span class="head3d-caption">3D 外观预览 · 拖动旋转</span></div>';
  solidFacebox.prepend(viewer);

  const actions = document.createElement('div');
  actions.className = 'head3d-actions';
  actions.innerHTML = '<small id="head3dStatus">立体头模示意 · 尚未采集本人影像</small>';
  const compare = document.createElement('section');
  compare.className = 'head3d-compare';
  compare.innerHTML = '<button type="button" class="head3d-compare-toggle" aria-expanded="false">查看前后脸部对比</button><div class="head3d-compare-body" hidden><p>同角度前后记录 · 请尽量保持光线、距离、表情一致</p><nav class="head3d-compare-angles" aria-label="选择对比角度"><button type="button" data-compare-angle="front" class="active">正面</button><button type="button" data-compare-angle="left">左侧</button><button type="button" data-compare-angle="right">右侧</button></nav><div><figure><img alt="较早的同角度面部记录"><figcaption>较早记录</figcaption></figure><span aria-hidden="true">↔</span><figure><img alt="最近的同角度面部记录"><figcaption>最近记录</figcaption></figure></div><button type="button" class="head3d-ask-ai">带着记录去问 AI 小助手</button></div>';
  const angles = document.createElement('div');
  angles.className = 'head3d-angle-strip';
  angles.innerHTML = '<span class="head3d-angle-label">采集视角</span><span class="head3d-angle" data-angle="left" aria-label="左侧视角"></span><span class="head3d-angle" data-angle="front" aria-label="正面视角"></span><span class="head3d-angle" data-angle="right" aria-label="右侧视角"></span>';
  solidPage.append(angles, actions, compare);
  function hasTwoCaptureSessions() {
    const sessions = saved?.sessions || (saved?.frames?.front ? [saved.frames] : []);
    return sessions.length >= 2;
  }

  const dialog = document.createElement('dialog');
  dialog.className = 'headscan-dialog';
  dialog.setAttribute('aria-labelledby', 'headscanTitle');
  dialog.innerHTML = '<div class="headscan-wrap"><div class="headscan-top"><h2 id="headscanTitle">生成我的 3D 头模</h2><button type="button" class="headscan-close" aria-label="关闭">×</button></div><p class="headscan-copy">使用前置摄像头自拍。让头部完整落在轮廓里，录制约 4 秒：正面停留，再缓慢左右转头。</p><div class="headscan-camera"><video id="headscanVideo" playsinline muted autoplay></video><div class="headscan-guide"><svg viewBox="0 0 120 180" aria-hidden="true"><path d="M60 10c-28 0-43 21-43 51v24c0 28 17 55 43 68 26-13 43-40 43-68V61C103 31 88 10 60 10Z"/><path d="M36 71c7-5 14-5 21 0m6 0c7-5 14-5 21 0M60 73v34m-13 19c8 5 18 5 26 0"/><path class="face-guide-cross" d="M60 0v12M60 153v19M8 83h10m84 0h10"/></svg></div><div class="headscan-placeholder"><span>◉</span><br>点“打开前置摄像头”后<br>把脸对准头部轮廓</div></div><div class="headscan-status" id="headscanStatus" role="status">准备好后点击“打开前置摄像头”</div><div class="headscan-progress"><i id="headscanProgress"></i></div><div class="headscan-steps"><span data-step="front">正面</span><span data-step="left">缓慢左转</span><span data-step="right">缓慢右转</span></div><p class="headscan-consent">本机保存每次正面、左右角度照片用于个人档案和视觉对比。原始视频结束即删除。云端 AI 不接收影像；目前只能基于你授权的文字档案和提问回答，不会自动识别皮肤或五官。</p><div class="headscan-actions"><button type="button" class="headscan-secondary" id="headscanCancel">取消</button><button type="button" class="headscan-primary" id="headscanStart">打开前置摄像头</button></div></div>';
  document.querySelector('.phone').append(dialog);
  const updateDialog = document.createElement('dialog');
  updateDialog.className = 'headscan-dialog update-photo-dialog';
  updateDialog.innerHTML = '<div class="headscan-wrap"><div class="headscan-top"><h2>更新我的脸</h2><button type="button" class="headscan-close" aria-label="关闭">×</button></div><p class="headscan-copy">选择一种记录方式</p><button type="button" class="headscan-primary update-option" data-update="flat">上传平面照片</button><button type="button" class="headscan-primary update-option" data-update="solid">录制并生成立体头模</button><p class="headscan-consent">日期自动记录为今天，保存后不能修改。照片和角度画面只保存在本机。</p></div>';
  document.querySelector('.phone').append(updateDialog);

  const model = viewer.querySelector('.head3d-model');
  const skull = viewer.querySelector('.head3d-skull');
  const texture = viewer.querySelector('.head3d-texture');
  const status = actions.querySelector('#head3dStatus');
  const video = dialog.querySelector('#headscanVideo');
  const scanStatus = dialog.querySelector('#headscanStatus');
  const progress = dialog.querySelector('#headscanProgress');
  const startButton = dialog.querySelector('#headscanStart');
  const stepLabels = [...dialog.querySelectorAll('[data-step]')];
  const compareToggle = compare.querySelector('.head3d-compare-toggle');
  const compareBody = compare.querySelector('.head3d-compare-body');
  let comparisonAngle = 'front';

  function refreshComparison() {
    let captures = saved?.sessions || [];
    if (!captures.length && saved?.frames?.front) captures = [{ frames: saved.frames, createdAt: saved.createdAt }];
    compare.hidden = captures.length < 2;
    if (captures.length < 2) return;
    const older = captures[captures.length - 2];
    const latest = captures[captures.length - 1];
    const images = compareBody.querySelectorAll('img');
    images[0].src = older.frames?.[comparisonAngle] || older.frames?.front || '';
    images[1].src = latest.frames?.[comparisonAngle] || latest.frames?.front || '';
    compareBody.querySelectorAll('figcaption')[0].textContent = (older.date || (older.createdAt || '').slice(0, 10)) + ' · 较早';
    compareBody.querySelectorAll('figcaption')[1].textContent = (latest.date || (latest.createdAt || '').slice(0, 10)) + ' · 最近';
  }
  refreshComparison();
  compareToggle.addEventListener('click', () => {
    const expanded = compareToggle.getAttribute('aria-expanded') === 'true';
    compareToggle.setAttribute('aria-expanded', String(!expanded));
    compareBody.hidden = expanded;
  });
  compare.querySelectorAll('[data-compare-angle]').forEach(button => button.addEventListener('click', () => {
    comparisonAngle = button.dataset.compareAngle;
    compare.querySelectorAll('[data-compare-angle]').forEach(item => item.classList.toggle('active', item === button));
    refreshComparison();
  }));
  compare.querySelector('.head3d-ask-ai').addEventListener('click', () => {
    if (typeof openFaceAssistant === 'function') openFaceAssistant();
    else if (typeof go === 'function') go('faceAssistant');
  });

  function showSavedModel() {
    if (saved?.frames?.front) {
      textureFrames = saved.frames;
      updateTextureAngle();
      skull.classList.add('has-texture');
      dialog.querySelector('[data-angle="front"]').style.backgroundImage = 'url("' + saved.frames.front + '")';
      dialog.querySelector('[data-angle="left"]').style.backgroundImage = 'url("' + (saved.frames.left || saved.frames.front) + '")';
      dialog.querySelector('[data-angle="right"]').style.backgroundImage = 'url("' + (saved.frames.right || saved.frames.front) + '")';
      status.textContent = '已生成本机头模 · ' + new Date(saved.createdAt || Date.now()).toLocaleDateString('zh-CN');
      solidPhoto.src = saved.frames.front;
      model.setAttribute('aria-label', '根据本机采集画面制作的 3D 头模示意，可拖动旋转');
    }
  }
  showSavedModel();

  const modeHint = core.querySelector('#modeHint');
  if (modeHint && !core.classList.contains('real-mode')) modeHint.textContent = '可拖动查看头模；采集内容仅保存在本机，不用于诊断';

  function setAngleStep(name) {
    stepLabels.forEach(item => item.classList.toggle('active', item.dataset.step === name));
  }
  function closeCamera() {
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    recording = false;
    if (recorder && recorder.state !== 'inactive') {
      try { recorder.stop(); } catch (_) {}
    }
    recorder = null;
    if (stream) stream.getTracks().forEach(track => track.stop());
    stream = null;
    video.srcObject = null;
    dialog.querySelector('.headscan-camera').classList.remove('is-live');
  }
  function resetDialog() {
    progress.style.width = '0%';
    scanStatus.textContent = '准备好后点击“打开摄像头”';
    startButton.textContent = '打开摄像头';
    startButton.disabled = false;
    setAngleStep('');
  }
  function openDialog() {
    resetDialog();
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }
  function closeDialog() {
    closeCamera();
    if (typeof dialog.close === 'function' && dialog.open) dialog.close();
    else dialog.removeAttribute('open');
  }
  function cameraError(error) {
    const messages = {
      NotAllowedError: '没有摄像头权限。请允许此网站使用摄像头后重试。',
      NotFoundError: '没有找到可用摄像头。',
      NotReadableError: '摄像头正被其他应用占用，请关闭后重试。',
      SecurityError: '摄像头需要 HTTPS 安全连接，并由你主动授权。'
    };
    return messages[error?.name] || '摄像头暂时不可用，请检查浏览器权限后重试。';
  }
  async function openCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      scanStatus.textContent = '当前浏览器无法使用摄像头；请用 HTTPS 页面和新版 Safari/Chrome 打开。';
      return;
    }
    startButton.disabled = true;
    scanStatus.textContent = '正在请求摄像头权限…';
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'user' }, width: { ideal: 640 }, height: { ideal: 480 } }
      });
      video.srcObject = stream;
      await video.play();
      dialog.querySelector('.headscan-camera').classList.add('is-live');
      scanStatus.textContent = '已打开前置摄像头。确认头部完整对准轮廓后开始';
      startButton.textContent = '开始 4 秒采集';
      startButton.disabled = false;
    } catch (error) {
      scanStatus.textContent = cameraError(error);
      startButton.textContent = '重试打开摄像头';
      startButton.disabled = false;
    }
  }
  function captureStill() {
    if (!video.videoWidth || !video.videoHeight) return '';
    const targetRatio = .75;
    const sourceHeight = video.videoHeight;
    const sourceWidth = Math.min(video.videoWidth, sourceHeight * targetRatio);
    const sourceX = Math.max(0, (video.videoWidth - sourceWidth) / 2);
    const canvas = document.createElement('canvas');
    canvas.width = 270;
    canvas.height = 360;
    const context = canvas.getContext('2d', { alpha: false });
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, sourceX, 0, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
    try { return canvas.toDataURL('image/jpeg', .62); } catch (_) { return ''; }
  }
  async function sampleAt(ms, name) {
    while (recording && performance.now() - startAt < ms) await new Promise(resolve => setTimeout(resolve, 45));
    if (!recording) return;
    let image = '';
    for (let attempt = 0; attempt < 7 && recording && !image; attempt++) {
      image = captureStill();
      if (!image) await new Promise(resolve => setTimeout(resolve, 90));
    }
    if (image) frames.push([name, image]);
  }
  function renderProgress() {
    if (!recording) return;
    const elapsed = performance.now() - startAt;
    const ratio = Math.min(1, elapsed / 4000);
    progress.style.width = (ratio * 100) + '%';
    const step = ratio < .32 ? 'front' : ratio < .67 ? 'left' : 'right';
    setAngleStep(step);
    scanStatus.textContent = step === 'front' ? '正对镜头，保持自然表情' : step === 'left' ? '缓慢向左转约 30°' : '缓慢向右转，再回到正面';
    if (ratio < 1) animationFrame = requestAnimationFrame(renderProgress);
  }
  async function startCapture() {
    if (!stream) return openCamera();
    frames = [];
    clipParts = [];
    clipBlob = null;
    startButton.disabled = true;
    startButton.textContent = '采集中…';
    try {
      if (window.MediaRecorder) {
        const types = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp8', 'video/webm'];
        const mimeType = types.find(type => MediaRecorder.isTypeSupported?.(type));
        recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        recorder.addEventListener('dataavailable', event => { if (event.data?.size) clipParts.push(event.data); });
        recorder.addEventListener('stop', () => {
          if (clipParts.length) clipBlob = new Blob(clipParts, { type: recorder?.mimeType || 'video/webm' });
        }, { once: true });
        recorder.start();
      }
    } catch (_) { recorder = null; }
    recording = true;
    startAt = performance.now();
    animationFrame = requestAnimationFrame(renderProgress);
    await Promise.all([sampleAt(400, 'front'), sampleAt(1900, 'left'), sampleAt(3300, 'right')]);
    await new Promise(resolve => setTimeout(resolve, Math.max(0, 4000 - (performance.now() - startAt))));
    recording = false;
    cancelAnimationFrame(animationFrame);
    progress.style.width = '100%';
    if (recorder && recorder.state !== 'inactive') {
      await new Promise(resolve => {
        recorder.addEventListener('stop', resolve, { once: true });
        try { recorder.stop(); } catch (_) { resolve(); }
      });
    }
    if (!frames.some(([name]) => name === 'front')) {
      scanStatus.textContent = '没有采集到清晰画面，请把脸对准轮廓后重试。';
      startButton.disabled = false;
      startButton.textContent = '重新采集';
      return;
    }
    const collected = Object.fromEntries(frames);
    const createdAt = new Date().toISOString();
    const captureDate = updateCaptureDate();
    const session = { frames: collected, createdAt, date: captureDate, capture: 'local-demo' };
    const oldSessions = saved?.sessions?.length ? saved.sessions : (saved?.frames?.front ? [{ frames: saved.frames, createdAt: saved.createdAt }] : []);
    saved = { ...saved, ...session, sessions: [...oldSessions, session].slice(-12) };
    try { localStorage.setItem(storageKey, JSON.stringify(saved)); }
    catch (_) { scanStatus.textContent = '本机空间不足，头模仅在当前页面预览。'; }
    try {
      if (typeof data !== 'undefined' && Array.isArray(data.photos)) {
        data.photos.push({ date: captureDate, note: '前置摄像头短视频采集 · 正面、左侧、右侧角度已保存', src: collected.front, captureType: '3d-video', captureId: createdAt });
        const saved3dPhotos = data.photos.filter(item => item.captureType === '3d-video');
        saved3dPhotos.slice(0, Math.max(0, saved3dPhotos.length - 12)).forEach(item => {
          const index = data.photos.indexOf(item);
          if (index >= 0) data.photos.splice(index, 1);
        });
        if (typeof persist === 'function') persist();
        if (typeof render === 'function') render();
      }
      if (typeof recordRewardDay === 'function') recordRewardDay();
    } catch (_) {}
    showSavedModel();
    refreshComparison();
    scanStatus.textContent = '头模预览已生成，正在结束摄像头…';
    startButton.textContent = '完成';
    closeCamera();
    clipBlob = null;
    clipParts = [];
    recorder = null;
    setTimeout(() => {
      closeDialog();
      if (typeof showHomeToast === 'function') showHomeToast('3D 头模预览已生成并保存在本机');
    }, 700);
  }

  const updateButton = core.querySelector('.head-foot button');
  updateButton.removeAttribute('onclick');
  updateButton.textContent = '更新照片';
  updateButton.addEventListener('click', () => updateDialog.showModal());
  updateDialog.querySelector('.headscan-close').addEventListener('click', () => updateDialog.close());
  updateDialog.querySelector('[data-update="flat"]').addEventListener('click', () => { updateDialog.close(); updateCaptureDate(); go('capture'); });
  updateDialog.querySelector('[data-update="solid"]').addEventListener('click', () => { updateDialog.close(); openDialog(); });
  window.openFaceUpdateOptions = () => updateDialog.showModal();
  dialog.querySelector('.headscan-close').addEventListener('click', closeDialog);
  dialog.querySelector('#headscanCancel').addEventListener('click', closeDialog);
  startButton.addEventListener('click', () => stream ? startCapture() : openCamera());
  dialog.addEventListener('cancel', closeCamera);
  dialog.addEventListener('click', event => { if (event.target === dialog) closeDialog(); });

  let pointerDown = false;
  let previousX = 0;
  let previousY = 0;
  let rotationY = 0;
  let rotationX = 0;
  textureFrames = saved?.frames || null;
  function updateTextureAngle() {
    if (!textureFrames?.front) return;
    const angle = rotationY < -12 ? 'left' : rotationY > 12 ? 'right' : 'front';
    texture.style.backgroundImage = 'url("' + (textureFrames[angle] || textureFrames.front) + '")';
  }
  model.addEventListener('pointerdown', event => {
    pointerDown = true;
    previousX = event.clientX;
    previousY = event.clientY;
    model.setPointerCapture?.(event.pointerId);
  });
  model.addEventListener('pointermove', event => {
    if (!pointerDown) return;
    rotationY = Math.max(-35, Math.min(35, rotationY + (event.clientX - previousX) * .75));
    rotationX = Math.max(-8, Math.min(8, rotationX - (event.clientY - previousY) * .26));
    previousX = event.clientX;
    previousY = event.clientY;
    model.style.setProperty('--head-y', rotationY + 'deg');
    model.style.setProperty('--head-x', rotationX + 'deg');
    updateTextureAngle();
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => model.addEventListener(type, () => { pointerDown = false; }));
  model.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    rotationY += event.key === 'ArrowLeft' ? -8 : 8;
    model.style.setProperty('--head-y', rotationY + 'deg');
    updateTextureAngle();
  });

  const previousSetMode = window.setMode;
  if (typeof previousSetMode === 'function') {
    window.setMode = function (next) {
      previousSetMode(next);
      const real = next === 'real';
      core.querySelectorAll('.head-mode button').forEach(button => button.classList.toggle('active', button.dataset.faceMode === next));
      viewer.hidden = activeCategory !== 1 || real;
      solidPhoto.hidden = activeCategory !== 1 || !real;
      if (saved?.frames?.front) solidPhoto.src = saved.frames.front;
      angles.hidden = activeCategory !== 1;
      actions.hidden = activeCategory !== 1;
      compare.hidden = activeCategory !== 1 || !hasTwoCaptureSessions();
      if (!real && modeHint) modeHint.textContent = activeCategory === 1 ? '立体头模预览 · 采集画面仅保存在本机' : '平面高帧率预览 · 长期对比以写实记录为准';
    };
    const modeHint = core.querySelector('#modeHint');
    window.setMode(mode);
  }
  setCategory(0);
  window.addEventListener('pagehide', closeCamera);
})();
