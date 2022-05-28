import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useWallet } from '@solana/wallet-adapter-react';
import Alert from '@mui/material/Alert';
import { format } from 'date-fns'
import Utils from "../../utils/Utils";

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import styles from './MyRaffles.module.scss'

const domainURL = process.env.NEXT_PUBLIC_API_URL || '';

const AuctionHouseMyRaffles = React.forwardRef((nftFunctions, ref) => { 
  const { publicKey, wallet, sendTransaction, signTransaction } = useWallet();

  const [isLoadingMyRaffles, setIsLoadingMyRaffles] = useState(true);
  const [myRaffles, setMyRaffles] = useState([]);

  useEffect(() => {
    async function data() {
      await loadMyRaffles()
    }

    data();
  }, [publicKey])

  const loadMyRaffles = async () => {
    if(!publicKey){
      return
    }

    setIsLoadingMyRaffles(true); 

    const walletAddress = publicKey.toString()

    try {
      const getMyRafflesURL = `${domainURL}/auction-house/my-raffles`
      const result = await axios.get(`${getMyRafflesURL}?wallet=${walletAddress}`);

      if (result?.data?.error) {
        console.error('Error:', result.data.error)
        return
      }

      if (result?.data?.success && result?.data?.raffles) {
        const myRaffles = result.data.raffles
        setMyRaffles(myRaffles);
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoadingMyRaffles(false);
    }
  }

  const formatDate = (timestamp:number) => {
    const d = new Date(timestamp);
    const fd = format(d, 'dd MMMM yyyy');
    const ft = format(d, 'h:mm aa');

    return `${fd} @ ${ft}`
  }

  return (
    <div>
      {isLoadingMyRaffles && <div className="has-font-heading">Loading raffles...</div>}
      {!isLoadingMyRaffles && myRaffles.length === 0 && <Alert severity="info">You have not entered any raffles yet.</Alert>}
      
      {myRaffles.length > 0 && (
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Raffle</TableCell>
              <TableCell align="center"># of Tickets</TableCell>
              <TableCell align="center">Total $ASTRA</TableCell>
              <TableCell>Entry Date</TableCell>
              <TableCell>Ends</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {myRaffles.map((entry:any) =>
              <TableRow key={entry._id}>
                <TableCell>
                  <strong>{entry.raffle.title}</strong>
                  <div className="has-text-natural-grey m-t-xs"><small>{entry.raffle.ticketPrice} $ASTRA/ticket</small></div>
                </TableCell>
                <TableCell align="center">{entry.tickets}</TableCell>
                <TableCell align="center">{Utils.renderBigNumber(entry.totalCost)}</TableCell>
                <TableCell>{formatDate(entry.entryDate)}</TableCell>
                <TableCell><strong className={!entry.raffle.ended ? 'has-text-base-legendary': ''}>{entry.raffle.ended ? 'Ended ' : 'Live'}</strong><div className="m-t-xs"><small>{!entry.raffle.ended && 'Ends'} {formatDate(entry.raffle.enabledTo)}</small></div></TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      )}
    </div>
  )
});

export default AuctionHouseMyRaffles;