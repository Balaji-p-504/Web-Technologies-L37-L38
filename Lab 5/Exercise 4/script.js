(function () {
  "use strict";

  var productForm = document.getElementById("productForm");
  var productNameInput = document.getElementById("productNameInput");
  var categorySelect = document.getElementById("categorySelect");
  var priceInput = document.getElementById("priceInput");
  var stockInput = document.getElementById("stockInput");

  var productNameError = document.getElementById("productNameError");
  var categoryError = document.getElementById("categoryError");
  var priceError = document.getElementById("priceError");
  var stockError = document.getElementById("stockError");

  var btnAddProduct = document.getElementById("btnAddProduct");
  var btnResetForm = document.getElementById("btnResetForm");
  var statusText = document.getElementById("statusText");

  var searchInput = document.getElementById("searchInput");
  var filterCategorySelect = document.getElementById("filterCategorySelect");
  var searchCount = document.getElementById("searchCount");

  var inventoryTableBody = document.getElementById("inventoryTableBody");
  var inventoryTable = document.getElementById("inventoryTable");
  var tableHeaders = inventoryTable.querySelectorAll("thead th[data-sort-key]");

  var btnPrevPage = document.getElementById("btnPrevPage");
  var btnNextPage = document.getElementById("btnNextPage");
  var pageInfo = document.getElementById("pageInfo");

  var undoContainer = document.getElementById("undoContainer");
  var undoMessage = document.getElementById("undoMessage");
  var btnUndoDelete = document.getElementById("btnUndoDelete");

  var totalValueText = document.getElementById("totalValueText");
  var valueBreakdownBody = document.getElementById("valueBreakdownBody");

  var btnExportJson = document.getElementById("btnExportJson");
  var btnExportCsv = document.getElementById("btnExportCsv");
  var btnExportValueCsv = document.getElementById("btnExportValueCsv");
  var btnPrint = document.getElementById("btnPrint");

  var toastSuccess = document.getElementById("toastSuccess");
  var toastSuccessText = document.getElementById("toastSuccessText");
  var toastError = document.getElementById("toastError");
  var toastErrorText = document.getElementById("toastErrorText");
  var toastErrorClose = document.getElementById("toastErrorClose");
  var overlay = document.getElementById("overlay");

  var auditList = document.getElementById("auditList");

  var columnToggleInputs = document.querySelectorAll(".column-toggles input[type='checkbox']");

  var products = [];
  var isBusy = false;
  var currentEditId = null;
  var currentSortKey = "name";
  var currentSortDirection = "asc";
  var currentPage = 1;
  var pageSize = 10;
  var recentHighlightId = null;
  var recentHighlightTimeoutId = null;
  var lastDeletedEntry = null;
  var lastDeletedTimeoutId = null;
  var auditLog = [];

  var categories = ["Electronics", "Clothing", "Groceries", "Books", "Home"];

  var currencyFormatter;
  try {
    currencyFormatter = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    });
  } catch (e) {
    currencyFormatter = {
      format: function (value) {
        var fixed = typeof value === "number" ? value.toFixed(2) : String(value);
        return "₹" + fixed;
      }
    };
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
    btnAddProduct.disabled = active;
    btnResetForm.disabled = active;
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

  function clearFieldErrors() {
    productNameError.textContent = "";
    categoryError.textContent = "";
    priceError.textContent = "";
    stockError.textContent = "";
  }

  function populateCategories() {
    var i;
    while (categorySelect.options.length > 1) {
      categorySelect.remove(1);
    }
    while (filterCategorySelect.options.length > 1) {
      filterCategorySelect.remove(1);
    }
    for (i = 0; i < categories.length; i++) {
      var category = categories[i];
      var optionForm = document.createElement("option");
      optionForm.value = category;
      optionForm.textContent = category;
      categorySelect.appendChild(optionForm);

      var optionFilter = document.createElement("option");
      optionFilter.value = category;
      optionFilter.textContent = category;
      filterCategorySelect.appendChild(optionFilter);
    }
  }

  function generateProductId() {
    var id;
    var exists;
    var attempt = 0;
    do {
      attempt += 1;
      var randomPart = Math.floor(Math.random() * 9000) + 1000;
      id = "P" + Date.now().toString().slice(-6) + String(randomPart);
      exists = false;
      for (var i = 0; i < products.length; i++) {
        if (products[i].id === id) {
          exists = true;
          break;
        }
      }
    } while (exists && attempt < 5);
    return id;
  }

  function validateProductForm() {
    clearFieldErrors();
    var valid = true;

    var nameValue = productNameInput.value ? String(productNameInput.value).trim() : "";
    var categoryValue = categorySelect.value;
    var priceValue = priceInput.value ? String(priceInput.value).trim() : "";
    var stockValue = stockInput.value ? String(stockInput.value).trim() : "";

    if (!nameValue) {
      valid = false;
      productNameError.textContent = "Name is required";
    } else if (nameValue.length < 3 || nameValue.length > 50) {
      valid = false;
      productNameError.textContent = "Name must be between 3 and 50 characters";
    } else {
      var lowerName = nameValue.toLowerCase();
      for (var i = 0; i < products.length; i++) {
        if (products[i].category === categoryValue && products[i].name.toLowerCase() === lowerName) {
          valid = false;
          productNameError.textContent = "Name must be unique within the selected category";
          break;
        }
      }
    }

    if (!categoryValue) {
      valid = false;
      categoryError.textContent = "Category is required";
    } else if (categories.indexOf(categoryValue) === -1) {
      valid = false;
      categoryError.textContent = "Category must be selected from the list";
    }

    if (!priceValue) {
      valid = false;
      priceError.textContent = "Price is required";
    } else if (!/^\d+(\.\d{1,2})?$/.test(priceValue)) {
      valid = false;
      priceError.textContent = "Price must be a number with up to 2 decimals";
    } else {
      var priceNumber = parseFloat(priceValue);
      if (isNaN(priceNumber) || priceNumber <= 0) {
        valid = false;
        priceError.textContent = "Price must be greater than 0";
      }
    }

    if (!stockValue) {
      valid = false;
      stockError.textContent = "Stock is required";
    } else if (!/^\d+$/.test(stockValue)) {
      valid = false;
      stockError.textContent = "Stock must be a whole number";
    } else {
      var stockNumber = parseInt(stockValue, 10);
      if (isNaN(stockNumber) || stockNumber < 0) {
        valid = false;
        stockError.textContent = "Stock cannot be negative";
      }
    }

    return valid;
  }

  function getFormProduct() {
    var nameValue = sanitize(productNameInput.value.trim());
    var categoryValue = categorySelect.value;
    var priceNumber = parseFloat(priceInput.value);
    var stockNumber = parseInt(stockInput.value, 10);
    return {
      id: generateProductId(),
      name: nameValue,
      category: categoryValue,
      price: priceNumber,
      stock: stockNumber,
      createdAt: Date.now(),
      updatedAt: null
    };
  }

  function resetForm() {
    productForm.reset();
    clearFieldErrors();
    statusText.textContent = "";
    productNameInput.focus();
  }

  function showEmptyRow() {
    while (inventoryTableBody.firstChild) {
      inventoryTableBody.removeChild(inventoryTableBody.firstChild);
    }
    var tr = document.createElement("tr");
    tr.className = "row-empty";
    var td = document.createElement("td");
    td.colSpan = 6;
    td.textContent = "No products found";
    tr.appendChild(td);
    inventoryTableBody.appendChild(tr);
  }

  function getStockStatus(stock) {
    if (stock <= 0) {
      return "out";
    }
    if (stock < 10) {
      return "low";
    }
    return "ok";
  }

  function buildDisplayRow(product) {
    var tr = document.createElement("tr");
    tr.setAttribute("data-id", product.id);

    if (recentHighlightId === product.id) {
      tr.classList.add("row-highlight");
    }

    var tdId = document.createElement("td");
    tdId.textContent = product.id;
    tdId.setAttribute("data-column", "id");

    var tdName = document.createElement("td");
    tdName.textContent = product.name;
    tdName.setAttribute("data-column", "name");

    var tdCategory = document.createElement("td");
    tdCategory.textContent = product.category;
    tdCategory.setAttribute("data-column", "category");

    var tdPrice = document.createElement("td");
    tdPrice.textContent = currencyFormatter.format(product.price);
    tdPrice.setAttribute("data-column", "price");

    var tdStock = document.createElement("td");
    tdStock.setAttribute("data-column", "stock");
    var status = getStockStatus(product.stock);
    var badge = document.createElement("span");
    badge.className = "stock-badge";
    var icon = document.createElement("span");
    icon.className = "stock-badge-icon";
    var label = document.createElement("span");
    if (status === "ok") {
      badge.classList.add("stock-ok");
      icon.textContent = "●";
      label.textContent = product.stock + " in stock";
    } else if (status === "low") {
      badge.classList.add("stock-low");
      icon.textContent = "●";
      label.textContent = product.stock + " low stock";
    } else {
      badge.classList.add("stock-out");
      icon.textContent = "●";
      label.textContent = "Out of stock";
    }
    badge.appendChild(icon);
    badge.appendChild(label);
    tdStock.appendChild(badge);

    var tdActions = document.createElement("td");
    tdActions.setAttribute("data-column", "actions");
    var btnEdit = document.createElement("button");
    btnEdit.type = "button";
    btnEdit.className = "btn btn-small";
    btnEdit.textContent = "Edit";
    btnEdit.setAttribute("data-action", "edit");
    btnEdit.setAttribute("data-id", product.id);

    var btnDelete = document.createElement("button");
    btnDelete.type = "button";
    btnDelete.className = "btn btn-small btn-secondary";
    btnDelete.textContent = "Delete";
    btnDelete.setAttribute("data-action", "delete");
    btnDelete.setAttribute("data-id", product.id);

    tdActions.appendChild(btnEdit);
    tdActions.appendChild(btnDelete);

    tr.appendChild(tdId);
    tr.appendChild(tdName);
    tr.appendChild(tdCategory);
    tr.appendChild(tdPrice);
    tr.appendChild(tdStock);
    tr.appendChild(tdActions);

    return tr;
  }

  function findProductIndexById(id) {
    for (var i = 0; i < products.length; i++) {
      if (products[i].id === id) {
        return i;
      }
    }
    return -1;
  }

  function persistInventory() {
    try {
      var json = JSON.stringify(products);
      window.localStorage.setItem("inventoryData", json);
    } catch (e) {
      console.error(e);
      showErrorToast("Unable to persist inventory data locally");
    }
  }

  function loadFromStorage() {
    try {
      var stored = window.localStorage.getItem("inventoryData");
      if (!stored) {
        return false;
      }
      var parsed = JSON.parse(stored);
      if (!parsed || Object.prototype.toString.call(parsed) !== "[object Array]") {
        return false;
      }
      var loaded = [];
      for (var i = 0; i < parsed.length; i++) {
        var item = parsed[i];
        if (!item) {
          continue;
        }
        var id = item.id ? String(item.id) : "";
        var name = item.name ? String(item.name).trim() : "";
        var category = item.category ? String(item.category) : "";
        var price = parseFloat(item.price);
        var stock = parseInt(item.stock, 10);
        if (!id) {
          continue;
        }
        if (!name || name.length < 3 || name.length > 50) {
          continue;
        }
        if (categories.indexOf(category) === -1) {
          continue;
        }
        if (isNaN(price) || price <= 0) {
          continue;
        }
        if (isNaN(stock) || stock < 0) {
          continue;
        }
        loaded.push({
          id: id,
          name: sanitize(name),
          category: category,
          price: price,
          stock: stock,
          createdAt: item.createdAt || Date.now(),
          updatedAt: item.updatedAt || null
        });
      }
      products = loaded;
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  function renderInventoryTable(filtered) {
    var list = filtered || products.slice();
    if (!list.length) {
      searchCount.textContent = "0 products";
      showEmptyRow();
      return;
    }

    var total = list.length;
    var totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (currentPage > totalPages) {
      currentPage = totalPages;
    }
    var startIndex = (currentPage - 1) * pageSize;
    var endIndex = Math.min(startIndex + pageSize, total);
    var pageItems = list.slice(startIndex, endIndex);

    searchCount.textContent = total + (total === 1 ? " product" : " products");

    while (inventoryTableBody.firstChild) {
      inventoryTableBody.removeChild(inventoryTableBody.firstChild);
    }
    for (var i = 0; i < pageItems.length; i++) {
      var row = buildDisplayRow(pageItems[i]);
      inventoryTableBody.appendChild(row);
    }

    pageInfo.textContent = "Page " + currentPage + " of " + totalPages;
    btnPrevPage.disabled = currentPage <= 1;
    btnNextPage.disabled = currentPage >= totalPages;
    updateColumnVisibility();
  }

  function getFilteredAndSortedProducts() {
    var query = searchInput.value ? String(searchInput.value).trim().toLowerCase() : "";
    var categoryFilter = filterCategorySelect.value;

    var filtered = [];
    for (var i = 0; i < products.length; i++) {
      var product = products[i];
      if (categoryFilter !== "all" && product.category !== categoryFilter) {
        continue;
      }
      if (query) {
        var nameMatch = product.name.toLowerCase().indexOf(query) !== -1;
        var idMatch = product.id.toLowerCase().indexOf(query) !== -1;
        if (!nameMatch && !idMatch) {
          continue;
        }
      }
      filtered.push(product);
    }

    var key = currentSortKey;
    var direction = currentSortDirection === "asc" ? 1 : -1;
    filtered.sort(function (a, b) {
      var av;
      var bv;
      if (key === "price" || key === "stock") {
        av = a[key];
        bv = b[key];
      } else if (key === "id") {
        av = a.id.toLowerCase();
        bv = b.id.toLowerCase();
      } else if (key === "name") {
        av = a.name.toLowerCase();
        bv = b.name.toLowerCase();
      } else if (key === "category") {
        av = a.category.toLowerCase();
        bv = b.category.toLowerCase();
      } else {
        av = 0;
        bv = 0;
      }
      if (av < bv) {
        return -1 * direction;
      }
      if (av > bv) {
        return 1 * direction;
      }
      return 0;
    });

    return filtered;
  }

  function refreshInventoryView() {
    var list = getFilteredAndSortedProducts();
    renderInventoryTable(list);
    updateInventoryValue();
  }

  function updateSortIndicators() {
    var i;
    for (i = 0; i < tableHeaders.length; i++) {
      var th = tableHeaders[i];
      var key = th.getAttribute("data-sort-key");
      if (key === currentSortKey) {
        var ariaSort = currentSortDirection === "asc" ? "ascending" : "descending";
        th.setAttribute("aria-sort", ariaSort);
      } else {
        th.removeAttribute("aria-sort");
      }
    }
  }

  function changeSort(key) {
    if (!key) {
      return;
    }
    if (currentSortKey === key) {
      currentSortDirection = currentSortDirection === "asc" ? "desc" : "asc";
    } else {
      currentSortKey = key;
      currentSortDirection = "asc";
    }
    updateSortIndicators();
    refreshInventoryView();
  }

  function updateColumnVisibility() {
    var visibility = {};
    var i;
    for (i = 0; i < columnToggleInputs.length; i++) {
      var input = columnToggleInputs[i];
      var column = input.getAttribute("data-column");
      visibility[column] = input.checked;
    }

    var headerCells = inventoryTable.querySelectorAll("thead th");
    for (i = 0; i < headerCells.length; i++) {
      var th = headerCells[i];
      var columnName = th.getAttribute("data-column");
      if (columnName && visibility.hasOwnProperty(columnName)) {
        if (visibility[columnName]) {
          th.classList.remove("col-hidden");
        } else {
          th.classList.add("col-hidden");
        }
      }
    }

    var rows = inventoryTableBody.querySelectorAll("tr");
    for (var r = 0; r < rows.length; r++) {
      var row = rows[r];
      var cells = row.querySelectorAll("td");
      for (var c = 0; c < cells.length; c++) {
        var cell = cells[c];
        var colName = cell.getAttribute("data-column");
        if (colName && visibility.hasOwnProperty(colName)) {
          if (visibility[colName]) {
            cell.classList.remove("col-hidden");
          } else {
            cell.classList.add("col-hidden");
          }
        }
      }
    }
  }

  function calculateInventoryValue() {
    var total = 0;
    var byCategory = {};
    var i;
    for (i = 0; i < products.length; i++) {
      var product = products[i];
      var value = product.price * product.stock;
      total += value;
      if (!byCategory[product.category]) {
        byCategory[product.category] = 0;
      }
      byCategory[product.category] += value;
    }
    return {
      total: total,
      byCategory: byCategory
    };
  }

  function updateInventoryValue() {
    var result = calculateInventoryValue();
    totalValueText.textContent = "Total value: " + currencyFormatter.format(result.total);

    while (valueBreakdownBody.firstChild) {
      valueBreakdownBody.removeChild(valueBreakdownBody.firstChild);
    }
    var categoriesKeys = Object.keys(result.byCategory).sort();
    if (!categoriesKeys.length) {
      var trEmpty = document.createElement("tr");
      var tdEmpty = document.createElement("td");
      tdEmpty.colSpan = 2;
      tdEmpty.textContent = "No categories";
      trEmpty.appendChild(tdEmpty);
      valueBreakdownBody.appendChild(trEmpty);
      return;
    }
    for (var i = 0; i < categoriesKeys.length; i++) {
      var category = categoriesKeys[i];
      var value = result.byCategory[category];
      var tr = document.createElement("tr");
      var tdCategory = document.createElement("td");
      tdCategory.textContent = category;
      var tdValue = document.createElement("td");
      tdValue.textContent = currencyFormatter.format(value);
      tr.appendChild(tdCategory);
      tr.appendChild(tdValue);
      valueBreakdownBody.appendChild(tr);
    }
  }

  function addAuditEntry(productId, oldPrice, newPrice, oldStock, newStock) {
    var changes = [];
    if (oldPrice !== newPrice) {
      changes.push("price " + currencyFormatter.format(oldPrice) + " → " + currencyFormatter.format(newPrice));
    }
    if (oldStock !== newStock) {
      changes.push("stock " + oldStock + " → " + newStock);
    }
    if (!changes.length) {
      return;
    }
    var entry = {
      id: productId,
      timestamp: new Date().toLocaleString(),
      description: changes.join(", ")
    };
    auditLog.unshift(entry);
    if (auditLog.length > 20) {
      auditLog.pop();
    }
    renderAuditLog();
  }

  function renderAuditLog() {
    while (auditList.firstChild) {
      auditList.removeChild(auditList.firstChild);
    }
    if (!auditLog.length) {
      var liEmpty = document.createElement("li");
      liEmpty.textContent = "No changes recorded yet.";
      auditList.appendChild(liEmpty);
      return;
    }
    for (var i = 0; i < auditLog.length; i++) {
      var entry = auditLog[i];
      var li = document.createElement("li");
      li.textContent = "[" + entry.timestamp + "] " + entry.id + ": " + entry.description;
      auditList.appendChild(li);
    }
  }

  function clearUndoState() {
    lastDeletedEntry = null;
    undoMessage.textContent = "";
    undoContainer.style.display = "none";
    if (lastDeletedTimeoutId) {
      clearTimeout(lastDeletedTimeoutId);
      lastDeletedTimeoutId = null;
    }
  }

  function scheduleRowHighlight(id) {
    recentHighlightId = id;
    if (recentHighlightTimeoutId) {
      clearTimeout(recentHighlightTimeoutId);
    }
    recentHighlightTimeoutId = setTimeout(function () {
      recentHighlightId = null;
      recentHighlightTimeoutId = null;
      refreshInventoryView();
    }, 2000);
  }

  function handleFormSubmit(event) {
    event.preventDefault();
    if (isBusy) {
      return;
    }
    if (!validateProductForm()) {
      return;
    }
    var product = getFormProduct();
    products.push(product);
    persistInventory();
    statusText.textContent = "Product " + product.id + " added";
    showSuccessToast("Product added successfully");
    scheduleRowHighlight(product.id);
    refreshInventoryView();
    resetForm();
  }

  function enterEditMode(row, product) {
    currentEditId = product.id;

    var priceCell = row.querySelector("td[data-column='price']");
    var stockCell = row.querySelector("td[data-column='stock']");
    var actionsCell = row.querySelector("td[data-column='actions']");

    if (!priceCell || !stockCell || !actionsCell) {
      return;
    }

    while (priceCell.firstChild) {
      priceCell.removeChild(priceCell.firstChild);
    }
    while (stockCell.firstChild) {
      stockCell.removeChild(stockCell.firstChild);
    }
    while (actionsCell.firstChild) {
      actionsCell.removeChild(actionsCell.firstChild);
    }

    var priceInputInline = document.createElement("input");
    priceInputInline.type = "number";
    priceInputInline.min = "0.01";
    priceInputInline.step = "0.01";
    priceInputInline.value = product.price.toFixed(2);
    priceInputInline.className = "inline-input";

    var stockInputInline = document.createElement("input");
    stockInputInline.type = "number";
    stockInputInline.min = "0";
    stockInputInline.step = "1";
    stockInputInline.value = String(product.stock);
    stockInputInline.className = "inline-input";

    priceCell.appendChild(priceInputInline);
    stockCell.appendChild(stockInputInline);

    var btnSave = document.createElement("button");
    btnSave.type = "button";
    btnSave.className = "btn btn-small";
    btnSave.textContent = "Save";
    btnSave.setAttribute("data-action", "save");
    btnSave.setAttribute("data-id", product.id);

    var btnCancel = document.createElement("button");
    btnCancel.type = "button";
    btnCancel.className = "btn btn-small btn-secondary";
    btnCancel.textContent = "Cancel";
    btnCancel.setAttribute("data-action", "cancel");
    btnCancel.setAttribute("data-id", product.id);

    actionsCell.appendChild(btnSave);
    actionsCell.appendChild(btnCancel);
  }

  function exitEditMode() {
    currentEditId = null;
    refreshInventoryView();
  }

  function handleInlineSave(row, product) {
    var priceCell = row.querySelector("td[data-column='price']");
    var stockCell = row.querySelector("td[data-column='stock']");
    if (!priceCell || !stockCell) {
      return;
    }
    var priceInputInline = priceCell.querySelector("input");
    var stockInputInline = stockCell.querySelector("input");
    if (!priceInputInline || !stockInputInline) {
      return;
    }

    priceInputInline.classList.remove("inline-input-error");
    stockInputInline.classList.remove("inline-input-error");

    var priceValue = priceInputInline.value ? String(priceInputInline.value).trim() : "";
    var stockValue = stockInputInline.value ? String(stockInputInline.value).trim() : "";

    var valid = true;

    if (!priceValue) {
      valid = false;
      priceInputInline.classList.add("inline-input-error");
      showErrorToast("Price is required");
    } else if (!/^\d+(\.\d{1,2})?$/.test(priceValue)) {
      valid = false;
      priceInputInline.classList.add("inline-input-error");
      showErrorToast("Price must be a number with up to 2 decimals");
    } else {
      var priceNumber = parseFloat(priceValue);
      if (isNaN(priceNumber) || priceNumber <= 0) {
        valid = false;
        priceInputInline.classList.add("inline-input-error");
        showErrorToast("Price must be greater than 0");
      }
    }

    if (!stockValue) {
      valid = false;
      stockInputInline.classList.add("inline-input-error");
      showErrorToast("Stock is required");
    } else if (!/^\d+$/.test(stockValue)) {
      valid = false;
      stockInputInline.classList.add("inline-input-error");
      showErrorToast("Stock must be a whole number");
    } else {
      var stockNumber = parseInt(stockValue, 10);
      if (isNaN(stockNumber) || stockNumber < 0) {
        valid = false;
        stockInputInline.classList.add("inline-input-error");
        showErrorToast("Stock cannot be negative");
      }
    }

    if (!valid) {
      return;
    }

    var newPrice = parseFloat(priceValue);
    var newStock = parseInt(stockValue, 10);

    var index = findProductIndexById(product.id);
    if (index === -1) {
      showErrorToast("Product not found");
      exitEditMode();
      return;
    }

    var oldPrice = products[index].price;
    var oldStock = products[index].stock;

    products[index].price = newPrice;
    products[index].stock = newStock;
    products[index].updatedAt = Date.now();

    persistInventory();
    addAuditEntry(product.id, oldPrice, newPrice, oldStock, newStock);
    statusText.textContent = "Product " + product.id + " updated";
    showSuccessToast("Product updated successfully");
    scheduleRowHighlight(product.id);
    refreshInventoryView();
    exitEditMode();
  }

  function handleTableClick(event) {
    var target = event.target;
    if (target.tagName !== "BUTTON") {
      target = target.closest("button");
      if (!target) {
        return;
      }
    }
    var action = target.getAttribute("data-action");
    var id = target.getAttribute("data-id");
    if (!action || !id) {
      return;
    }

    if (action === "delete") {
      var confirmDelete = window.confirm("Are you sure you want to delete this product?");
      if (!confirmDelete) {
        return;
      }
      var index = findProductIndexById(id);
      if (index === -1) {
        showErrorToast("Product not found");
        return;
      }
      var deleted = products.splice(index, 1)[0];
      persistInventory();
      statusText.textContent = "Product " + id + " deleted";
      showSuccessToast("Product deleted");
      lastDeletedEntry = {
        product: deleted,
        index: index
      };
      undoMessage.textContent = "Product " + id + " deleted.";
      undoContainer.style.display = "flex";
      if (lastDeletedTimeoutId) {
        clearTimeout(lastDeletedTimeoutId);
      }
      lastDeletedTimeoutId = setTimeout(function () {
        clearUndoState();
      }, 10000);
      refreshInventoryView();
      if (currentEditId === id) {
        currentEditId = null;
      }
      return;
    }

    var row = target.closest("tr");
    if (!row) {
      return;
    }
    var indexProduct = findProductIndexById(id);
    if (indexProduct === -1) {
      showErrorToast("Product not found");
      return;
    }
    var product = products[indexProduct];

    if (action === "edit") {
      if (currentEditId && currentEditId !== id) {
        exitEditMode();
      }
      enterEditMode(row, product);
      return;
    }

    if (action === "save") {
      handleInlineSave(row, product);
      return;
    }

    if (action === "cancel") {
      exitEditMode();
      return;
    }
  }

  function handleUndoClick() {
    if (!lastDeletedEntry || !lastDeletedEntry.product) {
      return;
    }
    var product = lastDeletedEntry.product;
    var index = lastDeletedEntry.index;
    if (index < 0 || index > products.length) {
      index = products.length;
    }
    products.splice(index, 0, product);
    persistInventory();
    showSuccessToast("Deletion undone");
    scheduleRowHighlight(product.id);
    statusText.textContent = "Product " + product.id + " restored";
    clearUndoState();
    refreshInventoryView();
  }

  function exportJson() {
    try {
      var json = JSON.stringify(products, null, 2);
      var blob = new Blob([json], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "inventory-export.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccessToast("Inventory JSON exported");
    } catch (e) {
      console.error(e);
      showErrorToast("Unable to export JSON");
    }
  }

  function escapeCsvValue(value) {
    var text = String(value);
    if (text.indexOf('"') !== -1 || text.indexOf(",") !== -1 || text.indexOf("\n") !== -1) {
      return '"' + text.replace(/"/g, '""') + '"';
    }
    return text;
  }

  function exportCsv() {
    try {
      var lines = [];
      lines.push("id,name,category,price,stock");
      for (var i = 0; i < products.length; i++) {
        var p = products[i];
        var line =
          escapeCsvValue(p.id) +
          "," +
          escapeCsvValue(p.name) +
          "," +
          escapeCsvValue(p.category) +
          "," +
          String(p.price.toFixed(2)) +
          "," +
          String(p.stock);
        lines.push(line);
      }
      var csv = lines.join("\n");
      var blob = new Blob([csv], { type: "text/csv" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "inventory-export.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccessToast("Inventory CSV exported");
    } catch (e) {
      console.error(e);
      showErrorToast("Unable to export CSV");
    }
  }

  function exportValueCsv() {
    try {
      var result = calculateInventoryValue();
      var lines = [];
      lines.push("category,value");
      lines.push("All," + result.total.toFixed(2));
      var keys = Object.keys(result.byCategory).sort();
      for (var i = 0; i < keys.length; i++) {
        var category = keys[i];
        var value = result.byCategory[category];
        lines.push(escapeCsvValue(category) + "," + value.toFixed(2));
      }
      var csv = lines.join("\n");
      var blob = new Blob([csv], { type: "text/csv" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "inventory-value-summary.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccessToast("Inventory value CSV exported");
    } catch (e) {
      console.error(e);
      showErrorToast("Unable to export value CSV");
    }
  }

  function printInventory() {
    window.print();
  }

  function attachEvents() {
    productForm.addEventListener("submit", handleFormSubmit);
    btnResetForm.addEventListener("click", function () {
      resetForm();
    });

    productNameInput.addEventListener("input", validateProductForm);
    categorySelect.addEventListener("change", validateProductForm);
    priceInput.addEventListener("input", validateProductForm);
    stockInput.addEventListener("input", validateProductForm);

    searchInput.addEventListener("input", function () {
      currentPage = 1;
      refreshInventoryView();
    });
    filterCategorySelect.addEventListener("change", function () {
      currentPage = 1;
      refreshInventoryView();
    });

    btnPrevPage.addEventListener("click", function () {
      if (currentPage > 1) {
        currentPage -= 1;
        refreshInventoryView();
      }
    });

    btnNextPage.addEventListener("click", function () {
      currentPage += 1;
      refreshInventoryView();
    });

    inventoryTableBody.addEventListener("click", handleTableClick);
    btnUndoDelete.addEventListener("click", handleUndoClick);

    var i;
    for (i = 0; i < tableHeaders.length; i++) {
      (function (th) {
        var key = th.getAttribute("data-sort-key");
        th.addEventListener("click", function () {
          changeSort(key);
        });
        th.addEventListener("keydown", function (event) {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            changeSort(key);
          }
        });
      })(tableHeaders[i]);
    }

    for (i = 0; i < columnToggleInputs.length; i++) {
      columnToggleInputs[i].addEventListener("change", function () {
        updateColumnVisibility();
      });
    }

    btnExportJson.addEventListener("click", exportJson);
    btnExportCsv.addEventListener("click", exportCsv);
    btnExportValueCsv.addEventListener("click", exportValueCsv);
    btnPrint.addEventListener("click", printInventory);

    toastErrorClose.addEventListener("click", hideErrorToast);

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        hideErrorToast();
        if (currentEditId) {
          exitEditMode();
        }
      }
      if (event.ctrlKey && event.shiftKey && !event.altKey) {
        if (event.key === "N" || event.key === "n") {
          event.preventDefault();
          productNameInput.focus();
        } else if (event.key === "F" || event.key === "f") {
          event.preventDefault();
          searchInput.focus();
        } else if (event.key === "E" || event.key === "e") {
          event.preventDefault();
          exportJson();
        } else if (event.key === "P" || event.key === "p") {
          event.preventDefault();
          printInventory();
        }
      }
    });
  }

  function loadFromJsonWithRetry(attempt) {
    var maxAttempts = 3;
    setBusy(true);
    statusText.textContent = "Loading inventory (attempt " + attempt + " of " + maxAttempts + ")...";
    fetch("inventory.json", { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("HTTP status " + response.status);
        }
        return response.json();
      })
      .then(function (data) {
        if (!data || Object.prototype.toString.call(data) !== "[object Array]") {
          throw new Error("Invalid JSON format");
        }
        var loaded = [];
        for (var i = 0; i < data.length; i++) {
          var item = data[i];
          if (!item) {
            continue;
          }
          var id = item.id ? String(item.id) : "";
          var name = item.name ? String(item.name).trim() : "";
          var category = item.category ? String(item.category) : "";
          var price = parseFloat(item.price);
          var stock = parseInt(item.stock, 10);
          if (!id) {
            continue;
          }
          if (!name || name.length < 3 || name.length > 50) {
            continue;
          }
          if (categories.indexOf(category) === -1) {
            continue;
          }
          if (isNaN(price) || price <= 0) {
            continue;
          }
          if (isNaN(stock) || stock < 0) {
            continue;
          }
          loaded.push({
            id: id,
            name: sanitize(name),
            category: category,
            price: price,
            stock: stock,
            createdAt: Date.now(),
            updatedAt: null
          });
        }
        products = loaded;
        persistInventory();
        statusText.textContent = "Loaded " + products.length + " products from inventory.json";
        showSuccessToast("Inventory loaded");
        refreshInventoryView();
      })
      .catch(function (error) {
        console.error(error);
        if (attempt < maxAttempts) {
          statusText.textContent = "Retrying load (" + (attempt + 1) + " of " + maxAttempts + ")...";
          setTimeout(function () {
            loadFromJsonWithRetry(attempt + 1);
          }, 800);
        } else {
          products = [];
          showEmptyRow();
          searchCount.textContent = "0 products";
          statusText.textContent = "Unable to load inventory.json. Starting with empty inventory.";
          showErrorToast("Unable to load inventory.json. Starting with empty inventory.");
          updateInventoryValue();
        }
      })
      .then(function () {
        setBusy(false);
      });
  }

  function loadInventory() {
    var loaded = loadFromStorage();
    if (loaded) {
      statusText.textContent = "Loaded products from local storage";
      refreshInventoryView();
      return;
    }
    loadFromJsonWithRetry(1);
  }

  function init() {
    populateCategories();
    attachEvents();
    updateSortIndicators();
    renderAuditLog();
    loadInventory();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

