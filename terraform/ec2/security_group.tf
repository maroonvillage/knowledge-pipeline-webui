resource "aws_security_group" "sg" {
  name        = "pdfdocintel_allow_http_ssh"
  description = "Allow HTTP and SSH traffic"
  vpc_id      = "vpc-00230279b21071217"  # Replace with your VPC ID

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["${var.local_ip}/32"]  #  Make sure to narrow this down!
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["${var.local_ip}/32"] # Make sure to narrow this down!
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["${var.local_ip}/32"] # Make sure to narrow this down!
  }


  ingress {
      from_port   = 3000
      to_port     = 3000
      protocol    = "tcp"
      cidr_blocks = ["${var.local_ip}/32"]  #  Make sure to narrow this down!
    }
  egress {  
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}