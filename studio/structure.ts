import {
  BadgePercent,
  BedDouble,
  BookMarked,
  CalendarClock,
  CalendarDays,
  Files,
  FileText,
  House,
  KeyRound,
  ListCollapse,
  Mail,
  Map,
  MapPin,
  Menu,
  Newspaper,
  PanelBottom,
  PanelRight,
  Quote,
  Settings,
  Settings2,
  ShoppingBag,
  Soup,
  Store,
  Sun,
  Table,
  Tag,
  Tags,
  TrendingUpDown,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import type { SortOrderingItem } from "sanity";
import type { StructureBuilder, StructureResolver } from "sanity/structure";

/** A record there is exactly one of: it opens straight into its form. */
const single = (
  S: StructureBuilder,
  title: string,
  icon: LucideIcon,
  type: string,
) =>
  S.listItem()
    .title(title)
    .icon(icon)
    .child(S.editor().id(type).schemaType(type).documentId(type));

/** A collection: a list of every record of one type. */
const collection = (
  S: StructureBuilder,
  title: string,
  icon: LucideIcon,
  type: string,
  ordering: SortOrderingItem[],
) =>
  S.listItem()
    .title(title)
    .icon(icon)
    .schemaType(type)
    .child(S.documentTypeList(type).title(title).defaultOrdering(ordering));

/** A folder that groups the records an editor needs for one job. */
const group = (
  S: StructureBuilder,
  title: string,
  icon: LucideIcon,
  items: ReturnType<StructureBuilder["listItem"] | StructureBuilder["divider"]>[],
) =>
  S.listItem().title(title).icon(icon).child(S.list().title(title).items(items));

const asc = (field: string): SortOrderingItem[] => [
  { field, direction: "asc" },
];
const desc = (field: string): SortOrderingItem[] => [
  { field, direction: "desc" },
];

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      single(S, "Home Page", House, "homePage"),
      collection(S, "Pages", Files, "page", asc("title")),
      S.divider(),
      group(S, "Events", CalendarDays, [
        collection(S, "Events", CalendarDays, "event", desc("startDate")),
        single(S, "Weekly schedule", CalendarClock, "weeklySchedule"),
      ]),
      group(S, "Dining", UtensilsCrossed, [
        collection(S, "Specials by week", Soup, "specialsWeek", desc("weekOf")),
        collection(S, "Venues", UtensilsCrossed, "venue", asc("name")),
      ]),
      single(S, "Today's conditions", Sun, "todayStatus"),
      group(S, "Stay and rates", BedDouble, [
        collection(S, "Accommodations", BedDouble, "accommodation", [
          ...asc("sortOrder"),
          ...asc("name"),
        ]),
        collection(S, "Rate tables", Table, "rateTable", asc("title")),
        collection(S, "Offers", BadgePercent, "offer", asc("title")),
      ]),
      group(S, "Store", Store, [
        single(S, "Store page", Store, "storeIndex"),
        S.divider(),
        collection(S, "Products", ShoppingBag, "product", asc("name")),
        collection(S, "Product categories", Tags, "productCategory", [
          ...asc("sortOrder"),
          ...asc("title"),
        ]),
      ]),
      group(S, "Map", Map, [
        single(S, "Resort map", Map, "resortMap"),
        S.divider(),
        collection(S, "Map locations", MapPin, "mapLocation", asc("name")),
      ]),
      group(S, "Live Here", KeyRound, [
        collection(
          S,
          "Property listings",
          KeyRound,
          "propertyListing",
          desc("_createdAt"),
        ),
      ]),
      group(S, "News", Newspaper, [
        single(S, "News page", BookMarked, "blogIndex"),
        single(S, "News post settings", PanelRight, "blogPostSettings"),
        S.divider(),
        collection(S, "News posts", FileText, "post", desc("_createdAt")),
        collection(S, "News categories", Tag, "category", asc("title")),
        collection(S, "Newsletter issues", Mail, "newsletterIssue", desc("date")),
      ]),
      S.divider(),
      collection(S, "FAQs", ListCollapse, "faq", asc("title")),
      collection(S, "Testimonials", Quote, "testimonial", asc("name")),
      collection(
        S,
        "Redirects",
        TrendingUpDown,
        "redirect",
        asc("source.current"),
      ),
      S.divider(),
      group(S, "Site Configuration", Settings2, [
        single(S, "Navigation", Menu, "navigation"),
        single(S, "Footer", PanelBottom, "footer"),
        single(S, "Global Settings", Settings, "settings"),
      ]),
    ]);
