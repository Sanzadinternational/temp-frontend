
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const MainLayout = ({children}:{children:React.ReactNode}) => {
  return (
    <>
      <Header/>
      {children}
      <Footer />
    </>
  );
};

export default MainLayout;










// components/MainLayout.tsx
// "use client";

// import Header from "@/components/Header";
// import Footer from "@/components/Footer";
// import { useSearchParams } from "next/navigation";

// const MainLayout = ({children}: {children: React.ReactNode}) => {
//   const searchParams = useSearchParams();
  
//   // Check if coming soon mode is enabled and no dev access
//   const isComingSoon = process.env.NEXT_PUBLIC_COMING_SOON === 'true';
//   const devAccessKey = searchParams.get('dev');
//   const isValidDevKey = devAccessKey === process.env.NEXT_PUBLIC_DEV_ACCESS_KEY;
//   const hasDevAccess = typeof window !== 'undefined' && localStorage.getItem('devAccess') === 'true';
  
//   const showComingSoonLayout = isComingSoon && !isValidDevKey && !hasDevAccess;

//   if (showComingSoonLayout) {
//     return (
//       <div className="min-h-screen">
//         {children}
//       </div>
//     );
//   }

//   return (
//     <>
//       <Header/>
//       {children}
//       <Footer />
//     </>
//   );
// };

// export default MainLayout;