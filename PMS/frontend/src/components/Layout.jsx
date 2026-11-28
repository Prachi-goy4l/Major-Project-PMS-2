import { useState, useEffect, useRef } from "react";
import { Link, navigate } from "../utils/router";
import PMS from "../utils/pms";

// ---------------------------------------------------------------------------
// Global search (port of searchEverything() in layout.js)
// ---------------------------------------------------------------------------
let searchableRecordsPromise = null;

async function searchEverything(query, isOverallDashboard) {
    const searchTerm = query.trim().toLocaleLowerCase();

    if (!searchTerm) {
        return [];
    }

    if (!searchableRecordsPromise) {
        searchableRecordsPromise = Promise.all([
            PMS.fetchCollection("projects"),
            PMS.fetchCollection("tasks"),
            PMS.fetchCollection("teamMembers")
        ]).then(function (collections) {
            const [allProjects, allTasks, allMembers] = collections;
            const user = PMS.getUser();
            const allowedProjects = PMS.accessibleProjects(allProjects, user);
            const allowedIds = new Set(allowedProjects.map((project) => String(project.id)));
            const records = [];
            allowedProjects.forEach(function (project) {
                records.push({
                    type: "Project",
                    href: PMS.urlForPage("project-dashboard.html", project.id),
                    icon: "fa-folder",
                    record: project
                });
            });
            if (!isOverallDashboard) {
                allTasks.filter((task) => allowedIds.has(String(task.projectId))).forEach(function (task) {
                    records.push({
                        type: "Task",
                        href: PMS.urlForPage("tasks.html", task.projectId),
                        icon: "fa-square-check",
                        record: task
                    });
                });
                allMembers.filter((member) =>
                    Array.isArray(member.projectIds) &&
                    member.projectIds.some((id) => allowedIds.has(String(id)))
                ).forEach(function (member) {
                    const projectId = (member.projectIds || []).map(String).find((id) => allowedIds.has(id));
                    records.push({
                        type: "Team Member",
                        href: PMS.urlForPage("team.html", projectId),
                        icon: "fa-users",
                        record: member
                    });
                });
            }
            return records.map(function (entry) {
                const record = entry.record;
                const fields = Object.values(record)
                    .filter(function (value) {
                        return typeof value === "string" || typeof value === "number";
                    })
                    .map(String);

                return {
                    type: entry.type,
                    href: entry.href,
                    icon: entry.icon,
                    title: record.projectName || record.taskName || record.name || record.title || "Untitled",
                    detail: record.description || record.email || record.status || record.role || "",
                    searchText: fields.join(" ").toLocaleLowerCase()
                };
            });
        }).catch(function (error) {
            searchableRecordsPromise = null;
            throw error;
        });
    }

    const records = await searchableRecordsPromise;
    return records.filter(function (record) {
        return record.searchText.includes(searchTerm);
    });
}

// ---------------------------------------------------------------------------
// Layout (port of initLayout() in layout.js)
// ---------------------------------------------------------------------------
export default function Layout({ activePage, children }) {
    const projectId = PMS.projectIdFromUrl();

    const isOverallDashboard = activePage === "dashboard";
    const isProjectsPage = activePage === "projects" && !projectId;
    const isOverallNavigation = isOverallDashboard || isProjectsPage;
    const isProjectDashboard = activePage === "project-dashboard";
    const isProjectWorkspace = Boolean(projectId);

    const links = isOverallNavigation
        ? [
            { page: "dashboard", label: "Overall Dashboard", href: "/dashboard", icon: "fa-house" },
            { page: "projects", label: "Projects", href: "/projects", icon: "fa-folder" }
        ]
        : isProjectWorkspace
            ? [
                { page: "home", label: "Home", href: "/dashboard", icon: "fa-house" },
                { page: "project-dashboard", label: "Project Dashboard", href: PMS.urlForPage("project-dashboard.html", projectId), icon: "fa-house" },
                { page: "tasks", label: "Tasks", href: PMS.urlForPage("tasks.html", projectId), icon: "fa-square-check" },
                { page: "team", label: "Team", href: PMS.urlForPage("team.html", projectId), icon: "fa-users" },
                { page: "meetings", label: "Meetings", href: PMS.urlForPage("meetings.html", projectId), icon: "fa-calendar-days" },
                { page: "notes", label: "Notes", href: PMS.urlForPage("notes.html", projectId), icon: "fa-calendar-days" }
            ]
            : [
                { page: "dashboard", label: "Dashboard", href: "/dashboard", icon: "fa-house" },
                { page: "projects", label: "Projects", href: "/projects", icon: "fa-folder" }
            ];

    useEffect(() => {
        const classMap = {
            "layout-portfolio": isOverallNavigation,
            "layout-overall-dashboard": isOverallDashboard,
            "layout-project-dashboard": isProjectDashboard
        };
        const names = Object.keys(classMap).filter((name) => classMap[name]);
        names.forEach((name) => document.body.classList.add(name));
        return () => names.forEach((name) => document.body.classList.remove(name));
    }, [isOverallNavigation, isOverallDashboard, isProjectDashboard]);

    // A fresh page load used to start with an empty search cache.
    useEffect(() => {
        searchableRecordsPromise = null;
        return () => {
            document.body.classList.remove("layout-menu-open");
        };
    }, []);

    const [menuOpen, setMenuOpen] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);
    const [search, setSearch] = useState({ results: [], message: "" });
    const searchRequest = useRef(0);
    const searchInputRef = useRef(null);
    const searchWrapperRef = useRef(null);
    const accountRef = useRef(null);

    useEffect(() => {
        document.body.classList.toggle("layout-menu-open", menuOpen);
    }, [menuOpen]);

    useEffect(() => {
        function onDocumentClick(event) {
            if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target)) {
                setSearch({ results: [], message: "" });
            }
            if (accountRef.current && !accountRef.current.contains(event.target)) {
                setAccountOpen(false);
            }
        }
        document.addEventListener("click", onDocumentClick);
        return () => document.removeEventListener("click", onDocumentClick);
    }, []);

    const signedInUser = PMS.getUser();
    const displayName = signedInUser && signedInUser.name ? signedInUser.name : "Admin";

    async function handleSearchInput(event) {
        const query = event.target.value.trim();
        const requestId = ++searchRequest.current;

        if (!query) {
            setSearch({ results: [], message: "" });
            return;
        }

        setSearch({ results: [], message: "Searching..." });

        try {
            const results = await searchEverything(query, isOverallDashboard);

            if (requestId !== searchRequest.current) {
                return;
            }

            setSearch({ results, message: results.length ? "" : "No matching results." });
        } catch (error) {
            if (requestId !== searchRequest.current) {
                return;
            }

            console.error("Search error:", error);
            setSearch({ results: [], message: "Search is unavailable. Make sure JSON Server is running." });
        }
    }

    function handleSearchKeyDown(event) {
        if (event.key === "Escape") {
            setSearch({ results: [], message: "" });
            searchInputRef.current.blur();
            setAccountOpen(false);
        }
    }

    function handleSignOut() {
        PMS.signOut();
        navigate("/login");
    }

    function renderLinks(withIcons) {
        return links.map(function (link) {
            const current = link.page === activePage;
            return (
                <li key={link.page}>
                    <Link
                        to={link.href}
                        className={current ? "active" : undefined}
                        aria-current={current ? "page" : undefined}
                        onClick={withIcons ? () => setMenuOpen(false) : undefined}
                    >
                        {withIcons ? (
                            <>
                                <i className={`fa-solid ${link.icon}`} aria-hidden="true"></i>
                                <span>{link.label}</span>
                            </>
                        ) : (
                            link.label
                        )}
                    </Link>
                </li>
            );
        });
    }

    const searchHidden = search.message ? false : search.results.length === 0;

    return (
        <>
            {!isOverallNavigation && (
                <aside className="layout-sidebar" aria-label="Main sidebar">
                    <Link className="layout-brand" to="/" onClick={() => setMenuOpen(false)}>
                        <span className="layout-brand-icon" aria-hidden="true">
                            <i className="fa-solid fa-layer-group"></i>
                        </span>
                        <span>WorkSphere</span>
                    </Link>
                    <nav className="layout-navigation" aria-label="Main navigation">
                        <ul>{renderLinks(true)}</ul>
                    </nav>
                    <div className="layout-tagline">Plan <span>|</span> Organize <span>|</span> Achieve</div>
                </aside>
            )}

            <div className="layout-topbar" role="banner">
                {isOverallNavigation ? (
                    <>
                        <Link className="layout-brand" to="/">
                            <span className="layout-brand-icon" aria-hidden="true">
                                <i className="fa-solid fa-layer-group"></i>
                            </span>
                            <span>WorkSphere</span>
                        </Link>
                        <nav className="layout-portfolio-navigation" aria-label="Portfolio navigation">
                            <ul>{renderLinks(false)}</ul>
                        </nav>
                    </>
                ) : (
                    <button
                        className="layout-menu-toggle"
                        type="button"
                        aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
                        aria-expanded={menuOpen ? "true" : "false"}
                        onClick={() => setMenuOpen(!menuOpen)}
                    >
                        <i className="fa-solid fa-bars" aria-hidden="true"></i>
                    </button>
                )}

                <div className="layout-search-wrapper" ref={searchWrapperRef}>
                    <label className="layout-search">
                        <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
                        <input
                            type="search"
                            placeholder={isOverallDashboard ? "Search your projects..." : "Search projects, tasks, or team members..."}
                            aria-label="Search"
                            autoComplete="off"
                            ref={searchInputRef}
                            onInput={handleSearchInput}
                            onKeyDown={handleSearchKeyDown}
                        />
                    </label>
                    <div
                        className="layout-search-results"
                        role="listbox"
                        aria-label="Search results"
                        hidden={searchHidden}
                    >
                        {search.message ? (
                            <p className="layout-search-message">{search.message}</p>
                        ) : (
                            search.results.map(function (result, index) {
                                return (
                                    <Link
                                        key={`${result.href}-${index}`}
                                        className="layout-search-result"
                                        to={result.href}
                                        role="option"
                                    >
                                        <i className={`fa-solid ${result.icon}`} aria-hidden="true"></i>
                                        <span className="layout-search-result-text">
                                            <strong>{result.title}</strong>
                                            <small>{`${result.type}${result.detail ? ` · ${result.detail}` : ""}`}</small>
                                        </span>
                                    </Link>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="layout-user">
                    <div className="layout-account" ref={accountRef}>
                        <button
                            className="layout-account-toggle"
                            type="button"
                            aria-expanded={accountOpen ? "true" : "false"}
                            aria-haspopup="true"
                            onClick={() => setAccountOpen(!accountOpen)}
                        >
                            <span className="layout-avatar" aria-hidden="true">
                                {displayName.charAt(0).toUpperCase()}
                            </span>
                            <span className="layout-user-name">{displayName}</span>
                            <i className="fa-solid fa-chevron-down layout-user-chevron" aria-hidden="true"></i>
                        </button>
                        <div className="layout-account-menu" role="menu" hidden={!accountOpen}>
                            <Link className="layout-profile-link" to="/profile" role="menuitem">
                                <i className="fa-solid fa-user" aria-hidden="true"></i>
                                Profile
                            </Link>
                            <button className="layout-signout" type="button" role="menuitem" onClick={handleSignOut}>
                                <i className="fa-solid fa-right-from-bracket" aria-hidden="true"></i>
                                Sign out
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="layout-main">{children}</div>
        </>
    );
}
