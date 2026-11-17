const React = window.React;
const { useCallback, useEffect, useMemo, useRef, useState } = React;
import { Trophy, Sparkles, Users, House, Plus, Check, Clock3, ArrowRight, CheckCircle2, X, Link2, Copy, LogOut, ShieldCheck, PartyPopper, Dumbbell, Mountain, LockKeyhole, UploadCloud, Zap, Target, UserPlus, Image, RotateCcw, Gift, Pencil } from './lib/icons.js';
import { isDemo, currentSession, watchAuth, logIn, signUp, logOut, getProfile, updateProfile, listGroups, createGroup, joinGroup, loadGroup, addChallenge, cancelChallenge, withdrawChallenge, addShopItem, buyShopItem, acceptChallenge, submitProof, reviewSubmission, spinRoulette, getProofUrl, subscribeToGroup } from './lib/data.js';
import { CATEGORIES, DAILY_CHALLENGE_BONUS, amsterdamDateKey, categoryFor, ranking, challengeState, inviteLink, validChallenge, validShopItem, pointBalance } from './lib/game.js';
import { isTabPath, pathForTab, tabForPath } from './lib/routes.js';
import { Avatar, CategoryTag, Loading, PointBadge } from './components/atoms/index.js';
import { AuthScreen, Modal, Toast } from './components/molecules/index.js';
import Celebration from './components/organisms/Celebration.js';
import PageHeader from './components/organisms/PageHeader.js';
import RoulettePanel from './components/organisms/RoulettePanel.js';
import { ChallengesPage, HomePage, RankingPage, ReviewsPage, SettingsPage, ShopPage } from './components/pages/index.js';
import AppShell from './components/templates/AppShell.js';
const IconFor = { avontuur: Mountain, sport: Dumbbell, sociaal: Users, grappig: PartyPopper, overig: Sparkles };
const navItems = [
    { key: 'home', label: 'Overzicht', icon: House },
    { key: 'challenges', label: 'Challenges', icon: Target },
    { key: 'shop', label: 'Shop', icon: Gift },
    { key: 'roulette', label: 'Roulette', icon: RotateCcw },
    { key: 'ranking', label: 'Klassement', icon: Trophy },
    { key: 'reviews', label: 'Beoordelen', icon: ShieldCheck },
    { key: 'settings', label: 'Instellingen', icon: Pencil }
];
const PREFERENCES_KEY = 'puntjacht-preferences-v1';

function readPreferences() {
    try {
        const saved = JSON.parse(localStorage.getItem(PREFERENCES_KEY) || '{}');
        return { sound: saved.sound !== false, confetti: saved.confetti !== false };
    }
    catch {
        return { sound: true, confetti: true };
    }
}
function createCelebrationAudioContext() {
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextConstructor) return null;
    try {
        const context = new AudioContextConstructor();
        context.resume().catch(err => console.warn('Feestmuziek kon niet worden gestart.', err));
        return context;
    }
    catch (err) {
        console.warn('Feestmuziek is niet beschikbaar.', err);
        return null;
    }
}
function playCelebrationTune(context = null) {
    const ownsContext = !context;
    const audioContext = context || createCelebrationAudioContext();
    if (!audioContext || audioContext.state === 'closed') return;
    try {
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((frequency, index) => {
            const start = audioContext.currentTime + index * 0.13;
            const oscillator = audioContext.createOscillator();
            const gain = audioContext.createGain();
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(frequency, start);
            gain.gain.setValueAtTime(0.001, start);
            gain.gain.linearRampToValueAtTime(0.12, start + 0.025);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
            oscillator.connect(gain);
            gain.connect(audioContext.destination);
            oscillator.onended = () => {
                oscillator.disconnect();
                gain.disconnect();
            };
            oscillator.start(start);
            oscillator.stop(start + 0.21);
        });
        if (ownsContext) {
            window.setTimeout(() => {
                if (audioContext.state !== 'closed') audioContext.close().catch(err => console.warn('Feestmuziek kon niet worden afgesloten.', err));
            }, 1200);
        }
    }
    catch (err) {
        console.warn('Feestmuziek is niet beschikbaar.', err);
    }
}
export default function App() {
    const [booting, setBooting] = useState(true), [user, setUser] = useState(null), [profile, setProfile] = useState(null);
    const [groups, setGroups] = useState([]), [groupId, setGroupId] = useState(null), [groupLoading, setGroupLoading] = useState(false);
    const [members, setMembers] = useState([]), [challenges, setChallenges] = useState([]), [participations, setParticipations] = useState([]);
    const [challengeFunds, setChallengeFunds] = useState([]), [challengeAwards, setChallengeAwards] = useState([]);
    const [shopItems, setShopItems] = useState([]), [shopPurchases, setShopPurchases] = useState([]);
    const [dailyBonuses, setDailyBonuses] = useState([]), [dailyBonusEarnedToday, setDailyBonusEarnedToday] = useState(false), [dailyBonusAwardDate, setDailyBonusAwardDate] = useState(null);
    const [rouletteSpins, setRouletteSpins] = useState([]), [groupStartingPoints, setGroupStartingPoints] = useState([]);
    const [tab, setTabState] = useState(() => tabForPath(window.location.pathname)), [modal, setModal] = useState(null), [busy, setBusy] = useState(false);
    const [toast, setToast] = useState(null), [filter, setFilter] = useState('alles'), [search, setSearch] = useState('');
    const [preferences, setPreferences] = useState(readPreferences), [celebration, setCelebration] = useState(null);
    const [settingsName, setSettingsName] = useState('');
    const [groupName, setGroupName] = useState(''), [joinCode, setJoinCode] = useState('');
    const [newChallenge, setNewChallenge] = useState({ title: '', description: '', category: 'avontuur', points: 100, reward_slots: 1 });
    const [newShopItem, setNewShopItem] = useState({ title: '', description: '', price: 100, stock: 1 });
    const [selectedChallenge, setSelectedChallenge] = useState(null), [selectedParticipation, setSelectedParticipation] = useState(null);
    const [proofText, setProofText] = useState(''), [proofFile, setProofFile] = useState(null), [previewUrl, setPreviewUrl] = useState(null);
    const [reloadTick, setReloadTick] = useState(0), [groupsMenu, setGroupsMenu] = useState(false);
    const approvedParticipationIdsRef = useRef(new Set());
    const loadedGroupKeyRef = useRef(null);
    const setTab = useCallback(nextTab => {
        const path = pathForTab(nextTab);
        if (window.location.pathname !== path) {
            window.history.pushState(null, '', `${path}${window.location.search}${window.location.hash}`);
        }
        setTabState(nextTab);
    }, []);
    useEffect(() => {
        const syncTabWithUrl = () => setTabState(tabForPath(window.location.pathname));
        window.addEventListener('popstate', syncTabWithUrl);
        const canonicalPath = pathForTab(tabForPath(window.location.pathname));
        if (!isTabPath(window.location.pathname) || window.location.pathname !== canonicalPath) {
            window.history.replaceState(null, '', `${canonicalPath}${window.location.search}${window.location.hash}`);
        }
        return () => window.removeEventListener('popstate', syncTabWithUrl);
    }, []);
    const showToast = (text, error = false) => setToast({ text, error });
    const triggerCelebration = (text, audioContext = null) => {
        if (preferences.confetti) {
            const id = Date.now();
            setCelebration({ id, text });
            window.setTimeout(() => setCelebration(current => current?.id === id ? null : current), 3200);
        }
        if (preferences.sound) playCelebrationTune(audioContext);
    };
    const closeToast = useCallback(() => setToast(null), []);
    const closeModal = useCallback(() => { setModal(null); setPreviewUrl(null); }, []);
    const activeGroup = groups.find(g => g.id === groupId);
    const board = useMemo(() => ranking(members, challenges, participations, dailyBonuses), [members, challenges, participations, dailyBonuses]);
    const me = board.find(m => m.id === profile?.id);
    const myRank = board.findIndex(m => m.id === profile?.id) + 1;
    const myParticipations = participations.filter(p => p.user_id === profile?.id);
    const waiting = myParticipations.filter(p => p.status === 'pending').length;
    const reviewQueue = participations.filter(p => p.status === 'pending' && p.user_id !== profile?.id);
    const completed = myParticipations.filter(p => p.status === 'approved').length;
    const active = myParticipations.filter(p => p.status === 'accepted' || p.status === 'rejected').length;
    const profileName = profile?.display_name || 'Speler';
    const today = amsterdamDateKey();
    const hasEarnedDailyBonus = dailyBonusAwardDate === today && dailyBonusEarnedToday;
    const shopBalance = pointBalance(profile?.id, challenges, participations, shopPurchases, challengeFunds, challengeAwards, dailyBonuses, rouletteSpins, groupStartingPoints);
    const challengeCost = Number(newChallenge.points) * Number(newChallenge.reward_slots);
    useEffect(() => {
        try {
            localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
        }
        catch (err) {
            console.warn('Instellingen konden niet op dit apparaat worden opgeslagen.', err);
        }
    }, [preferences]);
    useEffect(() => setSettingsName(profile?.display_name || ''), [profile?.id, profile?.display_name]);
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
        setChallengeFunds([]);
        setChallengeAwards([]);
        setShopItems([]);
        setShopPurchases([]);
        setDailyBonuses([]);
        setDailyBonusEarnedToday(false);
        setDailyBonusAwardDate(null);
        setRouletteSpins([]);
        setGroupStartingPoints([]);
        return;
    } let cancelled = false; setGroupLoading(true); localStorage.setItem('puntjacht-active-group', groupId); loadGroup(groupId, profile?.id).then(data => { if (cancelled)
        return;
        const groupKey = `${groupId}:${profile?.id || ''}`;
        const approvedIds = new Set(data.participations.filter(item => item.user_id === profile?.id && item.status === 'approved').map(item => item.id));
        if (loadedGroupKeyRef.current === groupKey && [...approvedIds].some(id => !approvedParticipationIdsRef.current.has(id))) {
            triggerCelebration('Challenge voltooid!');
        }
        loadedGroupKeyRef.current = groupKey;
        approvedParticipationIdsRef.current = approvedIds;
        setMembers(data.members); setChallenges(data.challenges); setParticipations(data.participations); setChallengeFunds(data.challengeFunds); setChallengeAwards(data.challengeAwards); setShopItems(data.shopItems); setShopPurchases(data.shopPurchases); setDailyBonuses(data.dailyBonuses); setDailyBonusEarnedToday(data.dailyBonusEarnedToday); setDailyBonusAwardDate(data.dailyBonusAwardDate); setRouletteSpins(data.rouletteSpins); setGroupStartingPoints(data.groupStartingPoints); }).catch(err => { if (!cancelled)
        showToast(err.message, true); }).finally(() => { if (!cancelled)
        setGroupLoading(false); }); return () => { cancelled = true; }; }, [groupId, profile?.id, reloadTick]);
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
    const handleSaveProfile = async (e) => {
        e.preventDefault();
        const name = settingsName.trim();
        if (name.length < 2 || name.length > 40) {
            showToast('Gebruik een naam van 2 tot 40 tekens.', true);
            return;
        }
        await safeAction(async () => {
            const displayName = await updateProfile(profile.id, name);
            setProfile(current => ({ ...current, display_name: displayName }));
            setMembers(current => current.map(member => member.id === profile.id ? { ...member, display_name: displayName } : member));
        }, 'Je naam is bijgewerkt!');
    };
    const handleAddChallenge = async (e) => { e.preventDefault(); const error = validChallenge(newChallenge); if (error) {
        showToast(error, true);
        return;
    } const totalCost = Number(newChallenge.points) * Number(newChallenge.reward_slots); if (totalCost > shopBalance) {
        showToast('Je hebt niet genoeg punten om alle betaalde plekken te financieren.', true);
        return;
    } const ok = await safeAction(() => addChallenge(groupId, newChallenge, profile.id), 'Challenge geplaatst; de betaalde plekken zijn gereserveerd.'); if (ok) {
        setNewChallenge({ title: '', description: '', category: 'avontuur', points: 100, reward_slots: 1 });
        setTab('challenges');
        closeModal();
    } };
    const handleCancelChallenge = async (challenge) => {
        const funded = Boolean(challenge.bounty);
        if (!window.confirm(funded ? 'Challenge intrekken? Ongebruikte betaalde plekken worden terugbetaald.' : 'Challenge intrekken?')) return;
        await safeAction(() => cancelChallenge(challenge.id, profile.id), funded ? 'Challenge ingetrokken; ongebruikte punten zijn terugbetaald.' : 'Challenge ingetrokken.');
    };
    const handleWithdrawChallenge = async (participation) => {
        if (!window.confirm('Stoppen met deze challenge? Je betaalde plek komt dan weer vrij.')) return;
        await safeAction(() => withdrawChallenge(participation.id, profile.id), 'Je deelname is gestopt en de betaalde plek is vrijgegeven.');
    };
    const handleAddShopItem = async (e) => { e.preventDefault(); const error = validShopItem(newShopItem); if (error) {
        showToast(error, true);
        return;
    } const ok = await safeAction(() => addShopItem(groupId, newShopItem, profile.id), 'Beloning toegevoegd aan de shop!'); if (ok) {
        setNewShopItem({ title: '', description: '', price: 100, stock: 1 });
        setTab('shop');
        closeModal();
    } };
    const handleBuyShopItem = async (item) => {
        await safeAction(() => buyShopItem(item.id, profile.id), `${item.title} gekocht! De punten zijn overgemaakt aan ${members.find(member => member.id === item.created_by)?.display_name || 'de aanbieder'}.`);
    };
    const handleAction = async (challenge, participation) => {
        if (challenge.created_by === profile?.id) {
            showToast('Je kunt je eigen challenge niet uitvoeren.', true);
            return;
        }
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
    const handleReview = async (id, approved) => {
        const audioContext = approved && preferences.sound ? createCelebrationAudioContext() : null;
        const ok = await safeAction(() => reviewSubmission(id, approved), approved
            ? `Goedgekeurd! Is dit vandaag je eerste goedgekeurde challenge, dan krijg je ${DAILY_CHALLENGE_BONUS} bonuspunten.`
            : 'Bewijs afgekeurd. De betaalde plek is weer beschikbaar.');
        if (ok && approved) triggerCelebration('Challenge voltooid!', audioContext);
        else if (audioContext && audioContext.state !== 'closed') audioContext.close().catch(err => console.warn('Feestmuziek kon niet worden afgesloten.', err));
    };
    const handleRouletteSpin = async (bets) => {
        setBusy(true);
        try {
            const result = await spinRoulette(groupId, bets, profile.id);
            setReloadTick(n => n + 1);
            const net = Number(result.payout) - Number(result.stake);
            showToast(net > 0 ? `Roulette gewonnen! Je saldo stijgt met ${net} punten.` : net < 0 ? `Deze draai kostte ${Math.abs(net)} punten.` : 'Je inzet is terugbetaald.');
            return result;
        }
        catch (err) {
            showToast(err.message || 'Roulette kon niet worden gespeeld.', true);
            return null;
        }
        finally {
            setBusy(false);
        }
    };
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
        const available = !p && c.created_by !== profile?.id && !c.cancelled_at && (!c.bounty || (!c.bounty.cancelled_at && c.bounty.available_slots > 0));
        const matches = filter === 'alles' || (filter === 'beschikbaar' && available) || (filter === 'bezig' && ['accepted', 'rejected'].includes(p?.status)) || (filter === 'pending' && p?.status === 'pending') || (filter === 'voltooid' && p?.status === 'approved');
        return matches && `${c.title} ${c.description} ${categoryFor(c.category).label}`.toLowerCase().includes(search.toLowerCase());
    });
    const latest = participations.filter(p => p.status === 'approved').sort((a, b) => (b.reviewed_at || b.created_at).localeCompare(a.reviewed_at || a.created_at)).slice(0, 4);
    const pageContent = tab === 'home'
        ? React.createElement(HomePage, {
            earned: hasEarnedDailyBonus, me, completed, challenges, active, waiting, myRank, members, board,
            profile, participations, latest, onTab: setTab, onAction: handleAction, onAdd: () => setModal('add')
        })
        : tab === 'challenges'
            ? React.createElement(ChallengesPage, {
                earned: hasEarnedDailyBonus, filter, setFilter, search, setSearch, filtered, participations,
                profile, members, onReload: () => setReloadTick(n => n + 1), onAction: handleAction,
                onCancel: handleCancelChallenge, onWithdraw: handleWithdrawChallenge, onAdd: () => setModal('add')
            })
            : tab === 'shop'
                ? React.createElement(ShopPage, {
                    balance: shopBalance, shopItems, shopPurchases, members, profile, busy,
                    onAdd: () => setModal('shop-add'), onBuy: handleBuyShopItem
                })
                : tab === 'roulette'
                    ? React.createElement(RoulettePanel, {
                        balance: shopBalance, spins: rouletteSpins, members, userId: profile?.id, busy,
                        soundEnabled: preferences.sound, onSpin: handleRouletteSpin, onCelebrate: triggerCelebration
                    })
                    : tab === 'ranking'
                        ? React.createElement(RankingPage, { members, board, profile })
                        : tab === 'settings'
                            ? React.createElement(SettingsPage, {
                                settingsName, setSettingsName, profile, busy, onSave: handleSaveProfile, preferences, setPreferences
                            })
                            : React.createElement(ReviewsPage, {
                                reviewQueue, myParticipations, challenges, members, busy, onReview: handleReview, onShowProof: showProof
                            });
    if (booting)
        return React.createElement("div", { className: "app-boot" },
            React.createElement("div", { className: "brand-mark" },
                React.createElement(Trophy, { size: 28 })),
            React.createElement("div", { className: "spin" }));
    if (!user)
        return React.createElement(React.Fragment, null,
            React.createElement(AuthScreen, { onToast: text => showToast(text) }),
            React.createElement(Toast, { value: toast, onClose: closeToast }));
    return React.createElement(AppShell, null,
        React.createElement("aside", { className: "sidebar" },
            React.createElement("div", { className: "brand" },
                React.createElement("img", { className: "brand-logo", src: "/logo.png", alt: "Al 4 jaar VleesTas" })),
            React.createElement("div", { className: "sidebar-section-label" }, "JOUW GROEP"),
            React.createElement("div", { className: "group-selector-wrapper" },
                React.createElement("button", { className: "group-selector", onClick: () => setGroupsMenu(v => !v) },
                    React.createElement("div", { className: "group-avatar" },
                        React.createElement(Users, { size: 20 })),
                    React.createElement("span", { className: "group-selector-name" },
                        activeGroup?.name || 'Kies een groep',
                        React.createElement("small", null,
                            members.length,
                            " leden"))),
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
                        React.createElement("img", { className: "brand-logo", src: "/logo.png", alt: "Al 4 jaar VleesTas" })),
                    React.createElement("div", { className: "mobile-header-actions" },
                        React.createElement("button", { className: "mobile-group-button", onClick: () => setModal('switch') },
                            React.createElement(Users, { size: 17 }),
                            activeGroup?.name || 'Groep'),
                        React.createElement("button", {
                            className: "mobile-invite-button",
                            type: "button",
                            "aria-label": "Uitnodigingscode van huidige groep",
                            title: activeGroup ? `Deel code van ${activeGroup.name}` : "Kies eerst een groep",
                            disabled: !activeGroup,
                            onClick: () => setModal('invite')
                        },
                            React.createElement(Link2, { size: 16 }),
                            " Code"))),
                isDemo && React.createElement("div", { className: "demo-banner" },
                    React.createElement("span", { className: "demo-dot" }),
                    React.createElement("span", null,
                        React.createElement("strong", null, "Demomodus"),
                        " \u2014 probeer alles uit. Voor samenwerken met vrienden: koppel je eigen gratis Supabase-project."),
                    React.createElement("button", { onClick: () => setModal('about'), "aria-label": "Uitleg" },
                        "Meer info ",
                        React.createElement(ArrowRight, { size: 14 }))),
                !activeGroup && tab !== 'settings' ? React.createElement("div", { className: "first-group" },
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
                        React.createElement(PageHeader, {
                            groupName: activeGroup?.name,
                            profileName,
                            tab,
                            onInvite: () => setModal('invite'),
                            onAdd: () => setModal('add')
                        }),
                        groupLoading && challenges.length === 0 ? React.createElement(Loading, null) : pageContent))),
        React.createElement("nav", { className: "bottom-nav" }, navItems.map(item => { const I = item.icon; return React.createElement("button", { key: item.key, className: tab === item.key ? 'bottom-nav--active' : '', onClick: () => setTab(item.key) },
            React.createElement("span", { className: "bottom-icon" },
                React.createElement(I, { size: 21 }),
                item.key === 'reviews' && reviewQueue.length > 0 && React.createElement("span", { className: "bottom-count" })),
            React.createElement("small", null, item.label)); })),
        tab !== 'shop' && tab !== 'roulette' && tab !== 'settings' && React.createElement("button", { className: "floating-add", onClick: () => setModal('add'), "aria-label": "Nieuwe challenge", disabled: !activeGroup },
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
            React.createElement("div", { className: "switch-group-list" }, groups.map(g => React.createElement("div", { key: g.id, className: "switch-group-row" },
                React.createElement("button", { className: "switch-group-select", "aria-pressed": g.id === groupId, onClick: () => { setGroupId(g.id); setTab('home'); closeModal(); } },
                    React.createElement("div", { className: "group-avatar" },
                        React.createElement(Users, { size: 20 })),
                    React.createElement("span", { className: "switch-group-details" },
                        React.createElement("strong", null, g.name),
                        React.createElement("small", { className: "switch-group-code" }, g.invite_code ? `Code: ${g.invite_code}` : "Geen code beschikbaar")),
                    g.id === groupId && React.createElement(CheckCircle2, { size: 19 })),
                React.createElement("button", { className: "switch-group-copy", type: "button", "aria-label": `Kopieer uitnodigingscode van ${g.name}`, title: g.invite_code ? "Kopieer groepscode" : "Geen code beschikbaar", disabled: !g.invite_code, onClick: () => copyValue(g.invite_code) },
                    React.createElement(Copy, { size: 16 }))))),
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
                React.createElement("label", null,
                    "Aantal betaalde plekken",
                    React.createElement("input", { type: "number", min: 1, max: 100, step: 1, value: newChallenge.reward_slots, onChange: e => setNewChallenge(v => ({ ...v, reward_slots: e.target.value })), required: true })),
                React.createElement("div", { className: `challenge-cost-info ${challengeCost > shopBalance ? 'challenge-cost-info--error' : ''}` },
                    React.createElement(Zap, { size: 17, fill: "currentColor" }),
                    React.createElement("span", null,
                        "Je reserveert ",
                        challengeCost,
                        " punten (",
                        newChallenge.points,
                        " per plek × ",
                        newChallenge.reward_slots,
                        "). Je hebt ",
                        shopBalance,
                        " punten beschikbaar.")),
                React.createElement("button", { className: "button button--primary button--full", type: "submit", disabled: busy || challengeCost > shopBalance },
                    busy ? 'Challenge maken...' : challengeCost > shopBalance ? 'Niet genoeg punten' : 'Challenge plaatsen',
                    React.createElement(Plus, { size: 18 })))),
        modal === 'shop-add' && activeGroup && React.createElement(Modal, { title: "Beloning aanbieden", subtitle: "Groepsleden betalen met hun punten; die gaan naar jou.", onClose: closeModal },
            React.createElement("form", { className: "modal-form", onSubmit: handleAddShopItem },
                React.createElement("label", null,
                    "Naam van de beloning",
                    React.createElement("input", { autoFocus: true, placeholder: "Bijv. Koffie op mij", maxLength: 80, value: newShopItem.title, onChange: e => setNewShopItem(v => ({ ...v, title: e.target.value })), required: true })),
                React.createElement("label", null,
                    "Beschrijving ",
                    React.createElement("span", { className: "optional" }, "(optioneel)"),
                    React.createElement("textarea", { rows: 3, placeholder: "Wat krijgt de koper?", maxLength: 600, value: newShopItem.description, onChange: e => setNewShopItem(v => ({ ...v, description: e.target.value })) })),
                React.createElement("label", null, "Prijs in punten"),
                React.createElement("input", { type: "number", min: 1, max: 100000, step: 1, value: newShopItem.price, onChange: e => setNewShopItem(v => ({ ...v, price: e.target.value })), required: true }),
                React.createElement("label", null, "Voorraad"),
                React.createElement("input", { type: "number", min: 1, max: 10000, step: 1, value: newShopItem.stock, onChange: e => setNewShopItem(v => ({ ...v, stock: e.target.value })), required: true }),
                React.createElement("div", { className: "form-info" },
                    React.createElement(Gift, { size: 17 }),
                    "Elke aankoop vermindert de voorraad en maakt de betaalde punten beschikbaar voor jou."),
                React.createElement("button", { className: "button button--primary button--full", type: "submit", disabled: busy },
                    busy ? 'Beloning toevoegen...' : 'Aanbieden in de shop',
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
        modal === 'about' && React.createElement(Modal, { title: "Je probeert de demo", subtitle: "Zo zet je Al 4 jaar VleesTas met je vrienden online.", onClose: closeModal },
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
        celebration && React.createElement(Celebration, { text: celebration.text }),
        React.createElement(Toast, { value: toast, onClose: closeToast }));
}
