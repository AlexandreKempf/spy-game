<script lang="ts">
	import { goto } from '$app/navigation';
	import { playerInfo } from '../lib/store.js';

	let playerName: string;
	let roomInput: string;

	function makeid(length: number): string {
		let result = '';
		const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		const charactersLength = characters.length;
		let counter = 0;
		while (counter < length) {
			result += characters.charAt(Math.floor(Math.random() * charactersLength));
			counter += 1;
		}
		return result;
	}

	function createRoom() {
		let uniqID = makeid(10);
		$playerInfo.master = true;
		$playerInfo.name = playerName;
		goto('/'.concat(uniqID));
	}

	function joinRoom() {
		$playerInfo.name = playerName;
		if (roomInput !== '') goto('/'.concat(roomInput));
	}
</script>

<h1 class="text-center text-7xl mt-3">The Spy Game</h1>

<h1 class="text-center m-2">Enter your name</h1>
<div class="mx-auto w-50">
	<input bind:value={playerName} />
</div>
<div class="mx-30 my-10">
	<p>Explore the museum by day, and when you're ready comes by night to steal it.</p>
	<p>
		In order to steal it, enter the museum by night, then go in front of the object, stand still,
		press "X" and then sneak back to the entrance of the museum
	</p>
</div>

<div class="flex m-30 items-center">
	<div class="mx-30">
		<button class="w-50" on:click={createRoom}>Create a team</button>
	</div>
	<div class="flex-1" />
	<div class="mx-30">
		<div class="mx-auto w-50">
			<input class="mx-auto w-50" bind:value={roomInput} />
		</div>
		<button class="mx-auto w-50" on:click={joinRoom}>Join a room</button>
	</div>
</div>
