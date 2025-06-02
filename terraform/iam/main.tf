
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}


# --- 1. Define the NEW IAM Role for the EC2 Instance ---
resource "aws_iam_role" "ec2_app_instance_role" { # New, descriptive local name
  name        = "${var.prefix}-ec2-instance-role"
  description = "IAM role for EC2 instances with permissions for S3, ECR, Secrets, CloudWatch, and potentially to assume monolith_role"

  # Trust policy allowing EC2 service to assume this role
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action    = "sts:AssumeRole",
        Effect    = "Allow",
        Principal = { Service = "ec2.amazonaws.com" }
      }
    ]
  })

  tags = {
    Terraform = "true"
    Name      = "${var.prefix}-ec2-instance-role"
    Purpose   = "Application EC2 Instance Role"
  }
}

# --- 2. Attach Managed and Custom Policies to the new EC2 Role ---

# S3 Access
# Option A: Use AWS Managed Policy (e.g., ReadOnly or ReadWrite - choose least privilege)
resource "aws_iam_role_policy_attachment" "ec2_s3_access" {
  role       = aws_iam_role.ec2_app_instance_role.name
  policy_arn = "arn:aws:iam::686255962220:policy/pdfdocintel-monolith-s3" # Or AmazonS3FullAccess if write is needed.
                                                                 # Best: Create a custom policy for specific bucket(s).
}
# Option B: Custom S3 Policy for Least Privilege (Recommended)
/*
resource "aws_iam_policy" "ec2_s3_custom_policy" {
  name        = "${var.prefix}-EC2S3CustomAccessPolicy"
  description = "Custom S3 access for EC2 instances"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "s3:GetObject",
          "s3:PutObject", // If uploads are done by the EC2 instance itself
          "s3:ListBucket" // If needed
        ],
        Resource = [
          "arn:aws:s3:::your-specific-bucket-name",
          "arn:aws:s3:::your-specific-bucket-name/*"
        ]
      }
    ]
  })
}
resource "aws_iam_role_policy_attachment" "ec2_s3_custom_attachment" {
  role       = aws_iam_role.ec2_app_instance_role.name
  policy_arn = aws_iam_policy.ec2_s3_custom_policy.arn
}
*/

# ECR Access (to pull images)
resource "aws_iam_role_policy_attachment" "ec2_ecr_access" {
  role       = aws_iam_role.ec2_app_instance_role.name
  policy_arn = "arn:aws:iam::686255962220:policy/pdfdocintel-monolith-ecr"
  # This allows pulling images. If the instance needs to push, you'd need more permissions.
}

# Secrets Manager Access
resource "aws_iam_role_policy_attachment" "ec2_secrets_manager_access" {
  role       = aws_iam_role.ec2_app_instance_role.name
  # Choose least privilege. If only reading specific secrets:
  # policy_arn = "arn:aws:iam::aws:policy/SecretsManagerReadWrite" # Broader
  # Better: Create a custom policy granting read access to specific secret ARNs.
  policy_arn = "arn:aws:iam::686255962220:policy/pdfdocintel-monolith-secretsmgr" # Example, refine this
}
/*
# Example Custom Secrets Manager Policy (More Secure)
resource "aws_iam_policy" "ec2_secrets_custom_policy" {
  name        = "${var.prefix}-EC2SecretsCustomReadPolicy"
  description = "Custom Secrets Manager read access for EC2"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = "secretsmanager:GetSecretValue",
        Resource = [
          "arn:aws:secretsmanager:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:secret:your-app-secret-*"
          // Add ARNs of specific secrets needed
        ]
      }
    ]
  })
}
resource "aws_iam_role_policy_attachment" "ec2_secrets_custom_attachment" {
  role       = aws_iam_role.ec2_app_instance_role.name
  policy_arn = aws_iam_policy.ec2_secrets_custom_policy.arn
}
*/

# CloudWatch Logs Access (for Docker's awslogs driver)
resource "aws_iam_policy" "ec2_cloudwatch_logs_policy" {
  name        = "${var.prefix}-EC2CloudWatchLogsPolicy"
  description = "Allows EC2 instance role to write to CloudWatch Logs"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "logs:CreateLogGroup",  # Needed if log group might not exist
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ],
        # Be as specific as possible with the resource ARN
        Resource = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/ecs/${var.prefix}-*:*"
        # Or even more specific:
        # Resource = [
        #  "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/ecs/${var.prefix}-frontend:*",
        #  "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/ecs/${var.prefix}-backend:*"
        # ]
      }
    ]
  })
}
resource "aws_iam_role_policy_attachment" "ec2_cloudwatch_logs_attachment" {
  role       = aws_iam_role.ec2_app_instance_role.name
  policy_arn = aws_iam_policy.ec2_cloudwatch_logs_policy.arn
}

# IAM Permissions (USE WITH EXTREME CAUTION - ideally avoid)
# If absolutely necessary, for example, for iam:PassRole.
# AVOID granting broad iam:* permissions.
/*
resource "aws_iam_policy" "ec2_iam_passrole_policy" {
  name        = "${var.prefix}-EC2PassRolePolicy"
  description = "Allows EC2 to pass specific roles to other AWS services"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = "iam:PassRole",
        Resource = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/role-that-ec2-needs-to-pass"
        # Condition = { ... } # Further restrict if possible
      }
    ]
  })
}
resource "aws_iam_role_policy_attachment" "ec2_iam_passrole_attachment" {
  role       = aws_iam_role.ec2_app_instance_role.name
  policy_arn = aws_iam_policy.ec2_iam_passrole_policy.arn
}
*/


# --- 4. IAM Instance Profile for the NEW EC2 Role ---
resource "aws_iam_instance_profile" "ec2_app_instance_profile" {
  name = aws_iam_role.ec2_app_instance_role.name # Conventionally name profile same as role
  role = aws_iam_role.ec2_app_instance_role.name

  tags = {
    Terraform = "true"
    Name      = "${var.prefix}-ec2-instance-profile"
  }
}

