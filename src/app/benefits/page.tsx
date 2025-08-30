import MainLayout from '@/components/layout/MainLayout';
import BenefitsClientPage from '@/components/benefits/BenefitsClientPage';
import { getRecommendedBenefits } from '@/app/actions';

export default function BenefitsPage() {
  return (
    <MainLayout>
      <BenefitsClientPage getRecommendedBenefits={getRecommendedBenefits} />
    </MainLayout>
  );
}
