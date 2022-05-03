class DNA_Neural {
	static sigmoids = {
		logistic: {
			name: 'logistic',
			forward: (config, x) =>
				(config.ym / (1 + Math.exp(-1 * ((x * config.xm) + config.xc)))) + config.yc,
			backward: (config, x, y) =>
				config.xm * config.ym * y * (1 - y),
		},
		arctan: {
			name: 'arctan',
			forward: (config, x) =>
				(config.ym * Math.atan((config.xm * x) + config.xc)) + config.yc,
			backward: (config, x, y) =>
				// re-arranges to: y^2 / x^2, not useful
				config.xm * config.ym / Math.pow(1 + Math.abs((config.xm * x) + config.xc), 2),
		},
		softsign: {
			name: 'softsign',
			forward: (config, x) => {
				const X = (config.xm * x) + config.xc
				return (config.ym * X / (1 + Math.abs(X))) + config.yc
			},
			backward: (config, x, y) =>
				config.xm * config.ym / ((((config.xm * x) + config.xc)**2) + 1),
		}
	}

	static new() {
		return {
			nodes: {},
			// TODO: index inputs & outputs to avoid doing Array.includes all the time?
			inputs: [],
			outputs: [],
			connections: {},
			indexed_connections: {
				id: {},
				rev_id: {}
			},
			node_id: 0,
			connection_id: 0,
			_class: DNA_Neural
		}
	}

	static handleResult(env, result) {
		if (!env.rat || (result && result.changed))
			env.rat = Neural.rationalise(env)
	}

	static random = new Random() // Provides initial noise for connections

	static normalise_val(val) {
		/* Input: 0 <= val <= 255 (linear)
		 * Otuput: -16.25625 <= ret <= 16.25625 (squared, centered)
		 *
		 * Allow weights to be set between about -16 and 16
		 * Following a x**2 curve to allow more detail in small values
		 * Centered about 0 (equal chance of being positive or negative)
		*/

		const med = val - 127.5
		return Math.sign(med) * (Math.abs(med) ** 2) / 1000
	}

	static add_input(env) {
		const id = String(env.node_id)
		DNA_Neural.add_node_logistic(env, 180, 100)
		env.inputs.push(id)
		return id
	}
	static remove_input(env, id) {
		const i = env.inputs.indexOf(id)
		if (i === -1) return;
		env.inputs.splice(i, 1)
		return DNA_Neural.remove_node(env, id)
	}
	static add_output(env) {
		const id = String(env.node_id)
		DNA_Neural.add_node_logistic(env, 180, 100)
		env.outputs.push(id)
		return id
	}
	static remove_output(env, id) {
		const i = env.outputs.indexOf(id)
		if (i === -1) return;
		env.outputs.splice(i, 1)
		return DNA_Neural.remove_node(env, id)
	}

	static add_node_logistic(env, val1, val2) {
		const v1 = val1-127.5
		env.nodes[env.node_id] = {
			sigmoid: DNA_Neural.sigmoids.logistic,
			// xc: (((val1 >> 4) - 7.5)**2) / 28,
			// yc: (((val1 % (1 << 4)) - 7.5)**2) / 28,
			// xm: ((val2 >> 4)**2) / 56,
			// ym: ((val2 % (1 << 4))**2) / 56,
			xc: Math.sign(v1) * (v1**2) / 5500,
			xm: (val2**2) / 10000,
			yc: 0, ym: 1
		}
		env.node_id ++
		return {success:true}
	}
	static add_node_arctan(env, val1, val2) {
		const v1 = val1-127.5
		env.nodes[env.node_id] = {
			sigmoid: DNA_Neural.sigmoids.arctan,
			yc: 0.5, ym: 0.31,

			// sigmoid: DNA_Neural.sigmoids.logistic,
			// yc: 0, ym: 1,

			xc: Math.sign(v1) * (v1**2) / 5500,
			xm: (val2**2) / 10000,
		}
		env.node_id ++
		return {success:true}
	}
	static add_node_softsign(env, val1, val2) {
		const v1 = val1-127.5
		env.nodes[env.node_id] = {
			sigmoid: DNA_Neural.sigmoids.softsign,
			yc: 0.5, ym: 1.5,

			// sigmoid: DNA_Neural.sigmoids.logistic,
			// yc: 0, ym: 1,

			xc: Math.sign(v1) * (v1**2) / 5500,
			xm: (val2**2) / 10000,
		}
		env.node_id ++
		return {success:true}
	}
	static remove_node(env, ival1) {
		const val1 = String(ival1 % env.node_id)
		if (! (val1 in env.nodes)) return;
		if (env.inputs.includes(val1) || env.outputs.includes(val1)) return;
		delete env.nodes[val1];
		Object.values(env.indexed_connections.id[val1] || {})
		.concat(Object.values(env.indexed_connections.rev_id[val1] || {}))
		.forEach(id => {
			DNA_Neural.delete_connection(env, id)
		})
		delete env.indexed_connections.id[val1]
		delete env.indexed_connections.rev_id[val1]
		return {success:true,changed:true}
	}
	static add_connection(env, ival1, ival2) {
		const val1 = String(ival1 % env.node_id)
		const val2 = String(ival2 % env.node_id)
		if (val1 === val2) return;
		if (! (val1 in env.nodes)) return;
		if (! (val2 in env.nodes)) return;
		if (env.indexed_connections.id[val1] && (val2 in env.indexed_connections.id[val1])) return;
		if (env.indexed_connections.id[val2] && (val1 in env.indexed_connections.id[val2])) return;

		const id = env.connection_id
		const val = {id,val:DNA_Neural.random.float(),in:val1,out:val2}
		env.connections[id] = val
		env.connection_id ++

		env.indexed_connections.id[val1] = env.indexed_connections.id[val1] || {}
		env.indexed_connections.id[val1][val2] = id
		env.indexed_connections.rev_id[val2] = env.indexed_connections.rev_id[val2] || {}
		env.indexed_connections.rev_id[val2][val1] = id
		return {success:true,changed:true}
	}
	static set_connection(env, ival1, val2) {
		const val1 = String(ival1 % env.connection_id)
		if (! (val1 in env.connections)) return;
		env.connections[val1].val = DNA_Neural.normalise_val(val2)
		return {success:true}
	}
	static delete_connection(env, ival1) {
		const val1 = String(ival1 % env.connection_id)
		if (! (val1 in env.connections)) return;
		const connection = env.connections[val1]
		delete env.connections[val1]

		delete env.indexed_connections.id[connection.in][connection.out]
		delete env.indexed_connections.rev_id[connection.out][connection.in]

		return {success:true,changed:true}
	}

	static weights = {
		add_connection: 3,
		set_connection: 3,
	}

	static order = [
		DNA_Neural.add_node_logistic,
		DNA_Neural.add_node_arctan,
		DNA_Neural.add_node_softsign,
		DNA_Neural.remove_node,
		DNA_Neural.add_connection,
		DNA_Neural.set_connection,
		DNA_Neural.delete_connection
	]
}
