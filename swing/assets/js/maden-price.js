/* =========================================================
   MADEN 가격 · 주문 모듈
   app.js(구성 계산기) 뒤에 불러옵니다.
   페이지에서 window.MADEN_MODE = 'store' | 'order' 로 모드를 정합니다.
   ========================================================= */
(function () {
  // ---------- 가격표 (여기 숫자만 고치면 전체 반영) ----------
  const PRICE = {
    per10cm: 39900,            // 본체 10cm당 (스타일러장 포함)
    colorExtraPer10cm: { '콘크리트화이트': 7000 },
    bigDrawer: 50000,          // 큰장 서랍 1개 (대서랍)
    smallDrawer: 30000,        // 작은장 서랍 1개 (소서랍)
    powder: { PA: 680000, PB: 780000, PC: 880000 }, // 화장대(800) 1통
    mirrorDoor: 150000,        // 거울도어 1개
    innerMirror: 40000,        // 도어 안쪽 부착거울 300×1500 1개
    longShelf: 20000,          // 긴 선반 추가 1개
    shortShelf: 10000,         // 짧은 선반 추가 1개
    sidePanel: 90000,          // 측판 1개
    demolition: 100000,        // 기존장 철거 및 내림
    visitMeasure: 50000,       // 방문실측서비스
    design3d: 50000,           // 3D도면서비스
  };
  const DRAWERS = { G: 1, H: 2, I: 3 };           // 디자인별 서랍 개수 (나머지 무료)
  const COLORS = ['스완화이트', '웜화이트', '미스티그레이', '실키그레이', '콘크리트화이트'];
  // 색상 견본 (실제 자재 색에 맞게 숫자만 바꾸면 됨)
  // LX Z:IN 보르떼 / 한솔 스토리보드 견본 이미지에서 뽑은 색
  const COLOR_HEX = { '스완화이트': '#FFFFFF', '웜화이트': '#FEFCF7', '미스티그레이': '#E1DDD4', '실키그레이': '#C0B9AF', '콘크리트화이트': '#EAE5E3' };
  const CONCRETE_SRC = 'data:image/jpeg;base64,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';
  const concreteImg = new Image(); concreteImg.src = CONCRETE_SRC;
  const HANDLES = ['푸쉬', '스마트바', '레세르', '르씰'];
  // 손잡이 색상 (견본 색은 숫자만 바꾸면 됨)
  const HANDLE_COLORS = {
  };
  const hcList = h => Object.keys(HANDLE_COLORS[h] || {});
  // 레세르·스마트바는 도어 색을 따라감: 그레이 도어 → 그레이, 나머지 → 화이트
  const GRAY_DOORS = ['미스티그레이', '실키그레이'];
  const AUTO_HANDLE = { '레세르': true, '스마트바': true, '르씰': true };
  const autoTone = () => GRAY_DOORS.includes(state.color) ? '그레이' : '화이트';
  const handleName = () => state.handle + (AUTO_HANDLE[state.handle] ? `(${autoTone()})` : hcList(state.handle).length ? `(${state.hcolor})` : '');
  const STORE_URL = 'https://smartstore.naver.com/woodpecker77/products/13625382270';
  const KAKAO_URL = 'https://pf.kakao.com/_xjJTLC/chat';
  let MODE = (window.MADEN_MODE === 'order') ? 'order' : 'store';

  const won = n => Math.round(n).toLocaleString('ko-KR') + '원';
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------- 스타일 ----------
  const css = `
  .mp-card{background:#fff;border:1px solid #e5e7eb;border-radius:14px;box-shadow:0 6px 14px rgba(0,0,0,.05);padding:18px;margin-bottom:16px}
  .mp-title{font-size:17px;font-weight:700;margin:0 0 12px;color:#3f2a2a}
  .mp-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px 20px}
  @media(max-width:760px){.mp-grid{grid-template-columns:1fr}}
  .mp-field label{display:block;font-size:13px;font-weight:600;margin-bottom:6px;color:#374151}
  .mp-field select,.mp-field input[type=text],.mp-field input[type=tel],.mp-field input[type=number]{width:100%;padding:9px 10px;border:1px solid #cbd5e1;border-radius:8px;font-size:15px;background:#fff}
  .mp-chips{display:flex;flex-wrap:wrap;gap:8px}
  .mp-chip{border:1px solid #e5d6d3;border-radius:999px;padding:7px 12px;font-size:13px;cursor:pointer;background:#fff;user-select:none}
  .mp-chip.on{background:#673131;color:#fff;border-color:#673131}
  .mp-chip small{opacity:.75;margin-left:4px}
  .mp-sw{display:inline-block;width:14px;height:14px;border-radius:3px;border:1px solid rgba(0,0,0,.25);vertical-align:-2px;margin-right:6px}
  .mp-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px dashed #eee;font-size:14px}
  .mp-row:last-child{border-bottom:0}
  .mp-row .n{font-variant-numeric:tabular-nums;white-space:nowrap}
  .mp-step{display:flex;align-items:center;gap:6px}
  .mp-step button{width:30px;height:30px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;font-size:16px;cursor:pointer}
  .mp-step span{min-width:22px;text-align:center;font-variant-numeric:tabular-nums}
  .mp-total{display:flex;justify-content:space-between;align-items:baseline;margin-top:12px;padding-top:12px;border-top:2px solid #673131}
  .mp-total b{font-size:26px;color:#673131;font-variant-numeric:tabular-nums}
  .mp-note{font-size:12.5px;color:#6b7280;margin-top:8px;line-height:1.6}
  .mp-cta{display:block;width:100%;margin-top:14px;padding:15px;border:0;border-radius:12px;background:#673131;color:#fff;font-size:17px;font-weight:700;cursor:pointer;text-align:center;text-decoration:none}
  .mp-cta.kakao{background:#FEE500;color:#191919}
  .mp-cta[disabled]{opacity:.45;cursor:not-allowed}
  .mp-steps{counter-reset:s;list-style:none;padding:0;margin:0}
  .mp-steps li{counter-increment:s;position:relative;padding:10px 0 10px 36px;border-bottom:1px dashed #eee;font-size:14px;line-height:1.6}
  .mp-steps li:before{content:counter(s);position:absolute;left:0;top:10px;width:24px;height:24px;border-radius:50%;background:#fadad5;color:#673131;font-weight:700;display:flex;align-items:center;justify-content:center;font-size:13px}
  .mp-steps b.hl{color:#d12c2c}
  .mp-code{font-family:ui-monospace,Menlo,Consolas,monospace;background:#fbf6f5;border:1px solid #f0dcd8;border-radius:8px;padding:8px 10px;margin-top:6px;word-break:break-all}
  .mp-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#111;color:#fff;padding:12px 18px;border-radius:10px;font-size:14px;z-index:99;display:none;max-width:90%}
  .mp-bar{position:fixed;left:0;right:0;bottom:0;background:rgba(255,255,255,.97);border-top:1px solid #eee;padding:10px 16px;display:none;align-items:center;justify-content:space-between;gap:10px;z-index:50;backdrop-filter:blur(6px)}
  .mp-bar b{font-size:18px;color:#673131;font-variant-numeric:tabular-nums}
  .mp-bar a{background:#673131;color:#fff;border-radius:10px;padding:10px 16px;font-weight:700;text-decoration:none;font-size:14px}
  .mp-consent{display:flex;gap:8px;align-items:flex-start;font-size:13px;color:#374151;margin-top:10px}
  .mp-consent input{margin-top:3px}
  .mp-out{width:100%;min-height:200px;font-size:13px;border:1px solid #e5e7eb;border-radius:8px;padding:10px;margin-top:10px;white-space:pre-wrap}
  .mp-err{color:#b00020;font-size:13px;margin-top:8px;min-height:1em}
  .mp-photo{margin-top:14px;padding:14px;border:1px dashed #e5d6d3;border-radius:12px;background:#fbf6f5}
  .mp-photo h4{margin:0 0 6px;font-size:14px;color:#3f2a2a}
  .mp-photo ul{margin:0 0 10px;padding-left:18px;font-size:13px;color:#4b5563;line-height:1.7}
  .mp-photo-btn{display:inline-flex;align-items:center;gap:6px;padding:10px 14px;border:1px solid #673131;color:#673131;border-radius:10px;background:#fff;font-weight:600;font-size:14px;cursor:pointer}
  .mp-thumbs{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
  .mp-thumbs div{position:relative;width:72px;height:72px;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;background:#fff}
  .mp-thumbs img{width:100%;height:100%;object-fit:cover;display:block}
  .mp-thumbs button{position:absolute;top:2px;right:2px;width:22px;height:22px;border-radius:50%;border:0;background:rgba(0,0,0,.6);color:#fff;font-size:13px;line-height:22px;cursor:pointer;padding:0}
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  // ---------- 기존 화면 정리 ----------
  // 1) 기존 도어 색상 라디오는 아래 '옵션' 카드로 옮김
  document.querySelectorAll('input[name=doorColor]').forEach(r => { const box = r.closest('.mt-3'); if (box) box.style.display = 'none'; });
  // 2) 예전 장바구니 안내(통 단위) 제거
  const seq = $('seqCompact');
  if (seq) { const wrap = seq.parentElement; if (wrap) wrap.style.display = 'none'; }

  // ---------- 상태 ----------
  const state = {
    color: COLORS[0], handle: HANDLES[0], hcolor: '',
    mirror: 0, side: 0, demolition: false, visit: false, d3: false,
    longShelf: 0, shortShelf: 0, addBig: 0, addSmall: 0, innerMirror: 0,
  };

  // ---------- UI ----------
  const designCard = $('designCard');
  const optCard = document.createElement('div'); optCard.className = 'mp-card'; optCard.id = 'mpOptions'; optCard.style.display = 'none';
  const priceCard = document.createElement('div'); priceCard.className = 'mp-card'; priceCard.id = 'mpPrice'; priceCard.style.display = 'none';
  const nextCard = document.createElement('div'); nextCard.className = 'mp-card'; nextCard.id = 'mpNext'; nextCard.style.display = 'none';
  designCard.after(optCard); optCard.after(priceCard); priceCard.after(nextCard);
  const toast = document.createElement('div'); toast.className = 'mp-toast'; document.body.appendChild(toast);
  const bar = document.createElement('div'); bar.className = 'mp-bar';
  bar.innerHTML = `<div><div style="font-size:12px;color:#6b7280">예상 총 금액</div><b id="mpBarTotal">0원</b></div><a href="#mpPrice">${MODE === 'order' ? '주문하기' : '주문 방법 보기'}</a>`;
  document.body.appendChild(bar);

  function showToast(t) { toast.textContent = t; toast.style.display = 'block'; clearTimeout(showToast._t); showToast._t = setTimeout(() => toast.style.display = 'none', 3500); }

  function chip(group, val, label) {
    const on = state[group] === val;
    return `<span class="mp-chip ${on ? 'on' : ''}" data-g="${group}" data-v="${esc(val)}" role="button" tabindex="0">${label}</span>`;
  }
  function stepper(key, label, price) {
    return `<div class="mp-row"><span>${label} <small style="color:#6b7280">${won(price)}/개</small></span>
      <span class="mp-step"><button type="button" data-step="${key}" data-d="-1" aria-label="${label} 빼기">−</button><span id="mpS_${key}">${state[key]}</span><button type="button" data-step="${key}" data-d="1" aria-label="${label} 더하기">+</button></span></div>`;
  }
  function toggleRow(key, label, price) {
    return `<label class="mp-row" style="cursor:pointer"><span style="display:flex;align-items:center;gap:8px"><input type="checkbox" class="checkbox checkbox-sm" id="mpT_${key}" ${state[key] ? 'checked' : ''}>${label}</span><span class="n">${won(price)}</span></label>`;
  }

  function renderOptions() {
    optCard.innerHTML = `
      <div class="mp-title">색상 · 손잡이 · 추가 옵션</div>
      <div class="mp-field" style="margin-bottom:14px"><label>도어 색상</label><div class="mp-chips">
        ${COLORS.map(c => chip('color', c, `<i class="mp-sw" style="background:${c === '콘크리트화이트' ? `url(${CONCRETE_SRC}) center/cover` : COLOR_HEX[c]}"></i>` + c + (PRICE.colorExtraPer10cm[c] ? `<small>+10cm당 ${PRICE.colorExtraPer10cm[c].toLocaleString()}원</small>` : ''))).join('')}
      </div></div>
      <div class="mp-field" style="margin-bottom:14px"><label>손잡이</label><div class="mp-chips">
        ${HANDLES.map(h => chip('handle', h, h)).join('')}
      </div>
      ${hcList(state.handle).length ? `<div class="mp-chips" style="margin-top:8px">${hcList(state.handle).map(c => chip('hcolor', c, `<i class="mp-sw" style="background:${HANDLE_COLORS[state.handle][c]}"></i>` + c)).join('')}</div>` : ''}
      </div>
      <div class="mp-field"><label>추가 옵션 (필요할 때만)</label>
        ${stepper('mirror', '거울도어', PRICE.mirrorDoor)}
        ${stepper('innerMirror', '도어 안쪽 거울 (300×1500)', PRICE.innerMirror)}
        ${stepper('side', '측판 (벽이 없는 쪽 마감)', PRICE.sidePanel)}
      </div>
      <div class="mp-field" style="margin-top:14px"><label>내부 구성 추가 (정해진 구성 외에 더 넣고 싶을 때)</label>
        ${stepper('longShelf', '긴 선반 추가', PRICE.longShelf)}
        ${stepper('shortShelf', '짧은 선반 추가', PRICE.shortShelf)}
        ${stepper('addBig', '대서랍 추가', PRICE.bigDrawer)}
        ${stepper('addSmall', '소서랍 추가', PRICE.smallDrawer)}
      </div>
      <div class="mp-field" style="margin-top:14px"><label>서비스</label>
        ${toggleRow('demolition', '기존장 철거 및 내림', PRICE.demolition)}
        ${toggleRow('visit', '방문실측서비스', PRICE.visitMeasure)}
        ${toggleRow('d3', '3D도면서비스', PRICE.design3d)}
      </div>`;
  }
  optCard.addEventListener('click', e => {
    const c = e.target.closest('.mp-chip');
    if (c) { state[c.dataset.g] = c.dataset.v; if (c.dataset.g === 'handle') state.hcolor = hcList(state.handle)[0] || ''; renderOptions(); refresh(); if (c.dataset.g !== 'g') redrawPreview(); return; }
    const b = e.target.closest('[data-step]');
    if (b) { const k = b.dataset.step; state[k] = Math.max(0, Math.min(20, state[k] + Number(b.dataset.d))); $('mpS_' + k).textContent = state[k]; refresh(); }
  });
  optCard.addEventListener('change', e => {
    if (e.target.id === 'mpT_demolition') state.demolition = e.target.checked;
    if (e.target.id === 'mpT_visit') state.visit = e.target.checked;
    if (e.target.id === 'mpT_d3') state.d3 = e.target.checked;
    refresh();
  });

  // ---------- 미리보기 보정 (파란 점선 숨김 · 닫힌 도어에 색 입히기) ----------
  // 스마트바: 도어 사이에 세로로 들어가는 알루미늄 바 (큰장=두 문 사이, 작은장=문 오른쪽 끝)
  function drawSmartBar(isBig, x, y, w, h) {
    const ctx = $('previewCanvas').getContext('2d');
    const mm = w / (isBig ? 900 : 450);
    const bw = Math.max(3, 18 * mm);
    const bx = isBig ? x + w / 2 - bw / 2 : x + w - bw;
    const g = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    const stops = autoTone() === '그레이' ? ['#77787a', '#b4b5b6', '#9a9b9c', '#6c6d6f'] : ['#cfcfcc', '#ffffff', '#f1f1ef', '#c4c4c1'];
    [0, .35, .6, 1].forEach((o, i) => g.addColorStop(o, stops[i]));
    ctx.save(); ctx.fillStyle = g; ctx.fillRect(bx, y + h * 0.01, bw, h * 0.98); ctx.restore();
  }
  // 레세르·르씰: 문 여는 쪽 끝, 바닥에서 약 1m 높이 (큰장=두 문 가운데 양쪽, 작은장=문 오른쪽 끝)
  function drawHandle(isBig, x, y, w, h) {
    if (state.handle === '스마트바') return drawSmartBar(isBig, x, y, w, h);
    const col = autoTone() === '그레이' ? '#8b8c8e' : '#f3f3f1';
    const ctx = $('previewCanvas').getContext('2d');
    const mm = w / (isBig ? 900 : 450);
    const cy = y + h * 0.55;
    const edges = isBig ? [[x + w / 2, -1], [x + w / 2, 1]] : [[x + w, -1]]; // [모서리 x, 안쪽 방향]
    ctx.save();
    edges.forEach(([ex, dir]) => {
      if (state.handle === '레세르') {
        const len = 150 * mm, bw = Math.max(3, 22 * mm), gap = 4 * mm;
        const bx = dir < 0 ? ex - gap - bw : ex + gap;
        ctx.fillStyle = col; ctx.fillRect(bx, cy - len / 2, bw, len);
        ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(dir < 0 ? bx : bx + bw - Math.max(1, bw * .25), cy - len / 2, Math.max(1, bw * .25), len);
      } else if (state.handle === '르씰') {
        const r = Math.max(3, 17 * mm), cx = ex + dir * 55 * mm;
        ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.arc(cx + r * .15, cy + r * .2, r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1; ctx.stroke();
      }
    });
    ctx.restore();
  }
  function redrawPreview() { try { if (typeof renderPreview === 'function' && currentPlan) renderPreview(); } catch (e) {} }
  concreteImg.onload = () => { if (state.color === '콘크리트화이트') redrawPreview(); };
  (function patchPreview() {
    const cv = $('previewCanvas'); if (!cv || !cv.getContext) return;
    const ctx = cv.getContext('2d'); if (!ctx || ctx.__mpPatched) return; ctx.__mpPatched = true;
    const dash = ctx.setLineDash.bind(ctx), draw = ctx.drawImage.bind(ctx);
    // 점선 안내선은 투명하게 그려서 안 보이게
    ctx.setLineDash = function (a) { dash(a); if (a && a.length) ctx.strokeStyle = 'rgba(0,0,0,0)'; };
    // 닫힌 도어 이미지 위에 선택한 색을 곱하기로 입힘
    ctx.drawImage = function (img, ...a) {
      draw(img, ...a);
      try {
        const src = (img && img.src) || '';
        const hex = COLOR_HEX[state.color];
        if (a.length === 4 && /\/door_[^/]*$/.test(src) && hex && state.color !== COLORS[0]) {
          ctx.save(); ctx.globalCompositeOperation = 'multiply';
          let fill = hex;
          if (state.color === '콘크리트화이트' && concreteImg.complete && concreteImg.naturalWidth) {
            const pat = ctx.createPattern(concreteImg, 'repeat');
            const sc = Math.max(a[2] / concreteImg.naturalWidth, a[3] / concreteImg.naturalHeight); // 질감 한 장으로 문 전체를 덮어 이음새 없앰
            if (pat && pat.setTransform) { pat.setTransform(new DOMMatrix().translate(a[0], a[1]).scale(sc)); fill = pat; }
          }
          ctx.fillStyle = fill; ctx.fillRect(a[0], a[1], a[2], a[3]); ctx.restore();
        }
        if (a.length === 4 && /\/door_[^/]*$/.test(src)) drawHandle(/door_big/.test(src), a[0], a[1], a[2], a[3]);
      } catch (e) {}
    };
  })();

  // ---------- 계산 ----------
  function getPlan() {
    try {
      if (typeof currentPlan === 'undefined' || !currentPlan) return null;
      return { plan: currentPlan, units: units, selections: selections };
    } catch (e) { return null; }
  }

  function compute() {
    const p = getPlan(); if (!p) return null;
    const wall = p.plan.used + p.plan.leftover;
    const powderUnits = p.units.map((u, i) => ({ u, s: p.selections[i] })).filter(x => x.u.type === 'powder');
    const powderW = powderUnits.reduce((s, x) => s + x.u.w, 0);
    const qty = Math.floor((wall - powderW) / 100);
    let bigD = 0, smallD = 0;
    p.units.forEach((u, i) => {
      const n = DRAWERS[p.selections[i]] || 0;
      if (u.type === 'big') bigD += n;
      if (u.type === 'small') smallD += n;
    });
    const lines = [];
    lines.push({ k: 'body', t: `본체 ${qty}개 (10cm × ${qty}${powderW ? `, 화장대 ${powderW}mm 제외` : ''})`, a: qty * PRICE.per10cm });
    const cx = PRICE.colorExtraPer10cm[state.color] || 0;
    if (cx) lines.push({ k: 'color', t: `${state.color} (10cm당 ${cx.toLocaleString()}원 × ${qty})`, a: qty * cx });
    if (bigD) lines.push({ k: 'bigD', t: `대서랍 ${bigD}개`, a: bigD * PRICE.bigDrawer, store: '대서랍', n: bigD });
    if (smallD) lines.push({ k: 'smallD', t: `소서랍 ${smallD}개`, a: smallD * PRICE.smallDrawer, store: '소서랍', n: smallD });
    powderUnits.forEach(x => lines.push({ k: 'powder', t: `화장대 ${x.s} (800mm)`, a: PRICE.powder[x.s] || 0, notInStore: true }));
    if (state.mirror) lines.push({ k: 'mirror', t: `거울도어 ${state.mirror}개`, a: state.mirror * PRICE.mirrorDoor, store: '거울도어', n: state.mirror });
    if (state.innerMirror) lines.push({ k: 'innerMirror', t: `도어 안쪽 거울 300×1500 ${state.innerMirror}개`, a: state.innerMirror * PRICE.innerMirror, store: '도어 안쪽 거울', n: state.innerMirror });
    if (state.longShelf) lines.push({ k: 'longShelf', t: `긴 선반 추가 ${state.longShelf}개`, a: state.longShelf * PRICE.longShelf, store: '긴 선반 추가', n: state.longShelf });
    if (state.shortShelf) lines.push({ k: 'shortShelf', t: `짧은 선반 추가 ${state.shortShelf}개`, a: state.shortShelf * PRICE.shortShelf, store: '짧은 선반 추가', n: state.shortShelf });
    if (state.addBig) lines.push({ k: 'addBig', t: `대서랍 추가 ${state.addBig}개`, a: state.addBig * PRICE.bigDrawer, store: '대서랍', n: state.addBig });
    if (state.addSmall) lines.push({ k: 'addSmall', t: `소서랍 추가 ${state.addSmall}개`, a: state.addSmall * PRICE.smallDrawer, store: '소서랍', n: state.addSmall });
    if (state.side) lines.push({ k: 'side', t: `측판 ${state.side}개`, a: state.side * PRICE.sidePanel, store: '측판', n: state.side });
    if (state.demolition) lines.push({ k: 'demo', t: '기존장 철거 및 내림', a: PRICE.demolition, store: '기존장 철거 및 내림', n: 1 });
    if (state.visit) lines.push({ k: 'visit', t: '방문실측서비스', a: PRICE.visitMeasure, store: '방문실측서비스', n: 1 });
    if (state.d3) lines.push({ k: 'd3', t: '3D도면서비스', a: PRICE.design3d, store: '3D도면서비스', n: 1 });
    const total = lines.reduce((s, l) => s + l.a, 0);
    const code = buildCode(p);
    return { wall, qty, lines, total, code, surround: Math.round(p.plan.surround), units: p.units, selections: p.selections, powder: powderUnits };
  }

  function buildCode(p) {
    const dm = mm => (mm / 100).toFixed(2).replace(/\.?0+$/, '');
    const mid = p.units.map((u, i) => dm(u.w) + p.selections[i]).join('-');
    const s = dm(Math.round(p.plan.surround) * 10);
    return { full: `${s}L-${mid}-${s}R`, mid };
  }

  function unitLabel(u, sel) {
    if (u.type === 'big') return `큰장 ${u.w}(${sel})`;
    if (u.type === 'small') return `작은장 ${u.w}(${sel})`;
    if (u.type === 'styler') return `스타일러장 ${u.w}`;
    return `화장대 ${u.w}(${sel})`;
  }

  // ---------- 출력 ----------
  function renderPrice(r) {
    priceCard.innerHTML = `
      <div class="mp-title">견적 금액</div>
      <div class="mp-note" style="margin:-6px 0 8px">벽 ${r.wall.toLocaleString()}mm · 좌우 서라운드 각 ${r.surround}mm · ${state.color} · ${esc(handleName())}</div>
      ${r.lines.map(l => `<div class="mp-row"><span>${esc(l.t)}</span><span class="n">${won(l.a)}</span></div>`).join('')}
      <div class="mp-total"><span>총 금액</span><b>${won(r.total)}</b></div>
      <div class="mp-note">• 선반·옷봉 구성과 스타일러장은 본체 가격에 포함돼요.<br>• 10cm 미만 길이는 버려요. (예: 3,650mm → 36개)<br>• <b>이 금액 그대로 시공</b>되며, 현장에서 추가금이 붙지 않아요.</div>`;
    $('mpBarTotal').textContent = won(r.total);
  }

  function storeAddons(r) {
    const m = new Map(); r.lines.filter(l => l.store).forEach(l => m.set(l.store, (m.get(l.store) || 0) + l.n));
    return [...m].map(([k, n]) => `${k} ${n}개`);
  }

  function renderNextStore(r) {
    const adds = storeAddons(r);
    const powderNote = r.powder.length ? `<li>화장대는 스마트스토어에서 선택할 수 없어요. 주문 후 <b>상담팀이 화장대 금액(${won(r.powder.reduce((s, x) => s + (PRICE.powder[x.s] || 0), 0))})을 따로 안내</b>드려요.</li>` : '';
    nextCard.innerHTML = `
      <div class="mp-title">스마트스토어에서 이렇게 주문하세요</div>
      <ol class="mp-steps">
        <li>아래 버튼을 누르면 <b>구성 코드가 복사</b>되고 스토어로 돌아가요.</li>
        <li>옵션 첫 칸 <b>사이즈&디자인 구성</b>에 붙여넣기<div class="mp-code">${esc(r.code.mid)}</div></li>
        <li>컬러 <b>${esc(state.color)}</b> · 손잡이 <b>${esc(handleName())}</b> 선택</li>
        <li>수량을 <b class="hl">${r.qty}개</b>로 맞추기</li>
        ${adds.length ? `<li>추가상품 담기: <b>${adds.map(esc).join(', ')}</b></li>` : ''}
        ${powderNote}
      </ol>
      <button type="button" class="mp-cta" id="mpGoStore">구성 코드 복사하고 스토어로 돌아가기</button>
      <div class="mp-note">스토어 결제 금액이 위 견적 금액과 같은지 마지막에 한 번 확인해주세요.</div>`;
    $('mpGoStore').onclick = async () => {
      await copyText(r.code.mid);
      showToast('구성 코드를 복사했어요. 스토어 옵션 첫 칸에 붙여넣어 주세요.');
      setTimeout(() => { location.href = STORE_URL; }, 900);
    };
  }

  const orderForm = { name: '', phone: '', addr: '', date: '', memo: '', agree: false };
  function renderNextOrder(r) {
    nextCard.innerHTML = `
      <div class="mp-title">이 구성으로 주문 신청</div>
      <div class="mp-grid">
        <div class="mp-field"><label for="mpName">이름</label><input type="text" id="mpName" value="${esc(orderForm.name)}" autocomplete="name"></div>
        <div class="mp-field"><label for="mpPhone">연락처</label><input type="tel" id="mpPhone" value="${esc(orderForm.phone)}" placeholder="010-0000-0000" autocomplete="tel"></div>
        <div class="mp-field" style="grid-column:1/-1"><label for="mpAddr">설치 주소 (아파트명·동·호수)</label><input type="text" id="mpAddr" value="${esc(orderForm.addr)}" autocomplete="street-address"></div>
        <div class="mp-field"><label for="mpDate">희망 시공일</label><input type="text" id="mpDate" value="${esc(orderForm.date)}" placeholder="예) 11월 둘째 주"></div>
        <div class="mp-field"><label for="mpMemo">요청사항 (선택)</label><input type="text" id="mpMemo" value="${esc(orderForm.memo)}"></div>
      </div>
      <div class="mp-photo">
        <h4>📷 현장 사진 (추천)</h4>
        <ul>
          <li>장이 들어갈 <b>벽 정면</b> 전체가 나오게 1장</li>
          <li><b>양쪽 끝</b>(벽 모서리, 몰딩, 콘센트) 각 1장</li>
          <li><b>천장</b>(커튼박스, 스프링클러, 환기구) 1장</li>
        </ul>
        <label class="mp-photo-btn" for="mpFiles">사진 고르기</label>
        <input type="file" id="mpFiles" accept="image/*" multiple hidden>
        <span class="mp-note" id="mpFileCount" style="margin-left:8px"></span>
        <div class="mp-thumbs" id="mpThumbs"></div>
      </div>
      <label class="mp-consent"><input type="checkbox" id="mpAgree" ${orderForm.agree ? 'checked' : ''}>
        <span>[필수] 주문 상담을 위해 이름·연락처·주소를 수집하고 시공 완료 후 1년간 보관하는 데 동의합니다.</span></label>
      <div class="mp-err" id="mpErr"></div>
      <button type="button" class="mp-cta kakao" id="mpSend">① 주문서 복사하고 카카오톡 채널 열기</button>
      <div class="mp-note" id="mpSendNote"><b>① 주문서 보내기</b> 버튼을 누르면 주문서가 복사되고 <b>우드팩커 카카오톡 채널</b>이 열려요. 채팅창에 <b>붙여넣고 보내주세요.</b></div>
      <div id="mpStep2" class="mp-photo" hidden>
        <h4>② 현장 사진 보내기</h4>
        <div class="mp-note" style="margin-top:0">카카오톡 채팅방에서 <b>+ 버튼 → 앨범</b>으로 방금 고른 사진을 보내주세요.</div>
        <button type="button" class="mp-photo-btn" id="mpSharePhotos" style="margin-top:10px" hidden>고른 사진 카카오톡으로 공유하기</button>
        <div class="mp-note" id="mpShareHint" hidden>공유 창에서 <b>카카오톡 → 우드팩커 채팅방</b>을 골라주세요.</div>
        <div class="mp-note">보내주시면 상담팀이 확인 후 결제를 안내드려요. 😊</div>
      </div>
      <textarea class="mp-out" id="mpOut" readonly hidden></textarea>`;
    ['Name', 'Phone', 'Addr', 'Date', 'Memo'].forEach(k => { $('mp' + k).oninput = e => { orderForm[k.toLowerCase()] = e.target.value; }; });
    $('mpAgree').onchange = e => { orderForm.agree = e.target.checked; };
    $('mpFiles').onchange = e => { photos.push(...Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'))); photos.splice(10); e.target.value = ''; renderThumbs(); };
    renderThumbs();
    $('mpSend').onclick = async () => {
      const err = $('mpErr');
      if (!orderForm.name.trim() || !orderForm.phone.trim() || !orderForm.addr.trim()) { err.textContent = '이름, 연락처, 설치 주소를 입력해주세요.'; return; }
      if (!orderForm.agree) { err.textContent = '개인정보 수집·이용에 동의해주세요.'; return; }
      err.textContent = '';
      const text = orderText(compute());
      const out = $('mpOut'); out.value = text; out.hidden = false;
      const ok = await copyText(text);
      showToast(ok ? '주문서를 복사했어요. 카카오톡 채팅창에 붙여넣어 보내주세요.' : '자동 복사가 안 됐어요. 아래 주문서를 길게 눌러 복사해주세요.');
      $('mpStep2').hidden = false;
      setTimeout(() => { const w = window.open(KAKAO_URL, '_blank'); if (!w) location.href = KAKAO_URL; }, 700);
    };
    $('mpSharePhotos').onclick = async () => {
      try { await navigator.share({ files: photos }); }
      catch (e) { if (!(e && e.name === 'AbortError')) showToast('사진 공유가 안 돼요. 카카오톡 채팅방의 + 버튼으로 보내주세요.'); }
    };
  }

  // ---------- 구성 링크 · 불러오기 ----------
  const BASE = location.origin + location.pathname.replace(/[^/]*$/, '');
  function viewLink(r) {
    const q = new URLSearchParams({
      w: r.wall, u: r.code.mid, c: COLORS.indexOf(state.color), h: HANDLES.indexOf(state.handle), hc: Math.max(0, hcList(state.handle).indexOf(state.hcolor)),
      m: state.mirror, s: state.side, d: state.demolition ? 1 : 0, v: state.visit ? 1 : 0, t: state.d3 ? 1 : 0,
      ls: state.longShelf, ss: state.shortShelf, ab: state.addBig, as: state.addSmall, im: state.innerMirror, view: 1,
    });
    return BASE + 'store.html?' + q.toString();
  }

  // 코드(예: 7.5L-9H-9A-4.5I-8PB-7.5R 또는 9H-9A-4.5I)로 구성을 복원
  function restore(code, wallMm) {
    const toks = String(code).trim().toUpperCase().replace(/\s+/g, '').split('-').filter(Boolean);
    let surround = null; const us = [], sel = [];
    for (const t of toks) {
      const m = t.match(/^(\d+(?:\.\d+)?)([A-Z]+\d?)$/);
      if (!m) return '코드 형식을 읽지 못했어요: ' + t;
      const w = Math.round(parseFloat(m[1]) * 100), k = m[2];
      if (k === 'L' || k === 'R') { surround = w / 10; continue; }
      if (k === 'ST3' || k === 'ST5') { us.push({ type: 'styler', w, code: k }); sel.push(k); continue; }
      if (k === 'PA' || k === 'PB' || k === 'PC') { us.push({ type: 'powder', w, code: k }); sel.push(k); continue; }
      us.push({ type: w >= 800 ? 'big' : 'small', w, code: '' }); sel.push(k);
    }
    if (!us.length) return '구성이 비어 있어요.';
    const used = us.reduce((a, u) => a + u.w, 0);
    let wall = Number(wallMm) || 0;
    if (!wall) wall = surround != null ? Math.round(used + surround * 2) : used;
    if (wall < used) return `벽 길이(${wall}mm)가 구성 합계(${used}mm)보다 짧아요.`;
    const leftover = wall - used;
    $('wall').value = wall;
    units = us; selections = sel;
    currentPlan = { set: '불러온 구성', big: 0, small: 0, bc: us.filter(u => u.type === 'big').length, sc: us.filter(u => u.type === 'small').length,
      used, leftover, surround: leftover / 2, doors: 0, priority: 0, fixed: [] };
    designCard.style.display = 'block';
    renderSlots(); updateCompact(); renderPreview();
    return '';
  }

  function applyParams() {
    const q = new URLSearchParams(location.search);
    if (q.get('u')) {
      const ci = Number(q.get('c')), hi = Number(q.get('h'));
      if (COLORS[ci]) state.color = COLORS[ci];
      if (HANDLES[hi]) state.handle = HANDLES[hi];
      state.hcolor = hcList(state.handle)[Number(q.get('hc')) || 0] || hcList(state.handle)[0] || '';
      state.mirror = Math.max(0, Number(q.get('m')) || 0); state.side = Math.max(0, Number(q.get('s')) || 0);
      state.demolition = q.get('d') === '1'; state.visit = q.get('v') === '1'; state.d3 = q.get('t') === '1';
      [['longShelf','ls'],['shortShelf','ss'],['addBig','ab'],['addSmall','as'],['innerMirror','im']].forEach(([k, p]) => { state[k] = Math.max(0, Math.min(20, Number(q.get(p)) || 0)); });
      renderedOptions = false;
      const e = restore(q.get('u'), q.get('w'));
      if (!e && q.get('view') === '1') {
        const tag = document.createElement('div'); tag.className = 'mp-card';
        tag.style.cssText = 'background:#673131;color:#fff;font-weight:700';
        tag.textContent = '고객이 보낸 구성을 불러왔어요. 아래에서 구성·미리보기·금액을 확인하세요.';
        designCard.before(tag);
        setTimeout(() => tag.scrollIntoView({ behavior: 'smooth' }), 300);
      }
    }
    if (q.get('staff') === '1') {
      const box = document.createElement('div'); box.className = 'mp-card';
      box.innerHTML = `<div class="mp-title">직원용 · 구성 코드로 불러오기</div>
        <div class="mp-grid"><div class="mp-field"><label for="mpLoadCode">구성 코드</label><input type="text" id="mpLoadCode" placeholder="예) 7.5L-9H-9A-9A-8PB-7.5R 또는 9H-9A-9A"></div>
        <div class="mp-field"><label for="mpLoadWall">벽 길이 (mm, 코드에 L·R이 없을 때)</label><input type="number" id="mpLoadWall" placeholder="예) 3650"></div></div>
        <button type="button" class="mp-cta" id="mpLoadBtn" style="margin-top:12px">불러오기</button><div class="mp-err" id="mpLoadErr"></div>`;
      designCard.before(box);
      $('mpLoadBtn').onclick = () => { $('mpLoadErr').textContent = restore($('mpLoadCode').value, $('mpLoadWall').value); };
    }
  }

  const photos = [];
  function renderThumbs() {
    const box = $('mpThumbs'); if (!box) return;
    box.innerHTML = '';
    photos.forEach((f, i) => {
      const d = document.createElement('div');
      const img = document.createElement('img'); img.alt = '현장 사진 ' + (i + 1); img.src = URL.createObjectURL(f);
      img.onload = () => URL.revokeObjectURL(img.src);
      const x = document.createElement('button'); x.type = 'button'; x.textContent = '×'; x.setAttribute('aria-label', '사진 빼기');
      x.onclick = () => { photos.splice(i, 1); renderThumbs(); };
      d.append(img, x); box.appendChild(d);
    });
    $('mpFileCount').textContent = photos.length ? `${photos.length}장 선택됨 (최대 10장)` : '';
    const canShare = !!(photos.length && navigator.canShare && navigator.canShare({ files: photos }));
    const sb = $('mpSharePhotos'), sh = $('mpShareHint');
    if (sb) sb.hidden = !canShare;
    if (sh) sh.hidden = !canShare;
  }

  function orderNo() {
    const d = new Date(), p = n => String(n).padStart(2, '0');
    return `M${String(d.getFullYear()).slice(2)}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${Math.floor(Math.random() * 90 + 10)}`;
  }

  function orderText(r) {
    const L = [];
    L.push(`[메이든 주문 신청] ${orderNo()}`);
    L.push('');
    L.push(`이름: ${orderForm.name.trim()}`);
    L.push(`연락처: ${orderForm.phone.trim()}`);
    L.push(`주소: ${orderForm.addr.trim()}`);
    L.push(`희망 시공일: ${orderForm.date.trim() || '상담 후 결정'}`);
    if (orderForm.memo.trim()) L.push(`요청사항: ${orderForm.memo.trim()}`);
    L.push(`현장 사진: ${photos.length ? photos.length + '장 (이 메시지 다음에 따로 보낼게요)' : '없음'}`);
    L.push('');
    L.push(`■ 벽 길이 ${r.wall.toLocaleString()}mm (좌우 서라운드 각 ${r.surround}mm)`);
    L.push(`■ 구성 ${r.code.full}`);
    L.push(`  ${r.units.map((u, i) => unitLabel(u, r.selections[i])).join(' / ')}`);
    L.push(`■ 색상 ${state.color} · 손잡이 ${handleName()}`);
    L.push(`■ 구성 보기: ${viewLink(r)}`);
    L.push('');
    L.push('■ 견적');
    r.lines.forEach(l => L.push(`- ${l.t}: ${won(l.a)}`));
    L.push(`= 총 금액 ${won(r.total)}`);
    L.push('');
    L.push('상담팀 확인 후 결제 안내 부탁드립니다.');
    if (photos.length) {
      L.push('');
      L.push(`📷 이 메시지를 보낸 뒤, 채팅창 왼쪽 아래 [+] → [앨범]에서 현장 사진 ${photos.length}장을 보내주세요.`);
    }
    return L.join('\n');
  }

  async function copyText(t) {
    try { await navigator.clipboard.writeText(t); return true; }
    catch (e) {
      try { const ta = document.createElement('textarea'); ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove(); return ok; }
      catch (e2) { return false; }
    }
  }

  // ---------- 갱신 ----------
  let renderedOptions = false;
  function refresh() {
    const visible = designCard && designCard.style.display !== 'none';
    const r = visible ? compute() : null;
    const on = !!r;
    optCard.style.display = priceCard.style.display = nextCard.style.display = on ? 'block' : 'none';
    bar.style.display = on ? 'flex' : 'none';
    if (!on) return;
    if (!renderedOptions) { renderOptions(); renderedOptions = true; }
    renderPrice(r);
    if (new URLSearchParams(location.search).get('view') === '1') { nextCard.style.display = 'none'; return; }
    if (MODE === 'order') { if (!$('mpSend')) renderNextOrder(r); }
    else renderNextStore(r);
  }

  // app.js의 갱신 지점에 연결 (구성/순서가 바뀔 때마다 금액 재계산)
  if (typeof updateCompact === 'function') {
    const _uc = updateCompact;
    updateCompact = function () { _uc(); refresh(); };
  }
  // 새로 계산하면 이전 결과 숨김
  const calcBtn = $('calcBtn');
  if (calcBtn) calcBtn.addEventListener('click', () => setTimeout(refresh, 0));
  window.MADEN_PRICE = PRICE; // 확인용
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyParams); else applyParams();
  window.MADEN_SET_MODE = m => { MODE = m === 'order' ? 'order' : 'store'; nextCard.innerHTML = ''; refresh(); }; // 확인용
})();
