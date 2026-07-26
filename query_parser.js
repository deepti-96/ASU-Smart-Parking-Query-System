// ASU Smart Parking Natural Language Query Parser
// This file translates natural language queries into MongoDB geospatial queries

class ParkingQueryParser {
    constructor() {
        // Building coordinates for ASU campuses
        this.buildingCoordinates = {
            "memorial union": [-111.9389, 33.4205],
            "byeng": [-111.9320, 33.4210],
            "byeng building": [-111.9320, 33.4210],
            "west campus library": [-112.1740, 33.6080],
            "west library": [-112.1740, 33.6080],
            "fulton center": [-111.9320, 33.4210],
            "polytechnic": [-111.6789, 33.3061],
            "poly": [-111.6789, 33.3061],
            "downtown tempe": [-111.9400, 33.4250]
        };
        
        // Permit type mappings
        this.permitTypes = {
            "visitor": "Visitor",
            "visitors": "Visitor",
            "student": "Student", 
            "students": "Student",
            "faculty": "Faculty",
            "hourly": "Hourly",
            "permit": "Student",
            "no permit": "Hourly",
            "doesn't require a permit": "Hourly",
            "doesn't require permit": "Hourly"
        };
        
        // Campus mappings
        this.campuses = {
            "tempe": "Tempe",
            "polytechnic": "Polytechnic",
            "poly": "Polytechnic",
            "west": "West",
            "west campus": "West"
        };
        
        // Zone mappings
        this.zones = {
            "downtown tempe": "Downtown Tempe",
            "central campus": "Central Campus",
            "west campus": "West Campus",
            "polytechnic campus": "Polytechnic Campus"
        };
    }

    // Main parsing function
    parseQuery(naturalLanguageQuery) {
        const query = naturalLanguageQuery.toLowerCase();
        const criteria = {};
        
        console.log(`Parsing query: "${naturalLanguageQuery}"`);
        
        // Extract location
        this.extractLocation(query, criteria);
        
        // Extract distance
        this.extractDistance(query, criteria);
        
        // Extract availability requirements
        this.extractAvailability(query, criteria);
        
        // Extract permit type
        this.extractPermitType(query, criteria);
        
        // Extract EV charging requirements
        this.extractEVCharging(query, criteria);
        
        // Extract ADA requirements
        this.extractADARequirements(query, criteria);
        
        // Extract time requirements
        this.extractTimeRequirements(query, criteria);
        
        // Extract campus
        this.extractCampus(query, criteria);
        
        // Extract zones
        this.extractZones(query, criteria);
        
        console.log('Parsed criteria:', criteria);
        return criteria;
    }

    // Extract location from query
    extractLocation(query, criteria) {
        for (const [building, coords] of Object.entries(this.buildingCoordinates)) {
            if (query.includes(building)) {
                criteria.longitude = coords[0];
                criteria.latitude = coords[1];
                criteria.buildingNearby = building;
                break;
            }
        }
    }

    // Extract distance requirements
    extractDistance(query, criteria) {
        // Look for distance patterns like "500 meters", "1 km", "within 500m"
        const distancePatterns = [
            /(\d+)\s*(meter|m)\b/,
            /(\d+)\s*km\b/,
            /within\s+(\d+)\s*(meter|m)\b/,
            /within\s+(\d+)\s*km\b/
        ];
        
        for (const pattern of distancePatterns) {
            const match = query.match(pattern);
            if (match) {
                const distance = parseInt(match[1]);
                const unit = match[2] || (match[0].includes('km') ? 'km' : 'm');
                criteria.maxDistance = unit === 'km' ? distance * 1000 : distance;
                break;
            }
        }
        
        // Default distance if not specified
        if (!criteria.maxDistance) {
            criteria.maxDistance = 1000; // 1km default
        }
    }

    // Extract availability requirements
    extractAvailability(query, criteria) {
        // Look for patterns like ">20 open spots", "more than 20", "at least 20"
        const availabilityPatterns = [
            />(\d+)\s*open/,
            /more\s+than\s+(\d+)/,
            /at\s+least\s+(\d+)/,
            /(\d+)\s*or\s+more/
        ];
        
        for (const pattern of availabilityPatterns) {
            const match = query.match(pattern);
            if (match) {
                criteria.minAvailability = parseInt(match[1]);
                break;
            }
        }
    }

    // Extract permit type requirements
    extractPermitType(query, criteria) {
        for (const [key, value] of Object.entries(this.permitTypes)) {
            if (query.includes(key)) {
                criteria.permitType = value;
                break;
            }
        }
    }

    // Extract EV charging requirements
    extractEVCharging(query, criteria) {
        const evKeywords = ['ev', 'electric', 'charging', 'charger', 'ev-charging'];
        for (const keyword of evKeywords) {
            if (query.includes(keyword)) {
                criteria.hasEVChargers = true;
                break;
            }
        }
    }

    // Extract ADA requirements
    extractADARequirements(query, criteria) {
        const adaKeywords = ['ada', 'accessible', 'disability', 'handicap'];
        for (const keyword of adaKeywords) {
            if (query.includes(keyword)) {
                criteria.adaSpaces = 1;
                break;
            }
        }
    }

    // Extract time requirements
    extractTimeRequirements(query, criteria) {
        // Look for time patterns like "after 6 pm", "before 8 am", "at 2 pm"
        const timePatterns = [
            /after\s+(\d+)\s*(am|pm)/,
            /before\s+(\d+)\s*(am|pm)/,
            /at\s+(\d+)\s*(am|pm)/
        ];
        
        for (const pattern of timePatterns) {
            const match = query.match(pattern);
            if (match) {
                let hour = parseInt(match[1]);
                const period = match[2];
                
                // Convert to 24-hour format
                if (period === 'pm' && hour !== 12) {
                    hour += 12;
                } else if (period === 'am' && hour === 12) {
                    hour = 0;
                }
                
                criteria.targetTime = new Date();
                criteria.targetTime.setHours(hour, 0, 0, 0);
                break;
            }
        }
    }

    // Extract campus information
    extractCampus(query, criteria) {
        for (const [key, value] of Object.entries(this.campuses)) {
            if (query.includes(key)) {
                criteria.campus = value;
                break;
            }
        }
    }

    // Extract zone information
    extractZones(query, criteria) {
        for (const [key, value] of Object.entries(this.zones)) {
            if (query.includes(key)) {
                criteria.zones = [value];
                break;
            }
        }
    }

    // Process the specific example queries from README
    async processExampleQueries(geospatialQueries) {
        const exampleQueries = [
            "Find the nearest visitor parking to the Memorial Union.",
            "Show lots within 500 meters of the BYENG building with >20 open spots.",
            "Where can I park after 6 pm near Poly that doesn't require a permit?",
            "List EV-charging parking within 1 km of West campus library.",
            "Which garage inside Downtown Tempe zone has ADA spaces available now?"
        ];

        console.log('\n=== Processing Example Queries ===\n');
        
        for (let i = 0; i < exampleQueries.length; i++) {
            const query = exampleQueries[i];
            console.log(`${i + 1}. "${query}"`);
            
            try {
                const criteria = this.parseQuery(query);
                let results;
                
                if (criteria.targetTime) {
                    results = await geospatialQueries.findAvailableParkingAtTime(criteria, criteria.targetTime);
                } else {
                    results = await geospatialQueries.findParkingWithFilters(criteria);
                }
                
                console.log(`   Results: ${results.length} parking lots found`);
                results.forEach((lot, index) => {
                    console.log(`   ${index + 1}. ${lot.name} - ${lot.currentAvailability}/${lot.capacity} available`);
                    if (lot.distance) {
                        console.log(`      Distance: ${Math.round(lot.distance)}m`);
                    }
                });
                console.log('');
            } catch (error) {
                console.error(`   Error processing query: ${error.message}`);
                console.log('');
            }
        }
    }
}

module.exports = ParkingQueryParser;
