"use client";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";
import { BookingProvider } from "@/components/context/BookingContext";
export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <BookingProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children} 
        <Toaster />
      </ThemeProvider>
      </BookingProvider>
  );
}
