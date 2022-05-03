class Neural {
	static extractIndex(_,i) { return i }
	static indexList(pass, v, i) {
		pass.ret[pass.ref[i]] = v
		return pass
	}
	static addVS(vector, scalar) {
		return vector.map(v => v + scalar)
	}
	static maxLayer([,layer]) { return layer }
	static layerIndexToList(list, [id,layer]) {
		list[layer] = list[layer] || {}
		list[layer][id] = true
		return list
	}

	static sumSignals(pass, [other_id, connection_id]) {
		pass.sum += pass.pass.env.connections[connection_id].val * pass.pass.node_vals[other_id]
		return pass
	}
	static sumNode(pass, id) {
		pass.node_input_vals[id] = Object
			.entries(pass.env.rat.indexed_connections.rev_id[id])
			.reduce(Neural.sumSignals, { sum: 0, pass }).sum
		pass.node_vals[id] = Neural.sigmoid(pass.env.nodes[id], pass.node_input_vals[id])
		return pass
	}
	static sumLayer(pass, layer) {
		return Object.keys(layer).reduce(Neural.sumNode, pass)
	}
	static sumErrors(pass, [other_id,connection_id]) {
		const new_val = pass.pass.env.connections[connection_id].val + (pass.proportion * pass.pass.node_err[other_id])
		pass.pass.env.connections[connection_id].val = new_val
		// if (!(other_id in pass.pass.node_err))
		// 	console.error('aa',other_id, connection_id, DNA.mergeObject({}, pass))
		pass.sum += pass.pass.node_err[other_id] * new_val
		return pass
	}
	static sumNodeErrors(pass, id) {
		pass.node_err[id] = Object
			.entries(pass.env.rat.indexed_connections.id[id] || {})
			.reduce(Neural.sumErrors, { pass, sum: 0, proportion: pass.config.learn_rate * pass.node_vals[id] })
			.sum * Neural.sigmoidReverse(pass.env.nodes[id], pass.node_input_vals[id], pass.node_vals[id])
		return pass
	}
	static sumLayerErrors(pass, layer) {
		return Object.keys(layer).reduce(Neural.sumNodeErrors, pass)
	}
	static getErrors(pass, v, i) {
		const I = pass.env.outputs[i]
		const val = I in pass.node_vals ? pass.node_vals[I] : (1 - Math.round(v))
		const err = v - val
		pass.total_err += Math.abs(err)
		if (I in pass.node_input_vals)
			pass.node_err[I] = err * Neural.sigmoidReverse(pass.env.nodes[I], pass.node_input_vals[I], val)
		return pass
	}

	static sigmoid(config, x) {
		return config.sigmoid.forward(config, x)
	}
	static sigmoidReverse(config, x, y) {
		return config.sigmoid.backward(config, x, y)
	}
	static rationalise({ nodes, indexed_connections, connections, inputs, outputs }) {
		// console.log(r)
		// start from outputs
		// get all that connect backward
		const layers = {}

		// console.log(inputs, outputs, r)
		const output_visited = {}
		const output_visited_connections = {}
		let layer = [...outputs]
		while (layer.length) {
			const new_layer = {}
			layer.forEach(id => {
				output_visited[id] = true
				// Stop at inputs
				if (inputs.includes(id)) return
				const rev_cons = indexed_connections.rev_id[id]
				if (!rev_cons) return;
				const is_output = outputs.includes(id)
				Object.entries(rev_cons).forEach(([other_id, connection_id]) => {
					if (output_visited[other_id]) return;
					// Don't connect outputs to outputs
					if (is_output && outputs.includes(other_id)) return;

					output_visited_connections[connection_id] = true
					new_layer[other_id] = true
				})
			})
			layer = Object.keys(new_layer)
		}
		// start from inputs
		// add nodes and connections to ret as they are known to be valid (also fakes)

		const input_visited = {}
		const input_visited_connections = {}
		let layer_count = 0
		layer = [...inputs]
		while (layer.length) {
			const new_layer = {}
			layer.forEach(id => {
				if (!output_visited[id]) return;
				layers[id] = layer_count
				// if (input_visited[id]) return;
				input_visited[id] = true
				if (outputs.includes(id)) return;
				const cons = indexed_connections.id[id]
				if (!cons) return;
				Object.entries(cons).forEach(([other_id, connection_id]) => {
					if (!output_visited[other_id]) return;
					if (!output_visited_connections[connection_id]) return;
					// if (input_visited_connections[connection_id]) return;
					if (inputs.includes(other_id)) return;
					input_visited_connections[connection_id] = true
					new_layer[other_id] = true
				})
			})
			layer_count++
			layer = Object.keys(new_layer)
		}
		const output_layers = Object.entries(layers)
			.filter(([id]) => outputs.includes(id))
		const max_out = Math.max(...output_layers.map(Neural.maxLayer))
		output_layers.forEach(([id]) => {
			layers[id] = max_out
		})
		const layer_list = Object.entries(layers).reduce(Neural.layerIndexToList, [])

		let inputs_found = 0
		let outputs_found = 0
		for (const i of inputs) {
			if (i in layers)
				inputs_found++
		}
		for (const i of outputs) {
			if (i in layers)
				outputs_found++
		}
		return {
			connections: input_visited_connections,
			indexed_connections: {
				id: Object.keys(input_visited_connections).reduce((pass, connection_id) => {
					const connection = connections[connection_id]
					pass[connection.in] = pass[connection.in] || {}
					pass[connection.in][connection.out] = connection_id
					return pass
				}, {}),
				rev_id: Object.keys(input_visited_connections).reduce((pass, connection_id) => {
					const connection = connections[connection_id]
					pass[connection.out] = pass[connection.out] || {}
					pass[connection.out][connection.in] = connection_id
					return pass
				}, {})
			},
			index: layers,
			list: layer_list.slice(0, max_out+1),
			connected: inputs_found !== 0 && outputs_found !== 0,
			inputs: inputs_found,
			outputs: outputs_found,
			allputs: inputs_found + outputs_found
		}
	}

	static run(env, test_case, config = { learn_rate: 0.5 }) {
		const forward = Neural.forward(env, test_case[0])
		return Neural.backward(env, forward, test_case[1], config)
	}

	static forward(env, inputs) {
		return env.rat.list
			.slice(1)
			.reduce(Neural.sumLayer, {
				env,
				node_vals: inputs.reduce(Neural.indexList, { ref: env.inputs, ret: {} }).ret,
				node_input_vals: {}
			})
	}

	static backward(env, forward, outputs, config = { learn_rate: 0.5 }) {

		const { total_err, node_err } = outputs.reduce(Neural.getErrors, {
			env,
			node_err: {},
			total_err: 0,
			node_vals: forward.node_vals,
			node_input_vals: forward.node_input_vals,
		})

		const __ = env.rat.list
			.slice(0, -1)
			.reverse()
			.reduce(Neural.sumLayerErrors, {
				config, env, node_err,
				node_vals: forward.node_vals,
				node_input_vals: forward.node_input_vals,
			})

		return total_err
	}
}
