export default class EntityRenderer {
	static calculateNodePosition(pass, layer, i) {
		return Object.keys(layer).reduce((pass, id, j, layer_ids) => {
			pass.node_positions[id] = {
				x: pass.style.x_offset + pass.style.padding + (pass.style.layer_width * i),
				y: pass.style.y_offset + pass.style.padding + ((1 + (j * 2)) * pass.style.content_height / 2 / layer_ids.length)
			}
			return pass
		}, pass)
	}
	static renderSize = 160
	static render({ neural: env }, context, inputStyle = {}) {
		if (! env.rat) return;
		const style = {
			x_offset: 0,
			y_offset: 0,
			padding: 20,
			height: EntityRenderer.renderSize,
			width: EntityRenderer.renderSize,
			...inputStyle
		}
		style.content_height = style.height - (style.padding * 2)
		style.content_width = style.width - (style.padding * 2)
		style.layer_width = style.content_width / (env.rat.list.length - 1)

		const { nodes, connections } = env
		const { node_positions } = env.rat.list.reduce(EntityRenderer.calculateNodePosition, { node_positions: {}, style })

		Object.keys(env.rat.connections).map(id => connections[id]).forEach(connection => {
			const p1 = node_positions[connection.in]
			const p2 = node_positions[connection.out]
			if (! (p1 && p2)) return; // TODO: this should no longer be needed

			const val = Math.min(connection.val, 40)
			context.beginPath()
			context.moveTo(p1.x, p1.y)
			context.lineTo(p2.x, p2.y)
			context.lineWidth = Math.abs(val) + 1
			if (val > 0)
				context.strokeStyle = "#00f"
			else if (val < 0)
				context.strokeStyle = "#f00"
			// if (val !== 0)
				context.stroke()
		})
		Object.entries(node_positions).forEach(([ id, p ]) => {
			if (env.inputs.includes(id))
				context.fillStyle = "#000"
			else if (env.outputs.includes(id))
				context.fillStyle = "#ddd"
			else
				context.fillStyle = "#999"
			context.beginPath();
			const node = env.nodes[id]
			// console.log(node)
			const r = 5
			switch (node.sigmoid.name) {
				case 'arctan':
					context.moveTo(p.x-r, p.y-r)
					context.lineTo(p.x-r, p.y+r)
					context.lineTo(p.x+r, p.y+r)
					context.lineTo(p.x+r, p.y-r)
					break
				case 'softsign':
					context.moveTo(p.x-r, p.y+r)
					context.lineTo(p.x+r, p.y+r)
					context.lineTo(p.x, p.y-r)
					break
				case 'logistic':
				default:
					context.arc(p.x, p.y, r, 0, 2 * Math.PI)
					break
			}
			context.closePath();
			context.fill();
		})
	}
}
