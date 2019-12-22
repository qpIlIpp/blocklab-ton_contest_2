#!/bin/bash
fift -s blockchain/scripts/5_like.fif $1 $2 $3 $4
# user likes another users' post
# $1 - seqno
# $2 - id user, which press like button
# $3 - id user, which is author of the post