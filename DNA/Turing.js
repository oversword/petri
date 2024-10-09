export default class DNA_Turing {
	static new() {
		return {
			pointer: 0,
			vars: {},
			_class: DNA_Turing
		}
	}

	static handleResult(env, result) {
		if (! (result && result.avoidIncrement))
			env.pointer++
	}

	static skip_if_greater(env, val1, val2) {
		if (val1 <= val2) return {success:true}
		env.pointer = val1
		return {success:true,avoidIncrement:true}
	}
	static skip_if_less(env, val1, val2) {
		if (val1 >= val2) return {success:true}
		env.pointer += 2
		return {success:true,avoidIncrement:true}
	}
	static skip_if_equal(env, val1, val2) {
		if (val1 !== val2) return {success:true}
		env.pointer += 2
		return {success:true,avoidIncrement:true}
	}
	static skip_if_not_equal(env, val1, val2) {
		if (val1 === val2) return {success:true}
		env.pointer += 2
		return {success:true,avoidIncrement:true}
	}
	static goto(env, val1) {
		env.pointer = val1
		return {success:true,avoidIncrement:true}
	}
	static set_var(env, var1, val2) {
		if (! (var1 in env.vars)) return;
		env.vars[var1] = val2
		return {success:true}
	}
	static delete_var(env, var1, val2) {
		if (! (var1 in env.vars)) return;
		delete env.vars[var1]
		return {success:true}
	}
	static add_var(env, var1, val2) {
		if (! (var1 in env.vars)) return;
		env.vars[var1] += val2
		return {success:true}
	}
	static multiply_var(env, var1, val2) {
		if (! (var1 in env.vars)) return;
		env.vars[var1] *= val2
		return {success:true}
	}
	static divide_var(env, var1, val2) {
		if (! (var1 in env.vars)) return;
		env.vars[var1] /= val2
		return {success:true}
	}
	static subtract_var(env, var1, val2) {
		if (! (var1 in env.vars)) return;
		env.vars[var1] -= val2
		return {success:true}
	}
	static weights = {
		// goto_var: 2,
		// goto_val: 0,
	}

	static order = [
		DNA_Turing.skip_if_greater,
		DNA_Turing.skip_if_less,
		DNA_Turing.skip_if_equal,
		DNA_Turing.skip_if_not_equal,
		DNA_Turing.goto,
		DNA_Turing.set_var,
		DNA_Turing.delete_var,
		DNA_Turing.add_var,
		DNA_Turing.multiply_var,
		DNA_Turing.divide_var,
		DNA_Turing.subtract_var
	]
}
