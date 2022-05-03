class Process {
	static defaultConfig = {
		watch_rest_period: 100,
		rest_period: 20,
		duty_cycle: 0.5
	}
	static defaultGenerator = () => {}

	static isObject(a) { return typeof a === 'object' && !Array.isArray(a) }
	static mergeObject(a, b) {
		const ret = {...a}
		for (let k in b) {
			const B = b[k]
			const Bo = Process.isObject(B)
			if (Bo) {
				const A = a[k]
				const Ao = Process.isObject(A)
				ret[k] = Process.mergeObject(Ao ? A : {}, Bo ? B : {})
			} else
				ret[k] = B
		}
		return ret
	}

	#step = false
	#runner = false
	#batches = []
	#results = []
	#callbacks = []
	#done_callbacks = []
	#config = Process.defaultConfig
	#duty_period = this.dutyPeriod
	#watch_timeout = 0

	#resolveWhenDone = resolve => {
		if (this.#runner.running)
			this.#done_callbacks.push(resolve)
		else resolve()
	}
	#run_step = () => {
		const t = Date.now()
		while (
			this.#batches.length !== 0
			&& this.#batches[0].length !== 0
			&& (Date.now() - t) < this.#duty_period
		) {
			const input = this.#batches[0].shift()
			const output = this.#step.apply(this, input)
			this.#results[0].push(output)

			if (this.#batches[0].length === 0) {
				this.#batches.shift()
				const callbacks = this.#callbacks.shift()
				const result = this.#results.shift()
				callbacks.forEach(callback => callback(result))
			}
		}
		if (this.#batches.length === 0) {
			this.#runner.stop()
			this.#done_callbacks.forEach(callback => callback())
			this.#done_callbacks = []
		}
	}
	constructor(step, config = Process.defaultConfig) {
		if (typeof step !== 'function')
			throw new TypeError(`[Process] The first argument 'step' must be a callable function, "${typeof step}" given.`)
		if (typeof config !== 'object')
			throw new TypeError(`[Process] The second argument 'config' must be an object, "${typeof config}" given.`)

		this.#step = step
		this.#config = Process.mergeObject(Process.defaultConfig, config)
		this.#duty_period = this.dutyPeriod
		this.#runner = new Runner(this.#run_step, this.#config.rest_period)
	}
	watch(generator = Process.defaultGenerator) {
		const regenerate = async () => {
			await generator(this)
			if (this.#batches.length && this.#batches[0].length) {
				this.run()
				await this.done()
				this.#watch_timeout = setTimeout(regenerate, 0)
			} else {
				this.#watch_timeout = setTimeout(regenerate, this.#config.watch_rest_period)
			}
		}
		regenerate()
	}
	done() {
		return new Promise(this.#resolveWhenDone)
	}
	run() {
		return this.#runner.run()
	}
	stop() {
		clearTimeout(this.#watch_timeout)
		this.#watch_timeout = 0
		return this.#runner.stop()
	}
	batch(batch) {
		const callbacks = []
		const result = []
		this.#results.push(result)
		this.#callbacks.push(callbacks)
		this.#batches.push(batch)
		this.run()
		const batch_resolve = resolve => {
			if (batch.length)
				callbacks.push(resolve)
			else resolve(result)
		}
		return new Promise(batch_resolve)
	}
	get dutyPeriod(){
		return this.#config.rest_period * this.#config.duty_cycle / Math.max(1 - this.#config.duty_cycle, 0.000001)
	}
}
