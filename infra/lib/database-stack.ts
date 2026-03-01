import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import { Construct } from "constructs";

interface DatabaseStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
}

export class DatabaseStack extends cdk.Stack {
  readonly instance: rds.DatabaseInstance;
  readonly securityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    this.securityGroup = new ec2.SecurityGroup(this, "DbSecurityGroup", {
      vpc: props.vpc,
      description: "Allow PostgreSQL access from API",
      allowAllOutbound: false,
    });

    this.instance = new rds.DatabaseInstance(this, "PriceMateDb", {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T4G,
        ec2.InstanceSize.MICRO
      ),
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [this.securityGroup],
      databaseName: "pricemate_au",
      credentials: rds.Credentials.fromGeneratedSecret("pricemate"),
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
      deletionProtection: true,
      backupRetention: cdk.Duration.days(7),
      storageEncrypted: true,
    });
  }
}
