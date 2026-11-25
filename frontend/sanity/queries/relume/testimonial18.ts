// Hand-finished from relume/source/testimonial18.tsx (Relume Testimonial 18).
// Listed under "Hand-finished blocks" in docs/agents/relume-import.md.
import { groq } from "next-sanity";
import { imageQuery } from "../shared/image";

// @sanity-typegen-ignore
export const relumeTestimonial18Query = groq`
  _type == "relumeTestimonial18" => {
    theme,
    heading,
    description,
    testimonials[]{
      _key,
      rating,
      quote,
      avatar {
        ${imageQuery}
      },
      name,
      jobTitle,
      companyName
    }
  }
`;
