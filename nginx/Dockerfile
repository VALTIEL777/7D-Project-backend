FROM nginx:alpine

# Copy the nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create SSL directory for future use
RUN mkdir -p /etc/nginx/ssl

# Expose ports
EXPOSE 80 443

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1 