#! /bin/bash
. ~/cityapp/scripts/shared/functions.sh

# version 1.0
# CityApp module
#
# Core component, don not modify.
#
# This module is to send a message: the current module which has called this module, is still running.
#
# 2020. április 9.
# Author: BUGYA Titusz, CityScienceLab -- Hamburg, Germany

#
#-- Initial settings -------------------
#

cd ~/cityapp

MODULES=~/cityapp/scripts/modules
MODULE=~/cityapp/scripts/modules/running_check
MODULE_NAME=cityapp_running_check
VARIABLES=~/cityapp/scripts/shared/variables
BROWSER=~/cityapp/data_from_browser
MESSAGE_SENT=~/cityapp/data_to_client


# -- processing -----

ID_NUM=1
MODULE_ORIGIN=$(cat $VARIABLES/module_status | head -n1)
RUNNING=$(cat $VARIABLES/module_status | tail -n1)
while [ $RUNNING -eq 1 ];do
    touch $MESSAGE_SENT/$MODULE_ORIGIN"_"$ID_NUM
    sleep 1s
    RUNNING=$(cat $VARIABLES/module_status | tail -n1)
    rm -f $MESSAGE_SENT/$MODULE_ORIGIN"_"$ID_NUM
    ID_NUM=$(($ID_NUM+1))
done
rm -f $MESSAGE_SENT/$MODULE_ORIGIN"_"$ID_NUM
rm -f $VARIABLES/module_status
exit
