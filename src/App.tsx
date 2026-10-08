import React, { useCallback, useEffect, useRef, useState } from "react";
import { Ribbon } from "./components/Ribbon";
import { Room } from "./components/Room";
import { HumanList } from "./components/HumanList";
import { Question } from "./components/Question";
import { HumanDashboard } from "./components/HumanDashboard";
import { Login } from "./components/Login";
import { Logout } from "./components/Logout";
import {
  NotificationCenter,
  type Notification,
  type NotificationKind,
} from "./components/NotificationCenter";
import { getCards, onMessage, sendMessage } from "./api";

export type Human = {
  nick: string;
  counter: number;
  room: string;
  isLeader: boolean;
  id: string;
  response?: string;
};

export const App: React.FC = () => {
  const [room, setRoom] = useState(localStorage.getItem("CAH:room") || false);
  const [nick, setNick] = useState(localStorage.getItem("CAH:nick") || "");
  const [myId, setMyId] = useState("");
  const [counter, setCounter] = useState(
    localStorage.getItem("CAH:counter") || 0
  );
  const [humans, setHumans] = useState<Human[]>([]);
  const [blackCard, setBlackCard] = useState("");
  const [whiteCards, setWhiteCards] = useState<any[]>([]);
  const [selectedCard, setSelectedCard] = useState<{
    id?: string;
    text?: string;
  }>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const nextNotificationId = useRef(0);

  const notify = useCallback((kind: NotificationKind, message: string) => {
    const notification = {
      id: nextNotificationId.current++,
      kind,
      message,
    };
    setNotifications((current) => [...current, notification].slice(-3));
  }, []);

  const dismissNotification = useCallback((id: number) => {
    setNotifications((current) =>
      current.filter((notification) => notification.id !== id)
    );
  }, []);

  const _updateHumans = (humans) => {
    setHumans((prevState) => {
      const newHumans = humans.reduce((acc, human) => {
        const humanFound = prevState.find((h) => h.id === human.id);
        return humanFound ? acc.concat([humanFound]) : acc.concat([human]);
      }, [] as Human[]);
      return newHumans;
    });
  };

  useEffect(() => {
    onMessage("you-won", ([human]) => {
      localStorage.setItem("CAH:counter", human.counter);
      setCounter(human.counter);

      const { kind, message } =
        myId === human.id
          ? { kind: "success" as const, message: "🎊 You win 🎉" }
          : { kind: "info" as const, message: `👎🏻 ${human.nick} won... 😒` };

      notify(kind, message);
    });
  }, [myId, notify]);

  useEffect(() => {
    onMessage("new-round", async ([blackCard, humans]) => {
      const res = await getCards(whiteCards.length);
      setBlackCard(blackCard);
      setHumans(humans);
      setSelectedCard({});
      setWhiteCards((prevState) => prevState.concat(res));
    });
  }, [whiteCards]);
  {
    onMessage("new-round", async ([blackCard, humans]) => {
      const res = await getCards(whiteCards.length);
      setBlackCard(blackCard);
      setHumans(humans);
      setSelectedCard({});
      setWhiteCards((prevState) => prevState.concat(res));
    });
  }
  useEffect(() => {
    if (room && nick) {
      sendMessage("enter-room", nick, room, counter);
    }
    onMessage("enter-room", (humans) => _updateHumans(humans));

    onMessage("leave-room", (humans) => _updateHumans(humans));

    onMessage("just-connected", ([nick, room, myId]) => {
      localStorage.setItem("CAH:nick", nick);
      localStorage.setItem("CAH:room", room);
      setNick(nick);
      setRoom(room);
      setMyId(myId);
    });

    onMessage("card-selected", ([_cardId, cardtext, _friendNick, humanId]) => {
      setHumans((prevState) => {
        const index = prevState.findIndex((h) => h.id === humanId);
        prevState[index].response = cardtext;
        return [...prevState];
      });
    });
  }, []);

  function onEnter(values) {
    sendMessage("enter-room", values.nick, values.room, counter);
  }

  function onLeave() {
    sendMessage("leave-room", nick, room);
    localStorage.removeItem("CAH:room");
    localStorage.removeItem("CAH:counter");
    setRoom(false);
    // REMOVE THIS SHIT destroying socket global variable and putting it inside the state
    window.location.reload();
  }

  function onSelected(card) {
    setWhiteCards((prevState) => prevState.filter((c) => c.id !== card.id));
    sendMessage("card-selected", card.id, card.text);
  }

  function onWinner(id) {
    sendMessage("round-win", id);
  }

  const isLoged = nick && room;
  const leader = humans.find((h) => h.isLeader);
  const imLeader = leader && leader.id === myId;
  const classNames = `d-flex flex-column ${
    isLoged ? "" : " justify-content-center"
  }`;

  return (
    <div className={classNames} style={{ minHeight: "100vh" }}>
      {isLoged && (
        <Room room={room} nick={nick}>
          <Logout onLeave={onLeave} />
        </Room>
      )}

      {imLeader && <Ribbon />}

      <div className="container">
        <div className="row">
          {!isLoged && (
            <div className="col-12">
              <Login nick={nick} onEnter={(e) => onEnter(e)} />
            </div>
          )}

          {isLoged && (
            <div className="col-12">
              <div className="d-flex flex-column py-3">
                {!imLeader && <HumanList myId={myId} humans={humans} />}

                <Question
                  disabled={!!(imLeader || selectedCard.id)}
                  blackCard={blackCard}
                  whiteCards={whiteCards}
                  onSelected={(card) => onSelected(card)}
                />

                {imLeader && (
                  <HumanDashboard
                    myId={myId}
                    humans={humans}
                    onWinner={(id) => onWinner(id)}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <NotificationCenter
        notifications={notifications}
        onDismiss={dismissNotification}
      />
    </div>
  );
};
