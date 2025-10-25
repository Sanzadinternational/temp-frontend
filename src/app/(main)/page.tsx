"use client"
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Location from "@/components/Location";
import Link from "next/link";
import { features } from "@/components/constants/features";
import { useState,useEffect } from "react";
export default function Home() {
  const [isOpen, setIsOpen] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsOpen(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <>
    {/* Launching Soon Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl">Launching Soon!</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-lg">We&apos;re excited to announce that Sanzad International will be launching soon!</p>
            <p className="mt-2">Stay tuned for our official launch date.</p>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setIsOpen(false)}>Got It</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 py-2 px-5 mx-10 my-4 z-[-1] rounded-md bg-slate-100 dark:bg-primary dark:text-black">
        <div className="py-4 px-5">
          <h1 className="">Sanzad International</h1>
          <p className="text-xl md:text-6xl font-bold">
            Transfer Rides In All Countries
          </p>
          <Button className="my-2 bg-blue-500 dark:bg-card-foreground">
            <Link href="/contact">Contact</Link>
          </Button>
        </div>
        <div className="flex justify-center">
          <Image
            src="/Transfer-Rides_Sanzad-International.webp"
            alt="Hero Image"
            width={250}
            height={250}
          />
        </div>
      </div>
      <div className="flex justify-center mt-[-80px]">
      <Location onFormSubmit={() => {}}/>
      </div>
      <div
        id="about"
        className="flex flex-col items-center gap-5 mt-20 px-10"
      >
        <div className="w-full flex flex-col items-center gap-1">
          <h2 className="text-muted-foreground text-xl">About Us</h2>
          <h3 className="text-2xl md:text-4xl font-semibold text-center">Anytime, Anywhere<br/>Connecting Cities, Airports & Ports-With Ease</h3>
          <p className="md:w-2/3 text-muted-foreground text-center">We are a trusted global B2B transfer service provider. Our portal enables instant confirmation for seamless Point-to-Point transfers worldwide. Book transfers to/from airports, stations, ports, and cities in just 3 simple steps through our user-friendly platform. In addition, we provide customized services offline Our dedicated team is available 24/7 to ensure on-time assistance and reliable support at every step.</p>
        </div>
               
      </div>
      <div id="features" className="flex flex-col md:flex-row md:justify-center gap-5 mt-10 mb-20 px-10">
      {features.map((feature, id) => (
            <Card key={id}>
              <CardHeader>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                {/* <p>{feature.description}</p> */}
                 {feature.points ? (
      <ul className="list-disc">
 {feature.points.map((point, i) => (
        <li key={i}>
          {typeof point === "string" ? (
            point
          ) : (
            <>
              <a
                href={`mailto:${point.email}`}
                className="text-blue-600 underline"
              >
                {point.email}
              </a>{" "}
              /{" "}
              <a
                href={`tel:${point.phone}`}
                className="text-blue-600 underline"
              >
                {point.phone}
              </a>
            </>
          )}
        </li>
      ))}

      </ul>
    ) : (
      <p>No Data</p>
    )}
              </CardContent>
            </Card>
          ))}
      </div>
    </>
  );
}

