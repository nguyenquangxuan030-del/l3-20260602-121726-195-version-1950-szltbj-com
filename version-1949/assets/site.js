(function () {
    function qs(selector, root) {
        return (root || document).querySelector(selector);
    }

    function qsa(selector, root) {
        return Array.from((root || document).querySelectorAll(selector));
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function normalize(value) {
        return String(value || "").toLowerCase().trim();
    }

    function setupMobileMenu() {
        var toggle = qs("[data-mobile-toggle]");
        var menu = qs("[data-mobile-menu]");
        if (!toggle || !menu) {
            return;
        }
        toggle.addEventListener("click", function () {
            var isOpen = menu.classList.toggle("is-open");
            toggle.setAttribute("aria-expanded", String(isOpen));
            toggle.textContent = isOpen ? "×" : "☰";
        });
    }

    function setupSearchForms() {
        qsa(".search-form").forEach(function (form) {
            form.addEventListener("submit", function (event) {
                var input = qs("input[name='q']", form);
                if (!input || !input.value.trim()) {
                    event.preventDefault();
                    input && input.focus();
                }
            });
        });
    }

    function setupHero() {
        var hero = qs("[data-hero]");
        if (!hero) {
            return;
        }
        var slides = qsa("[data-hero-slide]", hero);
        var dots = qsa("[data-hero-dot]", hero);
        var prev = qs("[data-hero-prev]", hero);
        var next = qs("[data-hero-next]", hero);
        if (!slides.length) {
            return;
        }
        var current = 0;
        var timer = null;

        function show(index) {
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle("is-active", slideIndex === current);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle("is-active", dotIndex === current);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(current + 1);
            }, 5000);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        prev && prev.addEventListener("click", function () {
            show(current - 1);
            start();
        });
        next && next.addEventListener("click", function () {
            show(current + 1);
            start();
        });
        dots.forEach(function (dot) {
            dot.addEventListener("click", function () {
                show(Number(dot.getAttribute("data-hero-dot")) || 0);
                start();
            });
        });
        hero.addEventListener("mouseenter", stop);
        hero.addEventListener("mouseleave", start);
        show(0);
        start();
    }

    function setupFilters() {
        var panel = qs("[data-filter-panel]");
        if (!panel) {
            return;
        }
        var input = qs("[data-filter-keyword]", panel);
        var selects = qsa("[data-filter-select]", panel);
        var cards = qsa("[data-filter-card]");
        var empty = qs("[data-filter-empty]");

        function apply() {
            var keyword = normalize(input ? input.value : "");
            var values = {};
            selects.forEach(function (select) {
                values[select.getAttribute("data-filter-select")] = normalize(select.value);
            });
            var visible = 0;
            cards.forEach(function (card) {
                var search = normalize(card.getAttribute("data-search"));
                var matchKeyword = !keyword || search.indexOf(keyword) !== -1;
                var matchSelects = Object.keys(values).every(function (key) {
                    return !values[key] || normalize(card.getAttribute("data-" + key)) === values[key];
                });
                var shouldShow = matchKeyword && matchSelects;
                card.hidden = !shouldShow;
                if (shouldShow) {
                    visible += 1;
                }
            });
            if (empty) {
                empty.hidden = visible !== 0;
            }
        }

        input && input.addEventListener("input", apply);
        selects.forEach(function (select) {
            select.addEventListener("change", apply);
        });
    }

    function setupSearchPage() {
        var results = qs("[data-search-results]");
        var summary = qs("[data-search-summary]");
        var input = qs("[data-search-page-input]");
        if (!results || !summary || !window.MOVIE_INDEX) {
            return;
        }
        var params = new URLSearchParams(window.location.search);
        var query = params.get("q") || "";
        if (input) {
            input.value = query;
        }
        renderSearch(query);

        function renderSearch(value) {
            var keyword = normalize(value);
            if (!keyword) {
                results.innerHTML = "";
                summary.textContent = "请输入关键词开始搜索。";
                return;
            }
            var found = window.MOVIE_INDEX.filter(function (item) {
                return normalize([
                    item.title,
                    item.region,
                    item.type,
                    item.year,
                    item.genre,
                    item.tags,
                    item.oneLine
                ].join(" ")).indexOf(keyword) !== -1;
            });
            summary.textContent = "搜索“" + value + "”找到 " + found.length + " 个结果";
            results.innerHTML = found.slice(0, 240).map(renderSearchCard).join("");
            if (found.length > 240) {
                summary.textContent += "，已展示前 240 个匹配项";
            }
        }

        function renderSearchCard(item) {
            return [
                '<article class="movie-card">',
                '    <a class="poster-frame" href="./' + escapeHtml(item.file) + '">',
                '        <img src="' + escapeHtml(item.cover) + '" alt="' + escapeHtml(item.title) + '" loading="lazy">',
                '        <span class="score-badge">' + escapeHtml(item.score) + '</span>',
                '        <span class="type-badge">' + escapeHtml(item.type) + '</span>',
                '    </a>',
                '    <div class="movie-card-body">',
                '        <h3><a href="./' + escapeHtml(item.file) + '">' + escapeHtml(item.title) + '</a></h3>',
                '        <p class="card-meta">' + escapeHtml(item.region) + ' · ' + escapeHtml(item.year) + ' · ' + escapeHtml(item.genre) + '</p>',
                '        <p class="card-desc">' + escapeHtml(item.oneLine) + '</p>',
                '    </div>',
                '</article>'
            ].join("\n");
        }
    }

    function setupPlayers() {
        qsa("[data-player]").forEach(function (player) {
            var video = qs("video", player);
            var button = qs("[data-player-button]", player);
            var status = qs("[data-player-status]", player);
            var source = player.getAttribute("data-video-source");
            var hls = null;
            var ready = false;

            if (!video || !button || !source) {
                return;
            }

            function setStatus(message) {
                if (status) {
                    status.textContent = message || "";
                }
            }

            function attachSource() {
                if (ready) {
                    return Promise.resolve();
                }
                ready = true;
                setStatus("正在连接播放源...");
                if (window.Hls && window.Hls.isSupported()) {
                    hls = new window.Hls({
                        enableWorker: true,
                        lowLatencyMode: true
                    });
                    hls.loadSource(source);
                    hls.attachMedia(video);
                    hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
                        setStatus("");
                    });
                    hls.on(window.Hls.Events.ERROR, function (event, data) {
                        if (data && data.fatal) {
                            setStatus("播放源连接失败，请刷新后重试");
                        }
                    });
                    return Promise.resolve();
                }
                if (video.canPlayType("application/vnd.apple.mpegurl")) {
                    video.src = source;
                    return Promise.resolve();
                }
                video.src = source;
                return Promise.resolve();
            }

            function play() {
                attachSource().then(function () {
                    var playPromise = video.play();
                    if (playPromise && typeof playPromise.then === "function") {
                        playPromise.then(function () {
                            button.classList.add("is-hidden");
                            setStatus("");
                        }).catch(function () {
                            setStatus("请再次点击播放按钮开始播放");
                        });
                    } else {
                        button.classList.add("is-hidden");
                        setStatus("");
                    }
                });
            }

            button.addEventListener("click", play);
            video.addEventListener("play", function () {
                button.classList.add("is-hidden");
            });
            video.addEventListener("pause", function () {
                if (!video.ended) {
                    button.classList.remove("is-hidden");
                }
            });
            video.addEventListener("ended", function () {
                button.classList.remove("is-hidden");
            });
            window.addEventListener("beforeunload", function () {
                if (hls) {
                    hls.destroy();
                }
            });
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        setupMobileMenu();
        setupSearchForms();
        setupHero();
        setupFilters();
        setupSearchPage();
        setupPlayers();
    });
}());
