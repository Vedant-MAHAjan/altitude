import { HeroSection } from "@/components/home/hero-section";
import { TrendingSection } from "@/components/home/trending-section";
import { ValueProps } from "@/components/home/value-props";
import { ScrollGradientWrapper } from "@/components/home/scroll-gradient-wrapper";
import { getHomepageData } from "@/lib/data";

export default async function Home() {
  const homepageData = await getHomepageData();

  return (
    <main className="relative flex flex-col">
      <ScrollGradientWrapper />

      <HeroSection
        routeCount={homepageData.routeCount}
        organizerCount={homepageData.organizerCount}
        priceFloor={homepageData.priceFloor ?? 0}
      />

      <TrendingSection routes={homepageData.featuredDestinations} />

      <ValueProps />
    </main>
  );
}
