export default class Runner {
	static defaultInterval = 100
	#timeout = 0
	#interval = Runner.defaultInterval
	#step = false
	#running = false
	#run_step = () => {
		this.#step(this)
		if (this.#running)
			this.#timeout = setTimeout(this.#run_step, this.#interval)
	}

	constructor(step, interval = Runner.defaultInterval) {
		if (typeof step !== 'function')
			throw new TypeError(`[Runner] The first argument 'step' must be a callable function, "${typeof step}" given.`)
		if (typeof interval !== 'number')
			throw new TypeError(`[Runner] The second argument 'interval' must be a number, "${typeof interval}" given.`)

		this.#step = step
		this.#interval = interval
	}

	run() {
		if (this.#running)
			return 'Already running'
		if (this.#step === false)
			return 'No step method'

		this.#running = true
		this.#timeout = setTimeout(this.#run_step, this.#interval)
	}
	step() {
		if (this.#step === false)
			return 'No step method'
		this.#step(this)
	}
	stop(){
		if (!this.#running)
			return 'Not running'

		this.#running = false
		clearTimeout(this.#timeout)
		this.#timeout = 0
	}
	get running() {
		return this.#running
	}
}
