**TON Contest 2**  

```
License: MPL-2.0
blocklab
2019
```

# Self Regulated Community
## Intro 
### Main purpose  
To create a community self-regulation mechanics that stimulates the creation of useful content and allows Telegram community members to deal with flood and spam without attracting of dedicated administrators and moderators.  

### Problem  
One of Telegram’s acute problems is spammers who have flooded thematic communities (groups) with advertising or fraudulent messages. In most Telegram communities, there is no regular round-the-clock mechanism for moderation of such messages by administrators, especially in non-profit, growing or small communities. Spammers use this to reach their goal and get the required number of views until administrators appear online to remove spam. Anti-spam bots partially solve this problem, but advanced spammers can circumvent such bots protection in any case.  

### Solution  
We provide the opportunity for all users to participate in self-regulation (moderation) of communities using a mechanism for a weighted rating of messages from other users. The weighted rating means that users' votes are not equal, but weighted according to their relative influence in each community. The weight of the user's voice is determined by the level of support for his activities by other users of the group. Due to this mechanism, users can not only filter unwanted content on their own, but also dynamically determine community leaders for any other needs.  

## Self-regulation mechanics  

The basis of self-regulation is the **TelePower** (**TP**), Rating and Anti-rating of each user in the community. These parameters are calculated independently for each Telegram group   

* **TelePower** (**TP**) determines the weight of the user's actions in the group.  
* **Rating** is needed to recalculate TelePower in the future periods.  
* **Anti-Rating** affects the duration of the punishment (ban) of the user for his actions.  
The user will be banned automatically for a calculated period when a negative rating is reached.  
  
Self-regulation is built on three mechanics: **Like**, **Dislike** and **Donate**, which are monitored and processed by the Telegram bot.
* **Like** allows a user to express the trust and support to a specific user for his activity in the community - increases supported user’s Rating, which is then used to calculate his **TelePower**.  
* **Dislike** reflects the negative to the user's posts, reduces his rating and can lead to a penalty ban and increase **Anti-Rating** if negative **Rating** values are reached.  
**Dislike** allows to block spam messages and flooding in the community.   
* **Donate** serves to encourage users to create useful content for the community.  
  
The higher user’s **TelePower** determines the more significant effect of **Like** and **Dislike** actions in relation to messages from other users.


## Calculation of **Rating** and **TelePower (TP)**    

**TP (TelePower)** user’s voting power is calculated periodically (once a day) based on the user Rating in the group. The calculation of **TP** is based on the following idea:  
**TP** should be dynamic and reflect user activity for a certain period - **D** days (or other constant periods, hereinafter - days). The period should not be too long so as not to create a king who does nothing, but only **Dislikes** everyone, and not too short to exclude fraud and the ability to quickly add many cross-liking bots and seize influence in the group.  

By default, **TelePower** of the i-th (new) user is TPi = 1.  

**N** - total number of users in the community.  
**D** - the number of days by which the user Rating is considered. In the current implementation, D = 10 (contract constant).  
**Ri** - Rating of the i-th user.  
**Ri** = `foreach day : Ri += ( RDi / Day_Likes_Count_i )`  
Average **TelePower** of all users who made the **Like** action (or **Dislike** with a minus sign) for the last **D** days (periods).  
Where:  
* **RDi** - the sum of **TelePower** of all **Likes** and **Dislikes** for a current day;  
* **Day_Likes_Count_i** - number of **Likes** and **Dislikes** for a current day.  

**Ri** is recalculated once per day (period) for each user, after which there is a reordering of the elements in the list and recalculation of the TelePower of the i-th user - **TPi**.  
**TPi** - TelePower of the i-th user, which takes a value in the range of integer values `[1 .. log (N)]`.  
**TPi** = `int (log (N/(i+1)))`, where **i** is the index of the element in the rating ordered list, the smaller the index, the higher the user has **TelePower**.  
  
The idea of calculating TelePower in such a way is to make a structure similar to hierarchy where we have twice fewer people on each higher level with bigger TelePower.  

## Calculation of Anti-Rating  
**ARi** - Anti-Rating of the i-th user (in smartcontract it `bans_count` of user's info). The default is 0.  

The user gets a ban of `ARi + 1` days every time his **Ri** rating becomes negative. After the ban **ARi** incremented on 1.  

In the future a mechanism may be provided to reduce Anti-Ratings under certain conditions, for example, with an increase of TP.  

## Donate distribution
**Donate** is sent to the contract address\*, where the following distribution occurs:  
`70%` to the author of the post;  
`20%` of the top 15 users of the group to support their contribution to the community;  
`10%` to the bot for maintenance and transaction commissions.  

To minimize the transaction cost tokens will remain on the contract, and user balances will be updated. Users can withdraw their tokens at any time by asking for a transfer from the bot or directly from the smart contract.  
*  In the current implementation, to simplify the interface, the user does not send Donate directly from his wallet, but operates with his virtual balance on the contract  

Another limitation of the current implementation (and the feature) is the earning process. Top users are able to earn tokens by the Distribution process when the group owner is able to Reward to the community by himself.  

Top 15 (contract constant) users are taken from the beginning of the list ordered by Rating. The reward is distributed to them in proportion to the values of their TelePower.  

## Telegam-bot  

We’ve made the simple bot in `@MySuperTestGroupForTonBot` group for test purposes. More about backend and bot can be found in `backend\README.md`

# Repository structure

It has two folders. `blockchain` and `backend`. Both of them contain their own `README.md` files

# Contacts  
**Blocklab**  
**Ponomarev Philipp**, Team Lead, telegram: `@qpilipp`  
**Andrey Durakov**, CEO, telegram: `@adurakov`  
**Kirill Yurkov**, CTO, telegram: `@kirillyurkov`  
