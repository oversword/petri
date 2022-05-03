tester.test_class(() => DNA, '../DNA.js', () => Boolean(Random && Base))
.then(({ test, _class, describe }) => {
	// ############### Class Tests

	// static NUMBER_SET
	// static FILL_INFLATE
	// static FILL_CYCLE
	//
	// static defaultConfig
	// static bitsPerNucleotide
	// static defaultNucleotidesPerSequence
	// static defaultOrders
	// static defaultRandom
	//
	// static extractIndex(_,i)
	// static defaultWeightEntry(option)
	// static sum(sum, v)
	// static fillWeighted(acc, option)
	// static isObject(a)
	// static mergeObject(a, b)


//*

	// ############### Logic Tests

	const a =                      BigInt(0b01101100)
	const b =              BigInt(0b11110101)
	const c =      BigInt(0b00001110)
	const cb =     BigInt(0b0000111011110101)
	const cba =    BigInt(0b000011101111010101101100)
	const ba0 =            BigInt(0b111101010110110000000000)
	const cbaf1 =  BigInt(0b000011101011010101101100)
	const cbaf2 =  BigInt(0b000011100011010101101100)
	const bbb =                            BigInt(0b111101011111010111110101)
	const cbabbb = BigInt(0b000011101111010101101100111101011111010111110101)

	describe(`Logic tests`, ({ test, describe }) => {

		// append bits to the start of a sequence
		test(`Shifting and adding a number appends it to the start of a sequence`,
			(a + (b << 8n)) + (c << 16n) === cba)
		// generate 2 sets of data
		test(`Shifting and adding a number appends it to the start of a sequence`,
			(a << 8n) + (b << 16n) === ba0)

		// Slice out sequence bits
		test(`Shifting down and cutting slices out the middle byte`,
			(cba >> 8n) % (1n << 8n) === b)
		test(`Shifting down and cutting slices out the start byte`,
			(cba >> 16n) % (1n << 8n) === c)

		// get number of bytes
		test(`Estimate the correct number of bytes in a number`,
			Math.ceil(cba.toString(2).length / 8) === 3)
		test(`Estimate the correct number of bytes in a number`,
			Math.ceil(ba0.toString(2).length / 8) === 3)

		// generates 01 / 11
		const random = new Random()
		test(`Always generates the bits 01 or 11`,
			Array(100000).fill(0).every(() => {
				const v = (random.int0(2) * 2) + 1
				return v === 1 || v === 3
			}))

		test(`Flips both bits at index 14`, () => {
			const offset_change = BigInt(3) << BigInt(14)
			return (cba ^ offset_change) === cbaf2
		})
		test(`Flips one bit at index 14`, () => {
			const offset_change = BigInt(1) << BigInt(14)
			return (cba ^ offset_change) === cbaf1
		})

		// get first bits
		test(`Gets the first bits of a sequence`,
			(cba % (1n << 8n)) === a)

		// cut off first bits
		test(`Cut off the first bits of a sequence`,
			(cba >> 8n) === cb)

		// max value for a number of bits
		test(`Calculate max value for number of bits`,
			(1 << 10) === 0b10000000000)

		// get last bits
		test(`Get last bits from a sequence`,
			cba >> (24n - 8n) === c)

	})

//*/

	// ############### Instance Tests


	// __orders

	// __order_count
	// __random
	// __config
	// __nucleotidesPerSequence
	// __nucleotidesPerGene
	// __bitsPerSequence
	// __bitsPerSequenceN
	// __bitsPerGene
	// __bitsPerGeneN
	// __sequence_count
	// __sequence_countN
	//
	// __fillWeighted
	// __fillRepeated
	// __normaliseOrder
	//
	// constructor(
	// 	nucleotidesPerSequence = DNA.defaultNucleotidesPerSequence,
	// 	orders = DNA.defaultOrders,
	// 	random = DNA.defaultRandom,
	// 	config = DNA.defaultConfig
	// )



	describe(`Instance Tests`, ({ test, describe }) => {
		describe(`Private methods`, ({ test, describe }) => {
			describe(`DNA.#generateSequenceReduce`, ({ test, describe }) => {
				// __generateSequenceReduce
				test(`adds an element to the list`, () => {
					const _instance = new _class(2, [_class.NUMBER_SET,_class.NUMBER_SET], new Random())
					return _instance.__generateSequenceReduce({ list: [] }).list.length === 1
				})
				test(`adds a number to the list`, () => {
					const _instance = new _class(2, [_class.NUMBER_SET,_class.NUMBER_SET], new Random())
					return typeof _instance.__generateSequenceReduce({ list: [] }).list[0] === 'number'
				})
				test(`adds a number with the right number of bits`, () => {
					const _instance = new _class(2, [_class.NUMBER_SET,_class.NUMBER_SET], new Random())

					const v = _instance.__generateSequenceReduce({ list: [] }).list[0]
					return v >=0 || v < 16
				})
				test(`always adds a number with the right number of bits`, () => {
					const _instance = new _class(2, [_class.NUMBER_SET,_class.NUMBER_SET], new Random())
					return Array(100000).fill(0).every(() => {
						const v = _instance.__generateSequenceReduce({ list: [] }).list[0]
						return v >= 0n || v < 16n
					})
				})
				test(`uses the random gnerator provided`, () => {
					const _instance = new _class(2, [_class.NUMBER_SET,_class.NUMBER_SET], new Random())
					let ran = false
					_instance.__generateSequenceReduce({ list: [], random: {
						int0: () => {
							ran = true
							return 0
						}
					} })
					return ran
				})
			})

			describe(`DNA.#sumSequenceReduce`, ({ test, describe }) => {
				// __sumSequenceReduce
				test(`adds the second input to the start of the first input, shifted by the third`, () => {
					const _instance = new _class(4, [_class.NUMBER_SET,_class.NUMBER_SET], new Random())
					return _instance.__sumSequenceReduce(b, c, 1) === cb
				})
				test(`returns the second input if the others are 0`, () => {
					const _instance = new _class(4, [_class.NUMBER_SET,_class.NUMBER_SET], new Random())
					return _instance.__sumSequenceReduce(0n, a, 0) === a
				})
			})

			describe(`DNA.#getSequence`, ({ test, describe }) => {
				// __getSequence
				test(`returns nth sequence from the end`, () => {
					const _instance = new _class(4, [_class.NUMBER_SET,_class.NUMBER_SET,_class.NUMBER_SET], new Random())
					return _instance.__getSequence(cbabbb, 3) === Number(a)
				})
				test(`returns first sequence from the end`, () => {
					const _instance = new _class(4, [_class.NUMBER_SET,_class.NUMBER_SET,_class.NUMBER_SET], new Random())
					return _instance.__getSequence(cbabbb, 0) === Number(b)
				})
				test(`returns last sequence from the end`, () => {
					const _instance = new _class(4, [_class.NUMBER_SET,_class.NUMBER_SET,_class.NUMBER_SET], new Random())
					return _instance.__getSequence(cbabbb, 5) === Number(c)
				})
			})

			describe(`DNA.#getSequenceReduce`, ({ test, describe }) => {
				// __getSequenceReduce
				test(`adds an element to the list`, () => {
					const _instance = new _class(4, [_class.NUMBER_SET,_class.NUMBER_SET,_class.NUMBER_SET], new Random())
					return _instance.__getSequenceReduce({ list: [], dna: cbabbb, p: 3 }, null, 0).list.length === 1
				})
				test(`adds the specified sequence to the list`, () => {
					const _instance = new _class(4, [_class.NUMBER_SET,_class.NUMBER_SET,_class.NUMBER_SET], new Random())
					return _instance.__getSequenceReduce({ list: [], dna: cbabbb, p: 3 }, null, 0).list[0] === Number(a)
				})
				test(`adds the specified sequence to the list`, () => {
					const _instance = new _class(4, [_class.NUMBER_SET,_class.NUMBER_SET,_class.NUMBER_SET], new Random())
					return _instance.__getSequenceReduce({ list: [], dna: cbabbb, p: 3 }, null, 1).list[0] === Number(b)
				})
			})

			describe(`DNA.#getInstructionReduce`, ({ test, describe }) => {
				// __getInstructionReduce
				test(`adds an element to the list`, () => {
					const _instance = new _class(4, [_class.NUMBER_SET,_class.NUMBER_SET,_class.NUMBER_SET], new Random())
					return _instance.__getInstructionReduce({ list: [], dna: cbabbb, p: 1 }, _instance.__orders[0], 0).list.length === 1
				})
				test(`adds the specified sequence to the list`, () => {
					const _instance = new _class(4, [_class.NUMBER_SET,_class.NUMBER_SET,_class.NUMBER_SET], new Random())
					return _instance.__getInstructionReduce({ list: [], dna: cbabbb, p: 1 }, _instance.__orders[0], 0).list[0] === Number(a)
				})
				test(`adds the specified sequence to the list`, () => {
					const _instance = new _class(4, [_class.NUMBER_SET,_class.NUMBER_SET,_class.NUMBER_SET], new Random())
					return _instance.__getInstructionReduce({ list: [], dna: cbabbb, p: 1 }, _instance.__orders[0], 1).list[0] === Number(b)
				})
			})

			describe(`DNA.#getInstruction`, ({ test, describe }) => {
				// __getInstruction
				test(`adds the correct element to the list for each order for the first instruction`, () => {
					const _instance = new _class(4, [_class.NUMBER_SET,_class.NUMBER_SET,_class.NUMBER_SET], new Random())
					return tester.match_exact(_instance.__getInstruction(cbabbb, 0))([Number(b),Number(b),Number(b)])
				})
				test(`adds the correct element to the list for each order for the second instruction`, () => {
					const _instance = new _class(4, [_class.NUMBER_SET,_class.NUMBER_SET,_class.NUMBER_SET], new Random())
					return tester.match_exact(_instance.__getInstruction(cbabbb, 1))([Number(a),Number(b),Number(c)])
				})
			})

			describe(`DNA.#getGene`, ({ test, describe }) => {
					// __getGene
				test(`gets the first gene when specified`, () => {
					const _instance = new _class(4, [_class.NUMBER_SET,_class.NUMBER_SET,_class.NUMBER_SET], new Random())
					return _instance.__getGene(cbabbb, 0) === bbb
				})
				test(`gets the second gene when specified`, () => {
					const _instance = new _class(4, [_class.NUMBER_SET,_class.NUMBER_SET,_class.NUMBER_SET], new Random())
					return _instance.__getGene(cbabbb, 1) === cba
				})
			})

			describe(`DNA.#countGenes`, ({ test, describe }) => {
				// __countGenes
				test(`estimates the correct number of genes when there are mutltiple`, () => {
					const _instance = new _class(4, [_class.NUMBER_SET,_class.NUMBER_SET,_class.NUMBER_SET], new Random())
					return _instance.__countGenes(cbabbb) === 2
				})
				test(`estimates the correct number of genes when there is one`, () => {
					const _instance = new _class(4, [_class.NUMBER_SET,_class.NUMBER_SET,_class.NUMBER_SET], new Random())
					return _instance.__countGenes(cba) === 1
				})
				test(`rounds up the estimated number of genes when there is a incomplete gene`, () => {
					const _instance = new _class(4, [_class.NUMBER_SET,_class.NUMBER_SET,_class.NUMBER_SET], new Random())
					return _instance.__countGenes(cb) === 1
				})
			})
		})

		describe(`Public methods`, ({ test, describe }) => {
			describe(`DNA.generate`, ({ test, describe }) => {
				test(`generates a big int`, () => {
					const _instance = new _class(2, [_class.NUMBER_SET], new Random())
					const result = _instance.generate(1)
					return typeof result === 'bigint'
				})

				// Generates sequences of the right length
				test(`generates n sequences`, () => {
					const _instance = new _class(4, [_class.NUMBER_SET], new Random())
					const result = _instance.generate(45)
					return result.toString(2).length <= (45 * 8) && result.toString(2).length > (45 * 8) - 5
				})

				// Uses class random when none passed in
				test(`uses the random generator supplied at creation time if none is passed in`, () => {
					const random = new Random()
					const _instance = new _class(4, [_class.NUMBER_SET], random)
					random.float = () => {
						call_success = true
						return 0
					}
					let call_success = false
					const result = _instance.generate(4)
					return call_success
				})

				// Uses passed random when passed in
				test(`uses the random number generator passed in`, () => {
					const random = new Random()
					const _instance = new _class(4, [_class.NUMBER_SET], new Random())
					random.float = () => {
						call_success = true
						return 0
					}
					let call_success = false
					const result = _instance.generate(4, random)
					return call_success
				})
			})

			describe(`DNA.generateGene`, ({ test, describe }) => {
				test(`generates a big int`, () => {
					const _instance = new _class(2, [_class.NUMBER_SET], new Random())
					const result = _instance.generateGene()
					return typeof result === 'bigint'
				})
				// Generates sequences of the right length
				test(`generates a single gene of the correct length`, () => {
					const _instance = new _class(4, [_class.NUMBER_SET], new Random())
					const result = _instance.generateGene()
					return result.toString(2).length <= 8 && result.toString(2).length > 6
				})
				test(`generates a single gene of the correct length`, () => {
					const _instance = new _class(4, [_class.NUMBER_SET,_class.NUMBER_SET,_class.NUMBER_SET], new Random())
					const result = _instance.generateGene()
					return result.toString(2).length <= (8 * 3) && result.toString(2).length > (8 * 3) - 4
				})
				test(`generates a single gene of the correct length`, () => {
					const _instance = new _class(3, [_class.NUMBER_SET,_class.NUMBER_SET,_class.NUMBER_SET], new Random())
					const result = _instance.generateGene()
					return result.toString(2).length <= (6 * 3) && result.toString(2).length > (6 * 3) - 4
				})

				// Uses class random when none passed in
				test(`uses the random generator supplied at creation time if none is passed in`, () => {
					const random = new Random()
					const _instance = new _class(4, [_class.NUMBER_SET], random)
					random.float = () => {
						call_success = true
						return 0
					}
					let call_success = false
					const result = _instance.generateGene()
					return call_success
				})

				// Uses passed random when passed in
				test(`uses the random number generator passed in`, () => {
					const random = new Random()
					const _instance = new _class(4, [_class.NUMBER_SET], new Random())
					random.float = () => {
						call_success = true
						return 0
					}
					let call_success = false
					const result = _instance.generateGene(random)
					return call_success
				})
			})

			describe(`DNA.generateSequence`, ({ test, describe }) => {
				test(`always generates a number`, () => {
					const _instance = new _class(2, [_class.NUMBER_SET], new Random())
					const result = _instance.generateSequence()
					return typeof result === 'number'
				})

				// Generates sequences of the right size
				test(`always generates a number of the right size`, () => {
					const _instance = new _class(4, [_class.NUMBER_SET], new Random())
					return Array(100000).fill(0).every(() => {
						const result = _instance.generateSequence()
						return result >= 0 && result < 256
					})
				})

				// Uses class random when none passed in
				test(`uses the random generator supplied at creation time if none is passed in`, () => {
					const random = new Random()
					const _instance = new _class(4, [_class.NUMBER_SET], random)
					random.float = () => {
						call_success = true
						return 0
					}
					let call_success = false
					const result = _instance.generateSequence()
					return call_success
				})
				// Uses passed random when passed in
				test(`uses the random number generator passed in`, () => {
					const random = new Random()
					const _instance = new _class(4, [_class.NUMBER_SET], new Random())
					random.float = () => {
						call_success = true
						return 0
					}
					let call_success = false
					const result = _instance.generateSequence(random)
					return call_success
				})
			})

			describe(`DNA.mutate`, ({ test, describe }) => {
				// Returns bigint
				test(`always returns a big int`, () => {
					const _instance = new _class(2, [_class.NUMBER_SET], new Random())
					const result = _instance.mutate(3n, 0)
					return typeof result === 'bigint'
				})

				// Mutates DNA
				test(`always mutates the DNA`, () => {
					const random = new Random()
					const _instance = new _class(2, [_class.NUMBER_SET], random)
					return Array(100000).fill(0).every(() => {
						const input = BigInt(random.int(10000,50000))
						const result = _instance.mutate(input, random.int0(2))
						return input !== result
					})
				})

				// Mutates correct sequence
				test(`mutates the correct sequence`, () => {
					const random = new Random()
					const _instance = new _class(4, [_class.NUMBER_SET], random)
					const input = BigInt(random.int(10000,50000))
					const result = _instance.mutate(cba, 1)
					return result % 256n === a &&
									result >> 16n === c &&
									(result >> 8n) % 256n !== b
				})

				// Always flips one bit or 2 bits
				test(`always flips one or two bits`, () => {
					const random = new Random()
					const _instance = new _class(2, [_class.NUMBER_SET], random)
					return Array(100000).fill(0).every(() => {
						const input = BigInt(random.int(10000,50000))
						const result = _instance.mutate(input, random.int0(2))
						const flips = (input ^ result).toString(2).match(/1/g)
						return flips && (flips.length === 1 || flips.length === 2)
					})
				})

				// Uses class random when none passed in
				test(`uses the random generator supplied at creation time if none is passed in`, () => {
					const random = new Random()
					const _instance = new _class(4, [_class.NUMBER_SET], random)
					random.float = () => {
						call_success++
						return 0
					}
					let call_success = 0
					const input = BigInt(random.int(10000,50000))
					const result = _instance.mutate(input, 0)
					return call_success > 2
				})

				// Uses passed random when passed in
				test(`uses the random generator passed in`, () => {
					const random = new Random()
					const _instance = new _class(4, [_class.NUMBER_SET], new Random())
					random.float = () => {
						call_success++
						return 0
					}
					let call_success = 0
					const input = BigInt(random.int(10000,50000))
					const result = _instance.mutate(input, 0, random)
					return call_success > 2
				})
			})

			// read(
			// 	dna/*: BigInt*/,
			// 	pointer/*: Number*/ = 0,
			// 	random/*: Random*/ = this.#random
			// )
			// Returns instruction key

			// Returns specified instruction
			// If pointer is out of range it loops around
			// Mutates based on this.#config.read.mutation_rate_inverse
			// Returns mutated DNA key when mutated
			// Uses class random when none passed in
			// Uses passed random when passed in


			// copy(
			// 	dna/*: BigInt*/,
			// 	random/*: Random*/ = this.#random
			// )/*: BigInt*/
			// Returns a bigint
			// Uses class random when none passed in
			// Uses passed random when passed in
			// Copies exactly


			// __scrambleGeneReduce
			// scramble(
			// 	dna/*: BigInt*/,
			// 	random/*: Random*/ = this.#random
			// )/*: BigInt*/

			// decode(dna/*: BigInt*/)

			// engineer(
			// 	instructions,
			// 	random/*: Random*/ = this.#random
			// )/*: BigInt*/

		})
	})

})
