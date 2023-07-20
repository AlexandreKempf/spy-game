<script lang="ts">
	import P5 from 'p5-svelte';
	import type * as p5Type from 'p5';
	import * as math from 'mathjs';

	export let multiStore;

	function getStepsImagesPaths(level: string, filename: string): string[] {
		return Object.keys(import.meta.glob('../../static/levels/**/**/*.webp'))
			.filter((path) => path.includes(level) && path.includes(filename))
			.map((path) => path.substring(12))
			.sort();
	}

	let backgroundPath: string = getStepsImagesPaths($multiStore.common.level, 'background')[0];
	let foregroundPath: string = getStepsImagesPaths($multiStore.common.level, 'foreground')[0];
	let walkableMapPath: string = getStepsImagesPaths($multiStore.common.level, 'walkable')[0];
	let background: p5Type.Image;
	let foreground: p5Type.Image;
	let walkableMap: p5Type.Image;
	let players: { [key: string]: p5Type.Image } = {};
	let playersContours: { [key: string]: p5Type.Image } = {};

	let width = 500;
	let height = 500;
	let playerWidth = 48;
	let playerHeight = 96;
	let FPS = 15;
	let maxSpeed = 8;
	let animationTable: { [key: string | number]: number } = {
		idle: 0,
		walk: 1152,
		0: 0, // right
		2: 864, // down
		4: 576, // left
		6: 288 // up
	};

	let initialPosition: [number, number];

	let inputs: [boolean, boolean, boolean, boolean];
	let motion: [number, number];
	let time: number;
	let playerOrientation: number;
	let controlOrientation: number;

	let position: [number, number];
	let animationScore: number;

	function reset() {
		position = initialPosition;
		inputs = [false, false, false, false];
		motion = [0, 0];
		time = 0;
		playerOrientation = 2; // Orientation of the player icon. Even indexes only. Start down
		controlOrientation = -1; // Orientation of the control, thus the vision vector. Starts undefined.
	}

	function display(p5: p5Type) {
		animationScore =
			animationTable[inputs.includes(true) ? 'walk' : 'idle'] +
			animationTable[playerOrientation] +
			playerWidth * (time % 6);
		p5.background('white');
		p5.image(
			background,
			0,
			0,
			width,
			height,
			math.ceil(position[0] - width / 2),
			math.ceil(position[1] - height / 2),
			width,
			height
		);
		for (const [username, player] of Object.entries(players)) {
			if (username == $multiStore.username) continue;
			let relativePosition = math.subtract($multiStore.users[username].position, position);
			p5.image(
				player,
				math.ceil(width / 2) - playerWidth / 2 + relativePosition[0],
				math.ceil(height / 2) - playerHeight / 2 + relativePosition[1],
				playerWidth,
				playerHeight,
				$multiStore.users[username].animationScore,
				0,
				playerWidth,
				playerHeight
			);
		}
		p5.image(
			players[$multiStore.username],
			math.ceil(width / 2) - playerWidth / 2,
			math.ceil(height / 2) - playerHeight / 2,
			playerWidth,
			playerHeight,
			animationScore,
			0,
			playerWidth,
			playerHeight
		);
		p5.image(
			foreground,
			0,
			0,
			width,
			height,
			math.ceil(position[0] - width / 2),
			math.ceil(position[1] - height / 2),
			width,
			height
		);
		for (const [username, playerContour] of Object.entries(playersContours)) {
			if (username == $multiStore.username) continue;
			let relativePosition = math.subtract($multiStore.users[username].position, position);
			p5.image(
				playerContour,
				math.ceil(width / 2) - playerWidth / 2 + relativePosition[0],
				math.ceil(height / 2) - playerHeight / 2 + relativePosition[1],
				playerWidth,
				playerHeight,
				$multiStore.users[username].animationScore,
				0,
				playerWidth,
				playerHeight
			);
		}
	}

	function vectorNorm(vector: number[]): number {
		return math.sqrt(math.sum(math.map(vector, math.square))) as number;
	}

	function normalize(vector: number[]): number[] {
		let norm = vectorNorm(vector);
		if (norm == 0) return vector;
		return math.divide(vector, norm) as number[];
	}

	function getPixelIndex(position: [number, number], map: p5Type.Image): number {
		return (position[0] + position[1] * map.width) * 4;
	}

	function getVisionIndex(visionVec: [number, number]): number {
		let angle = math.asin(normalize(visionVec)[1]) as number;
		if (visionVec[0] < 0) angle = math.pi - angle;
		return math.round((angle / math.pi) * 4 + 8) % 8;
	}

	function handleWalls(
		walkableMap: p5Type.Image,
		position: [number, number],
		derivedPosition: [number, number]
	) {
		let keypoints: [number, number][] = [
			math.add(position, [-19, 20]),
			math.add(position, [19, 20]),
			math.add(position, [19, 46]),
			math.add(position, [-19, 46])
		];

		let stopHorizontal = (math.add(keypoints, [derivedPosition[0], 0]) as [number, number][])
			.map((pos: [number, number]) => getPixelIndex(pos, walkableMap))
			.some((index: number) => walkableMap.pixels[index] == 0);
		let stopVertical = (math.add(keypoints, [0, derivedPosition[1]]) as [number, number][])
			.map((pos: [number, number]) => getPixelIndex(pos, walkableMap))
			.some((index: number) => walkableMap.pixels[index] == 0);
		let stopBoth = (math.add(keypoints, derivedPosition) as [number, number][])
			.map((pos: [number, number]) => getPixelIndex(pos, walkableMap))
			.some((index: number) => walkableMap.pixels[index] == 0);

		if (stopHorizontal) derivedPosition[0] = 0;
		if (stopVertical) derivedPosition[1] = 0;
		if (stopBoth && !stopVertical) derivedPosition[0] = 0;
		if (stopBoth && !stopHorizontal) derivedPosition[1] = 0;
		return derivedPosition;
	}

	function hexToRgb(hex: string): [number, number, number] {
		var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result
			? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
			: [255, 255, 255];
	}

	function extractContour(
		player: p5Type.Image,
		color: [number, number, number],
		p5: p5Type
	): p5Type.Image {
		let x: number;
		let y: number;
		let index: number;
		let playerContours = p5.createImage(player.width, player.height);
		for (x = 0; x < player.width; x++) {
			for (y = 0; y < player.height; y++) {
				index = getPixelIndex([x, y], player) + 3; // Alpha channel
				if (player.pixels[index] == 0) continue;
				if (
					(x == 0 ? true : player.pixels[index - 4] == 0) ||
					(y == 0 ? true : player.pixels[index - 4 * player.width] == 0) ||
					(x == player.width - 1 ? true : player.pixels[index + 4] == 0) ||
					(y == player.height - 1 ? true : player.pixels[index + 4 * player.width] == 0) ||
					x % 48 == 0 ||
					x % 48 == 47
				) {
					playerContours.set(
						x,
						y,
						p5.color(...hexToRgb($multiStore.users[$multiStore.username].color))
					);
				} else {
					playerContours.set(x, y, p5.color(0, 0, 0, 0));
				}
			}
		}
		playerContours.updatePixels();
		return playerContours;
	}

	const sketch = (p5: p5Type) => {
		p5.preload = () => {
			background = p5.loadImage(backgroundPath);
			foreground = p5.loadImage(foregroundPath);
			walkableMap = p5.loadImage(walkableMapPath);
			for (const [username, store] of Object.entries($multiStore.users)) {
				players[username] = p5.loadImage(`players/${store.skin}.webp`);
			}
			fetch(`levels/${$multiStore.common.level}/level.json`)
				.then((response) => response.json())
				.then((json) => {
					initialPosition = json.initialPosition;
					reset();
				});
		};

		p5.setup = () => {
			for (const [username, store] of Object.entries($multiStore.users)) {
				players[username].loadPixels();
				playersContours[username] = extractContour(players[username], hexToRgb(store.color), p5);
			}
			walkableMap.loadPixels();
			p5.createCanvas(width, height);
			p5.frameRate(FPS);
		};

		p5.keyPressed = () => {};

		p5.draw = () => {
			let oldInputs = inputs;
			motion = [0, 0];
			inputs = [false, false, false, false];
			let defaultPlayerOrientation: number = playerOrientation;
			let getDefault: boolean = false;
			if (p5.keyIsDown(p5.LEFT_ARROW)) {
				motion[0] -= 1;
				inputs[0] = true;
				defaultPlayerOrientation = 4;
				if (!oldInputs[0]) playerOrientation = 4;
			} else if (oldInputs[0]) getDefault = true;
			if (p5.keyIsDown(p5.RIGHT_ARROW)) {
				motion[0] += 1;
				inputs[1] = true;
				defaultPlayerOrientation = 0;
				if (!oldInputs[1]) playerOrientation = 0;
			} else if (oldInputs[1]) getDefault = true;
			if (p5.keyIsDown(p5.UP_ARROW)) {
				motion[1] -= 1;
				inputs[2] = true;
				defaultPlayerOrientation = 6;
				if (!oldInputs[2]) playerOrientation = 6;
			} else if (oldInputs[2]) getDefault = true;
			if (p5.keyIsDown(p5.DOWN_ARROW)) {
				motion[1] += 1;
				inputs[3] = true;
				defaultPlayerOrientation = 2;
				if (!oldInputs[3]) playerOrientation = 2;
			} else if (oldInputs[3]) getDefault = true;
			if (getDefault) playerOrientation = defaultPlayerOrientation;

			controlOrientation = vectorNorm(motion) != 0 ? getVisionIndex(motion) : playerOrientation;

			let derivedPositionNorm = vectorNorm(motion);
			if (derivedPositionNorm != 0) {
				motion = math.multiply(math.divide(motion, derivedPositionNorm), maxSpeed) as [
					number,
					number
				];
				motion = math.round(motion);
				motion = handleWalls(walkableMap, position, motion);
				position = math.add(position, motion);
			}

			// display
			time = time + 1;
			display(p5);
		};
	};
</script>

<article data-theme="light" class="h-screen w-screen mt-0 fixed">
	<h1 class="text-center text-7xl mt-3">The Spy Game</h1>
	{#if $multiStore.users[$multiStore.username].master}
		<button
			class="mt-10 border-none mx-auto w-40"
			style:background-color={$multiStore.users[$multiStore.username].color}
			on:click={() => {
				$multiStore.common.state = 'levelSelection';
			}}>Try another level</button
		>
	{/if}
	<div class="flex items-center justify-center">
		<img src={`levels/${$multiStore.common.level}/goalObject.webp`} alt="object to steal" />
	</div>

	<div class="grid h-10 place-items-center mx-auto">
		<P5 {sketch} />
	</div>
</article>
