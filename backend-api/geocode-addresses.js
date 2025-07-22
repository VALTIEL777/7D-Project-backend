const RouteOptimizationService = require('./src/services/RouteOptimizationService');
const db = require('./src/config/db');

async function geocodeAllAddresses() {
    try {
        console.log('🗺️  Starting address geocoding process...\n');

        // Step 1: Get all addresses without coordinates
        const addressesQuery = `
            SELECT DISTINCT 
                a.addressid,
                CONCAT(
                    COALESCE(a.addressnumber, ''),
                    ' ',
                    COALESCE(a.addresscardinal, ''),
                    ' ',
                    COALESCE(a.addressstreet, ''),
                    ' ',
                    COALESCE(a.addresssuffix, ''),
                    ', Chicago, Illinois'
                ) as full_address
            FROM addresses a
            WHERE a.latitude IS NULL 
            OR a.longitude IS NULL 
            OR a.latitude = 0 
            OR a.longitude = 0
            AND a.deletedat IS NULL
            ORDER BY a.addressid
        `;

        const addressesResult = await db.query(addressesQuery);
        const addressesToGeocode = addressesResult.rows;

        console.log(`📍 Found ${addressesToGeocode.length} addresses that need geocoding\n`);

        if (addressesToGeocode.length === 0) {
            console.log('✅ All addresses already have coordinates!');
            return;
        }

        // Step 2: Geocode addresses in batches to avoid rate limiting
        const batchSize = 10; // Google allows 10 requests per second
        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        for (let i = 0; i < addressesToGeocode.length; i += batchSize) {
            const batch = addressesToGeocode.slice(i, i + batchSize);
            console.log(`\n🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(addressesToGeocode.length / batchSize)}`);
            console.log(`   Addresses ${i + 1} to ${Math.min(i + batchSize, addressesToGeocode.length)}`);

            // Process each address in the batch
            for (const address of batch) {
                try {
                    console.log(`   📍 Geocoding: ${address.full_address}`);
                    
                    // Geocode the address
                    const geocodeResult = await RouteOptimizationService.geocodeAddress(address.full_address);
                    
                    // Update the database with coordinates
                    const updateQuery = `
                        UPDATE addresses 
                        SET 
                            latitude = $1,
                            longitude = $2,
                            placeid = $3,
                            updatedat = CURRENT_TIMESTAMP,
                            updatedby = 1
                        WHERE addressid = $4
                    `;
                    
                    await db.query(updateQuery, [
                        geocodeResult.latitude,
                        geocodeResult.longitude,
                        geocodeResult.placeId,
                        address.addressid
                    ]);

                    console.log(`   ✅ Success: (${geocodeResult.latitude.toFixed(4)}, ${geocodeResult.longitude.toFixed(4)})`);
                    successCount++;

                    // Rate limiting - wait 100ms between requests
                    await new Promise(resolve => setTimeout(resolve, 100));

                } catch (error) {
                    console.log(`   ❌ Error: ${error.message}`);
                    errors.push({
                        addressId: address.addressid,
                        address: address.full_address,
                        error: error.message
                    });
                    errorCount++;
                }
            }

            // Wait 1 second between batches to respect rate limits
            if (i + batchSize < addressesToGeocode.length) {
                console.log('   ⏳ Waiting 1 second before next batch...');
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        // Step 3: Summary
        console.log('\n\n📊 Geocoding Summary');
        console.log('=' .repeat(50));
        console.log(`✅ Successfully geocoded: ${successCount} addresses`);
        console.log(`❌ Failed to geocode: ${errorCount} addresses`);
        console.log(`📈 Success rate: ${((successCount / addressesToGeocode.length) * 100).toFixed(1)}%`);

        if (errors.length > 0) {
            console.log('\n❌ Errors encountered:');
            errors.slice(0, 10).forEach((error, index) => {
                console.log(`   ${index + 1}. Address ID ${error.addressId}: ${error.address}`);
                console.log(`      Error: ${error.error}`);
            });
            
            if (errors.length > 10) {
                console.log(`   ... and ${errors.length - 10} more errors`);
            }
        }

        // Step 4: Verify results
        console.log('\n🔍 Verifying results...');
        const verificationQuery = `
            SELECT 
                COUNT(*) as total_addresses,
                COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL AND latitude != 0 AND longitude != 0 THEN 1 END) as addresses_with_coordinates,
                COUNT(CASE WHEN latitude IS NULL OR longitude IS NULL OR latitude = 0 OR longitude = 0 THEN 1 END) as addresses_without_coordinates
            FROM addresses 
            WHERE deletedat IS NULL
        `;

        const verificationResult = await db.query(verificationQuery);
        const stats = verificationResult.rows[0];

        console.log(`\n📈 Database Statistics:`);
        console.log(`   Total addresses: ${stats.total_addresses}`);
        console.log(`   With coordinates: ${stats.addresses_with_coordinates}`);
        console.log(`   Without coordinates: ${stats.addresses_without_coordinates}`);
        console.log(`   Coverage: ${((stats.addresses_with_coordinates / stats.total_addresses) * 100).toFixed(1)}%`);

        if (stats.addresses_with_coordinates > 0) {
            console.log('\n🎉 Geocoding completed! You can now use the clustering functionality.');
            console.log('\n🚀 Next steps:');
            console.log('   1. Try optimizing routes with your 100+ tickets');
            console.log('   2. The system will automatically cluster them');
            console.log('   3. Each cluster will be optimized separately');
        } else {
            console.log('\n⚠️  No addresses were successfully geocoded. Please check your Google Maps API key.');
        }

    } catch (error) {
        console.error('❌ Error during geocoding process:', error);
        console.log('\n🔧 Troubleshooting:');
        console.log('   - Check your GOOGLE_MAPS_API_KEY environment variable');
        console.log('   - Ensure the API key has Geocoding API enabled');
        console.log('   - Check your API quota and billing');
    }
}

// Run the geocoding process
console.log('🚀 Starting Address Geocoding Process...\n');
geocodeAllAddresses(); 