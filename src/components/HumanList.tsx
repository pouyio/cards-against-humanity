import { Human } from "App";

const BiggerEmoji: React.FC<{ emoji: string }> = ({ emoji }) => (
  <span
    role="img"
    aria-label="emoji"
    style={{ transform: "scale(1.4)", display: "inline-block" }}
  >
    {emoji}
  </span>
);

export const HumanList: React.FC<{ myId: string; humans: Human[] }> = ({
  myId,
  humans,
}) => {
  const me = humans.find((h) => h.id === myId);
  const theRest = humans.filter((h) => h.id !== myId);

  return (
    <ul className="d-flex flex-wrap list-unstyled">
      {me && (
        <li
          style={{ flex: "1 1 auto", margin: "1px" }}
          className={
            "p-1 rounded align-items-baseline bold text-center " +
            (me.isLeader ? " bg-king " : " bg-white")
          }
        >
          <BiggerEmoji emoji="💩" /> Me:{" "}
          <span className="badge badge-dark badge-pill">{me.counter}</span>
        </li>
      )}

      {theRest.map((h) => (
        <li
          key={h.id}
          style={{ flex: "1 1 auto", margin: "1px" }}
          className={
            "p-1 rounded align-items-baseline text-center " +
            (h.isLeader ? " bg-king " : " bg-white")
          }
        >
          <div className="text-capitalize">
            {h.nick}:{" "}
            <span className="badge badge-dark badge-pill">{h.counter}</span>
          </div>
        </li>
      ))}
    </ul>
  );
};
