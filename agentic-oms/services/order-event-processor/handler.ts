import { OrderEvent } from "./schema";
import { putMetric } from "./metrics";
import * as DynamoDB from "aws-sdk/clients/dynamodb";

const db = new DynamoDB.DocumentClient();

const getConfig=() =>({ tableName: process.env.ORDER_TABLE_NAME||'' });

export async function main(event: any) {
  // 1. Log the event so you can see the structure in CloudWatch
  console.log("Full Event:", JSON.stringify(event, null, 2));

  // 2. Defensive parsing
  let body: OrderEvent;
  
  if (typeof event.body === 'string') {
    body = JSON.parse(event.body);
  } else if (typeof event.body === 'object') {
    body = event.body; // Already parsed by a middleware or test
  } else {
    body = event; // The event itself is the data (common in direct console tests)
  }
  
  const {tableName}=getConfig();
  await db.put({
    TableName: tableName,
    Item: body
  }).promise();

  // FIX: Use await so Lambda doesn't exit before metrics are sent
  await Promise.all([
    putMetric("OrderEventsReceived", 1),
    putMetric(`EventType_${body.eventType}`, 1)
  ]);
  

  return {
    statusCode: 200,
    body: JSON.stringify({ status: "accepted" })
  };
}
