const React = window.React;
import { CheckCheck, Clock3, Dumbbell, Flame, Mountain, PartyPopper, RotateCcw, Sparkles, Users, Zap } from '../../lib/icons.js';
import { categoryFor, shortName } from '../../lib/game.js';

const IconFor = {
    avontuur: Mountain,
    sport: Dumbbell,
    sociaal: Users,
    grappig: PartyPopper,
    overig: Sparkles
};

export function Avatar({ name = '?', size = 'md', index = 0 }) {
    return React.createElement("div", { className: `avatar avatar--${size} avatar--color-${index % 6}`, title: name }, shortName(name));
}

export function PointBadge({ points, large = false }) {
    return React.createElement("span", { className: `point-badge ${large ? 'point-badge--large' : ''}` },
        React.createElement(Zap, { size: large ? 17 : 14, fill: "currentColor" }),
        points,
        " pt");
}

export function CategoryTag({ category }) {
    const c = categoryFor(category);
    const Icon = IconFor[c.id];
    return React.createElement("span", { className: `category-tag category-tag--${c.tone}` },
        React.createElement(Icon, { size: 13 }),
        c.label);
}

const statusLabels = { accepted: 'Bezig', pending: 'In beoordeling', approved: 'Voltooid', rejected: 'Afgekeurd' };

export function StatusTag({ status }) {
    if (!status) return null;
    const Icon = status === 'approved' ? CheckCheck : status === 'pending' ? Clock3 : status === 'rejected' ? RotateCcw : Flame;
    return React.createElement("span", { className: `status-tag status-tag--${status}` },
        React.createElement(Icon, { size: 13 }),
        statusLabels[status]);
}

export function NoResults({ icon: Icon = Sparkles, title, text, action }) {
    return React.createElement("div", { className: "empty-state" },
        React.createElement("div", { className: "empty-icon" },
            React.createElement(Icon, { size: 28 })),
        React.createElement("h3", null, title),
        React.createElement("p", null, text),
        action);
}

export function Loading() {
    return React.createElement("div", { className: "loading-state" },
        React.createElement("div", { className: "spin" }),
        React.createElement("p", null, "Even laden..."));
}
