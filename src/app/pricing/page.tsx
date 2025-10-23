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
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import Image from 'next/image';
import { SERVICE_TYPES } from '@/lib/services';
import { Badge } from '@/components/ui/badge';

export default function PricingPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="font-headline">Service Pricing</CardTitle>
          <CardDescription>
            A breakdown of car wash services and their pricing structure.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(SERVICE_TYPES).map(([key, service]) => (
            <div key={key}>
              <h3 className="text-lg font-semibold font-headline mb-2">{service.name}</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{service.needsSize ? 'Car Size' : 'Service'}</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    {service.hasCoupon && <TableHead className="text-right">Coupon Commission</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(service.prices).map(([size, details]) => (
                    <TableRow key={size}>
                      <TableCell className="font-medium capitalize">{size === 'default' ? service.name : size}</TableCell>
                      <TableCell className="text-right flex justify-end items-center">
                        {details.price.toFixed(2)} <Image src="/sar.png" alt="SAR" width={16} height={16} className="ml-1" />
                      </TableCell>
                       <TableCell className="text-right flex justify-end items-center">
                        {details.commission.toFixed(2)} <Image src="/sar.png" alt="SAR" width={16} height={16} className="ml-1" />
                      </TableCell>
                      {service.hasCoupon && (
                        <TableCell className="text-right flex justify-end items-center">
                           {details.couponCommission !== undefined ?
                            <>{details.couponCommission.toFixed(2)} <Image src="/sar.png" alt="SAR" width={16} height={16} className="ml-1" /></>
                            : <Badge variant="outline">N/A</Badge>
                           }
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
