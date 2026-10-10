/* 底栏动态提醒：积分变化待查看、官方消息未读。 */
(()=>{
  const rewardButton=document.querySelector('.home-nav [data-home-nav="rewards"]');
  if(!rewardButton||typeof getRewardProgress!=='function')return;
  const seenKey='aesthetic_reward_points_seen_v1';
  const dot=document.createElement('i');
  dot.className='nav-alert-dot';
  dot.setAttribute('aria-hidden','true');
  rewardButton.append(dot);
  function points(){return getRewardProgress().points}
  function lastSeen(){try{return Number(localStorage.getItem(seenKey))||0}catch(_){return 0}}
  function markSeen(){try{localStorage.setItem(seenKey,String(points()))}catch(_){}update()}
  function update(){
    const unread=points()>lastSeen();
    dot.hidden=!unread;
    rewardButton.setAttribute('aria-label',unread?'礼遇，有新的美神点动态':'礼遇');
  }
  const originalGo=go;
  go=function(id){originalGo(id);if(id==='rewards')markSeen();else update()};
  const originalAward=rewardAward;
  rewardAward=function(...args){const earned=originalAward(...args);if(earned){if(document.getElementById('rewards')?.classList.contains('active'))markSeen();else update()}return earned};
  window.markNavActivity=function(section){if(section==='rewards')update()};
  update();
})();
