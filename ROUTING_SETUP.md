# Routing Services Setup

This project now includes OSRM (Open Source Routing Machine) and VROOM (Vehicle Routing Open-source Optimization Machine) for advanced routing and vehicle optimization capabilities.

## Services Overview

### OSRM (Open Source Routing Machine)
- **Purpose**: High-performance routing engine for road networks
- **Data**: Uses Chicago OSM data (`chicago.osm.pbf`)
- **Access**: Available at `/osrm/` endpoint
- **Features**: 
  - Turn-by-turn directions
  - Distance and duration calculations
  - Multiple routing profiles (car, bike, foot)

### VROOM (Vehicle Routing Optimization)
- **Purpose**: Vehicle routing optimization for multiple vehicles and stops
- **Dependencies**: Requires OSRM for distance calculations
- **Access**: Available at `/vroom/` endpoint
- **Features**:
  - Multi-vehicle routing
  - Time windows support
  - Capacity constraints
  - Pickup and delivery optimization

## API Endpoints

### OSRM Endpoints

#### Route Calculation
```
GET /osrm/route/v1/{profile}/{coordinates}
```

**Example:**
```bash
curl "http://localhost:3005/osrm/route/v1/driving/-87.6298,41.8781;-87.6298,41.8782"
```

**Parameters:**
- `profile`: routing profile (driving, cycling, walking)
- `coordinates`: semicolon-separated coordinates (lon,lat)

#### Matrix Calculation
```
GET /osrm/table/v1/{profile}/{coordinates}
```

**Example:**
```bash
curl "http://localhost:3005/osrm/table/v1/driving/-87.6298,41.8781;-87.6298,41.8782;-87.6298,41.8783"
```

### VROOM Endpoints

#### Vehicle Routing Optimization
```
POST /vroom/
```

**Example Request:**
```json
{
  "vehicles": [
    {
      "id": 1,
      "start": [-87.6298, 41.8781],
      "end": [-87.6298, 41.8781],
      "capacity": [10]
    }
  ],
  "jobs": [
    {
      "id": 1,
      "location": [-87.6298, 41.8782],
      "amount": [1]
    },
    {
      "id": 2,
      "location": [-87.6298, 41.8783],
      "amount": [1]
    }
  ]
}
```

**Example:**
```bash
curl -X POST "http://localhost:3005/vroom/" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicles": [{"id": 1, "start": [-87.6298, 41.8781], "end": [-87.6298, 41.8781], "capacity": [10]}],
    "jobs": [
      {"id": 1, "location": [-87.6298, 41.8782], "amount": [1]},
      {"id": 2, "location": [-87.6298, 41.8783], "amount": [1]}
    ]
  }'
```

## Integration with Your Application

### Replacing Google Routes API

To replace Google Routes API with OSRM in your application:

1. **Route Calculation**: Use `/osrm/route/v1/driving/{coordinates}` instead of Google Directions API
2. **Distance Matrix**: Use `/osrm/table/v1/driving/{coordinates}` instead of Google Distance Matrix API
3. **Vehicle Optimization**: Use `/vroom/` for complex multi-vehicle routing scenarios

### Example JavaScript Integration

```javascript
// Route calculation
async function getRoute(start, end) {
  const coordinates = `${start.lon},${start.lat};${end.lon},${end.lat}`;
  const response = await fetch(`/osrm/route/v1/driving/${coordinates}`);
  const data = await response.json();
  return data.routes[0];
}

// Vehicle optimization
async function optimizeRoutes(vehicles, jobs) {
  const response = await fetch('/vroom/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ vehicles, jobs })
  });
  return await response.json();
}
```

## Docker Setup

The services are automatically configured when you run:

```bash
docker-compose up -d
```

### Service Dependencies
1. **OSRM** starts first and processes the Chicago OSM data
2. **VROOM** waits for OSRM to be healthy before starting
3. **Nginx** proxies requests to both services

### Health Checks
- OSRM: Checks if routing endpoint responds
- VROOM: Checks if optimization endpoint responds
- Both services have automatic restart policies

## Data Management

### OSRM Data
- Chicago OSM data is processed during container build
- Processed data is stored in `osrm-data` volume
- Data processing happens automatically on first run

### Updating OSM Data
To update the Chicago OSM data:

1. Replace `osrm/chicago.osm.pbf` with new data
2. Rebuild the OSRM container:
   ```bash
   docker-compose build osrm
   docker-compose up -d osrm
   ```

## Performance Considerations

- OSRM uses MLD (Multi-Level Dijkstra) algorithm for fast routing
- VROOM uses advanced optimization algorithms for vehicle routing
- Both services are optimized for the Chicago area
- Consider caching results for frequently requested routes

## Troubleshooting

### OSRM Issues
- Check if Chicago OSM data is present in `osrm/chicago.osm.pbf`
- Verify OSRM container logs: `docker-compose logs osrm`
- Ensure sufficient disk space for data processing

### VROOM Issues
- Verify OSRM is healthy before VROOM starts
- Check VROOM container logs: `docker-compose logs vroom`
- Ensure proper JSON format for optimization requests

### Network Issues
- Verify all services are on the same Docker network
- Check nginx configuration for proper proxy settings
- Ensure ports are correctly exposed and mapped 