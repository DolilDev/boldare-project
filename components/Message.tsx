import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage } from "./types";
import { ToolCallCard } from "./ToolCallCard";
import styles from "./Message.module.css";

export function Message({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className={`${styles.row} ${styles.user}`}>
        <div className={styles.userBubble}>{message.text}</div>
      </div>
    );
  }

  return (
    <div className={`${styles.row} ${styles.assistant}`}>
      <div className={styles.avatar} aria-hidden>
        ☀
      </div>
      <div className={styles.assistantBody}>
        {message.parts.length === 0 ? (
          <span className={styles.thinking} aria-label="Asystent pisze">
            <span />
            <span />
            <span />
          </span>
        ) : (
          message.parts.map((part, i) =>
            part.kind === "text" ? (
              part.text.trim().length > 0 ? (
                <div key={i} className={styles.markdown}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {part.text}
                  </ReactMarkdown>
                </div>
              ) : null
            ) : (
              <ToolCallCard key={i} part={part} />
            ),
          )
        )}
      </div>
    </div>
  );
}
