import { richTextBlockQuery } from "./rich-text-block";
import { scaffoldQuery } from "./scaffold";
import { relumeHeader103Query } from "./relume/header103";
import { relumeLayout488Query } from "./relume/layout488";
import { relumeLayout348Query } from "./relume/layout348";
import { relumeTestimonial18Query } from "./relume/testimonial18";
import { relumeGallery24Query } from "./relume/gallery24";
import { relumeEvent9Query } from "./relume/event9";
import { relumeCta57Query } from "./relume/cta57";
import { relumeLayout422Query } from "./relume/layout422";
import { relumeLayout351Query } from "./relume/layout351";
import { relumeLayout487Query } from "./relume/layout487";
import { relumeFaq6Query } from "./relume/faq6";
import { relumeHeader83Query } from "./relume/header83";
// page-builder-generator:query-imports

export const pageBuilderQuery = `
  blocks[]{
    _key,
    _type,
    ${richTextBlockQuery},
    ${scaffoldQuery},
    ${relumeHeader103Query},
    ${relumeLayout488Query},
    ${relumeLayout348Query},
    ${relumeTestimonial18Query},
    ${relumeGallery24Query},
    ${relumeEvent9Query},
    ${relumeCta57Query},
    ${relumeLayout422Query},
    ${relumeLayout351Query},
    ${relumeLayout487Query},
    ${relumeFaq6Query},
    ${relumeHeader83Query},
    ${"" /* page-builder-generator:query-spreads */}
  }
`;
