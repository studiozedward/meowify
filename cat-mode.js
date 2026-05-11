// cat-mode.js — Pixel cat mascot + cat mode (image replacement)
// Separated from content.js per Meowify architecture guidelines.
(() => {
  // ===== CONFIGURATION =====
  const CONFIG = {
    cataasUrl: 'https://cataas.com/cat',
    canvasPixels: 32,
    displaySize: 64,
    reactionDuration: 2000,
    wakeUpDelay: 400,
    yawnDuration: 800,
    testTimeout: 5000,
  };

  // ===== COLOR PALETTE =====
  // Tuxedo cat — extracted from ChatGPT-generated sprite sheet
  const PALETTE = {
    '1': '#252438',
    '2': '#fafafa',
    '3': '#020f0f',
    '4': '#141426',
    '5': '#6e6e7a',
    '6': '#f4949b',
    '7': '#e9e7ed',
    '8': '#7e7d83',
    '9': '#9c9b9c',
    'a': '#c8c8cc',
    'b': '#4f2a3e',
    'c': '#b66273',
    'd': '#784e5f',
    'e': '#603a4b',
    'f': '#a25c6c',
    'g': '#df8690',
    'h': '#dc7482',
    'i': '#3e3d4e',
    'j': '#d8d8db',
    'k': '#f9d9dd',
    'l': '#f6c1c8',
    'm': '#aeacb3',
    'n': '#5c5b5f',
    'o': '#34343b',
    'p': '#212621',
    'q': '#bcbabf',
    'r': '#c66f80',
    's': '#8d565e',
    't': '#f1aeb7',
    'u': '#8a8a94',
  };

  // ===== PIXEL ART FRAMES (32x32 grids) =====
  // 0 = transparent, other chars = palette colours above
  // Tuxedo cat: dark fur body, white chest bib, white paws, green eyes
  const FRAMES = {
    sleeping: [
      '00000000000000000000000000000000',
      '00000000000000000000000000000000',
      '00000000000000000000000000000000',
      '00000000000000000000000000000000',
      '00000000000000000000000000000000',
      '00000000000000000000000000000000',
      '00000000000000000000000000000000',
      '00000000000000000000000000000000',
      '00000003330000000000033000000000',
      '00000034113000000003411300000000',
      '0000003bc114003300341dc300000000',
      '0000003e6f1143114311o6g300000000',
      '0000003e66o111111111c6g300000000',
      '0000003ehe1111111111ofh333000000',
      '00000034o1111111111111b314300000',
      '00000034111111111111111311140000',
      '00000031111111111111111411113000',
      '00000341111111111111111141114000',
      '000003411111118i1111411141111400',
      '0000034113443i254443411434111330',
      '000003411133182ao434111431114430',
      '000003341o55jk6l2u55114341144130',
      '0000000341j22292222m143111431130',
      '000000034pn5m222a8ni443433411430',
      '000000031a229nnn872ji18j51111400',
      '000000031q22q414972ai42291144300',
      '0000000034nno3434nnp33n5i4433000',
      '00000000000000000000000000000000',
      '00000000000000000000000000000000',
      '00000000000000000000000000000000',
      '00000000000000000000000000000000',
      '00000000000000000000000000000000',
    ],
    awake: [
      '00000000000000000000000000000000',
      '00000000000000000000000000000000',
      '00000000330000000000033000000000',
      '00000004443000000000344300000000',
      '00000004i143000000031oo300000000',
      '000000016d11303330411cg300000000',
      '000000016g1143114311b66300000000',
      '000000016ge111111111c66300000000',
      '00000001he11111111111dg300000000',
      '00000004o1111111111111o300000000',
      '00000034111111111111111400000000',
      '00000031113341111133311430000000',
      '00000041102o31i5143q011130000000',
      '0000004110p3348a1334011130000000',
      '00000344103331a754330o1433000000',
      '00000034111482t67ai4111430000000',
      '0000033411nm22a922a8111333000000',
      '000000034172228nj227814300000000',
      '000000003418722222an333003330000',
      '000000000341j77777i4430031133000',
      '000000000311j22222o1430031143000',
      '000000000411m2222ao1143034143000',
      '000000003441oj22jn14143334143000',
      '000000004144119ai113114341143000',
      '00000000414411pi4113114411130000',
      '0000000041i4qji4mjnoi13414330000',
      '0000000034qi22mn22q9q43433300000',
      '000000000313uu5ouuiio33300000000',
      '00000000003333333333330000000000',
      '00000000000000000000000000000000',
      '00000000000000000000000000000000',
      '00000000000000000000000000000000',
    ],
    yawning: [
      '00000000000000000000000000000000',
      '00000003330000000000333000000000',
      '00000034113000000003411300000000',
      '0000003be143003300341id300000000',
      '0000003she1133414341brh300000000',
      '0000003s664111111414g6g300000000',
      '0000003shb1111111111orh300000000',
      '0000003bo111119n111111e300000000',
      '00000031143348lli333411300000000',
      '00000311441o8khtjn11311130000000',
      '0000031111nm29bea2uo111130000000',
      '0000034418j2aeded72mn11433000000',
      '0000034482229bssbj227n4430000000',
      '00003331ia229shhbj229o4330000000',
      '00000031u2229chhej222n1303000000',
      '000000331m22mfhhd722914300000000',
      '0000000334m22uedq278433000000000',
      '00000000041877qa7an4330003000000',
      '00000000041522272m11430044300000',
      '00000000311om2227i14130041130000',
      '000000003141u722a114133031130000',
      '0000000341311n7m1144113341430000',
      '00000003114411n11141113411400000',
      '000000034ooia91ia94no43143300000',
      '000000003nuq22ia22n7i34433000000',
      '0000000033onmm18m945333300000000',
      '00000000033333333333300000000000',
      '00000000000000000000000000000000',
      '00000000000000000000000000000000',
      '00000000000000000000000000000000',
      '00000003440000000000344000000000',
      '00000031144300000034111300000000',
    ],
    reacting: [
      '00000000000000000000000000000000',
      '00000000330000000000033000000000',
      '00000003444300000000344400000000',
      '00000003eo143000000341e130000000',
      '00000003gco1434440441dge30000000',
      '00000003g6d1141114411r6e30000000',
      '00000003ggd111111111or6d30000000',
      '00000003ri11111111111ofe30000000',
      '00000003411111111111111430000000',
      '000000041bbpep1114bbbb1130000000',
      '000000314ccccs411bccccb143000000',
      '000000414ccccf48oeccccb143000000',
      '000003311bscspi284sccb1143000000',
      '00000034111spn9ltn1sb11143000000',
      '000003341414iajfj251141433000000',
      '00000003441nj2ibo77u144430000000',
      '00000000341722mh9222n14300000000',
      '00000000033ij22222j8433003330000',
      '00000000004187777754130034140000',
      '000000000341nj222an1143034143000',
      '0000000004111a222911113334143000',
      '00000000311411u2u114414341143000',
      '00000000311411454113114311130000',
      '0000000031i15a54na84i14411430000',
      '0000000034857223227n743443300000',
      '00000000034o5mm3mm8on33330000000',
      '00000000003333333333330000000000',
      '00000000000000000000000000000000',
      '00000000000000000000000000000000',
      '00000000000000000000000000000000',
      '00000000000000000000000000000000',
      '00000000000000000000000000000000',
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
        `font:bold ${9 + i * 2}px monospace;color:#2d2d44;` +
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
      'background:#fff;border:2px solid #2d2d44;border-radius:12px;' +
      "padding:8px 12px;font:12px 'Nunito',system-ui,sans-serif;color:#333;" +
      'box-shadow:0 2px 8px rgba(0,0,0,.15);max-width:220px;z-index:1';
    speechBubbleEl.textContent = text;
    // Pointer triangle
    const tri = document.createElement('div');
    tri.style.cssText =
      'position:absolute;bottom:-8px;right:20px;width:0;height:0;' +
      'border-left:6px solid transparent;border-right:6px solid transparent;' +
      'border-top:8px solid #2d2d44';
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
