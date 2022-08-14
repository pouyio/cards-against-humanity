import React, { Component } from "react";
import Alert from "react-s-alert";
import Ribbon from "./components/Ribbon.js";
import Room from "./components/Room.js";
import HumanList from "./components/HumanList.js";
import Question from "./components/Question.js";
import HumanDashboard from "./components/HumanDashboard.js";
import Login from "./components/Login.js";
import Logout from "./components/Logout.js";
import { onMessage, sendMessage } from "./api";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      room: localStorage.getItem("CAH:room") || false,
      nick: localStorage.getItem("CAH:nick") || "",
      counter: localStorage.getItem("CAH:counter") || 0,
      humans: [],
      blackCard: "",
      whiteCards: [],
      selectedCard: {},
    };
    if (this.state.room && this.state.nick)
      sendMessage(
        "enter-room",
        this.state.nick,
        this.state.room,
        this.state.counter
      );

    onMessage("enter-room", (humans) => this._updateHumans(humans));

    onMessage("leave-room", (humans) => this._updateHumans(humans));

    onMessage("just-connected", ([nick, room, myId]) => {
      localStorage.setItem("CAH:nick", nick);
      localStorage.setItem("CAH:room", room);
      this.setState({ nick, room, myId });
    });

    onMessage("new-round", async ([blackCard, humans]) => {
      const res = await (
        await fetch(
          `http://localhost:3001/card/${10 - this.state.whiteCards.length}`,
          { headers: { "Access-Control-Allow-Origin": "*" } }
        )
      ).json();
      this.setState((prevState) => ({
        blackCard,
        humans,
        selectedCard: {},
        whiteCards: prevState.whiteCards.concat(res),
      }));
    });

    onMessage("card-selected", ([_cardId, cardtext, _friendNick, humanId]) => {
      this.setState((prevState) => {
        const index = prevState.humans.findIndex((h) => h.id === humanId);
        prevState.humans[index].response = cardtext;
        return prevState;
      });
    });

    onMessage("you-won", ([human]) => {
      localStorage.setItem("CAH:counter", human.counter);

      const { AlertType, msg } =
        this.state.myId === human.id
          ? { AlertType: Alert.success, msg: `🎊 You win 🎉` }
          : { AlertType: Alert.info, msg: `👎🏻 ${human.nick} won... 😒` };

      AlertType(<h1 className="h2"> {msg} </h1>);
    });
  }

  _updateHumans(humans) {
    this.setState((prevState) => {
      const newHumans = humans.reduce((acc, human) => {
        const humanFound = prevState.humans.find((h) => h.id === human.id);
        return humanFound ? acc.concat([humanFound]) : acc.concat([human]);
      }, []);
      return { humans: newHumans };
    });
  }

  onEnter(values) {
    sendMessage("enter-room", values.nick, values.room, this.state.counter);
  }

  onLeave(event) {
    sendMessage("leave-room", this.state.nick, this.state.room);
    localStorage.removeItem("CAH:room");
    localStorage.removeItem("CAH:counter");
    this.setState({ room: false });
    // REMOVE THIS SHIT destroying socket global variable and putting it inside the state
    window.location.reload();
  }

  onSelected(card) {
    this.setState((prevState) => ({
      whiteCards: prevState.whiteCards.filter((c) => c.id !== card.id),
    }));
    sendMessage("card-selected", card.id, card.text);
  }

  onWinner(id) {
    sendMessage("round-win", id);
  }

  render() {
    const isLoged = this.state.nick && this.state.room;
    const leader = this.state.humans.find((h) => h.isLeader);
    const imLeader = leader && leader.id === this.state.myId;
    const classNames = `d-flex flex-column ${
      isLoged ? "" : " justify-content-center"
    }`;

    return (
      <div className={classNames} style={{ minHeight: "100vh" }}>
        {isLoged && (
          <Room room={this.state.room} nick={this.state.nick}>
            <Logout onLeave={(e) => this.onLeave()} />
          </Room>
        )}

        {imLeader && <Ribbon />}

        <div className="container">
          <div className="row">
            {!isLoged && (
              <div className="col-12">
                <Login
                  nick={this.state.nick}
                  onEnter={(e) => this.onEnter(e)}
                />
              </div>
            )}

            {isLoged && (
              <div className="col-12">
                <div className="d-flex flex-column py-3">
                  {!imLeader && (
                    <HumanList
                      myId={this.state.myId}
                      humans={this.state.humans}
                    />
                  )}

                  <Question
                    disabled={imLeader || this.state.selectedCard.id}
                    blackCard={this.state.blackCard}
                    whiteCards={this.state.whiteCards}
                    onSelected={(card) => this.onSelected(card)}
                  />

                  {imLeader && (
                    <HumanDashboard
                      myId={this.state.myId}
                      humans={this.state.humans}
                      onWinner={(id) => this.onWinner(id)}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        <Alert
          stack={{
            limit: 3,
            position: "bottom",
            effect: "slide",
            beep: false,
            timeout: 3000,
            offset: 20,
          }}
        />
      </div>
    );
  }
}

export default App;
