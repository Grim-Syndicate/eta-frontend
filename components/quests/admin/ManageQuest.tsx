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
import bs58 from "bs58";
import toast, { Toaster } from 'react-hot-toast'
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import { Quest } from "../../../models/Quests";
import { GrimsContext } from "../../GrimsProvider";
import WalletUtils from "../../../utils/WalletUtils";

const p2pModalStyle = {
	display: 'flex',
	flexDirection: 'column',
	width: 800,
	maxWidth: '80vw',
	bgcolor: "white",
	borderRadius: '12px',
	p: 3,
	overflowY: "scroll",
	margin: "30px auto",
	border: "1px solid black"
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
	quest: Quest | undefined;
	isOpen: boolean;
	isEditing: boolean;
	questSet: (quest: Quest) => void;
	onQuestDelete: (quest: Quest) => void;
	modalClosed: () => void;

}
const ManageQuest = (props: Props) => {
	const [createQuestSuccessful, setCreateQuestSuccessful] = useState(false);
	const [createQuestFailed, setCreateQuestFailed] = useState(false);
	const [sendErrorMessage, setSendErrorMessage] = useState('');

	const { isUsingLedger } = useContext(GrimsContext);
	const { publicKey, wallet, signTransaction, signMessage } = useWallet();
	const { connection } = useConnection();

	const [showTryDeleteQuestAlert, setShowTryDeleteQuestAlert] = useState<boolean>(false);
	const [confirmDeleteQuestName, setConfirmDeleteQuestName] = useState<string>("");

	const [questFormValues, setQuestFormValues] = useState<Quest>(new Quest());
	useEffect(() => {
		if (props.isOpen) {
			resetNotificationStates()
		}

		if (props.isEditing) {
			setQuestFormValues((values) => ({
				...values,
				...props.quest,
			}));
		}
	}, [props.isOpen, props.quest])

	const handleTextInputChange = (event: any, field: string) => {
		event.persist();

		setQuestFormValues((values: Quest) => ({
			...values,
			[field]: event.target.value
		}));
	};

	const handleNumberInputChange = (event: any, field: string) => {
		event.persist();
		const val = parseInt(event.target.value)

		setQuestFormValues((values) => ({
			...values,
			[field]: val,
		}));
	};

	const handleCheckboxInputChange = (event: any, field: string) => {
		event.persist();
		const val = event.target.checked;

		setQuestFormValues((values) => ({
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

		setQuestFormValues((values) => ({
			...values,
			[field]: val
		}));
	};

	const manageQuest = async (event: any) => {
		event.preventDefault();

		if (!publicKey) {
			setSendErrorMessage(`No publickey`);
			return;
		}
		if (!questFormValues.title) {
			setSendErrorMessage(`Please enter a title!`);
			return;
		}
		if (!questFormValues.enabledTo) {
			setSendErrorMessage(`Please enter an End time for the Quest!`);
			return;
		}
		if (!props.quest) return;

		questFormValues._id = props.quest._id;

		let data: any = {
			id: questFormValues._id,
			form: questFormValues,
			wallet: "",
			message: "",
		}
		data.wallet = publicKey.toString();


		if (props.quest) {
			//qu
		}
		let verifData: any = {
			form: questFormValues,
			wallet: publicKey.toString()
		}

		let [signature, blockhash] = await WalletUtils.verifyWallet(connection, publicKey, 'admin-update-quest', verifData, isUsingLedger, signMessage, signTransaction);
		if (!signature || (isUsingLedger && !blockhash)) {
			setSendErrorMessage(`No signature or blockhash, try again`);
			return;
		}
		data.message = bs58.encode(signature);
		data.bh = blockhash;
		if (props.quest) {
			data.id = props.quest._id!;
		}

		try {
			resetNotificationStates()

			const manageQuestURL = `${domainURL}/admin/quest/update`;
			const result = await axios.post(manageQuestURL, data);

			if (result.data.error) {
				setCreateQuestFailed(true);
				setSendErrorMessage(result.data.error);
				// setSendErrorMessage(`Information is missing from your Quest`);
				return;
			}

			if (result.data.id) {
				questFormValues._id = result.data.id;
			}
			props.questSet(questFormValues)
			// TODO if (!isEditing) props.QuestSet(res)
			setCreateQuestSuccessful(true);
			// TODO reset form
		} catch (err) {
			console.log("err", err);
			setSendErrorMessage('Unable to create your Quest');
		}
	}

	const resetNotificationStates = () => {
		setCreateQuestSuccessful(false);
		setCreateQuestFailed(false);
		setSendErrorMessage('');
	}

	const handleCloseModal = () => {
		props.modalClosed()
	}
	const tryDeleteQuest = async () => {
		setShowTryDeleteQuestAlert(true);
	}

	const deleteQuest = async () => {

		if (!publicKey) return;
		if (confirmDeleteQuestName !== props.quest?.title) return;


		let data: any = {
			id: null,
			auctionId: props.quest?._id,
			wallet: publicKey.toString(),
			message: "",
		}

		let verifData: any = {
			auctionId: props.quest?._id,
			wallet: publicKey.toString()
		}

		let [signature, blockhash] = await WalletUtils.verifyWallet(connection, publicKey, 'delete-event', verifData, isUsingLedger, signMessage, signTransaction);
		if (!signature || (isUsingLedger && !blockhash)) {
			setSendErrorMessage(`No signature or blockhash, try again`);
			return;
		}

		data.message = bs58.encode(signature);
		data.bh = blockhash;
		if (props.quest) {
			data.id = props.quest._id!;
		}

		const manageQuestURL = `${domainURL}/auction-house/delete-auction`
		const result = await axios.post(manageQuestURL, data);

		if (result.data.error) {
			setCreateQuestFailed(true);
			setSendErrorMessage(result.data.error);
			// setSendErrorMessage(`Information is missing from your Quest`);
			return;
		}

		props.onQuestDelete(props.quest);
	}

	return (
		<Fade in={props.isOpen} style={{display: `${props.isOpen ? 'block' : 'none'}`}}>
			<Box sx={p2pModalStyle}>

				<Toaster position='top-center' reverseOrder={false} toastOptions={{ duration: 5000 }} />
				<div className="is-flex is-flex-align-center is-flex-justify-space-between m-b-md">
					<h1 className="has-font-tomo">{props.isEditing ? 'Update' : 'Create'} Quest</h1>

					<div className="is-flex is-flex-align-center is-flex-justify-space-between m-b-md">

						{props.quest && (
							<IconButton color="error" className="m-r-md" onClick={tryDeleteQuest}>
								<DeleteIcon />
							</IconButton>
						)}

						<img src="/img/icon-close-circle.svg" alt="close modal icon" onClick={handleCloseModal} />
					</div>
				</div>

				<form className="form is-fflex is-flex-direction-column is-flex-item is-overflow-hidden" onSubmit={manageQuest}>
					{createQuestSuccessful && <div className="is-flex is-flex-align-center"><img src="/img/icon-success.svg" alt="success icon" className="m-r-sm" /> Quest has successfully been created!</div>}

					{createQuestFailed && <div className="is-flex is-flex-align-center"><img src="/img/icon-error.svg" alt="success icon" className="m-r-sm" /> Sorry, we were unable to create your Quest.</div>}

					{sendErrorMessage && <div className="is-flex is-flex-align-center m-b-md"><img src="/img/icon-error.svg" alt="success icon" className="m-r-sm" /> {sendErrorMessage}</div>}

					{!createQuestSuccessful && !createQuestFailed && <div className="is-fullwidth is-overflow-auto is-flex-item">
						<Grid container columns={24} spacing={2} className="m-b-sm">
							<Grid item xs={24}>
								<label className="has-font-weight-bold">Quest title</label>
								<input
									id="Quest-title"
									className="is-fullwidth"
									placeholder="Enter Quest title"
									value={questFormValues.title}
									onChange={(e) => handleTextInputChange(e, 'title')}
									required={true}
								/>
							</Grid>
						</Grid>

						<Grid container columns={24} spacing={2} className="m-b-sm">
							<Grid item xs={24}>
								<label className="has-font-weight-bold">Quest Description</label>
								<div>
									<TextField
										id="Quest-description"
										multiline
										maxRows={4}
										className="is-fullwidth"
										placeholder="Enter Quest description"
										value={questFormValues.shortDescription}
										onChange={(e) => handleTextInputChange(e, 'shortDescription')} />
								</div>
							</Grid>
						</Grid>

						<Grid container columns={24} spacing={2} className="m-b-sm">
							<Grid item md={12}>
								<label className="has-font-weight-bold">Start date</label>
								<div>
									<LocalizationProvider dateAdapter={AdapterDateFns}>
										<DateTimePicker
											value={questFormValues.enabledFrom}
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
											value={questFormValues.enabledTo}
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


								<input className="form-check-input m-t-md" type="checkbox" checked={questFormValues.enabled} onChange={(e) => handleCheckboxInputChange(e, 'enabled')} id="enabled" />
								<label className="m-l-sm form-check-label has-font-weight-bold" htmlFor="flexCheckDefault">
									Enabled (viewable by users)
								</label>
							</Grid>

						</Grid>

						<Grid container columns={24} spacing={2} className="m-b-sm">
							<Grid item md={12}>
								<label className="has-font-weight-bold">Stamina</label>
								<input
									id="Quest-creator"
									className="is-fullwidth"
									type="number"
									placeholder="Enter name of artist or creator"
									value={questFormValues.stamina}
									onChange={(e) => handleTextInputChange(e, 'stamina')}
									required={true}
								/>
							</Grid>
						</Grid>

						<Grid container columns={24} spacing={2} className="m-b-sm">
							<Grid item xs={24}>
								<label className="has-font-weight-bold">Thumbnail image link</label>
								<input
									id="Quest-title"
									className="is-fullwidth"
									placeholder="Enter Quest image URL"
									value={questFormValues.image}
									onChange={(e) => handleTextInputChange(e, 'image')}
									required={true}
								/>
							</Grid>
						</Grid>


					</div>}

					<hr className="m-t-md m-b-md" />

					<div className="is-flex is-flex-justify-end">


						<button type="button" className="button is-tertiary is-xl" onClick={handleCloseModal}>
							{createQuestSuccessful || createQuestFailed ? 'Close' : 'Cancel and Close'}
						</button>
						{!createQuestSuccessful && !createQuestFailed && <button className="button is-primary is-xl m-l-sm">
							{props.isEditing ? 'Update' : 'Publish'} Quest
						</button>}
					</div>
				</form>
				<Dialog open={showTryDeleteQuestAlert} onClose={() => setShowTryDeleteQuestAlert(false)}>
					<DialogTitle>Confirm Deletion</DialogTitle>
					<DialogContent>
						<DialogContentText>
							To confirm that you wish you delete this Quest please type the Quest's name in the box below.
						</DialogContentText>
						<TextField
							onChange={(e) => { setConfirmDeleteQuestName(e.target.value) }}
							autoFocus
							margin="dense"
							id="name"
							label="Quest Name"
							type="text"
							fullWidth
							variant="standard"
						/>
					</DialogContent>
					<DialogActions>
						<Button onClick={() => setShowTryDeleteQuestAlert(false)}>Cancel</Button>
						<Button color="secondary" disabled={confirmDeleteQuestName !== props.quest?.title} onClick={deleteQuest}>Delete</Button>
					</DialogActions>
				</Dialog>
			</Box>
		</Fade>
	)
};

export default ManageQuest;