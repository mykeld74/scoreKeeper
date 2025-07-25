<script lang="ts">
	import { gameStore } from '$lib/stores/gameStore';
	import ScoreTable from '$lib/components/ScoreTable.svelte';
	import { ScoreKeeper } from '$lib';
	import { slide, fade } from 'svelte/transition';
	import type { Player, Score, Phase } from '$lib/stores/gameStore';

	let newPlayerName = $state('');
	let playerScores = $state<Map<number, string>>(new Map());
	let completedPhasesThisRound = $state<Set<number>>(new Set());
	let showAddPlayer = $state<boolean>(false);
	let showNewGameConfirm = $state<boolean>(false);
	let isPhaseTen = $state<boolean>(true);
	let showRoundScores = $state<boolean>(false);

	let totalScores = $derived<Map<number, number>>(
		new Map(
			$gameStore.players.map((player: Player) => [
				player.id,
				player.scores.reduce((total: number, score: Score) => total + score.score, 0)
			])
		)
	);

	let canAdvanceRound = $derived(() => {
		if (completedPhasesThisRound.size === 0 && isPhaseTen) {
			return false;
		} else {
			return true;
		}
	});

	let hasCompletedGame = $derived(() =>
		$gameStore.players.some((player: Player) => player.completedPhases.includes(10))
	);
	let editingScores = $state<Map<number, boolean>>(new Map());

	let editingRounds = $state<Map<number, string>>(new Map());

	let editingRoundScores = $state<Map<number, Map<number, boolean>>>(new Map());

	let editingRoundValues = $state<Map<number, Map<number, string>>>(new Map());

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
	function handleScoreInput(playerId: number, value: string): void {
		playerScores.set(playerId, value);
	}

	/**
	 * Marks a phase as complete for a specific player
	 * @param {number} playerId - The ID of the player
	 * @returns {void}
	 */
	function handleCompletePhase(playerId: number): void {
		if (!completedPhasesThisRound.has(playerId)) {
			gameStore.completePhase(playerId);
			completedPhasesThisRound.add(playerId);
			completedPhasesThisRound = new Set(completedPhasesThisRound);
		}
	}

	/**
	 * Unmarks a phase as complete for a specific player
	 * @param {number} playerId - The ID of the player
	 * @returns {void}
	 */
	function handleUndoPhase(playerId: number): void {
		if (completedPhasesThisRound.has(playerId)) {
			gameStore.undoPhase(playerId);
			completedPhasesThisRound.delete(playerId);
			completedPhasesThisRound = new Set(completedPhasesThisRound);
		}
	}

	/**
	 * Advances the game to the next round and adds scores
	 * @returns {void}
	 */
	function handleNextRound(): void {
		$gameStore.players.forEach((player: Player) => {
			const score = playerScores.get(player.id);
			const scoreNum = score ? parseInt(score) : 0;
			if (!isNaN(scoreNum)) {
				gameStore.addScore(player.id, scoreNum);
			}
		});

		// Reset all state variables with new instances to trigger reactivity
		playerScores = new Map();
		completedPhasesThisRound = new Set();
		editingScores = new Map();
		editingRounds = new Map();
		editingRoundScores = new Map();
		editingRoundValues = new Map();

		gameStore.nextRound();
	}

	/**
	 * Toggles score editing for a player
	 * @param {number} playerId - The ID of the player
	 * @returns {void}
	 */
	function toggleScoreEditing(playerId: number): void {
		editingScores.set(playerId, !editingScores.get(playerId));
		editingScores = editingScores;
	}

	/**
	 * Saves edited scores for a player
	 * @param {number} playerId - The ID of the player
	 * @returns {void}
	 */
	function saveEditedScores(playerId: number): void {
		const player = $gameStore.players.find((p: Player) => p.id === playerId);
		if (player) {
			player.scores = [];
			player.scores = player.scores.map((score: Score, index: number) => ({
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
	function toggleRoundScoreEditing(playerId: number, round: number): void {
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
			const player = $gameStore.players.find((p: Player) => p.id === playerId);
			const score = player?.scores.find((s: Score) => s.round === round)?.score || 0;
			playerValues.set(round, score.toString());
		}

		editingRoundScores = new Map(editingRoundScores);
		editingRoundValues = new Map(editingRoundValues);
	}

	/**
	 * Saves an edited round score
	 * @param {number} playerId - The ID of the player
	 * @param {number} round - The round number
	 * @returns {void}
	 */
	function saveRoundScore(playerId: number, round: number): void {
		const playerValues = editingRoundValues.get(playerId);
		if (!playerValues) return;

		const scoreValue = playerValues.get(round);
		if (scoreValue === undefined) return;

		const scoreNum = parseInt(scoreValue);
		if (!isNaN(scoreNum)) {
			gameStore.updateScore(playerId, round, scoreNum);
		}
		toggleRoundScoreEditing(playerId, round);
	}

	/**
	 * Gets the total score for a player
	 * @param {number} playerId - The ID of the player
	 * @returns {number}
	 */
	function getTotalScore(playerId: number): number {
		return totalScores.get(playerId) ?? 0;
	}

	/**
	 * Handles the New Game button click
	 * @returns {void}
	 */
	function handleNewGame(): void {
		if ((hasCompletedGame() && isPhaseTen) || !isPhaseTen) {
			gameStore.clearScores();
		} else {
			showNewGameConfirm = true;
		}
	}

	/**
	 * Confirms starting a new game
	 * @returns {void}
	 */
	function confirmNewGame(): void {
		gameStore.clearScores();
		showNewGameConfirm = false;
	}

	/**
	 * Cancels starting a new game
	 * @returns {void}
	 */
	function cancelNewGame(): void {
		showNewGameConfirm = false;
	}
</script>

<div class="container">
	<div class="header">
		<div class="logoContainer">
			<img src={ScoreKeeper} alt="Score Keeper" />
		</div>
	</div>

	<input type="checkbox" id="phaseTenCheckbox" bind:checked={isPhaseTen} />
	<label for="phaseTenCheckbox" class="phaseTenLabel">We're playing Phase 10</label>

	<!-- Add Player Form -->
	<div class="section">
		<h2>Players</h2>
		<div class="playerControls">
			<button onclick={() => (showAddPlayer = !showAddPlayer)} class="button buttonPrimary">
				{showAddPlayer ? 'Cancel' : 'Add New Player'}
			</button>
		</div>

		{#if showAddPlayer}
			<div class="formGroup">
				<input type="text" bind:value={newPlayerName} placeholder="Player name" class="input" />
				<button onclick={handleAddPlayer} class="button buttonPrimary"> Add Player </button>
			</div>
		{/if}
	</div>

	<!-- Game Board -->
	<div class="gameBoard">
		{#each $gameStore.players as player (player.id)}
			<div class="playerCard">
				<div class="playerHeader">
					<h3>{player.name}</h3>
					<button onclick={() => gameStore.removePlayer(player.id)} class="button buttonDanger">
						Remove
					</button>
				</div>

				{#if isPhaseTen}
					<div class="section" transition:slide>
						<h4>Current Phase: {player.currentPhase}</h4>
						<div class="phaseRequirements">
							{$gameStore.phases.find((p: Phase) => p.number === player.currentPhase)
								?.description ?? 'Game Complete'}
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
				{/if}

				<!-- Scores -->
				<div class="section scoresSection">
					<h4>Score</h4>

					<div class="scoresList">
						{#each player.scores as score}
							{#if showRoundScores}
								<div class="scoreItem" transition:slide>
									<span>Round {score.round}:</span>
									{#if editingRoundScores.get(player.id)?.get(score.round)}
										<div class="editScore">
											<input
												type="number"
												value={editingRoundValues.get(player.id)?.get(score.round)}
												oninput={(e) => {
													const playerValues = editingRoundValues.get(player.id);
													if (playerValues) {
														playerValues.set(score.round, e.currentTarget.value);
													}
												}}
												class="input scoreInput"
											/>
											<button
												onclick={() => saveRoundScore(player.id, score.round)}
												class="button buttonSuccess"
											>
												Save
											</button>
											<button
												onclick={() => toggleRoundScoreEditing(player.id, score.round)}
												class="button buttonSecondary"
											>
												Cancel
											</button>
										</div>
									{:else}
										<div class="scoreDisplay">
											<span>{score.score}</span>
											<button
												onclick={() => toggleRoundScoreEditing(player.id, score.round)}
												class="button buttonSecondary editButton"
											>
												Edit
											</button>
										</div>
									{/if}
								</div>
							{/if}
						{/each}
						<div class="totalScore">
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
							oninput={(e) => {
								const value = e.currentTarget.value;
								if (value === '') {
									playerScores.delete(player.id);
								} else {
									playerScores.set(player.id, value);
								}
								playerScores = new Map(playerScores); // Create new Map to trigger reactivity
							}}
							placeholder="Enter Score"
							class="input"
							data-player-id={player.id}
						/>
					</div>
				</div>

				{#if isPhaseTen}
					<div class="phaseControls" transition:fade>
						{#if completedPhasesThisRound.has(player.id)}
							<button onclick={() => handleUndoPhase(player.id)} class="button buttonWarning">
								Undo Phase
							</button>
						{:else}
							<button
								onclick={() => handleCompletePhase(player.id)}
								class="button buttonPhase"
								disabled={completedPhasesThisRound.has(player.id)}
							>
								Completed Phase
							</button>
						{/if}
					</div>
				{/if}
			</div>
		{/each}
	</div>

	<!-- Game Controls -->
	{#if $gameStore.players.length > 1}
		<div class="gameControls">
			<button onclick={handleNextRound} class="button buttonWarning" disabled={!canAdvanceRound()}>
				Enter Scores
			</button>
			<button onclick={() => (showRoundScores = !showRoundScores)} class="button buttonPrimary">
				{showRoundScores ? 'Hide Round Scores' : 'Show Round Scores'}
			</button>
			<button onclick={handleNewGame} class="button buttonPrimary"> New Game </button>
		</div>

		{#if showNewGameConfirm}
			<div class="modal">
				<div class="modalContent">
					<h3>Start New Game?</h3>
					<p>Neither player has completed phase 10. Are you sure you want to start a new game?</p>
					<div class="modalActions">
						<button onclick={confirmNewGame} class="button buttonPrimary"
							>Yes, Start New Game</button
						>
						<button onclick={cancelNewGame} class="button buttonSecondary">Cancel</button>
					</div>
				</div>
			</div>
		{/if}

		<ScoreTable />
	{/if}
</div>

<style>
	.phaseTenLabel {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 1rem;
		color: #444;
		cursor: pointer;
		&:before {
			content: '';
			display: flex;
			align-items: center;
			justify-content: center;
			width: 1.5rem;
			height: 1.5rem;
			border-radius: 5px;
			border: 2px solid #444;
			margin-right: 0.5rem;
			transition: all 0.2s ease-in-out;
		}
	}
	input[type='checkbox']:checked + .phaseTenLabel:before {
		content: '\2717';
		color: #fff;
		background-color: #444;
		font-size: 1.25rem;
	}
	#phaseTenCheckbox {
		display: none;
	}
</style>
