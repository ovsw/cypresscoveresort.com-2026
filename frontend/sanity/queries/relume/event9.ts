// Hand-finished with studio/schemas/blocks/relume/event9.ts; listed under
// "Hand-finished blocks" in docs/agents/relume-import.md.
import { groq } from "next-sanity";
import { buttonQuery } from "../shared/button";
import { imageQuery } from "../shared/image";

// @sanity-typegen-ignore
export const relumeEvent9Query = groq`
  _type == "relumeEvent9" => {
    theme,
    tagline,
    heading,
    description,
    buttons[]{
      ${buttonQuery}
    },
    events[]{
      _key,
      image {
        ${imageQuery}
      },
      date,
      category,
      title,
      location,
      description,
      link {
        ${buttonQuery}
      }
    }
  }
`;
