import { OrderEvent } from "./schema";
import { putMetric } from "./metrics";
import * as DynamoDB from "aws-sdk/clients/dynamodb";

const db = new DynamoDB.DocumentClient();

const getConfig=() =>({ tableName: process.env.ORDER_TABLE_NAME||'' });

export async function main(event: any) {
  const body: OrderEvent = JSON.parse(event.body);
  const {tableName}=getConfig();
  await db.put({
    TableName: tableName,
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
