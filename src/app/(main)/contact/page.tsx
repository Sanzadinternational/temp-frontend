
import { MapPin,Headset } from "lucide-react"
import Link from "next/link"

const page = () => {
  return (
    <div className="flex flex-col justify-center items-center gap-10 bg-blue-100/[.5] mx-10 px-5 py-5 rounded-sm">
        <div className="flex flex-col items-center">
            <h2 className="text-xl">Contact Us</h2>
            <h1 className="text-2xl md:text-3xl text-center">Looking To Get In Touch?
                <br/>
                We&#39;re Here to Help.
            </h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-0 md:divide-x">
            <div className="flex flex-col justify-between md:h-[300px]">
                <div>
                    <Headset width={20} height={20}/>
                    <h3 className="text-lg mt-1">Agent Support</h3>
                    <p className="w-2/3">Get help with your account or other queries</p>
                </div>
                <div className="">
                    <h4 className="underline"><Link href='mailto:support@sanzadinternational.com' target="_blank">support@sanzadinternational.com</Link></h4>
                    <h4 className="underline"><Link href='tel:+91XXXXXXXXXX' target="_blank">+91XXXXXXXXXXX</Link></h4>
                </div>
            </div>
            <div className="flex flex-col justify-between md:h-[300px] md:pl-5">
                <div className="">
                    <Headset width={20} height={20}/>
                    <h3 className="text-lg mt-1">Supplier Support</h3>
                    <p className="w-2/3">Get help with your account or other queries</p>
                </div>
                <div className="">
                <h4 className="underline"><Link href='mailto:support@sanzadinternational.com' target="_blank">support@sanzadinternational.com</Link></h4>
                <h4 className="underline"><Link href='tel:+91XXXXXXXXXX' target="_blank">+91XXXXXXXXXXX</Link></h4>
                </div>
            </div>
            <div className="flex flex-col justify-between md:h-[300px] md:pl-5">
                <div className="">
                    <MapPin width={20} height={20}/>
                    <h3 className="text-lg mt-1">Find Us</h3>
                    <p className="w-2/3">Suite No. 4, H-143, Sector-63, Noida, Gautam Buddha Nagar, UP, 201301</p>
                </div>
                <div className="">
                <h4 className="underline"><Link href='mailto:support@sanzadinternational.com' target="_blank">support@sanzadinternational.com</Link></h4>
                <h4 className="underline"><Link href='tel:+91XXXXXXXXXX' target="_blank">+91XXXXXXXXXXX</Link></h4>
                </div>
            </div>
        </div>
    </div>
  )
}

export default page