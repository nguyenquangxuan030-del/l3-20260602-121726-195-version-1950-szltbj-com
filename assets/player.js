(function () {
  function initializePlayer(shell) {
    var video = shell.querySelector('video');
    var button = shell.querySelector('[data-player-start]');
    var status = shell.querySelector('[data-player-status]');
    var source = video ? video.getAttribute('data-hls') : '';
    var hlsInstance = null;
    var prepared = false;

    function setStatus(text) {
      if (status) {
        status.textContent = text;
      }
    }

    function prepare() {
      if (!video || !source || prepared) {
        return;
      }

      prepared = true;
      setStatus('正在加载播放源...');

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
        shell.classList.add('is-ready');
        setStatus('播放源已就绪。');
        return;
      }

      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hlsInstance.loadSource(source);
        hlsInstance.attachMedia(video);
        hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
          shell.classList.add('is-ready');
          setStatus('播放源已就绪。');
        });
        hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
          if (data && data.fatal) {
            setStatus('播放源加载失败，请稍后重试。');
          }
        });
        return;
      }

      video.src = source;
      setStatus('当前浏览器将尝试直接播放。');
    }

    function play() {
      prepare();

      if (!video) {
        return;
      }

      var playPromise = video.play();

      if (playPromise && typeof playPromise.then === 'function') {
        playPromise.then(function () {
          shell.classList.add('is-playing');
          setStatus('正在播放。');
        }).catch(function () {
          shell.classList.add('is-ready');
          setStatus('请在播放器控制栏中手动播放。');
        });
      }
    }

    if (button) {
      button.addEventListener('click', play);
    }

    if (video) {
      video.addEventListener('play', function () {
        shell.classList.add('is-playing');
      });
      video.addEventListener('pause', function () {
        shell.classList.remove('is-playing');
      });
      video.addEventListener('loadedmetadata', function () {
        setStatus('播放源已加载。');
      });
    }

    window.addEventListener('beforeunload', function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    Array.prototype.slice.call(document.querySelectorAll('[data-player]')).forEach(initializePlayer);
  });
})();
