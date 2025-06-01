
# --- 1. Define the IAM Role created by Terraform (ec2_role) ---
resource "aws_iam_role" "ec2_role" {
  name = "${var.prefix}-ec2-role"
    description = "IAM role for EC2 instances to access S3"

  assume_role_policy = jsonencode(
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
})
tags = {
  Terraform = "true"
  Purpose   = "EC2 Instance Role"
}
}

# --- 2. Define the IAM Policy that allows ec2_role to assume monolith_role ---
# This policy will be ATTACHED to ec2_role.
resource "aws_iam_policy" "ec2_can_assume_monolith_policy" {
  name        = "EC2CanAssumeMonolithRolePolicy"
  description = "Allows ec2_role to assume the monolith_role"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole",
        Effect = "Allow",
        Resource = "arn:aws:iam::686255962220:role/pdfdocintel-monolith-role" # ARN of the pre-existing monolith_role
      }
    ]
  })
}

# --- 3. Attach the policy to ec2_role ---
resource "aws_iam_role_policy_attachment" "ec2_assume_monolith_attachment" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.ec2_can_assume_monolith_policy.arn
}


resource "aws_iam_role_policy_attachment" "ec2_policy_attachment_s3" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess"
}

resource "aws_iam_role_policy_attachment" "ec2_policy_attachment_ecr" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::686255962220:policy/pdfdocintel-monolith-ecr"
}

resource "aws_iam_role_policy_attachment" "ec2_policy_attachment_secrets" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/SecretsManagerReadWrite"
}

resource "aws_iam_role_policy_attachment" "ec2_policy_attachment_cloudwatch" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonCloudWatchEvidentlyFullAccess"
}
#This is the IAM instance profile that will be attached to the EC2 instance
#-------------------------------------------------------------------------------
# It must be made available via the output of the module
resource "aws_iam_instance_profile" "ec2_instance_profile" {
  name = "ec2_instance_profile"
  role = aws_iam_role.ec2_role.name
}

# --- 4. Update the Trust Relationship of the PRE-EXISTING monolith_role ---
# You need to reference the pre-existing role.
# Terraform can manage the trust policy of an existing role.

data "aws_iam_role" "monolith_role_existing_data" {
  # Name of your pre-existing role
  name = "pdfdocintel-monolith-role"
}

data "aws_iam_policy_document" "monolith_role_updated_trust_policy" {
  # Combine the existing trust policy statements with the new one
  # This is important to avoid overwriting existing trust relationships.

  # First, get the existing policy statements
  source_policy_documents = [data.aws_iam_role.monolith_role_existing_data.assume_role_policy]

  # Add a new statement allowing ec2_role to assume monolith_role
  statement {
    actions = ["sts:AssumeRole"]
    effect  = "Allow"
    principals {
      type        = "AWS"
      identifiers = [aws_iam_role.ec2_role.arn] # ARN of the role created by Terraform
    }
    # Optional: Add conditions, e.g., if ec2_role is only allowed from a specific account
    # condition {
    #   test     = "StringEquals"
    #   variable = "sts:ExternalId"
    #   values   = ["your_secure_external_id"]
    # }
  }
}

# --- 5. Update the Trust Relationship of the PRE-EXISTING monolith_role ---
# THIS IS THE CORRECT WAY TO UPDATE THE TRUST POLICY OF AN EXISTING ROLE
# You define an aws_iam_role resource block that *refers* to the existing role by name.
# Terraform will then manage the attributes you specify for this existing role.
resource "aws_iam_role" "monolith_role_update_trust" { # Renamed for clarity
  name               = data.aws_iam_role.monolith_role_existing_data.name # Use the name of the existing role
  assume_role_policy = data.aws_iam_policy_document.monolith_role_updated_trust_policy.json

  # IMPORTANT: To prevent Terraform from trying to change other attributes
  # of the existing role (like description, path, tags if they are not defined here
  # and Terraform sees a diff), use a lifecycle block.
  # This is crucial when managing only specific attributes of an existing resource.
  lifecycle {
    ignore_changes = [
      # List attributes of aws_iam_role you are NOT managing here and want to ignore
      description,
      max_session_duration,
      path,
      permissions_boundary,
      tags,
      # Add any other attributes that might be set on the existing role
      # that you don't want Terraform to touch.
      # If you only want to manage `assume_role_policy`, you might even do:
      # all, # And then explicitly manage assume_role_policy, but this is broad.
      # A more targeted approach is to list specific attributes.
    ]
  }
}


data "aws_caller_identity" "current" {}