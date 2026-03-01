import * as cdk from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import { Construct } from "constructs";

interface CdnStackProps extends cdk.StackProps {
  frontendService: ecs_patterns.ApplicationLoadBalancedFargateService;
  apiService: ecs_patterns.ApplicationLoadBalancedFargateService;
}

export class CdnStack extends cdk.Stack {
  readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: CdnStackProps) {
    super(scope, id, props);

    const frontendOrigin = new origins.LoadBalancerV2Origin(
      props.frontendService.loadBalancer,
      { protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY }
    );

    const apiOrigin = new origins.LoadBalancerV2Origin(
      props.apiService.loadBalancer,
      { protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY }
    );

    this.distribution = new cloudfront.Distribution(this, "PriceMateCdn", {
      defaultBehavior: {
        origin: frontendOrigin,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
      },
      additionalBehaviors: {
        "/api/*": {
          origin: apiOrigin,
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        },
        "_next/static/*": {
          origin: frontendOrigin,
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
      },
      comment: "PriceMate AU CloudFront distribution",
    });

    new cdk.CfnOutput(this, "DistributionUrl", {
      value: `https://${this.distribution.distributionDomainName}`,
      description: "CloudFront distribution URL",
    });
  }
}
