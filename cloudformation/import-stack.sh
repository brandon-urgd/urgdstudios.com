#!/bin/bash
# CloudFormation Import Command for urgdstudios.com
# This script imports existing S3 bucket and CloudFront distribution into CloudFormation management

set -euo pipefail

STACK_NAME="urgd-urgdstudios-com-prod"
TEMPLATE_FILE="cloudformation/urgd-urgdstudios-com.yaml"
RESOURCES_FILE="cloudformation/resources-to-import.json"
AWS_REGION="us-west-2"

echo "========================================="
echo "CloudFormation Import - urgdstudios.com"
echo "========================================="
echo ""
echo "Stack Name: $STACK_NAME"
echo "Template: $TEMPLATE_FILE"
echo "Resources to import: $RESOURCES_FILE"
echo "Region: $AWS_REGION"
echo ""

# Step 1: Create the import change set
echo "Step 1: Creating import change set..."
aws cloudformation create-change-set \
  --stack-name "$STACK_NAME" \
  --change-set-name "import-urgdstudios-resources" \
  --change-set-type IMPORT \
  --template-body "file://$TEMPLATE_FILE" \
  --resources-to-import "file://$RESOURCES_FILE" \
  --parameters \
    ParameterKey=Environment,ParameterValue=prod \
    ParameterKey=WafWebAclArn,ParameterValue=arn:aws:wafv2:us-east-1:198919428218:global/webacl/urgd-waf/18eff14b-5811-4923-8467-8f01ced5210e \
    ParameterKey=ArtifactBucket,ParameterValue=urgd-applicationdata \
    ParameterKey=IntakeCodeKey,ParameterValue=urgdstudios-com/artifacts/placeholder/urgd-urgdstudios-com-intake-placeholder.zip \
    ParameterKey=CorsAllowedOrigins,ParameterValue=https://urgdstudios.com \
    ParameterKey=AlertsEmail,ParameterValue=alerts@urgd.dev \
  --capabilities CAPABILITY_NAMED_IAM \
  --region "$AWS_REGION"

echo ""
echo "Step 2: Waiting for change set to be created..."
aws cloudformation wait change-set-create-complete \
  --stack-name "$STACK_NAME" \
  --change-set-name "import-urgdstudios-resources" \
  --region "$AWS_REGION"

echo ""
echo "Step 3: Reviewing change set..."
aws cloudformation describe-change-set \
  --stack-name "$STACK_NAME" \
  --change-set-name "import-urgdstudios-resources" \
  --region "$AWS_REGION" \
  --query 'Changes[*].[ResourceChange.Action,ResourceChange.ResourceType,ResourceChange.LogicalResourceId]' \
  --output table

echo ""
echo "========================================="
echo "REVIEW REQUIRED"
echo "========================================="
echo ""
echo "The change set has been created. Review the changes above."
echo ""
echo "To execute the import, run:"
echo ""
echo "  aws cloudformation execute-change-set \\"
echo "    --stack-name $STACK_NAME \\"
echo "    --change-set-name import-urgdstudios-resources \\"
echo "    --region $AWS_REGION"
echo ""
echo "After execution, verify with:"
echo ""
echo "  aws cloudformation detect-stack-drift \\"
echo "    --stack-name $STACK_NAME \\"
echo "    --region $AWS_REGION"
echo ""
