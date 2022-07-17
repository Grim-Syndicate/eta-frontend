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
import { AstraEvent, AstraRaffle } from '../../models/AstraHouse';
import AstraHouseEvent_Raffle from './AstraHouseEvent_Raffle';

const domainURL = process.env.NEXT_PUBLIC_API_URL || '';

interface Props {
  raffle: AstraRaffle;
  //event: AstraEvent;
  pointsBalance: number;
  updatePointBalance: (updated: number) => void;
  raffleUpdated: (raffle: AstraRaffle) => void;
}
const AstraHouseEvent = (props: Props) => { 
  return (<AstraHouseEvent_Raffle raffle={props.raffle} pointsBalance={props.pointsBalance} updatePointBalance={props.updatePointBalance} raffleUpdated={props.raffleUpdated}/>);
  /*
  if (props.event.type === "RAFFLE") {
    return (<AstraHouseEvent_Raffle raffle={props.raffle.event} pointsBalance={props.pointsBalance} updatePointBalance={props.updatePointBalance} raffleUpdated={props.handleRaffleUpdated}/>);
  }*/

  return (<></>)
}

export default AstraHouseEvent;