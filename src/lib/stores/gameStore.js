import { writable } from 'svelte/store';
import { browser } from '$app/environment';

/**
 * @typedef {Object} Phase
 * @property {number} number - The phase number
 * @property {string} description - The phase description
 */

/**
 * @typedef {Object} Score
 * @property {number} round - The round number
 * @property {number} score - The score value
 */

/**
 * @typedef {Object} Player
 * @property {number} id - The player's ID
 * @property {string} name - The player's name
 * @property {Score[]} scores - Array of player's scores
 * @property {number[]} completedPhases - Array of completed phase numbers
 * @property {number} currentPhase - Current phase number
 */

/**
 * @typedef {Object} GameState
 * @property {Player[]} players - Array of players
 * @property {number} currentRound - Current round number
 * @property {Phase[]} phases - Array of game phases
 */

/** @type {Phase[]} */
const PHASE_10_PHASES = [
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

/** @type {GameState} */
const initialState = {
	players: [],
	currentRound: 1,
	phases: PHASE_10_PHASES
};

const createGameStore = () => {
	// Load initial state from localStorage if available and in browser
	const storedState = browser ? localStorage.getItem('gameState') : null;
	const initial = storedState ? JSON.parse(storedState) : initialState;

	const { subscribe, update } = writable(initial);

	// Subscribe to changes and save to localStorage only in browser
	if (browser) {
		subscribe((state) => {
			localStorage.setItem('gameState', JSON.stringify(state));
		});
	}

	/**
	 * Adds a new player to the game
	 * @param {string} name - The player's name
	 */
	const addPlayer = (/** @type {string} */ name) => {
		/** @type {Player} */
		const newPlayer = {
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

	/**
	 * Removes a player from the game
	 * @param {number} playerId - The ID of the player to remove
	 */
	const removePlayer = (/** @type {number} */ playerId) => {
		update((state) => ({
			...state,
			players: state.players.filter((/** @type {Player} */ p) => p.id !== playerId)
		}));
	};

	/**
	 * Adds a score for a player
	 * @param {number} playerId - The ID of the player
	 * @param {number} score - The score to add
	 */
	const addScore = (/** @type {number} */ playerId, /** @type {number} */ score) => {
		update((state) => ({
			...state,
			players: state.players.map((/** @type {Player} */ player) => {
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

	/**
	 * Marks a player's current phase as complete
	 * @param {number} playerId - The ID of the player
	 */
	const completePhase = (/** @type {number} */ playerId) => {
		update((state) => ({
			...state,
			players: state.players.map((/** @type {Player} */ player) => {
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

	/**
	 * Advances the game to the next round
	 */
	const nextRound = () => {
		update((state) => ({
			...state,
			currentRound: state.currentRound + 1
		}));
	};

	/**
	 * Undoes a player's last completed phase
	 * @param {number} playerId - The ID of the player
	 */
	const undoPhase = (/** @type {number} */ playerId) => {
		update((state) => {
			const player = state.players.find((/** @type {Player} */ p) => p.id === playerId);
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

	/**
	 * Clears all scores and resets phases
	 */
	const clearScores = () => {
		update((state) => ({
			...state,
			players: state.players.map((/** @type {Player} */ player) => ({
				...player,
				scores: [],
				completedPhases: [],
				currentPhase: 1
			})),
			currentRound: 1
		}));
	};

	/**
	 * Updates a score for a player in a specific round
	 * @param {number} playerId - The ID of the player
	 * @param {number} round - The round number
	 * @param {number} score - The new score value
	 */
	const updateScore = (
		/** @type {number} */ playerId,
		/** @type {number} */ round,
		/** @type {number} */ score
	) => {
		update((state) => {
			const player = state.players.find((/** @type {Player} */ p) => p.id === playerId);
			if (player) {
				const scoreIndex = player.scores.findIndex((/** @type {Score} */ s) => s.round === round);
				if (scoreIndex !== -1) {
					player.scores[scoreIndex].score = score;
				} else {
					player.scores.push({ round, score });
				}
				player.scores = [...player.scores]; // Create new array to trigger reactivity
			}
			return state;
		});
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
		clearScores,
		updateScore
	};
};

export const gameStore = createGameStore();
