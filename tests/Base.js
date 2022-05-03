tester.test_class(() => Base, '../Base.js')
.then(({ test, describe, test_error, _class }) => {

	// ############### Class Tests

	describe(`Class tests`, ({ test, describe, test_error }) => {
		// default base is rational
		test('Default base must be a number',
			typeof _class.defaultBase === 'number')
		test('Default base must be 2 or bigger',
			_class.defaultBase >= 2)
		test('Default base must be an integer',
			Math.floor(_class.defaultBase) === _class.defaultBase)


		const unique_object = {unique_object:true}
		const another_object = {another_object:4}

		// extractIndex returns correctly
		test(`Base.extractIndex returns the second argument`,
			_class.extractIndex(another_object, unique_object) === unique_object)

		// indexSet returns correctly
		const _index_set = _class.indexSet(another_object, unique_object)
		test(`Base.indexSet returns both arguments as a list`,
			Array.isArray(_index_set) &&
			_index_set[0] === another_object && _index_set[1] === unique_object)

		describe(`generates all default values`, ({ test, describe, test_error }) => {
			const _instance_1 = new _class()
			// default generator handles all from default base
			const seen_before = {}
			for (let v=0; v<_class.defaultBase; v++) {
				describe(`${v} has default value`, ({ test, describe, test_error }) => {
					const symb = _instance_1.__defaultGenerator(v)
					test(`Default generator provides a value for ${v} in default base`,
						typeof symb !== 'undefined')
					test(`Default generator provides a string value for ${v} in default base`,
						typeof symb === 'string')
					test(`Default generator provides a unique symbol for ${v} in default base`,
						!(symb in seen_before))
					seen_before[symb] = v
				})
			}
		})

	})


	// ############### Instance Tests

	describe(`Instance tests`, ({ test, describe, test_error }) => {
		describe(`Instance construction`, ({ test, describe, test_error }) => {
			describe(`First argument`, ({ test, describe, test_error }) => {
					// constructor checks things
				test_error(`Throw an error when given a non-number base`, () => {
					new _class({})
				}, TypeError)

				test_error(`Throw an error when given a base less than 2`, () => {
					new _class(1)
				}, RangeError)

				// constructor sets base
				const _instance_2 = new _class()
				test(`Use the default base if none is passed in`,
					_instance_2.__base === _class.defaultBase)
				test(`Use the default base if none is passed in`,
					_instance_2.base === _class.defaultBase)

				const _instance_3 = new _class(4)
				test(`Set the base when it is passed in`,
					_instance_3.__base === 4)
				test(`Set the base when it is passed in`,
					_instance_3.base === 4)
			})

			// TODO: also test passing undefined/null acts like empty and still sets the generator

			describe(`Second argument`, ({ test, describe, test_error }) => {
				// constructor checks things
				test_error(`Throw an error when given a non-function generator`,() => {
					new _class(8, 5)
				}, TypeError)

				describe(`Creates set`, ({ test, describe, test_error }) => {
					// constructor sets generator
					if (_class.defaultBase === 10) {
						const _instance_4 = new _class()
						test(`Generated the default private set when no base is passed in`,
							_instance_4.__set.join('') === '0123456789')
						test(`Generated the default public set when no base is passed in`,
							_instance_4.set.join('') === '0123456789')
					} else console.warn(`Cannot statically test this, add your own case`)

					const _instance_5 = new _class(4)
					test(`Generated the default private set when a base is passed in`,
						_instance_5.__set.join('') === '0123')
					test(`Generated the default public set when a base is passed in`,
						_instance_5.set.join('') === '0123')

					const _instance_6 = new _class(4, (i) => 'GK*5'[i])
					test(`Generated the private set when a generator is passed in`,
						_instance_6.__set.join('') === 'GK*5')
					test(`Generated the public set when a generator is passed in`,
						_instance_6.set.join('') === 'GK*5')

					test(`Private set is not identical to public set`,
						_instance_6.__set !== _instance_6.set)
				})

				describe(`Creates index`, ({ test, describe, test_error }) => {
					// constructor sets index
					if (_class.defaultBase === 10) {
						const _instance_7 = new _class()
						test(`Generated the default private index when no base is passed in`,
							tester.match_exact({
								0:0, 1:1, 2:2, 3:3, 4:4,
								5:5, 6:6, 7:7, 8:8, 9:9,
							})(_instance_7.__index))
						test(`Generated the default public index when no base is passed in`,
							tester.match_exact({
								0:0, 1:1, 2:2, 3:3, 4:4,
								5:5, 6:6, 7:7, 8:8, 9:9,
							})(_instance_7.index))
					} else console.warn(`Cannot statically test this, add your own case`)

					const _instance_8 = new _class(4)
					test(`Generated the default private set when a base is passed in`,
						tester.match_exact({
							0:0, 1:1, 2:2, 3:3,
						})(_instance_8.__index))
					test(`Generated the default public set when a base is passed in`,
						tester.match_exact({
							0:0, 1:1, 2:2, 3:3,
						})(_instance_8.index))

					const _instance_9 = new _class(4, (i) => 'GK*5'[i])
					test(`Generated the private index when a generator is passed in`,
						tester.match_exact({
							G:0, K:1, '*':2, 5:3,
						})(_instance_9.index))
					test(`Generated the public index when a generator is passed in`,
						_instance_9.set.join('') === 'GK*5')

					test(`Private index is not identical to public index`,
						_instance_9.__index !== _instance_9.index)
				})
			})
		})

		describe(`Base.number`, ({ test, describe, test_error }) => {
			// number returns correctly
			const _instance_10 = new _class(4, (i) => 'GK*5'[i])
			test(`turns the first symbol into 0`,
				_instance_10.number('G') === 0)
			test(`turns the second symbol into 1`,
				_instance_10.number('K') === 1)
			test(`turns the third symbol into 2`,
				_instance_10.number('*') === 2)
			test(`turns the fourth symbol into 3`,
				_instance_10.number('5') === 3)
			test(`returns undefined for an out of range input`,
				_instance_10.number('p') === undefined)
		})

		describe(`Base.string`, ({ test, describe, test_error }) => {
			// string returns correctly
			const _instance_11 = new _class(4, (i) => 'GK*5'[i])
			test(`turns the number 0 into the correct string`,
				_instance_11.string(0) === 'G')
			test(`turns the number 1 into the correct string`,
				_instance_11.string(1) === 'K')
			test(`turns the number 2 into the correct string`,
				_instance_11.string(2) === '*')
			test(`turns the number 3 into the correct string`,
				_instance_11.string(3) === '5')
			test(`returns undefined for an out of range input`,
				_instance_11.string(4) === undefined)
		})
	})

})
