const mongoose = require('mongoose');
const User = require('../models/User');
const ContentType = require('../models/ContentType');

const defaultContentTypes = [
  { name: 'Advert', description: 'Advertisement content' },
  { name: 'Article', description: 'Editorial article content' },
  { name: 'Puzzle', description: 'Puzzle or game content' },
  { name: 'Advertorial', description: 'Promotional article content' },
  { name: 'Front Cover', description: 'Front cover content' },
  { name: 'In-house', description: 'In-house promotional content' }
];

const seedContentTypesForUser = async (userId) => {
  try {
    // Check if user already has content types
    const existingContentTypes = await ContentType.find({ createdBy: userId });
    
    if (existingContentTypes.length > 0) {
      console.log(`User ${userId} already has ${existingContentTypes.length} content types`);
      return;
    }

    // Create default content types for this user
    const contentTypesToCreate = defaultContentTypes.map(ct => ({
      ...ct,
      createdBy: userId,
      isDefault: true
    }));

    await ContentType.insertMany(contentTypesToCreate);
    console.log(`Created ${defaultContentTypes.length} default content types for user ${userId}`);
  } catch (error) {
    console.error(`Error seeding content types for user ${userId}:`, error);
  }
};

const seedAllUsers = async () => {
  try {
    console.log('Starting content types seeding...');
    
    const users = await User.find({});
    console.log(`Found ${users.length} users`);

    for (const user of users) {
      await seedContentTypesForUser(user._id);
    }

    console.log('Content types seeding completed');
  } catch (error) {
    console.error('Error during seeding:', error);
  }
};

// If running this script directly
if (require.main === module) {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bookingsapp';
  
  mongoose.connect(MONGODB_URI)
    .then(() => {
      console.log('Connected to MongoDB');
      return seedAllUsers();
    })
    .then(() => {
      console.log('Seeding completed, closing connection');
      mongoose.connection.close();
    })
    .catch((error) => {
      console.error('Error:', error);
      mongoose.connection.close();
    });
}

module.exports = { seedContentTypesForUser, seedAllUsers }; 