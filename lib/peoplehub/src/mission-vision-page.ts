/** A regular CMS page: administrators can edit, reorder and add sections. */
export const missionVisionPage = {
  slug: "mission-vision-values",
  title: "Mission, Vision & Values",
  content: {
    intro: "PEOPLE, PROCESS & PERFORMANCE.",
    sections: [
      {
        id: "zefohr-mission", type: "text", enabled: true,
        content: {
          eyebrow: "OUR PURPOSE", title: "ZefoHR Mission Statement",
          body: "“Our mission is to empower every HR team to deliver fast, seamless, transparent, compliant and personalised services, to their employees”",
        },
      },
      {
        id: "zefohr-vision", type: "text", enabled: true,
        content: {
          eyebrow: "OUR DIRECTION", title: "ZefoHR Vision Statement",
          body: "“To help individuals in making their employment experience delightful by enhancing our process & systems”",
        },
      },
      {
        id: "zefohr-values", type: "cards", enabled: true,
        content: {
          eyebrow: "WHAT GUIDES US", title: "ZefoHR Core Values",
          items: [
            { title: "Customer Value Creation is Priority", icon: "Heart" },
            { title: "Develop of Easy-to-use platforms", icon: "LayoutDashboard" },
            { title: "Trustworthy Computation & Data Management", icon: "ShieldCheck" },
            { title: "Proactive on-line & off-line Customer Support", icon: "Headphones" },
            { title: "Continuous Innovation in Products development", icon: "Lightbulb" },
            { title: "Follow a Culture of Supportive & Congenial Work Environment", icon: "Users" },
            { title: "Contribute to Carbon Footprint Reduction in processes", icon: "Leaf" },
            { title: "Practice Diversity & Inclusion in Management", icon: "Globe" },
          ],
        },
      },
    ],
  },
};
