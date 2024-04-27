module.exports = {
	root: true,
	env: { browser: true, es2023: true },
	extends: [
		"plugin:react/recommended",
		"plugin:react/jsx-runtime",
		"plugin:react-hooks/recommended"
	],
	ignorePatterns: ["dist", ".eslintrc.cjs"],
	parser: "@typescript-eslint/parser",
	parserOptions: {
		ecmaVersion: "latest",
		sourceType: "module",
		project: ["./tsconfig.json", "./tsconfig.node.json"],
		tsconfigRootDir: __dirname
	},
	plugins: ["react-refresh"],
	settings: {
		react: {
			version: "detect"
		}
	},
	rules: {
		"react-refresh/only-export-components": [
			"warn",
			{ allowConstantExport: true }
		]
	}
}