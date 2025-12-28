#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { AgenticOmsStack } from '../lib/agentic-oms-stack';

const app = new cdk.App();
new AgenticOmsStack(app, 'AgenticOmsStack');
