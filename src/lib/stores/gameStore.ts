import { writable } from 'svelte/store';
import { browser } from '$app/environment';

interface Phase {
	number: number;
	description: string;
}

interface Score {
	round: number;
	score: number;
}

interface Player {
	id: number;
	name: string;
	scores: Score[];
	completedPhases: number[];
	currentPhase: number;
}

interface GameState {
	players: Player[];
	currentRound: number;
	phases: Phase[];
}

const PHASE_10_PHASES: Phase[] = [
	{ number: 1, description: '2 sets of 3' },
	{ number: 2, description: '1 set of 3 + 1 run of 4' },
	{ number: 3, description: '1 set of 4 + 1 run of 4' },
	{ number: 4, description: '1 run of 7' },
	{ number: 5, description: '1 run of 8' },
	{ number: 6, description: '1 run of 9' },
	{ number: 7, description: '2 sets of 4' },
	{ number: 8, description: '7 cards of one color' },
	{ number: 9, description: '1 set of 5 + 1 set of 2' },
	{ number: 10, description: '1 set of 5 + 1 set of 3' }
];

const initialState: GameState = {
	players: [],
	currentRound: 1,
	phases: PHASE_10_PHASES
};

const createGameStore = () => {
	// Load initial state from localStorage if available and in browser
	const storedState = browser ? localStorage.getItem('gameState') : null;
	const initial = storedState ? JSON.parse(storedState) : initialState;

	const { subscribe, set, update } = writable<GameState>(initial);

	// Subscribe to changes and save to localStorage only in browser
	if (browser) {
		subscribe((state) => {
			localStorage.setItem('gameState', JSON.stringify(state));
		});
	}

	const addPlayer = (name: string): void => {
		const newPlayer: Player = {
			id: Date.now(),
			name,
			scores: [],
			completedPhases: [],
			currentPhase: 1
		};

		update((state) => ({
			...state,
			players: [...state.players, newPlayer]
		}));
	};

	const removePlayer = (playerId: number): void => {
		update((state) => ({
			...state,
			players: state.players.filter((p) => p.id !== playerId)
		}));
	};

	const addScore = (playerId: number, score: number): void => {
		update((state) => ({
			...state,
			players: state.players.map((player) => {
				if (player.id === playerId) {
					return {
						...player,
						scores: [...player.scores, { round: state.currentRound, score }]
					};
				}
				return player;
			})
		}));
	};

	const completePhase = (playerId: number): void => {
		update((state) => ({
			...state,
			players: state.players.map((player) => {
				if (player.id === playerId) {
					return {
						...player,
						completedPhases: [...player.completedPhases, player.currentPhase],
						currentPhase: player.currentPhase + 1
					};
				}
				return player;
			})
		}));
	};

	const nextRound = (): void => {
		update((state) => ({
			...state,
			currentRound: state.currentRound + 1
		}));
	};

	const undoPhase = (playerId: number): void => {
		update((state) => {
			const player = state.players.find((p) => p.id === playerId);
			if (player) {
				player.completedPhases.pop();
				player.currentPhase =
					player.completedPhases.length > 0
						? player.completedPhases[player.completedPhases.length - 1] + 1
						: 1;
			}
			return state;
		});
	};

	const clearScores = (): void => {
		update((state) => ({
			...state,
			players: state.players.map((player) => ({
				...player,
				scores: [],
				completedPhases: [],
				currentPhase: 1
			})),
			currentRound: 1
		}));
	};

	// Clear scores on page load
	clearScores();

	return {
		subscribe,
		addPlayer,
		removePlayer,
		addScore,
		completePhase,
		nextRound,
		undoPhase,
		clearScores
	};
};

export const gameStore = createGameStore();
