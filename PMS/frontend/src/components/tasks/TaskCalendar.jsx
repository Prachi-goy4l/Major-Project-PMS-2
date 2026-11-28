import { useState } from "react";
import { firstOfMonth, formatDate, parseDate, WEEKDAYS } from "./taskUtils";

export default function TaskCalendar({ tasks }) {
    const [calendarDate, setCalendarDate] = useState(() => firstOfMonth(new Date()));
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPreviousMonth = new Date(year, month, 0).getDate();
    const today = new Date();
    const tasksByDate = new Map();

    tasks.forEach((task) => {
        if (!parseDate(task.deadline)) {
            return;
        }
        const dayTasks = tasksByDate.get(task.deadline) || [];
        dayTasks.push(task);
        tasksByDate.set(task.deadline, dayTasks);
    });

    const cells = WEEKDAYS.map((weekday) => (
        <div className="calendar-weekday" role="columnheader" key={`weekday-${weekday}`}>{weekday}</div>
    ));

    for (let index = 0; index < 42; index += 1) {
        let day;
        let cellDate;
        let outsideMonth = false;

        if (index < startOffset) {
            day = daysInPreviousMonth - startOffset + index + 1;
            cellDate = new Date(year, month - 1, day);
            outsideMonth = true;
        } else if (index >= startOffset + daysInMonth) {
            day = index - startOffset - daysInMonth + 1;
            cellDate = new Date(year, month + 1, day);
            outsideMonth = true;
        } else {
            day = index - startOffset + 1;
            cellDate = new Date(year, month, day);
        }

        const dateKey = [
            cellDate.getFullYear(),
            String(cellDate.getMonth() + 1).padStart(2, "0"),
            String(cellDate.getDate()).padStart(2, "0")
        ].join("-");
        const isToday = cellDate.toDateString() === today.toDateString();
        const dayTasks = tasksByDate.get(dateKey) || [];
        const classes = [
            "calendar-day",
            outsideMonth ? "calendar-day-outside" : "",
            isToday ? "calendar-day-today" : ""
        ].filter(Boolean).join(" ");

        cells.push(
            <div
                className={classes}
                role="gridcell"
                key={`day-${index}`}
                aria-label={`${formatDate(dateKey, { month: "long", day: "numeric", year: "numeric" })}${dayTasks.length ? `, ${dayTasks.length} task${dayTasks.length === 1 ? "" : "s"}` : ""}`}
            >
                <span className="calendar-day-number">{day}</span>
                <div className="calendar-day-tasks">
                    {dayTasks.map((task) => (
                        <div
                            key={task.id}
                            className={`calendar-task ${task.status === "Completed" ? "calendar-task-completed" : ""}`}
                            title={`${task.taskName ?? ""} — ${task.priority ?? ""} priority`}
                        >
                            <span className="calendar-task-marker" aria-hidden="true"></span>
                            <span className="calendar-task-name">{task.taskName || "Untitled task"}</span>
                            <span className="calendar-task-priority">{task.priority || "—"}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <section className="tasks-panel calendar-panel" aria-labelledby="calendarHeading">
            <div className="tasks-panel-heading calendar-panel-heading">
                <div>
                    <span className="tasks-section-icon"><i className="fa-regular fa-calendar" aria-hidden="true"></i></span>
                    <div>
                        <h2 id="calendarHeading">Calendar</h2>
                        <p>See every deadline at a glance.</p>
                    </div>
                </div>
                <div className="calendar-controls" aria-label="Calendar navigation">
                    <button
                        type="button"
                        id="previousMonth"
                        aria-label="Previous month"
                        onClick={() => setCalendarDate((date) => {
                            const next = new Date(date);
                            next.setMonth(next.getMonth() - 1);
                            return next;
                        })}
                    >
                        <i className="fa-solid fa-chevron-left" aria-hidden="true"></i>
                    </button>
                    <button type="button" id="todayMonth" onClick={() => setCalendarDate(firstOfMonth(new Date()))}>Today</button>
                    <button
                        type="button"
                        id="nextMonth"
                        aria-label="Next month"
                        onClick={() => setCalendarDate((date) => {
                            const next = new Date(date);
                            next.setMonth(next.getMonth() + 1);
                            return next;
                        })}
                    >
                        <i className="fa-solid fa-chevron-right" aria-hidden="true"></i>
                    </button>
                </div>
            </div>
            <h3 id="calendarMonth" className="calendar-month" aria-live="polite">
                {new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(calendarDate)}
            </h3>
            <div id="taskCalendar" className="task-calendar" role="grid" aria-labelledby="calendarMonth">
                {cells}
            </div>
        </section>
    );
}
