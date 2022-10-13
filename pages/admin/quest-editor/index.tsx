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
import axios from "axios";
import Link from "next/link";


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


const domainURL = process.env.NEXT_PUBLIC_API_URL || '';
const getQuestsURL = domainURL + "/quests";


const QuestEditorList = React.forwardRef((nftFunctions, ref) => {

	const { wallet } = useWallet();
	const [quests, setQuests] = useState([]);

	useEffect(() => {
		loadQuests();
	}, []);

	const loadQuests = async () => {
		try {
			let result = await axios.get(getQuestsURL);

			if (result && result.data && result.data.success && result.data.quests) {
				setQuests(result.data.quests);
			}
		} catch (error) {
			console.error('error...', error)
		}
	}

	return (
		<>
			<HeadElement />


			<div>
				<div className="title-bar p-md main-content-wrapper">
					<div className="container main-content-wrapper">
						<h1 className="has-text-white has-font-tomo has-text-shadow">Pick a Quest n start editing!</h1>
						<Link href="/admin/quest-editor/create">
							<Button color="secondary" variant="contained">Create New Quest</Button>
						</Link>
					</div>
				</div>
				<main className="container main-content-wrapper main-wrapper m-t-md">

					<Grid columns={24} container spacing={3}>
						{quests &&
							quests.length > 0 &&
							quests.map((quest: any) => {
								return (
									<Grid item xs={24} md={4} key={quest._id} className="quest-card-container m-b-md">
										<div className="quest-card">
											<div className="has-text-centered">
												<img className="quest-card-image" src={quest.image} />
											</div>
											<div className="p-sm">
												<div className="m-b-sm" style={{ fontFamily: "bolder", height: "40px" }}>{quest.title}</div>
												<div style={{ fontSize: "0.6em", height: "70px" }}>{quest.shortDescription}</div>
												<div className="has-text-centered m-t-sm p-t-sm">

													<Link href={`/admin/quest-editor/edit/${quest._id}`}>
														<a className="button is-tertiary is-fullwidth">Edit</a>
													</Link>
												</div>
											</div>
										</div>
									</Grid>
								);
							})}
					</Grid>


				</main>
			</div>
		</>
	);
});

export default QuestEditorList;