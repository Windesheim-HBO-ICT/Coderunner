#!/bin/bash
#
# Keep checking if the input file is last edited 1 minute ago if so exit
#
# empty the file
rm -rf /input.txt
touch /input.txt

while true
do
  if [ `find /input.txt -mmin +1` ]
  then
    echo 'File is edited more than 1 minute ago. Exiting...'
    exit 0
  fi
  sleep 1
done
