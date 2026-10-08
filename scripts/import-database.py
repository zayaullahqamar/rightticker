from pathlib import Path
import openpyxl,json,re,math,collections,hashlib,sys,datetime
path=Path(sys.argv[1])
import_date=datetime.date.today().isoformat()
w=openpyxl.load_workbook(path,data_only=True,read_only=True);rows=list(w.active.values);headers=[str(v) if v is not None else 'History '+str(i-39) for i,v in enumerate(rows[0])]
def num(v):
 if isinstance(v,(int,float)) and not isinstance(v,bool) and math.isfinite(v):return v
 if isinstance(v,str):
  try:return float(v.strip().removesuffix('%').replace(',',''))
  except:return None
 return None
def rng(v):
 m=re.fullmatch(r'\s*(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)\s*',str(v))
 return [float(x) for x in m.groups()] if m else [None,None]
fields={'de':3,'dividend':4,'fcf':5,'marketCap':6,'profitGrowth':7,'ev':8,'revenueGrowth':9,'roe':10,'paidUp':11,'price':12,'book':13,'holding':15,'pe':16,'peg':17,'current':18,'quick':19,'beta':20,'intrinsicPercent':21,'valueRank':22,'ratio52':23,'growth3':24,'effort':25,'efficiency':26,'up':27,'oldScore':28,'score':29,'averageMove':31,'ratio15':33,'eps':35,'volume':37,'alternatePe':38,'dma200':39}
stocks=[]
for rowno,row in enumerate(rows[1:],2):
 if not row[0]:continue
 s={k:num(row[i]) for k,i in fields.items()}
 for k in ['growth3','effort','efficiency','up']:
  if s[k] is not None:s[k]=round(s[k]*100,8)
 s.update(ticker=str(row[0]).removeprefix('NSE:'),name=str(row[1] or row[0]),sector=str(row[2]) if row[2] and not str(row[2]).startswith('#') else 'Not Available',intrinsicMin=rng(row[14])[0],intrinsicMax=rng(row[14])[1],low52=rng(row[34])[0],high52=rng(row[34])[1],low3=rng(row[32])[0],high3=rng(row[32])[1],volumeAvg=num(row[36]),dma90=None,sentiment=None,expectedReturn=None,history=[num(v) for v in row[40:100]],sourceSupport=str(row[30] or ''),sourceRow=rowno,sourceValues=list(row))
 cap=s['marketCap'];s['type']='Not Available' if cap is None else 'Large cap' if cap>=20000 else 'Mid cap' if cap>=5000 else 'Small cap'
 stocks.append(s)
assert stocks and len(stocks)==len({s['ticker'] for s in stocks}), 'Missing or duplicate tickers'
keys=['pe','roe','de','fcf','profitGrowth','revenueGrowth','ev','peg','eps','current']
sectors=collections.defaultdict(list)
for s in stocks:
 if s['sector']!='Not Available':sectors[s['sector']].append(s)
averages={sector:{k:sum(v)/len(v) if (v:=[s[k] for s in group if s[k] is not None]) else None for k in keys} for sector,group in sectors.items()}
metadata={'source':path.name,'importedAt':import_date,'asOf':None,'count':len(stocks),'sourceSha256':hashlib.sha256(path.read_bytes()).hexdigest(),'note':'Uploaded Excel snapshot · '+import_date+' · not a live feed','history':'Latest 60 supplied closing prices, newest first; extra historical columns retained in source export.','capClassification':'Display groups based on supplied market cap: Large ≥ ₹20,000 Cr; Mid ≥ ₹5,000 Cr; Small below ₹5,000 Cr. Not an official exchange classification.','sectorAverages':'Arithmetic means of available numeric values within each supplied sector; workbook zeros included; errors/blanks excluded.'}
data={'metadata':metadata,'headers':headers,'stocks':stocks,'sectorAverages':averages}
Path('public/stocks-data.js').write_text('const STOCK_DATABASE = '+json.dumps(data,ensure_ascii=False,separators=(',',':'),allow_nan=False).replace('<','\\u003c')+';\n')
