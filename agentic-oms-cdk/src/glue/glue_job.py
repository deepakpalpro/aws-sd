import sys
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job
from pyspark.sql.functions import explode, col, from_json
from pyspark.sql.types import StructType, StructField, StringType, ArrayType, DoubleType, MapType

args = getResolvedOptions(sys.argv, ['JOB_NAME', 'SOURCE_S3_PATH', 'TARGET_S3_PATH', 'DATABASE_NAME', 'TABLE_NAME'])
sc = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session
job = Job(glueContext)
job.init(args['JOB_NAME'], args)

source_path = args['SOURCE_S3_PATH']
target_path = args['TARGET_S3_PATH']
db_name = args['DATABASE_NAME']
table_name = args['TABLE_NAME']

# Read raw JSON events (each file contains the event JSON)
df = spark.read.json(source_path)

# Assuming structure: event.order is an object
orders_df = df.select(
    col("eventId").alias("eventId"),
    col("eventTime").alias("eventTime"),
    col("eventType").alias("eventType"),
    col("order.orderId").alias("orderId"),
    col("order.customerId").alias("customerId"),
    col("order.createdAt").alias("createdAt"),
    col("order.totalAmount").alias("totalAmount"),
    col("order.currency").alias("currency"),
    col("order.status").alias("status"),
    col("order.fulfilmentWarehouse").alias("fulfilmentWarehouse"),
    col("order.payment").alias("payment"),
    col("order.items").alias("items")
)

# Explode items so each row is order + item
exploded = orders_df.withColumn("item", explode("items")).select(
    "eventId","eventTime","eventType","orderId","customerId","createdAt","totalAmount","currency","status","fulfilmentWarehouse","payment",
    col("item.sku").alias("sku"), col("item.qty").alias("qty"), col("item.price").alias("price")
)

# Convert timestamps if needed (skip for now), write Parquet partitioned by date (createdAt date)
# create a partition column
from pyspark.sql.functions import to_date
exploded = exploded.withColumn("createdDate", to_date("createdAt"))

# Write to target as Parquet partitioned by createdDate
exploded.write.mode("overwrite").partitionBy("createdDate").parquet(target_path)

# Optionally create Glue Catalog table using the dynamic frame
from awsglue.dynamicframe import DynamicFrame
dyf = DynamicFrame.fromDF(exploded, glueContext, "dyf")
glueContext.purge_table(db_name, table_name, options={}) if False else None

# You can also use crawler to crawl target_path, but below shows registering table programmatically may require additional calls.
# For simplicity, just print success
print("Wrote processed Parquet to: {}".format(target_path))

job.commit()
