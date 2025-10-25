"use client";
import React, { createContext, useState, useContext } from "react";

const BookingContext = createContext<any>(null);

export const BookingProvider = ({ children }: { children: React.ReactNode }) => {
  const [bookingData, setBookingData] = useState<{
    formData?: any;
    responseData?: any;
  }>({});

  return (
    <BookingContext.Provider value={{ bookingData, setBookingData }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => useContext(BookingContext);
