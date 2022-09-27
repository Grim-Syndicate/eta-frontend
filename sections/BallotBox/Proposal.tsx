import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import bs58 from "bs58";
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import ReactMarkdown from 'react-markdown'
import WalletUtils from '../../utils/WalletUtils';
import { GrimsContext } from "../../components/GrimsProvider";
import Alert, { AlertColor } from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import Snackbar from '@mui/material/Snackbar';
import { intervalToDuration, formatDuration, format } from 'date-fns'
import confetti from 'canvas-confetti';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import styles from './Proposal.module.scss'
import { Proposal, ProposalVote } from '../../models/Proposal';
import ManageProposal from '../../components/ManageProposal';
import { Box, Checkbox, CircularProgress, FormControlLabel, FormGroup, styled, Typography } from '@mui/material';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import ProposalOptionEnded from './ProposalOptionEnded';

const domainURL = process.env.NEXT_PUBLIC_API_URL || '';

interface Props {
  proposal: Proposal;
  voteWeight: number;
  proposalUpdated: (proposal: Proposal) => void;
	proposalDeleted: (proposal: Proposal) => void;
}
const ProposalUI = (props: Props) => {
  const { isUsingLedger, canCreateRaffle, grimCount } = useContext(GrimsContext);
  const { connection } = useConnection();
  const { publicKey, wallet, sendTransaction, signTransaction, signMessage } = useWallet();

  // Time Remaining Date and Duration
  let loadDurationRefreshInterval:NodeJS.Timeout | undefined = undefined;
  const [durationTime, setDurationTime] = useState('')
  const [hasEnded, setHasEnded] = useState<boolean>(false);
  const [lastVotedOn, setLastVotedOn] = useState<Date>();
  const [previousVotes, setPreviousVotes] = useState<{[key:string]:boolean}>();
  const [gettingVotes, setGettingVotes] = useState<boolean>(false);
  const [votesLoaded, setVotesLoaded] = useState<boolean>(false);
  const [gettingResults, setGettingResults] = useState<boolean>(false);
  const [resultsLoaded, setResultsLoaded] = useState<boolean>(false);
  const [results, setResults] = useState<any>();
  const [totalVotes, setTotalVotes] = useState<number>(0);

  const getWalletVotes = async (proposalID:string) => {
    if(!publicKey) return
    setGettingVotes(true)
    const walletVotesURL = `${domainURL}/ballot-box/wallet-votes?wallet=${publicKey.toString()}&proposalID=${proposalID}`
    const result = await axios.get(walletVotesURL);
    if(result.data){
      if(result.data.votedOn){
        setLastVotedOn(new Date(result.data.votedOn))
      }
      setPreviousVotes(result.data.votes)
      setVotesLoaded(true)
    }
    setGettingVotes(false)
  } 

  const getResults = async (proposalID:string) => {
    setGettingResults(true)
    const resultsURL = `${domainURL}/ballot-box/results?proposalID=${proposalID}`
    const result = await axios.get(resultsURL);
    if(result.data && result.data.results){
      let votes = 0
      Object.values(result.data.results).map((proposal:any) => {
        let proposalInSupport:number = proposal.inSupport || 0
        let proposalAgainst:number = proposal.against || 0
        let proposalVotes:number = proposalInSupport + proposalAgainst
        if(proposalVotes > votes){
          votes = proposalVotes
        }
      })
      setTotalVotes(votes)
      setResults(result.data.results)
      setResultsLoaded(true)
    }
    setGettingResults(false)
  } 

  useEffect(() => {
    if(gettingVotes || votesLoaded) return
    if (props.proposal) {
      const date = new Date();
      const now = Math.floor(date.getTime());
      let ended = now > props.proposal.enabledTo;
      setHasEnded(ended);
      getWalletVotes(props.proposal._id);
      if(ended){
        getResults(props.proposal._id)
      }
    }
  }, [props?.proposal]);

  const getDuration = () => {
    const date = new Date();
    const now = Math.floor(date.getTime());
    let ended = now > props.proposal.enabledTo;
    setHasEnded(ended);
    const duration = intervalToDuration({
      start: date,
      end: new Date(props.proposal.enabledTo)
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
    const fd = format(d, 'dd MMM yyyy');
    const ft = format(d, 'h:mm aa');

    setFormattedDate(`${fd} @ ${ft}`)
  }

  useEffect(() => {
    formatDate(props.proposal.enabledTo)
    loadDurationRefreshInterval = setInterval(() => {
      getDuration()
    }, 60)

    return () => {
      clearInterval(loadDurationRefreshInterval)
    }
  }, [])

  const [isVoting, setIsVoting] = useState<boolean>(false)

  const handleVote = async (event:any) => {
    if(!publicKey) throw new WalletNotConnectedError()
    event.preventDefault()

    const grimAmount = grimCount
    const canSubmitVote = canVote(grimAmount)

    if (!canSubmitVote) return
    if (!checked) return

    setIsVoting(true)

    let votes:{ [key: string]: boolean } = {}
    for(let i = 0; i < checked.length; i++){
      let option = checked[i]
      votes[option.proposalOptionID] = option.inSupport
      if(option.subOptions){
        for(let j = 0; j < option.subOptions.length; j++){
          let subOption = option.subOptions[j]
          votes[subOption.proposalOptionID] = subOption.inSupport
        }
      }
    }

    try {
      const data:{
        proposalID:string,
        votes:any,
        voteWeight:number,
        wallet:string,
        message?:string,
        bh?:string|null,
        user?:any,
      } = {
        proposalID: props.proposal._id,
        votes: votes,
        voteWeight: grimAmount,
        wallet: publicKey.toString()
      }
      const [signature, blockhash] = await WalletUtils.verifyWallet(connection, publicKey, 'submit-vote', data, isUsingLedger, signMessage, signTransaction);

      if (signature) {
        const submitVoteURL = `${domainURL}/ballot-box/submit-vote`
        data.message = bs58.encode(signature)
        data.bh = blockhash

        const result = await axios.post(submitVoteURL, data);
        
        if (result?.data?.error) {
          console.error('Error:', result.data.error)
          showNotification(result.data.error, 'error')
          return
        }

        if (result?.data?.success) {
          setLastVotedOn(new Date())
          confetti({
            particleCount: 150,
            spread: 60
          });
          showNotification(`Vote${grimAmount == 1 ? '' : 's'} submitted successfully`, 'success')
        }
      }
    } catch (err) {
      handleCaughtErrors(err)
    } finally {
      setIsVoting(false)
    }
  }

  const canVote = (grimAmount:number) => {
    const isGrimAmountGreaterThanOne = grimAmount >= 1
    if (!isGrimAmountGreaterThanOne) {
      showNotification('You need at least 1 grim to vote', 'error')
      return false
    }
    
    return true
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

  const [isOpenCreateProposalModal, setOpenUpdateProposalModal] = React.useState<boolean>(false);
  const handleOpenUpdateProposalModal = () => {
    setOpenUpdateProposalModal(true);
  }

  const handleCloseUpdateProposalModal = () => {
    setOpenUpdateProposalModal(false);
  }

  const handleProposalUpdated = (proposal: Proposal) => {
    props.proposalUpdated(proposal)
  }

  const [checked, setChecked] = useState<ProposalVote[]>();

  useEffect(() => {
    if(!checked && previousVotes){
      let votes = []
      for(let option of props.proposal.options){
        let vote:ProposalVote = {
          proposalOptionID: option._id,
          name: option.name,
          inSupport: previousVotes[option._id] ?? false
        }
        if(option.subOptions){
          let subVotes = []
          for(let subOption of option.subOptions){
            let subVote:ProposalVote = {
              proposalOptionID: subOption._id,
              name: subOption.name,
              inSupport: previousVotes[subOption._id] ?? false
            }
            subVotes.push(subVote)
          }
          vote.subOptions = subVotes
        }
        votes.push(vote)
      }
      setChecked(votes)
    }
  }, [props?.proposal, previousVotes])

  const handleSelectAll = (inSupport:boolean) => {
    let votes = []
    for(let option of props.proposal.options){
      let vote:ProposalVote = {
        proposalOptionID: option._id,
        name: option.name,
        inSupport: inSupport
      }
      if(option.subOptions){
        let subVotes = []
        for(let subOption of option.subOptions){
          let subVote:ProposalVote = {
            proposalOptionID: subOption._id,
            name: subOption.name,
            inSupport: inSupport
          }
          subVotes.push(subVote)
        }
        vote.subOptions = subVotes
      }
      votes.push(vote)
    }
    setChecked(votes)
  }

  const handleCheck = (event: React.ChangeEvent<HTMLInputElement>, indexOption:number, indexSubOption?:number) => {
    if(!checked) return

    let votes = []
    for(let i = 0; i < checked.length; i++){
      let option = checked[i]
      let vote:ProposalVote = {
        proposalOptionID: option.proposalOptionID,
        name: option.name,
        inSupport: i == indexOption && indexSubOption == undefined ? event.target.checked : option.inSupport
      }
      if(option.subOptions){
        let subVotes = []
        for(let j = 0; j < option.subOptions.length; j++){
          let subOption = option.subOptions[j]
          let subVote:ProposalVote = {
            proposalOptionID: subOption.proposalOptionID,
            name: subOption.name,
            inSupport: j == indexSubOption ? event.target.checked : subOption.inSupport
          }
          //Parent option checked, so make the child the same
          if(i == indexOption && indexSubOption == undefined){
            subVote.inSupport = event.target.checked
          }
          subVotes.push(subVote)

          //If child is selected, make sure parent is as well
          if(indexSubOption != undefined && event.target.checked){
            vote.inSupport = true
          }
        }
        vote.subOptions = subVotes
      }
      votes.push(vote)
    }

    setChecked(votes)
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
    
    {!hasEnded && (
      <ManageProposal
        isEditing={true}
        proposal={props.proposal}
        isOpen={isOpenCreateProposalModal}
        modalClosed={handleCloseUpdateProposalModal}
        proposalSet={ proposal => handleProposalUpdated(proposal) } />
    )}

    <Grid columns={24} container spacing={4}>
      <Grid item xs={24}>
        <Grid columns={24} container justifyContent="space-between" alignItems="center" className={`${styles['proposal-detail']}`}>
          <Grid item>
            <h2 className={`${styles['proposal-title']} has-text-primary has-font-gooper-bold`}>{props.proposal.title}{!props.proposal.enabled && (
              <div className={`${styles['proposal-tag']} ${styles['is-not-enabled']} is-uppercase`}>
                <span className="proposal-tag-type">NOT ENABLED</span>
              </div>
            )}</h2>
          </Grid>
          <Grid item className="has-text-right">
            {(canCreateRaffle && !hasEnded) && (<button className="button is-tertiary is-small is-fullwidth m-b-sm" onClick={handleOpenUpdateProposalModal}>Edit</button>)}
            {!hasEnded && (<><Grid item><strong>Time remaining</strong></Grid>
              <Grid item className="has-text-primary has-text-right">
                <div>{durationTime}</div>
                <div className="has-text-natural-bone"><small>{formattedDate}</small></div>
              </Grid> </>)}
            {hasEnded && (<>
              <Grid item><strong>Concluded: </strong><small className="has-text-natural-bone">{formattedDate}</small></Grid>
              <Grid item><strong>Quorum: </strong><small className="has-text-natural-bone">{props.proposal.quorumRequired}</small> <strong>Total votes: </strong><small className="has-text-natural-bone">{totalVotes}</small></Grid>
              <Grid item><strong>Support required: </strong><small className="has-text-natural-bone">{props.proposal.supportRequired}%+ of quorum</small></Grid>
            </>)}
          </Grid>
        </Grid>

        {props.proposal.author && 
          <div className={`${styles['proposal-by']}`}>by {props.proposal.authorLink ? <a href={props.proposal.authorLink}>{props.proposal.author}</a> : props.proposal.author}</div>
        }
        <div className={`${styles['proposal-detail-container']}`}>
          {props.proposal.description && 
            <div className={`${styles['proposal-description']}`}><ReactMarkdown children={props.proposal.description} linkTarget='_blank' components={{ 
              a: ({node, ...props}) => <a {...props} className='button is-outlined is-small is-inline' style={{minWidth:'200px'}} />
            }} /></div>
          }

          {gettingVotes && <CircularProgress color="inherit" className="m-r-sm" /> }

          {hasEnded == false && props.proposal.options && checked && (<>
            <h4 className={`${styles['proposal-subtitle']}`}>Select the sections of the proposal that you support</h4>
            <a className={`${styles['proposal-select-all']}`} onClick={() => handleSelectAll(true)}>Select all</a> / <a className={`${styles['proposal-select-all']}`} onClick={() => handleSelectAll(false)}>none</a>
            <FormGroup>
            {props.proposal.options.map((option, index) => {
              let children = <></>
              if(option.subOptions){
                children = (
                  <Box sx={{ display: 'flex', flexDirection: 'column', ml: 3 }}>
                    {option.subOptions.map((subOption, subIndex) => {
                      return <FormControlLabel key={`sub${subIndex}`} control={<Checkbox sx={{
                        padding: '2px 9px',
                        '&.Mui-checked': {
                          color: '#d63a3a',
                        },
                      }} checked={checked[index].subOptions![subIndex].inSupport} onChange={(event) => handleCheck(event, index, subIndex)}  />} label={subOption.name} />
                    })}
                  </Box>
                );
              }
              return <div key={`check${index}`} ><FormControlLabel control={<Checkbox sx={{
                padding: '2px 9px',
                '&.Mui-checked': {
                  color: '#d63a3a',
                },
              }} checked={checked[index].inSupport} onChange={(event) => handleCheck(event, index)} />} label={option.name} />{children}</div>
            })}
            </FormGroup>
          </>)}

          {hasEnded && props.proposal.options && checked && results && (<>
            <h4 className={`${styles['proposal-subtitle']}`}>Proposal final votes</h4>
            {props.proposal.options.map((option, index) => {
              let children = <></>
              if(option.subOptions){
                children = (
                  <Box sx={{ display: 'flex', flexDirection: 'column', ml: 3, mt: option.subOptions.length > 0 ? 2 : 0 }}>
                    {option.subOptions.map((subOption, subIndex) => {
                      let proposalOptionID = checked[index].subOptions![subIndex].proposalOptionID
                      return <ProposalOptionEnded key={`check${index}`} proposalVoteResult={results[proposalOptionID]} proposalOption={subOption} supportRequired={props.proposal.supportRequired} />
                    })}
                  </Box>
                );
              }
              let proposalOptionID = checked[index].proposalOptionID
              return <ProposalOptionEnded key={`check${index}`} proposalVoteResult={results[proposalOptionID]} proposalOption={checked[index]} supportRequired={props.proposal.supportRequired} >
                {children}
              </ProposalOptionEnded>
            })}
          </>)}

        </div>

        <form onSubmit={handleVote} className={`${styles['proposal-form']} form`} noValidate>
          <div className={`${styles['proposal-form-input-container']}`}>
            {!hasEnded && (
            <Grid columns={24} container alignItems='center' justifyContent="space-between" className={`${styles['proposal-detail']}`}>
              <Grid item xs={12} columns={24} container alignItems='center' >
                <Grid item>
                <div className="has-text-natural-bone m-t-sm">
                  <button type="submit" className="button is-primary is-xl" disabled={isVoting || !grimCount || grimCount < 1}>{ lastVotedOn ? 'Re-submit Vote' : 'Submit Vote'}</button>
                </div>
                </Grid>
                <Grid item>
                <div className="has-text-natural-bone m-t-sm p-l-sm ">
                  <small>{isVoting ? 'Voting...' : (lastVotedOn ? `Voted on ${ format(lastVotedOn, 'dd MMMM yyyy')} @ ${format(lastVotedOn, 'h:mm aa') }` : '')}</small>
                </div>
                </Grid>
              </Grid>
              <Grid xs={12} item>
                <div className="has-text-natural-bone m-t-sm has-text-right">
                  <small><strong>Vote Weight</strong> - <strong className="has-text-primary">{grimCount ?? '-'}</strong> Grim{`${grimCount == 1 ? '' : 's'}`} in wallet</small> 
                </div>
              </Grid>
            </Grid>
            )}
          </div>
        </form>
      </Grid>
    </Grid>
    </>
  )
}

export default ProposalUI;