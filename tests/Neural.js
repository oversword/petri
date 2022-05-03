tester.test_class(() => Neural, '../Neural.js')
.then(({ test, describe, _class }) => {
	// ############### Class Tests

	const unique_object = {unique_object:true}
	const another_object = {another_object:4}

	describe(`Untility Functions`, ({ test, describe }) => {
		test(`Neural.extractIndex returns the second argument`,
			_class.extractIndex(another_object, unique_object) === unique_object)

		test(`Neural.indexList should add the right key to the return value`,
			_class.indexList({ret:{},ref:['a','b','c','d','thisone','f']}, unique_object, 4).ret.thisone === unique_object)

		test(`Neural.addVS adds the second argument to every element of the first`,
			tester.match_exact(_class.addVS([-4,1000,'f',18], 22))([18,1022,'f22',40]))

		test(`Neural.maxLayer returns the second element of the first argumment`,
			_class.maxLayer([unique_object,another_object]) === another_object)

		test(`Neural.layerIndexToList returns a list with an object containing the id=true`,
			tester.match_exact(_class.layerIndexToList([], ['unique_id',6])[6])({unique_id:true}))
	})

	describe(`Forward Propigation`, ({ test, describe }) => {
		test(`Neural.sigmoid runs the given sigmod function with the correct arguments`, () => {
			const x = {x:true}
			let call_success = false
			const config = {
				sigmoid: {
					forward: (c, a) => {
						call_success = c === config && a === x
					}
				}
			}
			Neural.sigmoid(config, x)
			return call_success
		})


		test(`Neural.sumSignals adds the connection weight * the node value to the sum`,
			_class.sumSignals({
				sum: 32,
				pass: {
					node_vals: {
						8: 94,
					},
					env: {
						connections: {
							5: {
								val: 44
							}
						}
					}
				}
			}, [8, 5]).sum === 32 + (44 * 94))

		test(`Neural.sumNode calls the sigmod function of the node with the correct arguments`, () => {
			let call_success = false
			const node = {
				sigmoid: {
					forward: (c, x) => {
						if (c === node && x === 44 * 94)
							call_success = true
						return 47
					}
				}
			}
			const result = _class.sumNode({
				node_input_vals: {},
				node_vals: {
					8: 94,
				},
				env: {
					nodes: {
						unique_id: node
					},
					indexed_connections: {
						rev_id: {
							unique_id: {
								8: 5
							}
						},
						id: {
							8: {
								unique_id: 5
							}
						}
					},
					rat: {
						indexed_connections: {
							rev_id: {
								unique_id: {
									8: 5
								}
							},
							id: {
								8: {
									unique_id: 5
								}
							}
						}
					},
					connections: {
						5: {
							val: 44
						}
					}
				}
			}, 'unique_id')
			return call_success
		})

		test(`Neural.sumNode sets the extected input value for the node`, () => {
			const node = {
				sigmoid: {
					forward: (c, x) => {
						return 47
					}
				}
			}
			const result = _class.sumNode({
				node_input_vals: {},
				node_vals: {
					8: 94,
				},
				env: {
					nodes: {
						unique_id: node
					},
					indexed_connections: {
						rev_id: {
							unique_id: {
								8: 5
							}
						},
						id: {
							8: {
								unique_id: 5
							}
						}
					},
					rat: {
						indexed_connections: {
							rev_id: {
								unique_id: {
									8: 5
								}
							},
							id: {
								8: {
									unique_id: 5
								}
							}
						}
					},
					connections: {
						5: {
							val: 44
						}
					}
				}
			}, 'unique_id')
			return result.node_input_vals.unique_id === 44 * 94
		})

		test(`Neural.sumNode sets the expected value for the node`, () => {
			const node = {
				sigmoid: {
					forward: (c, x) => {
						return 47
					}
				}
			}
			const result = _class.sumNode({
				node_input_vals: {},
				node_vals: {
					8: 94,
				},
				env: {
					nodes: {
						unique_id: node
					},
					indexed_connections: {
						rev_id: {
							unique_id: {
								8: 5
							}
						},
						id: {
							8: {
								unique_id: 5
							}
						}
					},
					rat: {
						indexed_connections: {
							rev_id: {
								unique_id: {
									8: 5
								}
							},
							id: {
								8: {
									unique_id: 5
								}
							}
						}
					},
					connections: {
						5: {
							val: 44
						}
					}
				}
			}, 'unique_id')
			return result.node_vals.unique_id === 47
		})

		test(`Neural.sumLayer should add the right values to the passed object`, () => {
		const node = {
			sigmoid: {
				forward: (c, x) => {
					return 47
				}
			}
		}
		const other_node = {
			sigmoid: {
				forward: (c, x) => {
					return 28
				}
			}
		}
		const result = _class.sumLayer({
			node_input_vals: {},
			node_vals: {
				8: 94,
				9: 95,
			},
			env: {
				nodes: {
					unique_id: node,
					other_id: other_node
				},
				indexed_connections: {
					rev_id: {
						unique_id: {
							8: 5,
							9: 6,
						},
						other_id: {
							8: 8,
							9: 9,
						}
					},
					id: {
						8: {
							unique_id: 5,
							other_id: 8,
						},
						9: {
							unique_id: 6,
							other_id: 9,
						}
					}
				},
				rat: {
					indexed_connections: {
						rev_id: {
							unique_id: {
								8: 5,
								9: 6,
							},
							other_id: {
								8: 8,
								9: 9,
							}
						},
						id: {
							8: {
								unique_id: 5,
								other_id: 8,
							},
							9: {
								unique_id: 6,
								other_id: 9,
							}
						}
					}
				},
				connections: {
					5: {
						val: 44
					},
					6: {
						val: 45
					},
					8: {
						val: 83
					},
					9: {
						val: 84
					}
				}
			}
		}, { unique_id: true, other_id: true })


		return (
			result.node_input_vals.unique_id === (44 * 94) + (45 * 95) &&
			result.node_input_vals.other_id === (83 * 94) + (84 * 95) &&
			result.node_vals.unique_id === 47 &&
			result.node_vals.other_id === 28
		)
	})

		/*
		test(`Neural.forward`, () => {
			forward(env, inputs)
		})
		test(`Neural.forward`, () => {

		})
		test(`Neural.forward`, () => {

		})
		test(`Neural.forward`, () => {

		})
		test(`Neural.forward`, () => {

		})
		test(`Neural.forward`, () => {

		})
		test(`Neural.forward`, () => {

		})
		*/
	})

	describe(`Backward Propigation`, ({ test, describe }) => {
		test(`Neural.sumErrors should increment the sum correclt and modify the connection weight`, () => {
			const result = _class.sumErrors({
				proportion: 25,
				sum: 346,
				pass: {
					env: {
						connections: {
							connection_id: {
								val: 46
							}
						}
					},
					node_err: {
						unique_id: 36
					}
				}
			}, ['unique_id','connection_id'])
			return (
				result.sum === 346 + (36 * (46 + (25 * 36))) &&
				result.pass.env.connections.connection_id.val === 46 + (25 * 36)
			)
		})

		test(`Neural.sumNodeErrors sums up the errors for a node correctly`, () => {
			let call_success = false
			const node = {
				sigmoid: {
					backward: (n, x, y) => {
						if (n === node && x === 9 && y === 17)
							call_success = true
						return 5
					}
				}
			}
			const result = _class.sumNodeErrors({
				config: {
					learn_rate: 3
				},
				env: {
					nodes: {
						unique_id: node
					},
					rat: {
						indexed_connections: {
							id: {
								unique_id: {
									other_id: 'connection_id',
									another_id: 'connection_id2',
								}
							}
						}
					},
					connections: {
						connection_id: {
							val: 46
						},
						connection_id2: {
							val: 28
						}
					}
				},
				node_input_vals: {
					unique_id: 9,
				},
				node_vals: {
					unique_id: 17,
				},
				node_err: {
					other_id: 36,
					another_id: 38
				}
			}, 'unique_id')

			return result.node_err.unique_id === ((36 * (46 + (17 * 3 * 36))) + (38 * (28 + (17 * 3 * 38)))) * 5
		})

		test(`Neural.sumLayerErrors sums up the errors for a node correctly`, () => {
			let call_success = false
			let call_success2 = false
			const node = {
				sigmoid: {
					backward: (n, x, y) => {
						if (n === node && x === 9 && y === 17)
							call_success = true
						if (n === node && x === 3 && y === 20)
							call_success2 = true
						return 5
					}
				}
			}
				// sumLayerErrors(pass, layer)
			const result = _class.sumLayerErrors({
				config: {
					learn_rate: 3
				},
				env: {
					nodes: {
						unique_id: node,
						some_id: node,
					},
					rat: {
						indexed_connections: {
							id: {
								unique_id: {
									other_id: 'connection_id',
									another_id: 'connection_id2',
								},
								some_id: {
									other_id: 'connection_id3',
									another_id: 'connection_id4',
								}
							}
						}
					},
					connections: {
						connection_id: {
							val: 46
						},
						connection_id2: {
							val: 28
						},
						connection_id3: {
							val: 23
						},
						connection_id4: {
							val: 5
						}
					}
				},
				node_input_vals: {
					unique_id: 9,
					some_id: 3,
				},
				node_vals: {
					unique_id: 17,
					some_id: 20,
				},
				node_err: {
					other_id: 36,
					another_id: 38
				}
			}, { unique_id: true, some_id: true })

			return (
				call_success && call_success2 &&
				result.node_err.unique_id === ((36 * (46 + (17 * 3 * 36))) + (38 * (28 + (17 * 3 * 38)))) * 5 &&
				result.node_err.some_id   === ((36 * (23 + (20 * 3 * 36))) + (38 * (5 + (20 * 3 * 38)))) * 5
			)
		})

		test(`Neural.getErrors gets the error for an output node`, () => {
			let call_success = false
			const node = {
				sigmoid: {
					backward: (n, x, y) => {
						if (n === node && x === 31 && y === 67)
							call_success = true
						return 5
					}
				}
			}
			const result = Neural.getErrors({
				env: {
					nodes: {
						unique_id: node
					},
					outputs: ['unique_id']
				},
				total_err: 654,
				node_input_vals: {
					unique_id: 31
				},
				node_vals: {
					unique_id: 67
				},
				node_err: {}
			}, 100, 0)

			return(
				call_success &&
				result.total_err === 654 + (100 - 67) &&
				result.node_err.unique_id === (100 - 67) * 5
			)
		})


		test(`Neural.sigmoidReverse runs the given reverse sigmod function with the correct arguments`, () => {
			const x = {x:true}
			const y = {y:true}
			let call_success = false
			const config = {
				sigmoid: {
					backward: (c, a, b) => {
						call_success = c === config && a === x && b === y
					}
				}
			}
			Neural.sigmoidReverse(config, x, y)
			return call_success
		})

		/*
		backward(env, forward, outputs, config = { learn_rate: 0.5 })
		*/
	})


/*

	rationalise({ nodes, indexed_connections, connections, inputs, outputs })

	run(env, test_case, config = { learn_rate: 0.5 })

	*/
})
