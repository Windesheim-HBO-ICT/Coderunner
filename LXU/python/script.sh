#!/bin/bash

# Get the input code from the first argument
echo $1 > /input.txt

# Copy the input code to the ts program file
cp /input.txt /source/program.py

# Run the program with bun
python3 /source/program.py
