<script lang="ts">
	import { wrongs } from "./wrongSentences"
	import { pages } from "./pages"
	import intro from "./intro"
	import ending from "./ending"
	import talkPositions from "./talkPositions"
	import preloadImages from "./preloadImages"
	import { onMount } from "svelte"

	type Answer = {
		value: string
		image?: string
		valid?: boolean
		action?: string
		status?: Status
	}

	type Page = {
		ask: string
		display?: string
		answers: Array<Answer>
		outro: string
		requestedAnswers?: number
	}
	type Action = StringAction | CallbackAction
	type StringAction = [string] | [string, any]
	type CallbackAction = () => void
	type Status = "checking" | "right" | "wrong" | ""

	const stories = { ending }
	const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
	const wrongFaces = ["still", "standard", "perplexe", "thinking", "you-sure"]
	const butAlso = [
		"Mais ce n'est pas tout...",
		"Mais il y a aussi...",
		"Mais ne laissons pas de côté...",
	]
	const headerAnimations = ["wobble", "tada", "heartBeat"]

	let stage = "menu"
	let fader = ""
	// let isFullScreen = !process.browser || !!document.fullscreenElement
	let step = -1
	let face = "standard"
	let say = ""
	let hasAnswered = false
	let totalCurrentAnswers = 0
	let page: Page | null = null
	let actionCallbackId = 0
	let headerAnimation = "bounceInDown"
	let speakDirection = "right"
	let trianglePosition = 0
	let showFace = true
	let animation = ""
	let scaleX = 1
	let scaleY = 1
	let rotate = 0
	let translateX = 0
	let translateY = 0
	let answers = {
		valid: new Set<Answer>(),
		wrong: new Set<Answer>(),
		checking: new Set<Answer>(),
	}

	onMount(() => {
		preloadImages()
	})

	function random<X extends number | Array<any>>(
		x: X,
	): X extends Array<infer T> ? T : number {
		if (typeof x == "number") return Math.floor(Math.random() * x) as any
		return x[Math.floor(Math.random() * x.length)]
	}

	const actions = new (class extends Array<Action> {
		// parse commands then add them
		execute(commands: string) {
			const parsedCommands: Array<StringAction> = commands
				.trim()
				.split("\n")
				.map(e => e.trim())
				.filter(i => i)
				.map(e => {
					let index = e.indexOf(" ")
					if (index == -1) return [e]
					return [e.slice(0, index).trim(), e.slice(index).trim()]
				})

			this.do(...parsedCommands)
		}

		// prepare to execute the next action
		ready(timeout = 0) {
			if (actionCallbackId) return
			actionCallbackId = setTimeout(this.run.bind(this), timeout)
		}

		// execute the next action
		run() {
			actionCallbackId = 0
			const action = this.shift()
			if (!action) return

			if (typeof action == "function") {
				action()
				this.ready()
			} else {
				const [command, argument] = action
				switch (command) {
					case "face":
						face = argument || "standard"
						if (stage == "story")
							trianglePosition = talkPositions[face as keyof typeof talkPositions] || 0
						this.run()
						break
					case "say":
						say = argument || ""
						if (!say) this.run()
						break
					case "fade":
						fader = argument || "hidden"
						this.ready()
						break
					case "hide":
						if (argument == "face") showFace = false
						this.run()
						break
					case "show":
						if (argument == "face") showFace = true
						this.run()
						break
					case "reset":
						face = "standard"
						say = ""
						this.run()
						break
					case "next":
						next()
						this.ready()
						break
					case "scaleX":
						scaleX = argument || 1
						this.run()
						break
					case "scaleY":
						scaleY = argument || 1
						this.run()
						break
					case "rotate":
						rotate = argument || ""
						this.run()
						break
					case "translateX":
						translateX = argument || ""
						this.run()
						break
					case "translateY":
						translateY = argument || ""
						this.run()
						break
					case "animate":
						animation = argument || ""
						this.run()
						break
					case "wait":
						this.ready(+argument || 0)
						break
					case "story":
						stage = "story"
						actions.length = 0
						actions.execute(stories[argument as keyof typeof stories])
						break
					case "menu":
						stage = "menu"
						actions.length = 0
						removeEventListener("click", nextActionOnClick)
						showFace = true
						animation = ""
						scaleX = 1
						scaleY = 1
						rotate = 0
						translateX = 0
						translateY = 0
						break
					case "startGame":
						startGame()
						break

					default:
						console.warn(`Unknow command : ${command}`)
						this.run()
				}
			}
		}

		// add action(s)
		do(...commands: Array<Action>) {
			let shouldRun = this.length == 0
			this.push(...commands)
			if (shouldRun) this.ready()
		}
	})()

	// function toggleFullScreen() {
	// 	if (document.fullscreenElement) {
	// 		document.exitFullscreen()
	// 		isFullScreen = false
	// 	}
	// 	else {
	// 		document.body.parentElement.requestFullscreen()
	// 		isFullScreen = true
	// 	}
	// }

	function next() {
		totalCurrentAnswers = 0
		step++
		if (step > pages.length) return
		page = pages[step]

		if (step) headerAnimation = headerAnimations[step % headerAnimations.length]

		// for (let node of document.querySelectorAll("#main > button")) {
		// 	node.setAttribute("status", "")
		// }
		if ("intro" in page) actions.execute(page.intro as string)
		else resetBitmoji()

		answers = {
			valid: new Set(),
			wrong: new Set(),
			checking: new Set(),
		}
	}

	function clickAnswer(answer: Answer) {
		const requestedAnswers = page?.requestedAnswers || 1
		if (totalCurrentAnswers >= requestedAnswers) return

		if (answer.valid === undefined) {
			actions.execute(
				answer.action ||
					`
				face ${random(wrongFaces)}
				say ${random(wrongs)}
			`,
			)
			return
		}

		totalCurrentAnswers++
		answers.checking.add(answer)
		answers = answers

		setTimeout(() => {
			answers.checking.delete(answer)
			if (answer.valid) answers.valid.add(answer)
			else answers.wrong.add(answer)
			answers = answers

			actions.length = 0 // we remove the remaining actions

			if (answer.action) actions.execute(answer.action)

			if (totalCurrentAnswers >= requestedAnswers) {
				if (page?.outro) actions.execute(page.outro)
				actions.do(next)
			} else {
				actions.execute(`
					face
					say ${random(butAlso)}
				`)
			}
		}, 750)
	}

	function resetBitmoji() {
		if (!actionCallbackId && !actions.length) actions.do(["face"], ["say"])
	}

	function startIntro() {
		stage = "intro"
		actions.execute(intro)
		setTimeout(() => {
			addEventListener("click", nextActionOnClick)
		}, 0)
	}

	function nextActionOnClick() {
		resetBitmoji()
		actions.ready()
	}

	function startGame() {
		stage = "game"
		step = -1
		next()
	}
</script>

<div id="fader" data-status={fader}></div>

<div id="do-u-know-me">
	<div class="content">
		{#if stage == "menu"}
			<h1>
				<img id="angel" src="/bitmoji/full-angel.png" height="104px" alt="" />
				<div id="title">
					<div class="animated bounceInDown">Do you know</div>
					<div id="matthieu" class="animated bounceInUp">Matthieu?</div>
				</div>
				<img id="demon" src="/bitmoji/full-demon.png" height="104px" alt="" />
			</h1>

			<div id="menu">
				<button id="start" class="game-music" on:click={startIntro}> Commencer </button>

				<!-- <button
				id="fullscreen"
				class="game-music"
				on:click={toggleFullScreen}
				pushed={isFullScreen}
				hidden={!(process.browser && document.body.parentElement.requestFullscreen)}
			>
				Plein ecran
			</button> -->
			</div>

			<img id="resting" src="/bitmoji/full-read-with-cat.png" width="180px" alt="" />
		{:else if stage == "intro"}
			<footer id="footer" data-furtive={!say} class="animated bounceInUp">
				<div id="bitmoji">
					<img src={`/bitmoji/face-${face}.png`} alt="" width="140px" />
				</div>

				<div id="bitmoji-talk">{@html say}</div>
			</footer>
		{:else if stage == "game" && page}
			<div id="progress-bar">
				<div class="filler" style={`width: ${(100 * (step + 1)) / pages.length}%`} />
				<span class="text">
					Question {step + 1} / {pages.length}
				</span>
			</div>

			<header id="header" class={"animated " + headerAnimation}>
				{page.ask}
			</header>

			<main
				id="main"
				class="animated bounceInRight"
				data-display={page.display || "text"}
			>
				{#each page.answers as answer, index}
					<button
						on:click={() => clickAnswer(answer)}
						data-status={answers.valid.has(answer)
							? "right"
							: answers.wrong.has(answer)
								? "wrong"
								: answers.checking.has(answer)
									? "checking"
									: ""}
					>
						{#if page.display == "image"}
							<div class="image-container">
								<img src={"/" + answer.image} alt="" />
							</div>
						{:else}
							<span class="index-letter">{letters[index]}</span>
						{/if}

						<div class="answer-text">
							{answer.value}
						</div>
					</button>
				{/each}
			</main>

			<footer id="footer" data-furtive={!say} class="animated bounceInUp">
				<div id="bitmoji">
					<img src={`/bitmoji/face-${face}.png`} alt="" width="140px" />
				</div>

				<div id="bitmoji-talk">{@html say}</div>
			</footer>
		{:else if stage == "story"}
			<div id="story">
				<div
					id="story-bitmoji"
					data-show={showFace}
					data-animation={animation}
					style={`transform: scaleX(${scaleX}) scaleX(${scaleY}) rotate(${rotate}) translateX(${translateX}) translateY(${translateY})`}
				>
					<img id="story-bitmoji-img" src={`/bitmoji/full-${face}.png`} alt="" />
					<div id="story-bitmoji-talk">{@html say}</div>
					<div
						id="story-triangle-talk"
						style={`margin-left: ${trianglePosition}px;`}
					></div>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	* {
		user-select: none !important;
		-webkit-user-select: none;
		-ms-user-select: none;
	}

	#do-u-know-me {
		background: url("/img/bg.png") repeat !important;
		font-family: CrimsonText;
		font-size: 22px;
		display: flex;
		flex-direction: column;
		align-items: center;
		overflow: hidden;
		height: 100vh;
	}

	#do-u-know-me > .content {
		margin: 0;
		width: 100%;
		max-width: 600px;
		position: relative;
		height: 100vh;
		background: rgba(0, 0, 0, 0.15);
		box-shadow: 0 0 12px 8px rgba(0, 0, 0, 0.15);
		display: flex;
		flex-direction: column;
		justify-content: center;
		overflow: hidden;
	}

	img {
		filter: drop-shadow(0 0 1px #222);
		flex-shrink: 0;
	}

	button {
		outline: none;
	}

	/* button[pushed=true] {
		box-shadow: inset 1px 1px 2px 1px rgba(0,0,0, 0.55);
	} */

	.game-music {
		font-family: GameMusic;
		letter-spacing: 2px;
		font-size: 18px;
		padding: 12px 18px;
		border-radius: 4px;
		border: none;
		text-align: center;
		margin: 1vh 0;
		box-shadow: inset -1px -1px 2px 1px rgba(0, 0, 0, 0.55);
		cursor: pointer;
		background: #145cf9;
		color: white;
	}

	h1 {
		display: flex;
		width: 100%;
		justify-content: space-around;
		align-items: center;
		position: absolute;
		top: 0;
		letter-spacing: 2px;
		font-size: 26.4px;
		text-shadow: 0 1px 1px #eee;
		color: #111;
		margin: 0.67em 0;
	}

	#title > * {
		font-family: GameMusic;
	}

	#matthieu {
		font-size: 44px;
		margin-top: 2%;
		text-shadow: 0 1px 1px #eee;
	}

	#title > div {
		text-align: center;
		display: flex;
		justify-content: center;
	}

	img#resting {
		position: absolute;
		bottom: 5%;
		left: 5%;
	}

	#menu {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	button#start {
		font-size: 26px;
		text-shadow: 1px 1px 1px black;
		width: 100%;
		height: 82px;
		background: rgba(0, 0, 0, 0.15);
		border-radius: 0;
		border-top: 2px solid rgba(0, 0, 0, 0.3);
		border-bottom: 2px solid rgba(0, 0, 0, 0.3);
		box-shadow: 0 0 2px 2px rgba(0, 0, 0, 0.15);
	}
	button#start:hover {
		background: rgba(0, 0, 0, 0.12);
		font-size: 28px;
	}

	#header {
		min-height: 68px;
		position: relative;
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		font-family: Galiver;
		letter-spacing: 2px;
		font-size: 25px;
		font-weight: bold;
		color: #fefefe;
		text-shadow: 0 2px 2px rgba(0, 0, 0, 0.9);
		background: rgba(0, 0, 0, 0.3);
		box-shadow: 0 0 3px 5px rgba(0, 0, 0, 0.3);
		margin: 12px 18px;
		padding: 0 10px;
		text-align: center;
		line-height: 30px;
	}

	#main {
		display: flex;
		flex: 1;
		overflow: auto;
		margin-bottom: 12px;
		padding-bottom: 60px;
	}
	@media screen and (max-height: 600px) {
		#main {
			padding-bottom: 0;
		}
	}
	#main > button {
		cursor: pointer;
		border: none;
		border-radius: 4px;
	}

	.image-container {
		flex: 1;
		min-height: 0;
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	#main > button:hover {
		box-shadow: 0 0 1px 5px rgba(0, 0, 0, 0.18);
	}
	#main > button > .index-letter {
		position: absolute;
		left: 16px;
		color: #888;
	}

	#main[data-display="text"] {
		flex-direction: column;
	}

	#main[data-display="text"] > button {
		display: flex;
		flex-direction: column;
		justify-content: center;
		font-family: CrimsonText;
		font-size: 22px;
		position: relative;
		background: rgb(235, 235, 235);
		margin: 8px 14px;
		padding: 14px 40px;
		padding-top: 18px;
		font-weight: bold;
		font-size: 21px;
		color: #333;
	}

	#main[data-display="text"] > button .answer-text {
		text-align: start;
	}

	#main[data-display="image"] {
		display: flex;
		text-align: center;
		flex-wrap: wrap;
	}
	#main[data-display="image"] > button {
		display: flex;
		flex-direction: column;
		align-items: center;
		font-family: CrimsonText;
		font-size: 18px;
		font-weight: bold;
		width: calc(48% - 12px);
		background: #fefefe;
		flex-shrink: 0;
		flex-wrap: nowrap;
		text-align: center;
		padding: 6px;
		margin: 1%;
		vertical-align: middle;
		box-sizing: content-box;
		height: 245px;
	}
	#main[data-display="image"] > button img {
		filter: none;
		/* width: 100%; */
		width: 100%;
		height: 100%;
		background: white;
	}

	#main > button[data-status="checking"] {
		background: #f9f65e;
	}
	#main > button[data-status="right"] {
		background: #75f475;
	}
	#main > button[data-status="wrong"] {
		/* background: #ec3a3a; */
		background: #f21b1b;
	}

	/* @media screen and (max-width: 400px) and (min-height: 600px) {
		#main[display=image] > button {
			width: calc(100% - 24px);
		}
	} */

	#footer {
		position: absolute;
		bottom: 0;
		height: 114px;
		width: 100%;
		z-index: 1;
		flex-shrink: 0;
		overflow: visible;
		transition: bottom 0.2s ease-out;
		font-size: inherit;
		padding: 0;
		border: none;
		color: inherit;
	}

	#footer[data-furtive="true"] {
		width: auto;
		bottom: -32px;
	}

	@media screen and (max-height: 600px) {
		#footer[data-furtive="true"] {
			bottom: -120px;
		}
	}

	#bitmoji-talk {
		position: absolute;
		left: 125px;
		bottom: 20px;
		width: calc(100% - 190px);
		background: #fefefe;
		padding: 22px 26px;
		border-radius: 18px;
		border-bottom-left-radius: 0;
		box-shadow: inset -1px -1px 1px 1px rgba(0, 0, 0, 0.7);
		cursor: default;
		line-height: 20px;
	}

	#bitmoji-talk:empty {
		display: none;
	}

	#progress-bar {
		height: 24px;
		margin: 6px 12px 0px;
		border: 2px solid rgba(0, 0, 0, 0.5);
		border-radius: 12px;
		position: relative;
		color: rgba(0, 0, 0, 0.5);
		text-align: center;
		display: flex;
		justify-content: center;
		align-items: center;
		overflow: hidden;
	}

	#progress-bar > .filler {
		position: absolute;
		left: 0;
		top: 0;
		height: 100%;
		background-color: #75f475;
		transition: width 0.8s ease-out;
		width: 0;
	}

	#progress-bar > .text {
		font-size: 14px;
		font-family: GameMusic;
		z-index: 1;
	}

	#angel {
		position: relative;
		top: -10px;
		animation: MoveUpDown 2.6s ease-in-out infinite alternate;
	}

	#demon {
		position: relative;
		top: -10px;
		animation: MoveUpDown 2.2s ease-in-out infinite alternate;
	}

	@keyframes MoveUpDown {
		0% {
			top: -10px;
		}
		100% {
			top: 10px;
		}
	}

	#story {
		display: flex;
		justify-content: center;
		overflow: visible;
		height: 0;
		position: relative;
		top: 80px;
	}

	@media screen and (max-height: 930px) {
		#story {
			top: 200px;
		}
	}

	#story img {
		filter: drop-shadow(0 0 7px rgba(0, 0, 0, 0.4));
	}

	#story-bitmoji {
		position: absolute;
		bottom: 0;
		display: flex;
		justify-content: center;
		transition: transform 1s ease-out;
		/* animation: none; */
	}

	#story-bitmoji[data-show="false"] {
		display: none;
	}

	#story-bitmoji-img {
		transform: scale(0.8);
	}

	#story-bitmoji-talk {
		position: absolute;
		bottom: 100%;
		margin-bottom: 6px;
		width: 320px;
		max-width: 60vw;
		background: #fefefe;
		padding: 22px 26px;
		border-radius: 18px;
		box-shadow: 1px 1px 7px 1px rgba(0, 0, 0, 0.7);
		cursor: default;
		line-height: 20px;
	}

	#story-triangle-talk {
		position: absolute;
		width: 0;
		height: 0;
		top: -7px;
		left: 50%;
		border-style: solid;
		border-width: 10px 10px 0 10px;
		border-color: #fefefe transparent transparent transparent;
		z-index: 2;
	}

	#story-bitmoji-talk:empty,
	#story-bitmoji-talk:empty + #story-triangle-talk {
		display: none;
	}

	#fader {
		position: fixed;
		background-color: transparent;
		width: 100vw;
		height: 100vh;
		left: 0;
		top: 0;
		transition: background-color 3s linear;
	}

	#fader[data-status="darker"] {
		background-color: rgba(0, 0, 0, 0.7);
	}

	[data-animation="up-and-down"] {
		animation: up-and-down 1.6s ease-out infinite alternate;
	}
	@keyframes up-and-down {
		25% {
			transform: translateY(-10px);
		}
		75% {
			transform: translateY(10px);
		}
	}
</style>
