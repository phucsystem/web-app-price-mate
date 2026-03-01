import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import * as rds from "aws-cdk-lib/aws-rds";
import { Construct } from "constructs";

interface ApiStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  cluster: ecs.Cluster;
  database: rds.DatabaseInstance;
  dbSecurityGroup: ec2.SecurityGroup;
}

export class ApiStack extends cdk.Stack {
  readonly service: ecs_patterns.ApplicationLoadBalancedFargateService;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const dbSecret = props.database.secret!;

    this.service = new ecs_patterns.ApplicationLoadBalancedFargateService(
      this,
      "ApiService",
      {
        cluster: props.cluster,
        memoryLimitMiB: 512,
        cpu: 256,
        desiredCount: 1,
        taskImageOptions: {
          image: ecs.ContainerImage.fromAsset("..", {
            file: "src/PriceMate.API/Dockerfile",
          }),
          containerPort: 8080,
          environment: {
            ASPNETCORE_ENVIRONMENT: "Production",
            ASPNETCORE_URLS: "http://+:8080",
          },
          secrets: {
            ConnectionStrings__DefaultConnection:
              ecs.Secret.fromSecretsManager(dbSecret, "host"),
          },
        },
        publicLoadBalancer: true,
        healthCheck: {
          command: [
            "CMD-SHELL",
            "curl -f http://localhost:8080/health || exit 1",
          ],
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          retries: 3,
          startPeriod: cdk.Duration.seconds(60),
        },
      }
    );

    props.dbSecurityGroup.addIngressRule(
      this.service.service.connections.securityGroups[0],
      ec2.Port.tcp(5432),
      "Allow API Fargate to connect to PostgreSQL"
    );
  }
}
