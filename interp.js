let lc_print;

let lc_eval = (() => {
	let step_machine = (fn) => (x) => {
		let stack, arg;

		let ret = (x) => arg = x;
		let call = (fn) => (nxt) => (x) => {
			if(nxt != ret) stack.push(nxt);
			stack.push(fn(ret, call));
			arg = x;
		}

		stack = [fn(ret, call)];
		arg = x;

		return () => stack.length ? (stack.pop()(arg), []) : [arg];
	}

	let stack_machine = (fn) => (nxt) => (x) => {
		let step = step_machine(fn)(x);
		let arg;
		while((arg = step()).length == 0);
		return nxt(arg);
	}


	let sm_compose = (f, g) => (ret, call) => call(g)(call(f)(ret));
	let sm_all = (...arr) => arr.reduce(sm_compose);
	let to_sm = (fn) => (ret, call) => (x) => ret(fn(x));
	let un_sm = (fn) => stack_machine(fn)(I);

	let to_cl = ([...l]) => l.toReversed().reduce((a, b) => [b, a], []);                                                  
	let I = x => x;                                                      
	let C = x => y => z => x(z)(y);
	let log = (f) => (x) => (console.log(x), f(x));

	let PushStr = v => c => (ret, call) => ([str, stack]) => call(c)(ret)([[v, str], stack]);
	let PopStr = f => c => (ret, call) => ([str, stack]) => str.length 
		? call(f(str[0])(c))(ret)([str[1], stack]) 
		: ret(null);

	let PushStack = v => c => (ret, call) => ([str, stack]) => call(c)(ret)([str, [v, stack]]);
	let PopStack = f => c => (ret, call) => ([str, stack]) => stack.length 
		? call(f(stack[0])(c))(ret)([str, stack[1]]) 
		: ret(null);

	let Fail = (ret, call) => ([str, stack]) => ret(null);
	let Either = a => b => c => (ret, call) => ([str, stack]) => call(a(c))(x => x == null ? call(b(c))(ret)([str, stack]) : ret(x))([str, stack]);

	let all = (...f) => f.reduce((f, g) => x => f(g(x)));
	let some = (...f) => f.reduce((f, g) => Either(f)(g));

	let Del = PopStack (a => I);
	let End = (ret, call) => ([str, stack]) => str.length == 0 ? ret([str, stack]) : ret(null);
	let Pred = f => PopStr(v => c => f(v) ? PushStack(v)(c) : Fail);
	let In = l => Pred(v => l.some(k => k == v));
	let Rx = r => Pred(v => r.test(v) && v != null);
	let Opt = C(Either)(I);
	let Eq = all(Pred, a => b => a == b);

	let List = f => {
		let ret = (x) => ret(x);
		return ret = all(f, some(
			all(ret, PopStack(a => PopStack(b => PushStack([b, ...a])))), 
			PopStack(x => PushStack([x]))));
	}

	let Thunk = uneval => ({type: "thunk", uneval, eval: null});
	let Lit = value => ({type: "lit", value});

	let Sym = name => e => e[name] == null ? Lit(name) : e[name];
	let App = (f, p) => e => ({type: "app", func: f(e), param: p(e)});
	let Func = (p, b) => e => ({type: "func", func: (x) => {
		let n_e = {...e}; n_e[p] = x;
		return b(n_e);
	}});

	let MultiFunc = (p, b) => p.reduceRight((b, a) => Func(a, b), b); 

	let lc_grammar = (c) => {
		let wspace = Opt(all(List(Rx(/\s/)), Del));
		let Paren = f => all(wspace, Eq("("), Del, f, wspace, Eq(")"), Del);
		let char = Rx(/[^\s\(\)\.\\λ]/);
		let lambda = some(Eq("λ"), Eq("\\"));
		let identifier = all(wspace, List(char));

		let expr = (x) => expr(x);

		let term = some(Paren(expr), all(identifier, PopStack(x => PushStack(Sym(x.join(""))))));
		let app = all(List(term), PopStack(x => PushStack(x.reduce(App))));
		let func = all(
			wspace, lambda, Del, 
			List(identifier), wspace,
			Eq("."), Del,
			expr, PopStack(b => PopStack(p => PushStack(MultiFunc(p.map(v => v.join("")), b)))));

		expr = some(all(app, Opt(all(func, PopStack(b => PopStack(a => PushStack(App(a, b))))))), func);
		return all(expr, wspace)(c);
	}

	let lc_normal = (ret, call) => t => ({
		"lit": ({value}) => ret(value),
		"thunk": ({eval}) => eval == null ? call(lc_normal)(val => ret(t.eval = val))(t.uneval) : ret(eval),
		"app": ({func, param}) => call(lc_normal)(fn => call(fn)(ret)(Thunk(param)))(func),
		"func": ({func}) => ret((ret, call) => x => call(lc_normal)(ret)(func(x)))
	}[t.type])(t);






	let gather_args = (n) => (nxt) => {
		let me = (args) => (ret, call) => (a) => {
			let n_args = [...args, a];

			if(n_args.length < n){
				ret(me(n_args));
			}else{
				call(nxt)(ret)(n_args);
			}
		}
		return me([]);
	}
		
	let b = (n) => (fn) => Lit(gather_args(n)((ret, call) => (args) => {
		ret(fn(...args.map(un_sm(lc_normal))))
	}));

	let True = (ret, call) => (a) => ret((ret, call) => (b) => call(lc_normal)(ret)(a));
	let False = (ret, call) => (a) => ret((ret, call) => (b) => call(lc_normal)(ret)(b));
	let Bool = (v) => v ? True : False;
	let env = {
		//Strictly first arg and binds it to second
		";": Lit((ret, call) => x => ret(
			(ret, call) => f => call(lc_normal)(
				(val) => call(lc_normal)(ret)({type: "app", func: f, param: Lit(val)})
			)(x)
		)),

		print: b(1)(x => (lc_print(x), x)),
		num: b(1)(BigInt),
		char: b(1)((n) => String.fromCharCode(Number(n))),
		"+": b(2)((a, b) => a + b),
		"-": b(2)((a, b) => a - b),
		"*": b(2)((a, b) => a * b),
		"/": b(2)((a, b) => a / b),
		"^": b(2)((a, b) => a ^ b),
		"<<": b(2)((a, b) => a << b),
		">>": b(2)((a, b) => a >> b),
		"&": b(2)((a, b) => a & b),
		"|": b(2)((a, b) => a | b),
		"~": b(1)((a) => ~a),
		"<": b(2)((a, b) => Bool(a < b)),
		"<=": b(2)((a, b) => Bool(a <= b)),
		">": b(2)((a, b) => Bool(a > b)),
		">=": b(2)((a, b) => Bool(a >= b)),
		"==": b(2)((a, b) => Bool(a == b)),
		"!=": b(2)((a, b) => Bool(a != b))
	};


	let lc_eval = (str, die = () => {}, end = () => {}) => {

		let runner = (step, die, next) => {
			let eval_loop = () => {
				if(die()){
					next(null, "killed\n");
					return;
				}

				let start = performance.now();
				let ret = [];
				
				try{
					while(ret.length == 0 && (performance.now() - start) < 16){
						for(let i = 0; i < 10000 && ret.length == 0; i++)
							ret = step();
					}
				}catch (e){
					next(null, e);
				}

				if(ret.length){
					next(ret[0]);
				}else{
					requestAnimationFrame(eval_loop);
				}
			};

			eval_loop();
		}


		runner(step_machine(lc_grammar(End)) ([to_cl(str), []]), die, (state, error) => 
			state != null
				? runner(step_machine(lc_normal)(state[1][0](env)), die, end)
				: end(null, error ?? "unable to parse\n"));
	}

	return lc_eval;
})();
