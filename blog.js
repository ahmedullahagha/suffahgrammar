(() => {
  'use strict';
  const C = window.SuffahNews, $ = id => document.getElementById(id);
  let items = JSON.parse($('news-snapshot').textContent), limit = 6, listScroll = 0, refreshFailed = false;
  const listing = $('news-listing'), reader = $('news-reader');
  const validTypes = ['all',...Object.values(C.types)];
  const showMessage = message => { $('news-status').textContent = message; };
  function state() {
    const p=new URLSearchParams(location.search);
    return {category:validTypes.includes(p.get('category'))?p.get('category'):'all',query:p.get('q')||'',sort:p.get('sort')==='oldest'?'oldest':'newest',post:p.get('post')};
  }
  function updateListURL() {
    const p=new URLSearchParams();
    if($('news-search').value.trim())p.set('q',$('news-search').value.trim());
    if($('news-sort').value!=='newest')p.set('sort',$('news-sort').value);
    const active=document.querySelector('[data-category][aria-pressed="true"]')?.dataset.category||'all';
    if(active!=='all')p.set('category',active);
    history.replaceState(null,'',location.pathname+(p.size?'?'+p:''));
  }
  function drawList() {
    const s=state(), selected=C.select(items,s.category,s.query,s.sort);
    $('news-search').value=s.query; $('news-sort').value=s.sort;
    document.querySelectorAll('[data-category]').forEach(button=>{
      button.setAttribute('aria-pressed',String(button.dataset.category===s.category));
      const n=button.dataset.category==='all'?items.length:items.filter(p=>p.type===button.dataset.category).length;
      button.querySelector('span').textContent=n;
    });
    const feature = s.category==='all'&&!s.query&&s.sort==='newest' ? selected.find(p=>p.type==='post') : null;
    $('featured-story').innerHTML=feature?'<p class="eyebrow">From the school</p>'+C.card(feature,true):'';
    $('featured-story').hidden=!feature;
    const rest=selected.filter(p=>p!==feature), shown=rest.slice(0,limit);
    $('stories-grid').innerHTML=shown.map(p=>C.card(p)).join('');
    $('no-results').hidden=selected.length>0;
    $('load-more').hidden=limit>=rest.length;
    $('results-count').textContent=selected.length ? `${Math.min(limit,rest.length)+(feature?1:0)} of ${selected.length} ${selected.length===1?'update':'updates'}` : 'No matching updates';
    $('results-heading').textContent=s.category==='all'?'Latest from Suffah':C.labels[s.category];
    const notices=C.select(items,'announcement').slice(0,3);
    $('notice-list').innerHTML=notices.map(p=>`<li><span class="notice-date">${C.dateLabel(p.date)}${C.archived(p)?' · Archived':''}</span><a href="${C.urlFor(p)}" data-post="${C.esc(p.id)}">${C.esc(p.title)} <span aria-hidden="true">↗</span></a></li>`).join('')||'<li>No announcements published yet.</li>';
    $('notice-heading').textContent=notices.length&&notices.every(p=>C.archived(p))?'Notice archive':'School notices';
  }
  function image(url,caption='') {return url?`<figure><img src="${C.esc(url)}" alt="${C.esc(caption)}" loading="lazy" decoding="async">${caption?'<figcaption>'+C.esc(caption)+'</figcaption>':''}</figure>`:'';}
  function article(item) {
    const meta=`<div class="reader-meta"><span class="category">${C.esc(C.titleLabel(item))}</span><time datetime="${item.date}">${C.dateLabel(item.date)}</time><span>${C.reading(item)} min read</span>${item.author?'<span>By '+C.esc(item.author)+'</span>':''}</div>`;
    const gallery=item.type==='gallery'?'<div class="article-gallery">'+item.photos.map(p=>`<figure><a href="${C.esc(p.image)}" target="_blank" rel="noopener noreferrer" aria-label="Open photograph: ${C.esc(p.caption||item.title)}"><img src="${C.esc(p.image)}" alt="${C.esc(p.caption)}" loading="lazy" decoding="async"></a>${p.caption?'<figcaption>'+C.esc(p.caption)+'</figcaption>':''}</figure>`).join('')+'</div>':'';
    const sections=item.sections.map(s=>(s.heading?'<h2>'+C.esc(s.heading)+'</h2>':'')+image(s.image)+C.markdown(s.content)).join('');
    const related=C.select(items).filter(p=>p.id!==item.id).slice(0,2);
    reader.innerHTML=`<div class="reader-nav"><a href="blog.html" id="back-to-news">← All news & announcements</a><button type="button" id="copy-link">Copy article link</button></div><article class="reader-article">${meta}<h1 tabindex="-1" id="article-title">${C.esc(item.title)}</h1>${item.issue?'<p class="reader-issue">'+C.esc(item.issue)+'</p>':''}${C.archived(item)?'<p class="archive-note">Archived announcement · This notice was published on '+C.dateLabel(item.date)+'. Please check with the school for current arrangements.</p>':''}${item.type!=='gallery'?image(item.image,item.caption):''}<div class="article-body">${item.intro?C.markdown(item.intro):''}${C.markdown(item.body)}${sections}</div>${gallery}<div class="reader-signoff"><img src="assets/crest.webp" width="90" height="44" alt="Suffah Grammar School"><p>From the Suffah family.<br><a href="contact.html">Get in touch with the school →</a></p></div></article>${related.length?'<section class="related-stories" aria-labelledby="related-heading"><h2 id="related-heading">More from Suffah</h2><div class="related-grid">'+related.map(p=>C.card(p)).join('')+'</div></section>':''}<p id="share-status" role="status"></p>`;
    document.title=item.title+' | Suffah Grammar School';
    $('back-to-news').addEventListener('click',event=>{
      event.preventDefault();const u=new URL(location.href);u.searchParams.delete('post');u.hash='';history.pushState(null,'',u);route();window.scrollTo({top:listScroll,behavior:'instant'});
    });
    $('copy-link').addEventListener('click',async()=>{
      const u=new URL('blog.html',location.href);u.searchParams.set('post',item.id);
      try {await navigator.clipboard.writeText(u.href);$('copy-link').textContent='Link copied';$('share-status').textContent='Article link copied.';}
      catch { $('share-status').innerHTML='Copy this address to share: <a href="'+C.esc(u.href)+'">'+C.esc(u.href)+'</a>'; }
    });
  }
  function route(focus=false) {
    let s=state(), item=items.find(p=>p.id===s.post);
    if(!s.post&&location.hash&&location.hash!=='#main') {
      try { item=items.find(p=>C.slug(p.title)===decodeURIComponent(location.hash.slice(1))); } catch {}
      if(item){const u=new URL(location.href);u.hash='';u.searchParams.set('post',item.id);history.replaceState(null,'',u);}
    }
    const missing=Boolean(s.post&&!item);
    listing.hidden=Boolean(item)||missing;reader.hidden=!listing.hidden;
    if(item){article(item);if(focus)$('article-title').focus({preventScroll:true});}
    else if(missing){reader.innerHTML='<div class="missing-story"><p class="eyebrow">News & announcements</p><h1>This story isn’t available.</h1><p>It may have moved or is no longer published.</p><a class="button" href="blog.html">Browse all updates →</a></div>';document.title='Story unavailable | Suffah Grammar School';}
    else {document.title='News & Announcements | Suffah Grammar School';drawList();if(focus)window.scrollTo({top:listScroll,behavior:'instant'});}
  }
  document.addEventListener('click',event=>{
    const link=event.target.closest('a[data-post]');if(!link||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||event.button!==0)return;
    event.preventDefault();if(!listing.hidden)listScroll=window.scrollY;
    const u=new URL(location.href);u.searchParams.set('post',link.dataset.post);u.hash='';history.pushState(null,'',u);route(true);window.scrollTo({top:0,behavior:'instant'});
  });
  document.querySelectorAll('[data-category]').forEach(button=>button.addEventListener('click',()=>{
    document.querySelectorAll('[data-category]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));limit=6;updateListURL();drawList();
  }));
  $('news-search').addEventListener('input',()=>{limit=6;updateListURL();drawList();});
  $('news-sort').addEventListener('change',()=>{limit=6;updateListURL();drawList();});
  $('clear-search').addEventListener('click',()=>{history.replaceState(null,'',location.pathname);limit=6;drawList();$('news-search').focus();});
  $('load-more').addEventListener('click',()=>{limit+=6;drawList();});
  window.addEventListener('popstate',()=>route(true));
  window.addEventListener('hashchange',()=>route(true));
  document.addEventListener('error',event=>{
    if(event.target instanceof HTMLImageElement&&event.target.closest('main')){const parent=event.target.closest('.story-image');if(parent)parent.hidden=true;else event.target.replaceWith(document.createTextNode('Photograph unavailable.'));}
  },true);
  async function get(url) {
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
    try {const response=await fetch(url,{signal:controller.signal});if(!response.ok)throw new Error('Content unavailable');return response;}finally{clearTimeout(timer);}
  }
  async function refresh() {
    $('retry-news').hidden=true;showMessage('Checking for new updates…');refreshFailed=false;
    try {
      const response=await get('https://api.github.com/repos/ahmedullahagha/suffahgrammar/git/trees/main?recursive=1');const tree=await response.json();
      if(tree.truncated||!Array.isArray(tree.tree))throw new Error('Incomplete content list');
      const files=tree.tree.filter(f=>f.type==='blob'&&/^_(posts|announcements|newsletters|galleries)\/[^/]+\.md$/.test(f.path));
      const previous=new Map(items.map(p=>[p.path,p]));const updated=[];
      // Limit concurrent requests, and reuse unchanged snapshot content.
      for(let i=0;i<files.length;i+=6){await Promise.all(files.slice(i,i+6).map(async file=>{
        const old=previous.get(file.path);if(old?.sourceSha===file.sha){updated.push(old);return;}
        try {const path=file.path.split('/').map(encodeURIComponent).join('/');const res=await get(path+'?v='+file.sha);const p=C.parse(file.path,await res.text());if(p)updated.push({...p,sourceSha:file.sha});}
        catch {refreshFailed=true;if(old)updated.push(old);}
      }));}
      if(refreshFailed&&updated.length===0&&items.length)throw new Error('Unable to refresh');
      items=updated;route();showMessage(refreshFailed?'Some updates could not be refreshed. Saved stories are still available.':'Up to date');
      $('retry-news').hidden=!refreshFailed;
    } catch {showMessage('Showing saved stories. New updates are temporarily unavailable.');$('retry-news').hidden=false;}
  }
  $('retry-news').addEventListener('click',refresh);
  route();refresh();
})();
