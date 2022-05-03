class Entity {
	static defaultRunConfig = {
		grow: 1,
		learn: 1,
	}

	static new(dna, mutation_random) {
		return {
			original_dna: dna,
			dna,
			mutation_random,
			// TODO: Make configurable somehow?
			turing: DNA_Turing.new(),
			neural: DNA_Neural.new(),
			age: 0,
			food: 0,
		}
	}
	static grow(entity, dna, problem) {
		const read = dna.read(entity.dna, entity.turing.pointer, entity.mutation_random)
		if (read) {
			const result = read.instruction[0].func(entity, read.instruction[1], read.instruction[2])
			if (read.dna)
				entity.dna = read.dna
			DNA_Turing.handleResult(entity.turing, result)
			DNA_Neural.handleResult(entity.neural, result)
		} else {
			console.log('no read')
		}
		entity.age++
	}
	static run(entity, dna, problem, config = Entity.defaultRunConfig) {
		for (let i = 0; i < (config.grow || 1); i++)
			Entity.grow(entity, dna, problem)

		if (!entity.neural.rat.connected)
			return problem.max_error

		const learn = (config.learn || 1)
		let sum = 0
		for (let i = 0; i < learn; i++)
			sum += Neural.run(entity.neural, problem.case(), config.neural)

		return sum / learn
	}
}

class EntityRenderer {
	static calculateNodePosition(pass, layer, i) {
		return Object.keys(layer).reduce((pass, id, j, layer_ids) => {
			pass.node_positions[id] = {
				x: pass.style.x_offset + pass.style.padding + (pass.style.layer_width * i),
				y: pass.style.y_offset + pass.style.padding + ((1 + (j * 2)) * pass.style.content_height / 2 / layer_ids.length)
			}
			return pass
		}, pass)
	}
	static renderSize = 160
	static render({ neural: env }, context, inputStyle = {}) {
		if (! env.rat) return;
		const style = {
			x_offset: 0,
			y_offset: 0,
			padding: 20,
			height: EntityRenderer.renderSize,
			width: EntityRenderer.renderSize,
			...inputStyle
		}
		style.content_height = style.height - (style.padding * 2)
		style.content_width = style.width - (style.padding * 2)
		style.layer_width = style.content_width / (env.rat.list.length - 1)

		const { nodes, connections } = env
		const { node_positions } = env.rat.list.reduce(EntityRenderer.calculateNodePosition, { node_positions: {}, style })

		Object.keys(env.rat.connections).map(id => connections[id]).forEach(connection => {
			const p1 = node_positions[connection.in]
			const p2 = node_positions[connection.out]
			if (! (p1 && p2)) return; // TODO: this should no longer be needed

			const val = Math.min(connection.val, 40)
			context.beginPath()
			context.moveTo(p1.x, p1.y)
			context.lineTo(p2.x, p2.y)
			context.lineWidth = Math.abs(val) + 1
			if (val > 0)
				context.strokeStyle = "#00f"
			else if (val < 0)
				context.strokeStyle = "#f00"
			// if (val !== 0)
				context.stroke()
		})
		Object.entries(node_positions).forEach(([ id, p ]) => {
			if (env.inputs.includes(id))
				context.fillStyle = "#000"
			else if (env.outputs.includes(id))
				context.fillStyle = "#ddd"
			else
				context.fillStyle = "#999"
			context.beginPath();
			const node = env.nodes[id]
			// console.log(node)
			const r = 5
			switch (node.sigmoid.name) {
				case 'arctan':
					context.moveTo(p.x-r, p.y-r)
					context.lineTo(p.x-r, p.y+r)
					context.lineTo(p.x+r, p.y+r)
					context.lineTo(p.x+r, p.y-r)
					break
				case 'softsign':
					context.moveTo(p.x-r, p.y+r)
					context.lineTo(p.x+r, p.y+r)
					context.lineTo(p.x, p.y-r)
					break
				case 'logistic':
				default:
					context.arc(p.x, p.y, r, 0, 2 * Math.PI)
					break
			}
			context.closePath();
			context.fill();
		})
	}
}

class CultureCollection {
	static defaultConfig = {
		food: 50,
		reproduce_food: 5,
		maximum_age: 100,
		maximum_safe_age: 50,
		minimum_success: 0.001,
		entity_step: {
			grow: 1,
			learn: 50
		}
	}

	static sortBySmallestErr (a, b) { return a[1] - b[1] }
	static sumErr (sum, [, err]) { return sum + err }
	static sumCultureErr (sum, culture) { return sum + culture.min_error }
	static sumCultureGen (sum, culture) { return sum + culture.generations }
	static prioritiseCultures(a, b) {
		return (a.min_error * a.generations * a.entities.length)
		     - (b.min_error * b.generations * b.entities.length)
	}
	static findEntitiesToRemove(pass, culture, i) {
		if (culture.entities.length === 0 || (culture.generations > pass.avg_gen && culture.min_error > pass.avg_err))
			pass.list.push(i)
		return pass
	}
	static isObject(a) { return typeof a === 'object' && !Array.isArray(a) }
	static mergeObject(a, b) {
		const ret = {...a}
		for (let k in b) {
			const B = b[k]
			const Bo = CultureCollection.isObject(B)
			if (Bo) {
				const A = a[k]
				const Ao = CultureCollection.isObject(A)
				ret[k] = CultureCollection.mergeObject(Ao ? A : {}, Bo ? B : {})
			} else
				ret[k] = B
		}
		return ret
	}

	createEntity(entity_dna) {
		const entity = Entity.new(entity_dna/*, new Random(mutation_seed)*/)
		for (let i=0; i<this.#problem.inputs; i++)
			DNA_Neural.add_input(entity.neural)
		for (let i=0; i<this.#problem.outputs; i++)
			DNA_Neural.add_output(entity.neural)
		entity.neural.rat = Neural.rationalise(entity.neural)
		return entity
	}

	#cultures = []
	#_culture_id = 0
	#problem = false
	#dna = false
	#config = CultureCollection.defaultConfig
	// #run_entity = (entity, i) => [i, Entity.run(entity, this.#dna, this.#problem, this.#config.entity_step), entity]
	#removeCulture = i => {
		this.#cultures.splice(i, 1)
	}
	#removeAgedEntities = ([ i, err, { age } ]) =>
		age < this.#config.maximum_safe_age ||
		err < this.#problem.max_error * (1 - (age / this.#config.maximum_age))
	#persistAndReproduceEntities = (pass, [ i, err, entity ]) => {
		pass.list.push(entity)
		entity.latest_error = err
		entity.min_error = Math.min(err, entity.min_error || Infinity)
		entity.food += pass.food_portion * Math.max(this.#problem.max_error - err, 0)
		while (entity.food > this.#config.reproduce_food) {
			entity.food -= this.#config.reproduce_food
			const dna = this.#dna.copy(entity.dna, entity.mutation_random)
			pass.culture.members.push(dna)
			pass.list.push(this.createEntity(dna/*, new Random(pass.culture.mutation_seed)*/))
		}
		return pass
	}
	#run_single = async (culture, process) => {
		const errs = (await process.batch(culture.entities.map(entity => [entity, this.#dna, this.#problem, this.#config.entity_step])))
			.map((err, i) => [i, err, culture.entities[i]])
			.filter(this.#removeAgedEntities)

		culture.generations++

		if (errs.length === 0) {
			culture.entities = []
			return
		}

		const total_err = errs.reduce(CultureCollection.sumErr, 0)
		const max_total_err = this.#problem.max_error * errs.length

		errs.sort(CultureCollection.sortBySmallestErr)

		culture.current_best = errs[0][2]
		if ((!culture.best) || errs[0][1] <= culture.min_error) {
			const entity = errs[0][2]
			if ((!culture.best)
				|| errs[0][1] < culture.min_error
				|| entity.original_dna < culture.best.original_dna
			) {
				culture.best = entity
				culture.min_error = errs[0][1]
			}
		}

		culture.entities = errs.reduce(this.#persistAndReproduceEntities, {
			list: [],
			culture,
			food_portion: this.#config.food / Math.max(this.#config.minimum_success, max_total_err - total_err)
		}).list

	}

	constructor(dna, problem, config = {}) {
		if (!(dna instanceof DNA))
			throw new TypeError(`[CultureCollection] The first argument 'dna' must be a DNA object, "${typeof dna}" given.`)
		if (!(problem instanceof Problem))
			throw new TypeError(`[CultureCollection] The second argument 'problem' must be a Problem object, "${typeof problem}" given.`)
		if (typeof config !== 'object')
			throw new TypeError(`[CultureCollection] The third argument 'config' must be an object, "${typeof config}" given.`)

		this.#dna = dna
		this.#problem = problem
		this.#config = CultureCollection.mergeObject(
			CultureCollection.defaultConfig,
			config
		)
	}

	add(entity, mutation_seed) {
		entity.age = 0
		this.#cultures.push({
			id: String(this.#_culture_id++),
			progenitor: entity.original_dna,
			min_error: this.#problem.max_error,
			generations: 1,
			members: [entity.original_dna, entity.dna],
			best: entity,
			current_best: entity,
			mutation_seed,
			entities: [
				this.createEntity(entity.original_dna/*, new Random(mutation_seed)*/),
				entity,
			]
		})
	}
	async run(process) {
		this.#cultures.sort(CultureCollection.prioritiseCultures)
		const to_run = //this.#cultures
			(current_culture ? [current_culture] : [])
			.concat(this.#cultures.slice(0, this.#cultures.length/2))
			.filter((item, index, list) => item && list.indexOf(item) === index)
		await Promise.all(to_run.map((culture) => this.#run_single(culture, process)))
		const avg_err = this.#cultures.reduce(CultureCollection.sumCultureErr, 0) / this.#cultures.length
		const avg_gen = this.#cultures.reduce(CultureCollection.sumCultureGen, 0) / this.#cultures.length
		const to_remove = to_run.reduce(CultureCollection.findEntitiesToRemove, { list: [], avg_err }).list
		to_remove.reverse()
		to_remove.forEach(this.#removeCulture)
	}

	get length() {
		return this.#cultures.length
	}
	get list() {
		return [...this.#cultures]
	}
	get problem() {
		return this.#problem
	}
}

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
		if (e.keyCode === 27)
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
			// console.log(current_culture)
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
