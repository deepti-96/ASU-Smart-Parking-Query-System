// ASU Smart Parking Query Application
// Main application file that demonstrates all geospatial query capabilities

const ParkingDatabase = require('./database_setup');
const GeospatialQueries = require('./geospatial_queries');
const ParkingQueryParser = require('./query_parser');

class ASUParkingApp {
    constructor() {
        this.database = new ParkingDatabase();
        this.geospatialQueries = null;
        this.queryParser = new ParkingQueryParser();
    }

    async initialize() {
        try {
            console.log('Initializing ASU Smart Parking Query System...\n');
            
            // Connect to database
            await this.database.connect();
            
            // Create indexes
            await this.database.createIndexes();
            
            // Clear existing data and insert sample data
            await this.database.clearData();
            await this.database.insertSampleData();
            
            // Initialize geospatial queries
            this.geospatialQueries = new GeospatialQueries(this.database.db);
            
            console.log('System initialized successfully!\n');
        } catch (error) {
            console.error('Initialization failed:', error);
            throw error;
        }
    }

    // Demonstrate all geospatial operators
    async demonstrateGeospatialOperators() {
        console.log('=== GEOSPATIAL OPERATORS DEMONSTRATION ===\n');
        
        try {
            // 1. $near operator
            console.log('1. $near - Find nearest parking to Memorial Union:');
            const nearest = await this.geospatialQueries.findNearestParking(-111.9389, 33.4205, 1000);
            nearest.forEach((lot, index) => {
                console.log(`   ${index + 1}. ${lot.name} (${lot.campus})`);
            });
            console.log('');

            // 2. $geoNear aggregation
            console.log('2. $geoNear - Find parking with distances from BYENG:');
            const withDistance = await this.geospatialQueries.findParkingWithDistance(-111.9320, 33.4210, 2000);
            withDistance.forEach((lot, index) => {
                console.log(`   ${index + 1}. ${lot.name} - ${Math.round(lot.distance)}m away`);
            });
            console.log('');

            // 3. $geoWithin operator (using a simple polygon around Tempe campus)
            console.log('3. $geoWithin - Find parking within Tempe campus area:');
            const tempePolygon = {
                type: "Polygon",
                coordinates: [[
                    [-111.9500, 33.4000],
                    [-111.9200, 33.4000],
                    [-111.9200, 33.4400],
                    [-111.9500, 33.4400],
                    [-111.9500, 33.4000]
                ]]
            };
            const inZone = await this.geospatialQueries.findParkingInZone(tempePolygon);
            inZone.forEach((lot, index) => {
                console.log(`   ${index + 1}. ${lot.name} (${lot.campus})`);
            });
            console.log('');

        } catch (error) {
            console.error('Error in geospatial operators demonstration:', error);
        }
    }

    // Demonstrate specific use cases from README
    async demonstrateUseCases() {
        console.log('=== SPECIFIC USE CASES FROM README ===\n');
        
        try {
            // Use case 1: Find the nearest visitor parking to the Memorial Union
            console.log('1. Find the nearest visitor parking to the Memorial Union:');
            const memorialUnion = await this.geospatialQueries.findParkingWithFilters({
                longitude: -111.9389,
                latitude: 33.4205,
                permitType: "Visitor",
                maxDistance: 1000
            });
            memorialUnion.forEach((lot, index) => {
                console.log(`   ${index + 1}. ${lot.name} - ${lot.currentAvailability}/${lot.capacity} available`);
            });
            console.log('');

            // Use case 2: Show lots within 500 meters of the BYENG building with >20 open spots
            console.log('2. Show lots within 500 meters of the BYENG building with >20 open spots:');
            const byengLots = await this.geospatialQueries.findParkingWithFilters({
                longitude: -111.9320,
                latitude: 33.4210,
                maxDistance: 500,
                minAvailability: 20
            });
            byengLots.forEach((lot, index) => {
                console.log(`   ${index + 1}. ${lot.name} - ${lot.currentAvailability}/${lot.capacity} available`);
            });
            console.log('');

            // Use case 3: Where can I park after 6 pm near Poly that doesn't require a permit?
            console.log('3. Where can I park after 6 pm near Poly that doesn\'t require a permit?');
            const eveningTime = new Date();
            eveningTime.setHours(18, 0, 0, 0); // 6 PM
            const polyEvening = await this.geospatialQueries.findAvailableParkingAtTime({
                campus: "Polytechnic",
                permitType: "Hourly"
            }, eveningTime);
            polyEvening.forEach((lot, index) => {
                console.log(`   ${index + 1}. ${lot.name} - ${lot.currentAvailability}/${lot.capacity} available`);
            });
            console.log('');

            // Use case 4: List EV-charging parking within 1 km of West campus library
            console.log('4. List EV-charging parking within 1 km of West campus library:');
            const westEVParking = await this.geospatialQueries.findParkingWithFilters({
                longitude: -112.1740,
                latitude: 33.6080,
                maxDistance: 1000,
                hasEVChargers: true
            });
            westEVParking.forEach((lot, index) => {
                console.log(`   ${index + 1}. ${lot.name} - ${lot.currentAvailability}/${lot.capacity} available (EV Charging)`);
            });
            console.log('');

            // Use case 5: Which garage inside Downtown Tempe zone has ADA spaces available now?
            console.log('5. Which garage inside Downtown Tempe zone has ADA spaces available now?');
            const downtownADA = await this.geospatialQueries.findParkingWithFilters({
                zones: ["Downtown Tempe"],
                adaSpaces: 1,
                currentAvailability: 1
            });
            downtownADA.forEach((lot, index) => {
                console.log(`   ${index + 1}. ${lot.name} - ${lot.currentAvailability}/${lot.capacity} available (${lot.adaSpaces} ADA spaces)`);
            });
            console.log('');

        } catch (error) {
            console.error('Error in use cases demonstration:', error);
        }
    }

    // Demonstrate natural language processing
    async demonstrateNaturalLanguageProcessing() {
        console.log('=== NATURAL LANGUAGE PROCESSING DEMONSTRATION ===\n');
        
        try {
            await this.queryParser.processExampleQueries(this.geospatialQueries);
        } catch (error) {
            console.error('Error in natural language processing demonstration:', error);
        }
    }

    // Demonstrate time-based filtering
    async demonstrateTimeBasedFiltering() {
        console.log('=== TIME-BASED FILTERING DEMONSTRATION ===\n');
        
        try {
            // Test different times
            const testTimes = [
                new Date('2024-01-15T08:00:00'), // 8 AM Monday
                new Date('2024-01-15T14:00:00'), // 2 PM Monday
                new Date('2024-01-15T20:00:00'), // 8 PM Monday
                new Date('2024-01-13T10:00:00')  // 10 AM Saturday
            ];

            for (const testTime of testTimes) {
                console.log(`Testing availability at ${testTime.toLocaleString()}:`);
                const available = await this.geospatialQueries.findAvailableParkingAtTime({
                    campus: "Tempe"
                }, testTime);
                
                console.log(`   Found ${available.length} lots available at this time`);
                available.forEach((lot, index) => {
                    console.log(`   ${index + 1}. ${lot.name} - ${lot.currentAvailability}/${lot.capacity} available`);
                });
                console.log('');
            }

        } catch (error) {
            console.error('Error in time-based filtering demonstration:', error);
        }
    }

    // Interactive query interface
    async startInteractiveMode() {
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        console.log('=== INTERACTIVE QUERY MODE ===\n');
        console.log('Enter natural language queries or commands:');
        console.log('- Type "stats" to see parking statistics');
        console.log('- Type "update" to simulate parking updates');
        console.log('- Type "disconnect" to disconnect from the database');
        console.log('- Type "exit" to quit\n');

        const askQuestion = () => {
            rl.question('Query: ', async (input) => {
                if (input.toLowerCase() === 'exit') {
                    rl.close();
                    return;
                }

                try {
                    if (input.toLowerCase() === 'disconnect') {
                        await this.database.disconnect();
                        console.log('Cleanup completed');
                    } else if (input.toLowerCase() === 'stats') {
                        await this.geospatialQueries.getParkingStatistics();
                    } else if (input.toLowerCase() === 'update') {
                        await this.geospatialQueries.simulateParkingUpdates();
                        console.log('Parking availability updated!\n');
                    } else {
                        const criteria = this.queryParser.parseQuery(input);
                        let results;
                        
                        if (criteria.targetTime) {
                            results = await this.geospatialQueries.findAvailableParkingAtTime(criteria, criteria.targetTime);
                        } else {
                            results = await this.geospatialQueries.findParkingWithFilters(criteria);
                        }
                        
                        console.log(`\nFound ${results.length} parking lots:`);
                        results.forEach((lot, index) => {
                            console.log(`${index + 1}. ${lot.name} (${lot.campus})`);
                            console.log(`   Availability: ${lot.currentAvailability}/${lot.capacity}`);
                            console.log(`   Permit Type: ${lot.permitType}`);
                            if (lot.hasEVChargers) console.log(`   ⚡ EV Charging Available`);
                            if (lot.adaSpaces > 0) console.log(`   ♿ ${lot.adaSpaces} ADA Spaces`);
                            if (lot.distance) console.log(`   📍 Distance: ${Math.round(lot.distance)}m`);
                            console.log('');
                        });
                    }
                } catch (error) {
                    console.log(`Error: ${error.message}\n`);
                }

                askQuestion();
            });
        };

        askQuestion();
    }

    // Run all demonstrations
    async runAllDemonstrations() {
        try {
            await this.demonstrateGeospatialOperators();
            await this.demonstrateUseCases();
            await this.demonstrateNaturalLanguageProcessing();
            await this.demonstrateTimeBasedFiltering();
            
            console.log('=== ALL DEMONSTRATIONS COMPLETED ===\n');
            console.log('Starting interactive mode...\n');
            await this.startInteractiveMode();
            
        } catch (error) {
            console.error('Error running demonstrations:', error);
        }
    }

    async cleanup() {
        try {
            await this.database.disconnect();
            console.log('Cleanup completed');
        } catch (error) {
            console.error('Error during cleanup:', error);
        }
    }
}

// Main execution
async function main() {
    const app = new ASUParkingApp();
    
    try {
        await app.initialize();
        await app.runAllDemonstrations();
    } catch (error) {
        console.error('Application error:', error);
    } finally {
        // await app.cleanup();
    }
}

// Run the application if this file is executed directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = ASUParkingApp;
