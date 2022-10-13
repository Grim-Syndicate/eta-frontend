import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

import ReactFlow, {
    addEdge,
    Background,
    useNodesState,
    useEdgesState,
    MiniMap,
    Controls,
    ReactFlowProvider,
} from 'react-flow-renderer';
import { Button, ButtonGroup, Grid, MenuItem, Modal, Select, TextField, Typography } from "@mui/material";
import axios from "axios";
import { useRouter } from "next/router";
import HeadElement from "../../../../components/HeadElement";
import Marketplaces from "../../../../components/Marketplaces";
import Nightshift from "../../../../components/Nightshift";
import PublicSection from "../../../../components/PublicSection";
import QuestPickerModal from "../../../../components/quests/admin/QuestPickerModal";
import QuestStepRandomStep from "../../../../components/quests/admin/QuestStepRandomStep";
import QuestStepRandomStepsContainer from "../../../../components/quests/admin/QuestStepRandomStepsContainer";
import QuestStepUserChoice from "../../../../components/quests/admin/QuestStepUserChoice";
import QuestStepUserChoicesContainer from "../../../../components/quests/admin/QuestStepUserChoicesContainer";
import QuestStep from "../../../../components/quests/admin/QuestStep";
import Link from "next/link";
import { Quest } from "../../../../models/Quests";
import WalletUtils from "../../../../utils/WalletUtils";
import bs58 from "bs58";
import QuestEndStep from "../../../../components/quests/admin/QuestEndStep";
import { v4 as uuidv4 } from 'uuid';



const initialEdges = [
    { id: 'e1-2', source: '1', target: '2', animated: true },
    /*
    { id: 'e1-3', source: '1', target: '3' },
    { id: 'e2a-4a', source: '2a', target: '4a' },
    { id: 'e3-4', source: '3', target: '4' },
    { id: 'e3-4b', source: '3', target: '4b' },
    { id: 'e4a-4b1', source: '4a', target: '4b1' },
    { id: 'e4a-4b2', source: '4a', target: '4b2' },
    { id: 'e4b1-4b2', source: '4b1', target: '4b2' },*/
];


const initBgColor = '#1A192B';

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

const QuestEditor = React.forwardRef((nftFunctions, ref) => {


    const { connection } = useConnection();
    const { publicKey, sendTransaction, signTransaction, signMessage } = useWallet();


    const router = useRouter()
    const { id } = router.query

    const [quest, setQuest] = useState<any>(undefined);
    const [quests, setQuests] = useState([]);

    useEffect(() => {
        loadQuests();
    }, []);

    const loadQuests = async () => {
        try {
            let result = await axios.get(getQuestsURL);

            if (result && result.data && result.data.success && result.data.quests) {
                setQuests(result.data.quests);
            }
        } catch (error) {
            console.error('error...', error)
        }
    }



    useEffect(() => {

        const active = quests.find((a: any) => a._id === id);
        if (!active) return;
        console.log("active", active);
        console.log("Quests", quests);

        loadQuest(active);



    }, [id, quests]);


    const nodeTypes = useMemo(() => ({
        questUserChoice: QuestStepUserChoice,
        questStepRandomStep: QuestStepRandomStep,
        questUserChoicesContainer: QuestStepUserChoicesContainer,
        questStepRandomStepsContainer: QuestStepRandomStepsContainer,
        questStep: QuestStep,
        questEndStep: QuestEndStep
    }), []);

    const { wallet } = useWallet();
    const [sectionValue, setSectionValue] = React.useState<string>('proposals');

    const [showQuestPicker, setShowQuestPicker] = useState<boolean>(false);

    const [scriptBeingEdited, setScriptBeingEdited] = useState<any>(undefined);
    const [bgColor, setBgColor] = useState(initBgColor);

    const [showEdges, setShowEdges] = useState<boolean>(false);
    const [nodess, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    useEffect(() => {
        /*
        setNodes([

        ]);*/

    }, []);

    const loadQuest = async (quest: Quest) => {

        setQuest(quest);
        console.log(`Loading quest`, quest);

        let newNodes = [];
        const newEdges = [];

        let index = 0;
        for (let step of quest.questScript) {


            //if (step.progressType === "END_QUEST") continue

            if (!step.id) {
                step.id = uuidv4();
            }
            if (!step.name) {
                if (step.line) {
                    step.name = step.line.replace("{participant}", "").substr(0, 10);
                } else if (step.actor) {
                    step.name = step.actor;
                }
            }

            let nodes: Array<any> = [];
            if (step.progressType !== "END_QUEST") {
                nodes = createStep(step.id, step.name);
            } else {
                nodes = createEndStep(step.id, step.name);
            }

            let mainNode = nodes.find(a => a.id === step.id);
            console.log("mainNode", {stepId: step.id, nodes})
            if (step.progressType === "END_QUEST") {
                //mainNode = nodes.find(a => a.)
            }
            mainNode.data.progressType = step.progressType || "AUTO_PROGRESS";
            mainNode.data.isInitialStep = index === 0;
            mainNode.data.duration = step.duration || 0;
            mainNode.data.actor = step.actor || "";
            mainNode.data.line = step.line || "";

            console.log("step", step);
            console.log("main", mainNode);

            if (step.editor) {
                mainNode.position = step.editor.position;
            } else {
                mainNode.position.x = index * 300;
            }

            for (let node of nodes) {
                newNodes.push(node);
            }

            index += 1;
        }


        for (let step of quest.questScript) {
            if (step.progressType !== "END_QUEST") {


             //   continue;
            }


            const mainNode: any = newNodes.find(a => a.id === step.id);
            console.log("mainNode", mainNode);
            if (mainNode) {

                //setup randomSteps!
                let index = 0;
                for (let option of step.options) {
                    index += 1;
                    if (!option.take && !option.goToStepId) continue;

                    let toObj = undefined;
                    if (option.take) {
                        toObj = newNodes.filter(a => a.type === "questStep")[option.take];
                    } else if (option.goToStepId) {
                        toObj = newNodes.find(a => a.id === option.goToStepId);
                    }
                    if (!toObj) {
                        console.error(`Couldn't find option`, {option, newNodes});
                        continue;
                    }

                    console.log("Creating", mainNode.id + toObj.id + Math.random());


                    newNodes.push(
                        {
                            id: `${mainNode.id}_questRandomStep${index}`,
                            data: { label: 'Option', chance: option.chance, stepId: mainNode.id, editNode: editNode, onStepChoiceTextChange: onStepChoiceTextChange, color: initBgColor },
                            position: { x: 10, y: 70 },
                            parentNode: `${mainNode.id}_randomStepsContainer`,
                            type: "questStepRandomStep",
                            dragHandle: '.custom-drag-handle',
                            extent: "parent",
                            style: { width: 200, height: 60 },
                        });

                    newEdges.push({
                        id: mainNode.id + toObj.id + Math.random(),
                        source: mainNode.id + "_questRandomStep" + index,
                        target: toObj.id,

                        sourceHandle: step.id + "questRandomStep" + index + "_random_right",
                        targetHandle: toObj.id + "handle2"

                    })

                }

                //setup userChoices
                if (step.userChoices) {
                    console.log("lets go", step.userChoices);
                    index = 0;
                    for (let choice of step.userChoices) {
                        index += 1;


                        newNodes.push(
                            {
                                id: `${mainNode.id}_userChoiceNode${index}`,
                                data: { stepId: mainNode.id, choiceText: choice.text, onStepChoiceTextChange: onStepChoiceTextChange, color: initBgColor },
                                position: { x: 10, y: 70 + ((index - 1) * 70) },
                                parentNode: `${mainNode.id}_cc`,
                                type: "questUserChoice",
                                dragHandle: '.custom-drag-handle',
                                extent: "parent",
                                style: { width: 200, height: 60, display: "none" },
                            });


                        let toObj = undefined;
                        if (choice.goToStep) {
                            toObj = newNodes.filter(a => a.type === "questStep")[choice.goToStep];
                        }
                        if (choice.goToStepId) {
                            toObj = newNodes.find(a => a.id === choice.goToStepId);
                        }

                        if (!toObj) {
                            console.error(`Couldn't find userChoice`, choice);
                            continue;
                        }

                        console.log("Creating", mainNode.id + toObj.id + Math.random());


                        newEdges.push({
                            id: mainNode.id + toObj.id + Math.random(),
                            source: mainNode.id + "_userChoiceNode" + index,
                            target: toObj.id,

                            sourceHandle: step.id + "_userChoiceNode" + index + "_random_right",
                            targetHandle: toObj.id + "handle2"

                        })

                    }
                }
            } else {
                console.log(`Nothing for ${step.id}`);
            }

        }
        /*
                const choiceContainers = newNodes.filter(a => a.type === "questUserChoicesContainer");
                console.log("choiceContainers", choiceContainers);
                for (let node of choiceContainers) {
                    let children = newNodes.filter(a => a.type === "questUserChoice" && a.parentNode === node.id);
                    console.log(node.id + " children", children);
        
                    if (children.length === 0) continue;
        
        
                    node.style.height = 30 + (children.length * children[0].style.height);
                }
        
        
        
        
                const stepNodes = newNodes.filter(a => a.type === "questStep");
                for (let node of stepNodes) {
        
                    let children = newNodes.filter(a => a.parentNode === node.id);
                    let totalHeight = 0;
                    for (let child of children) {
                        totalHeight += child.style.height;
                    }
                    totalHeight += 130;
                    node.style.height = totalHeight;
                }*/
        newNodes = resizeNodes(newNodes);

        console.log("newNodes", newNodes);

        console.log("newEdges", newEdges);

        setNodes(newNodes);
        setEdges(newEdges);
        setStepsCreated(quest.questScript.length);



    }

    const resizeNodes = (nodes: Array<any>) => {

        /*
        return nodes.map((node) => {
            if (node.id !== "step0") return {...node};

            const children = nodes.filter((a: any) => a.id.startsWith(node.id + "_"));
            const progressType = node.data.progressType;
            console.log(`${node.id} ${progressType} has children`, children);
            for (let child of children) {

                //console.log(`${progressType}   ${child.type} for ${child.id}`);
                if (progressType === "RANDOM" && (child.type === "questUserChoicesContainer" || child.type === "questUserChoice")) {
                    child.style.display = "none";
                    console.log(`Set ${child.id} to ${child.style.display}`);
                } else if (progressType === "CHOICE" && (child.type === "questStepRandomStepsContainer" || child.type === "questStepRandomStep")) {
                    child.style.display = "none";
                    console.log(`Set2 ${child.id} to ${child.style.display}`);
                } else {
                    child.style.display = "block";
                    console.log(`Set3 ${child.id} to ${child.style.display}`);
                }
            }

            return {...node};
        })*/
        /*
                let progressType = Math.random() < 0.5 ? 'RANDOM' : 'CHOICE';
        
                for (let node of nodes) {
                    if (progressType === "RANDOM" && (node.type === "questUserChoicesContainer" || node.type === "questUserChoice")) {
                        node.style.display = "none";
                    } else if (progressType === "CHOICE" && (node.type === "questStepRandomStepsContainer" || node.type === "questStepRandomStep")) {
                        node.style.display = "none";
                        console.log(`Set2 ${node.id} to ${node.style.display}`);
                    } else {
                        node.style.display = "block";
                        console.log(`Set3 ${node.id} to ${node.style.display}`);
                    }
                }
                return nodes;*/

        let stepNodes = nodes.filter(a => a.type === "questStep");
        for (let node of stepNodes) {
            //console.log(" ");
            //if (node.id !== "step0") continue;

            const children = nodes.filter((a: any) => a.id.startsWith(node.id + "_"));
            const progressType = node.data.progressType;
            //console.log(`${node.id} ${progressType} has children`, children);
            for (let child of children) {

                //console.log(`${progressType}   ${child.type} for ${child.id}`);
                if (progressType === "AUTO_PROGRESS" && (child.type === "questUserChoicesContainer" || child.type === "questUserChoice")) {
                    child.style.display = "none";
                } else if (progressType === "USER_CHOICE" && (child.type === "questStepRandomStepsContainer" || child.type === "questStepRandomStep")) {
                    child.style.display = "none";
                } else {
                    child.style.display = "block";
                }
            }
        }


        const choiceContainers = nodes.filter(a => a.type === "questUserChoicesContainer");
        console.log("choiceContainers", choiceContainers);
        for (let node of choiceContainers) {
            let children = nodes.filter(a => a.type === "questUserChoice" && a.parentNode === node.id);
            console.log(node.id + " children", children);

            if (children.length === 0) continue;


            node.style.height = 100 + (children.length * children[0].style.height);
        }


        const randomContainers = nodes.filter(a => a.type === "questStepRandomStepsContainer");
        console.log("randomContainers", randomContainers);
        for (let node of randomContainers) {
            let children = nodes.filter(a => a.type === "questStepRandomStep" && a.parentNode === node.id);
            console.log(node.id + " children", children);

            if (children.length === 0) continue;


            node.style.height = 120 + (children.length * children[0].style.height);
        }

        for (let node of stepNodes) {

            let children = nodes.filter(a => a.parentNode === node.id);
            let totalHeight = 0;
            for (let child of children) {
                totalHeight += child.style.height;
            }
            totalHeight += 130;
            node.style.height = totalHeight;
        }
        return nodes;
    }

    const onConnect = useCallback((connection: any) => {
        setEdges((eds) => addEdge(connection, eds));
    }, []);


    const handleSectionChange = (event: any, newValue: string) => {
        setSectionValue(newValue);
    };

    const addChoice = (stepId: string, nodeId: string) => {

        setNodes((nds) => {
            const id = uuidv4();


            /*
            {
                id: 'step1_userChoiceNode1',
                data: { label: 'Option', onStepChoiceTextChange: onStepChoiceTextChange, color: initBgColor },
                position: { x: 10, y: 70 },
                parentNode: 'step1_cc',
                type: "questUserChoiceNode",
                dragHandle: '.custom-drag-handle',
                extent: "parent",
                style: { width: 200, height: 60 },
            }
            */
            let nn: Array<any> = nds.map(a => {
                return {
                    ...a,
                    data: {
                        ...a.data,
                    },
                };
            });

            const currentNodeChoices = nn.filter(a => a.parentNode === nodeId);
            const newStepChoice = {
                id: id,
                data: { label: 'Option', stepId: stepId, onStepChoiceTextChange: onStepChoiceTextChange, color: initBgColor },
                position: { x: 10, y: 70 + (currentNodeChoices.length * 70) },
                parentNode: nodeId,
                type: "questUserChoice",
                extent: "parent",
                style: { width: 200, height: 60 },
            };




            const editedNode = nn.find(a => a.id === nodeId);
            const newHeight = editedNode.style.height + 90;
            editedNode.style.height = newHeight;


            nn.push(newStepChoice);

            nn = resizeNodes(nn);

            return nn;
        })
    };

    const addRandomStepOption = (stepId: string, nodeId: string) => {

        setNodes((nds) => {
            const id = Math.floor(Math.random() * 100);


            /*
            {
                id: 'step1_userChoiceNode1',
                data: { label: 'Option', onStepChoiceTextChange: onStepChoiceTextChange, color: initBgColor },
                position: { x: 10, y: 70 },
                parentNode: 'step1_cc',
                type: "questUserChoiceNode",
                dragHandle: '.custom-drag-handle',
                extent: "parent",
                style: { width: 200, height: 60 },
            }
            */
            let nn = nds.map(a => {
                return {
                    ...a,
                    data: {
                        ...a.data,
                    },
                };
            });

            const currentNodeChoices = nn.filter(a => a.parentNode === nodeId);
            const newStepChoice: any = {
                id: `${stepId}_choice${id}`,
                data: { chance: 100, label: 'Option', stepId: stepId, onStepChoiceTextChange: onStepChoiceTextChange, editNode: editNode, color: initBgColor },
                position: { x: 10, y: 70 + (currentNodeChoices.length * 70) },
                parentNode: nodeId,
                type: "questStepRandomStep",
                extent: "parent",
                style: { width: 200, height: 60 },
            };




            const editedNode = nn.find(a => a.id === nodeId);
            if (editedNode && editedNode.style && editedNode.style.height) {
                const h = Number(editedNode.style.height);
                const newHeight = h + 70;
                editedNode.style.height = newHeight;
            }


            nn.push(newStepChoice);

            nn = resizeNodes(nn);

            console.log("yea", nn);


            return nn;
        })
    };

    const onStepNameChange = (event: any, nodeId: string) => {
        console.log("stepname " + nodeId, event);
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id !== nodeId) {
                    return node;
                }
                console.log("node", node);

                const name = event.target.value;

                return {
                    ...node,
                    data: {
                        ...node.data,
                        name,
                    },
                };
            })
        );
    };

    const onStepChoiceTextChange = (event: any, nodeId: string) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id !== nodeId) {
                    return node;
                }

                const choiceText = event.target.value;

                return {
                    ...node,
                    data: {
                        ...node.data,
                        choiceText,
                    },
                };
            })
        );
    };

    const onStepScriptChange = (event: any, nodeId: string) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id !== nodeId) {
                    return node;
                }

                const script = event.target.value;

                return {
                    ...node,
                    data: {
                        ...node.data,
                        script,
                    },
                };
            })
        );
    };

    const onStepProgressTypeChange = (event: any, nodeId: string) => {
        console.log("event", { event, nodeId });


        const progressType: "AUTO_PROGRESS" | "USER_CHOICE" = event.target.value;

        /*
        console.log("nodes", nodes);
        const nNodes = nodes.map(a => a);

        console.log("nNodes", nNodes);
        const nodeToEdit = nNodes.find(a => a.id === nodeId);
        console.log("nodeToEdit", nodeToEdit);
        console.log("progressType", progressType);
        if (nodeToEdit) {
            nodeToEdit.data = {
                ...nodeToEdit.data,
                progressType
            }
        }
        setNodes(nNodes);*/



        setNodes((nds) => {

            let newNodes = nds.map(a => {
                return {
                    ...a,
                    data: {
                        ...a.data,
                    },
                };
            });
            const nodeToEdit = newNodes.find(a => a.id === nodeId);
            if (nodeToEdit) {
                nodeToEdit.data = {
                    ...nodeToEdit.data,
                    progressType,
                };
            }
            newNodes = resizeNodes(newNodes);
            return newNodes;

            /*
            return nds.map((node) => {
                if (node.id !== nodeId) {
                    //questUserChoiceNode
                    console.log("nodeId " + nodeId, node);


                    if (node.id?.startsWith(nodeId + "_")) {
                        if (progressType === "RANDOM" && (node.type === "questUserChoicesContainer" || node.type === "questUserChoice")) {
                            console.log("random");
                            return {
                                ...node,
                                style: { ...node.style, display: 'none' },
                            };
                        } else if (progressType === "CHOICE" && (node.type === "questStepRandomStepsContainer" || node.type === "questStepRandomStep")) {
                            return {
                                ...node,
                                style: { ...node.style, display: 'none' },
                            };
                        } else {
                            return {
                                ...node,
                                style: { ...node.style, display: 'block' },
                            };
                        }
                    }

                    return node;
                }


                return {
                    ...node,
                    data: {
                        ...node.data,
                        progressType,
                    },
                };
            })*/
        });


        console.log(`Yeah ${nodeId}`);
        setEdges((edges) => {
            console.log("Edges", edges);
            return edges.filter(a => {

                //a.target != nodeId && !a.source.startsWith(nodeId + "_");
                if (a.source.startsWith(nodeId + "_")) {
                    return false;
                }
                return true;
            });
        })


    }

    const onChange = (event: any) => {
        setNodes((nds) =>
            nds.map((node) => {
                console.log("Node", node);
                if (node.id !== '2ao') {
                    return node;
                }

                const color = event.target.value;

                setBgColor(color);

                return {
                    ...node,
                    data: {
                        ...node.data,
                        color,
                    },
                };
            })
        );
    };


    const [stepsCreated, setStepsCreated] = useState<number>(0);

    const onClickCreateStep = () => {
        const newNodes = [...nodess];

        let stepNodes: Array<any> = createStep("", "");
        for (let node of stepNodes) {
            newNodes.push(node);
        }

        setNodes(newNodes);
        setStepsCreated(a => a + 1);
    }

    const onClickCreateEndStep = () => {

        
        const newNodes = [...nodess];

        let stepNodes: Array<any> = createEndStep("", "");
        for (let node of stepNodes) {
            newNodes.push(node);
        }

        setNodes(newNodes);
        setStepsCreated(a => a + 1);
    }

    const createEndStep = (mainStepId: string = "", stepName: string) => {
        const newNodes = [];

        if (!mainStepId) {
            mainStepId = uuidv4();
        }
        newNodes.push(
            {
                id: mainStepId,
                data: { name: stepName, duration: 5000, line: "", actor: "", addChoice: addChoice, onClickEditScript: onClickEditScript, onStepNameChange: onStepNameChange, onStepProgressTypeChange: onStepProgressTypeChange, onStepScriptChange: onStepScriptChange, script: "" },
                position: { x: (stepsCreated * 300), y: 0 },
                className: 'light',
                type: "questEndStep",
                style: { border: "1px solid black", borderRadius: "5px", width: 250, height: 200 },
                parentNode: undefined,
            });


        return newNodes;
    }

    const createStep = (mainStepId: string = "", stepName: string) => {
        const newNodes = [];

        const id = Math.floor(Math.random() * 100);

        if (!mainStepId) {
            mainStepId = `step${stepsCreated}`;
        }

        if (!stepName) {
            stepName = `Step ${(stepsCreated + 1)}`;
        }

        newNodes.push(
            {
                id: mainStepId,
                data: { stepId: mainStepId, name: stepName, isInitialStep: stepsCreated === 0, progressType: "AUTO_PROGRESS", duration: 5000, line: "", actor: "", addChoice: addChoice, onClickEditScript: onClickEditScript, onStepNameChange: onStepNameChange, onStepProgressTypeChange: onStepProgressTypeChange, onStepScriptChange: onStepScriptChange, script: "" },
                position: { x: (stepsCreated * 300), y: 0 },
                className: 'light',
                type: "questStep",
                style: { border: "1px solid black", borderRadius: "5px", width: 250, height: 430 },
                parentNode: undefined,
            });

        newNodes.push(
            {
                id: `${mainStepId}_cc`,
                data: { stepId: mainStepId, addChoice: addChoice, onStepChoiceTextChange: onStepChoiceTextChange, color: initBgColor },
                position: { x: 10, y: 260 },
                parentNode: mainStepId,
                type: "questUserChoicesContainer",
                dragHandle: '.custom-drag-handle',
                extent: "parent",
                style: { width: 230, height: 150, display: "none" },
            });

        newNodes.push(
            {
                id: `${mainStepId}_randomStepsContainer`,
                data: { label: 'Option', stepId: mainStepId, addRandomStepOption: addRandomStepOption, onStepChoiceTextChange: onStepChoiceTextChange, color: initBgColor },
                position: { x: 10, y: 260 },
                parentNode: mainStepId,
                type: "questStepRandomStepsContainer",
                dragHandle: '.custom-drag-handle',
                extent: "parent",
                style: { width: 230, height: 150 },
            });

        return newNodes;
    }
    //const nodessa = useNodes();

    const onClickEditScript = (nodeId: string) => {
        //console.log("nodessa", nodessa);

        setNodes((nds) => {



            const nodeg = nds.find(a => a.id == nodeId);
            console.log("Opening " + nodeId, { nodeg, nds });
            setScriptBeingEdited(nodeg);

            return nds.map((node) => {
                console.log("sdfsdf", nds);


                return node;
            })
        }
        );

        /*
                const node = nodess.find(a => a.id === nodeId);
                console.log("Opening " + nodeId, { node, nodess });
                setScriptBeingEdited(node);*/
    }

    const editNode = (nodeBeingEdited: any, property: string, value: any) => {

        console.log("editNode", nodeBeingEdited);
        if (scriptBeingEdited && nodeBeingEdited.id == scriptBeingEdited.id) {
            setScriptBeingEdited((nn: any) => {
                return {
                    ...nn,
                    data: {
                        ...nn.data,
                        [property]: value,
                    },
                };
            })
        }

        setNodes((nds) =>
            nds.map((node) => {
                if (node.id !== nodeBeingEdited.id) {
                    return node;
                }



                console.log(`Setting ${property} to ${value}`);
                return {
                    ...node,
                    data: {
                        ...node.data,
                        [property]: value,
                    },
                };
            })
        );
    }

    const save = async () => {
        console.log("nodes", nodess);
        console.log("edges", edges);


        const mainStepNodes = nodess.filter(a => a.type === "questStep");


        console.log("mainStepNodes", mainStepNodes);


        let steps = [];

        for (let node of mainStepNodes) {

            const data = node?.data;


            let userChoiceNodes = nodess.filter(a => a.type == "questUserChoice" && a.data && a.data.stepId === node.id && a.style && a.style.display !== "none");
            console.log(node.id + " choices", userChoiceNodes);
            let stepUserChoices = [];
            for (let i = 0; i < userChoiceNodes.length; i++) {
                let choiceNode = userChoiceNodes[i];
                console.log("Searching edges  for " + choiceNode.id);
                const nodeEdge = edges.find(a => a.source === choiceNode.id);
                console.log("111", nodeEdge);
                if (!nodeEdge) {
                    console.log(`Couldn't find edge ${choiceNode.id} in`, edges);
                    continue;
                }


                const nodeEdges2 = edges.filter(a => a.target === choiceNode.id);
                console.log("222", nodeEdges2);

                stepUserChoices.push({
                    text: choiceNode.data.choiceText,
                    goToStepId: nodeEdge.target

                })
                /*
                 newEdges.push({
                        id: mainNode.id + toObj.id + Math.random(),
                        source: mainNode.id + "_questRandomStep" + index,
                        target: toObj.id,

                        sourceHandle: step._id + "questRandomStep" + index + "_random_right",
                        targetHandle: toObj.id + "handle2"

                    })
                    */
            }



            let randomStepNodes = nodess.filter(a => a.type == "questStepRandomStep" && a.data && a.data.stepId === node.id && a.style && a.style.display !== "none");
            console.log(`For ${node.id} we got`, randomStepNodes);
            let randomSteps = [];
            for (let i = 0; i < randomStepNodes.length; i++) {
                let randomNode = randomStepNodes[i];
                const randomNodeSourceEdges = edges.filter(a => a.source === randomNode.id);
                console.log(`Scan nodes for ${randomNode.id}`, randomNodeSourceEdges);

                if (randomNodeSourceEdges.length > 0) {
                    randomSteps.push({
                        chance: randomNode.data.chance,
                        goToStepId: randomNodeSourceEdges[0].target
                    })
                }
            }


            let step = {
                id: node.id,
                actor: data.actor,
                line: data.line,
                progressType: data.progressType,
                duration: data.duration,
                userChoices: stepUserChoices,
                options: randomSteps,
                editor: {
                    position: node?.position
                }
            }
            steps.push(step);

        }

        const questEndStepNodes = nodess.filter(a => a.type === "questEndStep");
        console.log("questEndStepNodes", questEndStepNodes);
        for (let node of questEndStepNodes) {

            const data = node.data;

            let step = {
                id: node.id,
                actor: data.actor,
                line: data.line,
                progressType: "END_QUEST",
                duration: data.duration,
                editor: {
                    position: node?.position
                }
            }
            steps.push(step);
        }

        console.log("steps", steps);

        if (!publicKey) {
            console.error("connect wallet");
            return;
        }
        let form = {
            ...quest,
            questScript: steps
        };

        let data: any = {
            form: form,
            wallet: publicKey,
        };
        const [signature, blockhash] = await WalletUtils.verifyWallet(connection, publicKey, 'admin-update-quest', data, false, signMessage, signTransaction);

        if (signature) {
            const url = `${domainURL}/quests/admin/update`
            data.message = bs58.encode(signature)
            data.bh = blockhash

            const result = await axios.post(url, data);
            console.log("result", result);

        }
    }

    return (
        <>
            <HeadElement />

            <Modal
                open={scriptBeingEdited !== undefined}
                onClose={() => setScriptBeingEdited(undefined)}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={modalStyle}>
                    <Typography id="modal-modal-title" variant="h6" component="h2">
                        Edit Script
                    </Typography>
                    <Typography id="modal-modal-description" sx={{ mt: 2 }}>

                        <TextField
                            size={"small"}
                            className="m-t-md"
                            value={scriptBeingEdited?.data?.actor}
                            label="Actor"
                            onChange={(e) => editNode(scriptBeingEdited, "actor", e.target.value)}
                        />
                        <TextField
                            size={"small"}
                            className="m-t-md"
                            value={scriptBeingEdited?.data?.line}
                            multiline={true}
                            label="Line"
                            onChange={(e) => editNode(scriptBeingEdited, "line", e.target.value)}
                        />
                        <TextField
                            size={"small"}
                            value={scriptBeingEdited?.data?.duration}
                            type={"number"}
                            className="m-t-md"
                            label="Duration (ms)"
                            onChange={(e) => editNode(scriptBeingEdited, "duration", e.target.value)}
                        />

                        <Select
                            className="m-t-md"
                            value={scriptBeingEdited?.data?.progressType}
                            label="Progress Type"
                            onChange={(e) => editNode(scriptBeingEdited, "progressType", e.target.value)}
                        >
                            <MenuItem value={"AUTO_PROGRESS"}>Random</MenuItem>
                            <MenuItem value={"USER_CHOICE"}>User Choice</MenuItem>
                        </Select>

                    </Typography>
                </Box>
            </Modal>

            <QuestPickerModal open={showQuestPicker} onClose={function (): void {

                setShowQuestPicker(false)

            }} onSelectQuest={function (quest: any): void {

                setShowQuestPicker(false);
                loadQuest(quest);

            }}></QuestPickerModal>

            {/*
            <Modal
                open={showEdges}
                onClose={() => setShowEdges(false)}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={modalStyle}>
                    <Grid columns={24} container spacing={3}>
                        {quests &&
                            quests.length > 0 &&
                            quests.map((quest: any) => {
                                return (
                                    <Grid item xs={24} md={4} key={quest._id} className="quest-card-container m-b-md">
                                        <div className="quest-card">
                                            <div className="has-text-centered">
                                                <img className="quest-card-image" src={quest.image} />
                                            </div>
                                            <div className="p-sm">
                                                <div className="m-b-sm" style={{ fontFamily: "bolder", height: "40px" }}>{quest.title}</div>
                                                <div style={{ fontSize: "0.6em", height: "70px" }}>{quest.shortDescription}</div>
                                                <div className="has-text-centered m-t-sm p-t-sm">
                                                    <button className="button is-tertiary is-fullwidth" onClick={() => props.onSelectQuest(quest)}>Load Quest</button>
                                                </div>
                                            </div>
                                        </div>
                                    </Grid>
                                );
                            })}
                    </Grid>
                </Box>
                        </Modal>*/}

            <div>
                <div className="title-bar p-md main-content-wrapper">
                    <div className="container main-content-wrapper">
                        <div>
                            <h1 className="has-text-white has-font-tomo has-text-shadow">Quest Editor</h1>
                            <Link href={`/admin/quest-editor`}>
                                <a>View all Quests</a>
                            </Link>
                        </div>
                        <Nightshift />
                    </div>
                </div>
                <main className="container main-content-wrapper main-wrapper m-t-md">




                    <ButtonGroup
                        color="primary"
                    >
                        <Button className="m-b-sm" variant="contained" onClick={onClickCreateStep}>Create Step</Button>
                        <Button className="m-b-sm" variant="contained" color="secondary" onClick={onClickCreateEndStep}>Create End Step</Button>
                        <Button className="m-b-sm" variant="contained" onClick={save}>Save</Button>
                        {/*<Button className="m-b-sm" variant="contained" color="info" onClick={() => setShowEdges(true)}>Show Nodes</Button>*/}
                    </ButtonGroup>

                    <ReactFlowProvider>
                        <ReactFlow
                            nodes={nodess}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            className="react-flow-subflows-example"
                            style={{ border: "1px solid rgb(160, 160, 160)", height: "1000px" }}
                            nodeTypes={nodeTypes}
                            fitView
                        >
                            <MiniMap />
                            <Controls />
                            <Background />
                        </ReactFlow>
                    </ReactFlowProvider>

                </main>
            </div>
        </>
    )
});

export default QuestEditor;