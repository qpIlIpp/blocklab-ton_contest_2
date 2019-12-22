#!/bin/bash
fift -s blockchain/scripts/6_dislike.fif $1 $2 $3 $4
# user dislikes another users' post
# $1 - seqno
# $2 - id user, which press dislike button
# $3 - id user, which is author of the post