import { CloudWatch } from "aws-sdk";

const cw = new CloudWatch();

export function putMetric(name: string, value: number) {
  return cw.putMetricData({
    Namespace: "OMS/OrderEvents",
    MetricData: [{
      MetricName: name,
      Value: value,
      Unit: "Count"
    }]
  }).promise();
}
