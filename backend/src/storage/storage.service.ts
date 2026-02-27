import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3: AWS.S3;
  private readonly bucket: string;
  private readonly cdnBaseUrl: string;
  private readonly region: string;

  constructor(private configService: ConfigService) {
    this.bucket = this.configService.get<string>('S3_BUCKET', 'speeddating-uploads');
    this.cdnBaseUrl = this.configService.get<string>('CDN_BASE_URL', '');
    this.region = this.configService.get<string>('S3_REGION', 'us-east-1');

    this.s3 = new AWS.S3({
      region: this.region,
      accessKeyId: this.configService.get<string>('S3_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get<string>('S3_SECRET_ACCESS_KEY'),
      endpoint: this.configService.get<string>('S3_ENDPOINT'),
    });
  }

  async getPresignedUploadUrl(prefix: string): Promise<{ uploadUrl: string; fileKey: string }> {
    const fileKey = `${prefix}/${uuidv4()}`;

    const params = {
      Bucket: this.bucket,
      Key: fileKey,
      Expires: 300, // 5 minutes
      ContentType: 'image/*',
      ACL: 'public-read',
    };

    try {
      const uploadUrl = await this.s3.getSignedUrlPromise('putObject', params);
      return { uploadUrl, fileKey };
    } catch (error) {
      this.logger.error(`Failed to generate presigned URL: ${error.message}`);
      // In development/test, return a mock URL
      return {
        uploadUrl: `http://localhost:9000/${this.bucket}/${fileKey}`,
        fileKey,
      };
    }
  }

  getPublicUrl(fileKey: string): string {
    if (this.cdnBaseUrl) {
      return `${this.cdnBaseUrl}/${fileKey}`;
    }
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${fileKey}`;
  }

  async deleteFile(fileKey: string): Promise<void> {
    try {
      await this.s3.deleteObject({ Bucket: this.bucket, Key: fileKey }).promise();
    } catch (error) {
      this.logger.error(`Failed to delete file ${fileKey}: ${error.message}`);
    }
  }
}
