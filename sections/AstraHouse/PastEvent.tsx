import React, { useContext } from 'react';
import Grid from '@mui/material/Grid';
import styles from './Event.module.scss'
import { GrimsContext } from '../../components/GrimsProvider';
import { AstraAuction, AstraRaffle } from '../../models/AstraHouse';
import GetRaffleWinners from '../../components/GetRaffleWinners';
import AstraHouseEvent_Raffle from './AstraHouseEvent_Raffle';
import AstraHouseEvent_Auction from './AstraHouseEvent_Auction';

interface Props {
  event: AstraRaffle | AstraAuction;
  //event: AstraEvent;
  pointsBalance: number;
  updatePointBalance: (updated: number) => void;
  eventUpdated: (raffle: AstraRaffle | AstraAuction) => void;
}
const AstraHousePastEvent = (props: Props) => {
  const { canCreateRaffle } = useContext(GrimsContext);

  const [isOpenCreateRaffleModal, setOpenUpdateRaffleModal] = React.useState(false);
  const handleOpenUpdateRaffleModal = () => {
    setOpenUpdateRaffleModal(true);
  }

  const handleCloseUpdateRaffleModal = () => {
    setOpenUpdateRaffleModal(false);
  }
  return (
    <>

    {props.event?.type === "RAFFLE" && (
      <GetRaffleWinners
        isEditing={true}
        raffle={props.event as AstraRaffle}
        isOpen={isOpenCreateRaffleModal}
        modalClosed={handleCloseUpdateRaffleModal}/>
    )}
    
    
    {props.event?.type === "RAFFLE" && (<AstraHouseEvent_Raffle raffle={props.event as AstraRaffle} pointsBalance={props.pointsBalance} updatePointBalance={props.updatePointBalance} raffleUpdated={props.eventUpdated}/>)}
    
    {props.event?.type === "AUCTION" && (<AstraHouseEvent_Auction auction={props.event as AstraAuction} pointsBalance={props.pointsBalance} updatePointBalance={props.updatePointBalance} auctionUpdated={props.eventUpdated}/>)}
  


    </>
  )
}

export default AstraHousePastEvent;