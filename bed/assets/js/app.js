// ------- 설정값
const MIN_SURROUND = 40;
const DOOR_GAP_MM = 3; // 큰장 중앙 간격(점선용)
const LEFTOVER_TIE = 20;

const SETS = [
  { id:"set105", name:"1000+500", big:1000, small:500, priority:0 },
  { id:"set95", name:"950+475", big:950, small:475, priority:1 },
  { id:"set90", name:"900+450", big:900, small:450, priority:2 },
  { id:"set85", name:"850+425", big:850, small:425, priority:3 },
  { id:"set80", name:"800+400", big:800, small:400, priority:4 },
];
const LETTERS_BIG = ["A","B","C","D","E","F","G","H","I"];
const LETTERS_SMALL = ["A","B","C","G","H","I"]; // 작은장 허용 글자

// 이미지 베이스네임 매핑(확장자 없이)
const IMG_BIG   = Object.fromEntries(LETTERS_BIG.map(ch => [ch, `design_${ch}`]));
const IMG_SMALL = Object.fromEntries(LETTERS_SMALL.map(ch => [ch, `s_design_${ch}`]));

// 스타일러/화장대/도어(베이스네임)
const STYLER_BASE = { ST3: "styler_ST3", ST5: "styler_ST5" };
const POWDER_BASE = { PA: "powder_PA", PB: "powder_PB", PC: "powder_PC" };
const DOOR_BASE   = { big: "door_big",  small: "door_small" };
// 외부서랍(I 전용) 도어 오버레이
const DOOR_EXT_I  = { big: "door_big_I", small: "door_small_I" };

// 이미지 경로/확장자 자동 탐색
const IMG_BASES = [
  "assets/images/",
  // "./assets/images/",
  // "images/",
  // "./images/",
  // "",
  // "./",
];
// GIF 도 포함(외부서랍 도어가 gif일 가능성 대비)
const IMG_EXTS  = [".png", ".webp", ".jpg", ".jpeg", ".gif", ".PNG", ".JPG", ".GIF"];

// 상태
let topRows = [];
let currentPlan = null;
let units = []; // [{type:"big"/"small"/"styler"/"powder", w, code}]
let selections = []; // big/small=A~I, styler=ST3/ST5, powder=PA/PB/PC
let doorMode = 'open'; // 'open' | 'closed'

// 이벤트
document.getElementById('calcBtn').addEventListener('click', calculate);
document.getElementById('wall').addEventListener('keydown', e=>{ if(e.key==='Enter') calculate(); });
document.getElementById('bedLength').addEventListener('keydown', e=>{ if(e.key==='Enter') calculate(); });
const useExternalIEl = document.getElementById('useExternalI');
if(useExternalIEl) useExternalIEl.addEventListener('change', ()=>renderPreview());

function setDoorMode(mode){
  doorMode = mode;
  document.getElementById('doorOpenBtn').classList.toggle('btn-active', mode==='open');
  document.getElementById('doorCloseBtn').classList.toggle('btn-active', mode==='closed');
  renderPreview();
}

// 유틸
// ✅ 소수점 둘째 자리 표기 (475 -> 4.75, 425 -> 4.25, 450 -> 4.5)
function mmToDmStr(mm){
  const dm = mm / 100;
  return dm.toFixed(2).replace(/\.?0+$/, '');
}

function getDesignImageBase(type, letter){
  if(type === "big") return IMG_BIG[letter];
  return IMG_SMALL[letter] || IMG_BIG[letter];
}
function buildCandidatesFromBase(baseName){
  const out = [];
  if(!baseName) return out;
  for(const dir of IMG_BASES){
    for(const ext of IMG_EXTS){
      const p = dir + baseName + ext;
      if(!out.includes(p)) out.push(p);
    }
  }
  return out;
}
function loadImageSeq(candidates){
  return new Promise((resolve,reject)=>{
    if(!candidates || !candidates.length) return reject(new Error("no candidates"));
    let i=0; const img = new Image();
    img.onload = ()=>resolve(img);
    img.onerror = ()=>{ i++; if(i<candidates.length){ img.src = candidates[i]; } else { reject(new Error("all failed: "+candidates.join(", "))); } };
    img.src = candidates[i];
  });
}

function makeThumbWithFallback(srcBase, label){
  const wrap=document.createElement('div'); wrap.className="thumb";
  const img=document.createElement('img'); img.alt=label;
  const ph=document.createElement('div'); ph.className="ph"; ph.textContent=label+" (이미지 자리)";
  ph.style.display="none";

  // 디버그 라벨
  const dbg=document.createElement('div');
  dbg.style.position='absolute'; dbg.style.bottom='4px'; dbg.style.left='6px'; dbg.style.right='6px';
  dbg.style.fontSize='10px'; dbg.style.color='#888'; dbg.style.display='none';

  wrap.appendChild(img); wrap.appendChild(ph); wrap.appendChild(dbg);

  const cands = buildCandidatesFromBase(srcBase);
  let idx = 0;

  function showFail(){
    img.style.display="none"; ph.style.display="flex";
    if(window.__imgDebugOn){ dbg.style.display='block'; dbg.textContent="not found: "+(cands[idx-1]||"(none)"); }
  }
  if(!cands.length){ showFail(); return wrap; }

  img.onerror = ()=>{ idx++; if(idx<cands.length){ img.src=cands[idx]; } else { showFail(); } };
  img.onload  = ()=>{ img.style.display="block"; ph.style.display="none"; dbg.style.display = window.__imgDebugOn ? 'block' : 'none'; dbg.textContent = img.src; };
  img.src = cands[idx];
  return wrap;
}

// ---- 계산
function calculate(){
  try{
    const wall = parseInt(document.getElementById('wall').value,10);
    const bedLength = parseInt(document.getElementById('bedLength').value,10);
    const pairRequired = document.getElementById('pairRequired')?.checked || false;
    const onlyOdd = document.getElementById('onlyOddDoors')?.checked || false;
    const summary = document.getElementById('summary');
    summary.innerHTML=""; document.getElementById('designCard').style.display="none";
    console.log('wall-bedLength: ',wall-bedLength)
    if(!(wall-bedLength) || wall-bedLength<1000){ summary.innerHTML="<div style='color:#b00020'>⚠️ 벽 전체 길이는 침대 길이를 제외하고 1000mm 이상이 되어야합니다.</div>"; return; }
    if(bedLength >= wall){ summary.innerHTML="<div style='color:#b00020'>⚠️ 침대 길이가 벽 전체 길이보다 작아야 합니다.</div>"; return; }

    const enabledSets = SETS.filter(s=>document.getElementById(s.id).checked);
    if(enabledSets.length===0){ summary.innerHTML="<div style='color:#b00020'>⚠️ 최소 1개 세트를 선택</div>"; return; }

    // 고정 통(체크만, 각 1통)
    // const styOn = document.getElementById('stylerOn').checked;
    // const styW = parseInt(document.getElementById('stylerType').value,10); // 450/600
    // const powOn = document.getElementById('powderOn').checked;
    // const powD = document.getElementById('powderDesign').value; // PA/PB/PC

    const fixedUnits = [];
    // if(styOn) fixedUnits.push({type:"styler", w:styW, code:(styW===450?"ST3":"ST5")});
    // if(powOn) fixedUnits.push({type:"powder", w:800, code:powD});

    // 침대를 가운데에 배치하고, 양옆에 여닫이장을 배치
    const availableSpace = wall - bedLength; // 양옆에 배치할 공간
    const sideSpace = availableSpace / 2; // 좌측 또는 우측에 배치할 공간

    // 좌측과 우측 각각에 대해 계산
    let rows=[];
    for(const set of enabledSets){
      for(let bc=0;bc<=14;bc++){
        for(let sc=0;sc<=14;sc++){
          if(bc===0&&sc===0 && fixedUnits.length===0) continue;
          if(pairRequired && (bc===0 || sc===0) && (bc+sc>0)) continue;

          const used = fixedUnits.reduce((s,u)=>s+u.w,0) + (set.big*bc + set.small*sc);
          if(used > sideSpace) continue; // 한쪽 공간을 초과하면 안됨

          const leftover = sideSpace - used;
          const surround = leftover/2;
          if(surround<MIN_SURROUND) continue;

          const doors = 2*bc + sc + fixedUnits.length; // 큰장=2, 작은장=1, 스타일러/화장대=1
          if(onlyOdd && doors%2===0) continue;

          // 좌측과 우측이 동일하므로 각각 계산
          rows.push({
            set:set.name, big:set.big, small:set.small,
            bc, sc, used:used*2 + bedLength, leftover:leftover*2, surround, doors:doors*2, priority:set.priority,
            fixed: JSON.parse(JSON.stringify(fixedUnits)),
            bedLength: bedLength,
            leftUnits: {bc, sc, fixed: JSON.parse(JSON.stringify(fixedUnits))},
            rightUnits: {bc, sc, fixed: JSON.parse(JSON.stringify(fixedUnits))}
          });
        }
      }
    }
    if(rows.length===0){ summary.innerHTML="<div class='text-sm text-red-500 mt-5'>조건에 맞는 조합이 없습니다.</div>"; return; }

    rows.sort((a,b)=>{
      const near = Math.abs(a.leftover-b.leftover)<=LEFTOVER_TIE;
      if(near && a.priority!==b.priority) return a.priority-b.priority;
      if(a.leftover!==b.leftover) return a.leftover-b.leftover;
      if(a.doors!==b.doors) return a.doors-b.doors;
      return (a.bc+a.sc)-(b.bc+b.sc);
    });

    topRows = rows.slice(0,3);
    summary.innerHTML="<div class='text-purple-500 text-lg'><b>✔️ 추천 조합 Top3</b></div>"+
      topRows.map((r,i)=>`<div class='summary-line mt-5 text-sm leading-6'>
        <button class='btn btn-outline btn-primary mr-3' style='border-width:2px !important;' onclick='choosePlan(${i})'>${i+1}안 선택</button>
        ${r.set} · 좌측: 큰장${r.bc} 작은장${r.sc}${r.fixed.length?` 고정통 ${r.fixed.length}개`:``} / 침대 ${r.bedLength}mm / 우측: 큰장${r.bc} 작은장${r.sc}${r.fixed.length?` 고정통 ${r.fixed.length}개`:``}
        · 도어 ${r.doors}개 · 서라운드 ${Math.round(r.surround)}mm/측 (남는폭 ${r.leftover}mm)
      </div>`).join("");
  }catch(err){
    alert("오류가 발생했습니다: "+err.message);
    console.error(err);
  }
}

function choosePlan(idx){
  const r=topRows[idx]; currentPlan=r;

  // 기본 배열: 좌측 여닫이장 → 침대 → 우측 여닫이장
  units=[];
  
  // 좌측 여닫이장
  for(let i=0;i<r.leftUnits.bc;i++) units.push({type:"big", w:r.big, code:""});
  for(let i=0;i<r.leftUnits.sc;i++) units.push({type:"small", w:r.small, code:""});
  r.leftUnits.fixed.forEach(f=>units.push({...f}));
  
  // 침대
  units.push({type:"bed", w:r.bedLength, code:""});
  
  // 우측 여닫이장
  for(let i=0;i<r.rightUnits.bc;i++) units.push({type:"big", w:r.big, code:""});
  for(let i=0;i<r.rightUnits.sc;i++) units.push({type:"small", w:r.small, code:""});
  r.rightUnits.fixed.forEach(f=>units.push({...f}));

  // 초기 선택
  selections = units.map(u=>{
    if(u.type==="big") return "A";
    if(u.type==="small") return "A";
    if(u.type==="styler")return u.code; // ST3/ST5
    if(u.type==="powder")return u.code; // PA/PB/PC
    if(u.type==="bed") return ""; // 침대는 선택 없음
    return "A";
  });

  renderSlots();
  document.getElementById('designCard').style.display="block";
  updateCompact(); renderPreview();
  window.scrollTo({ top: document.getElementById('designCard').offsetTop-10, behavior:'smooth' });
}

function renderSlots(){
  console.log('units: ',units)
  const wrap=document.getElementById('slotsWrap'); wrap.innerHTML="";
  units.forEach((u,idx)=>{
    const slot=document.createElement('div'); slot.className="slot";
    const kindLabel = u.type==="big" ? "큰장" : u.type==="small" ? "작은장" : (u.type==="styler"?"스타일러":(u.type==="powder"?"화장대":"침대"));
    const chip = `<span class="chip">${kindLabel}</span>`;
    slot.innerHTML = `<h3>${idx+1}통 ${chip} <span class="muted">${u.w}mm</span>
      <span class="move">
        <button onclick="moveUnit(${idx},-1)">←</button>
        <button onclick="moveUnit(${idx},1)">→</button>
      </span>
    </h3>`;

    const grid=document.createElement('div'); grid.className="thumb-grid";
    
    // 침대는 디자인 선택 없음
    // if(u.type==="bed"){
    //   const ph=document.createElement('div'); ph.className="ph"; ph.textContent="침대";
    //   ph.style.display="flex";
    //   grid.appendChild(ph);
    //   slot.appendChild(grid);
    //   wrap.appendChild(slot);
    //   return;
    // }

    if(u.type==="big" || u.type==="small"){
      const letters = (u.type==="big")?LETTERS_BIG:LETTERS_SMALL;
      letters.forEach(letter=>{
        const div=makeThumbWithFallback(getDesignImageBase(u.type, letter), letter);
        if(selections[idx]===letter) div.classList.add('active');
        div.addEventListener('click',()=>{
          selections[idx]=letter;
          grid.querySelectorAll('.thumb').forEach(t=>t.classList.remove('active'));
          div.classList.add('active');
          updateCompact(); renderPreview();
        });
        grid.appendChild(div);
      });
    }else if(u.type==="styler"){
      ["ST3","ST5"].forEach(code=>{
        const div = makeThumbWithFallback(STYLER_BASE[code], code);
        if(selections[idx]===code) div.classList.add('active');
        div.addEventListener('click',()=>{
          selections[idx]=code; units[idx].code=code; units[idx].w=(code==="ST3"?450:600);
          grid.querySelectorAll('.thumb').forEach(t=>t.classList.remove('active'));
          div.classList.add('active');
          updateCompact(); renderPreview();
        });
        grid.appendChild(div);
      });
    }else if(u.type==="powder"){
      ["PA","PB","PC"].forEach(code=>{
        const div = makeThumbWithFallback(POWDER_BASE[code], code);
        if(selections[idx]===code) div.classList.add('active');
        div.addEventListener('click',()=>{
          selections[idx]=code; units[idx].code=code;
          grid.querySelectorAll('.thumb').forEach(t=>t.classList.remove('active'));
          div.classList.add('active');
          updateCompact(); renderPreview();
        });
        grid.appendChild(div);
      });
    }

    slot.appendChild(grid);
    wrap.appendChild(slot);
  });
}

function moveUnit(i,dir){
  const j=i+dir; if(j<0||j>=units.length) return;
  [units[i],units[j]]=[units[j],units[i]];
  [selections[i],selections[j]]=[selections[j],selections[i]];
  renderSlots(); updateCompact(); renderPreview();
}

// ---- 시퀀스 (공백 없음 / 통=빨강, L/R=검정)
function buildCompact(){
  if(!currentPlan) return {html:"-", text:"-"};
  const surr = Math.round(currentPlan.surround);
  const surrDm = mmToDmStr(surr*10);
  const left = `<span class="k">${surrDm}L</span>`;
  const right = `<span class="k">${surrDm}R</span>`;
  const mids = units.map((u,idx)=>{
    const dm = mmToDmStr(u.w);
    const code = selections[idx];
    return `<span class="r">${dm}${code}</span>`;
  });
  const html = [left, ...mids, right].join('-');
  const text = html.replace(/<[^>]+>/g,'');
  return {html,text};
}
function updateCompact(){
  const o=buildCompact();
  const box=document.getElementById('seqCompact');
  box.innerHTML=o.html; box.dataset.copy=o.text;
}
function copyCompact(){
  const box=document.getElementById('seqCompact');
  const raw=box.dataset.copy || box.textContent;
  // 숫자L- 와 -숫자R 제거하고 가운데만 복사
  const middle = raw.replace(/^(?:\d+(?:\.\d+)?)L-/, '').replace(/-\d+(?:\.\d+)?R$/, '');
  navigator.clipboard.writeText(middle).then(()=>alert("복사 완료\n상품 옵션 첫 칸에 붙여넣어 주세요."));
}

// ---- 미리보기 (통 밀착, 큰장 중앙 3mm 점선; 스타일러/화장대는 점선 없음)
async function renderPreview(){
  const canvas=document.getElementById('previewCanvas'), ctx=canvas.getContext('2d');
  if(!currentPlan){canvas.width=0;canvas.height=0;return;}
  const isMobile = window.innerWidth <= 760;
  const unitH=isMobile ? 260 : 260;
  const labelH=26, maxLabelH=55
  const innerGap=-5, surroundGap=-5; // 통 사이 간격 (음수면 겹침)
  let pxPerMm=0.16;
  
  const totalMm = units.reduce((s,u)=>s+u.w,0);
  let sPx = Math.max(3, Math.round(currentPlan.surround*pxPerMm));
  let totalW = sPx + totalMm*pxPerMm + sPx + innerGap*(units.length-1) + surroundGap*2;
  
  const previewBox = canvas.parentElement;
  let previewAvailableWidth = Infinity;
  if(previewBox){
    const previewStyles = window.getComputedStyle(previewBox);
    const paddingLeft = parseFloat(previewStyles.paddingLeft) || 0;
    const paddingRight = parseFloat(previewStyles.paddingRight) || 0;
    previewAvailableWidth = Math.max(previewBox.clientWidth - paddingLeft - paddingRight, 0);
  }

  const maxW = 1200;
  
  if(totalW>maxW){
    const mmPart=(totalMm*pxPerMm)+(2*sPx);
    const scale=(maxW - innerGap*(units.length-1) - surroundGap*2) / mmPart;
    pxPerMm*=scale; sPx=Math.max(3,Math.round(currentPlan.surround*pxPerMm));
    totalW=Math.round(sPx + totalMm*pxPerMm + sPx  + innerGap*(units.length-1) + surroundGap*2);
  }
  canvas.width=totalW; 
  canvas.height=unitH+maxLabelH;
  const pixelHeight = canvas.height;
  ctx.fillStyle="#fff"; ctx.fillRect(0,0,canvas.width,canvas.height);

  // 좌 서라운드
  let x=0;
  ctx.fillStyle="#f0f0f0"; ctx.fillRect(x,0,sPx,unitH);
  ctx.strokeStyle="#cfcfcf"; ctx.strokeRect(x+0.5,0.5,sPx-1,unitH-1);
  ctx.fillStyle="#555"; ctx.font="12px system-ui"; ctx.textAlign="left";
  ctx.fillText(`* 좌우 서라운드 각 ${Math.round(currentPlan.surround)}mm`, x + 5, unitH + maxLabelH-8);
  x += sPx;

  for(let i=0;i<units.length;i++){
    const u=units[i], w=u.w*pxPerMm;
    let actualWidth = w; // 이미지 로드 실패 시 기본값

    // 1) 속장 이미지 또는 침대
    if(u.type==="bed"){
      // 침대는 단순 사각형으로 표시
      ctx.fillStyle="#e8f4f8";
      ctx.fillRect(x, 0, w, unitH);
      ctx.strokeStyle="#b3d9e6";
      ctx.strokeRect(x+0.5, 0.5, w-1, unitH-1);
      ctx.fillStyle="#333";
      ctx.font="bold 18px system-ui";
      ctx.textAlign="center";
      ctx.fillText("침대", x + w/2, unitH/2 + 6);
      actualWidth = w;
    }else if(u.type==="big" || u.type==="small"){
      const letter=selections[i], baseName=getDesignImageBase(u.type, letter);
      try{
        const img=await loadImageSeq(buildCandidatesFromBase(baseName));
        const ratio=Math.min(w/img.width, unitH/img.height);
        const dw=Math.round(img.width*ratio), dh=Math.round(img.height*ratio);
        const ix=x, iy=Math.round((unitH-dh)/2); // 왼쪽 정렬
        ctx.drawImage(img, ix, iy, dw, dh);
        actualWidth = dw; // 이미지의 실제 너비 사용
      }catch(e){
        fallbackBox(ctx,x,w,unitH, letter || (u.type==="big"?"B":"S"));
      }
    }else{
      // 스타일러/화장대
      const code = u.code || (u.type==="styler"?(u.w===450?"ST3":"ST5"):"PA");
      const base = (u.type==="styler"? STYLER_BASE[code] : POWDER_BASE[code]) || null;
      if(base){
        try{
          const img=await loadImageSeq(buildCandidatesFromBase(base));
          const ratio=Math.min(w/img.width, unitH/img.height);
          const dw=Math.round(img.width*ratio), dh=Math.round(img.height*ratio);
          const ix=x, iy=Math.round((unitH-dh)/2); // 왼쪽 정렬
          ctx.drawImage(img, ix, iy, dw, dh);
          actualWidth = dw; // 이미지의 실제 너비 사용
        }catch(e){
          fallbackBox(ctx,x,w,unitH,code);
        }
      }else{
        fallbackBox(ctx,x,w,unitH,code);
      }
    }

    // 2) 도어 닫힘 모드일 때, 도어 오버레이
    if(doorMode==='closed' && (u.type==='big' || u.type==='small')){
      const externalOn = !!document.getElementById('useExternalI')?.checked;
      const isI = selections[i] === 'I';

      // 우선순위: I 선택 → 외부서랍 도어 시도 → 실패시 기본 도어
      const tryOrder = [];
      if(isI && externalOn){
        tryOrder.push(u.type==='big' ? DOOR_EXT_I.big : DOOR_EXT_I.small);
      }
      tryOrder.push(u.type==='big' ? DOOR_BASE.big : DOOR_BASE.small);

      let overlayImg=null;
      for(const base of tryOrder){
        try{
          overlayImg = await loadImageSeq(buildCandidatesFromBase(base));
          if(overlayImg) break;
        }catch(e){ /* 다음 후보로 */ }
      }

      if(overlayImg){
        ctx.drawImage(overlayImg, x, 0, actualWidth, unitH);
      }else{
        ctx.save();
        ctx.fillStyle="rgba(0,0,0,0.04)"; ctx.fillRect(x,0,actualWidth,unitH);
        ctx.restore();
      }
    }

    // 큰장 중앙 3mm 점선
    if(u.type==='big'){
      const gapPx=Math.max(1, DOOR_GAP_MM*pxPerMm);
      const mid=x + actualWidth/2;
      ctx.save(); ctx.strokeStyle="#8aa3ff"; ctx.lineWidth=1; ctx.setLineDash([4,4]);
      ctx.beginPath(); ctx.moveTo(Math.round(mid-gapPx/2)+0.5,0); ctx.lineTo(Math.round(mid-gapPx/2)+0.5,unitH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(Math.round(mid+gapPx/2)+0.5,0); ctx.lineTo(Math.round(mid+gapPx/2)+0.5,unitH); ctx.stroke();
      ctx.restore();
    }

    // 하단 폭 라벨
    ctx.fillStyle="#111"; ctx.font="12px system-ui"; ctx.textAlign="center";
    ctx.fillText(`${u.w}mm`, x + w/2, unitH + labelH - 8);

    x += actualWidth; // 이미지의 실제 너비만큼 이동
    if (i < units.length - 1) {
      x += innerGap;
    } else {
      x += surroundGap;
    }
  }

  // 우 서라운드
  ctx.fillStyle="#f0f0f0"; ctx.fillRect(x,0,sPx,unitH);
  ctx.strokeStyle="#cfcfcf"; ctx.strokeRect(x+0.5,0.5,sPx-1,unitH-1);
  ctx.fillStyle="#555"; 
  // ctx.fillText(`${Math.round(currentPlan.surround)}mm`, x + sPx/2 - 15, unitH + labelH - 8);
  
  // 실제 사용된 너비 계산 (우 서라운드 끝까지)
  const finalWidth = x + sPx;
  
  // canvas를 실제 사용된 너비로 재조정
  if(finalWidth < totalW) {
    // 기존 내용을 ImageData로 저장
    const imageData = ctx.getImageData(0, 0, finalWidth, canvas.height);
    // canvas 너비 재설정
    canvas.width = finalWidth;
    // 저장된 내용 다시 그리기
    ctx.putImageData(imageData, 0, 0);
  }

  const availableDisplayWidth = (previewBox && previewAvailableWidth > 0 && previewAvailableWidth !== Infinity) ? previewAvailableWidth : finalWidth;
  if(availableDisplayWidth > 0 && finalWidth > availableDisplayWidth){
    const scaleFactor = availableDisplayWidth / finalWidth;
    canvas.style.width = `${availableDisplayWidth}px`;
    canvas.style.height = `${Math.max(Math.round(pixelHeight * scaleFactor), 1)}px`;
  } else {
    canvas.style.width = '';
    canvas.style.height = '';
  }
}

function fallbackBox(ctx,x,w,h,text){
  ctx.strokeStyle="#999"; ctx.strokeRect(x+4,4,w-8,h-8);
  ctx.fillStyle="#333"; ctx.font="bold 18px system-ui"; ctx.textAlign="center";
  ctx.fillText(text, x + w/2, h/2 + 6);
}

// ---- 이미지 저장(견고한 버전: toBlob → Blob URL → dataURL 폴백)
function downloadPreview(){
  const c = document.getElementById('previewCanvas');
  if (!c || c.width === 0) {
    alert("먼저 디자인을 선택하세요.");
    return;
  }
  const filename = `최종조립_침대붙박이장_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.png`;

  // 1) 가장 안정적인 경로: toBlob → Blob URL → a.download
  if (c.toBlob) {
    try {
      c.toBlob(function(blob){
        if (!blob) { fallbackWithDataURL(); return; }
        if (window.navigator && window.navigator.msSaveOrOpenBlob) {
          window.navigator.msSaveOrOpenBlob(blob, filename);
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 0);
      }, 'image/png');
      return;
    } catch (e) { fallbackWithDataURL(e); return; }
  }

  // 2) 폴백: dataURL → a.download 또는 새창
  function fallbackWithDataURL(err){
    try {
      const dataURL = c.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataURL; a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      try {
        const dataURL = c.toDataURL('image/png');
        window.open(dataURL, '_blank');
      } catch (finalErr) {
        alert("이미지 저장이 차단되었습니다. \n" +
              "• 이미지가 외부 도메인이라면 같은 폴더(또는 images/)로 복사해 사용하세요.\n" +
              "• 또는 간단한 로컬 서버(예: VS Code Live Server)로 http에서 열어주세요.");
        console.error(finalErr || e || err);
      }
    }
  }
}

// 이미지 디버그 토글
(function(){
  const el = document.getElementById('imgDebug');
  if(el){
    el.addEventListener('change', ()=>{
      window.__imgDebugOn = !!el.checked;
      renderSlots && renderSlots();
      renderPreview && renderPreview();
    });
  }
})();

