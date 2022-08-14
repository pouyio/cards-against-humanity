import React, { useState } from "react";

export const Login: React.FC<{
  nick: string;
  onEnter: (data: { nick: string; room: string }) => void;
}> = ({ nick: nickProp, onEnter: onEnterProps }) => {
  const [nick, setNick] = useState(nickProp);
  const [room, setRoom] = useState("1");

  const onEnter = () => {
    if (!nick) return;
    onEnterProps({ nick, room });
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") onEnter();
  };

  return (
    <div className="d-inline-flex w-100">
      <div style={{ flexBasis: "70%" }}>
        <input
          className="form-control"
          placeholder="Nick"
          value={nick}
          onChange={(e) => setNick(e.target.value)}
          onKeyPress={(e) => handleKeyPress(e)}
        />
        <select
          className="form-control"
          value={`${room}`}
          onChange={(e) => setRoom(e.target.value)}
        >
          {Array.from(Array(20).keys()).map((v) => (
            <option key={v} value={v}>
              Room: {v}
            </option>
          ))}
        </select>
      </div>
      <button
        style={{ flexBasis: "30%" }}
        className="btn bg-dark text-white"
        onClick={onEnter}
      >
        Enter
      </button>
    </div>
  );
};
