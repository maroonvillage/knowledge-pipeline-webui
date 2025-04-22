
resource "aws_instance" "app_server" {
  ami           = "ami-0ce45259f491c3d4f"
  instance_type = "t2.micro"

  tags = {
    Name = "ExampleAppServerInstance"
  }
}
