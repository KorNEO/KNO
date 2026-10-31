// 엑셀처럼: 머리글마다 ▾ 단추 → 오름차순/내림차순 정렬 + 값 골라 보기(체크)
// window.xlFilter(dt, skipCols) — DataTables 인스턴스에 붙인다
(function () {
  var filters = {};   // 표 id → { 열 번호: Set(보이는 값) }
  function txt(v) { return $('<i>').html(v == null ? '' : String(v)).text().trim(); }
  $.fn.dataTable.ext.search.push(function (settings, row) {
    var f = filters[settings.nTable.id]; if (!f) return true;
    for (var c in f) { if (f[c] && !f[c].has(txt(row[c]))) return false; }
    return true;
  });
  function close() { $('.xf-menu').remove(); }
  $(document).on('mousedown', function (e) { if (!$(e.target).closest('.xf-menu, .xf-btn').length) close(); });

  window.xlFilter = function (dt, skip) {
    var id = dt.table().node().id; filters[id] = filters[id] || {};
    skip = skip || [];
    dt.columns().every(function (ci) {
      if (!this.visible() || skip.indexOf(ci) >= 0) return;
      var th = $(this.header());
      th.off('click.DT keypress.DT');   // 머리글 눌러 정렬 끔 (▾ 메뉴로만)
      if (th.find('.xf-btn').length) return;
      var btn = $('<button type="button" class="xf-btn" aria-label="정렬·필터">▾</button>').appendTo(th);
      btn.on('mousedown click', function (e) { e.stopPropagation(); });
      // 머리글 칸 어디를 눌러도 메뉴가 열림
      th.addClass('xf-th').on('mousedown', function (e) { e.stopPropagation(); }).on('click', function (e) { if (!$(e.target).closest('.xf-menu').length) { e.stopPropagation(); btn.trigger('click'); } });
      btn.on('click', function () {
        var open = $('.xf-menu').data('col') === ci && $('.xf-menu').data('tbl') === id;
        close(); if (open) return;
        var col = dt.column(ci), vals = {}, cur = filters[id][ci];
        col.data().each(function (v) { vals[txt(v)] = 1; });
        var list = Object.keys(vals).sort(function (a, b) { return a.localeCompare(b, 'ko', { numeric: true }); });
        var menu = $('<div class="xf-menu"></div>').data('col', ci).data('tbl', id);
        menu.append('<button type="button" class="xf-sort" data-d="asc">오름차순 정렬</button><button type="button" class="xf-sort" data-d="desc">내림차순 정렬</button><div class="xf-sep"></div>');
        var box = $('<div class="xf-list"></div>');
        box.append('<label class="xf-all"><input type="checkbox"' + (!cur ? ' checked' : '') + '> (모두 선택)</label>');
        list.forEach(function (v) {
          box.append($('<label></label>').append($('<input type="checkbox">').prop('checked', !cur || cur.has(v)).val(v)).append(document.createTextNode(' ' + (v === '' ? '(빈 칸)' : v))));
        });
        // 엑셀처럼 값 목록 위에 검색칸: 입력한 글자가 든 값만 목록에 남김
        var q = $('<input type="search" class="xf-q" placeholder="검색">');
        menu.append($('<div class="xf-qwrap"></div>').append(q));
        menu.append(box).append('<div class="xf-foot"><button type="button" class="xf-ok">확인</button><button type="button" class="xf-cancel">취소</button></div>');
        q.on('input', function () {
          var k = this.value.trim();
          box.find('label:not(.xf-all)').each(function () { var hit = !k || $(this).text().indexOf(k) >= 0; $(this).toggle(hit); $(this).find('input').prop('checked', hit); });
          box.find('.xf-all input').prop('checked', true);
        });
        menu.on('change', '.xf-all input', function () { box.find('label:not(.xf-all):visible input').prop('checked', this.checked); });
        menu.on('click', '.xf-sort', function () { dt.order([[ci, $(this).data('d')]]).draw(); close(); });
        menu.on('click', '.xf-cancel', close);
        menu.on('click', '.xf-ok', function () {
          var on = box.find('label:not(.xf-all):visible input:checked').map(function () { return this.value; }).get();
          filters[id][ci] = on.length === list.length ? null : new Set(on);
          btn.toggleClass('on', !!filters[id][ci]); th.toggleClass('xf-on', !!filters[id][ci]);
          dt.draw(); close();
        });
        var r = th[0].getBoundingClientRect();
        menu.css({ top: r.bottom + window.scrollY + 2, left: Math.min(r.left + window.scrollX, window.innerWidth - 260) }).appendTo('body');
      });
    });
  };
})();
