// ------- 설정
const MIN_SURROUND = 40;
const DOOR_COUNTS = [2,3,4]; // 슬라이딩: 도어 수(=통 개수)
const WIDTHS_ALL = [1000,950,900,850,800]; // 허용 폭(동일폭)

const LETTERS = ["A","B","C","D","E","F","G","H"];
const IMG = Object.fromEntries(LETTERS.map(ch => [ch, `assets/images/design_${ch}.png`]));

let topPlans = [];
let currentPlan = null;
let selections = [];

document.getElementById('calcBtn').addEventListener('click', calculate);
document.getElementById('wall').addEventListener('keydown', e=>{ if(e.key==='Enter') calculate(); });

function enabledDoorCounts(){
  const list=[];
  if(document.getElementById('d2').checked) list.push(2);
  if(document.getElementById('d3').checked) list.push(3);
  if(document.getElementById('d4').checked) list.push(4);
  return list;
}
function enabledWidths(){
  const list=[];
  if(document.getElementById('w1000').checked) list.push(1000);
  if(document.getElementById('w950').checked) list.push(950);
  if(document.getElementById('w900').checked) list.push(900);
  if(document.getElementById('w850').checked) list.push(850);
  if(document.getElementById('w800').checked) list.push(800);
  return list;
}

function calculate(){
  const wall = parseInt(document.getElementById('wall').value,10);
  const summary = document.getElementById('summary');
  summary.innerHTML = "";
  document.getElementById('designCard').style.display="none";

  if(!wall || wall<1000){ summary.innerHTML = "<div class='text-sm text-red-500 mt-5'>⚠️ 벽 전체 길이는 1000mm 이상이어야 합니다.</div>"; return; }

  const widths = enabledWidths();
  const doors = enabledDoorCounts();
  if(widths.length===0){ summary.innerHTML = "<div class='text-sm text-red-500 mt-5'>⚠️ 최소 1개의 허용폭을 선택해주세요.</div>"; return; }
  if(doors.length===0){ summary.innerHTML = "<div class='text-sm text-red-500 mt-5'>⚠️ 최소 1개 이상의 도어 수를 선택해주세요.</div>"; return; }

  let candidates = [];
  for(const d of doors){
    for(const w of widths){
      const used = d*w;
      if(used>wall) continue;
      const leftover = wall - used;
      const surround = leftover/2;
      if(surround < MIN_SURROUND) continue;
      candidates.push({doors:d, width:w, used, leftover, surround});
    }
  }
  if(candidates.length===0){ summary.innerHTML = "<div class='text-sm text-red-500 mt-5'>조건에 맞는 조합 없음</div>"; return; }

  // 정렬: 서라운드 최소(=leftover 최소) → 폭 큰 것 우선 → 도어 수 적은 것 우선
  candidates.sort((a,b)=>{
    if(a.leftover!==b.leftover) return a.leftover - b.leftover;
    if(a.width!==b.width) return b.width - a.width;
    return a.doors - b.doors;
  });
  topPlans = candidates.slice(0,3);

  summary.innerHTML="<div class='text-purple-500 text-lg'><b>✔️ 추천 조합 Top3</b></div>"+
    topPlans.map((p,i)=>`
      <div class="summary-line mt-5 text-sm leading-6">
        <button class='btn btn-outline btn-primary mr-3' style='border-width:2px !important;' onclick="choosePlan(${i})">${i+1}안 선택</button>
        폭 <b>${p.width}mm</b> × 도어 <b>${p.doors}개</b>
        · 서라운드 <b>${Math.round(p.surround)}mm</b>/측 (남는폭 ${p.leftover}mm)
      </div>
    `).join("");
}

function choosePlan(idx){
  const p = topPlans[idx];
  currentPlan = p;
  selections = Array(p.doors).fill("A");

  const wrap = document.getElementById('slotsWrap');
  wrap.innerHTML = "";
  for(let i=0;i<p.doors;i++){
    const slot = document.createElement('div');
    slot.className = "slot";
    slot.innerHTML = `<h3>${i+1}통 <span class="muted">${p.width}mm</span></h3>`;
    const grid = document.createElement('div');
    grid.className = "thumb-grid";
    LETTERS.forEach(letter=>{
      const div=document.createElement('div');
      div.className="thumb"+(letter==="A"?" active":"");
      const img=document.createElement('img');
      img.src=IMG[letter]; img.alt=letter;
      div.appendChild(img);
      div.addEventListener('click',()=>{
        selections[i]=letter;
        grid.querySelectorAll('.thumb').forEach(t=>t.classList.remove('active'));
        div.classList.add('active');
        updateSequence(); renderPreview();
      });
      grid.appendChild(div);
    });
    slot.appendChild(grid);
    wrap.appendChild(slot);
  }

  document.getElementById('designCard').style.display="block";
  updateSequence(); renderPreview();
  window.scrollTo({ top: document.getElementById('designCard').offsetTop - 10, behavior:'smooth' });
}

// ---------- 시퀀스 (디시미터 표기, 공백 없음 / 통=빨강, 서라운드=검정)
function mmToDmStr(mm){
  // 100mm = 1dm
  const dm = mm/100;
  return (Math.round(dm*10)/10).toString().replace(/\.0$/,''); // 9.0 -> 9
}

function buildCompactSequence(){
  if(!currentPlan) return {html:"-", text:"-"};
  const widthDm = mmToDmStr(currentPlan.width);
  const surrDm = mmToDmStr(Math.round(currentPlan.surround)*10); // mm → dm
  const left = `<span class="k">${surrDm}L</span>`;
  const right = `<span class="k">${surrDm}R</span>`;
  const mids = selections.map(ch=> `<span class="r">${widthDm}${ch}</span>`);
  const html = [left, ...mids, right].join('-');
  const text = html.replace(/<[^>]+>/g,''); // 태그 제거 텍스트
  return {html, text};
}

function updateSequence(){
  const out = buildCompactSequence();
  const box = document.getElementById('seqCompact');
  box.innerHTML = out.html;
  box.dataset.copy = out.text;
}

function copyCompact(){
  const box = document.getElementById('seqCompact');
  const raw = box.dataset.copy || box.textContent;
  const middle = raw.replace(/^(?:\d+(?:\.\d+)?)L-/, '').replace(/-\d+(?:\.\d+)?R$/, '');
  navigator.clipboard.writeText(middle).then(()=>alert("복사 완료\n상품 옵션 첫 칸에 붙여넣어 주세요."));
}

// ---------- 미리보기 (통끼리 완전 밀착, 서라운드 표시, 슬라이딩은 중앙 3mm 선 없음)
async function renderPreview(){
  const canvas=document.getElementById('previewCanvas'), ctx=canvas.getContext('2d');
  if(!currentPlan){canvas.width=0;canvas.height=0;return;}
  const unitH=260
  const labelH=26, maxLabelH=55
  let innerGap=-10
  let surroundGap=-2; // 통 사이 간격 (음수면 겹침)
  let pxPerMm=0.16;


  const totalMm = currentPlan.width * currentPlan.doors;
  let sPx = Math.max(3, Math.round(currentPlan.surround*pxPerMm));
  // let totalW = sPx + totalMm*pxPerMm + gap*(currentPlan.doors-1) + sPx;
  let totalW = sPx + totalMm*pxPerMm + sPx + innerGap*(currentPlan.doors-1) + surroundGap*2;

  const previewBox = canvas.parentElement;
  let previewAvailableWidth = Infinity;
  if(previewBox){
    const previewStyles = window.getComputedStyle(previewBox);
    const paddingLeft = parseFloat(previewStyles.paddingLeft) || 0;
    const paddingRight = parseFloat(previewStyles.paddingRight) || 0;
    previewAvailableWidth = Math.max(previewBox.clientWidth - paddingLeft - paddingRight, 0);
  }

  const maxW=1200;
  if(totalW>maxW){
    const mmPart=(totalMm*pxPerMm)+(2*sPx);
    const scale=(maxW - gap*(currentPlan.doors-1)) / mmPart;
    pxPerMm*=scale; sPx=Math.max(3,Math.round(currentPlan.surround*pxPerMm));
    // totalW=Math.round(sPx + totalMm*pxPerMm + gap*(currentPlan.doors-1) + sPx);
    totalW=Math.round(sPx + totalMm*pxPerMm + sPx  + innerGap*(currentPlan.doors-1) + surroundGap*2);
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

  for(let i=0;i<currentPlan.doors;i++){
    const mm=currentPlan.width, w=mm*pxPerMm;
    const letter=selections[i], src=IMG[letter];
    let actualWidth = w; // 이미지 로드 실패 시 기본값
    try{
      const img=await loadImage(src);
      const ratio=Math.min(w/img.width, unitH/img.height);
      const dw=Math.round(img.width*ratio), dh=Math.round(img.height*ratio);
      const ix=x, iy=Math.round((unitH-dh)/2); // 왼쪽 정렬
      ctx.drawImage(img, ix, iy, dw, dh);
      actualWidth = dw; // 이미지의 실제 너비 사용
    }catch(e){
      ctx.strokeStyle="#999"; ctx.strokeRect(x+4,4,w-8,unitH-8);
      ctx.fillStyle="#333"; ctx.font="bold 22px system-ui"; ctx.textAlign="center";
      ctx.fillText(letter, x + w/2, unitH/2 + 8);
    }
    // 하단 폭 라벨
    ctx.fillStyle="#111"; ctx.font="12px system-ui"; ctx.textAlign="center";
    ctx.fillText(`${mm}mm`, x + w/2, unitH + labelH - 8);
    
    x += actualWidth; // 이미지의 실제 너비만큼 이동
    if (i < currentPlan.doors - 1) {
      x += innerGap;
    } else {
      x += surroundGap;
    }
  }

  // 우 서라운드
  ctx.fillStyle="#f0f0f0"; ctx.fillRect(x,0,sPx,unitH);
  ctx.strokeStyle="#cfcfcf"; ctx.strokeRect(x+0.5,0.5,sPx-1,unitH-1);
  // ctx.fillStyle="#555"; ctx.fillText(`R${Math.round(currentPlan.surround)}mm`, x + sPx/2, unitH-8);
  
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

function loadImage(src){ return new Promise((res,rej)=>{ const i=new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=src; }); }

// 최종이미지 저장
function downloadPreview(){
  const c=document.getElementById('previewCanvas');
  if(!c||c.width===0){ alert("먼저 디자인을 선택하세요."); return; }
  const filename = `최종조립_슬라이딩_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.png`;
  const a=document.createElement('a'); a.href=c.toDataURL("image/png"); a.download=filename; a.click();
}

