
"use strict";

/* =========================================
   CACOGRADEAI - STAFF DASHBOARD
========================================= */

const ACC_staffPages = {
    overview: "Staff Dashboard",
    batches: "Batch Management",
    review: "Classification Review",
    history: "Batch History",
    profile: "My Profile"
};

/*
 * Uses the same localStorage key as the Farmer Dashboard.
 * This allows both dashboards to read records in the same
 * browser profile. It does not synchronize separate devices.
 */
const ACC_staffBatchKey = "ACC_farmer_batches";
const ACC_staffThemeKey = "ACC_staff_theme";

let ACC_staffBatches = ACC_staffLoadBatches();

/* =========================================
   STORAGE
========================================= */

function ACC_staffLoadBatches() {
    try {
        const saved = localStorage.getItem(ACC_staffBatchKey);
        const records = saved ? JSON.parse(saved) : [];

        return Array.isArray(records) ? records : [];
    } catch (error) {
        return [];
    }
}

function ACC_staffSaveBatches() {
    try {
        localStorage.setItem(
            ACC_staffBatchKey,
            JSON.stringify(ACC_staffBatches)
        );

        return true;
    } catch (error) {
        return false;
    }
}

/* =========================================
   DARK MODE
========================================= */

const ACC_staffThemeToggle =
    document.getElementById("staffThemeToggle");

const ACC_staffThemeIcon =
    document.getElementById("staffThemeIcon");

function ACC_staffApplyTheme(theme) {
    const isDark = theme === "dark";

    document.body.classList.toggle("staff-dark-mode", isDark);

    if (ACC_staffThemeIcon) {
        ACC_staffThemeIcon.textContent = isDark
            ? "light_mode"
            : "dark_mode";
    }

    if (ACC_staffThemeToggle) {
        ACC_staffThemeToggle.setAttribute(
            "aria-label",
            isDark ? "Enable light mode" : "Enable dark mode"
        );

        ACC_staffThemeToggle.title = isDark
            ? "Switch to light mode"
            : "Switch to dark mode";
    }
}

let ACC_staffSavedTheme = "light";

try {
    ACC_staffSavedTheme =
        localStorage.getItem(ACC_staffThemeKey) || "light";
} catch (error) {
    ACC_staffSavedTheme = "light";
}

ACC_staffApplyTheme(ACC_staffSavedTheme);

if (ACC_staffThemeToggle) {
    ACC_staffThemeToggle.addEventListener("click", function () {
        const isDark =
            document.body.classList.contains("staff-dark-mode");

        const nextTheme = isDark ? "light" : "dark";

        ACC_staffApplyTheme(nextTheme);

        try {
            localStorage.setItem(ACC_staffThemeKey, nextTheme);
        } catch (error) {
            // Theme still works for this page session.
        }
    });
}

/* =========================================
   NAVIGATION
========================================= */

const ACC_staffNavLinks =
    document.querySelectorAll(".staff-nav-link[data-page]");

const ACC_staffSections =
    document.querySelectorAll(".staff-page");

const ACC_staffPageTitle =
    document.getElementById("staffPageTitle");

function ACC_staffShowPage(pageName) {
    if (!ACC_staffPages[pageName]) {
        return;
    }

    ACC_staffSections.forEach(function (section) {
        section.classList.toggle(
            "active",
            section.id === pageName
        );
    });

    ACC_staffNavLinks.forEach(function (link) {
        const active = link.dataset.page === pageName;

        link.classList.toggle("active", active);

        if (active) {
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }
    });

    if (ACC_staffPageTitle) {
        ACC_staffPageTitle.textContent = ACC_staffPages[pageName];
    }

    document.body.classList.remove("staff-sidebar-open");

    if (pageName === "batches") {
        ACC_staffRenderBatchTable();
    }

    if (pageName === "review") {
        ACC_staffRenderReview();
    }

    if (pageName === "history") {
        ACC_staffRenderHistory();
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

ACC_staffNavLinks.forEach(function (link) {
    link.addEventListener("click", function () {
        ACC_staffShowPage(link.dataset.page);
    });
});

document.querySelectorAll("[data-goto]").forEach(function (button) {
    button.addEventListener("click", function () {
        ACC_staffShowPage(button.dataset.goto);
    });
});

/* =========================================
   MOBILE SIDEBAR
========================================= */

const ACC_staffMenuToggle =
    document.getElementById("staffMenuToggle");

const ACC_staffMobileOverlay =
    document.getElementById("staffMobileOverlay");

if (ACC_staffMenuToggle) {
    ACC_staffMenuToggle.addEventListener("click", function () {
        document.body.classList.toggle("staff-sidebar-open");
    });
}

if (ACC_staffMobileOverlay) {
    ACC_staffMobileOverlay.addEventListener("click", function () {
        document.body.classList.remove("staff-sidebar-open");
    });
}

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        document.body.classList.remove("staff-sidebar-open");
    }
});

/* =========================================
   DATE AND FORMATTING
========================================= */

const ACC_staffCurrentDate =
    document.getElementById("staffCurrentDate");

if (ACC_staffCurrentDate) {
    ACC_staffCurrentDate.textContent =
        new Intl.DateTimeFormat("en-PH", {
            month: "short",
            day: "numeric",
            year: "numeric"
        }).format(new Date());
}

function ACC_staffFormatDate(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return new Intl.DateTimeFormat("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric"
    }).format(date);
}

function ACC_staffGetStatus(batch) {
    if (batch.status === "Classified") {
        return "Classified";
    }

    if (batch.status === "Flagged") {
        return "Flagged";
    }

    return "Pending";
}

function ACC_staffGetStage(batch) {
    return batch.stage || "Not classified";
}

function ACC_staffCreateStatus(status) {
    const badge = document.createElement("span");

    badge.className = "staff-status";
    badge.textContent = status;

    if (status === "Classified") {
        badge.classList.add("classified");
    }

    if (status === "Flagged") {
        badge.classList.add("flagged");
    }

    return badge;
}

function ACC_staffCreateEmptyMessage(message) {
    const empty = document.createElement("p");

    empty.className = "staff-empty-state";
    empty.textContent = message;

    return empty;
}

/* =========================================
   DASHBOARD STATISTICS
========================================= */

function ACC_staffRenderOverview() {
    const total = ACC_staffBatches.length;

    const pending = ACC_staffBatches.filter(function (batch) {
        return ACC_staffGetStatus(batch) === "Pending";
    }).length;

    const classified = ACC_staffBatches.filter(function (batch) {
        return ACC_staffGetStatus(batch) === "Classified";
    }).length;

    const flagged = ACC_staffBatches.filter(function (batch) {
        return ACC_staffGetStatus(batch) === "Flagged";
    }).length;

    document.getElementById("staffTotalBatches").textContent = total;
    document.getElementById("staffPendingBatches").textContent = pending;
    document.getElementById("staffClassifiedBatches").textContent = classified;
    document.getElementById("staffQualityFlags").textContent = flagged;

    ACC_staffRenderRecent();
}

function ACC_staffCreateRecord(batch) {
    const item = document.createElement("article");
    item.className = "staff-record-item";

    const iconBox = document.createElement("div");
    iconBox.className = "staff-record-icon";

    const icon = document.createElement("span");
    icon.className = "material-symbols-outlined";

    const statusValue = ACC_staffGetStatus(batch);

    icon.textContent =
        statusValue === "Classified" ? "task_alt" :
        statusValue === "Flagged" ? "flag" :
        "schedule";

    iconBox.appendChild(icon);

    const info = document.createElement("div");
    info.className = "staff-record-info";

    const name = document.createElement("strong");
    name.textContent = batch.name || "Unnamed Batch";

    const detail = document.createElement("p");
    detail.textContent =
        `${ACC_staffGetStage(batch)} · ${ACC_staffFormatDate(batch.createdAt)}`;

    info.append(name, detail);

    item.append(
        iconBox,
        info,
        ACC_staffCreateStatus(statusValue)
    );

    return item;
}

function ACC_staffRenderRecent() {
    const container = document.getElementById("staffRecentList");

    container.replaceChildren();

    if (ACC_staffBatches.length === 0) {
        container.appendChild(
            ACC_staffCreateEmptyMessage(
                "No batch records are available yet."
            )
        );
        return;
    }

    ACC_staffBatches.slice(0, 5).forEach(function (batch) {
        container.appendChild(ACC_staffCreateRecord(batch));
    });
}

/* =========================================
   BATCH MANAGEMENT TABLE
========================================= */

const ACC_staffSearch =
    document.getElementById("staffBatchSearch");

const ACC_staffStatusFilter =
    document.getElementById("staffStatusFilter");

const ACC_staffTableBody =
    document.getElementById("staffBatchTableBody");

const ACC_staffBatchEmpty =
    document.getElementById("staffBatchEmpty");

function ACC_staffRenderBatchTable() {
    ACC_staffTableBody.replaceChildren();

    const searchText = (ACC_staffSearch.value || "")
        .trim()
        .toLowerCase();

    const statusFilter = ACC_staffStatusFilter.value;

    const filtered = ACC_staffBatches.filter(function (batch) {
        const name = (batch.name || "").toLowerCase();
        const fileName = (batch.fileName || "").toLowerCase();
        const status = ACC_staffGetStatus(batch);

        const matchesSearch =
            name.includes(searchText) ||
            fileName.includes(searchText);

        const matchesStatus =
            statusFilter === "all" ||
            status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    ACC_staffBatchEmpty.hidden = filtered.length !== 0;

    filtered.forEach(function (batch) {
        const row = document.createElement("tr");

        const nameCell = document.createElement("td");

        const name = document.createElement("strong");
        name.className = "staff-table-name";
        name.textContent = batch.name || "Unnamed Batch";

        const file = document.createElement("span");
        file.className = "staff-table-subtitle";
        file.textContent = batch.fileName || "No filename";

        nameCell.append(name, file);

        const dateCell = document.createElement("td");
        dateCell.textContent = ACC_staffFormatDate(batch.createdAt);

        const stageCell = document.createElement("td");
        stageCell.textContent = ACC_staffGetStage(batch);

        const statusCell = document.createElement("td");
        statusCell.appendChild(
            ACC_staffCreateStatus(ACC_staffGetStatus(batch))
        );

        const actionCell = document.createElement("td");

        const viewButton = document.createElement("button");
        viewButton.type = "button";
        viewButton.className = "staff-table-action";
        viewButton.textContent = "View Details";

        viewButton.addEventListener("click", function () {
            ACC_staffOpenBatchDetails(batch.id);
        });

        actionCell.appendChild(viewButton);

        row.append(
            nameCell,
            dateCell,
            stageCell,
            statusCell,
            actionCell
        );

        ACC_staffTableBody.appendChild(row);
    });
}

ACC_staffSearch.addEventListener("input", ACC_staffRenderBatchTable);

ACC_staffStatusFilter.addEventListener(
    "change",
    ACC_staffRenderBatchTable
);

/* =========================================
   BATCH DETAILS DIALOG
========================================= */

const ACC_staffDialog =
    document.getElementById("staffBatchDialog");

const ACC_staffDialogContent =
    document.getElementById("staffDialogContent");

const ACC_staffCloseDialog =
    document.getElementById("staffCloseDialog");

function ACC_staffAddDetail(container, label, value) {
    const detail = document.createElement("div");
    detail.className = "staff-dialog-detail";

    const title = document.createElement("span");
    title.textContent = label;

    const content = document.createElement("p");
    content.textContent =
        value === undefined || value === null || value === ""
            ? "Not available"
            : String(value);

    detail.append(title, content);
    container.appendChild(detail);
}

function ACC_staffOpenBatchDetails(batchId) {
    const batch = ACC_staffBatches.find(function (item) {
        return item.id === batchId;
    });

    if (!batch) {
        return;
    }

    ACC_staffDialogContent.replaceChildren();

    ACC_staffAddDetail(
        ACC_staffDialogContent,
        "Batch Name",
        batch.name
    );

    ACC_staffAddDetail(
        ACC_staffDialogContent,
        "Batch ID",
        batch.id
    );

    ACC_staffAddDetail(
        ACC_staffDialogContent,
        "Filename",
        batch.fileName
    );

    ACC_staffAddDetail(
        ACC_staffDialogContent,
        "Date Submitted",
        ACC_staffFormatDate(batch.createdAt)
    );

    ACC_staffAddDetail(
        ACC_staffDialogContent,
        "Classification",
        ACC_staffGetStage(batch)
    );

    ACC_staffAddDetail(
        ACC_staffDialogContent,
        "Status",
        ACC_staffGetStatus(batch)
    );

    ACC_staffAddDetail(
        ACC_staffDialogContent,
        "Confidence",
        typeof batch.confidence === "number"
            ? `${(batch.confidence * 100).toFixed(1)}%`
            : "Unavailable"
    );

    ACC_staffAddDetail(
        ACC_staffDialogContent,
        "Batch Notes",
        batch.notes
    );

    ACC_staffAddDetail(
        ACC_staffDialogContent,
        "Quality Notes",
        batch.qualityNotes
    );

    if (typeof ACC_staffDialog.showModal === "function") {
        ACC_staffDialog.showModal();
    }
}

if (ACC_staffCloseDialog) {
    ACC_staffCloseDialog.addEventListener("click", function () {
        ACC_staffDialog.close();
    });
}

if (ACC_staffDialog) {
    ACC_staffDialog.addEventListener("click", function (event) {
        if (event.target === ACC_staffDialog) {
            ACC_staffDialog.close();
        }
    });
}

/* =========================================
   CLASSIFICATION REVIEW
========================================= */

function ACC_staffRenderReview() {
    const container = document.getElementById("staffReviewList");

    container.replaceChildren();

    const reviewable = ACC_staffBatches.filter(function (batch) {
        return ACC_staffGetStatus(batch) === "Classified" ||
               ACC_staffGetStatus(batch) === "Flagged";
    });

    if (reviewable.length === 0) {
        container.appendChild(
            ACC_staffCreateEmptyMessage(
                "There are no completed classification results to review. Pending batches will appear here after the backend returns classification results."
            )
        );
        return;
    }

    reviewable.forEach(function (batch) {
        const card = document.createElement("article");
        card.className = "staff-review-item";

        const top = document.createElement("div");
        top.className = "staff-review-top";

        const heading = document.createElement("div");

        const title = document.createElement("h3");
        title.textContent = batch.name || "Unnamed Batch";

        const date = document.createElement("p");
        date.textContent = ACC_staffFormatDate(batch.createdAt);

        heading.append(title, date);

        top.append(
            heading,
            ACC_staffCreateStatus(ACC_staffGetStatus(batch))
        );

        const details = document.createElement("div");
        details.className = "staff-review-details";

        const stage = document.createElement("div");
        const stageLabel = document.createElement("strong");
        stageLabel.textContent = "Classification Stage";

        const stageValue = document.createElement("p");
        stageValue.textContent = ACC_staffGetStage(batch);

        stage.append(stageLabel, stageValue);

        const confidence = document.createElement("div");
        const confidenceLabel = document.createElement("strong");
        confidenceLabel.textContent = "Model Confidence";

        const confidenceValue = document.createElement("p");
        confidenceValue.textContent =
            typeof batch.confidence === "number"
                ? `${(batch.confidence * 100).toFixed(1)}%`
                : "Unavailable";

        confidence.append(confidenceLabel, confidenceValue);

        details.append(stage, confidence);
        card.append(top, details);

        const recommendation = document.createElement("p");
        recommendation.className = "staff-review-recommendation";
        recommendation.style.marginTop = "14px";
        recommendation.style.fontSize = "11px";
        recommendation.style.lineHeight = "1.8";
        recommendation.textContent =
            batch.recommendation || "No quality recommendation is available.";

        card.appendChild(recommendation);

        container.appendChild(card);
    });
}

/* =========================================
   BATCH HISTORY
========================================= */

function ACC_staffRenderHistory() {
    const container = document.getElementById("staffHistoryList");

    container.replaceChildren();

    if (ACC_staffBatches.length === 0) {
        container.appendChild(
            ACC_staffCreateEmptyMessage(
                "No batch history is available in this browser."
            )
        );
        return;
    }

    ACC_staffBatches.forEach(function (batch) {
        container.appendChild(ACC_staffCreateRecord(batch));
    });
}

/* =========================================
   REFRESH DATA
========================================= */

function ACC_staffRefreshDashboard() {
    ACC_staffBatches = ACC_staffLoadBatches();

    ACC_staffRenderOverview();
    ACC_staffRenderBatchTable();
    ACC_staffRenderReview();
    ACC_staffRenderHistory();
}

window.addEventListener("storage", function (event) {
    if (event.key === ACC_staffBatchKey) {
        ACC_staffRefreshDashboard();
    }
});

/* =========================================
   INITIALIZE
========================================= */

ACC_staffRefreshDashboard();
