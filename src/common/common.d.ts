export interface TimeControls {
	main: number,
	delay: number,
	increment: number,
	enableIncrementAfterTurn: number,
	useHourglass: boolean,
	byoyomi: {
		amountPerPeriod: number,
		periods: number,
		movesBeforeReset: number,
		progressiveMoveIncrement: number
	},
	overtime: {
		amount: number,
		triggerAfterTurn?: number
	}[]
}