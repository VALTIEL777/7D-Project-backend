FROM postgis/postgis:15-3.3

# Set environment variables
ENV POSTGRES_DB=7d_project
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=postgres

# Copy SQL scripts to the initialization directory
# These will run automatically when the container starts
COPY scripts/ /docker-entrypoint-initdb.d/

# Create a directory for additional scripts if needed
RUN mkdir -p /opt/scripts

# Copy any additional setup scripts
COPY setup.sh /opt/scripts/
RUN chmod +x /opt/scripts/setup.sh

# Expose PostgreSQL port
EXPOSE 5432

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD pg_isready -U postgres -d 7d_project || exit 1 