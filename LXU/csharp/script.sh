#!/bin/bash

# Copy the input code to the C# program file
cp /input.txt /source/Program.cs

# Run the C# program
dotnet script /source/Program.cs
