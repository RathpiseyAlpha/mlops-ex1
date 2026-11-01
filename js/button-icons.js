// Keeps the play button's icon in step with its label (play, pause or run again).
(() => {
  const b = document.getElementById('playButton');
  if (!b) return;
  const set = () => {
    const t = b.textContent.trim();
    b.dataset.icon = /^Pause/.test(t) ? 'pause' : /again/i.test(t) ? 'replay' : 'play';
  };
  set();
  new MutationObserver(set).observe(b, { childList: true, characterData: true, subtree: true });
})();
