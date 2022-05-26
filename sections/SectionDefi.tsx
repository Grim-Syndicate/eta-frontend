import React, { useEffect, useState } from "react";
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Link from '@mui/material/Link';

import axios from "axios";
import { TextField, InputAdornment, FormControl, InputLabel, OutlinedInput } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Marinade, MarinadeState, MarinadeReferralPartnerState, MarinadeConfig, web3, MarinadeUtils } from '@marinade.finance/marinade-ts-sdk'
import { WalletError } from '@solana/wallet-adapter-base'
import toast, { Toaster } from 'react-hot-toast'
import { PublicKey } from "@solana/web3.js";
import { BN } from "bn.js";

const tabTheme = createTheme({
  palette: {
    primary: {
      main: '#d63a3a'
    },
    secondary: {
      main: '#111'
    }
  },
  typography: {
    fontFamily: `"Nunito", "Helvetica", "Arial", sans-serif`,
    fontSize: 16,
    button: {
      textTransform: 'none',
    }
  }
});


const SectionDefi = React.forwardRef(() => { 
  const { connection } = useConnection()
  const { publicKey, sendTransaction } = useWallet()
  const [marinade, setMarinade] = useState<Marinade | null>(null)
  const [marinadeState, setMarinadeState] = useState<MarinadeState | null>(null)
  const [referralPartnerState, setReferralPartnerState] = useState<MarinadeReferralPartnerState | null>(null)

  const [tabValue, setTabValue] = useState('stake');
  const [stakeAmount, setStakeAmount] = useState('')
  const [unstakeAmount, setUnstakeAmount] = useState('')
  const [projectedAPY, setProjectedAPY] = useState<number | null>(null)
  const [validatorCount, setValidatorCount] = useState<number | null>(null)
  const [stakeConversionAmount, setStakeConversionAmount] = useState(0)
  const [solBalance, setSolBalance] = useState(0)
  const [mSolBalance, setMSolBalance] = useState<number>(0)
  const [epochETA, setEpochETA] = useState<number | null>(null)
  const [epochProgress, setEpochProgress] = useState<number | null>(null)
  const [totalSolStaked, setTotalSolStaked] = useState<number | null>(null)
  const [inputErrorStake, setInputErrorStake] = useState(false)
  const [inputErrorUnstake, setInputErrorUnstake] = useState(false)
  const [isStaking, setIsStaking] = useState(false)
  const [isUnstaking, setIsUnstaking] = useState(false)

  useEffect(() => {
    if (!publicKey) {
      setMarinade(null)
      return
    }

    const referralCode = new web3.PublicKey('GrimZyVe6oFCCaCKdemVUTjf2P19gTo6KkuF2XcNsDD')
    const config = new MarinadeConfig({ connection, publicKey, referralCode })
    const marinade = new Marinade(config)
    setMarinade(marinade)
  }, [connection, publicKey])

  useEffect(() => {
    if (!marinade){
      return
    }
    (async () => {
      updateBalances()
      
      const mState = await marinade.getMarinadeState()

      setMarinadeState(mState)

      const slotTimeAvg1h = 521 //this is in mainnet

      const epochInfo = await mState.epochInfo()
      const eETA = (epochInfo.slotsInEpoch - epochInfo.slotIndex) * slotTimeAvg1h //in milliseconds
      const eProgress = 100 * epochInfo.slotIndex / epochInfo.slotsInEpoch

      setEpochETA(eETA)
      setEpochProgress(eProgress)

      try{
        let projectedApyResults = await axios.get('https://api.marinade.finance/msol/apy/1y');
        setProjectedAPY(projectedApyResults.data.value * 100)
      }catch(e){
        console.log(e)
      }

      try{
        let validatorCountResults = await axios.get('https://marinade-dashboard-api-temp.herokuapp.com/validators/count');
        setValidatorCount(validatorCountResults.data.count)
      }catch(e){
        console.log(e)
      }
    })()
  },[marinade])

  const updateBalances = async () => {
    if (!connection || !publicKey || !marinade){
      return
    }

    const rPartnerState = await marinade.getReferralPartnerState()
    setReferralPartnerState(rPartnerState)
    const totalStaked = (MarinadeUtils.lamportsToSol(rPartnerState.state.depositSolAmount) + MarinadeUtils.lamportsToSol(rPartnerState.state.depositStakeAccountAmount)) - MarinadeUtils.lamportsToSol(rPartnerState.state.liqUnstakeSolAmount)
    setTotalSolStaked(totalStaked)
    setTotalSolStaked(totalStaked)

    let balance = await connection.getBalance(publicKey)
    setSolBalance(MarinadeUtils.lamportsToSol(new BN(balance)))

    let tokenAccountsResponse = await connection.getTokenAccountsByOwner(publicKey,{mint:new PublicKey('mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So')})
    if(tokenAccountsResponse && tokenAccountsResponse.value && tokenAccountsResponse.value.length > 0){
      let tokenAccount = tokenAccountsResponse.value[0]
      let mBalanceResponse = await connection.getTokenAccountBalance(tokenAccount.pubkey)
      if(mBalanceResponse && mBalanceResponse.value){
       setMSolBalance(mBalanceResponse.value.uiAmount || NaN)
      }
    }
  }

  const updateMarinadeState = () => {

  }

  const handleTabChange = (_event:any, newValue:string) => {
    setTabValue(newValue);
  };

  const renderBigNumber = (num:number, options = { maximumFractionDigits: 2 }) => {
    return num ? num.toLocaleString(undefined, options) : 0
  }

  const renderSOL = (num:number | null, symbol = 'SOL') => {
    return num != null && num != undefined && num != NaN ? `${renderBigNumber(num, { maximumFractionDigits: 3 })} ${symbol}` : '-'
  }

  const renderPercentage = (num:number | null) => {
    return num != null && num != undefined && num != NaN ? `${renderBigNumber(num, { maximumFractionDigits: 2 })}%` : '-'
  }

  const convertMS = (milliseconds:number) => {
    var days, hours, minutes, seconds;
    seconds = Math.floor(milliseconds / 1000);
    minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;
    hours = Math.floor(minutes / 60);
    minutes = minutes % 60;
    days = Math.floor(hours / 24);
    hours = hours % 24;
    return {
        days,
        hours,
        minutes,
        seconds
    };
  }

  const renderETA = (milliseconds:number | null) => {
    if(!milliseconds) return '-'
    const eta = convertMS(milliseconds)
    return `${eta.days > 0 ? `${eta.days}d ` : ''}${eta.hours > 0 ? `${eta.hours}h ` : ''}${eta.minutes > 0 ? `${eta.minutes}m` : ''}`
  } 

  const delay = (ms: number | undefined) => new Promise(res => setTimeout(res, ms));

  const confirmTransaction = async (txSignature:string, commitment:web3.Finality = 'finalized', triesLeft = 6): Promise<web3.ParsedTransactionWithMeta | null> => {
    const confirmed = await connection.getParsedTransaction(txSignature, commitment)
    if(confirmed){
      return confirmed
    }
    if(triesLeft == 0) return null

    //wait 10 seconds and try again
    await delay(10000);
    triesLeft = triesLeft - 1
    return await confirmTransaction(txSignature, commitment, triesLeft)
  }
  
  const triggerStake = async () => {
    if(!marinade) return
    if(isNaN(Number(stakeAmount))) return
    try {
      setIsStaking(true)
      const { transaction } = await marinade.deposit(MarinadeUtils.solToLamports(Number(stakeAmount)))
      const transactionSignature = await sendTransaction(transaction, connection)
      const confirmed = await confirmTransaction(transactionSignature)
      if(confirmed){
        setStakeAmount('')
        await onTransaction('Staking Successful')
        } else {
        onError('Transaction could not be confirmed in time. Check your wallet before trying again.')
      }
    } catch (err) {
      console.log(err)
      onError(err)
    } finally {
      setIsStaking(false)
    }
  }

  const triggerUnstakeNow = async () => {
    if(!marinade) return
    if(isNaN(Number(unstakeAmount))) return
    try {
      setIsUnstaking(true)
      const { transaction } = await marinade.liquidUnstake(MarinadeUtils.solToLamports(Number(unstakeAmount)))
      const transactionSignature = await sendTransaction(transaction, connection)
      const confirmed = await confirmTransaction(transactionSignature)
      if(confirmed){
        setUnstakeAmount('')
        await onTransaction('Unstaking Successful')
      } else {
        onError('Transaction could not be confirmed in time. Check your wallet before trying again.')
      }
    } catch (err) {
      console.log(err)
      onError(err)
    } finally {
      setIsUnstaking(false)
    }
  }

  const exploreTransactionLink = (tx:string) => `https://explorer.solana.com/tx/${tx}`
  const onTransaction = async (msg:string) => {
    toast.success(msg)
    await updateBalances()
  }
  const onError = (error:any) => {
    let msg = 'An error occured. Please double check balances in your wallet before trying again.'
    if(error instanceof String){
      msg = error as string
    } else if (typeof error === 'object'){
      error.hasOwnProperty('message')
      msg = error.message
    }
    toast.error(msg)
  }

  const stakedSOL = () => {
    if(isNaN(mSolBalance) || !marinadeState){
      return NaN
    }
    return mSolBalance * marinadeState.mSolPrice
  }

  return <Grid columns={24} container spacing={2} className="m-b-md data-items-wrapper">
    <Toaster position='top-center' reverseOrder={false} toastOptions={{duration: 5000}} />
    <Grid item xs={24} sm={24} md={24} lg={18}>
      <Grid columns={24} container spacing={2} className="m-b-md data-items-wrapper">
        <Grid item xs={24}>
          <div className="box-light p-md has-border-radius-md">
            <Grid columns={24} container className="data-items-wrapper">
              <Grid item xs={24} md={11} className="is-flex-column">
                <div>
                  <strong>Staked SOL</strong>
                  <div className="has-font-gooper-bold has-text-primary has-font-size-md">{renderSOL(stakedSOL())}</div>
                  <div className="has-font-size-sm m-t-sm">SOL you have staked with Marinade</div>
                </div>
              </Grid>
              <Grid item xs={24} md={2} className="is-flex is-flex-justify-center"> 
                <Divider orientation="vertical" flexItem/>
                <hr className="horizontal-divider m-t-lg m-b-lg" />
              </Grid>
              <Grid item xs={24} md={11} className="is-flex-column">
                <div>
                  <strong>APY</strong>
                  <div className="has-text-primary has-font-gooper-bold has-font-size-md">{renderPercentage(projectedAPY)}</div>
                  <div className="has-font-size-sm m-t-sm">Annual percentage yield</div>
                </div>
              </Grid>
            </Grid>
          </div>
        </Grid>
        <Grid item xs={24}>
          <div className="box-light p-md has-border-radius-md">
            <Grid columns={24} container className="data-items-wrapper" direction={'column'}>
              <Grid item>
                <ThemeProvider theme={tabTheme}>
                  <Box className="m-b-md">
                  <Tabs value={tabValue} onChange={handleTabChange} aria-label="DeFi options" textColor="secondary" indicatorColor="primary">
                    <Tab value="stake" label={`Stake`} />
                    <Tab value="unstake" label={`Unstake`} />
                  </Tabs>
                  </Box>
                </ThemeProvider>
              </Grid>

              {tabValue == 'stake' && 
              <Grid item>
                <Grid columns={24} container direction={'column'}>
                <Grid columns={24} container xs={24} spacing={2} alignItems={'center'}>
                  <Grid item xs={18} >
                    <FormControl fullWidth error={inputErrorStake}>
                      <InputLabel htmlFor="stake-input">Enter amount</InputLabel>
                      <OutlinedInput
                        id="stake-input"
                        label="Enter amount"
                        size="small"
                        startAdornment={<InputAdornment position="start">SOL</InputAdornment>} 
                        endAdornment={
                          <InputAdornment position="end">
                            <Link
                              component="button"
                              underline="hover"
                              onClick={() => {
                                setStakeAmount(`${solBalance}`)
                                setInputErrorStake(false)
                              }}
                            >
                              max
                            </Link>
                          </InputAdornment>
                        }
                        value={stakeAmount}
                        onChange={(e) => {
                          if(!marinadeState) return
                          const amount = e.target.value
                          const amountNumber = Number(e.target.value) || 0
                          const stakeConversionAmount = amountNumber / marinadeState.mSolPrice
                          setStakeAmount(amount)
                          setStakeConversionAmount(stakeConversionAmount)
                          setInputErrorStake(amountNumber <= 0 || amountNumber > solBalance)
                        }}
                      />
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <LoadingButton className="button is-primary is-outlined is-fullwidth" loading={isStaking} loadingPosition="end" disabled={inputErrorStake || isStaking} onClick={() => triggerStake()}>Stake SOL</LoadingButton>
                  </Grid>
                </Grid>
                <div className="has-font-size-sm m-b-md m-t-sm">SOL balance: <strong>{renderSOL(solBalance)}</strong></div>
                <Divider orientation="horizontal" />
                <Grid columns={24} container xs={24} className="m-t-md">
                  <Grid columns={24} container xs={24}>
                    <Grid item xs={12}>
                        <div>You will receive</div>
                    </Grid>
                    <Grid item xs={12}>
                      <div className="has-text-right">{renderSOL(stakeConversionAmount, 'mSOL')}</div>
                    </Grid>
                  </Grid>
                  <Grid columns={24} container xs={24} className="m-t-sm">
                    <Grid item xs={12} >
                      <div>Exchange Rate</div>
                    </Grid>
                    <Grid item xs={12}>
                      <div className="has-text-right">1 mSOL ≈ {renderSOL(marinadeState?.mSolPrice || 0)}</div>
                    </Grid>
                  </Grid>
                  <Grid columns={24} container xs={24} className="m-t-sm">
                    <Grid item xs={12}>
                      <div>Deposit fee</div>
                    </Grid>
                    <Grid item xs={12}>
                      <div className="has-text-right">0%</div>
                      </Grid>
                    </Grid>
                  <Grid columns={24} container xs={24} className="m-t-sm">
                    <Grid item xs={12}>
                      <div>Projected APY</div>
                    </Grid>
                    <Grid item xs={12}>
                      <div className="has-text-right">{renderPercentage(projectedAPY)}</div>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
              }

              {tabValue == 'unstake' && 
              <Grid>
                <Grid columns={24} container direction={'column'}>
                <Grid columns={24} container xs={24} spacing={2} alignItems={'center'}>
                  <Grid item xs={18} >
                  <FormControl fullWidth error={inputErrorUnstake}>
                      <InputLabel htmlFor="stake-input">Enter amount</InputLabel>
                      <OutlinedInput
                        id="stake-input"
                        label="Enter amount"
                        size="small"
                        startAdornment={<InputAdornment position="start">mSOL</InputAdornment>} 
                        endAdornment={
                          <InputAdornment position="end">
                            <Link
                              component="button"
                              underline="hover"
                              onClick={() => {
                                setUnstakeAmount(`${mSolBalance}`)
                                setInputErrorUnstake(false)
                              }}
                            >
                              max
                            </Link>
                          </InputAdornment>
                        }
                        value={unstakeAmount}
                        onChange={(e) => {
                          const amount = e.target.value
                          const amountNumber = Number(e.target.value) || 0
                          setUnstakeAmount(amount)
                          setInputErrorUnstake(amountNumber <= 0 || amountNumber > mSolBalance)
                        }}
                      />
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <LoadingButton className="button is-primary is-outlined is-fullwidth" loading={isUnstaking} loadingPosition="end" disabled={inputErrorUnstake || isUnstaking} onClick={() => triggerUnstakeNow()}>Unstake now</LoadingButton>
                  </Grid>

                </Grid>
                <div className="has-font-size-sm m-b-md m-t-sm">mSOL balance: <strong>{renderSOL(mSolBalance, 'mSOL')}</strong></div>
                <Divider orientation="horizontal" />
                  <Grid columns={24} container xs={24} className="m-t-md">
                  <Grid columns={24} container xs={24}>
                    <Grid item xs={12}>
                      <div>Exchange Rate</div>
                    </Grid>
                    <Grid item xs={12}>
                    <div className="has-text-right">1 mSOL ≈ {renderSOL(marinadeState?.mSolPrice || 0)}</div>
                    </Grid>
                    </Grid>
                    <Grid columns={24} container xs={24} className="m-t-sm">
                    <Grid item xs={12}>
                      <div>Unstake now fee</div>
                    </Grid>
                    <Grid item xs={12}>
                      <div className="has-text-right">From 0.3%</div>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
              }

            </Grid>
          </div>
        </Grid>
        <Grid item xs={24}>
          <div className="box-light p-md has-border-radius-md">
            <Grid columns={24} container className="data-items-wrapper">
              <Grid item xs={24} md={11} className="is-flex-column">
                <div>
                  <strong>Epoch</strong>
                  <div className="has-font-gooper-bold has-text-primary has-font-size-md">{renderPercentage(epochProgress)}</div>
                  <div className="has-font-size-sm m-t-sm">ETA: {renderETA(epochETA)}</div>
                </div>
              </Grid>
              <Grid item xs={24} md={2} className="is-flex is-flex-justify-center"> 
                <Divider orientation="vertical" flexItem/>
                <hr className="horizontal-divider m-t-lg m-b-lg" />
              </Grid>
              <Grid item xs={24} md={11} className="is-flex-column">
                <div>
                  <strong>Validators</strong>
                  <div className="has-text-primary has-font-gooper-bold has-font-size-md">{validatorCount ? validatorCount : '-'}</div>
                </div>
              </Grid>
            </Grid>
          </div>
        </Grid>
      </Grid>
    </Grid>
    <Grid item xs={24} sm={24} md={24} lg={6}>
      <div className="sidebar m-b-md">
        <div className="box-light p-md has-border-radius-md">
          <Grid container rowSpacing={2} spacing={4}>
            <Grid item xs={14} sm={8} md={6} lg={14}>
              <img src="/img/logo_marinade.png" alt="Marinade" className="img-fluid has-border-radius-round" />
            </Grid>
            <Grid item xs={24} sm={16} md={18} lg={24}>
              <div>Marinade Finance</div>
              <p><strong>Grim Syndicate</strong> has partnered with <a href="https://marinade.finance" target="_blank">Marinade Finance</a> to bring SOL and mSOL staking to holders.</p>
              <Divider orientation="horizontal" flexItem/>
              <div className="m-t-md">
                <strong>mSOL/SOL price</strong>
                <div className="has-font-gooper-bold has-text-primary has-font-size-md">{renderSOL(marinadeState?.mSolPrice || 0)}</div>
                {/*<div className="has-font-size-sm m-t-sm">~$90.49</div>*/}
              </div>
              <div className="m-t-md">
                <strong>Total SOL staked</strong>
                {<div className="has-font-size-sm">by the Grim Syndicate community</div>}
                <div className="has-font-gooper-bold has-text-primary has-font-size-md m-t-sm">{renderSOL(totalSolStaked)}</div>
                {/*<div className="has-font-size-sm m-t-sm">by the Grim Syndicate community</div>*/}
              </div>
            </Grid>
          </Grid>
        </div>
      </div>
    </Grid>

  </Grid>

})

export default SectionDefi;