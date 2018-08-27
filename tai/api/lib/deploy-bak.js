/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
//合约发布
let Web3 = require('web3');
let solc = require("solc");
let fs   = require('fs');
var exec = require('child_process').exec;
const init = require('./ccc_setup');

let eth_url=init.eth_url;
let sol_file="lib/ccc.sol";
let company=init.company;
let email=init.company;
let remark=init.remark;
let rpcport=init.rpcport;
let chainid=init.chainid;
let datadir=init.datadir;
let networkid=init.networkid
let enode="enode://ed9f31d1768664d4ed7f071e63265b31742b849a1b6f38636c0e9367f824834d97e714fd30137daeabeaca55332e7713d3f4cdb2c531f21cf3bca6cc03e4a34d@[127.0.0.1]:30303";
let gas=4000000;
let gasPrice=200000000; //数值越大，消耗的eth越大


command="cd lib;nohup sh init_account.sh "+datadir+" admin "+rpcport+" "+chainid+" "+networkid+" >geth.log 2>&1";
console.log(command)
exec(command, function(err,stdout,stderr){
        if(err) {
            console.log(stderr);
        } else {
            
            console.log(stdout);
        }
		});

var waitUntil = new Date(new Date().getTime() + 10 * 1000);
while(waitUntil > new Date()){}




if(typeof web3 != 'undefined'){
	web3=new Web3(web3.currentProvider);
}else{
	web3 = new Web3(eth_url);
}
 
console.log("正在请求:"+eth_url);

let source=fs.readFileSync(sol_file,"utf8");
let cacl=solc.compile(source,1);
let abi= JSON.parse(cacl.contracts[':CCC'].interface);
let contractsaddress="0x0000";

//console.log("当前abi解析:"+JSON.stringify(abi))
let bytecode=cacl.contracts[':CCC'].bytecode;		//合约二进制码
var temp='0x'+bytecode;




config_json={"eth_url":"http://localhost:8545","gas":500000,"gasPrice":2000000000,"abi":abi}
str=JSON.stringify(config_json)
fs.writeFile('lib/config.json',str,function(err){
	if(err){
		console.error(err);
	}
	console.log('----------新增成功-------------');
})

//console.log("当前合约二进制:"+JSON.stringify(temp))

web3.eth.getAccounts().then(data=>{
			//var gasEstimate = web3.eth.estimateGas({to:web3.eth.accounts[0],data:temp}); //估算gas
            //console.log(gasEstimate)
			var rsContract=new web3.eth.Contract(abi).deploy({
				data:'0x'+bytecode,
				arguments:[company,email,remark,enode],	//传递构造函数的参数
			}).send({
				from:data[0],
				gas: gas,
				gasPrice: gasPrice

			},function(error,transactionHash){
				console.log("send回调");
				console.log("error:"+error);
				console.log("send transactionHash:"+transactionHash);
				
			})
			.on('error', function(error){ console.error(error) })
			.then(function(newContractInstance,account,address){
				var newContractAddress=newContractInstance.options.address
				//var contractsaddress=newContractAddress
				console.log("新合约地址:"+newContractAddress);

				fs.readFile('lib/config.json',function(err,data){
					if(err){
						return console.error(err.stack);
					}
					var person = data.toString();//将二进制的数据转换为字符串
					person = JSON.parse(person);//将字符串转换为json对象
					person.contractaddress=newContractAddress;
					var str = JSON.stringify(person);//因为nodejs的写入文件只认识字符串或者二进制数，所以把json对象转换成字符串重新写入json文件中
					fs.writeFile('lib/config.json',str,function(err){
						if(err){
							console.error(err.stack);
						}
						console.log('----------新增成功-------------');
					})
				})
			
				console.log(config_json)
				web3.eth.getBlockNumber().then(blockNum=>{
					console.log("当前块号："+blockNum);
					web3.eth.getBlock(blockNum).then(data=>{
						console.log("当前块信息：");
						console.log(data);
					})
				});
				var MyContract = new web3.eth.Contract(abi,newContractAddress);
					MyContract.methods.ShowCompany(1).call().then(console.log);

 
			});
			
	});

     
		
	
