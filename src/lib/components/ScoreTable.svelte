<script>
	import { gameStore } from '$lib/stores/gameStore';

	/**
	 * Gets the score for a specific player and round
	 * @param {number} playerId - The ID of the player
	 * @param {number} round - The round number
	 * @returns {number} The score for that round
	 */
	function getScoreForRound(playerId, round) {
		const player = $gameStore.players.find((p) => p.id === playerId);
		return player?.scores.find((s) => s.round === round)?.score || 0;
	}

	/**
	 * Gets the total score for a player up to a specific round
	 * @param {number} playerId - The ID of the player
	 * @param {number} round - The round number
	 * @returns {number} The total score up to that round
	 */
	function getTotalScoreUpToRound(playerId, round) {
		const player = $gameStore.players.find((p) => p.id === playerId);
		return (
			player?.scores
				.filter((s) => s.round <= round)
				.reduce((total, score) => total + score.score, 0) || 0
		);
	}
</script>

<div class="scoreTable">
	<table>
		<thead>
			<tr>
				<th>Round</th>
				{#each $gameStore.players as player}
					<th>{player.name}</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each Array($gameStore.currentRound) as _, i}
				<tr>
					<td>Round {i + 1}</td>
					{#each $gameStore.players as player}
						<td>{getScoreForRound(player.id, i + 1)}</td>
					{/each}
				</tr>
			{/each}
			<tr class="totalRow">
				<td>Total</td>
				{#each $gameStore.players as player}
					<td>{getTotalScoreUpToRound(player.id, $gameStore.currentRound)}</td>
				{/each}
			</tr>
		</tbody>
	</table>
</div>

<style>
	.scoreTable {
		margin: 2rem 0;
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		background-color: white;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	th,
	td {
		padding: 0.75rem;
		text-align: center;
		border: 1px solid #e5e7eb;
	}

	th {
		background-color: #f9fafb;
		font-weight: 600;
		color: #374151;
	}

	td {
		color: #4b5563;
	}

	tr:nth-child(even) {
		background-color: #f9fafb;
	}

	tr:hover {
		background-color: #f3f4f6;
	}

	td:first-child,
	th:first-child {
		text-align: left;
		font-weight: 500;
		background-color: #f9fafb;
	}

	.totalRow {
		background-color: #f3f4f6;
		font-weight: 600;
	}

	.totalRow td {
		color: #1f2937;
	}

	.totalRow td:first-child {
		background-color: #f3f4f6;
	}
</style>
