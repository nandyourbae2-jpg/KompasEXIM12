#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
cp kompas-exim.db backups/kompas-exim_$TIMESTAMP.db
# Keep only last 7 days
find backups/ -name "*.db" -type f -mtime +7 -exec rm {} \;
