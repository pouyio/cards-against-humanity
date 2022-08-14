export const Logout: React.FC<{ onLeave: () => void }> = ({ onLeave }) => {
  return (
    <button className="btn btn-sm btn-outline-light py-1" onClick={onLeave}>
      Leave{" "}
      <span role="img" aria-label="plane">
        ✈️
      </span>
    </button>
  );
};
