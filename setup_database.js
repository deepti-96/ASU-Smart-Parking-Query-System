// ASU Smart Parking Database Setup Script
// Run this script to initialize the database with sample data

const ParkingDatabase = require('./database_setup');

async function setupDatabase() {
    const database = new ParkingDatabase();
    
    try {
        console.log('🚀 Setting up ASU Smart Parking Database...\n');
        
        // Connect to database
        await database.connect();
        
        // Create indexes
        console.log('Creating geospatial indexes...');
        await database.createIndexes();
        
        // Clear existing data
        console.log('Clearing existing data...');
        await database.clearData();
        
        // Insert sample data
        console.log('Inserting sample parking lot data...');
        await database.insertSampleData();
        
        console.log('\n✅ Database setup completed successfully!');
        console.log('\nYou can now run:');
        console.log('  npm start     - to run the main application');
        console.log('  npm test      - to run the test suite');
        
    } catch (error) {
        console.error('❌ Database setup failed:', error);
        process.exit(1);
    } finally {
        await database.disconnect();
    }
}

// Run setup if this file is executed directly
if (require.main === module) {
    setupDatabase().catch(console.error);
}

module.exports = setupDatabase;
