import React, { useEffect, useState, useContext } from "react";
import axios from 'axios';
import Box from '@mui/material/Box';
import Fade from "@mui/material/Fade";
import { styled } from "@mui/system";
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
import { Dialog } from "@mui/material";
import { Proposal } from "../models/Proposal";

const p2pModalStyle = {
	display: 'flex',
	flexDirection: 'column',
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

const domainURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';

interface Props {
	proposal: Proposal | undefined;
	isOpen: boolean;
	isEditing: boolean;
	proposalSet: (proposal: Proposal) => void;
	modalClosed: () => void;

}
const ManageProposal = (props: Props) => {
	const [createProposalSuccessful, setCreateProposalSuccessful] = useState(false);
	const [createProposalFailed, setCreateProposalFailed] = useState(false);
	const [sendErrorMessage, setSendErrorMessage] = useState('');

	const { isUsingLedger } = useContext(GrimsContext);
	const { publicKey, wallet, signTransaction, signMessage } = useWallet();
	const { connection } = useConnection();

	const [proposalFormValues, setProposalFormValues] = useState<Proposal>(new Proposal());
	useEffect(() => {
		if (props.isOpen) {
			resetNotificationStates()
		}

		if (props.isEditing) {
			setProposalFormValues((values) => ({
				...values,
				...props.proposal,
			}));
		}
	}, [props.isOpen])

	const handleTextInputChange = (event: any, field: string) => {
		event.persist();

		setProposalFormValues((values: Proposal) => ({
			...values,
			[field]: event.target.value
		}));
	};

	const handleNumberInputChange = (event: any, field: string) => {
		event.persist();
		const val = parseInt(event.target.value)

		setProposalFormValues((values) => ({
			...values,
			[field]: val,
		}));
	};

	const handleCheckboxInputChange = (event: any, field: string) => {
		event.persist();
		const val = event.target.checked;

		setProposalFormValues((values) => ({
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

		setProposalFormValues((values) => ({
			...values,
			[field]: val
		}));
	};

	const manageProposal = async (event: any) => {
		event.preventDefault();

		if (!publicKey) {
			setSendErrorMessage(`No publickey`);
			return;
		}
		if (!proposalFormValues.enabledFrom) {
			setSendErrorMessage(`Please enter a Start time for the proposal!`);
			return;
		}
		if (!proposalFormValues.enabledTo) {
			setSendErrorMessage(`Please enter an End time for the proposal!`);
			return;
		}

		let data: any = {
			id: proposalFormValues._id,
			form: proposalFormValues,
			wallet: "",
			message: "",
		}
		delete data.form._id;
		data.wallet = publicKey.toString();


		let verifData: any = {
			form: proposalFormValues,
			wallet: publicKey.toString()
		}

		let [signature, blockhash] = await WalletUtils.verifyWallet(connection, publicKey, 'create-edit-proposal', verifData, isUsingLedger, signMessage, signTransaction);
		if (!signature || (isUsingLedger && !blockhash)) {
			setSendErrorMessage(`No signature or blockhash, try again`);
			return;
		}
		data.message = bs58.encode(signature);
		data.bh = blockhash;
		if (props.proposal) {
			data.id = props.proposal._id!;
		}

		try {
			resetNotificationStates()

			const manageProposalURL = `${domainURL}/ballot-box/create-proposal`
			const result = await axios.post(manageProposalURL, data);

			if (result.data.error) {
				setCreateProposalFailed(true);
				setSendErrorMessage(result.data.error);
				// setSendErrorMessage(`Information is missing from your proposal`);
				return;
			}

			if (result.data.id) {
				proposalFormValues._id = result.data.id;
			}
			props.proposalSet(proposalFormValues)
			// TODO if (!isEditing) props.proposalSet(res)
			setCreateProposalSuccessful(true);
			// TODO reset form
		} catch (err) {
			setSendErrorMessage('Unable to create your proposal');
		}
	}

	const resetNotificationStates = () => {
		setCreateProposalSuccessful(false);
		setCreateProposalFailed(false);
		setSendErrorMessage('');
	}

	const handleCloseModal = () => {
		props.modalClosed()
	}
	return (
		<Dialog
			className="unstyled-modal"
			aria-labelledby="Create Proposal"
			aria-describedby="Create Proposal"
			open={props.isOpen}
			onClose={handleCloseModal}
		>
			<Fade in={props.isOpen}>
				<Box sx={p2pModalStyle} className="modal-form" >

					<Toaster position='top-center' reverseOrder={false} toastOptions={{ duration: 5000 }} />
					<header className="is-flex is-flex-align-center is-flex-justify-space-between m-b-md">
						<h1 className="has-font-tomo">{props.isEditing ? 'Update' : 'Create'} Proposal</h1>
						<img src="/img/icon-close-circle.svg" alt="close modal icon" onClick={handleCloseModal} />
					</header>

					<form className="form is-fflex is-flex-direction-column is-flex-item is-overflow-hidden" onSubmit={manageProposal}>
						{createProposalSuccessful && <div className="is-flex is-flex-align-center"><img src="/img/icon-success.svg" alt="success icon" className="m-r-sm" /> Proposal has successfully been created!</div>}

						{createProposalFailed && <div className="is-flex is-flex-align-center"><img src="/img/icon-error.svg" alt="success icon" className="m-r-sm" /> Sorry, we were unable to create your proposal.</div>}

						{sendErrorMessage && <div className="is-flex is-flex-align-center m-b-md"><img src="/img/icon-error.svg" alt="success icon" className="m-r-sm" /> {sendErrorMessage}</div>}

						{!createProposalSuccessful && !createProposalFailed && <div className="is-fullwidth is-overflow-auto is-flex-item">
							<Grid container columns={24} spacing={2} className="m-b-sm">
								<Grid item xs={24}>
									<label className="has-font-weight-bold">Proposal title</label>
									<input
										id="proposal-title"
										className="is-fullwidth"
										placeholder="Enter proposal title"
										value={proposalFormValues.title}
										onChange={(e) => handleTextInputChange(e, 'title')}
										required={true}
									/>
								</Grid>
							</Grid>

							<Grid container columns={24} spacing={2} className="m-b-sm">
								<Grid item md={12}>
									<label className="has-font-weight-bold">Creator</label>
									<input
										id="proposal-creator"
										className="is-fullwidth"
										placeholder="Enter name of creator"
										value={proposalFormValues.author}
										onChange={(e) => handleTextInputChange(e, 'author')}
										required={true}
									/>
								</Grid>
								<Grid item md={12} className="m-b-sm">
									<label className="has-font-weight-bold">Creator link</label>
									<input
										id="proposal-author-link"
										className="is-fullwidth"
										placeholder="Enter creator link"
										value={proposalFormValues.authorLink}
										onChange={(e) => handleTextInputChange(e, 'authorLink')}
									/>
								</Grid>
							</Grid>

							<Grid container columns={24} spacing={2} className="m-b-sm">
								<Grid item xs={24}>
									<label className="has-font-weight-bold">Proposal Description</label>
									<div>
										<TextField
											id="proposal-description"
											multiline
											maxRows={4}
											className="is-fullwidth"
											placeholder="Enter proposal description"
											value={proposalFormValues.description}
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
												value={proposalFormValues.enabledFrom}
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
												value={proposalFormValues.enabledTo}
												onChange={(newValue) => {
													handleDateInputChange(newValue, 'enabledTo');
												}}
												renderInput={(params) => <TextField className="is-fullwidth" {...params} />}
											/>
										</LocalizationProvider>
									</div>
								</Grid>
							</Grid>

							<Grid container columns={24} spacing={2} className="m-b-md">
								<Grid item md={12}>

								</Grid>

								<Grid item md={12}>


									<input className="form-check-input m-t-md" type="checkbox" checked={proposalFormValues.enabled} onChange={(e) => handleCheckboxInputChange(e, 'enabled')} id="enabled" />
									<label className="m-l-sm form-check-label has-font-weight-bold" htmlFor="flexCheckDefault">
										Enabled (viewable by users)
									</label>
								</Grid>

							</Grid>


						</div>}

						<hr className="m-t-md m-b-md" />

						<div className="is-flex is-flex-justify-end">

							<button type="button" className="button is-tertiary is-xl" onClick={handleCloseModal}>
								{createProposalSuccessful || createProposalFailed ? 'Close' : 'Cancel and Close'}
							</button>
							{!createProposalSuccessful && !createProposalFailed && <button className="button is-primary is-xl m-l-sm">
								{props.isEditing ? 'Update' : 'Publish'} Proposal
							</button>}
						</div>
					</form>
				</Box>
			</Fade>
		</Dialog>
	)
};

export default ManageProposal;