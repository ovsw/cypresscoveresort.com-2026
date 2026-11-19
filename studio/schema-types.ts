// documents
import page from "./schemas/documents/page";
import post from "./schemas/documents/post";
import category from "./schemas/documents/category";
import faq from "./schemas/documents/faq";
import testimonial from "./schemas/documents/testimonial";
import navigation, {
  navigationSchemaTypes,
} from "./schemas/documents/navigation";
import settings, { settingsSchemaTypes } from "./schemas/documents/settings";
import blogIndex from "./schemas/documents/blog-index";
import blogPostSettings from "./schemas/documents/blog-post-settings";
import homePage from "./schemas/documents/home-page";
import footer, { footerSchemaTypes } from "./schemas/documents/footer";
import redirect from "./schemas/documents/redirect";
import event, { eventSchemaTypes } from "./schemas/documents/event";
import weeklySchedule, {
  weeklyScheduleSchemaTypes,
} from "./schemas/documents/weekly-schedule";
import specialsWeek, {
  specialsWeekSchemaTypes,
} from "./schemas/documents/specials-week";
import venue, { venueSchemaTypes } from "./schemas/documents/venue";
import todayStatus from "./schemas/documents/today-status";
import accommodation from "./schemas/documents/accommodation";
import rateTable from "./schemas/documents/rate-table";
import offer from "./schemas/documents/offer";
import mapLocation from "./schemas/documents/map-location";
import resortMap from "./schemas/documents/resort-map";
import propertyListing from "./schemas/documents/property-listing";
import newsletterIssue from "./schemas/documents/newsletter-issue";
import product, { productSchemaTypes } from "./schemas/documents/product";
import productCategory from "./schemas/documents/product-category";
import storeIndex from "./schemas/documents/store-index";

// Objects shared by documents
import { openingHours, openingHoursRow } from "./schemas/objects/opening-hours";
import rateRow from "./schemas/objects/rate-row";

// Schema UI shared objects
import blockContent from "./schemas/blocks/shared/block-content";
import link from "./schemas/blocks/shared/link";
import { colorVariant } from "./schemas/blocks/shared/color-variant";
import sectionPadding from "./schemas/blocks/shared/section-padding";
import customUrl from "./schemas/blocks/shared/custom-url";
import customLink from "./schemas/blocks/shared/custom-link";
import button from "./schemas/blocks/shared/button";
import buttonLink from "./schemas/blocks/shared/button-link";
import richTextContent from "./schemas/blocks/shared/rich-text-content";
import simpleRichText from "./schemas/blocks/shared/simple-rich-text";
import {
  blogPostSidebar,
  blogPostSidebarAction,
} from "./schemas/blocks/shared/blog-post-sidebar";
// Schema UI objects
import richTextBlock from "./schemas/blocks/rich-text-block";
import scaffold from "./schemas/blocks/scaffold";
// page-builder-generator:block-imports

export const schemaTypes = [
  // documents
  page,
  post,
  category,
  faq,
  testimonial,
  navigation,
  ...navigationSchemaTypes,
  settings,
  ...settingsSchemaTypes,
  blogIndex,
  blogPostSettings,
  homePage,
  footer,
  redirect,
  ...footerSchemaTypes,
  event,
  ...eventSchemaTypes,
  weeklySchedule,
  ...weeklyScheduleSchemaTypes,
  specialsWeek,
  ...specialsWeekSchemaTypes,
  venue,
  ...venueSchemaTypes,
  todayStatus,
  accommodation,
  rateTable,
  offer,
  mapLocation,
  resortMap,
  propertyListing,
  newsletterIssue,
  product,
  ...productSchemaTypes,
  productCategory,
  storeIndex,
  // objects shared by documents
  openingHoursRow,
  openingHours,
  rateRow,
  // shared objects
  blockContent,
  link,
  colorVariant,
  sectionPadding,
  customUrl,
  customLink,
  button,
  buttonLink,
  richTextContent,
  simpleRichText,
  blogPostSidebarAction,
  blogPostSidebar,
  // blocks
  richTextBlock,
  scaffold,
  // page-builder-generator:block-types
];
