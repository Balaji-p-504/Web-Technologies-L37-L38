(function () {
  "use strict";

  var form = document.getElementById("form");
  var idInput = document.getElementById("studentId");
  var nameInput = document.getElementById("studentName");
  var deptInput = document.getElementById("studentDept");
  var marksInput = document.getElementById("studentMarks");
  var submitButton = document.getElementById("submitButton");
  var resetButton = document.getElementById("resetButton");
  var tableBody = document.getElementById("tableBody");
  var statusEl = document.getElementById("status");

  var students = [];
  var loaded = false;
  var loadError = false;
  var editingId = null;

  var localStudents = [
    { id: "S001", name: "Alice Johnson", department: "CSE", marks: 88 },
    { id: "S002", name: "Bob Smith", department: "ECE", marks: 75 },
    { id: "S003", name: "Charlie Lee", department: "MECH", marks: 92 }
  ];

  function showMessage(text, type) {
    statusEl.textContent = text || "";
    statusEl.className = "status";
    if (type) {
      statusEl.classList.add("status-" + type);
    }
  }

  function clearForm() {
    form.reset();
    editingId = null;
    submitButton.textContent = "Save";
  }

  function renderTable() {
    while (tableBody.firstChild) {
      tableBody.removeChild(tableBody.firstChild);
    }
    if (!students.length) {
      var emptyRow = document.createElement("tr");
      var emptyCell = document.createElement("td");
      emptyCell.colSpan = 5;
      emptyCell.textContent = "No students";
      emptyCell.className = "table-empty";
      emptyRow.appendChild(emptyCell);
      tableBody.appendChild(emptyRow);
      return;
    }
    for (var i = 0; i < students.length; i++) {
      var s = students[i];
      var row = document.createElement("tr");

      var idCell = document.createElement("td");
      idCell.textContent = s.id;

      var nameCell = document.createElement("td");
      nameCell.textContent = s.name;

      var deptCell = document.createElement("td");
      deptCell.textContent = s.department;

      var marksCell = document.createElement("td");
      marksCell.textContent = s.marks;

      var actionsCell = document.createElement("td");
      var editButton = document.createElement("button");
      var deleteButton = document.createElement("button");

      editButton.type = "button";
      deleteButton.type = "button";
      editButton.textContent = "Edit";
      deleteButton.textContent = "Delete";

      editButton.className = "btn btn-small";
      deleteButton.className = "btn btn-small btn-secondary";

      editButton.setAttribute("data-id", s.id);
      deleteButton.setAttribute("data-id", s.id);

      actionsCell.appendChild(editButton);
      actionsCell.appendChild(deleteButton);

      row.appendChild(idCell);
      row.appendChild(nameCell);
      row.appendChild(deptCell);
      row.appendChild(marksCell);
      row.appendChild(actionsCell);

      tableBody.appendChild(row);
    }
  }

  function apiRequest(action, payload) {
    return new Promise(function (resolve) {
      setTimeout(function () {
        var status = 200;
        var body;
        try {
          if (!loaded) {
            status = 500;
            body = { message: "Data not loaded" };
          } else if (action === "create") {
            var exists = students.some(function (s) {
              return s.id === payload.id;
            });
            if (exists) {
              status = 500;
              body = { message: "Student ID already exists" };
            } else {
              students.push(payload);
              body = { message: "Created", data: payload };
            }
          } else if (action === "update") {
            var found = false;
            for (var i = 0; i < students.length; i++) {
              if (students[i].id === payload.id) {
                students[i] = payload;
                found = true;
                break;
              }
            }
            if (!found) {
              status = 404;
              body = { message: "Student not found" };
            } else {
              body = { message: "Updated", data: payload };
            }
          } else if (action === "delete") {
            var index = -1;
            for (var j = 0; j < students.length; j++) {
              if (students[j].id === payload.id) {
                index = j;
                break;
              }
            }
            if (index === -1) {
              status = 404;
              body = { message: "Student not found" };
            } else {
              var removed = students.splice(index, 1)[0];
              body = { message: "Deleted", data: removed };
            }
          } else if (action === "read") {
            body = { message: "OK", data: students.slice() };
          } else {
            status = 500;
            body = { message: "Unknown action" };
          }
        } catch (e) {
          console.error(e);
          status = 500;
          body = { message: "Server error" };
        }
        resolve({
          ok: status >= 200 && status < 300,
          status: status,
          json: function () {
            return Promise.resolve(body);
          }
        });
      }, 200);
    });
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (loadError) {
      showMessage("Cannot save, data not loaded", "error");
      return;
    }
    var idValue = (idInput.value || "").trim();
    var nameValue = (nameInput.value || "").trim();
    var deptValue = (deptInput.value || "").trim();
    var marksValue = (marksInput.value || "").trim();

    if (!idValue || !nameValue || !deptValue || !marksValue) {
      showMessage("All fields are required", "error");
      return;
    }
    var marksNumber = Number(marksValue);
    if (!isFinite(marksNumber) || marksNumber < 0 || marksNumber > 100) {
      showMessage("Marks must be between 0 and 100", "error");
      return;
    }

    var student = {
      id: idValue,
      name: nameValue,
      department: deptValue,
      marks: marksNumber
    };

    if (editingId && editingId === idValue) {
      apiRequest("update", student)
        .then(function (response) {
          if (!response.ok) {
            if (response.status === 404) {
              showMessage("Student not found (404)", "error");
            } else if (response.status === 500) {
              showMessage("Unable to update student (500)", "error");
            } else {
              showMessage("Unexpected error " + response.status, "error");
            }
            return response.json();
          }
          return response.json().then(function () {
            renderTable();
            showMessage("Student updated successfully", "success");
            clearForm();
          });
        })
        .catch(function (error) {
          console.error(error);
          showMessage("Unable to update student", "error");
        });
    } else {
      apiRequest("create", student)
        .then(function (response) {
          if (!response.ok) {
            if (response.status === 500) {
              showMessage("Unable to add student (500)", "error");
            } else {
              showMessage("Unexpected error " + response.status, "error");
            }
            return response.json();
          }
          return response.json().then(function () {
            renderTable();
            showMessage("Student added successfully", "success");
            clearForm();
          });
        })
        .catch(function (error) {
          console.error(error);
          showMessage("Unable to add student", "error");
        });
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
    if (target.textContent === "Edit") {
      var student = students.find(function (s) {
        return s.id === id;
      });
      if (!student) {
        showMessage("Student not found (404)", "error");
        return;
      }
      idInput.value = student.id;
      nameInput.value = student.name;
      deptInput.value = student.department;
      marksInput.value = student.marks;
      editingId = student.id;
      submitButton.textContent = "Update";
      showMessage("Editing student " + student.id, "");
    } else if (target.textContent === "Delete") {
      apiRequest("delete", { id: id })
        .then(function (response) {
          if (!response.ok) {
            if (response.status === 404) {
              showMessage("Student not found (404)", "error");
            } else if (response.status === 500) {
              showMessage("Unable to delete student (500)", "error");
            } else {
              showMessage("Unexpected error " + response.status, "error");
            }
            return response.json();
          }
          return response.json().then(function () {
            renderTable();
            showMessage("Student deleted successfully", "success");
            if (editingId === id) {
              clearForm();
            }
          });
        })
        .catch(function (error) {
          console.error(error);
          showMessage("Unable to delete student", "error");
        });
    }
  }

  function loadStudents() {
    fetch("students.json", { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) {
          var error = new Error("HTTP " + response.status);
          error.status = response.status;
          throw error;
        }
        return response.json();
      })
      .then(function (data) {
        if (!Array.isArray(data)) {
          throw new Error("Invalid data");
        }
        students = data.slice();
        loaded = true;
        loadError = false;
        showMessage("", "");
        renderTable();
      })
      .catch(function (error) {
        console.error(error);
        if (window.location && window.location.protocol === "file:") {
          students = localStudents.slice();
          loaded = true;
          loadError = false;
          showMessage("", "");
          renderTable();
        } else {
          loadError = true;
          var code = error.status || 500;
          if (code === 404) {
            showMessage("Students file not found (404)", "error");
          } else if (code === 500) {
            showMessage("Server error while loading students (500)", "error");
          } else {
            showMessage("Unable to load students", "error");
          }
        }
      });
  }

  function init() {
    loadStudents();
    form.addEventListener("submit", handleSubmit);
    resetButton.addEventListener("click", function () {
      clearForm();
      showMessage("", "");
    });
    tableBody.addEventListener("click", handleTableClick);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

