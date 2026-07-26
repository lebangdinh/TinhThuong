const $ = id => document.getElementById(id);
const currency = new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND',maximumFractionDigits:0});
const number = new Intl.NumberFormat('vi-VN',{maximumFractionDigits:2});
const percent = v => `${number.format(v*100)}%`;

const defaults={period:'T7.2026',revenue:10000000000,region:'V02',storeCount:2,profitStoreCount:2,revenueCompletion:'',profitCompletion:'',battleCost:0,delegatedHours:0,delegatedRate:2000,managers:[{name:'Quản lý 1',hours:0}],shifts:[{name:'Trưởng ca 1',hours:0}]};
const appearanceDefaults={theme:'hch',font:'bevietnam'};
const K1={V01:1,V02:.97,V03:.93,V04:.9};
const K2={1:[1,1,1,1,1],2:[1.1,1.08,1.05,1.03,1],3:[1.4,1.3,1.15,1.1,1.03],4:[1.6,1.4,1.2,1.15,1.05],5:[1.6,1.5,1.3,1.2,1.1]};
let state=structuredClone(defaults),appearance={...appearanceDefaults},lastResult=null;

function revenueBand(revenue){if(revenue<3e9)return{name:'Dưới 3 tỷ',index:0};if(revenue<5e9)return{name:'Từ 3 - 5 tỷ',index:1};if(revenue<12e9)return{name:'Từ 5 - 12 tỷ',index:2};if(revenue<16e9)return{name:'Từ 12 - 16 tỷ',index:3};return{name:'Trên 16 tỷ',index:4};}
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const revenueRewardRate=c=>clamp(1+(c-1)*(c<1?2:1),.5,2);
const profitRewardRate=c=>clamp(1+(c-1)*(c<1?2:1)+(c>1.2?(c-1.2)*4:0),.5,2);
const num=id=>Number($(id).value)||0;
function optionalPercent(id){const raw=$(id).value.trim();return raw===''?null:Number(raw)/100;}
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}

function readPeople(containerId){return[...$(containerId).querySelectorAll('.person-row')].map(row=>({name:row.querySelector('.person-name').value.trim()||'Chưa đặt tên',hours:Number(row.querySelector('.person-hours').value)||0}));}
function readState(){state.period=$('period').value.trim();state.revenue=num('revenue');state.region=$('region').value;state.storeCount=num('storeCount');state.profitStoreCount=num('profitStoreCount');state.revenueCompletion=$('revenueCompletion').value.trim();state.profitCompletion=$('profitCompletion').value.trim();state.battleCost=num('battleCost');state.delegatedHours=num('delegatedHours');state.delegatedRate=num('delegatedRate');state.managers=readPeople('managerRows');state.shifts=readPeople('shiftRows');}

function calculate(){
  readState();
  const errors=[];
  if(state.profitStoreCount>state.storeCount)errors.push('Số siêu thị đạt target LNTT không được lớn hơn tổng số siêu thị.');
  if(state.revenue<0)errors.push('Doanh thu không được âm.');
  const validation=$('validation');validation.hidden=!errors.length;validation.innerHTML=errors.join('<br>');
  const band=revenueBand(state.revenue),k1=K1[state.region],k2=K2[state.storeCount]?.[band.index]??1;
  const revComplete=optionalPercent('revenueCompletion'),profitComplete=optionalPercent('profitCompletion');
  const hasRev=revComplete!==null,hasProfit=profitComplete!==null,revRate=hasRev?revenueRewardRate(revComplete):0,profitRate=hasProfit?profitRewardRate(profitComplete):0;
  const scaleRate=Math.max(0,(state.profitStoreCount-1)*.05),totalCost=state.battleCost+state.delegatedHours*state.delegatedRate;
  const managerStandard=(10000000+Math.pow(state.revenue,.65)*5.5)*k1*k2,shiftStandard=Math.pow(state.revenue,.9)*.016*k1*k2;
  const managerTarget=hasRev&&hasProfit?managerStandard*.6*revRate+managerStandard*.4*profitRate+managerStandard*.4*scaleRate-totalCost:0;
  const shiftTarget=hasRev&&hasProfit?shiftStandard*.6*revRate+shiftStandard*.4*profitRate+shiftStandard*.4*scaleRate:0;
  const managerHours=state.managers.reduce((s,p)=>s+p.hours,0),shiftHours=state.shifts.reduce((s,p)=>s+p.hours,0);
  const managerFactor=Math.min(managerHours/180,1),shiftFactor=Math.min(shiftHours/180,1);
  const managerPool=Math.max(0,managerTarget*managerFactor),shiftPool=Math.max(0,shiftTarget*shiftFactor);
  lastResult={band,k1,k2,revComplete,profitComplete,revRate,profitRate,scaleRate,totalCost,managerStandard,shiftStandard,managerHours,shiftHours,managerFactor,shiftFactor,managerPool,shiftPool,hasRev,hasProfit};
  render(lastResult);return lastResult;
}

function scenarioPool(type,completion){
  const r=lastResult;if(!r)return 0;
  const rr=type==='rev'?revenueRewardRate(completion):r.revRate;
  const pr=type==='profit'?profitRewardRate(completion):r.profitRate;
  if(type==='rev'&&!r.hasProfit)return 0;if(type==='profit'&&!r.hasRev)return 0;
  const standard=type==='rev'?r.managerStandard:r.shiftStandard;
  const target=standard*.6*rr+standard*.4*pr+standard*.4*r.scaleRate-(type==='rev'?r.totalCost:0);
  return Math.max(0,target*(type==='rev'?r.managerFactor:r.shiftFactor));
}

function render(r){
  $('periodLabel').textContent=state.period||'Chưa chọn kỳ';
  $('managerPool').textContent=currency.format(r.managerPool);$('shiftPool').textContent=currency.format(r.shiftPool);
  $('managerProgress').textContent=r.hasRev?`${number.format(r.revComplete*100)}% Hoàn thành`:'0,0% Hoàn thành';
  $('shiftProgress').textContent=r.hasProfit?`${number.format(r.profitComplete*100)}% Hoàn thành`:'0,0% Hoàn thành';
  $('k1').textContent=number.format(r.k1);$('revenueBand').textContent=r.band.name;$('k2').textContent=number.format(r.k2);
  $('revenueRate').textContent=r.hasRev?percent(r.revRate):'Chưa nhập';$('profitRate').textContent=r.hasProfit?percent(r.profitRate):'Chưa nhập';$('scaleRate').textContent=percent(r.scaleRate);
  $('managerStandard').textContent=currency.format(r.managerStandard);$('shiftStandard').textContent=currency.format(r.shiftStandard);$('totalCost').textContent=currency.format(r.totalCost);
  $('managerHourFactor').textContent=`${number.format(r.managerHours)} giờ · ${percent(r.managerFactor)}`;$('shiftHourFactor').textContent=`${number.format(r.shiftHours)} giờ · ${percent(r.shiftFactor)}`;
  $('rev100').textContent=r.hasProfit?currency.format(scenarioPool('rev',1)):'Nhập LNTT';$('rev120').textContent=r.hasProfit?currency.format(scenarioPool('rev',1.2)):'Nhập LNTT';$('rev150').textContent=r.hasProfit?currency.format(scenarioPool('rev',1.5)):'Nhập LNTT';
  $('profit100').textContent=r.hasRev?currency.format(scenarioPool('profit',1)):'Nhập DT';$('profit120').textContent=r.hasRev?currency.format(scenarioPool('profit',1.2)):'Nhập DT';$('profit140').textContent=r.hasRev?currency.format(scenarioPool('profit',1.4)):'Nhập DT';
  renderPeopleAmounts('managerRows',state.managers,r.managerPool,r.managerHours);renderPeopleAmounts('shiftRows',state.shifts,r.shiftPool,r.shiftHours);
  renderAllocation('managerAllocation',state.managers,r.managerPool,r.managerHours);renderAllocation('shiftAllocation',state.shifts,r.shiftPool,r.shiftHours);
  $('saveStatus').textContent='Có thay đổi chưa lưu';
}
function renderPeopleAmounts(containerId,people,pool,totalHours){[...$(containerId).querySelectorAll('.person-row')].forEach((row,i)=>{const p=people[i],amount=totalHours?pool*p.hours/totalHours:0;row.querySelector('.person-amount').textContent=currency.format(amount);});}
function renderAllocation(id,people,pool,totalHours){const box=$(id);box.innerHTML='';const active=people.filter(p=>p.hours>0);if(!active.length){box.innerHTML='<div class="empty">Chưa nhập giờ công.</div>';return;}active.forEach(p=>{const amount=totalHours?pool*p.hours/totalHours:0;const el=document.createElement('div');el.className='allocation-item';el.innerHTML=`<span>${escapeHtml(p.name)} · ${number.format(p.hours)} giờ</span><strong>${currency.format(amount)}</strong>`;box.appendChild(el);});}
function renderPeople(type){const manager=type==='manager',box=$(manager?'managerRows':'shiftRows'),people=manager?state.managers:state.shifts;box.innerHTML='';people.forEach((p,i)=>{const row=document.createElement('div');row.className='person-row';row.innerHTML=`<input class="person-name" aria-label="Họ tên" value="${escapeHtml(p.name)}"><input class="person-hours" aria-label="Giờ công" type="number" min="0" step="0.5" value="${p.hours}"><span class="person-amount">0 ₫</span><button class="icon-btn" title="Xóa" data-remove="${type}" data-index="${i}">×</button>`;box.appendChild(row);});}
function fillForm(){['period','revenue','region','storeCount','profitStoreCount','revenueCompletion','profitCompletion','battleCost','delegatedHours','delegatedRate'].forEach(id=>$(id).value=state[id]??'');renderPeople('manager');renderPeople('shift');calculate();$('saveStatus').textContent='Đã tải dữ liệu';}
function save(){readState();localStorage.setItem('bonusCalculatorData',JSON.stringify(state));$('saveStatus').textContent='Đã lưu trên thiết bị';}
function applyAppearance(){document.documentElement.dataset.theme=appearance.theme;document.documentElement.dataset.font=appearance.font;$('themeSelect').value=appearance.theme;$('fontSelect').value=appearance.font;localStorage.setItem('bonusCalculatorAppearance',JSON.stringify(appearance));}
function download(name,content,type){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([content],{type}));a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);}
function exportJson(){readState();download(`du-lieu-thuong-${state.period.replace(/\s+/g,'-')}.json`,JSON.stringify(state,null,2),'application/json');}
function exportCsv(){const r=calculate(),rows=[['Nhóm','Họ tên','Giờ công','Tỷ trọng','Tiền thưởng']];[['Quản lý',state.managers,r.managerPool,r.managerHours],['Trưởng ca',state.shifts,r.shiftPool,r.shiftHours]].forEach(([group,people,pool,total])=>people.filter(p=>p.hours>0).forEach(p=>rows.push([group,p.name,p.hours,total?p.hours/total:0,total?pool*p.hours/total:0])));download(`bang-thuong-${state.period.replace(/\s+/g,'-')}.csv`,'\ufeff'+rows.map(row=>row.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n'),'text/csv;charset=utf-8');}

document.addEventListener('input',e=>{if(e.target.matches('input,select')&&!e.target.matches('#themeSelect,#fontSelect'))calculate();});
document.addEventListener('change',e=>{if(e.target.matches('select')&&!e.target.matches('#themeSelect,#fontSelect'))calculate();});
document.addEventListener('click',e=>{const add=e.target.dataset.add;if(add){readState();const list=add==='manager'?state.managers:state.shifts;list.push({name:add==='manager'?`Quản lý ${list.length+1}`:`Trưởng ca ${list.length+1}`,hours:0});renderPeople(add);calculate();}const remove=e.target.dataset.remove;if(remove){readState();const idx=Number(e.target.dataset.index);if(remove==='manager'){state.managers.splice(idx,1);if(!state.managers.length)state.managers.push({name:'Quản lý 1',hours:0});renderPeople('manager');}else{state.shifts.splice(idx,1);if(!state.shifts.length)state.shifts.push({name:'Trưởng ca 1',hours:0});renderPeople('shift');}calculate();}});
$('settingsBtn').onclick=()=>$('settingsPanel').hidden=!$('settingsPanel').hidden;$('closeSettings').onclick=()=>$('settingsPanel').hidden=true;
$('themeSelect').addEventListener('change',e=>{appearance.theme=e.target.value;applyAppearance();});$('fontSelect').addEventListener('change',e=>{appearance.font=e.target.value;applyAppearance();});
$('saveBtn').onclick=save;$('resetBtn').onclick=()=>{if(confirm('Xóa dữ liệu đang nhập và đưa biểu mẫu về trạng thái ban đầu?')){state=structuredClone(defaults);localStorage.removeItem('bonusCalculatorData');fillForm();}};$('printBtn').onclick=()=>window.print();$('exportJsonBtn').onclick=exportJson;$('exportCsvBtn').onclick=exportCsv;
try{const saved=JSON.parse(localStorage.getItem('bonusCalculatorData'));if(saved)state={...structuredClone(defaults),...saved};}catch{}
try{const savedAppearance=JSON.parse(localStorage.getItem('bonusCalculatorAppearance'));if(savedAppearance)appearance={...appearanceDefaults,...savedAppearance};}catch{}
applyAppearance();fillForm();
