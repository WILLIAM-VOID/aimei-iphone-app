(function(){
  const splash=document.getElementById('appSplash');
  if(!splash)return;
  let timer;
  function close(){splash.classList.add('leaving');setTimeout(()=>{splash.hidden=true;splash.classList.remove('leaving')},400)}
  function play(){clearTimeout(timer);splash.hidden=false;splash.classList.remove('leaving');splash.innerHTML=splash.innerHTML;timer=setTimeout(close,matchMedia('(prefers-reduced-motion: reduce)').matches?400:1700)}
  window.replayAppSplash=play;
  const nav=performance.getEntriesByType?.('navigation')?.[0];
  if(nav?.type==='reload')splash.hidden=true;else play();
})();
