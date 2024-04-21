#!/bin/bash

# Get the input code from the first argument
echo $1 > /input.txt

# Copy the input code to the C# program file
cp /input.txt /source/Program.cs

# Run the C# program
dotnet script /source/Program.cs
