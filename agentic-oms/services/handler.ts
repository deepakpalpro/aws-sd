import { OrderEvent } from "./schema";
import { putMetric } from "./metrics";
import { DynamoDB } from "aws-sdk";

const db = new DynamoDB.DocumentClient();
const TABLE = process.env.TABLE_NAME!;

export async function main(event: any) {
  const body: OrderEvent = JSON.parse(event.body);

  await db.put({
    TableName: TABLE,
    Item: body
  }).promise();

  // Emit metrics
  putMetric("OrderEventsReceived", 1);
  putMetric(`EventType_${body.eventType}`, 1);

  return {
    statusCode: 200,
    body: JSON.stringify({ status: "accepted" })
  };
}
