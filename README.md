# AgriFlow - Smart Inventory Management System

A weather-aware inventory management system for agricultural supply chains.

## Features
- Dashboard with real-time stats
- Expiry tracking with alerts
- Raw materials inventory management
- Batch tracking with route progress
- Supplier marketplace
- Weather-based ordering recommendations
- Dark/Light theme support
- Responsive design

## Tech Stack
- Frontend: HTML5, CSS3, JavaScript
- Backend: Node.js, Express.js
- Icons: Font Awesome

## Setup

```bash
# Clone the repo
git clone https://github.com/WhoAmI-unknown-ai/project-template.git
cd project-template

# Install backend dependencies
cd backend
npm install

# Start the server
npm start
```

Open http://localhost:3000 in your browser.

## API Endpoints
- GET /api/expiry - Get expiry data
- GET /api/inventory - Get inventory
- GET /api/batches?material=wheat - Get batch tracking
- GET /api/suppliers?material=wheat - Get suppliers

## License
MIT
