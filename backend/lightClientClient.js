// 2019 Blocklab
//
// License: MPL-2.0

const { streamWrite, streamEnd, onExit, chunksToLinesAsync, chomp } = require('@rauschma/stringio');
var events = require('events');
const { spawn } = require('child_process');
var eventEmitter = new events.EventEmitter();
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fs = require('fs')
const contracAddress = 'kQAn6mblBx4yxWCdbLKCFNBFtTeI9HDyQf6PMzUeDKTRQQt8';
// runmethod kQAn6mblBx4yxWCdbLKCFNBFtTeI9HDyQf6PMzUeDKTRQQt8 seqno  123
//runmethod kQAn6mblBx4yxWCdbLKCFNBFtTeI9HDyQf6PMzUeDKTRQQt8 user_info 31016  123

let allRequests = [];
let reqCounter = 0;
let gl = {};
var childProcess;


function setSecno(array) {
    gl.secno = parseInt(array[2]);
    eventEmitter.emit('secnoSet', parseInt(array[0]));
}

function setUserInfo(array) {
    //txid, -116430, id, ri, ri_count, prev_TPi, measure_days, bans_count, balance
    let res = {
        requestNum: parseInt(array[0]),
        id:  parseInt(array[2]),
        total_Ri: parseInt(array[3]),
        ri_count: parseInt(array[4]),
        prev_TPi: parseInt(array[5]),
        days: parseInt(array[6]),
        bans_count: parseInt(array[7]),
        balance: parseInt(array[8]),
    };

    eventEmitter.emit('userSet', res);
}

function setUserBanInfo(array) {
    let res = {
        requestNum: parseInt(array[0]),
        userId: parseInt(array[2]),
        banned: parseInt(array[3]),      
    };

    eventEmitter.emit('userBanSet', res);
}

//todo add promises to wait for initialization
async function initClient() {
    console.log("****startedd****")

    childProcess = spawn('lite-client', ["-C", "/home/blocklab/ton/ton/build/ton-lite-client-test1.config.json"],
        { stdio: ['pipe', 'pipe', 'pipe'] }); // (A)

    childProcess.stdout.on('data', (data) => {

        if (data.toString().indexOf('conn ready') > -1) {

            eventEmitter.emit('connReady')
        }
        if (data.toString().indexOf('latest masterchain block') > -1) {

            eventEmitter.emit('lastComplete')
        }

    });

    childProcess.stderr.on('data', (data) => {
        let ds = data.toString();

        if (data.toString().indexOf('error') > -1) {
            console.log(ds);
        }

        if (data.toString().indexOf('conn ready') > -1) {
            eventEmitter.emit('connReady')
        }
        if (data.toString().indexOf('latest masterchain block') > -1) {
            eventEmitter.emit('lastComplete')
        }
        if (data.toString().indexOf('result') > -1) {
            let ind = ds.indexOf('result:  [');
            if (ind >= 0) {
                let secnoStr = ds.substring(ind + 'result:  ['.length);
                let end = secnoStr.indexOf(']');
                resultStr = secnoStr.substring(0, end);
                result = resultStr.trim().split(' ');
                eventEmitter.emit('result', result)
            }
        }

    });

    eventEmitter.on("result",
        x => {
            let funcNum = parseInt(x[0]);
            if (allRequests[funcNum]) {
                allRequests[funcNum](x);
                allRequests.splice(funcNum, 1);
            }
        });


    eventEmitter.on("secno",
        x => {
            console.log("secno=" + x);
        });

    eventEmitter.once('connReady', x => {
        console.log("****ready****")
        setTimeout(x => {
            childProcess.stdin.write('last\n');           
        }, 500);

    });

    eventEmitter.on('lastComplete', () => { console.log("****lsted****") })

    console.log('### DONE');
    return childProcess;
}

function getLast(childProcess) {
    childProcess.stdin.write('last\n');
}

function getSecno(counter) {
    eventEmitter.once(
        'lastComplete', () => {

            allRequests[counter] = setSecno;
            childProcess.stdin.write(`runmethod ${contracAddress} seqno ${reqCounter}\n`);
        }
    )
    getLast(childProcess);
}

async function addUser(user) {
    incCounter();
    let counter = reqCounter;
    
    eventEmitter.on('secnoSet', async function handler(x) {
        if (counter == x) {
            eventEmitter.off('secnoSet', handler);
            let filename = await prepareFile('blockchain/sh/4_add_user.sh',gl.secno,user.id )
            let command = `sendfile ../${filename}.boc\n`;
            childProcess.stdin.write(`${command}`);            
            setTimeout(()=>{fs.unlinkSync(`${filename}.boc`);            
            getLast(childProcess);            
            getUserInfo(user.id);
            },15000);
           
        }
    });
    getSecno(counter);
}

async function likeUser(userFrom, userTo) {
    incCounter();
    let counter = reqCounter;
    
    eventEmitter.on('secnoSet', async function handler(x) {
        if (counter == x) {
            eventEmitter.off('secnoSet', handler);
            let filename = await prepareFile('blockchain/sh/5_like.sh',gl.secno,userFrom.id, userTo.id);
            let command = `sendfile ../${filename}.boc\n`;
            childProcess.stdin.write(`${command}`);            
            setTimeout(()=>{fs.unlinkSync(`${filename}.boc`);            
            },15000);
           
        }
    });
    getSecno(counter);
}

async function dislikeUser(userFrom, userTo) {
    incCounter();
    let counter = reqCounter;
    
    eventEmitter.on('secnoSet', async function handler(x) {
        if (counter == x) {
            eventEmitter.off('secnoSet', handler);
            let filename = await prepareFile('blockchain/sh/6_dislike.sh',gl.secno,userFrom.id, userTo.id);
            let command = `sendfile ../${filename}.boc\n`;
            childProcess.stdin.write(`${command}`);            
            setTimeout(()=>{fs.unlinkSync(`${filename}.boc`);            
            },15000);
           
        }
    });
    getSecno(counter);
}

async function claim(user, amount, address) {
    incCounter();
    let counter = reqCounter;
    
    eventEmitter.on('secnoSet', async function handler(x) {
        if (counter == x) {
            eventEmitter.off('secnoSet', handler);
            let filename = await prepareFile('blockchain/sh/9_claim.sh',gl.secno,user.id,amount, address );
            let command = `sendfile ../${filename}.boc\n`;
            childProcess.stdin.write(`${command}`);            
            setTimeout(()=>{fs.unlinkSync(`${filename}.boc`);            
            },15000);
           
        }
    });
    getSecno(counter);
}

async function donate(userFrom, userTo, amount) {
    incCounter();
    let counter = reqCounter;
    
    eventEmitter.on('secnoSet', async function handler(x) {
        if (counter == x) {
            eventEmitter.off('secnoSet', handler);
            let filename = await prepareFile('blockchain/sh/7_donate.sh',gl.secno,userFrom.id,userTo.id,amount);
            let command = `sendfile ../${filename}.boc\n`;
            childProcess.stdin.write(`${command}`);            
            setTimeout(()=>{fs.unlinkSync(`${filename}.boc`);            
            },15000);
           
        }
    });
    getSecno(counter);
}


function getUserInfo(userId) {
    eventEmitter.once(
        'lastComplete', () => {
            incCounter();
            allRequests[reqCounter] = setUserInfo;
            childProcess.stdin.write(`runmethod ${contracAddress} user_info  ${ userId } ${ reqCounter }\n`);
        }
    )
    getLast(childProcess);    
}

function getUserBan(userId) {
    eventEmitter.once(
        'lastComplete', () => {
            incCounter();
            allRequests[reqCounter] = setUserBanInfo;
            childProcess.stdin.write(`runmethod ${contracAddress} ban_info  ${ userId } ${ reqCounter }\n`);
        }
    )
    getLast(childProcess);    
}


function incCounter(){
    reqCounter=(reqCounter+1)%10000;
}

async function runCommand(command,...pars) {
    let fullCommand = command;
    for (let index = 0; index < pars.length; index++) {
        const element = pars[index];
        fullCommand+=" "+element;
        
    }
    //const { stdout, stderr } = 
    await exec(fullCommand);
    //return stdout
}

async function generateQueryFile(scriptFile, ...pars){
    //todo: exceptions
    await runCommand(scriptFile,...pars);    
}

async function prepareFile(scriptFile,...pars) {
    let rand =  Math.floor(Math.random() * Math.floor(99999));
    let filename = "query" + rand;
    pars.push(filename);
    await generateQueryFile(scriptFile,...pars);
    return filename;
}



async function main() {
    eventEmitter.once('connReady', x=> {
        setTimeout(x => {           
        }, 500);
        
    }
    );
    let client = await initClient();    
}



main();

var lightClientClient =  {
    addUser:addUser,
    getBanInfo: getUserBan,
    eventEmitter:eventEmitter,
    likeUser:likeUser,
    dislikeUser:dislikeUser,
    getUser: getUserInfo,
    claim: claim,
    donate:donate
}

module.exports = lightClientClient;
