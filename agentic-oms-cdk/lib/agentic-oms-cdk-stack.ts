import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as kinesis from 'aws-cdk-lib/aws-kinesis';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as glue from 'aws-cdk-lib/aws-glue';
import * as path from 'path';

export class AgenticOmsCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 bucket for raw logs, scripts and processed data
    const dataBucket = new s3.Bucket(this, 'AgenticOmsDataBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      encryption: s3.BucketEncryption.S3_MANAGED
    });

    // DynamoDB table for Orders
    const ordersTable = new dynamodb.Table(this, 'OmsOrdersTable', {
      partitionKey: { name: 'orderId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // Kinesis stream for real-time events
    const stream = new kinesis.Stream(this, 'OmsEventsStream', {
      streamName: 'oms-events-stream',
      shardCount: 1,
      retentionPeriod: cdk.Duration.hours(24)
    });

    // IAM role for Glue job
    const glueRole = new iam.Role(this, 'GlueJobRole', {
      assumedBy: new iam.ServicePrincipal('glue.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSGlueServiceRole'),
      ]
    });

    // Allow Glue to read from S3 and write to S3 and access DynamoDB
    dataBucket.grantReadWrite(glueRole);
    ordersTable.grantReadWriteData(glueRole);
    stream.grantRead(glueRole);

    // Create a Glue database
    const glueDb = new glue.CfnDatabase(this, 'OmsGlueDatabase', {
      catalogId: this.account,
      databaseInput: {
        name: 'agentic_oms_db'
      }
    });

    // Upload local scripts (Glue script and generator assets) to S3
    new s3deploy.BucketDeployment(this, 'DeployScripts', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '../src'))],
      destinationBucket: dataBucket,
      memoryLimit: 512
    });

    // Glue job definition (CfnJob). We'll reference the script uploaded to S3 path: assets/glue_job.py
    const glueJob = new glue.CfnJob(this, 'OmsGlueJob', {
      name: 'agentic-oms-glue-etl',
      role: glueRole.roleArn,
      command: {
        name: 'glueetl',
        scriptLocation: `s3://${dataBucket.bucketName}/glue/glue_job.py`,
        pythonVersion: '3'
      },
      defaultArguments: {
        '--TempDir': `s3://${dataBucket.bucketName}/glue/tmp/`,
        '--job-language': 'python',
        '--enable-continuous-cloudwatch-log': 'true'
      },
      maxRetries: 0,
      glueVersion: '3.0',
      maxCapacity: 2
    });

    // Outputs
    new cdk.CfnOutput(this, 'DataBucket', { value: dataBucket.bucketName });
    new cdk.CfnOutput(this, 'OrdersTable', { value: ordersTable.tableName });
    new cdk.CfnOutput(this, 'KinesisStream', { value: stream.streamName });
    new cdk.CfnOutput(this, 'GlueJobName', { value: glueJob.name! });
  }
}
