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
    sidePanel: 90000,          // 측판 1개
    demolition: 100000,        // 기존장 철거 및 내림
    visitDesign: 50000,        // 방문설계서비스
  };
  const DRAWERS = { G: 1, H: 2, I: 3 };           // 디자인별 서랍 개수 (나머지 무료)
  const COLORS = ['스완화이트', '웜화이트', '미스티그레이', '실키그레이', '콘크리트화이트'];
  const HANDLES = ['푸쉬', '스마트바', '레세르', '르씰'];
  const STORE_URL = 'https://smartstore.naver.com/woodpecker77/products/13625382270';
  const KAKAO_URL = 'http://pf.kakao.com/_xjJTLC/chat';
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
    color: COLORS[0], handle: HANDLES[0],
    mirror: 0, side: 0, demolition: false, visit: false,
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
        ${COLORS.map(c => chip('color', c, c + (PRICE.colorExtraPer10cm[c] ? `<small>+10cm당 ${PRICE.colorExtraPer10cm[c].toLocaleString()}원</small>` : ''))).join('')}
      </div></div>
      <div class="mp-field" style="margin-bottom:14px"><label>손잡이</label><div class="mp-chips">
        ${HANDLES.map(h => chip('handle', h, h)).join('')}
      </div></div>
      <div class="mp-field"><label>추가 옵션 (필요할 때만)</label>
        ${stepper('mirror', '거울도어', PRICE.mirrorDoor)}
        ${stepper('side', '측판 (벽이 없는 쪽 마감)', PRICE.sidePanel)}
        ${toggleRow('demolition', '기존장 철거 및 내림', PRICE.demolition)}
        ${toggleRow('visit', '방문설계서비스', PRICE.visitDesign)}
      </div>`;
  }
  optCard.addEventListener('click', e => {
    const c = e.target.closest('.mp-chip');
    if (c) { state[c.dataset.g] = c.dataset.v; renderOptions(); refresh(); return; }
    const b = e.target.closest('[data-step]');
    if (b) { const k = b.dataset.step; state[k] = Math.max(0, Math.min(20, state[k] + Number(b.dataset.d))); $('mpS_' + k).textContent = state[k]; refresh(); }
  });
  optCard.addEventListener('change', e => {
    if (e.target.id === 'mpT_demolition') state.demolition = e.target.checked;
    if (e.target.id === 'mpT_visit') state.visit = e.target.checked;
    refresh();
  });

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
    if (state.side) lines.push({ k: 'side', t: `측판 ${state.side}개`, a: state.side * PRICE.sidePanel, store: '측판', n: state.side });
    if (state.demolition) lines.push({ k: 'demo', t: '기존장 철거 및 내림', a: PRICE.demolition, store: '기존장 철거 및 내림', n: 1 });
    if (state.visit) lines.push({ k: 'visit', t: '방문설계서비스', a: PRICE.visitDesign, store: '방문설계서비스', n: 1 });
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
      <div class="mp-note" style="margin:-6px 0 8px">벽 ${r.wall.toLocaleString()}mm · 좌우 서라운드 각 ${r.surround}mm · ${state.color} · ${state.handle}</div>
      ${r.lines.map(l => `<div class="mp-row"><span>${esc(l.t)}</span><span class="n">${won(l.a)}</span></div>`).join('')}
      <div class="mp-total"><span>총 금액</span><b>${won(r.total)}</b></div>
      <div class="mp-note">• 선반·옷봉 구성과 스타일러장은 본체 가격에 포함돼요.<br>• 10cm 미만 길이는 버려요. (예: 3,650mm → 36개)<br>• <b>이 금액 그대로 시공</b>되며, 현장에서 추가금이 붙지 않아요.</div>`;
    $('mpBarTotal').textContent = won(r.total);
  }

  function storeAddons(r) {
    return r.lines.filter(l => l.store).map(l => `${l.store} ${l.n}개`);
  }

  function renderNextStore(r) {
    const adds = storeAddons(r);
    const powderNote = r.powder.length ? `<li>화장대는 스마트스토어에서 선택할 수 없어요. 주문 후 <b>상담팀이 화장대 금액(${won(r.powder.reduce((s, x) => s + (PRICE.powder[x.s] || 0), 0))})을 따로 안내</b>드려요.</li>` : '';
    nextCard.innerHTML = `
      <div class="mp-title">스마트스토어에서 이렇게 주문하세요</div>
      <ol class="mp-steps">
        <li>아래 버튼을 누르면 <b>구성 코드가 복사</b>되고 스토어로 돌아가요.</li>
        <li>옵션 첫 칸 <b>사이즈&디자인 구성</b>에 붙여넣기<div class="mp-code">${esc(r.code.mid)}</div></li>
        <li>컬러 <b>${esc(state.color)}</b> · 손잡이 <b>${esc(state.handle)}</b> 선택</li>
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
      <button type="button" class="mp-cta kakao" id="mpSend">주문서 복사하고 카카오톡으로 보내기</button>
      <div class="mp-note" id="mpSendNote">버튼을 누르면 주문서가 복사되고 우드팩커 카카오톡 채널이 열려요. <b>채팅창에 붙여넣고 보내주시면</b> 상담팀이 확인 후 결제를 안내드려요. 사진은 채팅창의 <b>+ 버튼</b>으로 함께 보내주세요.</div>
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
      // 휴대폰: 사진 + 주문서를 공유 창으로 한 번에 보내기 (카카오톡 선택 → 우드팩커 채팅방)
      if (photos.length && navigator.canShare && navigator.canShare({ files: photos })) {
        try {
          await navigator.share({ text, files: photos });
          copyText(text);
          showToast('보내셨다면 접수 완료예요. 상담팀이 확인 후 연락드려요.');
          return;
        } catch (shareErr) {
          if (shareErr && shareErr.name === 'AbortError') { showToast('보내기를 취소했어요. 다시 눌러주세요.'); return; }
        }
      }
      const ok = await copyText(text);
      showToast(ok ? '주문서를 복사했어요. 카카오톡 채팅창에 붙여넣어 보내주세요.' : '자동 복사가 안 됐어요. 아래 주문서를 길게 눌러 복사해주세요.');
      setTimeout(() => { const w = window.open(KAKAO_URL, '_blank'); if (!w) location.href = KAKAO_URL; }, 700);
    };
  }

  // ---------- 구성 링크 · 불러오기 ----------
  const BASE = location.origin + location.pathname.replace(/[^/]*$/, '');
  function viewLink(r) {
    const q = new URLSearchParams({
      w: r.wall, u: r.code.mid, c: COLORS.indexOf(state.color), h: HANDLES.indexOf(state.handle),
      m: state.mirror, s: state.side, d: state.demolition ? 1 : 0, v: state.visit ? 1 : 0, view: 1,
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
      state.mirror = Math.max(0, Number(q.get('m')) || 0); state.side = Math.max(0, Number(q.get('s')) || 0);
      state.demolition = q.get('d') === '1'; state.visit = q.get('v') === '1';
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
    const btn = $('mpSend');
    if (btn) btn.textContent = (photos.length && navigator.canShare && navigator.canShare({ files: photos })) ? '사진과 주문서 카카오톡으로 보내기' : '주문서 복사하고 카카오톡으로 보내기';
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
    L.push(`현장 사진: ${photos.length ? photos.length + '장 함께 보냄' : '없음 (채팅으로 보내드릴게요)'}`);
    L.push('');
    L.push(`■ 벽 길이 ${r.wall.toLocaleString()}mm (좌우 서라운드 각 ${r.surround}mm)`);
    L.push(`■ 구성 ${r.code.full}`);
    L.push(`  ${r.units.map((u, i) => unitLabel(u, r.selections[i])).join(' / ')}`);
    L.push(`■ 색상 ${state.color} · 손잡이 ${state.handle}`);
    L.push(`■ 구성 보기: ${viewLink(r)}`);
    L.push('');
    L.push('■ 견적');
    r.lines.forEach(l => L.push(`- ${l.t}: ${won(l.a)}`));
    L.push(`= 총 금액 ${won(r.total)}`);
    L.push('');
    L.push('상담팀 확인 후 결제 안내 부탁드립니다.');
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
