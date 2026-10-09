'use strict';
let currentStock=stocks[0],activeView='overview',watchTickers=new Set(),watchReady=false,watchBusy=false,priceTab='history';
let confirmedWatchTickers=new Set(),watchSyncing=false,watchFeedbackTimer,watchAccount=null;
const metric=(key,value)=>display(value,columns.find(c=>c.key===key));
function openView(name){if(!['overview','screener','watchlist'].includes(name))return;activeView=name;document.querySelectorAll('.site-view').forEach(v=>v.hidden=v.id!=='view-'+name);document.querySelectorAll('.nav-tab').forEach(b=>{const on=b.dataset.view===name;b.classList.toggle('active',on);b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;});if(name==='overview')renderOverview();if(name==='watchlist')renderWatchlist();requestAnimationFrame(()=>{fitViewport();syncScrollControls();if(typeof fitOverview==='function')fitOverview();});}
function selectStock(ticker){const s=stocks.find(s=>s.ticker===ticker);if(!s)return;if(!overviewMatches().includes(s))$('#overviewType').value='';currentStock=s;$('#overviewSearch').value=s.ticker;openView('overview');}
function findStock(input){const text=input.trim().replace(/^NSE:/i,'').replace(/\.ns$/i,'').toLowerCase();return stocks.find(s=>s.ticker.toLowerCase()===text||s.name.toLowerCase()===text)||stocks.find(s=>text.length>1&&s.name.toLowerCase().includes(text));}
function renderHealthChecklist(s){
 const averages=STOCK_DATABASE.sectorAverages[s.sector]||{};
 const bulls=[],bears=[];
 if(Number.isFinite(s.roe)&&s.roe>=15)bulls.push({title:'High ROE ('+s.roe.toFixed(1)+'%)',sub:'Strong return generated on shareholder capital',score:10});
 if(Number.isFinite(s.de)&&s.de<0.4)bulls.push({title:'Low Debt-to-Equity ('+s.de.toFixed(2)+')',sub:'Conservative balance sheet with minimal leverage',score:9});
 if(Number.isFinite(s.profitGrowth)&&s.profitGrowth>=12)bulls.push({title:'YoY Profit Surge (+'+s.profitGrowth.toFixed(1)+'%)',sub:'Double-digit bottom line expansion',score:8});
 if(Number.isFinite(s.revenueGrowth)&&s.revenueGrowth>=10)bulls.push({title:'Solid Revenue Growth (+'+s.revenueGrowth.toFixed(1)+'%)',sub:'Healthy top-line commercial growth',score:8});
 if(Number.isFinite(s.holding)&&s.holding>=50)bulls.push({title:'High Promoter Stake ('+s.holding.toFixed(1)+'%)',sub:'Strong insider conviction and alignment',score:7});
 if(Number.isFinite(s.fcf)&&s.fcf>=3)bulls.push({title:'Positive FCF Yield ('+s.fcf.toFixed(1)+'%)',sub:'Generates real surplus cash flow',score:7});
 if(Number.isFinite(s.pe)&&Number.isFinite(averages.pe)&&s.pe>0&&s.pe<averages.pe*0.85)bulls.push({title:'Discount vs Sector P/E',sub:'P/E '+s.pe.toFixed(1)+' vs sector '+averages.pe.toFixed(1),score:6});
 if(Number.isFinite(s.dividend)&&s.dividend>=1.5)bulls.push({title:'Generous Dividend ('+s.dividend.toFixed(2)+'%)',sub:'Regular shareholder cash distributions',score:5});
 if(Number.isFinite(s.current)&&s.current>=1.5)bulls.push({title:'Healthy Liquidity (CR '+s.current.toFixed(2)+')',sub:'Current assets comfortably cover short liabilities',score:5});
 if(Number.isFinite(s.growth3)&&s.growth3>=5)bulls.push({title:'Positive 3M Momentum (+'+s.growth3.toFixed(1)+'%)',sub:'Outperforming recent quarterly trend',score:4});

 if(Number.isFinite(s.de)&&s.de>1.2)bears.push({title:'High Debt-to-Equity ('+s.de.toFixed(2)+')',sub:'Substantial leverage elevates risk',score:10});
 if(Number.isFinite(s.profitGrowth)&&s.profitGrowth<0)bears.push({title:'Declining Profit (YoY '+s.profitGrowth.toFixed(1)+'%)',sub:'Earnings contracted vs prior period',score:9});
 if(Number.isFinite(s.revenueGrowth)&&s.revenueGrowth<0)bears.push({title:'Contracting Revenue (YoY '+s.revenueGrowth.toFixed(1)+'%)',sub:'Sales slowed compared to last year',score:8});
 if(Number.isFinite(s.holding)&&s.holding<35)bears.push({title:'Low Promoter Stake ('+s.holding.toFixed(1)+'%)',sub:'Sub-35% insider equity stake',score:7});
 if(Number.isFinite(s.pe)&&Number.isFinite(averages.pe)&&s.pe>averages.pe*1.35)bears.push({title:'Premium Valuation vs Sector',sub:'P/E '+s.pe.toFixed(1)+' vs sector average '+averages.pe.toFixed(1),score:7});
 if(Number.isFinite(s.current)&&s.current<1.0)bears.push({title:'Tight Working Capital (CR '+s.current.toFixed(2)+')',sub:'Current liabilities exceed current assets',score:6});
 if(Number.isFinite(s.growth3)&&s.growth3<-8)bears.push({title:'3-Month Price Slump ('+s.growth3.toFixed(1)+'%)',sub:'Weak medium-term price momentum',score:5});
 if(Number.isFinite(s.fcf)&&s.fcf<0)bears.push({title:'Negative Free Cash Flow',sub:'Operations burning cash after capex',score:6});
 if(Number.isFinite(s.roe)&&s.roe<8&&s.roe>=0)bears.push({title:'Subdued Capital Return (ROE '+s.roe.toFixed(1)+'%)',sub:'Return below standard equity hurdle',score:5});

 bulls.sort((a,b)=>b.score-a.score);bears.sort((a,b)=>b.score-a.score);
 const topBulls=bulls.slice(0,3);if(topBulls.length===0)topBulls.push({title:'Established Business Presence',sub:'Active listed entity in '+(s.sector||'NSE'),score:1});
 const topBears=bears.slice(0,3);if(topBears.length===0)topBears.push({title:'Clean Balance Sheet Profile',sub:'No critical red flags detected in key metrics',score:1});

 return `<div class="health-checklist-card"><div class="checklist-columns"><div class="checklist-col bull"><div class="checklist-col-title"><span>🟢</span> Strengths (Bull Case)</div><ul class="checklist-items">${topBulls.map(b=>`<li class="checklist-item"><span class="item-icon">✓</span><div class="item-text"><strong>${esc(b.title)}</strong><small>${esc(b.sub)}</small></div></li>`).join('')}</ul></div><div class="checklist-col bear"><div class="checklist-col-title"><span>⚠️</span> Watchouts (Bear Case)</div><ul class="checklist-items">${topBears.map(b=>`<li class="checklist-item"><span class="item-icon">${b.score>1?'⚠':'✓'}</span><div class="item-text"><strong>${esc(b.title)}</strong><small>${esc(b.sub)}</small></div></li>`).join('')}</ul></div></div><div class="ai-research-banner"><div class="ai-banner-content"><div class="ai-banner-icon">🤖</div><div class="ai-banner-text"><strong>AI Deep Dive Report: ${esc(s.name)}</strong><span>1-click 43-point institutional analysis prompt for ChatGPT, Claude & DeepSeek.</span></div></div><button type="button" class="ai-banner-btn" id="aiDeepDiveBtn">✨ Run AI Analysis</button></div></div>`;
}

function renderOverview(){if(!refreshOverviewList())return;const s=currentStock;
const prices=s.history;
historySeries.set(s.ticker,prices);
const cards=[['dividend','Dividend Yield'],['holding','Promoter Holding'],['quick','Quick Ratio'],['pe','P/E Ratio',true],['roe','ROE',true],['book','Book Value'],['intrinsicMin','Intrinsic Value'],['marketCap','Market Cap'],['de','Debt / Equity',true],['fcf','FCF Yield',true],['profitGrowth','Profit Growth YoY',true],['revenueGrowth','Revenue Growth YoY',true],['ev','EV / EBITDA',true],['peg','PEG Ratio',true],['eps','EPS',true],['ratio52','52W vs Current Price'],['ratio15','15W vs Current Price'],['low52','52W Low – High'],['low3','2.5M Low – High'],['volume','Volume'],['current','Current Ratio',true]];
const averages=STOCK_DATABASE.sectorAverages[s.sector]||{};
$('#overviewMetrics').innerHTML=`<div class="stock-heading"><div class="stock-meta"><div class="stock-pills"><span id="overviewTicker" class="ticker-pill">NSE:${esc(s.ticker)}</span><span id="overviewSector">${esc(s.sector)}</span><span class="live-badge" title="Live market data cached every 15 min">LIVE</span></div><div class="stock-title"><h1 id="overviewName">${esc(s.name)}</h1><strong id="overviewPrice" style="display:none">LTP: ${metric('price',s.price)}</strong></div></div><div class="history-chart-row">${historySparkline(prices)}</div></div>`+cards.map(([k,l,comparison])=>`<div class="overview-metric"><span>${l}</span>${comparison?`<small class="metric-comparison" title="${esc(STOCK_DATABASE.metadata.sectorAverages)}"><span class=sector-avg-short>Sec Avg</span><span class=sector-avg-full>Sector average</span> ${metric(k,averages[k])}</small>`:''}<strong class="${['low52','low3','intrinsicMin'].includes(k)?'metric-range':''}" ${['low52','low3','intrinsicMin'].includes(k)?'tabindex="0"':''}>${(k==='low52'||k==='low3')?metric(k,s[k])+' – '+metric(k==='low52'?'high52':'high3',s[k==='low52'?'high52':'high3']):k==='intrinsicMin'?metric(k,s[k])+' – '+metric('intrinsicMax',s.intrinsicMax):metric(k,s[k])}</strong></div>`).join('');
const oldScore=s.oldScore,scoreDelta=oldScore===null||s.score===null?null:s.score-oldScore,upDays=s.up;
$('#researchSnapshot').innerHTML=`<div class="snapshot-score"><div class="score-ring" style="--score:${Math.max(0,Math.min(100,s.score))*3.6}deg"><div><strong>${s.score===null?'N/A':Math.round(s.score)}</strong><small>OUT OF 100</small></div></div><div class="score-description"><strong>Fundamental score</strong><p>Based on key financial ratios</p><div class="score-previous"><span>Previous</span><b>${oldScore===null?'Not available':oldScore.toFixed(1)}</b>${scoreDelta===null?'':`<small class="${scoreDelta<0?'negative':'positive'}">(${scoreDelta>0?'+':''}${scoreDelta.toFixed(2)}) ${scoreDelta<0?'▼':'▲'}</small>`}</div></div></div><h3 class="technical-heading">Technical & price momentum</h3><dl class="research-list">${[['200 DMA',metric('dma200',s.dma200)],['90 DMA',metric('dma90',s.dma90)],['Up Days Ratio',`<span class="up-days-bar"><i style="width:${Math.max(0,Math.min(100,upDays))}%"></i></span>`+metric('up',upDays)],['3M Net Growth',`<span class="${s.growth3<0?'negative':'positive'}">${s.growth3>0?'+':''}${metric('growth3',s.growth3)} ${s.growth3===null?'':s.growth3<0?'▼':'▲'}</span>`],['Avg Daily Move',metric('averageMove',s.averageMove)]].map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
const checklistEl=$('#healthChecklist');if(checklistEl)checklistEl.innerHTML=renderHealthChecklist(s);
const aiBtn=document.getElementById('aiDeepDiveBtn');if(aiBtn)aiBtn.onclick=()=>{const b=document.getElementById('researchBtn');if(b)b.click();};
renderValuation(s);
$('#historyContent').innerHTML=`<div class="history-overview-bar"><div class="support-row"><span id="supportLevels"></span></div><div class="history-controls"><span class="up-stat"></span><span class="down-stat"></span><span class="flat-stat"></span><span id="highlightScore" class="highlight-score"></span><label class="history-target"><span>Price</span><input id="historyTarget" aria-label="Price to highlight" type="number" value="${esc(highlightTargets.get(s.ticker)??s.price??'')}" step="any"></label><button id="highlightHistory" title="Compare available history prices with your selected price">Highlight</button></div></div><span id="highlightStatus" role="status"></span><div class="history-table-wrap"><table class="reference-history"><thead><tr>${[0,10,20,30,40,50].map(d=>`<th>${d===0?'Today':'T−'+d+' Days'}</th>`).join('')}</tr></thead><tbody>${Array.from({length:10},(_,i)=>'<tr>'+Array.from({length:6},(_,c)=>{const value=prices[c*10+i];return `<td title="${c===0&&i===0?'Latest supplied closing price':(c*10+i+1)+' sessions ago'}"${c===0&&i===0?' class="latest-close"':''}>${Number.isFinite(value)?value.toFixed(2):'N/A'}</td>`;}).join('')+'</tr>').join('')}</tbody></table></div>`;
renderSupportLevels(s);bindHistoryChart(prices);
$('#highlightHistory').onclick=applyHistoryHighlight;$('#historyTarget').onkeydown=e=>{if(e.key==='Enter')applyHistoryHighlight();};applyHistoryHighlight();
renderProjection(s);
$('#historyContent').hidden=priceTab!=='history';$('#projectionContent').hidden=priceTab!=='projection';$('#overviewWatch').setAttribute('aria-pressed',String(watchTickers.has(s.ticker)));$('#overviewWatch').setAttribute('aria-label',(watchTickers.has(s.ticker)?'Remove ':'Add ')+s.name+(watchTickers.has(s.ticker)?' from':' to')+' watchlist');$('#overviewWatch').title=watchTickers.has(s.ticker)?'Remove from watchlist':'Add to watchlist';$('#overviewWatch').disabled=!watchReady||watchBusy;
void fetchLiveOverviewData(s);
}

let liveFetchController = null;
async function fetchLiveOverviewData(s) {
 if (!s || !s.ticker) return;
 const ticker = s.ticker;
 if (liveFetchController) {
  try { liveFetchController.abort(); } catch(e){}
 }
 liveFetchController = new AbortController();
 try {
  const res = await fetch('/api/stock-live?ticker=' + encodeURIComponent(ticker), { signal: liveFetchController.signal });
  if (!res.ok) return;
  const data = await res.json();
  if (!data || data.ticker !== currentStock.ticker) return;
  
  if (Number.isFinite(data.price) && data.price > 0) s.price = data.price;
  if (Number.isFinite(data.volume) && data.volume > 0) s.volume = data.volume;
  if (Number.isFinite(data.low52) && Number.isFinite(data.high52)) {
   s.low52 = data.low52;
   s.high52 = data.high52;
  }
  if (Array.isArray(data.history) && data.history.length >= 5) {
   s.history = data.history;
  }

  const priceEl = $('#overviewPrice');
  if (priceEl && Number.isFinite(s.price)) {
   let changeHtml = '';
   if (data.change !== null && data.changePercent !== null) {
    const isUp = data.change > 0, isDown = data.change < 0;
    const cls = isUp ? 'positive' : isDown ? 'negative' : 'flat';
    const arrow = isUp ? '▲' : isDown ? '▼' : '—';
    const sign = isUp ? '+' : '';
    changeHtml = `<span class="price-change-tag ${cls}">${sign}₹${Math.abs(data.change).toFixed(2)} (${sign}${data.changePercent.toFixed(2)}%) ${arrow}</span>`;
   }
   priceEl.innerHTML = `LTP: ${metric('price', s.price)} ${changeHtml} <span class="live-badge" title="Live market data cached every 15 min">LIVE</span>`;
  }

  const metricsContainer = $('#overviewMetrics');
  if (metricsContainer) {
   metricsContainer.querySelectorAll('.overview-metric').forEach(el => {
    const label = el.querySelector('span')?.textContent?.trim();
    if (label === '52W Low – High') {
     const strong = el.querySelector('strong');
     if (strong) strong.textContent = metric('low52', s.low52) + ' – ' + metric('high52', s.high52);
    }
    if (label === 'Volume') {
     const strong = el.querySelector('strong');
     if (strong) strong.textContent = metric('volume', s.volume);
    }
   });
  }

  const checklistEl = $('#healthChecklist');
  if (checklistEl) {
   checklistEl.innerHTML = renderHealthChecklist(s);
   const aiBtn = document.getElementById('aiDeepDiveBtn');
   if (aiBtn) aiBtn.onclick = () => { const b = document.getElementById('researchBtn'); if(b) b.click(); };
  }

  const prices = s.history;
  historySeries.set(s.ticker, prices);

  const chartRow = document.querySelector('#overviewMetrics .history-chart-row');
  if (chartRow) {
   chartRow.innerHTML = historySparkline(prices);
   bindHistoryChart(prices);
  }

  const historyTbody = document.querySelector('.reference-history tbody');
  if (historyTbody && Array.isArray(prices)) {
   historyTbody.innerHTML = Array.from({length:10},(_,i)=>'<tr>'+Array.from({length:6},(_,c)=>{
    const value = prices[c*10+i];
    return `<td title="${c===0&&i===0?'Latest supplied closing price':(c*10+i+1)+' sessions ago'}"${c===0&&i===0?' class="latest-close"':''}>${Number.isFinite(value)?value.toFixed(2):'N/A'}</td>`;
   }).join('')+'</tr>').join('');
  }

  if (priceTab === 'projection') {
   projectionCache.delete(s.ticker);
   renderProjection(s);
  }

  renderValuation(s);
 } catch(err) {
  if (err.name !== 'AbortError') console.warn('Live stock fetch:', err);
 }
}

function updateStars(){document.querySelectorAll('[data-watch-stock]').forEach(b=>{const saved=watchTickers.has(b.dataset.watchStock);b.textContent=b.classList.contains('remove-watch')?'Remove':saved?'★':'☆';b.setAttribute('aria-pressed',String(saved));b.setAttribute('aria-label',(saved?'Remove ':'Add ')+b.dataset.watchStock+(saved?' from':' to')+' watchlist');b.disabled=!watchReady||watchBusy;});$('#watchCount').textContent=watchTickers.size;}
function watchMovement(s){
 const history=s.history||[],latest=history[0],previous=history[1];
 return Number.isFinite(latest)&&Number.isFinite(previous)&&previous>0?(latest-previous)/previous*100:null;
}
function watchPriceChart(s){
 const series=Array.from({length:60},(_,i)=>(s.history||[])[59-i]);
 const valid=series.map((v,i)=>({v,i})).filter(p=>Number.isFinite(p.v)&&p.v>=0);
 if(valid.length<2)return '<span class="watch-no-history">Price history unavailable</span>';
 const low=Math.min(...valid.map(p=>p.v)),high=Math.max(...valid.map(p=>p.v)),spread=high-low;
 const x=i=>8+i/59*204,y=v=>spread?50-(v-low)/spread*40:30;
 const first=series[0],last=series[59],change=Number.isFinite(first)&&first>0&&Number.isFinite(last)?(last-first)/first*100:null;
 const tone=change===null||change===0?'flat':change>0?'gain':'loss';
 const runs=[];let run=[];
 series.forEach((v,i)=>{if(Number.isFinite(v)&&v>=0)run.push({v,i});else if(run.length){runs.push(run);run=[];}});if(run.length)runs.push(run);
 const paths=runs.map(points=>{const line=points.map((p,i)=>`${i?'L':'M'}${x(p.i).toFixed(2)},${y(p.v).toFixed(2)}`).join(' ');return `<path class="watch-chart-fill" d="${line} L${x(points.at(-1).i)},58 L${x(points[0].i)},58 Z"/><path class="watch-chart-line" d="${line}"/>`;}).join('');
 return `<button class="watch-chart ${tone}" data-open-stock="${esc(s.ticker)}" aria-label="Open ${esc(s.name)} price history"><span class="watch-chart-caption"><span>60-session history</span><b>${change===null?'N/A':(change>0?'+':'')+change.toFixed(2)+'%'}</b></span><svg viewBox="0 0 220 64" role="img" aria-label="Prices from oldest to latest; gaps indicate missing data"><path class="watch-chart-grid" d="M8 18H212 M8 38H212 M8 58H212"/>${paths}${valid.map(p=>`<circle cx="${x(p.i)}" cy="${y(p.v)}" r="${p.i===59?3:1.4}"><title>${59-p.i} sessions before latest: ₹${p.v.toFixed(2)}</title></circle>`).join('')}</svg><span class="watch-chart-axis"><span>Oldest</span><span>Latest →</span></span></button>`;
}
let watchFilter='all';
function filteredWatchStocks(){return stocks.filter(s=>{if(!watchTickers.has(s.ticker))return false;const move=watchMovement(s);return watchFilter==='all'||(watchFilter==='up'&&move!==null&&move>0)||(watchFilter==='down'&&move!==null&&move<0)||(watchFilter==='flat'&&(move===null||move===0));});}
function renderWatchlist(){
 const all=stocks.filter(s=>watchTickers.has(s.ticker)),list=filteredWatchStocks(),moves=all.map(watchMovement);
 $('#watchDownload').disabled=list.length===0;$('#watchAddBtn').disabled=!watchReady||watchBusy;$('#watchEmpty').hidden=list.length!==0||!watchReady;
 $('#watchEmpty').querySelector('h3').textContent=all.length?'No stocks match this filter':'Your watchlist is empty';
 $('#watchEmpty').querySelector('p').textContent=all.length?'Choose Saved stocks to see your full watchlist.':'Add a stock above or tap the heart in Overview.';
 $('#watchBrowse').textContent=all.length?'Show saved stocks':'Open screener';
 $('#watchBrowse').onclick=()=>{if(all.length){watchFilter='all';renderWatchlist();}else openView('screener');};
 $('#watchSummary').innerHTML=[['all','Saved stocks',all.length,''],['up','Up · last close',moves.filter(v=>v!==null&&v>0).length,'gain'],['down','Down · last close',moves.filter(v=>v!==null&&v<0).length,'loss'],['flat','Unchanged / N/A',moves.filter(v=>v===null||v===0).length,'']].map(([key,label,value,tone])=>`<button type="button" class="watch-summary-item ${tone}" data-watch-filter="${key}" aria-pressed="${watchFilter===key}"><span>${label}</span><strong>${watchReady?value:'—'}</strong></button>`).join('');
 $('#watchBody').innerHTML=list.map(s=>{const move=watchMovement(s),tone=move===null||move===0?'flat':move>0?'gain':'loss';return `<tr>
 <td class="watch-company"><span class="watch-monogram" aria-hidden="true">${esc(s.ticker.slice(0,2))}</span><div><button class="company-link" data-open-stock="${esc(s.ticker)}">${esc(s.name)}</button><span class="ticker">NSE:${esc(s.ticker)}</span><span class="watch-sector">${esc(s.sector)}</span></div></td>
 <td class="watch-price" data-label="Last traded price"><strong>${metric('price',s.price)}</strong><span class="watch-change ${tone}">${move===null?'Change N/A':(move>0?'↗ +':move<0?'↘ ':'— ')+move.toFixed(2)+'%'}<small>Last close change</small></span></td>
 <td class="watch-trend">${watchPriceChart(s)}</td>
 <td data-label="P/E">${metric('pe',s.pe)}</td><td data-label="ROE">${metric('roe',s.roe)}</td>
 <td data-label="Score"><span class="score">${s.score===null?'N/A':s.score.toFixed(2)}</span></td>
 <td class="watch-value" data-label="Intrinsic value">${metric('intrinsicMin',s.intrinsicMin)} – ${metric('intrinsicMax',s.intrinsicMax)}</td>
 <td class="watch-actions"><button class="remove-watch" data-watch-stock="${esc(s.ticker)}" aria-label="Remove ${esc(s.name)} from watchlist"${watchBusy?' disabled':''}>Remove</button></td></tr>`;}).join('');updateStars();
}

function watchStatus(text){$('#watchStatus').textContent=text;}
async function loadWatchlist(){watchStatus('Loading your watchlist…');try{const response=await fetch('/api/watchlist',{credentials:'same-origin',cache:'no-store'});const data=await response.json();if(!response.ok)throw Error(data.error||'Watchlist could not be loaded.');watchTickers=new Set(data.tickers.filter(t=>stocks.some(s=>s.ticker===t)));confirmedWatchTickers=new Set(watchTickers);watchAccount=data.account||null;renderAccount();watchReady=true;watchStatus(watchAccount?'Saved to your account.':'Saved for this browser.');}catch(e){try{const saved=JSON.parse(localStorage.getItem('bullscan_watchlist')||'[]');watchTickers=new Set(saved.filter(t=>stocks.some(s=>s.ticker===t)));confirmedWatchTickers=new Set(watchTickers);watchReady=true;watchStatus('Saved offline on this browser.');}catch(err){watchReady=false;watchStatus(e.message+' Reload to retry.');}}renderWatchlist();renderOverview();updateStars();}
function updateWatchFeedback(message){
 updateStars();try{localStorage.setItem('bullscan_watchlist',JSON.stringify([...watchTickers]));}catch(e){}
 const heart=$('#overviewWatch'),saved=watchTickers.has(currentStock.ticker);
 heart.setAttribute('aria-pressed',String(saved));heart.setAttribute('aria-label',(saved?'Remove ':'Add ')+currentStock.name+(saved?' from':' to')+' watchlist');heart.title=saved?'Remove from watchlist':'Add to watchlist';heart.disabled=!watchReady;
 if(activeView==='watchlist')renderWatchlist();
 if(activeView==='overview'&&$('#overviewType').value==='watchlist'){
   if(!watchTickers.has(currentStock.ticker))requestAnimationFrame(()=>renderOverview());
   else refreshOverviewList();
 }
 if(message){watchStatus(message);$('#watchFeedback').textContent=message;clearTimeout(watchFeedbackTimer);watchFeedbackTimer=setTimeout(()=>{$('#watchFeedback').textContent='';},4000);}
}
async function changeWatchlist(ticker,forceAdd=false){
 if(!watchReady)return false;
 if(forceAdd&&watchTickers.has(ticker)){updateWatchFeedback(ticker+' is already in your watchlist.');return true;}
 const adding=forceAdd||!watchTickers.has(ticker);
 if(adding)watchTickers.add(ticker);else watchTickers.delete(ticker);
 updateWatchFeedback(ticker+(adding?' added':' removed')+' · Saving…');
 // Paint the immediate state before starting persistence; repeated taps remain usable.
 void syncWatchlist();return true;
}
async function syncWatchlist(){
 if(watchSyncing)return;watchSyncing=true;
 try{
  while(true){
   const ticker=[...new Set([...watchTickers,...confirmedWatchTickers])].find(t=>watchTickers.has(t)!==confirmedWatchTickers.has(t));
   if(!ticker)break;
   const adding=watchTickers.has(ticker);
   try{
    const r=await fetch('/api/watchlist',{method:adding?'POST':'DELETE',credentials:'same-origin',headers:{'Content-Type':'application/json','X-Watchlist-Mode':watchAccount?'account':'browser'},body:JSON.stringify({ticker})});
    const d=await r.json();if(!r.ok)throw Error(d.error||'Could not save watchlist.');
    // Only acknowledge this operation; retain newer clicks and other queued changes.
    if(adding)confirmedWatchTickers.add(ticker);else confirmedWatchTickers.delete(ticker);
    if(watchTickers.has(ticker)===adding)updateWatchFeedback(ticker+(adding?' saved to watchlist.':' removed from watchlist.'));
   }catch(e){
    if(watchTickers.has(ticker)===adding){if(confirmedWatchTickers.has(ticker))watchTickers.add(ticker);else watchTickers.delete(ticker);}
    updateWatchFeedback(e.message+' '+ticker+' change restored.');
   }
  }
 }finally{watchSyncing=false;}
}

document.querySelectorAll('.nav-tab').forEach(b=>b.addEventListener('click',()=>openView(b.dataset.view)));
document.querySelector('nav').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;const tabs=[...document.querySelectorAll('.nav-tab')];const index=tabs.findIndex(t=>t===document.activeElement);if(index<0)return;e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(index+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;openView(tabs[next].dataset.view);tabs[next].focus();});
document.addEventListener('click',e=>{const filter=e.target.closest('[data-watch-filter]');if(filter){watchFilter=filter.dataset.watchFilter;renderWatchlist();document.querySelector('[data-watch-filter="'+watchFilter+'"]').focus({preventScroll:true});return;}const watch=e.target.closest('[data-watch-stock]');if(watch){void changeWatchlist(watch.dataset.watchStock);return;}const open=e.target.closest('[data-open-stock]');if(open)selectStock(open.dataset.openStock);});
$('#overviewSearch').addEventListener('change',e=>{const s=findStock(e.target.value);if(s&&overviewMatches().includes(s))selectStock(s.ticker);});$('#overviewSearch').addEventListener('keydown',e=>{if(e.key==='Enter'){const s=findStock(e.target.value);if(s&&overviewMatches().includes(s))selectStock(s.ticker);}});
$('#stockOptions').innerHTML=stocks.map(s=>`<option value="${s.ticker}">${esc(s.name)}</option>`).join('');$('#stockBack').onclick=()=>stepOverview(-1);$('#stockNext').onclick=()=>stepOverview(1);$('#overviewWatch').onclick=()=>void changeWatchlist(currentStock.ticker);
$('#watchBrowse').onclick=()=>openView('screener');$('#watchAddBtn').onclick=async()=>{const s=findStock($('#watchAddInput').value);if(!s){watchStatus('Choose a valid company name or ticker.');return;}if(await changeWatchlist(s.ticker,true))$('#watchAddInput').value='';};$('#watchAddInput').addEventListener('keydown',e=>{if(e.key==='Enter')$('#watchAddBtn').click();});
$('#historyTab').onclick=()=>{priceTab='history';$('#historyTab').setAttribute('aria-selected','true');$('#projectionTab').setAttribute('aria-selected','false');renderOverview();};$('#projectionTab').onclick=()=>{priceTab='projection';$('#historyTab').setAttribute('aria-selected','false');$('#projectionTab').setAttribute('aria-selected','true');renderOverview();};
$('#watchDownload').onclick=()=>{const list=filteredWatchStocks();const rows=[columns.map(c=>c.label+(c.type==='pct'?' (%)':c.type==='money'?' (INR)':c.type==='cr'?' (INR Cr)':'')),...list.map(s=>columns.map(c=>s[c.key]??'Not Available'))];const w=XLSX.utils.book_new();XLSX.utils.book_append_sheet(w,XLSX.utils.aoa_to_sheet(rows),'Watchlist');XLSX.utils.book_append_sheet(w,XLSX.utils.aoa_to_sheet([['Data status',STOCK_DATABASE.metadata.note]]),'Notes');XLSX.utils.book_append_sheet(w,XLSX.utils.aoa_to_sheet([STOCK_DATABASE.headers,...list.map(s=>s.sourceValues)]),'Source data');XLSX.writeFile(w,'RightTicker-Watchlist.xls',{bookType:'biff8'});};
if(typeof MutationObserver!=='undefined')new MutationObserver(updateStars).observe($('#tbody'),{childList:true});

function overviewMatches(){const type=$('#overviewType').value;return stocks.filter(s=>!type||(type==='watchlist'?watchTickers.has(s.ticker):s.type===type));}
function refreshOverviewList(){const list=overviewMatches(),empty=list.length===0;$('#overviewEmpty').hidden=!empty;document.querySelector('.reference-metrics').hidden=empty;document.querySelector('.reference-detail').hidden=empty;for(const id of ['stockBack','stockNext','overviewSearch','overviewTickerList','overviewWatch','researchBtn','scanNewsBtn'])$('#'+id).disabled=empty;if(empty){$('#overviewSearch').value='';$('#overviewTickerList').innerHTML='';$('#overviewStockOptions').innerHTML='';$('#overviewRunStatus').textContent='0 tickers';return false;}if(!list.includes(currentStock))currentStock=list[0];$('#overviewTickerList').innerHTML=list.map(s=>`<option value="${s.ticker}">${s.ticker} · ${esc(s.name)}</option>`).join('');$('#overviewTickerList').value=currentStock.ticker;$('#overviewStockOptions').innerHTML=list.map(s=>`<option value="${s.ticker}">${esc(s.name)}</option>`).join('');$('#overviewSearch').value=currentStock.ticker;$('#overviewRunStatus').textContent=list.length+' tickers';return true;}
function stepOverview(direction){const list=overviewMatches();if(list.length)selectStock(list[(list.indexOf(currentStock)+direction+list.length)%list.length].ticker);}
$('#overviewType').onchange=()=>renderOverview();$('#overviewTickerList').onchange=e=>selectStock(e.target.value);
['overviewSentiment','overviewReturn'].forEach(id=>$('#'+id).onchange=()=>renderValuation(currentStock));

openView(location.hash==='#screener'?'screener':location.hash==='#watchlist'?'watchlist':'overview');void loadWatchlist();

// Selecting the existing query lets the first keystroke replace the ticker.
for(const event of ['focus','click'])$('#overviewSearch').addEventListener(event,e=>e.target.select());

function renderAccount(){
 $('#accountSignIn').hidden=Boolean(watchAccount);$('#accountMenu').hidden=!watchAccount;
 $('#accountEmail').textContent=watchAccount?.email||'';
 $('#watchAccountNote').innerHTML=watchAccount?'✓ Saved to your account · Available when you sign in on another device.':'Keep your watchlist across devices. <a href="/signin-with-chatgpt?return_to=%2F%23watchlist" target="_top">Sign in with ChatGPT</a>';
}
