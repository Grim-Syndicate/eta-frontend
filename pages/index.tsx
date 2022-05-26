import type { NextPage } from 'next'
import React, { useEffect, useState, useImperativeHandle, useContext } from "react";
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import bs58 from "bs58";
import Grid from '@mui/material/Grid';
import Tooltip from '@mui/material/Tooltip';
import {Buffer} from 'buffer';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Fade from "@mui/material/Fade";
import Divider from '@mui/material/Divider';
import FormSwitch from '@mui/material/Switch';
import FormControlLabel from "@mui/material/FormControlLabel";
import { styled } from "@mui/system";
import ModalUnstyled from "@mui/base/ModalUnstyled";
import { createTheme, ThemeProvider } from '@mui/material/styles';
import axios from "axios";
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import SendAstraForm from '../components/SendAstraForm';
import PublicSection from '../components/PublicSection';
import Marketplaces from '../components/Marketplaces';
import SectionDefi from "../sections/SectionDefi";
import { GrimsContext } from "../components/GrimsProvider";
import HeadElement from '../components/HeadElement';
import WalletUtils from '../utils/WalletUtils';
import Nightshift from "../components/Nightshift";
import Utils from "../utils/Utils";

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

const domainURL = process.env.NEXT_PUBLIC_API_URL || '';
const solanaRPC = process.env.NEXT_PUBLIC_SOLANA_RPC_HOST || '';

const COOLDOWN_UNITS = 10; // used to show a more precise number when displaying the cooldown
const POINTS_PER_TIMEPERIOD = 10; // points per day
const PERIOD_PER_TIMEPRIOD = 1; // 1 day per day
const LOCKING_PERIOD = 14; // 14 days
const ONE_LOCKING_PERIOD = (24 * 60 * 60 * 1000); // day in milliseconds

const userURL = domainURL + "/user";
const stakingURL = domainURL + "/stake";
const unstakingURL = domainURL + "/unstake";
const getStakedURL = domainURL + "/grims-state";
const claimPointsURL = domainURL + "/claim-points";

const millisecondsInPeriod = (24 * 60 * 60 * 1000);
const penaltyCooldown = 7 * 24 * 60 * 60 * 1000; // 7 days

let ONE_COOLDOWN_PERIOD = (24 * 60 * 60 * 1000);
let WALLET_COOLDOWN_RATE = 1;

let SOL_PRICE = 0;
let FLOOR_PRICE = 0;
let requestStarted = false;
let loadGrimsRefresh = null;

let astraRecalcInterval: NodeJS.Timeout | undefined = undefined;

const Home: NextPage = () => {
  const { setGrims, isUsingLedger, daemons, setDaemons } = useContext(GrimsContext);
  const { connection } = useConnection();
  const { publicKey, wallet, sendTransaction, signTransaction, signMessage } = useWallet();
  const [isLoadingGrims, setIsLoadingGrims] = useState(false);
  const [loadingOverlay, setLoadingOverlay] = useState(false);
  const [isClaimingAstra, setIsClaimingAstra] = useState(false);
  const [isClockingOutAll, setIsClockingOutAll] = useState(false);
  const [isClockingOut, setIsClockingOut] = useState<{[key:string]: boolean}>({});
  const [isClockingInAll, setIsClockingInAll] = useState(false);
  const [isClockingIn, setIsClockingIn] = useState<{[key:string]: boolean}>({});
  const [stakedGrims, setStakedGrims] = useState<any[]>([]);
  const [notStakedGrims, setNotStakedGrims] = useState<any[]>([]);
  const [hiddenGrims, setHiddenGrims] = useState<any[]>([]);
  const [pointsBalance, setPointsBalance] = useState(0);
  const [pointsLocked, setPointsLocked] = useState(0);
  const [pointsUnclaimed, setPointsUnclaimed] = useState(0);
  const [airdropApproved, setAirdropApproved] = useState(false);
  const [points, setPoints] = useState<any[]>([]);
  const [pointsPerDay, setPointsPerDay] = useState(0);
  const [isGrimsLoaded, setIsGrimsLoaded] = React.useState(false);

  let clockingOutState = {};

  function getTimestamp() {
    let now = new Date();

    return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds());
  }

  const [departmentsBreakdown, setDepartmentsBreakdown] = useState({
    "BASE_COMMON": 0,
    "BASE_RARE": 0,
    "BASE_LEGENDARY": 0,
    "BASE_MYTHIC": 0,
    "BASE_ANCIENT": 0,
    "BASE_GOLDEN_ANCIENT": 0,
    "BASE_DAEMON": 0
  });

  const formatPoints = (points:string) => {
    let p = parseFloat(points);
    return p >= 100 ? p.toFixed(2) : p.toFixed(3);
  };

  const calculatePoints = (grim:any) => {
    const lockingPeriod = LOCKING_PERIOD * PERIOD_PER_TIMEPRIOD;
    const oneLockingPeriod = ONE_LOCKING_PERIOD / PERIOD_PER_TIMEPRIOD;
    const pointsPerPeriod = grim.pointsPerTimeperiod / PERIOD_PER_TIMEPRIOD;

    let unclaimedPoints = 0;
    let lockedPoints = 0;
    let currentPeriod = 0;

    for (let i in grim.stakedInfo) {
      let stakedInfo = grim.stakedInfo[i];

      if (!stakedInfo || stakedInfo.penaltyTimestamp) {
        continue;
      }

      let lastClaimableTimestamp = getTimestamp();
      let prevClaimed = (stakedInfo.claimedTimestamp - stakedInfo.stakedTimestamp) / oneLockingPeriod;
      let prevClaimable = stakedInfo.unstakedTimestamp > 0 ? ((stakedInfo.unstakedTimestamp - stakedInfo.stakedTimestamp) / oneLockingPeriod) : prevClaimed;
      let currentPeriod = (lastClaimableTimestamp - stakedInfo.claimedTimestamp) / oneLockingPeriod;

      let overflow = prevClaimable > lockingPeriod ? Math.ceil(prevClaimable) - lockingPeriod : 0;
      prevClaimable = prevClaimable - overflow;
      prevClaimed = prevClaimed - overflow;

      let claimablePeriod = prevClaimable + (stakedInfo.unstakedTimestamp > 0 ? 0 : currentPeriod);
      let iterationPeriod = prevClaimed + currentPeriod;

      for (let period = iterationPeriod, claimableIndex = claimablePeriod, lockedIndex = Math.min(claimablePeriod, prevClaimed); period > 0; period--, claimableIndex--, lockedIndex--) {
        let amount = claimableIndex > 0 ? 1 : 0;

        if (0 < claimableIndex && claimableIndex < 1) {
          amount = claimableIndex - Math.floor(claimableIndex);
        }

        let claimedAmount = lockedIndex < 1 ? Math.max(0, lockedIndex) : Math.min(Math.floor(lockedIndex), lockingPeriod);
        let unlockedAmount = period < 1 ? Math.max(0, period) : Math.min(Math.floor(period), lockingPeriod);
        let lockedAmount = lockingPeriod - (unlockedAmount < 1 ? 0 : unlockedAmount);
        let points = period < 1 ? 0 : ((unlockedAmount - claimedAmount) / lockingPeriod) * pointsPerPeriod * amount;
        let locked = (lockedAmount / lockingPeriod) * pointsPerPeriod * amount;

        if (currentPeriod < 1 ) {
          points = 0;
        }

        unclaimedPoints += points;
        lockedPoints += locked;
      }
    }

    return [formatPoints(`${unclaimedPoints}`), formatPoints(`${lockedPoints}`)];      
  }

  const getStaminaValue = (stamina:number, maxStamina:number) => {
    return `${stamina}/${maxStamina}`
  }

  const isStaminaFull = (stamina:number, maxStamina:number) => {
    return calculateStaminaProgress(stamina, maxStamina) >= 1
  }
  
  const calculateStaminaProgress = (stamina:number, maxStamina:number) => {
    return stamina / maxStamina;
  }

  const calculatePenaltyCooldown = (timestamp:number) => {
    if (timestamp === 0) {
      return 0;
    }

    let length = getTimestamp() - timestamp;

    return (1 - length / penaltyCooldown) * 100;
  }

  const calculateAvailablePoints = (grim:any) => {
    let [unclaimed, locked] = calculatePoints(grim);
    return formatPoints(`${parseFloat(unclaimed) + parseFloat(locked)}`);
  };

  const loadGrims = async () => {
    // clearInterval(loadGrimsRefresh);

    if (publicKey) {
      let allGrims:{[key:string]: any} = {};
      let allDaemons:{[key:string]: any} = {};

      try {
        let result = await axios.get(getStakedURL + "?wallet=" + publicKey);
        let staked:any[] = [];
        let notStaked = [];
        let hidden = [];

        if (result && result.data && result.data.success && result.data.wallet) {
          setPointsBalance(parseFloat(formatPoints(result.data.wallet.pointsBalance)));
          setAirdropApproved(result.data.airdropApproved);
          setDepartmentsBreakdown(result.data.departments);

          WALLET_COOLDOWN_RATE = parseFloat(result.data.wallet.walletCooldownRate);
          ONE_COOLDOWN_PERIOD = parseFloat(result.data.wallet.oneCooldownInterval);

          let locked = 0;
          let unclaimed = 0;

          let stakedResults = result.data.wallet.staked;
          let clockingOut:{[key:string]: boolean} = {};
          let clockingIn:{[key:string]: boolean} = {};

          for (let i in stakedResults) {
            clockingOut[stakedResults[i].mint] = false;
            clockingIn[stakedResults[i].mint] = false;
            locked += parseFloat(stakedResults[i].pointsLocked);
            unclaimed += parseFloat(stakedResults[i].pointsUnclaimed);
            allGrims[i] = stakedResults[i];
            staked.push(allGrims[i]);
          }

          setStakedGrims(staked.sort((a, b) => {
            if (a.stakedTimestamp < b.stakedTimestamp) {
              return 1;
            } else if (a.stakedTimestamp > b.stakedTimestamp) {
              return -1;
            }

            return 0;
          }));

          let unstakedResults = result.data.wallet.unstaked;

          for (let i in unstakedResults) {
            clockingOut[unstakedResults[i].mint] = false;
            clockingIn[unstakedResults[i].mint] = false;
            locked += parseFloat(unstakedResults[i].pointsLocked);
            unclaimed += parseFloat(unstakedResults[i].pointsUnclaimed);
            allGrims[i] = unstakedResults[i];
            notStaked.push(allGrims[i]);
          }

          handleInitialTabSelection(stakedResults, unstakedResults)

          let benchedResults = result.data.wallet.benched;

          for (let i in benchedResults) {
            clockingOut[benchedResults[i].mint] = false;
            clockingIn[benchedResults[i].mint] = false;
            benchedResults[i].benched = true;
            allGrims[i] = benchedResults[i];
            notStaked.push(allGrims[i]);
          }

          let hiddenResults = result.data.wallet.hidden;

          for (let i in hiddenResults) {
            hiddenResults[i].hidden = true;
            locked += parseFloat(hiddenResults[i].pointsLocked);
            unclaimed += parseFloat(hiddenResults[i].pointsUnclaimed);
            allGrims[i] = hiddenResults[i];
            hidden.push(allGrims[i]);
          }

          let daemonsResults = result.data.wallet.daemons;

          for (let i in daemonsResults) {
            allDaemons[i] = daemonsResults[i];
          }

          setGrims(allGrims);
          setDaemons(allDaemons);

          setIsClockingIn(clockingIn);
          setIsClockingOut(clockingOut);

          setNotStakedGrims(notStaked);
          setHiddenGrims(hidden);
          setPointsLocked(parseFloat(formatPoints(`${locked}`)));
          setPointsUnclaimed(parseFloat(formatPoints(`${unclaimed}`)));
        }

        setIsGrimsLoaded(true)
      } catch (error) {
        console.error('error...', error)
      }
    }
  }

  const handleInitialTabSelection = (stakedResults:any, unstakedResults:any) => {
    const hasStakedGrims = stakedResults && Object.keys(stakedResults).length > 0
    const hasUnstakedGrims = unstakedResults && Object.keys(unstakedResults).length > 0
    const hasOnlyUnstakedGrimsInWallet = !hasStakedGrims && hasUnstakedGrims
    if (hasOnlyUnstakedGrimsInWallet) setTabValue('onVacation')
  }

  const updateAstraCalc = () => {
    let ps = [];
    let allUnclaimedPoints = 0;
    let allLockedPoints = 0;

    for (let i in stakedGrims) {
      let [unclaimed, locked] = calculatePoints(stakedGrims[i]);
      allUnclaimedPoints += parseFloat(unclaimed);
      allLockedPoints += parseFloat(locked);
      let grimPoints = parseFloat(unclaimed) + parseFloat(locked);
      ps.push(grimPoints);
    }

    for (let i in notStakedGrims) {
      let [unclaimed, locked] = calculatePoints(notStakedGrims[i]);
      allUnclaimedPoints += parseFloat(unclaimed);
      allLockedPoints += parseFloat(locked);
    }

    for (let i in hiddenGrims) {
      let [unclaimed, locked] = calculatePoints(hiddenGrims[i]);
      allUnclaimedPoints += parseFloat(unclaimed);
      allLockedPoints += parseFloat(locked);
    }

    setPoints(ps);
    setPointsUnclaimed(parseFloat(formatPoints(`${allUnclaimedPoints}`)));
    setPointsLocked(parseFloat(formatPoints(`${allLockedPoints}`)));
  }

  const startAstraCalc = () => {
    stopAstraCalc();
    astraRecalcInterval = setInterval(() => updateAstraCalc(), 10000); // 10 sec
  }

  const stopAstraCalc = () => {
    clearInterval(astraRecalcInterval);
  }

  startAstraCalc();

  useEffect(() => {
      async function data() {
        setIsLoadingGrims(true);
        await loadGrims();
        setIsLoadingGrims(false);
      } 
      data();
    }, [publicKey]);

  useEffect(() => {
      async function data() {
        var ppd = 0;

        for (let i in stakedGrims) {
          ppd += stakedGrims[i].pointsPerTimeperiod;
        }
        setPointsPerDay(ppd);
      } 
      data();
    }, [stakedGrims]);

  const triggerStakeAll = async () => {
    setIsClockingInAll(true);
    var tokens = [];

    for (let i in notStakedGrims) {
      tokens.push(notStakedGrims[i].mint);
    }

    let res = await triggerStake(tokens);

    setIsClockingInAll(false);
    setTabValue('clockedIn')

    return res;
  };

  const triggerUnstakeAll = async () => {
    setIsClockingOutAll(true);
    var tokens = [];

    for (let i in stakedGrims) {
      tokens.push(stakedGrims[i].mint);
    }

    let res = await triggerUnstake(tokens);

    setIsClockingOutAll(false);
    setTabValue('onVacation')
    return res;
  };

  const renderBigNumber = (num:number) => {
    return num ? num.toLocaleString() : 0
  }

  const triggerClaim = async () => {
    if (!publicKey) throw new WalletNotConnectedError();

    setLoadingOverlay(true);
    setIsClaimingAstra(true);
    let data:{
      wallet:string|undefined,
      message?:string,
      bh?:string|null,
      user?:any,
    } = {
      wallet: publicKey.toString(),
    };

    let [signature, blockhash] = await WalletUtils.verifyWallet(connection, publicKey, 'claim', data, isUsingLedger, signMessage, signTransaction);

    if (signature) {
      data.message = bs58.encode(signature);
      data.bh = blockhash;
      delete data.user;

      let result = await axios.post(claimPointsURL, data);
      if (result.data.success) {
        await loadGrims();
      }
    }
    setLoadingOverlay(false);
    setIsClaimingAstra(false);
  };

  const triggerStake = async (tokens:any[]) => {  
    if (!publicKey) throw new WalletNotConnectedError();

    if (requestStarted) {
      return;
    }

    requestStarted = true;

    try {
      for (let i in tokens) {
        isClockingIn[tokens[i]] = true;
      }

      let data:{
        tokens:any[],
        wallet:string|undefined,
        message?:string,
        bh?:string|null,
        user?:any,
      } = {
        "tokens": tokens,
        "wallet": publicKey.toString()
      };

      let [signature, blockhash] = await WalletUtils.verifyWallet(connection, publicKey, 'stake', data, isUsingLedger, signMessage, signTransaction);

      if (signature) {
        data.message = bs58.encode(signature);
        data.bh = blockhash;
        delete data.user;

        let result = await axios.post(stakingURL, data);
        if (result.data.success) {
          await loadGrims();
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      requestStarted = false;

      for (let i in tokens) {
        isClockingIn[tokens[i]] = false;
      }
    }
  };

  const getPenaltyDay = (timestamp:number) => {
    let penalty = calculatePenaltyCooldown(timestamp);

    return (7 - Math.floor(penalty / 100 * 7));
  };

  const getMutiplierClasses = (token:any) => {
    let baseName = token.department.toLowerCase().replaceAll('_', '-');
    return 'department has-background-' + baseName + ' has-text-' + baseName;
  };

  const getBaseTitle = (token:any) => {
    if (!token || !token.department) {
      return '';
    }
    let baseName = token.department.replace('BASE_', '').replace('_', ' ').toLowerCase();
    const words = baseName.split(' ');

    for (let i = 0; i < words.length; i++) {
      words[i] = words[i][0].toUpperCase() + words[i].substr(1);
    }

    return words.join(' ');
  };

  const triggerUnstake = async (tokens:any[] | null) => {
    if (!publicKey) throw new WalletNotConnectedError();
    if (!tokens) throw 'No tokens'

    if (requestStarted) {
      return;
    }

    requestStarted = true;

    try {
      for (let i in tokens) {
        isClockingOut[tokens[i]] = true;
      }

      let data:{
        tokens:any[],
        wallet:string|undefined,
        message?:string,
        bh?:string|null,
        user?:any,
      } = {
        "tokens": tokens,
        "wallet": publicKey.toString()
      };

      let [signature, blockhash] = await WalletUtils.verifyWallet(connection, publicKey, 'unstake', data, isUsingLedger, signMessage, signTransaction);

      if (signature) {
        data.message = bs58.encode(signature);
        data.bh = blockhash;
        delete data.user;

        let result = await axios.post(unstakingURL, data);
        
        if (result.data.success) {
          await loadGrims();
        }
      }
    } catch (err) {
      // TODO show error
      console.error(err)
    } finally {
      requestStarted = false;

      for (let i in tokens) {
        isClockingOut[tokens[i]] = false;
      }
      requestStarted = false
    }
  };

  /*
  useImperativeHandle(ref, () => ({
    triggerClaimFunction: () => {
      triggerClaim();
    }
  }));*/

  const [tabValue, setTabValue] = useState('clockedIn');
  const [sectionValue, setSectionValue] = useState('staking');

  const handleTabChange = (event:any, newValue:string) => {
    setTabValue(newValue);
  };

  const handleSectionChange = (event:any, newValue:string) => {
    setSectionValue(newValue);
  };

  const p2pModalStyle = {
    width: 600,
    bgcolor: "white",
    border: "1px solid var(--color-secondary-accent)",
    borderRadius: '12px',
    p: 3,
  };

  const Backdrop = styled("div")`
    z-index: -1;
    position: fixed;
    right: 0;
    bottom: 0;
    top: 0;
    left: 0;
    background-color: rgba(0, 0, 0, 0.9);
    -webkit-tap-highlight-color: transparent;
  `;

  const [isOpenSendAstraModal, setOpenSendAstraModal] = useState(false);
  const handleOpenSendAstraModal = () => {
    stopAstraCalc();
    setOpenSendAstraModal(true);
  }
  const handleCloseSendAstraModal = () => {
    startAstraCalc()
    setOpenSendAstraModal(false);
  }

  const updateAstraBalance = (val:number) => {
    setPointsBalance(val)
  }

  const [isOpenConfirmClockOutModal, setOpenConfirmClockOutModal] = useState(false);
  const [isOpenConfirmClockOutAllModal, setOpenConfirmClockOutAllModal] = useState(false);
  const [tokensToBeUnstaked, setTokensToBeUnstaked] = useState<any[] | null>(null);

  const handleOpenConfirmClockOutModal = (tokens:any[]) => {
    setTokensToBeUnstaked(tokens)
    setOpenConfirmClockOutModal(true);
  }

  const handleOpenConfirmClockOutAllModal = () => {
    setOpenConfirmClockOutAllModal(true);
  }

  const handleCloseConfirmClockOutModal = () => {
    setTokensToBeUnstaked(null)
    setOpenConfirmClockOutModal(false);
    setOpenConfirmClockOutAllModal(false);
  }

  const isClockingOutAny = () => {
    for (let i in isClockingOut) {
      if(isClockingOut[i] == true) {
        return true
      }
    }
    return false
  }

  return wallet ? (
    <>
      <HeadElement />
      <div>
        <div className="title-bar p-md main-content-wrapper">
          <div className="container main-content-wrapper">
            <h1 className="has-text-white has-font-tomo has-text-shadow">My Dashboard</h1>
            <Nightshift />
          </div>
        </div>
        <main className="container main-content-wrapper main-wrapper is-reverse m-t-md">
          <Grid container justifyContent="space-between" alignItems="center">
            <Grid item>
              <ThemeProvider theme={tabTheme}>
                <Box className="m-b-md">
                <Tabs value={sectionValue} onChange={handleSectionChange} aria-label="Grim sections" textColor="secondary" indicatorColor="primary">
                  <Tab value="staking" label={`Grim Staking`} />
                  <Tab value="defi" label={`Grim DeFi`} />
                </Tabs>
                </Box>
              </ThemeProvider>
            </Grid>

            {sectionValue == 'staking' && 
            <div>
              <Grid container spacing={2} className="m-b-md data-items-wrapper">
                <Grid item xs={24}>
                  <div className="box p-md has-border-radius-md">
                    <Grid columns={24} container>
                      <Grid item xs={24} md={6}>
                        <div>
                          <strong>My $ASTRA</strong>
                          <div className="has-font-gooper-bold has-font-size-md has-text-primary m-t-sm m-b-sm">{isGrimsLoaded ? renderBigNumber(pointsBalance) : <Skeleton width="33%" variant="text" />}</div>
                          <div className="has-font-size-sm m-b-sm">$ASTRA is the currency of the Knownverse.</div>
                          <button className="button is-primary is-outlined is-fullwidth" onClick={handleOpenSendAstraModal} disabled={!pointsBalance}><img className="button-icon" src="/img/icon-send.svg" alt="send icon" />Send</button>
                        </div>
                      </Grid>
                      <Grid item xs={24} md={3} className="is-flex is-flex-justify-center"> 
                        <Divider orientation="vertical" flexItem />
                        <hr className="horizontal-divider m-t-lg m-b-lg" />
                      </Grid>
                      <Grid item xs={24} md={6}>
                        <div>
                          <strong>Unclaimed $ASTRA</strong>
                          <div className="has-font-gooper-bold has-font-size-md has-text-primary m-t-sm m-b-sm">{isGrimsLoaded ? renderBigNumber(pointsUnclaimed) : <Skeleton width="33%" variant="text" />}</div>
                          <div className="has-font-size-sm m-b-sm">Accrued $ASTRA that is ready to be claimed!</div>
                          <button className="button is-primary is-outlined is-fullwidth" disabled={isClaimingAstra} onClick={() => triggerClaim()}><img className="button-icon" src="/img/icon-claim.svg" alt="claim icon" />Claim</button>
                        </div>
                      </Grid>
                      <Grid item xs={24} md={3} className="is-flex is-flex-justify-center"> 
                        <Divider orientation="vertical" flexItem />
                        <hr className="horizontal-divider m-t-lg m-b-lg" />
                      </Grid>
                      <Grid item xs={24} md={6}>
                        <div>
                          <strong>Locked $ASTRA</strong>
                          <div className="has-font-gooper-bold has-font-size-md has-text-primary m-t-sm m-b-sm">{isGrimsLoaded ? renderBigNumber(pointsLocked) : <Skeleton width="33%" variant="text" />}</div>
                          <div className="has-font-size-sm">$ASTRA that has not yet fully accrued. Agent paychecks unlock over <strong>14 days</strong>.</div>
                        </div>
                      </Grid>
                    </Grid>
                  </div>
                </Grid>
              </Grid>

              <Grid container spacing={2} className="m-b-md data-items-wrapper">
                <Grid item xs={24}>
                  <div className="box p-md has-border-radius-md">
                    <Grid columns={24} container className="data-items-wrapper">
                      <Grid item xs={24} md={11} className="is-flex-column">
                        <div>
                          <strong>Current Accrual rate</strong>
                          <div className="has-font-gooper-bold has-text-primary has-font-size-md">{isGrimsLoaded ? `${renderBigNumber(pointsPerDay)} $ASTRA/day` : <Skeleton width="33%" variant="text" />}</div>
                          <div className="has-font-size-sm m-t-sm">Total $ASTRA earned per day based on your staked Grims and their respective multipliers (assigned by Grim base).</div>
                        </div>
                      </Grid>
                      <Grid item xs={24} md={2} className="is-flex is-flex-justify-center"> 
                        <Divider orientation="vertical" flexItem/>
                        <hr className="horizontal-divider m-t-lg m-b-lg" />
                      </Grid>
                      <Grid item xs={24} md={11} className="is-flex-column">
                        <div>
                          <strong>Airdrop Eligibility</strong>
                          <div className="has-text-primary has-font-gooper-bold has-font-size-md">{airdropApproved ? "": "Not "}Approved</div>
                          <div className="has-font-size-sm m-t-sm">Did you know that your Grims stay in your wallet while staked? That means you’re eligible for unannounced airdrops from Grim Syndicate.</div>
                        </div>
                      </Grid>
                    </Grid>
                  </div>
                </Grid>
              </Grid>

              <PublicSection />

              <div>
            {!isLoadingGrims && 
            <Grid container justifyContent="space-between" alignItems="center">
              <Grid item>
                <ThemeProvider theme={tabTheme}>
                  <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabValue} onChange={handleTabChange} aria-label="Grim tabs" textColor="secondary" indicatorColor="primary">
                      <Tab value="clockedIn" label={`Clocked in (${stakedGrims.length})`} />
                      <Tab value="onVacation" label={`On Vacation (${notStakedGrims.length})`} />
                      <Tab value="daemons" label={`Daemons (${Object.keys(daemons).length})`} />
                    </Tabs>
                  </Box>
                </ThemeProvider>
              </Grid>

              <Grid item className="p-r-sm">
                {tabValue === 'onVacation' && <div className="is-flex is-flex-align-center m-t-sm m-b-smm-t-sm m-b-sm">
                  {isClockingInAll && <CircularProgress color="inherit" className="m-r-sm" />}
                  {notStakedGrims && notStakedGrims.length ? (<button className="button-link" disabled={isClockingInAll} onClick={triggerStakeAll}><img className="button-icon" src="/img/icon-clock-in.svg" alt="clock in icon" /> Clock in all</button>) : (<></>)}
                </div>}

                {tabValue === 'clockedIn' && <div className="is-flex is-flex-align-center m-t-sm m-b-smm-t-sm m-b-sm">
                  {isClockingOutAll && <CircularProgress color="inherit" className="m-r-sm" />}
                  {stakedGrims && stakedGrims.length ? (<button className="button-link" disabled={isClockingOutAll} onClick={handleOpenConfirmClockOutAllModal}><img className="button-icon" src="/img/icon-clock-out.svg" alt="clock out icon" /> Clock out all</button>) : (<></>)}
                </div>}

                {tabValue === 'daemons' && <div className="is-flex is-flex-align-center m-t-sm m-b-smm-t-sm m-b-sm">
                  {daemons ? (<button className="button-link" disabled={true}><img className="button-icon stamina" src="/img/icon-stamina-boost.svg" alt="stamina icon" /> Stamina boost: +<strong>{ Utils.clamp(Object.keys(daemons).length * 2,0,20)}%</strong></button>) : (<></>)}
                </div>}

              </Grid>
            </Grid>
            }

            {isLoadingGrims && <p className="text-center is-flex is-flex-align-center"><CircularProgress color="inherit" className="m-r-sm" /> Scanning for Voidmatter...</p>}

            {!isLoadingGrims && tabValue === 'clockedIn' && stakedGrims && stakedGrims.length === 0 && <div className="m-t-md m-b-xl">No Grims are clocked in at this time</div>}

            {tabValue === 'clockedIn' && <section className="m-t-md m-b-lg">
              <p><strong>Warning:</strong> staking requires Grims to be in your wallet. A penalty will be added for moving and listing staked Grims.</p>
              <div className="grim-cards">
                <Grid columns={24} container spacing={3}>
                  {stakedGrims &&
                    stakedGrims.length > 0 &&
                    stakedGrims.map((val) => {
                      return (
                        <Grid item xs={24} sm={12} md={8} lg={6} key={val.mint} className="grim-card-container m-b-md">
                          <div className="grim-card">
                            <div className="has-text-centered">
                                <img className="grim-card-image" src={"https://hkgwtdvfyh.medianetwork.cloud/unsafe/300x300/filters:format(webp)/" + val.metadata.image} alt={val.metadata.name} />
                            </div>
                            <div className="grim-description">
                              <Grid columns={24} container spacing={2}>
                                <Grid item xs={10} md={9}>
                                  <small className="grim-item-property is-uppercase">Agent</small>
                                  <div className="has-font-gooper">{val.metadata.name.substring(4, val.metadata.name.length)}</div>
                                </Grid>
                                <Grid item xs={10} md={9}>
                                  <small className="grim-item-property is-uppercase">Earned</small>
                                  <div className="has-font-gooper">{calculateAvailablePoints(val)}</div>
                                </Grid>
                                <Grid item xs={4} md={6} className="is-flex is-flex-align-center is-flex-justify-end">
                                  <div className={val.department ? getMutiplierClasses(val) : 'hidden'} title={getBaseTitle(val)}>x{val.multiplier}</div>
                                </Grid>
                              </Grid>
                              <div className="item">
                                {
                                  isStaminaFull(val.stamina, val.maxStamina) ?
                                  (
                                  <div className="m-t-md">
                                    <small className="grim-item-property is-flex is-flex-align-center ready"><img className="button-icon" src="/img/icon-success.svg" alt="help icon" /> Ready for Field Work</small>
                                  </div>
                                  ) : (
                                  <div className="m-t-md">
                                    <small className="grim-item-property is-flex is-flex-align-center is-flex-justify-space-between">
                                      <div className="is-flex is-flex-align-center">
                                        <Tooltip className="m-r-sm" title="Clocked in Grims earn 10 units of stamina every 24h. At 50 units, your Grim is ready for Field Work Assignments!" placement="top">
                                          <img className="button-icon" src="/img/icon-help-grey.svg" alt="help icon" />
                                        </Tooltip>
                                        <span className="is-uppercase">Stamina</span>
                                      </div>
                                      <strong>{getStaminaValue(val.stamina, val.maxStamina)}</strong>
                                    </small>
                                  </div>
                                  )
                                }
                                {
                                  (<div className="cooldown-wrapper"><div className={`cooldown ${isStaminaFull(val.stamina, val.maxStamina) ? 'full' : ''} `}><div style={{width: (isStaminaFull(val.stamina, val.maxStamina) ? 100 : (calculateStaminaProgress(val.stamina, val.maxStamina) * 100)) + "%"}}></div></div></div>)
                                }
                              </div>

                              <div className="has-text-centered m-t-sm p-t-sm">
                                <button className="button is-tertiary is-fullwidth" disabled={isClockingOut[val.mint]} onClick={() => handleOpenConfirmClockOutModal([val.mint])}><img className="button-icon" src="/img/icon-clock-black.svg" alt="clock icon" />Clock Out</button>
                              </div>
                            </div>
                          </div>
                        </Grid>
                      );
                    })}
                </Grid>
              </div>
            </section>}

            {!isLoadingGrims && tabValue === 'onVacation' && notStakedGrims && notStakedGrims.length === 0 && <div className="m-t-md m-b-xl">No Grims are on vacation at this time</div>}

            {tabValue === 'onVacation' && <section className="m-t-md m-b-xl">
              <div className="grim-tiles">
                <Grid columns={24} container spacing={2}>
                {notStakedGrims &&
                  notStakedGrims.length > 0 &&
                  notStakedGrims.map((val, ind) => {
                    return (
                      <Grid item xs={24} sm={12} md={8} lg={6} key={val.mint} className="grim-card-container m-b-md">
                        <div className="grim-card">
                          <div className="has-text-centered">
                              <img className="grim-card-image" src={"https://hkgwtdvfyh.medianetwork.cloud/unsafe/600x600/filters:format(webp)/" + val.metadata.image} alt={val.metadata.name} />
                          </div>
                          <div className="grim-description">
                            <Grid columns={24} container spacing={2}>
                              <Grid item xs={12} md={12}>
                                <small className="grim-item-property is-uppercase">Agent</small>
                                <div className="has-font-gooper">{val.metadata.name.substring(4, val.metadata.name.length)}</div>
                              </Grid>
                              
                              <Grid item xs={12} md={12} className="is-flex is-flex-align-center has-text-right" justifyContent="right">
                                <div className={val.department ? getMutiplierClasses(val) : 'hidden'} title={getBaseTitle(val)}>x{val.multiplier}</div>
                              </Grid>
                            </Grid>
                            {
                              !val.benched ? 
                              (<div className="has-text-centered m-t-sm p-t-sm"><button className="button is-primary is-fullwidth" disabled={isClockingIn[val.mint]} onClick={() => triggerStake([val.mint])}><img className="button-icon" src="/img/icon-clock-white.svg" alt="clock icon" /> Clock In</button></div>) :
                              (<div className="has-text-centered m-t-sm p-t-sm"><div className="item"><small className="grim-item-property"><strong>{getPenaltyDay(val.penaltyTimestamp)}/7</strong> day penalty</small><div className="penalty"><div style={{width: (calculatePenaltyCooldown(val.penaltyTimestamp)) + "%"}}></div></div></div></div>)
                            }
                          </div>
                        </div>
                      </Grid>
                    );
                  })}
                </Grid>
              </div>
            </section>}

            {!isLoadingGrims && tabValue === 'daemons' && daemons && daemons.length === 0 && <div className="m-t-md m-b-xl">No Daemons lurking in your wallet</div>}

            {tabValue === 'daemons' && <section className="m-t-md m-b-lg">
              <div className="grim-cards">
                <Grid columns={24} container spacing={3}>
                  {daemons &&
                    Object.keys(daemons).length > 0 &&
                    Object.values(daemons).map((val:any) => {
                      return (
                        <Grid item xs={24} sm={12} md={8} lg={6} key={val.mint} className="grim-card-container m-b-md">
                          <div className="grim-card">
                            <div className="has-text-centered">
                                <img className="grim-card-image" src={"https://hkgwtdvfyh.medianetwork.cloud/unsafe/300x300/filters:format(webp)/" + val.metadata.image} alt={val.metadata.name} />
                            </div>
                            <div className="grim-description">
                              <Grid columns={24} container spacing={2}>
                                <Grid item xs={20} md={18}>
                                  <small className="grim-item-property is-uppercase">Daemon</small>
                                  <div className="has-font-gooper">{val.metadata.name.substring(7, val.metadata.name.length)}</div>
                                </Grid>
                                <Grid item xs={4} md={6} className="is-flex is-flex-align-center is-flex-justify-end">
                                  <div className={'stamina-boost'}><img src="/img/icon-stamina-boost.svg" alt="stamina icon" /></div>
                                </Grid>
                              </Grid>
                              <div className="item">
                                {
                                  <div className="m-t-md">
                                    <small className="grim-item-property is-flex is-flex-align-center is-flex-justify-space-between">
                                      <div className="is-flex is-flex-align-center">
                                        <span className="is-uppercase">Stamina Boost</span>
                                      </div>
                                      <strong>+2%</strong>
                                    </small>
                                  </div>
                                  
                                }
                              </div>
                            </div>
                          </div>
                        </Grid>
                      );
                    })}
                </Grid>
              </div>
            </section>}


          </div>

            </div>
            }


            {sectionValue == 'defi' &&
            <SectionDefi />
            }
          </Grid>
        </main>
        <ModalUnstyled
          className="unstyled-modal"
          aria-labelledby="Send $ASTRA"
          aria-describedby="Send $ASTRA"
          open={isOpenSendAstraModal}
          onClose={handleCloseSendAstraModal}
          BackdropComponent={Backdrop}
        >
          <Fade in={isOpenSendAstraModal}>
            <Box sx={p2pModalStyle} className="modal-form">
              <header className="is-flex is-flex-align-center is-flex-justify-space-between m-b-md">
                <h1 className="has-font-tomo">Send $ASTRA</h1>
                <img src="/img/icon-close-circle.svg" alt="close modal icon" onClick={handleCloseSendAstraModal} />
              </header>
              <SendAstraForm handleCloseSendAstraModal={handleCloseSendAstraModal} updateAstraBalance={updateAstraBalance} connection={connection} isUsingLedger={isUsingLedger} publicKey={publicKey} signMessage={signMessage} signTransaction={signTransaction} pointsBalance={pointsBalance} />
            </Box>
          </Fade>
        </ModalUnstyled>
        <ModalUnstyled
          className="unstyled-modal"
          aria-labelledby="Are you sure?"
          aria-describedby="Are you sure?"
          open={isOpenConfirmClockOutModal || isOpenConfirmClockOutAllModal}
          onClose={handleCloseConfirmClockOutModal}
          BackdropComponent={Backdrop}
        >
          <Fade in={isOpenConfirmClockOutModal || isOpenConfirmClockOutAllModal}>
            <Box sx={p2pModalStyle} className="modal-form">
              <header className="is-flex is-flex-align-center is-flex-justify-space-between m-b-md">
                <h1 className="has-font-tomo">Are you sure?</h1>
                <img src="/img/icon-close-circle.svg" alt="close modal icon" onClick={handleCloseConfirmClockOutModal} />
              </header>
              <p>Are you sure you want to clock out your Grim(s)? All <strong>stamina</strong> and <strong>unearned $ASTRA</strong> will be lost and the clocked out Grim(s) are unable to participate in Field Work.</p>

              <hr className="m-t-md m-b-md" />
              <div className="is-flex is-flex-justify-end">
                <button type="button" className="button is-tertiary is-xl" onClick={handleCloseConfirmClockOutModal}>
                  No, cancel
                </button>
                {<button className="button is-primary is-xl m-l-sm" disabled={isClockingOutAll || isClockingOutAny()} onClick={async () => {
                  if(isOpenConfirmClockOutModal){
                    await triggerUnstake(tokensToBeUnstaked)
                  }else if(isOpenConfirmClockOutAllModal){
                    await triggerUnstakeAll()
                  }
                  handleCloseConfirmClockOutModal()
                }}>
                  Yes, clock out
                </button>}
              </div>

            </Box>
          </Fade>
        </ModalUnstyled>
      </div>
    </>
  ) : (
  <>
    <HeadElement />
    <div className="container main-content-wrapper">
      <div className="m-t-md"><PublicSection /></div>
      <Marketplaces />
    </div>
  </>
  )
}


export default Home
