"""
Synthetic OMS event & order generator.

Writes:
- Order records to DynamoDB table 'Orders'
- Raw event JSON files to S3 bucket at raw/events/
- Pushes event records to Kinesis stream 'oms-events-stream'

Configure AWS credentials in your environment.
"""

import boto3, json, time, uuid, random
from datetime import datetime, timezone, timedelta
from faker import Faker
import argparse
from decimal import Decimal
import json


fake = Faker()

def float_to_decimal(value):
    if isinstance(value, float):
        # Convert float to string first to avoid precision issues
        return Decimal(str(value))
    return value

def iso_now():
    return datetime.now(timezone.utc).isoformat()

def make_order():
    order_id = f"ORD-{uuid.uuid4().hex[:8].upper()}"
    created_at = iso_now()
    customer_id = f"CUST-{random.randint(1000,9999)}"
    items = []
    for i in range(random.randint(1,4)):
        items.append({
            "sku": f"SKU-{random.randint(100,999)}",
            "qty": random.randint(1,3),
            "price": round(random.uniform(5,200),2)
        })
    total = sum([it['qty'] * it['price'] for it in items])
    status = random.choice(["PLACED","PAYMENT_PENDING","PAYMENT_FAILED","ALLOCATED"])
    order = {
        "orderId": order_id,
        "createdAt": created_at,
        "customerId": customer_id,
        "items": items,
        "totalAmount": total,
        "currency": "AUD",
        "status": status,
        "fulfilmentWarehouse": random.choice(["WH-1","WH-2","WH-3"]),
        "payment": {"status": "AUTHORIZED" if status!="PAYMENT_FAILED" else "DECLINED", "attempts": 1},
        "lastUpdated": created_at
    }
    return order

def main(region, bucket, table, stream, count=100, sleep=0.01):
    s3 = boto3.client('s3', region_name=region)
    dynamo = boto3.resource('dynamodb', region_name=region).Table(table)
    kinesis = boto3.client('kinesis', region_name=region)



    for i in range(count):
        order = make_order()
        dynamo_item = json.loads(json.dumps(order), parse_float=Decimal)

        # Put item in DynamoDB
        dynamo.put_item(Item=dynamo_item)
        # Create an event for the order (simple)
        event = {
            "eventId": str(uuid.uuid4()),
            "eventTime": iso_now(),
            "eventType": "ORDER_CREATED",
            "order": order
        }
        # push to Kinesis
        response = kinesis.put_record(
            StreamName=stream,
            Data=json.dumps(event),
            PartitionKey=order['orderId']
        )
        #print(f"Record put to shard :{ response['ShardId'] } at sequence number: { response['SequenceNumber'] }")
        # write raw event to S3 as newline-delimitebsed json (one file per order)
        key = f"raw/events/{order['orderId']}.json"
        s3.put_object(Bucket=bucket, Key=key, Body=json.dumps(event).encode('utf-8'))
        if (i+1) % 10 == 0:
            print(f"{i+1}/{count} orders generated")
        time.sleep(sleep)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--region', default='us-east-1')
    parser.add_argument('--bucket', required=True)
    parser.add_argument('--table', default='Orders')
    parser.add_argument('--stream', default='oms-events-stream')
    parser.add_argument('--count', type=int, default=200)
    parser.add_argument('--sleep', type=float, default=0.01)
    args = parser.parse_args()
    main(args.region, args.bucket, args.table, args.stream, args.count, args.sleep)
