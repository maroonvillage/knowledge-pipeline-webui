data "aws_key_pair" "existing" {
  key_name = var.ssh_key_pair_name  # Replace with the name of your key pair
}

resource "aws_instance" "app_server" {
  ami           = var.ami_id
  instance_type = var.instance_type # Example instance type, adjust as needed
  key_name               = data.aws_key_pair.existing.key_name
  vpc_security_group_ids = [aws_security_group.sg.id] #This is the key!
  iam_instance_profile = var.ec2_instance_profile_var
  # Configure the root block device
  root_block_device {
    volume_size = 50  # Specify the size in GiB (e.g., 50 GB)
    volume_type = "gp3" # General Purpose SSD (gp3 is often recommended for cost/performance)
                        # Other options: "gp2", "io1", "io2", "st1", "sc1", "standard"
    delete_on_termination = true # Ensures the root volume is deleted when the instance is terminated
    # encrypted = true # Optional: to encrypt the root volume
    # kms_key_id = "arn:aws:kms:us-east-1:123456789012:key/your-kms-key-id" # If using a custom KMS key
  }
  tags = {
    Name = "Next9AppServerInstance"
  }
}

resource "aws_cloudwatch_log_group" "backend" {
  name = "/ecs/pdfdocintel-backend-prod"
  retention_in_days = 14
}

resource "aws_cloudwatch_log_group" "frontend" {
  name = "/ecs/pdfdocintel-frontend-prod"
  retention_in_days = 14
}
