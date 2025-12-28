import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs"; // Use this for TS
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as events from "aws-cdk-lib/aws-events";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as path from 'path';
import * as iam from 'aws-cdk-lib/aws-iam';

export class AgenticOmsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. DynamoDB Table
    const table = new dynamodb.Table(this, "OrderEvents", {
      partitionKey: { name: "orderId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "timestamp", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Only for development
    });

    // 2. Lambda Function (using NodejsFunction to auto-bundle TS)
    const fn = new NodejsFunction(this, "OrderEventHandler", {
      runtime: lambda.Runtime.NODEJS_18_X,
      // Point to your SOURCE .ts file, not the dist folder
      entry: path.join(__dirname, '../services/order-event-processor/handler.ts'),
      handler: "main", 
      environment: {
        // MUST match process.env.ORDER_TABLE_NAME in your handler.ts
        ORDER_TABLE_NAME: table.tableName 
      },
      bundling: {
        // This ensures aws-sdk v2 is bundled since Node 18+ doesn't include it
        externalModules: [], 
      },
    });

    table.grantWriteData(fn);

    // ... after creating 'fn'
fn.addToRolePolicy(new iam.PolicyStatement({
  actions: ['cloudwatch:PutMetricData'],
  resources: ['*'], // CloudWatch PutMetricData doesn't support resource-level permissions
}));

    // 3. API Gateway
    new apigw.LambdaRestApi(this, "OrderEventAPI", {
      handler: fn
    });

    // 4. Event Bus
    new events.EventBus(this, "OrderEventBus");
  }
}