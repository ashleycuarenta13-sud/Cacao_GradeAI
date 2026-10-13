
"use strict";

/* =========================================
   CACOGRADEAI - ADMIN DASHBOARD
========================================= */

const ACC_adminPages = {
    overview: "Admin Dashboard",
    users: "User Management",
    batches: "Batch Management",
    classifications: "Classification Monitoring",
    activity: "System Activity",
    profile: "My Profile"
};

const ACC_adminBatchKey = "ACC_farmer_batches";
const ACC_adminThemeKey = "ACC_admin_theme";
const ACC_adminActivityKey = "ACC_admin_activity";
const ACC_adminUserKey = "ACC_registered_users";

let ACC_adminBatches = ACC_adminLoadStorage(ACC_adminBatchKey, []);
let ACC_adminUsers = ACC_adminLoadStorage(ACC_adminUserKey, []);
let ACC_adminActivities = ACC_adminLoadStorage(ACC_adminActivityKey, []);

/* =========================================
   STORAGE HELPERS
========================================= */

function ACC_adminLoadStorage(key, fallback) {
    try {
        const saved = localStorage.getItem(key);
        const parsed = saved ? JSON.parse(saved) : fallback;

        return Array.isArray(parsed) ? parsed : fallback;
    } catch (error) {
        return fallback;
    }
}

function ACC_adminSaveStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        return false;
    }
}

/* =========================================
   DARK MODE
========================================= */

const ACC_adminThemeToggle =
    document.getElementById("adminThemeToggle");

const ACC_adminThemeIcon =
    document.getElementById("adminThemeIcon");

function ACC_adminApplyTheme(theme) {
    const isDark = theme === "dark";

    document.body.classList.toggle("admin-dark-mode", isDark);

    ACC_adminThemeIcon.textContent = isDark
        ? "light_mode"
        : "dark_mode";

    ACC_adminThemeToggle.setAttribute(
        "aria-label",
        isDark ? "Enable light mode" : "Enable dark mode"
    );

    ACC_adminThemeToggle.title = isDark
        ? "Switch to light mode"
        : "Switch to dark mode";
}

let ACC_adminSavedTheme = "light";

try {
    ACC_adminSavedTheme =
        localStorage.getItem(ACC_adminThemeKey) || "light";
} catch (error) {
    ACC_adminSavedTheme = "light";
}

ACC_adminApplyTheme(ACC_adminSavedTheme);

ACC_adminThemeToggle.addEventListener("click", function () {
    const isDark = document.body.classList.contains("admin-dark-mode");
    const nextTheme = isDark ? "light" : "dark";

    ACC_adminApplyTheme(nextTheme);

    try {
        localStorage.setItem(ACC_adminThemeKey, nextTheme);
    } catch (error) {
        // Theme still applies for the current page session.
    }
});

/* =========================================
   NAVIGATION
========================================= */

const ACC_adminNavLinks =
    document.querySelectorAll(".admin-nav-link[data-page]");

const ACC_adminSections =
    document.querySelectorAll(".admin-page");

const ACC_adminPageTitle =
    document.getElementById("adminPageTitle");

function ACC_adminShowPage(pageName) {
    if (!ACC_adminPages[pageName]) {
        return;
    }

    ACC_adminSections.forEach(function (section) {
        section.classList.toggle("active", section.id === pageName);
    });

    ACC_adminNavLinks.forEach(function (link) {
        const active = link.dataset.page === pageName;

        link.classList.toggle("active", active);

        if (active) {
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }
    });

    ACC_adminPageTitle.textContent = ACC_adminPages[pageName];

    document.body.classList.remove("admin-sidebar-open");

    if (pageName === "users") {
        ACC_adminRenderUsers();
    }

    if (pageName === "batches") {
        ACC_adminRenderBatches();
    }

    if (pageName === "classifications") {
        ACC_adminRenderClassifications();
    }

    if (pageName === "activity") {
        ACC_adminRenderActivities();
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

ACC_adminNavLinks.forEach(function (link) {
    link.addEventListener("click", function () {
        ACC_adminShowPage(link.dataset.page);
    });
});

document.querySelectorAll("[data-goto]").forEach(function (button) {
    button.addEventListener("click", function () {
        ACC_adminShowPage(button.dataset.goto);
    });
});

/* =========================================
   MOBILE SIDEBAR
========================================= */

const ACC_adminMenuToggle =
    document.getElementById("adminMenuToggle");

const ACC_adminMobileOverlay =
    document.getElementById("adminMobileOverlay");

ACC_adminMenuToggle.addEventListener("click", function () {
    document.body.classList.toggle("admin-sidebar-open");
});

ACC_adminMobileOverlay.addEventListener("click", function () {
    document.body.classList.remove("admin-sidebar-open");
});

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        document.body.classList.remove("admin-sidebar-open");

        const dialog = document.getElementById("adminDetailsDialog");

        if (dialog.open) {
            dialog.close();
        }
    }
});

/* =========================================
   DATE AND FORMATTING
========================================= */

document.getElementById("adminCurrentDate").textContent =
    new Intl.DateTimeFormat("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric"
    }).format(new Date());

function ACC_adminFormatDate(value) {
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

function ACC_adminGetStatus(batch) {
    if (batch.status === "Classified") {
        return "Classified";
    }

    if (batch.status === "Flagged") {
        return "Flagged";
    }

    return "Pending";
}

function ACC_adminGetRole(user) {
    const role = String(user.role || "Farmer").toLowerCase();

    if (role === "staff") {
        return "Staff";
    }

    if (role === "admin" || role === "administrator") {
        return "Admin";
    }

    return "Farmer";
}

function ACC_adminGetStage(batch) {
    return batch.stage || "Not classified";
}

function ACC_adminCreateStatus(status) {
    const badge = document.createElement("span");

    badge.className = "admin-status";
    badge.textContent = status;

    if (status === "Classified") {
        badge.classList.add("classified");
    }

    if (status === "Flagged") {
        badge.classList.add("flagged");
    }

    return badge;
}

function ACC_adminEmptyMessage(message) {
    const empty = document.createElement("p");

    empty.className = "admin-empty-state";
    empty.textContent = message;

    return empty;
}

/* =========================================
   LOCAL ACTIVITY LOG
========================================= */

function ACC_adminLogActivity(action, details) {
    ACC_adminActivities.unshift({
        id: `ACT-${Date.now()}`,
        action: action,
        details: details,
        createdAt: new Date().toISOString()
    });

    ACC_adminActivities = ACC_adminActivities.slice(0, 100);

    const saved = ACC_adminSaveStorage(
        ACC_adminActivityKey,
        ACC_adminActivities
    );

    if (!saved) {
        console.warn("Unable to save the local activity log.");
    }
}

function ACC_adminCreateActivity(item) {
    const row = document.createElement("article");
    row.className = "admin-activity-item";

    const iconBox = document.createElement("div");
    iconBox.className = "admin-activity-icon";

    const icon = document.createElement("span");
    icon.className = "material-symbols-outlined";
    icon.textContent = "history";

    iconBox.appendChild(icon);

    const info = document.createElement("div");
    info.className = "admin-activity-info";

    const title = document.createElement("strong");
    title.textContent = item.action || "Activity";

    const details = document.createElement("p");
    details.textContent =
        `${item.details || ""} · ${ACC_adminFormatDate(item.createdAt)}`;

    info.append(title, details);
    row.append(iconBox, info);

    return row;
}

function ACC_adminRenderActivities() {
    const container = document.getElementById("adminActivityList");
    const recent = document.getElementById("adminRecentActivity");

    container.replaceChildren();
    recent.replaceChildren();

    if (ACC_adminActivities.length === 0) {
        container.appendChild(
            ACC_adminEmptyMessage(
                "No locally recorded activity is available."
            )
        );

        recent.appendChild(
            ACC_adminEmptyMessage("No recent activity.")
        );

        return;
    }

    ACC_adminActivities.forEach(function (item) {
        container.appendChild(ACC_adminCreateActivity(item));
    });

    ACC_adminActivities.slice(0, 4).forEach(function (item) {
        recent.appendChild(ACC_adminCreateActivity(item));
    });
}

document.getElementById("adminClearActivity").addEventListener(
    "click",
    function () {
        if (ACC_adminActivities.length === 0) {
            return;
        }

        const confirmed = window.confirm(
            "Delete the activity history saved in this browser?"
        );

        if (!confirmed) {
            return;
        }

        ACC_adminActivities = [];

        ACC_adminSaveStorage(
            ACC_adminActivityKey,
            ACC_adminActivities
        );

        ACC_adminRenderActivities();
    }
);

/* =========================================
   OVERVIEW STATISTICS
========================================= */

function ACC_adminRenderOverview() {
    const totalUsers = ACC_adminUsers.length;

    const farmers = ACC_adminUsers.filter(function (user) {
        return ACC_adminGetRole(user) === "Farmer";
    }).length;

    const staff = ACC_adminUsers.filter(function (user) {
        return ACC_adminGetRole(user) === "Staff";
    }).length;

    const pending = ACC_adminBatches.filter(function (batch) {
        return ACC_adminGetStatus(batch) === "Pending";
    }).length;

    const classified = ACC_adminBatches.filter(function (batch) {
        return ACC_adminGetStatus(batch) === "Classified";
    }).length;

    const flagged = ACC_adminBatches.filter(function (batch) {
        return ACC_adminGetStatus(batch) === "Flagged";
    }).length;

    document.getElementById("adminTotalUsers").textContent = totalUsers;
    document.getElementById("adminFarmerCount").textContent = farmers;
    document.getElementById("adminStaffCount").textContent = staff;
    document.getElementById("adminTotalBatches").textContent =
        ACC_adminBatches.length;

    document.getElementById("adminPendingCount").textContent = pending;
    document.getElementById("adminClassifiedCount").textContent = classified;
    document.getElementById("adminFlaggedCount").textContent = flagged;

    const total = ACC_adminBatches.length || 1;

    document.getElementById("adminPendingBar").style.width =
        `${(pending / total) * 100}%`;

    document.getElementById("adminClassifiedBar").style.width =
        `${(classified / total) * 100}%`;

    document.getElementById("adminFlaggedBar").style.width =
        `${(flagged / total) * 100}%`;

    ACC_adminRenderRecentBatches();
    ACC_adminRenderActivities();
}

function ACC_adminCreateBatchRecord(batch) {
    const row = document.createElement("article");
    row.className = "admin-record-item";

    const iconBox = document.createElement("div");
    iconBox.className = "admin-record-icon";

    const icon = document.createElement("span");
    icon.className = "material-symbols-outlined";
    icon.textContent = "inventory_2";

    iconBox.appendChild(icon);

    const info = document.createElement("div");
    info.className = "admin-record-info";

    const title = document.createElement("strong");
    title.textContent = batch.name || "Unnamed Batch";

    const description = document.createElement("p");
    description.textContent =
        `${ACC_adminGetStage(batch)} · ${ACC_adminFormatDate(batch.createdAt)}`;

    info.append(title, description);

    row.append(
        iconBox,
        info,
        ACC_adminCreateStatus(ACC_adminGetStatus(batch))
    );

    return row;
}

function ACC_adminRenderRecentBatches() {
    const container = document.getElementById("adminRecentBatches");

    container.replaceChildren();

    if (ACC_adminBatches.length === 0) {
        container.appendChild(
            ACC_adminEmptyMessage(
                "No batch records are available in this browser."
            )
        );

        return;
    }

    ACC_adminBatches.slice(0, 5).forEach(function (batch) {
        container.appendChild(ACC_adminCreateBatchRecord(batch));
    });
}

/* =========================================
   USER MANAGEMENT
========================================= */

const ACC_adminUserSearch =
    document.getElementById("adminUserSearch");

const ACC_adminRoleFilter =
    document.getElementById("adminRoleFilter");

function ACC_adminRenderUsers() {
    const container = document.getElementById("adminUserTableBody");
    const empty = document.getElementById("adminUsersEmpty");

    container.replaceChildren();

    const search = ACC_adminUserSearch.value.trim().toLowerCase();
    const roleFilter = ACC_adminRoleFilter.value;

    const users = ACC_adminUsers.filter(function (user) {
        const name = String(user.name || user.full_name || "").toLowerCase();
        const email = String(user.email || "").toLowerCase();
        const id = String(user.id || user.user_id || "").toLowerCase();
        const role = ACC_adminGetRole(user);

        const matchesSearch =
            name.includes(search) ||
            email.includes(search) ||
            id.includes(search);

        const matchesRole =
            roleFilter === "all" || role === roleFilter;

        return matchesSearch && matchesRole;
    });

    empty.hidden = users.length > 0;

    users.forEach(function (user) {
        const row = document.createElement("tr");

        const nameCell = document.createElement("td");
        const name = document.createElement("strong");
        name.className = "admin-table-name";
        name.textContent = user.name || user.full_name || "Unnamed User";

        const userId = document.createElement("span");
        userId.className = "admin-table-subtitle";
        userId.textContent = user.id || user.user_id || "ID unavailable";

        nameCell.append(name, userId);

        const emailCell = document.createElement("td");
        emailCell.textContent = user.email || "Not available";

        const roleCell = document.createElement("td");
        const roleBadge = document.createElement("span");
        roleBadge.className = "admin-role-badge";
        roleBadge.textContent = ACC_adminGetRole(user);
        roleCell.appendChild(roleBadge);

        const statusCell = document.createElement("td");
        statusCell.textContent = user.status || "Unverified";

        const actionCell = document.createElement("td");
        const viewButton = document.createElement("button");

        viewButton.type = "button";
        viewButton.className = "admin-table-action";
        viewButton.textContent = "View Details";

        viewButton.addEventListener("click", function () {
            ACC_adminShowUserDetails(user);
        });

        actionCell.appendChild(viewButton);

        row.append(
            nameCell,
            emailCell,
            roleCell,
            statusCell,
            actionCell
        );

        container.appendChild(row);
    });
}

ACC_adminUserSearch.addEventListener("input", ACC_adminRenderUsers);

ACC_adminRoleFilter.addEventListener("change", ACC_adminRenderUsers);

function ACC_adminShowUserDetails(user) {
    const container = document.getElementById("adminDialogContent");

    container.replaceChildren();

    ACC_adminAddDialogDetail(
        container,
        "Name",
        user.name || user.full_name
    );

    ACC_adminAddDialogDetail(container, "User ID", user.id || user.user_id);
    ACC_adminAddDialogDetail(container, "Email", user.email);
    ACC_adminAddDialogDetail(container, "Role", ACC_adminGetRole(user));
    ACC_adminAddDialogDetail(container, "Status", user.status || "Unverified");

    ACC_adminOpenDialog("User Details");
}

/* =========================================
   BATCH MANAGEMENT
========================================= */

const ACC_adminBatchSearch =
    document.getElementById("adminBatchSearch");

const ACC_adminBatchStatusFilter =
    document.getElementById("adminBatchStatusFilter");

function ACC_adminRenderBatches() {
    const container = document.getElementById("adminBatchTableBody");
    const empty = document.getElementById("adminBatchesEmpty");

    container.replaceChildren();

    const search = ACC_adminBatchSearch.value.trim().toLowerCase();
    const statusFilter = ACC_adminBatchStatusFilter.value;

    const batches = ACC_adminBatches.filter(function (batch) {
        const name = String(batch.name || "").toLowerCase();
        const file = String(batch.fileName || "").toLowerCase();
        const status = ACC_adminGetStatus(batch);

        return (
            (name.includes(search) || file.includes(search)) &&
            (statusFilter === "all" || status === statusFilter)
        );
    });

    empty.hidden = batches.length > 0;

    batches.forEach(function (batch) {
        const row = document.createElement("tr");

        const nameCell = document.createElement("td");

        const name = document.createElement("strong");
        name.className = "admin-table-name";
        name.textContent = batch.name || "Unnamed Batch";

        const file = document.createElement("span");
        file.className = "admin-table-subtitle";
        file.textContent = batch.fileName || "No filename";

        nameCell.append(name, file);

        const dateCell = document.createElement("td");
        dateCell.textContent = ACC_adminFormatDate(batch.createdAt);

        const stageCell = document.createElement("td");
        stageCell.textContent = ACC_adminGetStage(batch);

        const statusCell = document.createElement("td");
        statusCell.appendChild(
            ACC_adminCreateStatus(ACC_adminGetStatus(batch))
        );

        const actionCell = document.createElement("td");
        const button = document.createElement("button");

        button.type = "button";
        button.className = "admin-table-action";
        button.textContent = "View Details";

        button.addEventListener("click", function () {
            ACC_adminShowBatchDetails(batch);
        });

        actionCell.appendChild(button);

        row.append(
            nameCell,
            dateCell,
            stageCell,
            statusCell,
            actionCell
        );

        container.appendChild(row);
    });
}

ACC_adminBatchSearch.addEventListener("input", ACC_adminRenderBatches);

ACC_adminBatchStatusFilter.addEventListener(
    "change",
    ACC_adminRenderBatches
);

/* =========================================
   CLASSIFICATION MONITORING
========================================= */

function ACC_adminRenderClassifications() {
    const container =
        document.getElementById("adminClassificationList");

    container.replaceChildren();

    const classified = ACC_adminBatches.filter(function (batch) {
        return ACC_adminGetStatus(batch) === "Classified" &&
               Boolean(batch.stage);
    });

    if (classified.length === 0) {
        container.appendChild(
            ACC_adminEmptyMessage(
                "No confirmed classification results are available. Results will appear here after the backend returns an actual prediction."
            )
        );

        return;
    }

    classified.forEach(function (batch) {
        const card = document.createElement("article");
        card.className = "admin-classification-item";

        const title = document.createElement("h3");
        title.textContent = batch.name || "Unnamed Batch";

        const stage = document.createElement("p");
        stage.textContent = `Stage: ${batch.stage}`;

        const confidence = document.createElement("p");
        confidence.textContent =
            `Confidence: ${
                typeof batch.confidence === "number"
                    ? `${(batch.confidence * 100).toFixed(1)}%`
                    : "Unavailable"
            }`;

        const date = document.createElement("p");
        date.textContent = `Date: ${ACC_adminFormatDate(batch.createdAt)}`;

        const notes = document.createElement("p");
        notes.textContent =
            `Quality notes: ${batch.qualityNotes || batch.notes || "Not available"}`;

        card.append(title, stage, confidence, date, notes);
        container.appendChild(card);
    });
}

/* =========================================
   DETAILS DIALOG
========================================= */

const ACC_adminDialog =
    document.getElementById("adminDetailsDialog");

const ACC_adminDialogTitle =
    document.getElementById("adminDialogTitle");

const ACC_adminDialogContent =
    document.getElementById("adminDialogContent");

function ACC_adminAddDialogDetail(container, label, value) {
    const detail = document.createElement("div");
    detail.className = "admin-dialog-detail";

    const heading = document.createElement("span");
    heading.textContent = label;

    const content = document.createElement("p");
    content.textContent =
        value === undefined || value === null || value === ""
            ? "Not available"
            : String(value);

    detail.append(heading, content);
    container.appendChild(detail);
}

function ACC_adminOpenDialog(title) {
    ACC_adminDialogTitle.textContent = title;

    if (typeof ACC_adminDialog.showModal === "function") {
        ACC_adminDialog.showModal();
    }
}

function ACC_adminShowBatchDetails(batch) {
    ACC_adminDialogContent.replaceChildren();

    ACC_adminAddDialogDetail(
        ACC_adminDialogContent,
        "Batch Name",
        batch.name
    );

    ACC_adminAddDialogDetail(
        ACC_adminDialogContent,
        "Batch ID",
        batch.id
    );

    ACC_adminAddDialogDetail(
        ACC_adminDialogContent,
        "Image Filename",
        batch.fileName
    );

    ACC_adminAddDialogDetail(
        ACC_adminDialogContent,
        "Date Submitted",
        ACC_adminFormatDate(batch.createdAt)
    );

    ACC_adminAddDialogDetail(
        ACC_adminDialogContent,
        "Classification",
        ACC_adminGetStage(batch)
    );

    ACC_adminAddDialogDetail(
        ACC_adminDialogContent,
        "Status",
        ACC_adminGetStatus(batch)
    );

    ACC_adminAddDialogDetail(
        ACC_adminDialogContent,
        "Confidence",
        typeof batch.confidence === "number"
            ? `${(batch.confidence * 100).toFixed(1)}%`
            : "Unavailable"
    );

    ACC_adminAddDialogDetail(
        ACC_adminDialogContent,
        "Recommendation",
        batch.recommendation
    );

    ACC_adminAddDialogDetail(
        ACC_adminDialogContent,
        "Notes",
        batch.notes
    );

    ACC_adminOpenDialog("Batch Details");
}

document.getElementById("adminCloseDialog").addEventListener(
    "click",
    function () {
        ACC_adminDialog.close();
    }
);

ACC_adminDialog.addEventListener("click", function (event) {
    if (event.target === ACC_adminDialog) {
        ACC_adminDialog.close();
    }
});

/* =========================================
   REFRESH AND INITIALIZE
========================================= */

function ACC_adminRefreshDashboard() {
    ACC_adminBatches = ACC_adminLoadStorage(ACC_adminBatchKey, []);
    ACC_adminUsers = ACC_adminLoadStorage(ACC_adminUserKey, []);
    ACC_adminActivities = ACC_adminLoadStorage(ACC_adminActivityKey, []);

    ACC_adminRenderOverview();
    ACC_adminRenderUsers();
    ACC_adminRenderBatches();
    ACC_adminRenderClassifications();
    ACC_adminRenderActivities();
}

window.addEventListener("storage", function (event) {
    if (
        event.key === ACC_adminBatchKey ||
        event.key === ACC_adminUserKey ||
        event.key === ACC_adminActivityKey
    ) {
        ACC_adminRefreshDashboard();
    }
});

ACC_adminRefreshDashboard();
