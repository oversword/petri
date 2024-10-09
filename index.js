import CultureCollection from "./CultureCollection.js"
import DNA from "./DNA.js"
import DNA_Neural from "./DNA/Neural.js"
import DNA_Turing from "./DNA/Turing.js"
import Entity from "./Entity.js"
import EntityRenderer from "./EntityRenderer.js"
import Problem from "./Problem.js"
import Process from "./Process.js"
import Random from "./Random.js"



let current_culture = false
const main = () => {

	const random = new Random()
	const dna_seed = random.float()
	const mutation_seed = random.float()
	const dna_random = new Random(dna_seed)
	const mutation_random = new Random(mutation_seed)

	const config = {
		main_runner_interval: 50,
		floating_point_error_threshold: 0.001,
		random_dna: {
			batch_size: 200,
			min_length: 10,
			max_length: 100,
			life_span: 100,
			entity_step: {
				grow: 1,
				learn: 250,
				neural: {
					learn_rate: 0.5,
				}
			},
		},
		culture: {
			min_count: 100,
			food: 50,
			reproduce_food: 20,
			maximum_age: 200,
			maximum_safe_age: 100,
			minimum_success: 0.001,
			entity_step: {
				grow: 1,
				learn: 50,
				neural: {
					learn_rate: 0.5,
				}
			},
		},
		dna: {
			defaultFillMode: DNA.FILL_INFLATE,
			read: {
				max_mutation_distance: 1,
				mutation_rate_inverse: 50,
			},
			copy:{
				min_matching_nucleotides: 4,
				max_matching_nucleotides: 8,
				max_matching_additional_chance_inverse: 2,
				max_reads: 400,
				min_chunk_size: 20,
				max_chunk_size: 40,
				max_dna_length: 10000,
				match_remove_failure_chance_inverse: 2,
				match_failure_chance_inverse: {
					base: 4,
					raise_offset: 1
				}
			}
		},
		base: {
			size: 91,
			generator: i => {
				const code = i + ('#'.charCodeAt(0))
				return String.fromCharCode(code + Number(code >= ('\\'.charCodeAt(0))))
			}
		},
		random_dna_process: {
			rest_period: 20,
			watch_rest_period: 1000,
			duty_cycle: 0.25
		},
		cultivation_process: {
			rest_period: 10,
			wait_rest_period: 40,
			duty_cycle: 0.6
		}
	}



	// ========= DNA =========
	const initial_weights = {
		add_node_logistic_val_val_neural: 10
	}
	const DNA_order = [
		{ _class: DNA_Turing, getter: entity => entity.turing },
		{ _class: DNA_Neural, getter: entity => entity.neural, name: 'neural' },
	]
	const DNA_methods_reduce = (pass, { getter, _class, name: oI }, I) => {
		const l = [ 'var', 'val' ]
		return _class.order.reduce((pass, base_func) => {
			const name = base_func.name
			return l.reduce((pass, v1, i) =>
					l.reduce((pass, v2, j) => {
						const opt_name = `${name}_${v1}_${v2}_${oI || I}`
						pass.options.push({
							name: opt_name,
							func: (i && j)
								? (entity, val1, val2) => base_func(getter(entity), val1, val2)
								: (entity, val1, val2) => {
										if (i === 0 && ! (val1 in entity.turing.vars)) return;
										if (j === 0 && ! (val2 in entity.turing.vars)) return;
										return base_func(
											getter(entity),
											i === 0 ? entity.turing.vars[val1] : val1,
											j === 0 ? entity.turing.vars[val2] : val2
										)
									}
						})
						if (name in _class.weights)
							pass.weights[opt_name] = _class.weights[name]
						return pass
					}, pass),
				pass)
		}, pass)
	}

	const dna = new DNA(4, [
		DNA_order.reduce(DNA_methods_reduce, {
			// fillMode: DNA.FILL_CYCLE,
			options: [],
			weights: initial_weights
		}),
		DNA.NUMBER_SET,
		DNA.NUMBER_SET
	], mutation_random, config.dna)



	// ========= PROBLEM =========
	const generic_problem_generator = (inputs) => {
		const max = Math.max(...inputs)
		const min = Math.min(...inputs)
		return [
			max,
			min,
			(max + min) / 2,
			max * min,
			max - min
		 ]
	}
	const generate_problem = (i) => {
		const I = Math.floor(i)
		const inputs = I + 2
		return new Problem(inputs, 5, generic_problem_generator)
	}

	let current_problem = 0.5
	let cultures = new CultureCollection(dna, generate_problem(current_problem), config.culture)

	let dna_generator = (dna, random) =>
		dna.copy(dna.scramble(dna.generate(random.int(config.random_dna.min_length, config.random_dna.max_length), random), random), random)
		// dna.copy(dna.scramble(BigInt("0x27c22347a4f3c1096367189f7ede695cfa20000016b3d8ab1132fa863ee"), random), random)

	const generate_random_dna = async (process) => {
		if (cultures.length >= config.culture.min_count) return;

		await Promise.all(Array(config.random_dna.batch_size).fill(0)
			.map(async () => {
				const entity_dna = dna_generator(dna, dna_random)

				const entity = cultures.createEntity(entity_dna)
				const errs = await process.batch(
					Array(config.random_dna.life_span).fill([entity, dna, cultures.problem, config.random_dna.entity_step]))

				const error = errs
					.reduce((sum, err) => sum + err, 0)/config.random_dna.life_span
				if (error < cultures.problem.max_error - config.floating_point_error_threshold)
					cultures.add(entity)
			}))
	}
	const cultivate = async (process) => {
		if (! cultures.length) return;
		await cultures.run(process)
		const list = cultures.list
		if (list.some(culture => culture.generations > 1000)) {
			list.sort((a,b) => a.best.min_error-b.best.min_error)
			const best_dna = list.slice(0,10).map((culture) => culture.best.original_dna)

			list.sort((a,b) => a.current_best.latest_error-b.current_best.latest_error)
			const current_best_dna = list.slice(0,10).map((culture) => culture.current_best.original_dna)

			const all_best_dna = best_dna.concat(current_best_dna)
			dna_generator = (dna, random) =>  dna.copy(dna.scramble(random.item(all_best_dna), random), random)
			cultures = new CultureCollection(dna, generate_problem(current_problem), config.culture)
			console.log('problem:',current_problem)
			current_problem += 0.5
		}

		// generate random dna
		// train against problem 1 until maxgen > 1000
		// take 10 best & scramble
		// train against problem 1 until maxgen > 1000
		// take 10 best & scramble

		// train against problem 2 until maxgen > 1000
		// take 10 best & scramble
		// train against problem 2 until maxgen > 1000
		// take 10 best & scramble
	}

	const random_dna_process = new Process(Entity.run, config.random_dna_process)
	const cultivation_process = new Process(Entity.run, config.cultivation_process)
	cultivation_process.watch(cultivate)
	random_dna_process.watch(generate_random_dna)



	// ========= RENDERING =========

	// Create a full-page canvas for rendering
	const canvas = document.createElement('canvas')
	document.body.appendChild(canvas)
	canvas.width = window.innerWidth
	canvas.height = window.innerHeight
	window.onresize = () => {
		canvas.width = window.innerWidth
		canvas.height = window.innerHeight
	}

	// Click cultures to view them, or back to return
	const mouse_pos = {x:0,y:0}
	canvas.onmousemove = e => {
		mouse_pos.x = e.offsetX
		mouse_pos.y = e.offsetY
	}
	let current_cults = []
	canvas.onclick = e => {
		const x = e.offsetX
		const y = e.offsetY
		const row = Math.floor(y / EntityRenderer.renderSize)
		const col = Math.floor(x / EntityRenderer.renderSize)
		if (current_culture) {
			if (row === 0 && col === 0)
				current_culture = false
			return;
		}
		const rows = Math.floor(canvas.height / EntityRenderer.renderSize)
		const cols = Math.floor(canvas.width / EntityRenderer.renderSize)
		if (!(row < rows && col < cols)) return
		const i = (row * cols) + col
		current_culture = current_cults[i]
	}

	// Press ESC to exit single culture view
	document.onkeydown = e => {
		if (e.code === 'Escape')
			current_culture = false
	}

	// Draw best entity from each culture, or all entities in selected culture
	const render_best_cultures = () => {
		const rows = Math.floor(canvas.height / EntityRenderer.renderSize)
		const cols = Math.floor(canvas.width / EntityRenderer.renderSize)
		const context = canvas.getContext('2d')
		context.clearRect(
			0,
			0,
			canvas.width,
			canvas.height
		)
		if (current_culture) {
			const selected = {
				row: Math.floor(mouse_pos.x / EntityRenderer.renderSize),
				col: Math.floor(mouse_pos.y / EntityRenderer.renderSize),
			}
			context.fillStyle = `#aaa`
			context.fillRect(0,0, EntityRenderer.renderSize, EntityRenderer.renderSize)
			if (selected.row === 0 && selected.col === 0)
				context.fillStyle = `#000`
			else context.fillStyle = `#fff`
			context.fillText('< Back', (EntityRenderer.renderSize / 2) - 40, EntityRenderer.renderSize / 2)
			current_culture.entities
				.filter(entity => entity.neural.rat && entity.neural.rat.allputs)
				.sort((a, b) => b.age - a.age)
				.slice(0, rows * cols)
				.forEach((entity, I) => {
					const i = I + 1
					const x = (i % cols) * EntityRenderer.renderSize
					const y = Math.floor(i / cols) * EntityRenderer.renderSize

					context.fillStyle = `rgba(100,255,100,${("" + Math.max(1 - (entity.latest_error / cultures.problem.max_error), 0)).slice(0, 5)})`
					context.fillRect(x, y, EntityRenderer.renderSize, EntityRenderer.renderSize)
					EntityRenderer.render(entity, context, {
						x_offset: x,
						y_offset: y
					})
				})
			window.requestAnimationFrame(render_best_cultures)
			return
		}
		const cults = cultures.list
		const running = {}//Object.fromEntries(cults.slice(0, 10).map((cult) => [cult.id, true]))
		cults.sort((a, b) => a.min_error - b.min_error)
		current_cults = cults.slice(0, rows * cols)
		// TODO: allow config of render
		context.font = '20px serif'
		const selected = {
			row: Math.floor(mouse_pos.x / EntityRenderer.renderSize),
			col: Math.floor(mouse_pos.y / EntityRenderer.renderSize),
		}
		current_cults.forEach((culture, i) => {
			const row = (i % cols)
			const col = Math.floor(i / cols)
			if (mouse_pos.x && mouse_pos.y && row === selected.row && col === selected.col) {
				selected.cult = { culture, i }
				return
			}
			const x = row * EntityRenderer.renderSize
			const y = col * EntityRenderer.renderSize
			const entity = (culture.current_best.neural.rat && culture.current_best.neural.rat.connected) ? culture.current_best : culture.best
			context.fillStyle = `rgba(100,255,100,${("" + Math.max(1 - (entity.latest_error / cultures.problem.max_error), 0)).slice(0, 5)})`
			context.fillRect(x, y, EntityRenderer.renderSize, EntityRenderer.renderSize)
			context.fillStyle = "#000"
			context.fillText(`#${culture.id}`, x, y + 20)
			EntityRenderer.render(entity, context, {
				x_offset: x,
				y_offset: y
			})
		})
		if (selected.cult) {
			const zoom_add = 50
			const render_size = EntityRenderer.renderSize + zoom_add
			const {culture} = selected.cult
			const row = (selected.cult.i % cols)
			const col = Math.floor(selected.cult.i / cols)
			const x = Math.min(canvas.width - render_size, Math.max(0, (row * EntityRenderer.renderSize) - (zoom_add / 2)))
			const y = Math.min(canvas.height - render_size, Math.max(0, (col * EntityRenderer.renderSize) - (zoom_add / 2)))
			const entity = (culture.current_best.neural.rat && culture.current_best.neural.rat.connected) ? culture.current_best : culture.best
			context.fillStyle = `#fff`
			context.fillRect(x, y, render_size, render_size)
			context.fillStyle = `rgba(100,255,100,${("" + Math.max(1 - (entity.latest_error / cultures.problem.max_error), 0)).slice(0, 5)})`
			context.fillRect(x, y, render_size, render_size)
			context.fillStyle = "#000"
			context.fillText(`#${culture.id}`, x, y+20)
			EntityRenderer.render(entity, context, {
				x_offset: x,
				y_offset: y,
				width: render_size,
				height: render_size
			})
			context.strokeStyle = "#88f"
			context.lineWidth = 2
			context.strokeRect(x, y, render_size, render_size)
		}
		window.requestAnimationFrame(render_best_cultures)
	}
	window.requestAnimationFrame(render_best_cultures)

	console.info(`Run the tests at ${window.location.href.split('/').slice(0,-1).join('/')}/tests/index.html`)
	// Return some stuff we may want to use externally
	return {
		cultures,
		stop() {
			cultivation_process.stop()
			random_dna_process.stop()
		}
	}
}

const env = main()
