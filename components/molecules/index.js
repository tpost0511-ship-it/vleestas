const React = window.React;
const { useEffect, useState } = React;
import {
    AlertCircle, ArrowRight, Check, CheckCheck, CheckCircle2, CircleCheckBig, Clock3,
    Dumbbell, Gift, LockKeyhole, Mountain, PartyPopper, Sparkles, Trophy, Users, X, Zap
} from '../../lib/icons.js';
import { DAILY_CHALLENGE_BONUS, categoryFor, formatDate } from '../../lib/game.js';
import { logIn, signUp } from '../../lib/data.js';
import { Avatar, CategoryTag, PointBadge, StatusTag } from '../atoms/index.js';

export function DailyBonusBanner({ earned }) {
    return React.createElement("section", { className: `daily-bonus-banner${earned ? ' daily-bonus-banner--earned' : ''}` },
        React.createElement("div", { className: "daily-bonus-icon" }, React.createElement(Zap, { size: 21, fill: "currentColor" })),
        React.createElement("div", null,
            React.createElement("strong", null, earned ? "Dagbonus al verdiend!" : "Pak je dagelijkse bonus"),
            React.createElement("p", null, earned
                ? "Je hebt vandaag je eerste challengebonus al ontvangen."
                : `Rond vandaag je eerste challenge af. Na goedkeuring krijg je ${DAILY_CHALLENGE_BONUS} bonuspunten.`)),
        React.createElement("span", null, `+${DAILY_CHALLENGE_BONUS} pt`));
}

export function Modal({ title, subtitle, onClose, children, wide = false }) {
    useEffect(() => {
        const onKey = event => {
            if (event.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [onClose]);
    return React.createElement("div", {
        className: "modal-backdrop",
        onMouseDown: event => {
            if (event.target === event.currentTarget) onClose();
        }
    },
        React.createElement("section", { role: "dialog", "aria-modal": "true", "aria-label": title, className: `modal ${wide ? 'modal--wide' : ''}` },
            React.createElement("div", { className: "modal-heading" },
                React.createElement("div", null,
                    React.createElement("h2", null, title),
                    subtitle && React.createElement("p", null, subtitle)),
                React.createElement("button", { className: "icon-button", "aria-label": "Sluiten", onClick: onClose },
                    React.createElement(X, { size: 19 }))),
            children));
}

export function Toast({ value, onClose }) {
    useEffect(() => {
        if (!value) return;
        const timer = setTimeout(onClose, 4600);
        return () => clearTimeout(timer);
    }, [value, onClose]);
    if (!value) return null;
    return React.createElement("div", { className: `toast ${value.error ? 'toast--error' : ''}`, role: "status" },
        value.error ? React.createElement(AlertCircle, { size: 19 }) : React.createElement(CircleCheckBig, { size: 19 }),
        React.createElement("span", null, value.text),
        React.createElement("button", { onClick: onClose, "aria-label": "Sluiten" },
            React.createElement(X, { size: 16 })));
}

export function AuthScreen({ onToast }) {
    const [mode, setMode] = useState('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const submit = async event => {
        event.preventDefault();
        setMessage('');
        setBusy(true);
        try {
            if (mode === 'signup') {
                if (name.trim().length < 2) throw new Error('Vul een naam van minimaal 2 tekens in.');
                if (password.length < 6) throw new Error('Gebruik een wachtwoord van minimaal 6 tekens.');
                const result = await signUp(name, email, password);
                if (!result.session) {
                    setMessage('Account gemaakt! Open de bevestigingsmail en klik op de link. Daarna kun je inloggen.');
                    setMode('login');
                }
                else {
                    onToast('Je account is aangemaakt!');
                }
            }
            else {
                await logIn(email, password);
                onToast('Welkom terug!');
            }
        }
        catch (error) {
            setMessage(error.message || 'Inloggen mislukt.');
        }
        finally {
            setBusy(false);
        }
    };
    return React.createElement("div", { className: "auth-page" },
        React.createElement("div", { className: "auth-shell" },
            React.createElement("div", { className: "auth-brand" },
                React.createElement("img", { className: "brand-logo", src: "/logo.png", alt: "Al 4 jaar VleesTas" })),
            React.createElement("div", { className: "auth-grid" },
                React.createElement("div", { className: "auth-intro" },
                    React.createElement("div", { className: "eyebrow light" },
                        React.createElement(Sparkles, { size: 15 }),
                        " THE FRIEND GROUP CHALLENGE APP"),
                    React.createElement("h1", null,
                        "Jullie vrienden.",
                        React.createElement("br", null),
                        React.createElement("span", null, "Jullie challenges."),
                        React.createElement("br", null),
                        "Jullie strijd."),
                    React.createElement("p", null, "Daag elkaar uit, lever bewijs in en pak die eerste plek op het klassement. Elke challenge telt."),
                    React.createElement("div", { className: "auth-feature-row" },
                        React.createElement("span", null, React.createElement(Check, { size: 16 }), " Privégroepen"),
                        React.createElement("span", null, React.createElement(Check, { size: 16 }), " Eigen challenges"),
                        React.createElement("span", null, React.createElement(Check, { size: 16 }), " Live punten")),
                    React.createElement("div", { className: "auth-graphic" },
                        React.createElement("div", { className: "auth-glow" }),
                        React.createElement("div", { className: "auth-medal" }, React.createElement(Trophy, { size: 46, strokeWidth: 2 })),
                        React.createElement("div", { className: "auth-bubble auth-bubble--one" }, React.createElement(Zap, { size: 15, fill: "currentColor" }), " +250 punten"),
                        React.createElement("div", { className: "auth-bubble auth-bubble--two" }, React.createElement(CheckCheck, { size: 17 }), " Challenge voltooid!"),
                        React.createElement("div", { className: "auth-spark auth-spark--a" }, "✦"),
                        React.createElement("div", { className: "auth-spark auth-spark--b" }, "✳"))),
                React.createElement("div", { className: "auth-form-panel" },
                    React.createElement("div", { className: "auth-form-heading" },
                        React.createElement("div", { className: "auth-pill" }, React.createElement(LockKeyhole, { size: 14 }), " Alleen jouw vriendengroep"),
                        React.createElement("h2", null, mode === 'signup' ? 'Maak je account' : 'Welkom terug'),
                        React.createElement("p", null, mode === 'signup' ? 'Start met challenges voor je vriendengroep.' : 'Log in en ga verder waar je gebleven was.')),
                    React.createElement("form", { onSubmit: submit, className: "form-stack" },
                        mode === 'signup' && React.createElement("label", null,
                            "Jouw naam",
                            React.createElement("input", { autoComplete: "name", maxLength: 40, placeholder: "Bijv. Thijmen", value: name, onChange: event => setName(event.target.value), required: true })),
                        React.createElement("label", null,
                            "E-mailadres",
                            React.createElement("input", { autoComplete: "email", type: "email", placeholder: "jij@voorbeeld.nl", value: email, onChange: event => setEmail(event.target.value), required: true })),
                        React.createElement("label", null,
                            "Wachtwoord",
                            React.createElement("input", { autoComplete: mode === 'signup' ? 'new-password' : 'current-password', type: "password", placeholder: "Minimaal 6 tekens", minLength: 6, value: password, onChange: event => setPassword(event.target.value), required: true })),
                        message && React.createElement("div", { className: `form-note ${message.startsWith('Account') ? 'form-note--success' : ''}` }, message),
                        React.createElement("button", { disabled: busy, className: "button button--primary button--full", type: "submit" },
                            busy ? 'Even wachten...' : mode === 'signup' ? 'Account aanmaken' : 'Inloggen',
                            React.createElement(ArrowRight, { size: 18 }))),
                    React.createElement("p", { className: "auth-switch" },
                        mode === 'signup' ? 'Heb je al een account?' : 'Nog geen account?',
                        " ",
                        React.createElement("button", { onClick: () => { setMode(mode === 'signup' ? 'login' : 'signup'); setMessage(''); } }, mode === 'signup' ? 'Log in' : 'Maak er een aan')),
                    React.createElement("p", { className: "auth-footnote" }, "Gratis te gebruiken voor jou en je vrienden.")))));
}

export function ChallengeCard({ challenge, participation, onAction, onCancel, onWithdraw, creator, viewerId }) {
    const category = categoryFor(challenge.category);
    const icon = {
        avontuur: Mountain,
        sport: Dumbbell,
        sociaal: Users,
        grappig: PartyPopper,
        overig: Sparkles
    }[category.id];
    const status = participation?.status;
    const bounty = challenge.bounty;
    const own = challenge.created_by === viewerId;
    const cancelled = Boolean(challenge.cancelled_at || bounty?.cancelled_at);
    const noSlots = bounty && bounty.available_slots < 1;
    const action = own
        ? React.createElement("button", { className: "button button--sm button--soft", onClick: () => onCancel(challenge), disabled: cancelled }, cancelled ? 'Ingetrokken' : 'Intrekken')
        : status === 'approved'
            ? React.createElement("span", { className: "completed-mark" }, React.createElement(CheckCircle2, { size: 16 }), " Klaar!")
            : status === 'pending'
                ? React.createElement("span", { className: "waiting-mark" }, React.createElement(Clock3, { size: 15 }), " In beoordeling")
                : status === 'accepted'
                    ? React.createElement("div", { className: "challenge-actions" },
                        React.createElement("button", { className: "button button--sm button--soft", onClick: () => onAction(challenge, participation) }, "Bewijs insturen", React.createElement(ArrowRight, { size: 15 })),
                        bounty && React.createElement("button", { className: "challenge-cancel", onClick: () => onWithdraw(participation), title: "Stoppen en je betaalde plek vrijgeven" }, "Stoppen"))
                    : cancelled
                        ? React.createElement("span", { className: "waiting-mark" }, "Ingetrokken")
                        : status === 'rejected' && noSlots
                            ? React.createElement("button", { className: "button button--sm button--soft", disabled: true }, "Geen betaalde plek")
                            : noSlots
                                ? React.createElement("span", { className: "waiting-mark" }, "Geen plekken vrij")
                                : React.createElement("button", { className: `button button--sm ${status ? 'button--soft' : 'button--dark'}`, onClick: () => onAction(challenge, participation) },
                                    status === 'rejected' ? 'Opnieuw insturen' : 'Accepteren',
                                    React.createElement(ArrowRight, { size: 15 }));
    return React.createElement("article", { className: "challenge-card" },
        React.createElement("div", { className: "challenge-card-top" },
            React.createElement("div", { className: `challenge-illustration challenge-illustration--${category.tone}` }, React.createElement(icon, { size: 23, strokeWidth: 1.9 })),
            React.createElement(PointBadge, { points: challenge.points })),
        React.createElement("div", { className: "challenge-text" },
            React.createElement(CategoryTag, { category: challenge.category }),
            React.createElement("h3", null, challenge.title),
            React.createElement("p", null, challenge.description || 'Durf jij deze uitdaging aan?')),
        React.createElement("div", { className: "challenge-card-bottom" },
            React.createElement("div", { className: "challenge-by" }, "Door ", creator || 'een groepsgenoot', " · ", formatDate(challenge.created_at)),
            action),
        status === 'rejected' && React.createElement("div", { className: "challenge-rejected" }, noSlots ? "Je bewijs is afgekeurd en er is geen betaalde plek meer." : "Je bewijs is afgekeurd. Je kunt opnieuw bewijs indienen."),
        bounty && !own && !cancelled && React.createElement("small", { className: "challenge-slots" }, bounty.slots_paid, " van ", bounty.slots_total, " plekken uitbetaald"));
}

export function ShopCard({ item, seller, own, canAfford, busy, onBuy }) {
    return React.createElement("article", { className: "shop-card" },
        React.createElement("div", { className: "shop-card-top" },
            React.createElement("div", { className: "shop-gift-icon" }, React.createElement(Gift, { size: 23 })),
            React.createElement(PointBadge, { points: item.price })),
        React.createElement("h3", null, item.title),
        React.createElement("p", { className: "shop-description" }, item.description || 'Een beloning van een groepsgenoot.'),
        React.createElement("div", { className: "shop-card-meta" },
            React.createElement("span", null, React.createElement(Avatar, { name: seller || 'Speler', size: "sm" }), "Door ", seller || 'een groepsgenoot'),
            React.createElement("small", null, item.stock, " beschikbaar")),
        React.createElement("button", {
            className: `button ${own || !canAfford || item.stock < 1 ? 'button--soft' : 'button--dark'} shop-buy`,
            disabled: busy || own || !canAfford || item.stock < 1,
            onClick: onBuy
        },
            own ? 'Jouw beloning' : item.stock < 1 ? 'Uitverkocht' : !canAfford ? 'Niet genoeg punten' : 'Kopen',
            !own && canAfford && item.stock > 0 && React.createElement(ArrowRight, { size: 16 })));
}
