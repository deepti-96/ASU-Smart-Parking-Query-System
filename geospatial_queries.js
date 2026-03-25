// ASU Smart Parking Geospatial Queries
// This file contains all MongoDB geospatial query implementations

class GeospatialQueries {
    constructor(database) {
        this.db = database;
        this.collection = this.db.collection('parking_lots');
    }

    // $near query for finding nearest parking
    async findNearestParking(longitude, latitude, maxDistance = 1000) {
        try {
            const results = await this.collection.find({
                location: {
                    $near: {
                        $geometry: { type: "Point", coordinates: [longitude, latitude] },
                        $maxDistance: maxDistance
                    }
                }
            }).toArray();
            
            console.log(`Found ${results.length} parking lots within ${maxDistance}m`);
            return results;
        } catch (error) {
            console.error('Error in findNearestParking:', error);
            throw error;
        }
    }

    // $geoWithin query for specific areas (polygons)
    async findParkingInZone(zonePolygon) {
        try {
            const results = await this.collection.find({
                location: {
                    $geoWithin: {
                        $geometry: zonePolygon
                    }
                }
            }).toArray();
            
            console.log(`Found ${results.length} parking lots within the specified zone`);
            return results;
        } catch (error) {
            console.error('Error in findParkingInZone:', error);
            throw error;
        }
    }

    // $geoNear aggregation for distance-based sorting
    async findParkingWithDistance(longitude, latitude, maxDistance = 1000) {
        try {
            const results = await this.collection.aggregate([
                {
                    $geoNear: {
                        near: { type: "Point", coordinates: [longitude, latitude] },
                        distanceField: "distance",
                        maxDistance: maxDistance,
                        spherical: true
                    }
                },
                {
                    $sort: { distance: 1 }
                }
            ]).toArray();
            
            console.log(`Found ${results.length} parking lots with distances`);
            return results;
        } catch (error) {
            console.error('Error in findParkingWithDistance:', error);
            throw error;
        }
    }

    // $geoIntersects query for complex geometries
    async findParkingIntersecting(geometry) {
        try {
            const results = await this.collection.find({
                location: {
                    $geoIntersects: {
                        $geometry: geometry
                    }
                }
            }).toArray();
            
            console.log(`Found ${results.length} parking lots intersecting with geometry`);
            return results;
        } catch (error) {
            console.error('Error in findParkingIntersecting:', error);
            throw error;
        }
    }

    // Combined geospatial and attribute filtering
    async findParkingWithFilters(criteria) {
        try {
            const query = {};
            
            // Geospatial filter
            if (criteria.longitude && criteria.latitude) {
                query.location = {
                    $near: {
                        $geometry: { 
                            type: "Point", 
                            coordinates: [criteria.longitude, criteria.latitude] 
                        },
                        $maxDistance: criteria.maxDistance || 1000
                    }
                };
            }
            
            // Attribute filters
            if (criteria.minAvailability !== undefined) {
                query.currentAvailability = { $gte: criteria.minAvailability };
            }
            
            if (criteria.permitType) {
                query.permitType = criteria.permitType;
            }
            
            if (criteria.hasEVChargers !== undefined) {
                query.hasEVChargers = criteria.hasEVChargers;
            }
            
            if (criteria.adaSpaces !== undefined) {
                query.adaSpaces = { $gte: criteria.adaSpaces };
            }
            
            if (criteria.campus) {
                query.campus = criteria.campus;
            }
            
            if (criteria.zones) {
                query.zones = { $in: Array.isArray(criteria.zones) ? criteria.zones : [criteria.zones] };
            }
            
            if (criteria.buildingNearby) {
                query.buildingNearby = { $regex: criteria.buildingNearby, $options: 'i' };
            }

            const results = await this.collection.find(query).toArray();
            console.log(`Found ${results.length} parking lots matching criteria`);
            return results;
        } catch (error) {
            console.error('Error in findParkingWithFilters:', error);
            throw error;
        }
    }

    // Time-based availability checking
    isParkingAvailableAtTime(parkingLot, targetTime) {
        const dayOfWeek = targetTime.toLocaleDateString('en-US', { weekday: 'long' });
        const timeString = targetTime.toTimeString().slice(0, 5); // HH:MM format
        
        return parkingLot.timeWindows.some(window => 
            window.dayOfWeek === dayOfWeek &&
            timeString >= window.startTime &&
            timeString <= window.endTime
        );
    }

    // Find parking available at specific time
    async findAvailableParkingAtTime(criteria, targetTime) {
        try {
            const results = await this.findParkingWithFilters(criteria);
            
            const availableResults = results.filter(lot => 
                this.isParkingAvailableAtTime(lot, targetTime) &&
                lot.currentAvailability > 0
            );
            
            console.log(`Found ${availableResults.length} parking lots available at ${targetTime.toLocaleString()}`);
            return availableResults;
        } catch (error) {
            console.error('Error in findAvailableParkingAtTime:', error);
            throw error;
        }
    }

    // Update parking availability (simulate real-time updates)
    async updateParkingAvailability(lotId, newAvailability) {
        try {
            const result = await this.collection.updateOne(
                { _id: lotId },
                { 
                    $set: { 
                        currentAvailability: newAvailability,
                        lastUpdated: new Date()
                    }
                }
            );
            
            if (result.modifiedCount > 0) {
                console.log(`Updated availability for lot ${lotId} to ${newAvailability}`);
            }
            return result;
        } catch (error) {
            console.error('Error updating parking availability:', error);
            throw error;
        }
    }

    // Simulate real-time parking updates
    async simulateParkingUpdates() {
        try {
            const allLots = await this.collection.find({}).toArray();
            
            for (const lot of allLots) {
                const randomChange = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
                const newAvailability = Math.max(0, 
                    Math.min(lot.capacity, lot.currentAvailability + randomChange)
                );
                
                if (newAvailability !== lot.currentAvailability) {
                    await this.updateParkingAvailability(lot._id, newAvailability);
                }
            }
            
            console.log('Completed parking availability simulation');
        } catch (error) {
            console.error('Error in simulateParkingUpdates:', error);
            throw error;
        }
    }

    // Get parking statistics
    async getParkingStatistics() {
        try {
            const stats = await this.collection.aggregate([
                {
                    $group: {
                        _id: "$campus",
                        totalLots: { $sum: 1 },
                        totalCapacity: { $sum: "$capacity" },
                        totalAvailable: { $sum: "$currentAvailability" },
                        avgAvailability: { $avg: "$currentAvailability" },
                        evChargingLots: { 
                            $sum: { $cond: ["$hasEVChargers", 1, 0] } 
                        },
                        adaSpaces: { $sum: "$adaSpaces" }
                    }
                }
            ]).toArray();
            
            console.log('Parking Statistics by Campus:');
            stats.forEach(stat => {
                console.log(`${stat._id}: ${stat.totalLots} lots, ${stat.totalCapacity} total capacity, ${stat.totalAvailable} available`);
                console.log(`  EV Charging: ${stat.evChargingLots} lots, ADA Spaces: ${stat.adaSpaces}`);
            });
            
            return stats;
        } catch (error) {
            console.error('Error getting parking statistics:', error);
            throw error;
        }
    }
}

module.exports = GeospatialQueries;
