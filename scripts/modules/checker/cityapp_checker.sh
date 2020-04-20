#! /bin/bash
# version 1.01
# CityApp maintenance
# Check requested components
# 2020. április 16.
# Author: BUGYA Titusz, CityScienceLab -- Hamburg, Germany


# Checker has no frontend. It is used only at the installation to check if all the requeted components are available.
# Checker's messages are sent to the console the checker running in.

ERROR=~/cityapp/error_log
rm -f $ERROR
touch $ERROR
 
if [ $(which inotifywait) ]
    then
        echo "inotifywait found"
    else
        echo "No inotifywait found" >> $ERROR
fi

if [ $(which grass) ]
    then
        echo "GRASS found"
    else
        echo "No GRASS found" >> $ERROR
fi

if [ $(which sed) ]
    then
        echo "sed found"
    else
        echo "No sed found" >> $ERROR
fi

if [ $(which cut) ]
    then
        echo "cut found"
    else
        echo "No cut found" >> $ERROR
fi

if [ $(which stat) ]
    then
        echo "stat found"
    else
        echo "No stat found" >> $ERROR
fi

if [ $(which head) ]
    then
        echo "head found"
    else
        echo "No head found" >> $ERROR
fi

if [ $(which tail) ]
    then
        echo "tail found"
    else
        echo "No tail found" >> $ERROR
fi

if [ $(which grep) ]
    then
        echo "grep found"
    else
        echo "No grep found" >> $ERROR
fi

if [ $(which enscript) ]
    then
        echo "enscript found"
    else
        echo "No enscript found" >> $ERROR
fi

if [ $(which ps2pdf) ]
    then
        echo "ps2pdf found"
    else
        echo "No ps2pdf found" >> $ERROR
fi

if [ $(echo $(stat --printf="%s" $ERROR)) -eq 0 ]
then
    rm $ERROR
fi
