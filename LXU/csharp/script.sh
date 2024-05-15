#!/bin/bash

# Check if the input file has a empty string or is empty
# if [ -s /input.txt ]
# then
#   echo "File is not empty"
# else
#   echo "File is empty"
# fi

# Copy the input code to the C# program file
cp /input.txt /source/Program.cs

# Run the C# program
dotnet run .

# empty the input file
echo "" > /input.txt
