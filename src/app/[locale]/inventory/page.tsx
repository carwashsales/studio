
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, ListFilter } from 'lucide-react';
import * as React from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser, addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { InventoryItem } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { CurrencySymbol } from '@/components/currency-symbol';
import { useFormatter } from 'next-intl';

type StatusFilter = "all" | "in-stock" | "low-stock" | "out-of-stock";

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

function ItemDialog({ mode, item, children }: { mode: 'add' | 'edit', item?: InventoryItem, children: React.ReactNode }) {
  const firestore = useFirestore();
  const { user } = useUser();
  const inventoryCollection = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'users', user.uid, 'inventory') : null),
    [firestore, user]
  );
  const { toast } = useToast();
  const formatNumber = useFormatter().number;

  const [name, setName] = React.useState(item?.name || '');
  const [category, setCategory] = React.useState(item?.category || '');
  const [quantity, setQuantity] = React.useState(item?.quantity || 0);
  const [purchasePrice, setPurchasePrice] = React.useState(item?.purchasePrice || 0);
  const [open, setOpen] = React.useState(false);
  
  React.useEffect(() => {
    if (open) {
        if (mode === 'edit' && item) {
            setName(item.name);
            setCategory(item.category ?? '');
            setQuantity(item.quantity);
            setPurchasePrice(item.purchasePrice || 0);
        } else if (mode === 'add') {
            // Reset form on open for add mode
            setName('');
            setCategory('');
            setQuantity(0);
            setPurchasePrice(0);
        }
    }
  }, [open, item, mode]);

  const handleSubmit = () => {
    if (!firestore || !user) return;
    if (mode === 'add') {
        if (!inventoryCollection) return;
        const newItem: Omit<InventoryItem, 'id'> = { name, category, quantity, purchasePrice };
        addDocumentNonBlocking(inventoryCollection, newItem);
        toast({ title: "Item Added", description: `${name} has been added to the inventory.`});
    } else if (mode === 'edit' && item) {
        const itemRef = doc(firestore, 'users', user.uid, 'inventory', item.id);
        const updatedItem: Partial<InventoryItem> = { name, category, quantity, purchasePrice };
        setDocumentNonBlocking(itemRef, updatedItem, { merge: true });
        toast({ title: "Item Updated", description: `${name} has been updated.`});
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add New Inventory Item' : 'Edit Inventory Item'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">Category</Label>
            <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right">Quantity</Label>
            <Input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="purchasePrice" className="text-right">Purchase Price</Label>
            <Input id="purchasePrice" type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(Number(e.target.value))} className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleSubmit}>{mode === 'add' ? 'Add Item' : 'Save Changes'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function InventoryPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const formatNumber = useFormatter().number;

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const inventoryCollection = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'users', user.uid, 'inventory') : null),
    [firestore, user]
  );
  const { data: inventoryItems, isLoading } =
    useCollection<InventoryItem>(inventoryCollection);
    
  const filteredItems = React.useMemo(() => {
    if (!inventoryItems) return [];
    switch (statusFilter) {
      case 'in-stock':
        return inventoryItems.filter(item => item.quantity >= 10);
      case 'low-stock':
        return inventoryItems.filter(item => item.quantity > 0 && item.quantity < 10);
      case 'out-of-stock':
        return inventoryItems.filter(item => item.quantity === 0);
      case 'all':
      default:
        return inventoryItems;
    }
  }, [inventoryItems, statusFilter]);

  const handleDelete = (itemId: string, itemName: string) => {
    if (!firestore || !user) return;
    const itemRef = doc(firestore, 'users', user.uid, 'inventory', itemId);
    deleteDocumentNonBlocking(itemRef);
    toast({ variant: "destructive", title: "Item Deleted", description: `${itemName} has been removed from the inventory.`});
  };

  if (isUserLoading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <CardTitle className="font-headline">Inventory</CardTitle>
            <CardDescription>
              Manage your carwash supplies and track stock levels.
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
                <DropdownMenuCheckboxItem checked={statusFilter === 'all'} onCheckedChange={() => setStatusFilter('all')}>
                  All
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter === 'in-stock'} onCheckedChange={() => setStatusFilter('in-stock')}>
                  In Stock
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter === 'low-stock'} onCheckedChange={() => setStatusFilter('low-stock')}>
                  Low Stock
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter === 'out-of-stock'} onCheckedChange={() => setStatusFilter('out-of-stock')}>
                  Out of Stock
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <ItemDialog mode="add">
              <Button size="sm" className="h-8 gap-1">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-rap">
                  Add Item
                </span>
              </Button>
            </ItemDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="hidden md:table-cell text-right">Purchase Price</TableHead>
              <TableHead className="text-right">Total Value</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={6}>Loading...</TableCell></TableRow>}
            {filteredItems && filteredItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{getStatusBadge(item.quantity)}</TableCell>
                <TableCell className="text-right">{formatNumber(item.quantity)}</TableCell>
                <TableCell className="hidden md:table-cell text-right">
                  <div className="flex justify-end items-center gap-1">
                    {formatNumber(item.purchasePrice || 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <CurrencySymbol />
                  </div>
                </TableCell>
                <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-1">
                        {formatNumber(item.quantity * (item.purchasePrice || 0), { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <CurrencySymbol />
                    </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <ItemDialog mode="edit" item={item}>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Edit</DropdownMenuItem>
                      </ItemDialog>
                      <DropdownMenuItem onClick={() => handleDelete(item.id, item.name)}>Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

    