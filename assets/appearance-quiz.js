(function(){
  const storageKey='aesthetic_appearance_answers_v2';
  const pointsKey='aesthetic_appearance_points_v1';
  const profiles={
    '皮肤总览':{intro:'从肤感、可见变化和持续时间开始',questions:[
      {id:'focus',title:'目前最想改善哪种皮肤外观？',options:[['tone','肤色不均或色斑','tone'],['texture','毛孔与纹理','texture'],['dry','干燥粗糙','dry'],['none','暂时没有','']]},
      {id:'feel',title:'最近的皮肤感受更接近哪一种？',options:[['steady','基本稳定',''],['tight','洗脸后紧绷','dry'],['oily','容易出油','texture'],['irritated','泛红或刺痛','risk']]},
      {id:'change',title:'这种变化持续了多久？',options:[['new','最近出现',''],['months','已有几个月',''],['long','一直如此',''],['unclear','说不清','']]}
    ]},
    '额头':{intro:'关注表情时的纹路与额头质感',questions:[
      {id:'focus',title:'额头最在意哪一处？',options:[['expression','抬眉时的纹路','lines'],['rest','放松时也有纹路','lines'],['surface','额头纹理','texture'],['none','没有特别在意','']]},
      {id:'motion',title:'纹路在什么状态更明显？',options:[['raise','抬眉时','lines'],['rest','不做表情时','lines'],['hidden','刘海遮挡看不清',''],['unclear','暂不确定','']]},
      {id:'goal',title:'你更希望了解哪类改变？',options:[['soften','纹路更柔和','lines'],['smooth','表面更平整','texture'],['firm','额头更紧致','laxity'],['keep','保持自然状态','']]}
    ]},
    '眉部':{intro:'记录眉位、眉间和两侧差异',questions:[
      {id:'focus',title:'眉部最想记录什么？',options:[['between','眉间纹路','lines'],['height','眉位高低','laxity'],['balance','两侧眉形差异','shape'],['none','暂无明显变化','']]},
      {id:'expression',title:'何时最容易看到差异？',options:[['frown','皱眉时','lines'],['rest','自然表情时','shape'],['photo','不同角度时',''],['unsure','还不确定','']]},
      {id:'goal',title:'更接近你的期待的是？',options:[['lines','眉间更平滑','lines'],['position','眉周更利落','laxity'],['balance','两侧更协调','shape'],['natural','维持原样','']]}
    ]},
    '眼周':{intro:'区分明暗、浮肿、纹理与凹陷诉求',questions:[
      {id:'focus',title:'眼周最让你在意的是？',options:[['shadow','明暗或暗沉','tone'],['puff','浮肿感','puff'],['lines','眼周细纹','texture'],['hollow','眼下凹陷感','volume']]},
      {id:'timing',title:'这种外观何时更明显？',options:[['morning','早晨','puff'],['smile','微笑时','texture'],['all','大多数时间',''],['unsure','说不清','']]},
      {id:'priority',title:'你最希望先了解什么？',options:[['color','色泽变化','tone'],['surface','纹理变化','texture'],['shape','眼下形态','volume'],['observe','先继续观察','']]}
    ]},
    '鼻部':{intro:'记录正侧轮廓与既往鼻部经历',questions:[
      {id:'focus',title:'鼻部主要关注哪一处？',options:[['bridge','鼻梁线条','shape'],['tip','鼻尖形态','shape'],['side','侧面轮廓','structure'],['balance','两侧外观','shape']]},
      {id:'view',title:'从哪个角度更在意？',options:[['front','正面',''],['profile','侧面','structure'],['both','两个角度','structure'],['unsure','还没想好','']]},
      {id:'history',title:'鼻部近期做过项目吗？',options:[['never','没有',''],['recent','近三个月做过','risk'],['older','更早以前做过',''],['unknown','记不清','']]}
    ]},
    '唇口':{intro:'关注唇形、口周纹理与动态外观',questions:[
      {id:'focus',title:'唇口最想了解哪一项？',options:[['outline','唇部边界','shape'],['volume','唇部饱满度','volume'],['lines','口周细纹','texture'],['dry','干燥起皮','dry']]},
      {id:'expression',title:'何时更容易看到变化？',options:[['rest','自然闭口时',''],['smile','微笑时','texture'],['talk','说话时',''],['always','多数时候','']]},
      {id:'goal',title:'你更倾向于哪种方向？',options:[['outline','轮廓更清晰','shape'],['full','体积更饱满','volume'],['smooth','口周更平整','texture'],['keep','保持现状','']]}
    ]},
    '耳部':{intro:'记录左右耳的形态与可见范围',questions:[
      {id:'focus',title:'耳部最关注什么？',options:[['form','整体形态','shape'],['projection','向外突出的感觉','shape'],['balance','左右差异','shape'],['none','暂时没有','']]},
      {id:'side',title:'主要在哪一侧可见？',options:[['left','左侧',''],['right','右侧',''],['both','两侧',''],['hidden','头发遮挡较多','']]},
      {id:'change',title:'这种外观大约从何时开始？',options:[['always','一直如此',''],['recent','最近才注意到',''],['unknown','记不清',''],['none','无需处理','']]}
    ]},
    '面颊':{intro:'区分色泽、表面纹理与面颊轮廓',questions:[
      {id:'focus',title:'面颊最在意的变化是？',options:[['tone','色泽不均','tone'],['texture','毛孔或纹理','texture'],['loose','松弛感','laxity'],['fullness','饱满度变化','volume']]},
      {id:'setting',title:'在哪种状态更容易看到？',options:[['bare','自然状态',''],['smile','微笑时',''],['light','特定光线下',''],['unsure','不太确定','']]},
      {id:'priority',title:'这次更想先了解什么？',options:[['color','色泽','tone'],['surface','纹理','texture'],['firm','紧致','laxity'],['observe','先观察','']]}
    ]},
    '下颌与下巴':{intro:'记录下颌线、下脸宽度与下巴形态',questions:[
      {id:'focus',title:'下颌与下巴最关注哪一点？',options:[['line','下颌线不清晰','laxity'],['width','下脸宽度','muscle'],['chin','下巴轮廓','shape'],['under','下巴下方饱满感','laxity']]},
      {id:'view',title:'哪个角度最容易察觉？',options:[['front','正面','muscle'],['side','侧面','laxity'],['both','两个角度',''],['unsure','尚未确认','']]},
      {id:'history',title:'近三个月做过下脸项目吗？',options:[['never','没有',''],['recent','做过','risk'],['older','更早做过',''],['unknown','记不清','']]}
    ]},
    '脸型与轮廓':{intro:'从整体比例与轮廓变化建立记录',questions:[
      {id:'focus',title:'整体脸型最在意什么？',options:[['width','下脸宽度','muscle'],['line','轮廓边界','laxity'],['balance','左右协调感','shape'],['none','没有明确诉求','']]},
      {id:'angle',title:'主要在哪种视角感受到？',options:[['mirror','照镜子时',''],['front','正面影像',''],['side','侧面影像',''],['varies','角度变化较大','']]},
      {id:'goal',title:'希望优先了解哪种变化？',options:[['narrow','下脸宽度','muscle'],['firm','轮廓紧致','laxity'],['balance','整体协调','shape'],['keep','维持现状','']]}
    ]},
    '发际线与头发':{intro:'记录发际线、发量观感与变化节奏',questions:[
      {id:'focus',title:'头发最关注什么？',options:[['temple','两侧发际线','hair'],['front','前额发际线','hair'],['density','头顶部位发量','hair'],['none','暂无关注','']]},
      {id:'change',title:'这种变化大约持续多久？',options:[['short','最近数周',''],['months','几个月',''],['years','更久',''],['unknown','记不清','']]},
      {id:'priority',title:'下一步更想做什么？',options:[['track','规律记录',''],['reason','了解可能原因','hair'],['plan','了解可选项目','hair'],['wait','暂不处理','']]}
    ]}
  };
  let answers={},awards={};
  try{answers=JSON.parse(localStorage.getItem(storageKey)||'{}')||{}}catch(e){}
  try{awards=JSON.parse(localStorage.getItem(pointsKey)||'{}')||{}}catch(e){}
  let finishTimer,justEarnedArea='';
  const profile=()=>profiles[currentArea]||profiles['皮肤总览'];
  const questions=()=>profile().questions;
  const entry=()=>answers[currentArea]||{values:{},generatedAt:null};
  const safe=value=>esc(value);
  const label=(question,value)=>question.options.find(option=>option[0]===value)?.[1]||'';
  const tagTitle={focus:'关注',feel:'肤感',change:'时长',motion:'表情',goal:'目标',expression:'表情',timing:'时段',priority:'优先',view:'角度',history:'经历',side:'侧别',setting:'场景',angle:'视角'};
  const save=()=>localStorage.setItem(storageKey,JSON.stringify(answers));
  function syncPoints(){const el=document.getElementById('rewardPoints');if(el&&typeof getRewardProgress==='function')el.textContent=getRewardProgress().points}
  function icon(){return '<svg class="appearance-check-svg" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="16"></circle><path d="m12 20 5 5 11-12"></path></svg>'}
  function renderButton(animate=false){
    const button=document.getElementById('appearanceGenerate'),state=entry(),done=questions().filter(q=>state.values[q.id]).length;
    if(!button)return;
    button.disabled=!state.generatedAt&&done!==questions().length;
    if(state.generatedAt){
      button.classList.add('is-success');
      const hasPoints=typeof getRewardProgress==='function'&&getRewardProgress().entries.some(item=>item.key===`quiz:${currentArea}`);
      button.innerHTML=justEarnedArea===currentArea?`${icon()}<span>美神点 <b>+10</b></span>`:hasPoints?`${icon()}<span>美神点 10 · 已领取</span>`:`${icon()}<span>报告已生成</span>`;
      button.setAttribute('aria-label','已完成本部位问答，点击修改答案');
      if(animate){button.classList.remove('animate-check');void button.offsetWidth;button.classList.add('animate-check')}
      else button.classList.remove('animate-check');
    }else{
      button.classList.remove('is-success','animate-check','is-loading');
      button.textContent='生成我的外观报告';
      button.removeAttribute('aria-label');
    }
  }
  function updateProgress(){
    const state=entry(),done=questions().filter(q=>state.values[q.id]).length;
    document.getElementById('appearanceProgress').textContent=`${done}/${questions().length}`;
    document.getElementById('appearanceQuizIntro').textContent=profile().intro;
    const reset=document.getElementById('appearanceReset');
    reset.disabled=done===0;
    reset.textContent=state.generatedAt?'修改':'重置';
    reset.setAttribute('aria-label',state.generatedAt?'修改本部位答案':'重置本部位答案');
    renderButton();
  }
  function buildQuiz(){
    const holder=document.getElementById('appearanceQuestions');if(!holder)return;
    const state=entry();
    holder.innerHTML=questions().map((q,index)=>`<fieldset class="appearance-question"><legend>${index+1}. ${safe(q.title)}</legend><div class="appearance-options">${q.options.map(([value,title])=>`<label><input type="radio" name="appearance-${safe(currentArea)}-${q.id}" value="${safe(value)}" data-question="${q.id}" ${state.values[q.id]===value?'checked':''}><span>${safe(title)}</span></label>`).join('')}</div></fieldset>`).join('');
    holder.dataset.area=currentArea;
    holder.inert=Boolean(state.generatedAt);
    holder.setAttribute('aria-hidden',state.generatedAt?'true':'false');
    document.getElementById('appearanceQuiz').classList.toggle('is-complete',Boolean(state.generatedAt));
    updateProgress();
  }
  function selectedTags(values){
    return new Set(questions().flatMap(q=>{const value=values[q.id];return(q.options.find(option=>option[0]===value)?.[2]||'').split(' ').filter(Boolean)}));
  }
  function selectProjects(values){
    const tags=selectedTags(values);
    if(tags.has('risk'))return {reason:'你记录了近期治疗或需要先确认的皮肤感受，建议先由医生评估当前状态。',items:[]};
    if(![...tags].some(tag=>tag!=='dry'&&tag!=='puff'))return {reason:'目前没有足够明确的项目目标，先记录变化并在需要时咨询专业人员。',items:[]};
    const matchers={tone:/强脉冲光/,texture:/点阵激光/,lines:/肉毒毒素|点阵激光/,laxity:/射频紧致/,volume:/透明质酸(?!鼻部)/,muscle:/咬肌/,shape:/鼻部方案面诊|透明质酸唇部填充|咬肌/,structure:/鼻部方案面诊/};
    const rules=[...tags].map(tag=>matchers[tag]).filter(Boolean);
    const source=previewCatalog[currentArea]?.projects||[];
    const items=source.filter(item=>rules.some(rule=>rule.test(item.name))&&!(currentArea==='鼻部'&&/填充/.test(item.name))).slice(0,2);
    if(items.length)return {reason:'以下方向与你选择的关注点相关，适用性尚未判定。',items};
    if(currentArea==='耳部')return {reason:'耳部形态需要现场观察，先了解专科评估方向。',items:[{type:'专科评估',name:'耳部形态面诊',effect:'明确外观目标后，再由医生讨论是否需要医疗美容项目。'}]};
    if(currentArea==='发际线与头发')return {reason:'毛发变化需要结合头皮与病史，先了解专科评估方向。',items:[{type:'专科评估',name:'毛发与头皮评估',effect:'明确变化原因后，再讨论是否需要相关治疗。'}]};
    return {reason:'现有信息不足以对应到具体项目，可以带着这份记录与医生讨论。',items:[]};
  }
  function renderOutput(){
    const state=entry(),report=document.getElementById('appearanceReport'),cards=document.getElementById('projectCards');if(!report||!cards)return;
    const head=document.querySelector('.project-head span');
    if(!state.generatedAt){
      report.hidden=true;head.textContent='根据自述 · 原型演示';
      cards.innerHTML=`<article class="suggestion no-suggestion"><span class="type">等待自述报告</span><h4>完成上方 ${questions().length} 题后查看项目方向</h4><p>项目卡会按当前部位的答案更新。</p></article>`;
      return;
    }
    const values=state.values,selection=selectProjects(values);
    report.hidden=false;
    document.getElementById('appearanceReportTags').innerHTML=questions().map(q=>`<span>${tagTitle[q.id]||'记录'}：${safe(label(q,values[q.id]))}</span>`).join('');
    const focus=[...new Set(questions().flatMap(q=>{
      const option=q.options.find(item=>item[0]===values[q.id]);
      return option?.[2]&&!/^(risk|dry|puff)$/.test(option[2])?[option[1]]:[];
    }))];
    document.getElementById('appearanceReportMain').textContent=`${currentArea}：${focus.length?`你记录了${focus.slice(0,2).join('、')}`:'你选择先持续观察'}。${selection.reason}`;
    document.getElementById('appearanceReportNote').textContent='报告来自你的选择，不代表照片识别或医学诊断；项目是否适合及风险需由执业医师面诊确认。';
    head.textContent='来自自述报告 · 需面诊';
    cards.innerHTML=selection.items.length?selection.items.map(item=>`<article class="suggestion"><span class="type">${safe(item.type)} · 了解方向</span><h4>${safe(item.name)}</h4><dl><dt>与你的记录相关</dt><dd>${safe(focus.slice(0,2).join('、')||'当前部位关注点')}</dd><dt>适用程度</dt><dd>未判定 · 需面诊评估</dd><dt>可能的效果方向</dt><dd>${safe(item.effect)}</dd></dl></article>`).join(''):`<article class="suggestion no-suggestion"><span class="type">暂不排列项目</span><h4>先确认当前状态</h4><p>${safe(selection.reason)}</p></article>`;
  }
  function renderAppearanceQuiz(){if(!document.getElementById('appearanceQuestions'))return;buildQuiz();renderOutput();syncPoints()}
  document.getElementById('appearanceQuestions')?.addEventListener('change',event=>{
    const input=event.target.closest('input[data-question]');if(!input)return;
    clearTimeout(finishTimer);
    const state=entry();answers[currentArea]={values:{...state.values,[input.dataset.question]:input.value},generatedAt:null};
    save();document.getElementById('appearanceQuiz').classList.remove('is-complete','is-completing');updateProgress();renderOutput();
  });
  document.getElementById('appearanceGenerate')?.addEventListener('click',()=>{
    const state=entry(),quiz=document.getElementById('appearanceQuiz'),button=document.getElementById('appearanceGenerate');
    if(state.generatedAt){justEarnedArea='';answers[currentArea]={...state,generatedAt:null};save();renderAppearanceQuiz();return}
    if(questions().some(q=>!state.values[q.id]))return;
    const area=currentArea;
    quiz.classList.add('is-completing');document.getElementById('appearanceQuestions').inert=true;
    document.getElementById('appearanceQuestions').setAttribute('aria-hidden','true');
    button.classList.add('is-loading');button.innerHTML='<span class="appearance-spinner" aria-hidden="true"></span><span>正在生成</span>';
    button.disabled=true;
    clearTimeout(finishTimer);
    finishTimer=setTimeout(()=>{
      answers[area]={...state,generatedAt:new Date().toISOString()};save();
      const earned=!awards[area]&&typeof awardRewardQuiz==='function'&&awardRewardQuiz(area)>0;
      if(earned){awards[area]=10;localStorage.setItem(pointsKey,JSON.stringify(awards))}
      justEarnedArea=earned?area:'';
      if(currentArea===area){
        quiz.classList.remove('is-completing');quiz.classList.add('is-complete');
        updateProgress();renderButton(true);renderOutput();
      }
      syncPoints();
      if(typeof recordRewardDay==='function')recordRewardDay('quiz');
    },720);
  });
  document.getElementById('appearanceReset')?.addEventListener('click',()=>{
    clearTimeout(finishTimer);
    document.getElementById('appearanceQuiz').classList.remove('is-completing');
    const state=entry();justEarnedArea='';
    if(state.generatedAt)answers[currentArea]={...state,generatedAt:null};else delete answers[currentArea];
    save();renderAppearanceQuiz();
  });
  const originalRender=render;
  render=function(){originalRender();renderAppearanceQuiz()};
  const originalClearData=clearData;
  clearData=function(){originalClearData();if(!localStorage.getItem(storageKey)&&!localStorage.getItem(pointsKey)){answers={};awards={};renderAppearanceQuiz()}};
  renderAppearanceQuiz();
})();
