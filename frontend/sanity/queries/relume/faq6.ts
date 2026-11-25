// Hand-finished from relume/source/faq6.tsx (Relume FAQ 6). Listed under
// "Hand-finished blocks" in docs/agents/relume-import.md; do not regenerate.
import { groq } from "next-sanity";
import { buttonQuery } from "../shared/button";

// @sanity-typegen-ignore
export const relumeFaq6Query = groq`
  _type == "relumeFaq6" => {
    theme,
    heading,
    description,
    buttons[]{
      ${buttonQuery}
    },
    questions[]{
      _key,
      title,
      answer
    }
  }
`;
