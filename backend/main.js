// 2019 Blocklab
//
// License: MPL-2.0

require('dotenv').config()
var mongoose = require('mongoose');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec)
var throttledQueue = require('throttled-queue');
var throttle = throttledQueue(1, 1000);
const banRegex = /(?<=\bban\s)(@\w+)/gm;
const clapRegex = /(?<=\bclap\s)(@\w+)/gm;
const donateRegex = /(?<=\bdonate\s)(@\w+ [0-9]*(\.[0-9]*)?)/gm;
const claimRegex = /(?<=claim\s)([0-9]*(\.[0-9]*)? [a-zA-Z0-9_-]+)/gm;

const addRegex = /addme/gm;
const lightClientClient = require('./lightClientClient');
const TelegrafInlineMenu = require('telegraf-inline-menu')
var User;
const AutoIncrement = require('mongoose-sequence')(mongoose);
const AutoIncrementFactory = require('mongoose-sequence');

let executor = function (operation) {
    throttle(async function () {
        superWorker(operation);
    });
}

function addUserClosure(user) {
    let closed = function() {
        lightClientClient.addUser(user);
    }   
    return closed;
}

function likeUserClosure(userFrom, userTo) {
    let closed = function() {
        lightClientClient.likeUser(userFrom,userTo);
    }   
    return closed;
}

function dislikeUserClosure(userFrom, userTo) {
    let closed = function() {
        lightClientClient.dislikeUser(userFrom,userTo);
    }   
    return closed;
}

function donateClosure(userFrom, userTo,sum) {
    let closed = function() {
        lightClientClient.donate(userFrom,userTo,sum);
    }   
    return closed;
}

function claimClosure(user, amount,address) {
    let closed = function() {
        lightClientClient.claim(user,amount,address);
    }   
    return closed;
}

let superWorker = async function (operation) {
   operation();
}

const oneRegMatcher = function (regex, str) {
    let m;
    let res = null;
    // while ((m = banRegex.exec(str)) !== null) {
    //     // This is necessary to avoid infinite loops with zero-width matches
    //     if (m.index === banRegex.lastIndex) {
    //         banRegex.lastIndex++;
    //     }

    //     // The result can be accessed through the `m`-variable.
    //     // m.forEach((match, groupIndex) => {

    //     // });

    //     if (m[0]) {
    //         res = m[0];
    //         break;
    //     }
    //      return res;
    // }
    regex.lastIndex = 0;
    m = regex.exec(str);
    if (m && m[0]) {
        res = m[0];
    }
    return res;
}


const router = {
    ban: function ban(ctx, subject, object) {
        dislikeUser(subject, object);
    },
    claim: function donate(ctx, subject, amount, address) {
        claim(subject,amount,address);
     },
    clap: function clap(ctx, subject, object) {
        likeUser(subject, object);
     },
     donate: function clap(ctx, subject, object,sum) {
         donate( subject, object,sum);
     }
}

const parseAndInvoke = function (ctx, message) {
    let banObject = oneRegMatcher(banRegex, message);
    let clapObject = oneRegMatcher(clapRegex, message);
    let donateObject = oneRegMatcher(donateRegex, message);
    let claimObject = oneRegMatcher(claimRegex, message);
    //let addObject = oneRegMatcher(addRegex,message);
    if (banObject) {
        router.ban(ctx, ctx.message.from.username, banObject.substring(1));
    }
    if (clapObject) {
        router.clap(ctx, ctx.message.from.username, clapObject.substring(1));
    }

    if (donateObject){
        let donateStrs =  donateObject.substring(1).split(' ');
        let toUserName = donateStrs[0];
        let sum = 0;
        if (donateStrs[1]) {
            sum = parseInt(donateStrs[1]);
            router.donate(ctx, ctx.message.from.username, toUserName,sum);
        }
    }

    if (claimObject){
        let claimStrs =  claimObject.split(' ');
        let amount = parseFloat(claimStrs[0]);      
        if (claimStrs[1]) {
            address = claimStrs[1];
            router.claim(ctx, ctx.message.from.username, amount,address);
        }
    }
    // if (addObject) {
    //     router.add(ctx, ctx.from.username, addObject)
    // }
    //let clap = 
}


async function addUserToDB(userName) {
    let someUser = await User.findOne({ userName: userName });
    if (!someUser) {
        someUser = new User({ userName: userName });
        await someUser.save();
    }
    return someUser;
}

async function findUser(username) {
    let someUser = await User.findOne({ userName: username });
    return someUser;
}

async function addUser(username) {
     let user = await findUser(username);
     if (user == null) {
        user = await addUserToDB(username);
        let userClosed = addUserClosure(user);
        executor(userClosed);
     }
}

async function likeUser(usernameFrom, usernameTo) {
    let userFrom = await findUser(usernameFrom);
    let userTo = await findUser(usernameTo);
    let likeClosed = likeUserClosure(userFrom, userTo);
    executor(likeClosed);
}

async function donate(usernameFrom, usernameTo, sum) {
    let userFrom = await findUser(usernameFrom);
    let userTo = await findUser(usernameTo);
    let donateClosed = donateClosure(userFrom, userTo,sum);
    executor(donateClosed);
}

async function claim(username, amount, address) {
    let user = await findUser(username);
    
    let claimClosed = claimClosure(user, amount,address);
    executor(claimClosed);
}

async function dislikeUser(usernameFrom, usernameTo) {
    let userFrom = await findUser(usernameFrom);
    let userTo = await findUser(usernameTo);
    let dislikeClosed = dislikeUserClosure(userFrom, userTo);
    executor(dislikeClosed);
}

async function processBan(ctx, message){
    let usr = await findUser(ctx.from.username);
    lightClientClient.eventEmitter.on('userBanSaved', function check(user){
        if (user.id == usr.id){
            lightClientClient.eventEmitter.off('userBanSaved', check);    
            if (user.banned > 0)   {
                ctx.deleteMessage(ctx.chat.chat_id, ctx.message.id);
            }
        }
    })
    lightClientClient.getBanInfo(usr.id);
}


async function main() {
    process.chdir('..');

    connection = await mongoose.connect('mongodb://localhost/toncontest', { useNewUrlParser: true });
    var userSchema = new mongoose.Schema({
        userName:   String,
        total_Ri:   Number,
        ri_count:   Number,
        prev_TPi:   Number,
        days:       Number,
        bans_count: Number,
        balance:    Number,
        banned: Number,        
    });

    const AutoIncrement = AutoIncrementFactory(connection);
    userSchema.plugin(AutoIncrement, { inc_field: 'id' });
    User = mongoose.model('User', userSchema);

    const menu = new TelegrafInlineMenu(ctx => `Hey ${ctx.from.first_name}!`)
    menu.setCommand('start')

    menu.simpleButton('I am excited!', 'a', {
        doFunc: ctx => ctx.reply('As am I!')
    })

    
//aboutme - get data about me from the blockchain

    const Telegraf = require('telegraf')
    const bot = new Telegraf(process.env.BOT_TOKEN)
    bot.use(menu.init());
    bot.start((ctx) => ctx.reply('Welcome!'))
    bot.help((ctx) => ctx.reply('Add yourself to get rewards via TON'))
    bot.command('addme', (ctx) => {
        ctx.reply('adding')
        addUser(ctx.from.username);
        ctx.reply('added')
    });

    bot.command('aboutme', async (ctx) => {
        ctx.reply('processing data from the blockchain')
        let usr = await findUser(ctx.from.username);        
        lightClientClient.eventEmitter.on('userSaved', async function reportMe(user){
            if (user.id == usr.id){
                lightClientClient.eventEmitter.off('userSaved',reportMe);
                ctx.reply('your data ' + JSON.stringify(user.toObject()));
            }
        })
        lightClientClient.getUser(usr.id);        
    });

    bot.on('new_chat_members', async (ctx) => {
        let response = "";
        for (let index = 0; index < ctx.message.new_chat_members.length; index++) {
            const element = ctx.message.new_chat_members[index];
            let res = await addUser(element.username);
            lightClientClient.eventEmitter.once('userSet' ,(user) => {
                //reply only for the first user
                response = 'we added to the blockchain ' + JSON.stringify(user);
                ctx.reply(response);      
            } )
            //response += element.username + "=" + res.id;
        }
        //ctx.reply(response);
    });

    bot.on('sticker', (ctx) => ctx.reply('👍'))

    bot.on('text', (ctx) => {
        processBan(ctx, ctx.message);
        parseAndInvoke(ctx, ctx.message.text);
    })

    bot.on('message', (ctx) => {
        // if (ctx.from.username.indexOf("durakov") > -1) {
        //     ctx.deleteMessage(ctx.chat.chat_id, ctx.message.id);
        // }
    })
    
    lightClientClient.eventEmitter.on('userSet', async (userObj) => {
        let someUser = await User.findOne({ id: userObj.id });        
        someUser.total_Ri=   userObj.total_Ri;
        someUser.ri_count=   userObj.ri_count;
        someUser.prev_TPi=   userObj.prev_TPi;
        someUser.days=       userObj.days;
        someUser.bans_count= userObj.bans_count;
        someUser.balance=    userObj.balance; 
        await someUser.save(); 
        lightClientClient.eventEmitter.emit('userSaved',someUser)
    });

    lightClientClient.eventEmitter.on('userBanSet', async (banObj) => {
        let someUser = await User.findOne({ id: banObj.userId });        
        someUser.banned =   banObj.banned;       
        await someUser.save(); 
        lightClientClient.eventEmitter.emit('userBanSaved',someUser)
    });
    bot.hears('hi', (ctx) => ctx.reply('Hey there'))
    bot.launch()
}

main();