const supportedTickers=new Set(JSON.parse(ASSETS['/stocks-data.js'].body.slice('const STOCK_DATABASE = '.length).trim().replace(/;$/, '')).stocks.map(s=>s.ticker));
export default {async fetch(request,env){
 const url=new URL(request.url);
 // Identity is supplied by the Sites authentication dispatcher, never by request JSON.
 const userId=request.headers.get('oai-authenticated-user-id');
 const email=request.headers.get('oai-authenticated-user-email');
 const signedIn=Boolean(userId&&email);
 const account=signedIn?{email}:null;

 if(url.pathname==='/api/watchlist'){
  const origin=request.headers.get('Origin');
  if(origin&&origin!==url.origin)return Response.json({error:'Request origin is not allowed'},{status:403});
  const match=(request.headers.get('Cookie')||'').match(/(?:^|;\s*)bullscan_visitor=([a-f0-9-]{36})(?:;|$)/);
  if(request.headers.get('X-Watchlist-Mode')==='account'&&!signedIn)return Response.json({error:'Your session expired. Sign in again to save your watchlist.'},{status:401});
  if(!signedIn&&!match&&request.method!=='GET')return Response.json({error:'Reload the page before saving a stock.'},{status:401});
  const visitorId=match?.[1]||crypto.randomUUID();
  const id=signedIn?'account:'+userId:visitorId;
  const headers={'Cache-Control':'no-store'};
  if(!match&&!signedIn)headers['Set-Cookie']=`bullscan_visitor=${visitorId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000`;
  try{
   if(!env.DB)throw Error('Watchlist storage not configured');
   if(signedIn&&match&&request.method==='GET'){
    // Atomically transfer this browser's guest list once, avoiding cross-account reuse.
    await env.DB.batch([
     env.DB.prepare('INSERT OR IGNORE INTO watchlist (visitor_id, ticker, created_at) SELECT ?, ticker, created_at FROM watchlist WHERE visitor_id = ?').bind(id,visitorId),
     env.DB.prepare('DELETE FROM watchlist WHERE visitor_id = ?').bind(visitorId)
    ]);
    headers['Set-Cookie']='bullscan_visitor=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
   }

   if(request.method==='POST'||request.method==='DELETE'){
    let body;try{body=await request.json();}catch{return Response.json({error:'Invalid request'},{status:400,headers});}
    if(!supportedTickers.has(body?.ticker))return Response.json({error:'Unknown ticker'},{status:400,headers});
    if(request.method==='POST')await env.DB.prepare('INSERT OR IGNORE INTO watchlist (visitor_id, ticker, created_at) VALUES (?, ?, ?)').bind(id,body.ticker,new Date().toISOString()).run();
    else await env.DB.prepare('DELETE FROM watchlist WHERE visitor_id = ? AND ticker = ?').bind(id,body.ticker).run();
   }else if(request.method!=='GET')return Response.json({error:'Method not allowed'},{status:405,headers:{...headers,Allow:'GET, POST, DELETE'}});
   const rows=await env.DB.prepare('SELECT ticker FROM watchlist WHERE visitor_id = ? ORDER BY created_at, ticker').bind(id).all();
   return Response.json({tickers:rows.results.map(r=>r.ticker),account},{headers});
  }catch(error){console.error('Watchlist request failed',error);return Response.json({error:'Watchlist is temporarily unavailable. Please try again.'},{status:503,headers});}
 }
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
 const path=url.pathname==='/'?'/index.html':url.pathname;
 const asset=ASSETS[path];
 if(!asset)return new Response('Not found',{status:404});
 return new Response(request.method==='HEAD'?null:asset.body,{headers:{'Content-Type':asset.type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}};
