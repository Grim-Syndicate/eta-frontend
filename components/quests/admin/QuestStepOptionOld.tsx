import React, { memo } from 'react';

import { Handle, Position } from 'react-flow-renderer';


interface Props {
    isConnectable: boolean;
    data: any;
}
const QuestStepOptionOld = ({isConnectable, data}: Props) => {
  return (
    <div className="node-default" style={{backgroundColor: "white", width: "150px"}}>
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#555' }}
        onConnect={(params) => console.log('handle onConnect', params)}
        isConnectable={isConnectable}
      />
      <div>
        Custom Color Picker Node: <strong>{data.color}</strong>
      </div>
      <input
        className="nodrag"
        type="color"
        onChange={data.onChange}
        defaultValue={data.color}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="a"
        style={{ top: 10, background: '#555' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="b"
        style={{ bottom: 10, top: 'auto', background: '#555' }}
        isConnectable={isConnectable}
      />
    </div>
  );
};


export default memo(QuestStepOptionOld);