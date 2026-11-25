// Hand-finished from relume/source/layout487.tsx; see the schema.
import { groq } from "next-sanity";
import { buttonQuery } from "../shared/button";
import { imageQuery } from "../shared/image";

// @sanity-typegen-ignore
export const relumeLayout487Query = groq`
  _type == "relumeLayout487" => {
    theme,
    tagline,
    heading,
    description,
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
