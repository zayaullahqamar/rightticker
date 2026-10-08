import fs from 'node:fs/promises';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.txt':'text/plain; charset=utf-8'};
const assets={};for(const file of await fs.readdir('public')){const ext=file.slice(file.lastIndexOf('.'));assets['/'+file]={body:await fs.readFile('public/'+file,'utf8'),type:mime[ext]||'text/plain'};}
await fs.rm('dist',{recursive:true,force:true});await fs.mkdir('dist/server',{recursive:true});await fs.mkdir('dist/.openai',{recursive:true});
await fs.writeFile('dist/server/index.js','const ASSETS='+JSON.stringify(assets)+';\n'+await fs.readFile('worker/index.js','utf8'));
await fs.copyFile('.openai/hosting.json','dist/.openai/hosting.json');
await fs.cp('drizzle','dist/drizzle',{recursive:true});console.log('Worker, page assets and migrations built.');
