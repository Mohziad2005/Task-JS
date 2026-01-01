const addNew = document.getElementById("add");
const inputIcon = document.querySelector(".input-icon");
const inputEl = document.querySelector(".text-box");
const list = document.querySelector(".list");
const statusBtns = document.querySelectorAll(".status-btn");
const deleteDoneBtn = document.querySelectorAll(".delete")[0];
const deleteAllBtn = document.querySelectorAll(".delete")[1];

// according to the Guidelines (Input Validation), show error under input not in popup (new modal)
function showError(message) {
  const oldError = document.querySelector(".error-message");
  if (oldError) oldError.remove();
  const errorMessage = `<p class="error-message">${message}</p>`;
  inputIcon.insertAdjacentHTML("afterend", errorMessage);
}

function clearError() {
  const oldError = document.querySelector(".error-message");
  if (oldError) oldError.remove();
}

function updateEmptyState() {
  const hasItems = !!list.querySelector(".todo-item");
  const empty = list.querySelector(".empty-state");
  if (!hasItems && !empty) {
    list.insertAdjacentHTML(
      "beforeend",
      `<p class="empty-state" style="text-align:center;color:#999;margin:2rem 0">No tasks.</p>`
    );
  } else if (hasItems && empty) {
    empty.remove();
  }
}
// Input validation
function validate(text) {
  if (text === "") return "Task cannot be empty";
  if (text.length < 5) return "Task must be at least 5 characters long";
  if (!isNaN(text.charAt(0))) return "Task cannot start with a number";
  return "";
}

function createOverlay() {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  document.body.appendChild(overlay);
  return overlay;
}

function closeOverlay(overlay) {
  overlay.remove();
}
// Popup confirm for delete actions
function modalConfirm(
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel"
) {
  return new Promise((resolve) => {
    const overlay = createOverlay();
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.innerHTML = `
      <h3 class="modal-title">${title}</h3>
      <p class="modal-message">${message}</p>
      <div class="modal-actions">
        <button class="btn btn-primary">${confirmText}</button>
        <button class="btn btn-danger">${cancelText}</button>
      </div>
    `;
    overlay.appendChild(modal);

    const [okBtn, cancelBtn] = modal.querySelectorAll("button");

    function cleanup(val) {
      closeOverlay(overlay);
      resolve(val);
    }

    okBtn.addEventListener("click", () => cleanup(true));
    cancelBtn.addEventListener("click", () => cleanup(false));
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) cleanup(false);
    });
    document.addEventListener("keydown", function esc(e) {
      if (e.key === "Escape") {
        document.removeEventListener("keydown", esc);
        cleanup(false);
      }
    });
  });
}

function modalPrompt(
  title,
  value = "",
  saveText = "Save",
  cancelText = "Cancel"
) {
  return new Promise((resolve) => {
    const overlay = createOverlay();
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.innerHTML = `
      <h3 class="modal-title">${title}</h3>
      <input class="modal-input" type="text" value="${value.replace(
        /"/g,
        "&quot;"
      )}">
      <p class="modal-error" style="color:#ea3b3b;margin-top:.6rem;min-height:1.6rem"></p>
      <div class="modal-actions">
        <button class="btn btn-primary">${saveText}</button>
        <button class="btn btn-danger">${cancelText}</button>
      </div>
    `;
    overlay.appendChild(modal);

    const input = modal.querySelector(".modal-input");
    const errorEl = modal.querySelector(".modal-error");
    const [saveBtn, cancelBtn] = modal.querySelectorAll("button");
    input.focus();
    input.select();

    function setError(msg) {
      errorEl.textContent = msg || "";
    }

    function cleanup(val) {
      closeOverlay(overlay);
      resolve(val);
    }

    function trySave() {
      const next = input.value.trim();
      const err = validate(next);
      if (err) {
        setError(err);
        return;
      }
      cleanup(next);
    }

    saveBtn.addEventListener("click", trySave);
    cancelBtn.addEventListener("click", () => cleanup(null));
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) cleanup(null);
    });
    input.addEventListener("input", () => setError(""));

    function keyHandler(e) {
      if (e.key === "Enter") {
        trySave();
      } else if (e.key === "Escape") {
        document.removeEventListener("keydown", keyHandler);
        cleanup(null);
      }
    }
    document.addEventListener("keydown", keyHandler);
  });
}

addNew.addEventListener("click", () => {
  const newTodo = inputEl.value.trim();
  const err = validate(newTodo);
  if (err) {
    showError(err);
    return;
  }
  const todoItem = `
    <div class="todo-item">
      <p class="list-task">${newTodo}</p>
      <div class="checkers">
        <input class="list-checkbox" type="checkbox">
        <i class='bx bxs-pencil list-icon-pen'></i>
        <i class='bx bxs-trash-alt list-icon-trash'></i>
      </div>
    </div>
  `;
  list.insertAdjacentHTML("beforeend", todoItem);
  inputEl.value = "";
  clearError();
  updateEmptyState();
});

inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addNew.click();
});

inputEl.addEventListener("input", clearError);

list.addEventListener("click", async (e) => {
  if (e.target.classList.contains("list-checkbox")) {
    const item = e.target.closest(".todo-item");
    const text = item.querySelector(".list-task");
    if (e.target.checked) {
      text.style.textDecoration = "line-through";
      text.style.color = "#ea3b3b";
      item.style.background = "#fff2f2";
      item.dataset.done = "1";
    } else {
      text.style.textDecoration = "";
      text.style.color = "";
      item.style.background = "";
      delete item.dataset.done;
    }
    return;
  }

  if (e.target.classList.contains("list-icon-pen")) {
    const item = e.target.closest(".todo-item");
    const textEl = item.querySelector(".list-task");
    const current = textEl.textContent.trim();
    const next = await modalPrompt("Rename Task", current, "Save", "Cancel");
    if (next === null) return;
    textEl.textContent = next.trim();
    return;
  }

  if (e.target.classList.contains("list-icon-trash")) {
    const item = e.target.closest(".todo-item");
    const ok = await modalConfirm(
      "Delete Task",
      "Are you sure you want to delete this task?",
      "Confirm",
      "Cancel"
    );
    if (ok) {
      item.remove();
      updateEmptyState();
    }
    return;
  }
});

statusBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    statusBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const mode = btn.textContent.trim().toLowerCase();
    const items = list.querySelectorAll(".todo-item");
    items.forEach((it) => {
      const isDone = it.dataset.done === "1";
      if (mode === "all") it.style.display = "";
      else if (mode === "done") it.style.display = isDone ? "" : "none";
      else it.style.display = isDone ? "none" : "";
    });
  });
});

deleteDoneBtn.addEventListener("click", async () => {
  const done = list.querySelectorAll('.todo-item[data-done="1"]');
  if (!done.length) {
    await modalConfirm("Info", "There are no completed tasks.", "OK", "Close");
    return;
  }
  const ok = await modalConfirm(
    "Delete Done Tasks",
    "Are you sure you want to delete all completed tasks?",
    "Confirm",
    "Cancel"
  );
  if (ok) {
    done.forEach((el) => el.remove());
    updateEmptyState();
  }
});

deleteAllBtn.addEventListener("click", async () => {
  const items = list.querySelectorAll(".todo-item");
  if (!items.length) {
    await modalConfirm("Info", "No tasks to delete.", "OK", "Close");
    return;
  }
  const ok = await modalConfirm(
    "Delete All Tasks",
    "Are you sure you want to delete all tasks?",
    "Confirm",
    "Cancel"
  );
  if (ok) {
    items.forEach((el) => el.remove());
    updateEmptyState();
  }
});

updateEmptyState();