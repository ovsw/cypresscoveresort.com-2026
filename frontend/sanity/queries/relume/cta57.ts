// Hand-finished from relume/source/cta57.tsx (Relume CTA 57). Listed under
// "Hand-finished blocks" in docs/agents/relume-import.md; do not regenerate.
import { groq } from "next-sanity";
import { buttonQuery } from "../shared/button";

// @sanity-typegen-ignore
export const relumeCta57Query = groq`
  _type == "relumeCta57" => {
    theme,
    headingLines,
    description,
    buttons[]{
      ${buttonQuery}
    }
  }
`;
