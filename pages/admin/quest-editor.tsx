import React, { useCallback, useEffect, useRef, useState } from "react";
import { useWallet } from '@solana/wallet-adapter-react';

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
} from 'react-flow-renderer';
import HeadElement from "../../components/HeadElement";
import Marketplaces from "../../components/Marketplaces";
import Nightshift from "../../components/Nightshift";
import PublicSection from "../../components/PublicSection";
import Proposals from "../../sections/BallotBox/Proposals";
import QuestStepOption from "../../components/quests/admin/QuestStepOption";
import { Button } from "@mui/material";
import QuestStep from "../../components/quests/admin/QuestStep";



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

const nodeTypes = {
	questOptionNode: QuestStepOption,
	questStep: QuestStep,
};


const QuestEditor = React.forwardRef((nftFunctions, ref) => {
	const { wallet } = useWallet();
	const [sectionValue, setSectionValue] = React.useState<string>('proposals');


	const [bgColor, setBgColor] = useState(initBgColor);

	const [nodes, setNodes, onNodesChange] = useNodesState([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

	useEffect(() => {
		setNodes([


			{
				id: 'step1',
				data: { isInitialStep: true, label: 'Step 1', addChoice: addChoice, onStepNameChange: onStepNameChange, name: 'Step 1', onStepScriptChange: onStepScriptChange, script: "" },
				position: { x: 0, y: 0 },
				className: 'light',
				type: "questStep",
				style: { border: "1px solid black", borderRadius: "5px", width: 250, height: 450 },
				parentNode: undefined,
			},
			{
				id: 'step1_2',
				data: { label: 'Option', onStepChoiceTextChange: onStepChoiceTextChange, color: initBgColor },
				position: { x: 10, y: 300 },
				parentNode: 'step1',
				type: "questOptionNode",
				extent: "parent",
				style: { width: 200 },
			},


/*
			{ id: '3', data: { label: 'Node 1' }, position: { x: 320, y: 100 }, className: 'light' },
			{
				id: '4',
				data: { label: 'Group B' },
				position: { x: 320, y: 200 },
				className: 'light',
				style: { backgroundColor: 'rgba(255, 0, 0, 0.2)', width: 300, height: 300 },
			},
			{
				id: '4a',
				data: { label: 'Node B.1' },
				position: { x: 15, y: 65 },
				className: 'light',
				parentNode: '4',
				extent: 'parent',
			},
			{
				id: '4b',
				data: { label: 'Group B.A' },
				position: { x: 15, y: 120 },
				className: 'light',
				style: { backgroundColor: 'rgba(255, 0, 255, 0.2)', height: 150, width: 270 },
				parentNode: '4',
			},
			{
				id: '4b1',
				data: { label: 'Node B.A.1' },
				position: { x: 20, y: 40 },
				className: 'light',
				parentNode: '4b',
			},
			{
				id: '4b2',
				data: { label: 'Node B.A.2' },
				position: { x: 100, y: 100 },
				className: 'light',
				parentNode: '4b',
			},*/
		]);

	}, []);


	const onConnect = useCallback((connection: any) => {
		setEdges((eds) => addEdge(connection, eds));
	}, []);


	const handleSectionChange = (event: any, newValue: string) => {
		setSectionValue(newValue);
	};

	const addChoice = (nodeId: string) => {

		setNodes((nds) => {
			const id = Math.floor(Math.random() * 100);

			
			const nn: Array<any> = [...nds];
			const currentNodeChoices = nn.filter(a => a.parentNode === nodeId);
			const newStepChoice = {
				id: `Step_choice_${id}`,
				data: { label: 'Option', onStepChoiceTextChange: onStepChoiceTextChange, color: initBgColor },
				position: { x: 10, y: 300 + (currentNodeChoices.length * 100) },
				parentNode: nodeId,
				type: "questOptionNode",
				extent: "parent",
				style: { width: 200 },
			};

			
			

			const editedNode = nn.find(a => a.id === nodeId);
			const newHeight = editedNode.style.height + 90;
			editedNode.style.height = newHeight;


			nn.push(newStepChoice);


			return nn;
		})
		/*
		setNodes((nds) =>
			nds.map((node) => {
				if (node.id !== nodeId) {
					return node;
				}
				console.log("node", node);
				const id = Math.floor(Math.random() * 100);


				const newStepChoice = {
					id: `Step_choice_${id}`,
					data: { label: 'Option', onStepChoiceTextChange: onStepChoiceTextChange, color: initBgColor },
					position: { x: 10, y: 400 },
					parentNode: `Step_${id}`,
					type: "questOptionNode",
					extent: "parent",
					style: { width: 200 },
				};
				return {
					...node,
					data: {
						...node.data,
						name,
					},
				};
			})
		);*/
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


	const [stepsCreated, setStepsCreated] = useState<number>(1);

	const createStep = () => {
		const newNodes = [...nodes];

		const id = Math.floor(Math.random() * 100);
		newNodes.push({
			id: `Step_${id}`,
			data: { label: 'Step', addChoice: addChoice, onStepNameChange: onStepNameChange, name: `Step ${stepsCreated + 1}`, onStepScriptChange: onStepScriptChange, script: "" },
			position: { x: (stepsCreated * 300), y: 0 },
			className: 'light',
			type: "questStep",
			style: { border: "1px solid black", borderRadius: "5px", width: 250, height: 400 },
		});

		newNodes.push({
			id: `Step_${id}_1`,
			data: { label: 'Option', onStepChoiceTextChange: onStepChoiceTextChange, color: initBgColor },
			position: { x: 10, y: 300 },
			parentNode: `Step_${id}`,
			type: "questOptionNode",
			extent: "parent",
			style: { width: 200 },
		});
		setNodes(newNodes);
		setStepsCreated(a => a + 1);
	}

	return wallet ? (
		<>
			<HeadElement />

			<div>
				<div className="title-bar p-md main-content-wrapper">
					<div className="container main-content-wrapper">
						<h1 className="has-text-white has-font-tomo has-text-shadow">Quest Editor</h1>
						<Nightshift />
					</div>
				</div>
				<main className="container main-content-wrapper main-wrapper m-t-md">


					<Button className="m-b-sm" variant="contained" onClick={createStep}>Create Step</Button>
					<ReactFlow
						nodes={nodes}
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

				</main>
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
	);
});

export default QuestEditor;