import React, { useEffect, useState } from 'react';

export default function LineTyper({
  children=null,
  className= '',
  avgTypingDelay= 70,
  stdTypingDelay= 25,
  startDelay= 0
}) {
  const [lineToType, setLineToType] = useState<string>('')
  const [finalLine, setFinalLine] = useState<string>('')
  const [isDone, setIsDone] = useState<boolean>(false)
  let linesToType:string[] = []

  useEffect(() => {
    if (children) {
      linesToType = [children];
      
      if (startDelay > 0 && typeof window !== 'undefined') {
        setTimeout(typeAllLines, startDelay);
      } else { 
        typeAllLines();
      }
    } else {
      onTypingDone();
    }
  },[])

  const onTypingDone = () => {
    setIsDone(true)
  }

  const typeAllLines = async (lines = linesToType) => {
    for (var i = 0; i < lines.length; i++) {
      const line = lines[i]
      setFinalLine('')
      setLineToType(line)
    }
  }

  useEffect(()=>{
    if(lineToType){
      typeLine(lineToType)
    }
  },[lineToType])

  const typeLine = async (line:string) => {
    console.log('typeLine')
    console.log(line)
    if(line.length > 0){
      typeCharacter(line[0])
    }
  }

  const typeCharacter = async (character:string):Promise<void> => {  
    //console.log('typeCharacter')
    //console.log(character)
 
    let line = finalLine
    line += character
    const delay = delayGenerator();
    await sleep(delay) 
    setFinalLine(line)
  }

  const delayGenerator = () => {
    const mean = avgTypingDelay;
    const std = stdTypingDelay;

    return gaussianRnd(
      mean,
      std,
    );
  }

  useEffect(()=>{
    //console.log(finalLine)
    if(lineToType.length > finalLine.length){
      const nextCharacter = lineToType[finalLine.length]
      typeCharacter(nextCharacter)
    } else {
      setIsDone(true)
    }
  },[finalLine])

  return (
    <div className={`Typist ${className}`}>
      {finalLine}
    </div>
  );

}

export const sleep = (val:number | undefined) => new Promise<void>((resolve) => (
  val != undefined ? setTimeout(resolve, val) : resolve()
));

export function gaussianRnd(mean:number, std:number) {
  const times = 12;
  let sum = 0;
  for (let idx = 0; idx < times; idx++) {
    sum += Math.random();
  }
  sum -= (times / 2);
  return Math.round((sum) * std) + mean;
}