import React, { createContext, useEffect, useState } from "react";
import { useWallet } from '@solana/wallet-adapter-react';
import axios from "axios";

const GrimsContext = createContext<any | undefined>(undefined);

let ONE_COOLDOWN_PERIOD = (24 * 60 * 60 * 1000);
let WALLET_COOLDOWN_RATE = 1;
const COOLDOWN_UNITS = 10; // used to show a more precise number when displaying the cooldown
const domainURL = process.env.NEXT_PUBLIC_API_URL || '';
const getStakedURL = domainURL + "/grims-state";
const userRolesURL = domainURL + "/userRoles";

function GrimsProvider({ children }:any) {
  const { publicKey } = useWallet();
  const [isUsingLedger, setIsUsingLedger] = useState(false);
  const [grims, setGrims] = useState<{[key:string]: any}>({});
  const [daemons, setDaemons] = useState({});
  const [isLoadingGrims, setIsLoadingGrims] = useState(false);
  const [stakedGrims, setStakedGrims] = useState<any[]>([]);
  const [grimsReady, setGrimsReady] = useState<any[]>([]);
  const [grimCount, setGrimCount] = useState<number>();

  const [userRoles, setUserRoles] = useState<Array<string>>([]);
  const canCreateRaffle = userRoles && userRoles.includes("RAFFLE_CREATOR");
  const canCreateProposal = userRoles && userRoles.includes("PROPOSAL_CREATOR");

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
      let grimsInWallet = 0

      try {
        let result = await axios.get(getStakedURL + "?wallet=" + publicKey);
        let staked:any[] = [];
        let notStaked = [];
        let hidden = [];

        if (result && result.data && result.data.success && result.data.wallet) {
          //setPointsBalance(formatPoints(result.data.wallet.pointsBalance));
          //setAirdropApproved(result.data.airdropApproved);
          //setDepartmentsBreakdown(result.data.departments);

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

          //handleInitialTabSelection(stakedResults, unstakedResults)

          let benchedResults = result.data.wallet.benched;

          for (let i in benchedResults) {
            clockingOut[benchedResults[i].mint] = false;
            clockingIn[benchedResults[i].mint] = false;
            benchedResults[i].benched = true;
            allGrims[i] = benchedResults[i];
            notStaked.push(allGrims[i]);
            grimsInWallet += 1
          }

          let hiddenResults = result.data.wallet.hidden;

          for (let i in hiddenResults) {
            hiddenResults[i].hidden = true;
            locked += parseFloat(hiddenResults[i].pointsLocked);
            unclaimed += parseFloat(hiddenResults[i].pointsUnclaimed);
            allGrims[i] = hiddenResults[i];
            hidden.push(allGrims[i]);
          }

          setGrims(allGrims);
          setGrimCount(grimsInWallet)

          //setIsClockingIn(clockingIn);
          //setIsClockingOut(clockingOut);

          //setNotStakedGrims(notStaked);
          //setHiddenGrims(hidden);
          //setPointsLocked(formatPoints(locked));
          //setPointsUnclaimed(formatPoints(unclaimed));
        }

      } catch (error) {
        console.error('error...', error)
      }
    }

    // loadGrimsRefresh = setInterval(loadGrims, 5 * 60 * 1000);
  }

  return (
    <GrimsContext.Provider value={{grims, setGrims, daemons, setDaemons, grimsReady, setGrimsReady, loadGrims, isLoadingGrims, isUsingLedger, setIsUsingLedger, canCreateRaffle, canCreateProposal, grimCount}}>
      {children}
    </GrimsContext.Provider>
  );
}

export { GrimsProvider, GrimsContext };