#! /bin/bash
. ~/cityapp/scripts/shared/functions

# version 1.2
# CityApp module
# This module is to query any existing map by a user-defined area
# 2020. február 5.
# Author: BUGYA Titusz, CityScienceLab -- Hamburg, Germany

#
#-- Initial settings -------------------
#

cd ~/cityapp

GEOSERVER=~/cityapp/geoserver_data
MODULES=~/cityapp/scripts/modules
MODULE=~/cityapp/scripts/modules/module_2
GRASS=~/cityapp/grass/global
VARIABLES=~/cityapp/scripts/shared/variables
BROWSER=~/cityapp/data_from_browser
LANGUAGE=$(cat ~/cityapp/scripts/shared/variables/lang)
MESSAGE_TEXT=~/cityapp/scripts/shared/messages/$LANGUAGE/module_2
MESSAGE_SENT=~/cityapp/data_to_client
MAPSET=module_2

#
#-- Preprocess, User dialogues -------------------
#

rm -f $MESSAGE_SENT/*

echo "1";read

# First overwrite the region of module_2 mapset. If no such mapsetexist, create it
if [ -d $GRASS/$MAPSET ]
    then
        cp $GRASS/PERMANENT/WIND $GRASS/$MAPSET/WIND
    else
        mkdir $GRASS/$MAPSET
        cp -r ~/cityapp/grass/skel/* $GRASS/$MAPSET
        cp $GRASS/PERMANENT/WIND $GRASS/$MAPSET/WIND
fi

echo "2";read

# Message 1 Draw an area to qery
Send_Message 1 module_2.1
    Request geojson
    QUERY_AREA=$REQUEST_PATH
    
    # copy for archiving -- later, when a saving is not requested, it will deleted
    cp $REQUEST_PATH $MODULE/temp_storage

    Add_Vector $QUERY_AREA query_area
    QUERY_AREA="query_area"
    
    Gpkg_Out query_area query_area
    
echo "3";read

# Message 2 What is the map you want to query? Available maps are:
Send_Message 2 module_2.2
    echo "" >> $MESSAGE_SENT/message.module_2.2
    echo $(grass $GRASS/$MAPSET --exec g.list -m type=vector) >> $MESSAGE_SENT/message.module_2.2
    
    Request
    MAP_TO_QUERY=$REQUEST_CONTENT
    # copy for achiving
    echo $MAP_TO_QUERY > $MODULE/temp_storage/map_to_query

echo "4";read

    # Now it is possible to chechk if the map to query is in the default mapset (set in the header as MAPSET), or not. If not, the map has to be copied into the module_2 mapset and the further processes will taken in this mapset.

    MAPSET_TO_QUERY=$(echo $MAP_TO_QUERY | cut -d"@" -f2)
    
    if [ "$MAPSET_TO_QUERY" != "$MAPSET" ]
        then
            MAP_TO_QUERY=$(echo $MAP_TO_QUERY | cut -d"@" -f1)
            grass $GRASS/$MAPSET --exec g.copy vector=$MAP_TO_QUERY"@"$MAPSET_TO_QUERY,$MAP_TO_QUERY --overwrite 
    fi

echo "5";read

# Message 3 What is the field (column) you want to query? List of columns:
Send_Message 3 module_2.3
    echo "" >> $MESSAGE_SENT/message.module_2.3
    grass $GRASS/$MAPSET --exec db.columns table=$MAP_TO_QUERY >> $MESSAGE_SENT/message.module_2.3

    Request
    if [ -z $REQUEST_CONTENT ]
        then
            COLUMN_TO_QUERY="all"
            # copy for achiving
            echo "all" > $MODULE/temp_storage/column_to_query
        else
            COLUMN_TO_QUERY=$REQUEST_CONTENT
            # copy for achiving
            echo $COLUMN_TO_QUERY > $MODULE/temp_storage/column_to_query
    fi
    
echo "6";read

# Message 4 Do you want to perform a complex query (yes/no)? If yes, give an SQL query (list columns)
Send_Message 4 module_2.4
    echo "" >> $MESSAGE_SENT/message.module_2.4
    grass $GRASS/$MAPSET --exec db.columns table=$MAP_TO_QUERY >> $MESSAGE_SENT/message.module_2.4

    Request
    if [ "$REQUEST_CONTENT" = "no" -o "$REQUEST_CONTENT" = "No" -o "$REQUEST_CONTENT" = "NO" ]
        then
            CRITERIA="no"
            # copy for achiving
            echo "no" > $MODULE/temp_storage/criteria
        else
            CRITERIA=$REQUEST_CONTENT
            # copy for achiving
            echo $CRITERIA > $MODULE/temp_storage/criteria
    fi

echo "7";read

#
#-- Process, Query ------------------
#
    
# Set region to query area, set resolution
grass $GRASS/$MAPSET --exec g.region vector=$MAP_TO_QUERY res=0.00003 --overwrite

# Set MASK to query area
grass $GRASS/$MAPSET --exec r.mask vector=$QUERY_AREA --overwrite

# Transform query map in raster format, where $CRITERIA (what if "no"?) value=attr attr field=COLUMN_TO_QUERY
grass $GRASS/$MAPSET --exec v.to.rast  input=$MAP_TO_QUERY type=centroid where="$CRITERIA" output=$MAP_TO_QUERY"_raster" use=attr attribute_column=$COLUMN_TO_QUERY --overwrite

grass $GRASS/$MAPSET --exec v.select -t --overwrite ainput=$MAP_TO_QUERY atype=centroid binput=$QUERY_AREA output=$MAP_TO_QUERY"_centroid" operator=overlap

# Use Update datatable by raster under centroid -- print only
grass $GRASS/$MAPSET --exec v.what.rast -p map=$MAP_TO_QUERY"_centroid" type=centroid raster=$MAP_TO_QUERY"_raster" > $MODULE/temp_query_result

cat $MODULE/temp_query_result | cut -d"|" -f2 | grep -v "*" > $MODULE/temp_query_result_numbers

SUM=0
for i in $(cat $MODULE/temp_query_result_numbers);do
    SUM=$(($SUM+$i))
done

echo $SUM > $MODULE/temp_storage/result_sum
cat $MODULE/temp_query_result_numbers | wc -l > $MODULE/temp_storage/result_counts

Close_Process

exit
