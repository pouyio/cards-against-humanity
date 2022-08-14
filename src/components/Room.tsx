import { PropsWithChildren } from "react";

export const Room: React.FC<PropsWithChildren<{ nick: string; room: any }>> = ({
  nick,
  room,
  children,
}) => {
  return (
    <nav
      className="navbar bg-dark navbar-dark justify-content-start"
      style={{ backgroundRepeat: "repeat", fontWeight: "300" }}
    >
      <div className="mr-auto">
        <span className="navbar-text mx-2 py-1">{nick}</span>
        <span className="navbar-text mx-2 py-1">Room: {room}</span>
      </div>
      {children}
    </nav>
  );
};
