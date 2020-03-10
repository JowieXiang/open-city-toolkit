#! /bin/bash
. ~/cityapp/scripts/shared/functions

# version 1.22
# CityApp maintenance
# Resolution setting
# 2020. március 2.
# Author: BUGYA Titusz, CityScienceLab -- Hamburg, Germany

#
#-- Initial settings -------------------
#

cd ~/cityapp

MODULES=~/cityapp/scripts/modules
MODULE=~/cityapp/scripts/modules/resolution_setting
MODULE_NAME=cityapp_resolution_setting
VARIABLES=~/cityapp/scripts/shared/variables
BROWSER=~/cityapp/data_from_browser
MESSAGE_TEXT=~/cityapp/scripts/shared/messages/$LANGUAGE/resolution_setting
MESSAGE_SENT=~/cityapp/data_to_client
LANGUAGE=$(cat ~/cityapp/scripts/shared/variables/lang)

touch $VARIABLES/.launch_locked

#
#-- Process ----------------------------
#

RES=$(cat $VARIABLES/resolution | head -n3 | tail -n1)
RES_VAL=$RES
# Defining resolution for the entire CityApp
# Projection is epsg:4326-ot. Therefore, even the user gives the resolutiion in mteres, we have to pass its value to GRASS in decimal degrees.
# Therefore, input always first goes to "bc". 111322 meters = 1°

# Messages 1 Type the resolution in meters, you want to use. For further details see manual.
Send_Message m 1 resolution_setting.1 input actions [\"yes\"]
    Request
    RESOLUTION=$REQUEST_CONTENT
    RESOLUTION=$(echo $RESOLUTION | cut -d"," -f1)
    RESOLUTION=$(echo $RESOLUTION | cut -d"." -f1)

    if [ $RESOLUTION -le 0 ]
        then
            until [ $RESOLUTION -gt 0 ]; do 
                # Message 2 Resolution has to be an integer number, greater than 0.  Please, define the resolution for calculations in meters.
                Send_Message m 2 resolution_setting.2 input actions [\"yes\"]
                    Request
                    RESOLUTION=$REQUEST_CONTENT
                    RESOLUTION=$(echo $RESOLUTION | cut -d"," -f1)
                    RESOLUTION=$(echo $RESOLUTION | cut -d"." -f1)
            done
        else
            echo "First data: Resolution in meters, given by the user." > $VARIABLES/resolution
            echo "Second data: resolution in decimal degrees, derivated from first data." >> $VARIABLES/resolution
            echo "$RESOLUTION" >> $VARIABLES/resolution
            echo "$RESOLUTION/111322" | bc -l | sed -e 's/^-\./-0./' -e 's/^\./0./' >> $VARIABLES/resolution
    fi
    
Close_Process
exit
