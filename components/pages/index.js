const React = window.React;
import {
    ArrowRight, Check, CheckCheck, Clock3, Crown, Dumbbell, ExternalLink, Flame, Gift, Image,
    Medal, Mountain, PartyPopper, Pencil, Plus, RefreshCcw, Search, ShieldCheck, Sparkles,
    Target, TrendingUp, Trophy, Users, X, Zap
} from '../../lib/icons.js';
import { categoryFor, challengeState, formatDate } from '../../lib/game.js';
import { Avatar, CategoryTag, NoResults, PointBadge, StatusTag } from '../atoms/index.js';
import { ChallengeCard, DailyBonusBanner, ShopCard } from '../molecules/index.js';

const IconFor = { avontuur: Mountain, sport: Dumbbell, sociaal: Users, grappig: PartyPopper, overig: Sparkles };

export function HomePage({
    earned, me, completed, challenges, active, waiting, myRank, members, board,
    profile, participations, latest, onTab, onAction, onAdd
}) {
    const quickChallenges = challenges
        .filter(challenge => challengeState(challenge.id, profile?.id, participations)?.status !== 'approved' && challenge.created_by !== profile?.id && !challenge.cancelled_at && !(challenge.bounty && (challenge.bounty.cancelled_at || challenge.bounty.available_slots < 1)))
        .slice(0, 4)
        .map(challenge => {
            const category = categoryFor(challenge.category);
            const Icon = IconFor[category.id];
            const participation = challengeState(challenge.id, profile?.id, participations);
            return React.createElement("div", { className: "quick-challenge", key: challenge.id },
                React.createElement("div", { className: `quick-icon quick-icon--${category.tone}` }, React.createElement(Icon, { size: 20 })),
                React.createElement("div", { className: "quick-details" },
                    React.createElement("strong", null, challenge.title),
                    React.createElement("span", null, category.label, " · ", formatDate(challenge.created_at))),
                React.createElement(PointBadge, { points: challenge.points }),
                participation?.status === 'pending'
                    ? React.createElement(Clock3, { size: 17, color: "#9a8e76" })
                    : React.createElement("button", { className: "quick-arrow", "aria-label": `Open ${challenge.title}`, onClick: () => onAction(challenge, participation) }, React.createElement(ArrowRight, { size: 17 })));
        });
    const hero = React.createElement("section", { className: "hero" },
        React.createElement("div", { className: "hero-copy" },
            React.createElement("span", { className: "hero-kicker" }, React.createElement(Flame, { size: 16, fill: "currentColor" }), " LET THE GAMES BEGIN"),
            React.createElement("h2", null, "De jacht op punten", React.createElement("br", null), React.createElement("em", null, "is geopend.")),
            React.createElement("p", null, "Pak uitdagingen aan, bewijs wat je hebt gedaan en stijg naar de top!"),
            React.createElement("button", { onClick: () => onTab('challenges') }, "Ontdek challenges ", React.createElement(ArrowRight, { size: 17 }))),
        React.createElement("div", { className: "hero-art", "aria-hidden": "true" },
            React.createElement("div", { className: "hero-ring hero-ring--one" }),
            React.createElement("div", { className: "hero-ring hero-ring--two" }),
            React.createElement("div", { className: "hero-trophy" }, React.createElement(Trophy, { size: 90, strokeWidth: 1.5 })),
            React.createElement("div", { className: "hero-points" }, React.createElement(Zap, { fill: "currentColor", size: 14 }), " +250 XP"),
            React.createElement("span", { className: "hero-star hero-star--one" }, "✦"),
            React.createElement("span", { className: "hero-star hero-star--two" }, "✴"),
            React.createElement("span", { className: "hero-star hero-star--three" }, "✦")));
    const stats = React.createElement("div", { className: "stats-grid" },
        React.createElement("div", { className: "stat" },
            React.createElement("div", { className: "stat-icon stat-icon--purple" }, React.createElement(Zap, { size: 20 })),
            React.createElement("span", null, "Puntenscore"),
            React.createElement("strong", null, me?.points || 0, " ", React.createElement("small", null, "pt")),
            React.createElement("div", { className: "stat-note" }, React.createElement(TrendingUp, { size: 14 }), "Verdiend met challenges")),
        React.createElement("div", { className: "stat" },
            React.createElement("div", { className: "stat-icon stat-icon--orange" }, React.createElement(Target, { size: 21 })),
            React.createElement("span", null, "Challenges voltooid"),
            React.createElement("strong", null, completed, " ", React.createElement("small", null, "van ", challenges.length)),
            React.createElement("div", { className: "stat-note" }, active, " bezig · ", waiting, " wachtend")),
        React.createElement("div", { className: "stat" },
            React.createElement("div", { className: "stat-icon stat-icon--blue" }, React.createElement(Trophy, { size: 20 })),
            React.createElement("span", null, "Jouw positie"),
            React.createElement("strong", null, "#", myRank || '-', " ", React.createElement("small", null, "van ", members.length)),
            React.createElement("div", { className: "stat-note" }, React.createElement(Users, { size: 14 }), " Samen in de strijd")));
    const challengePanel = React.createElement("section", { className: "panel" },
        React.createElement("div", { className: "panel-heading" },
            React.createElement("div", null,
                React.createElement("h2", null, React.createElement("span", { className: "section-icon" }, React.createElement(Target, { size: 19 })), " Challenges voor jou"),
                React.createElement("p", null, "Pak vandaag nog wat extra punten.")),
            React.createElement("button", { className: "text-action", onClick: () => onTab('challenges') }, "Bekijk alles ", React.createElement(ArrowRight, { size: 16 }))),
        React.createElement("div", { className: "quick-challenges" },
            quickChallenges,
            challenges.length === 0 && React.createElement(NoResults, {
                icon: Target,
                title: "Nog geen challenges",
                text: "Maak de allereerste uitdaging van deze groep.",
                action: React.createElement("button", { className: "button button--primary", onClick: onAdd }, React.createElement(Plus, { size: 16 }), " Maak challenge")
            })));
    const leaders = board.slice(0, 5).map((player, index) => React.createElement("div", { className: "sidebar-leader", key: player.id },
        React.createElement("span", { className: `leader-place leader-place--${index + 1}` }, index === 0 ? React.createElement(Crown, { size: 18 }) : index + 1),
        React.createElement(Avatar, { name: player.display_name, size: "sm", index }),
        React.createElement("div", null,
            React.createElement("strong", null, player.display_name, player.id === profile?.id && React.createElement("span", { className: "you-tag" }, "jij")),
            React.createElement("small", null, player.completed, " voltooid")),
        React.createElement("b", null, player.points, " ", React.createElement("small", null, "pt"))));
    const rankingPanel = React.createElement("section", { className: "panel ranking-panel" },
        React.createElement("div", { className: "panel-heading" },
            React.createElement("div", null,
                React.createElement("h2", null, React.createElement("span", { className: "section-icon section-icon--yellow" }, React.createElement(Trophy, { size: 19 })), " Topspelers"),
                React.createElement("p", null, "De voorlopige tussenstand.")),
            React.createElement("button", { className: "text-action", onClick: () => onTab('ranking') }, "Volledig ", React.createElement(ArrowRight, { size: 16 }))),
        React.createElement("div", { className: "sidebar-leaders" }, leaders));
    const activityItems = latest.map(participation => {
        const challenge = challenges.find(item => item.id === participation.challenge_id);
        const member = members.find(item => item.id === participation.user_id);
        return React.createElement("div", { className: "activity-row", key: participation.id },
            React.createElement("div", { className: "activity-check" }, React.createElement(Check, { size: 17 })),
            React.createElement("div", null,
                React.createElement("strong", null, member?.display_name || 'Een vriend', " ", React.createElement("span", null, "heeft een challenge voltooid")),
                React.createElement("small", null, challenge?.title || 'Challenge')),
            React.createElement(PointBadge, { points: challenge?.points || 0 }));
    });
    const activitySection = React.createElement("section", { className: "activity-section" },
        React.createElement("div", { className: "section-heading" },
            React.createElement("h2", null, "Laatste prestaties ", React.createElement(Sparkles, { size: 18 })),
            React.createElement("p", null, "Wat er onlangs is gebeurd in de groep.")),
        latest.length
            ? React.createElement("div", { className: "activity-list" }, activityItems)
            : React.createElement("div", { className: "activity-placeholder" }, "Nog geen goedgekeurde challenges."));
    return React.createElement(React.Fragment, null,
        React.createElement(DailyBonusBanner, { earned }),
        hero,
        stats,
        React.createElement("div", { className: "dashboard-columns" }, challengePanel, rankingPanel),
        activitySection);
}
export function ChallengesPage({
    earned, filter, setFilter, search, setSearch, filtered, participations,
    profile, members, onReload, onAction, onCancel, onWithdraw, onAdd
}) {
    const filters = [
        { id: 'alles', label: 'Alle' }, { id: 'beschikbaar', label: 'Beschikbaar' },
        { id: 'bezig', label: 'Bezig' }, { id: 'pending', label: 'In beoordeling' },
        { id: 'voltooid', label: 'Voltooid' }
    ];
    return React.createElement(React.Fragment, null,
        React.createElement(DailyBonusBanner, { earned }),
        React.createElement("div", { className: "challenge-toolbar" },
            React.createElement("div", { className: "filter-list" }, filters.map(item => React.createElement("button", {
                key: item.id,
                className: `filter-chip ${filter === item.id ? 'filter-chip--active' : ''}`,
                onClick: () => setFilter(item.id)
            }, item.label))),
            React.createElement("div", { className: "search-input" },
                React.createElement(Search, { size: 18 }),
                React.createElement("input", { placeholder: "Zoek challenges...", value: search, onChange: event => setSearch(event.target.value) }))),
        React.createElement("div", { className: "challenge-meta" },
            React.createElement("span", null, React.createElement("strong", null, filtered.length), " challenges gevonden"),
            React.createElement("button", { onClick: onReload, className: "muted-action" }, React.createElement(RefreshCcw, { size: 15 }), " Verversen")),
        filtered.length
            ? React.createElement("div", { className: "challenge-grid" }, filtered.map(challenge => React.createElement(ChallengeCard, {
                key: challenge.id,
                challenge,
                participation: challengeState(challenge.id, profile?.id, participations),
                onAction,
                onCancel,
                onWithdraw,
                creator: members.find(member => member.id === challenge.created_by)?.display_name,
                viewerId: profile?.id
            })))
            : React.createElement(NoResults, {
                icon: Search,
                title: "Geen challenges gevonden",
                text: "Probeer een ander filter of bedenk zelf een nieuwe uitdaging.",
                action: React.createElement("button", { className: "button button--primary", onClick: onAdd }, React.createElement(Plus, { size: 17 }), " Nieuwe challenge")
            }));
}

export function ShopPage({ balance, shopItems, shopPurchases, members, profile, busy, onAdd, onBuy }) {
    return React.createElement(React.Fragment, null,
        React.createElement("section", { className: "shop-balance" },
            React.createElement("div", { className: "shop-balance-icon" }, React.createElement(Zap, { size: 22, fill: "currentColor" })),
            React.createElement("div", null, React.createElement("span", null, "Jouw shoptegoed"), React.createElement("strong", null, balance, " punten")),
            React.createElement("p", null, "Bij een aankoop gaan de punten naar de aanbieder.")),
        React.createElement("div", { className: "shop-heading" },
            React.createElement("div", null,
                React.createElement("h2", null, "Aangeboden door jullie"),
                React.createElement("p", null, `${shopItems.length} beloningen van groepsleden`)),
            React.createElement("button", { className: "button button--primary", onClick: onAdd }, React.createElement(Plus, { size: 17 }), " Beloning aanbieden")),
        shopItems.length
            ? React.createElement("div", { className: "shop-grid" }, shopItems.map(item => React.createElement(ShopCard, {
                key: item.id,
                item,
                seller: members.find(member => member.id === item.created_by)?.display_name,
                own: item.created_by === profile?.id,
                canAfford: balance >= Number(item.price),
                busy,
                onBuy: () => onBuy(item)
            })))
            : React.createElement(NoResults, { icon: Gift, title: "De shop is nog leeg", text: "Bied als eerste een leuke beloning aan voor je groepsgenoten." }),
        shopPurchases.length > 0 && React.createElement("section", { className: "shop-sales" },
            React.createElement("h2", null, "Recente aankopen"),
            shopPurchases.slice(0, 6).map(purchase => {
                const buyer = members.find(member => member.id === purchase.buyer_id);
                const seller = members.find(member => member.id === purchase.seller_id);
                const item = shopItems.find(listing => listing.id === purchase.item_id);
                return React.createElement("div", { className: "shop-sale", key: purchase.id },
                    React.createElement(Gift, { size: 17 }),
                    React.createElement("span", null, buyer?.display_name || 'Een groepslid', " kocht ", item?.title || 'een beloning', " van ", seller?.display_name || 'een groepslid'),
                    React.createElement(PointBadge, { points: purchase.price }));
            })));
}

export function RankingPage({ members, board, profile }) {
    const podiumPositions = [1, 0, 2];
    const podiumPeople = podiumPositions.map(position => {
        const player = board[position];
        if (!player) return React.createElement("div", { key: position, className: "podium-person podium-person--empty" });
        return React.createElement("div", { className: `podium-person podium-person--${position + 1}`, key: player.id },
            React.createElement("span", { className: "podium-crown" }, position === 0 ? React.createElement(Crown, { size: 25, fill: "currentColor" }) : position === 1 ? '✧' : '✦'),
            React.createElement(Avatar, { name: player.display_name, size: "xl", index: position }),
            React.createElement("strong", null, player.display_name),
            React.createElement("span", { className: "podium-score" }, React.createElement(Zap, { size: 15, fill: "currentColor" }), player.points, " pt"),
            React.createElement("div", { className: "podium-block" }, React.createElement("strong", null, position + 1)));
    });
    const leaderboardRows = board.map((player, index) => React.createElement("div", {
        className: `leaderboard-line ${player.id === profile?.id ? 'leaderboard-line--self' : ''}`,
        key: player.id
    },
        React.createElement("span", { className: "line-rank" }, index === 0 ? React.createElement(Medal, { size: 22 }) : String(index + 1).padStart(2, '0')),
        React.createElement("div", { className: "line-player" },
            React.createElement(Avatar, { name: player.display_name, index }),
            React.createElement("div", null,
                React.createElement("strong", null, player.display_name),
                React.createElement("small", null, player.id === profile?.id ? 'Dat ben jij!' : 'Groepslid'))),
        React.createElement("span", { className: "line-completed" }, player.completed, " voltooid"),
        React.createElement("strong", { className: "line-points" }, player.points, " ", React.createElement("small", null, "pt"))));
    const introduction = React.createElement("div", { className: "leaderboard-intro" },
        React.createElement("span", { className: "leaderboard-intro-icon" }, React.createElement(Trophy, { size: 24 })),
        React.createElement("div", null,
            React.createElement("h2", null, "De ranglijst"),
            React.createElement("p", null, "Alle goedgekeurde challenges worden automatisch meegeteld.")),
        React.createElement("span", { className: "leaderboard-players" }, React.createElement(Users, { size: 16 }), members.length, " spelers"));
    const podium = React.createElement("div", { className: "podium" }, podiumPeople);
    const leaderboard = React.createElement("div", { className: "leaderboard-list" },
        React.createElement("div", { className: "leaderboard-list-heading" },
            React.createElement("span", null, "RANG"),
            React.createElement("span", null, "SPELER"),
            React.createElement("span", null, "CHALLENGES"),
            React.createElement("span", null, "PUNTEN")),
        leaderboardRows);
    return React.createElement(React.Fragment, null, introduction, podium, leaderboard);
}
export function SettingsPage({ settingsName, setSettingsName, profile, busy, onSave, preferences, setPreferences }) {
    return React.createElement("div", { className: "settings-grid" },
        React.createElement("form", { className: "settings-card", onSubmit: onSave },
            React.createElement("div", { className: "settings-card-heading" },
                React.createElement("div", { className: "settings-icon" }, React.createElement(Pencil, { size: 19 })),
                React.createElement("div", null, React.createElement("h2", null, "Jouw profiel"), React.createElement("p", null, "Zo zien je groepsgenoten je."))),
            React.createElement("label", { className: "settings-field" },
                "Weergavenaam",
                React.createElement("input", {
                    autoComplete: "name",
                    maxLength: 40,
                    minLength: 2,
                    value: settingsName,
                    onChange: event => setSettingsName(event.target.value),
                    required: true
                })),
            profile?.email && React.createElement("div", { className: "settings-account-email" },
                React.createElement("span", null, "E-mailadres"),
                React.createElement("strong", null, profile.email)),
            React.createElement("button", { className: "button button--primary", type: "submit", disabled: busy },
                busy ? 'Opslaan...' : 'Naam opslaan',
                React.createElement(Check, { size: 17 }))),
        React.createElement("section", { className: "settings-card" },
            React.createElement("div", { className: "settings-card-heading" },
                React.createElement("div", { className: "settings-icon settings-icon--purple" }, React.createElement(Sparkles, { size: 19 })),
                React.createElement("div", null, React.createElement("h2", null, "Spelvoorkeuren"), React.createElement("p", null, "Kies hoe de app feest viert."))),
            React.createElement("label", { className: "settings-toggle" },
                React.createElement("span", null, React.createElement("strong", null, "Feestmuziek"), React.createElement("small", null, "Een kort vrolijk muziekje bij winst.")),
                React.createElement("input", { type: "checkbox", checked: preferences.sound, onChange: event => setPreferences(current => ({ ...current, sound: event.target.checked })) })),
            React.createElement("label", { className: "settings-toggle" },
                React.createElement("span", null, React.createElement("strong", null, "Confetti"), React.createElement("small", null, "Confetti bij een voltooide challenge of roulettewinst.")),
                React.createElement("input", { type: "checkbox", checked: preferences.confetti, onChange: event => setPreferences(current => ({ ...current, confetti: event.target.checked })) }))),
        React.createElement("section", { className: "settings-note" },
            React.createElement(Users, { size: 20 }),
            React.createElement("p", null, "Iedereen ontvangt automatisch 100 startpunten per groep. Je instellingen en naam blijven bewaard.")));
}

export function ReviewsPage({ reviewQueue, myParticipations, challenges, members, busy, onReview, onShowProof }) {
    return React.createElement(React.Fragment, null,
        React.createElement("div", { className: "review-guide" },
            React.createElement("div", { className: "review-guide-icon" }, React.createElement(ShieldCheck, { size: 23 })),
            React.createElement("div", null,
                React.createElement("h2", null, "Fair play, echte punten."),
                React.createElement("p", null, "Controleer het bewijs van je vrienden. Je kunt je eigen inzendingen niet goedkeuren.")),
            React.createElement("span", { className: "review-count" }, reviewQueue.length, " open")),
        reviewQueue.length
            ? React.createElement("div", { className: "review-list" }, reviewQueue.map(participation => {
                const challenge = challenges.find(item => item.id === participation.challenge_id);
                const member = members.find(item => item.id === participation.user_id);
                return React.createElement("div", { className: "review-card", key: participation.id },
                    React.createElement("div", { className: "review-card-head" },
                        React.createElement(Avatar, { name: member?.display_name || 'Vriend', index: members.findIndex(item => item.id === participation.user_id) }),
                        React.createElement("div", null,
                            React.createElement("strong", null, member?.display_name || 'Een vriend'),
                            React.createElement("span", null, "heeft bewijs ingestuurd · ", formatDate(participation.submitted_at || participation.created_at))),
                        React.createElement(PointBadge, { points: challenge?.points || 0 })),
                    React.createElement("h3", null, challenge?.title || 'Challenge'),
                    participation.proof_text && React.createElement("p", { className: "review-proof-text" }, "“", participation.proof_text, "”"),
                    participation.proof_path && React.createElement("button", { className: "show-proof", disabled: busy, onClick: () => onShowProof(participation.proof_path) },
                        React.createElement(Image, { size: 16 }), " Bekijk bewijsfoto ", React.createElement(ExternalLink, { size: 14 })),
                    React.createElement("div", { className: "review-actions" },
                        React.createElement("button", { className: "button button--reject", onClick: () => onReview(participation.id, false), disabled: busy }, React.createElement(X, { size: 17 }), " Afkeuren"),
                        React.createElement("button", { className: "button button--approve", onClick: () => onReview(participation.id, true), disabled: busy }, React.createElement(CheckCheck, { size: 17 }), " Goedkeuren")));
            }))
            : React.createElement(NoResults, { icon: ShieldCheck, title: "Alles is beoordeeld!", text: "Er staan op dit moment geen inzendingen van je vrienden klaar." }),
        myParticipations.filter(item => item.status === 'pending').length > 0 && React.createElement("div", { className: "your-pending" },
            React.createElement("h3", null, React.createElement(Clock3, { size: 17 }), " Jouw inzendingen in afwachting"),
            myParticipations.filter(item => item.status === 'pending').map(participation => React.createElement("div", { key: participation.id },
                challenges.find(challenge => challenge.id === participation.challenge_id)?.title || 'Challenge',
                " ",
                React.createElement(StatusTag, { status: "pending" })))));
}
