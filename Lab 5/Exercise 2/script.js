(function () {
  "use strict";

  var bookForm = document.getElementById("bookForm");
  var bookIdInput = document.getElementById("bookIdInput");
  var titleInput = document.getElementById("titleInput");
  var authorInput = document.getElementById("authorInput");
  var availabilitySelect = document.getElementById("availabilitySelect");

  var bookIdError = document.getElementById("bookIdError");
  var titleError = document.getElementById("titleError");
  var authorError = document.getElementById("authorError");
  var availabilityError = document.getElementById("availabilityError");

  var btnSave = document.getElementById("btnSave");
  var btnReset = document.getElementById("btnReset");
  var statusText = document.getElementById("statusText");

  var bookTable = document.getElementById("bookTable");
  var bookTableBody = document.getElementById("bookTableBody");

  var toastSuccess = document.getElementById("toastSuccess");
  var toastSuccessText = document.getElementById("toastSuccessText");
  var toastError = document.getElementById("toastError");
  var toastErrorText = document.getElementById("toastErrorText");
  var toastErrorClose = document.getElementById("toastErrorClose");
  var overlay = document.getElementById("overlay");

  var xmlDoc = null;
  var xmlBackup = null;
  var isBusy = false;
  var currentSort = { key: "id", direction: "asc" };
  var currentEditId = null;

  function showOverlay(active) {
    if (active) {
      overlay.classList.add("show");
      overlay.setAttribute("aria-hidden", "false");
      statusText.classList.add("loading");
    } else {
      overlay.classList.remove("show");
      overlay.setAttribute("aria-hidden", "true");
      statusText.classList.remove("loading");
    }
  }

  function setBusy(active) {
    isBusy = active;
    btnSave.disabled = active;
    btnReset.disabled = active;
    showOverlay(active);
  }

  function showSuccessToast(message) {
    toastSuccessText.textContent = message || "Operation completed successfully";
    toastSuccess.classList.add("show");
    setTimeout(function () {
      toastSuccess.classList.remove("show");
    }, 3000);
  }

  function showErrorToast(message) {
    toastErrorText.textContent = message || "Error";
    toastError.classList.add("show");
  }

  function hideErrorToast() {
    toastError.classList.remove("show");
  }

  function logDebug(message, data) {
    if (data !== undefined) {
      console.log("[BookTracker]", message, data);
    } else {
      console.log("[BookTracker]", message);
    }
  }

  function clearFieldErrors() {
    bookIdError.textContent = "";
    titleError.textContent = "";
    authorError.textContent = "";
    availabilityError.textContent = "";
  }

  function sanitize(text) {
    if (!text) {
      return "";
    }
    return String(text)
      .replace(/&/g, "")
      .replace(/</g, "")
      .replace(/>/g, "");
  }

  function validateXmlStructure(doc) {
    if (!doc || !doc.documentElement) {
      return false;
    }
    var root = doc.documentElement;
    if (root.nodeName !== "library") {
      return false;
    }
    return true;
  }

  function makeBackup() {
    if (!xmlDoc) {
      xmlBackup = null;
      return;
    }
    var serializer = new XMLSerializer();
    xmlBackup = serializer.serializeToString(xmlDoc);
  }

  function rollbackFromBackup() {
    if (!xmlBackup) {
      return;
    }
    var parser = new DOMParser();
    var restored = parser.parseFromString(xmlBackup, "application/xml");
    if (validateXmlStructure(restored)) {
      xmlDoc = restored;
      logDebug("Rollback applied from backup");
      renderTable();
    }
  }

  function getNextBookId() {
    var maxId = 0;
    if (!xmlDoc) {
      return 1;
    }
    var books = xmlDoc.getElementsByTagName("book");
    for (var i = 0; i < books.length; i++) {
      var id = books[i].getAttribute("id");
      var num = parseInt(id, 10);
      if (!isNaN(num) && num > maxId) {
        maxId = num;
      }
    }
    return maxId + 1;
  }

  function ensureBookIdValue() {
    if (!bookIdInput.value) {
      bookIdInput.value = String(getNextBookId());
    }
  }

  function findBookById(id) {
    if (!xmlDoc) {
      return null;
    }
    var books = xmlDoc.getElementsByTagName("book");
    for (var i = 0; i < books.length; i++) {
      if (books[i].getAttribute("id") === String(id)) {
        return books[i];
      }
    }
    return null;
  }

  function validateForm() {
    clearFieldErrors();
    var valid = true;
    var idValue = bookIdInput.value ? String(bookIdInput.value).trim() : "";
    var titleValue = titleInput.value ? String(titleInput.value).trim() : "";
    var authorValue = authorInput.value ? String(authorInput.value).trim() : "";
    var availabilityValue = availabilitySelect.value;

    if (!idValue) {
      valid = false;
      bookIdError.textContent = "Book ID is required";
    } else if (!/^\d+$/.test(idValue)) {
      valid = false;
      bookIdError.textContent = "Book ID must be numeric";
    }

    if (!titleValue) {
      valid = false;
      titleError.textContent = "Title is required";
    }

    if (!authorValue) {
      valid = false;
      authorError.textContent = "Author is required";
    }

    if (!availabilityValue) {
      valid = false;
      availabilityError.textContent = "Availability is required";
    } else if (availabilityValue !== "true" && availabilityValue !== "false") {
      valid = false;
      availabilityError.textContent = "Availability must be true or false";
    }

    return valid;
  }

  function clearTableBody() {
    while (bookTableBody.firstChild) {
      bookTableBody.removeChild(bookTableBody.firstChild);
    }
  }

  function showEmptyRow() {
    clearTableBody();
    var tr = document.createElement("tr");
    tr.className = "row-empty";
    var td = document.createElement("td");
    td.colSpan = 5;
    td.textContent = "No books found";
    tr.appendChild(td);
    bookTableBody.appendChild(tr);
  }

  function buildRow(bookNode) {
    var id = bookNode.getAttribute("id") || "";
    var titleNode = bookNode.getElementsByTagName("title")[0];
    var authorNode = bookNode.getElementsByTagName("author")[0];
    var availabilityNode = bookNode.getElementsByTagName("availability")[0];

    var title = titleNode ? titleNode.textContent : "";
    var author = authorNode ? authorNode.textContent : "";
    var availability = availabilityNode ? availabilityNode.textContent : "";

    var tr = document.createElement("tr");
    tr.setAttribute("data-id", id);

    var tdId = document.createElement("td");
    tdId.textContent = id;

    var tdTitle = document.createElement("td");
    tdTitle.textContent = title;

    var tdAuthor = document.createElement("td");
    tdAuthor.textContent = author;

    var tdAvailability = document.createElement("td");
    var spanAvail = document.createElement("span");
    var isTrue = String(availability).toLowerCase() === "true";
    spanAvail.textContent = isTrue ? "Available" : "Unavailable";
    spanAvail.className = isTrue ? "availability-true" : "availability-false";
    tdAvailability.appendChild(spanAvail);

    var tdActions = document.createElement("td");
    var btnEdit = document.createElement("button");
    btnEdit.type = "button";
    btnEdit.className = "btn btn-small";
    btnEdit.textContent = "Edit Status";
    btnEdit.setAttribute("data-id", id);

    var btnDelete = document.createElement("button");
    btnDelete.type = "button";
    btnDelete.className = "btn btn-small btn-secondary";
    btnDelete.textContent = "Delete";
    btnDelete.setAttribute("data-id", id);

    tdActions.appendChild(btnEdit);
    tdActions.appendChild(btnDelete);

    tr.appendChild(tdId);
    tr.appendChild(tdTitle);
    tr.appendChild(tdAuthor);
    tr.appendChild(tdAvailability);
    tr.appendChild(tdActions);

    return tr;
  }

  function getBooksArray() {
    var result = [];
    if (!xmlDoc) {
      return result;
    }
    var books = xmlDoc.getElementsByTagName("book");
    for (var i = 0; i < books.length; i++) {
      var node = books[i];
      var id = node.getAttribute("id") || "";
      var titleNode = node.getElementsByTagName("title")[0];
      var authorNode = node.getElementsByTagName("author")[0];
      var availabilityNode = node.getElementsByTagName("availability")[0];
      result.push({
        node: node,
        id: id,
        title: titleNode ? titleNode.textContent : "",
        author: authorNode ? authorNode.textContent : "",
        availability: availabilityNode ? availabilityNode.textContent : ""
      });
    }
    return result;
  }

  function sortBooksArray(arr) {
    var key = currentSort.key;
    var dir = currentSort.direction === "asc" ? 1 : -1;
    arr.sort(function (a, b) {
      var va = a[key] || "";
      var vb = b[key] || "";
      if (key === "id") {
        var na = parseInt(va, 10);
        var nb = parseInt(vb, 10);
        if (isNaN(na)) {
          na = 0;
        }
        if (isNaN(nb)) {
          nb = 0;
        }
        return na < nb ? -1 * dir : na > nb ? 1 * dir : 0;
      }
      va = String(va).toLowerCase();
      vb = String(vb).toLowerCase();
      if (va < vb) {
        return -1 * dir;
      }
      if (va > vb) {
        return 1 * dir;
      }
      return 0;
    });
  }

  function updateSortIndicators() {
    var buttons = bookTable.querySelectorAll(".sort-button");
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      var key = btn.getAttribute("data-sort");
      var indicator = btn.querySelector(".sort-indicator");
      if (key === currentSort.key) {
        indicator.textContent = currentSort.direction === "asc" ? "▲" : "▼";
      } else {
        indicator.textContent = "";
      }
    }
  }

  function renderTable() {
    if (!xmlDoc) {
      showEmptyRow();
      return;
    }
    var booksArr = getBooksArray();
    if (!booksArr.length) {
      showEmptyRow();
      return;
    }
    sortBooksArray(booksArr);
    var scrollTop = document.documentElement.scrollTop || document.body.scrollTop || 0;
    clearTableBody();
    for (var i = 0; i < booksArr.length; i++) {
      var row = buildRow(booksArr[i].node);
      bookTableBody.appendChild(row);
    }
    updateSortIndicators();
    window.scrollTo(0, scrollTop);
  }

  function sendGetBooks() {
    setBusy(true);
    statusText.textContent = "Loading books...";
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "books.xml", true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        setBusy(false);
        if (xhr.status === 200) {
          try {
            var doc = xhr.responseXML;
            if (!validateXmlStructure(doc)) {
              showErrorToast("Invalid XML format");
              return;
            }
            xmlDoc = doc;
            renderTable();
            ensureBookIdValue();
            logDebug("Initial XML loaded", xmlDoc);
          } catch (e) {
            console.error(e);
            showErrorToast("Invalid XML format");
          }
        } else {
          showErrorToast("Unable to load books.xml (status " + xhr.status + ")");
        }
      }
    };
    xhr.onerror = function () {
      setBusy(false);
      showErrorToast("Network error while loading books");
    };
    xhr.send();
  }

  function addBook(idValue, titleValue, authorValue, availabilityValue) {
    if (!xmlDoc) {
      var parser = new DOMParser();
      xmlDoc = parser.parseFromString("<?xml version=\"1.0\" encoding=\"UTF-8\"?><library></library>", "application/xml");
    }
    makeBackup();
    try {
      var root = xmlDoc.documentElement;
      var existing = findBookById(idValue);
      if (existing) {
        throw new Error("Duplicate book ID");
      }

      var bookNode = xmlDoc.createElement("book");
      bookNode.setAttribute("id", String(idValue));

      var titleNode = xmlDoc.createElement("title");
      titleNode.textContent = titleValue;
      var authorNode = xmlDoc.createElement("author");
      authorNode.textContent = authorValue;
      var availabilityNode = xmlDoc.createElement("availability");
      availabilityNode.textContent = availabilityValue;

      bookNode.appendChild(titleNode);
      bookNode.appendChild(authorNode);
      bookNode.appendChild(availabilityNode);

      root.appendChild(bookNode);
      if (!validateXmlStructure(xmlDoc)) {
        throw new Error("XML structure invalid after add");
      }
      renderTable();
      showSuccessToast("Book added successfully");
      logDebug("Book added", { id: idValue });
    } catch (e) {
      console.error(e);
      rollbackFromBackup();
      showErrorToast(e.message || "Unable to add book");
    }
  }

  function updateBookAvailability(idValue, availabilityValue) {
    if (!xmlDoc) {
      showErrorToast("No data loaded");
      return;
    }
    makeBackup();
    try {
      var node = findBookById(idValue);
      if (!node) {
        throw new Error("Book not found");
      }
      var availabilityNode = node.getElementsByTagName("availability")[0];
      if (!availabilityNode) {
        availabilityNode = xmlDoc.createElement("availability");
        node.appendChild(availabilityNode);
      }
      availabilityNode.textContent = availabilityValue;
      if (!validateXmlStructure(xmlDoc)) {
        throw new Error("XML structure invalid after update");
      }
      renderTable();
      showSuccessToast("Availability updated successfully");
      logDebug("Availability updated", { id: idValue, availability: availabilityValue });
    } catch (e) {
      console.error(e);
      rollbackFromBackup();
      showErrorToast(e.message || "Unable to update availability");
    }
  }

  function deleteBook(idValue) {
    if (!xmlDoc) {
      showErrorToast("No data loaded");
      return;
    }
    makeBackup();
    try {
      var node = findBookById(idValue);
      if (!node) {
        throw new Error("Book not found");
      }
      var parent = node.parentNode;
      parent.removeChild(node);
      if (!validateXmlStructure(xmlDoc)) {
        throw new Error("XML structure invalid after delete");
      }
      renderTable();
      showSuccessToast("Book deleted successfully");
      logDebug("Book deleted", { id: idValue });
    } catch (e) {
      console.error(e);
      rollbackFromBackup();
      showErrorToast(e.message || "Unable to delete book");
    }
  }

  function resetForm() {
    bookForm.reset();
    clearFieldErrors();
    currentEditId = null;
    btnSave.textContent = "Save";
    statusText.textContent = "";
    ensureBookIdValue();
  }

  function handleFormSubmit(event) {
    event.preventDefault();
    if (isBusy) {
      return;
    }
    if (!validateForm()) {
      return;
    }
    var idValue = String(bookIdInput.value).trim();
    var titleValue = sanitize(titleInput.value.trim());
    var authorValue = sanitize(authorInput.value.trim());
    var availabilityValue = availabilitySelect.value;

    if (currentEditId && currentEditId === idValue) {
      updateBookAvailability(idValue, availabilityValue);
      resetForm();
    } else {
      var existing = findBookById(idValue);
      if (existing) {
        bookIdError.textContent = "Duplicate ID detected";
        return;
      }
      addBook(idValue, titleValue, authorValue, availabilityValue);
      resetForm();
    }
  }

  function handleTableClick(event) {
    var target = event.target;
    if (target.tagName !== "BUTTON") {
      return;
    }
    var id = target.getAttribute("data-id");
    if (!id) {
      return;
    }
    if (target.textContent === "Edit Status") {
      var node = findBookById(id);
      if (!node) {
        showErrorToast("Book not found");
        return;
      }
      var idVal = node.getAttribute("id") || "";
      var titleNode = node.getElementsByTagName("title")[0];
      var authorNode = node.getElementsByTagName("author")[0];
      var availabilityNode = node.getElementsByTagName("availability")[0];
      bookIdInput.value = idVal;
      titleInput.value = titleNode ? titleNode.textContent : "";
      authorInput.value = authorNode ? authorNode.textContent : "";
      availabilitySelect.value = availabilityNode ? String(availabilityNode.textContent).toLowerCase() : "";
      currentEditId = idVal;
      btnSave.textContent = "Update Status";
      clearFieldErrors();
      statusText.textContent = "Editing availability for book " + idVal;
    } else if (target.textContent === "Delete") {
      var confirmed = window.confirm("Delete this book?");
      if (!confirmed) {
        return;
      }
      deleteBook(id);
      if (currentEditId === id) {
        resetForm();
      }
    }
  }

  function handleSortClick(event) {
    var target = event.target;
    if (!target.classList.contains("sort-button")) {
      var btn = target.closest(".sort-button");
      if (!btn) {
        return;
      }
      target = btn;
    }
    var key = target.getAttribute("data-sort");
    if (!key) {
      return;
    }
    if (currentSort.key === key) {
      currentSort.direction = currentSort.direction === "asc" ? "desc" : "asc";
    } else {
      currentSort.key = key;
      currentSort.direction = "asc";
    }
    renderTable();
  }

  function attachEvents() {
    bookForm.addEventListener("submit", handleFormSubmit);
    btnReset.addEventListener("click", function () {
      resetForm();
    });
    bookTableBody.addEventListener("click", handleTableClick);
    toastErrorClose.addEventListener("click", hideErrorToast);
    bookIdInput.addEventListener("focus", ensureBookIdValue);
    bookTable.querySelector("thead").addEventListener("click", handleSortClick);
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        hideErrorToast();
      }
    });
  }

  function runBasicTests() {
    logDebug("Running basic tests");
    if (!xmlDoc) {
      logDebug("No XML loaded for tests");
      return;
    }
    var originalBackup = xmlBackup;
    makeBackup();
    try {
      var testId = "99999";
      addBook(testId, "Test Title", "Test Author", "true");
      updateBookAvailability(testId, "false");
      deleteBook(testId);
      logDebug("Basic CRUD tests completed");
    } catch (e) {
      console.error(e);
      rollbackFromBackup();
    }
    xmlBackup = originalBackup;
  }

  function init() {
    attachEvents();
    sendGetBooks();
    window.BookTrackerTests = {
      runBasicTests: runBasicTests
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

