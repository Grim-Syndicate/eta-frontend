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

const domainURL = process.env.NEXT_PUBLIC_API_URL || '';

const AstraHouseEvent = (props:any) => {
  const { isUsingLedger } = useContext(GrimsContext);
  const { connection } = useConnection();
  const { publicKey, wallet, sendTransaction, signTransaction, signMessage } = useWallet();

  // Time Remaining Date and Duration
  let loadDurationRefreshInterval:NodeJS.Timeout | undefined = undefined;
  const [durationTime, setDurationTime] = useState('')
  const getDuration = () => {
    const duration = intervalToDuration({
      start: new Date(),
      end: new Date(props.auction.enabledTo)
    });
    
    const formattedDuration = formatDuration(duration, {
      format: ['days', 'hours', 'minutes'],
      delimiter: ' '
    });
    
    setDurationTime(formattedDuration)
  }
  
  const [formattedDate, setFormattedDate] = useState('')
  const formatDate = (auctionEndDate:number) => {
    const d = new Date(auctionEndDate);
    const fd = format(d, 'dd MMMM yyyy');
    const ft = format(d, 'h:mm aa');

    setFormattedDate(`${fd} @ ${ft}`)
  }

  useEffect(() => {
    formatDate(props.auction.enabledTo)
    const initialWalletTickets = props.auction.walletTickets ?? 0
    setWalletTickets(initialWalletTickets)
    loadDurationRefreshInterval = setInterval(() => {
      getDuration()
    }, 60)

    return () => {
      clearInterval(loadDurationRefreshInterval)
    }
  }, [])

  // Raffle Tickets
  const [isPlacingBid, setIsPlacingBid] = useState(false)
  const [raffleTicketAmount, setRaffleTicketAmount] = useState(0)
  const [walletTickets, setWalletTickets] = useState(props.auction.walletTickets)
  const [totalTickets, setTotalTickets] = useState(props.auction.totalTickets)
  const [totalAstraPrice, setTotalAstraPrice] = useState(0)

  useEffect(() => {
    const parsedTicketAmount = raffleTicketAmount
    const isRaffleTicketAmountWholeNumber  = Number.isInteger(parsedTicketAmount)

    if (!isRaffleTicketAmountWholeNumber) setRaffleTicketAmount(raffleTicketAmount)

    const totalAstra = raffleTicketAmount * props.auction.ticketPrice
    setTotalAstraPrice(totalAstra)
  }, [raffleTicketAmount])

  const handleRaffleTicketCountChange = (event:any, _auction:any) => {
    event.persist();
    setRaffleTicketAmount(event.target.value);
  };

  const handlePlaceBid = async (event:any) => {
    if(!publicKey) throw new WalletNotConnectedError()
    event.preventDefault()

    const parsedTicketAmount = raffleTicketAmount
    const canPlaceBid = canBid(parsedTicketAmount)

    if (!canPlaceBid) return

    setIsPlacingBid(true)

    try {
      const data:{
        raffle:string,
        tickets:number,
        wallet:string,
        message?:string,
        bh?:string|null,
        user?:any,
      } = {
        raffle: props.auction._id,
        tickets: parsedTicketAmount,
        wallet: publicKey.toString()
      }
      const [signature, blockhash] = await WalletUtils.verifyWallet(connection, publicKey, 'buy-ticket', data, isUsingLedger, signMessage, signTransaction);

      if (signature) {
        const buyRaffleTicketsURL = `${domainURL}/auction-house/buy-tickets`
        data.message = bs58.encode(signature)
        data.bh = blockhash

        const result = await axios.post(buyRaffleTicketsURL, data);
        
        if (result?.data?.error) {
          console.error('Error:', result.data.error)
          showNotification(result.data.error, 'error')
          return
        }

        if (result?.data?.success) {
          confetti({
            particleCount: 150,
            spread: 60
          });
          showNotification('Raffle tickets successfully purchased', 'success')
          setWalletTickets(parseInt(walletTickets) + raffleTicketAmount)
          setTotalTickets(parseInt(totalTickets) + raffleTicketAmount)
          updateAstraBalance(raffleTicketAmount)
          setRaffleTicketAmount(0);
        }
      }
    } catch (err) {
      handleCaughtErrors(err)
    } finally {
      setIsPlacingBid(false)
    }
  }

  const canBid = (parsedTicketAmount:number) => {
    const astraSpent = parsedTicketAmount * props.auction.ticketPrice
    const remainingAstra = props.pointsBalance - astraSpent
    const hasEnoughAstra  = remainingAstra >= 0
    if (!hasEnoughAstra) {
      showNotification('Sorry, you don\'t have enough $ASTRA', 'error')
      return false
    }
    
    const isRaffleTicketAmountGreaterThanOne = parsedTicketAmount >= 1
    if (!isRaffleTicketAmountGreaterThanOne) {
      showNotification('Ticket amount must be at least 1', 'error')
      return false
    }

    const isRaffleTicketAmountWholeNumber  = Number.isInteger(parsedTicketAmount)
    if (!isRaffleTicketAmountWholeNumber) {
      showNotification('Ticket amount must be in increments of 1', 'error')
      return false
    }
    
    if(props.auction.maxTickets > 0){
      const isRaffleTicketMountLessThanMax = parsedTicketAmount <= props.auction.maxTickets
      if (!isRaffleTicketMountLessThanMax) {
        showNotification('Ticket amount must be less or equal than the max allowed', 'error')
        return false
      }
    }
    
    return true
  }

  const updateAstraBalance = (ticketCount:number) => {
    const astraSpent = ticketCount * props.auction.ticketPrice
    const remainingAstra = props.pointsBalance - astraSpent
    props.updatePointBalance(Utils.formatPoints(`${remainingAstra}`))
  }

  // Notification Handling
  const handleCaughtErrors = (err:any) => {
    const errMessage = err.toJSON().message
    console.error('Error:', errMessage)
    showNotification(errMessage, 'error')
  }

  const [isShowingNotification, setIsShowingNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<AlertColor>('error');

  const showNotification = (msg:any, type:AlertColor = 'error') => {
    setNotificationMessage(msg)
    setNotificationType(type)
    setIsShowingNotification(true);
  };

  const handleCloseError = (event:any, reason:string) => {
    if (reason === 'clickaway') {
      return;
    }

    setIsShowingNotification(false);
  };

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
    
    <Grid columns={24} container spacing={4}>
      <Grid item xs={24} md={8} lg={6}><img src={props.auction.image} className={`${styles['auction-image']} has-border-radius-lg`} /></Grid>
      <Grid item xs={24} md={16} lg={18}>
        <Grid columns={24} container justifyContent="space-between" alignItems="center" className={`${styles['auction-detail']}`}>
          <Grid item>
            <div className={`${styles['auction-tag']} ${styles['is-raffle']} is-uppercase`}>
              <img src="/img/icon-plane-boarding-pass.svg" alt="Raffle icon" title="Raffle" /><span className={`${styles['auction-tag-type']}`}>Raffle</span>
            </div>
          </Grid>
          <Grid item className="has-text-right"><strong>{walletTickets}</strong> tickets purchased</Grid>
        </Grid>

        <h2 className={`${styles['auction-title']} has-text-primary has-font-gooper-bold`}>{props.auction.title}</h2>
        {props.auction.author && 
          <div className={`${styles['auction-by']}`}>by {props.auction.authorLink ? <a href={props.auction.authorLink}>{props.auction.author}</a> : props.auction.author}</div>
        }
        {props.auction.description && 
          <div className={`${styles['auction-description']}`}>{props.auction.description}</div>
        }
        <div className={`${styles['auction-detail-container']}`}>
        <Grid columns={24} container justifyContent="space-between" className={`${styles['auction-detail']}`}>
            <Grid item><strong>Cost per ticket</strong></Grid>
            <Grid item>{props.auction.ticketPrice} $ASTRA</Grid>
          </Grid>
          {props.auction.maxTickets > 0 && 
          <Grid columns={24} container justifyContent="space-between" className={`${styles['auction-detail']}`}>
            <Grid item><strong>Maximum tickets allowed</strong></Grid>
            <Grid item>{props.auction.maxTickets}</Grid>
          </Grid>}
          {props.auction.winnerCount > 1 && 
          <Grid columns={24} container justifyContent="space-between" className={`${styles['auction-detail']}`}>
            <Grid item><strong>Number of winners</strong></Grid>
            <Grid item>{props.auction.winnerCount}</Grid>
          </Grid>}
          <Grid columns={24} container justifyContent="space-between" className={`${styles['auction-detail']}`}>
            <Grid item><strong>Total entries</strong></Grid>
            <Grid item>{totalTickets} entries</Grid>
          </Grid>
          <Grid columns={24} container justifyContent="space-between" className={`${styles['auction-detail']}`}>
            <Grid item><strong>Time remaining</strong></Grid>
            <Grid item className="has-text-primary has-text-right">
              <div>{durationTime}</div>
              <div className="has-text-natural-bone"><small>{formattedDate}</small></div>
            </Grid>
          </Grid>
        </div>

        <form onSubmit={handlePlaceBid} className={`${styles['auction-form']} form`} noValidate>
          <div className={`${styles['auction-form-input-container']}`}>
            <div>
              <input
                id={`raffle-bid-${props.auction._id}`}
                type="number"
                className="is-fullwidth"
                placeholder="Enter # of raffle tickets"
                min="1"
                step="1"
                value={raffleTicketAmount || ''}
                disabled={isPlacingBid}
                onChange={(e) => handleRaffleTicketCountChange(e, props.auction)}
              />
            </div>

            <Grid columns={24} container justifyContent="space-between" className={`${styles['auction-detail']}`}>
              <Grid item>
                <div className="has-text-natural-bone m-t-sm">
                  <small>$ASTRA balance: <strong>{Utils.renderBigNumber(parseInt(props.pointsBalance))}</strong></small>
                </div>
              </Grid>
              <Grid item>
                <div className="has-text-natural-bone m-t-sm">
                  <small>Cost in $ASTRA: <strong className="has-text-primary">{Utils.renderBigNumber(totalAstraPrice)}</strong></small>
                </div>
              </Grid>
            </Grid>
          </div>
          <div className={`${styles['auction-form-button-container']}`}><button type="submit" className="button is-primary is-xl" disabled={isPlacingBid}>Buy Raffle Ticket</button></div>
        </form>
      </Grid>
    </Grid>
    </>
  )
}

export default AstraHouseEvent;