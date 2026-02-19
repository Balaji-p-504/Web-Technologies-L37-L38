(function () {
  "use strict";

  var studentForm = document.getElementById("studentForm");
  var studentIdInput = document.getElementById("studentIdInput");
  var studentNameInput = document.getElementById("studentNameInput");
  var courseSelect = document.getElementById("courseSelect");
  var marksInput = document.getElementById("marksInput");

  var studentIdError = document.getElementById("studentIdError");
  var studentNameError = document.getElementById("studentNameError");
  var courseError = document.getElementById("courseError");
  var marksError = document.getElementById("marksError");

  var btnAddStudent = document.getElementById("btnAddStudent");
  var btnResetForm = document.getElementById("btnResetForm");
  var statusText = document.getElementById("statusText");

  var studentTableBody = document.getElementById("studentTableBody");

  var toastSuccess = document.getElementById("toastSuccess");
  var toastSuccessText = document.getElementById("toastSuccessText");
  var toastError = document.getElementById("toastError");
  var toastErrorText = document.getElementById("toastErrorText");
  var toastErrorClose = document.getElementById("toastErrorClose");
  var overlay = document.getElementById("overlay");

  var students = [];
  var isBusy = false;
  var currentEditId = null;

  var courseOptions = [
    "Computer Science",
    "Information Technology",
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology"
  ];

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
    btnAddStudent.disabled = active;
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
    studentIdError.textContent = "";
    studentNameError.textContent = "";
    courseError.textContent = "";
    marksError.textContent = "";
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

  function populateCourseOptions() {
    while (courseSelect.options.length > 1) {
      courseSelect.remove(1);
    }
    for (var i = 0; i < courseOptions.length; i++) {
      var option = document.createElement("option");
      option.value = courseOptions[i];
      option.textContent = courseOptions[i];
      courseSelect.appendChild(option);
    }
  }

  function findStudentIndexById(id) {
    var idNumber = parseInt(id, 10);
    if (isNaN(idNumber)) {
      return -1;
    }
    for (var i = 0; i < students.length; i++) {
      if (students[i].id === idNumber) {
        return i;
      }
    }
    return -1;
  }

  function validateForm() {
    clearFieldErrors();
    var valid = true;

    var idValue = studentIdInput.value ? String(studentIdInput.value).trim() : "";
    var nameValue = studentNameInput.value ? String(studentNameInput.value).trim() : "";
    var courseValue = courseSelect.value;
    var marksValue = marksInput.value ? String(marksInput.value).trim() : "";

    if (!idValue) {
      valid = false;
      studentIdError.textContent = "ID is required";
    } else if (!/^\d+$/.test(idValue)) {
      valid = false;
      studentIdError.textContent = "ID must be a whole number";
    } else {
      var idNumber = parseInt(idValue, 10);
      if (idNumber <= 0) {
        valid = false;
        studentIdError.textContent = "ID must be greater than 0";
      } else if (findStudentIndexById(idNumber) !== -1) {
        valid = false;
        studentIdError.textContent = "ID must be unique";
      }
    }

    if (!nameValue) {
      valid = false;
      studentNameError.textContent = "Name is required";
    } else if (nameValue.length < 2) {
      valid = false;
      studentNameError.textContent = "Name must be at least 2 characters";
    }

    if (!courseValue) {
      valid = false;
      courseError.textContent = "Course is required";
    } else if (courseOptions.indexOf(courseValue) === -1) {
      valid = false;
      courseError.textContent = "Course must be selected from the list";
    }

    if (!marksValue) {
      valid = false;
      marksError.textContent = "Marks are required";
    } else if (!/^\d+(\.\d+)?$/.test(marksValue)) {
      valid = false;
      marksError.textContent = "Marks must be numeric";
    } else {
      var marksNumber = parseFloat(marksValue);
      if (isNaN(marksNumber) || marksNumber < 0 || marksNumber > 100) {
        valid = false;
        marksError.textContent = "Marks must be between 0 and 100";
      }
    }

    return valid;
  }

  function getFormStudent() {
    var idNumber = parseInt(studentIdInput.value, 10);
    var nameValue = sanitize(studentNameInput.value.trim());
    var courseValue = courseSelect.value;
    var marksNumber = parseFloat(marksInput.value);
    return {
      id: idNumber,
      name: nameValue,
      course: courseValue,
      marks: marksNumber
    };
  }

  function clearTableBody() {
    while (studentTableBody.firstChild) {
      studentTableBody.removeChild(studentTableBody.firstChild);
    }
  }

  function showEmptyRow() {
    clearTableBody();
    var tr = document.createElement("tr");
    tr.className = "row-empty";
    var td = document.createElement("td");
    td.colSpan = 5;
    td.textContent = "No students found";
    tr.appendChild(td);
    studentTableBody.appendChild(tr);
  }

  function buildDisplayRow(student) {
    var tr = document.createElement("tr");
    tr.setAttribute("data-id", String(student.id));

    var tdId = document.createElement("td");
    tdId.textContent = String(student.id);

    var tdName = document.createElement("td");
    tdName.textContent = student.name;

    var tdCourse = document.createElement("td");
    tdCourse.textContent = student.course;
    tdCourse.className = "cell-course";

    var tdMarks = document.createElement("td");
    tdMarks.textContent = student.marks.toString();
    tdMarks.className = "cell-marks";
    if (student.marks >= 50) {
      tdMarks.classList.add("marks-pass");
    } else {
      tdMarks.classList.add("marks-fail");
    }

    var tdActions = document.createElement("td");
    var btnEdit = document.createElement("button");
    btnEdit.type = "button";
    btnEdit.className = "btn btn-small";
    btnEdit.textContent = "Edit";
    btnEdit.setAttribute("data-action", "edit");
    btnEdit.setAttribute("data-id", String(student.id));

    var btnDelete = document.createElement("button");
    btnDelete.type = "button";
    btnDelete.className = "btn btn-small btn-secondary";
    btnDelete.textContent = "Delete";
    btnDelete.setAttribute("data-action", "delete");
    btnDelete.setAttribute("data-id", String(student.id));

    tdActions.appendChild(btnEdit);
    tdActions.appendChild(btnDelete);

    tr.appendChild(tdId);
    tr.appendChild(tdName);
    tr.appendChild(tdCourse);
    tr.appendChild(tdMarks);
    tr.appendChild(tdActions);

    return tr;
  }

  function renderTable() {
    if (!students.length) {
      showEmptyRow();
      return;
    }
    clearTableBody();
    for (var i = 0; i < students.length; i++) {
      var row = buildDisplayRow(students[i]);
      studentTableBody.appendChild(row);
    }
  }

  function persistStudents() {
    try {
      var json = JSON.stringify(students);
      window.localStorage.setItem("studentsData", json);
    } catch (e) {
      console.error(e);
      showErrorToast("Unable to persist data locally");
    }
  }

  function loadFromStorage() {
    try {
      var stored = window.localStorage.getItem("studentsData");
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
        var id = parseInt(item.id, 10);
        var name = item.name ? String(item.name).trim() : "";
        var course = item.course ? String(item.course) : "";
        var marks = parseFloat(item.marks);
        if (isNaN(id) || id <= 0) {
          continue;
        }
        if (!name || name.length < 2) {
          continue;
        }
        if (courseOptions.indexOf(course) === -1) {
          continue;
        }
        if (isNaN(marks) || marks < 0 || marks > 100) {
          continue;
        }
        loaded.push({
          id: id,
          name: sanitize(name),
          course: course,
          marks: marks
        });
      }
      students = loaded;
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  function loadFromJsonFile() {
    setBusy(true);
    statusText.textContent = "Loading students...";
    fetch("students.json", { cache: "no-store" })
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
          var id = parseInt(item.id, 10);
          var name = item.name ? String(item.name).trim() : "";
          var course = item.course ? String(item.course) : "";
          var marks = parseFloat(item.marks);
          if (isNaN(id) || id <= 0) {
            continue;
          }
          if (!name || name.length < 2) {
            continue;
          }
          if (courseOptions.indexOf(course) === -1) {
            continue;
          }
          if (isNaN(marks) || marks < 0 || marks > 100) {
            continue;
          }
          loaded.push({
            id: id,
            name: sanitize(name),
            course: course,
            marks: marks
          });
        }
        students = loaded;
        renderTable();
        persistStudents();
        statusText.textContent = "Loaded " + students.length + " students";
        showSuccessToast("Students loaded from JSON");
      })
      .catch(function (error) {
        console.error(error);
        students = [];
        renderTable();
        statusText.textContent = "Unable to load students.json";
        showErrorToast("Unable to load students.json. Starting with empty list.");
      })
      .then(function () {
        setBusy(false);
      });
  }

  function loadStudents() {
    var loadedFromStorage = loadFromStorage();
    if (loadedFromStorage) {
      renderTable();
      statusText.textContent = "Loaded students from local storage";
      return;
    }
    loadFromJsonFile();
  }

  function resetForm() {
    studentForm.reset();
    clearFieldErrors();
    statusText.textContent = "";
  }

  function handleFormSubmit(event) {
    event.preventDefault();
    if (isBusy) {
      return;
    }
    if (!validateForm()) {
      return;
    }
    var student = getFormStudent();
    students.push(student);
    renderTable();
    persistStudents();
    showSuccessToast("Student added successfully");
    statusText.textContent = "Student " + student.id + " added";
    resetForm();
  }

  function enterEditMode(row, student) {
    currentEditId = student.id;

    var courseCell = row.querySelector(".cell-course");
    var marksCell = row.querySelector(".cell-marks");
    var actionsCell = row.lastElementChild;

    while (courseCell.firstChild) {
      courseCell.removeChild(courseCell.firstChild);
    }
    while (marksCell.firstChild) {
      marksCell.removeChild(marksCell.firstChild);
    }
    while (actionsCell.firstChild) {
      actionsCell.removeChild(actionsCell.firstChild);
    }

    var select = document.createElement("select");
    select.className = "inline-select";
    var i;
    for (i = 0; i < courseOptions.length; i++) {
      var option = document.createElement("option");
      option.value = courseOptions[i];
      option.textContent = courseOptions[i];
      if (courseOptions[i] === student.course) {
        option.selected = true;
      }
      select.appendChild(option);
    }
    courseCell.appendChild(select);

    var input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.max = "100";
    input.step = "1";
    input.value = student.marks.toString();
    input.className = "inline-input";
    marksCell.appendChild(input);

    var btnSave = document.createElement("button");
    btnSave.type = "button";
    btnSave.className = "btn btn-small";
    btnSave.textContent = "Save";
    btnSave.setAttribute("data-action", "save");
    btnSave.setAttribute("data-id", String(student.id));

    var btnCancel = document.createElement("button");
    btnCancel.type = "button";
    btnCancel.className = "btn btn-small btn-secondary";
    btnCancel.textContent = "Cancel";
    btnCancel.setAttribute("data-action", "cancel");
    btnCancel.setAttribute("data-id", String(student.id));

    actionsCell.appendChild(btnSave);
    actionsCell.appendChild(btnCancel);
  }

  function exitEditMode() {
    currentEditId = null;
    renderTable();
  }

  function handleInlineSave(row, student) {
    var courseCell = row.querySelector(".cell-course");
    var marksCell = row.querySelector(".cell-marks");
    if (!courseCell || !marksCell) {
      return;
    }
    var select = courseCell.querySelector("select");
    var input = marksCell.querySelector("input");
    if (!select || !input) {
      return;
    }

    var newCourse = select.value;
    var marksValue = input.value ? String(input.value).trim() : "";
    var valid = true;

    if (!newCourse || courseOptions.indexOf(newCourse) === -1) {
      valid = false;
      showErrorToast("Course must be selected from the list");
    }

    if (!marksValue) {
      valid = false;
      showErrorToast("Marks are required");
    } else if (!/^\d+(\.\d+)?$/.test(marksValue)) {
      valid = false;
      showErrorToast("Marks must be numeric");
    } else {
      var marksNumber = parseFloat(marksValue);
      if (isNaN(marksNumber) || marksNumber < 0 || marksNumber > 100) {
        valid = false;
        showErrorToast("Marks must be between 0 and 100");
      }
    }

    if (!valid) {
      return;
    }

    var marksNumberFinal = parseFloat(marksValue);
    var index = findStudentIndexById(student.id);
    if (index === -1) {
      showErrorToast("Student not found");
      exitEditMode();
      return;
    }
    students[index].course = newCourse;
    students[index].marks = marksNumberFinal;
    persistStudents();
    showSuccessToast("Student updated successfully");
    statusText.textContent = "Student " + student.id + " updated";
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
    var idValue = target.getAttribute("data-id");
    if (!action || !idValue) {
      return;
    }

    var idNumber = parseInt(idValue, 10);
    if (isNaN(idNumber)) {
      return;
    }

    if (action === "delete") {
      var confirmDelete = window.confirm("Are you sure you want to delete this student?");
      if (!confirmDelete) {
        return;
      }
      var index = findStudentIndexById(idNumber);
      if (index === -1) {
        showErrorToast("Student not found");
        return;
      }
      students.splice(index, 1);
      persistStudents();
      renderTable();
      showSuccessToast("Student deleted successfully");
      statusText.textContent = "Student " + idNumber + " deleted";
      if (currentEditId === idNumber) {
        currentEditId = null;
      }
      return;
    }

    var row = target.closest("tr");
    if (!row) {
      return;
    }
    var indexStudent = findStudentIndexById(idNumber);
    if (indexStudent === -1) {
      showErrorToast("Student not found");
      return;
    }
    var student = students[indexStudent];

    if (action === "edit") {
      if (currentEditId !== null && currentEditId !== idNumber) {
        exitEditMode();
      }
      enterEditMode(row, student);
      return;
    }

    if (action === "save") {
      handleInlineSave(row, student);
      return;
    }

    if (action === "cancel") {
      exitEditMode();
      return;
    }
  }

  function attachEvents() {
    studentForm.addEventListener("submit", handleFormSubmit);
    btnResetForm.addEventListener("click", function () {
      resetForm();
    });
    toastErrorClose.addEventListener("click", hideErrorToast);
    studentIdInput.addEventListener("input", validateForm);
    studentNameInput.addEventListener("input", validateForm);
    courseSelect.addEventListener("change", validateForm);
    marksInput.addEventListener("input", validateForm);
    studentTableBody.addEventListener("click", handleTableClick);
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        hideErrorToast();
        if (currentEditId !== null) {
          exitEditMode();
        }
      }
    });
  }

  function init() {
    populateCourseOptions();
    attachEvents();
    loadStudents();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

