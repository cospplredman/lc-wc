
/*CPS stuff*/
let all = (s, ...x) => x.reduce((f, g) => (...x) => f(g(...x)), s);
let id = (x) => x;

let to_cps = (fn) => (nxt) => (...x) => nxt(fn(...x));
let un_cps = (fn) => fn(id);




/*CSS stuff*/
let gen_sheet = document.createElement("style");
document.head.appendChild(gen_sheet);
let gen_styles = gen_sheet.sheet;

let gen_rule = (sel, style) => gen_styles.insertRule(`${sel} { ${Object.entries(style).map(v=>v[0].replace(/([A-Z])/g,"-$1") + ":" + v[1]).join(";")}; } \n`);
let gen_class = (name, style) => gen_rule("." + name, style);

gen_rule("body", {
	"position": "relative",
	"width": "100vw",
	"min-width": "100vw",
	"height": "100vh",
	"min-height": "100vh",
	"overflow": "hidden",
	"border": "0",
	"margin": "0",
	"padding": "0",
	"touch-action": "none"

});

gen_rule("@font-face", {
	"font-family": "Preferred Font",
	src: "url(fonts/NimbusMonoPS-Regular.otf)"
});

gen_rule(".Font", {
	"font-family": `"Preferred Font", monospace`,
	"font-size": "12px",
	"line-height": "14px",
	"tab-size": "2"
});

gen_rule(".Font::selection", {
	"color": "white",
	"background-color": "black"
});

gen_rule(".IFont", {
	"font-family": `"Preferred Font", monospace`,
	"font-size": "12px",
	"line-height": "14px",
	"tab-size": "2"
});

gen_rule(".IFont::selection", {
	"color": "black",
	"background-color": "white"
});


gen_rule(".Rect", {
	"max-width": "100%",
	"max-height": "100%",
	"position": "absolute",
	"white-space": "pre-wrap",
	"word-break": "break-all",
	"border": "0",
	"margin": "0",
	"padding": "0",
	"touch-action": "none",
	"overflow": "hidden",
	"resize": "none",
	"outline": "none",
	"font-variant-ligatures": "none",
	"scrollbar-width": "thin",
	"background-color": "white"
});


let el = (type) => to_cps(() => document.createElement(type));

let Children = (...x) => to_cps((el) => {
	el.replaceChildren(...x.filter(v => v != null).map(v => un_cps(v)()));
	return el;
});

let Style = (style) => to_cps((el) => {
	Object.entries(style).forEach(v=>el.style[v[0]] = v[1])
	return el;
});

let Class = (cl) => to_cps((el) => {
	el.classList.add(cl);
	return el;
});

let SetText = (value) => to_cps((el) => {
	el.textContent = value;
	return el;
});

let Attr = (name, value) => to_cps((el) => {
	el.setAttribute(name, value);
	return el;
});

let SetField = (name, value) => to_cps((el) => {
	el[name] = value;
	return el;
});

let EventListener = (name, cb) => to_cps((el) => {
	el.addEventListener(name, cb);
	return el;
});






let Body = (...nd) => all(
	el("body"),
	Children(...nd)
);

let Rect = (x, y, w, h) => (...nd) => all(
	el("pre"),
	Class("Rect"),
	Style({
		top: `calc(${y})`,
		left: `calc(${x})`,
		width: `calc(${w})`,
		height: `calc(${h})`,
		"min-width": `calc(${w})`,
		"min-height": `calc(${h})`
	}),
	Children(...nd)
);

let Border = (t, c = "white") => (...nd) => all(
	Rect(t, t, `100% - 2*(${t})`, `100% - 2*(${t})`)(
		...nd
	),
	Style({"background-color": c})
);

let Scroll = (nd) => all(
	nd,
	Style({"overflow-y": "scroll"})
)

let Text = (str) => all(
	el("pre"),
	Class("Rect"),
	Class("Font"),
	SetText(str)
);

