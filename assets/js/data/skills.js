/**
 * The skill map is drawn as a three-layer network:
 *   languages (input) → tools (hidden) → domains (output).
 *
 * Edges are not typed by hand: they are derived from PROJECTS.
 * If a project uses a language and a tool, those two get an edge;
 * if it uses a tool and belongs to a category, the tool and that domain get one.
 * So the map can only show skills that a public project actually backs.
 */

export const LAYERS = [
  {
    id: "lang",
    label: "Languages",
    nodes: [
      { id: "python", label: "Python" },
      { id: "c", label: "C" },
      { id: "cpp", label: "C++" },
      { id: "sql", label: "SQL" },
      { id: "js", label: "JavaScript" },
    ],
  },
  {
    id: "tool",
    label: "Tools",
    nodes: [
      { id: "pytorch", label: "PyTorch" },
      { id: "sklearn", label: "scikit-learn" },
      { id: "numpy", label: "NumPy · pandas" },
      { id: "flask", label: "Flask · SQLAlchemy" },
      { id: "htmlcss", label: "HTML · CSS" },
      { id: "flexbison", label: "Flex · Bison" },
      { id: "linux", label: "Linux · xv6" },
      { id: "opengl", label: "OpenGL" },
      { id: "packettracer", label: "Packet Tracer" },
      { id: "arduino", label: "Arduino · circuits" },
      { id: "ci", label: "Git · CI · tests" },
    ],
  },
  {
    id: "domain",
    label: "What I build",
    nodes: [
      { id: "ai", label: "AI and ML" },
      { id: "systems", label: "Systems" },
      { id: "networks", label: "Networks" },
      { id: "web", label: "Web" },
      { id: "graphics", label: "Graphics" },
      { id: "hardware", label: "Robotics" },
      { id: "data", label: "Data" },
    ],
  },
];

/** Languages I speak, for the bio panel. */
export const SPOKEN = [
  { label: "Bengali", level: "Native" },
  { label: "English", level: "Professional" },
  { label: "Spanish", level: "A2" },
  { label: "Chinese", level: "A1" },
];
