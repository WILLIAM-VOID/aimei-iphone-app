/* 美神路原型：按有效行为积累积分，同类行为按日、周和周期限额。 */
const rewardDayKey = 'aesthetic_reward_days_v1';
const rewardLedgerKey = 'aesthetic_reward_ledger_v2';
const rewardSkinKey = 'aesthetic_reward_skin_v1';
const rewardResetKey = 'aesthetic_reward_today_reset_2026_10_06_v1';
const rewardMilestones = [0,100,200,300,400,500,600,700,800,900,1000];
function rewardQuarterKey(date=new Date()) {return `${date.getFullYear()}-Q${Math.floor(date.getMonth()/3)+1}`}
function rewardQuarterStart(quarter=rewardQuarterKey()) {const [year,number]=quarter.split('-Q').map(Number);return `${year}-${String((number-1)*3+1).padStart(2,'0')}-01`}
function rewardQuarterEnd(quarter=rewardQuarterKey()) {const [year,number]=quarter.split('-Q').map(Number);return new Date(year,number*3,0).toLocaleDateString('sv-SE')}
const rewardSkinInfo = [
  {id:'moon',name:'月冕之路',desc:'深紫鎏金 · 史诗战令',icon:'✦',image:'../原型截图/礼遇-美神路-方案01.png'},
  {id:'star',name:'琉璃星轨',desc:'蓝紫星空 · 星图成就',icon:'✧',image:'../原型截图/礼遇-美神路-方案02.png'},
  {id:'rose',name:'玫瑰圣殿',desc:'莓果粉金 · 品牌礼遇',icon:'◇',image:'../原型截图/礼遇-美神路-方案03.png'},
  {id:'cloud',name:'云境日记',desc:'奶白薄荷 · 温柔陪伴',icon:'✿',image:'../原型截图/礼遇-美神路-方案04.png'},
  {id:'mirror',name:'镜界觉醒',desc:'霓虹青黑 · 未来进阶',icon:'▣',image:'../原型截图/礼遇-美神路-方案05.png'}
];
let rewardEntry = '';
let rewardSkin = 'rose';
try {
  const saved = localStorage.getItem(rewardSkinKey);
  if (rewardSkinInfo.some(item => item.id === saved)) rewardSkin = saved;
} catch (_) {}

function localRewardDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 本次原型调整仅重置当天点亮，保留以往日期；标记保证只执行一次。
try {
  if (!localStorage.getItem(rewardResetKey)) {
    const savedDays = JSON.parse(localStorage.getItem(rewardDayKey) || '[]');
    if (Array.isArray(savedDays)) {
      localStorage.setItem(rewardDayKey, JSON.stringify(savedDays.filter(day => day !== '2026-10-06')));
    }
    localStorage.setItem(rewardResetKey, '1');
  }
} catch (_) {}

function getRewardDays() {
  try {
    const value = JSON.parse(localStorage.getItem(rewardDayKey) || '[]');
    const start=rewardQuarterStart();
    return Array.isArray(value) ? [...new Set(value.filter(day => /^\d{4}-\d{2}-\d{2}$/.test(day)&&day>=start))].sort() : [];
  } catch (_) {
    return [];
  }
}

function getRewardLedger() {
  try {
    const saved = JSON.parse(localStorage.getItem(rewardLedgerKey) || 'null');
    if (saved && Array.isArray(saved.entries)) {
      const current=rewardQuarterKey();
      if(saved.quarter===current)return saved;
      saved.history=Array.isArray(saved.history)?saved.history:[];
      const previous=saved.quarter||'历史积分';
      const oldEntries=saved.entries.filter(item=>!item.date||item.date<rewardQuarterStart(current));
      if(oldEntries.length)saved.history.push({quarter:previous,closedAt:localRewardDate(),points:oldEntries.reduce((sum,item)=>sum+(Number(item.points)||0),0),entries:oldEntries});
      saved.entries=saved.quarter?[]:saved.entries.filter(item=>item.date>=rewardQuarterStart(current));
      saved.quarter=current;
      saved.version=3;
      try{localStorage.setItem(rewardLedgerKey,JSON.stringify(saved))}catch(_){}
      return saved;
    }
  } catch (_) {}
  const entries = getRewardDays().map(day => ({key:`daily:${day}`,kind:'daily',date:day,points:12}));
  try {
    const oldQuiz = JSON.parse(localStorage.getItem('aesthetic_appearance_points_v1') || '{}');
    Object.keys(oldQuiz || {}).slice(0,6).forEach(area => entries.push({key:`quiz:${area}`,kind:'quiz',date:localRewardDate(),points:10}));
  } catch (_) {}
  const ledger = {version:3,quarter:rewardQuarterKey(),history:[],entries};
  try { localStorage.setItem(rewardLedgerKey, JSON.stringify(ledger)); } catch (_) {}
  return ledger;
}
function getRewardProgress() {
  const entries = getRewardLedger().entries;
  return {points:Math.min(1000,entries.reduce((sum,item)=>sum+(Number(item.points)||0),0)),entries};
}
function rewardAward(kind,key,amount,maxPerCycle=Infinity,note='') {
  const ledger=getRewardLedger();
  if (ledger.entries.some(item=>item.key===key) || ledger.entries.filter(item=>item.kind===kind).length>=maxPerCycle) return 0;
  const remaining=1000-getRewardProgress().points;
  if(remaining<=0)return 0;
  const points=Math.min(amount,remaining);
  ledger.entries.push({kind,key,points,date:localRewardDate(),...(note?{note}:{})});
  try {localStorage.setItem(rewardLedgerKey,JSON.stringify(ledger))} catch (_) {ledger.entries.pop();return 0}
  if(document.getElementById('rewards')?.classList.contains('active'))renderRewards();
  return points;
}
function awardRewardQuiz(area) {
  return rewardAward('quiz',`quiz:${area}`,10,6);
}
function awardRewardProject(item) {
  const earned=rewardAward('project',`project:${item.date}:${item.name}`,15,2);
  if(earned)showHomeToast(`项目经历已保存，美神点 +${earned}`);
}
function rewardWeekKey() {
  const date=new Date();date.setHours(12,0,0,0);date.setDate(date.getDate()-((date.getDay()+6)%7));
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
function submitRewardReview() {
  const input=document.getElementById('rewardReviewText');
  const note=input.value.trim();
  if(new Set((data.photos||[]).map(photo=>photo.date)).size<2){showHomeToast('先保存两次不同日期的写实照片，再回看变化');return}
  if(note.length<12){showHomeToast('请写下至少 12 个字的真实观察');return}
  const earned=rewardAward('review',`review:${rewardWeekKey()}`,20,Infinity,note);
  if(!earned){showHomeToast('本周回看积分已领取');return}
  input.value='';
  showHomeToast(`本周回看已保存，美神点 +${earned}`);
  renderRewards();
}
function claimRewardMilestone(level){
  if(level===0){showHomeToast('美神路已经启程');return}
  if(level===1000){showHomeToast(getRewardProgress().points>=1000?'已达成 1000 分；真实兑换待合作方接入':'积满 1000 分后点亮礼遇');return}
  if(!rewardMilestones.includes(level))return;
  if(getRewardProgress().points<level){showHomeToast(`达到 ${level} 分后可领取`);return}
  const ledger=getRewardLedger();
  if(ledger.entries.some(item=>item.key===`milestone:${level}`)){showHomeToast('这个节点的美神点已领取');return}
  let earned=rewardAward('milestone',`milestone:${level}`,10,9);
  if(!earned&&getRewardProgress().points>=1000){
    const grant=ledger.entries.find(item=>item.kind==='demo-grant'&&Number(item.points)>=10);
    if(grant){
      grant.points-=10;
      ledger.entries.push({kind:'milestone',key:`milestone:${level}`,points:10,date:localRewardDate(),note:'从演示赠送积分中领取节点点数'});
      try{localStorage.setItem(rewardLedgerKey,JSON.stringify(ledger));earned=10;renderRewards()}catch(_){ledger.entries.pop();grant.points+=10}
    }
  }
  if(!earned){showHomeToast('这个节点的美神点已领取');return}
  const node=document.querySelector(`#rewards .reward-node[data-level="${level}"]`);
  node?.classList.add('claim-flash');
  showHomeToast(`已收取 ${level} 分节点 · 美神点 +${earned}`);
}
function recordRewardDay(kind='note') {
  if(kind==='note'&&document.getElementById('capture')?.classList.contains('active'))kind='photo';
  const today = localRewardDate();
  const days = getRewardDays();
  if(kind==='photo'&&document.getElementById('captureDate')?.value!==today)return false;
  let earned=rewardAward('daily',`daily:${today}`,12);
  if(!days.includes(today)){
    days.push(today);
    try {localStorage.setItem(rewardDayKey,JSON.stringify(days.sort()))} catch (_) {}
  }
  if(kind==='photo')earned+=rewardAward('photo',`photo:${today}`,3);
  if(earned){
    let streak=0;
    for(let i=0;i<28;i++){
      const date=new Date(today+'T12:00:00');date.setDate(date.getDate()-i);
      const day=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
      if(!days.includes(day))break;
      streak++;
    }
    if(streak>=7&&streak%7===0)earned+=rewardAward('streak',`streak:${today}`,10,4);
    syncRewardRitual();
    showHomeToast(`面部记录已保存，美神点 +${earned}`);
  }
  return earned>0;
}

function syncRewardRitual() {
  const body = document.body;
  const todayDone = getRewardProgress().entries.some(item=>item.key===`daily:${localRewardDate()}`);
  body.classList.toggle('reward-lit-today', todayDone);
  rewardSkinInfo.forEach(item => body.classList.toggle(`reward-ritual-${item.id}`, rewardSkin === item.id));
  const masthead = document.querySelector('#home .home-masthead');
  if (masthead && !masthead.querySelector('.reward-home-ritual')) {
    const overlay = document.createElement('div');
    overlay.className = 'reward-home-ritual';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = '<i></i>'.repeat(11);
    masthead.appendChild(overlay);
  }
  // 未点亮保留基础粒子；点亮后礼遇主卡与进度卡增加约 50% 粒子。
  for (const [selector, amount, seed] of [['#rewards .reward-hero', 23, 17], ['#rewards .reward-track-card', 15, 41]]) {
    const host = document.querySelector(selector);
    if (!host || host.querySelector('.reward-moon-tide')) continue;
    const overlay = document.createElement('div');
    overlay.className = 'reward-moon-tide';
    overlay.setAttribute('aria-hidden', 'true');
    let value = seed;
    const next = () => ((value = (value * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < amount; i++) {
      const spark = document.createElement('i');
      spark.style.setProperty('--x', `${8 + next() * 84}%`);
      spark.style.setProperty('--y', `${12 + next() * 73}%`);
      spark.style.setProperty('--delay', `${(-next() * 9).toFixed(2)}s`);
      spark.style.setProperty('--duration', `${(5.8 + next() * 4.8).toFixed(2)}s`);
      spark.style.setProperty('--drift', `${(-15 + next() * 35).toFixed(1)}px`);
      spark.style.setProperty('--rise', `${(-8 - next() * 15).toFixed(1)}px`);
      overlay.appendChild(spark);
    }
    host.appendChild(overlay);
  }
  const status = document.querySelector('#rewards .reward-status');
  if (status && !status.querySelector('.reward-status-glints')) {
    const glints = document.createElement('span');
    glints.className = 'reward-status-glints';
    glints.setAttribute('aria-hidden', 'true');
    glints.innerHTML = '<i></i>'.repeat(5);
    status.appendChild(glints);
  }
  const track = document.querySelector('#rewards .reward-track-card');
  if (track) {
    let marker = track.querySelector('.reward-today-marker');
    if (!marker) {
      marker = document.createElement('span');
      marker.className = 'reward-today-marker';
      marker.setAttribute('aria-hidden', 'true');
      marker.innerHTML = '<i></i><i></i><i></i><i></i>';
      track.appendChild(marker);
    }
    const progress = getRewardProgress().points / 1000;
    marker.style.left = `calc(38px + (100% - 76px) * ${progress})`;
  }
}

function applyRewardSkin() {
  const page = document.getElementById('rewards');
  if (!page) return;
  const body = document.body;
  rewardSkinInfo.forEach(item => body.classList.remove(`app-skin-${item.id}`));
  body.classList.add(`app-skin-${rewardSkin}`);
  body.classList.toggle('app-dark', ['moon','star','mirror'].includes(rewardSkin));
  rewardSkinInfo.forEach(item => page.classList.remove(`skin-${item.id}`));
  page.classList.add(`skin-${rewardSkin}`);
  const info = rewardSkinInfo.find(item => item.id === rewardSkin) || rewardSkinInfo[2];
  document.getElementById('rewardArt').textContent = info.icon;
  document.getElementById('rewardPrizeIcon').textContent = info.icon;
  syncRewardRitual();
}

function renderRewards() {
  applyRewardSkin();
  const {points,entries}=getRewardProgress();
  const ledger=getRewardLedger();
  document.getElementById('rewardSeason').textContent=`${ledger.quarter||rewardQuarterKey()} · 季度积分`;
  document.getElementById('rewardQuarterNote').textContent=`${rewardQuarterEnd()} 季度结束后积分归零；面部记录和已完成节点保留在本机历史中。`;
  const historyEl=document.getElementById('rewardHistory');
  const history=Array.isArray(ledger.history)?ledger.history:[];
  historyEl.hidden=history.length===0;
  document.getElementById('rewardHistoryList').replaceChildren(...history.slice(-6).reverse().map(item=>{
    const row=document.createElement('p');
    row.textContent=`${item.quarter||'历史积分'} · ${Math.min(1000,Number(item.points)||0)} 分 · 已归档`;
    return row;
  }));
  const todayDone=entries.some(item=>item.key===`daily:${localRewardDate()}`);
  document.getElementById('rewardCount').textContent=points;
  document.getElementById('rewardPoints').textContent=points;
  document.getElementById('rewardScoreBig').textContent=points;
  document.getElementById('rewardTrailFill').style.width=`${points/10}%`;
  const stage=Math.min(10,Math.floor(points/100));
  const journeyCopy=[
    '从一次真实记录开始，认识此刻的自己',
    '第一段记录已经留下，习惯正在形成',
    '再多一次对照，变化开始有迹可循',
    '你已经能回看前后的细微差别',
    '记录逐渐连成属于你的面部档案',
    '持续观察，让关注点越来越清晰',
    '有了更多依据，可以更从容地提问',
    '回顾一路变化，你更了解自己的需要',
    '每一份记录，都在帮你形成自己的判断',
    '礼遇就在前方，继续保持真实记录',
    '这一程已经点亮，带着积累继续出发'
  ];
  document.getElementById('rewardHeroCopy').textContent=journeyCopy[stage];
  const hero=document.querySelector('#rewards .reward-hero');
  hero.style.setProperty('--journey-aura-opacity',(0.16+stage*0.045).toFixed(2));
  hero.style.setProperty('--journey-aura-scale',(0.9+stage*0.025).toFixed(3));
  hero.style.setProperty('--journey-shadow-blur',`${18+stage*4}px`);
  hero.dataset.journeyStage=String(stage);
  const next=rewardMilestones.find(level=>level>points);
  const claimedNodePoints=entries.filter(item=>item.kind==='milestone').reduce((sum,item)=>sum+(Number(item.points)||0),0);
  document.getElementById('rewardNext').textContent=points>=1000?`节点点数已收取 ${claimedNodePoints} / 90`:`距离 ${next} 分节点还差 ${next-points} 分`;
  const photoDone=entries.some(item=>item.key===`photo:${localRewardDate()}`);
  document.getElementById('rewardToday').textContent=todayDone
    ? photoDone?'今日记录与照片分已领取':'今日记录已 +12，写实照片还可 +3'
    : '今日首次有效记录 +12，写实照片再 +3';
  document.getElementById('rewardRecordButton').textContent=points>=1000?'已积满 · 继续记录':'记录今天的脸';
  document.getElementById('rewardPrizeSub').textContent=points>=1000
    ? '已达成演示资格 · 真实兑换待合作方接入'
    : '满 1000 分展示礼遇达成状态';
  document.getElementById('rewardNodes').innerHTML=rewardMilestones.map(level=>{
    const claimed=level===0?points>0:entries.some(item=>item.key===`milestone:${level}`);
    const reached=points>=level;
    const status=level===0?'已启程':level===1000?reached?'已达成':'终点':claimed?'已领取':reached?'可领取':'待点亮';
    const symbol=level===1000?'◇':claimed?'✓':reached?'+10':level===0?'✧':String(level);
    return `<button class="reward-node ${claimed?'done claimed':reached?'ready':''}" data-level="${level}" type="button" onclick="claimRewardMilestone(${level})" aria-label="${level===0?'启程':level===1000?'1000 分超光子礼遇':level+' 分节点'}，${status}"><span class="orb">${symbol}</span><small>${level===0?'启程':level===1000?'礼遇':level+' 分'}</small><em>${status}</em></button>`;
  }).join('');
  const reviewDone=entries.some(item=>item.key===`review:${rewardWeekKey()}`);
  const photosReady=new Set((data.photos||[]).map(photo=>photo.date)).size>=2;
  document.getElementById('rewardReviewButton').disabled=reviewDone||points>=1000;
  document.getElementById('rewardReviewButton').textContent=reviewDone?'本周已领取 +20':'保存本周回看';
  document.getElementById('rewardReviewHint').textContent=reviewDone?'下周可再次回看并积累积分':photosReady?'至少写 12 个字，每周限领一次':'需至少两次不同日期的写实照片，每周限领一次';
  const lastReview=[...entries].reverse().find(item=>item.kind==='review'&&item.note);
  const reviewSaved=document.getElementById('rewardReviewSaved');
  reviewSaved.hidden=!lastReview;
  reviewSaved.textContent=lastReview?`最近回看 · ${lastReview.note}`:'';
  updateRewardClock();
}

function updateRewardClock() {
  const el = document.getElementById('rewardLiveClock');
  if (!el) return;
  const now = new Date();
  el.textContent = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
}

function setRewardSkin(id) {
  if (!rewardSkinInfo.some(item => item.id === id)) return;
  rewardSkin = id;
  try { localStorage.setItem(rewardSkinKey, id); } catch (_) {}
  applyRewardSkin();
  renderMy();
  const info = rewardSkinInfo.find(item => item.id === id);
  showHomeToast(`已切换为「${info.name}」`);
}

function renderMy() {
  const info = rewardSkinInfo.find(item => item.id === rewardSkin) || rewardSkinInfo[2];
  document.getElementById('myCurrentSkin').textContent = `当前皮肤：${info.name}`;
  document.getElementById('skinOptions').innerHTML = rewardSkinInfo.map(item => `
    <button class="skin-choice" type="button" aria-pressed="${item.id === rewardSkin}" onclick="setRewardSkin('${item.id}')">
      <img src="${item.image}" alt="${item.name}预览图" loading="lazy">
      <span><b>${item.name}</b><small>${item.desc}</small></span>
      <span class="selected">${item.id === rewardSkin ? '已使用 ✓' : '选择'}</span>
    </button>`).join('');
}

function showRewardRules() {
  const dialog = document.getElementById('rewardRulesDialog');
  if (dialog.showModal) dialog.showModal(); else dialog.setAttribute('open','');
}
function closeRewardRules() {
  const dialog = document.getElementById('rewardRulesDialog');
  if (dialog.close) dialog.close(); else dialog.removeAttribute('open');
}
function showRewardRecordSheet() {
  const sheet = document.getElementById('rewardRecordSheet');
  sheet.classList.add('open');
  sheet.setAttribute('aria-hidden','false');
}
function closeRewardRecordSheet() {
  const sheet = document.getElementById('rewardRecordSheet');
  sheet.classList.remove('open');
  sheet.setAttribute('aria-hidden','true');
}
function openRewardRecorder(type) {
  closeRewardRecordSheet();
  rewardEntry = type;
  if (type === 'capture') go('capture');
  else openArea('皮肤总览');
}

const originalRewardSaveEvent=saveEvent;
saveEvent=function(){
  const before=data.events.length;
  originalRewardSaveEvent();
  if(data.events.length>before)awardRewardProject(data.events[0]);
};
const originalRewardClearData=clearData;
clearData=function(){
  originalRewardClearData();
  if(!localStorage.getItem(key)){
    localStorage.removeItem(rewardLedgerKey);
    if(document.getElementById('rewards')?.classList.contains('active'))renderRewards();
  }
};

const originalRewardGo = go;
go = function(id) {
  if (rewardEntry && !['rewards','capture','area'].includes(id)) rewardEntry = '';
  originalRewardGo(id);
  document.querySelectorAll('.home-nav button[data-home-nav]').forEach(button =>
    button.classList.toggle('active', button.dataset.homeNav === id));
  if (id === 'rewards') renderRewards();
  if (id === 'my') renderMy();
  syncRewardRitual();
};

updateRewardClock();
setInterval(updateRewardClock, 15000);
let displayedRewardQuarter=getRewardLedger().quarter;
setInterval(()=>{
  syncRewardRitual();
  const quarter=getRewardLedger().quarter;
  if(quarter!==displayedRewardQuarter){
    displayedRewardQuarter=quarter;
    if(document.getElementById('rewards')?.classList.contains('active'))renderRewards();
    if(typeof renderMyDashboard==='function')renderMyDashboard();
  }
},60000);
applyRewardSkin();
if (location.hash === '#rewards') renderRewards();
if (location.hash === '#my') renderMy();
document.querySelectorAll('.home-nav button[data-home-nav]').forEach(button =>
  button.classList.toggle('active', button.dataset.homeNav === location.hash.slice(1)));

// 当前单人原型的一次性演示积分；下季度仍遵循原有清零规则。
const rewardDemoGrantKey='aesthetic_reward_demo_grant_1000_2026_10_09_v1';
try{
  if(!localStorage.getItem(rewardDemoGrantKey)){
    const ledger=getRewardLedger();
    const remaining=Math.max(0,1000-getRewardProgress().points);
    if(remaining)ledger.entries.push({kind:'demo-grant',key:`demo-grant:${ledger.quarter}`,points:remaining,date:localRewardDate(),note:'原型演示赠送'});
    localStorage.setItem(rewardLedgerKey,JSON.stringify(ledger));
    localStorage.setItem(rewardDemoGrantKey,'1');
    if(document.getElementById('rewards')?.classList.contains('active'))renderRewards();
    if(typeof renderMyDashboard==='function'&&document.getElementById('my')?.classList.contains('active'))renderMyDashboard();
  }
}catch(_){/* 本地存储不可用时保持原积分，不伪造达成状态。 */}

// 修正上一版自动打钩的演示节点；真实点击领取的节点不受影响。
const rewardNodeCorrectionKey='aesthetic_reward_nodes_click_to_claim_v1';
try{
  if(!localStorage.getItem(rewardNodeCorrectionKey)){
    const ledger=getRewardLedger();
    const originalLength=ledger.entries.length;
    ledger.entries=ledger.entries.filter(item=>!(item.kind==='milestone'&&Number(item.points)===0&&item.note==='演示积分达成'));
    if(ledger.entries.length!==originalLength)localStorage.setItem(rewardLedgerKey,JSON.stringify(ledger));
    localStorage.setItem(rewardNodeCorrectionKey,'1');
    if(document.getElementById('rewards')?.classList.contains('active'))renderRewards();
  }
}catch(_){}
