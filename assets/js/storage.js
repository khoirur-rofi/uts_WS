(function () {
  "use strict";

  var HISTORY_KEY = "creatorAssistant.history";
  var FAVORITES_KEY = "creatorAssistant.favorites";
  var THEME_KEY = "creatorAssistant.theme";
  var HISTORY_LIMIT = 20;
  var FAVORITES_LIMIT = 50;
  var VALID_THEMES = ["light", "dark"];

  function readList(key) {
    try {
      var raw = localStorage.getItem(key);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function writeList(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  }

  function createEntry(entry) {
    return {
      id: String(Date.now()) + "-" + Math.random().toString(16).slice(2),
      type: entry.type,
      label: entry.label,
      topic: entry.topic,
      content: entry.content,
      createdAt: new Date().toISOString()
    };
  }

  function trimList(list, limit) {
    return list.slice(0, limit);
  }

  function isSameContent(a, b) {
    return a.type === b.type && a.topic === b.topic && a.content === b.content;
  }

  function isValidTheme(theme) {
    return VALID_THEMES.indexOf(theme) !== -1;
  }

  window.StorageService = {
    limits: {
      history: HISTORY_LIMIT,
      favorites: FAVORITES_LIMIT
    },

    getHistory: function () {
      return trimList(readList(HISTORY_KEY), HISTORY_LIMIT);
    },

    addHistory: function (entry) {
      var next = [createEntry(entry)].concat(readList(HISTORY_KEY));
      next = trimList(next, HISTORY_LIMIT);
      writeList(HISTORY_KEY, next);
      return next;
    },

    clearHistory: function () {
      return writeList(HISTORY_KEY, []);
    },

    getFavorites: function () {
      return trimList(readList(FAVORITES_KEY), FAVORITES_LIMIT);
    },

    addFavorite: function (entry) {
      var favorites = readList(FAVORITES_KEY);
      var exists = favorites.some(function (item) {
        return isSameContent(item, entry);
      });

      if (exists) {
        return {
          added: false,
          items: trimList(favorites, FAVORITES_LIMIT)
        };
      }

      var next = [createEntry(entry)].concat(favorites);
      next = trimList(next, FAVORITES_LIMIT);
      writeList(FAVORITES_KEY, next);

      return {
        added: true,
        items: next
      };
    },

    removeFavorite: function (id) {
      var next = readList(FAVORITES_KEY).filter(function (item) {
        return item.id !== id;
      });
      writeList(FAVORITES_KEY, next);
      return next;
    },

    clearFavorites: function () {
      return writeList(FAVORITES_KEY, []);
    },

    getTheme: function () {
      try {
        var theme = localStorage.getItem(THEME_KEY);
        return isValidTheme(theme) ? theme : "light";
      } catch (error) {
        return "light";
      }
    },

    setTheme: function (theme) {
      if (!isValidTheme(theme)) {
        return false;
      }

      try {
        localStorage.setItem(THEME_KEY, theme);
        return true;
      } catch (error) {
        return false;
      }
    }
  };
})();
