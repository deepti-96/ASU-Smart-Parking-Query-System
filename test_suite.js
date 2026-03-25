// ASU Smart Parking Test Suite
// Comprehensive tests for all geospatial query functionality

const ParkingDatabase = require('./database_setup');
const GeospatialQueries = require('./geospatial_queries');
const ParkingQueryParser = require('./query_parser');

class ParkingTestSuite {
    constructor() {
        this.database = new ParkingDatabase();
        this.geospatialQueries = null;
        this.queryParser = new ParkingQueryParser();
        this.testResults = {
            passed: 0,
            failed: 0,
            total: 0
        };
    }

    async initialize() {
        try {
            console.log('🧪 Initializing Test Suite...\n');
            await this.database.connect();
            await this.database.createIndexes();
            await this.database.clearData();
            await this.database.insertSampleData();
            this.geospatialQueries = new GeospatialQueries(this.database.db);
            console.log('✅ Test environment ready\n');
        } catch (error) {
            console.error('❌ Test initialization failed:', error);
            throw error;
        }
    }

    // Test helper function
    async runTest(testName, testFunction) {
        this.testResults.total++;
        try {
            console.log(`Testing: ${testName}`);
            await testFunction();
            console.log(`✅ PASSED: ${testName}\n`);
            this.testResults.passed++;
        } catch (error) {
            console.log(`❌ FAILED: ${testName} - ${error.message}\n`);
            this.testResults.failed++;
        }
    }

    // Test geospatial operators
    async testGeospatialOperators() {
        await this.runTest('$near operator', async () => {
            const results = await this.geospatialQueries.findNearestParking(-111.9389, 33.4205, 1000);
            if (results.length === 0) {
                throw new Error('No results found for $near query');
            }
            console.log(`   Found ${results.length} lots within 1000m of Memorial Union`);
        });

        await this.runTest('$geoNear aggregation', async () => {
            const results = await this.geospatialQueries.findParkingWithDistance(-111.9320, 33.4210, 2000);
            if (results.length === 0) {
                throw new Error('No results found for $geoNear query');
            }
            if (!results[0].distance) {
                throw new Error('Distance field not included in results');
            }
            console.log(`   Found ${results.length} lots with distance calculations`);
        });

        await this.runTest('$geoWithin operator', async () => {
            const polygon = {
                type: "Polygon",
                coordinates: [[
                    [-111.9500, 33.4000],
                    [-111.9200, 33.4000],
                    [-111.9200, 33.4400],
                    [-111.9500, 33.4400],
                    [-111.9500, 33.4000]
                ]]
            };
            const results = await this.geospatialQueries.findParkingInZone(polygon);
            if (results.length === 0) {
                throw new Error('No results found for $geoWithin query');
            }
            console.log(`   Found ${results.length} lots within polygon`);
        });
    }

    // Test attribute filtering
    async testAttributeFiltering() {
        await this.runTest('Permit type filtering', async () => {
            const results = await this.geospatialQueries.findParkingWithFilters({
                permitType: "Visitor"
            });
            if (results.length === 0) {
                throw new Error('No visitor parking found');
            }
            const allVisitor = results.every(lot => lot.permitType === "Visitor");
            if (!allVisitor) {
                throw new Error('Not all results are visitor parking');
            }
            console.log(`   Found ${results.length} visitor parking lots`);
        });

        await this.runTest('EV charging filtering', async () => {
            const results = await this.geospatialQueries.findParkingWithFilters({
                hasEVChargers: true
            });
            if (results.length === 0) {
                throw new Error('No EV charging lots found');
            }
            const allEV = results.every(lot => lot.hasEVChargers === true);
            if (!allEV) {
                throw new Error('Not all results have EV charging');
            }
            console.log(`   Found ${results.length} lots with EV charging`);
        });

        await this.runTest('Availability filtering', async () => {
            const results = await this.geospatialQueries.findParkingWithFilters({
                minAvailability: 20
            });
            if (results.length === 0) {
                throw new Error('No lots with >20 spots found');
            }
            const allAvailable = results.every(lot => lot.currentAvailability >= 20);
            if (!allAvailable) {
                throw new Error('Not all results have >=20 available spots');
            }
            console.log(`   Found ${results.length} lots with >=20 available spots`);
        });

        await this.runTest('ADA spaces filtering', async () => {
            const results = await this.geospatialQueries.findParkingWithFilters({
                adaSpaces: 1
            });
            if (results.length === 0) {
                throw new Error('No lots with ADA spaces found');
            }
            const allADA = results.every(lot => lot.adaSpaces >= 1);
            if (!allADA) {
                throw new Error('Not all results have ADA spaces');
            }
            console.log(`   Found ${results.length} lots with ADA spaces`);
        });
    }

    // Test natural language parsing
    async testNaturalLanguageParsing() {
        const testCases = [
            {
                query: "Find the nearest visitor parking to the Memorial Union.",
                expected: {
                    longitude: -111.9389,
                    latitude: 33.4205,
                    permitType: "Visitor"
                }
            },
            {
                query: "Show lots within 500 meters of the BYENG building with >20 open spots.",
                expected: {
                    longitude: -111.9320,
                    latitude: 33.4210,
                    maxDistance: 500,
                    minAvailability: 20
                }
            },
            {
                query: "List EV-charging parking within 1 km of West campus library.",
                expected: {
                    longitude: -112.1740,
                    latitude: 33.6080,
                    maxDistance: 1000,
                    hasEVChargers: true
                }
            }
        ];

        for (let i = 0; i < testCases.length; i++) {
            const testCase = testCases[i];
            await this.runTest(`Natural language parsing test ${i + 1}`, async () => {
                const result = this.queryParser.parseQuery(testCase.query);
                
                for (const [key, expectedValue] of Object.entries(testCase.expected)) {
                    if (result[key] !== expectedValue) {
                        throw new Error(`Expected ${key}=${expectedValue}, got ${result[key]}`);
                    }
                }
                console.log(`   Parsed: "${testCase.query}"`);
            });
        }
    }

    // Test time-based filtering
    async testTimeBasedFiltering() {
        await this.runTest('Time-based availability', async () => {
            const testTime = new Date('2024-01-15T10:00:00'); // Monday 10 AM
            const results = await this.geospatialQueries.findAvailableParkingAtTime({
                campus: "Tempe"
            }, testTime);
            
            if (results.length === 0) {
                throw new Error('No lots available at test time');
            }
            
            // Check that all results are available at the test time
            const allAvailable = results.every(lot => 
                this.geospatialQueries.isParkingAvailableAtTime(lot, testTime)
            );
            if (!allAvailable) {
                throw new Error('Not all results are available at the test time');
            }
            console.log(`   Found ${results.length} lots available at ${testTime.toLocaleString()}`);
        });
    }

    // Test specific use cases from README
    async testReadmeUseCases() {
        await this.runTest('Use case 1: Memorial Union visitor parking', async () => {
            const results = await this.geospatialQueries.findParkingWithFilters({
                longitude: -111.9389,
                latitude: 33.4205,
                permitType: "Visitor",
                maxDistance: 1000
            });
            if (results.length === 0) {
                throw new Error('No visitor parking found near Memorial Union');
            }
            console.log(`   Found ${results.length} visitor lots near Memorial Union`);
        });

        await this.runTest('Use case 2: BYENG lots with >20 spots', async () => {
            const results = await this.geospatialQueries.findParkingWithFilters({
                longitude: -111.9320,
                latitude: 33.4210,
                maxDistance: 500,
                minAvailability: 20
            });
            if (results.length === 0) {
                throw new Error('No lots found near BYENG with >20 spots');
            }
            console.log(`   Found ${results.length} lots near BYENG with >20 spots`);
        });

        await this.runTest('Use case 3: Polytechnic evening parking', async () => {
            const eveningTime = new Date('2024-01-15T18:00:00'); // 6 PM
            const results = await this.geospatialQueries.findAvailableParkingAtTime({
                campus: "Polytechnic",
                permitType: "Hourly"
            }, eveningTime);
            if (results.length === 0) {
                throw new Error('No hourly parking available at Poly after 6 PM');
            }
            console.log(`   Found ${results.length} hourly lots at Poly after 6 PM`);
        });

        await this.runTest('Use case 4: West campus EV parking', async () => {
            const results = await this.geospatialQueries.findParkingWithFilters({
                longitude: -112.1740,
                latitude: 33.6080,
                maxDistance: 1000,
                hasEVChargers: true
            });
            if (results.length === 0) {
                throw new Error('No EV charging lots found near West campus library');
            }
            console.log(`   Found ${results.length} EV charging lots near West campus library`);
        });

        await this.runTest('Use case 5: Downtown Tempe ADA parking', async () => {
            const results = await this.geospatialQueries.findParkingWithFilters({
                zones: ["Downtown Tempe"],
                adaSpaces: 1,
                currentAvailability: 1
            });
            if (results.length === 0) {
                throw new Error('No ADA parking found in Downtown Tempe');
            }
            console.log(`   Found ${results.length} ADA lots in Downtown Tempe`);
        });
    }

    // Test data integrity
    async testDataIntegrity() {
        await this.runTest('Data integrity check', async () => {
            const allLots = await this.geospatialQueries.collection.find({}).toArray();
            
            if (allLots.length === 0) {
                throw new Error('No parking lots found in database');
            }
            
            // Check required fields
            for (const lot of allLots) {
                if (!lot.name || !lot.campus || !lot.location || !lot.capacity) {
                    throw new Error('Missing required fields in parking lot data');
                }
                
                if (lot.currentAvailability < 0 || lot.currentAvailability > lot.capacity) {
                    throw new Error('Invalid availability data');
                }
                
                if (!lot.location.coordinates || lot.location.coordinates.length !== 2) {
                    throw new Error('Invalid location coordinates');
                }
            }
            
            console.log(`   Validated ${allLots.length} parking lots`);
        });
    }

    // Run all tests
    async runAllTests() {
        try {
            await this.initialize();
            
            console.log('=== RUNNING COMPREHENSIVE TEST SUITE ===\n');
            
            await this.testGeospatialOperators();
            await this.testAttributeFiltering();
            await this.testNaturalLanguageParsing();
            await this.testTimeBasedFiltering();
            await this.testReadmeUseCases();
            await this.testDataIntegrity();
            
            console.log('=== TEST RESULTS SUMMARY ===');
            console.log(`Total Tests: ${this.testResults.total}`);
            console.log(`Passed: ${this.testResults.passed}`);
            console.log(`Failed: ${this.testResults.failed}`);
            console.log(`Success Rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(1)}%`);
            
            if (this.testResults.failed === 0) {
                console.log('\n🎉 ALL TESTS PASSED! The ASU Smart Parking Query System is working correctly.');
            } else {
                console.log('\n⚠️  Some tests failed. Please review the errors above.');
            }
            
        } catch (error) {
            console.error('Test suite error:', error);
        } finally {
            await this.cleanup();
        }
    }

    async cleanup() {
        try {
            await this.database.disconnect();
            console.log('\n✅ Test cleanup completed');
        } catch (error) {
            console.error('Error during cleanup:', error);
        }
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const testSuite = new ParkingTestSuite();
    testSuite.runAllTests().catch(console.error);
}

module.exports = ParkingTestSuite;
