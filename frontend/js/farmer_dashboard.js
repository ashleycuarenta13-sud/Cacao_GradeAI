
"use strict";

/* ========================================
   CACAOGRADEAI - FARMER DASHBOARD
======================================== */

const ACC_pageTitles = {
    overview: "Farmer Dashboard",
    classify: "Classify Cacao Beans",
    history: "Batch History",
    profile: "My Profile"
};

const ACC_storageKeys = {
    theme: "ACC_farmer_theme",
    batches: "ACC_farmer_batches"
};

const ACC_maxFileSize = 5 * 1024 * 1024;

let ACC_selectedFile = null;
let ACC_previewUrl = null;
let ACC_batches = ACC_loadBatches();

/* ========================================
   SAFE LOCAL STORAGE
======================================== */

function ACC_readStorage(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : value;
    } catch (error) {
        return fallback;
    }
}

function ACC_writeStorage(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (error) {
        return false;
    }
}

function ACC_loadBatches() {
    try {
        const saved = localStorage.getItem(ACC_storageKeys.batches);
        const parsed = saved ? JSON.parse(saved) : [];

        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
}

function ACC_saveBatches() {
    const saved = ACC_writeStorage(
        ACC_storageKeys.batches,
        JSON.stringify(ACC_batches)
    );

    if (!saved) {
        ACC_showMessage(
            "Your browser could not save the records. Check your browser storage settings.",
            true
        );
    }
}

/* ========================================
   DARK MODE
======================================== */

const ACC_themeToggle = document.getElementById("themeToggle");
const ACC_themeIcon = document.getElementById("themeIcon");

function ACC_applyTheme(theme) {
    const isDark = theme === "dark";

    document.body.classList.toggle("dark-mode", isDark);

    if (ACC_themeIcon) {
        ACC_themeIcon.textContent = isDark
            ? "light_mode"
            : "dark_mode";
    }

    if (ACC_themeToggle) {
        ACC_themeToggle.setAttribute(
            "aria-label",
            isDark ? "Enable light mode" : "Enable dark mode"
        );

        ACC_themeToggle.title = isDark
            ? "Switch to light mode"
            : "Switch to dark mode";
    }
}

const ACC_initialTheme = ACC_readStorage(
    ACC_storageKeys.theme,
    "light"
);

ACC_applyTheme(ACC_initialTheme);

if (ACC_themeToggle) {
    ACC_themeToggle.addEventListener("click", function () {
        const isDark = document.body.classList.contains("dark-mode");
        const nextTheme = isDark ? "light" : "dark";

        ACC_applyTheme(nextTheme);
        ACC_writeStorage(ACC_storageKeys.theme, nextTheme);
    });
}

/* ========================================
   PAGE NAVIGATION
======================================== */

const ACC_navLinks = document.querySelectorAll("[data-page]");
const ACC_pageSections = document.querySelectorAll(".page-section");
const ACC_pageTitle = document.getElementById("pageTitle");

function ACC_showPage(pageName) {
    const target = document.getElementById(pageName);

    if (!target || !ACC_pageTitles[pageName]) {
        return;
    }

    ACC_pageSections.forEach(function (section) {
        section.classList.toggle(
            "active",
            section.id === pageName
        );
    });

    ACC_navLinks.forEach(function (link) {
        const isActive = link.dataset.page === pageName;

        link.classList.toggle("active", isActive);
        link.setAttribute("aria-current", isActive ? "page" : "false");
    });

    if (ACC_pageTitle) {
        ACC_pageTitle.textContent = ACC_pageTitles[pageName];
    }

    document.body.classList.remove("sidebar-open");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

ACC_navLinks.forEach(function (link) {
    link.addEventListener("click", function () {
        ACC_showPage(link.dataset.page);
    });
});

document.querySelectorAll("[data-goto]").forEach(function (button) {
    button.addEventListener("click", function () {
        ACC_showPage(button.dataset.goto);
    });
});

/* ========================================
   MOBILE SIDEBAR
======================================== */

const ACC_menuToggle = document.getElementById("menuToggle");
const ACC_mobileOverlay = document.getElementById("mobileOverlay");

if (ACC_menuToggle) {
    ACC_menuToggle.addEventListener("click", function () {
        document.body.classList.toggle("sidebar-open");
    });
}

if (ACC_mobileOverlay) {
    ACC_mobileOverlay.addEventListener("click", function () {
        document.body.classList.remove("sidebar-open");
    });
}

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        document.body.classList.remove("sidebar-open");
    }
});

/* ========================================
   CURRENT DATE
======================================== */

const ACC_currentDate = document.getElementById("currentDate");

if (ACC_currentDate) {
    ACC_currentDate.textContent = new Intl.DateTimeFormat(
        "en-PH",
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    ).format(new Date());
}

/* ========================================
   IMAGE UPLOAD AND PREVIEW
======================================== */

const ACC_classifyForm = document.getElementById("classifyForm");
const ACC_photoInput = document.getElementById("cacaoPhoto");
const ACC_uploadZone = document.getElementById("uploadZone");
const ACC_previewContainer = document.getElementById("previewContainer");
const ACC_imagePreview = document.getElementById("imagePreview");
const ACC_fileName = document.getElementById("fileName");
const ACC_fileSize = document.getElementById("fileSize");
const ACC_removePhoto = document.getElementById("removePhoto");
const ACC_formMessage = document.getElementById("formMessage");

function ACC_showMessage(message, isError = false) {
    if (!ACC_formMessage) {
        return;
    }

    ACC_formMessage.textContent = message;
    ACC_formMessage.classList.toggle("error", isError);
}

function ACC_formatFileSize(bytes) {
    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function ACC_clearPreview() {
    if (ACC_previewUrl) {
        URL.revokeObjectURL(ACC_previewUrl);
        ACC_previewUrl = null;
    }

    ACC_selectedFile = null;

    if (ACC_photoInput) {
        ACC_photoInput.value = "";
    }

    if (ACC_imagePreview) {
        ACC_imagePreview.removeAttribute("src");
    }

    if (ACC_previewContainer) {
        ACC_previewContainer.hidden = true;
    }
}

function ACC_validateImage(file) {
    if (!file) {
        return "Please choose a cacao image first.";
    }

    const allowedTypes = ["image/jpeg", "image/png"];

    if (!allowedTypes.includes(file.type)) {
        return "Only JPG, JPEG, and PNG images are allowed.";
    }

    if (file.size > ACC_maxFileSize) {
        return "The image exceeds the 5 MB file-size limit.";
    }

    if (file.size === 0) {
        return "The selected image is empty.";
    }

    return "";
}

function ACC_setSelectedFile(file) {
    const validationMessage = ACC_validateImage(file);

    if (validationMessage) {
        ACC_clearPreview();
        ACC_showMessage(validationMessage, true);
        return;
    }

    ACC_clearPreview();

    ACC_selectedFile = file;
    ACC_previewUrl = URL.createObjectURL(file);

    ACC_imagePreview.src = ACC_previewUrl;
    ACC_fileName.textContent = file.name;
    ACC_fileSize.textContent = ACC_formatFileSize(file.size);
    ACC_previewContainer.hidden = false;

    ACC_showMessage("Image ready for submission.");
}

if (ACC_photoInput) {
    ACC_photoInput.addEventListener("change", function () {
        const file = ACC_photoInput.files[0];

        if (file) {
            ACC_setSelectedFile(file);
        }
    });
}

if (ACC_removePhoto) {
    ACC_removePhoto.addEventListener("click", function () {
        ACC_clearPreview();
        ACC_showMessage("Selected image removed.");
    });
}

/* Drag-and-drop image upload */

if (ACC_uploadZone) {
    ["dragenter", "dragover"].forEach(function (eventName) {
        ACC_uploadZone.addEventListener(eventName, function (event) {
            event.preventDefault();
            ACC_uploadZone.classList.add("dragging");
        });
    });

    ["dragleave", "drop"].forEach(function (eventName) {
        ACC_uploadZone.addEventListener(eventName, function (event) {
            event.preventDefault();
            ACC_uploadZone.classList.remove("dragging");
        });
    });

    ACC_uploadZone.addEventListener("drop", function (event) {
        const file = event.dataTransfer.files[0];

        if (file) {
            ACC_setSelectedFile(file);
        }
    });
}

/* ========================================
   CLASSIFICATION RESULT PANEL
======================================== */

const ACC_resultPlaceholder = document.getElementById("resultPlaceholder");
const ACC_resultBox = document.getElementById("resultBox");

function ACC_showPendingResult() {
    if (ACC_resultPlaceholder) {
        ACC_resultPlaceholder.hidden = false;
    }

    if (ACC_resultBox) {
        ACC_resultBox.hidden = true;
    }
}

/*
   This dashboard does not generate fake predictions.
   Connect this panel to your FastAPI classification endpoint
   when the backend is ready.
*/

function ACC_displayClassificationResult(result) {
    if (!result || !result.stage) {
        ACC_showPendingResult();
        return;
    }

    document.getElementById("resultStage").textContent = result.stage;
    document.getElementById("resultNotes").textContent =
        result.notes || "No additional quality notes were provided.";

    document.getElementById("resultConfidence").textContent =
        typeof result.confidence === "number"
            ? `${(result.confidence * 100).toFixed(1)}%`
            : "Unavailable";

    document.getElementById("confidenceBar").style.width =
        typeof result.confidence === "number"
            ? `${Math.min(100, Math.max(0, result.confidence * 100))}%`
            : "0%";

    document.getElementById("resultRecommendation").textContent =
        result.recommendation || "Follow your standard cacao quality-check procedure.";

    ACC_resultPlaceholder.hidden = true;
    ACC_resultBox.hidden = false;
}

/* ========================================
   SUBMIT BATCH RECORD
======================================== */

if (ACC_classifyForm) {
    ACC_classifyForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const nameInput = document.getElementById("batchName");
        const notesInput = document.getElementById("batchNotes");

        const batchName = nameInput.value.trim();
        const batchNotes = notesInput.value.trim();

        if (!batchName) {
            ACC_showMessage("Please enter a batch name.", true);
            nameInput.focus();
            return;
        }

        if (!ACC_selectedFile) {
            ACC_showMessage("Please choose a valid cacao photo.", true);
            return;
        }

        const validationMessage = ACC_validateImage(ACC_selectedFile);

        if (validationMessage) {
            ACC_showMessage(validationMessage, true);
            return;
        }

        const newBatch = {
            id: `ACC-${Date.now()}`,
            name: batchName,
            notes: batchNotes,
            fileName: ACC_selectedFile.name,
            status: "Pending",
            stage: null,
            confidence: null,
            createdAt: new Date().toISOString()
        };

        ACC_batches.unshift(newBatch);
        ACC_saveBatches();

        ACC_renderDashboard();
        ACC_renderHistory();
        ACC_showPendingResult();

        ACC_showMessage(
            "Batch record created. An actual AI result requires the backend classification API."
        );

        ACC_classifyForm.reset();
        ACC_clearPreview();

        ACC_showPage("history");
    });
}

/* ========================================
   RENDER DASHBOARD STATISTICS
======================================== */

function ACC_renderDashboard() {
    const totalBatches = document.getElementById("totalBatches");
    const totalClassified = document.getElementById("totalClassified");
    const totalPending = document.getElementById("totalPending");

    const classifiedCount = ACC_batches.filter(function (batch) {
        return batch.status === "Classified";
    }).length;

    const pendingCount = ACC_batches.filter(function (batch) {
        return batch.status === "Pending";
    }).length;

    totalBatches.textContent = ACC_batches.length;
    totalClassified.textContent = classifiedCount;
    totalPending.textContent = pendingCount;

    ACC_renderRecentHistory();
}

function ACC_formatDate(dateString) {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return new Intl.DateTimeFormat("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric"
    }).format(date);
}

function ACC_createRecordElement(batch) {
    const item = document.createElement("article");
    item.className = "record-item";

    const icon = document.createElement("div");
    icon.className = "record-icon";

    const iconSymbol = document.createElement("span");
    iconSymbol.className = "material-symbols-outlined";
    iconSymbol.textContent =
        batch.status === "Classified" ? "task_alt" : "schedule";

    icon.appendChild(iconSymbol);

    const info = document.createElement("div");
    info.className = "record-info";

    const title = document.createElement("strong");
    title.textContent = batch.name;

    const details = document.createElement("p");
    details.textContent =
        `${batch.fileName || "Image unavailable"} · ${ACC_formatDate(batch.createdAt)}`;

    info.append(title, details);

    const status = document.createElement("span");
    status.className = "record-status";
    status.textContent = batch.status || "Pending";

    item.append(icon, info, status);

    return item;
}

function ACC_renderRecentHistory() {
    const container = document.getElementById("recentHistory");

    if (!container) {
        return;
    }

    container.replaceChildren();

    if (ACC_batches.length === 0) {
        const empty = document.createElement("p");
        empty.className = "empty-records";
        empty.textContent = "No batch records yet. Submit a cacao batch to get started.";
        container.appendChild(empty);
        return;
    }

    ACC_batches.slice(0, 4).forEach(function (batch) {
        container.appendChild(ACC_createRecordElement(batch));
    });
}

/* ========================================
   BATCH HISTORY
======================================== */

function ACC_renderHistory() {
    const container = document.getElementById("historyList");

    if (!container) {
        return;
    }

    container.replaceChildren();

    if (ACC_batches.length === 0) {
        const empty = document.createElement("p");
        empty.className = "empty-records";
        empty.textContent = "No batch records found. Your submitted batches will appear here.";
        container.appendChild(empty);
        return;
    }

    ACC_batches.forEach(function (batch) {
        container.appendChild(ACC_createRecordElement(batch));
    });
}

const ACC_clearHistoryButton = document.getElementById("clearHistory");

if (ACC_clearHistoryButton) {
    ACC_clearHistoryButton.addEventListener("click", function () {
        if (ACC_batches.length === 0) {
            return;
        }

        const confirmed = window.confirm(
            "Are you sure you want to delete all locally saved batch records?"
        );

        if (!confirmed) {
            return;
        }

        ACC_batches = [];
        ACC_saveBatches();

        ACC_renderDashboard();
        ACC_renderHistory();
        ACC_showPendingResult();
    });
}

/* ========================================
   INITIALIZE DASHBOARD
======================================== */

ACC_renderDashboard();
ACC_renderHistory();
ACC_showPendingResult();
