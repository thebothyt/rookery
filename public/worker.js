importScripts('engine.js');
onmessage=e=>{const m=e.data;
 if(m.k=='bot')postMessage({k:'bot',id:m.id,m:botPick(m.s,m.bot)});
 else if(m.k=='review')postMessage({k:'done',id:m.id,res:analyze(m.moves,p=>postMessage({k:'prog',id:m.id,p}))})};
