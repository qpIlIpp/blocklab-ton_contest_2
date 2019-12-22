```
License: MPL-2.0
blocklab
2019
```

To communicate with smart-contract, we've made the telegram bot  
All testing was made in the `@MySuperTestGroupForTonBot` group  

At the contest we've focused on smart contracts, our Bot is just a test platform. In the future when blockchain will be embedded into client and telegram API, the bot should be rewritten.  

## Blockchain integration  
Integration was made over lite-client via process pipes  

## Reevaluating of the blockchain state  
The bot doesn't contain reevaluating feature, we will `cron` for that purpose  

## Idea
The bot should allow users to like and dislike messages in the group. Ultimately it should be implmeted via inline menu. Bot should guarantee that  
1. Only recent messages are liked or disliked.  
2. One user can like one message only once.  
3. For every user a record is created on the blockchain.  

Bot should allow users to donate to other users directly.  
Bot should allow users to claim their Grams.  
Bot should block messages from banned users.

In the future the bot should also ask user for his signature and client's wallet should be the one signing and sending all the transactions. Otherwise, the system will remain centralized and will be de facto controlled by the bot maker. Although even for current solution TON will help to bring transparancy and any fraudulent behaviour by the bot maker will be discovered.

## Current implementation

Current implemenation is only a demonstration.  
Current bot allows users to like (clap) and dislike (propose bans) other users (instead of messages).  
Current bot does not support several different groups. Users from all groups are stored together.  
When user enters the group bot adds him to the blockchain.  
When user's message contains regex for "clap @user" or "ban @user", bot invokes smartcontract to create like/dislike from one user to another.  
User can donate part or whole of his virtual balance to another user. To do that his message must contain "donate @user amount".  
User can claim part or whole of hist virtual balance. To do that his message must contant "claim amount TonAddress".  

Currently bot interacts with TON via light client terminal (stdin, stdout, stderr). This approach should never be used in production as it is extremely brittle and tends to fail whenever there are any simultanious "calls" to the terminal.  
