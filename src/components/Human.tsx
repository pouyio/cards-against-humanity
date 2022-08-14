import { Human as HumanType } from "../App";
import { FC } from "react";
import sanitizeHtml from "sanitize-html";
const BiggerEmoji: React.FC<{ emoji: string }> = ({ emoji }) => (
  <span style={{ transform: "scale(1.4)", display: "inline-block" }}>
    {emoji}
  </span>
);

const BeatingEmoji: React.FC<{ emoji: string }> = ({ emoji }) => (
  <span style={{ display: "inline-block" }} className="beat-forever">
    <BiggerEmoji emoji={emoji} />
  </span>
);

const EmojiTimer = (
  <span
    role="img"
    aria-label="timer"
    className="rotate-forever"
    style={{ display: "inline-block" }}
  >
    ⏳
  </span>
);

export const Human: FC<{
  human: HumanType;
  selectable: boolean;
  onWinner: (id: string) => void;
}> = ({ human, selectable, onWinner }) => {
  const responseClass = human.response ? "" : " text-center ";

  return (
    <li className={"list-group-item card " + responseClass}>
      {!human.response && EmojiTimer}
      {human.response && (
        <div
          className="card-body p-3"
          style={{ fontStyle: "italic", fontSize: "1.2em" }}
          dangerouslySetInnerHTML={{
            __html: sanitizeHtml(human.response || ""),
          }}
        />
      )}
      {human.response && (
        <div
          className={`btn btn-outline-dark d-block ${
            !selectable ? "disabled" : ""
          }`}
          onClick={(e) => onWinner(human.id)}
        >
          <BeatingEmoji emoji="🦄" /> Winner <BeatingEmoji emoji="‼️" />{" "}
        </div>
      )}
    </li>
  );
};
