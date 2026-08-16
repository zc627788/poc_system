import type { ComputeCard, MarketplaceLeftCardScale } from "./marketplace-page-types";

export const compactMarketplaceLeftCardScale: MarketplaceLeftCardScale = {
  columnWidthClass: "lg:w-[307px]",
  heightClass: "h-[320px] sm:h-[290px] lg:h-[252px] xl:h-[268px]",
  paddingClass: "px-4 pb-4 pt-4 sm:px-6 sm:pb-6 sm:pt-6",
  iconWrapperClass: "mb-4 h-10 w-10",
  iconSize: 20,
  titleWidthClass: "w-full max-w-[220px] sm:w-[188px]",
  titleTextClass: "text-[15px] leading-[21px] sm:text-[17px] sm:leading-[24px]",
  descriptionClass: "mt-3 h-[133px] max-w-[240px] overflow-hidden text-[12px] leading-[19px] sm:mt-4 sm:h-[88px] sm:text-[13px] sm:leading-[22px] lg:h-auto",
};

export const reusedComputeCards: ComputeCard[] = [
  {
    name: "MetaX C550 64GB",
    price: "4,320",
    priceColor: "#0052FF",
    region: "杭州",
    server: "新华三",
    gpuCards: "1",
    vcpuCores: "12",
    memory: "90",
    gpuMemory: "64GB",
    storage: "100GB",
  },
  {
    name: "Nvidia A800 80GB",
    price: "55,000",
    priceColor: "#FF3B30",
    region: "厦门",
    server: "新华三",
    gpuCards: "1",
    vcpuCores: "96",
    memory: "180",
    gpuMemory: "80GB",
    storage: "1000GB",
  },
  {
    name: "Iluvatar BI-V150 64GB",
    price: "3,960",
    priceColor: "#FF3B30",
    region: "厦门",
    server: "新华三",
    gpuCards: "1",
    vcpuCores: "12",
    memory: "90",
    gpuMemory: "64GB",
    storage: "100GB",
  },
];

export const apiPricingTags = ["免费", "付费"];
export const apiFeatureTags = ["企业专用", "个人高级认证", "支持MCP"];
