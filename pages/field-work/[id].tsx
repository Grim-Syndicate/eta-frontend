import React, { useEffect, useState, useContext, useRef } from "react";
import { useRouter } from 'next/router'
import axios from "axios";
import { GrimsContext } from "../../components/GrimsProvider";
import Grid from '@mui/material/Grid';
import QuestGrimCell from "../../components/QuestGrimCell";
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import bs58 from "bs58";
import WalletUtils from '../../utils/WalletUtils';
import LineTyper from '../../components/LineTyper';
import QuestGrimInfo from "../../components/QuestGrimInfo";
import Utils from "../../utils/Utils";
import { CircularProgress } from "@mui/material";
import toast, { Toaster } from 'react-hot-toast'
import { GetServerSidePropsContext } from "next";
import QuestExecution from "../../models/QuestExecution";
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';

const domainURL = process.env.NEXT_PUBLIC_API_URL || '';
const getQuestURL = domainURL + "/quest";
const getActiveQuestURL = domainURL + "/quests/active";
const startQuestURL = domainURL + "/quests/start";
const finishQuestURL = domainURL + "/quests/finish";
const claimQuestURL = domainURL + "/quests/claim";
let scriptTimer: any = undefined;

const SectionQuest = React.forwardRef((props:any, _ref:any) => { 
    const quest = props.quest
    const id = quest._id
    const questFullScript = quest.questScript
    const router = useRouter()

    const { publicKey, wallet, signTransaction, signMessage } = useWallet();
    const { connection } = useConnection();
    const [isStartingQuest, setIsStartingQuest] = useState(false);
    const [isFinishingQuest, setIsFinishingQuest] = useState(false);
    const [isClaimingRewards, setIsClaimingRewards] = useState(false);
    const [isLoadingActiveQuests, setIsLoadingActiveQuests] = useState(false);
    const [activeQuestsLoadingFailed, setActiveQuestsLoadingFailed] = useState(false);
    const [shouldShowRollButton, setShouldShowRollButton] = useState(false);
    const [isShowingRollButton, setIsShowingRollButton] = useState(false);
    const [rollButtonLabel, setRollButtonLabel] = useState('Roll');
    const [isStoryFinished, setIsStoryFinished] = useState(false);

    const { grims, grimsReady, loadGrims, isLoadingGrims, isUsingLedger } = useContext(GrimsContext);
    const [grimOnQuestSelected, setGrimOnQuestSelected] = useState<any>(null);
    const [selectedGrims, setSelectedGrims] = useState<any[]>([]);
    const [activeQuests, setActiveQuests] = useState<any[] | null>(null);
    const [questScript, setQuestScript] = useState<any>(null);
    const scriptEndRef = useRef<any>(null)
    
    const [time, setTime] = useState(Date.now());

    useEffect(()=>{
        let myInterval = setInterval(() => setTime(Date.now()), 1000)
        return ()=> {
            clearInterval(myInterval);
        };
    },[]); 
 
    useEffect(() => {
      async function data() {
        await loadActiveQuests();
      } 
      data();
    }, [publicKey, grims])
  
    const retryFailedRequests = async () => {
      if(activeQuestsLoadingFailed){
        loadActiveQuests()
      }
    }

    const loadActiveQuests = async () => {
        if(!publicKey || !id){
          return
        }
        setIsLoadingActiveQuests(true);
        setActiveQuestsLoadingFailed(false)
        let failed = true
        try {
          let url = getActiveQuestURL + "?wallet=" + publicKey.toString() + "&quest=" + id
          let result = await axios.get(url);
  
          if (result && result.data && result.data.success && result.data.quests) {
            const quests = result.data.quests
              setActiveQuests(quests);
              failed = false
          }
        } catch (error) {
          console.error('error...', error)
        }
        setActiveQuestsLoadingFailed(failed)
        setIsLoadingActiveQuests(false);
    }
  
      const initiateQuest = async () => {
          if(!publicKey) throw new WalletNotConnectedError()

        setIsStartingQuest(true)
        const participants = selectedGrims.map((grim:any) => grim.mint)
  
        let data:{
            quest:string,
            participants:string[],
            wallet:string|undefined,
            message?:string,
            bh?:string|null,
            user?:any,
        } = {
          quest:id,
          participants: participants,
          wallet: publicKey.toString()
        };
  
        try {
          const [signature, blockhash] = await WalletUtils.verifyWallet(connection, publicKey, 'start-quest', data, isUsingLedger, signMessage, signTransaction);
  
          if (!signature) {
            setIsStartingQuest(false)
            return
          }
  
          data.message = bs58.encode(signature);
          data.bh = blockhash;
  
          try {
            const result = await axios.post(startQuestURL, data);
            if (result?.data?.error) {
              toast.error(result.data.error)
            }
            
            if (result?.data?.success && result?.data?.quest) {
              await loadActiveQuests()
              let quest = Object.assign(new QuestExecution, result.data.quest)
              quest.participantTokens = result.data.participantTokens
              const grimOnQuest = {
                grim: selectedGrims[0],
                quest: quest
              }
              
              setSelectedGrims([])
              setGrimOnQuestSelected(grimOnQuest)
              renderScript(0)
            }
            
            setIsStartingQuest(false)
          } catch (error) {
            console.error('error...', error)
            setIsStartingQuest(false)
          }
  
        } catch (error) {
          setIsStartingQuest(false)
        }
    };
  
    const finishQuest = async (quest:any) => {
        if(!publicKey) throw new WalletNotConnectedError()
      setIsFinishingQuest(true)
      let data:{
        quest:string,
        wallet:string|undefined,
        message?:string,
        bh?:string|null,
        user?:any,
    } = {
        quest:quest._id,
        wallet: publicKey.toString()
      };
  
      try{
        let [signature, blockhash] = await WalletUtils.verifyWallet(connection, publicKey, 'finish-quest', data, isUsingLedger, signMessage, signTransaction);
  
        if (signature) {
          data.message = bs58.encode(signature);
          data.bh = blockhash;
          console.log(data)
  
          try {
            let result = await axios.post(finishQuestURL, data);
            if (result && result.data){
              if(result.data.success){
                if (result.data.quest) {
                  await loadActiveQuests()
                  if(grimOnQuestSelected){
                    let q = Object.assign(new QuestExecution, result.data.quest)
                    q.participantTokens = result.data.participantTokens
                    let grim = {
                      grim: grimOnQuestSelected.grim,
                      quest: q
                    }
                    setGrimOnQuestSelected(grim)
                  }
                }
              } else {
                toast.error(result.data.error)
              }
            }
            setIsFinishingQuest(false)
          } catch (error) {
            console.error('error...', error)
            setIsFinishingQuest(false)
          }
        } else{
          setIsFinishingQuest(false)
        }
      } catch (error) {
        setIsFinishingQuest(false)
      }
    };
  
    const claimRewards = async (quest:any) => {
        if(!publicKey) throw new WalletNotConnectedError()

      setIsClaimingRewards(true)
      let data:{
        quest:string,
        wallet:string|undefined,
        message?:string,
        bh?:string|null,
        user?:any,
    } = {
        quest:quest._id,
        wallet: publicKey.toString()
      };
  
      try{
        let [signature, blockhash] = await WalletUtils.verifyWallet(connection, publicKey, 'claim-rewards', data, isUsingLedger, signMessage, signTransaction);
  
        if (signature) {
          data.message = bs58.encode(signature);
          data.bh = blockhash;
          console.log(data)
  
          try {
            let result = await axios.post(claimQuestURL, data);
            if (result && result.data){
              if(result.data.success){
                if (result.data.quest) {
                  toast.success('Rewards claimed successfully')
                  await loadGrims()
                  await loadActiveQuests()
                  setGrimOnQuestSelected(null)
                  router.push('/field-work')
                }
              } else {
                toast.error(result.data.error)
              }
            }
  
            setIsClaimingRewards(false)
          } catch (error) {
            console.error('error...', error)
            setIsClaimingRewards(false)
          }
        } else {
          setIsClaimingRewards(false)
        }
      } catch (error) {
        setIsFinishingQuest(false)
      }
    };
  
    const scrollToBottom = () => {
      scriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
  
    const renderScript = async (newIndex:number) => {
      if(!questFullScript) return
      scriptTimer?.abort()
      let script:any = questScript != null ? [...questScript] : []
      if(newIndex == 0){
        //script starting over. Reset everything
        script = []
        setIsShowingRollButton(false)
        setShouldShowRollButton(false)  
        setIsStoryFinished(false)
      }
  
      let take = questFullScript[newIndex]
      script.push(take)
  
      setQuestScript([...script])
    }
  
    useEffect(() => {
      scrollToBottom()
      if(questScript){
        //if duration is set, show the next take after it
        const take = questScript[questScript.length - 1]
        if(take.duration){
          scriptTimer = Utils.Timer(take.duration)
          scriptTimer.start().then(processNextStep)
        }
      } else {
        scriptTimer?.abort()
      }
    }, [questScript]);
  
    useEffect(() => {
      if(shouldShowRollButton){
        setIsShowingRollButton(true)
      }
    }, [shouldShowRollButton]);
  
    useEffect(() => {
      if(isShowingRollButton){
        scrollToBottom()
      }
    }, [isShowingRollButton]);
  
    useEffect(() => {
      if(isStoryFinished){
        scrollToBottom()
      }
    }, [isStoryFinished]);
  
    const roll = () => {
      setIsShowingRollButton(false)
      setShouldShowRollButton(false)
      processNextStep()
    };
  
    function getRandomTakeOption(options:any) {
      var i;
  
      var chances:any[] = [];
  
      for (i = 0; i < options.length; i++)
        chances[i] = options[i].chance + (chances[i - 1] || 0);
      
      var random = Math.random() * chances[chances.length - 1];
      
      for (i = 0; i < chances.length; i++)
          if (chances[i] > random)
              break;
      
      return options[i].take;
    }
  
    const processNextStep = async () => {
        if(!questScript) return
      const take = questScript[questScript.length - 1]
  
      if(take.options.length > 1 && isShowingRollButton == false){
        //show roll button
        setRollButtonLabel(take.action ?? 'Roll')
        setShouldShowRollButton(true)
        return
      }
  
      let takeOption = getRandomTakeOption(take.options)
  
      if(takeOption){
        renderScript(takeOption)
      } else {
        //finished
        setIsStoryFinished(true)
      }
    }
  
    const performAction = async () => {
      if(isShowingRollButton) return
      processNextStep()
    }
  
    if (process.browser) {

  // capture keyboard input
  document.onkeyup = function (e) {
    // check for spacebar press
    if (e.keyCode == 32 && e.target == document.body) {
        // check if an input is currently in focus
        if (document.activeElement?.nodeName.toLowerCase() != "input") {
            // prevent default spacebar event (scrolling to bottom)
            e.preventDefault();
            performAction()
        }
    }
  };  
  
  document.onkeydown = function (e) {
  
    // check for spacebar press
    if (e.keyCode == 32 && e.target == document.body) {
  
        // check if an input is currently in focus
        if (document.activeElement?.nodeName.toLowerCase() != "input") {
  
            // prevent default spacebar event (scrolling to bottom)
            e.preventDefault();
        }
    }
  };  
  
    }

  const renderLeftColumn = function () {
    if(!publicKey) {
      return <>
        <h3>Not Connected</h3>
        <p>Make sure to connect your wallet in order to start this assignment!</p>
      </>
    }
  
    if(!quest || !activeQuests) {
      return <></>
    }
  
    if(!grimsReady || grimsReady.length == 0) {
      if(isLoadingGrims){
        return <>
        <h3>Scanning for Grims</h3>
        <p>We are currently checking your wallet for Grims</p>
        <CircularProgress />
      </>
      } else {
        return <>
        <h3>No Grims Ready</h3>
        <p>Looks like you don't have any grims that are ready for Field Work yet. You can double check in the Dashboard and make sure their stamina bar is full</p>
      </>
      }
    }
  
    if(activeQuests && activeQuests.length > 0) {
      const grimsOnQuests = []
      for(const q of activeQuests){
        for(const pToken of q.participantTokens){
          if(pToken.mint in grims){
            let quest = Object.assign(new QuestExecution, q)
            grimsOnQuests.push({
              grim: grims[pToken.mint],
              quest: quest
            })
          }
        }
      }
      return <>
  
      <h3>On Duty ({grimsOnQuests?.length || 0})</h3>
  
      <div className={`grims-container ${grimOnQuestSelected == null ? '' : 'open'}`}>
  
      <Grid columns={24} container item spacing={2} wrap={'wrap'} className="grims">
  
        { grimsOnQuests && grimsOnQuests.length > 0 && grimsOnQuests.map((grimOnQuest) => {        
            let grim = grimOnQuest.grim
            const selected = grimOnQuestSelected?.grim.metadata.ID == grim.metadata.ID
            return (<QuestGrimCell 
              key={grim.metadata.ID} 
              metadata={grim.metadata} 
              selected={selected}
              onClick={() => {
                let shouldRestartScript = true
  
                //only restart script if they are from different quests.
                if(grimOnQuestSelected && grimOnQuest.quest._id == grimOnQuestSelected.quest._id){
                  shouldRestartScript = false
                }
  
                if(selected){
                  setGrimOnQuestSelected(null)
                  setQuestScript(null) //reset script if we deselect them. Gives a chance to start reading again. (revisit when we have interactive quests)
                } else {
                  setGrimOnQuestSelected(grimOnQuest)
                  if(grimOnQuest.quest.status == "STARTED" && shouldRestartScript){
                    renderScript(0)
                  }
                }
              }}
              quest={grimOnQuest.quest}
              isStoryFinished={isStoryFinished}
            />)
          }
        )}
      
      </Grid>
  
      <QuestGrimInfo grimOnQuest={grimOnQuestSelected} isStoryFinished={isStoryFinished} />
      </div>
    </>
    }
  
    if(!activeQuests || activeQuests.length == 0){ 
    return <>
  
      <h3>Ready for field work ({grimsReady?.length || 0})</h3>
    {!grimsReady || grimsReady.length == 0 && <p>You don’t have any Grims with enough stamina for Field Work. Stake Grims and fill your stamina bar to start an Assignment!</p>}
  
    <div className="grims-container">
  
    <Grid columns={24} container spacing={2} wrap={'wrap'} className="grims">
  
    {grimsReady &&
  grimsReady.length > 0 &&
  grimsReady.map((grim:any) => {
  let grims = [...selectedGrims]
  const selected = selectedGrims.filter((i:any)=> i.metadata.ID == grim.metadata.ID).length > 0
  return (
  <QuestGrimCell 
  key={grim.metadata.ID} 
  metadata={grim.metadata} 
  selected={selected}
  onClick={() => {
    if(selected){
      grims = grims.filter((item:any) => item.metadata.ID != grim.metadata.ID);
    } else {
      grims.push(grim)
    }
    setSelectedGrims(grims)
  }}
  />
  )
  }
  )}
    </Grid>
    </div>
  
    </>}
  
  
  }
  
  const renderQuestContent = function () {
    if(!publicKey) {
      return <>
        <h3>Not Connected</h3>
        <p>Make sure to connect your wallet in order to start this assignment!</p>
      </>
    }
  
    if(isLoadingActiveQuests) {
      return <div className="quest-header"><CircularProgress color="inherit" /></div>
    }
  
    if(!quest || !activeQuests) {
      if(activeQuestsLoadingFailed) {
        return <>
          <div className="quest-header">
              <h2>Oh oh</h2>
              <p>There was a problem loading the story. Please try again!</p>
          </div>
          <div className="quest-footer">
            <button className="button is-primary is-fullwidth" onClick={() => retryFailedRequests()} disabled={isLoadingActiveQuests} >{ isLoadingActiveQuests ? <CircularProgress color="inherit" /> : 'Retry' }</button>
          </div>
        </>
      }
      return <>
        <div className="quest-header">
            <h2>Oh oh</h2>
            <p>There was an unexpected problem. Please try refreshing the page!</p>
        </div>
      </>
    }
    if(activeQuests && activeQuests.length > 0) {
      if(grimOnQuestSelected){
        if(grimOnQuestSelected.quest.status == "STARTED"){
            //show script from current progress point
            return <>
            <div className="quest-header">
              <h2>{quest?.title}</h2>
            </div>
            <Grid item container direction={'column'} flex={1} className="quest-content-container">
              <div className="quest-content live" onClick={performAction}>
              <div className="quest-script">

              {questScript && questScript.map(function(take:any, index:number) {
                const decoration = take.decoration ? take.decoration : ""
                const participantCSS = take.actor?.includes('participant') ? "participant" : ""
  
                let participantName = 'Agent #' + grimOnQuestSelected.grim.metadata.ID
                let actor = take.actor
                let line = take.line
                if(actor){
                  actor = actor.replace('{participant}', participantName)
                }
                if(line){
                  line = line.replace('{participant}', participantName)
                }
  
                if(!actor){
                  //if no actor, returns environment line
                  return <div key={index} className={`take environment ${decoration}`}>
                    <div className="line">{line}</div>
                  </div>
                } 
  
                //return actor line
                return <div key={index} className={`take ${decoration}`}>
                  <div className={`actor ${participantCSS}`}>{actor}</div>
                  <LineTyper key={index} className="line" avgTypingDelay={20} >{line}</LineTyper>
                </div>
              })
              }
              <div className={`take environment`}>
                <div className="line">
              { isStoryFinished == true && <>You've reached the end of this chapter.</> }
                </div>
              </div>
                  <div ref={scriptEndRef} />
              </div>
              </div>
            </Grid>
            <div className="quest-footer">
                { isShowingRollButton &&  
                <button className="button is-primary is-fullwidth" onClick={() => roll()} ><img className="button-icon" src="/img/icon-roll.svg" alt="claim icon" />{ rollButtonLabel }</button>
                }
                { isStoryFinished == false && <a href={`/field-work`} className="button is-secondary is-fullwidth">Abandon Assignment</a> }
                { isStoryFinished &&  
                <button className="button is-primary is-fullwidth" onClick={() => finishQuest(grimOnQuestSelected.quest)} disabled={isFinishingQuest} >{ isFinishingQuest ? <CircularProgress color="inherit" /> : 'Complete Assignment' }</button>
                }
            </div>
            </>
        } else 
        if(grimOnQuestSelected.quest.progress >= 1){
          //quest done
          return <>
            <div className="quest-header">
              <h2>Assignment complete!</h2>
              <p>Congratulations on an Assignment well done, <strong>Agent #{ grimOnQuestSelected.grim.metadata.ID }</strong>. You have been rewarded with the following:</p>
              <div className="quest-rewards">
              { Object.keys(grimOnQuestSelected.quest.claimableRewards).map(function(reward) {
                let value = grimOnQuestSelected.quest.claimableRewards[reward]
                return <p key={reward}>{value} { reward }</p>
              })}
              </div>
            </div>
            <Grid item container direction={'column'} flex={1} className="quest-content-container">
            <div className="quest-content done">
              <div className="quest-img-container">
                <img src={quest?.image} />
              </div>
            </div>
            </Grid>
            <div className="quest-footer">
              <button className="button is-primary is-fullwidth" onClick={() => claimRewards(grimOnQuestSelected.quest)} disabled={isClaimingRewards} >{ isClaimingRewards ? <CircularProgress color="inherit" /> : 'Claim Rewards' }</button>
            </div>
          </>
        } else {
          //quest in progress
          return <>
  
          </>
        }
  
      } else {
        //There are grims on a quest, but none selected
        return <>
          <div className="quest-header">
            <h2>{quest?.title}</h2>
            <p>Select a Grim on duty to check its work progress</p>
          </div>
          <Grid item container direction={'column'} flex={1} className="quest-content-container">
          <div className="quest-content">
            <div className="quest-img-container">
              <img src={quest?.image} />
            </div>
          </div>
          </Grid>
          <div className="quest-footer">
            <a href={`/field-work`} className="button is-secondary is-fullwidth">Back to Field Work</a>
          </div>
        </>
      }
    }
  
  
    if(!activeQuests || activeQuests.length == 0) {
      return <>
        <div className="quest-header">
          <h2>{quest?.title}</h2>
          <p>Select the Grims you’d like to send on this Assignment. Only Grims that have <strong>full stamina</strong> are able to start Assignments.</p>
        </div>
        <Grid item container direction={'column'} flex={1} className="quest-content-container">
        <div className="quest-content">
          <div className="quest-img-container">
            <img src={quest?.image} />
          </div>
        </div>
        </Grid>
        <div className="quest-footer">
            <a href={`/field-work`} className="button is-secondary is-fullwidth">Back to Field Work</a>
            <button className="button is-primary is-fullwidth" onClick={initiateQuest} disabled={selectedGrims.length <= 0 || isStartingQuest }>{ isStartingQuest ? <CircularProgress color="inherit" /> : 'Start Assignment' }</button>
        </div>
      </>
    }    
  }
  
      return <div className="quest">
          <Toaster position='top-center' reverseOrder={false} toastOptions={{duration: 5000}} />
          <div className="has-background-quests p-md main-content-wrapper">
              <h1 className="container has-text-left main-content-wrapper has-text-white has-font-tomo has-text-shadow">Field Work Assignment</h1>
          </div>
          <main className="container main-content-wrapper main-wrapper is-reverse m-t-md">
          <Grid columns={24} container spacing={2} flex={1}>
              <Grid columns={24} item container xs={24} md={6} >
                <Grid item xs={24} className="quest-container ">
                  
                { renderLeftColumn() }
  
                </Grid>
              </Grid>
  
              <Grid columns={24} item container xs={24} md={18} flex={1}>
                <Grid columns={24} item container direction={'column'} xs={24} className="quest-container quest-main">
                
                { renderQuestContent() }
  
              </Grid>
              </Grid>
          </Grid>
          </main>
      </div>
  })
  
export async function getServerSideProps(context:GetServerSidePropsContext) {
    const { id } = context.query

    try {
        let result = await axios.get(getQuestURL + "/" + id);

        if (result && result.data && result.data.success && result.data.quest) {
            return { props: { quest: result.data.quest } }
        }
      } catch (error) {
        console.error('error...', error)
      }

    // Pass data to the page via props
    return { props: { quest: null } }
  }

export default SectionQuest;