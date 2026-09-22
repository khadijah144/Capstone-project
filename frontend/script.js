const API_URL = "https://capstone-todo-api.fastapicloud.dev";

const taskInput = document.getElementById("taskInput");
const addButton = document.getElementById("addButton");

const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");
const taskCount = document.getElementById("taskCount");

const deleteModal = document.getElementById("deleteModal");
const cancelDelete = document.getElementById("cancelDelete");
const confirmDelete = document.getElementById("confirmDelete");

const notification = document.getElementById("notification");

let taskToDelete = null;


// ==============================
// LOAD TASKS
// ==============================

document.addEventListener("DOMContentLoaded", function () {
    loadTasks();
});


async function loadTasks() {

    try {

        const response = await fetch(API_URL + "/tasks");

        if (!response.ok) {
            throw new Error("Could not load tasks");
        }

        const tasks = await response.json();

        renderTasks(tasks);

    } catch (error) {

        console.error(error);

        showNotification("Could not connect to the server.");
    }
}


// ==============================
// DISPLAY TASKS
// ==============================

function renderTasks(tasks) {

    taskList.innerHTML = "";

    taskCount.textContent =
        tasks.length + (tasks.length === 1 ? " task" : " tasks");


    if (tasks.length === 0) {

        emptyState.style.display = "block";

        return;
    }


    emptyState.style.display = "none";


    tasks.forEach(function (task) {

        const card = createTaskCard(task);

        taskList.appendChild(card);

    });
}


// ==============================
// CREATE TASK CARD
// ==============================

function createTaskCard(task) {

    const card = document.createElement("div");

    card.className = "task-card";

    card.dataset.id = task.id;


    // Create main structure
    card.innerHTML = `
        <button
            class="check-btn ${task.is_done ? "completed" : ""}"
            title="Mark task as complete"
        >
            ${
                task.is_done
                    ? `
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2.5"
                        >
                            <path d="m5 12 4 4L19 6"></path>
                        </svg>
                    `
                    : ""
            }
        </button>

        <div class="task-content">

            <div class="task-title ${task.is_done ? "completed" : ""}">
                ${escapeHTML(task.title)}
            </div>

            <div class="task-id">
                Task #${task.id}
            </div>

        </div>

        <div class="task-actions">

            <button
                class="icon-btn edit"
                title="Edit task"
            >
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                >
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"></path>
                </svg>
            </button>

            <button
                class="icon-btn delete"
                title="Delete task"
            >
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                >
                    <path d="M4 7h16"></path>
                    <path d="M10 11v6"></path>
                    <path d="M14 11v6"></path>
                    <path d="M6 7l1 14h10l1-14"></path>
                    <path d="M9 7V4h6v3"></path>
                </svg>
            </button>

        </div>
    `;


    // Checkbox
    const checkButton = card.querySelector(".check-btn");

    checkButton.addEventListener("click", function () {

        toggleTask(task.id, task.is_done);

    });


    // Edit
    const editButton = card.querySelector(".edit");

    editButton.addEventListener("click", function () {

        editTask(task.id);

    });


    // Delete
    const deleteButton = card.querySelector(".delete");

    deleteButton.addEventListener("click", function () {

        openDeleteModal(task.id);

    });


    return card;
}


// ==============================
// ADD TASK
// ==============================

async function addTask() {

    const title = taskInput.value.trim();


    if (title === "") {

        showNotification("Write a task first.");

        taskInput.focus();

        return;
    }


    /*
        Your current FastAPI model requires an ID.

        Date.now() gives us a unique-ish number
        such as 1725961234567.
    */

    const task = {

        id: Date.now(),

        title: title,

        is_done: false
    };


    try {

        const response = await fetch(API_URL + "/tasks", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(task)

        });


        if (!response.ok) {

            throw new Error("Could not create task");

        }


        taskInput.value = "";

        await loadTasks();

        showNotification("Task added!");

        taskInput.focus();


    } catch (error) {

        console.error(error);

        showNotification("Could not add task.");
    }
}


// ==============================
// TOGGLE COMPLETE
// ==============================

async function toggleTask(id, currentStatus) {

    try {

        const response = await fetch(API_URL + "/tasks");

        const tasks = await response.json();

        const task = tasks.find(function (item) {

            return item.id === id;

        });


        if (!task) {

            showNotification("Task not found.");

            return;
        }


        const updatedTask = {

            id: task.id,

            title: task.title,

            is_done: !currentStatus

        };


        await updateTaskOnServer(id, updatedTask);

        await loadTasks();


    } catch (error) {

        console.error(error);

        showNotification("Could not update task.");
    }
}


// ==============================
// EDIT TASK
// ==============================

async function editTask(id) {

    try {

        const response = await fetch(API_URL + "/tasks");

        const tasks = await response.json();


        const task = tasks.find(function (item) {

            return item.id === id;

        });


        if (!task) {

            showNotification("Task not found.");

            return;
        }


        const card =
            document.querySelector(
                '.task-card[data-id="' + id + '"]'
            );


        card.className = "task-card edit-card";


        card.innerHTML = `
            <form class="edit-form">

                <input
                    class="edit-input"
                    type="text"
                    value="${escapeAttribute(task.title)}"
                    autocomplete="off"
                >

                <label class="status-toggle">

                    <input
                        class="edit-status"
                        type="checkbox"
                        ${task.is_done ? "checked" : ""}
                    >

                    Done

                </label>

                <button
                    type="submit"
                    class="save-btn"
                >
                    Save
                </button>

            </form>
        `;


        const form = card.querySelector(".edit-form");

        const input = card.querySelector(".edit-input");

        const status = card.querySelector(".edit-status");


        form.addEventListener("submit", function (event) {

            saveTask(event, id, input, status);

        });


        input.focus();

        input.select();


    } catch (error) {

        console.error(error);

        showNotification("Could not edit task.");
    }
}


// ==============================
// SAVE EDIT
// ==============================

async function saveTask(event, id, input, status) {

    event.preventDefault();


    const title = input.value.trim();


    if (title === "") {

        showNotification("Task cannot be empty.");

        input.focus();

        return;
    }


    const updatedTask = {

        id: id,

        title: title,

        is_done: status.checked

    };


    try {

        await updateTaskOnServer(id, updatedTask);

        await loadTasks();

        showNotification("Task updated!");


    } catch (error) {

        console.error(error);

        showNotification("Could not update task.");
    }
}


// ==============================
// UPDATE TASK
// ==============================

async function updateTaskOnServer(id, task) {

    const response = await fetch(
        API_URL + "/tasks/" + id,
        {
            method: "PUT",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(task)
        }
    );


    if (!response.ok) {

        throw new Error("Could not update task");

    }


    return response.json();
}


// ==============================
// DELETE MODAL
// ==============================

function openDeleteModal(id) {

    taskToDelete = id;

    deleteModal.classList.remove("hidden");
}


function closeDeleteModal() {

    taskToDelete = null;

    deleteModal.classList.add("hidden");
}


cancelDelete.addEventListener(
    "click",
    closeDeleteModal
);


confirmDelete.addEventListener(
    "click",
    async function () {

        if (taskToDelete === null) {

            return;

        }


        await deleteTask(taskToDelete);

        closeDeleteModal();

    }
);


// Clicking outside modal closes it
deleteModal.addEventListener(
    "click",
    function (event) {

        if (event.target === deleteModal) {

            closeDeleteModal();

        }

    }
);


// ==============================
// DELETE TASK
// ==============================

async function deleteTask(id) {

    try {

        const response = await fetch(
            API_URL + "/tasks/" + id,
            {
                method: "DELETE"
            }
        );


        if (!response.ok) {

            throw new Error("Could not delete task");

        }


        await loadTasks();

        showNotification("Task deleted!");


    } catch (error) {

        console.error(error);

        showNotification("Could not delete task.");
    }
}


// ==============================
// ADD BUTTON
// ==============================

addButton.addEventListener(
    "click",
    addTask
);


// Press Enter to add
taskInput.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Enter") {

            addTask();

        }

    }
);


// ==============================
// NOTIFICATION
// ==============================

let notificationTimeout;


function showNotification(message) {

    notification.textContent = message;

    notification.classList.add("show");


    clearTimeout(notificationTimeout);


    notificationTimeout = setTimeout(
        function () {

            notification.classList.remove("show");

        },
        2500
    );
}


// ==============================
// ESCAPE HTML
// ==============================

function escapeHTML(text) {

    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}


function escapeAttribute(text) {

    return text
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}