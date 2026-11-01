// 빈도 목록 · 용례 목록 — KNO _includes/neologism2025_page.html 의 기존 구현을 그대로 옮김
// 대시보드에서 항목을 누르면 window.goFreq(열, 값)으로 빈도 목록 탭에 그 조건만 걸어 보여 준다
(function () {
  var D, freqDT = null, kwicDT = null, kwicWord = '', kwicSrc = 'NN', kwicAll = [], totNN = 0, totYT = 0;
  var fk = { key: '', val: '' };   // 대시보드에서 넘어온 조건
  var TOPIC_KO = {
    'news_and_politics': '뉴스/정치', 'gaming': '게임', 'people_and_blogs': '인물/블로그',
    'entertainment': '엔터테인먼트', 'music': '음악', 'comedy': '코미디', 'sports': '스포츠',
    'education': '교육', 'auto_and_vehicles': '자동차', 'howto_and_style': '노하우/스타일',
    'film': '영화', 'travel_and_events': '여행/이벤트', 'science_and_technology': '과학/기술',
    'pets_and_animals': '반려동물', 'nonprofits_and_activism': '비영리/시민활동'
  };
  var GENRE_KO = { NN: '신문', YT: '댓글' };   // 용례 목록 '장르' 열 표기
  function tko(t) { return TOPIC_KO[t] || t; }
  function disp(w) { return String(w == null ? '' : w).replace(/-/g, '').replace(/\^/g, ' '); }   // 표제어 표시: - 는 붙이고 ^ 는 공백
  // 띄어쓰기·^ 차이 무시하고 표제어 찾기
  function find(q) { q = String(q || '').trim(); var k = q.replace(/[\s^-]/g, ''); return D.byName[q] || D.heads.filter(function (x) { return x['등재표제어'].replace(/[\s^-]/g, '') === k; })[0]; }
  function esc(s) { return $('<i>').text(s == null ? '' : s).html(); }

  function showPane(p) {
    $('.tab[data-pane]').removeClass('on').filter('[data-pane="' + p + '"]').addClass('on');
    $('.n25-pane').hide(); $('#pane-' + p).show();
    if (freqDT) freqDT.columns.adjust();
    if (kwicDT) kwicDT.columns.adjust();
    window.scrollTo(0, 0);
  }
  window.n25ShowPane = showPane;
  $(document).on('click', '.tab[data-pane]', function () { showPane($(this).data('pane')); });

  // ── 빈도 목록 ──
  function buildFreq() {
    var cls = function (v) { return v ? '<span class="cls-cell">' + esc(v) + '</span>' : '<span class="cls-none">–</span>'; };
    freqDT = $('#neoTable').DataTable({
      data: D.heads.map(function (h, i) {
        // 신문 빈도 비율 = 신문 상대빈도 ÷ (신문 상대빈도 + 댓글 상대빈도) × 100 (18개월 합산)
        var nr = h.NN / totNN * 1e9, yr = h.YT / totYT * 1e9;
        var ratio = (nr + yr) > 0 ? nr / (nr + yr) * 100 : null;
        return [
          '<span class="neo-link" data-neo="' + esc(h['등재표제어']) + '">' + esc(disp(h['등재표제어'])) + '</span>',
          esc(h['X년 Y월 신어']),
          '<span class="tf-total" style="color:#16a34a">' + h.NN.toLocaleString() + '</span>',
          '<span class="tf-total" style="color:#ef4444">' + h.YT.toLocaleString() + '</span>',
          // '사용의 보편성 미적용'은 – 로
          cls(h['장르 보편성'] === '사용의 보편성 미적용' ? '' : h['장르 보편성']), cls(h['주제 보편성'] === '사용의 보편성 미적용' ? '' : h['주제 보편성']),
          cls(h['전문 분야']), cls(h['단어/구']), cls(h['의미 범주']),
          h['총빈도'], i   // 숨김: 총빈도(정렬용), 표제어 번호(조건용)
        ];
      }),
      deferRender: true, pageLength: 100, order: [[1, 'desc']], orderClasses: false, dom: '<"dt-top"l>rt<"dt-bottom"p>', autoWidth: false,
      columnDefs: [{ targets: [2, 3], type: 'html-num-fmt', className: 'dt-right' }, { targets: [1, 4, 5, 6, 7, 8], className: 'dt-center' }, { targets: [9, 10], visible: false, searchable: false },
                   // X년 Y월 신어: 정렬은 달 순서대로
                   { targets: 1, render: function (v, type, row) { return (type === 'sort' || type === 'type') ? D.heads[row[10]]._m : v; } },
                   // 열 너비: 표제어·의미 범주 넓게, 연도·비율 좁게
                   { targets: 0, width: '17%' }, { targets: 1, width: '10%' }, { targets: 2, width: '10%' },
                   { targets: 3, width: '10%' }, { targets: 4, width: '12%' }, { targets: 5, width: '10%' },
                   { targets: 6, width: '9%' }, { targets: 7, width: '7%' }, { targets: 8, width: '15%' }],
      language: { search: '표제어 검색:', lengthMenu: '_MENU_ 건씩 보기', info: '_TOTAL_건 중 _START_~_END_', infoEmpty: '데이터 없음', infoFiltered: '(전체 _MAX_건에서 필터링)',
                  paginate: { first: '처음', last: '끝', next: '다음', previous: '이전' }, zeroRecords: '일치하는 신어가 없습니다' }
    });
    // 대시보드에서 넘어온 조건 (열 = 값)
    $.fn.dataTable.ext.search.push(function (settings, row, idx, raw) {
      if (settings.nTable.id !== 'neoTable' || !fk.key) return true;
      var h = D.heads[raw[10]];
      return fk.key === '__all' ? true : h[fk.key] === fk.val;
    });
    window.xlFilter(freqDT);   // 머리글 누르면 정렬·값 골라 보기 (표제어 포함)
    // 내려받기(엑셀 저장)는 저작권 문제로 두지 않음
    $('#freqBtn').on('click', function () { freqDT.search($('#freqQ').val()).draw(); });
    $('#freqQ').on('keydown', function (e) { if (e.key === 'Enter') $('#freqBtn').click(); });
    // 표제어를 누르면 용례 목록으로
    $(document).on('click', '#neoTable .neo-link', function () { showPane('kwic'); loadKwic($(this).data('neo')); });
  }
  function setChip() {
    $('#freqChip').html(fk.key && fk.key !== '__all'
      ? '<span class="chip">' + esc(fk.key) + ' ' + esc(fk.val) + '<button type="button" id="freqChipX">×</button></span>' : '');
    $('#freqChipX').on('click', function () { fk = { key: '', val: '' }; setChip(); freqDT.order([[1, 'desc']]).draw(); });
  }
  // 대시보드 → 빈도 목록: 조건을 걸고 총빈도 많은 순으로
  window.goFreq = function (key, val) {
    if (!freqDT) return;
    fk = { key: key || '', val: val || '' };
    $('#freqQ').val(''); freqDT.search('');
    setChip();
    freqDT.order([[9, 'desc']]).draw();
    showPane('freq');
  };

  // ── 용례 목록: KWIC 색인 ──
  $(document).on('click', '.kwic-src', function () {
    $('.kwic-src').removeClass('active'); $(this).addClass('active');
    kwicSrc = $(this).data('src');
    if (kwicDT) kwicDT.clear().rows.add(kwicAll.filter(function (r) { return r[7] === kwicSrc; })).draw();
  });
  function loadKwic(name) {
    var h = find(typeof name === 'string' ? name : $('#kwicQ').val());
    if (!h || !h['용례']) return;
    $('#kwicQ').val(disp(h['등재표제어']));
    $('#kwicWrap').hide(); $('#kwicLoading').show();
    var urls = h['용례'] === 'file' ? [window.N25_BASE + 'kwic/' + h.id + '.json']
      : D.meta.months.map(function (_, i) { return window.N25_BASE + 'kwic/' + h.id + '/' + i + '.json'; });
    Promise.all(urls.map(function (u) { return fetch(u).then(function (r) { return r.ok ? r.json() : []; }); }))
      .then(function (parts) {
        var rows = [].concat.apply([], parts).map(function (r) {
          var d = String(r[0]), g = D.meta.topics[r[3]][0];
          // 링크: 신문 = 문서 ID(기사 URL), 댓글 = 영상 URL + 댓글 ID('.' 앞)
          var url = g === 'NN' ? r[10] : 'https://www.youtube.com/watch?v=' + r[9] + '&lc=' + String(r[10]).split('.')[0];
          return [d.slice(0, 4) + '.' + d.slice(4, 6) + '.' + d.slice(6) + '.', GENRE_KO[g], tko(D.meta.topics[r[3]][1]), r[5], r[6], r[7], url, g];
        });
        kwicAll = rows;
        rows = rows.filter(function (r) { return r[7] === kwicSrc; });
        if (kwicDT) kwicDT.clear().rows.add(rows).draw();
        else kwicDT = $('#kwicTable').DataTable({
          data: rows, deferRender: true, pageLength: 100, order: [[0, 'asc']], orderClasses: false, autoWidth: false, dom: '<"dt-top"lf>rt<"dt-bottom"p>',
          // 좌문맥·우문맥은 같은 폭(키워드가 가운데에 오도록)
          columns: [{ width: '92px' }, { width: '48px' }, { width: '96px' },
                    { className: 'kw-left', render: function (v, t) { return t === 'display' ? '<span>' + esc(v) + '</span>' : v; } },
                    { className: 'kw-key', width: '84px', render: $.fn.dataTable.render.text() },
                    { className: 'kw-right', render: $.fn.dataTable.render.text() },
                    { width: '40px', orderable: false, render: function (v, t) { return t === 'display' ? '<a href="' + esc(v) + '" target="_blank" class="url-link"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></a>' : v; } }],
          language: { search: '검색:', lengthMenu: '_MENU_ 건씩 보기', info: '_TOTAL_건 중 _START_~_END_', infoEmpty: '데이터 없음',
                      infoFiltered: '(전체 _MAX_건에서 필터링)', paginate: { first: '처음', last: '끝', next: '다음', previous: '이전' } }
        });
        window.xlFilter(kwicDT, [3, 4, 5, 6]);   // 좌 문맥·키워드·우 문맥·링크는 필터 없음
        kwicWord = h['등재표제어'];
        $('#kwicLoading').hide(); $('#kwicWrap').show(); kwicDT.columns.adjust();
      });
  }
  $('#kwicBtn').on('click', function () { loadKwic(); });
  $('#kwicQ').on('keydown', function (e) { if (e.key === 'Enter') loadKwic(); });

  document.addEventListener('n25ready', function () {
    D = window.N25;
    totNN = D.wordsNN.reduce(function (a, b) { return a + b; }, 0);
    totYT = D.wordsYT.reduce(function (a, b) { return a + b; }, 0);
    $('#n25WordsK').html(D.heads.map(function (h) { return '<option value="' + esc(disp(h['등재표제어'])) + '">'; }).join(''));
    buildFreq();
    loadKwic('두쫀쿠');   // 기존과 같이 용례 목록은 '두쫀쿠'를 미리 띄워 둔다
  });
})();
