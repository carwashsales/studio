
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DonutChart, LineChart, Legend } from "@tremor/react";
import * as React from "react";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection } from "firebase/firestore";
import type { InventoryItem, Order, CarWashSale } from "@/types";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

export default function ReportsPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  
  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const inventoryCollection = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'users', user.uid, "inventory") : null),
    [firestore, user]
  );
  const ordersCollection = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'users', user.uid, "orders") : null),
    [firestore, user]
  );
  const salesCollection = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'users', user.uid, "sales") : null),
    [firestore, user]
  );

  const { data: inventoryItems } = useCollection<InventoryItem>(inventoryCollection);
  const { data: orders } = useCollection<Order>(ordersCollection);
  const { data: sales } = useCollection<CarWashSale>(salesCollection);

  const costData = React.useMemo(() => {
    if (!orders) return [];
    const monthlyCosts: { [key: string]: number } = {};
    orders.forEach((order) => {
      const month = format(new Date(order.date), "MMM yy");
      monthlyCosts[month] = (monthlyCosts[month] || 0) + order.total;
    });
    return Object.entries(monthlyCosts).map(([date, Cost]) => ({ date, Cost }));
  }, [orders]);

  const salesByServiceData = React.useMemo(() => {
    if (!sales) return [];
    const serviceSales: { [key: string]: number } = {};
    sales.forEach((sale) => {
      const serviceName = sale.service;
      serviceSales[serviceName] = (serviceSales[serviceName] || 0) + sale.amount;
    });
    return Object.entries(serviceSales).map(([name, value]) => ({
      name,
      value,
    }));
  }, [sales]);
  
  const inventoryChartData = React.useMemo(() => {
    if (!inventoryItems) return [];
    return inventoryItems.map((item) => ({
        name: item.name,
        value: item.quantity,
    }));
  }, [inventoryItems]);

  if (isUserLoading || !user) {
    return <div>Loading...</div>;
  }

  const valueFormatter = (number: number) => `SAR ${new Intl.NumberFormat('us').format(number).toString()}`;


  return (
    <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Inventory Composition</CardTitle>
          <CardDescription>
            Proportional breakdown of items in your inventory.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
           <DonutChart
              data={inventoryChartData}
              category="value"
              index="name"
              className="h-[300px]"
            />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Supply Costs</CardTitle>
          <CardDescription>Monthly supply costs over time.</CardDescription>
        </CardHeader>
        <CardContent>
           <LineChart
              data={costData}
              index="date"
              categories={['Cost']}
              colors={['blue']}
              valueFormatter={valueFormatter}
              yAxisWidth={60}
              className="h-[300px]"
            />
        </CardContent>
      </Card>
      
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="font-headline">Sales by Service</CardTitle>
          <CardDescription>
            Breakdown of sales revenue by service type.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
            <DonutChart
                data={salesByServiceData}
                category="value"
                index="name"
                valueFormatter={valueFormatter}
                className="h-[350px]"
             />
             <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
                {salesByServiceData.map(item => (
                    <div key={item.name} className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{item.name}</span>
                    </div>
                ))}
             </div>
        </CardContent>
      </Card>
    </div>
  );
}

