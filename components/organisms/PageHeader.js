const React = window.React;
import { Link2, Plus } from '../../lib/icons.js';

const pageText = {
    home: ['DASHBOARD', null, 'Tijd om punten te pakken. Wie staat er straks bovenaan?'],
    challenges: ['CHALLENGES', 'Alle challenges', 'Kies je volgende uitdaging. De punten liggen voor het oprapen.'],
    shop: ['SHOP', 'Beloningen van de groep', 'Ruil je verdiende punten in voor beloningen van je groepsgenoten.'],
    roulette: ['ROULETTE', 'Roulette', 'Waag je punten aan een draai van het Europese roulettewiel.'],
    ranking: ['KLASSEMENT', 'Het klassement', 'Alle punten tellen. Wie pakt de winst?'],
    reviews: ['BEOORDELEN', 'Bewijs beoordelen', 'Help je groepsgenoten aan hun verdiende punten.'],
    settings: ['INSTELLINGEN', 'Instellingen', 'Pas je profiel en spelvoorkeuren aan.']
};

export default function PageHeader({ groupName, profileName, tab, onInvite, onAdd }) {
    const [label, title, description] = pageText[tab] || pageText.home;
    return React.createElement("div", { className: "page-heading" },
        React.createElement("div", null,
            React.createElement("div", { className: "eyebrow" },
                React.createElement("span", { className: "eyebrow-line" }),
                " ",
                (groupName || 'PROFIEL').toUpperCase(),
                " ",
                React.createElement("span", { className: "eyebrow-sep" }, "/"),
                " ",
                label),
            React.createElement("h1", null, tab === 'home' ? `Hey, ${profileName.split(' ')[0]} 👋` : title),
            React.createElement("p", null, description)),
        React.createElement("div", { className: "header-actions" },
            React.createElement("button", { className: "button button--outline button--header", onClick: onInvite }, React.createElement(Link2, { size: 17 }), " Uitnodigen"),
            tab !== 'shop' && tab !== 'roulette' && React.createElement("button", { className: "button button--primary button--header", onClick: onAdd }, React.createElement(Plus, { size: 18 }), " Challenge maken")));
}
