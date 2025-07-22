FROM osrm/osrm-backend:latest

# Set working directory
WORKDIR /data

# Copy the Chicago OSM data
COPY chicago.osm.pbf /data/

# Create a script to process the data
RUN echo '#!/bin/bash\n\
echo "Processing Chicago OSM data..."\n\
osrm-extract -p /opt/car.lua /data/chicago.osm.pbf\n\
osrm-partition /data/chicago.osrm\n\
osrm-customize /data/chicago.osrm\n\
echo "OSRM data processing completed"\n\
exec osrm-routed --algorithm mld /data/chicago.osrm' > /data/start.sh

RUN chmod +x /data/start.sh

# Expose the OSRM port
EXPOSE 5000

# Set the entrypoint to our custom script
ENTRYPOINT ["/data/start.sh"] 