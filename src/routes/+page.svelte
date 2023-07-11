<script>
	import P5 from 'p5-svelte';

	let background;
	let foreground;
	let walkable;
	let player = {
		x: 300,
		y: 900,
		next_move: { x: 0, y: 0 },
		img: [],
		gif_frame: 0,
		gif_update: 0.2,
		direction: 'down',
		speed: 3,
		state: 'idle'
	};
	let next_move_length = 0;

	const is_walkable = (image, positions_x, positions_y) => {
		let indexes = positions_x.map((value, idx) => (value + positions_y[idx] * image.width) * 4);
		return indexes.every((value) => image.pixels[value] !== 0);
	};

	const sketch = (p5) => {
		p5.preload = () => {
			background = p5.loadImage('background.webp');
			foreground = p5.loadImage('items_foreground.webp');
			walkable = p5.loadImage('walkable.webp');
			player.imgs = {
				idle: {
					down: [
						p5.loadImage('player/idle/down_0.webp'),
						p5.loadImage('player/idle/down_1.webp'),
						p5.loadImage('player/idle/down_2.webp'),
						p5.loadImage('player/idle/down_3.webp'),
						p5.loadImage('player/idle/down_4.webp'),
						p5.loadImage('player/idle/down_5.webp')
					],
					up: [
						p5.loadImage('player/idle/up_0.webp'),
						p5.loadImage('player/idle/up_1.webp'),
						p5.loadImage('player/idle/up_2.webp'),
						p5.loadImage('player/idle/up_3.webp'),
						p5.loadImage('player/idle/up_4.webp'),
						p5.loadImage('player/idle/up_5.webp')
					],
					right: [
						p5.loadImage('player/idle/right_0.webp'),
						p5.loadImage('player/idle/right_1.webp'),
						p5.loadImage('player/idle/right_2.webp'),
						p5.loadImage('player/idle/right_3.webp'),
						p5.loadImage('player/idle/right_4.webp'),
						p5.loadImage('player/idle/right_5.webp')
					],
					left: [
						p5.loadImage('player/idle/left_0.webp'),
						p5.loadImage('player/idle/left_1.webp'),
						p5.loadImage('player/idle/left_2.webp'),
						p5.loadImage('player/idle/left_3.webp'),
						p5.loadImage('player/idle/left_4.webp'),
						p5.loadImage('player/idle/left_5.webp')
					]
				},
				walk: {
					down: [
						p5.loadImage('player/walk/down_0.webp'),
						p5.loadImage('player/walk/down_1.webp'),
						p5.loadImage('player/walk/down_2.webp'),
						p5.loadImage('player/walk/down_3.webp'),
						p5.loadImage('player/walk/down_4.webp'),
						p5.loadImage('player/walk/down_5.webp')
					],
					up: [
						p5.loadImage('player/walk/up_0.webp'),
						p5.loadImage('player/walk/up_1.webp'),
						p5.loadImage('player/walk/up_2.webp'),
						p5.loadImage('player/walk/up_3.webp'),
						p5.loadImage('player/walk/up_4.webp'),
						p5.loadImage('player/walk/up_5.webp')
					],
					right: [
						p5.loadImage('player/walk/right_0.webp'),
						p5.loadImage('player/walk/right_1.webp'),
						p5.loadImage('player/walk/right_2.webp'),
						p5.loadImage('player/walk/right_3.webp'),
						p5.loadImage('player/walk/right_4.webp'),
						p5.loadImage('player/walk/right_5.webp')
					],
					left: [
						p5.loadImage('player/walk/left_0.webp'),
						p5.loadImage('player/walk/left_1.webp'),
						p5.loadImage('player/walk/left_2.webp'),
						p5.loadImage('player/walk/left_3.webp'),
						p5.loadImage('player/walk/left_4.webp'),
						p5.loadImage('player/walk/left_5.webp')
					]
				}
			};
		};
		p5.setup = () => {
			p5.createCanvas(2544, 1584);
			walkable.loadPixels();
		};

		p5.draw = () => {
			p5.background(255);
			p5.image(background, 0, 0);
			let image_player =
				player.imgs[player.state][player.direction][Math.ceil(player.gif_frame) % 6];
			p5.image(image_player, player.x, player.y);
			player.next_move = { x: 0, y: 0 };
			if (p5.keyIsDown(p5.LEFT_ARROW)) {
				player.next_move.x = -1;
				player.direction = 'left';
			}
			if (p5.keyIsDown(p5.RIGHT_ARROW)) {
				player.next_move.x = 1;
				player.direction = 'right';
			}
			if (p5.keyIsDown(p5.UP_ARROW)) {
				player.next_move.y = -1;
				player.direction = 'up';
			}
			if (p5.keyIsDown(p5.DOWN_ARROW)) {
				player.next_move.y = 1;
				player.direction = 'down';
			}
			// continue the animation
			player.gif_frame += player.gif_update;
			// move player
			next_move_length = Math.sqrt(player.next_move.x ** 2 + player.next_move.y ** 2);
			player.state = next_move_length ? 'walk' : 'idle';
			let next_position_x = next_move_length
				? Math.ceil((player.speed * player.next_move.x) / next_move_length)
				: 0;
			let next_position_y = next_move_length
				? Math.ceil((player.speed * player.next_move.y) / next_move_length)
				: 0;

			let next_move_allowed = is_walkable(
				walkable,
				[
					player.x + next_position_x + 5,
					player.x + next_position_x + 5,
					player.x + next_position_x + 43,
					player.x + next_position_x + 43
				],
				[
					player.y + next_position_y + image_player.height,
					player.y + next_position_y + image_player.height - 43,
					player.y + next_position_y + image_player.height,
					player.y + next_position_y + image_player.height - 43
				]
			);
			let next_move_allowed_x = is_walkable(
				walkable,
				[
					player.x + next_position_x + 5,
					player.x + next_position_x + 5,
					player.x + next_position_x + 43,
					player.x + next_position_x + 43
				],
				[
					player.y + image_player.height,
					player.y + image_player.height - 43,
					player.y + image_player.height,
					player.y + image_player.height - 43
				]
			);
			let next_move_allowed_y = is_walkable(
				walkable,
				[player.x + 5, player.x + 5, player.x + 43, player.x + 43],
				[
					player.y + next_position_y + image_player.height,
					player.y + next_position_y + image_player.height - 43,
					player.y + next_position_y + image_player.height,
					player.y + next_position_y + image_player.height - 43
				]
			);
			p5.circle(player.x + next_position_x + 5, player.y + image_player.height, 5, 5);
			p5.circle(player.x + next_position_x + 5, player.y + image_player.height - 43, 5, 5);
			p5.circle(player.x + next_position_x + 43, player.y + image_player.height, 5, 5);
			p5.circle(player.x + next_position_x + 43, player.y + image_player.height - 43, 5, 5);
			if (next_move_allowed) {
				player.x += next_position_x;
				player.y += next_position_y;
			} else if (next_move_allowed_x) {
				player.x += next_position_x;
			} else if (next_move_allowed_y) {
				player.y += next_position_y;
			}
			p5.image(foreground, 0, 0);
		};
	};
</script>

<div class="m-0 w-full h-full">
	<P5 {sketch} />
</div>
