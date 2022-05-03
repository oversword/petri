class Random {
	static defaultInitialSeed = 1//Math.random()
	static defaultStringBase = new Base()

	#seed = Random.defaultInitialSeed
	#initialSeed = this.#seed

	constructor(seed = Random.defaultInitialSeed) {
		if (typeof seed !== 'number')
			throw new TypeError(`[Random] The first argument 'seed' must be a number, "${typeof seed}" given.`)

		this.#initialSeed = seed
		this.#seed = seed
	}

	reset() {
		this.#seed = this.#initialSeed
	}
	float() {
		const x = Math.sin(this.#seed++) * 10000;
		return x - Math.floor(x);
		// return 0.7//Math.random()
	}
	int(min, max) {
		const min_ = Math.ceil(min)
		return Math.floor(this.float() * (Math.floor(max) - min_) + min_)
	}
	inti(min, max) {
		const min_ = Math.ceil(min)
		return Math.floor(this.float() * (1 + Math.floor(max) - min_) + min_)
	}
	int0(max) {
		return Math.floor(this.float() * Math.floor(max))
	}
	index(list = []) {
		return this.int0(list.length)
	}
	item(list = []){
		return list[this.index(list)]
	}
	string(length, base = Random.defaultStringBase){
		let ret = ''
		for (let i=0;i<length;i++)
			ret += this.item(base.set)
		return ret
		// Array(length).fill(0).map(() => random_item(base)).join('')
	}
	chance(one_in) {
		return this.int0(one_in) === 0
	}
}

// TODO: make it so you have one instance that's called over and over?
// TODO: Implement this efficiently for mutation
class SeedlessRandom {
	static defaultStringBase = new Base()

	float(seedObj) {
		const x = Math.sin(seedObj.seed++) * 10000;
		return x - Math.floor(x)
	}
	int(seedObj, min, max) {
		const min_ = Math.ceil(min)
		return Math.floor(this.float(seedObj) * (Math.floor(max) - min_) + min_)
	}
	inti(seedObj, min, max) {
		const min_ = Math.ceil(min)
		return Math.floor(this.float(seedObj) * (1 + Math.floor(max) - min_) + min_)
	}
	int0(seedObj, max) {
		return Math.floor(this.float(seedObj) * Math.floor(max))
	}
	index(seedObj, list = []) {
		return this.int0(seedObj, list.length)
	}
	item(seedObj, list = []){
		return list[this.index(seedObj, list)]
	}
	string(seedObj, length, base = SeedlessRandom.defaultStringBase){
		let ret = ''
		for (let i=0;i<length;i++)
			ret += this.item(seedObj, base.set)
		return ret
		// Array(length).fill(0).map(() => random_item(base)).join('')
	}
	chance(seedObj, one_in) {
		return this.int0(seedObj, one_in) === 0
	}
}
