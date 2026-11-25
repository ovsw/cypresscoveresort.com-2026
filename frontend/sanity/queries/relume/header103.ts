// Hand-finished from relume/source/header103.tsx (Relume Header 103). Listed
// under "Hand-finished blocks" in docs/agents/relume-import.md; do not
// regenerate.
import { groq } from "next-sanity";
import { buttonQuery } from "../shared/button";
import { imageQuery } from "../shared/image";

// @sanity-typegen-ignore
export const relumeHeader103Query = groq`
  _type == "relumeHeader103" => {
    theme,
    tabs[]{
      _key,
      label,
      heading,
      description,
      buttons[]{
        ${buttonQuery}
      },
      image {
        ${imageQuery}
      }
    }
  }
`;
