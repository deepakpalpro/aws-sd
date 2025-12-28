import { main } from "../handler";
import * as DynamoDB from "aws-sdk/clients/dynamodb";
import { putMetric } from "../metrics";

// Mock the entire DynamoDB DocumentClient
jest.mock("aws-sdk/clients/dynamodb", () => {
  const mDocumentClient = {
    put: jest.fn().mockReturnThis(),
    promise: jest.fn().mockResolvedValue({})
  };
  return { DocumentClient: jest.fn(() => mDocumentClient) };
});

jest.mock("../metrics", () => ({
  putMetric: jest.fn() // Replace the real function with a Jest mock
}));

process.env.ORDER_TABLE_NAME = "TestTable";

test("accepts valid order event", async () => {
  const response = await main({
    body: JSON.stringify({
      orderId: "o1",
      eventType: "ORDER_CREATED",
      timestamp: new Date().toISOString(),
      source: "web",
      payload: {},
      correlationId: "c1"
    })
  });

  expect(response.statusCode).toBe(200);

  // 2. Assert that putMetric was called with specific values
    expect(putMetric).toHaveBeenCalledWith("OrderEventsReceived", 1);
    expect(putMetric).toHaveBeenCalledWith("EventType_ORDER_CREATED", 1);
});
