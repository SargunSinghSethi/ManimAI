import boto3
import os
from botocore.exceptions import BotoCoreError, NoCredentialsError
from uuid import uuid4

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_BUCKET_NAME = os.getenv("AWS_BUCKET_NAME")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
S3_ENDPOINT_URL = os.getenv("S3_ENDPOINT_URL")  # Optional for MinIO


# Validation
missing_vars = []
if not AWS_ACCESS_KEY_ID:
    missing_vars.append("AWS_ACCESS_KEY_ID")
if not AWS_SECRET_ACCESS_KEY:
    missing_vars.append("AWS_SECRET_ACCESS_KEY")
if not AWS_BUCKET_NAME:
    missing_vars.append("AWS_BUCKET_NAME")
if not AWS_REGION:
    missing_vars.append("AWS_REGION")

if missing_vars:
    raise EnvironmentError(f"Missing required AWS environment variables: {', '.join(missing_vars)}")

def upload_file_to_s3(file_path, object_name=None):
    if not object_name:
        object_name = f"videos/{uuid4()}.mp4"

    s3_config = {
        "region_name": AWS_REGION,
        "aws_access_key_id": AWS_ACCESS_KEY_ID,
        "aws_secret_access_key": AWS_SECRET_ACCESS_KEY
    }

    if S3_ENDPOINT_URL:
        s3_config["endpoint_url"] = S3_ENDPOINT_URL

    s3 = boto3.client("s3", **s3_config)

    try:
        s3.upload_file(file_path, AWS_BUCKET_NAME, object_name, ExtraArgs={"ContentType": "video/mp4"})
        if S3_ENDPOINT_URL:
            s3_url = f"{S3_ENDPOINT_URL}/{AWS_BUCKET_NAME}/{object_name}"
        else:
            s3_url = f"https://{AWS_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{object_name}"

        return {"status": "success", "url": s3_url}
    except (BotoCoreError, NoCredentialsError) as e:
        return {"status": "error", "message": str(e)}



def generate_presigned_url(video_url: str):
    try:
        s3_config = {
        "region_name": AWS_REGION,
        "aws_access_key_id": AWS_ACCESS_KEY_ID,
        "aws_secret_access_key": AWS_SECRET_ACCESS_KEY
        }
        if S3_ENDPOINT_URL:
            s3_config["endpoint_url"] = S3_ENDPOINT_URL
            s3_key = video_url.split(f"{AWS_BUCKET_NAME}/")[1]
        else:
            s3_key = "/".join(video_url.split("/")[3:])

        s3 = boto3.client("s3", **s3_config)

        url = s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': AWS_BUCKET_NAME, 'Key': s3_key},
            ExpiresIn=3600  # URL expires in 1 hour
        )
        return {'url': url}
    except Exception as e:
        print(e)
        return {'error': str(e)}, 500