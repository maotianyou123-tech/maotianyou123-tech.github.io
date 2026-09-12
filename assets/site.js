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
function syncTeasers() { teasers.forEach(video => { video.muted = true; if (reduceMotion.matches) video.pause(); else video.play().catch(() => {}); }); }
reduceMotion.addEventListener('change', syncTeasers);
syncTeasers();
