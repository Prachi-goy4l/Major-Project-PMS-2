import { useState, useEffect, useRef } from "react";
import { Link } from "../utils/router";

const previewData = {
    Projects: [
        ["Website Development", "In Progress"],
        ["Mobile App Design", "In Progress"],
        ["PMS Development", "Completed"]
    ],
    Tasks: [
        ["Design Dashboard", "In Progress"],
        ["Database Schema", "In Progress"],
        ["Test Authentication", "Completed"]
    ],
    Team: [
        ["Development Team", "Active"],
        ["Design Team", "Active"],
        ["Project Management", "Active"]
    ]
};

const NAV_SECTIONS = ["features", "solutions", "resources", "about"];

const features = [
    { icon: "fa-solid fa-layer-group", title: "Projects", text: "Manage projects, deadlines and progress from one organized workspace." },
    { icon: "fa-solid fa-check", title: "Tasks", text: "Track work, assign tasks and monitor task completion easily." },
    { icon: "fa-solid fa-users", title: "Teams", text: "Organize team members and keep everyone connected." },
    { icon: "fa-regular fa-comments", title: "Communication", text: "Stay connected with your team through project-based communication." },
    { icon: "fa-regular fa-calendar", title: "Calendar", text: "Never miss deadlines, meetings or important project events." },
    { icon: "fa-solid fa-chart-column", title: "Reports", text: "Understand project progress with clear and useful reports." }
];

function FeatureCard({ icon, title, text }) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return undefined;

        if (!("IntersectionObserver" in window)) {
            setVisible(true);
            return undefined;
        }

        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });

        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    return (
        <article className={`feature-card${visible ? " visible" : ""}`} ref={ref}>
            <div className="feature-icon"><i className={icon}></i></div>
            <h3>{title}</h3>
            <p>{text}</p>
        </article>
    );
}

export default function Landing() {
    useEffect(() => {
        document.title = "WorkSphere - Project Management";
    }, []);

    const [navOpen, setNavOpen] = useState(false);
    const [activeSection, setActiveSection] = useState("");
    const [previewTab, setPreviewTab] = useState("Projects");

    // ================= ACTIVE NAV LINK =================
    useEffect(() => {
        function updateActiveNavigation() {
            let currentSection = "";

            NAV_SECTIONS.map((id) => document.getElementById(id))
                .filter(Boolean)
                .forEach(function (section) {
                    if (section.getBoundingClientRect().top <= 150) {
                        currentSection = section.id;
                    }
                });

            setActiveSection(currentSection);
        }

        window.addEventListener("scroll", updateActiveNavigation, { passive: true });
        updateActiveNavigation();
        return () => window.removeEventListener("scroll", updateActiveNavigation);
    }, []);

    // ================= SMOOTH SCROLL =================
    function smoothScroll(event) {
        const targetId = event.currentTarget.getAttribute("href");
        const targetElement = document.querySelector(targetId);

        if (!targetElement) return;

        event.preventDefault();

        targetElement.scrollIntoView({
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
            block: "start"
        });

        // Update the URL fragment without reloading the page.
        history.replaceState(null, "", targetId);
    }

    function navAnchor(id, label) {
        return (
            <a
                href={`#${id}`}
                className={activeSection === id ? "active" : undefined}
                onClick={(event) => {
                    smoothScroll(event);
                    setNavOpen(false);
                }}
            >
                {label}
            </a>
        );
    }

    return (
        <>
            {/* NAVBAR */}
            <header className="navbar">
                <Link to="/" className="logo">
                    <span className="logo-icon">
                        <i className="fa-solid fa-layer-group"></i>
                    </span>
                    <span className="logo-text">WorkSphere</span>
                </Link>

                <nav className={`nav-links${navOpen ? " open" : ""}`}>
                    {navAnchor("features", "Features")}
                    {navAnchor("solutions", "Solutions")}
                    {navAnchor("resources", "Resources")}
                    {navAnchor("about", "About Us")}
                    <Link to="/login" onClick={() => setNavOpen(false)}>Login</Link>
                    <Link to="/signup" className="nav-button" onClick={() => setNavOpen(false)}>Get Started</Link>
                </nav>

                <button
                    className="mobile-menu-btn"
                    id="mobileMenuBtn"
                    aria-label="Toggle navigation"
                    aria-expanded={navOpen ? "true" : "false"}
                    onClick={() => setNavOpen(!navOpen)}
                >
                    <i className={navOpen ? "fa-solid fa-xmark" : "fa-solid fa-bars"}></i>
                </button>
            </header>

            <main>
                {/* HERO SECTION */}
                <section className="hero" id="home">
                    <div className="hero-content">
                        <span className="hero-label">PROJECT MANAGEMENT</span>

                        <h1>
                            Plan. Collaborate. Track.<br />
                            Deliver better projects together.
                        </h1>

                        <p>
                            Manage projects, tasks, teams and communication from
                            one simple and powerful workspace.
                        </p>

                        <div className="hero-buttons">
                            <Link to="/signup" className="primary-btn">Get Started</Link>
                            <a href="#features" className="secondary-btn" onClick={smoothScroll}>Explore Features</a>
                        </div>
                    </div>

                    {/* Dashboard Preview */}
                    <div className="dashboard-preview">
                        <div className="preview-header">
                            <span className="preview-title">Dashboard Preview</span>
                            <div className="preview-dots"><span></span><span></span><span></span></div>
                        </div>

                        <div className="preview-tabs">
                            {Object.keys(previewData).map((tab) => (
                                <button
                                    key={tab}
                                    className={previewTab === tab ? "active" : undefined}
                                    type="button"
                                    onClick={() => setPreviewTab(tab)}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className="preview-line"></div>

                        {previewData[previewTab].map(([name, status]) => (
                            <div className="project-item" key={name}>
                                <span className="project-icon">▰</span>
                                <span className="preview-item-name">{name}</span>
                                <span className="project-status">{status}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* FEATURES */}
                <section className="features-section" id="features">
                    <div className="section-heading">
                        <span>POWERFUL FEATURES</span>
                        <h2>EVERYTHING YOUR TEAM NEEDS</h2>
                        <p>Everything you need to organize work and deliver projects together.</p>
                    </div>

                    <div className="features-grid">
                        {features.map((feature) => (
                            <FeatureCard key={feature.title} {...feature} />
                        ))}
                    </div>
                </section>

                {/* SOLUTIONS */}
                <section className="cta-section" id="solutions">
                    <div className="cta-content">
                        <span>COLLABORATE WITH CONFIDENCE</span>
                        <h2>WORK BETTER. TOGETHER.</h2>
                        <p>Projects → Tasks → Teams → Communication → Reports</p>
                        <Link to="/signup" className="cta-button">Start Managing</Link>
                    </div>
                </section>

                {/* RESOURCES */}
                <section className="resources-section" id="resources">
                    <div className="resources-content">
                        <span className="section-eyebrow">RESOURCES</span>
                        <h2>Everything you need to get started</h2>
                        <p>Explore WorkSphere's features and learn how to organize projects, coordinate tasks, and keep your team connected.</p>

                        <div className="resource-links">
                            <a href="#features" onClick={smoothScroll}>
                                <i className="fa-solid fa-book-open"></i>
                                <span><strong>Documentation</strong><small>Explore the tools available in WorkSphere.</small></span>
                                <i className="fa-solid fa-arrow-right"></i>
                            </a>
                            <a href="#about" onClick={smoothScroll}>
                                <i className="fa-regular fa-circle-question"></i>
                                <span><strong>Help &amp; Information</strong><small>Learn more about the WorkSphere workspace.</small></span>
                                <i className="fa-solid fa-arrow-right"></i>
                            </a>
                        </div>
                    </div>
                </section>

                {/* ABOUT US */}
                <section className="about-section" id="about">
                    <div className="about-content">
                        <div className="about-icon"><i className="fa-solid fa-people-group"></i></div>
                        <span className="section-eyebrow">ABOUT WORKSPHERE</span>
                        <h2>Better teamwork starts with a better workspace.</h2>
                        <p>
                            WorkSphere brings projects, tasks, team collaboration and
                            progress tracking together in one organized place, helping
                            teams stay aligned and work toward shared goals.
                        </p>
                        <Link to="/signup" className="primary-btn">Get Started</Link>
                    </div>
                </section>
            </main>

            {/* FOOTER */}
            <footer className="footer">
                <div className="footer-top">
                    <div className="footer-brand">
                        <a href="#home" className="logo" onClick={smoothScroll}>
                            <span className="logo-icon">◈</span>
                            <span>WorkSphere</span>
                        </a>
                        <p>Plan, collaborate, and deliver better projects together.</p>
                    </div>

                    <div className="footer-column">
                        <h4>Product</h4>
                        <a href="#features" onClick={smoothScroll}>Features</a>
                        <a href="#solutions" onClick={smoothScroll}>Solutions</a>
                        <a href="#features" onClick={smoothScroll}>Tasks &amp; Teams</a>
                    </div>

                    <div className="footer-column">
                        <h4>Company</h4>
                        <a href="#about" onClick={smoothScroll}>About Us</a>
                        <a href="#about" onClick={smoothScroll}>Contact Information</a>
                    </div>

                    <div className="footer-column">
                        <h4>Resources</h4>
                        <a href="#resources" onClick={smoothScroll}>Documentation</a>
                        <a href="#resources" onClick={smoothScroll}>Help &amp; Information</a>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>© 2026 WorkSphere. All rights reserved.</p>
                </div>
            </footer>
        </>
    );
}
