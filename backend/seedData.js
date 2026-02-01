const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Product = require('./models/Product');

// Sample product images URLs (using placeholder images)
const sampleImages = {
  camera: [
    'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800',
    'https://images.unsplash.com/photo-1606980707986-a2b6c3c7ae49?w=800',
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800',
    'https://images.unsplash.com/photo-1495121605193-b116b5b9c5fe?w=800'
  ],
  laptop: [
    'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800',
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
    'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800',
    'https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=800'
  ],
  drone: [
    'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800',
    'https://images.unsplash.com/photo-1508614999368-9260051292e5?w=800',
    'https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?w=800',
    'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=800'
  ],
  projector: [
    'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=800',
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800',
    'https://images.unsplash.com/photo-1535223289827-42f1e9919769?w=800'
  ],
  audio: [
    'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800',
    'https://images.unsplash.com/photo-1558756520-22cfe5d382ca?w=800',
    'https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=800',
    'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800'
  ],
  lighting: [
    'https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=800',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800',
    'https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?w=800',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800'
  ],
  tent: [
    'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=800',
    'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800',
    'https://images.unsplash.com/photo-1445308394109-4ec2920981b1?w=800',
    'https://images.unsplash.com/photo-1537225228614-56cc3556d7ed?w=800'
  ],
  bike: [
    'https://images.unsplash.com/photo-1571333250630-f0230c320b6d?w=800',
    'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=800',
    'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800',
    'https://images.unsplash.com/photo-1511994298241-608e28f14fde?w=800'
  ],
  furniture: [
    'https://images.unsplash.com/photo-1567016432779-094069958ea5?w=800',
    'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800',
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
    'https://images.unsplash.com/photo-1505843513577-22bb7d21e455?w=800'
  ],
  tools: [
    'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800',
    'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800',
    'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=800',
    'https://images.unsplash.com/photo-1513828583688-c52646db42da?w=800'
  ]
};

// Convert image URLs to proper format
const formatImages = (urls) => {
  return urls.map((url, index) => ({
    url,
    caption: index === 0 ? 'Main view' : `View ${index + 1}`,
    isPrimary: index === 0
  }));
};

const sampleUsers = [
  {
    name: 'Admin User',
    email: 'admin@rentalapp.com',
    password: 'admin123',
    role: 'admin',
    companyName: 'Rental Management System',
    gstin: 'ADMIN123456789'
  },
  {
    name: 'TechGear Rentals',
    email: 'vendor1@rentalapp.com',
    password: 'vendor123',
    role: 'vendor',
    companyName: 'TechGear Rentals',
    gstin: '22AAAAA0000A1Z5'
  },
  {
    name: 'EventPro Equipment',
    email: 'vendor2@rentalapp.com',
    password: 'vendor123',
    role: 'vendor',
    companyName: 'EventPro Equipment',
    gstin: '27BBBBB1111B2Z6'
  },
  {
    name: 'Outdoor Adventures',
    email: 'vendor3@rentalapp.com',
    password: 'vendor123',
    role: 'vendor',
    companyName: 'Outdoor Adventures',
    gstin: '29CCCCC2222C3Z7'
  },
  {
    name: 'Party Supplies Co',
    email: 'vendor4@rentalapp.com',
    password: 'vendor123',
    role: 'vendor',
    companyName: 'Party Supplies Co',
    gstin: '09DDDDD3333D4Z8'
  },
  {
    name: 'Construction Tools Hub',
    email: 'vendor5@rentalapp.com',
    password: 'vendor123',
    role: 'vendor',
    companyName: 'Construction Tools Hub',
    gstin: '06EEEEE4444E5Z9'
  },
  {
    name: 'John Customer',
    email: 'customer1@example.com',
    password: 'customer123',
    role: 'customer',
    companyName: 'Personal',
    gstin: 'CUST123456789'
  },
  {
    name: 'Sarah Williams',
    email: 'customer2@example.com',
    password: 'customer123',
    role: 'customer',
    companyName: 'Williams Productions',
    gstin: '22WWWWW5555W6Z0'
  },
  {
    name: 'Mike Johnson',
    email: 'customer3@example.com',
    password: 'customer123',
    role: 'customer',
    companyName: 'Johnson Events',
    gstin: '27JJJJJ6666J7Z1'
  }
];

const sampleProducts = [
  // Electronics & Cameras (Vendor 1 - TechGear Rentals)
  {
    name: 'Canon EOS R5 Mirrorless Camera',
    description: 'Professional full-frame mirrorless camera with 45MP sensor, 8K video recording, and advanced autofocus system. Perfect for professional photography and videography projects.',
    category: 'Electronics',
    quantityOnHand: 5,
    costPrice: 3500,
    salesPrice: 4000,
    rentalPricing: { hourly: 50, daily: 400, weekly: 2400 },
    images: formatImages(sampleImages.camera),
    specifications: {
      brand: 'Canon',
      model: 'EOS R5',
      condition: 'like-new',
      weight: '738g',
      color: 'Black'
    },
    tags: ['camera', 'professional', 'mirrorless', 'full-frame', '8k'],
    ratings: { average: 4.9, count: 127 }
  },
  {
    name: 'Sony A7 III Camera Body',
    description: 'Versatile full-frame camera with exceptional image quality, 693-point AF system, and 10fps continuous shooting. Ideal for weddings, events, and commercial photography.',
    category: 'Electronics',
    quantityOnHand: 8,
    costPrice: 2000,
    salesPrice: 2300,
    rentalPricing: { hourly: 35, daily: 280, weekly: 1680 },
    images: formatImages(sampleImages.camera),
    specifications: {
      brand: 'Sony',
      model: 'A7 III',
      condition: 'good',
      weight: '650g',
      color: 'Black'
    },
    tags: ['camera', 'full-frame', 'sony', 'wedding', 'event'],
    ratings: { average: 4.8, count: 203 }
  },
  {
    name: 'MacBook Pro 16" M2 Max',
    description: 'High-performance laptop with M2 Max chip, 32GB RAM, 1TB SSD. Perfect for video editing, 3D rendering, and intensive creative work. Includes charger and carrying case.',
    category: 'Electronics',
    quantityOnHand: 10,
    costPrice: 3000,
    salesPrice: 3500,
    rentalPricing: { hourly: 25, daily: 180, weekly: 1080 },
    images: formatImages(sampleImages.laptop),
    specifications: {
      brand: 'Apple',
      model: 'MacBook Pro 16"',
      condition: 'like-new',
      weight: '2.15kg',
      color: 'Space Gray'
    },
    tags: ['laptop', 'macbook', 'video-editing', 'design', 'professional'],
    ratings: { average: 4.9, count: 156 }
  },
  {
    name: 'Dell XPS 15 Laptop',
    description: 'Premium Windows laptop with Intel i7, 16GB RAM, NVIDIA RTX 4050. Great for business presentations, software development, and creative work.',
    category: 'Electronics',
    quantityOnHand: 12,
    costPrice: 1500,
    salesPrice: 1800,
    rentalPricing: { hourly: 20, daily: 150, weekly: 900 },
    images: formatImages(sampleImages.laptop),
    specifications: {
      brand: 'Dell',
      model: 'XPS 15',
      condition: 'good',
      weight: '1.86kg',
      color: 'Silver'
    },
    tags: ['laptop', 'windows', 'business', 'development'],
    ratings: { average: 4.6, count: 89 }
  },
  {
    name: 'DJI Mavic 3 Pro Drone',
    description: 'Professional drone with triple camera system, 43-minute flight time, and omnidirectional obstacle sensing. Includes extra batteries, carrying case, and ND filters.',
    category: 'Electronics',
    quantityOnHand: 4,
    costPrice: 2500,
    salesPrice: 3000,
    rentalPricing: { hourly: 60, daily: 450, weekly: 2700 },
    images: formatImages(sampleImages.drone),
    specifications: {
      brand: 'DJI',
      model: 'Mavic 3 Pro',
      condition: 'new',
      weight: '958g',
      color: 'Gray'
    },
    tags: ['drone', 'aerial', 'photography', 'videography', '4k'],
    ratings: { average: 4.9, count: 78 }
  },
  {
    name: 'DJI Mini 3 Pro Compact Drone',
    description: 'Lightweight and portable drone with 4K HDR video, 34-minute flight time. Perfect for travel vlogging and real estate photography. Easy to fly for beginners.',
    category: 'Electronics',
    quantityOnHand: 6,
    costPrice: 800,
    salesPrice: 1000,
    rentalPricing: { hourly: 25, daily: 180, weekly: 1080 },
    images: formatImages(sampleImages.drone),
    specifications: {
      brand: 'DJI',
      model: 'Mini 3 Pro',
      condition: 'like-new',
      weight: '249g',
      color: 'Gray'
    },
    tags: ['drone', 'compact', 'travel', 'beginner', 'real-estate'],
    ratings: { average: 4.7, count: 134 }
  },
  {
    name: 'iPad Pro 12.9" M2',
    description: 'Powerful tablet with M2 chip, Liquid Retina XDR display, Apple Pencil support. Great for digital art, note-taking, and presentations. Includes Magic Keyboard.',
    category: 'Electronics',
    quantityOnHand: 15,
    costPrice: 1200,
    salesPrice: 1500,
    rentalPricing: { hourly: 15, daily: 100, weekly: 600 },
    images: formatImages(sampleImages.laptop),
    specifications: {
      brand: 'Apple',
      model: 'iPad Pro 12.9"',
      condition: 'like-new',
      weight: '682g',
      color: 'Space Gray'
    },
    tags: ['tablet', 'ipad', 'drawing', 'presentation', 'portable'],
    ratings: { average: 4.8, count: 92 }
  },
  {
    name: 'GoPro Hero 12 Black',
    description: 'Ultimate action camera with 5.3K60 video, HyperSmooth 6.0 stabilization, waterproof to 33ft. Includes mounting accessories and extra batteries.',
    category: 'Electronics',
    quantityOnHand: 10,
    costPrice: 400,
    salesPrice: 500,
    rentalPricing: { hourly: 10, daily: 60, weekly: 360 },
    images: formatImages(sampleImages.camera),
    specifications: {
      brand: 'GoPro',
      model: 'Hero 12 Black',
      condition: 'new',
      weight: '154g',
      color: 'Black'
    },
    tags: ['action-camera', 'sports', 'waterproof', 'vlogging'],
    ratings: { average: 4.7, count: 167 }
  },

  // Event Equipment (Vendor 2 - EventPro Equipment)
  {
    name: 'Epson PowerLite 5050UB 4K Projector',
    description: 'Professional 4K HDR projector with 2600 lumens brightness. Perfect for large venues, conferences, and outdoor movie nights. Includes screen and cables.',
    category: 'Event Equipment',
    quantityOnHand: 8,
    costPrice: 3000,
    salesPrice: 3500,
    rentalPricing: { hourly: 40, daily: 300, weekly: 1800 },
    images: formatImages(sampleImages.projector),
    specifications: {
      brand: 'Epson',
      model: 'PowerLite 5050UB',
      condition: 'like-new',
      weight: '11kg',
      color: 'White'
    },
    tags: ['projector', '4k', 'conference', 'event', 'presentation'],
    ratings: { average: 4.8, count: 145 }
  },
  {
    name: 'JBL EON615 Portable PA Speaker',
    description: '1000W powered speaker with Bluetooth connectivity. Crystal clear sound for events, parties, and presentations. Includes speaker stand and cables.',
    category: 'Event Equipment',
    quantityOnHand: 20,
    costPrice: 500,
    salesPrice: 600,
    rentalPricing: { hourly: 15, daily: 100, weekly: 600 },
    images: formatImages(sampleImages.audio),
    specifications: {
      brand: 'JBL',
      model: 'EON615',
      condition: 'good',
      weight: '19.5kg',
      color: 'Black'
    },
    tags: ['speaker', 'audio', 'event', 'party', 'bluetooth'],
    ratings: { average: 4.6, count: 213 }
  },
  {
    name: 'Bose S1 Pro Portable Speaker System',
    description: 'Multi-position PA system with built-in mixer and Bluetooth. Perfect for small to medium events, busking, and presentations. Battery powered.',
    category: 'Event Equipment',
    quantityOnHand: 15,
    costPrice: 600,
    salesPrice: 700,
    rentalPricing: { hourly: 12, daily: 80, weekly: 480 },
    images: formatImages(sampleImages.audio),
    specifications: {
      brand: 'Bose',
      model: 'S1 Pro',
      condition: 'like-new',
      weight: '7.1kg',
      color: 'Black'
    },
    tags: ['speaker', 'portable', 'battery', 'event', 'presentation'],
    ratings: { average: 4.7, count: 98 }
  },
  {
    name: 'Shure SM58 Wireless Microphone System',
    description: 'Professional wireless microphone system with legendary SM58 capsule. Reliable performance for speeches, performances, and events. Includes receiver and cables.',
    category: 'Event Equipment',
    quantityOnHand: 25,
    costPrice: 400,
    salesPrice: 500,
    rentalPricing: { hourly: 10, daily: 60, weekly: 360 },
    images: formatImages(sampleImages.audio),
    specifications: {
      brand: 'Shure',
      model: 'SM58 Wireless',
      condition: 'good',
      weight: '0.8kg',
      color: 'Black'
    },
    tags: ['microphone', 'wireless', 'event', 'speech', 'performance'],
    ratings: { average: 4.9, count: 234 }
  },
  {
    name: 'LED Stage Lighting Package',
    description: 'Complete lighting package with 8 RGB LED par cans, DMX controller, and tripod stands. Create stunning visual effects for any event or performance.',
    category: 'Event Equipment',
    quantityOnHand: 6,
    costPrice: 1200,
    salesPrice: 1500,
    rentalPricing: { hourly: 30, daily: 200, weekly: 1200 },
    images: formatImages(sampleImages.lighting),
    specifications: {
      brand: 'Chauvet',
      model: 'LED Package Pro',
      condition: 'like-new',
      weight: '35kg (complete)',
      color: 'Black'
    },
    tags: ['lighting', 'led', 'stage', 'event', 'party', 'dmx'],
    ratings: { average: 4.8, count: 87 }
  },
  {
    name: 'Folding Tables (6ft) - Set of 10',
    description: 'Heavy-duty plastic folding tables. Perfect for conferences, weddings, exhibitions, and outdoor events. Easy to transport and set up.',
    category: 'Event Equipment',
    quantityOnHand: 50,
    costPrice: 50,
    salesPrice: 80,
    rentalPricing: { hourly: 5, daily: 30, weekly: 150 },
    images: formatImages(sampleImages.furniture),
    specifications: {
      brand: 'Lifetime',
      model: 'Commercial Grade',
      condition: 'good',
      dimensions: { length: '6ft', width: '30in', height: '29in' },
      color: 'White'
    },
    tags: ['table', 'folding', 'event', 'conference', 'wedding'],
    ratings: { average: 4.5, count: 312 }
  },
  {
    name: 'Chiavari Chairs - Set of 10',
    description: 'Elegant resin chiavari chairs in gold finish. Perfect for weddings, galas, and upscale events. Stackable and easy to transport.',
    category: 'Event Equipment',
    quantityOnHand: 100,
    costPrice: 30,
    salesPrice: 50,
    rentalPricing: { hourly: 3, daily: 15, weekly: 75 },
    images: formatImages(sampleImages.furniture),
    specifications: {
      brand: 'Flash Furniture',
      model: 'Chiavari Gold',
      condition: 'good',
      weight: '4.5kg',
      color: 'Gold'
    },
    tags: ['chair', 'wedding', 'event', 'elegant', 'chiavari'],
    ratings: { average: 4.7, count: 276 }
  },
  {
    name: 'Photo Booth Package Complete',
    description: 'Professional photo booth setup with DSLR camera, lighting, backdrop, props box, and instant printer. Includes unlimited prints and digital copies.',
    category: 'Event Equipment',
    quantityOnHand: 4,
    costPrice: 2000,
    salesPrice: 2500,
    rentalPricing: { hourly: 50, daily: 350, weekly: 2100 },
    images: formatImages(sampleImages.camera),
    specifications: {
      brand: 'Premium Booth',
      model: 'Pro Package',
      condition: 'like-new',
      weight: '25kg (complete)',
      color: 'Black'
    },
    tags: ['photo-booth', 'event', 'wedding', 'party', 'entertainment'],
    ratings: { average: 4.9, count: 156 }
  },

  // Outdoor & Camping (Vendor 3 - Outdoor Adventures)
  {
    name: '6-Person Camping Tent',
    description: 'Spacious family tent with separate rooms, waterproof rainfly, and easy setup. Perfect for weekend camping trips and outdoor festivals.',
    category: 'Outdoor & Sports',
    quantityOnHand: 15,
    costPrice: 300,
    salesPrice: 400,
    rentalPricing: { hourly: 0, daily: 40, weekly: 200 },
    images: formatImages(sampleImages.tent),
    specifications: {
      brand: 'Coleman',
      model: 'Sundome 6',
      condition: 'good',
      dimensions: { length: '10ft', width: '10ft', height: '6ft' },
      color: 'Green'
    },
    tags: ['tent', 'camping', 'outdoor', 'family', 'waterproof'],
    ratings: { average: 4.6, count: 189 }
  },
  {
    name: 'Mountain Bike - Full Suspension',
    description: 'High-performance mountain bike with 27.5" wheels, hydraulic disc brakes, and full suspension. Perfect for trails and off-road adventures.',
    category: 'Outdoor & Sports',
    quantityOnHand: 20,
    costPrice: 800,
    salesPrice: 1000,
    rentalPricing: { hourly: 15, daily: 80, weekly: 400 },
    images: formatImages(sampleImages.bike),
    specifications: {
      brand: 'Trek',
      model: 'Fuel EX 5',
      condition: 'good',
      weight: '13.5kg',
      color: 'Black/Red'
    },
    tags: ['bike', 'mountain-bike', 'outdoor', 'sports', 'trail'],
    ratings: { average: 4.8, count: 167 }
  },
  {
    name: 'Road Bike - Carbon Frame',
    description: 'Lightweight carbon road bike with Shimano 105 groupset. Ideal for long rides, racing, and fitness training. Includes pedals and water bottle holder.',
    category: 'Outdoor & Sports',
    quantityOnHand: 15,
    costPrice: 1200,
    salesPrice: 1500,
    rentalPricing: { hourly: 20, daily: 120, weekly: 600 },
    images: formatImages(sampleImages.bike),
    specifications: {
      brand: 'Specialized',
      model: 'Allez Sprint',
      condition: 'like-new',
      weight: '8.2kg',
      color: 'Blue/White'
    },
    tags: ['bike', 'road-bike', 'racing', 'fitness', 'carbon'],
    ratings: { average: 4.9, count: 94 }
  },
  {
    name: 'Stand-Up Paddleboard (SUP)',
    description: 'Inflatable SUP with pump, paddle, and carry bag. Perfect for lakes, rivers, and coastal paddling. Easy to transport and store.',
    category: 'Outdoor & Sports',
    quantityOnHand: 12,
    costPrice: 400,
    salesPrice: 500,
    rentalPricing: { hourly: 15, daily: 80, weekly: 400 },
    images: formatImages(sampleImages.tent),
    specifications: {
      brand: 'Blackfin',
      model: 'Model X',
      condition: 'like-new',
      dimensions: { length: '10.6ft', width: '32in', height: '6in' },
      color: 'Blue'
    },
    tags: ['paddleboard', 'sup', 'water-sports', 'outdoor', 'inflatable'],
    ratings: { average: 4.7, count: 123 }
  },
  {
    name: 'Kayak - 2-Person Inflatable',
    description: 'Durable inflatable kayak with aluminum paddles, pump, and repair kit. Great for recreational paddling and fishing. Stable and easy to use.',
    category: 'Outdoor & Sports',
    quantityOnHand: 10,
    costPrice: 350,
    salesPrice: 450,
    rentalPricing: { hourly: 20, daily: 100, weekly: 500 },
    images: formatImages(sampleImages.tent),
    specifications: {
      brand: 'Intex',
      model: 'Explorer K2',
      condition: 'good',
      dimensions: { length: '10.3ft', width: '3ft', height: '1.5ft' },
      color: 'Yellow/Blue'
    },
    tags: ['kayak', 'water-sports', 'outdoor', 'fishing', 'inflatable'],
    ratings: { average: 4.5, count: 156 }
  },
  {
    name: 'Camping Generator - 2000W',
    description: 'Portable inverter generator with quiet operation. Perfect for camping, tailgating, and emergency backup power. Fuel efficient and reliable.',
    category: 'Outdoor & Sports',
    quantityOnHand: 8,
    costPrice: 600,
    salesPrice: 800,
    rentalPricing: { hourly: 0, daily: 60, weekly: 350 },
    images: formatImages(sampleImages.tools),
    specifications: {
      brand: 'Honda',
      model: 'EU2200i',
      condition: 'good',
      weight: '21kg',
      color: 'Red'
    },
    tags: ['generator', 'camping', 'outdoor', 'power', 'portable'],
    ratings: { average: 4.8, count: 87 }
  },
  {
    name: 'Portable Grill - Propane',
    description: 'Compact propane grill perfect for camping, picnics, and tailgating. Two burners, foldable legs, and easy ignition. Includes propane tank.',
    category: 'Outdoor & Sports',
    quantityOnHand: 18,
    costPrice: 200,
    salesPrice: 250,
    rentalPricing: { hourly: 0, daily: 30, weekly: 150 },
    images: formatImages(sampleImages.tools),
    specifications: {
      brand: 'Weber',
      model: 'Q2200',
      condition: 'good',
      weight: '19kg',
      color: 'Black'
    },
    tags: ['grill', 'bbq', 'camping', 'outdoor', 'portable'],
    ratings: { average: 4.6, count: 201 }
  },
  {
    name: 'Cooler - 75 Quart Wheeled',
    description: 'Heavy-duty rolling cooler with 5-day ice retention. Perfect for large gatherings, camping trips, and beach days. Holds up to 100 cans.',
    category: 'Outdoor & Sports',
    quantityOnHand: 25,
    costPrice: 150,
    salesPrice: 200,
    rentalPricing: { hourly: 0, daily: 20, weekly: 100 },
    images: formatImages(sampleImages.tools),
    specifications: {
      brand: 'Coleman',
      model: 'Xtreme 5',
      condition: 'good',
      dimensions: { length: '34in', width: '16in', height: '17in' },
      color: 'Blue'
    },
    tags: ['cooler', 'camping', 'outdoor', 'party', 'beach'],
    ratings: { average: 4.5, count: 178 }
  },

  // Party Supplies (Vendor 4 - Party Supplies Co)
  {
    name: 'Bounce House - Castle Theme',
    description: 'Large inflatable bounce house with castle design. Perfect for kids parties and events. Includes blower, stakes, and safety instructions.',
    category: 'Party Supplies',
    quantityOnHand: 5,
    costPrice: 1500,
    salesPrice: 2000,
    rentalPricing: { hourly: 0, daily: 200, weekly: 1000 },
    images: formatImages(sampleImages.tent),
    specifications: {
      brand: 'Happy Hop',
      model: 'Castle Bouncer',
      condition: 'like-new',
      dimensions: { length: '13ft', width: '13ft', height: '11ft' },
      color: 'Multi-color'
    },
    tags: ['bounce-house', 'party', 'kids', 'inflatable', 'entertainment'],
    ratings: { average: 4.9, count: 234 }
  },
  {
    name: 'Popcorn Machine - Commercial',
    description: 'Professional popcorn machine with warming deck. Makes theater-quality popcorn. Includes popcorn supplies for 50 servings.',
    category: 'Party Supplies',
    quantityOnHand: 10,
    costPrice: 400,
    salesPrice: 500,
    rentalPricing: { hourly: 0, daily: 50, weekly: 250 },
    images: formatImages(sampleImages.tools),
    specifications: {
      brand: 'Great Northern',
      model: 'Foundation 8oz',
      condition: 'good',
      weight: '20kg',
      color: 'Red/Yellow'
    },
    tags: ['popcorn', 'party', 'food', 'event', 'concession'],
    ratings: { average: 4.7, count: 167 }
  },
  {
    name: 'Cotton Candy Machine',
    description: 'Easy-to-use cotton candy maker. Perfect for parties, carnivals, and events. Includes sugar and cones for 50 servings.',
    category: 'Party Supplies',
    quantityOnHand: 8,
    costPrice: 300,
    salesPrice: 400,
    rentalPricing: { hourly: 0, daily: 60, weekly: 300 },
    images: formatImages(sampleImages.tools),
    specifications: {
      brand: 'Carnival King',
      model: 'CCM28',
      condition: 'good',
      weight: '14kg',
      color: 'Pink/White'
    },
    tags: ['cotton-candy', 'party', 'food', 'event', 'concession'],
    ratings: { average: 4.6, count: 143 }
  },
  {
    name: 'Chocolate Fountain - 4-Tier',
    description: 'Elegant stainless steel chocolate fountain. Perfect for weddings, parties, and corporate events. Holds 4 pounds of chocolate.',
    category: 'Party Supplies',
    quantityOnHand: 6,
    costPrice: 250,
    salesPrice: 350,
    rentalPricing: { hourly: 0, daily: 75, weekly: 375 },
    images: formatImages(sampleImages.tools),
    specifications: {
      brand: 'Sephra',
      model: 'Elite',
      condition: 'like-new',
      weight: '7kg',
      color: 'Stainless Steel'
    },
    tags: ['chocolate-fountain', 'party', 'wedding', 'dessert', 'event'],
    ratings: { average: 4.8, count: 112 }
  },
  {
    name: 'Fog Machine with Fluid',
    description: 'Professional fog machine with wireless remote control. Creates atmospheric effects for parties, weddings, and performances. Includes 1 liter of fog fluid.',
    category: 'Party Supplies',
    quantityOnHand: 12,
    costPrice: 150,
    salesPrice: 200,
    rentalPricing: { hourly: 0, daily: 40, weekly: 200 },
    images: formatImages(sampleImages.lighting),
    specifications: {
      brand: 'Chauvet DJ',
      model: 'Hurricane 1000',
      condition: 'good',
      weight: '3.2kg',
      color: 'Black'
    },
    tags: ['fog-machine', 'party', 'effect', 'event', 'atmosphere'],
    ratings: { average: 4.7, count: 89 }
  },
  {
    name: 'Bubble Machine - Professional',
    description: 'High-output bubble machine perfect for parties and events. Creates hundreds of bubbles per minute. Includes bubble solution.',
    category: 'Party Supplies',
    quantityOnHand: 15,
    costPrice: 100,
    salesPrice: 150,
    rentalPricing: { hourly: 0, daily: 25, weekly: 125 },
    images: formatImages(sampleImages.lighting),
    specifications: {
      brand: 'Bubble King',
      model: 'BK-1',
      condition: 'good',
      weight: '2.5kg',
      color: 'Black'
    },
    tags: ['bubble-machine', 'party', 'kids', 'event', 'entertainment'],
    ratings: { average: 4.5, count: 134 }
  },
  {
    name: 'Karaoke Machine with Screen',
    description: 'Complete karaoke system with two wireless microphones, built-in screen, and 10,000+ songs. Perfect for parties and entertainment.',
    category: 'Party Supplies',
    quantityOnHand: 8,
    costPrice: 500,
    salesPrice: 650,
    rentalPricing: { hourly: 0, daily: 80, weekly: 400 },
    images: formatImages(sampleImages.audio),
    specifications: {
      brand: 'Singing Machine',
      model: 'SDL9040',
      condition: 'like-new',
      weight: '8kg',
      color: 'Black'
    },
    tags: ['karaoke', 'party', 'entertainment', 'singing', 'music'],
    ratings: { average: 4.8, count: 176 }
  },
  {
    name: 'Party Tent 20x20ft with Sides',
    description: 'Large white event tent with removable side walls. Perfect for outdoor weddings, graduations, and parties. Includes stakes and setup instructions.',
    category: 'Party Supplies',
    quantityOnHand: 10,
    costPrice: 800,
    salesPrice: 1000,
    rentalPricing: { hourly: 0, daily: 150, weekly: 750 },
    images: formatImages(sampleImages.tent),
    specifications: {
      brand: 'Commercial Grade',
      model: '20x20 Frame',
      condition: 'good',
      dimensions: { length: '20ft', width: '20ft', height: '10ft' },
      color: 'White'
    },
    tags: ['tent', 'party', 'event', 'outdoor', 'wedding'],
    ratings: { average: 4.6, count: 198 }
  },

  // Construction Tools (Vendor 5 - Construction Tools Hub)
  {
    name: 'Concrete Mixer - 5 Cu Ft',
    description: 'Portable electric concrete mixer perfect for small to medium projects. Sturdy steel drum and easy-pour design. 110V power.',
    category: 'Tools & Equipment',
    quantityOnHand: 8,
    costPrice: 400,
    salesPrice: 500,
    rentalPricing: { hourly: 0, daily: 60, weekly: 300 },
    images: formatImages(sampleImages.tools),
    specifications: {
      brand: 'Kushlan',
      model: '600DD',
      condition: 'good',
      weight: '67kg',
      color: 'Orange'
    },
    tags: ['concrete', 'mixer', 'construction', 'tools', 'contractor'],
    ratings: { average: 4.5, count: 87 }
  },
  {
    name: 'Tile Saw - 10 inch Wet Saw',
    description: 'Professional tile saw with water cooling system. Clean, precise cuts for ceramic, porcelain, and stone tiles. Includes stand and blade.',
    category: 'Tools & Equipment',
    quantityOnHand: 12,
    costPrice: 300,
    salesPrice: 400,
    rentalPricing: { hourly: 0, daily: 50, weekly: 250 },
    images: formatImages(sampleImages.tools),
    specifications: {
      brand: 'DEWALT',
      model: 'D24000',
      condition: 'good',
      weight: '32kg',
      color: 'Yellow/Black'
    },
    tags: ['tile-saw', 'tools', 'construction', 'cutting', 'contractor'],
    ratings: { average: 4.7, count: 112 }
  },
  {
    name: 'Pressure Washer - 3000 PSI',
    description: 'Gas-powered pressure washer for heavy-duty cleaning. Perfect for driveways, decks, siding, and equipment. Includes multiple nozzles.',
    category: 'Tools & Equipment',
    quantityOnHand: 15,
    costPrice: 400,
    salesPrice: 500,
    rentalPricing: { hourly: 0, daily: 70, weekly: 350 },
    images: formatImages(sampleImages.tools),
    specifications: {
      brand: 'Simpson',
      model: 'MS60763',
      condition: 'good',
      weight: '29kg',
      color: 'Red/Black'
    },
    tags: ['pressure-washer', 'cleaning', 'tools', 'outdoor', 'contractor'],
    ratings: { average: 4.8, count: 203 }
  },
  {
    name: 'Floor Sander - Drum Type',
    description: 'Professional drum floor sander for hardwood refinishing. Easy to operate with dust collection system. Includes sandpaper.',
    category: 'Tools & Equipment',
    quantityOnHand: 6,
    costPrice: 800,
    salesPrice: 1000,
    rentalPricing: { hourly: 0, daily: 80, weekly: 400 },
    images: formatImages(sampleImages.tools),
    specifications: {
      brand: 'Clarke',
      model: 'Super 7R',
      condition: 'good',
      weight: '43kg',
      color: 'Gray'
    },
    tags: ['floor-sander', 'tools', 'hardwood', 'refinishing', 'contractor'],
    ratings: { average: 4.6, count: 76 }
  },
  {
    name: 'Chainsaw - 18 inch Gas',
    description: 'Powerful gas chainsaw for tree trimming, firewood cutting, and land clearing. Includes safety gear and extra chain.',
    category: 'Tools & Equipment',
    quantityOnHand: 10,
    costPrice: 300,
    salesPrice: 400,
    rentalPricing: { hourly: 0, daily: 45, weekly: 225 },
    images: formatImages(sampleImages.tools),
    specifications: {
      brand: 'Husqvarna',
      model: '450',
      condition: 'good',
      weight: '5.1kg',
      color: 'Orange/Black'
    },
    tags: ['chainsaw', 'tools', 'cutting', 'tree', 'contractor'],
    ratings: { average: 4.7, count: 134 }
  },
  {
    name: 'Scaffolding Set - 5ft x 7ft',
    description: 'Portable aluminum scaffolding with safety rails. Adjustable height up to 12ft. Includes platform, wheels, and stabilizers.',
    category: 'Tools & Equipment',
    quantityOnHand: 8,
    costPrice: 600,
    salesPrice: 800,
    rentalPricing: { hourly: 0, daily: 60, weekly: 300 },
    images: formatImages(sampleImages.tools),
    specifications: {
      brand: 'Werner',
      model: 'PS-48',
      condition: 'good',
      weight: '45kg',
      color: 'Silver'
    },
    tags: ['scaffolding', 'tools', 'construction', 'safety', 'contractor'],
    ratings: { average: 4.8, count: 98 }
  },
  {
    name: 'Air Compressor - 20 Gallon',
    description: 'Portable air compressor for powering pneumatic tools. 150 PSI max pressure, oil-free pump. Perfect for framing, roofing, and finishing.',
    category: 'Tools & Equipment',
    quantityOnHand: 12,
    costPrice: 350,
    salesPrice: 450,
    rentalPricing: { hourly: 0, daily: 50, weekly: 250 },
    images: formatImages(sampleImages.tools),
    specifications: {
      brand: 'Porter-Cable',
      model: 'PXCMF220VW',
      condition: 'good',
      weight: '48kg',
      color: 'Black/Yellow'
    },
    tags: ['air-compressor', 'tools', 'pneumatic', 'construction', 'contractor'],
    ratings: { average: 4.6, count: 145 }
  },
  {
    name: 'Post Hole Digger - Gas Powered',
    description: 'One-man gas auger for digging fence posts, deck footings, and landscaping. Includes 6", 8", and 12" auger bits.',
    category: 'Tools & Equipment',
    quantityOnHand: 5,
    costPrice: 500,
    salesPrice: 650,
    rentalPricing: { hourly: 0, daily: 75, weekly: 375 },
    images: formatImages(sampleImages.tools),
    specifications: {
      brand: 'Earthquake',
      model: 'E43',
      condition: 'good',
      weight: '16kg',
      color: 'Red/Black'
    },
    tags: ['auger', 'post-hole', 'tools', 'landscaping', 'contractor'],
    ratings: { average: 4.7, count: 67 }
  },

  // Additional Popular Items
  {
    name: 'Electric Scooter - Adult',
    description: 'Fast and eco-friendly electric scooter with 25 mile range. Perfect for city commuting and campus transportation. Foldable design.',
    category: 'Transportation',
    quantityOnHand: 20,
    costPrice: 600,
    salesPrice: 800,
    rentalPricing: { hourly: 10, daily: 50, weekly: 250 },
    images: formatImages(sampleImages.bike),
    specifications: {
      brand: 'Segway',
      model: 'Ninebot Max',
      condition: 'like-new',
      weight: '18.7kg',
      color: 'Black'
    },
    tags: ['scooter', 'electric', 'transportation', 'commute', 'eco-friendly'],
    ratings: { average: 4.7, count: 189 }
  },
  {
    name: 'Gaming Console - PlayStation 5',
    description: 'Latest generation gaming console with two controllers and 5 popular games. Perfect for events, parties, and entertainment.',
    category: 'Entertainment',
    quantityOnHand: 15,
    costPrice: 500,
    salesPrice: 600,
    rentalPricing: { hourly: 0, daily: 40, weekly: 200 },
    images: formatImages(sampleImages.laptop),
    specifications: {
      brand: 'Sony',
      model: 'PlayStation 5',
      condition: 'like-new',
      weight: '4.5kg',
      color: 'White'
    },
    tags: ['gaming', 'console', 'entertainment', 'party', 'playstation'],
    ratings: { average: 4.9, count: 267 }
  },
  {
    name: 'Virtual Reality Headset - Meta Quest 3',
    description: 'Standalone VR headset with mixed reality capabilities. Includes 10 popular games and experiences. Perfect for events and entertainment.',
    category: 'Entertainment',
    quantityOnHand: 10,
    costPrice: 500,
    salesPrice: 600,
    rentalPricing: { hourly: 0, daily: 60, weekly: 300 },
    images: formatImages(sampleImages.laptop),
    specifications: {
      brand: 'Meta',
      model: 'Quest 3',
      condition: 'new',
      weight: '515g',
      color: 'White'
    },
    tags: ['vr', 'virtual-reality', 'entertainment', 'gaming', 'technology'],
    ratings: { average: 4.8, count: 134 }
  },
  {
    name: 'Smart TV - 75 inch 4K',
    description: 'Large 4K smart TV perfect for presentations, movie nights, and sports viewing. Includes wall mount and HDMI cables.',
    category: 'Electronics',
    quantityOnHand: 12,
    costPrice: 1000,
    salesPrice: 1300,
    rentalPricing: { hourly: 0, daily: 80, weekly: 400 },
    images: formatImages(sampleImages.projector),
    specifications: {
      brand: 'Samsung',
      model: 'QN75Q80C',
      condition: 'like-new',
      weight: '32kg',
      color: 'Black'
    },
    tags: ['tv', 'smart-tv', '4k', 'presentation', 'entertainment'],
    ratings: { average: 4.7, count: 156 }
  },
  {
    name: 'Professional DSLR Video Kit',
    description: 'Complete video production kit with Canon EOS R6, 3 lenses, stabilizer, lights, microphone, and tripod. Perfect for professional video projects.',
    category: 'Electronics',
    quantityOnHand: 4,
    costPrice: 5000,
    salesPrice: 6000,
    rentalPricing: { hourly: 80, daily: 600, weekly: 3600 },
    images: formatImages(sampleImages.camera),
    specifications: {
      brand: 'Canon',
      model: 'R6 Video Kit',
      condition: 'like-new',
      weight: '15kg (complete)',
      color: 'Black'
    },
    tags: ['camera', 'video', 'professional', 'production', 'dslr'],
    ratings: { average: 5.0, count: 78 }
  },
  {
    name: 'Standing Desk - Electric Adjustable',
    description: 'Ergonomic electric standing desk with memory presets. Perfect for home offices and temporary workspaces. 60x30 inch surface.',
    category: 'Furniture',
    quantityOnHand: 15,
    costPrice: 500,
    salesPrice: 700,
    rentalPricing: { hourly: 0, daily: 40, weekly: 200 },
    images: formatImages(sampleImages.furniture),
    specifications: {
      brand: 'Uplift',
      model: 'V2',
      condition: 'like-new',
      dimensions: { length: '60in', width: '30in', height: '25-50in' },
      color: 'White/Black'
    },
    tags: ['desk', 'standing-desk', 'ergonomic', 'office', 'furniture'],
    ratings: { average: 4.8, count: 112 }
  },
  {
    name: 'Office Chair - Herman Miller Aeron',
    description: 'Premium ergonomic office chair with full adjustability. Perfect for long work sessions and home offices. Size B (medium).',
    category: 'Furniture',
    quantityOnHand: 20,
    costPrice: 800,
    salesPrice: 1000,
    rentalPricing: { hourly: 0, daily: 35, weekly: 175 },
    images: formatImages(sampleImages.furniture),
    specifications: {
      brand: 'Herman Miller',
      model: 'Aeron',
      condition: 'like-new',
      weight: '20kg',
      color: 'Black'
    },
    tags: ['chair', 'office', 'ergonomic', 'furniture', 'herman-miller'],
    ratings: { average: 4.9, count: 234 }
  },
  {
    name: 'Podcast Recording Kit',
    description: 'Complete podcasting setup with 4 microphones, audio interface, headphones, boom arms, and pop filters. Professional sound quality.',
    category: 'Electronics',
    quantityOnHand: 6,
    costPrice: 1200,
    salesPrice: 1500,
    rentalPricing: { hourly: 0, daily: 100, weekly: 500 },
    images: formatImages(sampleImages.audio),
    specifications: {
      brand: 'Rode/Focusrite',
      model: 'Podcast Kit Pro',
      condition: 'new',
      weight: '8kg (complete)',
      color: 'Black'
    },
    tags: ['podcast', 'microphone', 'audio', 'recording', 'professional'],
    ratings: { average: 4.9, count: 98 }
  }
];

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/rental-management')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Clear existing data
      console.log('\n🗑️  Clearing existing data...');
      await User.deleteMany({});
      await Product.deleteMany({});
      console.log('✅ Existing data cleared');

      // Create users
      console.log('\n👥 Creating users...');
      const createdUsers = [];
      
      for (const userData of sampleUsers) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);
        
        const user = await User.create({
          ...userData,
          password: hashedPassword
        });
        createdUsers.push(user);
        console.log(`✅ Created ${user.role}: ${user.email}`);
      }

      // Get vendor IDs
      const vendors = createdUsers.filter(u => u.role === 'vendor');
      
      // Create products and assign to vendors
      console.log('\n📦 Creating products...');
      let productCount = 0;
      
      for (let i = 0; i < sampleProducts.length; i++) {
        const productData = sampleProducts[i];
        
        // Assign products to vendors in round-robin fashion
        const vendorIndex = i % vendors.length;
        const vendor = vendors[vendorIndex];
        
        const product = await Product.create({
          ...productData,
          vendor: vendor._id,
          isPublished: true
        });
        
        productCount++;
        console.log(`✅ Created product ${productCount}: ${product.name} (Vendor: ${vendor.companyName})`);
      }

      console.log('\n✅ Database seeded successfully!');
      console.log('\n📊 Summary:');
      console.log(`   - Users created: ${createdUsers.length}`);
      console.log(`   - Products created: ${productCount}`);
      console.log('\n📝 Sample Login Credentials:');
      console.log('   Admin:');
      console.log('     Email: admin@rentalapp.com');
      console.log('     Password: admin123');
      console.log('\n   Vendor:');
      console.log('     Email: vendor1@rentalapp.com');
      console.log('     Password: vendor123');
      console.log('\n   Customer:');
      console.log('     Email: customer1@example.com');
      console.log('     Password: customer123');
      
      process.exit(0);
    } catch (error) {
      console.error('Error seeding database:', error);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
