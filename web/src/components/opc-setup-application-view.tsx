"use client";

import { Loader2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { BusinessRangeGuideExhibit } from "@/components/business-range-guide-exhibit";
import { ViewportModal } from "@/components/viewport-modal";
import { clearApplicationFormDraft, getApplicationFormDraft, saveApplicationFormDraft } from "@/features/application_form/draft/draft";
import { deleteApplicationFormImage, uploadApplicationFormImage } from "@/features/application_form/images/images";
import { buildApplicationFormPayload } from "@/features/application_form/submit/build-submit-payload";
import { submitApplicationForm } from "@/features/application_form/submit/submit";
import type {
  ApplicationFormDraftPayload,
  ApplicationFormPayload,
  PageImageValue,
  PagePremisesSource,
  PageSectionValue,
  PageShareholderSection,
  PageUploadedImage,
} from "@/features/application_form/state/page-state";
import {
  fetchCurrentSiteUser,
  getCachedSiteUser,
  hasSiteAuthSession,
  onSiteAuthChange,
  redirectToIxiaMenLogin,
  submitCommunityJoinApplication,
} from "@/lib/site-auth";
import type { OpcMaterialUploadItem, SiteUserProfile } from "@/types";

const maxShareholderCount = 50;
const maxMaterialImageCount = 100;
const maxShareholderIdentityPairCount = Math.floor(maxMaterialImageCount / 2);

const materialCategoryKeys = {
  shareholderIdentity: "自然人股东身份证",
  corporateLicense: "法人股东营业执照副本复印件加盖公章",
  premisesLease: "住所/经营场所租赁合同",
  otherGovernment: "政府要求其他文件",
} as const;

type Cat = (typeof materialCategoryKeys)[keyof typeof materialCategoryKeys];

type FormState = {
  companyName: string;
  companyNameAlternativeOne: string;
  companyNameAlternativeTwo: string;
  registeredCapital: string;
  currency: string;
  businessScope: string;
  premisesArea: string;
  propertyOwner: string;
  propertyContactPhone: string;
  legalRepresentativeName: string;
  legalRepresentativePhone: string;
  legalRepresentativeIdNo: string;
  legalRepresentativeAddress: string;
  managerName: string;
  managerPhone: string;
  managerIdNo: string;
  managerAddress: string;
  financeLeaderName: string;
  financeLeaderPhone: string;
  financeLeaderIdNo: string;
  financeLeaderAddress: string;
  supervisorName: string;
  supervisorPhone: string;
  supervisorIdNo: string;
  supervisorAddress: string;
  industrialContactName: string;
  industrialContactPhone: string;
  industrialContactIdNo: string;
  industrialContactAddress: string;
};

type ShareholderRow = {
  id: string;
  name: string;
  idNo: string;
  subscribedCapital: string;
  equityRatio: string;
  address: string;
  phone: string;
  validUntilMode: string;
  validUntil: string;
};

type MaterialCategoryConfig = {
  key: Cat;
  desc: string;
  required: boolean;
  accept: string;
  maxFiles?: number;
};

type MaterialSlot = {
  id: string;
  categoryKey: Cat;
  slotIndex: number;
  label?: string;
  uploadText?: string;
  ariaLabel?: string;
};

type MaterialSlotGroup = {
  id: string;
  title?: string;
  className: string;
  gridClassName: string;
  slots: MaterialSlot[];
};

type ShareholderDocumentsSection = {
  id: string;
  title: string;
  renderType: "shareholderDocuments";
  categoryKeys: Cat[];
  slotGroups: MaterialSlotGroup[];
};

type ImageGridSection = {
  id: string;
  title: string;
  renderType: "imageGrid";
  categoryKeys: Cat[];
  categoryKey: Cat;
};

type MaterialSection = ShareholderDocumentsSection | ImageGridSection;

type PremisesMode = "own" | "rentalCommunity";

type PremisesSource =
  | {
      type: "lease_material";
      material_file_ids: number[];
    }
  | {
      type: "rental_community";
      community_join_application_id: number;
      target_campus?: string;
      status?: string;
      submitted_at?: string;
    };

type CommunityJoinModalStep = "confirm" | "loading" | "success" | "error";

type CommunityJoinModalState = {
  campus: string;
  step: CommunityJoinModalStep;
  errorMessage?: string;
};

type RentalCommunityCard = {
  id: string;
  title: string;
  address: string;
  phone: string;
  email: string;
  imageUrl: string;
  imageAlt: string;
  actionType: "none" | "external" | "internal";
  actionValue: string;
};

type MaterialUploadTarget =
  | {
      mode: "slot";
      categoryKey: Cat;
      slot: MaterialSlot;
      accept: string;
    }
  | {
      mode: "list";
      categoryKey: Cat;
      accept: string;
      maxFiles?: number;
    };

type SlotMaterialMap = Record<string, OpcMaterialUploadItem | null>;
type ListMaterialMap = Record<Cat, OpcMaterialUploadItem[]>;
type RestoredMaterialState = { slotFiles: SlotMaterialMap; listFiles: ListMaterialMap; shareholderIdentityPairCount: number };
type UploadingState = { categoryKey: Cat; targetId: string } | null;
type FormFieldRequirement = { field: string; label: string; required: boolean };

const businessRangeGuideUrl = "https://wssp.scjg.xm.gov.cn:4433/wssp/jsp/wssp/jyfwbsq/jyxmscq.jsp";

const rentalCommunityCards: RentalCommunityCard[] = [
  {
    id: "base_soft2",
    title: "厦门OPC社区（软二基地）",
    address: "厦门软件园二期观日路32号",
    phone: "5953016",
    email: "zhengwenya@xmigc.com",
    imageUrl: "/community-base-soft2.png",
    imageAlt: "软二基地展示图",
    actionType: "external",
    actionValue:
      "https://mp.weixin.qq.com/s?__biz=MzA4OTI2NzkxMQ==&mid=2651418963&idx=2&sn=16b92ed83f8597957d1f2d18e9ed13e2&chksm=8a2945c57d5487b292dd8994c2b926d52458954e03f4f6c5ef5777a97b7dd8445e0d9e87ca44&mpshare=1&scene=1&srcid=0320N00U953BrKiViTZHrCHj&sharer_shareinfo=87c6b4048e22fbbc1ef3fa7edc03462f&sharer_shareinfo_first=87c6b4048e22fbbc1ef3fa7edc03462f#rd",
  },
  {
    id: "base_soft3",
    title: "厦门OPC社区（软三基地）",
    address: "厦门软件园三期F06",
    phone: "5953921",
    email: "chenting@xmigc.com",
    imageUrl: "/community-base-soft3.png",
    imageAlt: "软三基地展示图",
    actionType: "external",
    actionValue:
      "https://mp.weixin.qq.com/s?__biz=MzA4OTI2NzkxMQ==&mid=2651421939&idx=1&sn=7d9575252828bd8a4857f0934f9c1436&chksm=8a30b200bb7047b6bb39207ca89b26d7e0b0f0f730428cb1db069d45dd768d63fed9ca6cd1d3&mpshare=1&scene=1&srcid=0320dQK4oIEZ4zwGC9IzUsjK&sharer_shareinfo=cd02ab38a53ee5f9d8dfb0d98fbc4c63&sharer_shareinfo_first=cd02ab38a53ee5f9d8dfb0d98fbc4c63#rd",
  },
];

const materialCategories: MaterialCategoryConfig[] = [
  {
    key: materialCategoryKeys.shareholderIdentity,
    desc: "港澳台人员提供通行证，需上传清晰正反面照片。",
    required: true,
    accept: ".png,.jpg,.jpeg,.docx",
  },
  {
    key: materialCategoryKeys.corporateLicense,
    desc: "外资法人、台湾澳台法人还需要提供营业证明。",
    required: true,
    accept: ".png,.jpg,.jpeg,.docx",
  },
  {
    key: materialCategoryKeys.premisesLease,
    desc: "需包含标准地址、面积、出租人或者产权人及其联系电话。",
    required: true,
    accept: ".png,.jpg,.jpeg,.docx",
    maxFiles: maxMaterialImageCount,
  },
  {
    key: materialCategoryKeys.otherGovernment,
    desc: "用于补充上传政府临时要求的其他文件。",
    required: false,
    accept: ".png,.jpg,.jpeg,.docx",
    maxFiles: maxMaterialImageCount,
  },
];

const materialCategoryConfigMap = new Map<Cat, MaterialCategoryConfig>(materialCategories.map((item) => [item.key, item]));
const requiredMaterialCategories = materialCategories.filter((item) => item.required).map((item) => item.key);
const baseShareholderIdentityPairCount = 1;

const buildShareholderIdentitySlots = (pairCount: number): MaterialSlot[] =>
  Array.from({ length: pairCount * 2 }, (_, index) => {
    const isFront = index % 2 === 0;
    return {
      id: `shareholderIdentity-${index}`,
      categoryKey: materialCategoryKeys.shareholderIdentity,
      slotIndex: index,
      uploadText: isFront ? "上传正面" : "上传反面",
      ariaLabel: isFront ? "自然人股东身份证正面" : "自然人股东身份证反面",
    };
  });

const materialSections: MaterialSection[] = [
  {
    id: "shareholderDocuments",
    title: "自然人股东身份证 / 港澳台通行证",
    renderType: "shareholderDocuments",
    categoryKeys: [materialCategoryKeys.shareholderIdentity, materialCategoryKeys.corporateLicense],
    slotGroups: [
      {
        id: "shareholderIdentity",
        className: "w-full",
        gridClassName: "grid gap-4 md:grid-cols-2",
        slots: buildShareholderIdentitySlots(baseShareholderIdentityPairCount),
      },
      {
        id: "corporateLicense",
        title: "法人股东营业执照副本复印件加盖公章",
        className: "w-full",
        gridClassName: "grid gap-4 md:grid-cols-2",
        slots: [
          { id: "corporateLicense-0", categoryKey: materialCategoryKeys.corporateLicense, slotIndex: 0, ariaLabel: "法人股东营业执照副本复印件加盖公章" },
        ],
      },
    ],
  },
  {
    id: "premisesLease",
    title: "住所/经营场所租赁合同",
    renderType: "imageGrid",
    categoryKeys: [materialCategoryKeys.premisesLease],
    categoryKey: materialCategoryKeys.premisesLease,
  },
  {
    id: "otherGovernment",
    title: "政府要求其他文件",
    renderType: "imageGrid",
    categoryKeys: [materialCategoryKeys.otherGovernment],
    categoryKey: materialCategoryKeys.otherGovernment,
  },
];

const allMaterialSlots = materialSections.flatMap((section) =>
  section.renderType === "shareholderDocuments" ? section.slotGroups.flatMap((group) => group.slots) : [],
);
const imageGridSections = materialSections.filter((section): section is ImageGridSection => section.renderType === "imageGrid");

const buildMaterialSections = (shareholderIdentityPairCount: number): MaterialSection[] =>
  materialSections.map((section) =>
    section.renderType !== "shareholderDocuments"
      ? section
      : {
          ...section,
          slotGroups: section.slotGroups.map((group) =>
            group.id === "shareholderIdentity"
              ? { ...group, slots: buildShareholderIdentitySlots(shareholderIdentityPairCount) }
              : group,
          ),
        },
  );

const getMaterialSlots = (shareholderIdentityPairCount: number): MaterialSlot[] =>
  buildMaterialSections(shareholderIdentityPairCount).flatMap((section) =>
    section.renderType === "shareholderDocuments" ? section.slotGroups.flatMap((group) => group.slots) : [],
  );

const formFieldRequirements: FormFieldRequirement[] = [
  { field: "company_name", label: "公司名称（拟）", required: true },
  { field: "company_name_alternative_one", label: "公司备选名称", required: false },
  { field: "company_name_alternative_two", label: "公司备选名称", required: false },
  { field: "registered_capital", label: "注册资本", required: true },
  { field: "currency", label: "币种", required: true },
  { field: "business_scope", label: "经营范围", required: true },
  { field: "premises_area", label: "住所面积", required: true },
  { field: "property_owner", label: "产权人", required: true },
  { field: "property_contact_phone", label: "联系手机", required: true },
  { field: "shareholders.name", label: "股东姓名", required: true },
  { field: "shareholders.phone", label: "股东手机", required: true },
  { field: "shareholders.id_no", label: "股东证件号", required: true },
  { field: "shareholders.subscribed_capital", label: "股东认缴额", required: true },
  { field: "shareholders.equity_ratio", label: "股东认缴比例", required: true },
  { field: "shareholders.address", label: "股东证件住址", required: true },
  { field: "shareholders.valid_until", label: "股东证件有效期", required: true },
  { field: "legal_representative_name", label: "执行董事（法定代表人）姓名", required: true },
  { field: "legal_representative_phone", label: "执行董事（法定代表人）手机号", required: true },
  { field: "legal_representative_id_no", label: "执行董事（法定代表人）身份证", required: true },
  { field: "legal_representative_address", label: "执行董事（法定代表人）证件住址", required: true },
  { field: "finance_leader_name", label: "财务负责人姓名", required: true },
  { field: "finance_leader_phone", label: "财务负责人手机号", required: true },
  { field: "finance_leader_id_no", label: "财务负责人身份证", required: true },
  { field: "finance_leader_address", label: "财务负责人证件住址", required: true },
  { field: "industrial_contact_name", label: "工商联络人姓名", required: true },
  { field: "industrial_contact_phone", label: "工商联络人手机号", required: true },
  { field: "industrial_contact_id_no", label: "工商联络人身份证", required: true },
  { field: "industrial_contact_address", label: "工商联络人证件住址", required: true },
  { field: "manager_name", label: "经理姓名", required: false },
  { field: "manager_phone", label: "经理手机号", required: false },
  { field: "manager_id_no", label: "经理身份证", required: false },
  { field: "manager_address", label: "经理证件住址", required: false },
  { field: "supervisor_name", label: "监事姓名", required: false },
  { field: "supervisor_phone", label: "监事手机号", required: false },
  { field: "supervisor_id_no", label: "监事身份证", required: false },
  { field: "supervisor_address", label: "监事证件住址", required: false },
];

const formFieldRequirementMap = new Map(formFieldRequirements.map((item) => [item.field, item.required]));

const requiredFormFields: Array<{ key: keyof FormState; label: string }> = [
  { key: "companyName", label: "公司名称（拟）" },
  { key: "registeredCapital", label: "注册资本" },
  { key: "currency", label: "币种" },
  { key: "businessScope", label: "经营范围" },
  { key: "premisesArea", label: "住所面积" },
  { key: "propertyOwner", label: "产权人" },
  { key: "propertyContactPhone", label: "联系手机" },
  { key: "legalRepresentativeName", label: "执行董事（法定代表人）姓名" },
  { key: "legalRepresentativePhone", label: "执行董事（法定代表人）手机号" },
  { key: "legalRepresentativeIdNo", label: "执行董事（法定代表人）身份证" },
  { key: "legalRepresentativeAddress", label: "执行董事（法定代表人）证件住址" },
  { key: "financeLeaderName", label: "财务负责人姓名" },
  { key: "financeLeaderPhone", label: "财务负责人手机号" },
  { key: "financeLeaderIdNo", label: "财务负责人身份证" },
  { key: "financeLeaderAddress", label: "财务负责人证件住址" },
  { key: "industrialContactName", label: "工商联络人姓名" },
  { key: "industrialContactPhone", label: "工商联络人手机号" },
  { key: "industrialContactIdNo", label: "工商联络人身份证" },
  { key: "industrialContactAddress", label: "工商联络人证件住址" },
];

const currencyOptions = [
  { name: "人民币", code: "CNY", symbol: "¥" },
  { name: "美元", code: "USD", symbol: "$" },
  { name: "欧元", code: "EUR", symbol: "€" },
  { name: "港币", code: "HKD", symbol: "HK$" },
  { name: "英镑", code: "GBP", symbol: "£" },
  { name: "日元", code: "JPY", symbol: "¥" },
];

const certificateValidityOptions = [
  { label: "输入年份", value: "date" },
  { label: "长期", value: "长期" },
];

const chineseDigits = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];

const toChineseNumber = (value: number): string => {
  if (value <= 10) return value === 10 ? "十" : chineseDigits[value];
  if (value < 20) return `十${chineseDigits[value % 10]}`;
  const tens = Math.floor(value / 10);
  const ones = value % 10;
  return `${chineseDigits[tens]}十${ones ? chineseDigits[ones] : ""}`;
};

const shareholderLabel = (index: number): string => `股东${toChineseNumber(index + 1)}`;

const shareholderRequiredFields: Array<{ key: keyof Omit<ShareholderRow, "id">; label: string }> = [
  { key: "name", label: "姓名" },
  { key: "idNo", label: "证件号" },
  { key: "subscribedCapital", label: "认缴额" },
  { key: "equityRatio", label: "认缴比例" },
  { key: "address", label: "证件住址" },
  { key: "phone", label: "手机" },
  { key: "validUntil", label: "证件有效期" },
];

const splitValidityDate = (value: string): { year: string; month: string; day: string } => {
  const [year = "", month = "", day = ""] = value.split("-");
  return { year, month, day };
};

const joinValidityDate = (year: string, month: string, day: string): string =>
  [year, month, day].filter(Boolean).join("-");

const sectionTitleStyle: CSSProperties = {
  width: "auto",
  height: "22px",
  fontFamily: "PingFang SC, PingFang SC",
  fontWeight: 500,
  fontSize: "16px",
  color: "#000000",
  textAlign: "left",
  fontStyle: "normal",
  textTransform: "none",
  lineHeight: "22px",
  whiteSpace: "nowrap",
};

const shareholderTableTextStyle: CSSProperties = {
  width: "32px",
  height: "22px",
  fontFamily: "PingFang SC, PingFang SC",
  fontWeight: 400,
  fontSize: "12px",
  color: "#333333",
  textAlign: "left",
  fontStyle: "normal",
  textTransform: "none",
  lineHeight: "22px",
};

const shareholderTableHeaderTextStyle: CSSProperties = {
  ...shareholderTableTextStyle,
  fontSize: "14px",
};

const officerTableTextStyle: CSSProperties = {
  ...shareholderTableTextStyle,
  fontSize: "14px",
};

const shareholderInputTextStyle: CSSProperties = {
  fontFamily: "PingFang SC, PingFang SC",
  fontWeight: 400,
  fontSize: "12px",
  color: "#333333",
  textAlign: "left",
  fontStyle: "normal",
  textTransform: "none",
};

const inputFocusClass = "border-[#d7e3f5] outline-none focus:border-[#0052d9]";
const inputFocusWithinClass = "border-[#d7e3f5] focus-within:border-[#0052d9]";
const mobileCardFieldClass = "h-[42px] rounded-[16px] border bg-white px-3 text-sm sm:h-[30px] sm:rounded-[16px] sm:px-2";
const tableFieldClass = "h-[42px] rounded-[5px] border bg-white px-3 text-sm sm:h-[30px] sm:rounded-[5px] sm:px-2";
const mobileCardFieldWrapperClass = "flex h-[42px] min-w-0 flex-1 items-stretch overflow-hidden rounded-[16px] border bg-white sm:h-[30px] sm:rounded-[16px]";
const inlineFieldRowClass = "flex min-w-0 items-center gap-2";
const inlineFieldLabelClass = "shrink-0 text-left text-sm font-medium text-slate-700";
const mobileCardInlineFieldLabelClass = "w-[118px] shrink-0 text-left text-sm font-medium text-slate-700";

const shareholderDeleteTextStyle: CSSProperties = {
  display: "inline-block",
  width: "28px",
  height: "20px",
  fontFamily: "Alibaba PuHuiTi 2.0, Alibaba PuHuiTi 20",
  fontWeight: "normal",
  fontSize: "14px",
  color: "#0091F9",
  textAlign: "left",
  fontStyle: "normal",
  textTransform: "none",
  lineHeight: "20px",
};

const initSlotFiles = (slots: MaterialSlot[] = allMaterialSlots): SlotMaterialMap =>
  Object.fromEntries(slots.map((slot) => [slot.id, null])) as SlotMaterialMap;

const initListFiles = (): ListMaterialMap =>
  Object.fromEntries(materialCategories.map((item) => [item.key, [] as OpcMaterialUploadItem[]])) as ListMaterialMap;

const initForm = (): FormState => ({
  companyName: "",
  companyNameAlternativeOne: "",
  companyNameAlternativeTwo: "",
  registeredCapital: "",
  currency: "人民币",
  businessScope: "",
  premisesArea: "",
  propertyOwner: "",
  propertyContactPhone: "",
  legalRepresentativeName: "",
  legalRepresentativePhone: "",
  legalRepresentativeIdNo: "",
  legalRepresentativeAddress: "",
  managerName: "",
  managerPhone: "",
  managerIdNo: "",
  managerAddress: "",
  financeLeaderName: "",
  financeLeaderPhone: "",
  financeLeaderIdNo: "",
  financeLeaderAddress: "",
  supervisorName: "",
  supervisorPhone: "",
  supervisorIdNo: "",
  supervisorAddress: "",
  industrialContactName: "",
  industrialContactPhone: "",
  industrialContactIdNo: "",
  industrialContactAddress: "",
});

const initShareholders = (): ShareholderRow[] => [
  {
    id: "row-1",
    name: "",
    idNo: "",
    subscribedCapital: "",
    equityRatio: "",
    address: "",
    phone: "",
    validUntilMode: "",
    validUntil: "",
  },
  {
    id: "row-2",
    name: "",
    idNo: "",
    subscribedCapital: "",
    equityRatio: "",
    address: "",
    phone: "",
    validUntilMode: "",
    validUntil: "",
  },
];

const fmt = (v: string): string => {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}-${`${d.getDate()}`.padStart(2, "0")} ${`${d.getHours()}`.padStart(2, "0")}:${`${d.getMinutes()}`.padStart(2, "0")}`;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const restoreForm = (value: unknown): FormState => {
  const next = initForm();
  if (!isPlainObject(value)) {
    return next;
  }
  (Object.keys(next) as Array<keyof FormState>).forEach((key) => {
    const field = value[key];
    if (typeof field === "string") {
      next[key] = field;
    }
  });
  return next;
};

const restoreShareholders = (value: unknown): ShareholderRow[] => {
  if (!Array.isArray(value)) {
    return initShareholders();
  }
  const rows = value.filter(isPlainObject).map((item, index) => {
    const row: ShareholderRow = {
      id: typeof item.id === "string" && item.id ? item.id : `draft-row-${index + 1}`,
      name: "",
      idNo: "",
      subscribedCapital: "",
      equityRatio: "",
      address: "",
      phone: "",
      validUntilMode: "",
      validUntil: "",
    };
    (["name", "idNo", "subscribedCapital", "equityRatio", "address", "phone", "validUntilMode", "validUntil"] as const).forEach((key) => {
      const field = item[key];
      if (typeof field === "string") {
        row[key] = field;
      }
    });
    if (!row.validUntilMode && row.validUntil === "长期") {
      row.validUntilMode = "长期";
    } else if (!row.validUntilMode && row.validUntil) {
      row.validUntilMode = "date";
    }
    return row;
  });
  return rows.length ? rows : initShareholders();
};

const isPremisesMode = (value: unknown): value is PremisesMode =>
  value === "own" || value === "rentalCommunity";

const isPremisesSource = (value: unknown): value is PremisesSource => {
  if (!isPlainObject(value) || typeof value.type !== "string") {
    return false;
  }
  if (value.type === "lease_material") {
    return !("material_file_ids" in value) || Array.isArray(value.material_file_ids);
  }
  if (value.type === "rental_community") {
    return typeof value.community_join_application_id === "number";
  }
  return false;
};

const restorePremisesMode = (formValue: unknown): PremisesMode => {
  if (!isPlainObject(formValue)) {
    return "own";
  }
  return isPremisesMode(formValue.premisesMode) ? formValue.premisesMode : "own";
};

const restorePremisesSource = (formValue: unknown): PremisesSource | null => {
  if (!isPlainObject(formValue)) {
    return null;
  }
  return isPremisesSource(formValue.premisesSource) ? formValue.premisesSource : null;
};

const restoreMaterialState = (value: unknown): RestoredMaterialState => {
  const listFiles = initListFiles();
  if (!isPlainObject(value)) {
    return { slotFiles: initSlotFiles(), listFiles, shareholderIdentityPairCount: baseShareholderIdentityPairCount };
  }

  const materialByCategory = Object.fromEntries(
    materialCategories.map((item) => {
      const entries = value[item.key];
      return [item.key, Array.isArray(entries) ? entries.filter(isMaterialUploadItem) : []];
    }),
  ) as Record<Cat, OpcMaterialUploadItem[]>;

  const shareholderIdentityCount = materialByCategory[materialCategoryKeys.shareholderIdentity].length;
  const shareholderIdentityPairCount = Math.max(baseShareholderIdentityPairCount, Math.ceil(shareholderIdentityCount / 2));
  const slots = getMaterialSlots(shareholderIdentityPairCount);
  const slotFiles = initSlotFiles(slots);

  slots.forEach((slot) => {
    slotFiles[slot.id] = materialByCategory[slot.categoryKey][slot.slotIndex] ?? null;
  });

  imageGridSections.forEach((section) => {
    listFiles[section.categoryKey] = materialByCategory[section.categoryKey];
  });

  return { slotFiles, listFiles, shareholderIdentityPairCount };
};

const materialItemFromUploadedImage = (file: PageUploadedImage, categoryKey: Cat): OpcMaterialUploadItem => {
  const name = file.name || `${file.label || categoryKey}-${file.file_id}`;
  const extension = name.includes(".") ? name.split(".").pop() || "jpg" : "jpg";
  return {
    id: file.file_id,
    application_id: null,
    site_user_id: 0,
    material_category: categoryKey,
    original_file_name: name,
    storage_path: "",
    file_type: extension,
    file_size: 0,
    uploaded_at: "",
    is_deleted: false,
  };
};

const restoreMaterialStateFromPayloadImages = (images: PageImageValue[]): RestoredMaterialState => {
  const materialRefs = Object.fromEntries(
    materialCategories.map((item) => {
      const image = images.find((entry) => entry.key === item.key);
      return [item.key, (image?.files || []).map((file) => materialItemFromUploadedImage(file, item.key))];
    }),
  ) as Record<Cat, OpcMaterialUploadItem[]>;
  return restoreMaterialState(materialRefs);
};

const findPayloadField = (sections: PageSectionValue[], fkey: string): string => {
  for (const section of sections) {
    const field = section.fields.find((item) => item.fkey === fkey);
    if (typeof field?.value === "string") {
      return field.value;
    }
  }
  return "";
};

const restoreFormFromApplicationPayload = (payload: ApplicationFormDraftPayload): FormState => {
  const next = initForm();
  const fieldMap: Array<[keyof FormState, string]> = [
    ["companyName", "company_name"],
    ["companyNameAlternativeOne", "company_name_alternative_one"],
    ["companyNameAlternativeTwo", "company_name_alternative_two"],
    ["registeredCapital", "registered_capital"],
    ["currency", "currency"],
    ["businessScope", "business_scope"],
    ["premisesArea", "premises_area"],
    ["propertyOwner", "property_owner"],
    ["propertyContactPhone", "property_contact_phone"],
    ["legalRepresentativeName", "legal_representative_name"],
    ["legalRepresentativePhone", "legal_representative_phone"],
    ["legalRepresentativeIdNo", "legal_representative_id_no"],
    ["legalRepresentativeAddress", "legal_representative_address"],
    ["managerName", "manager_name"],
    ["managerPhone", "manager_phone"],
    ["managerIdNo", "manager_id_no"],
    ["managerAddress", "manager_address"],
    ["financeLeaderName", "finance_leader_name"],
    ["financeLeaderPhone", "finance_leader_phone"],
    ["financeLeaderIdNo", "finance_leader_id_no"],
    ["financeLeaderAddress", "finance_leader_address"],
    ["supervisorName", "supervisor_name"],
    ["supervisorPhone", "supervisor_phone"],
    ["supervisorIdNo", "supervisor_id_no"],
    ["supervisorAddress", "supervisor_address"],
    ["industrialContactName", "industrial_contact_name"],
    ["industrialContactPhone", "industrial_contact_phone"],
    ["industrialContactIdNo", "industrial_contact_id_no"],
    ["industrialContactAddress", "industrial_contact_address"],
  ];
  fieldMap.forEach(([stateKey, fieldKey]) => {
    const value = findPayloadField(payload.sections, fieldKey);
    if (value) {
      next[stateKey] = value;
    }
  });
  return next;
};

const findShareholderPayloadField = (shareholder: PageShareholderSection, fkey: string): string =>
  shareholder.fields.find((field) => field.fkey === fkey)?.value || "";

const restoreShareholdersFromApplicationPayload = (payload: ApplicationFormDraftPayload): ShareholderRow[] => {
  const rows = payload.shareholder_sections.map((item, index) => {
    const validUntil = findShareholderPayloadField(item, "valid_until");
    return {
      id: item.id || `draft-row-${index + 1}`,
      name: findShareholderPayloadField(item, "name"),
      idNo: findShareholderPayloadField(item, "id_no"),
      subscribedCapital: findShareholderPayloadField(item, "subscribed_capital"),
      equityRatio: findShareholderPayloadField(item, "equity_ratio"),
      address: findShareholderPayloadField(item, "address"),
      phone: findShareholderPayloadField(item, "phone"),
      validUntilMode: validUntil === "长期" ? "长期" : validUntil ? "date" : "",
      validUntil,
    };
  });
  return rows.length ? rows : initShareholders();
};

const restorePremisesModeFromApplicationPayload = (payload: ApplicationFormDraftPayload): PremisesMode =>
  payload.premises_source?.type === "rental_community" ? "rentalCommunity" : "own";

const restorePremisesSourceFromApplicationPayload = (payload: ApplicationFormDraftPayload): PremisesSource | null => {
  if (!payload.premises_source) {
    return null;
  }
  if (payload.premises_source.type === "rental_community") {
    const communityId = Number(payload.premises_source.community_id);
    return Number.isFinite(communityId)
      ? {
          type: "rental_community",
          community_join_application_id: communityId,
        }
      : null;
  }
  return {
    type: "lease_material",
    material_file_ids: [],
  };
};

const isMaterialUploadItem = (value: unknown): value is OpcMaterialUploadItem =>
  isPlainObject(value) &&
  typeof value.id === "number" &&
  typeof value.site_user_id === "number" &&
  typeof value.material_category === "string" &&
  typeof value.original_file_name === "string" &&
  typeof value.storage_path === "string" &&
  typeof value.file_type === "string" &&
  typeof value.file_size === "number" &&
  typeof value.uploaded_at === "string";

const materialImageUrl = (file: OpcMaterialUploadItem): string => {
  if (!["png", "jpg", "jpeg"].includes(file.file_type.toLowerCase())) {
    return "";
  }
  const normalizedPath = file.storage_path.startsWith("/") ? file.storage_path : `/${file.storage_path}`;
  return normalizedPath.replace(/\\/g, "/");
};

const hasUploadedMaterialForCategory = (
  categoryKey: Cat,
  slots: MaterialSlot[],
  slotFiles: SlotMaterialMap,
  listFiles: ListMaterialMap,
): boolean =>
  slots.some((slot) => slot.categoryKey === categoryKey && !!slotFiles[slot.id]) ||
  (listFiles[categoryKey] || []).some(isMaterialUploadItem);

const collectUploadedMaterialFileIdsForCategory = (
  categoryKey: Cat,
  slots: MaterialSlot[],
  slotFiles: SlotMaterialMap,
  listFiles: ListMaterialMap,
): number[] => {
  const ids: number[] = [];
  slots.forEach((slot) => {
    if (slot.categoryKey !== categoryKey) {
      return;
    }
    const file = slotFiles[slot.id];
    if (file && isMaterialUploadItem(file)) {
      ids.push(file.id);
    }
  });
  ids.push(...(listFiles[categoryKey] || []).filter(isMaterialUploadItem).map((file) => file.id));
  return Array.from(new Set(ids));
};

const buildPremisesSourceForSubmit = (
  premisesMode: PremisesMode,
  premisesSource: PremisesSource | null,
  slots: MaterialSlot[],
  slotFiles: SlotMaterialMap,
  listFiles: ListMaterialMap,
): PremisesSource | null => {
  if (premisesMode === "rentalCommunity") {
    return premisesSource?.type === "rental_community" ? premisesSource : null;
  }
  return {
    type: "lease_material",
    material_file_ids: collectUploadedMaterialFileIdsForCategory(materialCategoryKeys.premisesLease, slots, slotFiles, listFiles),
  };
};

const buildApplicationFormPagePayload = (
  form: FormState,
  shareholders: ShareholderRow[],
  slots: MaterialSlot[],
  slotFiles: SlotMaterialMap,
  listFiles: ListMaterialMap,
  premisesMode: PremisesMode,
  premisesSource: PremisesSource | null,
): ApplicationFormPayload => {
  const sections: PageSectionValue[] = [
    {
      key: "company_basic",
      label: "公司基本信息",
      fields: [
        { fkey: "company_name", label: "公司名称（拟）", value: form.companyName },
        { fkey: "company_name_alternative_one", label: "公司备选名称", value: form.companyNameAlternativeOne },
        { fkey: "company_name_alternative_two", label: "公司备选名称", value: form.companyNameAlternativeTwo },
        { fkey: "name_combination_mode", label: "名称组合方式", value: "市级区划+区级区划+字号+行业特点+组织形式" },
        { fkey: "registered_capital", label: "注册资本", value: form.registeredCapital },
        { fkey: "currency", label: "币种", value: form.currency },
      ],
    },
    {
      key: "business_scope",
      label: "经营范围（或者拟经营的主要业务）",
      fields: [{ fkey: "business_scope", label: "经营范围", value: form.businessScope }],
    },
    {
      key: "premises",
      label: "住所/经营场所",
      fields: [
        { fkey: "premises_area", label: "住所面积", value: form.premisesArea },
        { fkey: "property_owner", label: "产权人", value: form.propertyOwner },
        { fkey: "property_contact_phone", label: "联系手机", value: form.propertyContactPhone },
      ],
    },
    {
      key: "legal_representative",
      label: "执行董事（法定代表人）",
      fields: [
        { fkey: "legal_representative_name", label: "姓名", value: form.legalRepresentativeName },
        { fkey: "legal_representative_phone", label: "手机号", value: form.legalRepresentativePhone },
        { fkey: "legal_representative_id_no", label: "身份证", value: form.legalRepresentativeIdNo },
        { fkey: "legal_representative_address", label: "证件住址", value: form.legalRepresentativeAddress },
      ],
    },
    {
      key: "manager",
      label: "经理",
      fields: [
        { fkey: "manager_name", label: "姓名", value: form.managerName },
        { fkey: "manager_phone", label: "手机号", value: form.managerPhone },
        { fkey: "manager_id_no", label: "身份证", value: form.managerIdNo },
        { fkey: "manager_address", label: "证件住址", value: form.managerAddress },
      ],
    },
    {
      key: "finance_leader",
      label: "财务负责人",
      fields: [
        { fkey: "finance_leader_name", label: "姓名", value: form.financeLeaderName },
        { fkey: "finance_leader_phone", label: "手机号", value: form.financeLeaderPhone },
        { fkey: "finance_leader_id_no", label: "身份证", value: form.financeLeaderIdNo },
        { fkey: "finance_leader_address", label: "证件住址", value: form.financeLeaderAddress },
      ],
    },
    {
      key: "supervisor",
      label: "监事",
      fields: [
        { fkey: "supervisor_name", label: "姓名", value: form.supervisorName },
        { fkey: "supervisor_phone", label: "手机号", value: form.supervisorPhone },
        { fkey: "supervisor_id_no", label: "身份证", value: form.supervisorIdNo },
        { fkey: "supervisor_address", label: "证件住址", value: form.supervisorAddress },
      ],
    },
    {
      key: "industrial_contact",
      label: "工商联络人",
      fields: [
        { fkey: "industrial_contact_name", label: "姓名", value: form.industrialContactName },
        { fkey: "industrial_contact_phone", label: "手机号", value: form.industrialContactPhone },
        { fkey: "industrial_contact_id_no", label: "身份证", value: form.industrialContactIdNo },
        { fkey: "industrial_contact_address", label: "证件住址", value: form.industrialContactAddress },
      ],
    },
  ];

  const shareholderSections: PageShareholderSection[] = shareholders
    .filter((row, index) => index === 0 || shareholderRequiredFields.some(({ key }) => row[key].trim()))
    .map((row, index) => ({
      id: row.id || `shareholder-${index + 1}`,
      key: "shareholder",
      label: shareholderLabel(index),
      fields: [
        { fkey: "name", label: "姓名", value: row.name },
        { fkey: "id_no", label: "证件号", value: row.idNo },
        { fkey: "subscribed_capital", label: "认缴额", value: row.subscribedCapital },
        { fkey: "equity_ratio", label: "认缴比例", value: row.equityRatio },
        { fkey: "address", label: "证件住址", value: row.address },
        { fkey: "phone", label: "手机", value: row.phone },
        { fkey: "valid_until", label: "证件有效期", value: row.validUntil },
      ],
    }));

  const images: PageImageValue[] = materialCategories.map((category) => {
    const files: PageUploadedImage[] = [];
    slots.forEach((slot) => {
      const file = slot.categoryKey === category.key ? slotFiles[slot.id] : null;
      if (file && (premisesMode === "own" || category.key !== materialCategoryKeys.premisesLease)) {
        files.push({ key: category.key, label: category.key, file_id: file.id, name: file.original_file_name });
      }
    });
    if (premisesMode === "own" || category.key !== materialCategoryKeys.premisesLease) {
      files.push(
        ...(listFiles[category.key] || []).map((file) => ({
          key: category.key,
          label: category.key,
          file_id: file.id,
          name: file.original_file_name,
        })),
      );
    }
    return {
      key: category.key,
      label: category.key,
      files,
    };
  });

  const pagePremisesSource: PagePremisesSource | null =
    premisesMode === "rentalCommunity"
      ? {
          type: "rental_community",
          community_id:
            premisesSource?.type === "rental_community"
              ? String(premisesSource.community_join_application_id)
              : null,
        }
      : { type: "lease_material" };

  return {
    version: 1,
    sections,
    shareholder_sections: shareholderSections,
    images,
    premises_source: pagePremisesSource,
  };
};

function SectionTitle({ text, required = false }: { text: string; required?: boolean }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="inline-block h-[14px] w-[3px] rounded-full bg-[#0052FF]" />
      <h3 style={sectionTitleStyle}>
        {required ? <span className="mr-1 text-red-500">*</span> : null}
        {text}
      </h3>
    </div>
  );
}

function CommunityJoinModal({
  state,
  onConfirm,
  onClose,
}: {
  state: CommunityJoinModalState;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <ViewportModal
      contentClassName="relative w-full max-w-[420px] rounded-[16px] bg-white p-7 shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
      onClose={onClose}
      open
    >
      <button
        className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-[#8898b6] transition-colors hover:bg-[#f0f4fb] hover:text-[#4a5b78]"
        onClick={onClose}
        type="button"
      >
        <X size={16} />
      </button>

      {state.step === "confirm" && (
        <>
          <div className="mb-5 text-[18px] font-bold text-[#13213f]">申请入驻</div>
          <p className="mb-7 text-[14px] leading-[1.8] text-[#4a5b78]">
            是否确认申请入驻 <span className="font-bold text-[#0f49b6]">{state.campus}</span>？
          </p>
          <div className="flex justify-end gap-3">
            <button
              className="h-9 rounded-[4px] border border-[#dfe8f5] px-5 text-[13px] font-medium text-[#445673] transition-colors hover:bg-[#f5f8ff]"
              onClick={onClose}
              type="button"
            >
              取消
            </button>
            <button
              className="h-9 rounded-[4px] bg-[#beec00] px-5 text-[13px] font-bold text-[#13213f] transition-all hover:-translate-y-[1px] hover:shadow-[0_8px_18px_rgba(190,236,0,0.28)]"
              onClick={onConfirm}
              type="button"
            >
              确认申请
            </button>
          </div>
        </>
      )}

      {state.step === "loading" && (
        <div className="flex flex-col items-center gap-4 py-6">
          <Loader2 className="animate-spin text-[#0f49b6]" size={32} />
          <p className="text-[14px] text-[#4a5b78]">正在提交申请...</p>
        </div>
      )}

      {state.step === "success" && (
        <>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#eafff0]">
            <svg fill="none" height="24" viewBox="0 0 24 24" width="24">
              <path d="M5 13l4 4L19 7" stroke="#22c55e" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
            </svg>
          </div>
          <div className="mb-3 text-[17px] font-bold text-[#13213f]">申请已提交</div>
          <p className="mb-7 text-[14px] leading-[1.8] text-[#4a5b78]">
            您的申请我们已经收到，会在 <span className="font-semibold text-[#0f49b6]">5 个工作日</span>内给您回复。
          </p>
          <div className="flex justify-end">
            <button
              className="h-9 rounded-[4px] bg-[#0f49b6] px-6 text-[13px] font-bold text-white transition-all hover:-translate-y-[1px]"
              onClick={onClose}
              type="button"
            >
              知道了
            </button>
          </div>
        </>
      )}

      {state.step === "error" && (
        <>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#fff1f0]">
            <X className="text-[#f5222d]" size={22} />
          </div>
          <div className="mb-3 text-[17px] font-bold text-[#13213f]">提交失败</div>
          <p className="mb-7 text-[14px] leading-[1.8] text-[#4a5b78]">{state.errorMessage}</p>
          <div className="flex justify-end">
            <button
              className="h-9 rounded-[4px] border border-[#dfe8f5] px-5 text-[13px] font-medium text-[#445673] transition-colors hover:bg-[#f5f8ff]"
              onClick={onClose}
              type="button"
            >
              关闭
            </button>
          </div>
        </>
      )}
    </ViewportModal>
  );
}

function DraftSaveSuccessModal({ onClose }: { onClose: () => void }) {
  return (
    <ViewportModal
      contentClassName="relative w-full max-w-[420px] rounded-[16px] bg-white p-7 shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
      onClose={onClose}
      open
    >
      <button
        className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-[#8898b6] transition-colors hover:bg-[#f0f4fb] hover:text-[#4a5b78]"
        onClick={onClose}
        type="button"
      >
        <X size={16} />
      </button>

      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#eafff0]">
        <svg fill="none" height="24" viewBox="0 0 24 24" width="24">
          <path d="M5 13l4 4L19 7" stroke="#22c55e" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
        </svg>
      </div>
      <div className="mb-3 text-[17px] font-bold text-[#13213f]">保存成功</div>
      <p className="mb-7 text-[14px] leading-[1.8] text-[#4a5b78]">草稿已保存，您可以稍后继续完善并提交申请。</p>
      <div className="flex justify-end">
        <button
          className="h-9 rounded-[4px] bg-[#0f49b6] px-6 text-[13px] font-bold text-white transition-all hover:-translate-y-[1px]"
          onClick={onClose}
          type="button"
        >
          知道了
        </button>
      </div>
    </ViewportModal>
  );
}

function ValidityDateControl({
  className,
  inputClassName,
  inputStyle,
  onChange,
  row,
}: {
  className: string;
  inputClassName: string;
  inputStyle: CSSProperties;
  onChange: (next: Pick<ShareholderRow, "validUntilMode" | "validUntil">) => void;
  row: ShareholderRow;
}) {
  const formatDateInput = (rawValue: string) => {
    const digits = rawValue.replace(/\D/g, "").slice(0, 8);
    const nextYear = digits.slice(0, 4);
    const nextMonth = digits.slice(4, 6);
    const nextDay = digits.slice(6, 8);
    onChange({
      validUntilMode: "date",
      validUntil: joinValidityDate(nextYear, nextMonth, nextDay),
    });
  };

  if (row.validUntilMode === "date") {
    return (
      <input
        className={`${inputClassName} ${className}`}
        inputMode="numeric"
        maxLength={10}
        onChange={(event) => formatDateInput(event.target.value)}
        placeholder="年/月/日"
        style={inputStyle}
        value={row.validUntil.replace(/-/g, "/")}
      />
    );
  }

  return (
    <select
      className={`${inputClassName} ${className} ${row.validUntilMode ? "" : "text-slate-400"}`}
      onChange={(event) => {
        const nextMode = event.target.value;
        onChange({
          validUntilMode: nextMode,
          validUntil: nextMode === "长期" ? "长期" : "",
        });
      }}
      style={inputStyle}
      value={row.validUntilMode}
    >
      <option disabled value="">
        身份证有效期起止
      </option>
      {certificateValidityOptions.map((item) => (
        <option key={item.value} value={item.value}>
          {item.label}
        </option>
      ))}
    </select>
  );
}

export function OpcSetupApplicationSection() {
  const [user, setUser] = useState<SiteUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState<UploadingState>(null);
  const [success, setSuccess] = useState<{ no: string; time: string; status: string } | null>(null);
  const [draftSaveSuccessOpen, setDraftSaveSuccessOpen] = useState(false);
  const [slotFiles, setSlotFiles] = useState<SlotMaterialMap>(initSlotFiles());
  const [listFiles, setListFiles] = useState<ListMaterialMap>(initListFiles());
  const [form, setForm] = useState<FormState>(initForm());
  const [shareholders, setShareholders] = useState<ShareholderRow[]>(initShareholders());
  const [premisesMode, setPremisesMode] = useState<PremisesMode>("own");
  const [premisesSource, setPremisesSource] = useState<PremisesSource | null>(null);
  const [communityJoinModal, setCommunityJoinModal] = useState<CommunityJoinModalState | null>(null);
  const [materialPreviewUrls, setMaterialPreviewUrls] = useState<Record<number, string>>({});
  const [draftLoadedUserId, setDraftLoadedUserId] = useState<number | null>(null);
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftSaving, setDraftSaving] = useState(false);
  const [businessRangeGuideOpen, setBusinessRangeGuideOpen] = useState(false);
  const [shareholderIdentityPairCount, setShareholderIdentityPairCount] = useState(baseShareholderIdentityPairCount);
  const currentMaterialSections = buildMaterialSections(shareholderIdentityPairCount);
  const currentMaterialSlots = getMaterialSlots(shareholderIdentityPairCount);

  useEffect(() => {
    const sync = (): void => {
      setUser(getCachedSiteUser());
      setLoading(true);
      void fetchCurrentSiteUser()
        .then(setUser)
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
    };

    sync();
    return onSiteAuthChange(sync);
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setDraftLoadedUserId(null);
      return;
    }
    if (loading || draftLoadedUserId === user.id) {
      return;
    }

    setDraftLoading(true);
    void getApplicationFormDraft()
      .then((result) => {
        const draft = result.draft;
        if (!draft) {
          return;
        }
        const restoredMaterials = restoreMaterialStateFromPayloadImages(draft.images);
        setForm(restoreFormFromApplicationPayload(draft));
        setPremisesMode(restorePremisesModeFromApplicationPayload(draft));
        setPremisesSource(restorePremisesSourceFromApplicationPayload(draft));
        setShareholders(restoreShareholdersFromApplicationPayload(draft));
        setShareholderIdentityPairCount(restoredMaterials.shareholderIdentityPairCount);
        setSlotFiles(restoredMaterials.slotFiles);
        setListFiles(restoredMaterials.listFiles);
        setMsg("已恢复上次保存的草稿");
      })
      .catch((e) => {
        setMsg(e instanceof Error ? e.message : "读取草稿失败，请稍后重试。");
      })
      .finally(() => {
        setDraftLoadedUserId(user.id);
        setDraftLoading(false);
      });
  }, [draftLoadedUserId, loading, user?.id]);

  const requireLoginForCommunityJoin = (): boolean => {
    if (user?.id || hasSiteAuthSession() || typeof window === "undefined") {
      return true;
    }
    const returnTo = window.location.pathname || "/setup/apply";
    redirectToIxiaMenLogin(returnTo);
    return false;
  };

  const showSubmitValidationMessage = (message: string): void => {
    setMsg(message);
  };

  const openCommunityJoinModal = (campus: string): void => {
    if (!requireLoginForCommunityJoin()) {
      return;
    }
    setCommunityJoinModal({ campus, step: "confirm" });
  };

  const confirmCommunityJoin = async (): Promise<void> => {
    if (!communityJoinModal) {
      return;
    }
    const campus = communityJoinModal.campus;
    setCommunityJoinModal({ campus, step: "loading" });
    try {
      const result = await submitCommunityJoinApplication(campus);
      setPremisesMode("rentalCommunity");
      setPremisesSource({
        type: "rental_community",
        community_join_application_id: result.id,
        target_campus: result.target_campus,
        status: result.status,
        submitted_at: result.submitted_at,
      });
      setCommunityJoinModal({ campus, step: "success" });
    } catch (e) {
      setCommunityJoinModal({
        campus,
        step: "error",
        errorMessage: e instanceof Error ? e.message : "提交失败，请稍后重试。",
      });
    }
  };

  const openBusinessRangeGuide = (): void => {
    setBusinessRangeGuideOpen(true);
  };

  const setField = (k: keyof FormState, v: string): void => {
    setForm((s) => ({
      ...s,
      [k]:
        k === "registeredCapital" || k === "premisesArea"
          ? v.replace(/[^\d.]/g, "")
          : k.toLowerCase().includes("phone")
            ? v.replace(/[^\d-]/g, "")
            : k.toLowerCase().includes("idno")
              ? v.replace(/[^\da-zA-Z]/g, "")
              : v,
    }));
  };

  const isRequiredField = (field: string): boolean => formFieldRequirementMap.get(field) === true;

  const setShareholderField = (id: string, k: keyof Omit<ShareholderRow, "id">, v: string): void => {
    const value =
      k === "subscribedCapital" || k === "equityRatio"
        ? v.replace(/[^\d.]/g, "")
        : k === "phone"
          ? v.replace(/[^\d-]/g, "")
          : k === "idNo"
            ? v.replace(/[^\da-zA-Z]/g, "")
            : v;
    setShareholders((rows) => rows.map((row) => (row.id === id ? { ...row, [k]: value } : row)));
  };

  const addShareholder = (): void => {
    setShareholders((rows) =>
      rows.length >= maxShareholderCount
        ? rows
        : [
            ...rows,
            {
              id: `row-${Date.now()}`,
              name: "",
              idNo: "",
              subscribedCapital: "",
              equityRatio: "",
              address: "",
              phone: "",
              validUntilMode: "",
              validUntil: "",
            },
          ],
    );
  };

  const deleteShareholder = (id: string): void => {
    setShareholders((rows) => (rows.length <= 1 ? rows : rows.filter((row) => row.id !== id)));
  };

  const addShareholderIdentityPair = (): void => {
    if (shareholderIdentityPairCount >= maxShareholderIdentityPairCount) {
      return;
    }

    const nextPairCount = shareholderIdentityPairCount + 1;
    const addedSlots = buildShareholderIdentitySlots(nextPairCount).slice(shareholderIdentityPairCount * 2);
    setSlotFiles((files) => ({
      ...files,
      ...Object.fromEntries(addedSlots.map((slot) => [slot.id, null])),
    }));
    setShareholderIdentityPairCount(nextPairCount);
  };

  const setMaterialPreviewUrl = (fileId: number, url: string): void => {
    setMaterialPreviewUrls((s) => ({ ...s, [fileId]: url }));
  };

  const removeMaterialPreviewUrl = (fileId: number): void => {
    setMaterialPreviewUrls((s) => {
      const next = { ...s };
      if (next[fileId]) {
        URL.revokeObjectURL(next[fileId]);
        delete next[fileId];
      }
      return next;
    });
  };

  const uploadSingleFile = async (categoryKey: Cat, file: File): Promise<OpcMaterialUploadItem> => {
    const uploaded = await uploadApplicationFormImage(categoryKey, file);
    if (uploaded.material_category !== categoryKey) {
      try {
        await deleteApplicationFormImage(uploaded.id);
      } catch {
        // 分类异常时优先阻断前端状态写入，清理失败交给后台定期处理。
      }
      throw new Error("材料分类返回不一致，请刷新页面后重试。");
    }
    return uploaded;
  };

  const replaceMaterialSlot = async (slot: MaterialSlot, file: File): Promise<void> => {
    const existing = slotFiles[slot.id];
    const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : "";
    let uploaded: OpcMaterialUploadItem | null = null;

    setUploading({ categoryKey: slot.categoryKey, targetId: slot.id });
    setMsg("");
    try {
      uploaded = await uploadSingleFile(slot.categoryKey, file);
      if (existing) {
        await deleteApplicationFormImage(existing.id);
      }
      setSlotFiles((s) => ({ ...s, [slot.id]: uploaded }));
      if (existing) {
        removeMaterialPreviewUrl(existing.id);
      }
      if (previewUrl) {
        setMaterialPreviewUrl(uploaded.id, previewUrl);
      }
      setMsg(`${slot.categoryKey} 上传成功`);
    } catch (e) {
      if (uploaded) {
        try {
          await deleteApplicationFormImage(uploaded.id);
        } catch {
          // 替换失败后的清理失败不覆盖原始错误提示。
        }
      }
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setMsg(e instanceof Error ? e.message : "材料上传失败，请稍后重试。");
    } finally {
      setUploading(null);
    }
  };

  const uploadToTarget = async (target: MaterialUploadTarget, input: FileList | File | null): Promise<void> => {
    const inputFiles = input instanceof File ? [input] : Array.from(input || []);
    if (!inputFiles.length) return;

    if (target.mode === "slot") {
      await replaceMaterialSlot(target.slot, inputFiles[0]);
      return;
    }

    const currentFiles = listFiles[target.categoryKey] || [];
    const maxFiles = target.maxFiles ?? materialCategoryConfigMap.get(target.categoryKey)?.maxFiles;
    const remaining = typeof maxFiles === "number" ? Math.max(maxFiles - currentFiles.length, 0) : inputFiles.length;
    const filesToUpload = inputFiles.slice(0, remaining);
    if (!filesToUpload.length) {
      setMsg(typeof maxFiles === "number" ? `最多上传 ${maxFiles} 张图片` : "当前分类不能继续上传");
      return;
    }

    setUploading({ categoryKey: target.categoryKey, targetId: target.categoryKey });
    setMsg("");
    const previewEntries: Array<{ id: number; url: string }> = [];
    try {
      const added: OpcMaterialUploadItem[] = [];
      for (const file of filesToUpload) {
        const uploaded = await uploadSingleFile(target.categoryKey, file);
        added.push(uploaded);
        if (file.type.startsWith("image/")) {
          previewEntries.push({ id: uploaded.id, url: URL.createObjectURL(file) });
        }
      }
      setListFiles((s) => {
        const existingFiles = s[target.categoryKey] || [];
        return { ...s, [target.categoryKey]: [...existingFiles, ...added] };
      });
      if (previewEntries.length) {
        setMaterialPreviewUrls((s) => {
          const next = { ...s };
          previewEntries.forEach(({ id, url }) => {
            next[id] = url;
          });
          return next;
        });
      }
      setMsg(
        typeof maxFiles === "number" && filesToUpload.length < inputFiles.length
          ? `${target.categoryKey} 上传成功，最多保留 ${maxFiles} 张`
          : `${target.categoryKey} 上传成功`,
      );
    } catch (e) {
      previewEntries.forEach(({ url }) => URL.revokeObjectURL(url));
      setMsg(e instanceof Error ? e.message : "材料上传失败，请稍后重试。");
    } finally {
      setUploading(null);
    }
  };

  const removeMaterialFromTarget = async (target: MaterialUploadTarget, fileId?: number): Promise<void> => {
    const file = target.mode === "slot" ? slotFiles[target.slot.id] : listFiles[target.categoryKey].find((item) => item.id === fileId);
    if (!file) return;

    try {
      await deleteApplicationFormImage(file.id);
      if (target.mode === "slot") {
        setSlotFiles((s) => ({ ...s, [target.slot.id]: null }));
      } else {
        setListFiles((s) => ({ ...s, [target.categoryKey]: s[target.categoryKey].filter((item) => item.id !== file.id) }));
      }
      removeMaterialPreviewUrl(file.id);
      setMsg("材料已删除");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "删除材料失败，请稍后重试。");
    }
  };

  const saveDraft = async (): Promise<void> => {
    if (!user?.id && !hasSiteAuthSession()) {
      if (typeof window !== "undefined") {
        const returnTo = window.location.pathname || "/setup/apply";
        redirectToIxiaMenLogin(returnTo);
      }
      return;
    }

    setDraftSaving(true);
    setMsg("");
    try {
      await saveApplicationFormDraft(
        buildApplicationFormPayload(
          buildApplicationFormPagePayload(form, shareholders, currentMaterialSlots, slotFiles, listFiles, premisesMode, premisesSource),
        ),
      );
      setDraftLoadedUserId(user?.id ?? null);
      setDraftSaveSuccessOpen(true);
    } catch {
      // 保存草稿失败时不打断用户继续填写。
    } finally {
      setDraftSaving(false);
    }
  };

  const submit = async (): Promise<void> => {
    const missingFormFields = requiredFormFields.filter(({ key }) => !form[key].trim()).map(({ label }) => label);
    if (missingFormFields.length) {
      showSubmitValidationMessage(`请完整填写必填项：${missingFormFields.join("、")}`);
      return;
    }

    const incompleteShareholders = shareholders
      .map((row, index) => {
        const hasAnyValue = shareholderRequiredFields.some(({ key }) => row[key].trim());
        if (index !== 0 && !hasAnyValue) {
          return null;
        }
        const missingLabels = shareholderRequiredFields.filter(({ key }) => !row[key].trim()).map(({ label }) => label);
        return missingLabels.length ? `${shareholderLabel(index)}${missingLabels.join("、")}` : null;
      })
      .filter((item): item is string => Boolean(item));

    if (incompleteShareholders.length) {
      showSubmitValidationMessage(`请完整填写股东信息：${incompleteShareholders.join("；")}`);
      return;
    }

    if (form.registeredCapital.trim() && !/^\d+(\.\d+)?$/.test(form.registeredCapital)) {
      showSubmitValidationMessage("注册资本仅支持数字填写");
      return;
    }

    const missingMaterialCategories = requiredMaterialCategories.filter((categoryKey) => {
      if (categoryKey === materialCategoryKeys.premisesLease) {
        return false;
      }
      return !hasUploadedMaterialForCategory(categoryKey, currentMaterialSlots, slotFiles, listFiles);
    });
    if (missingMaterialCategories.length) {
      showSubmitValidationMessage(`请按要求上传全部必传材料：${missingMaterialCategories.join("、")}`);
      return;
    }
    const nextPremisesSource = buildPremisesSourceForSubmit(premisesMode, premisesSource, currentMaterialSlots, slotFiles, listFiles);
    const premisesRequirementSatisfied =
      premisesMode === "own"
        ? hasUploadedMaterialForCategory(materialCategoryKeys.premisesLease, currentMaterialSlots, slotFiles, listFiles)
        : nextPremisesSource?.type === "rental_community" && !!nextPremisesSource.community_join_application_id;
    if (!premisesRequirementSatisfied || !nextPremisesSource) {
      showSubmitValidationMessage("请上传住所/经营场所租赁合同，或完成租赁社区入驻申请");
      return;
    }

    setSubmitting(true);
    setMsg("");

    try {
      const r = await submitApplicationForm(
        buildApplicationFormPayload(
          buildApplicationFormPagePayload(form, shareholders, currentMaterialSlots, slotFiles, listFiles, premisesMode, nextPremisesSource),
        ),
      );

      try {
        await clearApplicationFormDraft();
      } catch {
        // 提交已经成功，草稿清理失败不影响用户看到申请结果。
      }
      setSuccess({ no: r.application_no, time: r.submitted_at, status: r.status });
      Object.values(materialPreviewUrls).forEach((url) => URL.revokeObjectURL(url));
      setMaterialPreviewUrls({});
      setSlotFiles(initSlotFiles());
      setListFiles(initListFiles());
      setForm(initForm());
      setPremisesMode("own");
      setPremisesSource(null);
      setShareholders(initShareholders());
      setMsg("");
    } catch (e) {
      showSubmitValidationMessage(e instanceof Error ? e.message : "提交申请失败，请稍后重试。");
    } finally {
      setSubmitting(false);
    }
  };

  const inlineInput = (
    k: keyof FormState,
    label: string,
    req = false,
    type = "text",
    inputClassName = "md:w-[220px]",
    extraLabel?: ReactNode,
    placeholder = "请输入",
  ) => (
    <label className={`${inlineFieldRowClass} md:flex-none`}>
      <span className={inlineFieldLabelClass}>
        {req ? <span className="mr-1 text-red-500">*</span> : null}
        {label}
      </span>
      <input
        className={`${mobileCardFieldClass} min-w-0 flex-1 ${inputClassName} md:flex-none ${inputFocusClass}`}
        onChange={(e) => setField(k, e.target.value)}
        placeholder={placeholder}
        type={type}
        value={form[k]}
      />
      {extraLabel ? <span className="shrink-0 text-sm font-medium text-slate-400">{extraLabel}</span> : null}
    </label>
  );

  const registeredCapitalInput = () => (
    <label className={`${inlineFieldRowClass} md:flex-none`}>
      <span className={inlineFieldLabelClass}>
        {isRequiredField("registered_capital") ? <span className="mr-1 text-red-500">*</span> : null}
        注册资本
      </span>
      <div className={`${mobileCardFieldWrapperClass} !rounded-[5px] sm:!rounded-[5px] ${inputFocusWithinClass} md:w-[240px] md:flex-none`}>
        <input
          className="h-full min-w-0 flex-1 px-3 text-sm outline-none sm:px-2"
          onChange={(e) => setField("registeredCapital", e.target.value)}
          placeholder="请输入"
          type="text"
          value={form.registeredCapital}
        />
        <span className="flex h-full shrink-0 items-center border-l border-[#d7e3f5] px-3 text-sm text-slate-500 sm:px-2">万元</span>
      </div>
    </label>
  );

  const currencySelect = () => (
    <label className={`${inlineFieldRowClass} md:flex-none`}>
      <span className={inlineFieldLabelClass}>
        {isRequiredField("currency") ? <span className="mr-1 text-red-500">*</span> : null}
        币种
      </span>
      <select
        className={`${mobileCardFieldClass} min-w-0 flex-1 md:w-[220px] md:flex-none !rounded-[5px] sm:!rounded-[5px] ${inputFocusClass}`}
        onChange={(e) => setField("currency", e.target.value)}
        value={form.currency}
      >
        {currencyOptions.map((item) => (
          <option key={item.code} value={item.name}>
            {item.name} {item.code} {item.symbol}
          </option>
        ))}
      </select>
    </label>
  );

  const premisesAreaInput = () => (
    <label className={`${inlineFieldRowClass} md:flex-none`}>
      <span className={inlineFieldLabelClass}>
        {isRequiredField("premises_area") ? <span className="mr-1 text-red-500">*</span> : null}
        面积
      </span>
      <div className={`${mobileCardFieldWrapperClass} !rounded-[5px] sm:!rounded-[5px] ${inputFocusWithinClass} md:w-[220px] md:flex-none`}>
        <input
          className="h-full min-w-0 flex-1 px-3 text-sm outline-none sm:px-2"
          onChange={(e) => setField("premisesArea", e.target.value)}
          type="text"
          value={form.premisesArea}
        />
        <span className="flex h-full shrink-0 items-center border-l border-[#d7e3f5] px-3 text-sm text-slate-500 sm:px-2">
          m<sup>2</sup>
        </span>
      </div>
    </label>
  );

  const shareholderInput = (
    row: ShareholderRow,
    k: keyof Omit<ShareholderRow, "id">,
    placeholder = "请输入",
    className = "w-full",
  ) => (
    <input
      className={`${tableFieldClass} ${inputFocusClass} ${className}`}
      onChange={(e) => setShareholderField(row.id, k, e.target.value)}
      placeholder={placeholder}
      style={shareholderInputTextStyle}
      value={row[k]}
    />
  );

  const shareholderValiditySelect = (row: ShareholderRow, className = "w-full sm:w-[132px]") => (
    <ValidityDateControl
      className={className}
      inputClassName={`${tableFieldClass} ${inputFocusClass}`}
      inputStyle={shareholderInputTextStyle}
      onChange={(next) => {
        setShareholders((rows) => rows.map((item) => (item.id === row.id ? { ...item, ...next } : item)));
      }}
      row={row}
    />
  );

  const officerTableInput = (
    key: keyof FormState,
    placeholder = "请输入",
    className = "w-full",
    type = "text",
  ) => (
    <input
      className={`${tableFieldClass} ${inputFocusClass} ${className}`}
      onChange={(e) => setField(key, e.target.value)}
      placeholder={placeholder}
      style={shareholderInputTextStyle}
      type={type}
      value={form[key]}
    />
  );

  const shareholderTable = () => (
    <div>
      <div className="space-y-4 md:hidden">
        {shareholders.map((row, index) => (
          <div className="rounded-[16px] border border-[#d7e3f5] bg-white p-4 shadow-sm" key={row.id}>
            <div className="flex items-center justify-between gap-3">
              <div className="text-[15px] font-semibold text-slate-900">
                {index === 0 ? <span className="mr-1 text-red-500">*</span> : null}
                {shareholderLabel(index)}
              </div>
              <button
            className="inline-flex items-center rounded-[16px] border border-[#dbeafe] bg-[#eff6ff] px-3 py-1 text-[12px] font-medium text-[#0091F9] disabled:cursor-not-allowed disabled:opacity-40"
                disabled={shareholders.length <= 1}
                onClick={() => deleteShareholder(row.id)}
                type="button"
              >
                删除
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <label className={inlineFieldRowClass}>
                <span className={mobileCardInlineFieldLabelClass}>姓名</span>
                {shareholderInput(row, "name")}
              </label>
              <label className={inlineFieldRowClass}>
                <span className={mobileCardInlineFieldLabelClass}>手机</span>
                {shareholderInput(row, "phone")}
              </label>
              <label className={inlineFieldRowClass}>
                <span className={mobileCardInlineFieldLabelClass}>证件号</span>
                {shareholderInput(row, "idNo")}
              </label>
              <label className={inlineFieldRowClass}>
                <span className={mobileCardInlineFieldLabelClass}>证件有效期</span>
                {shareholderValiditySelect(row)}
              </label>
              <label className={inlineFieldRowClass}>
                <span className={mobileCardInlineFieldLabelClass}>认缴额（万元）</span>
                {shareholderInput(row, "subscribedCapital")}
              </label>
              <label className={inlineFieldRowClass}>
                <span className={mobileCardInlineFieldLabelClass}>认缴比例（%）</span>
                {shareholderInput(row, "equityRatio")}
              </label>
              <label className={inlineFieldRowClass}>
                <span className={mobileCardInlineFieldLabelClass}>证件住址</span>
                {shareholderInput(row, "address")}
              </label>
            </div>
          </div>
        ))}

        <div className="-mt-1 flex justify-end pr-4">
          <button
            className="inline-flex h-[36px] items-center rounded-[0_0_5px_5px] border border-[#0091F9] bg-[#EAF5FF] px-4 text-[13px] font-medium text-[#0091F9] disabled:cursor-not-allowed disabled:border-[#bfdbfe] disabled:bg-[#eff6ff] disabled:text-[#93c5fd]"
            disabled={shareholders.length >= maxShareholderCount}
            onClick={addShareholder}
            type="button"
          >
            添加股东
          </button>
        </div>
      </div>

      <div className="hidden overflow-hidden rounded-[16px] border border-[#d7e3f5] md:block">
        <table className="w-full border-collapse bg-white table-fixed">
          <colgroup>
            <col className="w-[64px]" />
            <col className="w-[80px]" />
            <col style={{ width: "calc(25% - 30px)" }} />
            <col className="w-[82px]" />
            <col className="w-[82px]" />
            <col />
            <col className="w-[128px]" />
            <col className="w-[144px]" />
            <col className="w-[56px]" />
          </colgroup>
          <thead className="bg-[#eef6ff] text-slate-700">
            <tr>
              {[
                { title: "股东" },
                { title: "姓名" },
                { title: "证件号" },
                { title: "认缴额", suffix: "（万元）" },
                { title: "认缴比例", suffix: "（%）" },
                { title: "证件住址" },
                { title: "手机" },
                { title: "证件有效期" },
                { title: "操作" },
              ].map(({ title, suffix }) => (
                <th className="border-b border-[#d7e3f5] px-2 py-2 text-center" key={`${title}${suffix || ""}`}>
                  <span style={shareholderTableHeaderTextStyle}>
                    {title}
                    {suffix ? <span style={{ color: "#94A3B8" }}>{suffix}</span> : null}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
            <tbody>
              {shareholders.map((row, index) => (
              <tr className="border-b border-[#edf2fb] last:border-b-0" key={row.id}>
                <td className="w-[64px] px-1.5 py-2 text-center">
                  <span className="inline-flex whitespace-nowrap" style={shareholderTableTextStyle}>
                    {index === 0 ? <span className="mr-1 text-red-500">*</span> : null}
                    {shareholderLabel(index)}
                  </span>
                </td>
                <td className="px-2 py-2 text-center">{shareholderInput(row, "name", "请输入", "w-full")}</td>
                <td className="px-2 py-2">{shareholderInput(row, "idNo")}</td>
                <td className="px-2 py-2 text-center">{shareholderInput(row, "subscribedCapital", "请输入", "w-full")}</td>
                <td className="px-2 py-2 text-center">{shareholderInput(row, "equityRatio", "请输入", "w-full")}</td>
                <td className="px-2 py-2">{shareholderInput(row, "address")}</td>
                <td className="px-2 py-2 text-center">{shareholderInput(row, "phone", "请输入", "w-full")}</td>
                <td className="px-2 py-2 text-center">{shareholderValiditySelect(row, "w-full")}</td>
                <td className="px-2 py-2 text-center">
                  <button
                    className="disabled:cursor-not-allowed"
                    disabled={shareholders.length <= 1}
                    onClick={() => deleteShareholder(row.id)}
                    style={
                      shareholders.length <= 1
                        ? { ...shareholderDeleteTextStyle, color: "#cbd5e1" }
                        : shareholderDeleteTextStyle
                    }
                    type="button"
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="hidden justify-end pr-[20px] md:flex">
        <button
          className="flex h-[28px] w-[70px] items-center justify-center rounded-[0_0_5px_5px] border border-[#0091F9] bg-[#EAF5FF] text-[12px] font-normal leading-[22px] text-[#0091F9] disabled:cursor-not-allowed disabled:border-[#bfdbfe] disabled:bg-[#eff6ff] disabled:text-[#93c5fd]"
          disabled={shareholders.length >= maxShareholderCount}
          onClick={addShareholder}
          type="button"
        >
          添加
        </button>
      </div>
    </div>
  );

  const officerTable = () => {
    const rows: Array<{
      title: string;
      nameKey: keyof FormState;
      requiredField: string;
      idKey: keyof FormState;
      phoneKey: keyof FormState;
      addressKey: keyof FormState;
    }> = [
      {
        title: "法定代表人",
        nameKey: "legalRepresentativeName",
        requiredField: "legal_representative_name",
        idKey: "legalRepresentativeIdNo",
        phoneKey: "legalRepresentativePhone",
        addressKey: "legalRepresentativeAddress",
      },
      {
        title: "财务负责人",
        nameKey: "financeLeaderName",
        requiredField: "finance_leader_name",
        idKey: "financeLeaderIdNo",
        phoneKey: "financeLeaderPhone",
        addressKey: "financeLeaderAddress",
      },
      {
        title: "工商联络人",
        nameKey: "industrialContactName",
        requiredField: "industrial_contact_name",
        idKey: "industrialContactIdNo",
        phoneKey: "industrialContactPhone",
        addressKey: "industrialContactAddress",
      },
      {
        title: "经理",
        nameKey: "managerName",
        requiredField: "manager_name",
        idKey: "managerIdNo",
        phoneKey: "managerPhone",
        addressKey: "managerAddress",
      },
      {
        title: "监事",
        nameKey: "supervisorName",
        requiredField: "supervisor_name",
        idKey: "supervisorIdNo",
        phoneKey: "supervisorPhone",
        addressKey: "supervisorAddress",
      },
    ];

    return (
      <>
        <div className="space-y-4 md:hidden">
          {rows.map((row) => (
            <div className="rounded-[16px] border border-[#d7e3f5] bg-white p-4 shadow-sm" key={row.title}>
              <div className="text-[15px] font-semibold text-slate-900">
                {isRequiredField(row.requiredField) ? <span className="mr-1 text-red-500">*</span> : null}
                {row.title}
              </div>
              <div className="mt-4 space-y-3">
                <label className={inlineFieldRowClass}>
                  <span className={mobileCardInlineFieldLabelClass}>姓名</span>
                  {officerTableInput(row.nameKey)}
                </label>
                <label className={inlineFieldRowClass}>
                  <span className={mobileCardInlineFieldLabelClass}>手机</span>
                  {officerTableInput(row.phoneKey, "请输入", "w-full", "tel")}
                </label>
                <label className={inlineFieldRowClass}>
                  <span className={mobileCardInlineFieldLabelClass}>身份证号</span>
                  {officerTableInput(row.idKey)}
                </label>
                <label className={inlineFieldRowClass}>
                  <span className={mobileCardInlineFieldLabelClass}>证件住址</span>
                  {officerTableInput(row.addressKey)}
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden overflow-hidden rounded-[16px] border border-[#d7e3f5] md:block">
          <table className="w-full border-collapse bg-white table-fixed">
            <colgroup>
              <col className="w-[148px]" />
              <col className="w-[13%]" />
              <col className="w-[23%]" />
              <col className="w-[148px]" />
              <col />
            </colgroup>
            <thead className="bg-[#eef6ff] text-slate-700">
              <tr>
                {["岗位", "姓名", "身份证号", "手机", "证件住址"].map((title) => (
                  <th className="border-b border-[#d7e3f5] px-2 py-2 text-center" key={title}>
                    <span style={shareholderTableHeaderTextStyle}>{title}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr className="border-b border-[#edf2fb] last:border-b-0" key={row.title}>
                  <td className="px-3 py-2 text-center">
                    <span className="inline-block whitespace-nowrap" style={officerTableTextStyle}>
                      {isRequiredField(row.requiredField) ? <span className="mr-1 text-red-500">*</span> : null}
                      {row.title}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">{officerTableInput(row.nameKey, "请输入", "w-full")}</td>
                  <td className="px-3 py-2 text-center">{officerTableInput(row.idKey, "请输入", "w-full")}</td>
                  <td className="px-3 py-2 text-center">{officerTableInput(row.phoneKey, "请输入", "w-full", "tel")}</td>
                  <td className="px-3 py-2">{officerTableInput(row.addressKey)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  const buildSlotTarget = (slot: MaterialSlot): MaterialUploadTarget => ({
    mode: "slot",
    categoryKey: slot.categoryKey,
    slot,
    accept: materialCategoryConfigMap.get(slot.categoryKey)?.accept || ".png,.jpg,.jpeg",
  });

  const buildListTarget = (section: ImageGridSection): MaterialUploadTarget => {
    const config = materialCategoryConfigMap.get(section.categoryKey);
    return {
      mode: "list",
      categoryKey: section.categoryKey,
      accept: config?.accept || ".png,.jpg,.jpeg",
      maxFiles: config?.maxFiles,
    };
  };

  const isSectionUploading = (section: MaterialSection): boolean =>
    !!uploading && section.categoryKeys.includes(uploading.categoryKey);

  const materialUploadCard = (slot: MaterialSlot) => {
    const target = buildSlotTarget(slot);
    const file = slotFiles[slot.id];
    const previewUrl = file ? materialPreviewUrls[file.id] || materialImageUrl(file) : "";
    const imageAlt = slot.ariaLabel || slot.label || slot.categoryKey;
    const uploadPrompt = slot.uploadText || (slot.label ? `上传${slot.label}` : "点击上传图片");

    return (
      <div className="min-w-0 space-y-2" key={slot.id}>
        {slot.label ? <div className="text-[13px] font-medium text-slate-600">{slot.label}</div> : null}
        <label
          className="relative flex aspect-[359/159] w-full cursor-pointer items-center justify-center overflow-hidden rounded-[8px] border border-[#E2E8F4] bg-[#ECF2FF]"
        >
          {previewUrl ? (
            <img alt={imageAlt} className="h-full w-full object-cover" src={previewUrl} />
          ) : file ? (
            <div className="px-4 text-center text-[13px] leading-6 text-slate-600">
              <div className="break-all">{file.original_file_name}</div>
              <div className="mt-1 text-xs text-slate-400">上传时间：{fmt(file.uploaded_at)}</div>
            </div>
          ) : (
            <div className="px-4 text-center text-[13px] leading-6 text-slate-500">{uploadPrompt}</div>
          )}
          <input
            accept={target.accept}
            className="hidden"
            disabled={uploading?.targetId === slot.id}
            onChange={(e) => {
              void uploadToTarget(target, e.target.files?.[0] || null);
              e.target.value = "";
            }}
            type="file"
          />
          {file ? (
            <button
              className="absolute right-3 top-3 rounded-[8px] bg-white/90 px-2 py-1 text-[12px] text-[#0091F9]"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void removeMaterialFromTarget(target);
              }}
              type="button"
            >
              删除
            </button>
          ) : null}
        </label>
      </div>
    );
  };

  const imageMaterialGrid = (section: ImageGridSection) => {
    const target = buildListTarget(section);
    const items = listFiles[section.categoryKey] || [];
    const maxFiles = target.mode === "list" ? target.maxFiles : undefined;
    const canUploadMore = typeof maxFiles === "number" ? items.length < maxFiles : true;

    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8">
        {items.map((file) => {
          const previewUrl = materialPreviewUrls[file.id] || materialImageUrl(file);
          return (
            <div className="space-y-2" key={file.id}>
              <div className="relative flex aspect-[124/186] w-full items-center justify-center overflow-hidden rounded-[8px] border border-[#0052FF] bg-[#ECF2FF]">
                {previewUrl ? (
                  <img alt={file.original_file_name} className="h-full w-full object-cover" src={previewUrl} />
                ) : (
                  <img
                    alt="租赁合同占位图"
                    className="h-[34px] w-[34px] object-contain opacity-90"
                    src="/service-OPChandle-pichold.png"
                  />
                )}
                <button
                  className="absolute right-1 top-1 rounded-[8px] bg-white/90 px-1.5 py-0.5 text-[10px] text-[#0091F9]"
                  onClick={() => void removeMaterialFromTarget(target, file.id)}
                  type="button"
                >
                  删除
                </button>
              </div>
            </div>
          );
        })}
        {canUploadMore ? (
          <label
            className="flex aspect-[124/186] w-full cursor-pointer flex-col items-center justify-center rounded-[8px] border border-[#0052FF] bg-[#ECF2FF] text-[#0052FF]"
          >
            <img
              alt="租赁合同占位图"
              className="h-[34px] w-[34px] object-contain opacity-90"
              src="/service-OPChandle-pichold.png"
            />
            <span
              className="mt-2"
              style={{
                width: "32px",
                height: "20px",
                fontFamily: "Alibaba PuHuiTi 2.0, Alibaba PuHuiTi 20",
                fontWeight: "normal",
                fontSize: "12px",
                color: "#0052FF",
                textAlign: "left",
                fontStyle: "normal",
                textTransform: "none",
                lineHeight: "20px",
                whiteSpace: "nowrap",
              }}
            >
              +上传
            </span>
            <input
              accept={target.accept}
              className="hidden"
              disabled={uploading?.targetId === section.categoryKey}
              multiple
              onChange={(e) => {
                void uploadToTarget(target, e.target.files);
                e.target.value = "";
              }}
              type="file"
            />
          </label>
        ) : null}
      </div>
    );
  };

  const communityButtonClassName =
    "inline-flex h-[36px] flex-1 items-center justify-center rounded-[5px] bg-[#0052D9] px-3 text-[12px] font-medium text-white transition-colors hover:bg-[#0047bd] lg:h-[30px] lg:min-w-[86px] lg:flex-none lg:text-[11px]";

  const communityActionButton = (card: RentalCommunityCard) => {
    const className = communityButtonClassName;

    if (card.actionType === "external" && card.actionValue) {
      return (
        <a className={className} href={card.actionValue} rel="noopener noreferrer" target="_blank">
          查看详情
        </a>
      );
    }
    if (card.actionType === "internal" && card.actionValue) {
      return (
        <Link className={className} href={card.actionValue}>
          查看详情
        </Link>
      );
    }
    return <span className={`${className} cursor-default`}>查看详情</span>;
  };

  const communityActions = (card: RentalCommunityCard, className: string) => (
    <div className={className}>
      <button className={communityButtonClassName} onClick={() => openCommunityJoinModal(card.title)} type="button">
        申请入驻
      </button>
      {communityActionButton(card)}
    </div>
  );

  const rentalCommunityCardsView = () => (
    <div className="grid w-full grid-cols-1 gap-3 lg:grid-cols-2">
      {rentalCommunityCards.map((card) => (
        <div
          className="flex h-auto w-full flex-col overflow-hidden rounded-[11px] border border-[#E2E8F4] bg-[#FBFCFF] lg:h-[256px] lg:flex-row"
          key={card.id}
        >
          <div className="flex min-w-0 flex-1 flex-col px-5 pt-5 lg:justify-between lg:py-5">
            <div className="min-w-0">
              <div
                className="text-left text-[12px] font-bold leading-[18px] text-[#2D3748] lg:truncate"
                style={{ fontFamily: "PingFang SC, PingFang SC", fontStyle: "normal", textTransform: "none" }}
              >
                {card.title}
              </div>
              <div className="mt-4 space-y-2 lg:mt-5">
                <div
                  className="break-words text-left text-[13px] font-medium leading-[20px] text-[#2D3748] lg:truncate"
                  style={{ fontFamily: "PingFang SC, PingFang SC", fontStyle: "normal", textTransform: "none" }}
                >
                  地址：{card.address}
                </div>
                <div
                  className="break-words text-left text-[13px] font-medium leading-[20px] text-[#2D3748] lg:truncate"
                  style={{ fontFamily: "PingFang SC, PingFang SC", fontStyle: "normal", textTransform: "none" }}
                >
                  电话：{card.phone}
                </div>
                <div
                  className="break-words text-left text-[13px] font-medium leading-[20px] text-[#2D3748] lg:truncate"
                  style={{ fontFamily: "PingFang SC, PingFang SC", fontStyle: "normal", textTransform: "none" }}
                >
                  邮箱：{card.email}
                </div>
              </div>
            </div>
            {communityActions(card, "hidden gap-3 lg:flex")}
          </div>
          <div className="flex w-full shrink-0 items-center justify-center bg-white/40 px-5 pt-4 lg:h-full lg:w-auto lg:justify-end lg:px-0 lg:py-[45px]">
            <img
              alt={card.imageAlt}
              className="h-auto max-h-[170px] w-full max-w-[260px] rounded-[4px] object-contain lg:h-full lg:max-h-none lg:w-auto lg:max-w-none"
              src={card.imageUrl}
            />
          </div>
          {communityActions(card, "flex gap-3 px-5 pb-5 pt-4 lg:hidden")}
        </div>
      ))}
    </div>
  );

  const premisesLeaseSectionContent = (section: ImageGridSection) => (
    <div className="w-full space-y-4">
      <div className="grid w-full grid-cols-2 gap-2 sm:w-fit">
        {[
          { label: "自有地址", value: "own" as PremisesMode },
          { label: "申请入驻租赁社区", value: "rentalCommunity" as PremisesMode },
        ].map((item) => (
          <button
            className={`flex h-[clamp(32px,8vw,36px)] min-w-0 items-center justify-center rounded-[5px] px-[clamp(10px,3vw,24px)] text-[clamp(12px,3.2vw,13.5px)] font-medium leading-none transition-colors sm:w-[189px] ${
              premisesMode === item.value
                ? "border border-[#0052D9] bg-[#0052D9] text-white"
                : "border border-[#D1D5DB] bg-white text-[#404040]"
            }`}
            key={item.value}
            onClick={() => setPremisesMode(item.value)}
            style={{ fontFamily: "PingFang SC, PingFang SC", fontStyle: "normal", textTransform: "none" }}
            type="button"
          >
            <span className="max-w-full whitespace-nowrap text-center">{item.label}</span>
          </button>
        ))}
      </div>
      {premisesMode === "own" ? imageMaterialGrid(section) : rentalCommunityCardsView()}
    </div>
  );

  if (loading) {
    return (
      <div className="mt-10 rounded-[16px] border border-[#dfe8f7] bg-white p-10 text-center text-sm text-slate-500">
        正在加载登录状态...
      </div>
    );
  }

  return (
    <>
      {communityJoinModal ? (
        <CommunityJoinModal
          onClose={() => setCommunityJoinModal(null)}
          onConfirm={() => void confirmCommunityJoin()}
          state={communityJoinModal}
        />
      ) : null}

      <BusinessRangeGuideExhibit
        onClose={() => setBusinessRangeGuideOpen(false)}
        open={businessRangeGuideOpen}
      />

      {draftSaveSuccessOpen ? <DraftSaveSuccessModal onClose={() => setDraftSaveSuccessOpen(false)} /> : null}

      <div className="mt-6 w-full rounded-[16px] bg-[#F5F7FA] py-6 md:py-8">
        {msg ? (
          <div className="mb-6 rounded-[16px] border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">{msg}</div>
        ) : null}

        {success ? (
          <div className="flex min-h-[420px] items-center justify-center px-4 py-10 sm:min-h-[560px]">
            <div className="flex flex-col items-center text-center">
              <img
                alt="提交成功"
                className="h-auto w-[180px] max-w-full object-contain sm:w-[220px]"
                src="/service-OPChandle-up.png"
              />
              <div
                className="mt-8 flex items-center justify-center text-[22px] font-bold tracking-[0.3em] text-[#2D3748] sm:mt-10 sm:text-[24px]"
                style={{
                  fontFamily: "PingFang SC, PingFang SC",
                  fontStyle: "normal",
                  textTransform: "none",
                }}
              >
                提交成功
              </div>
              <div
                className="mt-3 flex items-center justify-center text-[16px] font-medium tracking-[0.24em] text-[#6B7A99] sm:mt-4 sm:text-[20px]"
                style={{
                  fontFamily: "PingFang SC, PingFang SC",
                  fontStyle: "normal",
                  textTransform: "none",
                }}
              >
                等待项目初审
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4 text-[13px] leading-5 text-slate-500">
              <span className="text-red-500">*</span>号必填
            </div>
            <SectionTitle text="公司基本信息" />
            <div className="mb-6 rounded-[16px] border border-[#edf2fb] bg-white p-5">
              <div className="space-y-4">
                {inlineInput(
                  "companyName",
                  "公司名称（拟）",
                  isRequiredField("company_name"),
                  "text",
                  "md:w-[760px] !rounded-[5px] sm:!rounded-[5px]",
                  undefined,
                  "请输入备选名称（20字以内）",
                )}
                {inlineInput(
                  "companyNameAlternativeOne",
                  "公司备选名称",
                  isRequiredField("company_name_alternative_one"),
                  "text",
                  "md:ml-[22px] md:w-[760px] !rounded-[5px] sm:!rounded-[5px]",
                  undefined,
                  "请输入备选名称（20字以内）",
                )}
                {inlineInput(
                  "companyNameAlternativeTwo",
                  "公司备选名称",
                  isRequiredField("company_name_alternative_two"),
                  "text",
                  "md:ml-[22px] md:w-[760px] !rounded-[5px] sm:!rounded-[5px]",
                  undefined,
                  "请输入备选名称（20字以内）",
                )}
                <div className="text-[13px] leading-6 text-slate-500">
                  <div>以工商管理审批为准，格式如下：</div>
                  <div className="grid gap-x-8 gap-y-1 md:grid-cols-2">
                    <div>1、市级区划+区级区划+字号+行业特点+组织形式</div>
                    <div>2、字号+（厦门）+行业特点+组织形式</div>
                    <div>3、字号+行业特点+（厦门）+组织形式</div>
                    <div>4、市级区划+字号+行业特点+组织形式</div>
                  </div>
                </div>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-start">
                  {registeredCapitalInput()}
                  {currencySelect()}
                </div>
              </div>
            </div>

            <SectionTitle text="股东及股权比例" />
            <div className="mb-6">{shareholderTable()}</div>

            <SectionTitle text="管理机构信息" />
            <div className="mb-6">{officerTable()}</div>

            <SectionTitle text="经营范围（或者拟经营的主要业务）" />
            <div className="mb-6">
              <textarea
                className={`min-h-[130px] w-full rounded-[8px] border px-4 py-3 text-sm ${inputFocusClass}`}
                onChange={(e) => setField("businessScope", e.target.value)}
                placeholder="请输入"
                rows={5}
                value={form.businessScope}
              />
            </div>
            <div className="mb-6 text-sm leading-6 text-slate-500">
              经营范围：不确定如何描述？点击打开经营范围规范表述查询指引
              <span className="ml-1 inline-flex items-center gap-[50px]">
                <a
                  className="inline font-medium text-[#0052d9] underline"
                  href={businessRangeGuideUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  查询经营范围
                </a>
                <button
                  className="inline font-medium text-[#0052d9] underline"
                  onClick={openBusinessRangeGuide}
                  type="button"
                >
                  查看指引
                </button>
              </span>
            </div>

            <SectionTitle text="住所/经营场所" />
            <div className="mb-6 rounded-[16px] border border-[#edf2fb] bg-white p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-start">
                {premisesAreaInput()}
                {inlineInput("propertyOwner", "产权人", isRequiredField("property_owner"), "text", "md:w-[220px] !rounded-[5px] sm:!rounded-[5px]")}
                {inlineInput("propertyContactPhone", "联系手机", isRequiredField("property_contact_phone"), "tel", "md:w-[220px] !rounded-[5px] sm:!rounded-[5px]")}
              </div>
            </div>

            <SectionTitle text="必备资料上传" required />
            <div className="rounded-[16px] border border-[#edf2fb] bg-white p-5">
              <div className="mb-4 text-sm leading-6 text-slate-600">
                支持格式：png、jpg、jpeg、docx；图片大小不能超过10MB；文档大小不能超过20MB。
              </div>
              <div className="space-y-4">
                {currentMaterialSections.map((section) => {
                  const sectionRequired = section.categoryKeys.some((categoryKey) => materialCategoryConfigMap.get(categoryKey)?.required);
                  return (
                    <div className="py-2" key={section.id}>
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="text-[16px] font-semibold text-slate-900">
                            {sectionRequired ? <span className="mr-1 text-red-500">*</span> : null}
                            {section.title}
                            {sectionRequired ? "" : "（选传）"}
                          </div>
                        </div>
                        <div className="text-sm font-medium text-[#0091F9]">{isSectionUploading(section) ? "上传中..." : ""}</div>
                      </div>

                      <div className="mt-4 space-y-2">
                        {section.renderType === "shareholderDocuments" ? (
                          <div className="flex flex-col gap-5">
                            {section.slotGroups.map((group, index) => (
                              <div className="contents" key={group.id}>
                                <div className={group.className}>
                                  {group.title ? <div className="mb-3 text-[16px] font-semibold text-slate-900">{group.title}</div> : null}
                                  <div className={group.gridClassName}>{group.slots.map((slot) => materialUploadCard(slot))}</div>
                                </div>
                                {index < section.slotGroups.length - 1 ? (
                                  <div className="flex flex-col items-end gap-2">
                                    <div className="w-full border-t border-dashed border-[#D6DEEB]" />
                                    <button
                                      className="flex h-[28px] w-[70px] items-center justify-center rounded-[16px] border border-[#0091F9] bg-[#EAF5FF] text-[12px] font-normal leading-[22px] text-[#0091F9] disabled:cursor-not-allowed disabled:border-[#bfdbfe] disabled:bg-[#eff6ff] disabled:text-[#93c5fd]"
                                      disabled={shareholderIdentityPairCount >= maxShareholderIdentityPairCount}
                                      onClick={addShareholderIdentityPair}
                                      type="button"
                                    >
                                      添加
                                    </button>
                                  </div>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        ) : section.id === "premisesLease" ? (
                          premisesLeaseSectionContent(section)
                        ) : (
                          imageMaterialGrid(section)
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-start">
              <button
                className="flex h-[44px] w-full items-center justify-center rounded-[10px] border border-[#0052FF] bg-white px-4 text-[14px] font-medium text-[#0052FF] disabled:opacity-60 sm:h-[32px] sm:w-[85px] sm:rounded-[4px] sm:px-0"
                disabled={draftLoading || draftSaving || !!uploading}
                onClick={() => void saveDraft()}
                type="button"
              >
                {draftSaving ? "保存中..." : "保存草稿"}
              </button>
              <button
                className="flex h-[44px] w-full items-center justify-center rounded-[10px] bg-[#BEEC00] px-4 text-[14px] font-medium text-black disabled:opacity-60 sm:h-[32px] sm:w-[85px] sm:rounded-[4px] sm:px-0"
                disabled={submitting}
                onClick={() => void submit()}
                type="button"
              >
                {submitting ? "提交中..." : "提交申请"}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
