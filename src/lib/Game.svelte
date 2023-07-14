<script lang="ts">
	import P5 from 'p5-svelte';
	import type * as p5Type from 'p5';
	import * as math from 'mathjs';

	export let levelName: string;
	export let playerName: string;
	// export let lightOn;

	let background: p5Type.Image;
	let foreground: p5Type.Image;
	let walkableMap: p5Type.Image;
	let logicMap: p5Type.Image;
	let player: p5Type.Image;

	let width = 500;
	let height = 500;
	let playerWidth = 48;
	let playerHeight = 96;
	let FPS = 15;

	let position: [number, number] = [1105, 1300];
	let speed = 8;
	let animationInformation: [string, string, number] = ['idle', 'down', 0];
	let animationTable: { [key: string]: number } = {
		idle: 0,
		walk: 1152,
		right: 0,
		up: 288,
		left: 576,
		down: 864
	};
	let stepsAchieved = [false];
	let stepsText = ['You stole the object'];
	let gameState = 'Ready to steal';

	function local_display(
		p5: p5Type,
		background: p5Type.Image,
		foreground: p5Type.Image,
		player: p5Type.Image,
		position: [number, number],
		oldPosition: [number, number],
		animationInformation: [string, string, number]
	) {
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
		animationInformation[0] =
			vectorNorm(math.subtract(position, oldPosition)) == 0 ? 'idle' : 'walk';

		let displacementVector = math.subtract(position, oldPosition);
		if (displacementVector[0] > 0) animationInformation[1] = 'right';
		if (displacementVector[0] < 0) animationInformation[1] = 'left';
		if (displacementVector[1] > 0) animationInformation[1] = 'down';
		if (displacementVector[1] < 0) animationInformation[1] = 'up';

		animationInformation[2] = (animationInformation[2] + 1) % 6;

		let animationScore =
			animationTable[animationInformation[0]] +
			animationTable[animationInformation[1]] +
			playerWidth * animationInformation[2];

		p5.image(
			player,
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
	}

	function vectorNorm(vector: number[]) {
		return math.sqrt(math.sum(math.map(vector, math.square)));
	}

	function handleWalls(
		walkableMap: p5Type.Image,
		player: p5Type.Image,
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
			.map((pos: [number, number]) => (pos[0] + pos[1] * walkableMap.width) * 4)
			.some((index: number) => walkableMap.pixels[index] == 0);
		let stopVertical = (math.add(keypoints, [0, derivedPosition[1]]) as [number, number][])
			.map((pos: [number, number]) => (pos[0] + pos[1] * walkableMap.width) * 4)
			.some((index: number) => walkableMap.pixels[index] == 0);
		let stopBoth = (math.add(keypoints, derivedPosition) as [number, number][])
			.map((pos: [number, number]) => (pos[0] + pos[1] * walkableMap.width) * 4)
			.some((index: number) => walkableMap.pixels[index] == 0);

		if (stopHorizontal) derivedPosition[0] = 0;
		if (stopVertical) derivedPosition[1] = 0;
		if (stopBoth && !stopVertical) derivedPosition[0] = 0;
		if (stopBoth && !stopHorizontal) derivedPosition[1] = 0;
		return derivedPosition;
	}

	function isPlayerInColor(
		logicMap: p5Type.Image,
		position: [number, number],
		color: [number, number, number, number]
	) {
		let keypoint = math.add(position, [0, 40]);
		let index = (keypoint[0] + keypoint[1] * logicMap.width) * 4;
		return (
			math.abs(logicMap.pixels[index] - color[0]) <= 2 &&
			math.abs(logicMap.pixels[index + 1] - color[1]) <= 2 &&
			math.abs(logicMap.pixels[index + 2] - color[2]) <= 2 &&
			math.abs(logicMap.pixels[index + 3] - color[3]) <= 2
		);
	}

	const sketch = (p5: p5Type) => {
		p5.preload = () => {
			background = p5.loadImage(`levels/${levelName}/background.webp`);
			foreground = p5.loadImage(`levels/${levelName}/foreground.webp`);
			player = p5.loadImage(`players/${playerName}.webp`);
			walkableMap = p5.loadImage(`levels/${levelName}/walkable.webp`);
			logicMap = p5.loadImage(`levels/${levelName}/logic.webp`);
		};

		p5.setup = () => {
			walkableMap.loadPixels();
			logicMap.loadPixels();
			p5.createCanvas(width, height);
			p5.frameRate(FPS);
		};

		p5.draw = () => {
			let oldPosition = position;

			// displacement
			let derivedPosition: [number, number] = [0, 0];
			if (p5.keyIsDown(p5.LEFT_ARROW)) derivedPosition[0] -= 1;
			if (p5.keyIsDown(p5.RIGHT_ARROW)) derivedPosition[0] += 1;
			if (p5.keyIsDown(p5.UP_ARROW)) derivedPosition[1] -= 1;
			if (p5.keyIsDown(p5.DOWN_ARROW)) derivedPosition[1] += 1;
			let derivedPositionNorm = vectorNorm(derivedPosition);
			if (derivedPositionNorm != 0) {
				derivedPosition = math.multiply(
					math.divide(derivedPosition, derivedPositionNorm),
					speed
				) as [number, number];
				derivedPosition = math.round(derivedPosition);
				derivedPosition = handleWalls(walkableMap, player, position, derivedPosition);
				position = math.add(position, derivedPosition);
			}

			// logic
			function updateStep(step: boolean, stepNumber: number, stepsAchieved: Array<boolean>) {
				let alreadyAchieved = step;
				let previousStepIsAchieved = stepNumber === 0 || stepsAchieved[stepNumber - 1];
				let playerPositionIsGood = isPlayerInColor(logicMap, position, [
					stepNumber * 10,
					stepNumber * 10,
					stepNumber * 10,
					255
				]);
				return alreadyAchieved || (previousStepIsAchieved && playerPositionIsGood);
			}
			if (vectorNorm(derivedPosition) == 0 && p5.keyIsDown(88))
				stepsAchieved = stepsAchieved.map((step, index, array) => updateStep(step, index, array));
			let indexLastAcheivedStep = stepsAchieved.lastIndexOf(true);
			gameState = indexLastAcheivedStep === -1 ? gameState : stepsText[indexLastAcheivedStep];
			if (stepsAchieved.every((v) => v) && isPlayerInColor(logicMap, position, [255, 0, 0, 255])) {
				gameState = 'Victory';
			}

			// display
			local_display(
				p5,
				background,
				foreground,
				player,
				position,
				oldPosition,
				animationInformation
			);
		};
	};
</script>

<p>{gameState}</p>
<div class="m-0 w-full h-full">
	<P5 {sketch} />
</div>
