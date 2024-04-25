#!/bin/bash

# Copy the input code to the ts program file
cp /input.txt /source/program.ts

# Run the program with bun
bun run /source/program.ts

# Empty the input file
echo "" > /input.txt
