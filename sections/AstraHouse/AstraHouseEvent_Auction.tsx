import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import bs58 from "bs58";
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import WalletUtils from '../../utils/WalletUtils';
import Utils from "../../utils/Utils";
import { GrimsContext } from "../../components/GrimsProvider";
import Alert, { AlertColor } from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import Snackbar from '@mui/material/Snackbar';
import { intervalToDuration, formatDuration, format } from 'date-fns'
import confetti from 'canvas-confetti';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import styles from './Event.module.scss'
import { AstraAuction } from '../../models/AstraHouse';
import ManageAuction from '../../components/ManageAuction';
import useInterval from '../../hooks/useInterval';

const domainURL = process.env.NEXT_PUBLIC_API_URL || '';

interface Props {
	auction: AstraAuction;
	pointsBalance: number;
	updatePointBalance: (updated: number) => void;
	auctionUpdated: (auction: AstraAuction) => void;
}
const AstraHouseEvent_Auction = (props: Props) => {
	const { isUsingLedger, canCreateRaffle } = useContext(GrimsContext);
	const { connection } = useConnection();
	const { publicKey, wallet, sendTransaction, signTransaction, signMessage } = useWallet();

	const [currentWinningWallet, setCurrentWinningWallet] = useState<string>("");
	const [hasEnded, setHasEnded] = useState<boolean>(false);

	// Time Remaining Date and Duration
	let loadDurationRefreshInterval: NodeJS.Timeout | undefined = undefined;
	const [durationTime, setDurationTime] = useState('')
	const getDuration = () => {
		const duration = intervalToDuration({
			start: new Date(),
			end: new Date(props.auction.enabledTo)
		});

		const formattedDuration = formatDuration(duration, {
			format: ['months', 'days', 'hours', 'minutes', 'seconds'],
			delimiter: ' '
		});

		const date = new Date();
		const now = Math.floor(date.getTime());

		setHasEnded(now > props.auction.enabledTo);

		setDurationTime(formattedDuration)
	}

	const [formattedDate, setFormattedDate] = useState('')
	const formatDate = (auctionEndDate: number) => {
		const d = new Date(auctionEndDate);
		const fd = format(d, 'dd MMMM yyyy');
		const ft = format(d, 'h:mm aa');

		setFormattedDate(`${fd} @ ${ft}`)
	}

	useEffect(() => {
		formatDate(props.auction.enabledTo)
		loadDurationRefreshInterval = setInterval(() => {
			getDuration()
		}, 60)


		return () => {
			clearInterval(loadDurationRefreshInterval)
		}
	}, [])


	/* use useInterval for updating state otherwise you run into weird issues with setInterval
	*/
	const autoUpdateBid = props.auction && props.auction.enabled && !hasEnded;
	const refreshCurrentBidInterval = useInterval(() => {
		if (props.auction) {
			getCurrentBid();
		}
	}, autoUpdateBid ? 5000 : null);

	useEffect(() => {
		const currentBid = props.auction.currentBid > 0 ? props.auction.currentBid : props.auction.startingBid;
		setAuctionCurrentBid(currentBid);
		setAuctionNewBid(currentBid + props.auction?.tickSize);


		if (props.auction) {
			setCurrentWinningWallet(props.auction.currentWinningWallet);
			const date = new Date();
			const now = Math.floor(date.getTime());

			setHasEnded(now > props.auction.enabledTo);
		}

	}, [props.auction]);

	const getCurrentBid = async () => {

		if (!publicKey) return;

		const auctionInfoURL = `${domainURL}/astra-house/auction/info`
		const data = {
			auction: props.auction?._id,
			wallet: publicKey.toString()
		}

		const result = await axios.post(auctionInfoURL, data);
		if (result?.data?.newMinBid) {
			if (result?.data?.newMinBid > auctionNewBid) {
				setAuctionNewBid(result?.data?.newMinBid);
			}
		}

		if (result?.data?.currentWinningWallet) {
			setCurrentWinningWallet(result?.data?.currentWinningWallet);
		}

		if (result?.data?.newCurrentBid) {
			if (result?.data?.newCurrentBid > auctionCurrentBid) {
				setAuctionCurrentBid(result?.data?.newCurrentBid);
			}
		}

		if (result?.data?.pointsBalance && props.pointsBalance !== result?.data?.pointsBalance) {
			props.updatePointBalance(Number(Utils.formatPoints(`${result?.data?.pointsBalance}`)));
		}

	}

	const [isPlacingBid, setIsPlacingBid] = useState<boolean>(false)
	const [auctionCurrentBid, setAuctionCurrentBid] = useState<number>(0)
	const [auctionNewBid, setAuctionNewBid] = useState<number>(0)

	const handleAuctionNewBidChange = (event: any, _auction: any) => {
		event.persist();

		if (!event.target.valueAsNumber) return;
		if (!props.auction) return;

		const minNewBid = props.auction.currentBid > 0 ? props.auction.currentBid + props.auction.tickSize : props.auction.startingBid;
		if (event.target.valueAsNumber < minNewBid) {
			setAuctionNewBid(minNewBid);
		} else {
			setAuctionNewBid(event.target.valueAsNumber);
		}
	};

	const handlePlaceBid = async (event: any) => {
		if (!publicKey) throw new WalletNotConnectedError()
		event.preventDefault()

		const canPlaceBid = canBid(auctionNewBid)

		if (!canPlaceBid) return

		setIsPlacingBid(true)

		try {
			const data: {
				auction: string,
				bid: number,
				currentBid: number,
				wallet: string,
				message?: string,
				bh?: string | null,
				user?: any,
			} = {
				auction: props.auction._id,
				currentBid: auctionCurrentBid,
				bid: auctionNewBid,
				wallet: publicKey.toString()
			}
			const [signature, blockhash] = await WalletUtils.verifyWallet(connection, publicKey, 'bid-on-auction', data, isUsingLedger, signMessage, signTransaction);

			if (signature) {
				const bidOnAuctionURL = `${domainURL}/astra-house/auction/bid`
				data.message = bs58.encode(signature)
				data.bh = blockhash

				const result = await axios.post(bidOnAuctionURL, data);

				if (result?.data?.success) {
					confetti({
						particleCount: 150,
						spread: 60
					});
					showNotification('Auction bid successfully complete', 'success')
					props.updatePointBalance(Number(Utils.formatPoints(`${props.pointsBalance - auctionNewBid}`)));
				}

				if (result?.data?.newMinBid) {
					if (result?.data?.newMinBid > auctionNewBid) {
						setAuctionNewBid(result?.data?.newMinBid);
					}
				}

				if (result?.data?.newCurrentBid) {
					if (result?.data?.newCurrentBid > auctionCurrentBid) {
						setAuctionCurrentBid(result?.data?.newCurrentBid);
					}
				}

				if (result?.data?.currentWinningWallet) {
					setCurrentWinningWallet(result?.data?.currentWinningWallet);
				}

				if (result?.data?.error) {
					console.error('Error:', result.data.error)
					showNotification(result.data.error, 'error')
					return
				}
			}
		} catch (err) {
			handleCaughtErrors(err)
		} finally {
			setIsPlacingBid(false)
		}
	}

	const canBid = (bid: number) => {

		const astraSpent = bid;
		const remainingAstra = props.pointsBalance - astraSpent
		const hasEnoughAstra = remainingAstra >= 0
		if (!hasEnoughAstra) {
			showNotification('Sorry, you don\'t have enough $ASTRA', 'error')
			return false
		}
		if (!bid || bid < 0) {
			showNotification(`Your bid must be at least 1`, 'error')
			return false
		}


		return true
	}
	// Notification Handling
	const handleCaughtErrors = (err: any) => {
		try {
			const errMessage = err.toJSON().message
			console.error('Error:', errMessage)
			showNotification(errMessage, 'error')
		}
		catch (e) {
			console.error(e);
		}
	}

	const [isShowingNotification, setIsShowingNotification] = useState(false);
	const [notificationMessage, setNotificationMessage] = useState('');
	const [notificationType, setNotificationType] = useState<AlertColor>('error');

	const showNotification = (msg: any, type: AlertColor = 'error') => {
		setNotificationMessage(msg)
		setNotificationType(type)
		setIsShowingNotification(true);
	};

	const handleCloseError = (event: any, reason: string) => {
		if (reason === 'clickaway') {
			return;
		}

		setIsShowingNotification(false);
	};

	const [isOpenCreateAuctionModal, setOpenUpdateAuctionModal] = React.useState<boolean>(false);
	const handleOpenUpdateAuctionModal = () => {
		setOpenUpdateAuctionModal(true);
	}

	const handleCloseUpdateAuctionModal = () => {
		setOpenUpdateAuctionModal(false);
	}

	const handleAuctionUpdated = (auction: AstraAuction) => {
		props.auctionUpdated(auction)
	}


	return (
		<>
			<Snackbar
				open={isShowingNotification}
				autoHideDuration={6000}
				onClose={handleCloseError}
				anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
			>
				<Alert severity={notificationType}>
					{notificationMessage}
				</Alert>
			</Snackbar>

			<ManageAuction
				isEditing={true}
				auction={props.auction}
				isOpen={isOpenCreateAuctionModal}
				modalClosed={handleCloseUpdateAuctionModal}
				auctionSet={auction => handleAuctionUpdated(auction)} />

			<Grid columns={24} container spacing={4}>
				<Grid item xs={24} md={8} lg={6}><img src={props.auction.image} className={`${styles['auction-image']} has-border-radius-lg`} /></Grid>
				<Grid item xs={24} md={16} lg={18}>
					<Grid columns={24} container justifyContent="space-between" alignItems="center" className={`${styles['auction-detail']}`}>
						<Grid item>
							<div className={`${styles['auction-tag']} ${styles['is-auction']} is-uppercase`}>
								<img src="/img/icon-auction-house.svg" alt="Auction icon" title="Auction" /><span className={`${styles['auction-tag-type']}`}>Auction</span>
							</div>
							{!props.auction.enabled && (
								<div className={`${styles['auction-tag']} ${styles['is-not-enabled']} is-uppercase`}>
									<img src="/img/icon-plane-boarding-pass.svg" alt="Auction icon" title="Auction" /><span className="auction-tag-type">NOT ENABLED</span>
								</div>
							)}
						</Grid>
						<Grid item className="has-text-right">
							{canCreateRaffle && (<button className="button is-tertiary is-small is-fullwidth m-b-sm" onClick={handleOpenUpdateAuctionModal}>Edit</button>)}
						</Grid>
					</Grid>

					<h2 className={`${styles['auction-title']} has-text-primary has-font-gooper-bold`}>{props.auction.title}</h2>
					{props.auction.author &&
						<div className={`${styles['auction-by']}`}>by {props.auction.authorLink ? <a href={props.auction.authorLink}>{props.auction.author}</a> : props.auction.author}</div>
					}
					{props.auction.description &&
						<div className={`${styles['auction-description']}`}>{props.auction.description}</div>
					}
					<div className={`${styles['auction-detail-container']}`}>

						{(currentWinningWallet && !hasEnded) && (
							<Grid columns={24} container justifyContent="space-between" className={`${styles['auction-detail']}`}>
								<Grid item><strong>Current winning wallet</strong></Grid>
								{(publicKey && (publicKey.toBase58() === currentWinningWallet)) && (<Grid item>You are the highest bid!</Grid>)}
								{(!publicKey || (publicKey.toBase58() !== currentWinningWallet)) && (<Grid item>{currentWinningWallet}</Grid>)}
							</Grid>
						)}
						{(currentWinningWallet && hasEnded) && (
							<Grid columns={24} container justifyContent="space-between" className={`${styles['auction-detail']}`}>
								<Grid item><strong>Winning wallet</strong></Grid>
								{(publicKey && (publicKey.toBase58() === currentWinningWallet)) && (<Grid item>You won the auction!</Grid>)}
								{(!publicKey || (publicKey.toBase58() !== currentWinningWallet)) && (<Grid item>{currentWinningWallet}</Grid>)}
							</Grid>
						)}

						{props.auction.currentBid === 0 && (
							<Grid columns={24} container justifyContent="space-between" className={`${styles['auction-detail']}`}>
								<Grid item><strong>Starting bid</strong></Grid>
								<Grid item>{auctionCurrentBid} $ASTRA</Grid>
							</Grid>
						)}
						{props.auction.currentBid > 0 && (
							<Grid columns={24} container justifyContent="space-between" className={`${styles['auction-detail']}`}>
								{hasEnded && (<Grid item><strong>Winning bid</strong></Grid>)}
								{!hasEnded && (<Grid item><strong>Current winning bid</strong></Grid>)}
								<Grid item>{auctionCurrentBid} $ASTRA</Grid>
							</Grid>
						)}


						{!hasEnded && (
							<Grid columns={24} container justifyContent="space-between" className={`${styles['auction-detail']}`}>
								<Grid item><strong>Time remaining</strong></Grid>
								<Grid item className="has-text-primary has-text-right">
									<div>{durationTime}</div>
									<div className="has-text-natural-bone"><small>{formattedDate}</small></div>
								</Grid>
							</Grid>
						)}
					</div>

					<form onSubmit={handlePlaceBid} className={`${styles['auction-form']} form`} noValidate>
						{!hasEnded && (
							<div className={`${styles['auction-form-input-container']}`}>
								<div>
									<input
										id={`auction-bid-${props.auction._id}`}
										type="number"
										className="is-fullwidth"
										placeholder={`Update current bid of ${auctionNewBid}`}
										min={auctionCurrentBid}
										step={props.auction?.tickSize}
										value={auctionNewBid || 0}
										disabled={isPlacingBid}
										onChange={(e) => handleAuctionNewBidChange(e, props.auction)}
									/>
								</div>

								<Grid columns={24} container justifyContent="space-between" className={`${styles['auction-detail']}`}>
									<Grid item>
										<div className="has-text-natural-bone m-t-sm">
											<small>$ASTRA balance: <strong>{Utils.renderBigNumber(props.pointsBalance)}</strong></small>
										</div>
									</Grid>
									<Grid item>
										<div className="has-text-natural-bone m-t-sm">
											<small>Cost in $ASTRA: <strong className="has-text-primary">{Utils.renderBigNumber(auctionNewBid)}</strong></small>
										</div>
									</Grid>
								</Grid>
							</div>
						)}
						{!hasEnded && (<div className={`${styles['auction-form-button-container']}`}><button type="submit" className="button is-primary is-xl" disabled={isPlacingBid}>Place bid</button></div>)}
					</form>
				</Grid>
			</Grid>
		</>
	)
}

export default AstraHouseEvent_Auction;