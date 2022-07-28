import React from 'react';
import { AstraAuction, AstraEvent, AstraRaffle } from '../../models/AstraHouse';
import AstraHouseEvent_Raffle from './AstraHouseEvent_Raffle';
import AstraHouseEvent_Auction from './AstraHouseEvent_Auction';

const domainURL = process.env.NEXT_PUBLIC_API_URL || '';

interface Props {
  event: AstraRaffle | AstraAuction;
  //event: AstraEvent;
  pointsBalance: number;
  updatePointBalance: (updated: number) => void;
  eventUpdated: (raffle: AstraRaffle | AstraAuction) => void;
}
const AstraHouseEvent = (props: Props) => { 



  if (props.event?.type === "RAFFLE") {
    return (<AstraHouseEvent_Raffle raffle={props.event as AstraRaffle} pointsBalance={props.pointsBalance} updatePointBalance={props.updatePointBalance} raffleUpdated={props.eventUpdated}/>);
  }
  if (props.event?.type === "AUCTION") {
    return (<AstraHouseEvent_Auction auction={props.event as AstraAuction} pointsBalance={props.pointsBalance} updatePointBalance={props.updatePointBalance} auctionUpdated={props.eventUpdated}/>);
  }

  return (<div></div>)
}

export default AstraHouseEvent;