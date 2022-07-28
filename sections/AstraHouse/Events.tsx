import AstraHouseEvent from './Event'
import AstraHousePastEvent from './PastEvent'
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import Utils from "../../utils/Utils";
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import { AstraAuction, AstraRaffle } from '../../models/AstraHouse';

const domainURL = process.env.NEXT_PUBLIC_API_URL || '';

const AstraHouseEvents = React.forwardRef((nftFunctions, ref) => { 
  const { publicKey, wallet, sendTransaction, signTransaction } = useWallet();

  const [isLoadingAuctionEvents, setIsLoadingAuctionEvents] = useState(true);
  const [astraEvents, setAstraEvents] = useState<Array<AstraRaffle | AstraAuction>>([]);

  const [isLoadingPastEvents, setIsLoadingPastEvents] = useState(true);
  const [pastEvents, setPastEvents] = useState<Array<AstraRaffle | AstraAuction>>([]);

  useEffect(() => {
    async function data() {
      await Promise.all([getGrimState(), loadAstraEvents(), loadPastEvents()])
    }

    data();
  }, [publicKey])

  const loadAstraEvents = async () => {
    if(!publicKey){
      return
    }

    setIsLoadingAuctionEvents(true); 

    const walletAddress = publicKey.toString()

    try {
      const getAuctionEventsURL = `${domainURL}/auction-house`
      const result = await axios.get(`${getAuctionEventsURL}?wallet=${walletAddress}`);

      if (result?.data?.error) {
        console.error('Error:', result.data.error)
        return
      }

      if (result?.data?.success && result?.data?.events) {
        setAstraEvents(result.data.events);
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoadingAuctionEvents(false);
    }
  }

  const loadPastEvents = async () => {
    if(!publicKey){
      return
    }

    setIsLoadingPastEvents(true); 

    try {
      const getPastEventsURL = `${domainURL}/auction-house/past-events`
      const result = await axios.get(`${getPastEventsURL}`);

      if (result?.data?.error) {
        console.error('Error:', result.data.error)
        return
      }

      if (result?.data?.success && result?.data?.events) {
        setPastEvents(result?.data?.events);
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoadingPastEvents(false);
    }
  }


  // $ASTRA balance
  const [pointsBalance, setPointsBalance] = useState(0);
  const getGrimState = async () => {
    if (!publicKey) return

    try {
      const getGrimStateURL = domainURL + "/grims-state";
      const result = await axios.get(getGrimStateURL + "?wallet=" + publicKey);
      if (result?.data?.success && result?.data?.wallet) {
        setPointsBalance(parseFloat(Utils.formatPoints(result.data.wallet.pointsBalance)));
      }
    } catch (err:any) {
      const errMessage = err.toJSON().message
      console.error('Error:', errMessage)
    }
  }

  const updateAstraBalance = (pointBalance:number) => {
    setPointsBalance(pointBalance)
  }

  const handleEventUpdated = (event: AstraRaffle | AstraAuction) => {
    const existingRaffle = astraEvents.find(a => a._id === event._id);
    if (existingRaffle) {

      const newAuctionEvents = astraEvents.filter(a => a._id !== event._id);
      newAuctionEvents.push(event);

      newAuctionEvents.sort((a, b) => {
        return a.title?.localeCompare(b.title);

      })
      setAstraEvents(newAuctionEvents);


    } else {
      console.log(`Couldn't find existing raffle with id ${event._id} to update`, event);
    }

  }

  return (
    <div>
      {isLoadingAuctionEvents && <div className="has-font-heading">Loading raffles...</div>}
      {!isLoadingAuctionEvents && astraEvents.length === 0 && <Alert severity="info">There are no raffles at this time.</Alert>}
      
      {astraEvents.length > 0 && (
        <Grid columns={24} container spacing={2} className="m-b-md">
          {astraEvents.map((event: AstraRaffle | AstraAuction) =>
          <Grid item sm={12} md={24} key={event._id}>
            <div className="box-light p-md has-border-radius-md">
              <AstraHouseEvent event={event} pointsBalance={pointsBalance} updatePointBalance={updateAstraBalance} eventUpdated={handleEventUpdated} />
            </div>
          </Grid>
          )}
        </Grid>
      )}
      
      <h2 className="has-font-gooper-bold">Past Events</h2>
      {pastEvents.length > 0 && (
        <Grid columns={24} container spacing={2} className="m-b-md">
          {pastEvents.map((event:AstraRaffle | AstraAuction) =>
          <Grid item sm={12} md={24} key={event._id}>
            <div className="box-light p-md has-border-radius-md">
              <AstraHousePastEvent event={event} pointsBalance={pointsBalance} updatePointBalance={updateAstraBalance} eventUpdated={handleEventUpdated}  />
            </div>
          </Grid>
          )}
        </Grid>
      )}
    </div>
  )
});

export default AstraHouseEvents;