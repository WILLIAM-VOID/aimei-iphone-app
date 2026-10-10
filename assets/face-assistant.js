(function(){
  const historyKey='aesthetic_face_assistant_chat_v1';
  const threadsKey='aesthetic_face_assistant_threads_v1';
  const route='faceAssistant';
  const page=document.getElementById(route);
  if(!page)return;
  const messagesEl=document.getElementById('faMessages');
  const scrollEl=document.getElementById('faScroll');
  const inputEl=document.getElementById('faInput');
  const consentEl=document.getElementById('faConsent');
  const welcomeEl=document.getElementById('faWelcome');
  const effects=document.createElement('div');effects.className='fa-effects';effects.setAttribute('aria-hidden','true');
  effects.innerHTML='<span class="fa-orbit"></span><span class="fa-spark"></span><span class="fa-spark"></span><span class="fa-spark"></span><span class="fa-spark"></span><span class="fa-spark"></span><span class="fa-spark"></span>';
  page.querySelector('.fa-head').prepend(effects);
  function applyStyle(){
    const appSkin=(document.body.className.match(/app-skin-(moon|star|rose|cloud|mirror)/)||[])[1];
    page.dataset.faStyle=appSkin||'rose';
  }
  applyStyle();
  let canReadRecords=false;
  let liveMode=false;
  let localToken='';
  let sending=false;
  let messages=[];
  let threads=[];
  let activeId='';
  let view='hub';
  const areas=['全部','皮肤','眼周','鼻部','唇口','下颌','脸型轮廓'];
  const hub=document.createElement('div');hub.className='fa-hub';hub.id='faHub';
  page.querySelector('.fa-head').after(hub);
  const newButton=document.createElement('button');newButton.type='button';newButton.className='fa-new-chat';newButton.textContent='＋ 新聊天';
  page.querySelector('.fa-head-row').append(newButton);
  const backButton=page.querySelector('.fa-icon-button');
  const clearButton=page.querySelector('.fa-clear');
  const topicPill=document.createElement('div');topicPill.className='fa-topic-pill';scrollEl.prepend(topicPill);
  const quickQuestions={
    '全部':['皮肤最近怎么样？','下颌线能怎么改善？','眼周可以讨论什么？','怎么记录变化？'],
    '皮肤':['最近肤色不均怎么判断？','毛孔变化该怎么记录？','光子类项目要问医生什么？','敏感时该注意什么？'],
    '眼周':['眼周暗沉可能有哪些原因？','眼袋和泪沟怎么区分？','眼周项目有哪些风险？','怎样记录眼周变化？'],
    '鼻部':['鼻部轮廓如何描述？','鼻部注射有哪些风险？','需要准备哪些角度的照片？','面诊时应问什么？'],
    '唇口':['唇形变化怎么记录？','唇部注射应关注什么风险？','口周细纹有哪些方向？','如何说清自己的目标？'],
    '下颌':['下颌线变化怎么观察？','咬肌和脂肪怎么区分？','下颌紧致有哪些方向？','面诊要准备什么？'],
    '脸型轮廓':['如何观察整体轮廓？','面部不对称怎么记录？','轮廓项目要评估什么？','怎样比较照片变化？']
  };
  function makeThread(area='全部'){
    return {id:`chat-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,title:area==='全部'?'新聊天':`${area}咨询`,area,createdAt:Date.now(),messages:[]};
  }
  function currentThread(){return threads.find(item=>item.id===activeId)}
  function persistThreads(){try{localStorage.setItem(threadsKey,JSON.stringify({activeId,threads:threads.slice(0,30)}))}catch(e){showHomeToast?.('本设备空间不足，聊天暂未保存')}}
  function renderHub(){
    hub.replaceChildren();
    const intro=document.createElement('div');intro.className='fa-hub-intro';intro.innerHTML='<small>按部位开始</small><h2>今天想聊哪里？</h2><p>每个话题单独保存，随时可以接着聊。</p>';hub.append(intro);
    const grid=document.createElement('div');grid.className='fa-area-grid';hub.append(grid);
    areas.forEach(area=>{const button=document.createElement('button');button.type='button';button.innerHTML=`<span>✧</span><b>${area}</b><small>新建对话 ›</small>`;button.addEventListener('click',()=>newChat(area));grid.append(button)});
    const title=document.createElement('h3');title.className='fa-recent-title';title.textContent='最近聊天';hub.append(title);
    if(!threads.length){const empty=document.createElement('p');empty.className='fa-recent-empty';empty.textContent='还没有聊天记录，选一个部位开始';hub.append(empty)}
    threads.forEach(thread=>{const row=document.createElement('div');row.className='fa-thread-row';const button=document.createElement('button');button.type='button';button.className='fa-thread-card';const name=document.createElement('b');name.textContent=thread.title;const meta=document.createElement('small');meta.textContent=`${thread.area} · ${thread.messages.length} 条消息`;const arrow=document.createElement('span');arrow.textContent='›';button.append(name,meta,arrow);button.addEventListener('click',()=>openThread(thread.id));const remove=document.createElement('button');remove.type='button';remove.className='fa-thread-remove';remove.textContent='×';remove.setAttribute('aria-label',`删除${thread.title}`);remove.addEventListener('click',()=>{if(thread.messages.length&&!confirm(`删除「${thread.title}」？`))return;threads=threads.filter(item=>item.id!==thread.id);if(activeId===thread.id){activeId='';messages=[]}persistThreads();renderHub()});row.append(button,remove);hub.append(row)});
  }
  function switchView(next){view=next;page.classList.toggle('fa-show-hub',next==='hub');renderHub();if(next==='chat')render();backButton.setAttribute('aria-label',next==='hub'?'返回首页':'返回聊天列表');clearButton.hidden=next==='hub'}
  function openThread(id){const thread=threads.find(item=>item.id===id);if(!thread)return;activeId=id;messages=thread.messages;persistThreads();switchView('chat')}
  function newChat(area='全部'){const thread=makeThread(area);threads.unshift(thread);activeId=thread.id;messages=thread.messages;persistThreads();switchView('chat');inputEl.focus()}
  async function refreshLiveStatus(){
    const response=await fetch('/api/assistant/status',{cache:'no-store'});
    if(!response.ok)throw new Error('助手服务暂不可用');
    const status=await response.json();
    liveMode=status?.mode==='live';
    localToken=typeof status?.localToken==='string'?status.localToken:'';
    const label=page.querySelector('.fa-head-copy small');
    const note=page.querySelector('.fa-privacy-note');
    if(label)label.textContent=liveMode?'聊聊你的脸 · 真实 AI':'聊聊你的脸 · 本地演示';
    if(note)note.textContent=liveMode?'真实 AI 仅接收本次问题；不上传照片或面部档案 · 非医疗诊断':'本地规则演示 · 未接入真实 AI · 不根据照片判断项目适用性';
    consentEl.hidden=liveMode;
    return status;
  }
  try{
    const stored=JSON.parse(localStorage.getItem(threadsKey)||'null');
    if(stored&&Array.isArray(stored.threads)){threads=stored.threads.filter(item=>item&&Array.isArray(item.messages)).slice(0,30);activeId=stored.activeId||''}
    else {const saved=JSON.parse(localStorage.getItem(historyKey)||'[]');if(Array.isArray(saved)&&saved.length){const old=makeThread('全部');old.title='之前的聊天';old.messages=saved.filter(item=>item&&['user','assistant'].includes(item.role)).slice(-40);threads=[old];activeId=old.id;persistThreads()}}
    messages=currentThread()?.messages||[];
  }catch(e){}

  function save(){
    try{const thread=currentThread();if(thread){thread.messages=messages.slice(-40);if(thread.title==='新聊天'&&messages[0]?.text)thread.title=messages[0].text.slice(0,18);threads.sort((a,b)=>(b.id===activeId)-(a.id===activeId));persistThreads()}localStorage.setItem(historyKey,JSON.stringify(messages.slice(-40)))}catch(e){
      if(typeof showHomeToast==='function')showHomeToast('本设备空间不足，聊天暂未保存');
    }
  }
  function updateClock(){
    const el=document.getElementById('faClock');
    if(el)el.textContent=new Intl.DateTimeFormat('zh-CN',{hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date());
  }
  function localProfile(){
    const result={photoCount:0,notes:[],events:[],quiz:{}};
    if(!canReadRecords)return result;
    try{
      result.photoCount=Array.isArray(data.photos)?data.photos.length:0;
      result.events=Array.isArray(data.events)?data.events.slice(-2):[];
      for(const [area,items] of Object.entries(data.areas||{})){
        if(Array.isArray(items)&&items[0]?.text)result.notes.push({area,text:String(items[0].text).slice(0,90)});
      }
    }catch(e){}
    try{result.quiz=JSON.parse(localStorage.getItem('aesthetic_appearance_answers_v2')||'{}')||{}}catch(e){}
    return result;
  }
  function topicFor(question){
    if(/下颌|下巴|咬肌|轮廓|脸型/.test(question))return {area:'下颌与下巴',name:'下颌与轮廓',direction:'可与医生讨论咬肌评估、射频紧致等方向；需先区分肌肉、脂肪、骨骼与松弛。'};
    if(/眼|黑眼圈|眼袋/.test(question))return {area:'眼周',name:'眼周',direction:'可与医生讨论眼周皮肤管理、光电或注射类方向；需要先确认色素、血管、结构和皮肤状态。'};
    if(/鼻|鼻梁|鼻尖/.test(question))return {area:'鼻部',name:'鼻部',direction:'鼻部项目需要结合侧面、既往治疗与面诊评估；本原型不判断具体注射或手术是否适合你。'};
    if(/皮肤|毛孔|痘|斑|肤色|敏感|光子|热玛吉|射频|抗衰/.test(question))return {area:'皮肤总览',name:'皮肤',direction:'可与医生讨论光电类皮肤管理、射频等方向；设备、参数与适用性需结合皮肤状态评估。'};
    if(/注射|玻尿酸|肉毒|填充/.test(question))return {area:'脸型与轮廓',name:'注射项目',direction:'注射类项目需由合格专业人员评估适应情况、既往经历和风险，本原型不判断是否适合你。'};
    if(/记录|变化|照片|报告|档案/.test(question))return {area:'皮肤总览',name:'面部记录',direction:'先在相近光线和角度下记录，再结合自述回看变化；单次照片不能可靠预测项目效果。'};
    return null;
  }
  function evidenceFor(profile,topic){
    if(!canReadRecords)return '尚未获得读取档案授权，因此只提供通用信息。';
    const parts=[];
    if(profile.photoCount)parts.push(`你保存了 ${profile.photoCount} 次面部拍摄记录；这里未进行照片识别。`);
    const note=profile.notes.find(item=>item.area===topic.area);
    if(note)parts.push(`你曾在“${note.area}”记下：“${note.text}”。`);
    const quiz=profile.quiz[topic.area];
    if(quiz?.generatedAt)parts.push(`“${topic.area}”选择题已完成，可结合报告继续讨论。`);
    if(profile.events.length)parts.push(`你记录过 ${profile.events.length} 项近期项目经历；具体时间和间隔需要再核对。`);
    return parts.length?parts.join(' '):'目前还没有正式面部记录或已完成的该部位问答；首页演示人像不作为个人分析依据。';
  }
  function responseFor(question){
    if(/术后.*(疼|痛|肿|红|热|出血)|感染|流脓|发热|视力.*(模糊|下降)|坏死|呼吸困难|剧痛|麻木加重/.test(question)){
      return {title:'出现风险信号时暂停项目建议',conclusion:'这类情况需要尽快联系接诊医生或到医疗机构评估。',basis:'你提到的症状可能需要专业检查，聊天原型无法判断原因或严重程度。',direction:'暂不推荐新的注射或仪器项目。',next:'如果症状突然加重或影响呼吸、视力，请及时就医。',risk:true};
    }
    const topic=topicFor(question);
    if(!topic){
      return {title:'本地演示的回答范围',conclusion:'这个问题暂时无法由原型可靠回答。',basis:'当前没有接入真实 AI 或医生服务，只覆盖皮肤、眼周、鼻部、下颌与记录等常见话题。',direction:'暂不生成个性化项目建议。',next:'试试下方快捷问题，或到“我的脸”补充记录。'};
    }
    const profile=localProfile();
    let conclusion=`关于${topic.name}，可以先明确你关注的变化，再讨论合适的项目方向。`;
    if(topic.name==='面部记录')conclusion='规律记录比单次照片更适合观察面部外观变化。';
    return {title:canReadRecords?'结合已授权档案整理':'通用方向 · 未读取档案',conclusion,basis:evidenceFor(profile,topic),direction:topic.direction,next:profile.photoCount||Object.keys(profile.quiz).length?'继续查看相应部位记录；具体项目请由专业医生面诊评估。':'先建立面部记录并完成该部位选择题，再回来讨论。'};
  }
  function addText(parent,tag,className,text){
    const el=document.createElement(tag);
    if(className)el.className=className;
    el.textContent=text;
    parent.appendChild(el);
    return el;
  }
  function structuredAnswer(text){
    const clean=String(text||'').replace(/\*\*/g,'').replace(/^\s*#{1,5}\s*/gm,'').replace(/^\s*[-–—]{3,}\s*$/gm,'').replace(/^\s*>\s*/gm,'').trim();
    const matches=[...clean.matchAll(/(?:^|\n)\s*(一句结论|结论|方案一|方案二|还需确认|依据|可讨论的方向|下一步)\s*[：:]\s*/g)];
    if(!matches.length)return null;
    const parts={};
    matches.forEach((match,index)=>{parts[match[1]]=clean.slice(match.index+match[0].length,index+1<matches.length?matches[index+1].index:clean.length).trim()});
    const intro=clean.slice(0,matches[0].index).trim();
    return {conclusion:parts['一句结论']||parts['结论']||intro.split(/\n\s*\n/)[0],plans:[parts['方案一'],parts['方案二']].filter(Boolean),confirm:parts['还需确认'],basis:parts['依据'],direction:parts['可讨论的方向'],next:parts['下一步'],full:clean};
  }
  function shortEnding(value){return String(value||'').replace(/\n+\s*\*?\s*仅供信息参考[\s\S]*$/,'').replace(/[。；;，,！!*\s]+$/g,'').trim()}
  function renderLiveAnswer(bubble,item){
    const result=structuredAnswer(item.text);
    if(!result||!result.conclusion){bubble.textContent=item.text||'';return}
    bubble.classList.add('fa-structured');
    addText(bubble,'div','fa-answer-kicker','给你的简答');
    addText(bubble,'h3','fa-answer-conclusion',shortEnding(result.conclusion));
    if(result.plans.length){
      const plans=addText(bubble,'div','fa-solution-list','');
      result.plans.forEach((plan,index)=>{
        const card=addText(plans,'div','fa-solution-card','');
        addText(card,'b','','方案 '+(index+1));
        addText(card,'p','',shortEnding(plan));
      });
    }
    if(result.confirm){
      const confirm=addText(bubble,'div','fa-answer-confirm','');
      addText(confirm,'b','','还需确认');
      addText(confirm,'p','',shortEnding(result.confirm));
    }
    if(result.next){
      const next=addText(bubble,'div','fa-answer-next','');
      addText(next,'b','','接下来');addText(next,'p','',shortEnding(result.next));
    }
    const details=document.createElement('details');details.className='fa-answer-details';
    addText(details,'summary','','查看完整回答');
    addText(details,'p','fa-answer-full',result.full);
    bubble.append(details);
    if(!item.policyVersion)addText(bubble,'div','fa-answer-foot','旧版回答 · 规则已更新，请重新提问核对');
    else if(item.source==='qwen-flash')addText(bubble,'div','fa-answer-foot','百炼 qwen-flash · 信息参考');
    else if(item.source==='safety-rule')addText(bubble,'div','fa-answer-foot','本地安全规则 · 未调用大模型');
  }
  function renderMessage(item){
    const line=addText(messagesEl,'div','fa-message'+(item.role==='user'?' mine':''),'');
    if(item.role==='assistant')addText(line,'span','fa-avatar','✧');
    const bubble=addText(line,'div','fa-bubble','');
    if(item.role==='user'){bubble.textContent=item.text;return}
    const answer=item.answer;
    if(!answer){
      renderLiveAnswer(bubble,item);
      return;
    }
    addText(bubble,'div','fa-answer-title',answer.title||'AI 医美小助手');
    for(const [label,value] of [['一句结论',answer.conclusion],['依据',answer.basis],['可讨论的方向',answer.direction],['下一步',answer.next]]){
      const row=addText(bubble,'div','fa-answer-row','');
      addText(row,'b','',label);
      addText(row,'p','',value||'');
    }
    addText(bubble,'div','fa-answer-foot',!item.policyVersion?'旧版回答 · 规则已更新，请重新提问核对':item.source==='qwen-flash'?'百炼 qwen-flash · 仅供信息参考，具体方案需由专业医生评估':'原型演示 · 本地规则整理，不是照片诊断或医疗建议');
  }
  function render(){
    const area=currentThread()?.area||'全部';
    topicPill.textContent=area==='全部'?'全部问题 · 独立聊天':`${area} · 独立聊天`;
    const quick=quickQuestions[area];
    if(quick)page.querySelectorAll('[data-fa-question]').forEach((button,index)=>{button.dataset.faQuestion=quick[index];button.textContent=quick[index]});
    messagesEl.replaceChildren();
    messages.forEach(renderMessage);
    if(sending){
      const line=addText(messagesEl,'div','fa-message fa-waiting','');
      addText(line,'span','fa-avatar','✧');
      const bubble=addText(line,'div','fa-bubble fa-typing','');
      bubble.setAttribute('aria-label','正在整理回答');
      bubble.innerHTML='<span></span><span></span><span></span><small>正在整理</small>';
    }
    welcomeEl.hidden=messages.length>0;
    const profile=localProfile();
    consentEl.hidden=liveMode;
    consentEl.querySelector('h3').textContent=canReadRecords?'已授权读取本地档案':'让回答更贴近你';
    consentEl.querySelector('p').textContent=canReadRecords?`本地演示可读取 ${profile.photoCount} 次正式拍摄记录、部位记录与选择题；真实 AI 目前只接收本次提问，不上传档案或照片。`:'授权只供本地演示读取记录；真实 AI 目前只接收本次提问，不上传档案或照片。';
    document.getElementById('faConsentButton').textContent=canReadRecords?'撤回授权并清空聊天':'授权读取记录';
    document.getElementById('faDeclineButton').hidden=canReadRecords;
    requestAnimationFrame(()=>{scrollEl.scrollTop=scrollEl.scrollHeight});
  }
  async function submitQuestion(question){
    const value=String(question||'').trim().slice(0,300);
    if(!value||sending)return;
    if(!currentThread())newChat();
    const sendingThreadId=activeId;
    const sendingArea=currentThread().area;
    sending=true;
    messages.push({role:'user',text:value});
    inputEl.value='';
    save();render();
    const sendButton=document.querySelector('#faForm button[type="submit"]');
    if(sendButton){sendButton.disabled=true;sendButton.setAttribute('aria-label','正在生成回答');sendButton.textContent='…'}
    let answer=null;
    if(liveMode){
      try{
        const send=()=>fetch('/api/assistant/chat',{method:'POST',headers:{'Content-Type':'application/json','X-Local-Token':localToken},body:JSON.stringify({question:sendingArea==='全部'?value:`【${sendingArea}咨询】${value}`})});
        let response=await send();
        if(response.status===403){
          const error=await response.json();
          if(error.error==='本地会话无效，请刷新页面'){
            await refreshLiveStatus();
            if(liveMode)response=await send();
            else throw new Error('真实 AI 已停用，请刷新页面');
          }else throw new Error(error.error||'真实 AI 暂不可用');
        }
        const result=await response.json();
        if(!response.ok)throw new Error(result.error||'真实 AI 暂不可用');
        answer={role:'assistant',text:result.text,source:result.source};
      }catch(error){answer={role:'assistant',text:`${error.message}。本次未自动改用本地回答，请稍后重试。`}}
    }else answer={role:'assistant',answer:responseFor(value)};
    answer.policyVersion=2;
    const target=threads.find(item=>item.id===sendingThreadId);
    sending=false;
    if(target){target.messages.push(answer);target.messages=target.messages.slice(-40);if(activeId===sendingThreadId){messages=target.messages;save();render()}else persistThreads()}
    if(sendButton){sendButton.disabled=false;sendButton.setAttribute('aria-label','发送问题');sendButton.textContent='↑'}
  }
  function clearChat(ask=true){
    if(ask&&messages.length&&!confirm('清空当前聊天？其他聊天会保留。'))return;
    messages=[];save();render();
  }
  function consent(){
    if(canReadRecords){
      canReadRecords=false;
      clearChat(false);
      if(typeof showHomeToast==='function')showHomeToast('已撤回读取授权并清空聊天');
      return;
    }
    canReadRecords=true;
    render();
    if(typeof showHomeToast==='function')showHomeToast('已授权读取本设备的记录与选择题答案');
  }
  function open(){
    applyStyle();go(route);switchView('hub');updateClock();
    page.classList.remove('fa-entering');
    void page.offsetWidth;
    page.classList.add('fa-entering');
    window.setTimeout(()=>page.classList.remove('fa-entering'),650);
  }
  window.openFaceAssistant=open;
  window.clearFaceAssistantChat=clearChat;
  window.toggleFaceAssistantConsent=consent;
  window.askFaceAssistant=submitQuestion;
  window.resetFaceAssistantState=function(){messages=[];threads=[];activeId='';canReadRecords=false;localStorage.removeItem(threadsKey);switchView('hub')};
  window.faceAssistantBack=function(){if(view==='chat')switchView('hub');else go('home')};
  newButton.addEventListener('click',()=>newChat());
  backButton.onclick=window.faceAssistantBack;
  document.getElementById('faForm').addEventListener('submit',event=>{event.preventDefault();submitQuestion(inputEl.value)});
  document.querySelectorAll('[data-fa-question]').forEach(button=>button.addEventListener('click',()=>submitQuestion(button.dataset.faQuestion)));
  document.getElementById('faDeclineButton').addEventListener('click',()=>{consentEl.hidden=true});
  const previousGo=go;
  go=function(id){previousGo(id);if(id===route){applyStyle();render();updateClock()}};
  window.addEventListener('hashchange',()=>{if(location.hash==='#'+route&&!page.classList.contains('active'))go(route)});
  if(location.protocol==='http:'||location.protocol==='https:'){
    refreshLiveStatus().catch(()=>{});
  }
  updateClock();setInterval(updateClock,15000);
  switchView('hub');
})();
