(function () {
  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $$(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function initMobileNav() {
    var button = $('[data-menu-button]');
    var nav = $('[data-mobile-nav]');
    if (!button || !nav) {
      return;
    }

    button.addEventListener('click', function () {
      nav.classList.toggle('is-open');
    });
  }

  function initHero() {
    var hero = $('[data-hero]');
    if (!hero) {
      return;
    }

    var slides = $$('[data-hero-slide]', hero);
    var dots = $$('[data-hero-dot]', hero);
    var current = 0;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === current);
      });
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        show(i);
      });
    });

    if (slides.length > 1) {
      window.setInterval(function () {
        show(current + 1);
      }, 5600);
    }
  }

  function initCardFilters() {
    $$('[data-filter-toolbar]').forEach(function (toolbar) {
      var input = $('[data-card-filter]', toolbar);
      var select = $('[data-sort-select]', toolbar);
      var count = $('[data-filter-count]', toolbar);
      var grid = toolbar.parentElement.querySelector('[data-card-grid]');

      if (!grid) {
        return;
      }

      var cards = $$('.movie-card, .rank-item', grid);

      function compareCards(a, b, mode) {
        var ay = Number(a.getAttribute('data-year') || 0);
        var by = Number(b.getAttribute('data-year') || 0);
        var ah = Number(a.getAttribute('data-hot') || 0);
        var bh = Number(b.getAttribute('data-hot') || 0);
        var at = (a.getAttribute('data-search') || '').toLowerCase();
        var bt = (b.getAttribute('data-search') || '').toLowerCase();

        if (mode === 'year-asc') {
          return ay - by;
        }
        if (mode === 'hot-desc') {
          return bh - ah;
        }
        if (mode === 'title-asc') {
          return at.localeCompare(bt, 'zh-Hans-CN');
        }
        return by - ay;
      }

      function apply() {
        var keyword = input ? input.value.trim().toLowerCase() : '';
        var visible = 0;
        var sorted = cards.slice().sort(function (a, b) {
          return compareCards(a, b, select ? select.value : 'year-desc');
        });

        sorted.forEach(function (card) {
          var haystack = (card.getAttribute('data-search') || '').toLowerCase();
          var matched = !keyword || haystack.indexOf(keyword) !== -1;
          card.classList.toggle('is-hidden', !matched);
          if (matched) {
            visible += 1;
          }
          grid.appendChild(card);
        });

        if (count) {
          count.textContent = '显示 ' + visible + ' 条';
        }
      }

      if (input) {
        input.addEventListener('input', apply);
      }
      if (select) {
        select.addEventListener('change', apply);
      }
      apply();
    });
  }

  function initPlayers() {
    $$('[data-player]').forEach(function (player) {
      var video = $('video', player);
      var button = $('[data-player-start]', player);
      var source = player.getAttribute('data-src');
      var hlsInstance = null;

      if (!video || !button || !source) {
        return;
      }

      function attachSource() {
        if (video.getAttribute('data-source-attached') === 'true') {
          return;
        }

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = source;
        } else if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hlsInstance.loadSource(source);
          hlsInstance.attachMedia(video);
        } else {
          video.src = source;
        }

        video.setAttribute('data-source-attached', 'true');
      }

      button.addEventListener('click', function () {
        attachSource();
        player.classList.add('is-playing');
        video.setAttribute('controls', 'controls');
        var playPromise = video.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(function () {
            video.setAttribute('controls', 'controls');
          });
        }
      });

      window.addEventListener('beforeunload', function () {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      });
    });
  }

  function initSearchPage() {
    var input = $('#site-search-input');
    var button = $('#site-search-button');
    var results = $('#site-search-results');
    var data = window.MOVIE_SEARCH || [];

    if (!input || !button || !results) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var initial = params.get('q') || '';
    input.value = initial;

    function render(items, keyword) {
      if (!keyword) {
        results.innerHTML = '<p class="search-hint">请输入关键词开始搜索。</p>';
        return;
      }

      if (!items.length) {
        results.innerHTML = '<p class="search-hint">没有找到匹配影片，请尝试更换关键词。</p>';
        return;
      }

      results.innerHTML = items.slice(0, 120).map(function (item) {
        return [
          '<article class="search-result-item">',
          '  <a href="' + item.link + '"><img src="' + item.cover + '" alt="' + escapeHtml(item.title) + '"></a>',
          '  <div>',
          '    <p class="movie-badge">' + escapeHtml(item.category) + ' · ' + escapeHtml(item.year) + '</p>',
          '    <h2><a href="' + item.link + '">' + escapeHtml(item.title) + '</a></h2>',
          '    <p>' + escapeHtml(item.desc) + '</p>',
          '  </div>',
          '</article>'
        ].join('');
      }).join('');
    }

    function escapeHtml(text) {
      return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function search() {
      var keyword = input.value.trim().toLowerCase();
      var matched = data.filter(function (item) {
        return item.search.indexOf(keyword) !== -1;
      });
      render(matched, keyword);
    }

    button.addEventListener('click', search);
    input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        search();
      }
    });

    search();
  }

  document.addEventListener('DOMContentLoaded', function () {
    initMobileNav();
    initHero();
    initCardFilters();
    initPlayers();
    initSearchPage();
  });
})();
