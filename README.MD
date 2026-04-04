# ASU Smart Parking

This project focuses on translating natural-language questions about parking availability at Arizona State University into functional MongoDB geospatial queries.

## Problem Statement

The ASU Parking & Transit IT Team manages parking lots and structures across the Tempe, Polytechnic, and West campuses. Each lot/garage has a precise geolocation and attributes (capacity, current availability, permit type, EV chargers, ADA spaces, hourly vs. permit, time windows). Data is stored in MongoDB with GeoJSON and 2dsphere indexes.

Students, staff, and visitors want to ask natural-language questions like:
* "Find the nearest visitor parking to the Memorial Union."
* "Show lots within 500 meters of the BYENG building with >20 open spots."
* "Where can I park after 6 pm near Poly that doesn't require a permit?"
* "List EV-charging parking within 1 km of West campus library."
* "Which garage inside Downtown Tempe zone has ADA spaces available now?"

## Project Goal

The team needs to translate these natural language questions into MongoDB geospatial queries using operators like `$near`, `$geoNear`, `$geoWithin`, and `$geoIntersects`. These queries must also be combined with attribute filters for availability, permit rules, and time-based access.

## Quick Start

### Prerequisites
- Node.js (version 14 or higher)
- MongoDB (running locally on port 27017)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install dotenv for environment variable support:**
   ```bash
   npm install dotenv
   ```

2. **Set up the database:**
   ```bash
   npm run setup
   ```

3. **Run the application:**
   ```bash
   npm start
   ```

4. **Run tests:**
   ```bash
   npm test
   ```

## Project Structure

```
ASU_Parking_Lot/
├── app.js                 # Main application file
├── database_setup.js      # Database schema and sample data
├── geospatial_queries.js  # MongoDB geospatial query functions
├── query_parser.js        # Natural language processing
├── test_suite.js          # Comprehensive test suite
├── setup_database.js      # Database initialization script
├── package.json           # Dependencies and scripts
└── README.MD             # This file
```

## Database Schema

The parking lots are stored in a MongoDB collection with the following schema:

```javascript
{
  _id: ObjectId,
  name: String,                    // "Lot 59", "Fulton Center Garage"
  campus: String,                  // "Tempe", "Polytechnic", "West"
  location: {
    type: "Point",
    coordinates: [longitude, latitude]  // GeoJSON Point
  },
  capacity: Number,                // Total parking spots
  currentAvailability: Number,     // Currently available spots
  permitType: String,             // "Student", "Faculty", "Visitor", "Hourly"
  hasEVChargers: Boolean,         // Electric vehicle charging available
  adaSpaces: Number,              // ADA accessible spaces
  hourlyRate: Number,             // Cost per hour (if applicable)
  timeWindows: [                  // When parking is available
    {
      dayOfWeek: String,          // "Monday", "Tuesday", etc.
      startTime: String,          // "06:00"
      endTime: String             // "22:00"
    }
  ],
  zones: [String],                // "Downtown Tempe", "Central Campus", etc.
  buildingNearby: String,         // "Memorial Union", "BYENG", etc.
  lastUpdated: Date               // When availability was last updated
}
```

## Geospatial Query Operators

This project demonstrates all major MongoDB geospatial operators:

### 1. `$near` - Find nearest parking
```javascript
db.parking_lots.find({
  location: {
    $near: {
      $geometry: { type: "Point", coordinates: [longitude, latitude] },
      $maxDistance: 1000
    }
  }
})
```

### 2. `$geoNear` - Aggregation with distance
```javascript
db.parking_lots.aggregate([
  {
    $geoNear: {
      near: { type: "Point", coordinates: [longitude, latitude] },
      distanceField: "distance",
      maxDistance: 1000,
      spherical: true
    }
  }
])
```

### 3. `$geoWithin` - Find parking in specific areas
```javascript
db.parking_lots.find({
  location: {
    $geoWithin: {
      $geometry: polygonGeometry
    }
  }
})
```

### 4. `$geoIntersects` - Complex geometry intersections
```javascript
db.parking_lots.find({
  location: {
    $geoIntersects: {
      $geometry: complexGeometry
    }
  }
})
```

## Natural Language Processing

The system can parse natural language queries and convert them to MongoDB queries:

### Example Queries:
- "Find the nearest visitor parking to the Memorial Union"
- "Show lots within 500 meters of the BYENG building with >20 open spots"
- "Where can I park after 6 pm near Poly that doesn't require a permit?"
- "List EV-charging parking within 1 km of West campus library"
- "Which garage inside Downtown Tempe zone has ADA spaces available now?"

### Supported Keywords:
- **Locations**: Memorial Union, BYENG, West campus library, Polytechnic, Downtown Tempe
- **Distances**: "500 meters", "1 km", "within 1000m"
- **Availability**: ">20 open spots", "more than 10", "at least 5"
- **Permit Types**: "visitor", "student", "faculty", "hourly", "no permit"
- **Features**: "EV charging", "electric", "ADA", "accessible"
- **Time**: "after 6 pm", "before 8 am", "at 2 pm"

## Time-Based Filtering

The system supports time-based availability checking:

```javascript
// Check if parking is available at specific time
const isAvailable = isParkingAvailableAtTime(parkingLot, new Date('2024-01-15T18:00:00'));

// Find parking available at specific time
const available = await findAvailableParkingAtTime(criteria, targetTime);
```

## Testing

Run the comprehensive test suite:

```bash
npm test
```

The test suite includes:
- Geospatial operator tests
- Attribute filtering tests
- Natural language parsing tests
- Time-based filtering tests
- README use case validation
- Data integrity checks

## Interactive Mode

The application includes an interactive mode where you can:
- Enter natural language queries
- View parking statistics
- Simulate real-time updates
- Test different scenarios

## Sample Data

The system includes sample data for:
- **Tempe Campus**: Memorial Union, BYENG, Fulton Center, Downtown Tempe
- **Polytechnic Campus**: Student Union area
- **West Campus**: Library area

Each parking lot includes realistic attributes like capacity, availability, permit types, EV charging, and ADA spaces.

## Customization

### Adding New Buildings
Update the `buildingCoordinates` object in `query_parser.js`:

```javascript
this.buildingCoordinates = {
  "new building": [longitude, latitude],
  // ... existing buildings
};
```

### Adding New Permit Types
Update the `permitTypes` object in `query_parser.js`:

```javascript
this.permitTypes = {
  "new type": "NewType",
  // ... existing types
};
```

### Adding New Zones
Update the `zones` object in `query_parser.js`:

```javascript
this.zones = {
  "new zone": "New Zone",
  // ... existing zones
};
```

## Troubleshooting

### Common Issues:

1. **MongoDB Connection Error**
   - Ensure MongoDB is running on localhost:27017
   - Check if the database name is available

2. **No Results Found**
   - Verify the coordinates are correct
   - Check if the distance parameters are reasonable
   - Ensure sample data was inserted properly

3. **Natural Language Parsing Issues**
   - Use supported keywords and phrases
   - Check the building names in the coordinates mapping
   - Verify the query format

## Performance Considerations

- Geospatial indexes are created automatically
- Compound indexes optimize common query patterns
- Distance calculations use spherical geometry
- Results are limited to reasonable distances by default

## Contributing

To extend this project:
1. Add new geospatial query patterns
2. Enhance natural language processing
3. Add more campus locations
4. Implement real-time data updates
5. Create a web interface

## License

MIT License - See package.json for details
