```
License: MPL 2.0
blocklab
2019
```

# API
Designed API for smart contract, works on external messages:  
```
add_user(id)
like(id_from, id_to)
dislike(id_from, id_to)
donate(id_from, id_to, amount)
distribute(amount, user_count)
claim(who, amount, addr)
add_balance(who, amount)
```

# Blockchain stored data  

We store `seqno`; public `key` (for signature checking); `users_top` sorted via Ri users list; `current_users` dictionary of users (id is a key); `banned_users` dictionary of baned users (id is a key)  

# Structure  

`scripts` folder - fift scripts for passing external messages to smart-contract  
most of scripts are using `key.addr` & `key.pk` files, which are not included into repository because of safety reasons  
`sh` folder - sh scripts for process pipes, which just call fift scripts  
`smartcont` folder - source code of smart contract, we will observe it further  

# Debug

We didn't delete `debug.fif` script and didn't prettify it. It's about how we've tested our contract. Maybe someday somebody will find it useful :)  

# smartcont  
We've made buid script and didn't delete result fif file  
contract is built in that order:  

```
blockchain/smartcont/constants.fc
blockchain/smartcont/transfer.fc
blockchain/smartcont/days_logic.fc
blockchain/smartcont/user_processor.fc
blockchain/smartcont/rate_sort.fc
blockchain/smartcont/self_regul_community.fc
blockchain/smartcont/get_methods.fc
```

Every single fc file contains commentaries  
`constants.fc` contains error codes, constants and error wraper  

`transfer.fc` contains functions for sending grams to user  

`days_logic` contains logic which is related to singly-linked list `days` proceeding. We call periods `day`, but it can be any period : half, week, etc. We store **RDi** (**Ri** for exact day) and **RDi_count** in that list and shift it after the recalculating process. The recalc process is starting with the `distribute` method. Intervals of recalc can be any.  

`user_processor` contains user structure. In dictionary we store cells with that scheme: `int prev_TPi, cell days, int bans_count, int balance`. `prev_TPi` is information about user's TPi in previous period. `days` - list with information `Ri` and `Ri_count` for each day. (if user with `TPi == 2` will like me, then : `days[0].Ri += 2; days[0].Ri_count++;`, `-2` for dislike).  

`rate_sort` - main file with periodic data reevaluation logic. We make new singly-linked users list, sorted via the user's Ri (`foreach day : Ri += RDi / Count`). After that we update the dictionary with new **TPi**, shift `Days` for each user, decrease ban count.  

`self_regul_community` - the entry point for messages handling and data proceeding. We didn't remove contract updating and clearing methods. They are useful in the debug process.  

`get_methods` contains get methods, which backend calls to get some data.  