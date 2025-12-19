# aws-sd
This repository contains various solutions design implemented in AWS cloud environment

# Preliminaries — tools you need locally

Node.js (16+), npm or yarn

AWS CLI configured with credentials & region

AWS CDK v2 installed (npm install -g aws-cdk)

Python 3.8+ and pip

aws-cdk-lib project will be TypeScript
# 1. CDK Project (TypeScript)
## Create a new CDK app and stack. Steps:
```Shell
mkdir agentic-oms-cdk
cd agentic-oms-cdk
cdk init app --language typescript
npm install aws-cdk-lib constructs @aws-cdk/aws-s3-deployment
# (cdk v2 includes modules in aws-cdk-lib)
```

