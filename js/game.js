/* ============================================================================
   UNFAIR TRADE · the game (§4, §5.7)
   Vanilla. Uses UT.model (sim.js) for the economy. No framework.
   ============================================================================ */
(function (global) {
  'use strict';
  var M = global.UT.model;
  var reduceMotion = global.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;

  // ---- safe localStorage ----
  function lsGet(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }
  function lsSet(k,v){ try { localStorage.setItem(k,v); } catch(e){} }

  // ---- seeded run config ----
  function getSeed() {
    try {
      var p = new URLSearchParams(location.search).get('seed');
      if (p && /^\d+$/.test(p)) return parseInt(p,10) >>> 0;
    } catch(e){}
    return (Date.now() >>> 0);
  }

  // ---- DOM refs ----
  var $ = function(id){ return document.getElementById(id); };
  var el = {};
  var IDS = ['game','gameSat','gameVignette','turnNum','pips','muteBtn','closeBtn',
    'tankTreasury','valTreasury','tankCap','valCap','tankBarg','valBarg',
    'heroTreasury','beamBar','gchartSvg','gchartGrid','gchartGap','gchartMfg','gchartCom','gchartDots',
    'mfgVal','comVal','ticker','tickerText','workforce','wfPeople','laborCount','laborHint','helpBtn',
    'tut','tutSpot','tutCard','tutStep','tutTitle','tutBody','tutSkip','tutBack','tutNext','tutWait','tutStepSkip',
    'cardExport','cardBuild','cardBloc','cardDemand','exportPayoff','buildPayoff','buildImport','exportAlloc','buildAlloc','resetWorkers',
    'blocState','demandState','advanceBtn','event','eventStamp','eventTitle','eventBody','eventChoices','eventTeach',
    'over','overStamp','overRank','overRankName','overVerdict','overStats','overCopy','againBtn','storyBtn','fx','hudBottom'];

  // ---- run state ----
  var s, alloc, laborPool, deck, queuedEvent, seed, muted, started=false, savedScrollY=0, prevCommodity, prevMfg, ranOnce=false;
  var runLine; // {commodity:[...]} for debrief

  // chart geometry
  var GX0=44, GX1=700, GY0=20, GY1=340, MAXI=200, GYEARS=12;
  function gx(yr){ return GX0 + (yr/GYEARS)*(GX1-GX0); }
  function gy(v){ return GY1 - (v/MAXI)*(GY1-GY0); }

  // ============================ EVENT DECK (§4.5) ============================
  var EVENTS = [
    { id:1, name:'Commodity Super-Cycle', stamp:'MARKET EVENT', teach:'The boom-bust honeytrap: a price spike now is a crash later.',
      body:'A global scramble for raw materials sends prices soaring. Sell into the frenzy, or keep your powder dry?',
      choices:[
        { label:'EXPORT EVERYTHING', sub:'Commodity index +35 now, then −20 next year (the hangover).',
          apply:function(){ s.commodityIndex=M.clamp(s.commodityIndex+35,0,200); s.flags.superHangover=true; toast('Prices spike. Index +35.'); } },
        { label:'HOLD STEADY', sub:'A modest, durable gain. No crash to follow.',
          apply:function(){ s.commodityIndex=M.clamp(s.commodityIndex+3,0,200); toast('You hold back. +3, no hangover.'); } }
      ] },
    { id:2, name:'Price Crash', stamp:'PRICE SHOCK', teach:'Undiversified means exposed. A bloc cushions the blow.',
      body:'The market for your main export collapses overnight.',
      auto:function(){ var hit = s.flags.bloc ? 9 : 18; s.commodityIndex=M.clamp(s.commodityIndex-hit,0,200); badShake(); toast('Crash: commodity −'+hit+(s.flags.bloc?' (bloc halved it)':'.')); } },
    { id:3, name:'Drought', stamp:'CLIMATE SHOCK', teach:'Monoculture is fragile: one bad season cuts your whole income.',
      body:'A failed harvest. Fewer hands work the land this year, and what you do export sells for less.',
      auto:function(){ laborPool=4; s.flags.droughtActive=true; toast('Drought: 4 labor this year; export income halved.'); } },
    { id:4, name:'Rich-Nation Tariff Wall', stamp:'TRADE BARRIER', teach:'Only diversified economies survive protectionism. Industry income is untouched.',
      body:'Wealthy markets slam the door on raw imports for a year. Finished goods pass freely.',
      auto:function(){ s.flags.tariffNext=true; badShake(); toast('Tariff wall: raw export income blocked this year.'); } },
    { id:5, name:'GSP Preference Granted', stamp:'UNCTAD WIN', teach:'The real Generalized System of Preferences · rich markets cut tariffs for you.',
      body:'Under UNCTAD\u2019s Generalized System of Preferences, key markets lower their tariffs on your goods.',
      auto:function(){ s.incomeMult+=0.15; s.flags.gspTurns=3; toast('GSP: +15% trade income for 3 years.'); } },
    { id:6, name:'Foreign Factory Offer', stamp:'INVESTMENT', teach:'Dependency dressed as a gift: capacity now, a royalty leak forever.',
      body:'A multinational offers to build a plant on your soil: instant capacity, in exchange for a permanent cut of your trade.',
      choices:[
        { label:'ACCEPT', sub:'+15 capacity now, but −8% income every year for the rest of the game.',
          apply:function(){ s.capacity=M.clamp(s.capacity+15,0,100); s.incomeMult-=0.08; s.flags.royaltyLeak=1; toast('Factory built: +15 capacity, −8% income forever.'); } },
        { label:'DECLINE', sub:'Keep your independence. Nothing changes.',
          apply:function(){ toast('You decline the offer.'); } }
      ] },
    { id:7, name:'NIEO Reform Window', stamp:'1974 · NIEO', teach:'The 1974 New International Economic Order: a moment to push hard.',
      body:'The New International Economic Order is on the table. Your next demand at UNCTAD will carry double the weight.',
      auto:function(){ s.flags.nieo=true; toast('NIEO window: your next Demand is doubled.'); } },
    { id:8, name:'G77 Solidarity', stamp:'SOLIDARITY', teach:'Collective bargaining power: the whole point of the Group of 77.',
      body:'The Group of 77 closes ranks behind your position.',
      auto:function(){ s.bargaining=M.clamp(s.bargaining+15,0,100); toast('G77 solidarity: +15 bargaining power.'); } }
  ];

  // ============================ AUDIO (P2) ============================
  var actx=null;
  function ensureAudio(){ if(!actx){ try{ actx=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } }
  function blip(type){
    if(muted||!actx) return;
    try{
      var o=actx.createOscillator(), g=actx.createGain(); o.connect(g); g.connect(actx.destination);
      var t=actx.currentTime, cfg={export:[160,'sine',.18],build:[520,'triangle',.22],shock:[90,'square',.08],boom:[70,'sine',.5],tick:[300,'square',.05]}[type]||[300,'sine',.1];
      o.type=cfg[1]; o.frequency.setValueAtTime(cfg[0],t);
      if(type==='build') o.frequency.exponentialRampToValueAtTime(cfg[0]*2,t+.18);
      if(type==='boom') o.frequency.exponentialRampToValueAtTime(40,t+.4);
      g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.12,t+.01); g.gain.exponentialRampToValueAtTime(.0001,t+cfg[2]);
      o.start(t); o.stop(t+cfg[2]+.05);
    }catch(e){}
  }
  function haptic(n){ try{ if(navigator.vibrate) navigator.vibrate(n); }catch(e){} }

  // ============================ UTIL ============================
  function animNum(node, from, to, fmt, dur){
    fmt = fmt || function(v){ return Math.round(v); };
    if(reduceMotion){ node.textContent=fmt(to); return; }
    var t0=performance.now(); dur=dur||900;
    function step(now){
      var p=Math.min(1,(now-t0)/dur), e=1-Math.pow(2,-10*p); // expo-out
      node.textContent=fmt(from+(to-from)*e);
      if(p<1) requestAnimationFrame(step); else node.textContent=fmt(to);
    }
    requestAnimationFrame(step);
  }
  function money(v){ return '$'+Math.round(v); }
  function chip(anchor, text, pos){
    var r=anchor.getBoundingClientRect(), c=document.createElement('span');
    c.className='chip '+(pos?'chip--pos':'chip--neg'); c.textContent=text;
    c.style.left=(r.left+r.width/2-16)+'px'; c.style.top=(r.top-6)+'px';
    el.fx.appendChild(c); setTimeout(function(){ c.remove(); },1000);
  }
  function badShake(){ if(reduceMotion) return; var sh=el.game.querySelector('.game__shell'); sh.classList.remove('shake'); void sh.offsetWidth; sh.classList.add('shake'); haptic([12,30,12]); }
  function toast(msg, warn){ el.tickerText.textContent=msg; el.ticker.classList.toggle('is-warn',!!warn); }

  // ============================ RENDER ============================
  function renderStatic(){
    // pips
    el.pips.innerHTML='';
    for(var i=1;i<=12;i++){ var p=document.createElement('span'); p.className='pip'; p.dataset.y=i; el.pips.appendChild(p); }
    // chart gridlines
    var g='';
    for(var v=0;v<=200;v+=50){ g+='<line x1="'+GX0+'" y1="'+gy(v)+'" x2="'+GX1+'" y2="'+gy(v)+'"/>'; }
    g+='<line x1="'+GX0+'" y1="'+gy(100)+'" x2="'+GX1+'" y2="'+gy(100)+'" stroke-opacity="0.12"/>';
    el.gchartGrid.innerHTML=g;
  }
  function tank(node,val,max,valNode,fmt){
    var pct=M.clamp(val/max*100,0,100); node.style.height=pct+'%'; node.parentNode.parentNode; 
    // mobile uses width; set both
    node.style.width = (window.innerWidth<=760? pct+'%':'100%');
    if(window.innerWidth<=760){ node.style.height='100%'; }
    if(valNode) valNode.textContent=fmt(val);
  }
  function renderMeters(animate){
    el.heroTreasury.textContent=money(s.treasury);
    setTank('tankTreasury','valTreasury', M.clamp(s.treasury/600*100,0,100), money(s.treasury));
    setTank('tankCap','valCap', s.capacity, Math.round(s.capacity)+'%');
    setTank('tankBarg','valBarg', s.bargaining, Math.round(s.bargaining));
    el.mfgVal.textContent=Math.round(s.mfgIndex);
    el.comVal.textContent=Math.round(s.commodityIndex);
    // beam tilt = terms of trade
    var gap=s.mfgIndex-s.commodityIndex, ang=M.clamp(gap*0.45,-22,22);
    el.beamBar.style.transform='translateX(-50%) rotate('+ang+'deg)';
    // saturation (earned by good play) on decorative layer only
    var sat=M.clamp(0.15 + (s.capacity/100)*0.85 + Math.max(0,s.commodityIndex-50)/160, 0, 1.2);
    el.game.style.setProperty('--sat', sat.toFixed(2));
  }
  function setTank(fillId,valId,pct,txt){
    var f=el[fillId]; pct=M.clamp(pct,0,100);
    if(window.innerWidth<=760){ f.style.width=pct+'%'; f.style.height='100%'; }
    else { f.style.height=pct+'%'; f.style.width='100%'; }
    el[valId].textContent=txt;
  }
  function pulseDrop(tankSel){ var t=el.game.querySelector(tankSel); if(!t)return; t.classList.remove('is-drop'); void t.offsetWidth; t.classList.add('is-drop'); }

  function renderPips(){
    [].forEach.call(el.pips.children,function(p){
      var y=+p.dataset.y; p.classList.toggle('is-done', y<s.year); p.classList.toggle('is-now', y===s.year);
    });
    el.turnNum.textContent=Math.min(s.year,12);
  }
  function signMoney(v){ v=Math.round(v); return (v<0?'−$':'+$')+Math.abs(v); }
  function renderPayoffs(animate){
    var pe=M.projExport(s), pb=M.projBuild(s), pi=M.projImport(s);
    if(animate && !reduceMotion){ animNum(el.exportPayoff, parseFloat(el.exportPayoff.dataset.v||pe), pe, function(v){return '+$'+Math.round(v);},900); animNum(el.buildPayoff, parseFloat(el.buildPayoff.dataset.v||pb), pb, signMoney,900); }
    else { el.exportPayoff.textContent='+$'+Math.round(pe); el.buildPayoff.textContent=signMoney(pb); }
    el.exportPayoff.dataset.v=pe; el.buildPayoff.dataset.v=pb;
    // build NET can be negative early (imported machines cost more than infant-industry output) — that IS the lesson
    el.cardBuild.classList.toggle('is-loss', pb<0);
    if(el.buildImport) el.buildImport.textContent='machines −$'+Math.round(pi);
    // bloc
    if(s.flags.bloc){ el.cardBloc.classList.add('is-locked'); el.blocState.textContent='✓ joined'; }
    else if(alloc.lever==='bloc'){ el.cardBloc.classList.remove('is-locked'); el.blocState.textContent='✓ SELECTED · joins on advance'; }
    else { el.cardBloc.classList.toggle('is-locked', s.treasury<M.C.BLOC_COST); el.blocState.textContent = s.treasury<M.C.BLOC_COST?'need $30':'available'; }
    // demand gate
    var unlocked=s.bargaining>=M.C.DEMAND_GATE;
    el.cardDemand.classList.toggle('is-locked',!unlocked);
    if(alloc.lever==='demand'){ el.demandState.textContent='✓ SELECTED · fires on advance'; }
    else el.demandState.textContent = unlocked? (s.flags.nieo?'NIEO ×2 ready':'ready') : 'locked · barg '+Math.round(s.bargaining)+'/40';
    ensureLockTip();
  }
  function ensureLockTip(){
    var locked=!(s.bargaining>=M.C.DEMAND_GATE);
    var tip=el.cardDemand.querySelector('.tooltip');
    if(locked && !tip){ tip=document.createElement('span'); tip.className='tooltip'; tip.textContent='You need leverage first. Build it through blocs and diversification.'; el.cardDemand.appendChild(tip); }
    else if(!locked && tip){ tip.remove(); }
  }
  function renderLabor(){
    renderWorkforce();
    var used=alloc.ex+alloc.build, left=laborPool-used;
    el.laborCount.textContent=laborPool;
    el.laborHint.textContent = left>0 ? ('tap FIELD or FACTORY below · '+left+' worker'+(left>1?'s':'')+' left') : 'all assigned · press Advance ⏎';
    el.exportAlloc.textContent=alloc.ex+' labor';
    el.buildAlloc.textContent=alloc.build+' labor';
    el.cardExport.setAttribute('aria-pressed', alloc.ex>0);
    el.cardBuild.setAttribute('aria-pressed', alloc.build>0);
    el.cardBloc.setAttribute('aria-pressed', alloc.lever==='bloc');
    el.cardDemand.setAttribute('aria-pressed', alloc.lever==='demand');
    el.advanceBtn.disabled = used!==laborPool;
    el.advanceBtn.textContent = used!==laborPool ? ('ASSIGN '+left+' MORE WORKER'+(left>1?'S':'')) : 'ADVANCE TO '+(M.C.START_YEAR+s.year)+' ⏎';
  }

  // ---- animated workforce: 5 figures walk to field / village / factory ----
  function renderWorkforce(){
    if(!el.wfPeople) return;
    var total=laborPool;
    // assign order: factory (build) first, then field (export), then idle (village)
    var assign=[];
    for(var b=0;b<alloc.build;b++) assign.push('factory');
    for(var x=0;x<alloc.ex;x++) assign.push('field');
    while(assign.length<total) assign.push('idle');
    // sync person nodes to count
    while(el.wfPeople.children.length<total){ var sp=document.createElement('span'); sp.className='wf-person'; el.wfPeople.appendChild(sp); }
    while(el.wfPeople.children.length>total){ el.wfPeople.removeChild(el.wfPeople.lastChild); }
    var zones={field:[],village:[],factory:[]};
    assign.forEach(function(z,idx){ (z==='idle'?zones.village:zones[z]).push(idx); });
    var ranges={field:[6,28],village:[39,61],factory:[70,92]};
    var nodes=el.wfPeople.children;
    [].forEach.call(nodes,function(c){ c.className='wf-person'; });
    function place(list,range,cls){
      var n=list.length;
      list.forEach(function(idx,k){
        var t=n<=1?0.5:(k/(n-1)); var pos=range[0]+(range[1]-range[0])*t;
        var node=nodes[idx]; node.style.left=pos+'%'; if(cls) node.classList.add(cls);
      });
    }
    place(zones.factory,ranges.factory,'is-factory');
    place(zones.field,ranges.field,'is-field');
    place(zones.village,ranges.village,'is-idle');
    el.workforce.classList.toggle('is-producing', alloc.build>0);
    el.workforce.classList.toggle('is-exporting', alloc.ex>0);
  }

  // ============================ CHART SEGMENTS ============================
  function addSegment(group, x1,y1,x2,y2, cls){
    var ns='http://www.w3.org/2000/svg', p=document.createElementNS(ns,'path');
    p.setAttribute('d','M'+x1+' '+y1+' L'+x2+' '+y2);
    p.setAttribute('class',cls); p.setAttribute('fill','none');
    var L=Math.hypot(x2-x1,y2-y1);
    p.style.strokeDasharray=L; p.style.strokeDashoffset=L;
    group.appendChild(p);
    requestAnimationFrame(function(){ p.style.transition='stroke-dashoffset .7s cubic-bezier(0.16,1,0.3,1)'; p.style.strokeDashoffset=0; });
  }
  var comPts, mfgPts;
  function chartStart(){
    el.gchartDots.innerHTML=''; el.gchartGap.setAttribute('d','');
    // clear dynamic segment groups
    [].slice.call(el.gchartSvg.querySelectorAll('.seg')).forEach(function(n){n.remove();});
    comPts=[{x:gx(0),y:gy(100)}]; mfgPts=[{x:gx(0),y:gy(100)}];
    el.gchartCom.setAttribute('d',''); el.gchartMfg.setAttribute('d','');
  }

  // ============================ TURN FLOW ============================
  function startGame(){
    seed=getSeed();
    s=M.newState(seed);
    s.rng=M.mulberry32(seed); // explicit
    alloc={ex:0,build:0,lever:null};
    laborPool=5;
    deck=shuffle(EVENTS.slice());
    queuedEvent=null;
    runLine=[{year:0,commodity:100,mfg:100}];
    el.game.classList.remove('is-dead','is-win');
    el.over.hidden=true; el.event.hidden=true;
    renderStatic(); chartStart(); plotInitial();
    prevCommodity=100; prevMfg=100;
    renderMeters(); renderPips(); renderPayoffs(false); renderLabor();
    toast(M.C.START_YEAR+'. The harvest is in. The world is buying. Send your workers to the field or the factory.');
    el.advanceBtn.focus();
  }
  function shuffle(arr){ for(var i=arr.length-1;i>0;i--){ var j=Math.floor(s.rng()*(i+1)); var t=arr[i];arr[i]=arr[j];arr[j]=t; } return arr; }

  function plotInitial(){ // starting points at year 0 (index 100)
    dot(gx(0),gy(100),'#C24A3A'); dot(gx(0),gy(100),'#4B92DB');
  }

  function newYearSetup(recap){
    // resolve queued (telegraphed) event at the START of the year
    alloc={ex:0,build:0,lever:null};
    if(s.flags.superHangover){ s.commodityIndex=M.clamp(s.commodityIndex-20,0,200); s.flags.superHangover=false; toast('Super-cycle hangover: last year’s boom unwinds. Commodity index −20.'); badShake(); }
    laborPool = 5;
    renderMeters(); renderPips(); renderPayoffs(true); renderLabor();
    if(queuedEvent){ var ev=queuedEvent; queuedEvent=null; presentEvent(ev); return; } // fires the event telegraphed last year
    // recap what just happened, plus a heads-up if a shock is brewing next year
    var tele=rollNext();
    var msg = recap || yearHeadline();
    if(tele) msg += '  ·  Heads-up: '+tele+' next year.';
    toast(msg, !!tele);
  }
  // plain-language summary of the year that just resolved
  function explainTurn(before, bk){
    var lived=M.C.START_YEAR + s.year - 2;
    var income=Math.round((bk.exportIncome||0)+(bk.buildIncome||0));
    var imp=Math.round(bk.importBill||0);
    var com=Math.round(s.commodityIndex), dc=Math.round(before.c - s.commodityIndex);
    var msg=lived+': you earned $'+income+', upkeep took $'+M.C.UPKEEP;
    msg += imp>0 ? (', and imported machines cost $'+imp+'.') : '.';
    if(dc>0) msg+=' Commodity prices fell to '+com+', so your raw exports buy less than last year.';
    else if(dc<0) msg+=' Commodity prices rose to '+com+'.';
    else msg+=' Commodity prices held at '+com+'.';
    return msg;
  }
  function yearHeadline(){
    var y=M.C.START_YEAR+s.year-1;
    if(s.commodityIndex<55) return y+'. Buyers offer less for the same harvest. The squeeze is on.';
    if(s.capacity>=40) return y+'. Your factories are humming. Keep climbing.';
    return y+'. Markets steady. Choose your moves.';
  }

  function advance(){
    if(el.advanceBtn.disabled) return;
    var before={t:s.treasury,c:s.commodityIndex,m:s.mfgIndex,cap:s.capacity,barg:s.bargaining};
    // press feedback on chosen cards
    if(alloc.lever==='demand') blip('boom'); else if(alloc.build>alloc.ex) blip('build'); else if(alloc.ex>0) blip('export');
    var bk=M.model? null:null;
    var breakdown=M.applyTurn(s, alloc);
    haptic(8);
    // coin-burst on net trade cash (income minus imported-machine bill) — honest, so
    // an early build-at-a-loss turn flashes red. Upkeep/bloc cost settle into the counter.
    var gained=(breakdown.exportIncome+breakdown.buildIncome) - (breakdown.importBill||0);
    if(gained>0.5) chip(el.heroTreasury, '+'+money(gained), true);
    else if(gained<-0.5) chip(el.heroTreasury, '−'+money(-gained), false);
    if(breakdown.demandFired){ blip('boom'); pulseUp(); toast('UNCTAD demand fired. Commodity index jumps. (non-binding)'); el.game.querySelector('.game__shell').classList.add('shake'); }
    // chart segment
    drawTurnSegment();
    runLine.push({year:s.year-1, commodity:s.commodityIndex, mfg:s.mfgIndex});
    // animate meters
    animNum(el.heroTreasury, before.t, s.treasury, money, 900);
    if(s.commodityIndex<before.c-0.5){ pulseDrop('.tank--treasury'); }
    renderMeters(true); renderPips();
    if(before.c - s.commodityIndex > 3) { pulseDrop('.tank--barg'); }

    if(s.dead){ return endGame(); }
    if(s.year>12){ return endGame(); }
    newYearSetup(explainTurn(before, breakdown));
  }
  function pulseUp(){ /* warm bloom handled by saturation jump */ }

  function drawTurnSegment(){
    var ns='http://www.w3.org/2000/svg';
    var x1=gx(s.year-2), x2=gx(s.year-1); // s.year already incremented; completed year = s.year-1
    var cy1=gy(prevCommodity), cy2=gy(s.commodityIndex);
    var my1=gy(prevMfg), my2=gy(s.mfgIndex);
    seg(x1,cy1,x2,cy2,'seg gchart-com-seg');
    seg(x1,my1,x2,my2,'seg gchart-mfg-seg');
    // gap polygon (filled) cumulative
    comPts.push({x:x2,y:cy2}); mfgPts.push({x:x2,y:my2});
    var d='M'+comPts.map(function(p){return p.x+' '+p.y;}).join(' L ');
    for(var i=mfgPts.length-1;i>=0;i--) d+=' L '+mfgPts[i].x+' '+mfgPts[i].y;
    d+=' Z'; el.gchartGap.setAttribute('d',d);
    // endpoint dots
    dot(x2,cy2,'#C24A3A'); dot(x2,my2,'#4B92DB');
    prevCommodity=s.commodityIndex; prevMfg=s.mfgIndex;
  }
  function seg(x1,y1,x2,y2,cls){
    var ns='http://www.w3.org/2000/svg', p=document.createElementNS(ns,'path');
    p.setAttribute('d','M'+x1+' '+y1+' L'+x2+' '+y2); p.setAttribute('class',cls); p.setAttribute('fill','none');
    p.setAttribute('stroke', cls.indexOf('com')>-1?'#C24A3A':'#4B92DB'); p.setAttribute('stroke-width','3');
    p.setAttribute('stroke-linecap','round');
    var L=Math.hypot(x2-x1,y2-y1);
    if(!reduceMotion){ p.style.strokeDasharray=L; p.style.strokeDashoffset=L; }
    el.gchartSvg.appendChild(p);
    if(!reduceMotion) requestAnimationFrame(function(){ p.style.transition='stroke-dashoffset .7s cubic-bezier(0.16,1,0.3,1)'; p.style.strokeDashoffset=0; });
  }
  function dot(x,y,col){ var ns='http://www.w3.org/2000/svg',c=document.createElementNS(ns,'circle'); c.setAttribute('cx',x);c.setAttribute('cy',y);c.setAttribute('r',4);c.setAttribute('fill',col); c.setAttribute('class','seg'); el.gchartDots.appendChild(c); }

  // ---- events ----
  function rollNext(){
    // roll an event for NEXT year and return its telegraph text (§4.5)
    if((s.year+1)>3 && deck.length>0 && s.rng()<0.55){
      queuedEvent=deck.shift();
      return telegraph(queuedEvent);
    }
    queuedEvent=null;
    return null;
  }
  function telegraph(ev){
    return {1:'a price super-cycle stirring',2:'talk of a price crash',3:'a dry season coming',4:'tariff threats in rich capitals',
      5:'a preference deal in the works',6:'a foreign investor circling',7:'reform winds (NIEO)',8:'the G77 rallying'}[ev.id]||'something';
  }
  function presentEvent(ev){
    if(el.tut && !el.tut.hidden){ tutEnd(); }   // never let the tutorial overlay block an event's choices
    el.eventStamp.textContent=ev.stamp; el.eventTitle.textContent=ev.name; el.eventBody.textContent=ev.body; el.eventTeach.textContent='What this means: '+ev.teach;
    el.eventChoices.innerHTML='';
    blip('tick');
    if(ev.choices){
      ev.choices.forEach(function(ch){
        var b=document.createElement('button'); b.className='event__choice'; b.type='button';
        b.innerHTML='<strong>'+ch.label+'</strong>'+ch.sub;
        b.addEventListener('click',function(){ ch.apply(); closeEvent(); });
        el.eventChoices.appendChild(b);
      });
    } else {
      ev.auto();
      var b=document.createElement('button'); b.className='event__choice'; b.type='button'; b.innerHTML='<strong>ACKNOWLEDGED</strong>Continue the year.';
      b.addEventListener('click', closeEvent); el.eventChoices.appendChild(b);
    }
    el.event.hidden=false;
    var first=el.eventChoices.querySelector('button'); if(first) first.focus();
  }
  function closeEvent(){
    el.event.hidden=true;
    var tele=rollNext();
    toast(tele ? ('The event resolved. Heads-up: '+tele+' next year.') : (yearHeadline()+' Assign your workers.'), !!tele);
    renderMeters(); renderPayoffs(false); renderLabor(); el.advanceBtn.focus();
  }

  // ============================ GAME OVER (§ debrief dossier) ============================
  function endGame(){
    if(el.tut && !el.tut.hidden){ tutEnd(); }   // dismiss any lingering tutorial before the debrief
    var r=M.rank(s), info=M.RANKS[r], sc=M.model? M.score(s):0; sc=M.score(s);
    var win=(r==='A'||r==='S');
    el.game.classList.toggle('is-dead', r==='F');
    el.game.classList.toggle('is-win', win);
    if(r==='F'){ badShake(); blip('shock'); } else if(win){ blip('boom'); }
    el.overStamp.setAttribute('data-rank',r); el.overRank.textContent=r; el.overRankName.textContent=info.name;
    el.overStamp.classList.remove('is-thunk');
    el.overVerdict.textContent='“'+info.copy+'”';
    el.overStats.innerHTML=
      stat('Treasury',money(s.treasury))+stat('Industrial capacity',Math.round(s.capacity)+'%')+
      stat('Bargaining power',Math.round(s.bargaining))+stat('Commodity index',Math.round(s.commodityIndex))+
      stat('Final score',sc)+stat('Year reached',(M.C.START_YEAR+Math.min(s.year,12)-1));
    el.overCopy.innerHTML=DOSSIER;
    // best score
    var best=parseInt(lsGet('ut_best')||'0',10);
    if(sc>best){ lsSet('ut_best',String(sc)); lsSet('ut_bestrank',r); best=sc; }
    var bestrank=lsGet('ut_bestrank')||r;
    el.overCopy.insertAdjacentHTML('beforeend','<p class="mono" style="font-size:.8rem;color:#7a7e74;border-top:1px dotted #c9c3b6;padding-top:.8rem;margin-top:1.1rem">BEST SCORE: '+best+' · rank '+bestrank+(sc>=best?' · new best!':'')+'</p>');
    el.over.hidden=false;
    if(!reduceMotion){ requestAnimationFrame(function(){ void el.overStamp.offsetWidth; el.overStamp.classList.add('is-thunk'); }); }
    el.againBtn.focus();
    // stash run line for the story debrief chart
    try{ window.__utRun={line:runLine.slice(), rank:r, score:sc}; }catch(e){}
  }
  function stat(k,v){ return '<div><dt>'+k+'</dt><dd>'+v+'</dd></div>'; }

  var DOSSIER =
    '<p class="lead">You watched your best move stop working.</p>'+
    '<p>That\u2019s the Prebisch-Singer thesis: raw-commodity prices fall over time against manufactured goods, so commodity exporters\u2019 terms of trade steadily decline.</p>'+
    '<p>Today <strong>95 of 143</strong> developing economies are commodity-dependent, including over <strong>80%</strong> of the Least Developed Countries. Exporting more raw goods only deepens the dependence.</p>'+
    '<p>The way out is the way you won, or didn\u2019t: <strong>diversify into manufacturing to add value, and demand fairer terms from a position of collective strength.</strong></p>'+
    '<p>This is the work of <strong>UNCTAD, UN Trade and Development</strong>, founded in Geneva in 1964 under economist Raúl Prebisch. 195 members; three pillars: research, consensus-building, technical cooperation.</p>'+
    '<p>But UNCTAD has no enforcement power. Unlike the WTO, its influence is analytical and diplomatic. That\u2019s why, here and in reality, fairer terms required leverage, not just a demand. From the 1974 New International Economic Order to the 2025 Geneva Consensus, the fight goes on.</p>'+
    '<p class="lead">Most first-timers score a C. Try again. Diversify earlier.</p>';

  // ============================ TUTORIAL (interactive walkthrough) ============================
  // Steps with `do` are hands-on: the spotlight waits until the player performs the action.
  var TUT_ALL=[
    { title:'What you\u2019re playing', body:'You run one developing nation, starting in 1964. Your money comes from two places: raw exports \u2014 coffee, copper, cotton \u2014 and the industry you choose to build at home. You have twelve years. Make your nation prosper.' },
    { title:'Your goal', body:'Over twelve years, grow your treasury and your nation. Where you end up \u2014 from \u201cResource Colony\u201d to \u201cDiversified Nation\u201d \u2014 depends on the moves you make each year. There\u2019s no single right answer handed to you here; you\u2019ll find it by playing. Let\u2019s take your first turn together.' },
    { title:'Your treasury', target:'#heroTreasury', body:'This is your money. Every year a fixed upkeep cost is deducted, so doing nothing slowly bankrupts you. If it hits zero, the game ends in a debt crisis.' },
    { title:'Your three gauges', target:'.rail', body:'Three things to watch. TREASURY is your cash. CAPACITY is how industrialised you are. BARGAINING is diplomatic leverage \u2014 you can spend it later, once you have enough.' },
    { title:'The two prices', target:'.gchart', body:'The red line is the world price of your raw commodities. The blue line is the price of finished factory goods. Keep an eye on both as the years pass \u2014 the chart is the story of the game.' },
    { title:'The terms-of-trade scale', target:'#beam', body:'This little balance reads the same two prices live. The red weight is your raw commodities; the blue is the world\u2019s factory goods. However it tips tells you, at a glance, what your harvest is worth in machines this year.' },
    { title:'Send a worker to the factory', target:'#cardBuild', body:'You get five workers a year. Tap BUILD INDUSTRY to send one to the factory. Factories need imported machines, so building costs cash now \u2014 watch the \u2212$ on the card \u2014 while capacity grows for later.', doCheck:function(){ return alloc.build>=1; }, hint:'Tap Build Industry' },
    { title:'Send a worker to the field', target:'#cardExport', body:'Now tap EXPORT COMMODITIES to send a worker to the field. The card shows what it pays this year. Exports also earn the foreign exchange that pays for those imported machines.', doCheck:function(){ return alloc.ex>=1; }, hint:'Tap Export Commodities' },
    { title:'Arm a lever', target:'#cardBloc', body:'These last two cards are levers, not labour. Tap JOIN REGIONAL BLOC to arm it. Levers don\u2019t cost a worker; they fire when you advance the year. A bloc buys you bargaining power and softer shocks.', doCheck:function(){ return alloc.lever==='bloc'; }, hint:'Tap Join Regional Bloc' },
    { title:'Fill the rest, then advance', target:'#hudBottom', body:'Assign your remaining workers to either card (tap \u21ba Reset to start over), then press ADVANCE to live your first year. From here, you\u2019re on your own. Good luck.', doCheck:function(){ return s.year>1; }, hint:'Assign all 5, then Advance' }
  ];
  var TUT=[], tutIndex=0, tutPoll=null, tutShownAt=0, tutAdvancing=false;
  function tutOpen(){ return !el.tut.hidden; }
  function elVisible(sel){ var e=el.game.querySelector(sel); if(!e) return false; var r=e.getBoundingClientRect(); return r.width>2 && r.height>2 && getComputedStyle(e).display!=='none'; }
  function startTutorial(){
    // drop steps whose target is hidden on this viewport (e.g. the beam on mobile)
    TUT=TUT_ALL.filter(function(s){ return !s.target || elVisible(s.target); });
    tutIndex=0; tutAdvancing=false; el.tut.hidden=false; tutShow();
    if(tutPoll){ clearInterval(tutPoll); }
    tutPoll=setInterval(tutTick,120);   // one persistent poller for all action steps
  }
  function tutTick(){
    if(el.tut.hidden || tutAdvancing) return;
    var step=TUT[tutIndex];
    if(!step || !step.doCheck) return;
    if(Date.now()-tutShownAt>450 && step.doCheck()){ tutAdvancing=true; tutSuccess(); }
  }
  function tutShow(){
    var step=TUT[tutIndex], isAction=!!step.doCheck;
    el.tutStep.textContent='HOW TO PLAY · '+(tutIndex+1)+' / '+TUT.length;
    el.tutTitle.textContent=step.title; el.tutBody.textContent=step.body;
    el.tut.classList.toggle('is-action', isAction);
    el.tutBack.style.display=(isAction||tutIndex===0)?'none':'';
    el.tutNext.style.display=isAction?'none':'';
    el.tutWait.hidden=!isAction; el.tutStepSkip.hidden=!isAction;
    if(isAction){ el.tutWait.textContent='▸ '+(step.hint||'your move'); }
    el.tutNext.textContent=(tutIndex===TUT.length-1)?'Start playing':'Next';
    positionTut(step);
    tutShownAt=Date.now(); tutAdvancing=false;
    if(!isAction) el.tutNext.focus();
  }
  function tutSuccess(){
    el.tutSpot.classList.add('is-done');
    var delay=reduceMotion?0:480;
    setTimeout(function(){ el.tutSpot.classList.remove('is-done'); tutNext(); }, delay);
  }
  function positionTut(step){
    var spot=el.tutSpot, card=el.tutCard, target=step.target?el.game.querySelector(step.target):null;
    if(!target){
      spot.className='tut__spot'; spot.style.left='50%'; spot.style.top='50%'; spot.style.width='0'; spot.style.height='0';
      card.style.left='50%'; card.style.top='50%'; card.style.transform='translate(-50%,-50%)';
      return;
    }
    var gr=el.tut.getBoundingClientRect(), r=target.getBoundingClientRect(), pad=8;
    var x=r.left-gr.left-pad, y=r.top-gr.top-pad, w=r.width+pad*2, h=r.height+pad*2;
    spot.className='tut__spot is-target';
    spot.style.left=x+'px'; spot.style.top=y+'px'; spot.style.width=w+'px'; spot.style.height=h+'px';
    // place card: prefer below target, else above, clamped to the shell box
    var gw=gr.width, gh=gr.height, cw=Math.min(360, gw-32), ch=card.offsetHeight||180;
    var cx=Math.max(16, Math.min(gw-cw-16, x+w/2-cw/2));
    var below=y+h+14, cy=(below+ch<gh-16)?below:Math.max(16, y-ch-14);
    card.style.transform='none'; card.style.left=cx+'px'; card.style.top=cy+'px';
  }
  function tutNext(){ if(tutIndex<TUT.length-1){ tutIndex++; tutShow(); } else tutEnd(); }
  function tutBack(){ if(tutIndex>0){ tutIndex--; tutShow(); } }
  function tutEnd(){ if(tutPoll){ clearInterval(tutPoll); tutPoll=null; } tutAdvancing=false; el.tut.hidden=true; el.tut.classList.remove('is-action'); el.advanceBtn.focus(); }

  // ============================ LAUNCH / QUIT ============================
  function lockScroll(){
    savedScrollY=window.scrollY||window.pageYOffset||0;
    document.body.style.top=(-savedScrollY)+'px';
    document.body.classList.add('is-playing');
    el.game.style.touchAction='none';
  }
  function unlockScroll(){
    document.body.classList.remove('is-playing');
    document.body.style.top='';
    window.scrollTo(0,savedScrollY);
  }
  function launch(){
    ensureAudio(); if(actx && actx.state==='suspended') actx.resume();
    el.game.hidden=false; el.game.setAttribute('aria-hidden','false');
    lockScroll(); started=true;
    startGame();
    // the walkthrough shows every time you open the game; Skip dismisses it instantly
    setTimeout(startTutorial,140);
  }
  function quit(toStory){
    el.game.hidden=true; el.game.setAttribute('aria-hidden','true');
    document.body.classList.remove('is-playing'); document.body.style.top='';
    if(toStory){
      drawStoryDebrief();
      var d=document.getElementById('sec-debrief');
      var jump=function(){ var prev=document.documentElement.style.scrollBehavior; document.documentElement.style.scrollBehavior='auto';
        var y=d.getBoundingClientRect().top+(window.scrollY||0); window.scrollTo(0,y);
        document.documentElement.style.scrollBehavior=prev; };
      requestAnimationFrame(jump); setTimeout(jump,90);
    } else {
      window.scrollTo(0, savedScrollY);
    }
  }

  function drawStoryDebrief(){
    if(!window.__utRun) return;
    if(global.UT.scroll && global.UT.scroll.renderRun) global.UT.scroll.renderRun(window.__utRun);
  }

  // ============================ INPUT ============================
  function allocAdd(kind){
    var used=alloc.ex+alloc.build;
    if(used>=laborPool){ toast('All '+laborPool+' workers are assigned. Tap ↺ Reset to reassign them.'); return; }
    if(kind==='ex') alloc.ex++; else alloc.build++;
    renderLabor();
  }
  function clearWorkers(){ alloc.ex=0; alloc.build=0; renderLabor(); toast('Workers reset. Send them to the field or the factory.'); }
  function clearAlloc(){ alloc.ex=0; alloc.build=0; alloc.lever=null; renderLabor(); }
  function toggleLever(which){
    if(which==='bloc'){
      if(s.flags.bloc){ toast('You have already joined a bloc. It is permanent.'); return; }
      if(s.treasury<M.C.BLOC_COST){ toast('You need $30 in the treasury to join a bloc.'); return; }
      alloc.lever=alloc.lever==='bloc'?null:'bloc';
      toast(alloc.lever==='bloc'?'Regional bloc selected. It costs $30 and joins when you advance the year. You still need to assign all 5 workers.':'Bloc selection cancelled.');
    }
    if(which==='demand'){
      if(s.bargaining<M.C.DEMAND_GATE){ toast('Not enough leverage yet. Build bargaining power to 40 first (join a bloc, keep building industry).', true); return; }
      alloc.lever=alloc.lever==='demand'?null:'demand';
      toast(alloc.lever==='demand'?'Demand for fairer terms selected. It fires when you advance the year.':'Demand cancelled.');
    }
    renderPayoffs(false); renderLabor();
  }
  function pressFx(card){ card.classList.remove('is-press'); void card.offsetWidth; card.classList.add('is-press'); setTimeout(function(){card.classList.remove('is-press');},150); }

  function bindInput(){
    el.cardExport.addEventListener('click',function(){ pressFx(el.cardExport); allocAdd('ex'); });
    el.cardBuild.addEventListener('click',function(){ pressFx(el.cardBuild); allocAdd('build'); });
    el.cardBloc.addEventListener('click',function(){ pressFx(el.cardBloc); toggleLever('bloc'); });
    el.cardDemand.addEventListener('click',function(){ pressFx(el.cardDemand); toggleLever('demand'); });
    el.advanceBtn.addEventListener('click',advance);
    el.closeBtn.addEventListener('click',function(){ quit(false); });
    el.muteBtn.addEventListener('click',function(){ muted=!muted; el.muteBtn.setAttribute('aria-pressed',String(!muted)); el.muteBtn.textContent=muted?'♪̸':'♪'; lsSet('ut_muted',muted?'1':'0'); });
    el.againBtn.addEventListener('click',function(){ try{ history.replaceState(null,'',location.pathname); }catch(e){} startGame(); });
    el.storyBtn.addEventListener('click',function(){ quit(true); });
    el.helpBtn.addEventListener('click',startTutorial);
    el.resetWorkers.addEventListener('click',clearWorkers);
    el.tutNext.addEventListener('click',tutNext);
    el.tutBack.addEventListener('click',tutBack);
    el.tutSkip.addEventListener('click',tutEnd);
    el.tutStepSkip.addEventListener('click',tutNext);
    document.addEventListener('keydown',function(e){
      if(el.game.hidden) return;
      if(tutOpen()){
        if(e.key==='Escape'){ tutEnd(); e.preventDefault(); return; }
        var isAction=TUT[tutIndex] && TUT[tutIndex].doCheck;
        if(!isAction){
          if(e.key==='Enter'||e.key===' '||e.key==='ArrowRight'){ tutNext(); e.preventDefault(); }
          else if(e.key==='ArrowLeft'){ tutBack(); e.preventDefault(); }
          return;
        }
        // action step: let keys fall through to the game so keyboard players can act;
        // the step's poller detects the move and advances the tutorial.
      }
      if(!el.event.hidden){ return; }
      if(!el.over.hidden){ if(e.key==='Enter'){ startGame(); } return; }
      if(e.key==='1'){ pressFx(el.cardExport); allocAdd('ex'); e.preventDefault(); }
      else if(e.key==='2'){ pressFx(el.cardBuild); allocAdd('build'); e.preventDefault(); }
      else if(e.key==='3'){ pressFx(el.cardBloc); toggleLever('bloc'); e.preventDefault(); }
      else if(e.key==='4'){ pressFx(el.cardDemand); toggleLever('demand'); e.preventDefault(); }
      else if(e.key==='Enter'||e.key===' '){ advance(); e.preventDefault(); }
      else if(e.key==='Backspace'||e.key==='0'){ clearWorkers(); e.preventDefault(); }
      else if(e.key==='Escape'){ quit(false); }
    });
  }

  // ============================ INIT ============================
  function init(){
    IDS.forEach(function(id){ el[id]=$(id); });
    muted = lsGet('ut_muted')==='1';
    el.muteBtn.setAttribute('aria-pressed',String(!muted)); el.muteBtn.textContent=muted?'♪̸':'♪';
    bindInput();
    var pb=document.getElementById('playBtn'); if(pb) pb.addEventListener('click',launch);
    window.addEventListener('resize',function(){ if(!el.game.hidden){ renderMeters(); renderWorkforce(); if(tutOpen()) positionTut(TUT[tutIndex]); } });
    global.UT.game={ launch:launch };
  }
  if(document.readyState!=='loading') init(); else document.addEventListener('DOMContentLoaded',init);

})(typeof window!=='undefined'?window:this);
