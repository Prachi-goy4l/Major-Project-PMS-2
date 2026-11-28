export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const STATUSES = ["To Do", "In Progress", "Completed"];

export function parseDate(value) {
    if (!value) {
        return null;
    }

    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) {
        return null;
    }

    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return date.getFullYear() === Number(match[1]) &&
        date.getMonth() === Number(match[2]) - 1 &&
        date.getDate() === Number(match[3])
        ? date
        : null;
}

export function formatDate(value, options) {
    const date = parseDate(value);
    return date
        ? new Intl.DateTimeFormat(undefined, options).format(date)
        : "No due date";
}

export function priorityClass(priority) {
    return {
        High: "priority-high",
        Medium: "priority-medium",
        Low: "priority-low"
    }[priority] || "priority-default";
}

export function statusClass(status) {
    return {
        "To Do": "status-todo",
        "In Progress": "status-progress",
        Completed: "status-completed"
    }[status] || "status-default";
}

export function firstOfMonth(date) {
    const copy = new Date(date);
    copy.setDate(1);
    return copy;
}
