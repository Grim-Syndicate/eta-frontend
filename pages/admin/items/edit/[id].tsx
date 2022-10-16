import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

import Box from '@mui/material/Box';
import { Button, ButtonGroup, Grid, MenuItem, Modal, Select, TextField, Typography } from "@mui/material";
import axios from "axios";
import { useRouter } from "next/router";
import HeadElement from "../../../../components/HeadElement";
import Marketplaces from "../../../../components/Marketplaces";
import Nightshift from "../../../../components/Nightshift";
import PublicSection from "../../../../components/PublicSection";
import Link from "next/link";
import { Quest } from "../../../../models/Quests";
import WalletUtils from "../../../../utils/WalletUtils";
import bs58 from "bs58";
import QuestEndStep from "../../../../components/quests/admin/QuestEndStep";
import { v4 as uuidv4 } from 'uuid';
import ItemSelectorModal from "../../../../components/ItemSelectorModal";


const modalStyle = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};

const domainURL = process.env.NEXT_PUBLIC_API_URL || '';
const getQuestsURL = domainURL + "/quests";

const ItemEditor = React.forwardRef((nftFunctions, ref) => {


    const { connection } = useConnection();
    const router = useRouter()
    const { id } = router.query

    const [item, setItem] = useState<any>(undefined);


    const [itemName, setItemName] = useState<string>("");
    const [itemImageURL, setItemImageURL] = useState<string>("");

    const loadItem = () => {

        const url = `${domainURL}/admin/item/all`

        axios.post(url, {}).then(response => {
            const item = response.data.items.find((a: any) => a._id === id);
            if (item) {
                setItem(item);
                setItemName(item.name);
                setItemImageURL(item.image);
            }
        });
    }
    useEffect(() => {

        loadItem();

    }, [id]);


    const { publicKey, sendTransaction, signTransaction, signMessage } = useWallet();
    const { wallet } = useWallet();
    const onSaveItem = async () => {
        if (!publicKey) {
            alert("Connect wallet first");
            return;
        }
        let form = {
            _id: item._id,
            name: itemName,
            image: itemImageURL
        };
        let data: any = {
            form: form,
            wallet: publicKey,
        };
        const [signature, blockhash] = await WalletUtils.verifyWallet(connection, publicKey, 'create-item', data, false, signMessage, signTransaction);

        if (signature) {
            const url = `${domainURL}/admin/item/create`
            data.message = bs58.encode(signature)
            data.bh = blockhash

            const result = await axios.post(url, data);
            console.log("result", result);
            loadItem();
            alert("Saved!");
        }
    }

    return (
        <>
            <HeadElement />
            <div>
                <div className="title-bar p-md main-content-wrapper">
                    <div className="container main-content-wrapper">
                        <div>
                            <h1 className="has-text-white has-font-tomo has-text-shadow">Editing - {item?.name}</h1>
                            <Link href={`/admin/items/create`}>
                                <a>View all Items</a>
                            </Link>
                        </div>
                        <Nightshift />
                    </div>
                </div>
                <main className="container main-content-wrapper main-wrapper m-t-md">



                    <h1>Editing item</h1>

                    <TextField label="Item Name" variant="standard" value={itemName} onChange={(e) => setItemName(e.target.value)} />
                    <TextField className="m-b-lg" label="Item Image URL" variant="standard" value={itemImageURL} onChange={(e) => setItemImageURL(e.target.value)} />
                    <Button className="m-b-sm" variant="contained" onClick={onSaveItem}>Save Item</Button>




                    <ButtonGroup
                        color="primary">
                        {/*<Button className="m-b-sm" variant="contained" color="info" onClick={() => setShowEdges(true)}>Show Nodes</Button>*/}
                    </ButtonGroup>

                </main>
            </div>
        </>
    )
});

export default ItemEditor;