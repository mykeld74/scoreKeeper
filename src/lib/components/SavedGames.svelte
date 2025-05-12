<script lang="ts">
	import { onMount } from 'svelte';
	import { gameStore } from '$lib/stores/gameStore';
	import { browser } from '$app/environment';

	interface SavedGame {
		id: number;
		timestamp: number;
		players: Array<{
			name: string;
			currentPhase: number;
		}>;
		currentRound: number;
	}

	let savedGames: SavedGame[] = [];
	let loading = true;
	let error: string | null = null;

	onMount(() => {
		try {
			const savedState = browser ? localStorage.getItem('gameState') : null;
			if (savedState) {
				const state = JSON.parse(savedState);
				savedGames = [
					{
						id: Date.now(),
						timestamp: Date.now(),
						players: state.players.map((p: any) => ({
							name: p.name,
							currentPhase: p.currentPhase
						})),
						currentRound: state.currentRound
					}
				];
			}
			loading = false;
		} catch (e) {
			error = 'Failed to load saved games';
			loading = false;
		}
	});

	function formatDate(timestamp: number): string {
		return new Date(timestamp).toLocaleString();
	}

	function handleLoadGame() {
		const savedState = browser ? localStorage.getItem('gameState') : null;
		if (savedState) {
			gameStore.clearScores();
		}
	}
</script>

<div class="savedGames">
	<h2>Saved Games</h2>

	{#if loading}
		<p>Loading saved games...</p>
	{:else if error}
		<p class="error">{error}</p>
	{:else if savedGames.length === 0}
		<p>No saved games found</p>
	{:else}
		<div class="gamesList">
			{#each savedGames as game (game.id)}
				<div class="gameCard">
					<div class="gameInfo">
						<div class="gameDate">{formatDate(game.timestamp)}</div>
						<div class="gameRound">Round {game.currentRound}</div>
						<div class="gamePlayers">
							{#each game.players as player}
								<div class="playerInfo">
									<span class="playerName">{player.name}</span>
									<span class="playerPhase">Phase {player.currentPhase}</span>
								</div>
							{/each}
						</div>
					</div>
					<button class="button buttonPrimary" on:click={() => handleLoadGame()}>
						Load Game
					</button>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	/* Component-specific styles can be added here if needed */
</style>
