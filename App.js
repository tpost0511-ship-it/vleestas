const React = window.React;
const { useCallback, useEffect, useMemo, useState } = React;
import { Trophy, Flame, Sparkles, Users, House, Plus, Check, Clock3, ArrowRight, CheckCircle2, X, Link2, Copy, LogOut, ChevronDown, Search, Medal, ShieldCheck, RefreshCcw, PartyPopper, Dumbbell, Mountain, LockKeyhole, UploadCloud, CheckCheck, Zap, Target, UserPlus, Crown, TrendingUp, AlertCircle, CircleCheckBig, Image, RotateCcw, ExternalLink } from './lib/icons.js';
import { isDemo, currentSession, watchAuth, logIn, signUp, logOut, getProfile, listGroups, createGroup, joinGroup, loadGroup, addChallenge, acceptChallenge, submitProof, reviewSubmission, getProofUrl, subscribeToGroup } from './lib/data.js';
import { CATEGORIES, categoryFor, ranking, challengeState, shortName, formatDate, inviteLink, validChallenge } from './lib/game.js';
const IconFor = { avontuur: Mountain, sport: Dumbbell, sociaal: Users, grappig: PartyPopper, overig: Sparkles };
const navItems = [
    { key: 'home', label: 'Overzicht', icon: House },
    { key: 'challenges', label: 'Challenges', icon: Target },
    { key: 'ranking', label: 'Klassement', icon: Trophy },
    { key: 'reviews', label: 'Beoordelen', icon: ShieldCheck }
];
const statusLabels = { accepted: 'Bezig', pending: 'In beoordeling', approved: 'Voltooid', rejected: 'Afgekeurd' };
function Avatar({ name = '?', size = 'md', index = 0 }) {
    return React.createElement("div", { className: `avatar avatar--${size} avatar--color-${index % 6}`, title: name }, shortName(name));
}
function PointBadge({ points, large = false }) { return React.createElement("span", { className: `point-badge ${large ? 'point-badge--large' : ''}` },
    React.createElement(Zap, { size: large ? 17 : 14, fill: "currentColor" }),
    points,
    " pt"); }
function CategoryTag({ category }) { const c = categoryFor(category); const I = IconFor[c.id]; return React.createElement("span", { className: `category-tag category-tag--${c.tone}` },
    React.createElement(I, { size: 13 }),
    c.label); }
function StatusTag({ status }) { if (!status)
    return null; const I = status === 'approved' ? CheckCheck : status === 'pending' ? Clock3 : status === 'rejected' ? RotateCcw : Flame; return React.createElement("span", { className: `status-tag status-tag--${status}` },
    React.createElement(I, { size: 13 }),
    statusLabels[status]); }
function NoResults({ icon: Icon = Sparkles, title, text, action }) { return React.createElement("div", { className: "empty-state" },
    React.createElement("div", { className: "empty-icon" },
        React.createElement(Icon, { size: 28 })),
    React.createElement("h3", null, title),
    React.createElement("p", null, text),
    action); }
function Loading() { return React.createElement("div", { className: "loading-state" },
    React.createElement("div", { className: "spin" }),
    React.createElement("p", null, "Even laden...")); }
function Modal({ title, subtitle, onClose, children, wide = false }) {
    useEffect(() => { const onKey = e => { if (e.key === 'Escape')
        onClose(); }; document.addEventListener('keydown', onKey); document.body.style.overflow = 'hidden'; return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; }; }, [onClose]);
    return React.createElement("div", { className: "modal-backdrop", onMouseDown: e => { if (e.target === e.currentTarget)
            onClose(); } },
        React.createElement("section", { role: "dialog", "aria-modal": "true", "aria-label": title, className: `modal ${wide ? 'modal--wide' : ''}` },
            React.createElement("div", { className: "modal-heading" },
                React.createElement("div", null,
                    React.createElement("h2", null, title),
                    subtitle && React.createElement("p", null, subtitle)),
                React.createElement("button", { className: "icon-button", "aria-label": "Sluiten", onClick: onClose },
                    React.createElement(X, { size: 19 }))),
            children));
}
function Toast({ value, onClose }) { useEffect(() => { if (!value)
    return; const t = setTimeout(onClose, 4600); return () => clearTimeout(t); }, [value, onClose]); return value ? React.createElement("div", { className: `toast ${value.error ? 'toast--error' : ''}`, role: "status" },
    value.error ? React.createElement(AlertCircle, { size: 19 }) : React.createElement(CircleCheckBig, { size: 19 }),
    React.createElement("span", null, value.text),
    React.createElement("button", { onClick: onClose, "aria-label": "Sluiten" },
        React.createElement(X, { size: 16 }))) : null; }
function AuthScreen({ onToast }) {
    const [mode, setMode] = useState('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const submit = async (e) => {
        e.preventDefault();
        setMessage('');
        setBusy(true);
        try {
            if (mode === 'signup') {
                if (name.trim().length < 2)
                    throw new Error('Vul een naam van minimaal 2 tekens in.');
                if (password.length < 6)
                    throw new Error('Gebruik een wachtwoord van minimaal 6 tekens.');
                const result = await signUp(name, email, password);
                if (!result.session) {
                    setMessage('Account gemaakt! Open de bevestigingsmail en klik op de link. Daarna kun je inloggen.');
                    setMode('login');
                }
                else
                    onToast('Je account is aangemaakt!');
            }
            else {
                await logIn(email, password);
                onToast('Welkom terug!');
            }
        }
        catch (err) {
            setMessage(err.message || 'Inloggen mislukt.');
        }
        finally {
            setBusy(false);
        }
    };
    return React.createElement("div", { className: "auth-page" },
        React.createElement("div", { className: "auth-shell" },
            React.createElement("div", { className: "auth-brand" },
                React.createElement("div", { className: "brand-mark" },
                    React.createElement(Trophy, { size: 24, strokeWidth: 2.6 })),
                React.createElement("span", null,
                    "Puntjacht",
                    React.createElement("span", { className: "brand-dot" }, "."))),
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
                        React.createElement("span", null,
                            React.createElement(Check, { size: 16 }),
                            " Priv\u00E9groepen"),
                        React.createElement("span", null,
                            React.createElement(Check, { size: 16 }),
                            " Eigen challenges"),
                        React.createElement("span", null,
                            React.createElement(Check, { size: 16 }),
                            " Live punten")),
                    React.createElement("div", { className: "auth-graphic" },
                        React.createElement("div", { className: "auth-glow" }),
                        React.createElement("div", { className: "auth-medal" },
                            React.createElement(Trophy, { size: 46, strokeWidth: 2 })),
                        React.createElement("div", { className: "auth-bubble auth-bubble--one" },
                            React.createElement(Zap, { size: 15, fill: "currentColor" }),
                            " +250 punten"),
                        React.createElement("div", { className: "auth-bubble auth-bubble--two" },
                            React.createElement(CheckCheck, { size: 17 }),
                            " Challenge voltooid!"),
                        React.createElement("div", { className: "auth-spark auth-spark--a" }, "\u2726"),
                        React.createElement("div", { className: "auth-spark auth-spark--b" }, "\u2733"))),
                React.createElement("div", { className: "auth-form-panel" },
                    React.createElement("div", { className: "auth-form-heading" },
                        React.createElement("div", { className: "auth-pill" },
                            React.createElement(LockKeyhole, { size: 14 }),
                            " Alleen jouw vriendengroep"),
                        React.createElement("h2", null, mode === 'signup' ? 'Maak je account' : 'Welkom terug'),
                        React.createElement("p", null, mode === 'signup' ? 'Start met challenges voor je vriendengroep.' : 'Log in en ga verder waar je gebleven was.')),
                    React.createElement("form", { onSubmit: submit, className: "form-stack" },
                        mode === 'signup' && React.createElement("label", null,
                            "Jouw naam",
                            React.createElement("input", { autoComplete: "name", maxLength: 40, placeholder: "Bijv. Thijmen", value: name, onChange: e => setName(e.target.value), required: true })),
                        React.createElement("label", null,
                            "E-mailadres",
                            React.createElement("input", { autoComplete: "email", type: "email", placeholder: "jij@voorbeeld.nl", value: email, onChange: e => setEmail(e.target.value), required: true })),
                        React.createElement("label", null,
                            "Wachtwoord",
                            React.createElement("input", { autoComplete: mode === 'signup' ? 'new-password' : 'current-password', type: "password", placeholder: "Minimaal 6 tekens", minLength: 6, value: password, onChange: e => setPassword(e.target.value), required: true })),
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
function ChallengeCard({ challenge, participation, onAction, creator }) {
    const cat = categoryFor(challenge.category);
    const Icon = IconFor[cat.id];
    const status = participation?.status;
    return React.createElement("article", { className: "challenge-card" },
        React.createElement("div", { className: "challenge-card-top" },
            React.createElement("div", { className: `challenge-illustration challenge-illustration--${cat.tone}` },
                React.createElement(Icon, { size: 23, strokeWidth: 1.9 })),
            React.createElement(PointBadge, { points: challenge.points })),
        React.createElement("div", { className: "challenge-text" },
            React.createElement(CategoryTag, { category: challenge.category }),
            React.createElement("h3", null, challenge.title),
            React.createElement("p", null, challenge.description || 'Durf jij deze uitdaging aan?')),
        React.createElement("div", { className: "challenge-card-bottom" },
            React.createElement("div", { className: "challenge-by" },
                "Door ",
                creator || 'een groepsgenoot',
                " \u00B7 ",
                formatDate(challenge.created_at)),
            status === 'approved' ? React.createElement("span", { className: "completed-mark" },
                React.createElement(CheckCircle2, { size: 16 }),
                " Klaar!") : status === 'pending' ? React.createElement("span", { className: "waiting-mark" },
                React.createElement(Clock3, { size: 15 }),
                " In beoordeling") : React.createElement("button", { className: `button button--sm ${status ? 'button--soft' : 'button--dark'}`, onClick: () => onAction(challenge, participation) },
                status === 'accepted' ? 'Bewijs insturen' : status === 'rejected' ? 'Opnieuw insturen' : 'Accepteren',
                React.createElement(ArrowRight, { size: 15 }))),
        status === 'rejected' && React.createElement("div", { className: "challenge-rejected" }, "Je bewijs is afgekeurd. Je kunt opnieuw bewijs indienen."));
}
export default function App() {
    const [booting, setBooting] = useState(true), [user, setUser] = useState(null), [profile, setProfile] = useState(null);
    const [groups, setGroups] = useState([]), [groupId, setGroupId] = useState(null), [groupLoading, setGroupLoading] = useState(false);
    const [members, setMembers] = useState([]), [challenges, setChallenges] = useState([]), [participations, setParticipations] = useState([]);
    const [tab, setTab] = useState('home'), [modal, setModal] = useState(null), [busy, setBusy] = useState(false);
    const [toast, setToast] = useState(null), [filter, setFilter] = useState('alles'), [search, setSearch] = useState('');
    const [groupName, setGroupName] = useState(''), [joinCode, setJoinCode] = useState('');
    const [newChallenge, setNewChallenge] = useState({ title: '', description: '', category: 'avontuur', points: 100 });
    const [selectedChallenge, setSelectedChallenge] = useState(null), [selectedParticipation, setSelectedParticipation] = useState(null);
    const [proofText, setProofText] = useState(''), [proofFile, setProofFile] = useState(null), [previewUrl, setPreviewUrl] = useState(null);
    const [reloadTick, setReloadTick] = useState(0), [groupsMenu, setGroupsMenu] = useState(false);
    const showToast = (text, error = false) => setToast({ text, error });
    const closeToast = useCallback(() => setToast(null), []);
    const closeModal = useCallback(() => { setModal(null); setPreviewUrl(null); }, []);
    const activeGroup = groups.find(g => g.id === groupId);
    const board = useMemo(() => ranking(members, challenges, participations), [members, challenges, participations]);
    const me = board.find(m => m.id === profile?.id);
    const myRank = board.findIndex(m => m.id === profile?.id) + 1;
    const myParticipations = participations.filter(p => p.user_id === profile?.id);
    const waiting = myParticipations.filter(p => p.status === 'pending').length;
    const reviewQueue = participations.filter(p => p.status === 'pending' && p.user_id !== profile?.id);
    const completed = myParticipations.filter(p => p.status === 'approved').length;
    const active = myParticipations.filter(p => p.status === 'accepted' || p.status === 'rejected').length;
    const profileName = profile?.display_name || 'Speler';
    useEffect(() => { let live = true; currentSession().then(({ user: u }) => { if (live)
        setUser(u); }).catch(err => { if (live)
        setToast({ text: err.message, error: true }); }).finally(() => { if (live)
        setBooting(false); }); const stop = watchAuth(u => { if (live)
        setUser(u); }); return () => { live = false; stop(); }; }, []);
    const refreshGroups = useCallback(async (uid, preferred = null) => {
        const list = await listGroups(uid);
        setGroups(list);
        setGroupId(current => {
            const stored = localStorage.getItem('puntjacht-active-group');
            const candidate = preferred || current || stored;
            return list.some(g => g.id === candidate) ? candidate : (list[0]?.id || null);
        });
        return list;
    }, []);
    useEffect(() => { if (!user) {
        setProfile(null);
        setGroups([]);
        setGroupId(null);
        return;
    } let cancelled = false; Promise.all([getProfile(user), listGroups(user.id)]).then(([p, list]) => { if (cancelled)
        return; setProfile(p); setGroups(list); const stored = localStorage.getItem('puntjacht-active-group'); setGroupId(prev => list.some(g => g.id === prev) ? prev : list.some(g => g.id === stored) ? stored : list[0]?.id || null); }).catch(err => { if (!cancelled)
        showToast(err.message, true); }); return () => { cancelled = true; }; }, [user?.id]);
    useEffect(() => { if (!groupId) {
        setMembers([]);
        setChallenges([]);
        setParticipations([]);
        return;
    } let cancelled = false; setGroupLoading(true); localStorage.setItem('puntjacht-active-group', groupId); loadGroup(groupId).then(data => { if (cancelled)
        return; setMembers(data.members); setChallenges(data.challenges); setParticipations(data.participations); }).catch(err => { if (!cancelled)
        showToast(err.message, true); }).finally(() => { if (!cancelled)
        setGroupLoading(false); }); return () => { cancelled = true; }; }, [groupId, reloadTick]);
    useEffect(() => { if (!groupId)
        return; const stop = subscribeToGroup(groupId, () => setReloadTick(n => n + 1)); const onFocus = () => setReloadTick(n => n + 1); window.addEventListener('focus', onFocus); return () => { stop(); window.removeEventListener('focus', onFocus); }; }, [groupId]);
    useEffect(() => { if (!user || !profile)
        return; const params = new URLSearchParams(window.location.search); const invite = params.get('invite'); if (!invite)
        return; window.history.replaceState(null, '', window.location.pathname + window.location.hash); joinGroup(invite).then(id => refreshGroups(profile.id, id)).then(() => showToast('Je bent toegevoegd aan de groep!')).catch(err => showToast(err.message, true)); }, [user?.id, profile?.id, refreshGroups]);
    const safeAction = async (fn, success) => { setBusy(true); try {
        await fn();
        setReloadTick(n => n + 1);
        if (success)
            showToast(success);
        return true;
    }
    catch (err) {
        showToast(err.message || 'Er ging iets mis.', true);
        return false;
    }
    finally {
        setBusy(false);
    } };
    const handleCreateGroup = async (e) => { e.preventDefault(); if (groupName.trim().length < 2) {
        showToast('Vul een groepsnaam in.', true);
        return;
    } const ok = await safeAction(async () => { const id = await createGroup(groupName); await refreshGroups(profile.id, id); }, 'Groep aangemaakt! Nodig je vrienden uit.'); if (ok) {
        setGroupName('');
        closeModal();
    } };
    const handleJoinGroup = async (e) => { e.preventDefault(); const ok = await safeAction(async () => { const id = await joinGroup(joinCode); await refreshGroups(profile.id, id); }, 'Je bent lid van de groep!'); if (ok) {
        setJoinCode('');
        closeModal();
    } };
    const handleAddChallenge = async (e) => { e.preventDefault(); const error = validChallenge(newChallenge); if (error) {
        showToast(error, true);
        return;
    } const ok = await safeAction(() => addChallenge(groupId, newChallenge, profile.id), 'Challenge toegevoegd!'); if (ok) {
        setNewChallenge({ title: '', description: '', category: 'avontuur', points: 100 });
        setTab('challenges');
        closeModal();
    } };
    const handleAction = async (challenge, participation) => {
        if (participation?.status === 'accepted' || participation?.status === 'rejected') {
            setSelectedChallenge(challenge);
            setSelectedParticipation(participation.id);
            setProofText('');
            setProofFile(null);
            setModal('proof');
            return;
        }
        const ok = await safeAction(async () => {
            const id = await acceptChallenge(challenge.id);
            setSelectedChallenge(challenge);
            setSelectedParticipation(id);
            setProofText('');
            setProofFile(null);
            setModal('proof');
        }, 'Challenge geaccepteerd! Laat zien dat je het kunt.');
        if (ok)
            setTab('challenges');
    };
    const handleSubmit = async (e) => { e.preventDefault(); if (!proofText.trim() && !proofFile) {
        showToast('Voeg een beschrijving of foto toe.', true);
        return;
    } const ok = await safeAction(() => submitProof(groupId, selectedParticipation, proofText, proofFile, profile.id), 'Bewijs ingediend! Je vrienden kunnen het nu beoordelen.'); if (ok)
        closeModal(); };
    const handleReview = async (id, approved) => { await safeAction(() => reviewSubmission(id, approved), approved ? 'Goedgekeurd! De punten zijn toegevoegd.' : 'Bewijs afgekeurd. De deelnemer kan opnieuw insturen.'); };
    const copyValue = async (value) => { try {
        await navigator.clipboard.writeText(value);
        showToast('Gekopieerd naar je klembord!');
    }
    catch {
        window.prompt('Kopieer deze tekst:', value);
    } };
    const showProof = async (path) => { if (!path)
        return; setBusy(true); try {
        const url = await getProofUrl(path);
        if (!url)
            throw new Error('Foto niet beschikbaar.');
        setPreviewUrl(url);
        setModal('preview');
    }
    catch (err) {
        showToast(err.message, true);
    }
    finally {
        setBusy(false);
    } };
    const filtered = challenges.filter(c => {
        const p = challengeState(c.id, profile?.id, participations);
        const matches = filter === 'alles' || (filter === 'beschikbaar' && !p) || (filter === 'bezig' && ['accepted', 'rejected'].includes(p?.status)) || (filter === 'pending' && p?.status === 'pending') || (filter === 'voltooid' && p?.status === 'approved');
        return matches && `${c.title} ${c.description} ${categoryFor(c.category).label}`.toLowerCase().includes(search.toLowerCase());
    });
    const topThree = board.slice(0, 3);
    const latest = participations.filter(p => p.status === 'approved').sort((a, b) => (b.reviewed_at || b.created_at).localeCompare(a.reviewed_at || a.created_at)).slice(0, 4);
    if (booting)
        return React.createElement("div", { className: "app-boot" },
            React.createElement("div", { className: "brand-mark" },
                React.createElement(Trophy, { size: 28 })),
            React.createElement("div", { className: "spin" }));
    if (!user)
        return React.createElement(React.Fragment, null,
            React.createElement(AuthScreen, { onToast: text => showToast(text) }),
            React.createElement(Toast, { value: toast, onClose: closeToast }));
    return React.createElement("div", { className: "app-layout" },
        React.createElement("aside", { className: "sidebar" },
            React.createElement("div", { className: "brand" },
                React.createElement("div", { className: "brand-mark" },
                    React.createElement(Trophy, { size: 24, strokeWidth: 2.4 })),
                React.createElement("span", null,
                    "Puntjacht",
                    React.createElement("span", { className: "brand-dot" }, "."))),
            React.createElement("div", { className: "sidebar-section-label" }, "JOUW GROEP"),
            React.createElement("div", { className: "group-selector-wrapper" },
                React.createElement("button", { className: "group-selector", onClick: () => setGroupsMenu(v => !v) },
                    React.createElement("div", { className: "group-avatar" },
                        React.createElement(Users, { size: 20 })),
                    React.createElement("span", { className: "group-selector-name" },
                        activeGroup?.name || 'Kies een groep',
                        React.createElement("small", null,
                            members.length,
                            " leden")),
                    React.createElement(ChevronDown, { size: 16 })),
                groupsMenu && React.createElement("div", { className: "group-dropdown" },
                    groups.map(g => React.createElement("button", { key: g.id, className: g.id === groupId ? 'selected' : '', onClick: () => { setGroupId(g.id); setGroupsMenu(false); setTab('home'); } },
                        g.name,
                        g.id === groupId && React.createElement(Check, { size: 15 }))),
                    React.createElement("button", { onClick: () => { setGroupsMenu(false); setModal('group'); } },
                        React.createElement(Plus, { size: 15 }),
                        " Nieuwe groep"),
                    React.createElement("button", { onClick: () => { setGroupsMenu(false); setModal('join'); } },
                        React.createElement(UserPlus, { size: 15 }),
                        " Groep joinen"))),
            React.createElement("div", { className: "sidebar-section-label sidebar-section-label--nav" }, "MENU"),
            React.createElement("nav", { className: "nav-list" }, navItems.map(item => { const I = item.icon; return React.createElement("button", { key: item.key, className: `nav-item ${tab === item.key ? 'nav-item--active' : ''}`, onClick: () => setTab(item.key) },
                React.createElement(I, { size: 19 }),
                item.label,
                item.key === 'reviews' && reviewQueue.length > 0 && React.createElement("span", { className: "nav-count" }, reviewQueue.length)); })),
            React.createElement("div", { className: "sidebar-grow" }),
            React.createElement("div", { className: "sidebar-cta" },
                React.createElement("span", { className: "mini-spark" }, "\u2733"),
                React.createElement("h4", null, "Nog meer punten?"),
                React.createElement("p", null, "Bedank een nieuwe challenge en daag je vrienden uit."),
                React.createElement("button", { onClick: () => setModal('add'), disabled: !activeGroup },
                    "Maak challenge ",
                    React.createElement(ArrowRight, { size: 15 }))),
            React.createElement("div", { className: "profile-bar" },
                React.createElement(Avatar, { name: profileName }),
                React.createElement("span", null,
                    profileName,
                    React.createElement("small", null, isDemo ? 'Demomodus' : 'Ingelogd')),
                !isDemo && React.createElement("button", { "aria-label": "Uitloggen", onClick: () => logOut(), title: "Uitloggen" },
                    React.createElement(LogOut, { size: 18 })))),
        React.createElement("main", { className: "main-area" },
            React.createElement("div", { className: "main-inner" },
                React.createElement("header", { className: "mobile-header" },
                    React.createElement("div", { className: "brand" },
                        React.createElement("div", { className: "brand-mark" },
                            React.createElement(Trophy, { size: 21 })),
                        React.createElement("span", null,
                            "Puntjacht",
                            React.createElement("span", { className: "brand-dot" }, "."))),
                    React.createElement("button", { className: "mobile-group-button", onClick: () => setModal('switch') },
                        React.createElement(Users, { size: 17 }),
                        activeGroup?.name || 'Groep',
                        React.createElement(ChevronDown, { size: 14 }))),
                isDemo && React.createElement("div", { className: "demo-banner" },
                    React.createElement("span", { className: "demo-dot" }),
                    React.createElement("span", null,
                        React.createElement("strong", null, "Demomodus"),
                        " \u2014 probeer alles uit. Voor samenwerken met vrienden: koppel je eigen gratis Supabase-project."),
                    React.createElement("button", { onClick: () => setModal('about'), "aria-label": "Uitleg" },
                        "Meer info ",
                        React.createElement(ArrowRight, { size: 14 }))),
                !activeGroup ? React.createElement("div", { className: "first-group" },
                    React.createElement("div", { className: "first-group-icon" },
                        React.createElement(Users, { size: 32 })),
                    React.createElement("h1", null, "Iedere strijd begint met een groep."),
                    React.createElement("p", null, "Maak je eigen groep aan of sluit je aan via de uitnodigingscode van je vrienden."),
                    React.createElement("div", { className: "first-group-actions" },
                        React.createElement("button", { className: "button button--primary", onClick: () => setModal('group') },
                            React.createElement(Plus, { size: 19 }),
                            " Groep maken"),
                        React.createElement("button", { className: "button button--outline", onClick: () => setModal('join') },
                            React.createElement(UserPlus, { size: 18 }),
                            " Groep joinen")))
                    : React.createElement(React.Fragment, null,
                        React.createElement("div", { className: "page-heading" },
                            React.createElement("div", null,
                                React.createElement("div", { className: "eyebrow" },
                                    React.createElement("span", { className: "eyebrow-line" }),
                                    " ",
                                    activeGroup.name.toUpperCase(),
                                    " ",
                                    React.createElement("span", { className: "eyebrow-sep" }, "/"),
                                    " ",
                                    tab === 'home' ? 'DASHBOARD' : navItems.find(x => x.key === tab)?.label.toUpperCase()),
                                React.createElement("h1", null, tab === 'home' ? `Hey, ${profileName.split(' ')[0]} 👋` : tab === 'challenges' ? 'Alle challenges' : tab === 'ranking' ? 'Het klassement' : 'Bewijs beoordelen'),
                                React.createElement("p", null, tab === 'home' ? 'Tijd om punten te pakken. Wie staat er straks bovenaan?' : tab === 'challenges' ? 'Kies je volgende uitdaging. De punten liggen voor het oprapen.' : tab === 'ranking' ? 'Alle punten tellen. Wie pakt de winst?' : 'Help je groepsgenoten aan hun verdiende punten.')),
                            React.createElement("div", { className: "header-actions" },
                                React.createElement("button", { className: "button button--outline button--header", onClick: () => setModal('invite') },
                                    React.createElement(Link2, { size: 17 }),
                                    " Uitnodigen"),
                                React.createElement("button", { className: "button button--primary button--header", onClick: () => setModal('add') },
                                    React.createElement(Plus, { size: 18 }),
                                    " Challenge maken"))),
                        groupLoading && challenges.length === 0 ? React.createElement(Loading, null) : React.createElement(React.Fragment, null,
                            tab === 'home' && React.createElement(React.Fragment, null,
                                React.createElement("section", { className: "hero" },
                                    React.createElement("div", { className: "hero-copy" },
                                        React.createElement("span", { className: "hero-kicker" },
                                            React.createElement(Flame, { size: 16, fill: "currentColor" }),
                                            " LET THE GAMES BEGIN"),
                                        React.createElement("h2", null,
                                            "De jacht op punten",
                                            React.createElement("br", null),
                                            React.createElement("em", null, "is geopend.")),
                                        React.createElement("p", null, "Pak uitdagingen aan, bewijs wat je hebt gedaan en stijg naar de top!"),
                                        React.createElement("button", { onClick: () => setTab('challenges') },
                                            "Ontdek challenges ",
                                            React.createElement(ArrowRight, { size: 17 }))),
                                    React.createElement("div", { className: "hero-art", "aria-hidden": "true" },
                                        React.createElement("div", { className: "hero-ring hero-ring--one" }),
                                        React.createElement("div", { className: "hero-ring hero-ring--two" }),
                                        React.createElement("div", { className: "hero-trophy" },
                                            React.createElement(Trophy, { size: 90, strokeWidth: 1.5 })),
                                        React.createElement("div", { className: "hero-points" },
                                            React.createElement(Zap, { fill: "currentColor", size: 14 }),
                                            " +250 XP"),
                                        React.createElement("span", { className: "hero-star hero-star--one" }, "\u2726"),
                                        React.createElement("span", { className: "hero-star hero-star--two" }, "\u2734"),
                                        React.createElement("span", { className: "hero-star hero-star--three" }, "\u2726"))),
                                React.createElement("div", { className: "stats-grid" },
                                    React.createElement("div", { className: "stat" },
                                        React.createElement("div", { className: "stat-icon stat-icon--purple" },
                                            React.createElement(Zap, { size: 20 })),
                                        React.createElement("span", null, "Totaal punten"),
                                        React.createElement("strong", null,
                                            me?.points || 0,
                                            " ",
                                            React.createElement("small", null, "pt")),
                                        React.createElement("div", { className: "stat-note" },
                                            React.createElement(TrendingUp, { size: 14 }),
                                            " Lekker bezig!")),
                                    React.createElement("div", { className: "stat" },
                                        React.createElement("div", { className: "stat-icon stat-icon--orange" },
                                            React.createElement(Target, { size: 21 })),
                                        React.createElement("span", null, "Challenges voltooid"),
                                        React.createElement("strong", null,
                                            completed,
                                            " ",
                                            React.createElement("small", null,
                                                "van ",
                                                challenges.length)),
                                        React.createElement("div", { className: "stat-note" },
                                            active,
                                            " bezig \u00B7 ",
                                            waiting,
                                            " wachtend")),
                                    React.createElement("div", { className: "stat" },
                                        React.createElement("div", { className: "stat-icon stat-icon--blue" },
                                            React.createElement(Trophy, { size: 20 })),
                                        React.createElement("span", null, "Jouw positie"),
                                        React.createElement("strong", null,
                                            "#",
                                            myRank || '-',
                                            " ",
                                            React.createElement("small", null,
                                                "van ",
                                                members.length)),
                                        React.createElement("div", { className: "stat-note" },
                                            React.createElement(Users, { size: 14 }),
                                            " Samen in de strijd"))),
                                React.createElement("div", { className: "dashboard-columns" },
                                    React.createElement("section", { className: "panel" },
                                        React.createElement("div", { className: "panel-heading" },
                                            React.createElement("div", null,
                                                React.createElement("h2", null,
                                                    React.createElement("span", { className: "section-icon" },
                                                        React.createElement(Target, { size: 19 })),
                                                    " Challenges voor jou"),
                                                React.createElement("p", null, "Pak vandaag nog wat extra punten.")),
                                            React.createElement("button", { className: "text-action", onClick: () => setTab('challenges') },
                                                "Bekijk alles ",
                                                React.createElement(ArrowRight, { size: 16 }))),
                                        React.createElement("div", { className: "quick-challenges" },
                                            challenges.filter(c => challengeState(c.id, profile?.id, participations)?.status !== 'approved').slice(0, 4).map(c => { const cat = categoryFor(c.category), I = IconFor[cat.id], p = challengeState(c.id, profile?.id, participations); return React.createElement("div", { className: "quick-challenge", key: c.id },
                                                React.createElement("div", { className: `quick-icon quick-icon--${cat.tone}` },
                                                    React.createElement(I, { size: 20 })),
                                                React.createElement("div", { className: "quick-details" },
                                                    React.createElement("strong", null, c.title),
                                                    React.createElement("span", null,
                                                        categoryFor(c.category).label,
                                                        " \u00B7 ",
                                                        formatDate(c.created_at))),
                                                React.createElement(PointBadge, { points: c.points }),
                                                p?.status === 'pending' ? React.createElement(Clock3, { size: 17, color: "#9a8e76" }) : React.createElement("button", { className: "quick-arrow", "aria-label": `Open ${c.title}`, onClick: () => handleAction(c, p) },
                                                    React.createElement(ArrowRight, { size: 17 }))); }),
                                            challenges.length === 0 && React.createElement(NoResults, { icon: Target, title: "Nog geen challenges", text: "Maak de allereerste uitdaging van deze groep.", action: React.createElement("button", { className: "button button--primary", onClick: () => setModal('add') },
                                                    React.createElement(Plus, { size: 16 }),
                                                    " Maak challenge") }))),
                                    React.createElement("section", { className: "panel ranking-panel" },
                                        React.createElement("div", { className: "panel-heading" },
                                            React.createElement("div", null,
                                                React.createElement("h2", null,
                                                    React.createElement("span", { className: "section-icon section-icon--yellow" },
                                                        React.createElement(Trophy, { size: 19 })),
                                                    " Topspelers"),
                                                React.createElement("p", null, "De voorlopige tussenstand.")),
                                            React.createElement("button", { className: "text-action", onClick: () => setTab('ranking') },
                                                "Volledig ",
                                                React.createElement(ArrowRight, { size: 16 }))),
                                        React.createElement("div", { className: "sidebar-leaders" }, board.slice(0, 5).map((p, i) => React.createElement("div", { className: "sidebar-leader", key: p.id },
                                            React.createElement("span", { className: `leader-place leader-place--${i + 1}` }, i === 0 ? React.createElement(Crown, { size: 18 }) : i + 1),
                                            React.createElement(Avatar, { name: p.display_name, size: "sm", index: i }),
                                            React.createElement("div", null,
                                                React.createElement("strong", null,
                                                    p.display_name,
                                                    p.id === profile?.id && React.createElement("span", { className: "you-tag" }, "jij")),
                                                React.createElement("small", null,
                                                    p.completed,
                                                    " voltooid")),
                                            React.createElement("b", null,
                                                p.points,
                                                " ",
                                                React.createElement("small", null, "pt"))))))),
                                React.createElement("section", { className: "activity-section" },
                                    React.createElement("div", { className: "section-heading" },
                                        React.createElement("h2", null,
                                            "Laatste prestaties ",
                                            React.createElement(Sparkles, { size: 18 })),
                                        React.createElement("p", null, "Wat er onlangs is gebeurd in de groep.")),
                                    latest.length ? React.createElement("div", { className: "activity-list" }, latest.map(p => { const c = challenges.find(c => c.id === p.challenge_id), m = members.find(m => m.id === p.user_id); return React.createElement("div", { className: "activity-row", key: p.id },
                                        React.createElement("div", { className: "activity-check" },
                                            React.createElement(Check, { size: 17 })),
                                        React.createElement("div", null,
                                            React.createElement("strong", null,
                                                m?.display_name || 'Een vriend',
                                                " ",
                                                React.createElement("span", null, "heeft een challenge voltooid")),
                                            React.createElement("small", null, c?.title || 'Challenge')),
                                        React.createElement(PointBadge, { points: c?.points || 0 })); })) : React.createElement("div", { className: "activity-placeholder" }, "Nog geen goedgekeurde challenges."))),
                            tab === 'challenges' && React.createElement(React.Fragment, null,
                                React.createElement("div", { className: "challenge-toolbar" },
                                    React.createElement("div", { className: "filter-list" }, [{ id: 'alles', label: 'Alle' }, { id: 'beschikbaar', label: 'Beschikbaar' }, { id: 'bezig', label: 'Bezig' }, { id: 'pending', label: 'In beoordeling' }, { id: 'voltooid', label: 'Voltooid' }].map(item => React.createElement("button", { key: item.id, className: `filter-chip ${filter === item.id ? 'filter-chip--active' : ''}`, onClick: () => setFilter(item.id) }, item.label))),
                                    React.createElement("div", { className: "search-input" },
                                        React.createElement(Search, { size: 18 }),
                                        React.createElement("input", { placeholder: "Zoek challenges...", value: search, onChange: e => setSearch(e.target.value) }))),
                                React.createElement("div", { className: "challenge-meta" },
                                    React.createElement("span", null,
                                        React.createElement("strong", null, filtered.length),
                                        " challenges gevonden"),
                                    React.createElement("button", { onClick: () => setReloadTick(n => n + 1), className: "muted-action" },
                                        React.createElement(RefreshCcw, { size: 15 }),
                                        " Verversen")),
                                filtered.length ? React.createElement("div", { className: "challenge-grid" }, filtered.map(c => React.createElement(ChallengeCard, { key: c.id, challenge: c, participation: challengeState(c.id, profile?.id, participations), onAction: handleAction, creator: members.find(m => m.id === c.created_by)?.display_name }))) : React.createElement(NoResults, { icon: Search, title: "Geen challenges gevonden", text: "Probeer een ander filter of bedenk zelf een nieuwe uitdaging.", action: React.createElement("button", { className: "button button--primary", onClick: () => setModal('add') },
                                        React.createElement(Plus, { size: 17 }),
                                        " Nieuwe challenge") })),
                            tab === 'ranking' && React.createElement(React.Fragment, null,
                                React.createElement("div", { className: "leaderboard-intro" },
                                    React.createElement("span", { className: "leaderboard-intro-icon" },
                                        React.createElement(Trophy, { size: 24 })),
                                    React.createElement("div", null,
                                        React.createElement("h2", null, "De ranglijst"),
                                        React.createElement("p", null, "Alle goedgekeurde challenges worden automatisch meegeteld.")),
                                    React.createElement("span", { className: "leaderboard-players" },
                                        React.createElement(Users, { size: 16 }),
                                        members.length,
                                        " spelers")),
                                React.createElement("div", { className: "podium" }, [1, 0, 2].map((position) => { const p = topThree[position]; if (!p)
                                    return React.createElement("div", { key: position, className: "podium-person podium-person--empty" }); return React.createElement("div", { className: `podium-person podium-person--${position + 1}`, key: p.id },
                                    React.createElement("span", { className: "podium-crown" }, position === 0 ? React.createElement(Crown, { size: 25, fill: "currentColor" }) : position === 1 ? '✧' : '✦'),
                                    React.createElement(Avatar, { name: p.display_name, size: "xl", index: position }),
                                    React.createElement("strong", null, p.display_name),
                                    React.createElement("span", { className: "podium-score" },
                                        React.createElement(Zap, { size: 15, fill: "currentColor" }),
                                        p.points,
                                        " pt"),
                                    React.createElement("div", { className: "podium-block" },
                                        React.createElement("strong", null, position + 1))); })),
                                React.createElement("div", { className: "leaderboard-list" },
                                    React.createElement("div", { className: "leaderboard-list-heading" },
                                        React.createElement("span", null, "RANG"),
                                        React.createElement("span", null, "SPELER"),
                                        React.createElement("span", null, "CHALLENGES"),
                                        React.createElement("span", null, "PUNTEN")),
                                    board.map((p, i) => React.createElement("div", { className: `leaderboard-line ${p.id === profile?.id ? 'leaderboard-line--self' : ''}`, key: p.id },
                                        React.createElement("span", { className: "line-rank" }, i === 0 ? React.createElement(Medal, { size: 22 }) : String(i + 1).padStart(2, '0')),
                                        React.createElement("div", { className: "line-player" },
                                            React.createElement(Avatar, { name: p.display_name, index: i }),
                                            React.createElement("div", null,
                                                React.createElement("strong", null, p.display_name),
                                                React.createElement("small", null, p.id === profile?.id ? 'Dat ben jij!' : 'Groepslid'))),
                                        React.createElement("span", { className: "line-completed" },
                                            p.completed,
                                            " voltooid"),
                                        React.createElement("strong", { className: "line-points" },
                                            p.points,
                                            " ",
                                            React.createElement("small", null, "pt")))))),
                            tab === 'reviews' && React.createElement(React.Fragment, null,
                                React.createElement("div", { className: "review-guide" },
                                    React.createElement("div", { className: "review-guide-icon" },
                                        React.createElement(ShieldCheck, { size: 23 })),
                                    React.createElement("div", null,
                                        React.createElement("h2", null, "Fair play, echte punten."),
                                        React.createElement("p", null, "Controleer het bewijs van je vrienden. Je kunt je eigen inzendingen niet goedkeuren.")),
                                    React.createElement("span", { className: "review-count" },
                                        reviewQueue.length,
                                        " open")),
                                reviewQueue.length ? React.createElement("div", { className: "review-list" }, reviewQueue.map(p => { const c = challenges.find(c => c.id === p.challenge_id), m = members.find(m => m.id === p.user_id); return React.createElement("div", { className: "review-card", key: p.id },
                                    React.createElement("div", { className: "review-card-head" },
                                        React.createElement(Avatar, { name: m?.display_name || 'Vriend', index: members.findIndex(m => m.id === p.user_id) }),
                                        React.createElement("div", null,
                                            React.createElement("strong", null, m?.display_name || 'Een vriend'),
                                            React.createElement("span", null,
                                                "heeft bewijs ingestuurd \u00B7 ",
                                                formatDate(p.submitted_at || p.created_at))),
                                        React.createElement(PointBadge, { points: c?.points || 0 })),
                                    React.createElement("h3", null, c?.title || 'Challenge'),
                                    p.proof_text && React.createElement("p", { className: "review-proof-text" },
                                        "\u201C",
                                        p.proof_text,
                                        "\u201D"),
                                    p.proof_path && React.createElement("button", { className: "show-proof", disabled: busy, onClick: () => showProof(p.proof_path) },
                                        React.createElement(Image, { size: 16 }),
                                        " Bekijk bewijsfoto ",
                                        React.createElement(ExternalLink, { size: 14 })),
                                    React.createElement("div", { className: "review-actions" },
                                        React.createElement("button", { className: "button button--reject", onClick: () => handleReview(p.id, false), disabled: busy },
                                            React.createElement(X, { size: 17 }),
                                            " Afkeuren"),
                                        React.createElement("button", { className: "button button--approve", onClick: () => handleReview(p.id, true), disabled: busy },
                                            React.createElement(Check, { size: 17 }),
                                            " Goedkeuren"))); })) : React.createElement(NoResults, { icon: ShieldCheck, title: "Alles is beoordeeld!", text: "Er staan op dit moment geen inzendingen van je vrienden klaar." }),
                                myParticipations.filter(p => p.status === 'pending').length > 0 && React.createElement("div", { className: "your-pending" },
                                    React.createElement("h3", null,
                                        React.createElement(Clock3, { size: 17 }),
                                        " Jouw inzendingen in afwachting"),
                                    myParticipations.filter(p => p.status === 'pending').map(p => React.createElement("div", { key: p.id },
                                        challenges.find(c => c.id === p.challenge_id)?.title || 'Challenge',
                                        " ",
                                        React.createElement(StatusTag, { status: "pending" }))))))))),
        React.createElement("nav", { className: "bottom-nav" }, navItems.map(item => { const I = item.icon; return React.createElement("button", { key: item.key, className: tab === item.key ? 'bottom-nav--active' : '', onClick: () => setTab(item.key) },
            React.createElement("span", { className: "bottom-icon" },
                React.createElement(I, { size: 21 }),
                item.key === 'reviews' && reviewQueue.length > 0 && React.createElement("span", { className: "bottom-count" })),
            React.createElement("small", null, item.label)); })),
        React.createElement("button", { className: "floating-add", onClick: () => setModal('add'), "aria-label": "Nieuwe challenge", disabled: !activeGroup },
            React.createElement(Plus, { size: 24 })),
        modal === 'group' && React.createElement(Modal, { title: "Maak een nieuwe groep", subtitle: "Een eigen plek voor jouw vriendengroep.", onClose: closeModal },
            React.createElement("form", { className: "modal-form", onSubmit: handleCreateGroup },
                React.createElement("label", null,
                    "Groepsnaam",
                    React.createElement("input", { autoFocus: true, placeholder: "Bijv. De Legendes", value: groupName, maxLength: 60, onChange: e => setGroupName(e.target.value), required: true })),
                React.createElement("div", { className: "form-info" },
                    React.createElement(LockKeyhole, { size: 17 }),
                    " Je groep is priv\u00E9. Alleen vrienden met de code kunnen toetreden."),
                React.createElement("button", { className: "button button--primary button--full", disabled: busy, type: "submit" },
                    busy ? 'Bezig...' : 'Groep aanmaken',
                    " ",
                    React.createElement(ArrowRight, { size: 18 })))),
        modal === 'join' && React.createElement(Modal, { title: "Groep joinen", subtitle: "Voer de uitnodigingscode van je vriend in.", onClose: closeModal },
            React.createElement("form", { className: "modal-form", onSubmit: handleJoinGroup },
                React.createElement("label", null,
                    "Uitnodigingscode",
                    React.createElement("input", { autoFocus: true, className: "invite-input", placeholder: "BIJV. A1B2C3D4E5", value: joinCode, maxLength: 16, onChange: e => setJoinCode(e.target.value.toUpperCase()), required: true })),
                React.createElement("button", { className: "button button--primary button--full", disabled: busy, type: "submit" },
                    busy ? 'Bezig...' : 'Deelnemen aan groep',
                    " ",
                    React.createElement(ArrowRight, { size: 18 })))),
        modal === 'switch' && React.createElement(Modal, { title: "Jouw groepen", subtitle: "Wissel van groep of begin een nieuwe.", onClose: closeModal },
            React.createElement("div", { className: "switch-group-list" }, groups.map(g => React.createElement("button", { key: g.id, onClick: () => { setGroupId(g.id); setTab('home'); closeModal(); } },
                React.createElement("div", { className: "group-avatar" },
                    React.createElement(Users, { size: 20 })),
                React.createElement("span", null, g.name),
                g.id === groupId && React.createElement(CheckCircle2, { size: 19 })))),
            React.createElement("div", { className: "switch-actions" },
                React.createElement("button", { className: "button button--outline", onClick: () => setModal('join') },
                    React.createElement(UserPlus, { size: 17 }),
                    " Groep joinen"),
                React.createElement("button", { className: "button button--primary", onClick: () => setModal('group') },
                    React.createElement(Plus, { size: 17 }),
                    " Maak groep")),
            !isDemo && React.createElement("button", { className: "logout-mobile", onClick: () => logOut() },
                React.createElement(LogOut, { size: 16 }),
                " Uitloggen")),
        modal === 'invite' && activeGroup && React.createElement(Modal, { title: "Nodig je vrienden uit", subtitle: `Samen spelen in ${activeGroup.name}.`, onClose: closeModal },
            React.createElement("div", { className: "invite-visual" },
                React.createElement("div", { className: "invite-visual-icon" },
                    React.createElement(Users, { size: 30 })),
                React.createElement("strong", null, "Meer vrienden = meer competitie"),
                React.createElement("p", null, "Deel de code of stuur direct een link.")),
            React.createElement("label", { className: "small-label" }, "UITNODIGINGSCODE"),
            React.createElement("div", { className: "copy-field" },
                React.createElement("strong", null, activeGroup.invite_code),
                React.createElement("button", { onClick: () => copyValue(activeGroup.invite_code) },
                    React.createElement(Copy, { size: 17 }),
                    " Kopieer")),
            React.createElement("label", { className: "small-label" }, "UITNODIGINGSLINK"),
            React.createElement("div", { className: "copy-field copy-field--link" },
                React.createElement("span", null, inviteLink(activeGroup.invite_code)),
                React.createElement("button", { onClick: () => copyValue(inviteLink(activeGroup.invite_code)) },
                    React.createElement(Link2, { size: 17 }),
                    " Kopieer")),
            isDemo && React.createElement("p", { className: "demo-invite-note" }, "Dit is een voorbeeldcode. Om vrienden op verschillende telefoons te laten meedoen, verbind je eerst Supabase.")),
        modal === 'add' && activeGroup && React.createElement(Modal, { title: "Nieuwe challenge", subtitle: "Bedenk iets leuks en hang er punten aan.", onClose: closeModal },
            React.createElement("form", { className: "modal-form", onSubmit: handleAddChallenge },
                React.createElement("label", null,
                    "Naam van de challenge",
                    React.createElement("input", { autoFocus: true, placeholder: "Bijv. Loop een halve marathon", maxLength: 80, value: newChallenge.title, onChange: e => setNewChallenge(v => ({ ...v, title: e.target.value })), required: true })),
                React.createElement("label", null,
                    "Beschrijving ",
                    React.createElement("span", { className: "optional" }, "(optioneel)"),
                    React.createElement("textarea", { rows: 3, placeholder: "Wat moet iemand precies doen?", maxLength: 600, value: newChallenge.description, onChange: e => setNewChallenge(v => ({ ...v, description: e.target.value })) })),
                React.createElement("label", null, "Categorie"),
                React.createElement("div", { className: "category-options" }, CATEGORIES.map(c => { const I = IconFor[c.id]; return React.createElement("button", { type: "button", key: c.id, className: `category-option ${newChallenge.category === c.id ? 'category-option--selected' : ''}`, onClick: () => setNewChallenge(v => ({ ...v, category: c.id })) },
                    React.createElement(I, { size: 19 }),
                    React.createElement("span", null, c.label)); })),
                React.createElement("label", null,
                    "Punten ",
                    React.createElement("span", { className: "optional" }, "(1\u20131000)")),
                React.createElement("div", { className: "points-choice" },
                    React.createElement("div", { className: "points-field" },
                        React.createElement(Zap, { size: 21, fill: "currentColor" }),
                        React.createElement("input", { type: "number", min: 1, max: 1000, step: 1, value: newChallenge.points, onChange: e => setNewChallenge(v => ({ ...v, points: e.target.value })), required: true }),
                        React.createElement("span", null, "punten")),
                    React.createElement("div", { className: "quick-points" }, [50, 100, 250, 500].map(n => React.createElement("button", { type: "button", key: n, className: Number(newChallenge.points) === n ? 'selected' : '', onClick: () => setNewChallenge(v => ({ ...v, points: n })) }, n)))),
                React.createElement("button", { className: "button button--primary button--full", type: "submit", disabled: busy },
                    busy ? 'Challenge maken...' : 'Challenge toevoegen',
                    React.createElement(Plus, { size: 18 })))),
        modal === 'proof' && selectedChallenge && React.createElement(Modal, { title: "Challenge bewijzen", subtitle: "De punten zijn bijna binnen!", onClose: closeModal },
            React.createElement("div", { className: "proof-challenge-header" },
                React.createElement("div", { className: "proof-title" },
                    React.createElement(CategoryTag, { category: selectedChallenge.category }),
                    React.createElement("h3", null, selectedChallenge.title)),
                React.createElement(PointBadge, { points: selectedChallenge.points, large: true })),
            React.createElement("form", { className: "modal-form", onSubmit: handleSubmit },
                React.createElement("label", null,
                    "Hoe heb je het gedaan? ",
                    React.createElement("span", { className: "optional" }, "(als bewijs)"),
                    React.createElement("textarea", { placeholder: "Vertel wat je hebt gedaan...", rows: 4, maxLength: 1000, value: proofText, onChange: e => setProofText(e.target.value) })),
                React.createElement("label", null,
                    "Foto toevoegen ",
                    React.createElement("span", { className: "optional" }, "(optioneel, max. 4 MB)")),
                React.createElement("label", { className: "upload-zone" },
                    React.createElement(UploadCloud, { size: 25 }),
                    React.createElement("strong", null, proofFile ? proofFile.name : 'Kies een foto als bewijs'),
                    React.createElement("span", null, "JPG, PNG, WEBP of HEIC"),
                    React.createElement("input", { type: "file", accept: "image/jpeg,image/png,image/webp,image/heic,image/heif", onChange: e => setProofFile(e.target.files?.[0] || null) })),
                isDemo && React.createElement("p", { className: "upload-hint" }, "De demo bewaart maximaal 650 KB per foto op dit apparaat."),
                React.createElement("button", { className: "button button--primary button--full", type: "submit", disabled: busy },
                    busy ? 'Bewijs versturen...' : 'Stuur bewijs in',
                    React.createElement(ArrowRight, { size: 18 })),
                React.createElement("div", { className: "form-info" },
                    React.createElement(ShieldCheck, { size: 17 }),
                    " Een ander groepslid moet het bewijs goedkeuren voordat je de punten krijgt."))),
        modal === 'preview' && React.createElement(Modal, { title: "Bewijsfoto", subtitle: "Ingeleverd door je groepsgenoot.", onClose: closeModal, wide: true },
            React.createElement("div", { className: "proof-photo-wrap" },
                React.createElement("img", { src: previewUrl, alt: "Ingestuurde bewijsfoto" }))),
        modal === 'about' && React.createElement(Modal, { title: "Je probeert de demo", subtitle: "Zo zet je Puntjacht met je vrienden online.", onClose: closeModal },
            React.createElement("div", { className: "demo-help" },
                React.createElement("p", null, "De demo werkt helemaal lokaal op dit apparaat. Alles wat je hier aanmaakt blijft alleen op deze telefoon of computer."),
                React.createElement("p", null,
                    "Voor gedeelde accounts, foto's en een live klassement heb je een gratis Supabase-project nodig. De bijgeleverde ",
                    React.createElement("strong", null, "README.md"),
                    ", ",
                    React.createElement("strong", null, "supabase/schema.sql"),
                    " en ",
                    React.createElement("strong", null, "public/config.js"),
                    " helpen je daarmee."),
                React.createElement("p", null, "Daarna kun je de app kosteloos publiceren op Cloudflare Pages.")),
            React.createElement("button", { className: "button button--primary button--full", onClick: closeModal },
                "Begrepen ",
                React.createElement(Check, { size: 18 }))),
        React.createElement(Toast, { value: toast, onClose: closeToast }));
}
