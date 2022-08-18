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
import WalletUtils from './../utils/WalletUtils';
import { GrimsContext } from "./GrimsProvider";
import bs58 from "bs58";
import toast, { Toaster } from 'react-hot-toast'
import { AstraRaffle } from "../models/AstraHouse";
import { Dialog } from "@mui/material";

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
	raffle: AstraRaffle | undefined;
	isOpen: boolean;
	isEditing: boolean;
	raffleSet: (raffle: AstraRaffle) => void;
	modalClosed: () => void;

}
const ManageRaffle = (props: Props) => {
	const [createRaffleSuccessful, setCreateRaffleSuccessful] = useState(false);
	const [createRaffleFailed, setCreateRaffleFailed] = useState(false);
	const [sendErrorMessage, setSendErrorMessage] = useState('');

	const { isUsingLedger } = useContext(GrimsContext);
	const { publicKey, wallet, signTransaction, signMessage } = useWallet();
	const { connection } = useConnection();

	const [raffleFormValues, setRaffleFormValues] = useState<AstraRaffle>(new AstraRaffle());
	useEffect(() => {
		if (props.isOpen) {
			resetNotificationStates()
		}

		if (props.isEditing) {
			setRaffleFormValues((values) => ({
				...values,
				...props.raffle,
			}));
		}
	}, [props.isOpen])

	const handleTextInputChange = (event: any, field: string) => {
		event.persist();

		setRaffleFormValues((values: AstraRaffle) => ({
			...values,
			[field]: event.target.value
		}));
	};

	const handleNumberInputChange = (event: any, field: string) => {
		event.persist();
		const val = parseInt(event.target.value)

		setRaffleFormValues((values) => ({
			...values,
			[field]: val,
		}));
	};

	const handleCheckboxInputChange = (event: any, field: string) => {
		event.persist();
		const val = event.target.checked;

		setRaffleFormValues((values) => ({
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

		setRaffleFormValues((values) => ({
			...values,
			[field]: val
		}));
	};

	const manageRaffle = async (event: any) => {
		event.preventDefault();

		if (!publicKey) {
			setSendErrorMessage(`No publickey`);
			return;
		}
		if (!raffleFormValues.enabledFrom) {
			setSendErrorMessage(`Please enter a Start time for the raffle!`);
			return;
		}
		if (!raffleFormValues.enabledTo) {
			setSendErrorMessage(`Please enter an End time for the raffle!`);
			return;
		}
		if (!raffleFormValues.maxTickets) {
			setSendErrorMessage(`Please enter an amount for Max Tickets!`);
			return;
		}
		if (!raffleFormValues.ticketPrice) {
			setSendErrorMessage(`Please enter a Ticket Price!`);
			return;
		}

		let data: any = {
			id: raffleFormValues._id,
			form: raffleFormValues,
			wallet: "",
			message: "",
		}
		delete data.form._id;
		data.wallet = publicKey.toString();


		let verifData: any = {
			form: raffleFormValues,
			wallet: publicKey.toString()
		}

		let [signature, blockhash] = await WalletUtils.verifyWallet(connection, publicKey, 'create-edit-raffle', verifData, isUsingLedger, signMessage, signTransaction);
		if (!signature || (isUsingLedger && !blockhash)) {
			setSendErrorMessage(`No signature or blockhash, try again`);
			return;
		}
		data.message = bs58.encode(signature);
		data.bh = blockhash;
		if (props.raffle) {
			data.id = props.raffle._id!;
		}

		try {
			resetNotificationStates()

			const manageRaffleURL = `${domainURL}/auction-house/create-raffle`
			const result = await axios.post(manageRaffleURL, data);

			if (result.data.error) {
				setCreateRaffleFailed(true);
				setSendErrorMessage(result.data.error);
				// setSendErrorMessage(`Information is missing from your raffle`);
				return;
			}

			if (result.data.id) {
				raffleFormValues._id = result.data.id;
			}
			props.raffleSet(raffleFormValues)
			// TODO if (!isEditing) props.raffleSet(res)
			setCreateRaffleSuccessful(true);
			// TODO reset form
		} catch (err) {
			setSendErrorMessage('Unable to create your raffle');
		}
	}

	const resetNotificationStates = () => {
		setCreateRaffleSuccessful(false);
		setCreateRaffleFailed(false);
		setSendErrorMessage('');
	}

	const handleCloseModal = () => {
		props.modalClosed()
	}
	return (
		<Dialog
			className="unstyled-modal"
			aria-labelledby="Create Raffle"
			aria-describedby="Create Raffle"
			open={props.isOpen}
			onClose={handleCloseModal}
		>
			<Fade in={props.isOpen}>
				<Box sx={p2pModalStyle} className="modal-form">

					<Toaster position='top-center' reverseOrder={false} toastOptions={{ duration: 5000 }} />
					<header className="is-flex is-flex-align-center is-flex-justify-space-between m-b-md">
						<h1 className="has-font-tomo">{props.isEditing ? 'Update' : 'Create'} Raffle</h1>
						<img src="/img/icon-close-circle.svg" alt="close modal icon" onClick={handleCloseModal} />
					</header>

					<form className="form is-fflex is-flex-direction-column is-flex-item is-overflow-hidden" onSubmit={manageRaffle}>
						{createRaffleSuccessful && <div className="is-flex is-flex-align-center"><img src="/img/icon-success.svg" alt="success icon" className="m-r-sm" /> Raffle has successfully been created!</div>}

						{createRaffleFailed && <div className="is-flex is-flex-align-center"><img src="/img/icon-error.svg" alt="success icon" className="m-r-sm" /> Sorry, we were unable to create your raffle.</div>}

						{sendErrorMessage && <div className="is-flex is-flex-align-center m-b-md"><img src="/img/icon-error.svg" alt="success icon" className="m-r-sm" /> {sendErrorMessage}</div>}

						{!createRaffleSuccessful && !createRaffleFailed && <div className="is-fullwidth is-overflow-auto is-flex-item">
							<Grid container columns={24} spacing={2} className="m-b-sm">
								<Grid item xs={24}>
									<label className="has-font-weight-bold">Raffle title</label>
									<input
										id="raffle-title"
										className="is-fullwidth"
										placeholder="Enter raffle title"
										value={raffleFormValues.title}
										onChange={(e) => handleTextInputChange(e, 'title')}
										required={true}
									/>
								</Grid>
							</Grid>

							<Grid container columns={24} spacing={2} className="m-b-sm">
								<Grid item xs={24}>
									<label className="has-font-weight-bold">Raffle Description</label>
									<div>
										<TextField
											id="raffle-description"
											multiline
											maxRows={4}
											className="is-fullwidth"
											placeholder="Enter raffle description"
											value={raffleFormValues.description}
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
												value={raffleFormValues.enabledFrom}
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
												value={raffleFormValues.enabledTo}
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
									<label className="has-font-weight-bold">Cost per raffle ticket</label>
									<input
										id="raffle-cost"
										type="number"
										className="is-fullwidth"
										placeholder="Enter $ASTRA amount per ticket"
										value={raffleFormValues.ticketPrice}
										onChange={(e) => handleNumberInputChange(e, 'ticketPrice')}
										required={true}
									/>
								</Grid>
								<Grid item md={12}>
									<label className="has-font-weight-bold">Number of winners</label>
									<input
										id="number-of-winners"
										className="is-fullwidth"
										placeholder="Enter number of winners"
										value={raffleFormValues.winnerCount}
										onChange={(e) => handleNumberInputChange(e, 'winnerCount')}
										required={true}
									/>
								</Grid>
								<Grid item md={12}>
									<label className="has-font-weight-bold">Max tickets per wallet</label>
									<input
										id="raffle-max-tickets"
										className="is-fullwidth"
										placeholder="Enter $ASTRA amount per ticket"
										value={raffleFormValues.maxTickets}
										onChange={(e) => handleNumberInputChange(e, 'maxTickets')}
										required={true}
									/>
								</Grid>
							</Grid>

							<Grid container columns={24} spacing={2} className="m-b-md">
								<Grid item md={12}>


									<input className="form-check-input m-t-md" type="checkbox" checked={raffleFormValues.uniqueWinners} onChange={(e) => handleCheckboxInputChange(e, 'uniqueWinners')} id="uniqueWinners" />
									<label className="m-l-sm form-check-label has-font-weight-bold" htmlFor="flexCheckDefault">
										Unique raffle winners
									</label>
								</Grid>

								<Grid item md={12}>


									<input className="form-check-input m-t-md" type="checkbox" checked={raffleFormValues.enabled} onChange={(e) => handleCheckboxInputChange(e, 'enabled')} id="enabled" />
									<label className="m-l-sm form-check-label has-font-weight-bold" htmlFor="flexCheckDefault">
										Enabled (viewable by users)
									</label>
								</Grid>

							</Grid>

							<Grid container columns={24} spacing={2} className="m-b-sm">
								<Grid item md={12}>
									<label className="has-font-weight-bold">Artist</label>
									<input
										id="raffle-creator"
										className="is-fullwidth"
										placeholder="Enter name of artist or creator"
										value={raffleFormValues.author}
										onChange={(e) => handleTextInputChange(e, 'author')}
										required={true}
									/>
								</Grid>
								<Grid item md={12} className="m-b-sm">
									<label className="has-font-weight-bold">Artist link</label>
									<input
										id="raffle-author-link"
										className="is-fullwidth"
										placeholder="Enter artist or creator link"
										value={raffleFormValues.authorLink}
										onChange={(e) => handleTextInputChange(e, 'authorLink')}
										required={true}
									/>
								</Grid>
							</Grid>

							<Grid container columns={24} spacing={2} className="m-b-sm">
								<Grid item xs={24}>
									<label className="has-font-weight-bold">Thumbnail image link</label>
									<input
										id="raffle-title"
										className="is-fullwidth"
										placeholder="Enter raffle image URL"
										value={raffleFormValues.image}
										onChange={(e) => handleTextInputChange(e, 'image')}
										required={true}
									/>
								</Grid>
							</Grid>


						</div>}

						<hr className="m-t-md m-b-md" />

						<div className="is-flex is-flex-justify-end">

							<button type="button" className="button is-tertiary is-xl" onClick={handleCloseModal}>
								{createRaffleSuccessful || createRaffleFailed ? 'Close' : 'Cancel and Close'}
							</button>
							{!createRaffleSuccessful && !createRaffleFailed && <button className="button is-primary is-xl m-l-sm">
								{props.isEditing ? 'Update' : 'Publish'} Raffle
							</button>}
						</div>
					</form>
				</Box>
			</Fade>
		</Dialog>
	)
};

export default ManageRaffle;