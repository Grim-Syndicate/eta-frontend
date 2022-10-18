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

//16th oct
//This isn't used yet, I got in over my head. Giving out items will take a lot more dev work, already near the limit so i'm scrapping this but leaving it in as I think it'll be needed soon.

const CreateItem = React.forwardRef((nftFunctions, ref) => {


	const { connection } = useConnection();
	const { publicKey, sendTransaction, signTransaction, signMessage } = useWallet();
	const [itemName, setItemName] = useState<string>("");
	const [itemImageURL, setItemImageURL] = useState<string>("");
	const { wallet } = useWallet();

	const [items, setItems] = useState<Array<any>>([]);

	useEffect(() => {


		loadItems();

	}, []);

	const loadItems = () => {
		const url = `${domainURL}/admin/item/all`

		axios.post(url, {}).then(response => {
			setItems(response.data.items);
		});
	}
	const onSaveItem = async () => {
		if (!publicKey) {
			alert("Connect wallet first");
			return;
		}
		let form = {
			name: itemName,
			image: itemImageURL
		};

		let data: any = {
			form: form,
			wallet: publicKey,
		};
		const [signature, blockhash] = await WalletUtils.verifyWallet(connection, publicKey, 'create-item', data, false, signMessage, signTransaction);

		if (signature) {
			const url = `${domainURL}/admin/item/create`
			data.message = bs58.encode(signature)
			data.bh = blockhash

			const result = await axios.post(url, data);
			loadItems();
			alert("Created!");
		}
	}

	return (
		<>
			<HeadElement />


			<div>
				<div className="title-bar p-md main-content-wrapper">
					<div className="container main-content-wrapper">
						<h1 className="has-text-white has-font-tomo has-text-shadow">Create an Item</h1>
						<Nightshift />
					</div>
				</div>
				<main className="container main-content-wrapper main-wrapper m-t-md">


					<h1>Create an Item</h1>

					<TextField label="Item Name" variant="standard" value={itemName} onChange={(e) => setItemName(e.target.value)} />
					<TextField className="m-b-lg" label="Item Image URL" variant="standard" value={itemImageURL} onChange={(e) => setItemImageURL(e.target.value)} />

					<Button className="m-b-sm" variant="contained" onClick={onSaveItem}>Create Item</Button>


					<h1 className="m-t-lg">Items</h1>

					<Grid container spacing={2} className="m-t-lg m-b-lg">
						{items.map((item) => (

							<Grid item xs={2} key={item._id} className="item p-b-md">
								<Link href={`/admin/items/edit/${item._id}`}>
									<a>
										<img className="is-fullwidth" src={item.image} />
										<h2>{item.name}</h2>
									</a>
								</Link>
							</Grid>
						))}
					</Grid>



				</main>
			</div>
		</>
	);
});

export default CreateItem;