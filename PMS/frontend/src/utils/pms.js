// Port of JAVASCRIPT/app-access.js (the shared "PMS" helper object).
export const API_URL = "http://localhost:3000";
const SESSION_KEY = "pmsSession";
const USER_KEY = "loggedInUser";

function readSession() {
    try {
        return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    } catch (error) {
        console.error("Unable to read the current session:", error);
        return null;
    }
}

export function getUser() {
    const session = readSession();
    if (session && session.user) {
        return session.user;
    }

    try {
        return JSON.parse(localStorage.getItem(USER_KEY) || "null");
    } catch (error) {
        console.error("Unable to read the signed-in user:", error);
        return null;
    }
}

export function getSignedInUser() {
    const user = getUser();
    return user && user.id ? user : null;
}

export function createSessionId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
    }
    return `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function saveUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    const previousSession = readSession() || {};
    localStorage.setItem(SESSION_KEY, JSON.stringify({
        sessionId: previousSession.sessionId || createSessionId(),
        startedAt: previousSession.startedAt || new Date().toISOString(),
        userId: String(user.id),
        role: user.role,
        user: user
    }));
}

export function signOut() {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("pmsSession");
}

export function isManager(user) {
    return Boolean(user && user.role === "Manager");
}

export function assignedProjectIds(user) {
    return Array.isArray(user && user.projectIds)
        ? user.projectIds.map(String)
        : [];
}

export function accessibleProjects(projects, user) {
    if (!user || isManager(user)) {
        return projects;
    }
    const allowedIds = new Set(assignedProjectIds(user));
    return projects.filter((project) => allowedIds.has(String(project.id)));
}

export function canAccessProject(project, user) {
    return Boolean(project && (
        !user || isManager(user) || assignedProjectIds(user).includes(String(project.id))
    ));
}

export function projectIdFromUrl() {
    return new URLSearchParams(window.location.search).get("projectId");
}

// Maps the old "xxx.html" page names onto the React routes.
export function routeForPage(page) {
    const name = String(page).replace(/\.html$/, "");
    return name === "index" ? "/" : `/${name}`;
}

export function urlForPage(page, projectId) {
    const path = routeForPage(page);
    return projectId ? `${path}?projectId=${encodeURIComponent(String(projectId))}` : path;
}

export async function fetchCollection(collection) {
    const response = await fetch(`${API_URL}/${collection}`);
    if (!response.ok) {
        throw new Error(`Unable to load ${collection} (${response.status})`);
    }
    const records = await response.json();
    if (!Array.isArray(records)) {
        throw new Error(`${collection} response was not a list`);
    }
    return records;
}

export async function refreshCurrentUser() {
    const user = getUser();
    if (!user || !user.id) {
        return null;
    }
    const response = await fetch(`${API_URL}/users/${encodeURIComponent(user.id)}`);
    if (!response.ok) {
        throw new Error(`Unable to refresh the signed-in user (${response.status})`);
    }
    const currentUser = await response.json();
    saveUser(currentUser);
    return currentUser;
}

const PMS = {
    API_URL,
    getUser,
    getSignedInUser,
    saveUser,
    signOut,
    isManager,
    assignedProjectIds,
    accessibleProjects,
    canAccessProject,
    projectIdFromUrl,
    urlForPage,
    fetchCollection,
    refreshCurrentUser
};

export default PMS;
