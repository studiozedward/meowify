// Meowify content script - v11 with counters
(() => {
  const VOCAB = ["meow","mew","mrow","maww","purr","mrp","miau","mya","MEOW","MEW","MROW","MAWW","PURR","MRP","MIAU","MYA"];
  const MAP = Object.fromEntries(VOCAB.map((w,i)=>[w,i]));

  const encode = s => { const b=new TextEncoder().encode(s), o=[]; for(const x of b) o.push(VOCAB[x>>4],VOCAB[x&15]); return o.join(' '); };
  const normalize = s => s.replace(/[​-‍﻿]/g,'').trim().replace(/\s+/g,' ');
  const decode = m => { const t=normalize(m).split(' '); if(t.length<2||t.length%2) return null; const n=[]; for(const w of t){const v=MAP[w]; if(v===undefined) return null; n.push(v);} const bytes=[]; for(let i=0;i<n.length;i+=2) bytes.push((n[i]<<4)|n[i+1]); try{return new TextDecoder('utf-8',{fatal:true}).decode(new Uint8Array(bytes));}catch{return null;} };

  const isMeow = s => {
    const n = normalize(s);
    const sample = n.length > 200 ? n.slice(0, 200) : n;
    const t = sample.split(' ');
    if (n.length > 200) t.pop();
    if (t.length < 4) return false;
    const check = Math.min(8, t.length);
    for (let i = 0; i < check; i++) if (MAP[t[i]] === undefined) return false;
    return true;
  };

  let btn = null;
  const last = { text: '', input: null, edit: null, offsets: null, selStart: 0, selEnd: 0 };

  const ensureStyles = () => {
    if (document.getElementById('meowify-styles')) return;
    const s = document.createElement('style');
    s.id = 'meowify-styles';
    s.textContent = `
      @font-face {
        font-family: 'Nunito';
        font-style: normal;
        font-weight: 400 700;
        font-display: swap;
        src: url('${chrome.runtime.getURL('nunito-latin.woff2')}') format('woff2');
      }
      @keyframes meowify-gradient-shift {
        0%   { background-position: 0% 50%; }
        50%  { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
    `;
    document.head.appendChild(s);
  };
  ensureStyles();

  const ensureBtn = () => { if (btn) return btn; btn = document.createElement('button'); btn.id = 'meowify-float'; btn.style.cssText = 'position:absolute;z-index:2147483647;padding:6px 10px;font:600 12px \'Nunito\',system-ui,sans-serif;color:#fff;background:linear-gradient(135deg,#f8bbd0,#ce93d8);border:none;border-radius:999px;box-shadow:0 4px 12px rgba(0,0,0,.15);cursor:pointer;display:none'; btn.onmousedown = e => e.preventDefault(); btn.onclick = () => openModal(btn.dataset.mode); document.body.appendChild(btn); return btn; };
  const showBtn = (x, y, m) => { const b = ensureBtn(); b.dataset.mode = m; b.textContent = m === 'meow' ? 'Meowify 🐱' : 'Unmeowify 🐱'; b.style.left = x + 'px'; b.style.top = y + 'px'; b.style.display = 'block'; };
  const hideBtn = () => { if (btn) btn.style.display = 'none'; };
  const getEdit = r => { if (!r) return null; const n = r.startContainer; const el = n.nodeType === 1 ? n : n.parentElement; return el?.closest('[contenteditable="true"],[role="textbox"]'); };

  // Store character offsets within editor's textContent (stable across React re-renders)
  function getTextOffset(editor, range) {
    if (range.startContainer.nodeType !== Node.TEXT_NODE || range.endContainer.nodeType !== Node.TEXT_NODE) return null;
    const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
    let offset = 0, start = -1, end = -1, node;
    while (node = walker.nextNode()) {
      if (start === -1 && node === range.startContainer) start = offset + range.startOffset;
      if (node === range.endContainer) { end = offset + range.endOffset; break; }
      offset += node.length;
    }
    return (start >= 0 && end >= 0) ? { start, end } : null;
  }

  // Rebuild a DOM selection from character offsets by walking fresh text nodes
  function setSelectionByOffset(editor, start, end) {
    const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
    let offset = 0, startSet = false, endSet = false, node;
    const range = document.createRange();
    while (node = walker.nextNode()) {
      const nodeEnd = offset + node.length;
      if (!startSet && start < nodeEnd) { range.setStart(node, start - offset); startSet = true; }
      if (startSet && end <= nodeEnd) { range.setEnd(node, end - offset); endSet = true; break; }
      offset = nodeEnd;
    }
    if (!startSet || !endSet) return false;
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    return true;
  }

  function doReplace(txt) {
    if (last.input) {
      const el = last.input;
      el.focus();
      el.setRangeText(txt, last.selStart, last.selEnd, 'end');
      el.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }
    if (last.edit) {
      if (!document.contains(last.edit)) return;
      const el = last.edit;
      el.focus();
      let ok = false;
      // Try offset-based rebuild (handles React re-renders)
      if (last.offsets) {
        ok = setSelectionByOffset(el, last.offsets.start, last.offsets.end);
        if (ok && window.getSelection().toString() !== last.text) ok = false;
      }
      // Fallback: find the text by searching
      if (!ok) {
        const idx = el.textContent.indexOf(last.text);
        if (idx >= 0) ok = setSelectionByOffset(el, idx, idx + last.text.length);
      }
      if (!ok) return;
      document.execCommand('insertText', false, txt);
    }
  }

  function parseLinks(text) {
    const frag = document.createDocumentFragment();
    const parts = text.split(/\[([^\]]+)\]\(([^)]+)\)/);
    for (let i = 0; i < parts.length; i++) {
      if (i % 3 === 0) { if (parts[i]) frag.appendChild(document.createTextNode(parts[i])); }
      else if (i % 3 === 1) { const url = parts[i + 1]; if (!/^https?:\/\//.test(url)) { frag.appendChild(document.createTextNode(parts[i])); } else { const a = document.createElement('a'); a.textContent = parts[i]; a.href = url; a.target = '_blank'; a.rel = 'noopener'; a.style.cssText = 'color:#7c3aed;text-decoration:underline'; frag.appendChild(a); } }
    }
    return frag;
  }

  function openModal(mode) {
    hideBtn();
    ensureStyles();
    document.getElementById('meowify-overlay')?.remove();
    const ov = document.createElement('div'); ov.id = 'meowify-overlay'; ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:2147483647;display:flex;align-items:center;justify-content:center;font-family:\'Nunito\',system-ui,-apple-system,sans-serif';
    const card = document.createElement('div'); card.style.cssText = 'background:linear-gradient(135deg,#fce4ec,#f3e5f5,#e8d5f5,#ede7f6);background-size:300% 300%;animation:meowify-gradient-shift 8s ease infinite;color:#111;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.2);width:min(90vw,560px);max-height:80vh;display:flex;flex-direction:column;overflow:hidden';
    const head = document.createElement('div'); head.style.cssText = 'padding:22px 16px;border-bottom:1px solid rgba(0,0,0,.08);display:flex;align-items:center';
    const logo = document.createElement('img'); logo.src = chrome.runtime.getURL('meowify-logo.png'); logo.alt = 'Meowify'; logo.style.cssText = 'height:40px;width:auto;object-fit:contain;flex-shrink:0';
    head.appendChild(logo);
    const body = document.createElement('div'); body.style.cssText = 'padding:16px;display:flex;flex-direction:column;gap:12px';
    const subtitle = document.createElement('div'); subtitle.textContent = mode === 'meow' ? 'Meowified text' : 'Unmeowified text'; subtitle.style.cssText = 'font-size:13px;font-weight:600;color:#444;margin-bottom:4px';
    body.appendChild(subtitle);
    let res = null, ok = true;
    if (mode === 'meow') res = encode(last.text); else { res = decode(last.text); if (res === null) ok = false; }
    if (!ok) {
      const img = document.createElement('img'); img.src = chrome.runtime.getURL('confused_cat.jpg'); img.style.cssText = 'width:180px;height:180px;object-fit:cover;border-radius:12px;margin:0 auto;display:block';
      const msg = document.createElement('div'); msg.textContent = "I can't read that :("; msg.style.cssText = 'text-align:center;font-size:16px;margin-top:8px';
      body.append(img, msg);
    } else {
      const ta = document.createElement('textarea'); ta.value = res; ta.readOnly = true; ta.style.cssText = 'width:100%;min-height:60px;max-height:50vh;resize:none;padding:10px;border:1px solid rgba(0,0,0,.1);border-radius:8px;font:13px ui-monospace,monospace;color:#111;background:#fff;overflow-y:auto;box-sizing:border-box;line-height:1.4';
      body.appendChild(ta);
      requestAnimationFrame(() => { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, innerHeight * 0.5) + 'px'; });
    }
    // Report word count after successful encode
    if (ok && mode === 'meow') {
      const inputWordCount = last.text.trim().split(/\s+/).filter(Boolean).length;
      try { chrome.runtime.sendMessage({ type: 'meowified', wordCount: res.split(' ').length, inputWordCount }); } catch {}
    }
    // Counter bar + admin messages
    const stats = document.createElement('div'); stats.style.cssText = 'padding:8px 16px;border-top:1px solid rgba(0,0,0,.08);font:11px \'Nunito\',system-ui;color:#555;text-align:center;background:rgba(255,255,255,.3)';
    stats.textContent = '\u{1F30D} ···  \u{1F431} ···  \u{1F4AC} ···';
    const msgBox = document.createElement('div'); msgBox.style.cssText = 'display:none';
    (async () => {
      try {
        const timeout = new Promise((_, rej) => setTimeout(() => rej(), 3000));
        const data = await Promise.race([chrome.runtime.sendMessage({ type: 'getData' }), timeout]);
        if (data && data.counters && data.counters.totalMeowifiers != null) {
          const c = data.counters;
          stats.textContent = `\u{1F30D} ${(c.totalMeowifiers || 0).toLocaleString()} meowifiers  \u{1F431} ${(c.totalWords || 0).toLocaleString()} meows generated  \u{1F4AC} ${(c.totalInputWords || 0).toLocaleString()} words meowed`;
        } else { stats.remove(); }
        if (data && data.messages && data.messages.length) {
          msgBox.style.cssText = 'padding:8px 16px;border-top:1px solid rgba(0,0,0,.08);font:12px \'Nunito\',system-ui;color:#333;background:rgba(255,255,255,.3)';
          data.messages.forEach(m => {
            if (!m || !m.title) return;
            const line = document.createElement('div'); line.style.cssText = 'margin-bottom:4px';
            const b = document.createElement('strong'); b.textContent = m.title + ' '; line.appendChild(b);
            if (m.content) line.appendChild(parseLinks(m.content));
            msgBox.appendChild(line);
          });
        }
      } catch { stats.remove(); }
      // Show rate-limit toast if flagged
      try {
        const rl = await chrome.storage.local.get('rateLimited');
        if (rl.rateLimited) {
          const toast = document.createElement('div');
          toast.textContent = "\u{1F63A} You're meowing too fast! Counters will update shortly.";
          toast.style.cssText = 'padding:8px 16px;border-top:1px solid rgba(0,0,0,.08);font:12px \'Nunito\',system-ui;color:#7c3aed;text-align:center;background:rgba(255,255,255,.4)';
          msgBox.parentElement?.insertBefore(toast, msgBox.nextSibling);
        }
      } catch {}
    })();
    const foot = document.createElement('div'); foot.style.cssText = 'padding:12px 16px;border-top:1px solid rgba(0,0,0,.08);display:flex;gap:8px;justify-content:flex-end;background:rgba(255,255,255,.2)';
    const close = document.createElement('button'); close.textContent = 'Close'; close.style.cssText = 'padding:8px 14px;border:1px solid rgba(0,0,0,.12);border-radius:8px;background:rgba(255,255,255,.7);color:#111;cursor:pointer;font-family:inherit;font-size:13px'; close.onclick = () => ov.remove(); foot.appendChild(close);
    if (ok) {
      const copy = document.createElement('button'); copy.textContent = 'Copy'; copy.style.cssText = 'padding:8px 14px;border:0;border-radius:8px;background:#111;color:#fff;cursor:pointer;font-family:inherit;font-size:13px'; copy.onclick = async () => { await navigator.clipboard.writeText(res); copy.textContent = 'Copied!'; setTimeout(() => copy.textContent = 'Copy', 1200); }; foot.appendChild(copy);
      if (last.input || last.edit) { const rep = document.createElement('button'); rep.textContent = 'Replace'; rep.style.cssText = 'padding:8px 14px;border:0;border-radius:8px;background:#7c3aed;color:#fff;cursor:pointer;font-family:inherit;font-size:13px'; rep.onclick = () => { doReplace(res); ov.remove(); }; foot.insertBefore(rep, copy); }
    }
    card.append(head, body, stats, msgBox, foot); ov.appendChild(card); ov.onclick = e => { if (e.target === ov) ov.remove(); }; document.body.appendChild(ov);
  }

  document.addEventListener('mouseup', () => {
    setTimeout(() => {
      const s = window.getSelection();
      const t = s.toString();
      if (!t) { hideBtn(); return; }
      last.text = t;
      const range = s.rangeCount ? s.getRangeAt(0) : null;
      if (!range) { hideBtn(); return; }
      const ae = document.activeElement;
      last.input = (ae && (ae.tagName === 'TEXTAREA' || ae.tagName === 'INPUT')) ? ae : null;
      last.edit = getEdit(range);
      last.offsets = last.edit ? getTextOffset(last.edit, range) : null;
      if (last.input) { last.selStart = last.input.selectionStart; last.selEnd = last.input.selectionEnd; }
      // Position near end of selection using last client rect
      const rects = range.getClientRects();
      if (!rects.length) { hideBtn(); return; }
      const r = rects[rects.length - 1];
      const bx = Math.min(r.right + scrollX, scrollX + innerWidth - 140);
      // Flip above selection start when near bottom of viewport (e.g. fixed chat inputs)
      const by = r.bottom + 40 > innerHeight
        ? Math.max(rects[0].top + scrollY - 40, scrollY + 8)
        : r.bottom + scrollY + 8;
      showBtn(bx, by, isMeow(t) ? 'unmeow' : 'meow');
    }, 30);
  });
  document.addEventListener('mousedown', e => { if (!e.target.closest('#meowify-float') && !e.target.closest('#meowify-overlay')) hideBtn(); });
  addEventListener('scroll', hideBtn, true);
})();
