import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as events from "aws-cdk-lib/aws-events";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

export class AgenticOmsStack extends Stack {
  constructor(scope: cdk.App, id: string) {
    super(scope, id);

    const table = new dynamodb.Table(this, "OrderEvents", {
      partitionKey: { name: "orderId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "timestamp", type: dynamodb.AttributeType.STRING }
    });

    const fn = new lambda.Function(this, "OrderEventHandler", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "handler.main",
      code: lambda.Code.fromAsset("services/order-event-processor"),
      environment: {
        TABLE_NAME: table.tableName
      }
    });

    table.grantWriteData(fn);

    const api = new apigw.LambdaRestApi(this, "OrderEventAPI", {
      handler: fn
    });

    new events.EventBus(this, "OrderEventBus");
  }
}
