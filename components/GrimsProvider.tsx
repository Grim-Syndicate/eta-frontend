import React, { createContext, useEffect, useState } from "react";
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/router'
import axios from "axios";
import Utils from "../utils/Utils";

const GrimsContext = createContext<any | undefined>(undefined);

let ONE_COOLDOWN_PERIOD = (24 * 60 * 60 * 1000);
let WALLET_COOLDOWN_RATE = 1;
let SOL_PRICE = 0;
let FLOOR_PRICE = 0;
const COOLDOWN_UNITS = 10; // used to show a more precise number when displaying the cooldown
const domainURL = process.env.NEXT_PUBLIC_API_URL || '';
const getStakedURL = domainURL + "/grims-state";
const userRolesURL = domainURL + "/userRoles";
const getPublicStateURL = domainURL + "/public-state";

let loadPublicStateRefresh: NodeJS.Timeout | undefined = undefined
let isPublicStateLoading = false

function GrimsProvider({ children }:any) {
  const router = useRouter()
  const { walletOverride } = router.query
  const { publicKey } = useWallet();
  const [isUsingLedger, setIsUsingLedger] = useState(false);
  const [grims, setGrims] = useState<{[key:string]: any}>({});
  const [daemons, setDaemons] = useState({});
  const [isLoadingGrims, setIsLoadingGrims] = useState(false);
  const [isGrimsLoaded, setIsGrimsLoaded] = useState(false);
  const [stakedGrims, setStakedGrims] = useState<any[]>([]);
  const [grimsReady, setGrimsReady] = useState<any[]>([]);
  const [grimCount, setGrimCount] = useState<number>();

  const [pointsBalance, setPointsBalance] = useState(0);
  const [pointsLocked, setPointsLocked] = useState(0);
  const [pointsUnclaimed, setPointsUnclaimed] = useState(0);
  const [airdropApproved, setAirdropApproved] = useState(false);
  const [hasOnlyUnstakedGrimsInWallet, setHasOnlyUnstakedGrimsInWallet] = useState(false);
  const [isClockingIn, setIsClockingIn] = useState<{[key:string]: boolean}>({});
  const [isClockingOut, setIsClockingOut] = useState<{[key:string]: boolean}>({});
  const [notStakedGrims, setNotStakedGrims] = useState<any[]>([]);
  const [hiddenGrims, setHiddenGrims] = useState<any[]>([]);

  const [userRoles, setUserRoles] = useState<Array<string>>([]);
  const canCreateRaffle = userRoles && userRoles.includes("RAFFLE_CREATOR");
  const canCreateProposal = userRoles && userRoles.includes("PROPOSAL_CREATOR");

  const [isPublicStateLoaded, setIsPublicStateLoaded] = useState(false);
  const [allStakedGrims, setAllStakedGrims] = useState(0);
  const [lockedValueSOL, setLockedValueSOL] = useState(0);
  const [lockedValueUSD, setLockedValueUSD] = useState(0);

  const loadRoles = async() => {
    if (!publicKey) return;
    let result = await axios.get(userRolesURL + "?wallet=" + publicKey.toString());
    setUserRoles(result.data.roles);
  }

  useEffect(() => {
    console.log('grims changed')
    let ready = []

    for (const [key, value] of Object.entries(grims)) {
        let currentStamina = calculateStaminaProgress(value.stamina, value.maxStamina);
        if(currentStamina >= 1){
            ready.push(value)
        }
    }

    setGrimsReady(ready)
  },[grims])

  useEffect(() => {
    async function data() {
      setIsLoadingGrims(true);
      await loadRoles();
      await loadGrims();
      setIsLoadingGrims(false);
    } 
    data();
  }, [publicKey]);

  useEffect(() => {
    if(isPublicStateLoading) return
    async function data() {
      loadPublicState();
    } 
    data();

    return () => {
      if (loadPublicStateRefresh) clearInterval(loadPublicStateRefresh);
      setAllStakedGrims(0);
      setLockedValueSOL(0);
      setLockedValueUSD(0);
    }
  }, []);

  function getTimestamp() {
    let now = new Date();

    return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds());
  }

  const calculateStaminaProgress = (stamina:number, maxStamina:number) => {
    return stamina / maxStamina;
  }

  const loadGrims = async () => {
    // clearInterval(loadGrimsRefresh);

    if (publicKey) {
      let allGrims:{[key:string]: any} = {};
      let allDaemons:{[key:string]: any} = {};
      let grimsInWallet = 0

      try {
        let result = await axios.get(getStakedURL + "?wallet=" + (walletOverride || publicKey));
        let staked:any[] = [];
        let notStaked = [];
        let hidden = [];

        if (result && result.data && result.data.success && result.data.wallet) {
          setPointsBalance(parseFloat(Utils.formatPoints(result.data.wallet.pointsBalance)));
          setAirdropApproved(result.data.airdropApproved);

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
            grimsInWallet += 1
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
            grimsInWallet += 1
          }

          const hasStakedGrims = stakedResults && Object.keys(stakedResults).length > 0
          const hasUnstakedGrims = unstakedResults && Object.keys(unstakedResults).length > 0
          setHasOnlyUnstakedGrimsInWallet(!hasStakedGrims && hasUnstakedGrims)
      
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
          setGrimCount(grimsInWallet)
          setDaemons(allDaemons);

          setIsClockingIn(clockingIn);
          setIsClockingOut(clockingOut);

          setNotStakedGrims(notStaked);
          setHiddenGrims(hidden);
          setPointsLocked(parseFloat(Utils.formatPoints(`${locked}`)));
          setPointsUnclaimed(parseFloat(Utils.formatPoints(`${unclaimed}`)));
        }
        setIsGrimsLoaded(true)
      } catch (error) {
        console.error('error...', error)
      }
    }

    // loadGrimsRefresh = setInterval(loadGrims, 5 * 60 * 1000);
  }

  const loadPublicState = async () => {
    isPublicStateLoading = true
    clearInterval(loadPublicStateRefresh);

    try {
      let result = await axios.get(getPublicStateURL);
      
      if (result && result.data && result.data.success) {
        setAllStakedGrims(result.data.allStakedTokens);

        SOL_PRICE = parseFloat(result.data.solPrice.USD);
        FLOOR_PRICE = parseFloat(result.data.floorPrice.SOL);

        loadTVL(result.data.allStakedTokens);
      }

      loadPublicStateRefresh = setInterval(() => loadPublicState(), 15 * 60 * 1000);
      setIsPublicStateLoaded(true);
    } catch (err) {
      console.error(err)
    }
    isPublicStateLoading = false
  }

  const loadTVL = async (allStakedGrims:number) => {
    let tlv = FLOOR_PRICE * allStakedGrims;

    setLockedValueSOL(parseFloat(tlv.toFixed(2)));
    setLockedValueUSD(parseFloat((tlv * SOL_PRICE).toFixed(2)));
  };

  return (
    <GrimsContext.Provider value={{
      grims, 
      setGrims, 
      daemons, 
      setDaemons, 
      grimsReady, 
      setGrimsReady, 
      loadGrims, 
      isLoadingGrims, 
      isUsingLedger, 
      setIsUsingLedger, 
      canCreateRaffle, 
      canCreateProposal, 
      grimCount, 
      pointsBalance, 
      setPointsBalance,
      isGrimsLoaded, 
      airdropApproved, 
      hasOnlyUnstakedGrimsInWallet,
      isClockingIn,
      isClockingOut,
      stakedGrims,
      notStakedGrims,
      hiddenGrims,
      pointsLocked,
      setPointsLocked,
      pointsUnclaimed,
      setPointsUnclaimed,
      isPublicStateLoaded,
      allStakedGrims,
      lockedValueSOL,
      lockedValueUSD,
    }}>
      {children}
    </GrimsContext.Provider>
  );
}

export { GrimsProvider, GrimsContext };