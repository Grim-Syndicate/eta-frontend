import React, { useEffect, useState, useContext } from "react";
import axios from 'axios';
import Box from '@mui/material/Box';
import Fade from "@mui/material/Fade";
import { styled } from "@mui/system";
import ModalUnstyled from "@mui/base/ModalUnstyled";
import Grid from '@mui/material/Grid';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import TextField from '@mui/material/TextField';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import WalletUtils from '../utils/WalletUtils';
import { GrimsContext } from "./GrimsProvider";
import bs58 from "bs58";
import toast, { Toaster } from 'react-hot-toast'
import { AstraAuction } from "../models/AstraHouse";
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';

const p2pModalStyle = {
	display: 'flex',
	flexDirection: 'column',
	width: 800,
	maxWidth: '80vw',
	maxHeight: '90vh',
	bgcolor: "white",
	border: "1px solid var(--color-secondary-accent)",
	borderRadius: '12px',
	p: 3,
	overflowY: "scroll"
};

const Backdrop = styled("div")`
  z-index: -1;
  position: fixed;
  right: 0;
  bottom: 0;
  top: 0;
  left: 0;
  background-color: rgba(0, 0, 0, 0.9);
  -webkit-tap-highlight-color: transparent;
`;

const domainURL = process.env.REACT_APP_DOMAIN || 'http://localhost:5050';

interface Props {
	auction: AstraAuction | undefined;
	isOpen: boolean;
	isEditing: boolean;
	auctionSet: (Auction: AstraAuction) => void;
	onAuctionDelete: (Auction: AstraAuction) => void;
	modalClosed: () => void;

}
const ManageAuction = (props: Props) => {
	const [createAuctionSuccessful, setCreateAuctionSuccessful] = useState(false);
	const [createAuctionFailed, setCreateAuctionFailed] = useState(false);
	const [sendErrorMessage, setSendErrorMessage] = useState('');

	const { isUsingLedger } = useContext(GrimsContext);
	const { publicKey, wallet, signTransaction, signMessage } = useWallet();
	const { connection } = useConnection();

	const [showTryDeleteAuctionAlert, setShowTryDeleteAuctionAlert] = useState<boolean>(false);
	const [confirmDeleteAuctionName, setConfirmDeleteAuctionName] = useState<string>("");

	const [auctionFormValues, setauctionFormValues] = useState<AstraAuction>(new AstraAuction());
	useEffect(() => {
		if (props.isOpen) {
			resetNotificationStates()
		}

		if (props.isEditing) {
			setauctionFormValues((values) => ({
				...values,
				...props.auction,
			}));
		}
	}, [props.isOpen])

	const handleTextInputChange = (event: any, field: string) => {
		event.persist();

		setauctionFormValues((values: AstraAuction) => ({
			...values,
			[field]: event.target.value
		}));
	};

	const handleNumberInputChange = (event: any, field: string) => {
		event.persist();
		const val = parseInt(event.target.value)

		setauctionFormValues((values) => ({
			...values,
			[field]: val,
		}));
	};

	const handleCheckboxInputChange = (event: any, field: string) => {
		event.persist();
		const val = event.target.checked;

		setauctionFormValues((values) => ({
			...values,
			[field]: val,
		}));
	};

	const handleDateInputChange = (d: number | null | undefined, field: string) => {
		if (!d) {
			return;
		}
		const val = new Date(d).getTime() // convert event.target.value to epoch
		console.error('date', val)

		setauctionFormValues((values) => ({
			...values,
			[field]: val
		}));
	};

	const manageAuction = async (event: any) => {
		event.preventDefault();

		if (!publicKey) {
			setSendErrorMessage(`No publickey`);
			return;
		}
		if (!auctionFormValues.tickSize || auctionFormValues.tickSize < 1) {
			setSendErrorMessage(`Please enter a tick Size for the Auction!`);
			return;
		}
		if (!auctionFormValues.enabledFrom) {
			setSendErrorMessage(`Please enter a Start time for the Auction!`);
			return;
		}
		if (!auctionFormValues.enabledTo) {
			setSendErrorMessage(`Please enter an End time for the Auction!`);
			return;
		}
		if (!auctionFormValues.startingBid) {
			setSendErrorMessage(`Please enter an amount for Starting Bid!`);
			return;
		}

		let data: any = {
			id: auctionFormValues._id,
			form: auctionFormValues,
			wallet: "",
			message: "",
		}
		delete data.form._id;
		data.wallet = publicKey.toString();


		let verifData: any = {
			form: auctionFormValues,
			wallet: publicKey.toString()
		}

		let [signature, blockhash] = await WalletUtils.verifyWallet(connection, publicKey, 'create-edit-auction', verifData, isUsingLedger, signMessage, signTransaction);
		if (!signature || (isUsingLedger && !blockhash)) {
			setSendErrorMessage(`No signature or blockhash, try again`);
			return;
		}
		data.message = bs58.encode(signature);
		data.bh = blockhash;
		if (props.auction) {
			data.id = props.auction._id!;
		}

		try {
			resetNotificationStates()

			const manageAuctionURL = `${domainURL}/auction-house/create-auction`
			const result = await axios.post(manageAuctionURL, data);

			if (result.data.error) {
				setCreateAuctionFailed(true);
				setSendErrorMessage(result.data.error);
				// setSendErrorMessage(`Information is missing from your Auction`);
				return;
			}

			if (result.data.id) {
				auctionFormValues._id = result.data.id;
			}
			props.auctionSet(auctionFormValues)
			// TODO if (!isEditing) props.AuctionSet(res)
			setCreateAuctionSuccessful(true);
			// TODO reset form
		} catch (err) {
			console.log("err", err);
			setSendErrorMessage('Unable to create your Auction');
		}
	}

	const resetNotificationStates = () => {
		setCreateAuctionSuccessful(false);
		setCreateAuctionFailed(false);
		setSendErrorMessage('');
	}

	const handleCloseModal = () => {
		props.modalClosed()
	}
	const fastCreateExpiringAuction = async () => {

		if (!publicKey) return;

		const date = new Date();
		const time = date.getTime();
		let auction: AstraAuction = {
			"author": "Test",
			"authorLink": "Test",
			"description": "Test auction, automatically generated to test a feature",
			"enabled": true,
			"enabledFrom": time - (3600 * 1000),
			"enabledTo": time + (120 * 1000),
			"image": "https://pbs.twimg.com/profile_images/1498641868397191170/6qW2XkuI_400x400.png",
			"startingBid": 1,
			"tickSize": 1,
			"title": "Test",
			currentBid: 0,
			currentWinningWallet: "",
			_id: "",
			type: "AUCTION"
		};
		let data: any = {
			id: null,
			form: auction,
			wallet: "",
			message: "",
		}
		delete data.form._id;
		data.wallet = publicKey.toString();


		let verifData: any = {
			form: auctionFormValues,
			wallet: publicKey.toString()
		}

		let [signature, blockhash] = await WalletUtils.verifyWallet(connection, publicKey, 'create-edit-auction', verifData, isUsingLedger, signMessage, signTransaction);
		if (!signature || (isUsingLedger && !blockhash)) {
			setSendErrorMessage(`No signature or blockhash, try again`);
			return;
		}
		data.message = bs58.encode(signature);
		data.bh = blockhash;
		if (props.auction) {
			data.id = props.auction._id!;
		}

		try {
			resetNotificationStates()

			const manageAuctionURL = `${domainURL}/auction-house/create-auction`
			const result = await axios.post(manageAuctionURL, data);

			if (result.data.error) {
				setCreateAuctionFailed(true);
				setSendErrorMessage(result.data.error);
				return;
			}

			if (result.data.id) {
				auction._id = result.data.id;
			}
			props.auctionSet(auction)
			setCreateAuctionSuccessful(true);
		} catch (err) {
			console.log("err", err);
			setSendErrorMessage('Unable to create your Auction');
		}
	}

	const tryDeleteAuction = async () => {
		setShowTryDeleteAuctionAlert(true);
	}

	const deleteAuction = async () => {

		if (!publicKey) return;
		if (confirmDeleteAuctionName !== props.auction?.title) return;


		let data: any = {
			id: null,
			auctionId: props.auction?._id,
			wallet: publicKey.toString(),
			message: "",
		}

		let verifData: any = {
			auctionId: props.auction?._id,
			wallet: publicKey.toString()
		}

		let [signature, blockhash] = await WalletUtils.verifyWallet(connection, publicKey, 'delete-event', verifData, isUsingLedger, signMessage, signTransaction);
		if (!signature || (isUsingLedger && !blockhash)) {
			setSendErrorMessage(`No signature or blockhash, try again`);
			return;
		}

		data.message = bs58.encode(signature);
		data.bh = blockhash;
		if (props.auction) {
			data.id = props.auction._id!;
		}

		const manageAuctionURL = `${domainURL}/auction-house/delete-auction`
		const result = await axios.post(manageAuctionURL, data);

		if (result.data.error) {
			setCreateAuctionFailed(true);
			setSendErrorMessage(result.data.error);
			// setSendErrorMessage(`Information is missing from your Auction`);
			return;
		}

		props.onAuctionDelete(props.auction);
	}

	return (
		<ModalUnstyled
			className="unstyled-modal"
			aria-labelledby="Create Auction"
			aria-describedby="Create Auction"
			open={props.isOpen}
			onClose={handleCloseModal}
			BackdropComponent={Backdrop}
		>
			<Fade in={props.isOpen}>
				<Box sx={p2pModalStyle} className="modal-form">

					<Toaster position='top-center' reverseOrder={false} toastOptions={{ duration: 5000 }} />
					<div className="is-flex is-flex-align-center is-flex-justify-space-between m-b-md">
						<h1 className="has-font-tomo">{props.isEditing ? 'Update' : 'Create'} Auction</h1>

						<div className="is-flex is-flex-align-center is-flex-justify-space-between m-b-md">

							{props.auction && (
								<IconButton color="error" className="m-r-md" onClick={tryDeleteAuction}>
									<DeleteIcon />
								</IconButton>
							)}

							<img src="/img/icon-close-circle.svg" alt="close modal icon" onClick={handleCloseModal} />
						</div>
					</div>

					<form className="form is-fflex is-flex-direction-column is-flex-item is-overflow-hidden" onSubmit={manageAuction}>
						{createAuctionSuccessful && <div className="is-flex is-flex-align-center"><img src="/img/icon-success.svg" alt="success icon" className="m-r-sm" /> Auction has successfully been created!</div>}

						{createAuctionFailed && <div className="is-flex is-flex-align-center"><img src="/img/icon-error.svg" alt="success icon" className="m-r-sm" /> Sorry, we were unable to create your Auction.</div>}

						{sendErrorMessage && <div className="is-flex is-flex-align-center m-b-md"><img src="/img/icon-error.svg" alt="success icon" className="m-r-sm" /> {sendErrorMessage}</div>}

						{!createAuctionSuccessful && !createAuctionFailed && <div className="is-fullwidth is-overflow-auto is-flex-item">
							<Grid container columns={24} spacing={2} className="m-b-sm">
								<Grid item xs={24}>
									<label className="has-font-weight-bold">Auction title</label>
									<input
										id="Auction-title"
										className="is-fullwidth"
										placeholder="Enter Auction title"
										value={auctionFormValues.title}
										onChange={(e) => handleTextInputChange(e, 'title')}
										required={true}
									/>
								</Grid>
							</Grid>

							<Grid container columns={24} spacing={2} className="m-b-sm">
								<Grid item xs={24}>
									<label className="has-font-weight-bold">Auction Description</label>
									<div>
										<TextField
											id="Auction-description"
											multiline
											maxRows={4}
											className="is-fullwidth"
											placeholder="Enter Auction description"
											value={auctionFormValues.description}
											onChange={(e) => handleTextInputChange(e, 'description')} />
									</div>
								</Grid>
							</Grid>

							<Grid container columns={24} spacing={2} className="m-b-sm">
								<Grid item md={12}>
									<label className="has-font-weight-bold">Start date</label>
									<div>
										<LocalizationProvider dateAdapter={AdapterDateFns}>
											<DateTimePicker
												value={auctionFormValues.enabledFrom}
												onChange={(newValue) => {
													handleDateInputChange(newValue, 'enabledFrom');
												}}
												renderInput={(params) => <TextField className="is-fullwidth" {...params} />}
											/>
										</LocalizationProvider>
									</div>
								</Grid>
								<Grid item md={12} className="m-b-sm">
									<label className="has-font-weight-bold">End date</label>
									<div>
										<LocalizationProvider dateAdapter={AdapterDateFns}>
											<DateTimePicker
												value={auctionFormValues.enabledTo}
												onChange={(newValue) => {
													handleDateInputChange(newValue, 'enabledTo');
												}}
												renderInput={(params) => <TextField className="is-fullwidth" {...params} />}
											/>
										</LocalizationProvider>
									</div>
								</Grid>
							</Grid>

							<Grid container columns={24} spacing={2} className="m-b-sm">
								<Grid item md={12}>
									<label className="has-font-weight-bold">Starting Bid</label>
									<input
										id="Auction-cost"
										type="number"
										className="is-fullwidth"
										placeholder="Enter $ASTRA amount for the starting bid"
										value={auctionFormValues.startingBid}
										onChange={(e) => handleNumberInputChange(e, 'startingBid')}
										required={true}
									/>
								</Grid>
								<Grid item md={12}>
									<label className="has-font-weight-bold">Tick Size</label>
									<input
										id="Auction-cost"
										min={1}
										type="number"
										className="is-fullwidth"
										placeholder="Enter $ASTRA amount for the tick size (how much each bid goes up)"
										value={auctionFormValues.tickSize}
										onChange={(e) => handleNumberInputChange(e, 'tickSize')}
										required={true}
									/>
								</Grid>
							</Grid>

							<Grid container columns={24} spacing={2} className="m-b-md">

								<Grid item md={12}>


									<input className="form-check-input m-t-md" type="checkbox" checked={auctionFormValues.enabled} onChange={(e) => handleCheckboxInputChange(e, 'enabled')} id="enabled" />
									<label className="m-l-sm form-check-label has-font-weight-bold" htmlFor="flexCheckDefault">
										Enabled (viewable by users)
									</label>
								</Grid>

							</Grid>

							<Grid container columns={24} spacing={2} className="m-b-sm">
								<Grid item md={12}>
									<label className="has-font-weight-bold">Artist</label>
									<input
										id="Auction-creator"
										className="is-fullwidth"
										placeholder="Enter name of artist or creator"
										value={auctionFormValues.author}
										onChange={(e) => handleTextInputChange(e, 'author')}
										required={true}
									/>
								</Grid>
								<Grid item md={12} className="m-b-sm">
									<label className="has-font-weight-bold">Artist link</label>
									<input
										id="Auction-author-link"
										className="is-fullwidth"
										placeholder="Enter artist or creator link"
										value={auctionFormValues.authorLink}
										onChange={(e) => handleTextInputChange(e, 'authorLink')}
										required={true}
									/>
								</Grid>
							</Grid>

							<Grid container columns={24} spacing={2} className="m-b-sm">
								<Grid item xs={24}>
									<label className="has-font-weight-bold">Thumbnail image link</label>
									<input
										id="Auction-title"
										className="is-fullwidth"
										placeholder="Enter Auction image URL"
										value={auctionFormValues.image}
										onChange={(e) => handleTextInputChange(e, 'image')}
										required={true}
									/>
								</Grid>
							</Grid>


						</div>}

						<hr className="m-t-md m-b-md" />

						<div className="is-flex is-flex-justify-end">

							{auctionFormValues.title === "test" && (
								<button className="button is-primary is-xl m-l-sm" onClick={fastCreateExpiringAuction}>
									[TESTING] Create Expiring Auction
								</button>
							)}
							<button type="button" className="button is-tertiary is-xl" onClick={handleCloseModal}>
								{createAuctionSuccessful || createAuctionFailed ? 'Close' : 'Cancel and Close'}
							</button>
							{!createAuctionSuccessful && !createAuctionFailed && <button className="button is-primary is-xl m-l-sm">
								{props.isEditing ? 'Update' : 'Publish'} Auction
							</button>}
						</div>
					</form>
					<Dialog open={showTryDeleteAuctionAlert} onClose={() => setShowTryDeleteAuctionAlert(false)}>
						<DialogTitle>Confirm Deletion</DialogTitle>
						<DialogContent>
							<DialogContentText>
								To confirm that you wish you delete this Auction please type the Auction's name in the box below.
							</DialogContentText>
							<TextField
								onChange={(e) => { setConfirmDeleteAuctionName(e.target.value) }}
								autoFocus
								margin="dense"
								id="name"
								label="Auction Name"
								type="text"
								fullWidth
								variant="standard"
							/>
						</DialogContent>
						<DialogActions>
							<Button onClick={() => setShowTryDeleteAuctionAlert(false)}>Cancel</Button>
							<Button color="secondary" disabled={confirmDeleteAuctionName !== props.auction?.title} onClick={deleteAuction}>Delete</Button>
						</DialogActions>
					</Dialog>
				</Box>
			</Fade>
		</ModalUnstyled>
	)
};

export default ManageAuction;