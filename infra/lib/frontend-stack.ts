import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import { Construct } from "constructs";

interface FrontendStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  cluster: ecs.Cluster;
  apiInternalUrl: string;
}

export class FrontendStack extends cdk.Stack {
  readonly service: ecs_patterns.ApplicationLoadBalancedFargateService;

  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id, props);

    this.service = new ecs_patterns.ApplicationLoadBalancedFargateService(
      this,
      "FrontendService",
      {
        cluster: props.cluster,
        memoryLimitMiB: 512,
        cpu: 256,
        desiredCount: 1,
        taskImageOptions: {
          image: ecs.ContainerImage.fromAsset("..", {
            file: "frontend/Dockerfile",
          }),
          containerPort: 3000,
          environment: {
            NODE_ENV: "production",
            API_INTERNAL_URL: props.apiInternalUrl,
          },
        },
        publicLoadBalancer: true,
        healthCheck: {
          command: [
            "CMD-SHELL",
            "curl -f http://localhost:3000/ || exit 1",
          ],
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          retries: 3,
          startPeriod: cdk.Duration.seconds(60),
        },
      }
    );
  }
}
