data "aws_key_pair" "existing" {
  key_name = "pdfdocintel_ssh_key_pair"  # Replace with the name of your key pair
}

resource "aws_instance" "app_server" {
  ami           = var.ami_id
  instance_type = var.instance_type # Example instance type, adjust as needed
  key_name               = data.aws_key_pair.existing.key_name
  vpc_security_group_ids = [aws_security_group.sg.id] #This is the key!
  iam_instance_profile = var.ec2_instance_profile_var
  tags = {
    Name = "ExampleAppServerInstance"
  }
}
