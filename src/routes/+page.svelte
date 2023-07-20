<script lang="ts">
	import { goto } from '$app/navigation';
	import { playerInfo } from '$lib/store.js';

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
		console.log(roomInput);
		if (roomInput !== '' && roomInput != null) goto('/'.concat(roomInput));
	}
</script>

<h1 class="text-center text-7xl mt-3">The Spy Game</h1>

<h1 class="text-center m-2">Enter your name</h1>
<div class="mx-auto w-50">
	<input bind:value={playerName} />
</div>
<div class="mx-30 my-10">
	<p>Welcome to the spy game {playerName ? playerName : 'Stanger'}!</p>
	<p>
		In this game you'll need to steal art pieces in a museum at night. But at night, you cannot see!
	</p>
	<p>Explore the museum by day, and when you're ready, steal it during the night.</p>
	<p>
		Follow the tutorial to get confortable with the game. Only remember that if you're stuck, you
		can always press "Enter".
	</p>
</div>

<div class="flex m-30 items-center">
	<div class="mx-30">
		<button class="w-50" on:click={createRoom}>Create a team <br />or play solo</button>
	</div>
	<div class="flex-1" />
	<div class="mx-30">
		<div class="mx-auto w-50">
			<input class="mx-auto w-50" bind:value={roomInput} />
		</div>
		<button class="mx-auto w-50" on:click={joinRoom}>Join a team</button>
	</div>
</div>
