const React = window.React;
const { useEffect, useRef, useState } = React;
import { RotateCcw, X } from '../../lib/icons.js';
import { rouletteColor } from '../../lib/game.js';

const rouletteOutsideBets = [
    { type: 'red', label: 'Rood', odds: '1:1' },
    { type: 'black', label: 'Zwart', odds: '1:1' },
    { type: 'even', label: 'Even', odds: '1:1' },
    { type: 'odd', label: 'Oneven', odds: '1:1' },
    { type: 'low', label: '1–18', odds: '1:1' },
    { type: 'high', label: '19–36', odds: '1:1' }
];
const rouletteGroupBets = [
    { type: 'dozen1', label: '1e dozijn · 1–12' },
    { type: 'dozen2', label: '2e dozijn · 13–24' },
    { type: 'dozen3', label: '3e dozijn · 25–36' },
    { type: 'column1', label: 'Kolom 1' },
    { type: 'column2', label: 'Kolom 2' },
    { type: 'column3', label: 'Kolom 3' }
];
const europeanRouletteWheel = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];

export default function RoulettePanel({ balance, spins, members, userId, busy, soundEnabled, onSpin, onCelebrate }) {
    const [amount, setAmount] = useState(Math.max(1, Math.min(10, balance)));
    const [bets, setBets] = useState([]);
    const [lastSpin, setLastSpin] = useState(null);
    const [wheelRotation, setWheelRotation] = useState(0);
    const [ballRotation, setBallRotation] = useState(0);
    const [spinAnimation, setSpinAnimation] = useState(null);
    const [spinning, setSpinning] = useState(false);
    const [error, setError] = useState('');
    const audioContextRef = useRef(null);
    const completedSpinRef = useRef(null);

    useEffect(() => () => {
        const context = audioContextRef.current;
        if (context && context.state !== 'closed') {
            context.close().catch(err => console.warn('Roulettegeluid kon niet worden afgesloten.', err));
        }
    }, []);

    const getAudioContext = () => {
        if (audioContextRef.current) return audioContextRef.current;
        const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextConstructor) return null;
        try {
            audioContextRef.current = new AudioContextConstructor();
            audioContextRef.current.resume().catch(err => console.warn('Roulettegeluid kon niet worden gestart.', err));
            return audioContextRef.current;
        }
        catch (err) {
            console.warn('Roulettegeluid is niet beschikbaar.', err);
            return null;
        }
    };

    const playBallDropSound = context => {
        if (!context || context.state !== 'running') return;
        const start = context.currentTime;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(900, start);
        oscillator.frequency.exponentialRampToValueAtTime(280, start + 0.16);
        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.onended = () => {
            oscillator.disconnect();
            gain.disconnect();
        };
        oscillator.start(start);
        oscillator.stop(start + 0.19);
    };

    const totalStake = bets.reduce((total, bet) => total + bet.stake, 0);
    const remaining = Math.max(0, balance - totalStake);
    const canPlace = Number.isSafeInteger(Number(amount)) && Number(amount) > 0 && Number(amount) <= remaining && bets.length < 100;
    const placeBet = (type, value, label) => {
        const stake = Number(amount);
        if (!Number.isSafeInteger(stake) || stake < 1) {
            setError('Kies een inzet van minimaal 1 punt.');
            return;
        }
        if (stake > remaining) {
            setError('Je totale inzet kan niet hoger zijn dan je saldo.');
            return;
        }
        const id = `${type}:${value === undefined ? '' : value}`;
        const existing = bets.find(bet => bet.id === id);
        if (!existing && bets.length >= 100) {
            setError('Je kunt maximaal 100 verschillende inzetten plaatsen.');
            return;
        }
        setBets(existing
            ? bets.map(bet => bet.id === id ? { ...bet, stake: bet.stake + stake } : bet)
            : [...bets, { id, type, value, label, stake }]);
        setError('');
    };
    const finishSpin = animation => {
        if (completedSpinRef.current === animation) return;
        completedSpinRef.current = animation;
        setWheelRotation(animation.toWheel);
        setBallRotation(animation.toBall);
        setSpinning(false);
        setSpinAnimation(null);
        playBallDropSound(animation.audioContext);
        const net = Number(animation.result.payout) - Number(animation.result.stake);
        if (net > 0) onCelebrate(`Gewonnen! +${net} punten`, animation.audioContext);
    };
    useEffect(() => {
        if (!spinAnimation) return;
        const timer = window.setTimeout(() => finishSpin(spinAnimation), spinAnimation.duration + 500);
        return () => window.clearTimeout(timer);
    }, [spinAnimation]);
    const handleSpin = async () => {
        if (spinning || busy || bets.length === 0) return;
        setSpinning(true);
        const audioContext = soundEnabled ? getAudioContext() : null;
        const result = await onSpin(bets.map(({ type, value, stake }) => ({ type, value, stake })));
        if (result) {
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            const duration = prefersReducedMotion ? 1500 : 4300;
            const minRotation = prefersReducedMotion ? 720 : 1800;
            const wheelIndex = europeanRouletteWheel.indexOf(Number(result.winning_number));
            const landingRotation = -wheelIndex * wheelSegment;
            const minimumTarget = wheelRotation + minRotation;
            const targetRotation = minimumTarget + ((landingRotation - minimumTarget) % 360 + 360) % 360;
            setLastSpin(result);
            setSpinAnimation({
                result,
                duration,
                audioContext,
                fromWheel: wheelRotation,
                toWheel: targetRotation,
                fromBall: ballRotation,
                toBall: ballRotation - (prefersReducedMotion ? 1080 : 1800)
            });
            setBets([]);
            setError('');
        }
        else {
            setSpinning(false);
        }
    };

    const wheelSegment = 360 / europeanRouletteWheel.length;
    const wheelBackground = `conic-gradient(from -${wheelSegment / 2}deg, ${europeanRouletteWheel.map((number, index) => {
        const color = rouletteColor(number);
        const fill = color === 'red' ? '#bd394b' : color === 'black' ? '#292a31' : '#14844d';
        return `${fill} ${index * wheelSegment}deg ${(index + 1) * wheelSegment}deg`;
    }).join(', ')})`;
    const wheel = React.createElement("div", { className: "roulette-wheel-wrap", "aria-label": lastSpin ? `Winnende nummer ${lastSpin.winning_number}` : 'Europees roulettewiel' },
        React.createElement("span", { className: "roulette-wheel-pointer" }),
        React.createElement("div", {
            className: `roulette-wheel${spinAnimation ? ' roulette-wheel--rolling' : ''}`,
            style: {
                background: wheelBackground,
                transform: `rotate(${wheelRotation}deg)`,
                '--roulette-from-wheel': `${spinAnimation?.fromWheel ?? wheelRotation}deg`,
                '--roulette-to-wheel': `${spinAnimation?.toWheel ?? wheelRotation}deg`,
                '--roulette-duration': `${spinAnimation?.duration || 0}ms`
            },
            onAnimationEnd: event => {
                if (event.target === event.currentTarget && event.animationName === 'roulette-wheel-roll' && spinAnimation) {
                    finishSpin(spinAnimation);
                }
            }
        },
            europeanRouletteWheel.map((number, index) => {
                const angle = index * wheelSegment;
                return React.createElement("span", {
                    className: "roulette-wheel-label",
                    key: number,
                    style: { transform: `translate(-50%,-50%) rotate(${angle}deg) translateY(var(--roulette-label-radius,-83px)) rotate(${-angle}deg)` }
                }, number);
            })),
        React.createElement("div", {
            className: `roulette-ball-track${spinAnimation ? ' roulette-ball-track--rolling' : ''}`,
            style: {
                transform: `rotate(${ballRotation}deg)`,
                '--roulette-from-ball': `${spinAnimation?.fromBall ?? ballRotation}deg`,
                '--roulette-to-ball': `${spinAnimation?.toBall ?? ballRotation}deg`,
                '--roulette-duration': `${spinAnimation?.duration || 0}ms`
            }
        }, React.createElement("span", { className: `roulette-ball${spinAnimation ? ' roulette-ball--rolling' : ''}` })),
        React.createElement("div", { className: "roulette-wheel-center" }, lastSpin ? lastSpin.winning_number : "VleesTas"));
    const numberButton = number => {
        const color = rouletteColor(number);
        const bet = bets.find(item => item.type === 'number' && item.value === number);
        return React.createElement("button", {
            key: number,
            type: "button",
            className: `roulette-number roulette-number--${color}${bet ? ' roulette-number--selected' : ''}`,
            disabled: !canPlace || busy || spinning,
            title: `Zet ${amount} punten in op ${number} (35:1)`,
            onClick: () => placeBet('number', number, `Getal ${number}`)
        },
            number,
            bet && React.createElement("small", null, bet.stake));
    };
    const visibleSpins = spins.slice(0, 6);
    const shownResult = lastSpin || spins.find(spin => spin.user_id === userId);
    const resultNet = shownResult ? Number(shownResult.payout) - Number(shownResult.stake) : 0;
    return React.createElement(React.Fragment, null,
        React.createElement("section", { className: "roulette-panel" },
            React.createElement("div", { className: "roulette-heading" },
                React.createElement("div", null,
                    React.createElement("span", { className: "eyebrow" }, "EUROPEES ROULETTE"),
                    React.createElement("h2", null, "Zet je punten in")),
                React.createElement("div", { className: "roulette-wallet" },
                    React.createElement("span", null, "Saldo"),
                    React.createElement("strong", null, balance, " pt"))),
            React.createElement("p", { className: "roulette-rules" }, "0–36 · standaard uitbetalingen · je inzet wordt alleen in punten afgerekend. Iedereen start per groep met 100 punten. Nul wint nooit op rood/zwart, even/oneven of 1–18/19–36."),
            React.createElement("label", { className: "roulette-stake-label" },
                "Inzet per vakje",
                React.createElement("span", null, "Punten"),
                React.createElement("input", {
                    type: "number",
                    min: 1,
                    max: Math.max(1, remaining),
                    step: 1,
                    value: amount,
                    disabled: balance < 1 || busy || spinning,
                    onChange: event => setAmount(event.target.value === '' ? '' : Number(event.target.value))
                })),
            React.createElement("h3", null, "Kies een nummer · 35:1"),
            React.createElement("div", { className: "roulette-number-table" },
                numberButton(0),
                React.createElement("div", { className: "roulette-number-grid" }, Array.from({ length: 36 }, (_, index) => numberButton(index + 1)))),
            React.createElement("h3", null, "Buiteninzetten · 1:1"),
            React.createElement("div", { className: "roulette-outside-grid" }, rouletteOutsideBets.map(bet => {
                const existing = bets.find(item => item.type === bet.type);
                return React.createElement("button", {
                    key: bet.type,
                    type: "button",
                    className: `roulette-outside-bet${bet.type === 'red' ? ' roulette-number--red' : bet.type === 'black' ? ' roulette-number--black' : ''}${existing ? ' roulette-number--selected' : ''}`,
                    disabled: !canPlace || busy || spinning,
                    onClick: () => placeBet(bet.type, undefined, bet.label)
                }, bet.label, existing && React.createElement("small", null, existing.stake));
            })),
            React.createElement("h3", null, "Dozijn en kolom · 2:1"),
            React.createElement("div", { className: "roulette-group-grid" }, rouletteGroupBets.map(bet => {
                const existing = bets.find(item => item.type === bet.type);
                return React.createElement("button", {
                    key: bet.type,
                    type: "button",
                    className: `roulette-group-bet${existing ? ' roulette-number--selected' : ''}`,
                    disabled: !canPlace || busy || spinning,
                    onClick: () => placeBet(bet.type, undefined, bet.label)
                }, bet.label, existing && React.createElement("small", null, existing.stake));
            })),
            React.createElement("section", { className: "roulette-ticket" },
                React.createElement("div", { className: "roulette-ticket-heading" },
                    React.createElement("strong", null, "Jouw inzetten"),
                    React.createElement("span", null, totalStake, " / ", balance, " pt")),
                bets.length ? React.createElement("div", { className: "roulette-bet-list" }, bets.map(bet => React.createElement("div", { className: "roulette-bet", key: bet.id },
                    React.createElement("span", null, bet.label),
                    React.createElement("strong", null, bet.stake, " pt"),
                    React.createElement("button", { type: "button", "aria-label": `Verwijder inzet ${bet.label}`, disabled: spinning || busy, onClick: () => setBets(current => current.filter(item => item.id !== bet.id)) }, React.createElement(X, { size: 15 }))))
                ) : React.createElement("p", { className: "roulette-empty-bets" }, "Kies een inzet om te beginnen."),
                error && React.createElement("p", { className: "roulette-error", role: "alert" }, error),
                React.createElement("button", {
                    className: `button button--primary roulette-spin-button${busy || spinning ? ' roulette-spin-button--spinning' : ''}`,
                    type: "button",
                    disabled: busy || spinning || bets.length === 0 || totalStake > balance,
                    onClick: handleSpin
                }, React.createElement(RotateCcw, { size: 18 }), busy || spinning ? " De kogel rolt..." : " Draaien"),
                shownResult && React.createElement("div", { className: "roulette-result", "aria-live": "polite" },
                    React.createElement("span", { className: `roulette-result-number roulette-number--${rouletteColor(Number(shownResult.winning_number))}` }, shownResult.winning_number),
                    React.createElement("div", null,
                        React.createElement("strong", null, lastSpin ? (resultNet > 0 ? `Gewonnen: +${resultNet} punten` : resultNet < 0 ? `Verloren: ${Math.abs(resultNet)} punten` : "Inzet terug") : "Laatste groepsresultaat"),
                        React.createElement("span", null, "Ingezet ", shownResult.stake, " · uitbetaald ", shownResult.payout, " punten")))),
        React.createElement("section", { className: "roulette-history" },
            React.createElement("h3", null, "Recente draaien"),
            visibleSpins.length ? visibleSpins.map(spin => React.createElement("div", { className: "roulette-history-row", key: spin.id },
                React.createElement("span", { className: `roulette-history-number roulette-number--${rouletteColor(Number(spin.winning_number))}` }, spin.winning_number),
                React.createElement("strong", null, members.find(member => member.id === spin.user_id)?.display_name || 'Speler'),
                React.createElement("span", null, Number(spin.payout) - Number(spin.stake) >= 0 ? `+${Number(spin.payout) - Number(spin.stake)}` : `${Number(spin.payout) - Number(spin.stake)}`, " pt"))) : React.createElement("p", null, "Er zijn nog geen inzetten geplaatst."))),
        spinAnimation && React.createElement("div", { className: "roulette-spin-screen", role: "dialog", "aria-modal": "true", "aria-label": "Roulette draait" },
            React.createElement("div", { className: "roulette-spin-screen-content", "aria-live": "polite" },
                React.createElement("span", { className: "eyebrow" }, "EUROPEES ROULETTE"),
                React.createElement("h2", null, "De kogel rolt..."),
                React.createElement("p", null, "Waar vallen jouw punten?"),
                wheel,
                React.createElement("strong", null, `Nummer ${spinAnimation.result.winning_number}`))));
}
