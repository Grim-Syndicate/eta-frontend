import ProposalUI from '../BallotBox/Proposal'
import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import { GrimsContext } from '../../components/GrimsProvider';
import { Proposal } from '../../models/Proposal';
import ManageProposal from '../../components/ManageProposal';

const domainURL = process.env.NEXT_PUBLIC_API_URL || '';

const Proposals = React.forwardRef((nftFunctions, ref) => { 
  const { canCreateProposal, grims } = useContext(GrimsContext)
  const { publicKey, wallet, sendTransaction, signTransaction } = useWallet();

  const [isLoadingProposals, setIsLoadingProposals] = useState(true);
  const [proposals, setProposals] = useState<Array<Proposal>>([]);
  
  const [isOpenCreateProposalModal, setOpenCreateProposalModal] = React.useState<boolean>(false);

  const handleOpenCreateProposalModal = () => {
    setOpenCreateProposalModal(true);
  }
  const handleCloseCreateProposalModal = () => {
    setOpenCreateProposalModal(false);
  }

  const handleProposalCreated = (proposal: Proposal) => {
    if (!proposal) return;
    
    const newProposals = [...proposals];
    newProposals.push(proposal);

    setProposals(newProposals);
  }

  useEffect(() => {
    async function data() {
      await Promise.all([loadProposals()])
    }

    data();
  }, [publicKey])

  const loadProposals = async () => {
    if(!publicKey){
      return
    }

    setIsLoadingProposals(true); 

    const walletAddress = publicKey.toString()

    try {
      const getProposalsURL = `${domainURL}/ballot-box`
      const result = await axios.get(`${getProposalsURL}?wallet=${walletAddress}`);

      if (result?.data?.error) {
        console.error('Error:', result.data.error)
        return
      }

      if (result?.data?.success && result?.data?.proposals) {
        setProposals(result.data.proposals);
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoadingProposals(false);
    }
  }

  const handleProposalUpdated = (proposal: Proposal) => {
    const existingProposal = proposals.find(a => a._id === proposal._id);
    if (existingProposal) {

      const newProposals = proposals.filter(a => a._id !== proposal._id);
      newProposals.push(proposal);

      newProposals.sort((a, b) => {
        return a.title?.localeCompare(b.title);

      })
      setProposals(newProposals);


    } else {
      console.log(`Couldn't find existing proposal with id ${proposal._id} to update`, proposal);
      const newProposals = [...proposals];
      newProposals.push(proposal);
    }

  }
  const onProposalDelete = (proposal: Proposal) => {
    const newProposals = proposals.filter(a => a._id !== proposal._id);
    setProposals(newProposals);
  }

  return (
    <div>
      
      <ManageProposal
      isOpen={isOpenCreateProposalModal}
      isEditing={false}
      proposal={undefined}
      modalClosed={handleCloseCreateProposalModal}
      proposalSet={ handleProposalCreated } />

      {canCreateProposal && (
        <div className="is-flex is-flex-justify-end  m-b-sm">
          <button className="button is-primary" onClick={handleOpenCreateProposalModal}>Create Proposal</button>
        </div>
      )}

      {isLoadingProposals && <div className="has-font-heading">Loading proposals...</div>}
      {!isLoadingProposals && proposals.length === 0 && <Alert severity="info">There are no active proposals.</Alert>}
      
      {proposals.length > 0 && (
        <Grid columns={24} container spacing={2} className="m-b-md">
          {proposals.map((proposal: Proposal) =>
          <Grid item sm={24} md={24} key={proposal._id}>
            <div className="box-light p-md has-border-radius-md">
              <ProposalUI proposal={proposal} voteWeight={0} proposalUpdated={handleProposalUpdated} proposalDeleted={onProposalDelete} />
            </div>
          </Grid>
          )}
        </Grid>
      )}
    </div>
  )
});

export default Proposals;