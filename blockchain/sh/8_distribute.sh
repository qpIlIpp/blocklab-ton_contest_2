#!/bin/bash
fift -s blockchain/scripts/8_distribute.fif $1 $2
# start recalculate rating process, spread profits between users
# $1 - seqno
# $2 - amount of profit