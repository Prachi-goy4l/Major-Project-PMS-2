import { formatDate, priorityClass, STATUSES, statusClass } from "./taskUtils";

function canUpdateTask(task, user, teamMembers) {
    if (!user || user.role === "Manager") {
        return false;
    }
    const assignedMember = teamMembers.find((member) =>
        String(member.userId) === String(user.id) &&
        Array.isArray(member.projectIds) &&
        member.projectIds.map(String).includes(String(task.projectId)) &&
        member.name === task.assignedTo
    );
    return String(task.assignedToUserId || assignedMember?.userId || "") === String(user.id) ||
        (!task.assignedToUserId && !assignedMember && task.assignedTo === user.name);
}

function TaskRow({ task, projectById, manager, user, teamMembers, onEdit, onDelete, onStatusChange }) {
    const deadline = formatDate(task.deadline, { month: "short", day: "numeric", year: "numeric" });
    const projectName = projectById.get(String(task.projectId))?.projectName || "Unknown project";
    let actions;

    if (manager) {
        actions = (
            <>
                <button
                    type="button"
                    className="task-action-button"
                    aria-label={`Edit ${task.taskName ?? ""}`}
                    onClick={() => onEdit(task.id)}
                >
                    <i className="fa-solid fa-pen" aria-hidden="true"></i>
                </button>
                <button
                    type="button"
                    className="task-action-button task-delete-button"
                    aria-label={`Delete ${task.taskName ?? ""}`}
                    onClick={() => onDelete(task.id)}
                >
                    <i className="fa-solid fa-trash" aria-hidden="true"></i>
                </button>
            </>
        );
    } else if (canUpdateTask(task, user, teamMembers)) {
        actions = (
            <select
                className="task-status-select"
                aria-label={`Update status for ${task.taskName ?? ""}`}
                value={task.status}
                onChange={(event) => onStatusChange(task, event.target.value)}
            >
                {STATUSES.map((status) => (
                    <option key={status} value={status}>{status}</option>
                ))}
            </select>
        );
    } else {
        actions = <span className="task-readonly-label">View only</span>;
    }

    return (
        <tr>
            <td>
                <span className="task-name">{task.taskName || "Untitled task"}</span>
                <span className="task-description">{task.description || ""}</span>
            </td>
            <td>{projectName}</td>
            <td>{task.assignedTo || "Unassigned"}</td>
            <td><span className="task-date"><i className="fa-regular fa-calendar" aria-hidden="true"></i>{deadline}</span></td>
            <td><span className={`task-badge ${priorityClass(task.priority)}`}>{task.priority || "—"}</span></td>
            <td><span className={`task-badge ${statusClass(task.status)}`}>{task.status || "Unknown"}</span></td>
            <td>
                <div className="task-row-actions">{actions}</div>
            </td>
        </tr>
    );
}

export function TaskRows({ tasks, ...rowProps }) {
    return tasks.map((task) => <TaskRow key={task.id} {...rowProps} task={task} />);
}

export default function TaskTable({
    tasks,
    allTasks,
    projectById,
    manager,
    user,
    teamMembers,
    searchValue,
    onSearchChange,
    onEdit,
    onDelete,
    onStatusChange
}) {
    const sortedTasks = [...tasks].sort((first, second) =>
        (first.deadline || "9999-12-31").localeCompare(second.deadline || "9999-12-31")
    );
    const rowProps = { projectById, manager, user, teamMembers, onEdit, onDelete, onStatusChange };

    return (
        <section className="tasks-panel" aria-labelledby="allTasksHeading">
            <div className="tasks-panel-heading">
                <div>
                    <span className="tasks-section-icon"><i className="fa-solid fa-list-check" aria-hidden="true"></i></span>
                    <div>
                        <h2 id="allTasksHeading">All Tasks</h2>
                        <p>Every task, with its current status and deadline.</p>
                    </div>
                </div>
                <label className="tasks-search">
                    <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
                    <input
                        type="search"
                        id="searchTask"
                        placeholder="Search tasks..."
                        aria-label="Search tasks"
                        value={searchValue}
                        onChange={(event) => onSearchChange(event.target.value)}
                    />
                </label>
            </div>

            <div className="tasks-table-wrap">
                <table className="tasks-table">
                    <thead>
                        <tr>
                            <th scope="col">Task</th>
                            <th scope="col">Project</th>
                            <th scope="col">Assigned to</th>
                            <th scope="col">Due date</th>
                            <th scope="col">Priority</th>
                            <th scope="col">Status</th>
                            <th scope="col">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="taskTableBody">
                        {tasks.length ? (
                            <TaskRows {...rowProps} tasks={sortedTasks} />
                        ) : (
                            <tr>
                                <td colSpan="7" className="tasks-empty-cell">
                                    <i className="fa-regular fa-folder-open" aria-hidden="true"></i>
                                    <span>{allTasks.length ? "No tasks match your search." : "No tasks yet. Add a task to get started."}</span>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <p className="tasks-panel-footnote"><span id="taskCount">{tasks.length}</span> tasks</p>
        </section>
    );
}
