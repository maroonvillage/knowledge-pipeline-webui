
resource "aws_instance" "app_server" {
  ami           = "ami-0ce45259f491c3d4f"
  instance_type = "t2.micro"
  vpc_security_group_ids = [aws_security_group.sg.id] #This is the key!
  iam_instance_profile = var.ec2_instance_profile_var
  tags = {
    Name = "ExampleAppServerInstance"
  }
}
