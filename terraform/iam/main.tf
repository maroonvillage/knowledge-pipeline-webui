
resource "aws_iam_role" "ec2_role" {
  name = "${var.prefix}-ec2-role"
    description = "IAM role for EC2 instances to access S3"

  assume_role_policy = <<EOF
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
}
EOF
}

resource "aws_iam_role_policy_attachment" "ec2_policy_attachment" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess"
}

#This is the IAM instance profile that will be attached to the EC2 instance
#-------------------------------------------------------------------------------
# It must be made available via the output of the module
resource "aws_iam_instance_profile" "ec2_instance_profile" {
  name = "ec2_instance_profile"
  role = aws_iam_role.ec2_role.name
}

# resource "aws_instance" "ec2_instance" {
#   ami           = "ami-06ca3ca175f37dd66"
#   instance_type = "t2.micro"
  
#   iam_instance_profile = aws_iam_instance_profile.ec2_instance_profile.name

#   tags = {
#     Name = "exampleinstance"
#   }
# }

data "aws_caller_identity" "current" {}