(function () {
  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $$(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function setupNavigation() {
    var button = $('[data-nav-toggle]');
    var nav = $('[data-main-nav]');

    if (!button || !nav) {
      return;
    }

    button.addEventListener('click', function () {
      document.body.classList.toggle('nav-open');
    });

    nav.addEventListener('click', function (event) {
      if (event.target.tagName === 'A') {
        document.body.classList.remove('nav-open');
      }
    });
  }

  function setupHeroSlider() {
    var slider = $('[data-hero-slider]');

    if (!slider) {
      return;
    }

    var slides = $$('[data-hero-slide]', slider);
    var dots = $$('[data-hero-dot]', slider);
    var prev = $('[data-hero-prev]', slider);
    var next = $('[data-hero-next]', slider);
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }

      index = (nextIndex + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === index);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5000);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener('click', function () {
        show(dotIndex);
        start();
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        start();
      });
    }

    slider.addEventListener('mouseenter', stop);
    slider.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function setupFilters() {
    $$('[data-filter-panel]').forEach(function (panel) {
      var input = $('[data-local-search]', panel);
      var typeFilter = $('[data-type-filter]', panel);
      var yearFilter = $('[data-year-filter]', panel);
      var count = $('[data-filter-count]', panel);
      var results = $('[data-filter-results]') || panel.nextElementSibling;
      var cards = results ? $$('[data-card]', results) : [];

      if (!cards.length) {
        return;
      }

      if (panel.getAttribute('data-use-query') === 'true' && input) {
        var params = new URLSearchParams(window.location.search);
        var query = params.get('q');

        if (query) {
          input.value = query;
        }
      }

      function apply() {
        var keyword = normalize(input ? input.value : '');
        var typeValue = normalize(typeFilter ? typeFilter.value : '');
        var yearValue = normalize(yearFilter ? yearFilter.value : '');
        var visible = 0;

        cards.forEach(function (card) {
          var haystack = normalize([
            card.getAttribute('data-title'),
            card.getAttribute('data-tags'),
            card.getAttribute('data-region'),
            card.getAttribute('data-type'),
            card.getAttribute('data-year')
          ].join(' '));
          var cardType = normalize(card.getAttribute('data-type'));
          var cardYear = normalize(card.getAttribute('data-year'));
          var matchesKeyword = !keyword || haystack.indexOf(keyword) !== -1;
          var matchesType = !typeValue || cardType.indexOf(typeValue) !== -1;
          var matchesYear = !yearValue || cardYear === yearValue;
          var shouldShow = matchesKeyword && matchesType && matchesYear;

          card.classList.toggle('is-hidden', !shouldShow);

          if (shouldShow) {
            visible += 1;
          }
        });

        if (count) {
          count.textContent = '显示 ' + visible + ' 部';
        }
      }

      [input, typeFilter, yearFilter].forEach(function (control) {
        if (control) {
          control.addEventListener('input', apply);
          control.addEventListener('change', apply);
        }
      });

      apply();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupNavigation();
    setupHeroSlider();
    setupFilters();
  });
})();
