function Overlay({classes}: {classes: string[]}) {
	return <svg version="1.1" width="60" height="60" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60">{[
		[
			<polygon key="slice_1_0" className={classes[0]} points="0,0 60,0 60,60 0,60"/>
		],
		[
			<polygon key="slice_2_0" className={classes[0]} points="0,0 60,0 0,60"/>,
			<polygon key="slice_2_1" className={classes[1]} points="60,0 60,60 0,60"/>
		],
		[
			<polygon key="slice_3_0" className={classes[0]} points="30,30 30,0 60,0 60,50"/>,
			<polygon key="slice_3_1" className={classes[1]} points="30,30 60,50 60,60 0,60 0,50"/>,
			<polygon key="slice_3_2" className={classes[2]} points="30,30 0,50 0,0 30,0"/>
		],
		[
			<polygon key="slice_4_0" className={classes[0]} points="30,30 30,0 60,0 60,30"/>,
			<polygon key="slice_4_1" className={classes[1]} points="30,30 60,30 60,60 30,60"/>,
			<polygon key="slice_4_2" className={classes[2]} points="30,30 30,60 0,60 0,30"/>,
			<polygon key="slice_4_3" className={classes[3]} points="30,30 0,30 0,0 30,0"/>
		],
		[
			<polygon key="slice_5_0" className={classes[0]} points="30,30 30,0 60,0 60,18"/>,
			<polygon key="slice_5_1" className={classes[1]} points="30,30 60,18 60,60 55,60"/>,
			<polygon key="slice_5_2" className={classes[2]} points="30,30 55,60 5,60"/>,
			<polygon key="slice_5_3" className={classes[3]} points="30,30 5,60 0,60 0,18"/>,
			<polygon key="slice_5_4" className={classes[4]} points="30,30 0,18 0,0 30,0"/>
		]
	][classes.length-1]}</svg>
}

export { Overlay }