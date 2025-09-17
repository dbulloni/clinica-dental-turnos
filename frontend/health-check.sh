#!/bin/sh

# Health check script for frontend
curl -f http://localhost/health || exit 1