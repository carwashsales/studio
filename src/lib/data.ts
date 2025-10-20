import type { InventoryItem, Order, Sale, Service, Activity } from '@/types';

export const inventoryItems: InventoryItem[] = [
  { id: '1', name: 'Premium Car Shampoo', category: 'Soaps', quantity: 50, location: 'Shelf A1' },
  { id: '2', name: 'Wheel Cleaner', category: 'Chemicals', quantity: 30, location: 'Shelf A2' },
  { id: '3', name: 'Microfiber Towels (Pack of 12)', category: 'Tools', quantity: 8, location: 'Bin B1' },
  { id: '4', name: 'Tire Shine', category: 'Chemicals', quantity: 25, location: 'Shelf A3' },
  { id: '5', name: 'Interior Detailer', category: 'Chemicals', quantity: 40, location: 'Shelf B2' },
  { id: '6', name: 'Glass Cleaner', category: 'Chemicals', quantity: 0, location: 'Shelf B3' },
  { id: '7', name: 'Wax Applicator Pads', category: 'Tools', quantity: 100, location: 'Bin C1' },
  { id: '8', name: 'All-Purpose Cleaner', category: 'Soaps', quantity: 5, location: 'Shelf A1' },
];

export const orders: Order[] = [
  { id: 'ORD-001', supplier: 'Chemical Guys', date: '2023-10-26', status: 'Received', total: 450.00 },
  { id: 'ORD-002', supplier: 'Adam\'s Polishes', date: '2023-10-28', status: 'Received', total: 320.50 },
  { id: 'ORD-003', supplier: 'The Rag Company', date: '2023-11-05', status: 'Shipped', total: 150.75 },
  { id: 'ORD-004', supplier: 'Chemical Guys', date: '2023-11-10', status: 'Pending', total: 600.00 },
  { id: 'ORD-005', supplier: 'Griot\'s Garage', date: '2023-11-12', status: 'Cancelled', total: 210.00 },
];

export const sales: Sale[] = [
  { id: 'SALE-001', service: 'Premium Detail', date: '2023-11-15', amount: 150.00 },
  { id: 'SALE-002', service: 'Deluxe Wash', date: '2023-11-15', amount: 35.00 },
  { id: 'SALE-003', service: 'Basic Wash', date: '2023-11-14', amount: 20.00 },
  { id: 'SALE-004', service: 'Interior Clean', date: '2023-11-14', amount: 75.00 },
  { id: 'SALE-005', service: 'Deluxe Wash', date: '2023-11-13', amount: 35.00 },
];

export const services: Service[] = [
    { id: 'SRV-1', name: 'Basic Wash', description: 'Exterior wash and dry.', price: 20.00 },
    { id: 'SRV-2', name: 'Deluxe Wash', description: 'Basic wash plus tire shine and interior vacuum.', price: 35.00 },
    { id: 'SRV-3', name: 'Premium Detail', description: 'Full exterior and interior detail with wax.', price: 150.00 },
    { id: 'SRV-4', name: 'Interior Clean', description: 'Deep clean of all interior surfaces.', price: 75.00 },
];

export const recentActivities: Activity[] = [
    { id: 'ACT-1', activity: 'Sale', item: 'Premium Detail', status: 'Completed', date: '2023-11-15' },
    { id: 'ACT-2', activity: 'Inventory', item: 'All-Purpose Cleaner', status: 'Low Stock', date: '2023-11-15' },
    { id: 'ACT-3', activity: 'Order', item: 'ORD-003', status: 'Shipped', date: '2023-11-14' },
    { id: 'ACT-4', activity: 'Inventory', item: 'Glass Cleaner', status: 'Out of Stock', date: '2023-11-14' },
    { id: 'ACT-5', activity: 'Sale', item: 'Basic Wash', status: 'Completed', date: '2023-11-14' },
];

export const salesData = [
  { month: 'Jan', sales: 1860 },
  { month: 'Feb', sales: 3050 },
  { month: 'Mar', sales: 2370 },
  { month: 'Apr', sales: 7300 },
  { month: 'May', sales: 2090 },
  { month: 'Jun', sales: 2140 },
];

export const inventoryUsageData = [
    { name: 'Shampoo', usage: 400 },
    { name: 'Wheel Cleaner', usage: 300 },
    { name: 'Tire Shine', usage: 200 },
    { name: 'Interior Detailer', usage: 278 },
    { name: 'Towels', usage: 189 },
];

export const costData = [
    { month: 'Jan', cost: 500 },
    { month: 'Feb', cost: 700 },
    { month: 'Mar', cost: 650 },
    { month: 'Apr', cost: 800 },
    { month: 'May', cost: 750 },
    { month: 'Jun', cost: 900 },
];

export const salesByServiceData = [
    { service: 'Basic Wash', sales: 4000, fill: 'var(--color-wash)' },
    { service: 'Deluxe Wash', sales: 6500, fill: 'var(--color-deluxe)' },
    { service: 'Premium Detail', sales: 3500, fill: 'var(--color-premium)' },
    { service: 'Interior Clean', sales: 2500, fill: 'var(--color-interior)' },
];
