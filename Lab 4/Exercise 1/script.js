(function () {
  "use strict";

  var form = document.getElementById("registrationForm");
  var usernameInput = document.getElementById("username");
  var feedback = document.getElementById("usernameFeedback");
  var submitButton = document.getElementById("submitButton");
  var formStatus = document.getElementById("formStatus");
  var liveRegion = document.getElementById("liveRegion");

  var debounceTimer = null;
  var lastCheckId = 0;
  var lastResultValid = false;
  var localUsernames = [
    "alice",
    "bob",
    "charlie",
    "student123",
    "admin",
    "teacher01"
  ];

  function setSubmitEnabled(enabled) {
    submitButton.disabled = !enabled;
    submitButton.setAttribute("aria-disabled", enabled ? "false" : "true");
  }

  function setFeedback(state, message) {
    var text = message || "";
    feedback.textContent = text;
    feedback.className = "feedback";
    feedback.removeAttribute("data-state");
    feedback.removeAttribute("aria-busy");

    if (state) {
      var className = "feedback-" + state;
      feedback.classList.add(className);
      feedback.setAttribute("data-state", state);
      if (state === "checking") {
        feedback.setAttribute("aria-busy", "true");
      }
    }

    if (text && liveRegion) {
      liveRegion.textContent = text;
    }
  }

  function startChecking() {
    lastResultValid = false;
    setSubmitEnabled(false);
    usernameInput.setAttribute("aria-invalid", "true");
    setFeedback("checking", "Checking...");
  }

  function checkUsername(value) {
    var trimmed = value.trim();
    if (!trimmed) {
      lastResultValid = false;
      usernameInput.setAttribute("aria-invalid", "true");
      setFeedback(null, "");
      setSubmitEnabled(false);
      return;
    }

    var currentId = ++lastCheckId;
    var url = "usernames.json?username=" + encodeURIComponent(trimmed);

    fetch(url, { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Network error");
        }
        return response.json();
      })
      .then(function (data) {
        if (currentId !== lastCheckId) {
          return;
        }

        if (!Array.isArray(data)) {
          throw new Error("Invalid data");
        }

        var lower = trimmed.toLowerCase();
        var exists = data.some(function (name) {
          return typeof name === "string" && name.toLowerCase() === lower;
        });

        if (exists) {
          lastResultValid = false;
          usernameInput.setAttribute("aria-invalid", "true");
          setFeedback("error", "Username already taken");
          setSubmitEnabled(false);
        } else {
          lastResultValid = true;
          usernameInput.setAttribute("aria-invalid", "false");
          setFeedback("success", "Username available");
          setSubmitEnabled(true);
        }
      })
      .catch(function () {
        if (currentId !== lastCheckId) {
          return;
        }
        var lowerFallback = trimmed.toLowerCase();
        if (window.location && window.location.protocol === "file:") {
          var existsLocal = localUsernames.some(function (name) {
            return typeof name === "string" && name.toLowerCase() === lowerFallback;
          });
          if (existsLocal) {
            lastResultValid = false;
            usernameInput.setAttribute("aria-invalid", "true");
            setFeedback("error", "Username already taken");
            setSubmitEnabled(false);
          } else {
            lastResultValid = true;
            usernameInput.setAttribute("aria-invalid", "false");
            setFeedback("success", "Username available");
            setSubmitEnabled(true);
          }
        } else {
          lastResultValid = false;
          usernameInput.setAttribute("aria-invalid", "true");
          setFeedback("error", "Unable to check username availability");
          setSubmitEnabled(false);
        }
      });
  }

  function handleInput() {
    var value = usernameInput.value || "";

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    if (!value.trim()) {
      lastResultValid = false;
      usernameInput.setAttribute("aria-invalid", "true");
      setFeedback(null, "");
      setSubmitEnabled(false);
      return;
    }

    startChecking();

    debounceTimer = setTimeout(function () {
      checkUsername(value);
    }, 400);
  }

  function handleSubmit(event) {
    event.preventDefault();

    var value = (usernameInput.value || "").trim();

    if (!value) {
      lastResultValid = false;
      usernameInput.setAttribute("aria-invalid", "true");
      setFeedback("error", "Please enter a username");
      setSubmitEnabled(false);
      usernameInput.focus();
      return;
    }

    if (!lastResultValid) {
      usernameInput.setAttribute("aria-invalid", "true");
      setFeedback("error", "Username must be available before submitting");
      usernameInput.focus();
      return;
    }

    formStatus.textContent = "Form submitted with an available username.";
    if (liveRegion) {
      liveRegion.textContent = "Form submitted successfully.";
    }

    form.reset();
    lastResultValid = false;
    usernameInput.setAttribute("aria-invalid", "true");
    setFeedback(null, "");
    setSubmitEnabled(false);
  }

  function init() {
    setSubmitEnabled(false);
    usernameInput.setAttribute("aria-invalid", "true");

    usernameInput.addEventListener("input", handleInput);
    form.addEventListener("submit", handleSubmit);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
