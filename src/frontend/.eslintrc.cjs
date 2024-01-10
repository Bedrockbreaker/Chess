module.exports = {
	root: true,
	env: { browser: true, es2023: true },
	extends: [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended-type-checked",
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
		],
		/*
		 * I hate linters with a passion.
		 * I'm only using this one since I have no clue what I'm doing with React.
		 */
		"no-fallthrough": "off",
		"no-case-declarations": "off",
		"@typescript-eslint/no-unused-vars": "off",
		"@typescript-eslint/no-misused-promises": "off",
		"@typescript-eslint/no-unsafe-argument": "off",
		"@typescript-eslint/no-unsafe-assignment": "off",
		"@typescript-eslint/ban-types": "off",
		"@typescript-eslint/no-explicit-any": "off",
	}
}