import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWallet } from '@solana/wallet-adapter-react';

import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';


import HeadElement from "../../../components/HeadElement";
import Marketplaces from "../../../components/Marketplaces";
import Nightshift from "../../../components/Nightshift";
import PublicSection from "../../../components/PublicSection";
import { Button, ButtonGroup, Grid, MenuItem, Modal, Select, TextField, Typography } from "@mui/material";



const modalStyle = {
	position: 'absolute' as 'absolute',
	top: '50%',
	left: '50%',
	transform: 'translate(-50%, -50%)',
	width: 400,
	bgcolor: 'background.paper',
	border: '2px solid #000',
	boxShadow: 24,
	p: 4,
};

const CreateQuest = React.forwardRef((nftFunctions, ref) => {

	const [questName, setQuestName] = useState<string>("");
	const { wallet } = useWallet();

	const onCreateQuest = () => {

	}

	return (
		<>
			<HeadElement />


			<div>
				<div className="title-bar p-md main-content-wrapper">
					<div className="container main-content-wrapper">
						<h1 className="has-text-white has-font-tomo has-text-shadow">Create a Quest</h1>
						<Nightshift />
					</div>
				</div>
				<main className="container main-content-wrapper main-wrapper m-t-md">



					<TextField id="standard-basic" label="Quest Name" variant="standard" value={questName} onChange={(e) => setQuestName(e.target.value)} />
					<Button className="m-b-sm" variant="contained" onClick={onCreateQuest}>Create Quest</Button>




				</main>
			</div>
		</>
	);
});

export default CreateQuest;