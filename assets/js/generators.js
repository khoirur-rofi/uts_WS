(function () {
  "use strict";

  var typeLabels = {
    idea: "Ide",
    title: "Judul",
    hook: "Hook",
    hashtag: "Hashtag",
    blueprint: "Blueprint"
  };

  var categoryKeywords = {
    AI: ["ai", "artificial intelligence", "machine learning", "otomasi"],
    ChatGPT: ["chatgpt", "gpt", "prompt", "openai"],
    Teknologi: ["teknologi", "tech", "gadget", "digital"],
    Programming: ["programming", "coding", "developer", "python", "javascript", "java"],
    Crypto: ["crypto", "kripto", "bitcoin", "ethereum", "web3"],
    Investasi: ["investasi", "saham", "reksadana", "trading", "keuangan"],
    Bisnis: ["bisnis", "usaha", "umkm", "jualan", "brand"],
    Marketing: ["marketing", "ads", "iklan", "sales", "branding"],
    Produktivitas: ["produktif", "produktivitas", "habit", "workflow", "time management"],
    Kuliah: ["kuliah", "mahasiswa", "skripsi", "kampus"],
    Pendidikan: ["pendidikan", "belajar", "guru", "sekolah", "edukasi"],
    Gaming: ["gaming", "game", "esport", "streaming"],
    Android: ["android", "mobile", "apk", "smartphone"],
    "Web Development": ["web", "website", "frontend", "backend", "html", "css"],
    Freelance: ["freelance", "freelancer", "klien", "remote"],
    "Content Creator": ["content creator", "konten", "creator", "kreator"],
    YouTube: ["youtube", "youtuber", "video panjang"],
    TikTok: ["tiktok", "short video", "fyp"],
    Instagram: ["instagram", "reels", "ig", "carousel"],
    Startup: ["startup", "founder", "pitch", "produk"]
  };

  var VARIANT_COUNT = 3;
  var HASHTAG_VARIANT_COUNT = 4;
  var HASHTAGS_PER_VARIANT = 15;
  var RECENT_OUTPUT_LIMIT = 80;
  var usedTemplates = {};
  var recentOutputs = {};
  var hashtagStopWords = [
    "a",
    "an",
    "and",
    "atau",
    "cara",
    "dan",
    "dari",
    "dengan",
    "di",
    "for",
    "in",
    "ke",
    "of",
    "on",
    "the",
    "to",
    "untuk",
    "yang"
  ];

  var relatedCategoryMap = {
    AI: ["ChatGPT", "Teknologi", "Produktivitas", "Content Creator"],
    ChatGPT: ["AI", "Produktivitas", "Marketing", "Content Creator"],
    Teknologi: ["AI", "Programming", "Android", "Web Development"],
    Programming: ["Web Development", "Teknologi", "Freelance", "Startup"],
    Crypto: ["Investasi", "Teknologi", "Bisnis", "Startup"],
    Investasi: ["Bisnis", "Produktivitas", "Pendidikan", "Content Creator"],
    Bisnis: ["Marketing", "Startup", "Freelance", "Content Creator"],
    Marketing: ["Bisnis", "Content Creator", "Instagram", "TikTok"],
    Produktivitas: ["Pendidikan", "Freelance", "AI", "Content Creator"],
    Kuliah: ["Pendidikan", "Produktivitas", "Freelance", "Content Creator"],
    Pendidikan: ["Kuliah", "Produktivitas", "Content Creator", "YouTube"],
    Gaming: ["YouTube", "TikTok", "Content Creator", "Teknologi"],
    Android: ["Teknologi", "Programming", "Web Development", "Content Creator"],
    "Web Development": ["Programming", "Teknologi", "Freelance", "Startup"],
    Freelance: ["Bisnis", "Marketing", "Produktivitas", "Content Creator"],
    "Content Creator": ["Marketing", "TikTok", "Instagram", "YouTube"],
    YouTube: ["Content Creator", "Marketing", "Gaming", "Pendidikan"],
    TikTok: ["Content Creator", "Marketing", "Instagram", "Gaming"],
    Instagram: ["Content Creator", "Marketing", "TikTok", "Bisnis"],
    Startup: ["Bisnis", "Marketing", "Teknologi", "Freelance"]
  };

  function normalizeTopic(topic) {
    var cleaned = String(topic || "").replace(/\s+/g, " ").trim();
    return cleaned || "Topik Kamu";
  }

  function replaceTopic(template, topic) {
    return String(template).replace(/\{topic\}/g, topic);
  }

  function randomItem(items) {
    if (!items.length) {
      return "";
    }

    return items[Math.floor(Math.random() * items.length)];
  }

  function shuffle(items) {
    return items.slice().sort(function () {
      return Math.random() - 0.5;
    });
  }

  function unique(items) {
    return items.filter(function (item, index, source) {
      return item && source.indexOf(item) === index;
    });
  }

  function pickMany(items, count) {
    return shuffle(items).slice(0, count);
  }

  function flatten(items) {
    return items.reduce(function (result, item) {
      return result.concat(item);
    }, []);
  }

  function memoryKey(type, topic) {
    return type + "::" + normalizeTopic(topic).toLowerCase();
  }

  function getMemory(store, type, topic) {
    var key = memoryKey(type, topic);

    if (!store[key]) {
      store[key] = [];
    }

    return store[key];
  }

  function rememberOutput(type, topic, output) {
    var list = getMemory(recentOutputs, type, topic);

    list.unshift(output);

    if (list.length > RECENT_OUTPUT_LIMIT) {
      list.length = RECENT_OUTPUT_LIMIT;
    }
  }

  function wasRecentlyOutput(type, topic, output) {
    return getMemory(recentOutputs, type, topic).indexOf(output) !== -1;
  }

  function pickFreshTemplate(type, topic, items) {
    var used = getMemory(usedTemplates, type, topic);
    var available = items.filter(function (item) {
      return used.indexOf(item) === -1;
    });

    if (!available.length) {
      used.length = 0;
      available = items.slice();
    }

    var selected = randomItem(available);
    used.push(selected);
    return selected;
  }

  function pickManyFreshTemplates(type, topic, items, count) {
    var selected = [];

    for (var i = 0; i < count; i += 1) {
      selected.push(pickFreshTemplate(type, topic, items));
    }

    return selected;
  }

  function freshOutput(type, topic, buildOutput) {
    var cleanTopic = normalizeTopic(topic);
    var output = "";

    for (var attempt = 0; attempt < 16; attempt += 1) {
      output = buildOutput(cleanTopic);

      if (!wasRecentlyOutput(type, cleanTopic, output)) {
        break;
      }
    }

    rememberOutput(type, cleanTopic, output);
    return output;
  }

  function formatVariations(items) {
    return items.map(function (item, index) {
      return String(index + 1) + ". " + item;
    }).join("\n");
  }

  function detectCategories(topic) {
    var normalized = topic.toLowerCase();
    var categories = Object.keys(categoryKeywords);
    var scored = [];

    for (var i = 0; i < categories.length; i += 1) {
      var category = categories[i];
      var keywords = categoryKeywords[category];
      var score = keywords.filter(function (keyword) {
        return normalized.indexOf(keyword) !== -1;
      }).length;

      if (score > 0) {
        scored.push({
          category: category,
          score: score
        });
      }
    }

    if (!scored.length) {
      return ["Content Creator"];
    }

    return scored.sort(function (a, b) {
      return b.score - a.score;
    }).map(function (item) {
      return item.category;
    });
  }

  function detectCategory(topic) {
    return detectCategories(topic)[0];
  }

  function relevantCategories(topic) {
    var detected = detectCategories(topic);
    var related = flatten(detected.map(function (category) {
      return relatedCategoryMap[category] || [];
    }));

    return unique(detected.concat(related).concat(["Content Creator"]));
  }

  function hashtagStem(value) {
    return String(value || "")
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .filter(Boolean)
      .filter(function (word) {
        return hashtagStopWords.indexOf(word.toLowerCase()) === -1;
      })
      .map(function (word) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join("");
  }

  function topicToHashtag(topic) {
    var cleaned = hashtagStem(topic);

    return cleaned ? "#" + cleaned : "#KontenKreator";
  }

  function topicHashtags(topic) {
    var stem = hashtagStem(topic);
    var wordTags = String(topic || "")
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .filter(function (word) {
        return word.length > 2 && hashtagStopWords.indexOf(word.toLowerCase()) === -1;
      })
      .map(function (word) {
        return "#" + hashtagStem(word);
      });

    if (!stem) {
      return ["#KontenKreator"];
    }

    return unique([
      "#" + stem,
      "#" + stem + "Tips",
      "#Belajar" + stem,
      "#Tutorial" + stem,
      "#Panduan" + stem,
      "#" + stem + "Indonesia",
      "#" + stem + "UntukPemula",
      "#Tips" + stem,
      "#Konten" + stem,
      "#" + stem + "Harian"
    ].concat(wordTags));
  }

  function hashtagSignature(tags) {
    return tags.slice().sort().join(" ").toLowerCase();
  }

  function platformHashtags() {
    return []
      .concat(window.CreatorData.hashtags.TikTok || [])
      .concat(window.CreatorData.hashtags.Instagram || [])
      .concat(window.CreatorData.hashtags.YouTube || []);
  }

  function categoryHashtagPool(categories) {
    return unique(flatten(categories.map(function (category) {
      return window.CreatorData.hashtags[category] || [];
    })));
  }

  function fillHashtagPack(pack, cleanTopic, pool) {
    var attempts = 0;

    while (pack.length < HASHTAGS_PER_VARIANT && attempts < pool.length + HASHTAGS_PER_VARIANT) {
      var tag = pickFreshTemplate("hashtag-fill", cleanTopic, pool);

      if (tag && pack.indexOf(tag) === -1) {
        pack.push(tag);
      }

      attempts += 1;
    }

    return pack;
  }

  function buildHashtagPack(cleanTopic) {
    var categories = relevantCategories(cleanTopic);
    var primary = categories[0];
    var secondary = categories.slice(1);
    var topicTags = topicHashtags(cleanTopic);
    var primaryTags = window.CreatorData.hashtags[primary] || [];
    var secondaryTags = categoryHashtagPool(secondary);
    var creatorTags = window.CreatorData.hashtags["Content Creator"] || [];
    var platforms = platformHashtags();
    var fallbackPool = unique(topicTags.concat(primaryTags, secondaryTags, creatorTags, platforms));
    var pack = []
      .concat(pickManyFreshTemplates("hashtag-topic", cleanTopic, topicTags, 2))
      .concat(pickManyFreshTemplates("hashtag-primary-" + primary, cleanTopic, primaryTags, 5))
      .concat(pickManyFreshTemplates("hashtag-secondary-" + primary, cleanTopic, secondaryTags, 3))
      .concat(pickManyFreshTemplates("hashtag-platform", cleanTopic, platforms, 3))
      .concat(pickManyFreshTemplates("hashtag-creator", cleanTopic, creatorTags, 2));

    return shuffle(fillHashtagPack(unique(pack), cleanTopic, fallbackPool)).slice(0, HASHTAGS_PER_VARIANT);
  }

  function generateFreshHashtagPack(cleanTopic) {
    var pack = [];
    var signature = "";

    for (var attempt = 0; attempt < 16; attempt += 1) {
      pack = buildHashtagPack(cleanTopic);
      signature = hashtagSignature(pack);

      if (!wasRecentlyOutput("hashtag-pack", cleanTopic, signature)) {
        break;
      }
    }

    rememberOutput("hashtag-pack", cleanTopic, signature);
    return pack.join(" ");
  }

  function generateSingleIdea(topic) {
    var cleanTopic = normalizeTopic(topic);
    return replaceTopic(pickFreshTemplate("idea", cleanTopic, window.CreatorData.ideas), cleanTopic);
  }

  function generateSingleTitle(topic) {
    var cleanTopic = normalizeTopic(topic);
    return replaceTopic(pickFreshTemplate("title", cleanTopic, window.CreatorData.titles), cleanTopic);
  }

  function generateSingleHook(topic) {
    var cleanTopic = normalizeTopic(topic);
    return replaceTopic(pickFreshTemplate("hook", cleanTopic, window.CreatorData.hooks), cleanTopic);
  }

  function generateSingleCta(topic) {
    var cleanTopic = normalizeTopic(topic);
    return replaceTopic(pickFreshTemplate("cta", cleanTopic, window.CreatorData.ctas), cleanTopic);
  }

  function generateIdea(topic) {
    return freshOutput("idea", topic, function (cleanTopic) {
      return formatVariations(pickManyFreshTemplates("idea", cleanTopic, window.CreatorData.ideas, VARIANT_COUNT).map(function (template) {
        return replaceTopic(template, cleanTopic);
      }));
    });
  }

  function generateTitle(topic) {
    return freshOutput("title", topic, function (cleanTopic) {
      return formatVariations(pickManyFreshTemplates("title", cleanTopic, window.CreatorData.titles, VARIANT_COUNT).map(function (template) {
        return replaceTopic(template, cleanTopic);
      }));
    });
  }

  function generateHook(topic) {
    return freshOutput("hook", topic, function (cleanTopic) {
      return formatVariations(pickManyFreshTemplates("hook", cleanTopic, window.CreatorData.hooks, VARIANT_COUNT).map(function (template) {
        return replaceTopic(template, cleanTopic);
      }));
    });
  }

  function generateHashtag(topic) {
    return freshOutput("hashtag", topic, function (cleanTopic) {
      var packs = [];

      for (var i = 0; i < HASHTAG_VARIANT_COUNT; i += 1) {
        packs.push(generateFreshHashtagPack(cleanTopic));
      }

      return packs.join("\n");
    });
  }

  function generateBlueprint(topic) {
    return freshOutput("blueprint", topic, function (cleanTopic) {
      var idea = generateSingleIdea(cleanTopic);
      var hook = generateSingleHook(cleanTopic);
      var points = pickManyFreshTemplates("blueprint-point", cleanTopic, window.CreatorData.blueprintPoints, 3).map(function (point) {
        return replaceTopic(point, cleanTopic);
      });
      var cta = generateSingleCta(cleanTopic);

      return [
        "[IDE] " + idea,
        "[HOOK] " + hook,
        "[POIN 1] " + points[0],
        "[POIN 2] " + points[1],
        "[POIN 3] " + points[2],
        "[CTA] " + cta
      ].join("\n");
    });
  }

  function generate(type, topic) {
    var cleanTopic = normalizeTopic(topic);

    if (type === "idea") {
      return generateIdea(cleanTopic);
    }
    if (type === "title") {
      return generateTitle(cleanTopic);
    }
    if (type === "hook") {
      return generateHook(cleanTopic);
    }
    if (type === "hashtag") {
      return generateHashtag(cleanTopic);
    }
    if (type === "blueprint") {
      return generateBlueprint(cleanTopic);
    }

    return "";
  }

  window.CreatorGenerator = {
    labels: typeLabels,
    normalizeTopic: normalizeTopic,
    generate: generate,
    generateAll: function (topic) {
      var cleanTopic = normalizeTopic(topic);
      return {
        idea: generateIdea(cleanTopic),
        title: generateTitle(cleanTopic),
        hook: generateHook(cleanTopic),
        hashtag: generateHashtag(cleanTopic),
        blueprint: generateBlueprint(cleanTopic)
      };
    }
  };
})();
