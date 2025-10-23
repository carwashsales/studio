'use client';
import * as React from 'react';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, useUser } from '@/firebase';
import { collection, deleteDoc, doc } from 'firebase/firestore';
import type { Staff } from '@/types';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, PlusCircle, Trash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function StaffPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [newStaffName, setNewStaffName] = React.useState('');

  const staffCollection = useMemoFirebase(() => (firestore && user ? collection(firestore, 'staff') : null), [firestore, user]);
  const { data: staff, isLoading: staffLoading } = useCollection<Staff>(staffCollection);

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffCollection || !newStaffName.trim()) {
      toast({
        title: 'Invalid Name',
        description: 'Please enter a valid name for the staff member.',
        variant: 'destructive',
      });
      return;
    }

    addDocumentNonBlocking(staffCollection, { name: newStaffName.trim() });
    setNewStaffName('');
    toast({
      title: 'Staff Added',
      description: `Successfully added ${newStaffName.trim()}.`,
    });
  };

  const handleDeleteStaff = (staffId: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'staff', staffId);
    deleteDoc(docRef);
    toast({
      title: 'Staff Removed',
      description: 'The staff member has been removed.',
      variant: 'destructive'
    });
  };

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="grid gap-4 md:gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Add Staff Member</CardTitle>
            <CardDescription>Add a new employee to your team.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={handleAddStaff}>
              <div className="grid gap-2">
                <Label htmlFor="staff-name">Staff Name</Label>
                <Input
                  id="staff-name"
                  placeholder="Enter staff name"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Staff
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Staff List</CardTitle>
            <CardDescription>A list of all your current employees.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffLoading && <TableRow><TableCell colSpan={2}>Loading...</TableCell></TableRow>}
                {staff?.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
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
                          <DropdownMenuItem onClick={() => handleDeleteStaff(s.id)} className="text-destructive">
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
