(function () {
  "use strict";

  var searchInput = document.getElementById("search");
  var searchWrapper = document.getElementById("searchWrapper");
  var resultsEl = document.getElementById("results");
  var inlineError = document.getElementById("inlineError");

  var products = [];
  var productsLoaded = false;
  var loadError = false;

  var localProducts = [
    { name: "Wireless Mouse", price: 19.99, category: "Electronics" },
    { name: "Mechanical Keyboard", price: 59.95, category: "Electronics" },
    { name: "USB-C Charger", price: 24.5, category: "Electronics" },
    { name: "Noise Cancelling Headphones", price: 129.0, category: "Electronics" },
    { name: "Smartphone Stand", price: 9.99, category: "Electronics" },
    { name: "Intro to JavaScript", price: 29.99, category: "Books" },
    { name: "CSS Design Patterns", price: 34.0, category: "Books" },
    { name: "HTML5 Handbook", price: 22.5, category: "Books" },
    { name: "UX Fundamentals", price: 27.75, category: "Books" },
    { name: "Responsive Web Design", price: 31.25, category: "Books" },
    { name: "Classic White T-Shirt", price: 12.0, category: "Clothing" },
    { name: "Blue Denim Jeans", price: 45.5, category: "Clothing" },
    { name: "Running Sneakers", price: 68.99, category: "Clothing" },
    { name: "Lightweight Hoodie", price: 39.0, category: "Clothing" },
    { name: "Baseball Cap", price: 15.25, category: "Clothing" }
  ];

  function setLoading(active) {
    if (!searchWrapper) {
      return;
    }
    if (active) {
      searchWrapper.classList.add("loading");
    } else {
      searchWrapper.classList.remove("loading");
    }
  }

  function debounce(fn, delay) {
    var timerId = null;
    function wrapper() {
      var context = this;
      var args = arguments;
      if (timerId) {
        clearTimeout(timerId);
      }
      timerId = setTimeout(function () {
        timerId = null;
        fn.apply(context, args);
      }, delay);
    }
    wrapper.cancel = function () {
      if (timerId) {
        clearTimeout(timerId);
        timerId = null;
      }
    };
    return wrapper;
  }

  function clearResults() {
    while (resultsEl.firstChild) {
      resultsEl.removeChild(resultsEl.firstChild);
    }
  }

  function showInlineError(message) {
    inlineError.textContent = message || "";
  }

  function formatPrice(value) {
    var n = Number(value);
    if (!isFinite(n)) {
      return "$0.00";
    }
    return "$" + n.toFixed(2);
  }

  function filterProducts(term) {
    var query = term.toLowerCase();
    var filtered = products.filter(function (product) {
      var name = String(product.name || "").toLowerCase();
      var category = String(product.category || "").toLowerCase();
      return name.indexOf(query) !== -1 || category.indexOf(query) !== -1;
    });
    filtered.sort(function (a, b) {
      var na = String(a.name || "").toLowerCase();
      var nb = String(b.name || "").toLowerCase();
      if (na < nb) {
        return -1;
      }
      if (na > nb) {
        return 1;
      }
      return 0;
    });
    if (filtered.length > 20) {
      return filtered.slice(0, 20);
    }
    return filtered;
  }

  function renderResults(items) {
    clearResults();
    if (!items || items.length === 0) {
      var emptyItem = document.createElement("li");
      emptyItem.className = "empty";
      emptyItem.textContent = "No results found";
      resultsEl.appendChild(emptyItem);
      requestAnimationFrame(function () {
        emptyItem.classList.add("visible");
      });
      return;
    }
    var elements = [];
    for (var i = 0; i < items.length; i++) {
      var product = items[i];
      var li = document.createElement("li");
      var title = document.createElement("strong");
      var meta = document.createElement("div");
      var price = document.createElement("span");
      var category = document.createElement("span");

      title.textContent = product.name;

      meta.className = "product-meta";
      price.className = "product-price";
      category.className = "product-category";

      price.textContent = formatPrice(product.price);
      category.textContent = product.category;

      meta.appendChild(price);
      meta.appendChild(category);

      li.appendChild(title);
      li.appendChild(meta);

      resultsEl.appendChild(li);
      elements.push(li);
    }
    requestAnimationFrame(function () {
      for (var j = 0; j < elements.length; j++) {
        elements[j].classList.add("visible");
      }
    });
  }

  function performSearch(term) {
    console.timeEnd("searchDebounce");
    setLoading(false);
    if (!productsLoaded || loadError) {
      return;
    }
    var trimmed = term.trim();
    if (trimmed.length < 2) {
      clearResults();
      return;
    }
    var items = filterProducts(trimmed);
    renderResults(items);
  }

  var debouncedSearch = debounce(performSearch, 300);

  function handleInput() {
    if (loadError) {
      return;
    }
    var value = searchInput.value || "";
    var trimmed = value.trim();
    if (trimmed.length < 2) {
      debouncedSearch.cancel();
      setLoading(false);
      clearResults();
      return;
    }
    setLoading(true);
    console.time("searchDebounce");
    debouncedSearch(trimmed);
  }

  function loadProducts() {
    var url = "products.json";
    fetch(url, { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Network error while loading products");
        }
        return response.json();
      })
      .then(function (data) {
        if (!Array.isArray(data)) {
          throw new Error("products.json is not an array");
        }
        products = data.slice();
        productsLoaded = true;
        loadError = false;
        showInlineError("");
      })
      .catch(function (error) {
        console.error(error);
        if (window.location && window.location.protocol === "file:") {
          products = localProducts.slice();
          productsLoaded = true;
          loadError = false;
          showInlineError("");
        } else {
          loadError = true;
          showInlineError("Unable to load products. Please refresh the page.");
        }
      });
  }

  function init() {
    loadProducts();
    searchInput.addEventListener("input", handleInput);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

