import { main } from "../handler";

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
});
