// Sample content for every block converted from Relume, one each, in the
// order the blocks were converted. The seed gives each one a Block library
// page of its own, on Light and on Dark (see block-library.mjs), so each one
// can be looked at.
// `pnpm relume:convert` adds a block above the marker; do not remove it.

/**
 * @param {{
 *   button: (key: string, text: string) => object,
 *   image: (name: "landscape" | "numbered-1" | "numbered-2" | "numbered-3" | "numbered-4" | "avatar" | "logo") => object,
 * }} helpers
 */
export function relumeSampleBlocks({ button, image }) {
  return [
    {
      _key: "relume-header103",
      _type: "relumeHeader103",
      theme: "light",
      tabs: [
        {
          _key: "relume-header103-tab-1",
          _type: "tab",
          label: "Plan",
          heading: "Header 103: Start with a plan you can read",
          description:
            "Before anything is built, you get a written plan with the dates, the costs and who does what.",
          buttons: [
            button("relume-header103-tab-1-buttons-1", "Get started"),
            button("relume-header103-tab-1-buttons-2", "Learn more"),
          ],
          image: image("numbered-1"),
        },
        {
          _key: "relume-header103-tab-2",
          _type: "tab",
          label: "Build",
          heading: "Built in short stages you can see",
          description:
            "The work moves in small steps, and you see each one as it finishes, so nothing comes as a surprise.",
          buttons: [
            button("relume-header103-tab-2-buttons-1", "See our work"),
            button("relume-header103-tab-2-buttons-2", "How we work"),
          ],
          image: image("numbered-2"),
        },
        {
          _key: "relume-header103-tab-3",
          _type: "tab",
          label: "Launch",
          heading: "Launched on the day we agreed",
          description:
            "We test everything with you first, then go live on the date in the plan.",
          buttons: [
            button("relume-header103-tab-3-buttons-1", "Book a call"),
            button("relume-header103-tab-3-buttons-2", "Read the FAQ"),
          ],
          image: image("numbered-3"),
        },
        {
          _key: "relume-header103-tab-4",
          _type: "tab",
          label: "Support",
          heading: "Looked after long after launch",
          description:
            "We stay on to fix what real use turns up and to answer the questions that come later.",
          buttons: [
            button("relume-header103-tab-4-buttons-1", "Contact us"),
            button("relume-header103-tab-4-buttons-2", "Our services"),
          ],
          image: image("numbered-4"),
        },
      ],
    },
    {
      _key: "relume-layout488",
      _type: "relumeLayout488",
      theme: "light",
      headingStart: "Made to",
      image: image("numbered-1"),
      headingEnd: "last",
      backgroundImage: image("landscape"),
    },
    {
      _key: "relume-layout348",
      _type: "relumeLayout348",
      theme: "light",
      features: [
        {
          _key: "relume-layout348-feature-1",
          _type: "feature",
          tagline: "Listen first",
          heading: "Layout 348: We start by listening",
          description:
            "We ask what the project is for and who it serves, and write the answers down before anything is drawn.",
          buttons: [
            button("relume-layout348-feature-1-buttons-1", "Get started"),
            button("relume-layout348-feature-1-buttons-2", "Learn more"),
          ],
          image: image("numbered-1"),
        },
        {
          _key: "relume-layout348-feature-2",
          _type: "feature",
          tagline: "Plan in writing",
          heading: "A plan you can read before we begin",
          description:
            "You get a written plan with dates and costs. Nothing starts until you have read it and agreed to it.",
          buttons: [
            button("relume-layout348-feature-2-buttons-1", "See a sample plan"),
            button("relume-layout348-feature-2-buttons-2", "How we price"),
          ],
          image: image("numbered-2"),
        },
        {
          _key: "relume-layout348-feature-3",
          _type: "feature",
          tagline: "Build in stages",
          heading: "Built in stages you can see",
          description:
            "The work is done in short stages, and you see each one as it finishes, so nothing comes as a surprise.",
          buttons: [
            button("relume-layout348-feature-3-buttons-1", "See our work"),
            button("relume-layout348-feature-3-buttons-2", "How we work"),
          ],
          image: image("numbered-3"),
        },
        {
          _key: "relume-layout348-feature-4",
          _type: "feature",
          tagline: "Stay around",
          heading: "Here after the handover",
          description:
            "We stay on to fix what real use turns up and to answer the questions that come later.",
          buttons: [
            button("relume-layout348-feature-4-buttons-1", "Contact us"),
            button("relume-layout348-feature-4-buttons-2", "Our services"),
          ],
          image: image("numbered-4"),
        },
      ],
    },
    {
      _key: "relume-testimonial18",
      _type: "relumeTestimonial18",
      theme: "light",
      heading: "Testimonial 18: What our clients say",
      description: "A few words from people we have worked with.",
      testimonials: [
        [
          5,
          '"Clear, calm and always on time. We would hire them again without a second thought."',
          "Emma Novak",
          "Director",
          "Fieldstone Studio",
        ],
        [
          5,
          '"They listened carefully, asked the right questions and came back with a plan that fitted our budget. The whole project ran without a single surprise, and the result still works well for us a year later."',
          "Liam Walsh",
          "Founder",
          "Harbour Coffee",
        ],
        [
          4,
          '"Good communication from start to finish. Every question got a straight answer, usually the same day, and the weekly updates kept the whole team in the picture."',
          "Priya Shah",
          "Operations Manager",
          "Brightway Clinic",
        ],
        [
          5,
          '"The new website brought us more enquiries in its first month than the old one did in a year. Friendly people who know their craft."',
          "Tom Becker",
          "Owner",
          "Becker Joinery",
        ],
        [
          5,
          '"Professional, patient and easy to work with."',
          "Grace Mensah",
          "Head of Marketing",
          "Lumen Books",
        ],
        [
          5,
          '"We came with a rough idea and left with something we are proud to show. Thank you for the care you put into every detail."',
          "Daniel Rossi",
          "Co-founder",
          "Rossi & Hart",
        ],
      ].map(([rating, quote, name, jobTitle, companyName], index) => ({
        _key: `relume-testimonial18-testimonial-${index + 1}`,
        _type: "testimonial",
        rating,
        quote,
        avatar: image("avatar"),
        name,
        jobTitle,
        companyName,
      })),
    },
    {
      _key: "relume-gallery24",
      _type: "relumeGallery24",
      theme: "light",
      heading: "Gallery 24: Image Gallery",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      images: [
        { _key: "relume-gallery24-images-1", ...image("numbered-1") },
        { _key: "relume-gallery24-images-2", ...image("numbered-2") },
        { _key: "relume-gallery24-images-3", ...image("numbered-3") },
      ],
    },
    {
      _key: "relume-event9",
      _type: "relumeEvent9",
      theme: "light",
      tagline: "What's on",
      heading: "Event 9: Upcoming events",
      description:
        "Talks, workshops and open days over the coming months. Everyone is welcome.",
      buttons: [button("relume-event9-buttons-1", "View all")],
      events: [
        [
          "2027-02-12",
          "Workshop",
          "Planning a garden for every season",
          "Riverside Hall, Bristol",
          "numbered-1",
        ],
        [
          "2027-02-20",
          "Talk",
          "Building with reclaimed materials",
          "The Old Library, Bath",
          "numbered-2",
        ],
        [
          "2027-03-06",
          "Open day",
          "Behind the scenes at the workshop",
          "Unit 4, Mill Lane, Bristol",
          "numbered-3",
        ],
      ].map(([date, category, title, location, photo], index) => {
        const { _key, ...link } = button(
          `relume-event9-event-${index + 1}-link`,
          "View event",
        );
        return {
          _key: `relume-event9-event-${index + 1}`,
          _type: "event",
          image: image(photo),
          date,
          category,
          title,
          location,
          description:
            "An afternoon of practical advice and questions answered, with tea and time to look around.",
          link,
        };
      }),
    },
    {
      _key: "relume-cta57",
      _type: "relumeCta57",
      theme: "light",
      headingLines: [
        "CTA 57: Have a project in mind?",
        "Let us talk it through",
      ],
      description:
        "Tell us a little about what you need. We reply within one working day with a few questions and a time for a first call.",
      buttons: [
        button("relume-cta57-buttons-1", "Get in touch"),
        button("relume-cta57-buttons-2", "See our work"),
      ],
    },
    {
      _key: "relume-layout422",
      _type: "relumeLayout422",
      theme: "light",
      tagline: "Two ways to work with us",
      heading: "Layout 422: Pick the path that fits",
      description: "Point at a panel to read more. On a phone both are open.",
      features: [
        {
          _key: "relume-layout422-feature-1",
          _type: "feature",
          image: image("numbered-1"),
          tagline: "For homeowners",
          heading: "A new room, planned and built for you",
          description:
            "From the first sketch to the last coat of paint, one team looks after the whole job and keeps you posted.",
          buttons: [
            button("relume-layout422-feature-1-buttons-1", "Plan a project"),
          ],
        },
        {
          _key: "relume-layout422-feature-2",
          _type: "feature",
          image: image("numbered-2"),
          tagline: "For businesses",
          heading: "Fit-outs that open on the day you planned",
          description:
            "We work around your opening hours and hand over a space that is ready for customers the morning after.",
          buttons: [
            button("relume-layout422-feature-2-buttons-1", "Talk to us"),
          ],
        },
      ],
    },
    {
      _key: "relume-layout351",
      _type: "relumeLayout351",
      theme: "light",
      tagline: "What we do",
      heading: "Layout 351: Four services, one team",
      description:
        "Open each service to see what it covers and how it fits with the others.",
      features: [
        [
          "Planning",
          "A clear plan before any work starts",
          "We listen, ask what the project is for and who it serves, and write down a plan with dates and costs that you can read and agree to.",
        ],
        [
          "Design",
          "Drawings you can comment on",
          "You see the design early and often, in drawings and samples, so changes are made on paper, where they cost the least.",
        ],
        [
          "Building",
          "Work done in short stages",
          "The work moves in stages you can follow, each one checked and shown to you before the next begins.",
        ],
        [
          "Aftercare",
          "We stay after the handover",
          "We come back to fix what real use turns up and to answer the questions that come later, for as long as you need us.",
        ],
      ].map(([label, heading, description], index) => ({
        _key: `relume-layout351-feature-${index + 1}`,
        _type: "feature",
        label,
        heading,
        description,
        image: image(`numbered-${index + 1}`),
      })),
    },
    {
      _key: "relume-layout487",
      _type: "relumeLayout487",
      theme: "light",
      tagline: "How we work",
      heading: "Layout 487: From first call to handover",
      description:
        "Four steps, each with a picture of the work, as you scroll down the page.",
      features: [
        [
          "Step one",
          "We listen before we draw",
          "A first meeting to understand what the project is for, who will use it and what has to stay as it is.",
        ],
        [
          "Step two",
          "A plan you can read",
          "A written plan with dates and costs. Nothing starts until you have read it and agreed to it.",
        ],
        [
          "Step three",
          "Built in stages",
          "The work is done in short stages, and you see each one as it finishes, so nothing comes as a surprise.",
        ],
        [
          "Step four",
          "Handed over with care",
          "We walk you through the finished work and stay on to fix what real use turns up.",
        ],
      ].map(([tagline, heading, description], index) => ({
        _key: `relume-layout487-feature-${index + 1}`,
        _type: "feature",
        tagline,
        heading,
        description,
        buttons: [
          button(
            `relume-layout487-feature-${index + 1}-buttons-1`,
            "Learn more",
          ),
          button(
            `relume-layout487-feature-${index + 1}-buttons-2`,
            "Contact us",
          ),
        ],
        image: image(`numbered-${index + 1}`),
      })),
    },
    {
      _key: "relume-faq6",
      _type: "relumeFaq6",
      theme: "light",
      heading: "FAQ 6: Questions and answers",
      description:
        "The things people usually ask before working with us. Anything else, just ask.",
      buttons: [button("relume-faq6-buttons-1", "Contact us")],
      questions: [
        [
          "Do you work with small businesses?",
          "Yes. Most of our clients are small teams, and we shape each project to the time and budget they have.",
        ],
        [
          "Where are you based?",
          "Our studio is in the city centre, and we work with clients all over the country by phone and video call.",
        ],
        [
          "How do we stay in touch during a project?",
          "You have one contact person from start to finish. We send a short update every week and answer messages within one working day.",
        ],
        [
          "Who owns the work when it is finished?",
          "You do. Once the final invoice is paid, everything we made for the project is yours to keep and use.",
        ],
        [
          "Can you help after the project is done?",
          "Yes. We offer support plans for updates and questions, and you can always book extra hours when you need them.",
        ],
      ].map(([title, answer], index) => ({
        _key: `relume-faq6-question-${index + 1}`,
        _type: "question",
        title,
        answer,
      })),
    },
    {
      _key: "relume-header83",
      _type: "relumeHeader83",
      theme: "light",
      heading: "Header 83: Work worth a closer look",
      description:
        "Scroll to step back from a single photo and take in the whole collection, one project at a time.",
      buttons: [
        button("relume-header83-buttons-1", "See our work"),
        button("relume-header83-buttons-2", "Get in touch"),
      ],
      images: [
        { _key: "relume-header83-images-1", ...image("numbered-1") },
        { _key: "relume-header83-images-2", ...image("numbered-2") },
        { _key: "relume-header83-images-3", ...image("numbered-3") },
        { _key: "relume-header83-images-4", ...image("numbered-4") },
        { _key: "relume-header83-images-5", ...image("numbered-1") },
        { _key: "relume-header83-images-6", ...image("numbered-2") },
        { _key: "relume-header83-images-7", ...image("numbered-3") },
        { _key: "relume-header83-images-8", ...image("numbered-4") },
        { _key: "relume-header83-images-9", ...image("numbered-1") },
      ],
    },
    // relume-seed:blocks
  ];
}
