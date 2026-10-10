/* 本机消息偏好设置原型，不申请系统推送权限，也不发送消息。 */
(function () {
  const key = 'aesthetic_message_settings_v1';
  const defaults = { notifications: true, official: true, social: true, sound: false, vibration: false, fontSize: 16 };
  let settings = { ...defaults };
  try {
    const stored = JSON.parse(localStorage.getItem(key) || '{}');
    settings = { ...defaults, ...stored };
  } catch (_) {}

  function apply() {
    const size = Math.max(13, Math.min(22, Number(settings.fontSize) || defaults.fontSize));
    document.documentElement.style.setProperty('--message-font-size', size + 'px');
    document.querySelectorAll('[data-message-setting]').forEach(input => {
      input.checked = Boolean(settings[input.dataset.messageSetting]);
    });
    const range = document.getElementById('messageFontRange');
    const output = document.getElementById('messageFontValue');
    if (range) range.value = String(size);
    if (output) output.value = size + ' px';
  }

  function persist() {
    try { localStorage.setItem(key, JSON.stringify(settings)); } catch (_) {}
  }

  window.saveMessageSetting = function (input) {
    settings[input.dataset.messageSetting] = input.checked;
    persist();
    window.dispatchEvent(new CustomEvent('message-settings-changed', { detail: { ...settings } }));
    if (typeof showHomeToast === 'function') showHomeToast('消息偏好已保存在本机');
  };
  window.updateMessageFontSize = function (value) {
    settings.fontSize = Math.max(13, Math.min(22, Number(value) || defaults.fontSize));
    persist();
    apply();
  };
  apply();
  window.addEventListener('pageshow', apply);
})();
