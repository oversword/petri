class DNA {
	/* TERMINOLOGY:
		dna:         BigInt:          Full string of DNA, encoded in binary
		instruction: Array<sequence>: A gene in list format, whose length is determined by the contens of the second argument `orders`
		gene:        BigInt:          A group of sequences, whose size is determined by the contens of the second argument `orders`
		sequence:    Number:          A group of nucleotides, whose size is determined by the first argument `nucleotidesPerSequence`
		nucleotide:  Number:          2 bits of information
	*/
	static NUMBER_SET = "_DNA_NUMEBR_SET"
	static FILL_INFLATE = "_DNA_FILL_INFLATE"
	static FILL_CYCLE = "_DNA_FILL_CYCLE"

	static defaultConfig = {
		defaultFillMode: DNA.FILL_INFLATE,
		read: {
			mutation_rate_inverse: 50,
			max_mutation_distance: 1,
		},
		copy:{
			min_matching_nucleotides: 2,
			max_matching_nucleotides: 4,
			max_matching_additional_chance_inverse: 2,
			max_reads: 400,
			min_chunk_size: 12,
			max_chunk_size: 16,
			max_dna_length: 1000,
			match_failure_chance_inverse: {
				base: 4,
				raise_offset: 1
			},
			match_remove_failure_chance_inverse: 4,
		}
	}
	static bitsPerNucleotide = 2
	static defaultNucleotidesPerSequence = 3
	static defaultOrders = [DNA.NUMBER_SET]
	static defaultRandom = new Random()

	static extractIndex(_,i) { return i }
	static defaultWeightEntry(option) { return [option.name || option, 1] }
	static sum(sum, v) { return sum + v }
	static fillWeighted(acc, option) {
		const a = (acc.a || 0) + (acc.p * acc.w[option.name])
		const l = acc.l || []
		return {
			p: acc.p,
			w: acc.w,
			l: l.concat(Array(Math.ceil(a) - l.length).fill(option)),
			a,
		}
	}
	static isObject(a) { return typeof a === 'object' && !Array.isArray(a) }
	static mergeObject(a, b) {
		const ret = {...a}
		for (let k in b) {
			const B = b[k]
			const Bo = DNA.isObject(B)
			if (Bo) {
				const A = a[k]
				const Ao = DNA.isObject(A)
				ret[k] = DNA.mergeObject(Ao ? A : {}, Bo ? B : {})
			} else
				ret[k] = B
		}
		return ret
	}

	#orders = [...DNA.defaultOrders]
	#orderCount = this.#orders.length
	#random = DNA.defaultRandom
	#config = DNA.defaultConfig
	#nucleotidesPerSequence = DNA.defaultNucleotidesPerSequence
	#nucleotidesPerGene = this.#nucleotidesPerSequence * this.#orderCount
	#bitsPerSequence = this.#nucleotidesPerSequence * DNA.bitsPerNucleotide
	#bitsPerSequenceN = BigInt(this.#bitsPerSequence)
	#bitsPerGene = this.#bitsPerSequence
	#bitsPerGeneN = this.#bitsPerSequenceN
	#sequenceCount = 1 << this.#bitsPerSequence
	#sequenceCountN = BigInt(this.#sequenceCount)

	#fillWeighted = (list, weights) => {
		const l = list.reduce(DNA.fillWeighted, {
			w: weights,
			p: this.#sequenceCount / Object.values(weights).reduce(DNA.sum, 0)
		}).l
		return l.slice(0, this.#sequenceCount)
	}
	#fillRepeated = (list, weights) => {
		const base_list = list.reduce(DNA.fillWeighted, { w: weights, p: 1 }).l
		let ret_list = []
		while (ret_list.length < this.#sequenceCount)
			ret_list = ret_list.concat(base_list.slice(0, this.#sequenceCount - ret_list.length))
		return ret_list
	}
	#normaliseOrder = order => {
		if (order === DNA.NUMBER_SET)
			return Array(this.#sequenceCount).fill(0).map(DNA.extractIndex)
		if (DNA.isObject(order) && 'options' in order) {
			const fill_mode = order.fillMode || this.#config.defaultFillMode
			const weights = {
				...Object.fromEntries(order.options.map(DNA.defaultWeightEntry)),
				...(order.weights || {})
			}
			switch (fill_mode) {
				case DNA.FILL_CYCLE:
					return this.#fillRepeated(order.options, weights)
				case DNA.FILL_INFLATE:
				default:
					return this.#fillWeighted(order.options, weights)
			}
		}
		if (Array.isArray(order)) {
			const fill_mode = this.#config.defaultFillMode
			const weights = Object.fromEntries(order.map(DNA.defaultWeightEntry))
			switch (fill_mode) {
				case DNA.FILL_CYCLE:
					return this.#fillRepeated(order, weights)
				case DNA.FILL_INFLATE:
				default:
					return this.#fillWeighted(order, weights)
			}
		}

		throw new TypeError(`[DNA] Unknown order type given, should be Array, KeyWord or DefinitionObject, "${typeof order}" given.`)
	}

	#generateSequenceReduce = pass => {
		pass.list.push(this.generateSequence(pass.random))
		return pass
	}
	#sumSequenceReduce = (sum, sequence, i) => {
		// append bits to the start of a sequence
		return sum + (BigInt(sequence) << (this.#bitsPerSequenceN * BigInt(i)))
	}
	#getSequence = (dna/*: BigInt*/, i/*: Number*/)/*: Number*/ => {
		// Slice out sequence bits
		return Number((dna >> (this.#bitsPerSequenceN * BigInt(i))) % this.#sequenceCountN)
	}
	#getSequenceReduce = (pass, _, i) => {
		pass.list.push(this.#getSequence(pass.dna, pass.p + i))
		return pass
	}
	#getInstructionReduce = (pass, order, i) => {
		pass.list.push(order[this.#getSequence(pass.dna, (pass.p * this.#orderCount) + i)])
		return pass
	}
	#getInstruction = (dna, i) => {
		return this.#orders.reduce(this.#getInstructionReduce, { dna, list: [], p: i }).list
	}
	#getGene = (dna, p) =>{
		return this.#orders
			.reduce(this.#getSequenceReduce, { dna, p: p * this.#orderCount, list: [] }).list
			.reduce(this.#sumSequenceReduce, 0n)
	}
	#scrambleGeneReduce = (acc, i) => {
		const gene = this.#getGene(acc.dna, i)
		const I = BigInt(i)
		switch (acc.random.int0(6)) {
			case 0:
				return acc
			case 1:
				// generate 2 sets of data
				acc.sum +=
					 (this.generateGene(acc.random) << (this.#bitsPerGeneN * I)) +
					 (gene << (this.#bitsPerGeneN * (I + 1n)))
				 acc.i += 2n
			case 2:
				// append bits to start of a sequence
				acc.sum += this.mutate(gene, 0, acc.random) << (this.#bitsPerGeneN * I)
				acc.i += 1n
				break
			default:
				// append bits to start of a sequence
				acc.sum += gene << (this.#bitsPerGeneN * I)
				acc.i += 1n
				break
		}
		return acc
	}
	#countGenes = (dna) => Math.ceil(dna.toString(2).length / this.#bitsPerGene)

	constructor(
		nucleotidesPerSequence = DNA.defaultNucleotidesPerSequence,
		orders = DNA.defaultOrders,
		random = DNA.defaultRandom,
		config = DNA.defaultConfig
	) {
		if (typeof nucleotidesPerSequence !== 'number')
			throw new TypeError(`[DNA] The first argument 'nucleotidesPerSequence' must be a number, "${typeof base}" given.`)
		if (nucleotidesPerSequence < 1)
			throw new RangeError(`[DNA] There must be at leat one nucleotide per order, "${nucleotidesPerSequence}" given.`)
		if (!Array.isArray(orders))
			throw new TypeError(`[DNA] The second argument 'orders' must be an array, "${typeof orders}" given.`)
		if (!(random instanceof Random))
			throw new TypeError(`[DNA] The third argument 'random' must be a Random object, "${typeof random}" given.`)
		if (orders.length < 1)
			throw new RangeError(`[DNA] There must be at leat one set in the orders, "${orders.length}" given.`)
		if (typeof config !== 'object')
			throw new TypeError(`[DNA] The fourth argument 'config' must be anobject, "${typeof config}" given.`)

		this.#orderCount = orders.length
		this.#nucleotidesPerSequence = Math.floor(nucleotidesPerSequence)
		this.#nucleotidesPerGene = this.#nucleotidesPerSequence * this.#orderCount
		this.#random = random
		this.#config = DNA.mergeObject(
			DNA.defaultConfig,
			config
		)
		this.#bitsPerSequence = this.#nucleotidesPerSequence * DNA.bitsPerNucleotide
		this.#bitsPerSequenceN = BigInt(this.#bitsPerSequence)
		this.#bitsPerGene = this.#bitsPerSequence * this.#orderCount
		this.#bitsPerGeneN = BigInt(this.#bitsPerGene)
		this.#sequenceCount = 1 << this.#bitsPerSequence
		this.#sequenceCountN = BigInt(this.#sequenceCount)
		this.#orders = orders.map(this.#normaliseOrder)
	}

	generate(
		length/*: Number*/,
		random/*: Random*/ = this.#random
	)/*: BigInt*/ {
		return Array(length).fill(0)
			.reduce(this.#generateSequenceReduce, { list: [], random }).list
			.reduce(this.#sumSequenceReduce, 0n)
	}
	generateGene(
		random/*: Random*/ = this.#random
	)/*: BigInt*/ {
		return this.generate(this.#orderCount, random)
	}
	generateSequence(
		random/*: Random*/ = this.#random
	)/*: Number*/ {
		return random.int0(this.#sequenceCount)
	}
	mutate(
		dna/*: BigInt*/,
		pointer/*: Number*/ = 0,
		random/*: Random*/ = this.#random
	)/*: BigInt*/ {
		// xor 11 or 01 to add or remove 1 at a random position
		const change = (random.int0(2) * 2) + 1
		const offset = (this.#bitsPerGene * pointer) + (random.int0(this.#nucleotidesPerGene) * DNA.bitsPerNucleotide)
		const offset_change = BigInt(change) << BigInt(offset)
		return dna ^ offset_change
	}
	decode(dna/*: BigInt*/) {
		console.log("dec")

	}
	engineer(
		instructions,
		random/*: Random*/ = this.#random
	)/*: BigInt*/ {
		console.log("eng")

	}
	read(
		dna/*: BigInt*/,
		pointer/*: Number*/ = 0,
		random/*: Random*/ = this.#random
	) {
		const p = pointer % this.#countGenes(dna)
		const instruction = this.#getInstruction(dna, p)

		if (random.chance(this.#config.read.mutation_rate_inverse)) {
			const mut = this.mutate(dna, p, random)
			return {
				dna: mut,
				instruction
			}
		}

		return {
			instruction
		}
	}
	copy(
		dna/*: BigInt*/,
		random/*: Random*/ = this.#random
	)/*: BigInt*/ {
		const min_set = this.#config.copy.min_matching_nucleotides
		const max_set = this.#config.copy.max_matching_nucleotides
		const sets = {}
		for (let i = min_set; i <= max_set; i++) sets[i] = {};
		let first_set = false
		let r = 0

		let remainder = dna
		while (remainder > 0) {
			r++
			if (r > this.#config.copy.max_reads){
				console.error("TOO MANY RUNS B", string, remainder, sets)
				break;
			}
			const rand = BigInt(random.int(this.#config.copy.min_chunk_size, this.#config.copy.max_chunk_size) * DNA.bitsPerNucleotide)
			const rand_add = BigInt(Math.min(random.inti(min_set, max_set + this.#config.copy.max_matching_additional_chance_inverse), max_set) * DNA.bitsPerNucleotide)
			const cut = rand + rand_add
			// get first bits
			const set = remainder % (1n << cut)
			if (! first_set) first_set = [set, cut]
			// cut off first bits
			remainder = remainder >> rand

			for (let j = min_set; j <= max_set; j++) {
					// get first bits
				const l = BigInt(DNA.bitsPerNucleotide * j)
				const s = set % (1n << l)
				// console.log("set", {
				// 	r, rand, j, l, s: s.toString(2), set: set.toString(2), st: (set >> l).toString(2), ct: cut-l, cut
				// })
				sets[j][s] = sets[j][s] || []
				// cut off first bits
				sets[j][s].push([set >> l, cut - l])
			}
		}
		if (first_set === false) return dna;
		// console.log(sets, first_set)

		let [ret,n] = first_set
		let matched = true
		// max value for a number of bits
		const max = 1n << BigInt(this.#config.copy.max_dna_length)
		while (matched && ret < max){// && ret.length < this.#config.copy.max_dna_length) {
			// r++
			// if (r > string.length){
			// 	// console.error("TOO MANY RUNS A", ret, sets)
			// 	break;
			// }
			matched = false
			for (let m = max_set; m >= min_set; m--) {
				// get last bits
				const l = ret >> (n - BigInt(m * DNA.bitsPerNucleotide))
				// console.log("match", {
				// 	m, l, n, ls: l.toString(2), ret: ret.toString(2)
				// })
				const set = sets[m][l]
				if (set && !random.chance(this.#config.copy.match_failure_chance_inverse.base**(this.#config.copy.match_failure_chance_inverse.raise_offset+m-min_set))) {
					matched = true
					const i = random.index(set)
					const [v, shift] = set[i]
					// append bits to the start of a sequence
					ret += v << n
					n += shift
					if (!random.chance(this.#config.copy.match_remove_failure_chance_inverse)) {
						set.splice(i, 1)
						if (set.length === 0)
							delete sets[m][l]
					}
					break
				}
			}
		}
		// console.log("result", ret === dna,'\n', ret.toString(2),'\n',dna.toString(2))


		return ret

		/*
		                                              10101010101[0101]
		                            01101010100101010[1010]
		       10010101010101010101[0110]
		 01010[1001]

		{
			4: {
				0101: 10101010101,
				1010: 01101010100101010,
				0110: 10010101010101010101,
				1001: 01010
			}
		}

		                                                            101010101010101
		                                          01101010100101010[1010]
		                     10010101010101010101[0110]
		               01010[1001]
		...10101010101[0101]
		*/
	}
	scramble(
		dna/*: BigInt*/,
		random/*: Random*/ = this.#random
	)/*: BigInt*/ {
		const len = dna.toString(2).length
		// Return a heavilty mutated copy of the DNA with extra chunks thrown in and some removed
		return Array(this.#countGenes(dna)).fill(0).map(DNA.extractIndex)
		 .reduce(this.#scrambleGeneReduce, { sum: 0n, i: 0n, dna, random }).sum
	}
}
