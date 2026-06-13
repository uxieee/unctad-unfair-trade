/* ============================================================================
   UNFAIR TRADE · scroll engine: spine, reveals, count-ups, two pinned beats.
   Native scroll + IntersectionObserver. GSAP ONLY for §5.4 & §5.5 pins.
   ============================================================================ */
(function (global) {
  'use strict';
  document.documentElement.classList.remove('no-js');
  var reduce = global.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };

  // ---------------------------------------------------------------- count-up
  function countUp(node) {
    var to = parseFloat(node.dataset.countup), suffix = node.dataset.suffix || '';
    var isYear = to >= 1000, from = isYear ? to - 120 : 0;
    if (reduce) { node.textContent = Math.round(to) + suffix; return; }
    var t0 = performance.now(), dur = 1200;
    (function step(now) {
      var p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(2, -10 * p);
      node.textContent = Math.round(from + (to - from) * e) + suffix;
      if (p < 1) requestAnimationFrame(step); else node.textContent = Math.round(to) + suffix;
    })(t0);
  }

  // ---------------------------------------------------------------- reveals
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var t = en.target;
      t.classList.add('is-in');
      if (t.dataset.countup) countUp(t);
      if (t.id === 'sec-rx') { t.classList.add('is-in'); revealChecklist(); }
      io.unobserve(t);
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal,[data-countup],#sec-rx').forEach(function (n) { io.observe(n); });

  function revealChecklist() {
    var items = document.querySelectorAll('#checklist li');
    items.forEach(function (li, i) {
      setTimeout(function () { li.classList.add('is-checked'); }, reduce ? 0 : 220 * (i + 1));
    });
  }

  // ---------------------------------------------------------------- the spine
  // Narrative terms-of-trade arc: value 0..1 across scroll progress 0..1.
  // climbs hopefully -> sags through the trap -> redrawn upward in resolution.
  var ARC = [
    [0.00, 0.55], [0.07, 0.70], [0.17, 0.60], [0.29, 0.50],
    [0.41, 0.36], [0.54, 0.22], [0.62, 0.20], [0.78, 0.32],
    [0.88, 0.60], [0.95, 0.78], [1.00, 0.86]
  ];
  function arcValue(p) {
    for (var i = 1; i < ARC.length; i++) {
      if (p <= ARC[i][0]) {
        var a = ARC[i - 1], b = ARC[i], t = (p - a[0]) / (b[0] - a[0] || 1);
        return a[1] + (b[1] - a[1]) * t;
      }
    }
    return ARC[ARC.length - 1][1];
  }
  var spineSvg = $('#spineSvg'), spineTrack = $('#spineTrack'), spineLive = $('#spineLive'), spineDot = $('#spineDot');
  var spineVertical = true, trackLen = 0;
  function buildSpine() {
    spineVertical = window.innerWidth > 860;
    var pts = [];
    var N = 80;
    if (spineVertical) {
      spineSvg.setAttribute('viewBox', '0 0 40 1000');
      for (var i = 0; i <= N; i++) { var p = i / N; pts.push([8 + arcValue(p) * 24, p * 1000]); }
    } else {
      spineSvg.setAttribute('viewBox', '0 0 1000 8');
      for (var j = 0; j <= N; j++) { var q = j / N; pts.push([q * 1000, 8 - (arcValue(q) * 4 + 2)]); }
    }
    var d = 'M' + pts.map(function (pt) { return pt[0].toFixed(1) + ' ' + pt[1].toFixed(1); }).join(' L ');
    spineTrack.setAttribute('d', d); spineLive.setAttribute('d', d);
    trackLen = spineLive.getTotalLength();
    spineLive.style.strokeDasharray = trackLen;
    updateSpine();
  }
  function lerpColor(a, b, t) {
    var pa = a.match(/\w\w/g).map(function (h) { return parseInt(h, 16); });
    var pb = b.match(/\w\w/g).map(function (h) { return parseInt(h, 16); });
    return '#' + pa.map(function (v, i) { return ('0' + Math.round(v + (pb[i] - v) * t).toString(16)).slice(-2); }).join('');
  }
  function updateSpine() {
    var max = (document.documentElement.scrollHeight - window.innerHeight) || 1;
    var prog = Math.min(1, Math.max(0, window.scrollY / max));
    spineLive.style.strokeDashoffset = trackLen * (1 - prog);
    var val = arcValue(prog);
    // tint: low value -> alarm rust, high -> verdant
    var col = val < 0.5 ? lerpColor('C24A3A', '8A9BA8', val / 0.5) : lerpColor('8A9BA8', '0E8A6B', (val - 0.5) / 0.5);
    spineLive.style.stroke = col; spineDot.style.stroke = col;
    var pt = spineLive.getPointAtLength(trackLen * prog);
    spineDot.setAttribute('cx', pt.x); spineDot.setAttribute('cy', pt.y);
  }
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { updateSpine(); ticking = false; });
  }, { passive: true });
  window.addEventListener('resize', buildSpine);

  // ---------------------------------------------------------------- dot grid (143)
  function buildDots() {
    var grid = $('#dotgrid'); if (!grid || grid.childElementCount) return;
    for (var i = 0; i < 143; i++) {
      var d = document.createElement('span'); d.className = 'dot'; grid.appendChild(d);
    }
  }
  buildDots();

  // ---------------------------------------------------------------- static charts geometry
  function buildScissor() {
    var grid = $('#scissorGrid'); var g = '';
    for (var v = 0; v <= 200; v += 50) { var y = 440 - (v / 200) * 420; g += '<line x1="40" y1="' + y + '" x2="780" y2="' + y + '"/>'; }
    grid.innerHTML = g;
    // build the two polylines (full state)
    var mfg = [], com = [];
    for (var i = 0; i <= 12; i++) {
      var x = 40 + (i / 12) * 740;
      mfg.push([x, sy(100 + i * 4.2)]);          // manufactures rise ~100 -> 150
      com.push([x, sy(100 - i * 3.9)]);          // commodities fall ~100 -> 53
    }
    function sy(val) { return 440 - (val / 200) * 420; }
    var mfgPath = $('#scissorMfg'), comPath = $('#scissorCom'), gap = $('#scissorGap');
    mfgPath.setAttribute('d', 'M' + mfg.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' L '));
    comPath.setAttribute('d', 'M' + com.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' L '));
    var dGap = 'M' + mfg.map(function (p) { return p[0] + ' ' + p[1]; }).join(' L ');
    for (var k = com.length - 1; k >= 0; k--) dGap += ' L ' + com[k][0] + ' ' + com[k][1];
    dGap += ' Z'; gap.setAttribute('d', dGap);
    // end labels
    var lab = $('#scissorLabels');
    lab.innerHTML = '<text x="' + (mfg[12][0] - 4) + '" y="' + (mfg[12][1] - 8) + '" fill="#4B92DB" text-anchor="end">MFG 150</text>' +
                    '<text x="' + (com[12][0] - 4) + '" y="' + (com[12][1] + 20) + '" fill="#C24A3A" text-anchor="end">COMMODITY 53</text>' +
                    '<text x="44" y="' + (sy(100) - 6) + '" fill="#8A9BA8" font-size="11">1964 = 100</text>';
    return { mfgPath: mfgPath, comPath: comPath, gap: gap };
  }
  function sy(val) { return 440 - (val / 200) * 420; }

  // ---------------------------------------------------------------- GSAP pinned beats
  function setupPins() {
    var scissor = buildScissor();
    var mfgLen = scissor.mfgPath.getTotalLength(), comLen = scissor.comPath.getTotalLength();
    [scissor.mfgPath, scissor.comPath].forEach(function (p, i) {
      var L = i === 0 ? mfgLen : comLen; p.style.strokeDasharray = L; p.style.strokeDashoffset = L;
    });
    scissor.gap.style.opacity = 0;
    var gapText = $('#thesisGapText');
    var dots = document.querySelectorAll('#dotgrid .dot');
    var depCount = $('#depCount'), depReadout = $('#depReadout');

    function drawScissor(prog) {
      scissor.mfgPath.style.strokeDashoffset = mfgLen * (1 - prog);
      scissor.comPath.style.strokeDashoffset = comLen * (1 - prog);
      scissor.gap.style.opacity = Math.max(0, (prog - 0.45) / 0.55) * 0.95;
      var gapPts = Math.round((150 - (100 - prog * 47)) + prog * 0); // illustrative
      gapText.textContent = prog < 0.1 ? 'TERMS-OF-TRADE GAP: opening' :
        ('TERMS-OF-TRADE GAP: ' + Math.round(prog * 97) + ' index points and widening');
    }
    function flipDots(prog) {
      var target = Math.round(prog * 95);
      for (var i = 0; i < dots.length; i++) {
        var on = i < target; // first 95 are the dependent ones
        if (i < 95) dots[i].classList.toggle('is-dep', on);
      }
      depCount.textContent = target;
      depReadout.textContent = target + ' / 143 commodity-dependent';
    }

    if (reduce || !global.gsap || !global.ScrollTrigger) {
      drawScissor(1); flipDots(1); return; // final state, unpinned
    }
    gsap.registerPlugin(ScrollTrigger);
    var mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', function () {
      ScrollTrigger.create({
        trigger: '#sec-thesis', start: 'top top', end: '+=120%', pin: '#thesisPin', scrub: 0.4,
        onUpdate: function (self) { drawScissor(self.progress); }
      });
      ScrollTrigger.create({
        trigger: '#sec-dependence', start: 'top top', end: '+=120%', pin: '#depPin', scrub: 0.4,
        onUpdate: function (self) { flipDots(self.progress); }
      });
      drawScissor(0); flipDots(0);
    });
  }

  // ---------------------------------------------------------------- debrief run chart
  function buildRunGrid() {
    var g = $('#runGrid'); if (!g) return; var s = '';
    for (var v = 0; v <= 200; v += 50) { var y = 280 - (v / 200) * 260; s += '<line x1="40" y1="' + y + '" x2="580" y2="' + y + '"/>'; }
    g.innerHTML = s;
    // historical declining reference line
    var hist = [], hy = function (val) { return 280 - (val / 200) * 260; };
    for (var i = 0; i <= 12; i++) { hist.push([40 + (i / 12) * 540, hy(100 - i * 4.6)]); }
    $('#runHist').setAttribute('d', 'M' + hist.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' L '));
    $('#runLabels').innerHTML = '<text x="46" y="' + (hy(100) - 6) + '" fill="#8A9BA8" font-size="11">1964 = 100</text>' +
      '<text x="' + hist[12][0] + '" y="' + (hist[12][1] + 16) + '" fill="#8A9BA8" font-size="11" text-anchor="end">historical decline</text>';
  }
  buildRunGrid();

  function renderRun(run) {
    var hy = function (val) { return 280 - (val / 200) * 260; };
    var pts = run.line.map(function (d) { return [40 + (d.year / 12) * 540, hy(d.commodity)]; });
    var path = $('#runYou');
    path.setAttribute('d', 'M' + pts.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' L '));
    if (!reduce) { var L = path.getTotalLength(); path.style.strokeDasharray = L; path.style.strokeDashoffset = L; requestAnimationFrame(function () { path.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(0.16,1,0.3,1)'; path.style.strokeDashoffset = 0; }); }
    var final = run.line[run.line.length - 1].commodity;
    $('#runCap').textContent = 'Your terms of trade · rank ' + run.rank + ' · commodity index ended at ' + Math.round(final) + (final > 55 ? ' · you held the line.' : ' · the squeeze won.');
    $('#debriefHead').textContent = run.rank === 'A' || run.rank === 'S'
      ? 'You bent the line back up. Almost no one does it by accident.'
      : 'The line you drew is the line the data has been drawing for sixty years.';
  }

  // ---------------------------------------------------------------- init
  function init() { buildSpine(); setupPins(); }
  if (document.readyState !== 'loading') init(); else document.addEventListener('DOMContentLoaded', init);

  global.UT = global.UT || {};
  global.UT.scroll = { renderRun: renderRun, updateSpine: updateSpine };

})(typeof window !== 'undefined' ? window : this);
