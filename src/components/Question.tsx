import sanitizeHtml from "sanitize-html";

const WhiteCard: React.FC<{
  onSelected: (card: any) => void;
  card: any;
}> = ({ card, onSelected }) => {
  return (
    <li
      className="btn btn-outline-dark pointer bold py-3"
      onClick={(e) => onSelected(card)}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(card.text) }}
      style={{ whiteSpace: "inherit" }}
    />
  );
};

export const Question: React.FC<{
  disabled: boolean;
  whiteCards: any[];
  blackCard: string;
  onSelected: (card: any) => void;
}> = ({ disabled, whiteCards, blackCard, onSelected }) => {
  const isDisabled = whiteCards.length < 10;
  const questionText = blackCard.replace(/\s*_\s*/, " ______ ");
  const classes = `list-group list-group-flush  ${
    disabled || isDisabled ? "disabled" : ""
  }`;
  return (
    <div>
      <div className="card bg-dark mb-3">
        <div className="card-body text-white">
          <h1
            className="h4"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(questionText) }}
          ></h1>
        </div>
      </div>
      {!disabled && (
        <ul className={classes}>
          {whiteCards.map((c, i) => (
            <WhiteCard key={`${c.id}-${i}`} card={c} onSelected={onSelected} />
          ))}
        </ul>
      )}
    </div>
  );
};
