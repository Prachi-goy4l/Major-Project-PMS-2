// Tiny client-side router built with plain functions + a plain component.
// No router library and no custom hooks: App.jsx keeps the current location in
// useState and listens for the events dispatched here from useEffect.
export const NAVIGATE_EVENT = "pms:navigate";

export function readLocation() {
    return {
        pathname: window.location.pathname,
        search: window.location.search
    };
}

export function navigate(to, options) {
    const replace = Boolean(options && options.replace);
    if (replace) {
        window.history.replaceState(null, "", to);
    } else {
        window.history.pushState(null, "", to);
    }
    window.dispatchEvent(new Event(NAVIGATE_EVENT));
}

// Drop-in replacement for react-router's <Link>: a normal <a href> that
// navigates without a full page load.
export function Link({ to, onClick, children, ...rest }) {
    function handleClick(event) {
        if (onClick) onClick(event);
        if (
            event.defaultPrevented ||
            event.button !== 0 ||
            event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
            rest.target === "_blank"
        ) {
            return;
        }
        event.preventDefault();
        navigate(to);
    }

    return (
        <a href={to} {...rest} onClick={handleClick}>
            {children}
        </a>
    );
}
