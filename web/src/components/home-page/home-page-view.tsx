"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { articleTabs } from "@/lib/site-constants";
import { buildCommunityCard, buildHeroSlides, buildMarketplaceViewModel, buildNewsByTab, buildScenarioCards, buildServiceCards, buildSortedHomeSections } from "./home-page-mappers";
import type { HeroSlide, HomePageViewProps } from "./home-page-types";
import { HomeCommunityServicesSection } from "./sections/home-community-services-section";
import { HomeHeroSection } from "./sections/home-hero-section";
import { HomeMarketplaceSection } from "./sections/home-marketplace-section";
import { HomeNewsSection } from "./sections/home-news-section";
import { HomeScenarioSection } from "./sections/home-scenario-section";

export function HomePageView({ articlesByTab, banners, marketplaceSummary, sections, serviceItems }: HomePageViewProps) {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeNewsTab, setActiveNewsTab] = useState<(typeof articleTabs)[number]["code"]>("activity");

  const sortedHomeSections = useMemo(() => buildSortedHomeSections(sections), [sections]);
  const heroSlides = useMemo(() => buildHeroSlides(banners), [banners]);
  const newsByTab = useMemo(() => buildNewsByTab(articlesByTab), [articlesByTab]);
  const serviceCards = useMemo(() => buildServiceCards(serviceItems), [serviceItems]);
  const scenarioCards = useMemo(() => buildScenarioCards(sortedHomeSections), [sortedHomeSections]);
  const scenarioOpportunity = useMemo(() => scenarioCards.find((card) => card.title === "场景机会") || scenarioCards[0], [scenarioCards]);
  const communityCard = useMemo(() => buildCommunityCard(sortedHomeSections), [sortedHomeSections]);
  const marketplace = useMemo(() => buildMarketplaceViewModel(marketplaceSummary, sortedHomeSections), [marketplaceSummary, sortedHomeSections]);

  const activeHeroIndex = heroSlides.length > 0 ? currentSlide % heroSlides.length : 0;
  const currentHero = heroSlides.length > 0 ? heroSlides[activeHeroIndex] : null;
  const currentNewsItems = newsByTab[activeNewsTab] || [];

  useEffect(() => {
    if (heroSlides.length <= 1) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 4000);

    return () => window.clearInterval(timer);
  }, [heroSlides.length]);

  const handleAction = (actionType?: string, actionValue?: string) => {
    if (!actionValue || actionType === "none") {
      return;
    }

    if (actionType === "external") {
      window.open(actionValue, "_blank", "noopener,noreferrer");
      return;
    }

    router.push(actionValue);
  };

  const handleHeroClick = (event: MouseEvent<HTMLElement>) => {
    if (!currentHero?.actionValue) {
      return;
    }

    const target = event.target as HTMLElement;
    if (target.closest("button")) {
      return;
    }

    handleAction(currentHero.actionType, currentHero.actionValue);
  };

  const handleHeroPrimaryAction = (slide: HeroSlide) => {
    if (slide.actionValue) {
      handleAction(slide.actionType, slide.actionValue);
      return;
    }

    router.push("/services");
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <HomeHeroSection
        activeHeroIndex={activeHeroIndex}
        currentHero={currentHero}
        heroSlides={heroSlides}
        onHeroClick={handleHeroClick}
        onPrimaryAction={handleHeroPrimaryAction}
        onSlideChange={setCurrentSlide}
      />
      <HomeNewsSection activeNewsTab={activeNewsTab} currentNewsItems={currentNewsItems} onTabChange={setActiveNewsTab} />
      <HomeCommunityServicesSection communityCard={communityCard} serviceCards={serviceCards} />
      <HomeMarketplaceSection marketplace={marketplace} />
      {scenarioOpportunity ? <HomeScenarioSection scenarioCard={scenarioOpportunity} /> : null}
    </div>
  );
}
