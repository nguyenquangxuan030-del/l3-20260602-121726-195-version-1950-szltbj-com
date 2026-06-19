(function () {
    var toggle = document.querySelector(".nav-toggle");
    var links = document.querySelector(".nav-links");

    if (toggle && links) {
        toggle.addEventListener("click", function () {
            links.classList.toggle("is-open");
        });
    }

    var carousel = document.querySelector("[data-hero-carousel]");

    if (carousel) {
        var slides = Array.prototype.slice.call(document.querySelectorAll("[data-hero-slide]"));
        var dots = Array.prototype.slice.call(document.querySelectorAll("[data-hero-dot]"));
        var current = 0;

        function showSlide(index) {
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle("is-active", slideIndex === current);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle("is-active", dotIndex === current);
            });
        }

        dots.forEach(function (dot) {
            dot.addEventListener("click", function () {
                showSlide(Number(dot.getAttribute("data-hero-dot")) || 0);
            });
        });

        if (slides.length > 1) {
            window.setInterval(function () {
                showSlide(current + 1);
            }, 5200);
        }
    }

    function applyFilters(targetId) {
        var grid = document.getElementById(targetId);

        if (!grid) {
            return;
        }

        var cards = Array.prototype.slice.call(grid.querySelectorAll(".movie-card"));
        var searchInput = document.querySelector('.site-search[data-target="' + targetId + '"]');
        var filters = Array.prototype.slice.call(document.querySelectorAll('.site-filter[data-target="' + targetId + '"]'));
        var query = searchInput ? searchInput.value.trim().toLowerCase() : "";

        cards.forEach(function (card) {
            var haystack = [
                card.getAttribute("data-title") || "",
                card.getAttribute("data-region") || "",
                card.getAttribute("data-year") || "",
                card.getAttribute("data-type") || "",
                card.getAttribute("data-category") || "",
                card.textContent || ""
            ].join(" ").toLowerCase();
            var visible = !query || haystack.indexOf(query) !== -1;

            filters.forEach(function (filter) {
                var field = filter.getAttribute("data-filter-field");
                var value = filter.value;

                if (value && card.getAttribute("data-" + field) !== value) {
                    visible = false;
                }
            });

            card.classList.toggle("no-match", !visible);
        });
    }

    Array.prototype.slice.call(document.querySelectorAll(".site-search")).forEach(function (input) {
        input.addEventListener("input", function () {
            applyFilters(input.getAttribute("data-target"));
        });
    });

    Array.prototype.slice.call(document.querySelectorAll(".site-filter")).forEach(function (select) {
        select.addEventListener("change", function () {
            applyFilters(select.getAttribute("data-target"));
        });
    });

    Array.prototype.slice.call(document.querySelectorAll(".movie-player[data-stream]")).forEach(function (player) {
        var video = player.querySelector("video");
        var button = player.querySelector(".player-start");
        var stream = player.getAttribute("data-stream");
        var ready = false;
        var hlsInstance = null;

        function loadStream() {
            if (!video || !stream || ready) {
                return;
            }

            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = stream;
            } else if (window.Hls && window.Hls.isSupported()) {
                hlsInstance = new window.Hls();
                hlsInstance.loadSource(stream);
                hlsInstance.attachMedia(video);
            } else {
                video.src = stream;
            }

            ready = true;
        }

        function startPlay() {
            loadStream();

            if (button) {
                button.classList.add("is-hidden");
            }

            if (video) {
                var attempt = video.play();

                if (attempt && typeof attempt.catch === "function") {
                    attempt.catch(function () {});
                }
            }
        }

        if (button) {
            button.addEventListener("click", startPlay);
        }

        if (video) {
            video.addEventListener("play", function () {
                if (button) {
                    button.classList.add("is-hidden");
                }
            });
            video.addEventListener("click", function () {
                if (!ready) {
                    startPlay();
                }
            });
        }

        window.addEventListener("pagehide", function () {
            if (hlsInstance) {
                hlsInstance.destroy();
                hlsInstance = null;
            }
        });
    });
})();
