import { Human as HumanComponent } from "./Human";
import type { Human } from "../App";

const Lightning = () => (
  <span role="img" aria-label="lightning">
    ⚡️
  </span>
);

export const HumanDashboard: React.FC<{
  onWinner: (id: string) => void;
  humans: Human[];
  myId: string;
}> = ({ onWinner, humans, myId }) => {
  function isSelectable(humans) {
    return !humans.some((h) => !h.response);
  }

  const theRest = humans.filter((h) => h.id !== myId);

  return (
    <ul className="list-group">
      {!!theRest.length &&
        theRest.map((h) => (
          <HumanComponent
            key={h.id}
            human={h}
            selectable={isSelectable(theRest)}
            onWinner={(id) => onWinner(id)}
          />
        ))}

      {!theRest.length && (
        <li className="list-group-item text-center h3">
          <i>
            <Lightning /> No players yet <Lightning />
          </i>
        </li>
      )}
    </ul>
  );
};
