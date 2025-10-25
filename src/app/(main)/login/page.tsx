
import { Suspense } from 'react';
import Login from '@/components/login-form';

export default function LoginPage() {
  return (
    <div className="flex justify-center items-center my-8">
      <Suspense fallback={<div>Loading...</div>}>
            <Login/>
          </Suspense>
     
    </div>
  );
}