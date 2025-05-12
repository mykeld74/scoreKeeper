<script>
	import { gameStore } from '$lib/stores/gameStore.js';

	/** @typedef {import('$lib/stores/gameStore.js').Player} Player */
	/** @typedef {import('$lib/stores/gameStore.js').Score} Score */

	/**
	 * Gets the score for a specific player and round
	 * @param {number} playerId - The ID of the player
	 * @param {number} round - The round number
	 * @returns {number} The score for that round
	 */
	function getScoreForRound(playerId, round) {
		const player = $gameStore.players.find((/** @type {Player} */ p) => p.id === playerId);
		return player?.scores.find((/** @type {Score} */ s) => s.round === round)?.score || 0;
	}

	/**
	 * Gets the total score for a player up to a specific round
	 * @param {number} playerId - The ID of the player
	 * @param {number} round - The round number
	 * @returns {number} The total score up to that round
	 */
	function getTotalScoreUpToRound(playerId, round) {
		const player = $gameStore.players.find((/** @type {Player} */ p) => p.id === playerId);
		return (
			player?.scores
				.filter((/** @type {Score} */ s) => s.round <= round)
				.reduce(
					(/** @type {number} */ total, /** @type {Score} */ score) => total + score.score,
					0
				) || 0
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
	/* Component-specific styles can be added here if needed */
</style>
