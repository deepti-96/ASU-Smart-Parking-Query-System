// ASU Smart Parking Database Setup
// This file contains the MongoDB schema and initial setup

const { MongoClient } = require('mongodb');

// Database connection
require('dotenv').config();
const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = 'asu_parking';

class ParkingDatabase {
    constructor() {
        this.client = null;
        this.db = null;
    }

    async connect() {
        try {
            this.client = new MongoClient(MONGODB_URI);
            await this.client.connect();
            this.db = this.client.db(DATABASE_NAME);
            console.log('Connected to MongoDB');
            return this.db;
        } catch (error) {
            console.error('Database connection failed:', error);
            throw error;
        }
    }

    async disconnect() {
        if (this.client) {
            await this.client.close();
            console.log('Disconnected from MongoDB');
        }
    }

    // Create geospatial indexes
    async createIndexes() {
        const collection = this.db.collection('parking_lots');
        
        try {
            // Create 2dsphere index for geospatial queries
            await collection.createIndex({ "location": "2dsphere" });
            console.log('Created 2dsphere index on location field');

            // Create compound indexes for common query patterns
            await collection.createIndex({ "campus": 1, "permitType": 1 });
            await collection.createIndex({ "hasEVChargers": 1, "currentAvailability": 1 });
            await collection.createIndex({ "adaSpaces": 1, "currentAvailability": 1 });
            await collection.createIndex({ "zones": 1, "currentAvailability": 1 });
            await collection.createIndex({ "buildingNearby": 1 });
            
            console.log('All indexes created successfully');
        } catch (error) {
            console.error('Error creating indexes:', error);
            throw error;
        }
    }

    // Insert sample parking lot data
    async insertSampleData() {
        const collection = this.db.collection('parking_lots');
        
        const sampleParkingLots = [
            // Tempe Campus - Memorial Union Area
            {
                name: "Lot 59 - Memorial Union",
                campus: "Tempe",
                location: { type: "Point", coordinates: [-111.9389, 33.4205] },
                capacity: 200,
                currentAvailability: 45,
                permitType: "Visitor",
                hasEVChargers: true,
                adaSpaces: 8,
                hourlyRate: 2.50,
                timeWindows: [
                    { dayOfWeek: "Monday", startTime: "06:00", endTime: "22:00" },
                    { dayOfWeek: "Tuesday", startTime: "06:00", endTime: "22:00" },
                    { dayOfWeek: "Wednesday", startTime: "06:00", endTime: "22:00" },
                    { dayOfWeek: "Thursday", startTime: "06:00", endTime: "22:00" },
                    { dayOfWeek: "Friday", startTime: "06:00", endTime: "22:00" },
                    { dayOfWeek: "Saturday", startTime: "08:00", endTime: "20:00" },
                    { dayOfWeek: "Sunday", startTime: "08:00", endTime: "20:00" }
                ],
                zones: ["Central Campus"],
                buildingNearby: "Memorial Union",
                lastUpdated: new Date()
            },
            {
                name: "Fulton Center Garage",
                campus: "Tempe",
                location: { type: "Point", coordinates: [-111.9320, 33.4210] },
                capacity: 500,
                currentAvailability: 120,
                permitType: "Student",
                hasEVChargers: true,
                adaSpaces: 15,
                hourlyRate: 0,
                timeWindows: [
                    { dayOfWeek: "Monday", startTime: "06:00", endTime: "22:00" },
                    { dayOfWeek: "Tuesday", startTime: "06:00", endTime: "22:00" },
                    { dayOfWeek: "Wednesday", startTime: "06:00", endTime: "22:00" },
                    { dayOfWeek: "Thursday", startTime: "06:00", endTime: "22:00" },
                    { dayOfWeek: "Friday", startTime: "06:00", endTime: "22:00" },
                    { dayOfWeek: "Saturday", startTime: "08:00", endTime: "20:00" },
                    { dayOfWeek: "Sunday", startTime: "08:00", endTime: "20:00" }
                ],
                zones: ["Central Campus"],
                buildingNearby: "BYENG",
                lastUpdated: new Date()
            },
            {
                name: "Lot 40 - BYENG",
                campus: "Tempe",
                location: { type: "Point", coordinates: [-111.9300, 33.4200] },
                capacity: 150,
                currentAvailability: 25,
                permitType: "Student",
                hasEVChargers: false,
                adaSpaces: 5,
                hourlyRate: 0,
                timeWindows: [
                    { dayOfWeek: "Monday", startTime: "06:00", endTime: "22:00" },
                    { dayOfWeek: "Tuesday", startTime: "06:00", endTime: "22:00" },
                    { dayOfWeek: "Wednesday", startTime: "06:00", endTime: "22:00" },
                    { dayOfWeek: "Thursday", startTime: "06:00", endTime: "22:00" },
                    { dayOfWeek: "Friday", startTime: "06:00", endTime: "22:00" },
                    { dayOfWeek: "Saturday", startTime: "08:00", endTime: "20:00" },
                    { dayOfWeek: "Sunday", startTime: "08:00", endTime: "20:00" }
                ],
                zones: ["Central Campus"],
                buildingNearby: "BYENG",
                lastUpdated: new Date()
            },
            // Polytechnic Campus
            {
                name: "Polytechnic Lot 1",
                campus: "Polytechnic",
                location: { type: "Point", coordinates: [-111.6789, 33.3061] },
                capacity: 100,
                currentAvailability: 30,
                permitType: "Hourly",
                hasEVChargers: true,
                adaSpaces: 4,
                hourlyRate: 1.50,
                timeWindows: [
                    { dayOfWeek: "Monday", startTime: "06:00", endTime: "23:00" },
                    { dayOfWeek: "Tuesday", startTime: "06:00", endTime: "23:00" },
                    { dayOfWeek: "Wednesday", startTime: "06:00", endTime: "23:00" },
                    { dayOfWeek: "Thursday", startTime: "06:00", endTime: "23:00" },
                    { dayOfWeek: "Friday", startTime: "06:00", endTime: "23:00" },
                    { dayOfWeek: "Saturday", startTime: "08:00", endTime: "22:00" },
                    { dayOfWeek: "Sunday", startTime: "08:00", endTime: "22:00" }
                ],
                zones: ["Polytechnic Campus"],
                buildingNearby: "Polytechnic Student Union",
                lastUpdated: new Date()
            },
            // West Campus
            {
                name: "West Campus Library Garage",
                campus: "West",
                location: { type: "Point", coordinates: [-112.1740, 33.6080] },
                capacity: 300,
                currentAvailability: 80,
                permitType: "Visitor",
                hasEVChargers: true,
                adaSpaces: 12,
                hourlyRate: 2.00,
                timeWindows: [
                    { dayOfWeek: "Monday", startTime: "06:00", endTime: "22:00" },
                    { dayOfWeek: "Tuesday", startTime: "06:00", endTime: "22:00" },
                    { dayOfWeek: "Wednesday", startTime: "06:00", endTime: "22:00" },
                    { dayOfWeek: "Thursday", startTime: "06:00", endTime: "22:00" },
                    { dayOfWeek: "Friday", startTime: "06:00", endTime: "22:00" },
                    { dayOfWeek: "Saturday", startTime: "08:00", endTime: "20:00" },
                    { dayOfWeek: "Sunday", startTime: "08:00", endTime: "20:00" }
                ],
                zones: ["West Campus"],
                buildingNearby: "West Campus Library",
                lastUpdated: new Date()
            },
            // Downtown Tempe
            {
                name: "Downtown Tempe Garage",
                campus: "Tempe",
                location: { type: "Point", coordinates: [-111.9400, 33.4250] },
                capacity: 400,
                currentAvailability: 95,
                permitType: "Hourly",
                hasEVChargers: true,
                adaSpaces: 20,
                hourlyRate: 3.00,
                timeWindows: [
                    { dayOfWeek: "Monday", startTime: "06:00", endTime: "24:00" },
                    { dayOfWeek: "Tuesday", startTime: "06:00", endTime: "24:00" },
                    { dayOfWeek: "Wednesday", startTime: "06:00", endTime: "24:00" },
                    { dayOfWeek: "Thursday", startTime: "06:00", endTime: "24:00" },
                    { dayOfWeek: "Friday", startTime: "06:00", endTime: "24:00" },
                    { dayOfWeek: "Saturday", startTime: "08:00", endTime: "24:00" },
                    { dayOfWeek: "Sunday", startTime: "08:00", endTime: "24:00" }
                ],
                zones: ["Downtown Tempe"],
                buildingNearby: "Downtown Tempe",
                lastUpdated: new Date()
            }
        ];

        try {
            await collection.insertMany(sampleParkingLots);
            console.log(`Inserted ${sampleParkingLots.length} parking lots`);
        } catch (error) {
            console.error('Error inserting sample data:', error);
            throw error;
        }
    }

    // Clear existing data
    async clearData() {
        const collection = this.db.collection('parking_lots');
        try {
            await collection.deleteMany({});
            console.log('Cleared existing parking lot data');
        } catch (error) {
            console.error('Error clearing data:', error);
            throw error;
        }
    }
}

module.exports = ParkingDatabase;
