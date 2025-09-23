const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
require('dotenv').config();

// Digital Ocean Spaces configuration
const spacesEndpoint = new AWS.Endpoint('nyc3.digitaloceanspaces.com');
const s3 = new AWS.S3({
    endpoint: spacesEndpoint,
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.PRIVATE_KEY,
    region: 'nyc3'
});

const BUCKET_NAME = 'lowest';

// Function to count images in a property folder
async function countPropertyImages(propertyId) {
    try {
        const params = {
            Bucket: BUCKET_NAME,
            Prefix: `Propiedades/${propertyId}/`
        };
        
        const data = await s3.listObjectsV2(params).promise();
        const images = data.Contents.filter(obj => 
            obj.Key.match(/\.(png|jpg|jpeg)$/i)
        );
        
        return images.map(img => img.Key);
    } catch (error) {
        console.error(`Error counting images for property ${propertyId}:`, error.message);
        return [];
    }
}

// Function to update CDN config
function updateCDNConfig(propertyCounts) {
    const cdnConfigPath = path.join(__dirname, 'js', 'cdn-config.js');
    let cdnConfig = fs.readFileSync(cdnConfigPath, 'utf8');
    
    // Update each property's imageCount
    for (const [propertyId, images] of Object.entries(propertyCounts)) {
        const imageCount = images.length;
        const regex = new RegExp(`(${propertyId}:\\s*{[^}]*imageCount:\\s*)\\d+`, 'g');
        cdnConfig = cdnConfig.replace(regex, `$1${imageCount}`);
    }
    
    fs.writeFileSync(cdnConfigPath, cdnConfig);
    console.log('✅ Updated cdn-config.js with correct image counts');
}

// Function to update properties.json galleries
function updatePropertiesJSON(propertyCounts) {
    const propertiesPath = path.join(__dirname, 'data', 'properties.json');
    const properties = JSON.parse(fs.readFileSync(propertiesPath, 'utf8'));
    
    for (const property of properties) {
        // Extract property ID from the property's image URL
        const imageUrl = property.image;
        const propertyIdMatch = imageUrl.match(/Propiedades\/(\d+)\//);
        
        if (propertyIdMatch) {
            const propertyId = propertyIdMatch[1];
            const images = propertyCounts[propertyId] || [];
            
            if (images.length > 0) {
                // Generate gallery URLs
                const gallery = images.map(img => {
                    const filename = img.split('/').pop();
                    return `https://lowest.nyc3.cdn.digitaloceanspaces.com/${img}`;
                });
                
                property.gallery = gallery;
                console.log(`✅ Updated Property ${propertyId} gallery with ${gallery.length} images`);
            }
        }
    }
    
    fs.writeFileSync(propertiesPath, JSON.stringify(properties, null, 2));
    console.log('✅ Updated properties.json with complete galleries');
}

// Main function
async function main() {
    console.log('🔍 Digital Ocean Spaces Image Counter & Updater');
    console.log('===============================================');
    console.log('');
    
    // Check if credentials are available
    if (!process.env.ACCESS_KEY_ID || !process.env.PRIVATE_KEY) {
        console.log('❌ Missing credentials in .env file');
        console.log('Please ensure your .env file contains:');
        console.log('ACCESS_KEY_ID=your_access_key_id');
        console.log('PRIVATE_KEY=your_private_key');
        return;
    }
    
    console.log('🔑 Using credentials:');
    console.log(`   Access Key: ${process.env.ACCESS_KEY_ID.substring(0, 8)}...`);
    console.log(`   Bucket: ${BUCKET_NAME}`);
    console.log('');
    
    // Test connection
    try {
        await s3.headBucket({ Bucket: BUCKET_NAME }).promise();
        console.log('✅ Connection successful!');
    } catch (error) {
        console.log('❌ Connection failed:', error.message);
        return;
    }
    
    console.log('');
    console.log('📊 Checking all properties...');
    
    // Array of all property IDs
    const propertyIds = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,50,51,52,42,43,44,45,46,47,48,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78];
    
    const propertyCounts = {};
    let completed = 0;
    
    for (const propertyId of propertyIds) {
        const images = await countPropertyImages(propertyId);
        propertyCounts[propertyId] = images;
        
        completed++;
        const progress = Math.round((completed / propertyIds.length) * 100);
        console.log(`Progress: ${progress}% - Property ${propertyId}: ${images.length} images`);
    }
    
    console.log('');
    console.log('📝 Summary:');
    console.log('Property ID | Image Count | Status');
    console.log('------------|-------------|--------');
    
    for (const [propertyId, images] of Object.entries(propertyCounts)) {
        const count = images.length;
        let status = 'OK';
        
        if (count > 5) {
            status = 'MORE';
        } else if (count < 5) {
            status = 'LESS';
        }
        
        console.log(`${propertyId.toString().padEnd(11)} | ${count.toString().padEnd(11)} | ${status}`);
    }
    
    console.log('');
    console.log('🔧 Updating configuration files...');
    
    // Update CDN config
    updateCDNConfig(propertyCounts);
    
    // Update properties.json
    updatePropertiesJSON(propertyCounts);
    
    console.log('');
    console.log('✅ All updates complete!');
    console.log('');
    console.log('📋 What was updated:');
    console.log('- cdn-config.js: Updated image counts for all properties');
    console.log('- properties.json: Updated galleries with all available images');
    console.log('');
    console.log('🚀 Your website now has access to all available images!');
}

// Run the script
main().catch(console.error);
