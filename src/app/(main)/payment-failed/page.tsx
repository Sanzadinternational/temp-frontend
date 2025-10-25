
"use client";

import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { useSearchParams } from "next/navigation";

const PaymentDetails = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = searchParams.get("orderId");
  const transactionId = searchParams.get("transactionId");
  const amount = searchParams.get("amount");
  const paymentMode = searchParams.get("paymentMode");

  const handleRetryPayment = () => {
    router.push("/");
  };

  return (
    <Card className="w-full max-w-md shadow-lg border-red-300">
      <CardHeader>
        <CardTitle className="text-red-600">Payment Failed</CardTitle>
        <CardDescription>
          Oops! Something went wrong with your payment. Please try again.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 text-sm text-gray-700">
        {orderId && (
          <div>
            <span className="font-medium">Order ID:</span> {orderId}
          </div>
        )}
        {transactionId && (
          <div>
            <span className="font-medium">Transaction ID:</span> {transactionId}
          </div>
        )}
        {amount && (
          <div>
            <span className="font-medium">Amount:</span> {amount}
          </div>
        )}
        {paymentMode && (
          <div>
            <span className="font-medium">Payment Mode:</span> {paymentMode}
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button onClick={handleRetryPayment} className="w-full">
          Try Again
        </Button>
      </CardFooter>
    </Card>
  );
};

const PaymentCancel = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-red-50 p-4">
      <Suspense fallback={<p>Loading...</p>}>
        <PaymentDetails />
      </Suspense>
    </div>
  );
};

export default PaymentCancel;
