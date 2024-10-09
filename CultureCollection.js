import DNA from "./DNA.js"
import DNA_Neural from "./DNA/Neural.js"
import Entity from "./Entity.js"
import Neural from "./Neural.js"
import Problem from "./Problem.js"


export default class CultureCollection {
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
		const to_run = [] //this.#cultures
			// (current_culture ? [current_culture] : [])
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