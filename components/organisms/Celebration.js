const React = window.React;
import { PartyPopper } from '../../lib/icons.js';

export default function Celebration({ text }) {
    return React.createElement("div", { className: "celebration-overlay", role: "status", "aria-live": "polite" },
        React.createElement("div", { className: "celebration-message" },
            React.createElement(PartyPopper, { size: 25 }),
            React.createElement("strong", null, text)),
        Array.from({ length: 48 }, (_, index) => React.createElement("span", {
            className: "celebration-confetti",
            key: index,
            "aria-hidden": "true",
            style: {
                left: `${(index * 37) % 100}%`,
                '--confetti-delay': `${(index % 12) * 55}ms`,
                '--confetti-hue': `${(index * 47) % 360}deg`
            }
        })));
}
