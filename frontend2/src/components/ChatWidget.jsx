import { useEffect, useRef, useState } from "react";
import Lottie from "lottie-react";
import chatbotAnimation from "../assets/Hello Chat Bot.json";
import { useFeatureFlags } from "../context/FeatureFlagsContext";

const FAQ_TREE = [
  {
    id: "resume",
    label: "Resume Review",
    answers: [
      "Upload a PDF on the Resume Review page and paste the job description for best ATS match.",
      "If the review fails, try again later or contact support from the Help page.",
    ],
    followUps: [
      { id: "resume-score", label: "How is the score calculated?" },
      { id: "resume-limit", label: "Why is my review limited?" },
    ],
  },
  {
    id: "resume-score",
    label: "How is the score calculated?",
    answers: [
      "We combine overall resume quality with ATS keyword match against the job description.",
      "Higher scores come from strong keywords, clear structure, and quantified impact.",
    ],
    followUps: [{ id: "resume", label: "Back to Resume Review" }],
  },
  {
    id: "resume-limit",
    label: "Why is my review limited?",
    answers: [
      "Free users get one review. Upgrade to Premium for unlimited reviews.",
    ],
    followUps: [
      { id: "pricing", label: "View Premium plans" },
      { id: "resume", label: "Back to Resume Review" },
    ],
  },
  {
    id: "jobs",
    label: "Job Tracker",
    answers: [
      "Use List or Kanban to track stages. Each job can have reminders and notes.",
      "You can export CSV/PDF from the dashboard for reporting.",
    ],
    followUps: [
      { id: "reminders", label: "Reminders + Snooze" },
      { id: "exports", label: "Exporting data" },
    ],
  },
  {
    id: "reminders",
    label: "Reminders + Snooze",
    answers: [
      "Set reminder dates per job. Snooze moves the reminder forward by the selected days.",
      "Use the calendar to see upcoming reminders in one view.",
    ],
    followUps: [{ id: "jobs", label: "Back to Job Tracker" }],
  },
  {
    id: "exports",
    label: "Exporting data",
    answers: [
      "Use Export CSV or Export PDF on the dashboard to download your job list.",
      "PDF exports include a formatted table for easy sharing.",
    ],
    followUps: [{ id: "jobs", label: "Back to Job Tracker" }],
  },
  {
    id: "pricing",
    label: "Pricing & Premium",
    answers: [
      "Free: 1 resume review and core tracking features.",
      "Premium: unlimited reviews, advanced insights, exports, and priority features.",
    ],
    followUps: [{ id: "resume", label: "Back to Resume Review" }],
  },
  {
    id: "account",
    label: "Account & Login",
    answers: [
      "Use Forgot Password to reset via email.",
      "You can update your profile and theme in Profile.",
    ],
    followUps: [{ id: "support", label: "Contact support" }],
  },
  {
    id: "support",
    label: "Contact support",
    answers: ["Email us at support@jobflow.app and we will help you."],
    followUps: [],
  },
];

const getNode = (id) => FAQ_TREE.find((n) => n.id === id);

export default function ChatWidget() {
  const { isEnabled } = useFeatureFlags();
  const resumeEnabled = isEnabled("resume_review");
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! Pick a topic and I will guide you.",
    },
  ]);
  const [activeNode, setActiveNode] = useState(resumeEnabled ? "resume" : "jobs");
  const endRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [open, messages, activeNode]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleOptionClick = (nodeId, label) => {
    const node = getNode(nodeId);
    if (!node) return;
    setMessages((prev) => [
      ...prev,
      { role: "user", content: label },
      ...node.answers.map((ans) => ({ role: "assistant", content: ans })),
    ]);
    setActiveNode(nodeId);
  };

  return (
    <div ref={containerRef} className="fixed -bottom-16 -right-3 z-50">
      {open && (
        <div className="absolute bottom-[12.5rem] right-0 flex h-[480px] w-[320px] flex-col rounded-2xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:w-[360px]">
          <div className="flex items-center justify-between border-b border-slate-200/70 px-4 py-3 dark:border-slate-700">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                JobFlow Help
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Quick answers and guidance
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:text-slate-400"
              aria-label="Close chat"
            >
              X
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-sm">
            {messages.map((msg, idx) => (
              <div
                key={`${msg.role}-${idx}`}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                    msg.role === "user"
                      ? "bg-primary-600 text-white"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <div className="border-t border-slate-200/70 px-3 py-3 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Quick topics
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {FAQ_TREE.filter((n) =>
                ["resume", "jobs", "pricing", "account", "support"].includes(n.id) &&
                (resumeEnabled || n.id !== "resume")
              ).map((node) => (
                <button
                  key={node.id}
                  onClick={() => handleOptionClick(node.id, node.label)}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:border-primary-400 hover:text-primary-600 dark:border-slate-700 dark:text-slate-300"
                >
                  {node.label}
                </button>
              ))}
            </div>

            {getNode(activeNode)?.followUps?.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Follow-ups
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {getNode(activeNode).followUps
                    .filter((item) => resumeEnabled || item.id !== "resume")
                    .map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleOptionClick(item.id, item.label)}
                      className="rounded-full bg-primary-50 px-3 py-1 text-xs text-primary-700 hover:bg-primary-100 dark:bg-slate-800 dark:text-primary-300"
                    >
                      {item.label}
                    </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center justify-center bg-transparent p-0 transition-transform ${
          open ? "-translate-y-2 -translate-x-56" : "translate-y-0 translate-x-0"
        }`}
        aria-label="Open chat"
      >
        <div className="h-[15rem] w-[15rem]">
          <Lottie animationData={chatbotAnimation} loop autoplay />
        </div>
      </button>
    </div>
  );
}


