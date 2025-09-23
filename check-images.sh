#!/bin/bash

# Digital Ocean Spaces Image Counter Script
# Uses existing .env file with ACCESS_KEY_ID and PRIVATE_KEY

echo "🔍 Digital Ocean Spaces Image Counter"
echo "======================================"
echo ""

# Load environment variables from .env file
if [ -f .env ]; then
    echo "📁 Loading credentials from .env file..."
    export $(cat .env | grep -v '^#' | xargs)
    echo "✅ Environment variables loaded"
else
    echo "❌ .env file not found!"
    echo "Please make sure you have a .env file with:"
    echo "   ACCESS_KEY_ID=your_access_key_id"
    echo "   PRIVATE_KEY=your_private_key"
    exit 1
fi

# Check if required environment variables are set
if [ -z "$ACCESS_KEY_ID" ] || [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Missing required environment variables:"
    echo "   ACCESS_KEY_ID: ${ACCESS_KEY_ID:-'NOT SET'}"
    echo "   PRIVATE_KEY: ${PRIVATE_KEY:-'NOT SET'}"
    echo ""
    echo "Please check your .env file contains:"
    echo "   ACCESS_KEY_ID=your_access_key_id"
    echo "   PRIVATE_KEY=your_private_key"
    exit 1
fi

# Configuration
BUCKET="lowest"
REGION="nyc3"
ENDPOINT="https://nyc3.digitaloceanspaces.com"

echo "🔑 Using credentials:"
echo "   Access Key: ${ACCESS_KEY_ID:0:8}..."
echo "   Bucket: $BUCKET"
echo "   Region: $REGION"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first:"
    echo "   brew install awscli  # On macOS"
    echo "   apt install awscli   # On Ubuntu"
    exit 1
fi

# Configure AWS CLI with Digital Ocean credentials
echo "🔧 Configuring AWS CLI for Digital Ocean Spaces..."
aws configure set aws_access_key_id "$ACCESS_KEY_ID"
aws configure set aws_secret_access_key "$PRIVATE_KEY"
aws configure set default.region "$REGION"

# Test connection
echo "🔗 Testing connection to Digital Ocean Spaces..."
aws s3 ls s3://$BUCKET/ --endpoint-url=$ENDPOINT > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Connection failed. Please check your credentials in .env file."
    exit 1
fi

echo "✅ Connection successful!"
echo ""

# Function to count images in a property folder
count_property_images() {
    local property_id=$1
    local count=$(aws s3 ls s3://$BUCKET/Propiedades/$property_id/ --endpoint-url=$ENDPOINT 2>/dev/null | wc -l)
    echo $count
}

# Function to list images in a property folder
list_property_images() {
    local property_id=$1
    aws s3 ls s3://$BUCKET/Propiedades/$property_id/ --endpoint-url=$ENDPOINT 2>/dev/null | awk '{print $4}'
}

# Check Property 19 specifically
echo "🏠 Checking Property 19 (Torre Anacaona)..."
property_19_count=$(count_property_images 19)
echo "Property 19 has $property_19_count images"

if [ $property_19_count -gt 0 ]; then
    echo "Images found:"
    list_property_images 19 | head -10
    if [ $property_19_count -gt 10 ]; then
        echo "... and $((property_19_count - 10)) more"
    fi
fi
echo ""

# Ask user if they want to check all properties
read -p "Do you want to check all properties? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📊 Checking all properties..."
    echo "Property ID | Image Count | Status"
    echo "------------|-------------|--------"
    
    # Array of all property IDs
    properties=(1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 39 40 50 51 52 42 43 44 45 46 47 48 53 54 55 56 57 58 59 60 61 62 63 64 65 66 67 68 69 70 71 72 73 74 75 76 77 78)
    
    for prop_id in "${properties[@]}"; do
        count=$(count_property_images $prop_id)
        
        if [ $count -gt 5 ]; then
            status="MORE"
        elif [ $count -lt 5 ]; then
            status="LESS"
        else
            status="OK"
        fi
        
        printf "%-11s | %-11s | %s\n" "$prop_id" "$count" "$status"
    done
    
    echo ""
    echo "✅ Image count check complete!"
    echo ""
    echo "📝 Summary:"
    echo "- Properties with MORE than 5 images need CDN config updates"
    echo "- Properties with LESS than 5 images may have missing images"
    echo "- Properties with exactly 5 images are correctly configured"
else
    echo "✅ Property 19 check complete!"
    echo "Run the script again and choose 'y' to check all properties."
fi

echo ""
echo "🔧 To update CDN configuration with correct counts:"
echo "   Share the results and I'll update the cdn-config.js file"