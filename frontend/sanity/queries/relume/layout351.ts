// Hand-finished from relume/source/layout351.tsx; see the schema.
import { groq } from "next-sanity";
import { imageQuery } from "../shared/image";

// @sanity-typegen-ignore
export const relumeLayout351Query = groq`
  _type == "relumeLayout351" => {
    theme,
    tagline,
    heading,
    description,
    features[]{
      _key,
      label,
      heading,
      description,
      image {
        ${imageQuery}
      }
    }
  }
`;
