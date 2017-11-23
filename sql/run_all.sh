#!/bin/bash

#Selecting region
if [ -z $1 ]; then
    region="es"
    echo "No region passed as argument. Using default region: $region"
else
    if [[ ! $1 =~ ^(en|pt|es|ru|ja)$ ]]; then 
        echo "Region must be either en, pt, es, ru or ja."
        exit
    fi  
    region=$1
fi

#run scripts
psql stackoverflow_$region -f community.sql
psql stackoverflow_$region -f skills.sql
psql stackoverflow_$region -f clusters.sql

#export to data directory
psql stackoverflow_$region -c "\COPY community TO '../web/data/$region.stackoverflow.com_community.csv' CSV HEADER;"
psql stackoverflow_$region -c "COPY community TO '../web/data/$region.stackoverflow.com_skills.csv' CSV HEADER;"
psql stackoverflow_$region -c "COPY community TO '../web/data/$region.stackoverflow.com_clusters.csv' CSV HEADER;"
