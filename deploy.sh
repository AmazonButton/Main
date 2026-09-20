#!/bin/bash
set -e

echo "========================================================"
echo "   🚀 DEPLOY SMART ORDER BUTTON IOT PLATFORM (DOCKER)"
echo "========================================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker & Docker Compose first."
    exit 1
fi

echo "[1/3] Stopping previous containers..."
docker compose down || true

echo "[2/3] Building and starting containers (PostgreSQL, Backend, Frontend)..."
docker compose up --build -d

echo "[3/3] Checking container status..."
docker compose ps

echo "========================================================"
echo " ✅ DEPLOYMENT FINISHED SUCCESSFULLY!"
echo "========================================================"
echo " 🌐 Frontend Web Portal: http://localhost (Port 80)"
echo " 📡 Backend Cloud API:   http://localhost:5000/api"
echo " 🐘 PostgreSQL Database: localhost:5432 (smart_order_db)"
echo ""
echo " 🔑 Default Accounts:"
echo " - Admin:       admin@smartorder.local    / Password123!"
echo " - Store Owner: store@smartorder.local    / Password123!"
echo " - Customer:    customer@smartorder.local / Password123!"
echo "========================================================"
