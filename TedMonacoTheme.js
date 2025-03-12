let init_ted_theme = () => {
	let church_monarch_tokens = {
		brackets: [ { open: "(", close: ")", token: "brackets"} ],
		unicode: true,
		includeLF: true,
		defaultToken: "invalid",
		ignoreCase: false,
		operators: [],
		symbols: /\\|λ|\./,
		tokenizer: { root: [
			[/[()]/, "brackets"],
			[/[λ\\\.]/, "lambda"],
			[/[^λ\\\.()]+/, "reference"],
		] } 
	};

	let church_language_config = {
		comments: { },
		brackets: [ ["(", ")"] ],
		autoClosingPairs: [ { open: "(", close: ")" } ],
		surroundingPairs: [ { open: "(", close: ")" } ],
		folding: { "markers": { start: /\(/, end: /\)/ } } 
	};

	let church_editor_config = {
		language: "church",

		cursorStyle: "block",
		hover: {enabled: false},
		automaticLayout: true,
		multiCursorLimit: 1,
		wordWrap: "on",
		contextmenu: false,
		colorDecorators: false,
		minimap: {enabled: false},
		inlineSuggest: {enabled: false},
		suggest: {enabled: false},
		quickSuggestions: false,
		tabSize: 2,
		lineNumbersMinChars: 3,

		scrollbar: {
			useShadows: false,
			verticalHasArrows: true,
			vertical: "visible",
			verticalScrollbarSize: 8,
			arrowSize: 8,
		},

		matchBrackets: "always",
		stickyScroll: {enabled: false},
		"pracketPairColorization.enabled": true,
	};

	let ted_dark = {
		"invalid": "#FF0000",
		"reference": "#FFAACC",
		"lambda": "#AA2255",
		"brackets": ["#5522AA"],
		"lineHighlight": "#ffffff00",
		"foreground": "#ffffff",
		"background": "#000000",
		"guide": "#00000000" 
	}

	let ted_light = {
		"invalid": "#FF0000",
		"reference": "#471127",
		"lambda": "#8f0b3c",
		"brackets": ["#3c1085"],
		"lineHighlight": "#e0baca",
		"foreground": "#000000",
		"background": "#ffffff",
		"guide": "#00000000" 
	}


	let use_dark = false;
	let playground_colors = use_dark ? ted_dark : ted_light;

	let church_theme = {
		base: use_dark ? "hc-black" : "hc-light",
		rules: [
			{ token: "invalid", foreground: playground_colors.invalid },
			{ token: "reference", foreground: playground_colors.reference },
			{ token: "lambda", foreground: playground_colors.lambda },
			{ token: "brackets", foreground: playground_colors.invalid } 
		],
		colors: {
			"editor.foreground": playground_colors.foreground,
			"editor.background": playground_colors.background,
			"editor.selectionForeground": playground_colors.background,
			"editor.selectionBackground": playground_colors.foreground,

			"editorCursor.foreground": playground_colors.foreground,
        		"editorCursor.background": playground_colors.background,

			"editor.inactiveSelectionForeground": playground_colors.background,
			"editor.inactiveSelectionBackground": playground_colors.foreground,
			"editorIndentGuide.background": playground_colors.guide,
			"editorWhitespace.foreground": playground_colors.foreground,
			"editorLineNumber.foreground": playground_colors.foreground,
			"editorLineNumber.activeForeground": playground_colors.foreground,

			"scrollbar.shadow": playground_colors.foreground,
			"scrollbarSlider.hoverBackground": playground_colors.foreground,
			"scrollbarSlider.background": playground_colors.foreground,

			"focusBorder": "#00000000",
			"editor.lineHighlightBorder": "#00000000",
			"editor.lineHighlightBackground": "#00000000",

			"editorBracketMatch.background": "#00000000",
			"editorBracketMatch.border": playground_colors.foreground,
			...Object.fromEntries(Array(10 / playground_colors.brackets.length + 1 | 0)
				.fill(playground_colors.brackets).flat()
					.map((v, i) => ["editorBracketHighlight.foreground" + (i + 1), v])),
		} 
	}

	monaco.languages.register({ id: "church" })
	monaco.languages.setMonarchTokensProvider("church", church_monarch_tokens)
	monaco.languages.setLanguageConfiguration("church", church_language_config)
	monaco.editor.defineTheme("church", church_theme)
	monaco.editor.setTheme("church")

	return church_editor_config;
};
