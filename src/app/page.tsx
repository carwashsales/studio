'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  Package,
  AlertTriangle,
  ShoppingCart,
} from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import type { InventoryItem, CarWashSale, Order } from '@/types';
import { format } from 'date-fns';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const chartConfig = {
  sales: {
    label: 'Sales',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

export default function Dashboard() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const inventoryQuery = useMemoFirebase(() =>
    firestore && user ? collection(firestore, 'inventory') : null
  , [firestore, user]);
  const lowStockQuery = useMemoFirebase(() =>
    firestore && user ? query(collection(firestore, 'inventory'), where('quantity', '<', 10)) : null
  , [firestore, user]);
  const salesQuery = useMemoFirebase(() =>
    firestore && user ? collection(firestore, 'sales') : null
  , [firestore, user]);
  const pendingOrdersQuery = useMemoFirebase(() =>
    firestore && user ? query(collection(firestore, 'orders'), where('status', '==', 'Pending')) : null
  , [firestore, user]);
  const recentSalesQuery = useMemoFirebase(() =>
    firestore && user ? query(collection(firestore, 'sales'), limit(5)) : null
  , [firestore, user]);

  const { data: inventoryItems } = useCollection<InventoryItem>(inventoryQuery);
  const { data: lowStockItems } = useCollection<InventoryItem>(lowStockQuery);
  const { data: salesData } = useCollection<CarWashSale>(salesQuery);
  const { data: pendingOrders } = useCollection<Order>(pendingOrdersQuery);
  const { data: recentSales } = useCollection<CarWashSale>(recentSalesQuery);

  const totalInventoryItems = React.useMemo(() => {
    return inventoryItems?.reduce((acc, item) => acc + item.quantity, 0) || 0;
  }, [inventoryItems]);

  const monthlySales = React.useMemo(() => {
    const salesByMonth: { [key: string]: number } = {};
    salesData?.forEach(sale => {
      const month = format(new Date(sale.date), 'MMM');
      salesByMonth[month] = (salesByMonth[month] || 0) + sale.amount;
    });
    return Object.entries(salesByMonth).map(([month, sales]) => ({ month, sales }));
  }, [salesData]);
  
  if (isUserLoading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="grid gap-4 md:gap-8 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalInventoryItems}</div>
          <p className="text-xs text-muted-foreground">
            Total items across all inventory
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Unique Products
          </CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{inventoryItems?.length || 0}</div>
          <p className="text-xs text-muted-foreground">
            Total unique items in stock
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
          <AlertTriangle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{lowStockItems?.length || 0}</div>
          <p className="text-xs text-muted-foreground">Items need reordering</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingOrders?.length || 0}</div>
          <p className="text-xs text-muted-foreground">New supply orders</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:col-span-4">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="font-headline">Sales Overview</CardTitle>
            <CardDescription>
              A summary of car wash sales over the past months.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <BarChart
                accessibilityLayer
                data={monthlySales}
                margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  tickFormatter={(value) => `${value / 1000}k`}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="sales" fill="var(--color-sales)" radius={8} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Recent Sales</CardTitle>
            <CardDescription>
              An overview of the latest sales activities.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSales?.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="font-medium">
                      {activity.service}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {format(new Date(activity.date), 'PPP')}
                    </TableCell>
                    <TableCell className="text-right flex justify-end items-center">
                      {activity.amount.toFixed(2)} <Image src="/sar.png" alt="SAR" width={16} height={16} className="ml-1" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
