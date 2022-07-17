import React, { useContext } from 'react';
import Grid from '@mui/material/Grid';
import styles from './Event.module.scss'
import { GrimsContext } from '../../components/GrimsProvider';
import { AstraRaffle } from '../../models/AstraHouse';
import GetRaffleWinners from '../../components/GetRaffleWinners';

const AstraHousePastEvent = (props:any) => {
  const { canCreateRaffle } = useContext(GrimsContext);

  const [isOpenCreateRaffleModal, setOpenUpdateRaffleModal] = React.useState(false);
  const handleOpenUpdateRaffleModal = () => {
    setOpenUpdateRaffleModal(true);
  }

  const handleCloseUpdateRaffleModal = () => {
    setOpenUpdateRaffleModal(false);
  }

  const handleRaffleUpdated = (raffle: AstraRaffle) => {
    props.raffleUpdated(raffle)
  }
  return (
    <>
    <GetRaffleWinners
      isEditing={true}
      raffle={props.auction}
      isOpen={isOpenCreateRaffleModal}
      modalClosed={handleCloseUpdateRaffleModal}
      raffleSet={ (raffle: AstraRaffle) => handleRaffleUpdated(raffle) } />
    
    <Grid columns={24} container spacing={4}>
      <Grid item xs={24} md={6} lg={4}><img src={props.auction.image} className={`${styles['auction-image']} has-border-radius-lg`} /></Grid>
      <Grid item xs={24} md={18} lg={20}>
        <Grid columns={24} container justifyContent="space-between" alignItems="center" className={`${styles['auction-detail']}`}>
          <Grid item>
            <div className={`${styles['auction-tag']} ${styles['is-raffle']} is-uppercase`}>
              <img src="/img/icon-plane-boarding-pass.svg" alt="Raffle icon" title="Raffle" /><span className={`${styles['auction-tag-type']}`}>Raffle</span>
            </div>
          </Grid>
          
          <Grid item className="has-text-right">
            {canCreateRaffle && (<button className="button is-tertiary is-small is-fullwidth m-b-sm" onClick={handleOpenUpdateRaffleModal}>Finish Raffle</button>)}
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
        <Grid columns={24} container justifyContent="space-between" className={`${styles['auction-detail']}`}>
            <Grid item><strong>Cost per ticket</strong></Grid>
            <Grid item>{props.auction.ticketPrice} $ASTRA</Grid>
          </Grid>
          <Grid columns={24} container justifyContent="space-between" className={`${styles['auction-detail']}`}>
            <Grid item><strong>Total entries</strong></Grid>
            <Grid item>{props.auction.totalTickets} entries</Grid>
          </Grid>
          <Grid columns={24} container justifyContent="space-between" className={`${styles['auction-detail']}`}>
            <Grid item><strong>Winner{props.auction.winners?.length > 1 ? 's' : ''}</strong></Grid>
            {props.auction.winners && 
              <Grid item>{props.auction.winners.map((winner:any) => <span>{winner.slice(0, 4) + '...' + winner.slice(-4)}<br /></span>)}</Grid>
            }
            {!props.auction.winners && <Grid item>Pending draw</Grid> }
          </Grid>
        </div>
      </Grid>
    </Grid>
    </>
  )
}

export default AstraHousePastEvent;