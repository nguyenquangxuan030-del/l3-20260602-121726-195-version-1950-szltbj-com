(function () {
  function qs(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function qsa(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function initHeader() {
    var searchButton = qs('[data-search-toggle]');
    var searchPanel = qs('[data-header-search]');
    var mobileButton = qs('[data-mobile-toggle]');
    var mobileNav = qs('[data-mobile-nav]');

    if (searchButton && searchPanel) {
      searchButton.addEventListener('click', function () {
        searchPanel.classList.toggle('is-open');
        var input = qs('input', searchPanel);
        if (searchPanel.classList.contains('is-open') && input) {
          input.focus();
        }
      });
    }

    if (mobileButton && mobileNav) {
      mobileButton.addEventListener('click', function () {
        mobileNav.classList.toggle('is-open');
      });
    }
  }

  function initHero() {
    var hero = qs('[data-hero]');
    if (!hero) {
      return;
    }

    var slides = qsa('[data-hero-slide]', hero);
    var dots = qsa('[data-hero-dot]', hero);
    if (slides.length < 2) {
      return;
    }

    var index = 0;
    var timer = null;

    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        show(i);
        start();
      });
    });

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function initFilters() {
    qsa('[data-filter-panel]').forEach(function (panel) {
      var cards = qsa('[data-movie-card]');
      var empty = qs('[data-empty-state]');
      var inputs = qsa('[data-filter]', panel);

      function apply() {
        var query = normalize(qs('[data-filter="query"]', panel) && qs('[data-filter="query"]', panel).value);
        var year = qs('[data-filter="year"]', panel) ? qs('[data-filter="year"]', panel).value : '';
        var region = qs('[data-filter="region"]', panel) ? qs('[data-filter="region"]', panel).value : '';
        var type = qs('[data-filter="type"]', panel) ? qs('[data-filter="type"]', panel).value : '';
        var visible = 0;

        cards.forEach(function (card) {
          var haystack = normalize(card.getAttribute('data-title') + ' ' + card.getAttribute('data-tags') + ' ' + card.getAttribute('data-summary'));
          var matched = true;

          if (query && haystack.indexOf(query) === -1) {
            matched = false;
          }
          if (year && card.getAttribute('data-year') !== year) {
            matched = false;
          }
          if (region && card.getAttribute('data-region') !== region) {
            matched = false;
          }
          if (type && card.getAttribute('data-type') !== type) {
            matched = false;
          }

          card.style.display = matched ? '' : 'none';
          if (matched) {
            visible += 1;
          }
        });

        if (empty) {
          empty.style.display = visible === 0 ? 'block' : 'none';
        }
      }

      inputs.forEach(function (input) {
        input.addEventListener('input', apply);
        input.addEventListener('change', apply);
      });
      apply();
    });
  }

  function initPlayer(streamUrl) {
    var video = qs('[data-player-video]');
    var cover = qs('[data-player-cover]');
    var button = qs('[data-player-button]');
    var attached = false;
    var player = null;

    if (!video || !streamUrl) {
      return;
    }

    function attach() {
      if (attached) {
        return;
      }
      attached = true;

      if (window.Hls && window.Hls.isSupported()) {
        player = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });
        player.loadSource(streamUrl);
        player.attachMedia(video);
        player.on(window.Hls.Events.ERROR, function (event, data) {
          if (!data || !data.fatal) {
            return;
          }
          if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
            player.startLoad();
          } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
            player.recoverMediaError();
          } else {
            player.destroy();
          }
        });
      } else {
        video.src = streamUrl;
      }
    }

    function play() {
      attach();
      if (cover) {
        cover.classList.add('is-hidden');
      }
      video.setAttribute('controls', 'controls');
      var promise = video.play();
      if (promise && typeof promise.catch === 'function') {
        promise.catch(function () {});
      }
    }

    if (cover) {
      cover.addEventListener('click', play);
      cover.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          play();
        }
      });
    }

    if (button) {
      button.addEventListener('click', function (event) {
        event.stopPropagation();
        play();
      });
    }

    video.addEventListener('click', function () {
      if (video.paused) {
        play();
      }
    });

    window.addEventListener('beforeunload', function () {
      if (player && typeof player.destroy === 'function') {
        player.destroy();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initHeader();
    initHero();
    initFilters();
  });

  window.MovieApp = {
    initPlayer: initPlayer
  };
})();
