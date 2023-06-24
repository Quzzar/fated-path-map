
export type MessageType = 'FINISH-LOAD' | 'FINISH-GENERATE' | 'FINISH-PLAYER-SET' | 'LOG' | 'WARN';

export default function sendMessage(type: MessageType, extra?: string){
  if(!extra) { extra = ''; }

  if(type == 'LOG'){
    console.log(extra);
  } else if(type == 'WARN'){
    console.warn(extra);
  } else if(type == 'FINISH-LOAD'){
    console.log('Finished loading!');
  } else if(type == 'FINISH-GENERATE'){
    console.log('Finished generating!');
  }

  try {
    // @ts-ignore
    window.ReactNativeWebView.postMessage(`${type};~;${extra}`);
  } catch (e){}
}