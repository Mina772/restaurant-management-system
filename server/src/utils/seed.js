/* eslint-disable no-console */
/**
 * Idempotent database seeder.
 *   node src/utils/seed.js            # seed
 *   node src/utils/seed.js --destroy  # wipe seeded collections
 *
 * Food imagery uses royalty-free Unsplash source URLs (dev-friendly, hotlinkable).
 */
import mongoose from 'mongoose';
import env from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import MenuItem from '../models/MenuItem.js';
import Coupon from '../models/Coupon.js';
import Table from '../models/Table.js';
import logger from './logger.js';

const img = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=80`;

const categories = [
  { name: 'Burgers', description: 'Juicy handcrafted burgers', image: img('1568901346375-23c9450c58cd'), sortOrder: 1 },
  { name: 'Pizza', description: 'Wood-fired artisan pizzas', image: img('1513104890138-7c749659a591'), sortOrder: 2 },
  { name: 'Pasta', description: 'Fresh Italian pasta', image: img('1621996346565-e3dbc646d9a9'), sortOrder: 3 },
  { name: 'Salads', description: 'Crisp, healthy salads', image: img('1512621776951-a57141f2eefd'), sortOrder: 4 },
  { name: 'Sushi', description: 'Premium sushi & rolls', image: img('1579584425555-c3ce17fd4351'), sortOrder: 5 },
  { name: 'Desserts', description: 'Decadent sweet treats', image: img('1551024506-0bccd828d307'), sortOrder: 6 },
  { name: 'Drinks', description: 'Refreshing beverages', image: img('1544145945-f90425340c7e'), sortOrder: 7 },
];

const itemsByCategory = {
  Burgers: [
    ['Classic Cheeseburger', 'Angus beef, cheddar, lettuce, tomato, house sauce', 11.99, '1568901346375-23c9450c58cd', { isPopular: true, ratingAverage: 4.7, ratingCount: 128 }],
    ['Double Bacon Burger', 'Two patties, smoked bacon, caramelized onions', 15.49, '1550547660-d9450f859349', { isFeatured: true, ratingAverage: 4.8, ratingCount: 96 }],
    ['Spicy Jalapeño Burger', 'Pepper jack, jalapeños, chipotle mayo', 13.25, '1571091718767-18b5b1457add', { spicyLevel: 2, ratingAverage: 4.5, ratingCount: 74 }],
    ['Veggie Garden Burger', 'House black-bean patty, avocado, sprouts', 12.0, '1520072959219-c595dc870360', { isVegetarian: true, ratingAverage: 4.4, ratingCount: 52 }],
  ],
  Pizza: [
    ['Margherita', 'San Marzano tomato, fresh mozzarella, basil', 13.5, '1574071318508-1cdbab80d002', { isVegetarian: true, isPopular: true, ratingAverage: 4.8, ratingCount: 210 }],
    ['Pepperoni Feast', 'Double pepperoni, mozzarella, oregano', 15.0, '1628840042765-356cda07504e', { isFeatured: true, ratingAverage: 4.7, ratingCount: 175 }],
    ['Quattro Formaggi', 'Mozzarella, gorgonzola, parmesan, fontina', 16.25, '1513104890138-7c749659a591', { isVegetarian: true, ratingAverage: 4.6, ratingCount: 88 }],
    ['BBQ Chicken', 'Grilled chicken, red onion, smoky BBQ', 15.75, '1594007654729-407eedc4be65', { ratingAverage: 4.5, ratingCount: 63 }],
  ],
  Pasta: [
    ['Spaghetti Carbonara', 'Guanciale, egg, pecorino, black pepper', 14.5, '1612874742237-6526221588e3', { isPopular: true, ratingAverage: 4.7, ratingCount: 142 }],
    ['Penne Arrabbiata', 'Spicy tomato, garlic, chili, parsley', 12.75, '1563379926898-05f4575a45d8', { isVegan: true, spicyLevel: 2, ratingAverage: 4.4, ratingCount: 61 }],
    ['Fettuccine Alfredo', 'Creamy parmesan, butter, nutmeg', 13.9, '1645112411341-6c4fd023714a', { isVegetarian: true, ratingAverage: 4.5, ratingCount: 77 }],
  ],
  Salads: [
    ['Caesar Salad', 'Romaine, parmesan, croutons, Caesar dressing', 9.5, '1550304943-4f24f54ddde9', { isVegetarian: true, ratingAverage: 4.3, ratingCount: 54 }],
    ['Greek Salad', 'Feta, olives, cucumber, cherry tomato', 10.25, '1540420773420-3366772f4999', { isVegetarian: true, isGlutenFree: true, ratingAverage: 4.5, ratingCount: 47 }],
    ['Quinoa Power Bowl', 'Quinoa, avocado, chickpeas, tahini', 11.75, '1512621776951-a57141f2eefd', { isVegan: true, isGlutenFree: true, isFeatured: true, ratingAverage: 4.6, ratingCount: 39 }],
  ],
  Sushi: [
    ['Salmon Nigiri (6pc)', 'Fresh salmon over seasoned rice', 12.0, '1579584425555-c3ce17fd4351', { isGlutenFree: true, isPopular: true, ratingAverage: 4.8, ratingCount: 133 }],
    ['Dragon Roll', 'Eel, avocado, cucumber, tobiko', 15.5, '1617196034796-73dfa7b1fd56', { isFeatured: true, ratingAverage: 4.7, ratingCount: 91 }],
    ['California Roll (8pc)', 'Crab, avocado, cucumber', 10.5, '1553621042-f6e147245754', { ratingAverage: 4.4, ratingCount: 68 }],
  ],
  Desserts: [
    ['Chocolate Lava Cake', 'Warm molten center, vanilla gelato', 7.5, '1606313564200-e75d5e30476c', { isVegetarian: true, isPopular: true, ratingAverage: 4.9, ratingCount: 156 }],
    ['New York Cheesecake', 'Classic baked cheesecake, berry coulis', 6.9, '1533134242443-d4fd215305ad', { isVegetarian: true, ratingAverage: 4.7, ratingCount: 84 }],
    ['Tiramisu', 'Espresso-soaked ladyfingers, mascarpone', 7.25, '1571877227200-a0d98ea607e9', { isVegetarian: true, ratingAverage: 4.6, ratingCount: 72 }],
  ],
  Drinks: [
    ['Fresh Lemonade', 'Hand-squeezed lemons, mint', 3.5, '1621263764928-df1444c5e859', { isVegan: true, isGlutenFree: true, ratingAverage: 4.5, ratingCount: 40 }],
    ['Iced Caramel Latte', 'Espresso, milk, caramel, ice', 4.75, '1461023058943-07fcbe16d735', { isVegetarian: true, ratingAverage: 4.6, ratingCount: 58 }],
    ['Berry Smoothie', 'Strawberry, blueberry, banana, yogurt', 5.25, '1553530666-ba11a7da3888', { isVegetarian: true, isFeatured: true, ratingAverage: 4.7, ratingCount: 47 }],
  ],
};

async function destroy() {
  await Promise.all([
    User.deleteMany({ email: { $in: ['admin@restaurant.dev', 'customer@restaurant.dev'] } }),
    Category.deleteMany({}),
    MenuItem.deleteMany({}),
    Coupon.deleteMany({}),
    Table.deleteMany({}),
  ]);
  logger.info('Seed data destroyed');
}

async function seed() {
  await destroy();

  // Users
  await User.create({
    name: 'Restaurant Admin',
    email: 'admin@restaurant.dev',
    password: 'Admin@12345',
    role: 'admin',
    isEmailVerified: true,
  });
  await User.create({
    name: 'Demo Customer',
    email: 'customer@restaurant.dev',
    password: 'User@12345',
    role: 'customer',
    isEmailVerified: true,
  });

  // Categories
  const createdCats = await Category.create(categories);
  const catMap = new Map(createdCats.map((c) => [c.name, c._id]));

  // Menu items
  const docs = [];
  for (const [catName, list] of Object.entries(itemsByCategory)) {
    for (const [name, description, price, imgId, extra = {}] of list) {
      docs.push({
        name,
        description,
        price,
        image: img(imgId),
        category: catMap.get(catName),
        isAvailable: true,
        prepTimeMinutes: 10 + Math.floor(Math.random() * 20),
        soldCount: Math.floor(Math.random() * 500),
        tags: [catName.toLowerCase()],
        ...extra,
      });
    }
  }
  await MenuItem.create(docs);

  // Coupons
  const in30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await Coupon.create([
    { code: 'WELCOME10', description: '10% off your first order', type: 'percent', value: 10, minOrder: 15, maxDiscount: 10, expiresAt: in30, perUserLimit: 1 },
    { code: 'FREESHIP', description: '$4 off delivery', type: 'fixed', value: 4, minOrder: 20, expiresAt: in30, perUserLimit: 3 },
    { code: 'SAVE20', description: '20% off orders over $50', type: 'percent', value: 20, minOrder: 50, maxDiscount: 25, expiresAt: in30, perUserLimit: 2 },
  ]);

  // Tables
  await Table.create(
    Array.from({ length: 12 }, (_, i) => ({
      number: i + 1,
      capacity: [2, 2, 4, 4, 4, 6, 6, 2, 8, 4, 2, 10][i],
      location: i % 4 === 0 ? 'outdoor' : 'indoor',
    }))
  );

  logger.info(`Seeded ${createdCats.length} categories, ${docs.length} menu items, 3 coupons, 12 tables`);
  logger.info('Admin: admin@restaurant.dev / Admin@12345');
  logger.info('Customer: customer@restaurant.dev / User@12345');
}

(async () => {
  try {
    await connectDB(env.mongoUri);
    if (process.argv.includes('--destroy')) {
      await destroy();
    } else {
      await seed();
    }
  } catch (err) {
    logger.error('Seeding failed', err);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
    await mongoose.connection.close().catch(() => {});
  }
})();
