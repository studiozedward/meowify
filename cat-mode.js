// cat-mode.js — Pixel cat mascot + cat mode (image replacement)
// Separated from content.js per Meowify architecture guidelines.
(() => {
  // ===== CONFIGURATION =====
  const CONFIG = {
    cataasUrl: 'https://cataas.com/cat',
    canvasPixels: 16,
    displaySize: 64,
    reactionDuration: 2000,
    wakeUpDelay: 400,
    yawnDuration: 800,
    testTimeout: 5000,
  };

  // ===== COLOR PALETTE =====
  const PALETTE = {
    '1': '#2d1b69',  // outline (dark purple)
    '2': '#7c3aed',  // body (purple)
    '3': '#ffffff',  // face (white)
    '4': '#f472b6',  // nose / inner ear (pink)
    '5': '#c4b5fd',  // belly (light purple)
    '6': '#ef4444',  // hearts / sparkle (red)
    '7': '#111111',  // pupils (black)
  };

  // ===== PIXEL ART FRAMES (16x16 grids) =====
  // 0 = transparent, 1-7 = palette colours above
  const FRAMES = {
    sleeping: [
      '0000000000000000',
      '0001100000110000',
      '0012210001221000',
      '0014211111241000',
      '0001222222210000',
      '0012333333221000',
      '0012311313321000',
      '0012333333321000',
      '0012333433321000',
      '0001233333210000',
      '0001222222210000',
      '0001255555210000',
      '0001225552210000',
      '0000122222101100',
      '0000011111012100',
      '0000000000001000',
    ],
    awake: [
      '0000110000110000',
      '0001221001221000',
      '0001421111241000',
      '0000122222210000',
      '0001233333321000',
      '0001373337331000',
      '0001333333331000',
      '0001333433331000',
      '0000133333310000',
      '0000012222100000',
      '0000122552210000',
      '0000125555210000',
      '0000122222210000',
      '0001210000012100',
      '0001100000001100',
      '0000000000000000',
    ],
    yawning: [
      '0000110000110000',
      '0001221001221000',
      '0001421111241000',
      '0000122222210000',
      '0001233333321000',
      '0001373337331000',
      '0001333333331000',
      '0001334443331000',
      '0000134443310000',
      '0000012222100000',
      '0000122552210000',
      '0000125555210000',
      '0000122222210000',
      '0001210000012100',
      '0001100000001100',
      '0000000000000000',
    ],
    reacting: [
      '0000110000110000',
      '0001221001221000',
      '0001421111241000',
      '0000122222210000',
      '0001233333321000',
      '0001363336331000',
      '0001333333331000',
      '0001333433331000',
      '0000133333310000',
      '0000012222100000',
      '0000122552210000',
      '0000125555210000',
      '0000122222210000',
      '0001210000012100',
      '0001100000001100',
      '0000000000000000',
    ],
  };

  // ===== STATE =====
  let enabled = false;
  let catModeActive = false;
  let activating = false;
  let currentFrame = 'sleeping';
  let originalImages = new Map();
  let container = null;
  let canvas = null;
  let ctx = null;
  let zzzWrapper = null;
  let speechBubbleEl = null;

  // ===== CSS INJECTION =====
  function ensureCatStyles() {
    if (document.getElementById('meowify-cat-styles')) return;
    const style = document.createElement('style');
    style.id = 'meowify-cat-styles';
    style.textContent = `
      @keyframes meowify-zzz {
        0%, 100% { opacity: 0; transform: translateY(0); }
        30% { opacity: 0.7; }
        50% { opacity: 1; transform: translateY(-14px); }
        70% { opacity: 0.7; }
      }
      @keyframes meowify-float-up {
        0% { opacity: 1; transform: translateY(0) scale(1); }
        100% { opacity: 0; transform: translateY(-30px) scale(0.5); }
      }
      @keyframes meowify-bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-6px); }
      }
    `;
    document.head.appendChild(style);
  }

  // ===== RENDERING =====
  function renderFrame(frameName) {
    if (!ctx) return;
    currentFrame = frameName;
    const frame = FRAMES[frameName];
    if (!frame) return;
    ctx.clearRect(0, 0, CONFIG.canvasPixels, CONFIG.canvasPixels);
    for (let y = 0; y < frame.length; y++) {
      const row = frame[y];
      for (let x = 0; x < row.length; x++) {
        const c = row[x];
        if (c === '0') continue;
        ctx.fillStyle = PALETTE[c] || '#ff00ff';
        ctx.fillRect(x, y, 1, 1);
      }
    }
    // Show zzz only when sleeping
    if (zzzWrapper) zzzWrapper.style.display = frameName === 'sleeping' ? '' : 'none';
  }

  // ===== ZZZ ANIMATION =====
  function createZzz() {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position:absolute;top:-4px;right:2px;pointer-events:none';
    ['z', 'z', 'Z'].forEach((char, i) => {
      const z = document.createElement('span');
      z.textContent = char;
      z.style.cssText =
        `position:absolute;right:${i * 7}px;bottom:${i * 4}px;` +
        `font:bold ${9 + i * 2}px monospace;color:#7c3aed;` +
        `animation:meowify-zzz 2s ease-in-out infinite;` +
        `animation-delay:${i * 0.4}s;opacity:0`;
      wrapper.appendChild(z);
    });
    return wrapper;
  }

  // ===== SPEECH BUBBLE =====
  function showSpeechBubble(text, duration) {
    if (!container) return;
    hideSpeechBubble();
    const dur = duration != null ? duration : 5000;
    speechBubbleEl = document.createElement('div');
    speechBubbleEl.style.cssText =
      `position:absolute;bottom:${CONFIG.displaySize + 14}px;right:0;` +
      'background:#fff;border:2px solid #7c3aed;border-radius:12px;' +
      "padding:8px 12px;font:12px 'Nunito',system-ui,sans-serif;color:#333;" +
      'box-shadow:0 2px 8px rgba(0,0,0,.15);max-width:220px;z-index:1';
    speechBubbleEl.textContent = text;
    // Pointer triangle
    const tri = document.createElement('div');
    tri.style.cssText =
      'position:absolute;bottom:-8px;right:20px;width:0;height:0;' +
      'border-left:6px solid transparent;border-right:6px solid transparent;' +
      'border-top:8px solid #7c3aed';
    const triInner = document.createElement('div');
    triInner.style.cssText =
      'position:absolute;bottom:-5px;right:21px;width:0;height:0;' +
      'border-left:5px solid transparent;border-right:5px solid transparent;' +
      'border-top:7px solid #fff';
    speechBubbleEl.append(tri, triInner);
    container.appendChild(speechBubbleEl);
    if (dur > 0) setTimeout(() => hideSpeechBubble(), dur);
  }

  function hideSpeechBubble() {
    if (speechBubbleEl) { speechBubbleEl.remove(); speechBubbleEl = null; }
  }

  // ===== FLOATING HEARTS =====
  function spawnHearts() {
    if (!container) return;
    for (let i = 0; i < 3; i++) {
      const heart = document.createElement('span');
      heart.textContent = '❤️';
      heart.style.cssText =
        `position:absolute;bottom:${CONFIG.displaySize}px;left:${8 + i * 18}px;` +
        `font-size:14px;pointer-events:none;` +
        `animation:meowify-float-up 1s ease-out forwards;` +
        `animation-delay:${i * 0.12}s`;
      container.appendChild(heart);
      setTimeout(() => heart.remove(), 1500);
    }
  }

  // ===== ANIMATION SEQUENCES =====
  function playWakeUp() {
    return new Promise(resolve => {
      renderFrame('awake');
      setTimeout(() => {
        renderFrame('yawning');
        setTimeout(() => {
          renderFrame('awake');
          resolve();
        }, CONFIG.yawnDuration);
      }, CONFIG.wakeUpDelay);
    });
  }

  function playGoToSleep() {
    return new Promise(resolve => {
      renderFrame('yawning');
      setTimeout(() => {
        renderFrame('sleeping');
        resolve();
      }, CONFIG.yawnDuration);
    });
  }

  function playReaction() {
    if (!canvas) return;
    renderFrame('reacting');
    spawnHearts();
    canvas.style.animation = 'meowify-bounce 0.3s ease 3';
    setTimeout(() => {
      if (!canvas) return;
      canvas.style.animation = '';
      renderFrame(catModeActive ? 'awake' : 'sleeping');
    }, CONFIG.reactionDuration);
  }

  // ===== CATAAS CONNECTIVITY TEST =====
  function testCataas() {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const timer = setTimeout(() => {
        img.onload = img.onerror = null;
        reject(new Error('Cat photos are taking too long to load'));
      }, CONFIG.testTimeout);
      img.onload = () => { clearTimeout(timer); resolve(); };
      img.onerror = () => { clearTimeout(timer); reject(new Error("Can't reach the cat photo server")); };
      img.src = `${CONFIG.cataasUrl}?t=${Date.now()}&test=1`;
    });
  }

  // ===== IMAGE REPLACEMENT =====
  async function activateCatMode() {
    if (!navigator.onLine) {
      showSpeechBubble("No internet connection! Can't fetch cats 😿");
      return false;
    }
    try {
      await testCataas();
    } catch (e) {
      showSpeechBubble(e.message + ' 😿');
      return false;
    }

    catModeActive = true;
    const images = document.querySelectorAll('img');
    let replaced = 0;

    images.forEach((img, i) => {
      // Skip our own UI elements, tiny images (icons), and data URIs
      if (img.closest('#meowify-cat-container') || img.closest('#meowify-overlay')) return;
      if (img.width < 40 || img.height < 40) return;
      if (!img.src || img.src.startsWith('data:')) return;

      originalImages.set(img, { src: img.src, srcset: img.srcset || '' });
      img.srcset = '';
      img.src = `${CONFIG.cataasUrl}?t=${Date.now()}&i=${i}`;
      replaced++;

      img.onerror = () => {
        const orig = originalImages.get(img);
        if (orig) { img.src = orig.src; img.srcset = orig.srcset; originalImages.delete(img); }
      };
    });

    if (replaced === 0) {
      showSpeechBubble('No images to replace on this page! 🐱');
      catModeActive = false;
      return false;
    }
    return true;
  }

  function deactivateCatMode() {
    catModeActive = false;
    originalImages.forEach((orig, img) => {
      if (document.contains(img)) { img.src = orig.src; img.srcset = orig.srcset; }
    });
    originalImages.clear();
  }

  // ===== CLICK HANDLER =====
  async function onCatClick(e) {
    e.stopPropagation();
    e.preventDefault();
    if (activating) return;
    hideSpeechBubble();

    if (!catModeActive) {
      activating = true;
      await playWakeUp();
      const ok = await activateCatMode();
      if (!ok) await playGoToSleep();
      activating = false;
    } else {
      deactivateCatMode();
      await playGoToSleep();
    }
  }

  // ===== DOM SETUP =====
  function createCatElement() {
    if (container) return;
    ensureCatStyles();

    container = document.createElement('div');
    container.id = 'meowify-cat-container';
    container.style.cssText =
      `position:fixed;bottom:20px;right:20px;z-index:2147483646;` +
      `cursor:pointer;width:${CONFIG.displaySize}px;height:${CONFIG.displaySize}px`;

    canvas = document.createElement('canvas');
    canvas.width = CONFIG.canvasPixels;
    canvas.height = CONFIG.canvasPixels;
    canvas.style.cssText =
      `width:${CONFIG.displaySize}px;height:${CONFIG.displaySize}px;` +
      'image-rendering:pixelated;image-rendering:crisp-edges';
    ctx = canvas.getContext('2d');

    zzzWrapper = createZzz();

    container.append(canvas, zzzWrapper);
    container.addEventListener('click', onCatClick);
    document.body.appendChild(container);
    renderFrame('sleeping');
  }

  function removeCatElement() {
    if (catModeActive) deactivateCatMode();
    if (container) { container.remove(); container = null; canvas = null; ctx = null; zzzWrapper = null; }
    hideSpeechBubble();
  }

  // ===== EVENT LISTENERS =====

  // Content script dispatches this after a successful meowify/unmeowify
  document.addEventListener('meowify-action', () => {
    if (!enabled || !container) return;
    playReaction();
  });

  // Content script dispatches this when user toggles the cat in the modal
  document.addEventListener('meowify-cat-toggle', (e) => {
    enabled = e.detail.enabled;
    try { chrome.storage.local.set({ catEnabled: enabled }); } catch {}
    if (enabled) createCatElement();
    else removeCatElement();
  });

  // ===== INIT =====
  async function init() {
    try {
      const data = await chrome.storage.local.get('catEnabled');
      enabled = data.catEnabled || false;
    } catch { enabled = false; }
    if (enabled) createCatElement();
  }

  init();
})();
