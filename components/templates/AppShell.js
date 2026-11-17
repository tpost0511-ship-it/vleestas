const React = window.React;

export default function AppShell({ children }) {
    return React.createElement("div", { className: "app-layout" }, children);
}
