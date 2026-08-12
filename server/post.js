const http=require('http');
const data=JSON.stringify({message:'Hello, summarize Riyada in 2 sentences.'});
const req=http.request({hostname:'localhost',port:3000,path:'/api/chat',method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(data)}},res=>{let b='';res.on('data',c=>b+=c);res.on('end',()=>{console.log('STATUS',res.statusCode); try{console.log(JSON.parse(b))}catch(e){console.log(b)}})});
req.on('error',e=>console.error('ERR',e));
req.write(data);
req.end();
