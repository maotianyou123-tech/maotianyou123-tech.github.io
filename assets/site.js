'use strict';

const emailPicker = document.querySelector('.email-picker');
if (emailPicker) {
  const emailToggle = emailPicker.querySelector('summary');
  const closeEmails = (restoreFocus = false) => {
    emailPicker.open = false;
    if (restoreFocus) emailToggle.focus();
  };
  document.addEventListener('click', event => {
    if (emailPicker.open && !emailPicker.contains(event.target)) closeEmails();
  });
  document.addEventListener('focusin', event => {
    if (emailPicker.open && !emailPicker.contains(event.target)) closeEmails();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && emailPicker.open) {
      event.preventDefault();
      closeEmails(true);
    }
  });
  emailPicker.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeEmails(true)));
}

const dialog = document.querySelector('#video-dialog');
const player = dialog.querySelector('.video-player');
let videoTrigger;
document.querySelectorAll('[data-video-src]').forEach(button => button.addEventListener('click', () => {
  videoTrigger = button;
  const {videoSrc, videoType, videoTitle, videoDescription, videoOriginal, videoPoster} = button.dataset;
  dialog.querySelector('#video-title').textContent = videoTitle;
  dialog.querySelector('.video-caption').textContent = videoDescription || '';
  dialog.querySelector('.video-fallback').href = videoOriginal;
  if (videoType === 'mp4') {
    const video = document.createElement('video');
    video.controls = true;
    video.playsInline = true;
    video.preload = 'metadata';
    if (videoPoster) video.poster = videoPoster;
    video.src = videoSrc;
    video.addEventListener('error', () => {
      dialog.querySelector('.video-caption').textContent = '视频暂时无法播放，请检查文件是否可访问，或使用下方链接打开。';
    });
    player.replaceChildren(video);
  } else {
    const frame = document.createElement('iframe');
    frame.title = videoTitle;
    frame.allow = 'fullscreen; picture-in-picture; encrypted-media';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.src = videoSrc;
    player.replaceChildren(frame);
  }
  document.querySelectorAll('.teaser-video').forEach(video => video.pause());
  dialog.showModal();
  document.body.style.overflow = 'hidden';
}));
dialog.querySelector('.close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  const rect = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
});
dialog.addEventListener('close', () => {
  const video = player.querySelector('video');
  if (video) video.pause();
  player.replaceChildren();
  document.body.style.overflow = '';
  videoTrigger?.focus();
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.teaser-video').forEach(video => video.play().catch(() => {}));
  }
});

// Match the reference GIF-style previews with silent looping local videos.
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const teasers = [...document.querySelectorAll('.teaser-video')];
const nearViewport = new Set();
function syncTeasers() {
  teasers.forEach(video => {
    video.muted = true;
    if (!nearViewport.has(video) || (reduceMotion.matches && !video.controls)) { video.pause(); return; }
    video.autoplay = !reduceMotion.matches;
    if (!video.getAttribute('src') && video.dataset.previewSrc) video.src = video.dataset.previewSrc;
    if (!reduceMotion.matches && (!video.controls || !video.dataset.started)) {
      video.dataset.started = 'true';
      video.play().catch(() => {});
    }
  });
}
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.isIntersecting ? nearViewport.add(entry.target) : nearViewport.delete(entry.target));
    syncTeasers();
  }, {rootMargin: '240px 0px'});
  teasers.forEach(video => observer.observe(video));
} else { teasers.forEach(video => nearViewport.add(video)); }
reduceMotion.addEventListener('change', syncTeasers);
syncTeasers();

const citeDialog = document.querySelector('#cite-dialog');
const citationData = document.querySelector('#citation-data');
if (citeDialog && citationData) {
  const citations = JSON.parse(citationData.textContent);
  const format = citeDialog.querySelector('#cite-format');
  const text = citeDialog.querySelector('#cite-text');
  const status = citeDialog.querySelector('#cite-status');
  let activePaper, citeTrigger;
  function selectedCitation() { return citations[activePaper].formats[format.value]; }
  function updateCitation() { text.value = selectedCitation().text; status.textContent = ''; }
  document.querySelectorAll('[data-cite-id]').forEach(button => button.addEventListener('click', () => {
    activePaper = button.dataset.citeId;
    if (!citations[activePaper]) return;
    citeTrigger = button;
    citeDialog.querySelector('#cite-paper-title').textContent = citations[activePaper].title;
    updateCitation();
    citeDialog.showModal();
    document.body.style.overflow = 'hidden';
    format.focus();
  }));
  format.addEventListener('change', updateCitation);
  citeDialog.querySelector('.close-cite').addEventListener('click', () => citeDialog.close());
  citeDialog.addEventListener('click', event => {
    const r = citeDialog.getBoundingClientRect();
    if (event.target === citeDialog && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) citeDialog.close();
  });
  citeDialog.addEventListener('close', () => { document.body.style.overflow = ''; citeTrigger?.focus(); });
  citeDialog.querySelector('#copy-citation').addEventListener('click', async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text.value);
      status.textContent = 'Copied.';
    } catch {
      text.focus(); text.select();
      status.textContent = document.execCommand('copy') ? 'Copied.' : 'Select and copy the citation above.';
    }
  });
  citeDialog.querySelector('#download-citation').addEventListener('click', () => {
    const citation = selectedCitation();
    const file = new Blob([citation.text], {type: 'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url; link.download = `${activePaper}-${format.value}.${citation.extension}`;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = 'Citation downloaded.';
  });
}
