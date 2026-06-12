(function () {
  "use strict";

  var resultOrder = ["idea", "title", "hook", "hashtag", "blueprint"];
  var currentResults = {};
  var toastTimer = null;

  var form = document.getElementById("generatorForm");
  var topicInput = document.getElementById("topicInput");
  var resultGrid = document.getElementById("resultGrid");
  var historyList = document.getElementById("historyList");
  var favoritesList = document.getElementById("favoritesList");
  var toast = document.getElementById("toast");
  var clearHistoryBtn = document.getElementById("clearHistoryBtn");
  var clearFavoritesBtn = document.getElementById("clearFavoritesBtn");
  var themeToggle = document.getElementById("themeToggle");
  var themeToggleText = document.getElementById("themeToggleText");
  var resetGeneratorBtn = document.getElementById("resetGeneratorBtn");
  var toolbar = document.querySelector(".action-toolbar");

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatDate(value) {
    try {
      return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
      }).format(new Date(value));
    } catch (error) {
      return "";
    }
  }

  function announce(message) {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("is-visible");
    toastTimer = window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 2600);
  }

  function applyTheme(theme) {
    var isDark = theme === "dark";

    document.documentElement.dataset.theme = theme;
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.setAttribute("aria-label", isDark ? "Aktifkan day mode" : "Aktifkan night mode");
    themeToggleText.textContent = isDark ? "Night" : "Day";
  }

  function toggleTheme() {
    var nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";

    applyTheme(nextTheme);
    window.StorageService.setTheme(nextTheme);
    announce(nextTheme === "dark" ? "Night mode aktif." : "Day mode aktif.");
  }

  function getTopic() {
    return window.CreatorGenerator.normalizeTopic(topicInput.value);
  }

  function setActiveButton(type) {
    document.querySelectorAll("[data-generate]").forEach(function (button) {
      button.classList.toggle("is-active", button.dataset.generate === type);
    });
  }

  function resultEntry(type, topic, content) {
    return {
      type: type,
      label: window.CreatorGenerator.labels[type],
      topic: topic,
      content: content
    };
  }

  function renderResults() {
    var keys = resultOrder.filter(function (type) {
      return Boolean(currentResults[type]);
    });

    if (!keys.length) {
      resultGrid.innerHTML = [
        '<div class="empty-state">',
        "<h3>Belum ada hasil</h3>",
        "<p>Output akan muncul di sini.</p>",
        "</div>"
      ].join("");
      return;
    }

    resultGrid.innerHTML = keys.map(function (type) {
      var entry = currentResults[type];
      var isWide = type === "blueprint" || type === "hashtag";

      return [
        '<article class="result-card' + (isWide ? " is-wide" : "") + '" tabindex="0">',
        '<div class="card-header">',
        '<h3 class="card-title"><span class="card-dot" aria-hidden="true"></span>' + escapeHtml(entry.label) + "</h3>",
        '<div class="card-actions">',
        '<button class="btn btn-secondary btn-small" type="button" data-copy-result="' + escapeHtml(type) + '" aria-label="Copy ' + escapeHtml(entry.label) + '">Copy</button>',
        '<button class="btn btn-primary btn-small" type="button" data-save-result="' + escapeHtml(type) + '" aria-label="Save ' + escapeHtml(entry.label) + '">Save</button>',
        "</div>",
        "</div>",
        '<p class="meta">' + escapeHtml(entry.topic) + "</p>",
        '<p class="card-content">' + escapeHtml(entry.content) + "</p>",
        "</article>"
      ].join("");
    }).join("");
  }

  function renderList(target, items, emptyTitle, emptyText, mode) {
    if (!items.length) {
      target.innerHTML = [
        '<div class="empty-state">',
        "<h3>" + escapeHtml(emptyTitle) + "</h3>",
        "<p>" + escapeHtml(emptyText) + "</p>",
        "</div>"
      ].join("");
      return;
    }

    target.innerHTML = items.map(function (item) {
      var actions = mode === "favorites"
        ? '<button class="btn btn-secondary btn-small" type="button" data-copy-item="' + escapeHtml(item.id) + '" data-mode="favorites" aria-label="Copy favorit">Copy</button><button class="btn btn-ghost btn-small" type="button" data-remove-favorite="' + escapeHtml(item.id) + '" aria-label="Hapus favorit">Hapus</button>'
        : '<button class="btn btn-secondary btn-small" type="button" data-copy-item="' + escapeHtml(item.id) + '" data-mode="history" aria-label="Copy riwayat">Copy</button><button class="btn btn-primary btn-small" type="button" data-favorite-item="' + escapeHtml(item.id) + '" aria-label="Simpan riwayat ke favorit">Save</button>';

      return [
        '<article class="list-card" tabindex="0">',
        '<div class="card-header">',
        '<div>',
        '<h3 class="card-title"><span class="card-dot" aria-hidden="true"></span>' + escapeHtml(item.label) + "</h3>",
        '<p class="meta">' + escapeHtml(item.topic) + " - " + escapeHtml(formatDate(item.createdAt)) + "</p>",
        "</div>",
        '<div class="card-actions">' + actions + "</div>",
        "</div>",
        '<p class="card-content">' + escapeHtml(item.content) + "</p>",
        "</article>"
      ].join("");
    }).join("");
  }

  function renderHistory() {
    renderList(
      historyList,
      window.StorageService.getHistory(),
      "Riwayat kosong",
      "Hasil terbaru akan muncul di sini.",
      "history"
    );
  }

  function renderFavorites() {
    renderList(
      favoritesList,
      window.StorageService.getFavorites(),
      "Belum ada favorit",
      "Konten tersimpan akan muncul di sini.",
      "favorites"
    );
  }

  function saveHistoryEntries(entries) {
    entries.forEach(function (entry) {
      window.StorageService.addHistory(entry);
    });
    renderHistory();
  }

  function generate(type) {
    var topic = getTopic();
    var entries = [];

    if (type === "all") {
      var allResults = window.CreatorGenerator.generateAll(topic);
      currentResults = {};
      resultOrder.forEach(function (key) {
        currentResults[key] = resultEntry(key, topic, allResults[key]);
        entries.push(currentResults[key]);
      });
      announce("Generate All selesai.");
    } else {
      var content = window.CreatorGenerator.generate(type, topic);
      currentResults = {};
      currentResults[type] = resultEntry(type, topic, content);
      entries.push(currentResults[type]);
      announce(window.CreatorGenerator.labels[type] + " berhasil dibuat.");
    }

    setActiveButton(type);
    renderResults();
    saveHistoryEntries(entries);
  }

  function resetGenerator() {
    form.reset();
    currentResults = {};
    setActiveButton(null);
    renderResults();
    topicInput.focus();
    announce("Generator direset.");
  }

  function findItem(id, mode) {
    var source = mode === "favorites"
      ? window.StorageService.getFavorites()
      : window.StorageService.getHistory();

    return source.find(function (item) {
      return item.id === id;
    });
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }

    return new Promise(function (resolve, reject) {
      var textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.className = "copy-buffer";
      document.body.appendChild(textarea);
      textarea.select();

      try {
        document.execCommand("copy");
        resolve();
      } catch (error) {
        reject(error);
      } finally {
        document.body.removeChild(textarea);
      }
    });
  }

  function handleCopy(text) {
    copyText(text).then(function () {
      announce("Teks disalin.");
    }).catch(function () {
      announce("Copy gagal. Pilih teks secara manual.");
    });
  }

  function saveFavorite(entry) {
    var result = window.StorageService.addFavorite(entry);
    renderFavorites();
    announce(result.added ? "Tersimpan ke favorit." : "Konten sudah ada di favorit.");
  }

  function handleResultClick(event) {
    var copyType = event.target.closest("[data-copy-result]");
    var saveType = event.target.closest("[data-save-result]");

    if (copyType) {
      var copyEntry = currentResults[copyType.dataset.copyResult];
      if (copyEntry) {
        handleCopy(copyEntry.content);
      }
    }

    if (saveType) {
      var entry = currentResults[saveType.dataset.saveResult];
      if (entry) {
        saveFavorite(entry);
      }
    }
  }

  function handleStoredListClick(event) {
    var copyButton = event.target.closest("[data-copy-item]");
    var favoriteButton = event.target.closest("[data-favorite-item]");
    var removeButton = event.target.closest("[data-remove-favorite]");

    if (copyButton) {
      var copyItem = findItem(copyButton.dataset.copyItem, copyButton.dataset.mode);
      if (copyItem) {
        handleCopy(copyItem.content);
      }
    }

    if (favoriteButton) {
      var favoriteItem = findItem(favoriteButton.dataset.favoriteItem, "history");
      if (favoriteItem) {
        saveFavorite(favoriteItem);
      }
    }

    if (removeButton) {
      window.StorageService.removeFavorite(removeButton.dataset.removeFavorite);
      renderFavorites();
      announce("Favorit dihapus.");
    }
  }

  function handleToolbarKeyboard(event) {
    var buttons = Array.prototype.slice.call(toolbar.querySelectorAll("button"));
    var index = buttons.indexOf(document.activeElement);
    var nextIndex = index;

    if (index === -1) {
      return;
    }

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % buttons.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (index - 1 + buttons.length) % buttons.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = buttons.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    buttons[nextIndex].focus();
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    generate("all");
  });

  toolbar.addEventListener("click", function (event) {
    var button = event.target.closest("[data-generate]");
    if (!button || button.type === "submit") {
      return;
    }

    generate(button.dataset.generate);
  });

  toolbar.addEventListener("keydown", handleToolbarKeyboard);

  topicInput.addEventListener("keydown", function (event) {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      generate("all");
    }
  });

  resultGrid.addEventListener("click", handleResultClick);
  historyList.addEventListener("click", handleStoredListClick);
  favoritesList.addEventListener("click", handleStoredListClick);

  clearHistoryBtn.addEventListener("click", function () {
    window.StorageService.clearHistory();
    renderHistory();
    announce("Riwayat dibersihkan.");
  });

  clearFavoritesBtn.addEventListener("click", function () {
    window.StorageService.clearFavorites();
    renderFavorites();
    announce("Favorit dibersihkan.");
  });

  resetGeneratorBtn.addEventListener("click", resetGenerator);
  themeToggle.addEventListener("click", toggleTheme);

  applyTheme(window.StorageService.getTheme());
  renderResults();
  renderHistory();
  renderFavorites();
})();
