import React, { useEffect, useState, useContext } from "react";
import axios from 'axios';
import Box from '@mui/material/Box';
import Fade from "@mui/material/Fade";
import { styled } from "@mui/system";
import ModalUnstyled from "@mui/base/ModalUnstyled";
import Grid from '@mui/material/Grid';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import toast, { Toaster } from 'react-hot-toast'
import { AstraRaffle } from "../models/AstraHouse";
import { GrimsContext } from "./GrimsProvider";
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
	modalClosed: () => void;
}
const GetRaffleWinners = (props: Props) => {

	const [sendErrorMessage, setSendErrorMessage] = useState('');


	const { isUsingLedger } = useContext(GrimsContext);
	const { publicKey, wallet, signTransaction } = useWallet();
	const { connection } = useConnection();

	const [winners, setWinners] = useState<Array<string>>([]);

	useEffect(() => {
		if (!props.raffle?.winners) {
			setWinners([]);
			return;
		}
		setWinners(props.raffle.winners);

	}, [props]);

	const handleCloseModal = () => {
		props.modalClosed()
	}

	const getRaffleWinners = async () => {
		if (!props.raffle) return;

		const date = new Date();
		const now = Math.floor(date.getTime());
		if (now < props.raffle.enabledTo) {
			toast.error("This raffle hasn't ended yet!");
			console.log("props.raffle.enabledTo", props.raffle.enabledTo);
			console.log("now", now);
			return;
		}

		const data = {
			id: props.raffle._id

		}
		const updateRaffleWinnersUrl = `${domainURL}/auction-house/update-raffle-winners`
		const result = await axios.post(updateRaffleWinnersUrl, data);
		if (result.data.error) {

			toast.error(result.data.error);
			return;
		}

		setWinners(result.data.winners);



	}
	return (
		<Dialog
			className="unstyled-modal"
			aria-labelledby="Finish Raffle"
			aria-describedby="Finish Raffle"
			open={props.isOpen}
			onClose={handleCloseModal}
		>
			<Fade in={props.isOpen}>
				<Box sx={p2pModalStyle} className="modal-form">

					<Toaster position='top-center' reverseOrder={false} toastOptions={{ duration: 5000 }} />
					<header className="is-flex is-flex-align-center is-flex-justify-space-between m-b-md">
						<h1 className="has-font-tomo">Finish Raffle</h1>
						<img src="/img/icon-close-circle.svg" alt="close modal icon" onClick={handleCloseModal} />
					</header>


					{winners.length > 0 && (
						<div className="m-b-lg">
							<div>Winners have successfully been rolled for this raffle!</div>
							{winners.map((winner) => (
								<div key={winner}>{winner}</div>
							))}
						</div>
					)}

					<div className="is-flex is-flex-justify-end">
						<button type="button" className="button is-tertiary is-xl" onClick={handleCloseModal}>
							{'Cancel and Close'}
						</button>

						<button type="button" disabled={winners && winners.length > 0} className="button is-primary is-xl m-l-lg" onClick={getRaffleWinners}>
							Get raffle winners
						</button>

					</div>
				</Box>
			</Fade>
		</Dialog>
	)
};

export default GetRaffleWinners;