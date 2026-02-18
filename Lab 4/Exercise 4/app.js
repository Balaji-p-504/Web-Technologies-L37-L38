const API_KEY = "fce63ee9bbbe5574ef4f24b848f6856f";
const cache = {};

(function () {
  "use strict";

  var CACHE_TTL = 10 * 60 * 1000;

  var cityInput = document.getElementById("cityInput");
  var searchBtn = document.getElementById("searchBtn");
  var tempDiv = document.getElementById("tempDiv");
  var humidityDiv = document.getElementById("humidityDiv");
  var conditionDiv = document.getElementById("conditionDiv");
  var inputError = document.getElementById("inputError");
  var statusRegion = document.getElementById("statusRegion");

  var loadingStartedAt = 0;

  function setStatus(message) {
    statusRegion.textContent = message || "";
  }

  function setInputError(message) {
    inputError.textContent = message || "";
  }

  function clearWeather() {
    tempDiv.textContent = "";
    humidityDiv.textContent = "";
    conditionDiv.textContent = "";
  }

  function startLoading(message) {
    loadingStartedAt = Date.now();
    document.body.classList.add("loading");
    if (message) {
      setStatus(message);
    }
  }

  function stopLoading(callback) {
    var elapsed = Date.now() - loadingStartedAt;
    var remaining = 300 - elapsed;
    if (remaining < 0) {
      remaining = 0;
    }
    setTimeout(function () {
      document.body.classList.remove("loading");
      if (callback) {
        callback();
      }
    }, remaining);
  }

  function capitalize(text) {
    if (!text) {
      return "";
    }
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function updateWeatherUI(data, fromCache) {
    if (!data || !data.main || !data.weather || !data.weather.length) {
      clearWeather();
      return;
    }
    var temp = data.main.temp;
    var humidity = data.main.humidity;
    var description = data.weather[0].description || "";
    var conditionText = capitalize(description);
    var cityName = data.name || "";

    tempDiv.textContent = "Temperature: " + temp + " °C";
    humidityDiv.textContent = "Humidity: " + humidity + " %";

    var conditionLabel = "Condition: " + conditionText;
    if (fromCache) {
      conditionLabel += " (from cache)";
    }
    conditionDiv.textContent = conditionLabel;

    var statusText = "Weather loaded for " + cityName;
    if (fromCache) {
      statusText += " (from cache)";
    }
    setStatus(statusText);
  }

  function fetchWeather(city) {
    var trimmed = city.trim();
    if (!trimmed) {
      return;
    }

    var key = trimmed.toLowerCase();
    var now = Date.now();
    var cached = cache[key];

    startLoading("Loading weather for " + trimmed + "...");

    if (cached && now - cached.timestamp < CACHE_TTL) {
      stopLoading(function () {
        updateWeatherUI(cached.data, true);
      });
      return;
    }

    var url =
      "https://api.openweathermap.org/data/2.5/weather?q=" +
      encodeURIComponent(trimmed) +
      "&units=metric&appid=" +
      encodeURIComponent(API_KEY);

    fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json"
      }
    })
      .then(function (response) {
        if (response.status === 404) {
          stopLoading(function () {
            clearWeather();
            setStatus("City not found. Please check spelling.");
          });
          return null;
        }
        if (!response.ok) {
          stopLoading(function () {
            clearWeather();
            setStatus("Network error. Please try again later.");
          });
          return null;
        }
        return response.json();
      })
      .then(function (data) {
        if (!data) {
          return;
        }
        cache[key] = {
          timestamp: Date.now(),
          data: data
        };
        stopLoading(function () {
          updateWeatherUI(data, false);
        });
      })
      .catch(function () {
        stopLoading(function () {
          clearWeather();
          setStatus("Network error. Please try again later.");
        });
      });
  }

  function validateInput() {
    var value = cityInput.value || "";
    if (!value.trim()) {
      searchBtn.disabled = true;
      setInputError("Please enter a city name.");
    } else {
      searchBtn.disabled = false;
      setInputError("");
    }
  }

  function handleSearch() {
    var value = cityInput.value || "";
    if (!value.trim()) {
      validateInput();
      return;
    }
    setInputError("");
    fetchWeather(value);
  }

  function init() {
    validateInput();
    cityInput.addEventListener("input", validateInput);
    searchBtn.addEventListener("click", function () {
      handleSearch();
    });
    cityInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.keyCode === 13) {
        event.preventDefault();
        handleSearch();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

