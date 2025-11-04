
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
  TableFooter
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, ListFilter } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import * as React from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser, addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc, updateDoc } from 'firebase/firestore';
import type { Order } from '@/types';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { CurrencySymbol } from '@/components/currency-symbol';
import { useFormatter } from 'next-intl';

type StatusFilter = "all" | Order['status'];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'Received':
      return (
        <Badge className="bg-accent text-accent-foreground">{status}</Badge>
      );
    case 'Shipped':
      return <Badge variant="secondary">{status}</Badge>;
    case 'Pending':
      return <Badge variant="outline">{status}</Badge>;
    case 'Cancelled':
      return <Badge variant="destructive">{status}</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

function OrderDialog({ mode, order, children }: { mode: 'add' | 'edit', order?: Order, children: React.ReactNode }) {
  const firestore = useFirestore();
  const { user } = useUser();
  const ordersCollection = useMemoFirebase(() => (firestore && user ? collection(firestore, 'users', user.uid, 'orders') : null), [firestore, user]);
  const { toast } = useToast();
  const formatNumber = useFormatter().number;

  const [supplier, setSupplier] = React.useState(order?.supplier || '');
  const [total, setTotal] = React.useState(order?.total?.toString() || '');
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setSupplier(order?.supplier || '');
      setTotal(order?.total?.toString() || '');
    }
  }, [open, order]);

  const handleSubmit = () => {
    if (!firestore || !user) return;
    const orderData = {
      supplier,
      total: parseFloat(total) || 0,
      date: order?.date || new Date().toISOString(),
      status: order?.status || 'Pending',
    };

    if (mode === 'add') {
      if (!ordersCollection) return;
      addDocumentNonBlocking(ordersCollection, orderData);
      toast({ title: "Order Created", description: `New order for ${supplier} has been placed.` });
    } else if (mode === 'edit' && order) {
      const orderRef = doc(firestore, 'users', user.uid, 'orders', order.id);
      setDocumentNonBlocking(orderRef, orderData, { merge: true });
      toast({ title: "Order Updated", description: `Order ${order.id} has been updated.` });
    }
    
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Create New Order' : 'Edit Order'}</DialogTitle>
          <DialogDescription>
            {mode === 'add' ? 'Enter the details for the new supply order.' : `Editing order ${order?.id}`}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="supplier" className="text-right">
              Supplier
            </Label>
            <Input
              id="supplier"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              className="col-span-3"
              placeholder="Supplier name"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="total" className="text-right">
              Total Amount
            </Label>
            <Input
              id="total"
              type="number"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              className="col-span-3"
              placeholder="0.00"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit}>{mode === 'add' ? 'Create Order' : 'Save Changes'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function OrdersPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');
  const formatNumber = useFormatter().number;
  
  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const ordersCollection = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'users', user.uid, 'orders') : null),
    [firestore, user]
  );
  const { data: orders, isLoading } = useCollection<Order>(ordersCollection);

  const filteredOrders = React.useMemo(() => {
    if (!orders) return [];
    if (statusFilter === 'all') return orders;
    return orders.filter(order => order.status === statusFilter);
  }, [orders, statusFilter]);

  const totalReceived = React.useMemo(() => {
    if (!orders) return 0;
    return orders
      .filter(order => order.status === 'Received')
      .reduce((acc, order) => acc + order.total, 0);
  }, [orders]);


  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    if (!firestore || !user) return;
    const orderRef = doc(firestore, 'users', user.uid, 'orders', orderId);
    await updateDoc(orderRef, { status });
    toast({
        title: 'Order Updated',
        description: `Order has been marked as ${status}.`,
    });
  };

  const handleDeleteOrder = (orderId: string) => {
    if (!firestore || !user) return;
    const orderRef = doc(firestore, 'users', user.uid, 'orders', orderId);
    deleteDocumentNonBlocking(orderRef);
    toast({ variant: "destructive", title: "Order Deleted", description: `Order ${orderId} has been deleted.` });
  };

  if (isUserLoading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <CardTitle className="font-headline">Orders</CardTitle>
            <CardDescription>
              Create and manage orders for new supplies.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                  <ListFilter className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Filter
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem checked={statusFilter === 'all'} onCheckedChange={() => setStatusFilter('all')}>All</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter === 'Pending'} onCheckedChange={() => setStatusFilter('Pending')}>Pending</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter === 'Shipped'} onCheckedChange={() => setStatusFilter('Shipped')}>Shipped</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter === 'Received'} onCheckedChange={() => setStatusFilter('Received')}>Received</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter === 'Cancelled'} onCheckedChange={() => setStatusFilter('Cancelled')}>Cancelled</DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <OrderDialog mode="add">
              <Button size="sm" className="h-8 gap-1">
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  New Order
                  </span>
              </Button>
            </OrderDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden sm:table-cell">Order ID</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={6}>Loading...</TableCell></TableRow>}
            {filteredOrders && filteredOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="hidden sm:table-cell font-medium truncate max-w-[100px]">{order.id}</TableCell>
                <TableCell>
                  {order.supplier}
                </TableCell>
                <TableCell>{getStatusBadge(order.status)}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {format(new Date(order.date), 'Pp')}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end items-center gap-1">
                    {formatNumber(order.total, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <CurrencySymbol />
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <OrderDialog mode="edit" order={order}>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Edit</DropdownMenuItem>
                      </OrderDialog>
                      <DropdownMenuItem onClick={() => handleDeleteOrder(order.id)}>Delete</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                       {order.status !== 'Shipped' && <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'Shipped')}>Mark as Shipped</DropdownMenuItem>}
                       {order.status === 'Shipped' && <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'Received')}>Mark as Received</DropdownMenuItem>}
                       {order.status !== 'Cancelled' && <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'Cancelled')}>Mark as Cancelled</DropdownMenuItem>}
                       {order.status === 'Cancelled' && <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'Pending')}>Mark as Pending</DropdownMenuItem>}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={5} className="text-right font-bold">Total Cost of Received Orders</TableCell>
              <TableCell className="text-right font-bold">
                <div className="flex justify-end items-center gap-1">
                  {formatNumber(totalReceived, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <CurrencySymbol />
                </div>
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}

    