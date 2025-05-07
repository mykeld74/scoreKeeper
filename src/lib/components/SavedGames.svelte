<script lang="ts">
	import { onMount } from 'svelte';
	import { gameStore } from '$lib/stores/gameStore';

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

	onMount(async () => {
		try {
			const db = await gameStore.initDB();
			const transaction = db.transaction(['games'], 'readonly');
			const store = transaction.objectStore('games');
			const request = store.getAll();

			request.onsuccess = () => {
				savedGames = request.result;
				loading = false;
			};

			request.onerror = () => {
				error = 'Failed to load saved games';
				loading = false;
			};
		} catch (e) {
			error = 'Failed to initialize database';
			loading = false;
		}
	});

	function formatDate(timestamp: number): string {
		return new Date(timestamp).toLocaleString();
	}

	async function handleLoadGame(gameId: number) {
		try {
			await gameStore.loadGame(gameId);
		} catch (e) {
			error = 'Failed to load game';
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
					<button class="button buttonPrimary" on:click={() => handleLoadGame(game.id)}>
						Load Game
					</button>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.savedGames {
		margin-top: 2rem;
		padding: 1rem;
		background-color: white;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

		h2 {
			font-size: 1.5rem;
			font-weight: 600;
			margin-bottom: 1rem;
			color: #444;
		}
	}

	.error {
		color: #dc2626;
		padding: 0.5rem;
		background-color: #fee2e2;
		border-radius: 4px;
	}

	.gamesList {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.gameCard {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background-color: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 6px;
	}

	.gameInfo {
		flex: 1;
	}

	.gameDate {
		font-size: 0.875rem;
		color: #6b7280;
		margin-bottom: 0.25rem;
	}

	.gameRound {
		font-weight: 500;
		margin-bottom: 0.5rem;
	}

	.gamePlayers {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.playerInfo {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
	}

	.playerName {
		font-weight: 500;
	}

	.playerPhase {
		color: #6b7280;
	}

	.button {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 4px;
		font-size: 0.875rem;
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
</style>
