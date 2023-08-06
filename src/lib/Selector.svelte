<script>
	let blocks = [
		{ title: 'HEART AWAY', artist: 'Artist 1', video: '/heartaway.mp4' },
		{ title: 'PRETTY BOY', artist: 'Artist 2', video: '/prettyboy.MP4' },
		{ title: 'JERSEY LOVE', artist: 'Artist 2', video: '/jerseylove.mp4' },
		{ title: 'CUFF IT', artist: 'Artist 3', video: '/cuffit1.mp4' }
		// { title: 'PUSHIN P', artist: 'Artist 4', video: 'static/prettyboy.MP4' },
		// { title: 'JERK', artist: 'Artist 5', video: 'static/prettyboy.MP4' }
	];
	let currBlock = 0;
	let videoUrl = blocks[currBlock].video;

	function selectBlock(index) {
		currBlock = index;
		videoUrl = blocks[currBlock].video;
	}

	function backBlock() {
		currBlock = (currBlock - 1) % blocks.length;
		videoUrl = blocks[currBlock].video;
	}

	function nextBlock() {
		currBlock = (currBlock + 1) % blocks.length;
		videoUrl = blocks[currBlock].video;
	}

	function goToDance() {
		// go to /cuffit
		window.location.href = '/cuffit';
	}
</script>

<div class="blocks pt-5 flex justify-center">
	{#each blocks as block, i (i)}
		<button
			on:click={() => selectBlock(i)}
			class:rounded-l-md={i === 0}
			class:rounded-r-md={i === blocks.length - 1}
			class="block mx-1 {currBlock === i ? 'selected' : ''}"
		>
			<div class="title">{block.title}</div>
			<div class="artist">{block.artist}</div>
		</button>
	{/each}
</div>

<div class="player pt-5">
	<img src="/iphone-t.png" alt="iPhone" class="iphone" />
	<video src={videoUrl} controls autoplay class="video" />
</div>

<div class="flex flex-row justify-center items-center text-black spaceplz">
	<button
		on:click={backBlock}
		class="w-[100px] h-[50px] text-2xl bg-yellow-200 rounded-md flex flex-row justify-center items-center"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke-width={1.5}
			stroke="currentColor"
			class="w-6 h-6"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M21 16.811c0 .864-.933 1.405-1.683.977l-7.108-4.062a1.125 1.125 0 010-1.953l7.108-4.062A1.125 1.125 0 0121 8.688v8.123zM11.25 16.811c0 .864-.933 1.405-1.683.977l-7.108-4.062a1.125 1.125 0 010-1.953L9.567 7.71a1.125 1.125 0 011.683.977v8.123z"
			/>
		</svg>
	</button>
	<button
		on:click={goToDance}
		class="w-[100px] h-[50px] m-[5px] text-2xl bg-yellow-200 rounded-md flex flex-row justify-center items-center"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke-width="1.5"
			stroke="currentColor"
			class="w-6 h-6"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
			/>
		</svg>
	</button>
	<button
		on:click={nextBlock}
		class="w-[100px] h-[50px] text-2xl bg-yellow-200 rounded-md flex flex-row justify-center items-center"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke-width="1.5"
			stroke="currentColor"
			class="w-6 h-6"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M3 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062A1.125 1.125 0 013 16.81V8.688zM12.75 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062a1.125 1.125 0 01-1.683-.977V8.688z"
			/>
		</svg>
	</button>
</div>

<style>
	.spaceplz {
		margin-top: 50px;
	}

	.blocks {
		display: flex;
	}

	.block {
		background: lightgray;
		padding: 1em;
		text-align: center;
		flex: 1;
		min-width: 0; /* Allows text to truncate */
	}

	.title {
		font-size: 1.5em;
		margin-bottom: 0.5em;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis; /* Truncate text */
	}

	.artist {
		font-size: 1em;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis; /* Truncate text */
	}

	.block.selected {
		background: #fef08a;
	}

	.player {
		position: relative;
		width: 300px;
		height: 600px;
		margin: 0 auto;
	}

	.iphone {
		position: absolute;
		width: 100%;
		height: 100%;
	}

	.video {
		position: absolute;
		top: 8%;
		left: 5%;
		width: 90%;
		height: 90%;
	}
</style>
