#!/bin/bash

# Kill process on a specific port
# Usage: ./scripts/kill-port.sh <port>

PORT=${1:-8900}

echo "Checking for processes on port $PORT..."

# Find process using the port
PID=$(lsof -ti :$PORT 2>/dev/null)

if [ -z "$PID" ]; then
    echo "No process found on port $PORT"
    exit 0
fi

echo "Found process $PID on port $PORT"
echo "Killing process..."

# Kill the process
kill -9 $PID 2>/dev/null

sleep 1

# Verify it's killed
if lsof -ti :$PORT >/dev/null 2>&1; then
    echo "Failed to kill process on port $PORT"
    exit 1
else
    echo "Port $PORT is now free"
    exit 0
fi

