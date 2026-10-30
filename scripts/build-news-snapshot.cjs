/* Run from any directory after editing the Markdown collections. No package install needed. */
const fs = require('node:fs'), path = require('node:path');
const root=path.resolve(__dirname,'..'),C=require(path.join(root,'news-core.js'));
const crypto=require('node:crypto');
const items=[];
for(const folder of Object.keys(C.types)){
 const dir=path.join(root,folder);if(!fs.existsSync(dir))continue;
 for(const name of fs.readdirSync(dir).filter(n=>n.endsWith('.md'))){
  const bytes=fs.readFileSync(path.join(dir,name));
  const item=C.parse(folder+'/'+name,bytes.toString('utf8'));
  if(item){const sha=crypto.createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');items.push({...item,sourceSha:sha});}
 }
}
items.sort((a,b)=>new Date(b.date)-new Date(a.date));
const original=fs.readFileSync(path.join(root,'blog.html'),'utf8');
const json=JSON.stringify(items).replace(/</g,'\\u003c');
let html=original.replace(/(<script id="news-snapshot" type="application\/json">)[\s\S]*?(<\/script>)/,'$1'+json+'$2');
const featured=items.find(p=>p.type==='post');
const cards=items.filter(p=>p!==featured).slice(0,6).map(p=>C.card(p)).join('');
html=html.replace(/<!-- snapshot-feature:start -->[\s\S]*?<!-- snapshot-feature:end -->/,'<!-- snapshot-feature:start -->'+(featured?'<p class="eyebrow">From the school</p>'+C.card(featured,true):'')+'<!-- snapshot-feature:end -->');
html=html.replace(/<!-- snapshot-cards:start -->[\s\S]*?<!-- snapshot-cards:end -->/,'<!-- snapshot-cards:start -->'+cards+'<!-- snapshot-cards:end -->');
html=html.replace(/<!-- snapshot-noscript:start -->[\s\S]*?<!-- snapshot-noscript:end -->/,'<!-- snapshot-noscript:start -->'+items.map(p=>'<details><summary>'+C.esc(p.title)+'</summary><p>'+C.dateLabel(p.date)+'</p><div class="article-body">'+C.markdown(p.body)+'</div></details>').join('')+'<!-- snapshot-noscript:end -->');
fs.writeFileSync(path.join(root,'blog.html'),html);
console.log('Saved '+items.length+' published updates in blog.html. Empty galleries and future/draft posts are excluded.');
