import { useState, useEffect, useCallback, useMemo } from "react";
import Layout from "../components/Layout";
import TaskModal from "../components/tasks/TaskModal";
import CompletedTasks from "../components/tasks/CompletedTasks";
import TaskCalendar from "../components/tasks/TaskCalendar";
import TaskTable from "../components/tasks/TaskTable";
import PMS from "../utils/pms";

const INITIAL_TASK_STORE = {
    projects: [
        { id: "1", projectName: "Website Redesign" },
        { id: "2", projectName: "Mobile App Launch" }
    ],
    tasks: [
        {
            id: 1,
            taskName: "Finalize homepage wireframes",
            description: "Review and approve the homepage layout.",
            projectId: "1",
            assignedTo: "Alex Morgan",
            assignedToUserId: "member-1",
            priority: "High",
            deadline: "2026-12-02",
            status: "In Progress"
        },
        {
            id: 2,
            taskName: "Prepare launch checklist",
            description: "Collect the remaining release and QA items.",
            projectId: "2",
            assignedTo: "Jordan Lee",
            assignedToUserId: "member-2",
            priority: "Medium",
            deadline: "2026-12-08",
            status: "To Do"
        },
        {
            id: 3,
            taskName: "Approve brand guidelines",
            description: "Confirm the final colors and typography.",
            projectId: "1",
            assignedTo: "Alex Morgan",
            assignedToUserId: "member-1",
            priority: "Low",
            deadline: "2026-11-20",
            status: "Completed"
        }
    ],
    teamMembers: [
        { id: 1, userId: "member-1", name: "Alex Morgan", projectIds: ["1"] },
        { id: 2, userId: "member-2", name: "Jordan Lee", projectIds: ["2"] }
    ]
};

const EMPTY_FORM = {
    taskName: "",
    taskDescription: "",
    taskProject: "",
    assignedTo: "",
    priority: "",
    deadline: "",
    status: ""
};

export default function Tasks() {
    useEffect(() => {
        document.title = "Task Management";
    }, []);

    const [user] = useState(() => PMS.getSignedInUser());
    const workspaceProjectId = PMS.projectIdFromUrl() || "";
    const manager = !user || PMS.isManager(user);
    const [store, setStore] = useState(() => {
        const projects = PMS.accessibleProjects(INITIAL_TASK_STORE.projects, user);
        const allowedProjectIds = new Set(projects.map((project) => String(project.id)));
        return {
            projects,
            tasks: INITIAL_TASK_STORE.tasks.filter((task) => allowedProjectIds.has(String(task.projectId))),
            teamMembers: INITIAL_TASK_STORE.teamMembers.filter((member) =>
                member.projectIds.some((id) => allowedProjectIds.has(String(id)))
            )
        };
    });
    const { projects, tasks, teamMembers } = store;
    const [searchValue, setSearchValue] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editTaskId, setEditTaskId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [selectedAssignee, setSelectedAssignee] = useState("");

    const projectById = useMemo(
        () => new Map(projects.map((project) => [String(project.id), project])),
        [projects]
    );

    const visibleTasks = tasks.filter((task) => {
        const searchTerm = searchValue.trim().toLocaleLowerCase();
        const text = [
            task.taskName,
            task.description,
            task.assignedTo,
            task.priority,
            task.status,
            task.deadline
        ].join(" ").toLocaleLowerCase();
        return (!searchTerm || text.includes(searchTerm)) &&
            (!workspaceProjectId || String(task.projectId) === workspaceProjectId);
    });
    const scopedTasks = workspaceProjectId
        ? tasks.filter((task) => String(task.projectId) === workspaceProjectId)
        : tasks;

    const activeProjectId = workspaceProjectId || form.taskProject;
    const projectMembers = activeProjectId
        ? teamMembers.filter((member) =>
            Array.isArray(member.projectIds) && member.projectIds.map(String).includes(activeProjectId))
        : [];
    const workspaceProjectName = projectById.get(workspaceProjectId)?.projectName;

    function updateTasks(update) {
        setStore((current) => ({
            ...current,
            tasks: update(current.tasks)
        }));
    }

    const closeModal = useCallback(function closeModal() {
        setModalOpen(false);
        setForm(EMPTY_FORM);
        setSelectedAssignee("");
        setEditTaskId(null);
    }, []);

    function updateField(name, value) {
        setForm((current) => ({ ...current, [name]: value }));
    }

    function handleProjectChange(projectId) {
        setSelectedAssignee("");
        setForm((current) => ({
            ...current,
            taskProject: projectId,
            assignedTo: ""
        }));
    }

    function openAddModal() {
        if (!manager) {
            return;
        }
        setEditTaskId(null);
        setForm(EMPTY_FORM);
        setSelectedAssignee("");
        setModalOpen(true);
    }

    function openEditModal(id) {
        if (!manager) {
            return;
        }
        const task = tasks.find((item) => String(item.id) === String(id));
        if (!task) {
            return;
        }

        setForm({
            taskName: task.taskName || "",
            taskDescription: task.description || "",
            taskProject: String(task.projectId),
            assignedTo: task.assignedTo || "",
            priority: task.priority || "",
            deadline: task.deadline || "",
            status: task.status || ""
        });
        setSelectedAssignee(task.assignedTo || "");
        setEditTaskId(id);
        setModalOpen(true);
    }

    function deleteTask(id) {
        if (!manager || !confirm("Are you sure you want to delete this task?")) {
            return;
        }
        updateTasks((items) => items.filter((task) => String(task.id) !== String(id)));
        alert("Task deleted successfully!");
    }

    function updateTaskStatus(task, nextStatus) {
        if (manager) {
            return;
        }
        const assignedMember = teamMembers.find((member) =>
            String(member.userId) === String(user?.id) &&
            Array.isArray(member.projectIds) &&
            member.projectIds.map(String).includes(String(task.projectId)) &&
            member.name === task.assignedTo
        );
        const canUpdate = user && (
            String(task.assignedToUserId || assignedMember?.userId || "") === String(user.id) ||
            (!task.assignedToUserId && !assignedMember && task.assignedTo === user.name)
        );
        if (!canUpdate) {
            return;
        }
        updateTasks((items) => items.map((item) =>
            String(item.id) === String(task.id) ? { ...item, status: nextStatus } : item
        ));
    }

    function handleSubmit(event) {
        event.preventDefault();
        if (!manager) {
            return;
        }

        const taskProjectId = workspaceProjectId || form.taskProject;
        const assignedMember = teamMembers.find((member) =>
            member.name === form.assignedTo &&
            Array.isArray(member.projectIds) &&
            member.projectIds.map(String).includes(String(taskProjectId))
        );
        const taskData = {
            taskName: form.taskName.trim(),
            description: form.taskDescription.trim(),
            assignedTo: form.assignedTo,
            assignedToUserId: assignedMember?.userId || "",
            projectId: String(taskProjectId),
            priority: form.priority,
            deadline: form.deadline,
            status: form.status
        };

        if (Object.values(taskData).some((value) => value === "")) {
            alert("Please fill all fields.");
            return;
        }

        if (editTaskId === null) {
            const nextId = store.tasks.reduce((highest, task) => Math.max(highest, Number(task.id) || 0), 0) + 1;
            updateTasks((items) => [...items, { id: nextId, ...taskData }]);
            alert("Task added successfully!");
        } else {
            updateTasks((items) => items.map((task) =>
                String(task.id) === String(editTaskId) ? { id: editTaskId, ...taskData } : task
            ));
            alert("Task updated successfully!");
        }
        closeModal();
    }

    return (
        <Layout activePage="tasks">
            <main className="tasks-page">
                <header className="tasks-page-heading">
                    <div>
                        <span className="tasks-eyebrow">WORKSPACE</span>
                        <h1>Tasks</h1>
                        <p id="taskScopeDescription">
                            {workspaceProjectId && projects.length > 0
                                ? `Tasks and deadlines for ${workspaceProjectName || "this project"}.`
                                : "Keep track of your work, deadlines, and completed tasks."}
                        </p>
                    </div>
                    <button
                        type="button"
                        id="openTaskModal"
                        className="tasks-add-button"
                        hidden={!manager}
                        style={manager ? undefined : { display: "none" }}
                        disabled={manager && projects.length === 0}
                        onClick={openAddModal}
                    >
                        <i className="fa-solid fa-plus" aria-hidden="true"></i>
                        Add task
                    </button>
                </header>

                <TaskTable
                    tasks={visibleTasks}
                    allTasks={scopedTasks}
                    projectById={projectById}
                    manager={manager}
                    user={user}
                    teamMembers={teamMembers}
                    searchValue={searchValue}
                    onSearchChange={setSearchValue}
                    onEdit={openEditModal}
                    onDelete={deleteTask}
                    onStatusChange={updateTaskStatus}
                />
                <TaskCalendar tasks={visibleTasks} />
                <CompletedTasks
                    tasks={visibleTasks}
                    projectById={projectById}
                    manager={manager}
                    user={user}
                    teamMembers={teamMembers}
                    onEdit={openEditModal}
                    onDelete={deleteTask}
                    onStatusChange={updateTaskStatus}
                />
            </main>

            <TaskModal
                isOpen={modalOpen}
                isEditing={editTaskId !== null}
                form={form}
                projects={projects}
                projectMembers={projectMembers}
                selectedAssignee={selectedAssignee}
                workspaceProjectId={workspaceProjectId}
                workspaceProjectName={workspaceProjectName}
                manager={manager}
                onClose={closeModal}
                onSubmit={handleSubmit}
                onFieldChange={updateField}
                onProjectChange={handleProjectChange}
            />
        </Layout>
    );
}
