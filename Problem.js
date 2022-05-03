// TODO: Is this needed now the entity env knows about inputs & outputs?
class Problem {
	static representitiveSampleSize = 100
	static defaultRandom = new Random()

	static valueIsValid(v) { return typeof v === 'number'}
	static valueSetIsValid(inout) { return Array.isArray(inout) && inout.every(Problem.valueIsValid) }
	static caseIsValid(testcase) { return Array.isArray(testcase) && testcase.length === 2 && testcase.every(Problem.valueSetIsValid) }
	static sumAverageOutputError(a, b) { return a + Math.abs(0.5 - b) }
	static sumMaximumOutputError(a, b) { return a + Math.max(b, 1 - b) }
	static sumMaximumError(total, problem) { return total + problem[1].reduce(Problem.sumMaximumOutputError, 0) }
	static sumAverageError(total, problem) { return total + problem[1].reduce(Problem.sumAverageOutputError, 0) }

	#inputs = 0
	#outputs = 0
	#allputs = 0
	#generator = false
	#max_error = 0
	#average_error = 0

	constructor(inputs = 1, outputs = 1, cases = [], random = Problem.defaultRandom) {
		if (typeof inputs !== 'number')
			throw new TypeError(`[Problem] The first argument 'inputs' must be a number, "${typeof inputs}" given.`)
		if (inputs < 1)
			throw new RangeError(`[Problem] The smallest possible number of inputs is one, '${inputs}' given.`)
		if (typeof outputs !== 'number')
			throw new TypeError(`[Problem] The second argument 'outputs' must be a number, "${typeof outputs}" given.`)
		if (outputs < 1)
			throw new RangeError(`[Problem] The smallest possible number of outputs is one, '${outputs}' given.`)
		if (!(Array.isArray(cases) || typeof cases === 'function'))
			throw new TypeError(`[Problem] The third argument 'cases' must be an array or a callable generator function, "${typeof cases}" given.`)
		if (Array.isArray(cases)) {
			if (!cases.every(Problem.caseIsValid))
				throw new TypeError(`[Problem] Cases is not a valid Array of Arrays of Arrays of numbers.`)
			if (!cases.every(testcase => testcase[0].length === inputs && testcase[1].length === outputs))
				throw new TypeError(`[Problem] Cases must all have ${inputs} inputs and ${outputs} outputs.`)
		}

		this.#inputs = Math.floor(inputs)
		this.#outputs = Math.floor(outputs)
		this.#allputs = this.#inputs + this.#outputs

		const get_float = () => random.float()
		this.#generator = typeof cases === 'function'
			? () => {
				const input_list = Array(inputs).fill(0).map(get_float)
				return [input_list, cases(input_list, outputs)]
			}
			: () => random.item(cases)

		const rep_sample = Array(Problem.representitiveSampleSize).fill(0).map(this.#generator)
		const max_error     = rep_sample.reduce(Problem.sumMaximumError, 0) / rep_sample.length
		const average_error = rep_sample.reduce(Problem.sumAverageError, 0) / rep_sample.length

		this.#max_error = max_error
		this.#average_error = average_error

		this.max_error = this.#max_error
		this.average_error = this.#average_error
		this.inputs = this.#inputs
		this.outputs = this.#outputs
		this.allputs = this.#allputs
	}

	case() {
		return this.#generator()
	}
}
