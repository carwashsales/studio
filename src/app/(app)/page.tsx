'use client';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AppRootPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading) {
      if (user) {
        router.replace('/inventory');
      } else {
        router.replace('/login');
      }
    }
  }, [user, isUserLoading, router]);

  return <div>Loading...</div>;
}
