"use client";

import TransferMultiStepForm from "@/components/agent/TransferMultiStepForm";
import DashboardContainer from "@/components/layout/DashboardContainer";
import { Suspense } from "react";

const Page = () => {
  return (
    <DashboardContainer scrollable>
       <Suspense fallback={<div>Loading...</div>}>
      <TransferMultiStepForm />
          </Suspense>
    </DashboardContainer>
  );
};

export default Page;
