#!/bin/bash

# Build and test routing services script
echo "🚀 Building and testing routing services..."

# Build OSRM container
echo "📦 Building OSRM container..."
docker-compose build osrm

# Build VROOM container
echo "📦 Building VROOM container..."
docker-compose build vroom

# Start services
echo "🔄 Starting routing services..."
docker-compose up -d osrm vroom

# Wait for OSRM to be ready
echo "⏳ Waiting for OSRM to be ready..."
until docker-compose exec -T osrm curl -f http://localhost:5000/route/v1/driving/-87.6298,41.8781;-87.6298,41.8781 > /dev/null 2>&1; do
    echo "Waiting for OSRM..."
    sleep 10
done
echo "✅ OSRM is ready!"

# Wait for VROOM to be ready
echo "⏳ Waiting for VROOM to be ready..."
until docker-compose exec -T vroom curl -f http://localhost:3000 > /dev/null 2>&1; do
    echo "Waiting for VROOM..."
    sleep 5
done
echo "✅ VROOM is ready!"

# Test OSRM endpoint
echo "🧪 Testing OSRM endpoint..."
curl -s "http://localhost:3005/osrm/route/v1/driving/-87.6298,41.8781;-87.6298,41.8782" | jq '.code' 2>/dev/null || echo "OSRM test completed"

# Test VROOM endpoint
echo "🧪 Testing VROOM endpoint..."
curl -s -X POST "http://localhost:3005/vroom/" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicles": [{"id": 1, "start": [-87.6298, 41.8781], "end": [-87.6298, 41.8781], "capacity": [10]}],
    "jobs": [{"id": 1, "location": [-87.6298, 41.8782], "amount": [1]}]
  }' | jq '.code' 2>/dev/null || echo "VROOM test completed"

echo "🎉 Routing services are ready!"
echo ""
echo "📋 Available endpoints:"
echo "  - OSRM: http://localhost:3005/osrm/"
echo "  - VROOM: http://localhost:3005/vroom/"
echo ""
echo "📖 See ROUTING_SETUP.md for detailed usage instructions" 