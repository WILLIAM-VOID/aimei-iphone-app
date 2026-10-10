(function(){
  const host=document.getElementById('freshNews');if(!host)return;
  const topics=[
    ['超光子适合什么肤质','皮肤管理','先了解肤质、当前炎症及光敏情况，再向正规机构咨询。'],
    ['光子嫩肤恢复期','光电项目','恢复感受因人而异，面诊时确认术后护理与防晒要求。'],
    ['玻尿酸填充风险','注射项目','了解适应情况、产品来源、操作资质与可能风险。'],
    ['热玛吉面诊准备','紧致抗衰','整理既往项目、健康信息和期待效果，便于面诊沟通。'],
    ['痘印与色沉怎么区分','皮肤观察','记录颜色、位置与持续时间，必要时请医生判断。'],
    ['毛孔管理经验','皮肤管理','观察出油、护肤和环境变化，避免仅凭照片判断。'],
    ['敏感肌能做医美吗','皮肤管理','先确认屏障状态与近期刺激反应，不适时先就医。'],
    ['医美机构资质怎么查','避坑指南','核对机构与医生执业信息，留存项目和产品资料。'],
    ['术后护理记录','变化记录','按专业人员要求护理，用相近光线记录变化。'],
    ['面部对比照怎么拍','面部档案','固定位置、角度和光线，减少拍摄条件带来的误差。'],
    ['咬肌与脸型','面部轮廓','脸型涉及骨骼、肌肉和脂肪，需面诊后讨论方案。'],
    ['超声类项目了解','紧致抗衰','确认具体设备、适用部位、风险与预期。']
  ];
  const suggestionGroups=[[0,1,2,3,4,5],[6,7,8,9,10,11],[4,9,6,2,3,0]];
  const historyKey='aesthetic_fresh_search_history_v1';
  let history=[];try{history=JSON.parse(localStorage.getItem(historyKey))||[]}catch{}
  let suggestionPage=0,suggestionsVisible=true;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const view=document.createElement('div');view.id='freshSearchView';view.className='fresh-search-view';view.setAttribute('aria-hidden','true');
  view.innerHTML=`<div class="fresh-search-status"><time id="freshSearchClock"></time><b>新鲜事</b><span>▮▮▮ 5G</span></div><div class="fresh-search-toolbar"><div class="fresh-search-field"><span aria-hidden="true">⌕</span><input id="freshSearchQuery" type="search" maxlength="50" placeholder="搜索医美话题、项目、记录" aria-label="搜索医美话题、项目、记录"><button id="freshSearchClear" type="button" aria-label="清除搜索">×</button></div><button id="freshSearchCancel" type="button">取消</button></div><div id="freshSearchBody" class="fresh-search-body"></div>`;
  host.appendChild(view);
  const query=view.querySelector('#freshSearchQuery'),body=view.querySelector('#freshSearchBody');
  function clock(){const date=new Date();view.querySelector('#freshSearchClock').textContent=`${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`}
  function saveHistory(term){history=[term,...history.filter(x=>x!==term)].slice(0,6);try{localStorage.setItem(historyKey,JSON.stringify(history))}catch{}}
  function renderLanding(){
    body.innerHTML=`${history.length?`<section class="fresh-search-history"><div class="fresh-search-title"><h2>最近搜索</h2><button data-search-action="clear-history" aria-label="清空搜索记录">清空</button></div><div class="fresh-search-chips">${history.map(term=>`<button data-search-term="${esc(term)}">${esc(term)}</button>`).join('')}</div></section>`:''}<section class="fresh-search-guesses"><div class="fresh-search-title"><h2>猜你想搜</h2><div><button data-search-action="refresh" aria-label="换一组猜你想搜">↻</button><button data-search-action="toggle" aria-label="${suggestionsVisible?'隐藏':'显示'}猜你想搜">${suggestionsVisible?'◉':'◎'}</button></div></div>${suggestionsVisible?`<div class="fresh-search-suggestions">${suggestionGroups[suggestionPage].map(i=>`<button data-search-term="${esc(topics[i][0])}">${esc(topics[i][0])}</button>`).join('')}</div>`:`<p class="fresh-search-hint">已隐藏推荐搜索</p>`}</section><section class="fresh-search-trending"><div class="fresh-search-title"><h2><span>✦</span> 医美热议</h2><small>演示话题 · 非实时排行</small></div><div class="fresh-search-rank">${topics.map((item,i)=>`<button data-search-term="${esc(item[0])}"><span class="rank-number ${i<3?'top':''}">${i+1}</span><span class="rank-text">${esc(item[0])}</span>${i===0?'<em>热</em>':''}<small>${esc(item[1])}</small></button>`).join('')}</div></section>`;
  }
  function allPosts(){let saved=[];try{saved=JSON.parse(localStorage.getItem('aesthetic_fresh_posts_v1'))||[]}catch{}return Array.isArray(saved)?saved:[]}
  function renderResults(){const term=query.value.trim();if(!term){renderLanding();return}const lower=term.toLowerCase();const matching=topics.filter(item=>item.join(' ').toLowerCase().includes(lower));const posts=allPosts().filter(item=>(item.text+' '+item.author+' '+(item.media||'')).toLowerCase().includes(lower));body.innerHTML=`<section class="fresh-search-results"><div class="fresh-search-title"><h2>“${esc(term)}”的搜索结果</h2></div><p class="fresh-search-hint">话题与本机发布的动态 · 演示内容</p>${matching.length?`<h3>相关话题</h3>${matching.map(item=>`<article class="fresh-search-result"><span>${esc(item[1])}</span><strong>${esc(item[0])}</strong><p>${esc(item[2])}</p></article>`).join('')}`:''}${posts.length?`<h3>本机动态</h3>${posts.map(item=>`<button class="fresh-search-post" data-search-post="${esc(item.id)}"><b>${esc(item.author)}</b><span>${esc(item.text.slice(0,110))}</span></button>`).join('')}`:''}${!matching.length&&!posts.length?'<div class="fresh-search-none">还没有找到相关话题或本机动态<br>试试「皮肤管理」或「面部记录」</div>':''}</section>`}
  function choose(term){query.value=term;saveHistory(term);renderResults();query.blur();body.scrollTop=0}
  window.openFreshSearch=function(){clock();renderLanding();view.classList.add('open');view.setAttribute('aria-hidden','false');query.value='';body.scrollTop=0};
  function close(){view.classList.remove('open');view.setAttribute('aria-hidden','true');query.blur()}
  view.addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;if(button.id==='freshSearchCancel'){close();return}if(button.id==='freshSearchClear'){query.value='';renderLanding();query.focus();return}if(button.dataset.searchTerm){choose(button.dataset.searchTerm);return}if(button.dataset.searchAction==='refresh'){suggestionPage=(suggestionPage+1)%suggestionGroups.length;renderLanding();return}if(button.dataset.searchAction==='toggle'){suggestionsVisible=!suggestionsVisible;renderLanding();return}if(button.dataset.searchAction==='clear-history'){history=[];try{localStorage.removeItem(historyKey)}catch{}renderLanding();return}if(button.dataset.searchPost){close();const card=[...host.querySelectorAll('.fresh-post')].find(el=>el.dataset.post===button.dataset.searchPost);if(card)card.scrollIntoView({behavior:'smooth',block:'center'})}});
  query.addEventListener('input',renderResults);query.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();if(query.value.trim())saveHistory(query.value.trim());renderResults();query.blur()}if(event.key==='Escape')close()});
  clock();setInterval(clock,15000);
})();
