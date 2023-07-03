import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';


import HeadElement from "../../../components/HeadElement";
import Marketplaces from "../../../components/Marketplaces";
import Nightshift from "../../../components/Nightshift";
import PublicSection from "../../../components/PublicSection";
import { Button, ButtonGroup, Grid, MenuItem, Modal, Select, TextField, Typography } from "@mui/material";
import WalletUtils from "../../../utils/WalletUtils";
import bs58 from "bs58";
import axios from "axios";
import { useRouter } from "next/router";


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

const CreateQuest = React.forwardRef((nftFunctions, ref) => {

	const { connection } = useConnection();
	const [questName, setQuestName] = useState<string>("");
	const { wallet } = useWallet();
	const { publicKey, sendTransaction, signTransaction, signMessage } = useWallet();

	const router = useRouter();
	
	const onCreateQuest = async() => {
		if (!publicKey) {
			alert("Connect wallet first");
			return;
		}
		let form = {
			title: questName,
			image: "",
			enabled: false,
			enabledFrom: 0,
			enabledTo: 0,
			stamina: 0,
			duration: 0,
			questScript: []
		};

		let data: any = {
			form: form,
			wallet: publicKey,
		};
		const [signature, blockhash] = await WalletUtils.verifyWallet(connection, publicKey, 'admin-update-quest', data, false, signMessage, signTransaction);

		if (signature) {
			const url = `${domainURL}/admin/quest/update`
			data.message = bs58.encode(signature)
			data.bh = blockhash

			const result = await axios.post(url, data);

			router.push("/admin/quest-editor")
			alert("Created!");
		}
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