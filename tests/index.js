const tester = (() => {

	const test_method = parent_test_obj => {
		return (message, condition) => {
			const test_obj = add_test(message, parent_test_obj)
			let result = condition
			if (typeof result === 'function')
				result = result()

			if (result instanceof Promise)
				return result
					.then((r) => test_result(test_obj, r))
					.catch((e) => test_result(test_obj, false))
			else
				return test_result(test_obj, result)
		}
	}
	const test_error_method = parent_test_obj => {
		return (message, func, type, message_matcher) => {
			const test_obj = add_test(message, parent_test_obj)
			try {
				const result = func()
				if (result instanceof Promise)
					result.then((r) => {
						test_result(test_obj, false)
					}).catch((e) => {
						test_result(test_obj, verify_error(e, type, message_matcher))
					})
				else test_result(test_obj, false)
			} catch(e) {
				test_result(test_obj, verify_error(e, type, message_matcher))
			}
		}
	}
	const describe_method = parent_test_obj => {
		return (message, func) => {
			const test_obj = add_test(message, parent_test_obj)
			func({
				test: test_method(test_obj),
				describe: describe_method(test_obj),
				test_error: test_error_method(test_obj),
			})
			Promise.all(test_obj.promises).then(() => {
				test_result(test_obj, true)
			}).catch(() => {
				test_result(test_obj, false)
			})
		}
	}

	const add_test = (message, parent) => {
		const el = document.createElement('li')
		const mess = document.createElement('span')
		const child_count = document.createElement('span')
		const list = document.createElement('ol')
		el.classList.add('test-object')
		el.onclick = (ev) => {
			if (ev.target.closest('.test-object') !== el)
				return;
			if (el.classList.contains('test-expanded')) {
				el.classList.remove('test-expanded')
				el.classList.add('test-collapsed')
			} else {
				el.classList.add('test-expanded')
				el.classList.remove('test-collapsed')
			}
		}
		list.classList.add('test-children')
		mess.innerText = message
		mess.classList.add('test-message')
		child_count.classList.add('test-count')
		el.appendChild(child_count)
		el.appendChild(mess)
		el.appendChild(list)
		let resolve,reject
		const promise = new Promise((res, rej) => {
			resolve = res
			reject = rej
		})
		if (parent) {
			parent.children_el.appendChild(el)
			parent.promises.push(promise)
			parent.child_count++
			parent.element.classList.add('test-has-children')
			parent.child_count_el.innerText = parent.child_count
		} else {
			document.body.appendChild(el)
		}
		return {
			element: el,
			child_count_el: child_count,
			children_el: list,
			child_count: 0,

			message,
			resolve,reject,
			promises: []
		}
	}

	const test_class = (getter, src, depends) => new Promise((resolve) => {
		const existing_script = document.querySelector(`[src="${src}"]`)
		if (existing_script) {
			console.error("EXISTING")
			const ret = getter()
			const test_obj = add_test(ret.name)
			resolve({
				_class: window[`Test_${ret.name}`],
				test: test_method(test_obj),
				describe: describe_method(test_obj),
				test_error: test_error_method(test_obj),
			})
			Promise.all(test_obj.promises).then(() => {
				test_result(test_obj, true)
			}).catch(() => {
				test_result(test_obj, false)
			})
		} else {
			const attempt_resolve = () => {
				let do_it = true
				if (depends) {
					do_it = false
					try {
						do_it = Boolean(depends())
					} catch(e) {}
				}
				if (do_it) {
					const script = document.createElement('script')
					script.src = src
					script.onload = function () {
						const ret = getter()
						const test_obj = add_test(ret.name)
						const parsed = ret.toString()
							.replace(/#/gm, '__')
							// .replace(/(class\s+)/gm, '$1Test_')
							.replace(new RegExp(`([^a-zA-Z0-9_])(${ret.name})([^a-zA-Z0-9_])`, 'gm'), '$1Test_$2$3')
							+`;window.Test_${ret.name} = Test_${ret.name}`
						const parsed_script = document.createElement('script')
						parsed_script.innerHTML = parsed
						document.head.appendChild(parsed_script)
						resolve({
							_class: window[`Test_${ret.name}`],
							test: test_method(test_obj),
							describe: describe_method(test_obj),
							test_error: test_error_method(test_obj),
						})
						Promise.all(test_obj.promises).then(() => {
							test_result(test_obj, true)
						}).catch(() => {
							test_result(test_obj, false)
						})
					}
					document.head.appendChild(script)
				} else {
					setTimeout(attempt_resolve, 50)
				}
			}
			attempt_resolve()
		}
	})

	const match_items = a => b => // B includes everything from A
		items.every(item => thing.includes(item))

	const match = a => b => // B includes everything from A
		Object.entries(a).every(([ key, val ]) => {
			if (! (key in b)) return false;
			const ta = typeof val
			const tb = typeof b[key]
			if (ta !== tb)
				return false
			if (ta === 'object')
				return match(val, b[key])
			return val === b[key]
		})

	const match_exact = a => {
		// TODO: pretty sure this always works? Tests for tests?
		const amatch = match(a)
		return b => // B includes everything from A and nothing else
			amatch(b) && match(b)(a)
	}


	const verify_error = (err, type, message_matcher) => {
		if (err instanceof Error) {
			if (type && !(err instanceof type))
				return false
			if (message_matcher)
				return message_matcher(err.message)
			return true
		} else if (typeof err === 'string') {
			if (type && type !== 'string' && type !== String)
				return false
			if (message_matcher)
				return message_matcher(err)
			return true
		}
		return false
	}

	const test_result = (test_obj, successfull) => {
		if (successfull) {
			test_obj.element.classList.add('test-success')
			test_obj.resolve(test_obj)
		} else {
			test_obj.element.classList.add('test-error')
			console.error(test_obj.message)
			test_obj.reject(test_obj)
		}
	}

	return {
		test_class,
		match,
		match_exact,
		match_items,
	}

})()
