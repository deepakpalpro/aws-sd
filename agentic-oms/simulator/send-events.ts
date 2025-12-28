import axios from "axios";
import { v4 as uuid } from "uuid";

const API = "https://your-api.execute-api";

async function send() {
  const event = {
    orderId: uuid(),
    eventType: "PAYMENT_FAILED",
    timestamp: new Date().toISOString(),
    source: "checkout",
    payload: { reason: "INSUFFICIENT_FUNDS" },
    correlationId: uuid()
  };

  await axios.post(API, event);
}

send();
