/* 消息原型：仅保留一条 AI医美助手官方演示会话，消息只在当前页面展示。 */
(function () {
  const content = document.querySelector('.content');
  if (!content || document.getElementById('messages')) return;
  const ambient = '<div class="message-ambient" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>';
  const messages = document.createElement('section');
  messages.id = 'messages';
  messages.className = 'screen device message-screen';
  messages.setAttribute('aria-label', '消息');
  messages.innerHTML = `
    <div class="message-head">
      ${ambient}
      <div class="message-status"><strong class="message-clock">--:--</strong><span class="message-island"></span><span class="message-signal">▮▮ 5G ▰</span></div>
      <div class="message-title-row"><span></span><h2>聊天</h2><button type="button" aria-label="消息设置" onclick="go('mySettings')">···</button></div>
      <div class="message-filters" role="group" aria-label="筛选会话">
        <button type="button" data-message-filter="unread">未读</button>
        <button type="button" data-message-filter="following">我关注的</button>
        <button type="button" data-message-filter="initiated">我主动的</button>
        <button type="button" data-message-filter="doctor">只看医生</button>
        <button type="button" data-message-filter="clinic">只看机构</button>
      </div>
    </div>
    <div class="message-list" id="messageList"></div>
    <p class="message-list-end" id="messageListEnd">没有更多了</p>`;
  const chat = document.createElement('section');
  chat.id = 'officialChat';
  chat.className = 'screen device official-chat-screen';
  chat.setAttribute('aria-label', '官方演示对话');
  chat.innerHTML = `
    <div class="message-head chat-head">${ambient}
      <div class="message-status"><strong class="message-clock">--:--</strong><span class="message-island"></span><span class="message-signal">▮▮ 5G ▰</span></div>
      <div class="message-title-row"><button class="message-back" type="button" aria-label="返回消息" onclick="go('messages')">‹</button><h2>AI医美助手官方</h2><button type="button" aria-label="会话说明" onclick="showHomeToast('这是原型演示对话')">···</button></div>
    </div>
    <div class="official-chat-body" id="officialChatBody">
      <span class="chat-date">今天</span>
      <div class="chat-line official"><span class="message-avatar mini" aria-hidden="true">颜<small>AI</small></span><p>欢迎使用 AI 医美助手。这里是官方演示会话，你可以在这里查看记录提醒与产品通知。</p></div>
      <div class="chat-line official"><span class="message-avatar mini" aria-hidden="true">颜<small>AI</small></span><p>想点亮美神路，可以从「我的脸」记录今天的外观变化。每天最多点亮一次。</p></div>
    </div>
    <form class="official-chat-compose" id="officialChatForm"><input id="officialChatInput" aria-label="输入演示消息" placeholder="输入演示消息，不会对外发送" autocomplete="off" maxlength="200"><button type="submit">发送</button></form>`;
  content.append(messages, chat);

  let filter = '';
  const officialReadKey='aesthetic_official_message_read_v1';
  let officialRead = false;
  try{officialRead=localStorage.getItem(officialReadKey)==='1'}catch(_){}
  const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  function updateMessageClocks() {
    const now = new Date();
    const text = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    document.querySelectorAll('.message-clock').forEach(clock => clock.textContent = text);
  }
  function updateNavBadge() {
    const badge = document.getElementById('messagesUnreadCount');
    if (!badge) return;
    badge.textContent = '1';
    let settings = {};
    try { settings = JSON.parse(localStorage.getItem('aesthetic_message_settings_v1') || '{}'); } catch (_) {}
    badge.hidden = officialRead || settings.notifications === false || settings.official === false;
  }
  function renderMessages() {
    updateMessageClocks();
    updateNavBadge();
    document.querySelectorAll('[data-message-filter]').forEach(button => {
      const active = button.dataset.messageFilter === filter;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', active);
    });
    const showOfficial = !filter || (filter === 'unread' && !officialRead);
    document.getElementById('messageList').innerHTML = showOfficial ? `
      <button type="button" class="message-conversation" onclick="openOfficialChat()">
        <span class="message-avatar" aria-hidden="true">颜<small>AI</small>${officialRead ? '' : '<em>1</em>'}</span>
        <span class="message-conversation-copy"><span class="message-conversation-top"><b>AI医美助手官方</b><time>刚刚</time></span><small>欢迎使用面部记录，开启你的美神路</small></span>
      </button>` : '';
    document.getElementById('messageListEnd').textContent = showOfficial ? '没有更多了' : '暂无此类会话';
  }
  function openOfficialChat() {
    officialRead = true;
    try{localStorage.setItem(officialReadKey,'1')}catch(_){}
    updateNavBadge();
    go('officialChat');
    const body = document.getElementById('officialChatBody');
    body.scrollTop = body.scrollHeight;
  }
  window.openOfficialChat = openOfficialChat;

  document.querySelectorAll('[data-message-filter]').forEach(button => button.addEventListener('click', () => {
    filter = filter === button.dataset.messageFilter ? '' : button.dataset.messageFilter;
    renderMessages();
  }));
  document.getElementById('officialChatForm').addEventListener('submit', event => {
    event.preventDefault();
    const input = document.getElementById('officialChatInput');
    const value = input.value.trim();
    if (!value) return;
    const line = document.createElement('div');
    line.className = 'chat-line mine';
    line.innerHTML = `<p>${escapeHtml(value)}</p>`;
    document.getElementById('officialChatBody').appendChild(line);
    input.value = '';
    line.scrollIntoView({block:'end',behavior:'smooth'});
  });

  const previousGo = go;
  go = function (id) {
    previousGo(id);
    const nav = document.querySelector('[data-home-nav="messages"]');
    if (nav) nav.classList.toggle('active', id === 'messages' || id === 'officialChat');
    if (id === 'messages') renderMessages();
    if (id === 'officialChat') updateMessageClocks();
  };
  updateMessageClocks();
  updateNavBadge();
  window.addEventListener('message-settings-changed', updateNavBadge);
  setInterval(updateMessageClocks, 15000);
  if (['messages','officialChat'].includes(location.hash.slice(1))) go(location.hash.slice(1));
})();
