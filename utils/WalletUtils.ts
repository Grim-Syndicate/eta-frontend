import axios from "axios";
import { Connection, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { WalletNotConnectedError, MessageSignerWalletAdapterProps, SendTransactionOptions, SignerWalletAdapterProps, WalletName, WalletReadyState } from '@solana/wallet-adapter-base';

import sha256 from 'crypto-js/sha256';
import {Buffer} from 'buffer';

const domainURL = process.env.NEXT_PUBLIC_API_URL || '';
const userURL = domainURL + "/user";

const stringifyParams = (data:any) => {
    let keys = Object.keys(data).sort();
    let params = [];

    for (let i in keys) {
      let key = keys[i];
      let value = data[key];

      params.push(key + '=' + (Array.isArray(value) ? value.join(',') : value));
    }

    return sha256( params.join('&') );
  };

class WalletUtils{
  static verifyWallet = async (connection:Connection, publicKey:PublicKey, action:string, data:any, usingLedger = false, signMessage:MessageSignerWalletAdapterProps['signMessage'] | undefined, signTransaction:SignerWalletAdapterProps['signTransaction'] | undefined):Promise<[Uint8Array | null, string | null]> => {
    let userResult = await axios.get(userURL + "?wallet=" + publicKey.toString());
    data.action = action;

    if (userResult.data.success) {
      data.user = userResult.data.user;
      let challenge = stringifyParams(data);

      if (usingLedger) {
        if (!publicKey) throw new WalletNotConnectedError();
        if (!signTransaction) throw new Error('Wallet does not support transaction signing!');
        return await WalletUtils.verifyTransaction(connection, publicKey, challenge, signTransaction);
      } else {
        if (!signMessage) throw new Error('Wallet does not support message signing!');
        return await WalletUtils.verifyMessage(challenge, signMessage)
      }
    }
    throw 'User not found'
  };

  static verifyTransaction = async (connection:Connection, publicKey:PublicKey, challenge:any, signTransaction:SignerWalletAdapterProps['signTransaction']):Promise<[Uint8Array | null, string | null]> => {
    try {
      const recentBlockhash = (await connection.getLatestBlockhash('finalized')).blockhash;
      const instruction = new TransactionInstruction({
        keys: [{ pubkey: publicKey, isSigner: true, isWritable: false }],
        programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
        data: Buffer.from(challenge.toString()),
      });

      let transaction = new Transaction({
        feePayer: publicKey,
        recentBlockhash: recentBlockhash
      }).add(instruction);

      transaction = await signTransaction(transaction);

      return [transaction.signatures[0].signature, recentBlockhash];
    } catch (e) {
      console.log(e);
      return [null, null];
    }
  };

  static verifyMessage = async (challenge:any, signMessage:MessageSignerWalletAdapterProps['signMessage']):Promise<[Uint8Array | null, string | null]> => {
    const message = "Please sign this message for proof of address ownership: " + challenge;
    const data = new TextEncoder().encode(message);
    let signature = await signMessage(data);

    return [signature, null];
  };
}  

export default WalletUtils;