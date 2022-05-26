import React, { useState } from "react";
import bs58 from "bs58";
import axios from "axios";
import { PublicKey } from "@solana/web3.js";
import WalletUtils from "../utils/WalletUtils";

const domainURL = process.env.NEXT_PUBLIC_API_URL || '';
const transferURL = domainURL + "/transfer";

const SendAstraForm = (props:any) => {
  const [sendAstraSuccessful, setSendAstraSuccessful] = useState(false);
  const [sendAstraFailed, setSendAstraFailed] = useState(false);
  const [sendErrorMessage, setSendErrorMessage] = useState('');

  const [sendAstraFormValues, setSendAstraValues] = useState({
    amount: 0,
    recipientWallet: ''
  });

  const handleSendAstraAmountInputChange = (event:any) => {
    event.persist();
    let astraValue = event.target.value;

    setSendAstraValues((values) => ({
      ...values,
      amount: astraValue,
    }));
  };

  const handleSendAstraRecipientWalletInputChange = (event:any) => {
    event.persist();
    setSendAstraValues((values) => ({
      ...values,
      recipientWallet: event.target.value,
    }));
  };

  const handleSendAstra = async (event:any) => {
    event.preventDefault();

    resetNotificationStates()

    const astraAmount = sendAstraFormValues.amount
    if (astraAmount > parseFloat(props.pointsBalance)) {
      console.warn('Not enough $ASTRA');
      setSendErrorMessage('Not enough $ASTRA');

      return;
    }

    if (sendAstraFormValues.recipientWallet.indexOf('.sol') === -1) {
      let validAddress = true;

      try {
        let t = new PublicKey(sendAstraFormValues.recipientWallet);
      } catch (e) {
        validAddress = false;
      }

      if (!validAddress) {
        console.warn('invalid address');
        setSendErrorMessage('Invalid wallet address');
        return;
      }
    }

    let data:{
      source:string,
      destination:string,
      amount:number,
      message?:string,
      bh?:string|null,
      user?:any,
    } = {
      source: props.publicKey.toString(),
      destination: sendAstraFormValues.recipientWallet,
      amount: astraAmount
    }

    let [signature, blockhash] = await WalletUtils.verifyWallet(props.connection, props.publicKey, 'transfer', data, props.isUsingLedger, props.signMessage, props.signTransaction);

    if (signature) {
      data.message = bs58.encode(signature);
      data.bh = blockhash;
      delete data.user;

      let result = await axios.post(transferURL, data);

      if (!result || !result.data || !result.data.success) {
        setSendAstraFailed(true);
        return;
      }
      
      setSendAstraSuccessful(true);
      props.updateAstraBalance(result.data.newBalance)
      
    } else {
      // TODO: Transaction/Message rejected
      setSendErrorMessage('Transaction was rejected');
    }
  }

  const resetNotificationStates = () => {
    setSendAstraSuccessful(false);
    setSendAstraFailed(false);
    setSendErrorMessage('');
  }

  return <form className="send-astra-form form" onSubmit={handleSendAstra}>
    {sendAstraSuccessful && <div className="is-flex is-flex-align-center"><img src="/img/icon-success.svg" alt="success icon" className="m-r-sm" /> {sendAstraFormValues.amount} $ASTRA has successfully been sent!</div>}

    {sendAstraFailed && <div className="is-flex is-flex-align-center"><img src="/img/icon-error.svg" alt="success icon" className="m-r-sm" /> Sorry, we were unable to send your $ASTRA.</div>}

    {sendErrorMessage && <div className="is-flex is-flex-align-center m-b-md"><img src="/img/icon-error.svg" alt="success icon" className="m-r-sm" /> {sendErrorMessage}</div>}

    {!sendAstraSuccessful && !sendAstraFailed && <fieldset className="is-fullwidth">
      <div>
        <label>Amount</label>
        <input
          id="send-astra-amount"
          className="is-fullwidth"
          type="number"
          placeholder="Enter amount"
          value={sendAstraFormValues.amount}
          onChange={(e) => handleSendAstraAmountInputChange(e)}
        />
        <div className="input-helper-text"><small className="has-text-natural-bone has-font-size-xs">$ASTRA balance: {props.pointsBalance}</small></div>
      </div>

      <div className="m-t-md">
        <label>Send to</label>
        <input
          id="send-astra-recipient"
          className="is-fullwidth"
          placeholder="Recipient Solana Wallet Address"
          value={sendAstraFormValues.recipientWallet}
          onChange={(e) => handleSendAstraRecipientWalletInputChange(e)}
        />
      </div>
    </fieldset>}

    <hr className="m-t-md m-b-md" />

    <div className="is-flex is-flex-justify-end">
      <button type="button" className="button is-tertiary is-xl" onClick={props.handleCloseSendAstraModal}>
        {sendAstraSuccessful || sendAstraFailed ? 'Close' : 'Cancel and Close' }
      </button>
      {!sendAstraSuccessful && !sendAstraFailed && <button className="button is-primary is-xl m-l-sm">
        Confirm and Send
      </button>}
    </div>
  </form>
}

export default SendAstraForm;