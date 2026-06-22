import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage } from "./types";
import styles from "./Message.module.css";

export function Message({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className={`${styles.row} ${styles.user}`}>
        <div className={styles.userBubble}>{message.text}</div>
      </div>
    );
  }

  const hasText = message.parts.some((p) => p.text.trim().length > 0);

  return (
    <div className={`${styles.row} ${styles.assistant}`}>
      <div className={styles.avatar} aria-hidden>
        ☀
      </div>
      <div className={styles.assistantBody}>
        {hasText ? (
          message.parts.map((part, i) =>
            part.text.trim().length > 0 ? (
              <div key={i} className={styles.markdown}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {part.text}
                </ReactMarkdown>
              </div>
            ) : null,
          )
        ) : (
          <span className={styles.thinking} aria-label="Asystent pracuje">
            <span />
            <span />
            <span />
          </span>
        )}
      </div>
    </div>
  );
}
