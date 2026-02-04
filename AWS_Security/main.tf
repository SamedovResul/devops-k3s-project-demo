# ===========================================
# PROVIDER
# ===========================================
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "eu-central-1"
}

# ===========================================
# VPC
# ===========================================
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "Aws_Task-VPC"
  }
}

# ===========================================
# SUBNETS
# ===========================================
resource "aws_subnet" "public_a" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "eu-central-1a"
  map_public_ip_on_launch = true

  tags = {
    Name = "Public-Subnet-A"
  }
}

resource "aws_subnet" "public_b" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "eu-central-1b"
  map_public_ip_on_launch = true

  tags = {
    Name = "Public-Subnet-B"
  }
}

resource "aws_subnet" "private" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.10.0/24"
  availability_zone = "eu-central-1a"

  tags = {
    Name = "Private-Subnet"
  }
}

# ===========================================
# INTERNET GATEWAY & ROUTING
# ===========================================
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "Aws_Task-IGW"
  }
}

# ===========================================
# NAT GATEWAY (for private subnet internet)
# ===========================================
resource "aws_eip" "nat" {
  domain = "vpc"

  tags = {
    Name = "NAT-EIP"
  }
}

resource "aws_nat_gateway" "nat" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public_a.id

  tags = {
    Name = "Aws_Task-NAT"
  }

  depends_on = [aws_internet_gateway.igw]
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name = "Public-Route-Table"
  }
}

resource "aws_route_table_association" "public_a" {
  subnet_id      = aws_subnet.public_a.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_b" {
  subnet_id      = aws_subnet.public_b.id
  route_table_id = aws_route_table.public.id
}

# Private Route Table (through NAT)
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat.id
  }

  tags = {
    Name = "Private-Route-Table"
  }
}

resource "aws_route_table_association" "private" {
  subnet_id      = aws_subnet.private.id
  route_table_id = aws_route_table.private.id
}

# ===========================================
# SECURITY GROUPS
# ===========================================

# ALB Security Group
resource "aws_security_group" "alb" {
  name        = "alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "ALB-Security-Group"
  }
}

resource "aws_security_group_rule" "alb_inbound_http" {
  type              = "ingress"
  description       = "HTTP from internet - ALB is public entry point"
  from_port         = 80
  to_port           = 80
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.alb.id
}

resource "aws_security_group_rule" "alb_outbound_http" {
  type                     = "egress"
  description              = "HTTP to App only"
  from_port                = 80
  to_port                  = 80
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.app.id
  security_group_id        = aws_security_group.alb.id
}

# App Security Group
resource "aws_security_group" "app" {
  name        = "app-sg"
  description = "Security group for application server"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "App-Security-Group"
  }
}

resource "aws_security_group_rule" "app_inbound_http" {
  type                     = "ingress"
  description              = "HTTP from ALB only"
  from_port                = 80
  to_port                  = 80
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.alb.id
  security_group_id        = aws_security_group.app.id
}

resource "aws_security_group_rule" "app_inbound_ssh" {
  type              = "ingress"
  description       = "SSH from VPC only"
  from_port         = 22
  to_port           = 22
  protocol          = "tcp"
  cidr_blocks       = ["10.0.0.0/16"]
  security_group_id = aws_security_group.app.id
}

resource "aws_security_group_rule" "app_outbound_https" {
  type              = "egress"
  description       = "HTTPS for package updates"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.app.id
}

resource "aws_security_group_rule" "app_outbound_http" {
  type              = "egress"
  description       = "HTTP for package updates"
  from_port         = 80
  to_port           = 80
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.app.id
}

resource "aws_security_group_rule" "app_outbound_dns" {
  type              = "egress"
  description       = "DNS resolution"
  from_port         = 53
  to_port           = 53
  protocol          = "udp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.app.id
}

# ===========================================
# CLOUDWATCH LOG GROUP (defined before IAM policy that references it)
# ===========================================
resource "aws_cloudwatch_log_group" "app_logs" {
  name              = "/app/nginx"
  retention_in_days = 7

  tags = {
    Name = "App-Nginx-Logs"
  }
}

# ===========================================
# IAM ROLE (no static credentials)
# ===========================================
resource "aws_iam_role" "app_role" {
  name        = "app-role"
  description = "Role for EC2 to access SSM and CloudWatch Logs"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })

  tags = {
    Name = "App-IAM-Role"
  }
}

resource "aws_iam_role_policy" "app_policy" {
  name = "app-ssm-cloudwatch-policy"
  role = aws_iam_role.app_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters"
        ]
        Resource = "arn:aws:ssm:eu-central-1:*:parameter/app/*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "${aws_cloudwatch_log_group.app_logs.arn}:*"
      }
    ]
  })
}

resource "aws_iam_instance_profile" "app_profile" {
  name = "app-instance-profile"
  role = aws_iam_role.app_role.name
}

# ===========================================
# SSM PARAMETER (Secrets)
# ===========================================
variable "app_secret" {
  description = "Application secret key"
  type        = string
  sensitive   = true
}

resource "aws_ssm_parameter" "app_secret" {
  name        = "/app/secret_key"
  description = "Application secret key"
  type        = "SecureString"
  value       = var.app_secret

  tags = {
    Name = "App-Secret-Key"
  }
}

# ===========================================
# SSH KEY
# ===========================================
resource "aws_key_pair" "my_key" {
  key_name   = "aws-task-key"
  public_key = file(pathexpand(var.ssh_public_key_path))

  tags = {
    Name = "AWS-Task-Key"
  }
}

# ===========================================
# EC2 INSTANCE (Private Subnet)
# ===========================================
resource "aws_instance" "app" {
  ami                    = "ami-0faab6bdbac9486fb"
  instance_type          = "t3.small"
  subnet_id              = aws_subnet.private.id
  vpc_security_group_ids = [aws_security_group.app.id]
  iam_instance_profile   = aws_iam_instance_profile.app_profile.name
  key_name               = aws_key_pair.my_key.key_name

  user_data = <<-EOF
              #!/bin/bash
              exec > /var/log/user-data.log 2>&1
              set -e
              
              # Wait for network/NAT to be ready
              sleep 30
              
              # Retry apt-get update
              for i in {1..5}; do
                apt-get update -y && break
                sleep 10
              done
              
              # Install Nginx
              apt-get install -y nginx
              echo "<h1>Hello World!</h1>" > /var/www/html/index.html
              systemctl start nginx
              systemctl enable nginx
              
              # Install CloudWatch Agent
              wget -q https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
              dpkg -i amazon-cloudwatch-agent.deb
              
              # Configure CloudWatch Agent
              cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<'CONFIG'
              {
                "logs": {
                  "logs_collected": {
                    "files": {
                      "collect_list": [
                        {
                          "file_path": "/var/log/nginx/access.log",
                          "log_group_name": "/app/nginx",
                          "log_stream_name": "{instance_id}/access"
                        },
                        {
                          "file_path": "/var/log/nginx/error.log",
                          "log_group_name": "/app/nginx",
                          "log_stream_name": "{instance_id}/error"
                        }
                      ]
                    }
                  }
                }
              }
              CONFIG
              
              # Start CloudWatch Agent
              /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
                -a fetch-config \
                -m ec2 \
                -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json \
                -s
              EOF

  tags = {
    Name = "AwsTask-App"
  }
}

# ===========================================
# LOAD BALANCER
# ===========================================
resource "aws_lb" "alb" {
  name               = "AwsTask-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = [aws_subnet.public_a.id, aws_subnet.public_b.id]

  tags = {
    Name = "AwsTask-ALB"
  }
}

resource "aws_lb_target_group" "app_tg" {
  name     = "AwsTask-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    path                = "/"
    healthy_threshold   = 2
    unhealthy_threshold = 10
  }

  tags = {
    Name = "AwsTask-TG"
  }
}

resource "aws_lb_target_group_attachment" "app" {
  target_group_arn = aws_lb_target_group.app_tg.arn
  target_id        = aws_instance.app.id
  port             = 80
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.alb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app_tg.arn
  }
}

# ===========================================
# OUTPUTS
# ===========================================
output "alb_url" {
  description = "URL to access the application"
  value       = "http://${aws_lb.alb.dns_name}"
}

output "instance_private_ip" {
  description = "Private IP of EC2 instance"
  value       = aws_instance.app.private_ip
}

output "cloudwatch_log_group" {
  description = "CloudWatch Log Group for Nginx logs"
  value       = aws_cloudwatch_log_group.app_logs.name
}
