tester.test_class(() => Random, './../Random.js', () => Base)
.then(({ test, describe, _class }) => {

	const distribute = (generator, segment_size = 1) => {
		// Is the distribution (roughly) even over all the segments?
		const repeats = 100000
		const occurences = Array(repeats).fill(0).reduce((pass) => {
			const v = generator()
			const segment = Math.floor(v / segment_size)
			pass[segment] = (pass[segment] || 0)+1
			return pass
		}, {})
		// TODO: check for consistently spaced segments
		const vals = Object.values(occurences)
		const expected = repeats / vals.length
		const diffs = vals.map((val) => {
			return Math.abs(expected - val) / expected
		})

		// TODO: this threshold is related to the number of attempts you do and the number of segments produced
		return Math.max(...diffs) < 0.02
	}



	// ############### Class Tests

	describe(`Class Tests`, ({ test, describe }) => {
		// default initial seed is rational
		test(`Default initial seed is a number`,
			typeof _class.defaultInitialSeed === 'number')

		// default string base is a base
		test(`Default string base is a Base class`,
			_class.defaultStringBase instanceof Base)
	})



	// ############### Instance Tests

	describe(`Instance Tests`, ({ test, describe }) => {
		describe(`Instance Construction`, ({ test, describe }) => {
			// constructor sets initial seed
			const _instance_1 = new _class()
			test(`The initial seed is set to the default initial seed when none is passed`,
				_instance_1.__initialSeed === _class.defaultInitialSeed)

			const _instance_2 = new _class(4724)
			test(`The initial seed is set to the given initial seed when one is passed`,
				_instance_2.__initialSeed === 4724)

			// constructor sets seed
			const _instance_3 = new _class()
			test(`The seed is set to the default initial seed when none is passed`,
				_instance_3.__seed === _class.defaultInitialSeed)

			const _instance_4 = new _class(4724)
			test(`The seed is set to the given initial seed when one is passed`,
				_instance_4.__seed === 4724)
		})

		describe(`Random.float`, ({ test, describe }) => {
			// returns a floating point number between 0 and 1
			const _instance_5 = new _class(55)
			test(`always returns a number between 1 and 0`,
				Array(100000).fill(0).every(() => {
					const v = _instance_5.float()
					return v > 0 && v < 1
				}))

			// has an even distribution
			const _instance_6 = new _class(66)
			test(`has an even distribution`,
				distribute(() => _instance_6.float(), 0.1))
		})

		describe(`Random.int`, ({ test, describe }) => {
			// returns an integer between min(inclusive) and max(exclusive)
			const _instance_7 = new _class(77)
			test(`always returns an integer between min and max`,
				Array(100000).fill(0).every(() => {
					const v = _instance_7.int(7, 17)
					return v >= 7 && v < 17 && Math.floor(v) === v
				}))
			// has an even distribution
			const _instance_8 = new _class(88)
			test(`has an even distribution`,
				distribute(() => _instance_8.int(8, 18), 1))
		})

		describe(`Random.inti`, ({ test, describe }) => {
			// returns an integer between min(inclusive) and max(inclusive)
			const _instance_9 = new _class(99)
			test(`always returns an integer between min and max`,
				Array(100000).fill(0).every(() => {
					const v = _instance_9.inti(9, 19)
					return v >= 9 && v <= 19 && Math.floor(v) === v
				}))
			// has an even distribution
			const _instance_10 = new _class(110)
			test(`has an even distribution`,
				distribute(() => _instance_10.inti(10, 20), 1))
		})

		describe(`Random.int0`, ({ test, describe }) => {
			// Random.int0 returns an integer between 0(inclusive) and max(exclusive)
			const _instance_11 = new _class(121)
			test(`Random.int0 always returns an integer between 0 and max`,
				Array(100000).fill(0).every(() => {
					const v = _instance_11.int0(11)
					return v >= 0 && v < 11 && Math.floor(v) === v
				}))
			// Random.int0 has an even distribution
			const _instance_12 = new _class(132)
			test(`has an even distribution`,
				distribute(() => _instance_12.int0(12), 1))
		})

		// returns a possible index of the given list

		const unique_object = {unique_object:true}
		const another_object = {another_object:4}
		const third_thing = {third_thing:'hams'}
		const test_list = [unique_object,another_object,third_thing]

		describe(`Random.index`, ({ test, describe }) => {
			const _instance_13 = new _class(143)
			test(`always returns an integer between 0 and the length of the list`,
				Array(100000).fill(0).every(() => {
					const v = _instance_13.index(test_list)
					return v >= 0 && v < test_list.length && Math.floor(v) === v
				}))
			// has an even distribution
			const _instance_14 = new _class(154)
			test(`has an even distribution`,
				distribute(() => _instance_14.index(test_list), 1))
		})

		describe(`Random.item`, ({ test, describe }) => {
			// returns an item of the given list
			const _instance_15 = new _class(165)
			test(`always returns an item from the list`,
				Array(100000).fill(0).every(() => {
					const v = _instance_15.item(test_list)
					return test_list.includes(v)
				}))
			// has an even distribution
			const _instance_16 = new _class(176)
			test(`has an even distribution`,
				distribute(() => test_list.indexOf(_instance_16.item(test_list)), 1))
		})

		describe(`Random.string`, ({ test, describe }) => {
			// returns a string of the given length
			const _instance_17 = new _class(187)
			test(`returns a string`,
				typeof _instance_17.string(17) === 'string')

			const _instance_18 = new _class(198)
			test(`returns a string of the given length`,
				_instance_18.string(18).length === 18)
			// uses the base passed as the second argument
			const _instance_19 = new _class(209)
			test(`uses the base passed in`,
				_instance_19.string(1900, new Base(6)).match(/^[0-5]{1900}$/))
			const _instance_20 = new _class(220)
			test(`has an even distribution`,
				distribute(() => _instance_20.string(1), 1))
		})

		describe(`Random.chance`, ({ test, describe }) => {
			// Random.chance returns only true or false
			const _instance_21 = new _class(231)
			test(`Random.chance always returns true or false`,
				Array(100000).fill(0).every(() => {
					const v = _instance_21.chance(_instance_21.int(2, 10000))
					return v === true || v === false
				}))
			// Random.chance returns true roughly as often as it should
			const _instance_22 = new _class(242)
			test(`Random.chance returns true 1 in 50 times when 50 is given`,
				Math.abs((Array(100000).fill(0)
					.filter(() => _instance_22.chance(50))
					.length/100000) - (1/50)) < 0.001
				)
		})

		describe(`Random.reset`, ({ test, describe }) => {
			// Resetting the generator produces the same numbers every time
			test(`The generator produces the same set of numbers each time it is reset`, () => {
				const _instance_23 = new _class(253)
				const reference_list = Array(1000).fill(0).map(() => _instance_23.float())
				for (let i=0; i<100; i++) {
					_instance_23.reset()
					const new_list = Array(1000).fill(0).map(() => _instance_23.float())
					if (!tester.match_exact(reference_list, new_list))
						return false
				}
				return true
			})
		})
	})
})
