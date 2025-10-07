import FeaturesSection from "@/components/landing-page/features";
import FooterSection from "@/components/landing-page/footer";
import Header from "@/components/landing-page/header";
import HeroSection from "@/components/landing-page/hero";
import IntegrationSection from "@/components/landing-page/integrations";
import StepsSection from "@/components/landing-page/steps";

export default function Homepage() {
  return (
    <div className="flex flex-col min-h-svh">
      <Header />
      <HeroSection />
      <StepsSection />
      <FeaturesSection />
      <IntegrationSection />
      <FooterSection />
    </div>
  );
}
