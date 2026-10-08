(() => {
 const dialog=document.getElementById('siteInfoDialog');
 const pages={
 about:['About RightTicker','<p>RightTicker brings stock fundamentals, valuation estimates and price history into one research workspace.</p><p>Compare companies with sector averages, filter stocks, save your watchlist and explore historical price movement.</p><div class="info-callout">Better context. More informed research.</div><p>The current figures come from an uploaded Excel snapshot. They are not live market quotes.</p>'],
 contact:['Contact us','<p>For product support, data corrections or advertising enquiries, our contact details will be published here once available.</p><div class="info-callout">Contact information is being set up.</div>'],
 privacy:['Your watchlist & privacy','<p>When you sign in with ChatGPT, your watchlist is saved against your account so you can access it on another device. Your email is displayed in the account menu.</p><p>Without sign-in, a cookie links your watchlist to this browser. Signing in transfers those selections to your account. Signing out keeps your account watchlist saved, but hides it from anonymous visitors on this device.</p><p>Research and news links open external services, which have their own privacy practices.</p>'],
 disclaimer:['Research disclaimer','<p>RightTicker provides research and educational information. Valuation estimates and projections are model outputs, not promises of future prices or returns.</p><p>The uploaded dataset may contain missing, delayed or inaccurate information. Verify important figures against company disclosures before making a decision.</p><p>Historical performance does not guarantee future results.</p>']
 };
 document.querySelectorAll('[data-info]').forEach(button=>button.addEventListener('click',()=>{const [title,content]=pages[button.dataset.info];document.getElementById('siteInfoTitle').textContent=title;document.getElementById('siteInfoContent').innerHTML=content;dialog.showModal();}));
 dialog.querySelector('.info-close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
})();
