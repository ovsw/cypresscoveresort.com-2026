// Hand-finished with studio/schemas/blocks/relume/layout422.ts; listed under
// "Hand-finished blocks" in docs/agents/relume-import.md.
import { groq } from "next-sanity";
import { buttonQuery } from "../shared/button";
import { imageQuery } from "../shared/image";

// @sanity-typegen-ignore
export const relumeLayout422Query = groq`
  _type == "relumeLayout422" => {
    theme,
    tagline,
    heading,
    description,
    features[]{
      _key,
      image {
        ${imageQuery}
      },
      tagline,
      heading,
      description,
      buttons[]{
        ${buttonQuery}
      }
    }
  }
`;
