
'use client';
import {
  ArrowUpRight,
  CircleDollarSign,
  Package,
  Car,
  AlertTriangle,
} from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Link, useRouter } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import type { CarWashSale, InventoryItem } from '@/types';
import { collection, query, orderBy, limit, where } from 'firebase/firestore';
import * as React from 'react';
import { format } from 'date-fns';
import { CurrencySymbol } from '@/components/currency-symbol';
import { useTranslations } from 'next-intl';

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const t = useTranslations('DashboardPage');

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const salesQuery = useMemoFirebase(
    () =>
      firestore && user
        ? query(collection(firestore, 'users', user.uid, 'sales'), orderBy('date', 'desc'))
        : null,
    [firestore, user]
  );
  
  const recentSalesQuery = useMemoFirebase(
    () =>
      firestore && user
        ? query(collection(firestore, 'users', user.uid, 'sales'), orderBy('date', 'desc'), limit(5))
        : null,
    [firestore, user]
  );

  const inventoryQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'users', user.uid, 'inventory') : null),
    [firestore, user]
  );
  
  const lowStockQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, 'users', user.uid, 'inventory'), where('quantity', '>', 0), where('quantity', '<', 10), limit(5)) : null),
    [firestore, user]
  );


  const { data: sales, isLoading: salesLoading } = useCollection<CarWashSale>(salesQuery);
  const { data: recentSales, isLoading: recentSalesLoading } = useCollection<CarWashSale>(recentSalesQuery);
  const { data: inventoryItems, isLoading: inventoryLoading } = useCollection<InventoryItem>(inventoryQuery);
  const { data: lowStockItems, isLoading: lowStockLoading } = useCollection<InventoryItem>(lowStockQuery);

  const totalRevenue = React.useMemo(() => {
    if (!sales) return 0;
    return sales.reduce((acc, sale) => acc + sale.amount, 0);
  }, [sales]);

  const totalSales = React.useMemo(() => {
    if (!sales) return 0;
    return sales.length;
  }, [sales]);
  
  const totalInventory = React.useMemo(() => {
    if (!inventoryItems) return 0;
    return inventoryItems.reduce((acc, item) => acc + item.quantity, 0);
  }, [inventoryItems]);

  const getStatusBadge = (quantity: number) => {
    if (quantity === 0) {
      return (
        <Badge variant="destructive" className="text-destructive-foreground">
          Out of Stock
        </Badge>
      );
    }
    if (quantity < 10) {
      return (
        <Badge
          variant="destructive"
          className="bg-orange-500 text-white hover:bg-orange-600"
        >
          Low Stock
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="bg-accent text-accent-foreground">
        In Stock
      </Badge>
    );
  };


  if (isUserLoading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalRevenue')}</CardTitle>
            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              {salesLoading ? '...' : totalRevenue.toFixed(2)}
              <CurrencySymbol />
            </div>
            <p className="text-xs text-muted-foreground">
              {t('totalRevenueDescription')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalSales')}</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {salesLoading ? '...' : `+${totalSales}`}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('totalSalesDescription')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('totalInventory')}
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventoryLoading ? '...' : totalInventory}</div>
            <p className="text-xs text-muted-foreground">
              {t('totalInventoryDescription')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('lowStockAlerts')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockLoading ? '...' : lowStockItems?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {t('lowStockAlertsDescription')}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>{t('recentSalesTitle')}</CardTitle>
              <CardDescription>
                {t('recentSalesDescription')}
              </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/sales">
                {t('viewAll')}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('recentSalesService')}</TableHead>
                  <TableHead className="text-right">{t('recentSalesAmount')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSalesLoading && <TableRow><TableCell colSpan={2}>Loading...</TableCell></TableRow>}
                {recentSales?.map((sale) => (
                    <TableRow key={sale.id}>
                        <TableCell>
                            <div className="font-medium">{sale.service}</div>
                            <div className="hidden text-sm text-muted-foreground md:inline">
                                by {sale.staffName} on {format(new Date(sale.date), "PPP")}
                            </div>
                        </TableCell>
                        <TableCell className="text-right flex justify-end items-center gap-1">{sale.amount.toFixed(2)}<CurrencySymbol /></TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center">
                <div className="grid gap-2">
                <CardTitle>{t('lowStockItemsTitle')}</CardTitle>
                <CardDescription>
                    {t('lowStockItemsDescription')}
                </CardDescription>
                </div>
                 <Button asChild size="sm" className="ml-auto gap-1">
                    <Link href="/inventory">
                        {t('viewAll')}
                        <ArrowUpRight className="h-4 w-4" />
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('lowStockItem')}</TableHead>
                             <TableHead>{t('lowStockStatus')}</TableHead>
                            <TableHead className="text-right">{t('lowStockQuantity')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {lowStockLoading && <TableRow><TableCell colSpan={3}>Loading...</TableCell></TableRow>}
                        {lowStockItems?.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell>
                                    <div className="font-medium">{item.name}</div>
                                </TableCell>
                                <TableCell>{getStatusBadge(item.quantity)}</TableCell>
                                <TableCell className="text-right">{item.quantity}</TableCell>
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

    