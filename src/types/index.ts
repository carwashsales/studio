
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
    date: string;
    status: 'Pending' | 'Shipped' | 'Received' | 'Cancelled';
    total: number;
};

export type CarWashSale = {
    id: string;
    service: string;
    date: string;
    amount: number;
};

export type Service = {
    id: string;
    name: string;
    description: string;
    price: number;
};

export type Activity = {
    id: string;
    activity: 'Sale' | 'Inventory' | 'Order';
    item: string;
    status: 'Completed' | 'Low Stock' | 'Out of Stock' | 'Shipped' | 'Pending';
    date: string;
};
