import { redirect } from "next/navigation";
const page = () => {
  return (
    redirect('/dashboard/admin/all-booking')
  );
};

export default page;