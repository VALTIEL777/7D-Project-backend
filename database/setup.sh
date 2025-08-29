#!/bin/bash

# 7D Project Database Setup Script
# This script runs additional database setup tasks

set -e

echo "🔧 Running additional database setup..."

# Wait for PostgreSQL to be ready
until pg_isready -U postgres -d 7d_project; do
  echo "⏳ Waiting for PostgreSQL to be ready..."
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Run any additional setup commands here
# For example:
# - Create additional users
# - Set up specific permissions
# - Run data migrations
# - Create indexes

echo "🎉 Database setup completed!" 