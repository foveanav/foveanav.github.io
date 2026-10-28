// Add confirmed public metadata here. Empty fields remain hidden on the page.
window.FOVEANAV = {
  authors: [], // Example: { name: "Author Name", url: "https://...", affiliations: [1] }
  affiliations: [], // Example: "Department, University"
  links: { arxiv: "", code: "" },
  citation: "", // Add BibTeX after authors and public publication metadata are final.
  tasks: [
    { id: "redbag", title: "Red-Bag Following", short: "Red bag", setting: "OOD", condition: "red distractors", goal: "follow the red-bag target", description: "Follow the red bag despite red distractors.", n: 30, ours: 90, bc: 20, successes: { ours: 27, bc: 6 }, idResult: [10, 100, 100] },
    { id: "obstacle", title: "Obstacle Avoidance", short: "Obstacles", setting: "OOD", condition: "unseen obstacle categories and placements", goal: "complete the track without collision or leaving it", description: "Navigate unseen obstacles and changed placements.", n: 10, ours: 90, bc: 0, successes: { ours: 9, bc: 0 }, idResult: [10, 80, 80] },
    { id: "sign", title: "Sign-Guided Navigation", short: "Signs", setting: "OOD", condition: "changed sign configurations, floor colors and viewpoints", goal: "follow arrows and stop near the goal", description: "Follow arrow cues across changed signs and backgrounds.", n: 55, ours: 96, bc: 38, idResult: [10, 100, 100] },
    { id: "screen", title: "Screen-Cue Navigation", short: "Screen cues", setting: "ID", condition: "familiar box arrangement", description: "Match the screen instruction to the correct box.", n: 280, ours: 81.8, bc: 31.4 },
    { id: "forest", title: "Forest Following", short: "Forest", setting: "OOD", condition: "closer human distractor", goal: "follow the original person", description: "Follow the original person despite a closer distractor.", n: 10, ours: 100, bc: 0, successes: { ours: 10, bc: 0 }, idResult: [10, 100, 100] }
  ]
};
