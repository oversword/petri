export default class Base {
	static defaultBase = 10

	static extractIndex(_,i) { return i }
	static indexSet(s,i) { return [s,i] }

	#base = Base.defaultBase
	#set = []
	#index = {}
	#defaultGenerator = i => i.toString(this.#base)

	constructor(base = Base.defaultBase, generator = this.#defaultGenerator) {
		if (typeof base !== 'number')
			throw new TypeError(`[Base] The first argument 'base' must be a number, "${typeof base}" given.`)
		if (base < 2)
			throw new RangeError(`[Base] The smallest possible base is base 2, '${base}' given.`)
		if (typeof generator !== 'function')
			throw new TypeError(`[Base] The second argument 'generator' must be a callable function, "${typeof generator}" given.`)

		this.#base = Math.floor(base)
		this.#set = Array(this.#base).fill(0).map(Base.extractIndex).map(generator)
		this.#index = Object.fromEntries(this.#set.map(Base.indexSet))

		// Provide copies for external users, but never use them as they may be modified
		this.base = this.#base
		this.set = [...this.#set]
		this.index = {...this.#index}
	}

	number(string) {
		return this.#index[string]
	}
	string(number) {
		return this.#set[number]
	}
}
