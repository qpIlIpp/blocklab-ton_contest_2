#!/bin/bash
fift -s blockchain/scripts/7_donate.fif $1 $2 $3 $4 $5
# user donates to another user
# $1 - seqno
# $2 - id user, which press donate button
# $3 - id user, which is author of the post
# $4 - amount of donate