// Hand-finished from relume/source/layout488.tsx; see the schema.
import { groq } from "next-sanity";
import { imageQuery } from "../shared/image";

// @sanity-typegen-ignore
export const relumeLayout488Query = groq`
  _type == "relumeLayout488" => {
    theme,
    headingStart,
    image {
      ${imageQuery}
    },
    headingEnd,
    backgroundImage {
      ${imageQuery}
    }
  }
`;
