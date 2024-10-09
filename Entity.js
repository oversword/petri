import DNA_Neural from "./DNA/Neural.js"
import DNA_Turing from "./DNA/Turing.js"
import Neural from "./Neural.js"

export default class Entity {
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