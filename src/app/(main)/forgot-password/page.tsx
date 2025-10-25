"use client"
import ResetPassword from "@/components/auth/ResetPassword";
import { Suspense } from "react";

const page = () => {
  return (
    <div className="flex flex-col justify-center items-center">
        <h1 className="text-3xl font-bold mb-3">Reset Password</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <ResetPassword/>
        </Suspense>
    </div>
  )
}

export default page
