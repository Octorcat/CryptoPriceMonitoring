import {useEffect} from "react";
import config from '../config.js'

const SERVER_URL = process.env.REACT_APP_SERVER_URL || config.SERVER_URL;

function Unsubsribe(props) {
    useEffect(() => {
        fetch(SERVER_URL + "/alerts/unsubscribe", {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ alertId: props.match.params.alertId})
        })
    })

    return (
        <>
            <div style={{position: "fixed", width: "100%", height: "100%", backgroundColor: "green", textAlign: "center", color: "white"}}>
                <h3>Alert Stopped</h3>
            </div>
        </>
    );
}

export default Unsubsribe;
