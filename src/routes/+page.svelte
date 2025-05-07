<script>
	import { gameStore } from '$lib/stores/gameStore';
	import ScoreTable from '$lib/components/ScoreTable.svelte';

	/** @type {string} */
	let newPlayerName = '';
	/** @type {Map<number, string>} */
	let playerScores = new Map();
	/** @type {Set<number>} */
	let completedPhasesThisRound = new Set();
	/** @type {Map<number, boolean>} */
	let editingScores = new Map();
	/** @type {Map<number, string>} */
	let editingRounds = new Map();
	/** @type {Map<number, Map<number, boolean>>} */
	let editingRoundScores = new Map();
	/** @type {Map<number, Map<number, string>>} */
	let editingRoundValues = new Map();
	/** @type {boolean} */
	let showAddPlayer = false;
	/** @type {boolean} */
	let showNewGameConfirm = false;

	/**
	 * Adds a new player to the game
	 * @returns {void}
	 */
	function handleAddPlayer() {
		if (newPlayerName.trim()) {
			gameStore.addPlayer(newPlayerName.trim());
			newPlayerName = '';
			showAddPlayer = false;
		}
	}

	/**
	 * Handles score input for a specific player
	 * @param {number} playerId - The ID of the player
	 * @param {string} value - The new score value
	 * @returns {void}
	 */
	function handleScoreInput(playerId, value) {
		playerScores.set(playerId, value);
	}

	/**
	 * Marks a phase as complete for a specific player
	 * @param {number} playerId - The ID of the player
	 * @returns {void}
	 */
	function handleCompletePhase(playerId) {
		if (!completedPhasesThisRound.has(playerId)) {
			gameStore.completePhase(playerId);
			completedPhasesThisRound.add(playerId);
		}
	}

	/**
	 * Unmarks a phase as complete for a specific player
	 * @param {number} playerId - The ID of the player
	 * @returns {void}
	 */
	function handleUndoPhase(playerId) {
		if (completedPhasesThisRound.has(playerId)) {
			gameStore.undoPhase(playerId);
			completedPhasesThisRound.delete(playerId);
		}
	}

	/**
	 * Advances the game to the next round and adds scores
	 * @returns {void}
	 */
	function handleNextRound() {
		// Add scores for all players
		$gameStore.players.forEach((player) => {
			const score = playerScores.get(player.id);
			const scoreNum = score ? parseInt(score) : 0;
			if (!isNaN(scoreNum)) {
				gameStore.addScore(player.id, scoreNum);
			}
		});

		// Clear all score inputs
		playerScores = new Map();
		completedPhasesThisRound = new Set();
		editingScores = new Map();
		editingRounds = new Map();
		editingRoundScores = new Map();
		editingRoundValues = new Map();

		// Advance to next round
		gameStore.nextRound();
	}

	/**
	 * Checks if the next round button should be enabled
	 * @returns {boolean}
	 */
	function canAdvanceRound() {
		// Check if at least one phase is completed this round
		const hasCompletedPhase = completedPhasesThisRound.size > 0;
		console.log('Has completed phase:', hasCompletedPhase);

		// Count players with scores
		let playersWithScores = 0;
		$gameStore.players.forEach((player) => {
			const score = playerScores.get(player.id);
			const scoreNum = score ? parseInt(score) : 0;
			if (!isNaN(scoreNum)) {
				playersWithScores++;
			}
		});
		console.log(
			'Players with scores:',
			playersWithScores,
			'Total players:',
			$gameStore.players.length
		);

		// Allow if all but one player has a score and at least one phase is completed
		const canAdvance = hasCompletedPhase && playersWithScores >= $gameStore.players.length - 1;
		console.log('Can advance:', canAdvance);
		return canAdvance;
	}

	/**
	 * Toggles score editing for a player
	 * @param {number} playerId - The ID of the player
	 * @returns {void}
	 */
	function toggleScoreEditing(playerId) {
		editingScores.set(playerId, !editingScores.get(playerId));
		editingScores = editingScores; // trigger reactivity
	}

	/**
	 * Saves edited scores for a player
	 * @param {number} playerId - The ID of the player
	 * @returns {void}
	 */
	function saveEditedScores(playerId) {
		const player = $gameStore.players.find((p) => p.id === playerId);
		if (player) {
			// Clear existing scores
			player.scores = [];
			// Add new scores
			player.scores = player.scores.map((score, index) => ({
				round: index + 1,
				score: parseInt(editingRounds.get(playerId)?.split(',')[index] || '0')
			}));
		}
		toggleScoreEditing(playerId);
	}

	/**
	 * Toggles editing for a specific round score
	 * @param {number} playerId - The ID of the player
	 * @param {number} round - The round number
	 * @returns {void}
	 */
	function toggleRoundScoreEditing(playerId, round) {
		if (!editingRoundScores.has(playerId)) {
			editingRoundScores.set(playerId, new Map());
		}
		if (!editingRoundValues.has(playerId)) {
			editingRoundValues.set(playerId, new Map());
		}

		const playerScores = editingRoundScores.get(playerId);
		const playerValues = editingRoundValues.get(playerId);
		if (!playerScores || !playerValues) return;

		const isEditing = !playerScores.get(round);
		playerScores.set(round, isEditing);
		if (isEditing) {
			const player = $gameStore.players.find((p) => p.id === playerId);
			const score = player?.scores.find((s) => s.round === round)?.score || 0;
			playerValues.set(round, score.toString());
		}

		editingRoundScores = editingRoundScores; // trigger reactivity
		editingRoundValues = editingRoundValues; // trigger reactivity
	}

	/**
	 * Saves an edited round score
	 * @param {number} playerId - The ID of the player
	 * @param {number} round - The round number
	 * @returns {void}
	 */
	function saveRoundScore(playerId, round) {
		const player = $gameStore.players.find((p) => p.id === playerId);
		if (player) {
			const playerValues = editingRoundValues.get(playerId);
			if (!playerValues) return;

			const scoreValue = playerValues.get(round);
			if (scoreValue === undefined) return;

			const scoreNum = parseInt(scoreValue);
			if (!isNaN(scoreNum)) {
				const scoreIndex = player.scores.findIndex((s) => s.round === round);
				if (scoreIndex !== -1) {
					player.scores[scoreIndex].score = scoreNum;
				} else {
					player.scores.push({ round, score: scoreNum });
				}
				player.scores = player.scores; // trigger reactivity
			}
		}
		toggleRoundScoreEditing(playerId, round);
	}

	/**
	 * Calculates the total score for a player
	 * @param {number} playerId - The ID of the player
	 * @returns {number}
	 */
	function getTotalScore(playerId) {
		const player = $gameStore.players.find((p) => p.id === playerId);
		return player?.scores.reduce((total, score) => total + score.score, 0) || 0;
	}

	/**
	 * Checks if any player has completed phase 10
	 * @returns {boolean}
	 */
	function hasCompletedGame() {
		return $gameStore.players.some((player) => player.completedPhases.includes(10));
	}

	/**
	 * Handles the New Game button click
	 * @returns {void}
	 */
	function handleNewGame() {
		if (hasCompletedGame()) {
			gameStore.clearScores();
		} else {
			showNewGameConfirm = true;
		}
	}

	/**
	 * Confirms starting a new game
	 * @returns {void}
	 */
	function confirmNewGame() {
		gameStore.clearScores();
		showNewGameConfirm = false;
	}

	/**
	 * Cancels starting a new game
	 * @returns {void}
	 */
	function cancelNewGame() {
		showNewGameConfirm = false;
	}
</script>

<div class="container">
	<h1>Phase 10 Score Keeper</h1>

	<!-- Add Player Form -->
	<div class="section">
		<h2>Players</h2>
		<div class="playerControls">
			<button on:click={() => (showAddPlayer = !showAddPlayer)} class="button buttonPrimary">
				{showAddPlayer ? 'Cancel' : 'Add New Player'}
			</button>
		</div>

		{#if showAddPlayer}
			<div class="formGroup">
				<input type="text" bind:value={newPlayerName} placeholder="Player name" class="input" />
				<button on:click={handleAddPlayer} class="button buttonPrimary"> Add Player </button>
			</div>
		{/if}
	</div>

	<!-- Game Board -->
	<div class="gameBoard">
		{#each $gameStore.players as player (player.id)}
			<div class="playerCard">
				<div class="playerHeader">
					<h3>{player.name}</h3>
					<button on:click={() => gameStore.removePlayer(player.id)} class="button buttonDanger">
						Remove
					</button>
				</div>

				<!-- Phase Progress -->
				<div class="section">
					<h4>Current Phase: {player.currentPhase}</h4>
					<div class="phaseRequirements">
						{$gameStore.phases.find((p) => p.number === player.currentPhase)?.description ??
							'Game Complete'}
					</div>
					<div class="phaseGrid">
						{#each $gameStore.phases as phase}
							<div
								class="phaseCell {player.completedPhases.includes(phase.number)
									? 'completed'
									: player.currentPhase === phase.number
										? 'current'
										: 'upcoming'}"
								title={phase.description}
							>
								{phase.number}
							</div>
						{/each}
					</div>
				</div>

				<!-- Scores -->
				<div class="section">
					<h4>Scores</h4>
					<div class="scoresList">
						{#each player.scores as score}
							<div class="scoreItem">
								<span>Round {score.round}:</span>
								{#if editingRoundScores.get(player.id)?.get(score.round)}
									<div class="editScore">
										<input
											type="number"
											value={editingRoundValues.get(player.id)?.get(score.round)}
											on:input={(e) => {
												const playerValues = editingRoundValues.get(player.id);
												if (playerValues) {
													playerValues.set(score.round, e.currentTarget.value);
												}
											}}
											class="input scoreInput"
										/>
										<button
											on:click={() => saveRoundScore(player.id, score.round)}
											class="button buttonSuccess"
										>
											Save
										</button>
										<button
											on:click={() => toggleRoundScoreEditing(player.id, score.round)}
											class="button buttonSecondary"
										>
											Cancel
										</button>
									</div>
								{:else}
									<div class="scoreDisplay">
										<span>{score.score}</span>
										<button
											on:click={() => toggleRoundScoreEditing(player.id, score.round)}
											class="button buttonSecondary editButton"
										>
											Edit
										</button>
									</div>
								{/if}
							</div>
						{/each}
						<div class="totalScore">
							<span>Total Score:</span>
							<span>{getTotalScore(player.id)}</span>
						</div>
					</div>
				</div>

				<!-- Add Score -->
				<div class="section">
					<div class="formGroup">
						<input
							type="number"
							value={playerScores.get(player.id) ?? ''}
							on:input={(e) => handleScoreInput(player.id, e.currentTarget.value)}
							placeholder="Score"
							class="input"
							data-player-id={player.id}
						/>
					</div>
				</div>

				<!-- Complete Phase -->
				<div class="phaseControls">
					{#if completedPhasesThisRound.has(player.id)}
						<button on:click={() => handleUndoPhase(player.id)} class="button buttonWarning">
							Undo Phase
						</button>
					{:else}
						<button
							on:click={() => handleCompletePhase(player.id)}
							class="button buttonPhase"
							disabled={completedPhasesThisRound.has(player.id)}
						>
							Complete Phase
						</button>
					{/if}
				</div>
			</div>
		{/each}
	</div>

	<!-- Game Controls -->
	<div class="gameControls">
		<button on:click={handleNextRound} class="button buttonWarning" disabled={!canAdvanceRound()}>
			Next Round
		</button>
		<button on:click={handleNewGame} class="button buttonPrimary"> New Game </button>
	</div>

	{#if showNewGameConfirm}
		<div class="modal">
			<div class="modalContent">
				<h3>Start New Game?</h3>
				<p>Neither player has completed phase 10. Are you sure you want to start a new game?</p>
				<div class="modalActions">
					<button on:click={confirmNewGame} class="button buttonPrimary">Yes, Start New Game</button
					>
					<button on:click={cancelNewGame} class="button buttonSecondary">Cancel</button>
				</div>
			</div>
		</div>
	{/if}

	<ScoreTable />
</div>

<style>
	:global(body) {
		font-family:
			system-ui,
			-apple-system,
			sans-serif;
		margin: 0;
		padding: 0;
		background-color: #f5f5f5;
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;

		h1 {
			font-size: 2rem;
			font-weight: bold;
			margin-bottom: 1.5rem;
			color: #333;
		}

		h2 {
			font-size: 1.5rem;
			font-weight: 600;
			margin-bottom: 1rem;
			color: #444;
		}

		h3 {
			font-size: 1.25rem;
			font-weight: 600;
			margin-bottom: 0.75rem;
			color: #444;
		}

		h4 {
			font-size: 1rem;
			font-weight: 500;
			margin-bottom: 0.5rem;
			color: #555;
		}
	}

	.section {
		margin-bottom: 1.5rem;
	}

	.formGroup {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.input {
		flex: 1;
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
	}

	.button {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		cursor: pointer;
		transition: background-color 0.2s;

		&:hover {
			opacity: 0.9;
		}
	}

	.buttonPrimary {
		background-color: #3b82f6;
		color: white;
	}

	.buttonSuccess {
		background-color: #22c55e;
		color: white;
	}

	.buttonWarning {
		background-color: #eab308;
		color: white;
	}

	.buttonSecondary {
		background-color: #6b7280;
		color: white;
	}

	.buttonPhase {
		background-color: #8b5cf6;
		color: white;
		width: 100%;
	}

	.gameBoard {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.playerCard {
		background-color: white;
		border: 1px solid #ddd;
		border-radius: 8px;
		padding: 1.5rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.phaseGrid {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 0.25rem;
	}

	.phaseCell {
		padding: 0.5rem;
		text-align: center;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 0.875rem;

		&.completed {
			background-color: #dcfce7;
		}

		&.current {
			background-color: #fef9c3;
		}

		&.upcoming {
			background-color: #f3f4f6;
		}
	}

	.scoresList {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.scoreItem {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0;
		border-bottom: 1px solid #eee;
	}

	.scoreDisplay {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.editScore {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.scoreInput {
		width: 80px;
	}

	.editButton {
		padding: 0.25rem 0.5rem;
		font-size: 0.875rem;
	}

	.totalScore {
		display: flex;
		justify-content: space-between;
		padding: 0.75rem 0;
		margin-top: 0.5rem;
		font-weight: 600;
		border-top: 2px solid #ddd;
	}

	.gameControls {
		display: flex;
		gap: 1rem;
		margin-top: 2rem;
		justify-content: center;
	}

	.phaseRequirements {
		font-size: 1.1rem;
		font-weight: 500;
		color: #1f2937;
		margin-bottom: 1rem;
		padding: 0.75rem;
		background-color: #f3f4f6;
		border-radius: 4px;
		border-left: 4px solid #8b5cf6;
	}

	.button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.phaseControls {
		display: flex;
		gap: 0.5rem;
		margin-top: 1rem;
	}

	.phaseControls .button {
		flex: 1;
	}

	.playerControls {
		margin-bottom: 1rem;
	}

	.playerHeader {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.buttonDanger {
		background-color: #ef4444;
		color: white;
	}

	.modal {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modalContent {
		background-color: white;
		padding: 2rem;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		max-width: 400px;
		width: 90%;
	}

	.modalContent h3 {
		margin-top: 0;
		margin-bottom: 1rem;
	}

	.modalContent p {
		margin-bottom: 1.5rem;
		color: #4b5563;
	}

	.modalActions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
	}
</style>
