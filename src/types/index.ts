export type InventoryItem = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  location: string;
};

export type Order = {
  id: string;
  supplier: string;
  date: string; // ISO 8601 date string
  status: 'Pending' | 'Shipped' | 'Received' | 'Cancelled';
  total: number;
};

export type CarWashSale = {
  id: string;
  service: string;
  staffName: string;
  carSize?: string;
  date: string; // ISO 8601 date string
  amount: number;
  commission: number;
  hasCoupon: boolean;
  paymentMethod?: 'coupon' | 'cash' | 'machine' | 'not-paid';
  waxAddOn: boolean;
  isPaid: boolean;
};

export type Price = {
  id: string;
  name: string;
  description: string;
  price: number;
};

export type Staff = {
  id: string;
  name: string;
};

export type Activity = {
  id: string;
  activity: 'Sale' | 'Inventory' | 'Order';
  item: string;
  status: 'Completed' | 'Low Stock' | 'Out of Stock' | 'Shipped' | 'Pending';
  date: string;
};
