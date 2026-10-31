// KNO 《신어 2025》 대시보드 시안 v2 — 시안마다 화면 구조·차트 형태가 다름 (window.VARIANT.type)
(function () {
  var TYPE = (window.VARIANT || {}).type || 1;
  var C = { accent: '#4F46E5', soft: '#E0E7FF', muted: '#CBD5E1', grid: '#EEF0F3', border: '#E6E8EC', t1: '#111827', t2: '#4B5563', t3: '#9CA3AF' };
  var PAL = ['#4F46E5', '#0EA5E9', '#F59E0B', '#10B981', '#94A3B8'];
  var NN_C = '#4BD37F', YT_C = '#FB7171';   // 사용 추이: 기존 신문/댓글 말뭉치 색
  var FONT = 'Pretendard, -apple-system, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
  echarts.registerTheme('kno', {
    color: PAL, backgroundColor: 'transparent', textStyle: { fontFamily: FONT, color: C.t2 },
    categoryAxis: { axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: C.t3, fontSize: 11, rotate: 0 }, splitLine: { show: false } },
    valueAxis: { axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: C.t3, fontSize: 11 }, splitLine: { lineStyle: { color: C.grid, type: 'dashed' } } },
    tooltip: { backgroundColor: '#FFFFFF', borderColor: C.border, borderWidth: 1, textStyle: { color: C.t1, fontSize: 13 },
               extraCssText: 'box-shadow:0 4px 12px rgba(0,0,0,.06);border-radius:8px;' }
  });

  var DEFS = {};
  // 정의문만: 첫 문장 + 이어지는 '또는 …' 문장 (부가 설명·=동의어·⇒표기 안내·사용 주의는 뺀다)
  function defOnly(t) {
    var ss = String(t || '').trim().split(/(?<=\.)\s+/), out = [];
    for (var k = 0; k < ss.length; k++) { if (k === 0 || /^또는\s/.test(ss[k])) out.push(ss[k]); else break; }
    return out.join(' ');
  }   // 뜻풀이: 신어 2025_일관성 검토_빈도 분석_완료_20261031.xlsx '신어 2025' 시트
  var meta, heads, months, nM, monthly = {}, wordsNN = [], wordsYT = [], byName = {};
  var state = { from: 0, to: 0, wf: '' }, charts = [], trendWord = '피지컬^에이아이';
  var ui = { dim: '조어법', item: '' };   // 시안 8 선택 상태

  // ── 공통 도구 ──
  function $(id) { return document.getElementById(id); }
  function disp(w) { return String(w == null ? '' : w).replace(/-/g, '').replace(/\^/g, ' '); }   // 표제어 표시: - 는 붙이고 ^ 는 공백
  function esc(s) { var d = document.createElement('i'); d.textContent = s == null ? '' : s; return d.innerHTML; }
  function pct0(n, d) { return d ? Math.round(n / d * 100) : 0; }
  function pct1(n, d) { return d ? (n / d * 100).toFixed(1) : '0.0'; }
  function num(n) { return n.toLocaleString(); }
  function tip(n, d) { return num(n) + ' (' + pct1(n, d) + '%)'; }
  function clean(s) { return s; }   // 범주 이름은 원자료 값 그대로 표시
  function ymLab(i) { return months[i].slice(0, 4) + '.' + months[i].slice(4); }
  function xLab(i) { var mo = +months[i].slice(4); return (i === 0 || mo === 1) ? months[i].slice(0, 4) + '.' + mo : mo + '월'; }
  function xInterval(el) {
    var w = el.clientWidth, step = w < 560 ? 3 : w < 960 ? 2 : 1;
    return function (i) {
      if (i === 0 || +months[i].slice(4) === 1 || step === 1) return true;
      for (var k = 1; k < step; k++) if (i - k === 0 || (i - k >= 0 && +months[i - k].slice(4) === 1) || (i + k < nM && +months[i + k].slice(4) === 1)) return false;
      return i % step === 0;
    };
  }
  function countBy(key, rows) {
    var c = {};
    rows.forEach(function (h) { var v = h[key]; if (v) c[v] = (c[v] || 0) + 1; });
    return Object.keys(c).map(function (k) { return [k, c[k]]; }).sort(function (a, b) { return b[1] - a[1]; });
  }
  function topN(entries, n) {
    n = n || 10;
    if (entries.length <= n + 1) return entries;
    return entries.slice(0, n).concat([['기타', entries.slice(n).reduce(function (a, e) { return a + e[1]; }, 0)]]);
  }
  function filtered(o) {
    o = o || {};
    return heads.filter(function (h) {
      if (!o.noPeriod && (h._m < state.from || h._m > state.to)) return false;
      if (!o.noWf && state.wf && h['조어법'] !== state.wf) return false;
      return true;
    });
  }
  function byMonth(rows) { var a = new Array(nM).fill(0); rows.forEach(function (h) { if (h._m >= 0) a[h._m]++; }); return a; }
  function words(rows) { return rows.filter(function (h) { return h['단어/구'] === '단어'; }); }
  function spec(rows) { return rows.filter(function (h) { return h['일반어/전문어'] === '전문어'; }); }
  function inCat(key, val, rows) {
    return rows.filter(function (h) { return h[key] === val; });
  }
  function mount(id, opt, onClick) {
    var el = $(id); if (!el) return null;
    var c = echarts.init(el, 'kno', { renderer: 'svg' });
    if (typeof opt === 'function') opt = opt(el);
    c.setOption(opt); charts.push(c);
    if (onClick) c.on('click', onClick);
    return c;
  }
  function card(cls, title, sub, body, id) {
    return '<div class="card ' + cls + '"' + (id ? ' id="' + id + '"' : '') + '>' +
      (title ? '<div class="card-title">' + title + (sub != null && sub !== '' ? '<span class="sub">· ' + sub + '</span>' : '') + '</div>' : '') + body + '</div>';
  }
  function chartDiv(id, h) { return '<div class="chart" id="' + id + '" style="height:' + h + 'px"></div>'; }
  function grad(rgb) { return new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(' + rgb + ',.15)' }, { offset: 1, color: 'rgba(' + rgb + ',0)' }]); }
  function svgSpark(arr, w, h, color, max) {
    max = max || Math.max.apply(null, arr) || 1;
    var pts = arr.map(function (v, i) { return (i / (arr.length - 1) * w).toFixed(1) + ',' + (h - 1 - v / max * (h - 2)).toFixed(1); }).join(' ');
    return '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" style="display:block;overflow:visible">' +
      '<polygon points="0,' + h + ' ' + pts + ' ' + w + ',' + h + '" fill="' + color + '" fill-opacity=".12"/>' +
      '<polyline points="' + pts + '" fill="none" stroke="' + color + '" stroke-width="1.5"/></svg>';
  }
  function setWf(k) { if (k === '기타' && false) return; state.wf = state.wf === k ? '' : k; redraw(); }

  // ── 필터 바 ──
  function filterBar() {
    var opts = months.map(function (m, i) { return '<option value="' + i + '">' + ymLab(i) + '</option>'; }).join('');
    $('filters').innerHTML =
      '<label>기간</label><select id="fFrom">' + opts + '</select><span style="color:var(--text-3)">–</span><select id="fTo">' + opts + '</select>' +
      '<label style="margin-left:8px">조어법</label><select id="fWf"><option value="">전체</option>' +
      countBy('조어법', heads).map(function (e) { return '<option>' + esc(e[0]) + '</option>'; }).join('') + '</select>' +
      '<div class="chips" id="chips"></div><div class="meta">최종 갱신 2026-10-31</div>';
    $('fFrom').onchange = function () { state.from = Math.min(+this.value, state.to); redraw(); };
    $('fTo').onchange = function () { state.to = Math.max(+this.value, state.from); redraw(); };
    $('fWf').onchange = function () { state.wf = this.value; redraw(); };
  }
  function syncFilters() {
    $('fFrom').value = state.from; $('fTo').value = state.to; $('fWf').value = state.wf;
    var chips = [];
    if (state.from !== 0 || state.to !== nM - 1) chips.push(['period', ymLab(state.from) + '–' + ymLab(state.to)]);
    if (state.wf) chips.push(['wf', state.wf]);
    $('chips').innerHTML = chips.map(function (c) { return '<span class="chip">' + esc(c[1]) + '<button data-k="' + c[0] + '">×</button></span>'; }).join('');
    Array.prototype.forEach.call($('chips').querySelectorAll('button'), function (b) {
      b.onclick = function () { if (b.dataset.k === 'period') { state.from = 0; state.to = nM - 1; } else state.wf = ''; redraw(); };
    });
  }

  // ── KPI (총 신어 · 이번 달 · 최다 조어법) ──
  function kpiData() {
    var rows = filtered(), bm = byMonth(filtered({ noPeriod: true })), w = words(rows), wf = countBy('조어법', w)[0];
    return { total: rows.length, cur: bm[state.to], spark: bm.slice(Math.max(0, state.to - 11), state.to + 1), wf: wf, wn: w.length };
  }
  function kpiCards(cls, plain) {
    cls = 'span-2';
    var k = kpiData(), c = plain ? 'card plain ' : 'card ', rows = filtered();
    function first(key) { return rows.reduce(function (a, h) { return (!a || h[key] > a[key]) ? h : a; }, null); }
    function topCard(label, key) {
      var h = first(key);
      return '<div class="' + c + cls + (h ? ' kpi-link" data-w="' + esc(h['등재표제어']) + '"' : '"') + '><div class="kpi-label">' + label + '</div><div class="kpi-value kpi-word">' + (h ? esc(disp(h['등재표제어'])) : '–') + '</div>' +
             '</div>';
    }
    // 최다 조어법(분모=단어) · 최다 의미 범주(분모=전체) · 최다 전문 분야(분모=전문어)
    function mostCard(label, key, base) {
      var e = countBy(key, base)[0], n = base.length;
      return '<div class="' + c + cls + (e ? ' fk" data-fk="' + esc(key) + '" data-fv="' + esc(e[0]) + '"' : '"') + '><div class="kpi-label">' + label + '</div><div class="kpi-value kpi-word">' +
             (e ? esc(e[0].replace(/[〔〕『』「」]/g, '')) + ' <span title="' + tip(e[1], n) + '">' + pct0(e[1], n) + '%</span>' : '–') + '</div></div>';
    }
    return '<div class="' + c + cls + ' fk" data-fk="__all"><div class="kpi-label">총 신어</div><div class="kpi-value">' + num(k.total) + '</div>' +
           '<div class="kpi-desc">' + ymLab(state.from) + '–' + ymLab(state.to) + '</div></div>' +
           topCard('신문 빈도 1위', 'NN') + topCard('댓글 빈도 1위', 'YT') +
           mostCard('최다 조어법', '조어법', words(rows)) + mostCard('최다 의미 범주', '의미 범주', rows) + mostCard('최다 전문 분야', '전문 분야', spec(rows));
  }

  // ── 월별 신어 수 ──
  function lineOpt(data, rowsByM, el, kind) {
    var max = Math.max.apply(null, data), maxI = data.indexOf(max), last = nM - 1;
    // 달마다 총빈도 1위 표제어
    var topW = (rowsByM || []).map(function (a) { var t = a.slice().sort(function (p, q) { return q['총빈도'] - p['총빈도']; })[0]; return t ? t['등재표제어'] : ''; });
    var rowsN = el.clientWidth < 700 ? 3 : 2;
    var lab = { show: true, position: 'top', color: C.t1, fontSize: 12, fontWeight: 600, formatter: function (p) { return (p.dataIndex === maxI || p.dataIndex === last) ? num(p.value) : ''; } };
    var s = kind === 'bar'
      ? { type: 'bar', data: data.map(function (v, i) { return { value: v, itemStyle: { color: (i < state.from || i > state.to) ? C.muted : C.accent } }; }), barMaxWidth: 22, itemStyle: { borderRadius: [4, 4, 0, 0] }, label: lab }
      : { type: 'line', data: data, showSymbol: true, symbolSize: 6, itemStyle: { color: 'rgba(79,70,229,0)', borderWidth: 0 }, emphasis: { itemStyle: { color: C.accent } },
          lineStyle: { width: 2, color: C.accent }, areaStyle: { color: grad('79,70,229') }, label: lab,
          markArea: (state.from !== 0 || state.to !== nM - 1) ? { silent: true, itemStyle: { color: 'rgba(224,231,255,.5)' }, data: [[{ xAxis: xLab(state.from) }, { xAxis: xLab(state.to) }]] } : undefined };
    s.animationDuration = 300;
    return {
      grid: { left: 8, right: 20, top: 26, bottom: 4 + rowsN * 14, containLabel: true },
      tooltip: { trigger: 'axis', axisPointer: { type: kind === 'bar' ? 'shadow' : 'line', lineStyle: { color: C.muted }, shadowStyle: { color: 'rgba(224,231,255,.4)' } },
        formatter: function (p) {
          var i = p[0].dataIndex, top = (rowsByM ? rowsByM[i] : []).slice().sort(function (a, b) { return b['총빈도'] - a['총빈도']; }).slice(0, 3);
          return '<b>' + ymLab(i) + '</b> · ' + num(data[i]) + (top.length ? '<br>' + top.map(function (h) { return esc(h['등재표제어']); }).join('<br>') : '');
        } },
      xAxis: [{ type: 'category', data: months.map(function (_, i) { return xLab(i); }), boundaryGap: kind === 'bar', axisLabel: { interval: xInterval(el) } },
              { type: 'category', position: 'bottom', offset: 20, boundaryGap: kind === 'bar', data: topW, axisLine: { show: false }, axisTick: { show: false },
                axisLabel: { interval: 0, color: C.accent, fontSize: 11, fontWeight: 600, lineHeight: 14,
                             formatter: function (v, i) { var lv = i % rowsN; return new Array(lv + 1).join('\n') + v; } } }],
      yAxis: { type: 'value', splitNumber: 3 },
      series: [s]
    };
  }
  function lineCard(cls, h, kind) {
    return card(cls, '월별 신어 수', num(filtered({ noPeriod: true }).length), chartDiv('ch-line', h));
  }
  function mountLine(kind) {
    var rows = filtered({ noPeriod: true }), rbm = months.map(function () { return []; });
    rows.forEach(function (h) { if (h._m >= 0) rbm[h._m].push(h); });
    var data = rbm.map(function (a) { return a.length; });
    var c = mount('ch-line', function (el) { return lineOpt(data, rbm, el, kind); });
    if (!c) return;
    // 그래프에서 드래그해 기간 선택
    c.setOption({ brush: { xAxisIndex: 0, brushType: 'lineX', brushMode: 'single', throttleType: 'debounce', throttleDelay: 300,
                           brushStyle: { color: 'rgba(79,70,229,.08)', borderColor: 'rgba(79,70,229,.3)', borderWidth: 1 } }, toolbox: { show: false } });
    c.dispatchAction({ type: 'takeGlobalCursor', key: 'brush', brushOption: { brushType: 'lineX', brushMode: 'single' } });
    c.on('brushEnd', function (e) {
      var a = e.areas && e.areas[0]; if (!a || !a.coordRange) return;
      var r = a.coordRange; state.from = Math.max(0, Math.min(r[0], r[1])); state.to = Math.min(nM - 1, Math.max(r[0], r[1])); redraw();
    });
  }

  // ── 구성 비율: 도넛 (사용의 보편성 장르·주제는 크게, 단어/구·일반어/전문어는 작게) ──
  var GORD = ['장르 보편적', '장르 특정적(NN)', '장르 특정적(YT)'];
  var pendingDonuts = [];
  var DN_KEY = { 'dn-gen': '장르 보편성', 'dn-top': '주제 보편성', 'dn-wp': '단어/구', 'dn-gs': '일반어/전문어' };
  function compData() {
    var rows = filtered(), NA = '사용의 보편성 미적용';
    var gen = countBy('장르 보편성', rows).filter(function (e) { return e[0] !== NA; }).sort(function (a, b) { return GORD.indexOf(a[0]) - GORD.indexOf(b[0]); });
    return { wp: countBy('단어/구', rows), gs: countBy('일반어/전문어', rows), gen: gen,
             top: countBy('주제 보편성', rows).filter(function (e) { return e[0] !== NA; }), n: rows.length };
  }
  // 사용의 보편성(장르): 모카 계열 (장르 보편적 → 장르 특정적(NN) → 장르 특정적(YT))
  var GEN_PAL = ['#5B3A29', '#A47551', '#E8D5C4'];   // 모카
  function compCol(entries, e, i) {
    if (GORD.indexOf(e[0]) >= 0) return GEN_PAL[GORD.indexOf(e[0])];
    return entries.length === 2 ? (i === 0 ? C.accent : C.muted) : (entries.length === 1 ? C.accent : PAL[i]);
  }
  function sumE(entries) { return entries.reduce(function (a, e) { return a + e[1]; }, 0); }
  // 도넛 자리 하나: 제목 + 차트 영역 (그리기는 redraw 끝에서)
  function donutSlot(id, title, entries, h, mode) {
    var n = sumE(entries);
    pendingDonuts.push({ id: id, entries: entries, n: n, mode: mode });
    // 가운데 수치형 도넛은 범례를 차트 밖 글자로: 카드 폭에 맞춰 한 줄로 줄인다
    var lg = mode === 'center' ? '<div class="dn-lg">' + entries.map(function (e, i) {
      return '<span class="fk" data-fk="' + esc(DN_KEY[id] || '') + '" data-fv="' + esc(e[0]) + '" title="' + tip(e[1], n) + '"><i style="background:' + compCol(entries, e, i) + '"></i>' + esc(e[0]) + ' ' + pct0(e[1], n) + '%</span>';
    }).join('') + '</div>' : '';
    return '<div class="dn"><div class="card-title">' + title + '<span class="sub">· n=' + num(n) + '</span></div>' + chartDiv(id, h) + lg + '</div>';
  }
  function donutOpt(d) {
    var big = d.mode === 'big' || d.mode === 'center';
    var data = d.entries.map(function (e, i) { return { name: e[0], value: e[1], itemStyle: { color: compCol(d.entries, e, i) } }; });
    var o = {
      tooltip: { trigger: 'item', formatter: function (p) { return esc(p.name) + '<br>' + tip(p.value, d.n); } },
      series: [{ type: 'pie', data: data, avoidLabelOverlap: true, animationDuration: 300,
                 radius: big ? ['38%', '62%'] : ['50%', '80%'], center: big ? ['50%', '52%'] : ['26%', '50%'],
                 itemStyle: { borderColor: '#fff', borderWidth: 2 },
                 label: big ? { show: true, overflow: 'none', formatter: function (p) { return '{n|' + p.name + '}\n{v|' + pct0(p.value, d.n) + '%}'; },
                                rich: { n: { fontSize: 12, color: C.t2, lineHeight: 18 }, v: { fontSize: 18, fontWeight: 700, color: C.t1, lineHeight: 22 } } } : { show: false },
                 labelLine: big ? { length: 10, length2: 14, lineStyle: { color: C.muted } } : { show: false },
                 emphasis: { scale: true, scaleSize: 4 } }]
    };
    if (!big) o.legend = { orient: 'vertical', left: '56%', top: 'middle', icon: 'roundRect', itemWidth: 10, itemHeight: 10, itemGap: 10, selectedMode: false,
                           textStyle: { color: C.t2, fontSize: 14, fontFamily: "'Song Myung', serif" }, formatter: function (name) {
                             var e = d.entries.filter(function (x) { return x[0] === name; })[0]; return name + '  ' + pct0(e[1], d.n) + '%'; } };
    if (d.mode === 'center') {   // 가운데에 첫 범주 비율
      o.series[0].label.show = false; o.series[0].labelLine = { show: false };
      o.series[0].center = ['50%', '50%']; o.series[0].radius = ['52%', '76%'];
      if (d.entries.length) o.graphic = [{ type: 'text', left: 'center', top: '38%', style: { text: pct0(d.entries[0][1], d.n) + '%', fontSize: 34, fontWeight: 800, fill: C.t1, fontFamily: FONT } },
                                         { type: 'text', left: 'center', top: '56%', style: { text: d.entries[0][0], fontSize: 17, fontWeight: 400, fill: C.t2, fontFamily: "'Song Myung', serif" } }];
    }
    return o;
  }
  function mountDonuts() { pendingDonuts.forEach(function (d) { mount(d.id, donutOpt(d), function (p) { if (window.goFreq) window.goFreq(DN_KEY[d.id], p.name); }); }); pendingDonuts = []; }
  // 사용의 보편성(장르)·(주제) 큰 도넛 두 개
  function bigDonuts(cls, h, mode, dir) {
    var c = compData();
    return '<div class="card ' + cls + '"><div class="dgrid' + (dir === 'col' ? ' col' : '') + '">' +
      donutSlot('dn-gen', '사용의 보편성(장르)', c.gen, h, mode || 'big') + donutSlot('dn-top', '사용의 보편성(주제)', c.top, h, mode || 'big') + '</div></div>';
  }
  // 단어/구·일반어/전문어 작은 도넛 두 개
  function smallDonuts(cls, h, dir) {
    var c = compData();
    return '<div class="card ' + cls + '"><div class="dgrid' + (dir === 'col' ? ' col' : '') + '">' +
      donutSlot('dn-wp', '단어/구', c.wp, h || 130, 'small') + donutSlot('dn-gs', '일반어/전문어', c.gs, h || 130, 'small') + '</div></div>';
  }

  // ── 순위 데이터 ──
  function ranks() {
    var w = words(filtered({ noWf: true })), rows = filtered(), sp = spec(rows);
    return {
      wf: { title: '조어법', key: '조어법', entries: countBy('조어법', w), total: w.length, rows: w },
      sem: { title: '의미 범주', key: '의미 범주', entries: topN(countBy('의미 범주', rows)), total: rows.length, rows: rows },
      dom: { title: '전문 분야', key: '전문 분야', entries: topN(countBy('전문 분야', sp)), total: sp.length, rows: sp }
    };
  }
  // 순위: 점과 선(시안 2 모양) + 예시 표제어(그 범주에서 총빈도 높은 순)
  function catRows(r, e) {
    // '기타'가 실제 범주 값(조어법 기타)이면 그대로, 아니면 상위 10개 밖 나머지
    if (e[0] !== '기타' || r.rows.some(function (h) { return h[r.key] === '기타'; })) return inCat(r.key, e[0], r.rows);
    var shown = r.entries.map(function (x) { return x[0]; });
    return r.rows.filter(function (h) { return h[r.key] && shown.indexOf(h[r.key]) < 0; });
  }
  function examples(rows, n) { return rows.slice().sort(function (a, b) { return b['총빈도'] - a['총빈도']; }).slice(0, n).map(function (h) { return h['등재표제어']; }); }
  function rankCard(cls, k, r) {
    var max = r.entries.reduce(function (a, e) { return Math.max(a, e[1]); }, 1), sel = k === 'wf' ? state.wf : '';
    var body = '<div class="lp" id="ch-' + k + '">' + r.entries.map(function (e) {
      var ex = examples(catRows(r, e), 5), dim = sel && e[0] !== sel, w = (e[1] / max * 100);
      return '<div class="lp-row' + (k === 'wf' ? ' clk' : '') + (dim ? ' dim' : '') + '" data-k="' + esc(e[0]) + '" title="' + esc(clean(e[0])) + ': ' + tip(e[1], r.total) + (ex.length ? '\n' + esc(ex.join(', ')) : '') + '">' +
        '<div class="lp-name">' + esc(clean(e[0])) + '</div>' +
        '<div class="lp-track"><span class="lp-stem" style="width:' + w + '%"></span><span class="lp-dot" style="left:' + w + '%"></span></div>' +
        '<div class="lp-val">' + pct0(e[1], r.total) + '% <em>(' + num(e[1]) + ')</em></div>' +
        '<div class="lp-ex">' + esc(ex.slice(0, 3).join(', ')) + '</div></div>';
    }).join('') + '</div>';
    return card(cls, r.title, num(r.total), body);
  }
  function mountRank(k, r) {
    if (k !== 'wf' || !$('ch-wf')) return;
    Array.prototype.forEach.call($('ch-wf').querySelectorAll('.lp-row'), function (row) { row.onclick = function () { setWf(row.dataset.k); }; });
  }

  // ── 사용 추이 (신문 말뭉치 초록 / 댓글 말뭉치 빨강) ──
  function trendCard(cls, h) {
    return '<div class="card ' + cls + '"><div class="trend-head"><span class="card-title" style="margin:0">사용 추이<span class="sub">· 10억 어절당 상대빈도</span></span>' +
      '<div class="kno-search"><input id="trendQ" list="n25Words" type="search" autocomplete="off"><button id="trendBtn" type="button">검색</button></div>' +
      '<div class="trend-legend"><span><i style="background:' + NN_C + '"></i>신문 말뭉치</span><span><i style="background:' + YT_C + '"></i>댓글 말뭉치</span></div></div>' +
      chartDiv('ch-trend', h || 260) + '</div>';
  }
  function mountTrend() {
    if (!$('ch-trend')) return;
    // 띄어쓰기·^ 차이는 무시하고 찾는다 (등재표제어 또는 공백 없는 신어 어형). 못 찾으면 그래프는 그대로 두고 입력값만 남긴다
    $('trendBtn').onclick = function () {
      var q = $('trendQ').value, key = q.replace(/[\s^-]/g, '');
      var h = byName[q.trim()] || heads.filter(function (x) { return x['등재표제어'].replace(/[\s^-]/g, '') === key || (x['신어'] || '').replace(/[\s^-]/g, '') === key; })[0];
      if (!h) return;
      trendWord = h['등재표제어']; redraw();
    };
    $('trendQ').onkeydown = function (e) { if (e.key === 'Enter') $('trendBtn').click(); };
    var h = byName[trendWord]; if (!h) return;
    $('trendQ').value = disp(h['등재표제어']);
    var m = monthly[h.id] || { nn: new Array(nM).fill(0), yt: new Array(nM).fill(0) };
    var rel = function (arr, w) { return arr.map(function (v, i) { return w[i] ? Math.round(v / w[i] * 1e9) : 0; }); };
    var nn = rel(m.nn, wordsNN), yt = rel(m.yt, wordsYT);
    mount('ch-trend', function (el) { return {
      grid: { left: 8, right: 16, top: 12, bottom: 4, containLabel: true },
      tooltip: { trigger: 'axis', formatter: function (p) { var i = p[0].dataIndex; return '<b>' + ymLab(i) + '</b><br>신문 말뭉치: ' + num(nn[i]) + '<br>댓글 말뭉치: ' + num(yt[i]); } },
      xAxis: { type: 'category', data: months.map(function (m) { return m.slice(0, 4) + '-' + m.slice(4); }), boundaryGap: false, axisLabel: { interval: 0, rotate: 90 } },
      yAxis: { type: 'value', splitNumber: 3 },
      series: [
        { name: '신문 말뭉치', type: 'line', data: nn, smooth: 0.2, showSymbol: false, lineStyle: { width: 2, color: NN_C }, itemStyle: { color: NN_C }, areaStyle: { color: grad('75,211,127') }, animationDuration: 300 },
        { name: '댓글 말뭉치', type: 'line', data: yt, smooth: 0.2, showSymbol: false, lineStyle: { width: 2, color: YT_C }, itemStyle: { color: YT_C }, areaStyle: { color: grad('251,113,113') }, animationDuration: 300 }]
    }; });
    var f = function (v) { return v == null ? '–' : (+v).toFixed(2); };
    if ($('trend-stats')) $('trend-stats').innerHTML = [['r', f(h.r)], ['CV', f(h.CV)], ['봉우리 수', h['봉우리 수'] == null ? '–' : num(h['봉우리 수'])], ['봉우리 간격 CV', f(h['봉우리 간격 CV'])]]
      .map(function (s) { return '<div class="st"><span class="stat-l">' + s[0] + '</span><span class="stat-v">' + String(s[1]).replace(/^-/, '−') + '</span></div>'; }).join('');
  }

  // ══════ 시안별 화면 ══════
  // 공통: 순위(조어법·의미 범주·전문 분야)=점과 선(시안 2), 구성=도넛(사용의 보편성 장르·주제 크게)
  var R = {};
  function rank3(cls) { var r = ranks(); return { html: rankCard(cls, 'wf', r.wf) + rankCard(cls, 'sem', r.sem) + rankCard(cls, 'dom', r.dom), mount: function () { ['wf', 'sem', 'dom'].forEach(function (k) { mountRank(k, r[k]); }); } }; }

  // 1 기본형
  R[1] = function () {
    var rk = rank3('span-4');
    return { html: kpiCards() + lineCard('span-7', 250) + trendCard('span-5', 200) + bigDonuts('span-8', 280) + smallDonuts('span-4', 120, 'col') + rk.html,
             after: function () { mountLine('line'); rk.mount(); } };
  };

  // 2 세로 막대 + 가운데 수치 도넛
  R[2] = function () {
    var rk = rank3('span-4');
    return { html: kpiCards() + lineCard('span-7', 250) + trendCard('span-5', 200) + bigDonuts('span-8', 280, 'center') + smallDonuts('span-4', 120, 'col') + rk.html,
             after: function () { mountLine('bar'); rk.mount(); } };
  };

  // 3 사용의 보편성 맨 앞
  R[3] = function () {
    var rk = rank3('span-4');
    return { html: kpiCards() + bigDonuts('span-7', 280) + trendCard('span-5', 230) + lineCard('span-8', 250) + smallDonuts('span-4', 120, 'col') + rk.html,
             after: function () { mountLine('line'); rk.mount(); } };
  };

  // 4 2단: 왼쪽 사용의 보편성 세로, 오른쪽 월별 신어 수·작은 도넛·조어법
  R[4] = function () {
    var r = ranks();
    return { html: kpiCards() +
               '<div class="span-5 stackcol">' + bigDonuts('', 270, 'big', 'col') + '</div>' +
               '<div class="span-7 stackcol">' + trendCard('', 190) + lineCard('', 230) + smallDonuts('', 120) + '</div>' +
               rankCard('span-4', 'wf', r.wf) + rankCard('span-4', 'sem', r.sem) + rankCard('span-4', 'dom', r.dom),
             after: function () { mountLine('line'); ['wf', 'sem', 'dom'].forEach(function (k) { mountRank(k, r[k]); }); } };
  };

  // 5 사용의 보편성 장르 × 주제 교차표
  function crossCard(cls) {
    var rows = filtered(), NA = '사용의 보편성 미적용';
    var u = rows.filter(function (h) { return h['장르 보편성'] !== NA && h['주제 보편성'] !== NA && h['장르 보편성'] && h['주제 보편성']; });
    var tops = countBy('주제 보편성', u).map(function (e) { return e[0]; }).sort();
    var cnt = function (g, t) { return u.filter(function (h) { return h['장르 보편성'] === g && h['주제 보편성'] === t; }).length; };
    var max = 1; GORD.forEach(function (g) { tops.forEach(function (t) { max = Math.max(max, cnt(g, t)); }); });
    var body = '<table class="xtab"><thead><tr><th></th>' + tops.map(function (t) { return '<th>' + esc(t) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      GORD.map(function (g) {
        return '<tr><th>' + esc(g) + '</th>' + tops.map(function (t) {
          var v = cnt(g, t), a = v / max;
          return '<td title="' + tip(v, u.length) + '" style="background:rgba(79,70,229,' + (0.06 + a * 0.6).toFixed(2) + ');color:' + (a > .55 ? '#fff' : C.t1) + '">' +
                 '<b>' + pct0(v, u.length) + '%</b><em style="color:' + (a > .55 ? 'rgba(255,255,255,.8)' : C.t3) + '">' + num(v) + '</em></td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody></table>';
    return card(cls, '사용의 보편성(장르) × 사용의 보편성(주제)', 'n=' + num(u.length), body);
  }
  R[5] = function () {
    var rk = rank3('span-4');
    return { html: kpiCards() + lineCard('span-7', 250) + trendCard('span-5', 200) + bigDonuts('span-7', 280) + crossCard('span-5') + smallDonuts('span-12', 120) + rk.html,
             after: function () { mountLine('line'); rk.mount(); } };
  };

  // 6 사용 추이 맨 앞
  // 올해의 신어 · 이달의 신어 — 연구자가 고른 표제어를 PICKS 에 넣는다 (비우면 '–')
  var PICKS = { year: '', month: '' };
  function pickCard(cls, label, when, word) {
    var h = byName[word];
    var body = '<div class="pk-l">' + label + '<span>' + when + '</span></div>';
    if (!h) return '<div class="card ' + cls + ' pk">' + body + '<div class="pk-w empty">–</div></div>';
    var m = monthly[h.id] || { nn: new Array(nM).fill(0), yt: new Array(nM).fill(0) };
    var rel = function (arr, w) { return arr.map(function (v, i) { return w[i] ? v / w[i] * 1e9 : 0; }); };
    var nn = rel(m.nn, wordsNN), yt = rel(m.yt, wordsYT), mx = Math.max.apply(null, nn.concat(yt)) || 1;
    var tags = [h['의미 범주'] ? clean(h['의미 범주']) : '', h['조어법'] || '', h['최초 출현일'] || ''].filter(Boolean);
    return '<div class="card ' + cls + ' pk clk-w" data-w="' + esc(h['등재표제어']) + '">' + body +
      '<div class="pk-row"><div><div class="pk-w">' + esc(h['등재표제어']) + '</div><div class="pk-t">' + tags.map(esc).join(' · ') + '</div></div>' +
      '<div class="pk-sp">' + svgSpark(nn, 200, 44, NN_C, mx).replace('<svg', '<svg style="position:absolute"') + svgSpark(yt, 200, 44, YT_C, mx) + '</div></div></div>';
  }
  // 월별 신어 수: 조어법 × 월 잔디 + 달마다 대표 신어(총빈도 1위)
  var GRASS = ['#E0E7FF', '#A5B4FC', '#6366F1', '#4338CA'];
  function grassCard(cls) {
    var all = filtered({ noPeriod: true, noWf: true }), w = words(all);
    var wfc = countBy('조어법', w).map(function (e) { return e[0]; });
    var rbm = months.map(function () { return []; });
    all.forEach(function (h) { if (h._m >= 0) rbm[h._m].push(h); });
    var tot = rbm.map(function (a) { return a.length; }), totMax = Math.max.apply(null, tot) || 1;
    var cells = wfc.map(function (c) { return byMonth(inCat('조어법', c, w)); });
    var cMax = cells.reduce(function (a, r) { return Math.max(a, Math.max.apply(null, r)); }, 1);
    var lvl = function (v, mx) { return v ? GRASS[Math.min(3, Math.ceil(v / mx * 4) - 1)] : '#EEF0F3'; };
    var on = function (i) { return i >= state.from && i <= state.to; };
    var cols = 'grid-template-columns:64px repeat(' + nM + ',minmax(0,1fr))';
    var top3 = function (i) { return rbm[i].slice().sort(function (a, b) { return b['총빈도'] - a['총빈도']; }).slice(0, 3); };
    // 대표 신어: 달마다 총빈도 1위
    var rep = '<div class="gr-row gr-rep" style="' + cols + '"><div class="gr-lab"></div>' + months.map(function (_, i) {
      var t = top3(i), h = t[0];
      return '<div class="gr-pick' + (on(i) ? '' : ' off') + '" data-w="' + (h ? esc(h['등재표제어']) : '') + '" title="' + t.map(function (x) { return esc(x['등재표제어']) ; }).join('\n') + '">' +
             (h ? '<b>' + esc(h['등재표제어']) + '</b>' : '') + '</div>';
    }).join('') + '</div>';
    var head = '<div class="gr-row" style="' + cols + '"><div class="gr-lab"></div>' + months.map(function (_, i) {
      return '<div class="gr-m clk-m' + (on(i) ? '' : ' off') + '" data-i="' + i + '">' + xLab(i) + '</div>';
    }).join('') + '</div>';
    var row = function (label, arr, mx, key, n) {
      var dim = key && state.wf && state.wf !== key;
      return '<div class="gr-row" style="' + cols + (dim ? ';opacity:.35' : '') + '"><div class="gr-lab' + (key ? ' clk-wf' : '') + '" data-k="' + esc(key || '') + '">' + esc(label) + '<em>' + num(n) + '</em></div>' +
        arr.map(function (v, i) {
          var c = lvl(v, mx), dark = c === GRASS[2] || c === GRASS[3];
          return '<div class="gr-c' + (on(i) ? '' : ' off') + '" style="background:' + c + ';color:' + (dark ? '#fff' : C.t2) + '" title="' + esc(label) + ' · ' + ymLab(i) + ': ' + num(v) + '">' + (v || '') + '</div>';
        }).join('') + '</div>';
    };
    var body = rep + head + row('전체', tot, totMax, '', all.length) +
      '<div class="gr-gap"></div>' + wfc.map(function (c, k) { return row(c, cells[k], cMax, c, cells[k].reduce(function (a, b) { return a + b; }, 0)); }).join('');
    return card(cls + ' grass', '월별 신어 수', num(all.length) + ' · 조어법 ' + num(w.length), body);
  }
  function mountGrass() {
    Array.prototype.forEach.call(document.querySelectorAll('.clk-wf'), function (el) { el.onclick = function () { setWf(el.dataset.k); }; });
    Array.prototype.forEach.call(document.querySelectorAll('.clk-m'), function (el) {
      el.onclick = function () { var i = +el.dataset.i; if (state.from === i && state.to === i) { state.from = 0; state.to = nM - 1; } else { state.from = state.to = i; } redraw(); };
    });
    Array.prototype.forEach.call(document.querySelectorAll('.gr-pick'), function (el) { el.onclick = function () { if (el.dataset.w) { trendWord = el.dataset.w; redraw(); } }; });
  }
  // 단어/구: 100% 가로 막대 / 일반어/전문어: 도넛
  function ratioBar(title, e) {
    // 제목 순서(단어/구 → 단어, 구 / 일반어/전문어 → 일반어, 전문어)대로 제시
    var ord = title.split('/');
    e = e.slice().sort(function (x, y) { return ord.indexOf(x[0]) - ord.indexOf(y[0]); });
    var n = sumE(e);
    return '<div class="card-title">' + title + '<span class="sub">· n=' + num(n) + '</span></div><div class="wp-big">' + e.map(function (x, i) {
      return '<div class="fk" data-fk="' + esc(title) + '" data-fv="' + esc(x[0]) + '" title="' + tip(x[1], n) + '"><span class="wp-n" style="color:' + (i === 0 ? C.accent : C.t3) + '">' + esc(x[0]) + '</span><span class="wp-v">' + pct0(x[1], n) + '%</span></div>';
    }).join('') + '</div><div class="comp-bar" style="height:14px;border-radius:4px">' + e.map(function (x, i) {
      return '<span class="fk" data-fk="' + esc(title) + '" data-fv="' + esc(x[0]) + '" style="width:' + (x[1] / n * 100) + '%;background:' + (i === 0 ? C.accent : C.muted) + '" title="' + esc(x[0]) + ': ' + tip(x[1], n) + '"></span>';
    }).join('') + '</div>';
  }
  function wpCard(cls) {
    var c = compData();
    return '<div class="card ' + cls + ' wp-card"><div class="wp-blk">' + ratioBar('단어/구', c.wp) + '</div><div class="wp-blk">' + ratioBar('일반어/전문어', c.gs) + '</div></div>';
  }
  // 의미 범주·전문 분야: 트리맵 (면적=비율, 칸 안에 예시 표제어)
  function treeCard(cls, k, r, h) { return card(cls, r.title, num(r.total), chartDiv('tm-' + k, h)); }
  function mountTree(k, r) {
    var max = r.entries.reduce(function (a, e) { return Math.max(a, e[1]); }, 1);
    var mix = function (t) {   // #A5B4FC → #4338CA
      var a = [165, 180, 252], b = [67, 56, 202];
      return 'rgb(' + a.map(function (v, i) { return Math.round(v + (b[i] - v) * t); }).join(',') + ')';
    };
    var data = r.entries.map(function (e) {
      var t = e[0] === '기타' ? -1 : Math.sqrt(e[1] / max);
      return { name: clean(e[0]), value: e[1], ex: examples(catRows(r, e), 3), itemStyle: { color: t < 0 ? '#CBD5E1' : mix(t) } };
    });
    mount('tm-' + k, {
      tooltip: { formatter: function (p) { return '<b>' + esc(p.name) + '</b> ' + tip(p.value, r.total) + '<br>' + esc(p.data.ex.join(', ')); } },
      series: [{ type: 'treemap', data: data, roam: false, nodeClick: false, breadcrumb: { show: false },
                 left: 0, right: 0, top: 0, bottom: 0, squareRatio: 1.2, animationDuration: 300,
                 itemStyle: { borderColor: '#fff', borderWidth: 3, gapWidth: 3, borderRadius: 6 },
                 label: { show: true, position: 'insideTopLeft', padding: [8, 10], overflow: 'truncate',
                          formatter: function (p) { return '{n|' + p.name + '}  {v|' + pct0(p.value, r.total) + '%}\n{e|' + p.data.ex.join('\n') + '}'; },
                          rich: { n: { fontSize: 13, fontWeight: 600, color: '#fff' }, v: { fontSize: 13, color: 'rgba(255,255,255,.85)' },
                                  e: { fontSize: 11, color: 'rgba(255,255,255,.85)', lineHeight: 16, padding: [4, 0, 0, 0] } } },
                 upperLabel: { show: false } }]
    });
  }
  // 월별 신어 수: ‹ 2025.01 › 로 18개월을 넘겨 보기 (막대 줄은 위치 표시·클릭 이동)
  // 이달의 신어: 그 달 신어 중 뜻풀이가 있는 것 가운데 총빈도 1위. 양옆에 이전·다음 달을 희미하게
  function monthPick(i) {
    if (i < 0 || i >= nM) return null;
    return heads.filter(function (h) { return h._m === i && defOnly(DEFS[h['등재표제어']]); })
      .sort(function (a, b) { return b['총빈도'] - a['총빈도']; })[0] || null;
  }
  function mnName(h) { return h ? h['등재표제어'].replace(/-/g, '').replace(/\^/g, ' ') : '–'; }
  function monthCard(cls) {
    // 처음 표시 달: 2025-01
    if (ui.month == null || ui.month < 0 || ui.month >= nM) ui.month = Math.max(0, months.indexOf('202501'));
    var i = ui.month, cur = monthPick(i), prev = monthPick(i - 1), next = monthPick(i + 1);
    var peek = function (h, k, side) {
      if (k < 0 || k >= nM) return '';
      return '<div class="mn-peek mn-peek-' + side + '" data-i="' + k + '"><div class="mn-peek-ym">' + ymLab(k).replace('.', '-') + '</div><div class="mn-peek-w">' + esc(mnName(h)) + '</div></div>';
    };
    return '<div class="card ' + cls + ' mn-card"><div class="card-title">이달의 신어</div>' +
      peek(prev, i - 1, 'l') + peek(next, i + 1, 'r') +
      '<button class="mn-nav mn-l" data-d="-1" aria-label="이전 달"' + (i === 0 ? ' disabled' : '') + '>‹</button>' +
      '<button class="mn-nav mn-r" data-d="1" aria-label="다음 달"' + (i === nM - 1 ? ' disabled' : '') + '>›</button>' +
      '<div class="mn-mid"><div class="mn-ym fk" data-fk="X년 Y월 신어" data-fv="' + months[i].slice(0, 4) + '년 ' + (+months[i].slice(4)) + '월">' + ymLab(i).replace('.', '-') + '</div>' +
      (cur ? '<div class="mn-top clk-w" data-w="' + esc(cur['등재표제어']) + '">' + esc(mnName(cur)) + '</div><div class="mn-def">' + esc(defOnly(DEFS[cur['등재표제어']])) + '</div>'
           : '<div class="mn-top">–</div>') + '</div>' +
      '<div class="mn-dots">' + months.map(function (_, k) { return '<span class="' + (k === i ? 'on' : '') + '" data-i="' + k + '"></span>'; }).join('') + '</div></div>';
  }
  function mountMonth() {
    // 달을 넘기면 사용 추이도 그 달의 신어로
    var go = function (k) {
      k = Math.max(0, Math.min(nM - 1, k)); if (k === ui.month) return;
      ui.month = k; var h = monthPick(k); if (h) trendWord = h['등재표제어']; redraw();
    };
    Array.prototype.forEach.call(document.querySelectorAll('.mn-nav'), function (b) { b.onclick = function () { go(ui.month + +b.dataset.d); }; });
    Array.prototype.forEach.call(document.querySelectorAll('.mn-peek, .mn-dots span'), function (b) { b.onclick = function () { go(+b.dataset.i); }; });
    Array.prototype.forEach.call(document.querySelectorAll('.mn-top.clk-w'), function (t) { t.onclick = function () { trendWord = t.dataset.w; redraw(); }; });
    document.onkeydown = function (e) { if (e.target.tagName === 'INPUT') return; if (e.key === 'ArrowLeft') go(ui.month - 1); if (e.key === 'ArrowRight') go(ui.month + 1); };
    // 표제어가 두 줄로 넘어가지 않게: 한 줄에 들어갈 때까지 글자 크기를 줄인다
    var t = document.querySelector('.mn-card .mn-top');
    if (t) { var fs = 52; t.style.whiteSpace = 'nowrap'; t.style.fontSize = fs + 'px';
      var box = t.parentNode.clientWidth;
      while (t.scrollWidth > box && fs > 24) { fs -= 2; t.style.fontSize = fs + 'px'; } }
  }
  // 조어법·의미 범주·전문 분야: 전체 목록 (카드 안 스크롤), 줄 배경 막대 = 비율
  function listCard(cls, k, title, key, rows) {
    var e = countBy(key, rows), total = rows.length, max = e.length ? e[0][1] : 1, sel = k === 'wf' ? state.wf : '';
    var body = '<div class="ls" id="ls-' + k + '">' + e.map(function (x) {
      var ex = examples(inCat(key, x[0], rows), 3), dim = false;
      return '<div class="ls-row fk' + (dim ? ' dim' : '') + '" data-fk="' + esc(key) + '" data-fv="' + esc(x[0]) + '" data-k="' + esc(x[0]) + '" title="' + esc(clean(x[0])) + ': ' + tip(x[1], total) + '">' +
        '<span class="ls-bg" style="width:' + (x[1] / max * 100) + '%"></span>' +
        '<div class="ls-t"><b>' + esc(clean(x[0])) + '</b></div><div class="ls-v">' + pct0(x[1], total) + '%</div></div>';
    }).join('') + '</div>';
    return card(cls, title, num(total), body);
  }
  function lists(cls) {
    var w = words(filtered({ noWf: true })), rows = filtered();
    return listCard(cls, 'wf', '조어법', '조어법', w) + listCard(cls, 'sem', '의미 범주', '의미 범주', rows) + listCard(cls, 'dom', '전문 분야', '전문 분야', spec(rows));
  }
  function mountLists() {
    Array.prototype.forEach.call(document.querySelectorAll('#ls-wf .ls-row'), function (r) { r.onclick = function () { setWf(r.dataset.k); }; });
  }
  R[6] = function () {
    return { html: kpiCards() + trendCard('span-7', 236) + monthCard('span-5') + bigDonuts('span-8', 280, 'center') + wpCard('span-4') + lists('span-4'),
             after: function () { mountMonth(); } };
  };

  // 7 한 화면 압축
  R[7] = function () {
    var rk = rank3('span-4');
    return { html: kpiCards() + lineCard('span-7', 230) + trendCard('span-5', 180) + bigDonuts('span-6', 250) + smallDonuts('span-6', 110) + rk.html,
             after: function () { mountLine('line'); rk.mount(); } };
  };

  // 8 목록 → 상세: 범주를 고르면 그 범주의 월별 신어 수와 표제어
  R[8] = function () {
    var r = ranks(), dims = { '조어법': r.wf, '의미 범주': r.sem, '전문 분야': r.dom }, cur = dims[ui.dim];
    if (!cur.entries.some(function (e) { return e[0] === ui.item; })) ui.item = (cur.entries[0] || [''])[0];
    var item = ui.item, selRows = item === '기타'
      ? cur.rows.filter(function (h) { return cur.entries.map(function (x) { return x[0]; }).indexOf(h[cur.key]) < 0 && h[cur.key]; })
      : inCat(cur.key, item, cur.rows);
    var cnt = (cur.entries.filter(function (e) { return e[0] === item; })[0] || ['', 0])[1];
    var list = '<div class="seg">' + Object.keys(dims).map(function (d) { return '<button class="' + (d === ui.dim ? 'on' : '') + '" data-d="' + d + '">' + d + '</button>'; }).join('') + '</div>' +
      '<div class="mlist">' + cur.entries.map(function (e) {
        return '<div class="mrow' + (e[0] === item ? ' on' : '') + '" data-k="' + esc(e[0]) + '" title="' + tip(e[1], cur.total) + '"><span>' + esc(clean(e[0])) + '</span><b>' + pct0(e[1], cur.total) + '%</b><em>' + num(e[1]) + '</em></div>';
      }).join('') + '</div>';
    var top = selRows.slice().sort(function (a, b) { return b['총빈도'] - a['총빈도']; }).slice(0, 10);
    var detail = '<div class="d-head"><div><div class="kpi-label">' + esc(ui.dim) + '</div><div class="kpi-value">' + esc(clean(item)) + '</div></div>' +
      '<div style="text-align:right"><div class="kpi-value" title="' + tip(cnt, cur.total) + '">' + pct0(cnt, cur.total) + '%</div><div class="kpi-desc">' + num(cnt) + '</div></div></div>' +
      chartDiv('ch-det', 170) +
      '<table class="ktab wlist"><thead><tr><th>표제어</th><th>신문 말뭉치<br>절대빈도</th><th>댓글 말뭉치<br>절대빈도</th><th>최초 출현일</th></tr></thead><tbody>' +
      top.map(function (h) { return '<tr class="clk-w" data-w="' + esc(h['등재표제어']) + '"><td>' + esc(h['등재표제어']) + '</td><td style="color:#16a34a">' + num(h.NN) + '</td><td style="color:#ef4444">' + num(h.YT) + '</td><td>' + esc(h['최초 출현일']) + '</td></tr>'; }).join('') + '</tbody></table>';
    return { html: kpiCards() + card('span-4', '', '', list) + card('span-8', '', '', detail) + bigDonuts('span-7', 280) + trendCard('span-5', 230) + smallDonuts('span-12', 120),
             after: function () {
               var bm = byMonth(selRows), rbm = months.map(function () { return []; });
               selRows.forEach(function (h) { if (h._m >= 0) rbm[h._m].push(h); });
               mount('ch-det', function (el) { var o = lineOpt(bm, rbm, el, 'bar'); o.series[0].data.forEach(function (d) { d.itemStyle.color = C.accent; }); return o; });
               Array.prototype.forEach.call(document.querySelectorAll('.seg button'), function (b) { b.onclick = function () { ui.dim = b.dataset.d; ui.item = ''; redraw(); }; });
               Array.prototype.forEach.call(document.querySelectorAll('.mrow'), function (m) { m.onclick = function () { ui.item = m.dataset.k; redraw(); }; });
               Array.prototype.forEach.call(document.querySelectorAll('.clk-w'), function (t) { t.onclick = function () { trendWord = t.dataset.w; redraw(); }; });
             } };
  };

  // 9 달력: 달마다 칸 하나 (신어 수 + 상위 3개), 칸을 누르면 그 달로 기간 설정
  R[9] = function () {
    var r = ranks(), rows = filtered({ noPeriod: true }), rbm = months.map(function () { return []; });
    rows.forEach(function (h) { if (h._m >= 0) rbm[h._m].push(h); });
    var max = rbm.reduce(function (a, x) { return Math.max(a, x.length); }, 1), years = {};
    months.forEach(function (m, i) { (years[m.slice(0, 4)] || (years[m.slice(0, 4)] = [])).push(i); });
    var cal = Object.keys(years).map(function (y) {
      var cells = [];
      for (var mo = 1; mo <= 12; mo++) {
        var i = months.indexOf(y + ('0' + mo).slice(-2));
        if (i < 0) { cells.push('<div class="cal-c empty"></div>'); continue; }
        var n = rbm[i].length, a = n / max, sel = i >= state.from && i <= state.to;
        var top = rbm[i].slice().sort(function (p, q) { return q['총빈도'] - p['총빈도']; }).slice(0, 3);
        cells.push('<div class="cal-c clk" data-i="' + i + '" style="background:rgba(79,70,229,' + (0.06 + a * 0.5).toFixed(2) + ');' + (sel ? '' : 'opacity:.35') + '">' +
          '<div class="cal-m" style="color:' + (a > .6 ? '#fff' : C.t3) + '">' + mo + '월</div><div class="cal-v" style="color:' + (a > .6 ? '#fff' : C.t1) + '">' + num(n) + '</div>' +
          '<div class="cal-w" style="color:' + (a > .6 ? 'rgba(255,255,255,.85)' : C.t2) + '">' + top.map(function (h) { return esc(h['등재표제어']); }).join('<br>') + '</div></div>');
      }
      return '<div class="cal-y">' + y + '</div><div class="cal">' + cells.join('') + '</div>';
    }).join('');
    return { html: kpiCards() + card('span-12', '월별 신어 수', num(rows.length), cal) +
                    bigDonuts('span-7', 280) + trendCard('span-5', 230) + smallDonuts('span-12', 120) + rankCard('span-4', 'wf', r.wf) + rankCard('span-4', 'sem', r.sem) + rankCard('span-4', 'dom', r.dom),
             after: function () {
               ['wf', 'sem', 'dom'].forEach(function (k) { mountRank(k, r[k]); });
               Array.prototype.forEach.call(document.querySelectorAll('.cal-c.clk'), function (c) {
                 c.onclick = function () { var i = +c.dataset.i; if (state.from === i && state.to === i) { state.from = 0; state.to = nM - 1; } else { state.from = state.to = i; } redraw(); };
               });
             } };
  };

  // 10 표제어 중심: 신문/댓글 말뭉치 절대빈도를 양쪽으로 펼친 막대
  R[10] = function () {
    var r = ranks(), rows = filtered(), top = rows.slice().sort(function (a, b) { return b['총빈도'] - a['총빈도']; }).slice(0, 10);
    var mx = top.reduce(function (a, h) { return Math.max(a, h.NN, h.YT); }, 1);
    var bf = '<div class="bf-h"><span style="color:#16a34a">신문 말뭉치 절대빈도</span><span></span><span style="color:#ef4444">댓글 말뭉치 절대빈도</span></div>' +
      top.map(function (h) {
        return '<div class="bf clk-w' + (h['등재표제어'] === trendWord ? ' on' : '') + '" data-w="' + esc(h['등재표제어']) + '">' +
          '<div class="bf-l"><em>' + num(h.NN) + '</em><span style="width:' + (h.NN / mx * 100) + '%;background:' + NN_C + '"></span></div>' +
          '<div class="bf-n">' + esc(h['등재표제어']) + '</div>' +
          '<div class="bf-r"><span style="width:' + (h.YT / mx * 100) + '%;background:' + YT_C + '"></span><em>' + num(h.YT) + '</em></div></div>';
      }).join('');
    return { html: kpiCards() + card('span-7', '표제어', '총빈도 · ' + ymLab(state.from) + '–' + ymLab(state.to), bf) + trendCard('span-5', 250) +
                    lineCard('span-12', 270) + bigDonuts('span-8', 280) + smallDonuts('span-4', 120, 'col') +
                    rankCard('span-4', 'wf', r.wf) + rankCard('span-4', 'sem', r.sem) + rankCard('span-4', 'dom', r.dom),
             after: function () {
               mountLine('line'); ['wf', 'sem', 'dom'].forEach(function (k) { mountRank(k, r[k]); });
               Array.prototype.forEach.call(document.querySelectorAll('.clk-w'), function (t) { t.onclick = function () { trendWord = t.dataset.w; redraw(); }; });
             } };
  };

  function bindLinks() {
    Array.prototype.forEach.call(document.querySelectorAll('#app .fk'), function (el) {
      el.onclick = function (e) { e.stopPropagation(); if (window.goFreq) window.goFreq(el.dataset.fk, el.dataset.fv); };
    });
    Array.prototype.forEach.call(document.querySelectorAll('#app .kpi-link'), function (el) { el.onclick = function () { trendWord = el.dataset.w; redraw(); }; });
  }
  function redraw() {
    charts.forEach(function (c) { c.dispose(); }); charts = []; pendingDonuts = [];
    syncFilters();
    var v = R[TYPE]();
    $('app').innerHTML = v.html;
    v.after(); mountDonuts(); mountTrend(); bindLinks();
    Array.prototype.forEach.call(document.querySelectorAll('.dn-lg'), function (lg) {
      var fs = 14; lg.style.fontSize = fs + 'px';
      while (lg.scrollWidth > lg.clientWidth && fs > 10) { fs -= 0.5; lg.style.fontSize = fs + 'px'; }
    });
  }

  Promise.all(['metadata.json', 'headwords.json', 'frequency.json', 'defs.json'].map(function (f) {
    return fetch(window.N25_BASE + f).then(function (r) { return r.json(); });
  })).then(function (res) {
    meta = res[0]; heads = res[1]; DEFS = res[3] || {}; months = meta.months; nM = months.length; state.to = nM - 1;
    wordsNN = new Array(nM).fill(0); wordsYT = new Array(nM).fill(0);
    meta.words.forEach(function (w) { (meta.topics[w[0]][0] === 'NN' ? wordsNN : wordsYT)[w[1]] += w[2]; });
    res[2].forEach(function (f) {
      var m = monthly[f[0]] || (monthly[f[0]] = { nn: new Array(nM).fill(0), yt: new Array(nM).fill(0) });
      (meta.topics[f[1]][0] === 'NN' ? m.nn : m.yt)[f[2]] += f[3];
    });
    heads.forEach(function (h) {
      var m = (h['X년 Y월 신어'] || '').match(/(\d{4})년 (\d{1,2})월/);
      h._m = m ? months.indexOf(m[1] + ('0' + m[2]).slice(-2)) : -1; byName[h['등재표제어']] = h;
    });
    if (heads.some(function (h) { return h._m < 0; })) console.error('X년 Y월 신어 누락');
    document.body.insertAdjacentHTML('beforeend', '<datalist id="n25Words">' + heads.map(function (h) { return '<option value="' + esc(disp(h['등재표제어'])) + '">'; }).join('') + '</datalist>');
    filterBar(); redraw();
    window.N25 = { meta: meta, heads: heads, byName: byName, wordsNN: wordsNN, wordsYT: wordsYT };
    document.dispatchEvent(new Event('n25ready'));
    var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(redraw, 200); });
  });
})();
