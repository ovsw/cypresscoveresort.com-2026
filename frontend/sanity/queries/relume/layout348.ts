// Hand-finished from relume/source/layout348.tsx (Relume Layout 348). Listed
// under "Hand-finished blocks" in docs/agents/relume-import.md; do not
// regenerate.
import { groq } from "next-sanity";
import { buttonQuery } from "../shared/button";
import { imageQuery } from "../shared/image";

// @sanity-typegen-ignore
export const relumeLayout348Query = groq`
  _type == "relumeLayout348" => {
    theme,
    features[]{
      _key,
      tagline,
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
