// Hand-finished from relume/source/faq6.tsx (Relume FAQ 6): the converter
// cannot carry over its accordion, its plus icon or its single button. The
// accordion is the Starter's own (`@/components/ui/accordion`, a Client
// Component), so this renderer stays on the server, restyled to Relume's
// FAQ 6: each question in its own card, with a plus that turns into a cross
// when it opens. The button became the shared `buttons` array (at most one).
// Listed under "Hand-finished blocks" in docs/agents/relume-import.md; do not
// regenerate.
import {
  BlockButtons,
  type BlockButtonRole,
} from "@/components/blocks/relume/block-buttons";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { HOME_PAGE_QUERY_RESULT, PAGE_QUERY_RESULT } from "@/sanity.types";
import { Plus } from "lucide-react";
import { stegaClean } from "next-sanity";
import {
  resolveBlockTheme,
  blockSceneClassName,
  type BlockSceneProps,
} from "../block-boundaries";

type PageBlock =
  | NonNullable<NonNullable<HOME_PAGE_QUERY_RESULT>["blocks"]>[number]
  | NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number];

type RelumeFaq6Block = Extract<PageBlock, { _type: "relumeFaq6" }>;

type RelumeFaq6Props = RelumeFaq6Block & {
  dataAttribute?: (path: string) => string | undefined;
} & BlockSceneProps;

// The Relume original's one button is a "secondary" (outlined) button.
const buttonsRoles: BlockButtonRole[] = [{ variant: "outline" }];

// Relume's `<Card>`, drawn with the class map's card classes.
const cardClassName =
  "overflow-hidden rounded-card border border-border bg-card text-card-foreground";
const itemClassName = "border-none px-5 md:px-6";
// A bold question with a large plus in the text colour, which turns a
// quarter of the way round (into a cross) when the answer opens. The
// Starter's own chevron, the trigger's last icon, is hidden. The turn stops
// under reduced motion (the rule at the end of globals.css).
const triggerClassName =
  "items-center typo-body-editorial font-bold hover:no-underline md:py-5 [&>svg:last-child]:hidden [&[data-state=open]>svg]:rotate-45";
const iconClassName =
  "pointer-events-none size-7 shrink-0 text-card-foreground transition-transform motion-base md:size-8";
const contentClassName = "typo-body whitespace-pre-line pb-5 md:pb-6";

// The Page Builder excludes blocks without content from visible adjacency.
// Keep this rule aligned with the renderer's empty result below.
export function hasRelumeFaq6Content(block: Pick<RelumeFaq6Block, "heading">) {
  return Boolean(stegaClean(block.heading)?.trim());
}

export default function RelumeFaq6({
  _key,
  bottom = "outer",
  dataAttribute,
  heading,
  description,
  buttons,
  questions,
  theme,
  top = "outer",
}: RelumeFaq6Props) {
  if (!hasRelumeFaq6Content({ heading })) return null;

  const headingId = `relume-faq6-${stegaClean(_key)}-heading`;

  return (
    <section
      aria-labelledby={headingId}
      className={blockSceneClassName(resolveBlockTheme(theme), top, bottom)}
      data-sanity={dataAttribute?.("theme")}
    >
      <div className="container grid grid-cols-1 gap-y-12 md:grid-cols-2 md:gap-x-12 lg:grid-cols-[0.75fr_1fr] lg:gap-x-20">
        <div>
          <h2
            className="mb-5 typo-block-heading md:mb-6"
            data-sanity={dataAttribute?.("heading")}
            id={headingId}
          >
            {heading}
          </h2>
          {stegaClean(description)?.trim() ? (
            <p
              className="typo-body-editorial"
              data-sanity={dataAttribute?.("description")}
            >
              {description}
            </p>
          ) : null}
          <BlockButtons
            buttons={buttons}
            className="mt-6 md:mt-8"
            dataAttribute={dataAttribute}
            roles={buttonsRoles}
          />
        </div>
        {/* The accordion's question headers are <h3>, under the <h2>. */}
        <Accordion
          className="grid items-start justify-items-stretch gap-4"
          type="multiple"
        >
          {(questions ?? []).map((question) => (
            <div key={question._key} className={cardClassName}>
              <AccordionItem className={itemClassName} value={question._key}>
                <AccordionTrigger
                  className={triggerClassName}
                  data-sanity={dataAttribute?.(
                    `questions[_key=="${question._key}"].title`,
                  )}
                >
                  <span>{question.title}</span>
                  <Plus aria-hidden="true" className={iconClassName} />
                </AccordionTrigger>
                <AccordionContent
                  className={contentClassName}
                  data-sanity={dataAttribute?.(
                    `questions[_key=="${question._key}"].answer`,
                  )}
                >
                  {question.answer}
                </AccordionContent>
              </AccordionItem>
            </div>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
