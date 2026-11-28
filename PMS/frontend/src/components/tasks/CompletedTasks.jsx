import { parseDate } from "./taskUtils";
import { TaskRows } from "./TaskTable";

export default function CompletedTasks({ tasks, ...rowProps }) {
    const completedTasks = tasks
        .filter((task) => task.status === "Completed")
        .sort((first, second) => (second.deadline || "").localeCompare(first.deadline || ""));
    const groups = new Map();

    completedTasks.forEach((task) => {
        const date = parseDate(task.deadline);
        const key = date
            ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
            : "no-date";
        const label = date
            ? new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(date)
            : "No due date";
        if (!groups.has(key)) {
            groups.set(key, { label, tasks: [] });
        }
        groups.get(key).tasks.push(task);
    });

    return (
        <section className="tasks-panel completed-panel" aria-labelledby="completedTasksHeading">
            <div className="tasks-panel-heading">
                <div>
                    <span className="tasks-section-icon completed-icon"><i className="fa-solid fa-circle-check" aria-hidden="true"></i></span>
                    <div>
                        <h2 id="completedTasksHeading">Completed Tasks</h2>
                        <p>Tasks marked complete, grouped by their due month.</p>
                    </div>
                </div>
                <span className="completed-count"><span id="completedTaskCount">{completedTasks.length}</span> completed</span>
            </div>
            <div id="completedTaskGroups" className="completed-task-groups">
                {completedTasks.length === 0 ? (
                    <div className="completed-empty">
                        <i className="fa-regular fa-circle-check" aria-hidden="true"></i>
                        <span>{tasks.some((task) => task.status === "Completed")
                            ? "No completed tasks match your search."
                            : "Completed tasks will appear here."}</span>
                    </div>
                ) : Array.from(groups.entries()).map(([key, group]) => (
                    <section className="completed-month" aria-label={`Completed tasks for ${group.label}`} key={key}>
                        <div className="completed-month-heading">
                            <h3><i className="fa-solid fa-chevron-down" aria-hidden="true"></i>{group.label}</h3>
                            <span>{group.tasks.length} task{group.tasks.length === 1 ? "" : "s"}</span>
                        </div>
                        <div className="tasks-table-wrap">
                            <table className="tasks-table completed-table">
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
                                <tbody><TaskRows {...rowProps} tasks={group.tasks} /></tbody>
                            </table>
                        </div>
                    </section>
                ))}
            </div>
        </section>
    );
}
