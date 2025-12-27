# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template



AgenticOmsCdkStack.DataBucket = agenticomscdkstack-agenticomsdatabucket54d67687-wjo1zoeinulp
AgenticOmsCdkStack.GlueJobName = agentic-oms-glue-etl
AgenticOmsCdkStack.KinesisStream = oms-events-stream
AgenticOmsCdkStack.OrdersTable = AgenticOmsCdkStack-OmsOrdersTable23F9A331-WDZ3DH09YFQD

python3 -m venv venv
source venv/bin/activate
deactivate

 python3 ./src/generator/generate_orders.py --bucket agenticomscdkstack-agenticomsdatabucket54d67687-wjo1zoeinulp --table AgenticOmsCdkStack-OmsOrdersTable23F9A331-WDZ3DH09YFQD --stream oms-events-stream --count 20

aws glue start-job-run --job-name agentic-oms-glue-etl \
--arguments '--SOURCE_S3_PATH=s3://agenticomscdkstack-agenticomsdatabucket54d67687-wjo1zoeinulp/raw/events/, --TARGET_S3_PATH=s3://agenticomscdkstack-agenticomsdatabucket54d67687-wjo1zoeinulp/processed/orders/, --DATABASE_NAME=agentic_oms_db, --TABLE_NAME=orders_processed'