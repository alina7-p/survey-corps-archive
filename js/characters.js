"use strict";

/*
 * Character database: loads Attack on Titan characters from the public
 * Jikan API (https://jikan.moe, unofficial MyAnimeList API) with fetch().
 * Endpoint: GET /v4/anime/16498/characters  ->  { data: [ { character, role, favorites, voice_actors } ] }
 */
(function () {
  const API_URL = "https://api.jikan.moe/v4/anime/16498/characters";
  const CACHE_KEY = "sca-characters-cache";
  const CACHE_MS = 10 * 60 * 1000; // reuse a saved response for 10 minutes
  const TIMEOUT_MS = 25000; // the Jikan character list is large and can be slow
  const PAGE_SIZE = 24;

  const store = window.SCA.store;
  const grid = $("#char-grid");
  const dialog = document.querySelector("#char-dialog");

  let characters = [];
  let updatedAt = 0;
  let loading = false;
  let role = "all";
  let query = "";
  let sortBy = "favorites";
  let visible = PAGE_SIZE;
  let openId = null;
  let offline = false; // true while the built-in backup list is shown
  let slowTimer = null;

  /* ----- Errors ----- */
  function ApiError(kind, status) {
    this.kind = kind;
    this.status = status || 0;
  }
  function describe(error) {
    switch (error.kind) {
      case "rate": return "The API is receiving too many requests right now. Wait a few seconds and try again.";
      case "server": return "The character service is temporarily unavailable (error " + error.status + "). Please try again later.";
      case "http": return "The API could not answer this request (error " + error.status + ").";
      case "timeout": return "The API took too long to respond. Check your connection and try again.";
      case "data": return "The API sent data in an unexpected format, so it cannot be shown.";
      case "empty": return "The API returned no characters.";
      default: return "Could not reach the API. Check your internet connection and try again.";
    }
  }
  function wait(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }

  /* ----- fetch() with timeout and one retry ----- */
  async function requestJson(url) {
    let lastError = new ApiError("network");
    for (let attempt = 0; attempt < 2; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(function () { controller.abort(); }, TIMEOUT_MS);
      try {
        const response = await fetch(url, { headers: { Accept: "application/json" }, signal: controller.signal });
        if (response.status === 429 || response.status >= 500) {
          lastError = new ApiError(response.status === 429 ? "rate" : "server", response.status);
        } else if (!response.ok) {
          throw new ApiError("http", response.status);
        } else {
          return await response.json();
        }
      } catch (error) {
        if (error instanceof ApiError) throw error;
        if (error instanceof SyntaxError) throw new ApiError("data");
        lastError = new ApiError(error && error.name === "AbortError" ? "timeout" : "network");
      } finally {
        clearTimeout(timer);
      }
      if (attempt === 0 && lastError.kind !== "timeout") await wait(1500);
      else if (lastError.kind === "timeout") break;
    }
    throw lastError;
  }

  /* ----- Process the JSON ----- */
  function formatName(name) {
    const parts = String(name).split(",");
    return parts.length === 2 ? parts[1].trim() + " " + parts[0].trim() : String(name).trim();
  }
  function safeUrl(value, host) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && url.hostname.endsWith(host) ? url.href : "";
    } catch (error) { return ""; }
  }
  function normalize(json) {
    if (!json || !Array.isArray(json.data)) throw new ApiError("data");
    return json.data.map(function (item) {
      const c = item && item.character;
      if (!c || !c.mal_id || !c.name) return null;
      const images = c.images || {};
      const image = (images.jpg && images.jpg.image_url) || (images.webp && images.webp.image_url) || "";
      return {
        id: Number(c.mal_id),
        name: formatName(c.name),
        role: item.role === "Main" ? "Main" : "Supporting",
        favorites: Number(item.favorites) || 0,
        image: safeUrl(image, "myanimelist.net"),
        url: safeUrl(c.url, "myanimelist.net"),
        voices: (Array.isArray(item.voice_actors) ? item.voice_actors : []).filter(function (v) {
          return v && v.person && v.person.name && (v.language === "Japanese" || v.language === "English");
        }).map(function (v) { return { name: formatName(v.person.name), language: v.language }; })
      };
    }).filter(Boolean);
  }

  /* ----- Cache (also used as a fallback when the API is down) ----- */
  function readCache() {
    try {
      const saved = JSON.parse(store.get(CACHE_KEY));
      if (saved && Array.isArray(saved.items) && saved.items.length && saved.time) return saved;
    } catch (error) { /* no usable cache */ }
    return null;
  }

  /* ----- Loading ----- */
  async function load(force) {
    if (loading) return;
    loading = true;
    $("#char-refresh, #char-retry").prop("disabled", true);
    $("#char-error, #char-notice").prop("hidden", true);
    const cached = readCache();
    clearTimeout(slowTimer);
    try {
      if (!force && cached && Date.now() - cached.time < CACHE_MS) {
        characters = cached.items;
        updatedAt = cached.time;
      } else {
        showSkeleton();
        slowTimer = setTimeout(function () {
          $("#char-status").text("Still loading… the API can be slow. Please wait a little longer.");
        }, 6000);
        const items = normalize(await requestJson(API_URL));
        if (!items.length) throw new ApiError("empty");
        characters = items;
        offline = false;
        updatedAt = Date.now();
        store.set(CACHE_KEY, JSON.stringify({ time: updatedAt, items: items }));
      }
      render();
    } catch (error) {
      if (cached) {
        characters = cached.items;
        offline = false;
        updatedAt = cached.time;
        $("#char-notice").text(describe(error) + " Showing the data saved on " + new Date(updatedAt).toLocaleString() + ".").prop("hidden", false);
        render();
      } else {
        // Nothing saved: show the error and a short built-in list so the page is still usable
        $("#char-error-text").text(describe(error));
        $("#char-error").prop("hidden", false);
        if (Array.isArray(window.SCA_FALLBACK) && window.SCA_FALLBACK.length) {
          characters = window.SCA_FALLBACK;
          offline = true;
          updatedAt = 0;
          $("#char-notice").text("Showing a short offline list (names and roles only). Use “Try again” to load live data.").prop("hidden", false);
          render();
        } else {
          characters = [];
          grid.empty().attr("aria-busy", "false");
          $("#char-more, #char-empty").prop("hidden", true);
          $("#char-status").text("Characters could not be loaded.");
          $("#char-random").prop("disabled", true);
        }
      }
    } finally {
      clearTimeout(slowTimer);
      loading = false;
      $("#char-refresh, #char-retry").prop("disabled", false);
    }
  }
  function showSkeleton() {
    grid.empty().attr("aria-busy", "true");
    for (let i = 0; i < 8; i++) grid.append($("<div>").addClass("char-skeleton").attr("aria-hidden", "true"));
    $("#char-status").text("Loading characters…");
    $("#char-more, #char-empty").prop("hidden", true);
  }

  /* ----- Filter, sort, show ----- */
  function filtered() {
    const favorites = window.SCA.getFavorites();
    const text = query.trim().toLowerCase();
    return characters.filter(function (c) {
      if (role === "favorites") { if (favorites.indexOf(c.id) === -1) return false; }
      else if (role !== "all" && c.role !== role) return false;
      if (!text) return true;
      return (c.name + " " + c.voices.map(function (v) { return v.name; }).join(" ")).toLowerCase().indexOf(text) !== -1;
    }).sort(function (a, b) {
      return sortBy === "name" ? a.name.localeCompare(b.name) : b.favorites - a.favorites;
    });
  }
  function render() {
    const list = filtered();
    const favorites = window.SCA.getFavorites();
    const signedIn = !!window.SCA.getUser();
    grid.empty().attr("aria-busy", "false");
    list.slice(0, visible).forEach(function (c) {
      const card = $("<article>").addClass("char-card");
      const open = $("<button>").attr({ type: "button", "aria-label": "Open profile of " + c.name }).addClass("char-open").data("id", c.id);
      const photo = $("<span>").addClass("char-photo").css("display", "block");
      photo.append($("<img>").attr({ src: c.image || "assets/crest.svg", alt: "", loading: "lazy", width: 225, height: 350 })
        .on("error", function () { $(this).off("error").attr("src", "assets/crest.svg"); }));
      const info = $("<span>").addClass("char-info");
      info.append($("<span>").addClass("char-name").text(c.name));
      info.append($("<span>").addClass("char-sub").text(offline ? c.role : c.role + " · ♥ " + c.favorites.toLocaleString()));
      card.append(open.append(photo, info));
      if (signedIn) {
        const on = favorites.indexOf(c.id) !== -1;
        card.append($("<button>").attr({ type: "button", "aria-pressed": on, "aria-label": (on ? "Remove " : "Add ") + c.name + (on ? " from favourites" : " to favourites") })
          .addClass("fav-btn").data("id", c.id).text(on ? "★" : "☆"));
      }
      grid.append(card);
    });
    $("#char-more").prop("hidden", list.length <= visible);
    $("#char-empty").prop("hidden", list.length !== 0);
    $("#char-random").prop("disabled", list.length === 0);
    const time = updatedAt ? " · Updated " + new Date(updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
    $("#char-status").text("Showing " + Math.min(visible, list.length) + " of " + list.length + " characters" + (offline ? " · Offline list" : time));
  }

  /* ----- Profile dialog ----- */
  function openProfile(id) {
    const c = characters.find(function (item) { return item.id === id; });
    if (!c) return;
    openId = id;
    $("#char-dialog-img").attr({ src: c.image || "assets/crest.svg", alt: c.name })
      .off("error").on("error", function () { $(this).off("error").attr("src", "assets/crest.svg"); });
    $("#char-dialog-name").text(c.name);
    $("#char-dialog-meta").text(offline ? c.role + " character" : c.role + " character · ♥ " + c.favorites.toLocaleString() + " MyAnimeList favourites");
    const voices = $("#char-dialog-voices").empty();
    if (!c.voices.length) voices.append($("<li>").text(offline ? "Voice actors load with live data." : "No voice actors listed."));
    c.voices.forEach(function (v) { voices.append($("<li>").text(v.name + " ").append($("<span>").text("(" + v.language + ")"))); });
    $("#char-dialog-link").attr("href", c.url || "https://myanimelist.net/").prop("hidden", !c.url);
    syncDialogFavorite();
    dialog.showModal();
  }
  function syncDialogFavorite() {
    const on = window.SCA.getFavorites().indexOf(openId) !== -1;
    $("#char-dialog-fav").attr("aria-pressed", on).text(on ? "★ In your favourites" : "☆ Add to favourites");
  }
  function toggleFavorite(id) {
    if (!window.SCA.getUser()) return;
    const list = window.SCA.getFavorites();
    const index = list.indexOf(id);
    if (index === -1) list.push(id); else list.splice(index, 1);
    window.SCA.setFavorites(list);
    render();
    syncDialogFavorite();
  }

  /* ----- User interaction ----- */
  grid.on("click", ".char-open", function () { openProfile($(this).data("id")); });
  grid.on("click", ".fav-btn", function () {
    const id = $(this).data("id");
    toggleFavorite(id);
    grid.find(".fav-btn").filter(function () { return $(this).data("id") === id; }).trigger("focus");
  });
  $("#char-search").on("input", function () { query = this.value; visible = PAGE_SIZE; render(); });
  $("#char-sort").on("change", function () { sortBy = this.value; render(); });
  $("[data-role]").on("click", function () {
    role = $(this).data("role");
    visible = PAGE_SIZE;
    $("[data-role]").removeClass("active").attr("aria-pressed", false);
    $(this).addClass("active").attr("aria-pressed", true);
    render();
  });
  $("#char-more").on("click", function () { visible += PAGE_SIZE; render(); });
  $("#char-refresh").on("click", function () { load(true); });
  $("#char-retry").on("click", function () { load(true); });
  $("#char-random").on("click", function () {
    const list = filtered();
    if (list.length) openProfile(list[Math.floor(Math.random() * list.length)].id);
  });
  $("#char-close").on("click", function () { dialog.close(); });
  $("#char-dialog-fav").on("click", function () { toggleFavorite(openId); });
  $(dialog).on("click", function (event) {
    if (event.target === dialog) dialog.close();
  });
  // Signing in or out changes what can be shown (favourites)
  $(document).on("sca:auth", function () {
    if (!window.SCA.getUser() && role === "favorites") {
      role = "all";
      $("[data-role]").removeClass("active").attr("aria-pressed", false);
      $("[data-role='all']").addClass("active").attr("aria-pressed", true);
    }
    if (characters.length) render();
  });

  load(false);
})();
