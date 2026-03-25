# ASU Smart Parking Query Implementation Guide

## 🎯 How to Implement This Project Step by Step

### Step 1: Prerequisites Setup
```bash
# 1. Install Node.js (version 14 or higher)
# Download from https://nodejs.org/

# 2. Install MongoDB
# For macOS: brew install mongodb-community
# For Windows: Download from https://www.mongodb.com/try/download/community
# For Linux: Follow MongoDB installation guide

# 3. Start MongoDB service
mongod --dbpath /path/to/your/db
# Or on macOS: brew services start mongodb-community
```

### Step 2: Project Setup
```bash
# 1. Navigate to your project directory
cd /Users/ushnesha/Documents/US\ Admissions/Academic/Sem_1/Distributed\ database\ Systems/MongoDB_02/ASU_Parking_Lot

# 2. Install dependencies
npm install

# 3. Set up the database with sample data
npm run setup

# 4. Run the application
npm start
```

### Step 3: Understanding the Implementation

#### 3.1 Database Schema (`database_setup.js`)
- **Purpose**: Defines the MongoDB collection structure for parking lots
- **Key Features**:
  - GeoJSON Point coordinates for geospatial queries
  - Time windows for availability checking
  - Multiple permit types and campus locations
  - EV charging and ADA accessibility flags

#### 3.2 Geospatial Queries (`geospatial_queries.js`)
- **Purpose**: Implements all MongoDB geospatial operators
- **Operators Implemented**:
  - `$near`: Find nearest parking lots
  - `$geoNear`: Aggregation with distance calculations
  - `$geoWithin`: Find lots within polygons
  - `$geoIntersects`: Complex geometry intersections
- **Additional Features**:
  - Time-based availability filtering
  - Real-time availability updates
  - Parking statistics aggregation

#### 3.3 Natural Language Parser (`query_parser.js`)
- **Purpose**: Translates natural language to MongoDB queries
- **Supported Patterns**:
  - Location extraction (Memorial Union, BYENG, etc.)
  - Distance parsing (500 meters, 1 km, etc.)
  - Availability requirements (>20 open spots)
  - Permit type recognition (visitor, student, hourly)
  - Feature detection (EV charging, ADA spaces)
  - Time-based queries (after 6 pm, before 8 am)

#### 3.4 Main Application (`app.js`)
- **Purpose**: Demonstrates all functionality
- **Features**:
  - Interactive query mode
  - All README use case demonstrations
  - Real-time parking updates simulation
  - Comprehensive testing interface

### Step 4: Testing the Implementation

#### 4.1 Run the Test Suite
```bash
npm test
```
This will test:
- All geospatial operators
- Attribute filtering
- Natural language parsing
- Time-based filtering
- README use cases
- Data integrity

#### 4.2 Test Individual Components
```bash
# Test database setup
node setup_database.js

# Test specific queries
node -e "
const GeospatialQueries = require('./geospatial_queries');
const ParkingDatabase = require('./database_setup');
// Add your test code here
"
```

### Step 5: Using the System

#### 5.1 Interactive Mode
When you run `npm start`, you can:
1. Enter natural language queries
2. Type "stats" to see parking statistics
3. Type "update" to simulate real-time updates
4. Type "exit" to quit

#### 5.2 Example Queries to Try
```
Find the nearest visitor parking to the Memorial Union
Show lots within 500 meters of the BYENG building with >20 open spots
Where can I park after 6 pm near Poly that doesn't require a permit?
List EV-charging parking within 1 km of West campus library
Which garage inside Downtown Tempe zone has ADA spaces available now?
```

### Step 6: Customization

#### 6.1 Adding New Buildings
Edit `query_parser.js`:
```javascript
this.buildingCoordinates = {
  "your building": [longitude, latitude],
  // ... existing buildings
};
```

#### 6.2 Adding New Permit Types
Edit `query_parser.js`:
```javascript
this.permitTypes = {
  "your type": "YourType",
  // ... existing types
};
```

#### 6.3 Adding New Parking Lots
Edit `database_setup.js` in the `insertSampleData()` method:
```javascript
{
  name: "Your Parking Lot",
  campus: "Tempe",
  location: { type: "Point", coordinates: [longitude, latitude] },
  // ... other attributes
}
```

### Step 7: Understanding the MongoDB Queries

#### 7.1 $near Query Example
```javascript
// Find nearest parking within 1000m
db.parking_lots.find({
  location: {
    $near: {
      $geometry: { type: "Point", coordinates: [-111.9389, 33.4205] },
      $maxDistance: 1000
    }
  }
})
```

#### 7.2 $geoNear Aggregation Example
```javascript
// Find parking with distance calculations
db.parking_lots.aggregate([
  {
    $geoNear: {
      near: { type: "Point", coordinates: [-111.9320, 33.4210] },
      distanceField: "distance",
      maxDistance: 2000,
      spherical: true
    }
  }
])
```

#### 7.3 Combined Filtering Example
```javascript
// Find visitor parking with EV charging near Memorial Union
db.parking_lots.find({
  location: {
    $near: {
      $geometry: { type: "Point", coordinates: [-111.9389, 33.4205] },
      $maxDistance: 1000
    }
  },
  permitType: "Visitor",
  hasEVChargers: true,
  currentAvailability: { $gt: 0 }
})
```

### Step 8: Troubleshooting

#### 8.1 Common Issues and Solutions

**MongoDB Connection Error:**
```bash
# Check if MongoDB is running
brew services list | grep mongodb
# Or
ps aux | grep mongod

# Start MongoDB if not running
brew services start mongodb-community
```

**No Results Found:**
- Check coordinates are correct
- Verify distance parameters
- Ensure sample data was inserted

**Natural Language Parsing Issues:**
- Use supported keywords
- Check building names in coordinates mapping
- Verify query format

#### 8.2 Debug Mode
Add console.log statements in the code to debug:
```javascript
console.log('Query criteria:', criteria);
console.log('MongoDB query:', query);
console.log('Results:', results);
```

### Step 9: Extending the Project

#### 9.1 Add Real-Time Updates
```javascript
// Connect to parking sensors or API
setInterval(async () => {
  const realTimeData = await fetchParkingData();
  await updateParkingAvailability(realTimeData);
}, 30000); // Update every 30 seconds
```

#### 9.2 Add Web Interface
```javascript
// Use Express.js to create REST API
const express = require('express');
const app = express();

app.get('/api/parking/search', async (req, res) => {
  const criteria = queryParser.parseQuery(req.query.q);
  const results = await geospatialQueries.findParkingWithFilters(criteria);
  res.json(results);
});
```

#### 9.3 Add More Geospatial Features
```javascript
// Add route optimization
async function findOptimalParkingRoute(startLocation, destination) {
  // Implement route finding algorithm
}

// Add parking density analysis
async function getParkingDensity(area) {
  // Analyze parking density in specific areas
}
```

### Step 10: Performance Optimization

#### 10.1 Index Optimization
```javascript
// Create compound indexes for common queries
db.parking_lots.createIndex({ 
  "campus": 1, 
  "permitType": 1, 
  "currentAvailability": 1 
});

// Create text index for building names
db.parking_lots.createIndex({ 
  "buildingNearby": "text" 
});
```

#### 10.2 Query Optimization
```javascript
// Limit results to improve performance
db.parking_lots.find(query).limit(10);

// Use projection to return only needed fields
db.parking_lots.find(query, { 
  name: 1, 
  currentAvailability: 1, 
  location: 1 
});
```

## 🎉 Success Criteria

Your implementation is successful when:
1. ✅ All tests pass (`npm test`)
2. ✅ Natural language queries work correctly
3. ✅ All geospatial operators function properly
4. ✅ Time-based filtering works
5. ✅ Interactive mode responds correctly
6. ✅ Sample data is properly inserted
7. ✅ MongoDB indexes are created
8. ✅ All README use cases work

## 📚 Next Steps

1. **Deploy to Production**: Set up MongoDB Atlas for cloud deployment
2. **Add Authentication**: Implement user authentication for different user types
3. **Create Mobile App**: Build a mobile interface for students
4. **Add Analytics**: Track parking usage patterns
5. **Integrate with Maps**: Add visual map interface
6. **Real-Time Updates**: Connect to actual parking sensors
7. **Machine Learning**: Predict parking availability

This implementation provides a complete, working solution for the ASU Smart Parking Query Project using MongoDB geospatial queries and natural language processing!
