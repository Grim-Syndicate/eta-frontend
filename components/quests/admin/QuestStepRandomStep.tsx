import React, { memo } from 'react';

import { Handle, Position } from 'react-flow-renderer';


interface Props {
	isConnectable: boolean;
	data: any;
	id: string; //nodeId
}
const QuestStepRandomStep = (props: Props) => {
	const nodeId = props.id;
	const data = props.data;
	const isConnectable = props.isConnectable;

	
	return (
		<div className="react-flow__node-default" style={{ textAlign: "left", width: "100%", height: "100%", background: "transparent" }}>
			<div className="m-t-dmd">
				Percentage Chance (1-100)
			</div>
			<input
				className="nodrag"
				type="number"
				min={0}
				max={100}
				onChange={(e) => data.editNode(props, "chance", Number(e.target.value))}
				defaultValue={data.chance}
			/>
			<Handle
				type="source"
				position={Position.Right}
				id={`${nodeId}_random_right`}
				style={{ top: 10, background: '#555' }}
				isConnectable={isConnectable}
			/>
		</div>
	);
};


export default memo(QuestStepRandomStep);