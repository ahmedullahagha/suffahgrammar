/* Content helpers shared by the reader and the snapshot generator. Raw HTML is never rendered. */
(function(root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./vendor/js-yaml.min.js'));
  else root.SuffahNews = factory(root.jsyaml);
})(typeof globalThis !== 'undefined' ? globalThis : this, function(yaml) {
  const types = {_posts:'post', _announcements:'announcement', _newsletters:'newsletter', _galleries:'gallery'};
  const labels = {post:'School news', announcement:'Announcements', newsletter:'Newsletters', gallery:'Galleries'};
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function safeURL(value) {
    const s = String(value || '').trim();
    if (!s || /[\u0000-\u0020\u007f\\]/.test(s) || s.startsWith('//')) return '';
    if (/^(https?:|mailto:|tel:)/i.test(s)) return s;
    if (/^[a-z][a-z\d+.-]*:/i.test(s)) return '';
    return s;
  }
  const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const plain = s => String(s || '').replace(/!\[([^\]]*)\]\([^)]*\)/g,'$1').replace(/\[([^\]]*)\]\([^)]*\)/g,'$1').replace(/[#*_`>]/g,'').replace(/\s+/g,' ').trim();
  function parse(path, text, now = Date.now()) {
    const match = text.replace(/^\uFEFF/,'').match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
    if (!match) return null;
    const d = yaml.load(match[1], {schema:yaml.JSON_SCHEMA});
    if (!d || typeof d !== 'object' || typeof d.title !== 'string' || d.published === false || d.published === 'false') return null;
    const type = types[path.split('/')[0]], date = new Date(d.date).getTime();
    if (!type || !Number.isFinite(date) || date > now) return null;
    let photos = Array.isArray(d.photos) ? d.photos : String(d.photos || '').split(',').filter(Boolean);
    photos = photos.map(p => typeof p === 'string' ? {image:safeURL(p),caption:''} : {image:safeURL(p?.image),caption:String(p?.caption || '')}).filter(p=>p.image);
    if (type === 'gallery' && !photos.length) return null;
    const sections = Array.isArray(d.sections) ? d.sections.map(s=>({heading:String(s?.heading || ''),content:String(s?.content || ''),image:safeURL(s?.image)})) : [];
    const body = match[2].trim(), summary = plain(d.summary || d.description || d.intro || body);
    return {id:type+'-'+path.split('/').pop().replace(/\.md$/,''),path,type,title:d.title,date:new Date(date).toISOString(),category:String(d.category || ''),author:String(d.author || ''),summary:summary.slice(0,210)+(summary.length>210?'…':''),body,image:safeURL(d.image || d.cover || photos[0]?.image),caption:String(d.image_caption || ''),photos,sections,intro:String(d.intro || ''),issue:String(d.issue || ''),important:d.important === true};
  }
  function format(s) {
    return esc(s).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\*([^*]+)\*/g,'<em>$1</em>');
  }
  function inline(s) {
    let out='',last=0;
    const re = /(!?)\[([^\]]*)\]\(([^\s)]+)\)/g;
    for (const m of s.matchAll(re)) {
      out += format(s.slice(last,m.index));
      const url = safeURL(m[3]);
      out += !url ? esc(m[2]) : m[1] ? `<img src="${esc(url)}" alt="${esc(m[2])}" loading="lazy" decoding="async">` : `<a href="${esc(url)}" rel="noopener noreferrer">${format(m[2])}</a>`;
      last=m.index+m[0].length;
    }
    return out+format(s.slice(last));
  }
  function markdown(text) {
    const lines=String(text || '').replace(/\r/g,'').split('\n');let html='',para=[],list='',inCode=false,code=[];
    const flush=()=>{if(para.length){html+='<p>'+inline(para.join(' '))+'</p>';para=[];}};
    const endList=()=>{if(list){html+=`</${list}>`;list='';}};
    for(const line of lines){
      if(/^```/.test(line)){flush();endList();if(inCode){html+='<pre><code>'+esc(code.join('\n'))+'</code></pre>';code=[];}inCode=!inCode;continue;}
      if(inCode){code.push(line);continue;}
      if(!line.trim()){flush();endList();continue;}
      const h=line.match(/^(#{1,6})\s+(.+)/),li=line.match(/^\s*(?:([-*+])|\d+\.)\s+(.+)/);
      if(h){flush();endList();const n=Math.min(h[1].length+1,6);html+=`<h${n}>${inline(h[2])}</h${n}>`;}
      else if(li){flush();const t=li[1]?'ul':'ol';if(list!==t){endList();list=t;html+=`<${t}>`;}html+='<li>'+inline(li[2])+'</li>';}
      else if(/^>\s?/.test(line)){flush();endList();html+='<blockquote><p>'+inline(line.replace(/^>\s?/,''))+'</p></blockquote>';}
      else if(/^---+$/.test(line)){flush();endList();html+='<hr>';}
      else {endList();para.push(line.trim());}
    }
    flush();endList();if(inCode)html+='<pre><code>'+esc(code.join('\n'))+'</code></pre>';return html;
  }
  const archived = (p,now=Date.now()) => p.type==='announcement' && now-new Date(p.date).getTime()>90*86400000;
  const reading = p => Math.max(1,Math.ceil(plain(p.body+' '+p.sections.map(s=>s.content).join(' ')).split(/\s+/).length/200));
  const dateLabel = d => new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Karachi'});
  const titleLabel = p => p.type === 'post' ? ({news:'School news',academic:'Academic update',events:'Events',community:'Community',admissions:'Admissions'}[p.category] || p.category || labels.post) : labels[p.type];
  const urlFor = p => 'blog.html?post='+encodeURIComponent(p.id);
  function card(p,featured=false) {
    const image=p.image?`<div class="story-image"><img src="${esc(p.image)}" alt="${esc(p.caption || '')}" loading="lazy" decoding="async" width="800" height="450"></div>`:'';
    return `<article class="story-card${featured?' featured-story':''}${!p.image?' text-story':''}">${image}<div class="story-copy"><div class="story-meta"><span class="category">${esc(titleLabel(p))}</span>${archived(p)?'<span class="archive-badge">Archived notice</span>':''}${p.important&&!archived(p)?'<span class="priority-badge">Important</span>':''}</div><h${featured?'2':'3'}><a href="${urlFor(p)}" data-post="${esc(p.id)}">${esc(p.title)}</a></h${featured?'2':'3'}><p>${esc(p.summary)}</p><div class="story-bottom"><time datetime="${esc(p.date)}">${dateLabel(p.date)}</time><span>${reading(p)} min read</span></div><a class="story-read" href="${urlFor(p)}" data-post="${esc(p.id)}">${p.type==='gallery'?'View gallery':'Read story'} <span aria-hidden="true">↗</span><span class="sr-only">: ${esc(p.title)}</span></a></div></article>`;
  }
  function select(items,category='all',query='',sort='newest') {
    const words=query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return items.filter(p=>(category==='all'||p.type===category)&&words.every(w=>(p.title+' '+p.summary+' '+p.body+' '+p.category).toLowerCase().includes(w))).sort((a,b)=>sort==='oldest'?new Date(a.date)-new Date(b.date):new Date(b.date)-new Date(a.date));
  }
  return {types,labels,esc,safeURL,slug,plain,parse,markdown,archived,reading,dateLabel,titleLabel,urlFor,card,select};
});
