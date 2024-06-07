#!/bin/bash

# Copy the input code to the ts program file
cp /input.txt /source/program.py

# Run the program with bun
python3 /source/program.py

# Empty the input file
echo "" > /input.txt
