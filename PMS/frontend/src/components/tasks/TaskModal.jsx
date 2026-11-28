import { useEffect, useRef } from "react";

export default function TaskModal({
    isOpen,
    isEditing,
    form,
    projects,
    projectMembers,
    selectedAssignee,
    workspaceProjectId,
    workspaceProjectName,
    manager,
    onClose,
    onSubmit,
    onFieldChange,
    onProjectChange
}) {
    const taskNameRef = useRef(null);
    const selectedMemberExists = projectMembers.some((member) => member.name === selectedAssignee);

    useEffect(() => {
        if (isOpen && taskNameRef.current) {
            taskNameRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        function onKeyDown(event) {
            if (event.key === "Escape" && isOpen) {
                onClose();
            }
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) {
        return null;
    }

    return (
        <div
            id="taskModal"
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="taskModalHeading"
            style={{ display: "flex" }}
            onClick={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="modal-content">
                <button type="button" className="close" aria-label="Close task form" onClick={onClose}>&times;</button>
                <h2 id="taskModalHeading">{isEditing ? "Edit Task" : "Add New Task"}</h2>
                <form id="taskForm" onSubmit={onSubmit}>
                    <label htmlFor="taskName">Task name</label>
                    <input
                        type="text"
                        id="taskName"
                        placeholder="Task name"
                        required
                        disabled={!manager}
                        ref={taskNameRef}
                        value={form.taskName}
                        onChange={(event) => onFieldChange("taskName", event.target.value)}
                    />

                    <label htmlFor="taskDescription">Description</label>
                    <textarea
                        id="taskDescription"
                        placeholder="Task description"
                        rows="4"
                        required
                        disabled={!manager}
                        value={form.taskDescription}
                        onChange={(event) => onFieldChange("taskDescription", event.target.value)}
                    ></textarea>

                    <div id="taskProjectField" hidden={Boolean(workspaceProjectId)}>
                        <label htmlFor="taskProject">Project</label>
                        <select
                            id="taskProject"
                            required
                            disabled={!manager || Boolean(workspaceProjectId)}
                            value={form.taskProject}
                            onChange={(event) => onProjectChange(event.target.value)}
                        >
                            <option value="">Select a project</option>
                            {projects.map((project) => (
                                <option key={project.id} value={String(project.id)}>
                                    {project.projectName || "Untitled project"}
                                </option>
                            ))}
                        </select>
                    </div>
                    <p id="lockedTaskProject" hidden={!workspaceProjectId || projects.length === 0}>
                        {workspaceProjectId && projects.length > 0
                            ? `Project: ${workspaceProjectName || "Selected project"}`
                            : null}
                    </p>

                    <label htmlFor="assignedTo">Assigned to</label>
                    <select
                        id="assignedTo"
                        required
                        disabled={!manager || projectMembers.length === 0}
                        value={form.assignedTo}
                        onChange={(event) => onFieldChange("assignedTo", event.target.value)}
                    >
                        <option value="">Select a team member</option>
                        {selectedAssignee && !selectedMemberExists && (
                            <option value={selectedAssignee}>
                                {`Former team member — ${selectedAssignee}`}
                            </option>
                        )}
                        {projectMembers.map((member) => (
                            <option key={member.id} value={member.name}>{member.name}</option>
                        ))}
                    </select>
                    <small
                        id="assignedToHelp"
                        className={`assignee-help${projectMembers.length === 0 ? " assignee-help-error" : ""}`}
                        aria-live="polite"
                    >
                        {projectMembers.length
                            ? "Choose a member assigned to this project."
                            : "No team members are assigned to this project."}
                    </small>

                    <label htmlFor="priority">Priority</label>
                    <select
                        id="priority"
                        required
                        disabled={!manager}
                        value={form.priority}
                        onChange={(event) => onFieldChange("priority", event.target.value)}
                    >
                        <option value="">Select priority</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>

                    <label htmlFor="deadline">Due date</label>
                    <input
                        type="date"
                        id="deadline"
                        required
                        disabled={!manager}
                        value={form.deadline}
                        onChange={(event) => onFieldChange("deadline", event.target.value)}
                    />

                    <label htmlFor="status">Status</label>
                    <select
                        id="status"
                        required
                        disabled={!manager}
                        value={form.status}
                        onChange={(event) => onFieldChange("status", event.target.value)}
                    >
                        <option value="">Select status</option>
                        <option value="To Do">To Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                    </select>

                    <button type="submit" className="tasks-add-button" disabled={!manager}>
                        <i className={`fa-solid ${isEditing ? "fa-pen" : "fa-plus"}`} aria-hidden="true"></i>{" "}
                        {isEditing ? "Update Task" : "Add Task"}
                    </button>
                </form>
            </div>
        </div>
    );
}
