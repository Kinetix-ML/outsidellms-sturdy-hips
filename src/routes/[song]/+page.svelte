<script lang="ts">
	import type { KMLPipeline } from 'kml-pipe-ts';
	import { DataType } from 'kml-pipe-ts/dist/base_structs';
	import type { CVImage, Canvas, KPFrame } from 'kml-pipe-ts/dist/types';
	import { onMount } from 'svelte';

	let pipe: KMLPipeline;
	let videoSource: HTMLVideoElement;
	let trainerSource: HTMLVideoElement;
	let canvas: HTMLCanvasElement;
	let processing = false;
	let data: any[] = [];
	let startTime = 0;
	let loading = false;
	let files: FileList;
	let innerHeight: number = 0;
	let innerWidth: number = 0;
	let hRatio = 0;
	let wRatio = 0;
	let playing = false;
	let countdown = false;
	let h = 0;
	let w = 0;
	let time = 5;
	let scores: number[][] = [];
	let goodFrameCount = 0;
	let curScore: number = 0;
	let multiplier: number = 1;
	let score: number = 0;
	let hintIdx = 0;
	let hints = [
		'Pump Up the Music',
		'Start With the Hips',
		'A little Wiggle',
		'Clap!',
		'A little Wiggle',
		'Clap!'
	];
	let hintTimes = [0, 5000, 9500, 11500, 12500, 13500];
	let videoLoaded = false;
	let kps = [
		'nose',
		'left_eye',
		'right_eye',
		'left_ear',
		'right_ear',
		'left_shoulder',
		'right_shoulder',
		'left_elbow',
		'right_elbow',
		'left_wrist',
		'right_wrist',
		'left_hip',
		'right_hip',
		'left_knee',
		'right_knee',
		'left_ankle',
		'right_ankle'
	];

	// $: files && files.length > 0 && loadVideo(files[0]);
	$: hRatio = innerHeight > 0 ? Math.round((innerHeight * 9) / 16) : 0;
	$: wRatio = innerWidth > 0 ? Math.round((innerWidth * 16) / 9) : 0;
	$: h = wRatio > innerHeight ? innerHeight : wRatio;
	$: w = wRatio > innerHeight ? hRatio : innerWidth;

	onMount(async () => {
		let { KMLPipeline } = await import('kml-pipe-ts');
		pipe = new KMLPipeline('Outside LLMs Runtime', 1, '79705c77-f57b-449d-b856-03138e8859a7');
		await pipe.initialize();
		await loadTrainerData();
		await startWebcam();
	});
	$: trainerSource && loadVideo('/demo.mov');
	$: startCountdown(countdown);
	$: startGame(playing);
	const startGame = async (p: boolean) => {
		if (p) {
			startTime = Date.now();
			await trainerSource.play();
			console.log('played trainer source');
			videoSource.requestVideoFrameCallback(processFrame);
		}
	};
	const startCountdown = async (c: boolean) => {
		if (c) {
			countdown = true;
			time = 5;
			scores = [];
			multiplier = 1;
			goodFrameCount = 0;
			score = 0;
			let interval = setInterval(async function () {
				time--;
				if (time == 0) {
					countdown = false;
					playing = true;

					clearInterval(interval);
				}
			}, 1000);
		}
	};
	const startWebcam = async () => {
		const stream = await navigator.mediaDevices.getUserMedia({ video: true });
		videoSource.srcObject = stream;
		await videoSource.play();
		loading = false;
	};
	const loadVideo = async (url: string) => {
		//let url = URL.createObjectURL(video);
		console.log(url);
		trainerSource.srcObject = null;
		trainerSource.src = url;
		videoLoaded = true;
	};
	const processFrame = async () => {
		if (!processing) {
			processing = true;
			let time = Date.now();
			console.log(time - startTime);
			let frame = findCorrelatedFrame(time - startTime);
			canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);

			if (frame) {
				hintIdx =
					hintTimes.length -
					hintTimes
						.slice()
						.reverse()
						.findIndex((t) => t < time - startTime) -
					1;
				console.log(hintIdx);
				let outputs = await pipe.execute([videoSource, frame.data]);
				console.log('similarity: ' + JSON.stringify(outputs[0].value));
				if (outputs[0].value != DataType.NoDetections) {
					drawKeyPoints(outputs[1].value, videoSource, canvas, outputs[0].value);
					console.log(outputs[1].value.keypoints.map((kp) => kp.name));
					scores.push(outputs[0].value);
					scores = scores;
				}
				let frameScore = (avgScores(scores[scores.length - 1]) - 0.7) / 0.3;
				console.log(frameScore);
				if (frameScore < 0.6) {
					curScore = 0;
					multiplier = 1;
					goodFrameCount = 0;
				}
				curScore += frameScore * 10;
				goodFrameCount++;
				multiplier = Math.floor(goodFrameCount / 80) + 1;
				if (multiplier > 3) multiplier = 3;
				score += curScore * multiplier;
			} else {
				playing = false;
			}
			processing = false;
			videoSource.requestVideoFrameCallback(processFrame);
		}
	};
	const loadTrainerData = async () => {
		let response = await fetch('/data.json');
		data = await response.json();
		let start = data[0].time;
		data = data.map((d, i) => ({ ...d, time: i * 1000 * (1 / (data.length / 18)) }));
	};
	const findCorrelatedFrame = (time: number) => {
		for (let i = 0; i < data.length; i++) {
			if (data[i].time > time) {
				return data[i - 1];
			}
		}
	};
	const matchKps = (frame: KPFrame) => {
		let newKeypoints = kps.map((kp, i) => frame.keypoints.find((nkp) => nkp.name === kp));
		// @ts-ignore
		frame.keypoints = newKeypoints;
	};
	const avgScores = (s: number[]) => s.reduce((prev, cur) => prev + cur) / s.length;
	const drawKeyPoints = (frame: KPFrame, image: CVImage, canvas: Canvas, scores: number[]) => {
		matchKps(frame);
		let w =
			'videoWidth' in image
				? (image as HTMLVideoElement).videoWidth
				: (image as HTMLImageElement).naturalWidth;
		let h =
			'videoHeight' in image
				? (image as HTMLVideoElement).videoHeight
				: (image as HTMLImageElement).naturalHeight;
		let scale = canvas.width / w;
		let offsetY = (h * scale - canvas.height) / 2;
		frame.keypoints = frame.keypoints.map((kp) => ({
			...kp,
			x: kp.x * scale,
			y: kp.y * scale - offsetY
		}));
		var ctx = canvas.getContext('2d');
		let sc = scores.filter((kp, i) => i >= 5);
		frame.keypoints
			.filter((kp, i) => i >= 5)
			.forEach((kp, i) => {
				ctx?.beginPath();
				ctx?.moveTo(kp.x, kp.y);
				if (sc[i] > 0.6) {
					ctx!.fillStyle = sc[i] > 0.8 ? 'white' : sc[i] > 0.6 ? 'yellow' : 'red';
					ctx?.arc(kp.x, kp.y, canvas.width * (sc[i] < 0.8 ? 0.007 : 0.005), 0, 2 * Math.PI, false);
				} else {
					ctx!.font = '30px Arial bold';
					ctx!.textBaseline = 'middle';
					ctx!.fillText('❌', kp.x, kp.y);
					ctx!.textAlign = 'center';
				}

				ctx?.fill();
				ctx?.closePath();
			});
	};
</script>

<svelte:window bind:innerHeight bind:innerWidth />

<div class="flex h-screen w-screen items-center justify-center bg-black">
	{#if w > 0 && h > 0}
		<div class="relative h-screen w-[{w}px] bg-black">
			<div>
				<img
					src="https://images.radio.com/aiu-media/Outsidelands-3b97f4ed-8bff-4fe8-bf54-158587d42a7b.jpg?width=800"
					class={`h-[${h}px] w-[${w}px] object-cover`}
					width={w}
					height={h}
					style="height: {h}px;"
				/>
			</div>
			<div class="">
				<video
					id="webcam"
					autoplay
					class={`absolute left-0 top-0 h-[${h}px] w-[${w}px] scale-x-[-1] rounded-lg
					object-cover shadow-lg`}
					height={h}
					width={w}
					bind:this={videoSource}
					style="height: {h}px;"
				/>
			</div>
			{#if !playing}
				<div
					class="absolute top-0 z-20 flex h-screen w-full items-center justify-center overflow-hidden p-8"
				>
					<div
						class="flex flex-col justify-center gap-3 rounded-lg bg-gray-800 bg-opacity-[95%] p-8 shadow-lg"
					>
						<!-- <p>{innerHeight} {innerWidth} {hRatio} {wRatio} {h} {w}</p> -->
						{#if !countdown}
							<!-- <input type="file" bind:files /> -->
							<p class="text-2xl font-bold">Welcome to Sturdy Hips</p>
							<p>Let's put your dancing skills to the test. Press start to begin the song!</p>
							{#if scores.length > 0}
								<div class="flex flex-row items-baseline gap-2">
									<p>You scored</p>
									<p class="text-xl font-bold">{Math.round(score)}</p>
								</div>
							{/if}
							<button
								disabled={!videoLoaded}
								class="m-auto rounded-lg {videoLoaded ? 'bg-rose-500' : 'bg-gray-600'} px-4 py-2"
								on:click={() => (countdown = true)}
								>{scores.length > 0 ? 'Play Again' : 'Start'}</button
							>
							<!-- <p>{innerHeight} {innerWidth} {hRatio} {wRatio}</p> -->
						{:else}
							<p class="text-2xl">{time}</p>
						{/if}
					</div>
				</div>
			{/if}
			<div>
				<video
					id="webcam2"
					muted={false}
					class={`z-2 absolute left-0 top-0 h-[${h}px] w-[${w}px] overflow-hidden rounded-lg opacity-50 shadow-lg`}
					height={h}
					width={w}
					bind:this={trainerSource}
				/>
			</div>
			<div>
				<canvas
					id="canvas"
					class="absolute left-0 top-0 z-10 h-[{h}px] w-[{Math.round(
						(h * 640) / 480
					)}px] translate-x-[-{Math.round(((h * 640) / 480 - w) / 2)}px]"
					height={h}
					width={Math.round((h * 640) / 480)}
					bind:this={canvas}
					style="transform: translateX(-{Math.round(((h * 640) / 480 - w) / 2)}px) scaleX(-1)"
				/>
			</div>
			<div class="absolute left-0 top-0 w-full">
				{#if playing}
					<div class="flex flex-row justify-center p-4">
						<p class="text-2xl font-bold">{hints[hintIdx]}</p>
					</div>
				{/if}
			</div>
			<div class="absolute bottom-0 left-0 w-full">
				<div class="flex flex-row justify-between p-4">
					<p class="text-2xl font-bold">{Math.round(score)}</p>
					<p class="text-2xl font-bold">{multiplier}x</p>
				</div>
				<div class="z-30 h-4 w-full overflow-hidden bg-gray-600">
					<div
						class="h-full {goodFrameCount / 80 < 0.3
							? 'bg-red-500'
							: goodFrameCount / 80 < 0.6
							? 'bg-yellow-500'
							: 'bg-green-500'}"
						style="width: {(goodFrameCount / 80) * w}px"
					/>
				</div>
			</div>
		</div>
	{/if}
</div>
