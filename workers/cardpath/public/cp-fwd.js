/* cp-fwd.js — X2: forward query (lid, cq_*, gclid, utm) ke internal links */
(function(){
  try{
    var q=new URLSearchParams(location.search);
    if(![...q.keys()].length) return;
    var keys=['lid','cp','o','cq_timing','cq_regen','cq_id','cq_goal','cq_dep','cq_pos','cq_match','g','gclid','utm_source','utm_campaign','utm_content','utm_term','utm_medium'];
    document.addEventListener('click',function(e){
      var a=e.target.closest && e.target.closest('a[href]');
      if(!a) return;
      var h=a.getAttribute('href')||'';
      if(!h || h.charAt(0)!=='/' || h.indexOf('//')===0) return;
      if(h.indexOf('/go/')===1) return; // /go biarkan server handle utuh
      var u=new URL(h, location.origin);
      var changed=false;
      keys.forEach(function(k){ var v=q.get(k); if(v && !u.searchParams.get(k)){ u.searchParams.set(k,v); changed=true; } });
      if(changed) a.setAttribute('href', u.pathname+'?'+u.searchParams.toString());
    }, true);
  }catch(e){}
})();