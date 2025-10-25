import DashboardContainer from '@/components/layout/DashboardContainer'
import SupplierAPI from '@/components/supplier/SupplierAPI'

const page = () => {
  return (
    <DashboardContainer scrollable>
      <div className='flex items-center justify-center'>
      <SupplierAPI/>
    </div>
    </DashboardContainer>
  )
}

export default page