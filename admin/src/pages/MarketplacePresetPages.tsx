import { PageSectionsPage } from "./HomeSectionsPage";
import { ResourceCategoriesPage } from "./ResourceCategoriesPage";
import { ResourceItemsPage } from "./ResourceItemsPage";

const marketplaceSectionUsageMap = {
  hero: "资源市集页面头部",
  marketplace_group_data: "数据资源分组标题和查看更多",
  marketplace_group_tools: "工具包分组标题和查看更多",
  marketplace_group_compute: "普惠算力分组标题和查看更多",
};

export function MarketplaceContentPage() {
  return (
    <PageSectionsPage
      descriptionOverride="维护资源市集页面头部，以及资源市集页面内数据资源、工具包、普惠算力分组标题和查看更多链接。"
      pageKeyOverride="marketplace"
      sectionUsageMap={marketplaceSectionUsageMap}
      titleOverride="资源市集页"
    />
  );
}

export function MarketplaceDataPage() {
  return (
    <ResourceCategoriesPage
      descriptionOverride="维护资源市集和首页 AI资源市集中的“数据资源”卡片。首页规则：优先取 code=marketplace_city_dataspace，其次取 display_template=featured_data 作为首卡；其余 data 分组分类作为普通卡。"
      groupKeyPreset="data"
      lockGroupKey
      lockResourceType
      resourceTypePreset="marketplace"
      titleOverride="数据资源"
    />
  );
}

export function MarketplaceToolsPage() {
  return (
    <ResourceCategoriesPage
      descriptionOverride="维护资源市集和首页 AI资源市集中的“工具包”入口，包括模型广场、API、MCP、产品工具等。首页会展示 group_key=tools 且 show_on_home=1 的分类。"
      groupKeyPreset="tools"
      lockGroupKey
      lockResourceType
      resourceTypePreset="marketplace"
      titleOverride="工具包"
    />
  );
}

export function MarketplaceModelsPage() {
  return (
    <div className="admin-page">
      <ResourceCategoriesPage
        categoryCodePreset="marketplace_model_plaza"
        descriptionOverride="维护“模型广场”三级页面的标题、简介和基础配置。前台入口来自“产品工具”，模型列表在下方维护。"
        lockResourceType
        resourceTypePreset="marketplace"
        titleOverride="模型广场页面配置"
      />
      <ResourceItemsPage
        categoryCodePreset="marketplace_model_plaza"
        descriptionOverride="维护模型广场下的模型列表。字段映射：图片地址=模型头像，图标名/扩展 JSON.logo_text=无头像时的兜底，标签 JSON=底部标签，跳转类型/跳转值=点击卡片后的去向。"
        lockCategory
        lockResourceType
        resourceTypePreset="marketplace"
        titleOverride="模型广场模型条目"
      />
    </div>
  );
}

export function MarketplaceComputePage() {
  return (
    <div className="admin-page">
      <ResourceCategoriesPage
        descriptionOverride="维护普惠算力主卡。首页主卡取 compute 分组下排序最靠前的分类，名称、简介、图片、跳转和按钮文案都来自这里。"
        groupKeyPreset="compute"
        lockGroupKey
        lockResourceType
        resourceTypePreset="marketplace"
        titleOverride="普惠算力主卡"
      />
      <ResourceItemsPage
        descriptionOverride="维护普惠算力资源条目。首页右侧算力卡片读取 compute 分组下 show_on_home=1 且已发布的资源条目。"
        groupKeyPreset="compute"
        lockResourceType
        resourceTypePreset="marketplace"
        titleOverride="普惠算力资源条目"
      />
    </div>
  );
}

export function MarketplaceApiPage() {
  return (
    <div className="admin-page">
      <PageSectionsPage
        allowedSectionKeys={["hero"]}
        descriptionOverride="维护 API 市场页面头部标题和说明。API 分类和卡片内容在下方维护。"
        pageKeyOverride="api_market"
        sectionUsageMap={{ hero: "API 市场页面头部" }}
        titleOverride="API市场页头"
      />
      <ResourceCategoriesPage
        descriptionOverride="维护 API 市场分类，例如全部、电子商务、生活服务、数据智能等。"
        lockResourceType
        resourceTypePreset="api_market"
        titleOverride="API市场分类"
      />
      <ResourceItemsPage
        descriptionOverride="维护 API 服务市场卡片条目。字段映射：图标=卡片左侧圆形图标，标题/简介=卡片内容，标签 JSON=底部标签；免费/付费二选一，其他常用标签为企业专用、个人高级认证、支持MCP。"
        lockResourceType
        resourceTypePreset="api_market"
        titleOverride="API市场条目"
      />
    </div>
  );
}

export function MarketplaceMcpPage() {
  return (
    <div className="admin-page">
      <PageSectionsPage
        allowedSectionKeys={["hero"]}
        descriptionOverride="维护 MCP 市场页面头部标题和说明。MCP 分类和卡片内容在下方维护。"
        pageKeyOverride="mcp_market"
        sectionUsageMap={{ hero: "MCP 市场页面头部" }}
        titleOverride="MCP市场页头"
      />
      <ResourceCategoriesPage
        descriptionOverride="维护 MCP 市场分类。"
        lockResourceType
        resourceTypePreset="mcp_market"
        titleOverride="MCP市场分类"
      />
      <ResourceItemsPage
        descriptionOverride="维护 MCP 标准连接服务卡片。字段映射：图标=卡片左上图标，标题=服务名，状态文案=是否开通，标签 JSON=能力列表，主按钮文案/跳转=底部“请先创建MCP服务”预留操作；也可在扩展 JSON 中配置 tools/items/status/button_text。"
        lockResourceType
        resourceTypePreset="mcp_market"
        titleOverride="MCP市场条目"
      />
    </div>
  );
}
