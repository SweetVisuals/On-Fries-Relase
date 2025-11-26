import { MenuItem, Order, Customer, StockItem } from './types';
import { Utensils, Coffee, Beer, Carrot, Apple } from 'lucide-react';
import React from 'react';

export const MOCK_MENU: MenuItem[] = [
   {
     id: '2',
     name: 'Deluxe Steak & Fries',
     description: 'Premium quality steak with our signature fries and special seasoning.',
     price: 20.00,
     category: 'Main',
     image: 'https://146870153.cdn6.editmysite.com/uploads/1/4/6/8/146870153/6OOSSLNURTSVHRO36DLMV6C6.png?width=1280&dpr=1',
     image_url: 'https://146870153.cdn6.editmysite.com/uploads/1/4/6/8/146870153/6OOSSLNURTSVHRO36DLMV6C6.png?width=1280&dpr=1',
     is_available: true,
     time: '25 min'
   },
   {
     id: '1',
     name: 'Steak & Fries',
     description: 'Premium steak served with crispy fries and signature seasoning.',
     price: 12.00,
     category: 'Main',
     image: 'https://146870153.cdn6.editmysite.com/uploads/1/4/6/8/146870153/DXFSUZVE3QCNQ3N5KPF7ZJTE.png?width=1280&dpr=1',
     image_url: 'https://146870153.cdn6.editmysite.com/uploads/1/4/6/8/146870153/DXFSUZVE3QCNQ3N5KPF7ZJTE.png?width=1280&dpr=1',
     is_available: true,
     time: '20 min'
   },
  {
    id: '3',
    name: 'Steak Only',
    description: 'Premium steak without fries.',
    price: 10.00,
    category: 'Main',
    image: 'https://146870153.cdn6.editmysite.com/uploads/1/4/6/8/146870153/DXFSUZVE3QCNQ3N5KPF7ZJTE.png?width=1280&dpr=1',
    image_url: 'https://146870153.cdn6.editmysite.com/uploads/1/4/6/8/146870153/DXFSUZVE3QCNQ3N5KPF7ZJTE.png?width=1280&dpr=1',
    is_available: true,
    time: '15 min'
  },
  {
    id: '4',
    name: 'Signature Fries',
    description: 'Our signature crispy fries with special seasoning.',
    price: 4.00,
    category: 'Sides',
    image: 'https://146870153.cdn6.editmysite.com/uploads/1/4/6/8/146870153/F4SJYJKOG4HP5W3QK3UUSJMK.png?width=1280&dpr=1',
    image_url: 'https://146870153.cdn6.editmysite.com/uploads/1/4/6/8/146870153/F4SJYJKOG4HP5W3QK3UUSJMK.png?width=1280&dpr=1',
    is_available: true,
    time: '5 min'
  },
  {
    id: '5',
    name: 'Kids Meal',
    description: 'Specially curated meal for kids.',
    price: 10.00,
    category: 'Kids',
    image: 'https://146870153.cdn6.editmysite.com/uploads/1/4/6/8/146870153/DXFSUZVE3QCNQ3N5KPF7ZJTE.png?width=1280&dpr=1',
    image_url: 'https://146870153.cdn6.editmysite.com/uploads/1/4/6/8/146870153/DXFSUZVE3QCNQ3N5KPF7ZJTE.png?width=1280&dpr=1',
    is_available: true,
    time: '15 min'
  },
  {
    id: '6',
    name: 'Kids Fries',
    description: 'Small portion of our signature fries for kids.',
    price: 2.00,
    category: 'Kids',
    image: 'https://146870153.cdn6.editmysite.com/uploads/1/4/6/8/146870153/F4SJYJKOG4HP5W3QK3UUSJMK.png?width=1280&dpr=1',
    image_url: 'https://146870153.cdn6.editmysite.com/uploads/1/4/6/8/146870153/F4SJYJKOG4HP5W3QK3UUSJMK.png?width=1280&dpr=1',
    is_available: true,
    time: '5 min'
  },
  {
    id: '7',
    name: 'Coke',
    description: 'Classic Coke soft drink.',
    price: 1.50,
    category: 'Drinks',
    image: 'https://146870153.cdn6.editmysite.com/uploads/1/4/6/8/146870153/YKJMQTYWVUGLVJ5B3ZCGQG2A.png?width=1280&dpr=1',
    image_url: 'https://146870153.cdn6.editmysite.com/uploads/1/4/6/8/146870153/YKJMQTYWVUGLVJ5B3ZCGQG2A.png?width=1280&dpr=1',
    is_available: true,
    time: '0 min'
  },
  {
    id: '8',
    name: 'Coke Zero',
    description: 'Zero sugar Coca-Cola soft drink.',
    price: 1.50,
    category: 'Drinks',
    image: 'https://146870153.cdn6.editmysite.com/uploads/1/4/6/8/146870153/XGIYCNYWF23HFU37YSMNFE3S.png?width=1280&dpr=1',
    image_url: 'https://146870153.cdn6.editmysite.com/uploads/1/4/6/8/146870153/XGIYCNYWF23HFU37YSMNFE3S.png?width=1280&dpr=1',
    is_available: true,
    time: '0 min'
  },
  {
    id: '9',
    name: 'Tango Mango',
    description: 'Tango Mango flavored soft drink.',
    price: 1.50,
    category: 'Drinks',
    image: 'https://146870153.cdn6.editmysite.com/uploads/1/4/6/8/146870153/YPB5YADLUFL73LJVFDSZJYTY.png?width=1280&dpr=1',
    image_url: 'https://146870153.cdn6.editmysite.com/uploads/1/4/6/8/146870153/YPB5YADLUFL73LJVFDSZJYTY.png?width=1280&dpr=1',
    is_available: true,
    time: '0 min'
  },
  {
    id: '10',
    name: 'Sprite',
    description: 'Refreshing Sprite soft drink.',
    price: 1.50,
    category: 'Drinks',
    image: 'https://146870153.cdn6.editmysite.com/uploads/1/4/6/8/146870153/YKJMQTYWVUGLVJ5B3ZCGQG2A.png?width=1280&dpr=1',
    image_url: 'https://146870153.cdn6.editmysite.com/uploads/1/4/6/8/146870153/YKJMQTYWVUGLVJ5B3ZCGQG2A.png?width=1280&dpr=1',
    is_available: true,
    time: '0 min'
  }
];

export const MOCK_ORDERS: Order[] = [
  {
    id: '#002',
    customerName: 'Manual Order',
    status: 'pending',
    items: [
      { menuItemId: '2', name: 'Deluxe Steak & Fries', quantity: 1, price: 20.00, addons: ['Steak'] },
      { menuItemId: '6', name: 'Kids Fries', quantity: 1, price: 2.00, addons: [] }
    ],
    total: 22.00,
    createdAt: new Date().toISOString(),
    estimatedTime: '22:55'
  },
  {
    id: '#001',
    customerName: 'Customer Test',
    status: 'delivered',
    items: [
      { menuItemId: '1', name: 'Steak & Fries', quantity: 1, price: 12.00, addons: [] }
    ],
    total: 12.00,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    estimatedTime: '22:00'
  }
];

export const MOCK_CUSTOMERS: Customer[] = [
  { id: 'C1', name: 'Customer Test', email: 'acedkmgmt@gmail.com', totalOrders: 1, totalSpent: 32.00, lastOrderDate: '20/11/2025', status: 'Active', segment: 'VIP' },
  { id: 'C2', name: 'Nicolas Theato', email: 'nicolastheato@gmail.com', totalOrders: 0, totalSpent: 0.00, lastOrderDate: '01/11/2025', status: 'Active', segment: 'Regular' },
  { id: 'C3', name: 'James Olias', email: 'jamesolias18@gmail.com', totalOrders: 0, totalSpent: 0.00, lastOrderDate: '10/11/2025', status: 'Active', segment: 'New' },
];

export const MOCK_STOCK: StockItem[] = [
  // Trailer - Food
  { id: 's1', name: 'Steaks', category: 'Food', quantity: 10, location: 'Trailer', supplier: '', notes: '', lowStockThreshold: 5 },
  { id: 's2', name: 'Lamb', category: 'Food', quantity: 10, location: 'Trailer', supplier: '', notes: '', lowStockThreshold: 5 },
  { id: 's3', name: 'Short Rib', category: 'Food', quantity: 10, location: 'Trailer', supplier: '', notes: '', lowStockThreshold: 5 },
  { id: 's4', name: 'Fries', category: 'Food', quantity: 50, location: 'Trailer', supplier: '', notes: '', lowStockThreshold: 5 },
  { id: 's5', name: 'Red Sauce', category: 'Food', quantity: 20, location: 'Trailer', supplier: '', notes: '', lowStockThreshold: 5 },
  { id: 's6', name: 'Green Sauce', category: 'Food', quantity: 20, location: 'Trailer', supplier: '', notes: '', lowStockThreshold: 5 },
  { id: 's7', name: 'Chip Seasoning', category: 'Food', quantity: 15, location: 'Trailer', supplier: '', notes: '', lowStockThreshold: 5 },
  { id: 's8', name: 'Ketchup', category: 'Food', quantity: 25, location: 'Trailer', supplier: '', notes: '', lowStockThreshold: 5 },
  { id: 's9', name: 'Mayo', category: 'Food', quantity: 25, location: 'Trailer', supplier: '', notes: '', lowStockThreshold: 5 },

  // Trailer - Drinks
  { id: 's10', name: 'Coke', category: 'Drinks', quantity: 30, location: 'Trailer', supplier: '', notes: '', lowStockThreshold: 5 },
  { id: 's11', name: 'Coke Zero', category: 'Drinks', quantity: 30, location: 'Trailer', supplier: '', notes: '', lowStockThreshold: 5 },
  { id: 's12', name: 'Tango Mango', category: 'Drinks', quantity: 30, location: 'Trailer', supplier: '', notes: '', lowStockThreshold: 5 },
  { id: 's13', name: 'Sprite', category: 'Drinks', quantity: 30, location: 'Trailer', supplier: '', notes: '', lowStockThreshold: 5 },

  // Trailer - Essentials
  { id: 's14', name: 'Napkins', category: 'Essentials', quantity: 100, location: 'Trailer', supplier: '', notes: '', lowStockThreshold: 5 },
  { id: 's15', name: 'Deluxe Boxes', category: 'Essentials', quantity: 50, location: 'Trailer', supplier: '', notes: '', lowStockThreshold: 5 },
  { id: 's16', name: 'Single Boxes', category: 'Essentials', quantity: 50, location: 'Trailer', supplier: '', notes: '', lowStockThreshold: 5 },
  { id: 's17', name: 'Takeaway Bags', category: 'Essentials', quantity: 40, location: 'Trailer', supplier: '', notes: '', lowStockThreshold: 5 },
  { id: 's18', name: 'Pots for Sauce', category: 'Essentials', quantity: 20, location: 'Trailer', supplier: '', notes: '', lowStockThreshold: 5 },
  { id: 's19', name: 'Blue Roll', category: 'Essentials', quantity: 10, location: 'Trailer', supplier: '', notes: '', lowStockThreshold: 5 },
  { id: 's20', name: 'Cutlery', category: 'Essentials', quantity: 200, location: 'Trailer', supplier: '', notes: '', lowStockThreshold: 5 },
  { id: 's21', name: 'Cilit Bang', category: 'Essentials', quantity: 5, location: 'Trailer', supplier: '', notes: '', lowStockThreshold: 5 },
  { id: 's22', name: 'Hand Sanitizer', category: 'Essentials', quantity: 10, location: 'Trailer', supplier: '', notes: '', lowStockThreshold: 5 },

  // Trailer - Ingredients
  { id: 's23', name: 'Cooking Oil (20ml)', category: 'Ingredients', quantity: 100, location: 'Trailer', supplier: '', notes: '', lowStockThreshold: 5 },

  // Lockup - Food
  { id: 's24', name: 'Steaks', category: 'Food', quantity: 20, location: 'Lockup', supplier: '', notes: '', lowStockThreshold: 5 },
  { id: 's25', name: 'Lamb', category: 'Food', quantity: 20, location: 'Lockup', supplier: '', notes: '', lowStockThreshold: 5 },
  { id: 's26', name: 'Short Rib', category: 'Food', quantity: 20, location: 'Lockup', supplier: '', notes: '', lowStockThreshold: 5 },
  { id: 's27', name: 'Fries', category: 'Food', quantity: 100, location: 'Lockup', supplier: '', notes: '', lowStockThreshold: 5 },
  { id: 's28', name: 'Red Sauce', category: 'Food', quantity: 40, location: 'Lockup', supplier: '', notes: '', lowStockThreshold: 5 },
  { id: 's29', name: 'Green Sauce', category: 'Food', quantity: 40, location: 'Lockup', supplier: '', notes: '', lowStockThreshold: 5 },
  { id: 's30', name: 'Chip Seasoning', category: 'Food', quantity: 30, location: 'Lockup', supplier: '', notes: '', lowStockThreshold: 5 },
  { id: 's31', name: 'Ketchup', category: 'Food', quantity: 50, location: 'Lockup', supplier: '', notes: '', lowStockThreshold: 5 },
  { id: 's32', name: 'Mayo', category: 'Food', quantity: 50, location: 'Lockup', supplier: '', notes: '', lowStockThreshold: 5 },

  // Lockup - Drinks
  { id: 's33', name: 'Coke', category: 'Drinks', quantity: 60, location: 'Lockup', supplier: '', notes: '', lowStockThreshold: 5 },
  { id: 's34', name: 'Coke Zero', category: 'Drinks', quantity: 60, location: 'Lockup', supplier: '', notes: '', lowStockThreshold: 5 },
  { id: 's35', name: 'Tango Mango', category: 'Drinks', quantity: 60, location: 'Lockup', supplier: '', notes: '', lowStockThreshold: 5 },
  { id: 's36', name: 'Sprite', category: 'Drinks', quantity: 60, location: 'Lockup', supplier: '', notes: '', lowStockThreshold: 5 },

  // Lockup - Essentials
  { id: 's37', name: 'Napkins', category: 'Essentials', quantity: 200, location: 'Lockup', supplier: '', notes: '', lowStockThreshold: 5 },
  { id: 's38', name: 'Deluxe Boxes', category: 'Essentials', quantity: 200, location: 'Lockup', supplier: '', notes: '', lowStockThreshold: 5 },
  { id: 's39', name: 'Single Boxes', category: 'Essentials', quantity: 200, location: 'Lockup', supplier: '', notes: '', lowStockThreshold: 5 },
  { id: 's40', name: 'Takeaway Bags', category: 'Essentials', quantity: 160, location: 'Lockup', supplier: '', notes: '', lowStockThreshold: 5 },
  { id: 's41', name: 'Pots for Sauce', category: 'Essentials', quantity: 80, location: 'Lockup', supplier: '', notes: '', lowStockThreshold: 5 },
  { id: 's42', name: 'Blue Roll', category: 'Essentials', quantity: 40, location: 'Lockup', supplier: '', notes: '', lowStockThreshold: 5 },
  { id: 's43', name: 'Cutlery', category: 'Essentials', quantity: 800, location: 'Lockup', supplier: '', notes: '', lowStockThreshold: 5 },
  { id: 's44', name: 'Cilit Bang', category: 'Essentials', quantity: 20, location: 'Lockup', supplier: '', notes: '', lowStockThreshold: 5 },
  { id: 's45', name: 'Hand Sanitizer', category: 'Essentials', quantity: 40, location: 'Lockup', supplier: '', notes: '', lowStockThreshold: 5 },

  // Lockup - Ingredients
  { id: 's46', name: 'Cooking Oil (20ml)', category: 'Ingredients', quantity: 400, location: 'Lockup', supplier: '', notes: '', lowStockThreshold: 5 },
];

export const CATEGORIES = [
  { id: 'all', label: 'All', icon: null },
  { id: 'Main', label: 'Steak', icon: <Utensils className="w-4 h-4" /> },
  { id: 'Sides', label: 'Fries', icon: <Apple className="w-4 h-4" /> },
  { id: 'Kids', label: 'Kids', icon: <Carrot className="w-4 h-4" /> },
  { id: 'Drinks', label: 'Drinks', icon: <Coffee className="w-4 h-4" /> },
];

// Stock requirements for menu items
// Maps menu item NAME to array of required stock item names
export const MENU_STOCK_REQUIREMENTS: Record<string, string[]> = {
  'Deluxe Steak & Fries': ['Steaks', 'Fries'],
  'Steak & Fries': ['Steaks', 'Fries'],
  'Steak Only': ['Steaks'],
  'Signature Fries': ['Fries'],
  'Kids Meal': ['Steaks', 'Fries'],
  'Kids Fries': ['Fries'],
  'Coke': ['Coke'],
  'Coke Zero': ['Coke Zero'],
  'Tango Mango': ['Tango Mango'],
  'Sprite': ['Sprite'],
};

// Addon prices - different prices for items when used as addons
export const ADDON_PRICES: Record<string, number> = {
  'Short Rib': 6.00,
  'Lamb': 11.00,
  'Steak': 10.00,
  'Green Sauce': 0.50,
  'Red Sauce': 0.50,
  'Coke': 1.50,
  'Coke Zero': 1.50,
  'Tango Mango': 1.50,
  'Sprite': 1.50,
};

// Item addons mapping - defines which extras and sauces are available for each menu item
export const ITEM_ADDONS: Record<string, { extras: string[], sauces: string[], drinks?: string[] }> = {
  'Deluxe Steak & Fries': {
    extras: ['Short Rib', 'Lamb', 'Steak'],
    sauces: ['Green Sauce', 'Red Sauce'],
    drinks: ['Coke', 'Coke Zero', 'Tango Mango', 'Sprite']
  },
  'Steak & Fries': {
    extras: ['Short Rib', 'Lamb', 'Steak'],
    sauces: ['Green Sauce', 'Red Sauce'],
    drinks: ['Coke', 'Coke Zero', 'Tango Mango', 'Sprite']
  },
  'Steak Only': {
    extras: ['Short Rib', 'Lamb', 'Steak'],
    sauces: ['Green Sauce', 'Red Sauce'],
    drinks: ['Coke', 'Coke Zero', 'Tango Mango', 'Sprite']
  },
  'Signature Fries': {
    extras: [],
    sauces: ['Green Sauce', 'Red Sauce'],
    drinks: ['Coke', 'Coke Zero', 'Tango Mango', 'Sprite']
  },
  'Kids Meal': {
    extras: ['Short Rib', 'Lamb', 'Steak'],
    sauces: ['Green Sauce', 'Red Sauce'],
    drinks: ['Coke', 'Coke Zero', 'Tango Mango', 'Sprite']
  },
  'Kids Fries': {
    extras: [],
    sauces: ['Green Sauce', 'Red Sauce'],
    drinks: ['Coke', 'Coke Zero', 'Tango Mango', 'Sprite']
  }
};